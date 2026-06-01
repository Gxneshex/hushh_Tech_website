import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import config from '../../resources/config/config';
import { useAuthSession } from '../../auth/AuthSessionProvider';

export type InvestorStage =
  | 'verified'
  | 'rejected'
  | 'awaiting_review'
  | 'meet_ceo'
  | 'onboarding'
  | 'nda_signed'
  | 'lead';

export interface FundFunnelMoney {
  committed: string;
  approved: string;
  collected: string;
}

export interface FundFunnel {
  ndaSigned: number;
  meetCeoDone: number;
  firstPaymentPaid: number;
  pendingReview: number;
  verified: number;
  rejected: number;
  totalInvestors: number;
  money: FundFunnelMoney;
}

/**
 * One investor row from `fund-payment-admin-overview`. Every person who entered
 * the funnel (NDA OR onboarding OR payment) appears here, deduped by user with
 * their furthest-reached `stage`.
 */
export interface FundInvestorRow {
  userId: string;
  recipientName: string;
  userEmail: string | null;
  stage: InvestorStage;
  requestReference: string | null;
  selectedFund: string | null;
  commitmentLabel: string | null;
  status: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  ndaSignedAt: string | null;
  meetCeoDone: boolean;
  currentStep: number | null;
  riskFlags: string[];
}

interface OverviewResponse {
  success: boolean;
  funnel?: FundFunnel;
  investors?: FundInvestorRow[];
  error?: string;
}

export type FundAdminTab = 'awaiting_review' | 'verified' | 'in_progress' | 'rejected' | 'all';

// "In progress" = entered the funnel but not yet paid/decided.
const IN_PROGRESS_STAGES: InvestorStage[] = ['meet_ceo', 'onboarding', 'nda_signed', 'lead'];

const functionUrl = (name: string) => `${config.SUPABASE_URL}/functions/v1/${name}`;

export function useFundAdminOverview() {
  const { user, session, status } = useAuthSession();
  const [searchParams] = useSearchParams();
  const highlightRef = searchParams.get('ref');

  const accessToken = session?.access_token ?? null;

  const [funnel, setFunnel] = useState<FundFunnel | null>(null);
  const [investors, setInvestors] = useState<FundInvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FundAdminTab>('awaiting_review');
  const [search, setSearch] = useState('');

  const fetchOverview = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(functionUrl('fund-payment-admin-overview'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });
      const data: OverviewResponse = await res
        .json()
        .catch(() => ({ success: false, error: 'Invalid response from server' }));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      }
      setFunnel(data.funnel ?? null);
      setInvestors(data.investors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investors');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchOverview();
    }
  }, [status, fetchOverview]);

  // Tab counts (computed once over the full list).
  const counts = useMemo(() => {
    const c: Record<FundAdminTab, number> = {
      awaiting_review: 0,
      verified: 0,
      in_progress: 0,
      rejected: 0,
      all: investors.length,
    };
    for (const inv of investors) {
      if (inv.stage === 'awaiting_review') c.awaiting_review += 1;
      else if (inv.stage === 'verified') c.verified += 1;
      else if (inv.stage === 'rejected') c.rejected += 1;
      else c.in_progress += 1;
    }
    return c;
  }, [investors]);

  // Active tab + free-text search (name / email / reference).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return investors.filter((inv) => {
      if (tab === 'awaiting_review' && inv.stage !== 'awaiting_review') return false;
      if (tab === 'verified' && inv.stage !== 'verified') return false;
      if (tab === 'rejected' && inv.stage !== 'rejected') return false;
      if (tab === 'in_progress' && !IN_PROGRESS_STAGES.includes(inv.stage)) return false;
      if (q) {
        const hay = `${inv.recipientName} ${inv.userEmail ?? ''} ${inv.requestReference ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [investors, tab, search]);

  const reviewerEmail = useMemo(() => user?.email ?? null, [user]);

  return {
    reviewerEmail,
    highlightRef,
    funnel,
    investors,
    loading,
    error,
    tab,
    setTab,
    search,
    setSearch,
    counts,
    filtered,
    refresh: fetchOverview,
  };
}
