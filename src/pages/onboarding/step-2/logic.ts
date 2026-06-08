/**
 * Step 2 — Account Type
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import {
  TOTAL_VISIBLE_ONBOARDING_STEPS,
  isCurrentLocalOnboardingPreview,
  withLocalOnboardingPreview,
} from '../../../services/onboarding/flow';
import type { UIAccountType } from '../../../types/onboarding';

export const CURRENT_STEP = 2;
export const TOTAL_STEPS = TOTAL_VISIBLE_ONBOARDING_STEPS;
export const PROGRESS_PCT = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100);

export interface AccountTypeOption {
  value: UIAccountType;
  label: string;
  description: string;
  icon: string;
}

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'One person investing in their own name.',
    icon: 'person',
  },
  {
    value: 'joint',
    label: 'Joint',
    description: 'Two owners investing together. We collect the primary investor first.',
    icon: 'group',
  },
  {
    value: 'retirement',
    label: 'Retirement',
    description: 'Traditional or Roth retirement account. Custodian details may be requested during review.',
    icon: 'account_balance',
  },
  {
    value: 'trust',
    label: 'Trust / Entity',
    description: 'Trust, LLC, corporation, partnership, or managed ownership review.',
    icon: 'shield',
  },
];

export interface Step2Logic {
  selectedAccountType: UIAccountType | null;
  isLoading: boolean;
  setSelectedAccountType: (value: UIAccountType) => void;
  handleContinue: () => Promise<void>;
  handleBack: () => void;
}

const accountStructureFor = (value: UIAccountType) =>
  value === 'individual' ? 'individual' : 'other';

export const useStep2Logic = (): Step2Logic => {
  const navigate = useNavigate();
  const isPreview = isCurrentLocalOnboardingPreview();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<UIAccountType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const load = async () => {
      if (isPreview) {
        setUserId('local-preview');
        setSelectedAccountType(null);
        return;
      }
      if (!config.supabaseClient) return;
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);
      const { data } = await config.supabaseClient
        .from('onboarding_data')
        .select('account_type, account_structure')
        .eq('user_id', user.id)
        .maybeSingle();
      const validTypes: UIAccountType[] = ['individual', 'joint', 'retirement', 'trust'];
      if (data?.account_type && validTypes.includes(data.account_type as UIAccountType)) {
        setSelectedAccountType(data.account_type as UIAccountType);
      } else if (data?.account_structure === 'individual') {
        setSelectedAccountType('individual');
      }
    };
    load();
  }, [isPreview, navigate]);

  const savePreview = () => {
    const saved = window.localStorage.getItem('hushh_onboarding_preview');
    const parsed = saved ? JSON.parse(saved) : {};
    window.localStorage.setItem('hushh_onboarding_preview', JSON.stringify({
      ...parsed,
      account_type: selectedAccountType,
      account_structure: selectedAccountType ? accountStructureFor(selectedAccountType) : null,
    }));
  };

  const handleContinue = async () => {
    if (!selectedAccountType) return;
    if (isPreview) {
      savePreview();
      navigate(withLocalOnboardingPreview('/onboarding/step-3'));
      return;
    }
    if (!userId || !config.supabaseClient) return;
    setIsLoading(true);
    try {
      await upsertOnboardingData(userId, {
        account_type: selectedAccountType,
        account_structure: accountStructureFor(selectedAccountType),
        current_step: 3,
      });
      navigate('/onboarding/step-3');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate(withLocalOnboardingPreview('/onboarding/step-1'));

  return {
    selectedAccountType,
    isLoading,
    setSelectedAccountType,
    handleContinue,
    handleBack,
  };
};
