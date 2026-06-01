import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import config from '../../resources/config/config';
import { useAuthSession } from '../../auth/AuthSessionProvider';

export type InvestorStage =
  | 'manual_approved'
  | 'manual_rejected'
  | 'awaiting_manual_review'
  | 'payment_started'
  | 'onboarding_complete'
  | 'bank_linked'
  | 'in_onboarding'
  | 'nda_signed'
  | 'lead';

export interface FundFunnelMoney {
  committed: string;
  approved: string;
  collected: string;
}

export interface FundFunnel {
  ndaSigned: number;
  bankLinked: number;
  financialDataReady: number;
  financialDataPartial: number;
  onboardingComplete: number;
  paymentLinkSent: number;
  meetCeoDone: number;
  firstPaymentPaid: number;
  pendingReview: number;
  verified: number;
  rejected: number;
  needsAttention: number;
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
  paymentRequestStatus: string | null;
  manualReviewStatus: string | null;
  manualInvestorStatus: string | null;
  paidAt: string | null;
  firstPaymentPaid: boolean;
  verifiedAt: string | null;
  rejectedAt: string | null;
  ndaSignedAt: string | null;
  ndaSigned: boolean;
  meetCeoDone: boolean;
  currentStep: number | null;
  onboardingComplete: boolean;
  financialLinkStatus: string | null;
  bankLinked: boolean;
  institutionName: string | null;
  financialDataStatus: string;
  plaidProductCount: number;
  plaidAccountCount: number;
  kycStatus: string | null;
  riskFlags: string[];
  missingPieces: string[];
  dataSources: string[];
}

interface OverviewResponse {
  success: boolean;
  funnel?: FundFunnel;
  investors?: FundInvestorRow[];
  sourceWarnings?: SourceWarning[];
  error?: string;
}

export interface SourceWarning {
  source: string;
  code?: string | null;
  message: string;
}

export type FundAdminTab =
  | 'needs_attention'
  | 'completed_onboarding'
  | 'bank_linked'
  | 'payment_review'
  | 'manually_approved'
  | 'all';

const functionUrl = (name: string) => `${config.SUPABASE_URL}/functions/v1/${name}`;

export function useFundAdminOverview() {
  const { user, session, status } = useAuthSession();
  const [searchParams] = useSearchParams();
  const highlightRef = searchParams.get('ref');

  const accessToken = session?.access_token ?? null;

  const [funnel, setFunnel] = useState<FundFunnel | null>(null);
  const [investors, setInvestors] = useState<FundInvestorRow[]>([]);
  const [sourceWarnings, setSourceWarnings] = useState<SourceWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FundAdminTab>('needs_attention');
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
      setSourceWarnings(data.sourceWarnings ?? []);
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
      needs_attention: 0,
      completed_onboarding: 0,
      bank_linked: 0,
      payment_review: 0,
      manually_approved: 0,
      all: investors.length,
    };
    for (const inv of investors) {
      if (inv.missingPieces.length > 0) c.needs_attention += 1;
      if (inv.onboardingComplete) c.completed_onboarding += 1;
      if (inv.bankLinked) c.bank_linked += 1;
      if (inv.paymentRequestStatus || inv.firstPaymentPaid || inv.manualReviewStatus) c.payment_review += 1;
      if (inv.manualInvestorStatus === 'verified_investor') c.manually_approved += 1;
    }
    return c;
  }, [investors]);

  // Active tab + free-text search (name / email / reference / institution).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return investors.filter((inv) => {
      if (tab === 'needs_attention' && inv.missingPieces.length === 0) return false;
      if (tab === 'completed_onboarding' && !inv.onboardingComplete) return false;
      if (tab === 'bank_linked' && !inv.bankLinked) return false;
      if (tab === 'payment_review' && !(inv.paymentRequestStatus || inv.firstPaymentPaid || inv.manualReviewStatus)) return false;
      if (tab === 'manually_approved' && inv.manualInvestorStatus !== 'verified_investor') return false;
      if (q) {
        const hay = [
          inv.recipientName,
          inv.userEmail,
          inv.requestReference,
          inv.institutionName,
          inv.financialDataStatus,
          inv.kycStatus,
          ...inv.dataSources,
          ...inv.missingPieces,
        ].filter(Boolean).join(' ').toLowerCase();
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
    sourceWarnings,
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
