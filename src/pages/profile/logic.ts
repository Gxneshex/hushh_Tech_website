/**
 * Profile Page — Logic / ViewModel
 * Session, onboarding status, NDA check (once, no polling).
 * UI stays in ui.tsx.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../resources/config/config';
import { useAuthSession } from '../../auth/AuthSessionProvider';
import { checkAccessStatus } from '../../services/access/accessControlApi';
import { fetchResolvedOnboardingProgress } from '../../services/onboarding/progress';
import { useInvestorJourneyCta } from '../../hooks/useInvestorJourneyCta';

export function useProfileLogic() {
  const navigate = useNavigate();
  const { session } = useAuthSession();
  const [ndaApproved, setNdaApproved] = useState(false);
  const ndaCheckedRef = useRef(false);

  // CTA is delegated to the shared journey hook so this page no longer
  // re-implements the "where should this user go next" state machine.
  const { primaryCTA } = useInvestorJourneyCta();

  /* onboarding status — read once to feed the page's other UI affordances
     (e.g., shimmer state, completion badges). The CTA itself comes from
     the journey hook above and is no longer derived locally. */
  const [onboardingStatus, setOnboardingStatus] = useState<{
    hasProfile: boolean;
    isCompleted: boolean;
    currentStep: number;
    financialLinkStatus: 'pending' | 'completed' | 'skipped';
    loading: boolean;
  }>({
    hasProfile: false,
    isCompleted: false,
    currentStep: 1,
    financialLinkStatus: 'pending',
    loading: true,
  });

  useEffect(() => {
    if (!session?.user?.id || !config.supabaseClient) {
      setOnboardingStatus((prev) => ({ ...prev, loading: false }));
      return;
    }

    const checkUserStatus = async () => {
      try {
        const { data: profile, error: profileError } =
          await config.supabaseClient!
            .from('investor_profiles')
            .select('id, user_confirmed')
            .eq('user_id', session.user.id)
            .maybeSingle();

        const onboarding = await fetchResolvedOnboardingProgress(
          config.supabaseClient!,
          session.user.id
        );

        setOnboardingStatus({
          hasProfile: !!profile && !profileError,
          isCompleted: onboarding?.is_completed || false,
          currentStep: onboarding?.current_step || 1,
          financialLinkStatus: onboarding?.financial_link_status || 'pending',
          loading: false,
        });
      } catch (error) {
        console.error('Error checking user status:', error);
        setOnboardingStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    checkUserStatus();
  }, [session?.user?.id]);

  /* check NDA status ONCE (no polling) */
  useEffect(() => {
    if (!session?.access_token || ndaCheckedRef.current) return;
    ndaCheckedRef.current = true;

    const checkNda = async () => {
      try {
        const data = await checkAccessStatus(session.access_token);
        if (data === 'Approved') setNdaApproved(true);
      } catch (err: any) {
        /* 401 = expired/invalid token — silently ignore, don't retry */
        if (err?.response?.status === 401) return;
        console.warn('NDA check failed:', err?.message);
      }
    };

    checkNda();
  }, [session?.access_token]);

  const handleDiscoverFundA = () => navigate('/discover-fund-a');

  return {
    session,
    ndaApproved,
    onboardingStatus,
    primaryCTA,
    handleDiscoverFundA,
  };
}
