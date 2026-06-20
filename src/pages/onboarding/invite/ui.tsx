/**
 * Public invitee page (route /onboarding/invite/:token, outside ProtectedRoute).
 * An invited party (joint owner, custodian, trustee, …) completes their OWN KYC as
 * sub-steps. Joint owners do full KYC parity with the primary and connect their own
 * bank. Never shows the primary investor's PII beyond a display name.
 */
import HushhTechBackHeader from '../../../components/hushh-tech-back-header/HushhTechBackHeader';
import HushhTechCta, {
  HushhTechCtaVariant,
} from '../../../components/hushh-tech-cta/HushhTechCta';
import {
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from '../../../components/hushh-tech-ui/HushhAppleUI';
import { RequiredAsterisk, OptionalMarker } from '../../../components/onboarding-field-marker/FieldMarkers';
import ConsentCheckbox from '../../../components/consent/ConsentCheckbox';
import { getAllCountries } from '../../../data/locationData';
import type { PartyFieldDef } from '../../../services/onboarding/partyRequirements';
import { useInviteLogic } from './logic';

const COUNTRIES = getAllCountries();

const shell = 'flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased';
const panelClass =
  'rounded-[28px] bg-white p-5 shadow-[0_18px_48px_rgba(29,29,31,0.06),inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:p-6';
const fieldClass =
  'min-h-[74px] rounded-[18px] bg-[#F5F5F7] px-4 py-3.5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]';
const labelClass =
  'mb-1 block text-[11px] font-medium uppercase tracking-[1.3px] text-[#1D1D1F]/55';
const inputClass =
  'w-full border-none bg-transparent p-0 text-[16px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/42 focus:ring-0';
const selectClass =
  'w-full cursor-pointer appearance-none border-none bg-transparent p-0 pr-7 text-[16px] font-medium text-[#1D1D1F] outline-none';
const primaryCtaClass =
  '!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none';

function Centered({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className={shell} style={{ fontFamily: appleFont }}>
      <HushhTechBackHeader rightLabel="FAQs" />
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-5 text-center">
        <span className="material-symbols-outlined mb-4 text-[44px] text-[#0066CC]">{icon}</span>
        <Display as="h1" size="xs" maxWidth="max-w-[460px]">
          {title}
        </Display>
        <Lede className="max-w-[440px]">{body}</Lede>
      </main>
    </div>
  );
}

const maskTaxId = (value: string): string => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? `•••-••-${digits.slice(-4)}` : '';
};

const countryName = (iso: string): string =>
  COUNTRIES.find((c) => c.isoCode === iso)?.name || iso;

