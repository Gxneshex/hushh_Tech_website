/**
 * Verify Identity — checkpoint-driven KYC step.
 * Legal consent is the first live checkpoint and gates the Stripe Identity flow.
 */
import { useVerifyIdentityLogic } from './logic';
import HushhTechBackHeader from '../../../components/hushh-tech-back-header/HushhTechBackHeader';
import HushhTechCta, { HushhTechCtaVariant } from '../../../components/hushh-tech-cta/HushhTechCta';
import {
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from '../../../components/hushh-tech-ui/HushhAppleUI';
import ConsentCheckbox from '../../../components/consent/ConsentCheckbox';
import { CONSENT_COPY, CONSENT_LINKS } from '../../../services/consent/consentConfig';

function VerifyIdentityPage() {
  const {
    loading,
    startDisabled,
    startingVerification,
    onboardingData,
    verificationStatus,
    identityConsentChecked,
    identityConsentError,
    handleIdentityConsentChange,
    startVerification,
    isSkipConfirmOpen,
    isSkipping,
    openSkipConfirm,
    closeSkipConfirm,
    handleConfirmSkip,
    goBack,
  } = useVerifyIdentityLogic();

  if (loading) {
    return (
      <div
        className="bg-white min-h-screen flex flex-col antialiased selection:bg-hushh-blue selection:text-white"
        style={{ fontFamily: appleFont }}
      >
        <HushhTechBackHeader onBackClick={goBack} rightLabel="FAQ" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-gray-200 border-t-hushh-blue animate-spin" />
            <p className="text-sm text-gray-500 font-light">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Checkpoint timeline — legal consent is the FIRST live checkpoint, then the
  // four Stripe Identity sub-checks fill in as they clear.
  const checkpoints = [
    {
      icon: 'gavel',
      label: 'legal consent',
      desc: 'approve identity & biometric verification',
      verified: identityConsentChecked,
    },
    {
      icon: 'badge',
      label: 'government id',
      desc: 'passport, driver\'s license, or id card',
      verified: verificationStatus.document_verified,
    },
    {
      icon: 'photo_camera',
      label: 'selfie verification',
      desc: 'live selfie matching your id photo',
      verified: verificationStatus.selfie_verified,
    },
    {
      icon: 'mail',
      label: 'email',
      desc: onboardingData?.email?.toLowerCase() || 'your email address',
      verified: verificationStatus.email_verified,
    },
    {
      icon: 'phone_iphone',
      label: 'phone number',
      desc: onboardingData?.phone_country_code && onboardingData?.phone_number
        ? `${onboardingData.phone_country_code} ${onboardingData.phone_number}`
        : 'your phone number',
      verified: verificationStatus.phone_verified,
    },
  ];

  return (
    <div
      className="bg-white text-[#1D1D1F] min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={goBack} rightLabel="FAQ" />

      <main className="px-6 flex-grow max-w-[520px] mx-auto w-full pb-16">
        {/* Title */}
        <section className="py-8 text-center">
          <Eyebrow>Identity</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Verify your identity.
          </Display>
          <Lede className="max-w-[440px]">
            Complete a quick verification to secure your account and unlock all features.
          </Lede>
        </section>

        {/* Status alerts */}
        {verificationStatus.status === 'processing' && (
          <div className="mb-6 flex items-center gap-3 py-4 px-1 border-b border-blue-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
            </div>
            <p className="text-sm font-medium text-blue-700">Verification in progress. This usually takes a few minutes.</p>
          </div>
        )}
        {verificationStatus.status === 'requires_input' && (
          <div className="mb-6 flex items-center gap-3 py-4 px-1 border-b border-yellow-100">
            <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-yellow-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <p className="text-sm font-medium text-yellow-700">Additional information required. Please complete the verification.</p>
          </div>
        )}
        {verificationStatus.status === 'failed' && (
          <div className="mb-6 flex items-center gap-3 py-4 px-1 border-b border-red-100">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <p className="text-sm font-medium text-red-700">Verification failed. Please try again or contact support.</p>
          </div>
        )}

        {/* Checkpoints */}
        <section className="mb-6">
          <div className="py-4">
            <h3 className="text-[11px] tracking-[1.6px] text-hushh-blue/85 uppercase font-medium">Your verification checkpoints</h3>
          </div>
          <div className="relative">
            {/* connecting rail */}
            <span aria-hidden className="absolute left-5 top-6 bottom-6 w-px bg-gray-200" />
            {checkpoints.map((item) => (
              <div key={item.icon} className="relative flex items-center gap-4 py-4">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.verified ? 'bg-ios-green/10 border border-ios-green/30' : 'bg-white border border-gray-200'}`}>
                  <span className={`material-symbols-outlined text-lg ${item.verified ? 'text-ios-green' : 'text-gray-500'}`} style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                    {item.verified ? 'check_circle' : item.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block capitalize">{item.label}</span>
                  <span className="text-xs text-gray-500 font-medium">{item.desc}</span>
                </div>
                {item.verified && (
                  <span className="text-[10px] font-semibold text-ios-green bg-ios-green/10 border border-ios-green/20 px-2 py-0.5 rounded">Done</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Security note */}
        <div className="flex items-start gap-3 py-4 px-1 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-gray-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-900 block">Secure & Private</span>
            <p className="text-xs text-black/60 leading-[1.45] font-light mt-0.5">
              Your documents are encrypted and processed securely. We never store raw document images.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <section className="space-y-3 pb-6">
          <ConsentCheckbox
            id="identity-consent"
            checked={identityConsentChecked}
            onChange={handleIdentityConsentChange}
            error={identityConsentError}
          >
            {CONSENT_COPY.identityVerification}{' '}
            <a
              href={CONSENT_LINKS.privacyPolicy}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-hushh-blue underline"
            >
              Privacy Policy
            </a>
            {' · '}
            <a
              href={CONSENT_LINKS.terms}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-hushh-blue underline"
            >
              Terms
            </a>
          </ConsentCheckbox>
          <HushhTechCta variant={HushhTechCtaVariant.BLACK} onClick={startVerification} disabled={startDisabled}>
            {startingVerification ? 'Starting...' : verificationStatus.status === 'requires_input' ? 'Continue Verification' : 'Start Verification'}
          </HushhTechCta>
          <HushhTechCta variant={HushhTechCtaVariant.WHITE} onClick={openSkipConfirm}>
            I'll Do This Later
          </HushhTechCta>
        </section>

        {/* Time estimate + trust */}
        <section className="flex flex-col items-center text-center gap-1 pb-8">
          <span className="text-[10px] text-gray-500 font-light">Usually takes 2-3 minutes to complete</span>
          <div className="flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-[12px] text-hushh-blue">lock</span>
            <span className="text-[10px] text-gray-500 tracking-wide uppercase font-medium">Stripe Identity</span>
          </div>
        </section>
      </main>

      {/* Defer confirm modal */}
      {isSkipConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 backdrop-blur-sm sm:items-center"
          onClick={closeSkipConfirm}
        >
          <div
            className="w-full max-w-[420px] rounded-t-[28px] bg-white p-6 shadow-[0_-8px_32px_rgba(29,29,31,0.18)] sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-[#1D1D1F]">Verify later?</h3>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#1D1D1F]/60">
              You can complete identity verification anytime from your profile. Some
              features stay locked until verification is complete.
            </p>
            <div className="mt-6 space-y-3">
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={handleConfirmSkip}
                disabled={isSkipping}
              >
                {isSkipping ? 'Saving…' : "Yes, I'll verify later"}
              </HushhTechCta>
              <button
                type="button"
                onClick={closeSkipConfirm}
                disabled={isSkipping}
                className="w-full py-2 text-center text-[14px] font-medium text-[#0066CC] transition hover:opacity-75 disabled:opacity-40"
              >
                Continue verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyIdentityPage;
