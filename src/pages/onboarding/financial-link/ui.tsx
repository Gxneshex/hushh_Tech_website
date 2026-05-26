/**
 * FinancialLink — UI / Presentation
 * Same design language as step 1-8.
 * Plaid integration restored via logic.ts (usePlaidLinkHook).
 * Continue → opens Plaid Link → fetches data → proceeds to step 1.
 */
import { useNavigate } from "react-router-dom";
import { useFinancialLinkLogic, formatCurrency } from "./logic";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import {
  AppIcon,
  Display,
  Eyebrow,
  Lede,
  SmallSpinner,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingFinancialLink() {
  const navigate = useNavigate();
  const {
    userId,
    isReady,
    /* Plaid state */
    plaidStep,
    institution,
    isDone,
    canProceed,
    isProcessing,
    isButtonDisabled,
    buttonText,
    error,
    /* Data */
    verificationRows,
    allAccounts,
    accountGroups,
    totalBalance,
    identityInfo,
    investmentHoldings,
    /* Actions */
    handleButtonClick,
    handleSkip,
    openPlaidLink,
    retry,
  } = useFinancialLinkLogic();

  /* Loading state */
  if (!isReady || !userId) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-6 text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        <SmallSpinner label="Preparing your secure onboarding" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* Header — back + FAQs */}
      <HushhTechBackHeader
        onBackClick={() => navigate(-1)}
        rightLabel="FAQs"
      />

      {/* Main Content */}
      <main className="mx-auto mt-6 w-full max-w-[520px] flex-grow px-5 pb-48">
        {/* Title Section */}
        <section className="mb-10 pt-6 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="shield" size={58} />
          </div>
          <Eyebrow>Link your account</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[440px]">
            Verify your financial profile.
          </Display>
          <Lede className="text-[16px] md:text-[18px]">
            {isDone && institution
              ? `Connected to ${institution.name}. You can continue to the next step.`
              : "We'll securely check your financial profile before starting KYC verification to ensure compliance."}
          </Lede>
        </section>

        {/* Connected Badge */}
        {isDone && institution && (
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-3 py-1.5 text-[12px] font-medium text-[#1D1D1F] shadow-[inset_0_0_0_1px_rgba(52,199,89,0.22)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              Connected to {institution.name}
            </span>
          </div>
        )}

        {/* ── Accounts Summary (shown after Plaid connects) ── */}
        {allAccounts.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Total Balance
            </h3>
            <div className="mb-4 rounded-[18px] bg-[#F5F5F7] px-5 py-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <p className="mb-1 text-[12px] text-[#1D1D1F]/55">
                All Accounts ({allAccounts.length})
              </p>
              <p className="font-mono text-[28px] font-medium tracking-[-0.028em] text-[#1D1D1F]">
                {formatCurrency(totalBalance)}
              </p>
            </div>

            {/* Account groups */}
            {Object.entries(accountGroups).map(([type, accounts]) => (
              <div key={type} className="mb-4">
                <h4 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                  {type === 'depository' ? 'Checking & Savings' : type === 'credit' ? 'Credit Cards' : type}
                  {' '}({(accounts as any[]).length})
                </h4>
                <div className="overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]">
                  {(accounts as any[]).map((acc: any, i: number) => {
                    const balance = acc.balances?.current ?? acc.balances?.available;
                    const currency = acc.balances?.iso_currency_code || 'USD';
                    return (
                      <div key={acc.account_id || i} className="flex items-center border-b border-[#1D1D1F]/[0.08] px-4 py-3 last:border-b-0">
                        <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7]">
                          <span
                            className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                            style={{ fontVariationSettings: "'wght' 300" }}
                          >
                            account_balance
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[14px] font-medium text-[#1D1D1F]">
                            {acc.name || `account ...${acc.mask}`}
                          </p>
                          <p className="text-[12px] text-[#1D1D1F]/50">
                            {acc.subtype || acc.type} {acc.mask ? `···${acc.mask}` : ''}
                          </p>
                        </div>
                        <p className="ml-2 shrink-0 font-mono text-[14px] font-medium text-[#1D1D1F]">
                          {balance != null ? formatCurrency(balance, currency) : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Identity Data (shown after Plaid connects) ── */}
        {identityInfo && (
          <section className="mb-8">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Bank-Verified Identity
            </h3>
            <div className="overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]">
              {identityInfo.names.length > 0 && (
                <div className="flex items-center gap-3 border-b border-[#1D1D1F]/[0.08] px-4 py-3">
                  <span className="material-symbols-outlined text-lg text-[#1D1D1F]/35" style={{ fontVariationSettings: "'wght' 300" }}>person</span>
                  <div><p className="text-[12px] text-[#1D1D1F]/50">Name</p><p className="text-[14px] font-medium text-[#1D1D1F]">{identityInfo.names.join(', ')}</p></div>
                </div>
              )}
              {identityInfo.emails.length > 0 && (
                <div className="flex items-center gap-3 border-b border-[#1D1D1F]/[0.08] px-4 py-3">
                  <span className="material-symbols-outlined text-lg text-[#1D1D1F]/35" style={{ fontVariationSettings: "'wght' 300" }}>email</span>
                  <div><p className="text-[12px] text-[#1D1D1F]/50">Email</p><p className="text-[14px] font-medium text-[#1D1D1F]">{identityInfo.emails.join(', ')}</p></div>
                </div>
              )}
              {identityInfo.phones.length > 0 && (
                <div className="flex items-center gap-3 border-b border-[#1D1D1F]/[0.08] px-4 py-3">
                  <span className="material-symbols-outlined text-lg text-[#1D1D1F]/35" style={{ fontVariationSettings: "'wght' 300" }}>phone</span>
                  <div><p className="text-[12px] text-[#1D1D1F]/50">Phone</p><p className="text-[14px] font-medium text-[#1D1D1F]">{identityInfo.phones.join(', ')}</p></div>
                </div>
              )}
              {identityInfo.addresses.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="material-symbols-outlined text-lg text-[#1D1D1F]/35" style={{ fontVariationSettings: "'wght' 300" }}>location_on</span>
                  <div><p className="text-[12px] text-[#1D1D1F]/50">Address</p><p className="text-[14px] font-medium text-[#1D1D1F]">{identityInfo.addresses[0]}</p></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Verification Rows (product status) ── */}
        <section className="overflow-hidden rounded-[20px] bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          {verificationRows.map((row) => (
            <div
              key={row.title}
              className="group flex items-center justify-between border-b border-[#1D1D1F]/[0.08] px-4 py-5 last:border-b-0"
            >
              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                  <span
                    className="material-symbols-outlined text-[20px] text-[#1D1D1F]"
                    style={{ fontVariationSettings: "'wght' 200" }}
                  >
                    {row.icon}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium text-[#1D1D1F]">
                    {row.title}
                  </span>
                  <span className={`text-[13px] font-light ${
                    row.status === 'success' ? 'text-[#1D1D1F]/70' : 'text-[#1D1D1F]/45'
                  }`}>
                    {row.status === 'loading' && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 border border-hushh-blue border-t-transparent rounded-full animate-spin inline-block" />
                        {row.subtitle}
                      </span>
                    )}
                    {row.status !== 'loading' && row.subtitle}
                  </span>
                </div>
              </div>
              <span
                className={`material-symbols-outlined text-[20px] ${row.status === 'success' ? 'text-[#34C759]' : 'text-[#1D1D1F]/30'}`}
                style={{ fontVariationSettings: "'wght' 200" }}
              >
                {row.status === 'success' ? 'check_circle' : 'east'}
              </span>
            </div>
          ))}
        </section>

        {/* Error message */}
        {error && plaidStep === 'error' && (
          <div className="mt-4 rounded-[16px] bg-[#FF3B30]/10 p-3 text-center shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            <p className="text-[12px] font-medium text-[#B42318]">{error}</p>
          </div>
        )}

        {/* Trust Badges */}
        <section className="mt-auto flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/55">
              PCI DSS
            </span>
            <span className="text-[10px] uppercase text-[#1D1D1F]/45">
              256 Bit Encryption
            </span>
            <div className="flex items-center gap-2 border-l border-[#1D1D1F]/20 pl-2">
              <div className="flex -space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              </div>
              <span className="text-[10px] font-medium text-[#0066CC]">
                Visa
              </span>
              <span className="text-[10px] font-bold text-teal-600">
                RuPay
              </span>
            </div>
          </div>
        </section>

        {/* CTAs — Connect/Continue & Skip */}
        <section className="pb-12 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
            className={primaryCtaClass}
          >
            {isButtonDisabled && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
            )}
            {buttonText}
          </HushhTechCta>

          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleSkip}
            className={secondaryCtaClass}
          >
            Skip
          </HushhTechCta>
        </section>
      </main>
    </div>
  );
}
