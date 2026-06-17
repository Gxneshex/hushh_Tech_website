/**
 * Public invitee page (route /onboarding/invite/:token, outside ProtectedRoute).
 * An invited party (joint owner, custodian, trustee, …) completes only their own
 * required fields. Never shows the primary investor's PII beyond a display name.
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
import { useInviteLogic } from './logic';

const shell =
  'flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased';
const panelClass =
  'rounded-[28px] bg-white p-5 shadow-[0_18px_48px_rgba(29,29,31,0.06),inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:p-6';
const fieldClass =
  'min-h-[74px] rounded-[18px] bg-[#F5F5F7] px-4 py-3.5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]';
const labelClass =
  'mb-1 block text-[11px] font-medium uppercase tracking-[1.3px] text-[#1D1D1F]/55';
const inputClass =
  'w-full border-none bg-transparent p-0 text-[16px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/42 focus:ring-0';
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

export default function OnboardingInvitePage() {
  const v = useInviteLogic();

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
  if (v.screen === 'error' || !v.data) {
    return (
      <Centered
        icon="error"
        title="We couldn't open this invite"
        body={v.error || 'The link may be invalid. Please ask for a new secure link.'}
      />
    );
  }

  const d = v.data;
  return (
    <div className={shell} style={{ fontFamily: appleFont }}>
      <HushhTechBackHeader rightLabel="FAQs" />
      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-32 sm:px-5">
        <section className="pb-6 pt-8 text-center">
          <Eyebrow>{d.role_label}</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[520px]">
            Complete your section
          </Display>
          <Lede className="max-w-[480px]">
            {d.primary_name} invited you to complete the {d.role_label.toLowerCase()} details for
            their Hushh Fund A application.
          </Lede>
        </section>

        {v.error && (
          <div className="mb-5 rounded-[18px] bg-[#FF3B30]/10 px-4 py-3 text-[13px] font-medium text-[#B42318] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            {v.error}
          </div>
        )}

        <section className={panelClass}>
          <div className="grid gap-3">
            {d.fields.map((f) => (
              <label key={f.key} className={fieldClass}>
                <span className={labelClass}>
                  {f.label}
                  {f.required ? <RequiredAsterisk /> : <OptionalMarker />}
                </span>
                <input
                  type={f.key === 'email' ? 'email' : f.key === 'phone' ? 'tel' : 'text'}
                  value={v.profile[f.key] ?? ''}
                  onChange={(e) => v.setField(f.key, e.target.value)}
                  onBlur={v.handleSaveDraft}
                  className={inputClass}
                  placeholder={f.label}
                />
                {v.missing.includes(f.key) && (
                  <span className="mt-1 block text-[11px] font-medium text-[#FF3B30]">
                    This field is required
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3 pb-10 pt-6">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={v.handleComplete}
            disabled={!v.isComplete || v.saving}
            className={primaryCtaClass}
          >
            {v.saving ? 'Submitting…' : 'Submit my section'}
          </HushhTechCta>
          <p className="text-center text-[11px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/45">
            Secure · 256-bit encryption
          </p>
        </section>
      </main>
    </div>
  );
}
