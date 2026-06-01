import { Link } from "react-router-dom";

import AuthBootingScreen from "../../components/auth/AuthBootingScreen";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
import {
  AppleButton,
  AppleSection,
  Display,
  Eyebrow,
  HushhMark,
  Icon,
  Lede,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import { CONSENT_COPY, CONSENT_LINKS } from "../../services/consent/consentConfig";
import { useSignupLogic } from "./logic";

export default function SignupPage() {
  const {
    isLoading,
    isSigningIn,
    oauthError,
    oauthFallbackUrl,
    handleAppleSignIn,
    handleGoogleSignIn,
  } = useSignupLogic();

  if (isLoading) {
    return (
      <AuthBootingScreen
        title="Create your account."
        description="Checking your secure sign-in session before we continue."
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader showTicker={false} />

      <main id="main-content">
        <AppleSection tone="light" pad="tight" fill last>
          <div className="relative z-[1]">
            <Link
              to="/"
              className="mx-auto mb-7 flex w-fit rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
              aria-label="Go to Hushh home"
            >
              <HushhMark size={76} />
            </Link>

            <Eyebrow>Sign Up</Eyebrow>
            <Display as="h1" size="sm" maxWidth="max-w-[420px]">
              Create your account.
            </Display>
            <Lede>Private onboarding for AI-powered investing.</Lede>

            <div className="mx-auto mt-7 flex max-w-[300px] flex-col gap-2.5 px-5">
              <AppleButton
                kind="filled"
                onClick={handleAppleSignIn}
                disabled={isSigningIn}
                icon={Icon.apple("#FFFFFF", 14)}
              >
                Continue with Apple
              </AppleButton>
              <AppleButton
                kind="bordered"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                icon={Icon.google(16)}
              >
                Continue with Google
              </AppleButton>
            </div>

            {oauthError ? (
              <div
                className="mx-auto mt-5 max-w-[320px] rounded-[14px] border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-4 py-3 text-[13px] leading-relaxed text-[#B42318]"
                style={{ fontFamily: appleFont }}
              >
                <p>{oauthError}</p>
                {oauthFallbackUrl ? (
                  <a
                    href={oauthFallbackUrl}
                    className="mt-2 inline-flex font-medium text-[#0066CC] underline underline-offset-2"
                  >
                    Continue on the supported sign-up host
                  </a>
                ) : null}
              </div>
            ) : null}

            <div
              className="mt-6 flex items-center justify-center gap-1.5 text-[12px] tracking-normal text-[#1D1D1F]/55"
              style={{ fontFamily: appleFont }}
            >
              {Icon.lock("rgba(29,29,31,0.55)", 12)}
              256-Bit Encryption
            </div>

            <p
              className="mt-5 text-center text-[13px] tracking-normal text-[#1D1D1F]/55"
              style={{ fontFamily: appleFont }}
            >
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[#0066CC]">
                Log In
              </Link>
            </p>

            <p
              className="mx-auto mt-5 max-w-[300px] text-center text-[11px] leading-[1.45] text-[#1D1D1F]/45"
              style={{ fontFamily: appleFont }}
            >
              {CONSENT_COPY.signup.split("Terms")[0]}
              <Link to={CONSENT_LINKS.terms} className="underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link to={CONSENT_LINKS.privacyPolicy} className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </AppleSection>
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.PROFILE} />
    </div>
  );
}
