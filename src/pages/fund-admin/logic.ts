import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import config from '../../resources/config/config';
import { useAuthSession } from '../../auth/AuthSessionProvider';

export type FundReviewDecision = 'verified_investor' | 'rejected';

/**
 * One investor row as returned by the `fund-payment-admin-list` edge function.
 * Keep this in sync with that function's response shape.
 */
export interface FundAdminInvestorRow {
  paymentRequestId: string;
  userId: string;
  requestReference: string | null;
  recipientName: string;
  userEmail: string | null;
  selectedFund: string | null;
  commitmentLabel: string;
  firstPaymentLabel: string;
  classAUnits: number;
  classBUnits: number;
  classCUnits: number;
  recurringSummary: string | null;
  plaidStatus: string | null;
  kycStatus: string | null;
  riskFlags: string[];
  status: string;
  paidAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
}

interface AdminListResponse {
  success: boolean;
  pending?: FundAdminInvestorRow[];
  recentlyReviewed?: FundAdminInvestorRow[];
  error?: string;
}

interface AdminVerifyResponse {
  success?: boolean;
  investor_verification_status?: string;
  already_reviewed?: boolean;
  message?: string;
  error?: string;
}

const functionUrl = (name: string) => `${config.SUPABASE_URL}/functions/v1/${name}`;

export function useFundAdminLogic() {
  const { user, session, status } = useAuthSession();
  const [searchParams] = useSearchParams();
  const highlightRef = searchParams.get('ref');

  const accessToken = session?.access_token ?? null;

  const [pending, setPending] = useState<FundAdminInvestorRow[]>([]);
  const [reviewed, setReviewed] = useState<FundAdminInvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(functionUrl('fund-payment-admin-list'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });
      const data: AdminListResponse = await res
        .json()
        .catch(() => ({ success: false, error: 'Invalid response from server' }));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      }
      setPending(data.pending ?? []);
      setReviewed(data.recentlyReviewed ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investors');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchList();
    }
  }, [status, fetchList]);

  const setNote = useCallback((id: string, note: string) => {
    setNotesById((prev) => ({ ...prev, [id]: note }));
  }, []);

  const act = useCallback(
    async (row: FundAdminInvestorRow, decision: FundReviewDecision) => {
      if (actioningId) return; // never run two writes at once
      const notes = (notesById[row.paymentRequestId] || '').trim();
      if (decision === 'rejected' && !notes) {
        setActionError('A note is required to reject an investor (compliance trail).');
        return;
      }
      if (!accessToken) {
        setActionError('Your session expired. Please sign in again.');
        return;
      }
      setActioningId(row.paymentRequestId);
      setActionError(null);
      setBanner(null);
      try {
        const res = await fetch(functionUrl('fund-payment-admin-verify'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            paymentRequestId: row.paymentRequestId,
            decision,
            notes: notes || null,
          }),
        });
        const data: AdminVerifyResponse = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Action failed (HTTP ${res.status})`);
        }
        // If a teammate already decided this one, surface the server's note.
        setBanner(
          data.already_reviewed && data.message
            ? data.message
            : `${row.recipientName} ${
                decision === 'verified_investor'
                  ? 'approved as a verified investor'
                  : 'marked as rejected'
              }.`,
        );
        await fetchList();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setActioningId(null);
      }
    },
    [accessToken, actioningId, notesById, fetchList],
  );

  const approve = useCallback(
    (row: FundAdminInvestorRow) => act(row, 'verified_investor'),
    [act],
  );
  const reject = useCallback(
    (row: FundAdminInvestorRow) => act(row, 'rejected'),
    [act],
  );

  const reviewerEmail = useMemo(() => user?.email ?? null, [user]);

  return {
    reviewerEmail,
    highlightRef,
    pending,
    reviewed,
    loading,
    error,
    notesById,
    setNote,
    approve,
    reject,
    actioningId,
    actionError,
    banner,
    refresh: fetchList,
  };
}
