/**
 * FinancialLink — All Business Logic
 * Pre-onboarding financial verification via Plaid.
 * Uses usePlaidLinkHook for the full Plaid Link flow.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import { usePlaidLinkHook } from '../../../services/plaid/usePlaidLink';
import {
  createSandboxTestItem,
  formatCurrency,
  getPlaidSyncStatus,
  startPlaidDataSync,
  unlinkPlaidAccount,
  type PlaidDataProduct,
  type PlaidProductSyncStatus,
  type PlaidProductSyncStatusValue,
} from '../../../services/plaid/plaidService';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import {
  FINANCIAL_LINK_ROUTE,
  getFinancialLinkContinuationRoute,
  isFinancialLinkReviewMode,
  resolveFinancialLinkStatus,
} from '../../../services/onboarding/flow';
import { fetchOnboardingProgress } from '../../../services/onboarding/progress';
import {
  getInvestorAccessState,
  getResumeRouteForState,
} from '../../../services/investorAccess/state';
import {
  beginPlaidSession,
  installGlobalPlaidErrorListener,
  logPlaidEvent,
} from '../../../services/plaid/plaidDiagnostics';

export { formatCurrency };

type ProductSyncUiStatus = 'success' | 'loading' | 'pending' | 'unavailable' | 'error';
type ProductSyncBackfillState = 'idle' | 'starting' | 'started' | 'needs_relink' | 'error';

const CORE_SYNC_PRODUCTS: PlaidDataProduct[] = ['accounts', 'balance', 'auth'];
const LOCAL_SANDBOX_INSTITUTION_ID = 'ins_109508';

const isLocalPlaidHost = () => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
};

const shouldUsePlaidSandboxDirectConnect = () => {
  const forcedMode = import.meta.env?.VITE_PLAID_LINK_MODE;
  if (forcedMode === 'link') return false;
  if (forcedMode === 'sandbox-direct') return true;

  return isLocalPlaidHost()
    && import.meta.env?.VITE_PLAID_ENV === 'sandbox'
    && import.meta.env?.VITE_PLAID_DISABLE_LOCAL_SANDBOX_DIRECT !== 'true';
};

const shouldBlockLocalPlaidLink = () => {
  const forcedMode = import.meta.env?.VITE_PLAID_LINK_MODE;
  if (forcedMode === 'link' || forcedMode === 'sandbox-direct') return false;

  return isLocalPlaidHost()
    && import.meta.env?.VITE_PLAID_ENV !== 'sandbox'
    && import.meta.env?.VITE_ALLOW_LOCAL_PLAID_LINK !== 'true';
};

const PRODUCT_SYNC_DISPLAY: Array<{
  product: PlaidDataProduct;
  title: string;
  icon: string;
}> = [
  { product: 'accounts', title: 'Accounts', icon: 'account_balance' },
  { product: 'balance', title: 'Balance', icon: 'account_balance_wallet' },
  { product: 'auth', title: 'Bank verification', icon: 'verified_user' },
  { product: 'identity', title: 'Identity', icon: 'badge' },
  { product: 'identity_match', title: 'Identity match', icon: 'how_to_reg' },
  { product: 'transactions', title: 'Transactions', icon: 'receipt_long' },
  { product: 'assets', title: 'Assets report', icon: 'inventory' },
  { product: 'investments', title: 'Investments', icon: 'monitoring' },
  { product: 'investment_transactions', title: 'Investment activity', icon: 'timeline' },
  { product: 'liabilities', title: 'Liabilities', icon: 'credit_card' },
  { product: 'statements', title: 'Statements', icon: 'description' },
  { product: 'income', title: 'Income', icon: 'payments' },
  { product: 'signal', title: 'ACH risk', icon: 'health_and_safety' },
];

const PRODUCT_SYNC_STATUS_TO_UI: Record<PlaidProductSyncStatusValue, ProductSyncUiStatus> = {
  complete: 'success',
  partial: 'success',
  syncing: 'loading',
  pending: 'pending',
  unsupported: 'unavailable',
  access_required: 'unavailable',
  failed: 'error',
};

const getProductStatusSubtitle = (
  product: PlaidDataProduct,
  status?: PlaidProductSyncStatus
) => {
  if (!status) return 'Queued';

  if (status.status === 'syncing') return 'Syncing in background';
  if (status.status === 'pending') {
    if (product === 'assets') return 'Generating report';
    if (product === 'identity_match') return 'Waiting for legal details';
    return 'Queued';
  }
  if (status.status === 'unsupported') return 'Not supported by this bank';
  if (status.status === 'access_required') return 'Needs additional consent';
  if (status.status === 'failed') return 'Will retry later';
  if (status.status === 'partial') return 'Partially ready';
  if (!status.available) return 'No records found';

  return status.records_count != null
    ? `${status.records_count} records ready`
    : 'Ready';
};

const isMissingCoreSyncStatus = (statuses: PlaidProductSyncStatus[]) => {
  if (statuses.length === 0) return true;
  const products = new Set(statuses.map((status) => status.product));
  return CORE_SYNC_PRODUCTS.some((product) => !products.has(product));
};

const getMissingProductFallback = (
  backfillState: ProductSyncBackfillState,
  hasPlaidItem: boolean,
  isDatabaseRestoreComplete: boolean
): { status: ProductSyncUiStatus; subtitle: string } => {
  if (backfillState === 'needs_relink' || (!hasPlaidItem && isDatabaseRestoreComplete)) {
    return { status: 'unavailable', subtitle: 'Reconnect bank' };
  }
  if (backfillState === 'error') {
    return { status: 'error', subtitle: 'Will retry later' };
  }
  if (backfillState === 'started') {
    return { status: 'loading', subtitle: 'Syncing in background' };
  }
  return { status: 'loading', subtitle: 'Starting background sync' };
};

export const useFinancialLinkLogic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(1);
  const [resumeRoute, setResumeRoute] = useState<string>(getFinancialLinkContinuationRoute(1));
  const [isChangeBankConfirmOpen, setIsChangeBankConfirmOpen] = useState(false);
  const [isChangingBank, setIsChangingBank] = useState(false);
  const [isSandboxConnecting, setIsSandboxConnecting] = useState(false);
  const [changeBankError, setChangeBankError] = useState<string | null>(null);
  const [isSkipConfirmOpen, setIsSkipConfirmOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);
  const [productSyncStatuses, setProductSyncStatuses] = useState<PlaidProductSyncStatus[]>([]);
  const [productSyncBackfillState, setProductSyncBackfillState] =
    useState<ProductSyncBackfillState>('idle');
  const hasInitialized = useRef(false);
  const syncBackfillAttemptedRef = useRef<string | null>(null);
  const isReviewMode = useMemo(
    () => isFinancialLinkReviewMode(location.search),
    [location.search]
  );
  const useSandboxDirectConnect = useMemo(shouldUsePlaidSandboxDirectConnect, []);
  const blockLocalPlaidLink = useMemo(shouldBlockLocalPlaidLink, []);

  /* Scroll to top */
  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* Plaid Link diagnostics — fire a fresh session id on every financial-link
     mount so each user attempt clusters together in the
     plaid_link_diagnostics table. The global window error listener is
     idempotent and captures Plaid CDN findScriptTag failures even when
     they bubble outside our React tree. */
  useEffect(() => {
    installGlobalPlaidErrorListener();
    const sessionId = beginPlaidSession();
    logPlaidEvent('financial_link_mount', {
      pageState: {
        sessionId,
        isReviewMode,
        useSandboxDirectConnect,
        blockLocalPlaidLink,
      },
    });
    return () => {
      logPlaidEvent('financial_link_unmount', {
        pageState: { sessionId, isReviewMode },
      });
    };
  }, [isReviewMode, useSandboxDirectConnect, blockLocalPlaidLink]);

  /* P0.F — Cross-tab BroadcastChannel listener. If another tab unlinks the
     Plaid bank, this tab forces a Plaid state reset so the UI does not show
     stale "Connected" data. */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel('hushh:plaid-state');
    } catch {
      return;
    }
    const handle = (event: MessageEvent) => {
      const payload = event.data as { type?: string; userId?: string } | null;
      if (!payload || payload.type !== 'unlinked') return;
      if (payload.userId && userId && payload.userId !== userId) return;
      console.log('[FinancialLink] Cross-tab unlink received, refreshing state');
      try {
        sessionStorage.removeItem('plaid_link_state');
      } catch {
        // ignore
      }
      plaid.retry();
    };
    channel.addEventListener('message', handle);
    return () => {
      channel.removeEventListener('message', handle);
      channel.close();
    };
  }, [plaid, userId]);

  /* Get authenticated user — runs only once */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const getUser = async () => {
      if (!config.supabaseClient) { navigate('/login'); return; }
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) {
        const redirectTarget = `${FINANCIAL_LINK_ROUTE}${isReviewMode ? '?mode=review' : ''}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, {
          replace: true,
        });
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || undefined);

      try {
        const onboardingProgress = await fetchOnboardingProgress(
          config.supabaseClient,
          user.id
        );
        const { data: financialData, error: fetchError } = await config.supabaseClient
          .from('user_financial_data').select('status').eq('user_id', user.id).maybeSingle();
        if (fetchError) console.warn('[FinancialLink] Supabase query error (ignoring):', fetchError.message);
        const effectiveStatus = resolveFinancialLinkStatus(
          onboardingProgress?.financial_link_status,
          financialData?.status
        );

        if (
          effectiveStatus === 'completed' &&
          onboardingProgress?.financial_link_status !== 'completed'
        ) {
          void upsertOnboardingData(user.id, { financial_link_status: 'completed' });
        }

        // Status-aware resume routing: if the user already paid (or beyond),
        // skip past financial-link entirely and land them on the right
        // post-payment surface. Falls back to the legacy continuation route
        // when no payment state is set yet.
        //
        // CRITICAL guards that suppress this redirect:
        // 1. `?mode=review`: user explicitly came to manage their bank.
        // 2. `?oauth_state_id=...`: Plaid is mid-OAuth-resume — Plaid drops
        //    our `mode=review` param when it redirects back from the bank,
        //    so we must detect the resume independently.
        // If we redirect during either case, React unmounts the page before
        // Plaid Link can finish its OAuth resume, the SDK fails its
        // findScriptTag() lookup, the console logs
        //   "Failed to find script" from cdn.plaid.com/link/v2/stable/...
        // and the user sees Plaid's "Something went wrong" modal.
        const isPlaidOAuthResume = new URLSearchParams(location.search).has('oauth_state_id');
        const suppressResumeRedirect = isReviewMode || isPlaidOAuthResume;
        if (suppressResumeRedirect) {
          logPlaidEvent('financial_link_redirect_suppressed', {
            userId: user.id,
            pageState: {
              isReviewMode,
              isPlaidOAuthResume,
              isCompleted: Boolean(onboardingProgress?.is_completed),
              accessStatePreCompute: getInvestorAccessState(onboardingProgress),
            },
          });
        }

        const accessState = getInvestorAccessState(onboardingProgress);
        if (
          !suppressResumeRedirect &&
          (accessState === 'verified_investor' ||
            accessState === 'payment_in_review' ||
            accessState === 'rejected_investor')
        ) {
          logPlaidEvent('financial_link_resume_redirect', {
            userId: user.id,
            pageState: {
              accessState,
              isPlaidOAuthResume,
              isReviewMode,
              currentStep: onboardingProgress?.current_step,
            },
          });
          navigate(
            getResumeRouteForState(accessState, onboardingProgress?.current_step),
            { replace: true },
          );
          return;
        }

        if (onboardingProgress?.is_completed && !suppressResumeRedirect) {
          logPlaidEvent('financial_link_completed_redirect', {
            userId: user.id,
            pageState: {
              isPlaidOAuthResume,
              isReviewMode,
              currentStep: onboardingProgress?.current_step,
            },
          });
          navigate(
            getResumeRouteForState(accessState, onboardingProgress?.current_step),
            { replace: true },
          );
          return;
        }

        const nextRoute = getFinancialLinkContinuationRoute(
          onboardingProgress?.current_step || 1
        );
        setCurrentOnboardingStep(onboardingProgress?.current_step || 1);
        setResumeRoute(nextRoute);

        if (effectiveStatus !== 'pending' && !suppressResumeRedirect) {
          navigate(nextRoute, { replace: true });
          return;
        }
      } catch (err) {
        console.warn('[FinancialLink] Error checking financial data (ignoring):', err);
      }

      setIsReady(true);
    };

    getUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Plaid hook — the real integration ─── */
  const plaid = usePlaidLinkHook(userId, userEmail, {
    skipAutoInit: useSandboxDirectConnect || blockLocalPlaidLink,
  });

  /* ─── Extract all accounts from balance data ─── */
  const allAccounts = useMemo(() => {
    return plaid.financialData?.balance?.data?.accounts || [];
  }, [plaid.financialData]);

  /* ─── Group accounts by type ─── */
  const accountGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const acc of allAccounts) {
      const key = acc.type || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(acc);
    }
    return groups;
  }, [allAccounts]);

  /* ─── Total balance ─── */
  const totalBalance = useMemo(() => {
    return allAccounts.reduce((sum: number, acc: any) => {
      const bal = acc.balances?.current ?? acc.balances?.available ?? 0;
      return sum + bal;
    }, 0);
  }, [allAccounts]);

  /* ─── Identity data ─── */
  const identityInfo = useMemo(() => {
    const id = plaid.financialData?.identity?.data;
    if (!id) return null;
    const accounts = id.accounts || [];
    if (accounts.length === 0) return null;
    const owners = accounts[0]?.owners || [];
    if (owners.length === 0) return null;
    const owner = owners[0];
    const rawEmails = (owner.emails || []).map((e: any) => e.data).filter(Boolean);
    const uniqueEmails = [...new Set(rawEmails.map((e: string) => e.toLowerCase()))];
    const rawPhones = (owner.phone_numbers || []).map((p: any) => p.data).filter(Boolean);
    const uniquePhones = [...new Set(rawPhones)];
    return {
      names: owner.names || [],
      emails: uniqueEmails,
      phones: uniquePhones,
      addresses: (owner.addresses || []).map((a: any) => {
        const d = a.data || {};
        return [d.street, d.city, d.region, d.postal_code, d.country].filter(Boolean).join(', ');
      }),
    };
  }, [plaid.financialData]);

  /* ─── Investment holdings ─── */
  const investmentHoldings = useMemo(() => {
    return plaid.financialData?.investments?.data?.holdings || [];
  }, [plaid.financialData]);

  const investmentAccounts = useMemo(() => {
    return plaid.financialData?.investments?.data?.accounts || [];
  }, [plaid.financialData]);

  /* ─── UI state derived from Plaid ─── */
  const isProcessing = ['creating_token', 'exchanging', 'fetching'].includes(plaid.step);
  const isInitializing =
    !useSandboxDirectConnect && (plaid.step === 'idle' || plaid.step === 'creating_token');
  const isDone = plaid.step === 'done';
  const canProceed = isDone && plaid.canProceed;
  const localPlaidNotice = blockLocalPlaidLink
    ? 'Plaid bank connection is paused on localhost for this production Plaid setup. Use the secure test URL, or switch local Plaid to sandbox mode for clean testing.'
    : null;

  useEffect(() => {
    if (!userId || !isDone) {
      setProductSyncStatuses([]);
      setProductSyncBackfillState('idle');
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const maybeStartBackfill = async (statuses: PlaidProductSyncStatus[]) => {
      if (!isMissingCoreSyncStatus(statuses)) {
        if (!cancelled) setProductSyncBackfillState('idle');
        return;
      }

      if (!plaid.isDatabaseRestoreComplete) {
        if (!cancelled) setProductSyncBackfillState('starting');
        return;
      }

      if (!plaid.plaidItemId) {
        if (!cancelled) setProductSyncBackfillState('needs_relink');
        return;
      }

      const attemptKey = `${userId}:${plaid.plaidItemId}`;
      if (syncBackfillAttemptedRef.current === attemptKey) {
        return;
      }
      syncBackfillAttemptedRef.current = attemptKey;

      if (!cancelled) setProductSyncBackfillState('starting');
      try {
        console.log('[Plaid] Starting missing product sync backfill', {
          itemId: plaid.plaidItemId,
          statusRows: statuses.length,
        });
        await startPlaidDataSync(userId, plaid.plaidItemId);
        if (cancelled) return;

        setProductSyncBackfillState('started');
        const refreshedStatuses = await getPlaidSyncStatus(userId);
        if (!cancelled) setProductSyncStatuses(refreshedStatuses);
        await plaid.refreshFromDatabase();
      } catch (err) {
        console.warn('[Plaid] Product sync backfill failed:', err);
        if (!cancelled) setProductSyncBackfillState('error');
      }
    };

    const loadStatuses = async () => {
      const statuses = await getPlaidSyncStatus(userId);
      if (cancelled) return;
      setProductSyncStatuses(statuses);
      void maybeStartBackfill(statuses);
    };

    void loadStatuses();
    intervalId = setInterval(loadStatuses, 5000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDone, userId, plaid.plaidItemId, plaid.isDatabaseRestoreComplete, plaid.refreshFromDatabase]);

  const buttonText = useMemo(() => {
    if (isSandboxConnecting) return 'Connecting Sandbox Bank...';
    if (blockLocalPlaidLink && !isDone) return 'Use secure test URL';
    if (useSandboxDirectConnect && (plaid.step === 'error' || (isDone && !plaid.canProceed))) return 'Try Again';
    if (useSandboxDirectConnect && !isDone) return 'Connect Sandbox Bank';
    if (plaid.step === 'idle' || plaid.step === 'creating_token') return 'Preparing...';
    if (plaid.step === 'linking') return 'Connecting...';
    if (plaid.step === 'exchanging') return 'Securing Connection...';
    if (plaid.step === 'fetching') return 'Fetching Financial Data...';
    if (isDone && canProceed) return 'Continue to KYC';
    if (plaid.step === 'error' || (isDone && !plaid.canProceed)) return 'Try Again';
    if (useSandboxDirectConnect) return 'Connect Sandbox Bank';
    return 'Connect Bank Account';
  }, [
    canProceed,
    isDone,
    isSandboxConnecting,
    blockLocalPlaidLink,
    plaid.canProceed,
    plaid.step,
    useSandboxDirectConnect,
  ]);

  const showPrimaryButtonSpinner = isInitializing || isProcessing || isSandboxConnecting;
  const isButtonDisabled = showPrimaryButtonSpinner || Boolean(localPlaidNotice && !isDone);

  /* ─── Verification row statuses ─── */
  const verificationRows = useMemo(() => {
    const balanceStatus = plaid.balanceStatus;
    const assetsStatus = plaid.assetsStatus;
    const investmentsStatus = plaid.investmentsStatus;
    const hasIdentity = !!identityInfo;

    return [
      {
        icon: 'account_balance_wallet',
        title: 'Assets',
        subtitle: balanceStatus === 'success'
          ? `${allAccounts.length} Accounts · ${formatCurrency(totalBalance)}`
          : balanceStatus === 'loading' ? 'Fetching...' : 'Not Available',
        status: balanceStatus,
      },
      {
        icon: 'monitoring',
        title: 'Investments',
        subtitle: investmentsStatus === 'success'
          ? investmentHoldings.length > 0
            ? `${investmentHoldings.length} Holdings`
            : investmentAccounts.length > 0
              ? `${investmentAccounts.length} Linked Accounts · No holdings`
              : 'No Investment Holdings'
          : investmentsStatus === 'loading' ? 'Fetching...' : 'No Investment Holdings',
        status: investmentsStatus,
      },
      {
        icon: 'badge',
        title: 'Identity',
        subtitle: hasIdentity
          ? `✓ Verified — ${identityInfo!.names[0] || ''}`
          : plaid.step === 'done' ? 'Not Available' : 'Not Available',
        status: hasIdentity ? 'success' as const : 'idle' as const,
      },
    ];
  }, [plaid, allAccounts, totalBalance, identityInfo, investmentAccounts, investmentHoldings]);

  const productSyncRows = useMemo(() => {
    if (!isDone && productSyncStatuses.length === 0) return [];

    const statusByProduct = new Map<PlaidDataProduct, PlaidProductSyncStatus>();
    for (const status of productSyncStatuses) {
      statusByProduct.set(status.product, status);
    }

    return PRODUCT_SYNC_DISPLAY.map((productMeta) => {
      const status = statusByProduct.get(productMeta.product);
      if (!status) {
        const fallback = getMissingProductFallback(
          productSyncBackfillState,
          Boolean(plaid.plaidItemId),
          plaid.isDatabaseRestoreComplete
        );
        return {
          ...productMeta,
          status: fallback.status,
          subtitle: fallback.subtitle,
        };
      }
      const statusValue = status?.status || 'pending';
      return {
        ...productMeta,
        status: PRODUCT_SYNC_STATUS_TO_UI[statusValue],
        subtitle: getProductStatusSubtitle(productMeta.product, status),
      };
    });
  }, [
    isDone,
    plaid.isDatabaseRestoreComplete,
    plaid.plaidItemId,
    productSyncBackfillState,
    productSyncStatuses,
  ]);

  const handleBack = useCallback(() => {
    navigate(resumeRoute || getFinancialLinkContinuationRoute(currentOnboardingStep), {
      replace: true,
    });
  }, [currentOnboardingStep, navigate, resumeRoute]);

  /* ─── Main button handler — Plaid flow ─── */
  const handleButtonClick = useCallback(async () => {
    if (isDone && canProceed) {
      await upsertOnboardingData(userId, {
        current_step: currentOnboardingStep,
        financial_link_status: 'completed',
      });
      navigate(resumeRoute, { replace: true });
      return;
    }
    if (blockLocalPlaidLink) {
      return;
    }
    if (useSandboxDirectConnect) {
      setIsSandboxConnecting(true);
      setChangeBankError(null);
      try {
        const sandboxItem = await createSandboxTestItem(userId, LOCAL_SANDBOX_INSTITUTION_ID);
        await startPlaidDataSync(userId, sandboxItem.item_id);
        const dbState = await plaid.refreshFromDatabase();

        if (!dbState?.canProceed) {
          throw new Error('Sandbox bank connected, but verification data is still syncing. Please try again.');
        }
      } catch (err) {
        const message = err instanceof Error
          ? err.message
          : 'Sandbox bank connection failed';
        setChangeBankError(message);
      } finally {
        setIsSandboxConnecting(false);
      }
      return;
    }
    if (plaid.step === 'error' || (isDone && !plaid.canProceed)) {
      plaid.retry();
      return;
    }
    if (plaid.isReady) {
      plaid.openPlaidLink();
    }
  }, [
    canProceed,
    currentOnboardingStep,
    isDone,
    navigate,
    plaid,
    resumeRoute,
    blockLocalPlaidLink,
    useSandboxDirectConnect,
    userId,
  ]);

  /* Skip — show confirm modal first, so accidental clicks do not lock the
   * user into the manual-review-only path. */
  const openSkipConfirm = useCallback(() => {
    setSkipError(null);
    setIsSkipConfirmOpen(true);
  }, []);

  const closeSkipConfirm = useCallback(() => {
    if (isSkipping) return;
    setIsSkipConfirmOpen(false);
    setSkipError(null);
  }, [isSkipping]);

  const handleConfirmSkip = useCallback(async () => {
    if (!userId) return;
    setIsSkipping(true);
    setSkipError(null);
    try {
      console.log('[FinancialLink] User skipped financial verification');
      await upsertOnboardingData(userId, {
        current_step: currentOnboardingStep,
        financial_link_status: 'skipped',
      });
      setIsSkipConfirmOpen(false);
      navigate(resumeRoute, { replace: true });
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : 'Failed to skip financial verification');
    } finally {
      setIsSkipping(false);
    }
  }, [currentOnboardingStep, navigate, resumeRoute, userId]);

  const closeChangeBankConfirm = useCallback(() => {
    if (isChangingBank) return;
    setIsChangeBankConfirmOpen(false);
    setChangeBankError(null);
  }, [isChangingBank]);

  const openChangeBankConfirm = useCallback(() => {
    setChangeBankError(null);
    setIsChangeBankConfirmOpen(true);
  }, []);

  const handleConfirmChangeBank = useCallback(async () => {
    if (!userId) return;

    setIsChangingBank(true);
    setChangeBankError(null);
    try {
      await unlinkPlaidAccount(userId);
      try {
        sessionStorage.removeItem('plaid_link_state');
      } catch {
        // sessionStorage may be unavailable in private browsing contexts.
      }
      setIsChangeBankConfirmOpen(false);
      await upsertOnboardingData(userId, {
        current_step: currentOnboardingStep,
        financial_link_status: 'pending',
      });
      // P0.F — Broadcast unlink to other tabs so stale UI corrects itself
      // without waiting for the next focus / poll.
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('hushh:plaid-state');
          channel.postMessage({ type: 'unlinked', userId, at: Date.now() });
          channel.close();
        }
      } catch {
        // BroadcastChannel may be unavailable (older browsers, embedded webviews).
      }
      plaid.retry();
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to change linked bank';
      setChangeBankError(message);
    } finally {
      setIsChangingBank(false);
    }
  }, [currentOnboardingStep, plaid, userId]);

  return {
    userId,
    userEmail,
    isReady,
    isReviewMode,
    /* Plaid state */
    plaidStep: plaid.step,
    institution: plaid.institution,
    isDone,
    canProceed,
    isProcessing,
    isButtonDisabled,
    showPrimaryButtonSpinner,
    buttonText,
    error: plaid.error,
    localPlaidNotice,
    /* Data */
    verificationRows,
    allAccounts,
    accountGroups,
    totalBalance,
    identityInfo,
    investmentHoldings,
    investmentAccounts,
    productSyncRows,
    /* Actions */
    handleBack,
    handleButtonClick,
    openSkipConfirm,
    closeSkipConfirm,
    handleConfirmSkip,
    openChangeBankConfirm,
    closeChangeBankConfirm,
    handleConfirmChangeBank,
    openPlaidLink: plaid.openPlaidLink,
    retry: plaid.retry,
    /* Change bank state */
    isChangeBankConfirmOpen,
    isChangingBank,
    changeBankError,
    /* Skip state */
    isSkipConfirmOpen,
    isSkipping,
    skipError,
  };
};