function InviteField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: {
  field: PartyFieldDef;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const marker = field.required ? <RequiredAsterisk /> : <OptionalMarker />;
  return (
    <label className={fieldClass}>
      <span className={labelClass}>
        {field.label}
        {marker}
      </span>
      {field.type === 'country' ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={selectClass}
            aria-label={field.label}
          >
            <option value="" disabled>
              Select
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-[#1D1D1F]/30">
            expand_more
          </span>
        </div>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
          inputMode={field.type === 'ssn' ? 'numeric' : undefined}
          autoComplete={field.type === 'ssn' ? 'off' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={inputClass}
          placeholder={field.type === 'ssn' ? 'XXX-XX-XXXX' : field.label}
        />
      )}
      {error && <span className="mt-1 block text-[11px] font-medium text-[#FF3B30]">{error}</span>}
    </label>
  );
}

export default function OnboardingInvitePage() {
  const v = useInviteLogic();

  if (v.oauthResuming) {
    return (
      <Centered
        icon="account_balance"
        title="Completing your bank connection…"
        body="One moment while we securely finish linking your account."
      />
    );
  }
  if (v.screen === 'loading') {
    return <Centered icon="hourglass_empty" title="Loading your invite…" body="One moment." />;
  }
  if (v.screen === 'expired') {
    return (
      <Centered
        icon="link_off"
        title="This invite has expired"
        body="Please ask the primary investor to resend you a fresh secure link."
      />
    );
  }
  if (v.screen === 'revoked') {
    return (
      <Centered
        icon="block"
        title="This invite is no longer active"
        body="The primary investor revoked this link. Contact them if you think this is a mistake."
      />
    );
  }
  if (v.screen === 'completed' || v.screen === 'done') {
    return (
      <Centered
        icon="check_circle"
        title="Your section is complete"
        body="Thank you. The primary investor has been notified and can continue their application."
      />
    );
  }
  if (v.screen === 'error' || !v.data || !v.currentStep) {
    return (
      <Centered
        icon="error"
        title="We couldn't open this invite"
        body={v.error || 'The link may be invalid. Please ask for a new secure link.'}
      />
    );
  }

  const d = v.data;
  const step = v.currentStep;
  const isLast = v.stepIndex === v.steps.length - 1;

  return (
    <div className={shell} style={{ fontFamily: appleFont }}>
      <HushhTechBackHeader rightLabel="FAQs" />
      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-32 sm:px-5">
        <section className="pb-4 pt-8 text-center">
          <Eyebrow>{d.role_label}</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[520px]">
            Complete your section
          </Display>
          <Lede className="max-w-[480px]">
            {d.primary_name} invited you to complete the {d.role_label.toLowerCase()} details for
            their Hushh Fund A application.
          </Lede>
        </section>

        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
          Step {v.stepIndex + 1} of {v.steps.length} · {step.title}
        </p>

        {v.error && (
          <div className="mb-5 rounded-[18px] bg-[#FF3B30]/10 px-4 py-3 text-[13px] font-medium text-[#B42318] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            {v.error}
          </div>
        )}

        {step.kind === 'fields' && (
          <section className={panelClass}>
            <div className="grid gap-3">
              {(step.fields ?? []).map((f) => (
                <InviteField
                  key={f.key}
                  field={f}
                  value={v.profile[f.key] ?? ''}
                  error={v.showErrors ? v.fieldErrorFor(f) || (v.currentStepMissing.includes(f.key) ? 'This field is required' : null) : v.fieldErrorFor(f)}
                  onChange={(val) => v.setField(f.key, val)}
                  onBlur={v.handleSaveDraft}
                />
              ))}
            </div>
          </section>
        )}

        {step.kind === 'bank' && (
          <section className={panelClass}>
            <div className="mb-4">
              <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Connect your bank
              </h3>
              <p className="mt-1 text-[13px] font-normal leading-[1.45] text-[#1D1D1F]/50">
                Securely connect the bank account you'll invest from. We use Plaid — your
                credentials are never shared with Hushh.
              </p>
            </div>
            {v.bankConnected ? (
              <div className="flex items-start gap-3 rounded-[18px] bg-[#34C759]/[0.08] px-4 py-3 shadow-[inset_0_0_0_0.5px_rgba(52,199,89,0.25)]">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#34C759]">
                  check_circle
                </span>
                <p className="text-[13px] font-medium text-[#1D1D1F]/70">Bank connected.</p>
              </div>
            ) : (
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={v.connectBank}
                disabled={v.bankBusy}
                className={primaryCtaClass}
              >
                {v.bankBusy ? 'Connecting…' : 'Connect bank with Plaid'}
              </HushhTechCta>
            )}
            {v.bankError && (
              <p className="mt-3 text-[12px] font-medium text-[#FF3B30]">{v.bankError}</p>
            )}
          </section>
        )}

        {step.kind === 'review' && (
          <section className={panelClass}>
            <div className="mb-4">
              <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Review &amp; submit
              </h3>
            </div>
            <div className="grid gap-2">
              {d.fields
                .filter((f) => !f.sensitive)
                .map((f) => {
                  const raw = v.profile[f.key] ?? '';
                  if (!raw) return null;
                  return (
                    <div key={f.key} className="flex items-center justify-between gap-3 py-1">
                      <span className="text-[12px] font-medium uppercase tracking-[0.8px] text-[#1D1D1F]/45">
                        {f.label}
                      </span>
                      <span className="text-[14px] font-medium text-[#1D1D1F]">
                        {f.type === 'country' ? countryName(raw) : raw}
                      </span>
                    </div>
                  );
                })}
              {d.fields.some((f) => f.sensitive && v.profile[f.key]) && (
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[12px] font-medium uppercase tracking-[0.8px] text-[#1D1D1F]/45">
                    SSN / Tax ID
                  </span>
                  <span className="text-[14px] font-medium text-[#1D1D1F]">
                    {maskTaxId(v.profile[d.fields.find((f) => f.sensitive)!.key] ?? '')}
                  </span>
                </div>
              )}
              {v.needsBank && (
                <div className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[12px] font-medium uppercase tracking-[0.8px] text-[#1D1D1F]/45">
                    Bank
                  </span>
                  <span className={`text-[14px] font-medium ${v.bankConnected ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {v.bankConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <ConsentCheckbox
                id="invite-consent"
                checked={v.consentChecked}
                onChange={v.setConsentChecked}
                error={v.showErrors && !v.consentChecked}
              >
                I confirm the information I provided is accurate and consent to its use for KYC and
                this Hushh Fund A application.
              </ConsentCheckbox>
            </div>
          </section>
        )}

        <section className="flex items-center gap-3 pb-10 pt-6">
          {v.stepIndex > 0 && (
            <HushhTechCta variant={HushhTechCtaVariant.WHITE} onClick={v.goBack} className="!rounded-full">
              Back
            </HushhTechCta>
          )}
          {isLast ? (
            <HushhTechCta
              variant={HushhTechCtaVariant.BLACK}
              onClick={v.handleComplete}
              disabled={!v.isComplete || v.saving}
              className={`${primaryCtaClass} flex-1`}
            >
              {v.saving ? 'Submitting…' : 'Submit my section'}
            </HushhTechCta>
          ) : (
            <HushhTechCta
              variant={HushhTechCtaVariant.BLACK}
              onClick={v.goNext}
              disabled={step.kind === 'fields' && !v.canAdvance}
              className={`${primaryCtaClass} flex-1`}
            >
              Continue
            </HushhTechCta>
          )}
        </section>
        <p className="pb-10 text-center text-[11px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/45">
          Secure · 256-bit encryption
        </p>
      </main>
    </div>
  );
}
