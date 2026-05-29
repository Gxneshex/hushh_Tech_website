import { Link } from "react-router-dom";

import AuthBootingScreen from "../../components/auth/AuthBootingScreen";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
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
import { useLoginLogic } from "./logic";

export default function LoginPage() {
  const {
    isLoading,
    isSigningIn,
    oauthError,
    oauthFallbackUrl,
    handleAppleSignIn,
    handleGoogleSignIn,
  } = useLoginLogic();

  if (isLoading) {
    return (
      <AuthBootingScreen
        title="Welcome back."
        description="Checking your secure sign-in session before we continue."
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader rightType="hamburger" />

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

            <Eyebrow>Sign In</Eyebrow>
            <Display as="h1" size="sm" maxWidth="max-w-[420px]">
              Welcome back.
            </Display>
            <Lede>Secure, private, and smart investing.</Lede>

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
                    Continue on the supported sign-in host
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
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-[#0066CC]">
                Sign Up
              </Link>
            </p>

            <p
              className="mx-auto mt-5 max-w-[300px] text-center text-[11px] leading-[1.45] text-[#1D1D1F]/45"
              style={{ fontFamily: appleFont }}
            >
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline underline-offset-2">
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
