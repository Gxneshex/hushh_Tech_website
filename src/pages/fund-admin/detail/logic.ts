import { useCallback, useEffect, useMemo, useState } from 'react';
import config from '../../../resources/config/config';
import { useAuthSession } from '../../../auth/AuthSessionProvider';

export type FundReviewDecision = 'verified_investor' | 'rejected';

export interface PlaidAccountSummary {
  name: string;
  type: string | null;
  subtype: string | null;
  mask: string | null;
  balance: string | null;
}

export interface PlaidProductSync {
  product: string;
  status: string;
  available: boolean;
  records: number | null;
}

export interface InvestorReview {
  status: string;
  notes: string | null;
  reviewedAt: string | null;
  reviewerEmail: string | null;
  flags: string[];
}

export interface InvestorDetail {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dobMasked: string | null;
  ssnProvided: boolean;
  accountType: string | null;
  currentStep: number | null;
  onboardingComplete: boolean;
  verificationStatus: string | null;
  timeline: {
    ndaSignedAt: string | null;
    ndaVersion: string | null;
    ndaPdfUrl: string | null;
    meetCeo: { paid: boolean; calendlyBooked: boolean; meetingStartTime: string | null } | null;
    firstPaidAt: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
  };
  investment: {
    paymentRequestId: string;
    requestReference: string | null;
    status: string;
    selectedFund: string | null;
    commitment: string;
    firstPayment: string;
    units: { a: number; b: number; c: number };
    recurring: string | null;
    riskFlags: string[];
    reviewerNote: string | null;
  } | null;
  plaid: {
    institution: string | null;
    syncStatus: string | null;
    accounts: PlaidAccountSummary[];
    products: PlaidProductSync[];
  };
  kyc: {
    status: string | null;
    riskBand: string | null;
    riskScore: number | null;
    provider: string | null;
    verifiedAt: string | null;
  } | null;
  reviews: InvestorReview[];
}

interface DetailResponse {
  success: boolean;
  investor?: InvestorDetail;
  error?: string;
}

interface VerifyResponse {
  success?: boolean;
  investor_verification_status?: string;
  already_reviewed?: boolean;
  message?: string;
  error?: string;
}

const functionUrl = (name: string) => `${config.SUPABASE_URL}/functions/v1/${name}`;

export function useFundAdminDetail(userId: string | undefined) {
  const { session, status } = useAuthSession();
  const accessToken = session?.access_token ?? null;

  const [investor, setInvestor] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!accessToken || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(functionUrl('fund-payment-admin-detail'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data: DetailResponse = await res
        .json()
        .catch(() => ({ success: false, error: 'Invalid response from server' }));
      if (!res.ok || !data.success || !data.investor) {
        throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      }
      setInvestor(data.investor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor');
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchDetail();
    }
  }, [status, fetchDetail]);

  const act = useCallback(
    async (decision: FundReviewDecision) => {
      if (actioning) return; // never run two writes at once
      const paymentRequestId = investor?.investment?.paymentRequestId;
      if (!paymentRequestId) {
        setActionError('No payment request to review for this investor yet.');
        return;
      }
      const trimmed = note.trim();
      if (decision === 'rejected' && !trimmed) {
        setActionError('A note is required to reject an investor (compliance trail).');
        return;
      }
      if (!accessToken) {
        setActionError('Your session expired. Please sign in again.');
        return;
      }
      setActioning(true);
      setActionError(null);
      setBanner(null);
      try {
        const res = await fetch(functionUrl('fund-payment-admin-verify'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ paymentRequestId, decision, notes: trimmed || null }),
        });
        const data: VerifyResponse = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Action failed (HTTP ${res.status})`);
        }
        setBanner(
          data.already_reviewed && data.message
            ? data.message
            : `${investor?.name ?? 'Investor'} ${
                decision === 'verified_investor'
                  ? 'approved as a verified investor'
                  : 'marked as rejected'
              }.`,
        );
        setNote('');
        await fetchDetail();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setActioning(false);
      }
    },
    [accessToken, actioning, investor, note, fetchDetail],
  );

  const canReview = useMemo(
    () => investor?.investment?.status === 'pending_manual_verification' && Boolean(investor?.timeline.firstPaidAt),
    [investor],
  );

  return {
    investor,
    loading,
    error,
    note,
    setNote,
    actioning,
    actionError,
    banner,
    canReview,
    approve: () => act('verified_investor'),
    reject: () => act('rejected'),
    refresh: fetchDetail,
  };
}
