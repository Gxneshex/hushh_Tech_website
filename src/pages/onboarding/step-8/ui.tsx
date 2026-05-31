import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  LineChart,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import config from '../../../resources/config/config';
import HushhTechBackHeader from '../../../components/hushh-tech-back-header/HushhTechBackHeader';
import OnboardingBankReviewChip from '../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip';
import HushhTechCta, {
  HushhTechCtaVariant,
} from '../../../components/hushh-tech-cta/HushhTechCta';
import { getOnboardingDisplayMeta } from '../../../services/onboarding/flow';
import {
  AppleLineIcon,
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from '../../../components/hushh-tech-ui/HushhAppleUI';

interface ReviewSummary {
  legal_first_name: string | null;
  legal_last_name: string | null;
  phone_number: string | null;
  phone_country_code: string | null;
  citizenship_country: string | null;
  residence_country: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  address_country: string | null;
  class_a_units: number | null;
  class_b_units: number | null;
  class_c_units: number | null;
  initial_investment_amount: number | null;
  recurring_amount: number | null;
  recurring_frequency: string | null;
  recurring_day_of_month: number | null;
}

const DISPLAY_META = getOnboardingDisplayMeta('/onboarding/step-8');
const PROGRESS_PCT = Math.round((DISPLAY_META.displayStep / DISPLAY_META.totalSteps) * 100);
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRecurringSummary = (data: ReviewSummary) => {
  if (!data.recurring_amount) return 'No recurring investment configured';
  const frequency = (data.recurring_frequency || 'once_a_month').replace(/_/g, ' ');
  const day = data.recurring_day_of_month === 31 ? 'Last day' : `Day ${data.recurring_day_of_month || 1}`;
  return `${formatCurrency(data.recurring_amount)} • ${frequency} • ${day}`;
};

const joinParts = (parts: Array<string | null | undefined>, fallback = 'Not provided') => {
  const value = parts.map((part) => (part || '').trim()).filter(Boolean).join(', ');
  return value || fallback;
};

const SummaryRow = ({
  icon,
  label,
  value,
  editLabel,
  onEdit,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  editLabel: string;
  onEdit: () => void;
}) => (
  <div className="rounded-[20px] bg-white p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] sm:rounded-[22px]">
    <div className="flex items-start gap-4">
      <AppleLineIcon icon={icon} size={42} />
      <div className="flex-1 min-w-0">
        <span className="mb-1 block text-[14px] font-medium text-[#1D1D1F]">{label}</span>
        <span className="text-[13px] font-normal leading-relaxed text-[#1D1D1F]/60">{value}</span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[12px] font-medium text-[#0066CC] transition hover:bg-[#ECECF0]"
      >
        {editLabel}
      </button>
    </div>
  </div>
);

export default function OnboardingReviewStep() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.classList.add('onboarding-page-scroll');
    document.body.classList.add('onboarding-page-scroll');

    return () => {
      document.documentElement.classList.remove('onboarding-page-scroll');
      document.body.classList.remove('onboarding-page-scroll');
    };
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      if (!config.supabaseClient) {
        setError('Configuration error');
        setLoading(false);
        return;
      }

      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data, error: fetchError } = await config.supabaseClient
        .from('onboarding_data')
        .select(`
          legal_first_name, legal_last_name,
          phone_number, phone_country_code,
          citizenship_country, residence_country,
          address_line_1, address_line_2, city, state, zip_code, address_country,
          class_a_units, class_b_units, class_c_units,
          initial_investment_amount,
          recurring_amount, recurring_frequency, recurring_day_of_month
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load your onboarding summary');
        setLoading(false);
        return;
      }

      setSummary((data || null) as ReviewSummary | null);
      setLoading(false);
    };

    loadSummary();
  }, [navigate]);

  const fullName = joinParts([
    summary?.legal_first_name,
    summary?.legal_last_name,
  ]);

  const phone = joinParts([
    summary?.phone_country_code,
    summary?.phone_number,
  ]);

  const residence = joinParts([
    summary?.residence_country,
    summary?.citizenship_country ? `Citizen of ${summary.citizenship_country}` : null,
  ]);

  const address = joinParts([
    summary?.address_line_1,
    summary?.address_line_2,
    summary?.city,
    summary?.state,
    summary?.zip_code,
    summary?.address_country,
  ]);

  const shareUnits = [
    summary?.class_a_units ? `${summary.class_a_units} Class A` : null,
    summary?.class_b_units ? `${summary.class_b_units} Class B` : null,
    summary?.class_c_units ? `${summary.class_c_units} Class C` : null,
  ].filter(Boolean).join(' • ') || 'No share units selected';

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={() => navigate('/onboarding/step-7')} rightLabel="FAQs" />
      <OnboardingBankReviewChip />

      <main className="mx-auto w-full max-w-[680px] flex-grow px-4 pb-48 sm:px-5">
        <div className="pb-6 pt-5">
          <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            <span>Step {DISPLAY_META.displayStep}/{DISPLAY_META.totalSteps}</span>
            <span>{PROGRESS_PCT}% Complete</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1D1D1F]/10">
            <div className="h-full rounded-full bg-[#0066CC] transition-all duration-500" style={{ width: `${PROGRESS_PCT}%` }} />
          </div>
        </div>

        <section className="pb-8 pt-8 text-center">
          <Eyebrow>Review</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Confirm your details.
          </Display>
          <Lede className="max-w-[500px]">
            We already filled what we could. Review the details once and continue to bank details.
          </Lede>
        </section>

        {loading && (
          <div className="grid animate-pulse gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-20 rounded-[20px] bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            <AppleLineIcon icon={ShieldCheck} size={40} className="text-[#FF3B30]" />
            <p className="text-[14px] font-medium text-[#B42318]">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mb-8 rounded-[24px] bg-[#F5F5F7] p-3 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:p-4">
              <div className="py-4">
                <h3 className="px-1 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">KYC Summary</h3>
              </div>
              <div className="grid gap-3">

              <SummaryRow
                icon={UserRound}
                label="Legal Name"
                value={fullName}
                editLabel="Edit"
                onEdit={() => navigate('/onboarding/step-5')}
              />
              <SummaryRow
                icon={Phone}
                label="Phone Number"
                value={phone}
                editLabel="Edit"
                onEdit={() => navigate('/onboarding/step-4')}
              />
              <SummaryRow
                icon={MapPin}
                label="Citizenship & Residence"
                value={residence}
                editLabel="Edit"
                onEdit={() => navigate('/onboarding/step-3')}
              />
              <SummaryRow
                icon={Home}
                label="Address"
                value={address}
                editLabel="Edit"
                onEdit={() => navigate('/onboarding/step-6')}
              />
              <SummaryRow
                icon={LineChart}
                label="Investment"
                value={`${formatCurrency(summary?.initial_investment_amount)} • ${shareUnits} • ${formatRecurringSummary(summary || {} as ReviewSummary)}`}
                editLabel="Edit"
                onEdit={() => navigate('/onboarding/step-7')}
              />
              </div>
            </section>

            <section className="pb-12 space-y-3">
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={() => navigate('/onboarding/step-9')}
                className={primaryCtaClass}
              >
                Continue to Bank Details
              </HushhTechCta>
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={() => navigate('/onboarding/step-7')}
                className={secondaryCtaClass}
              >
                Back to Investment Summary
              </HushhTechCta>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
