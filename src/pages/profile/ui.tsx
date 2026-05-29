/**
 * Profile Page — UI / Presentation (Revamped)
 * Apple iOS colors, SF-style headings, proper English capitalization.
 * Matches Home + Fund A + Community design language.
 * Logic stays in logic.ts via useProfileLogic().
 */
import React from 'react';
import HushhTechBackHeader from '../../components/hushh-tech-back-header/HushhTechBackHeader';
import HushhTechFooter, { HushhFooterTab } from '../../components/hushh-tech-footer/HushhTechFooter';
import {
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  PillButton,
  appleFont,
} from '../../components/hushh-tech-ui/HushhAppleUI';
import { useProfileLogic } from './logic';

const ProfilePage: React.FC = () => {
  const {
    onboardingStatus,
    primaryCTA,
    handleDiscoverFundA,
  } = useProfileLogic();
  const primaryCtaText =
    primaryCTA.state === 'unauthenticated'
      ? 'Complete your investment'
      : primaryCTA.text;

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* header */}
      <HushhTechBackHeader rightType="hamburger" />

      {/* scrollable content */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-36 pt-8 sm:px-6 md:px-12 lg:px-20">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-8 text-center">
          <div className="flex justify-center">
            <AppIcon kind="person" size={62} />
          </div>
          <div>
            <Eyebrow>Profile</Eyebrow>
            <Display as="h1" size="md" maxWidth="max-w-[580px]">
              Investing in the future.
            </Display>
            <Lede>
              The AI-powered Berkshire Hathaway. We combine AI and human
              expertise to invest in exceptional businesses for long-term value
              creation.
            </Lede>
          </div>

          {/* action buttons */}
          <div
            className="mt-1 grid w-full max-w-[460px] grid-cols-1 gap-3 sm:grid-cols-2"
            data-testid="profile-cta-group"
          >
            <PillButton
              onClick={primaryCTA.action}
              disabled={onboardingStatus.loading}
              className="w-full sm:w-auto"
            >
              {onboardingStatus.loading ? 'Loading...' : primaryCtaText}
            </PillButton>
            <PillButton
              onClick={handleDiscoverFundA}
              kind="ghost"
              className="w-full sm:w-auto"
            >
              Discover Fund A
              {Icon.chevronRight("#0066CC", 14)}
            </PillButton>
          </div>

          {/* trust indicators */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#34C759]" />
              <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                SEC Registered
              </p>
            </div>
            <div className="flex items-center gap-2">
              {Icon.lock("#0066CC", 14)}
              <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                Bank Level Security
              </p>
            </div>
          </div>

          {/* tagline */}
          <p className="text-[13px] font-light tracking-normal text-[#1D1D1F]/45">
            Secure. Private. AI-Powered.
          </p>
        </div>
      </main>

      {/* ═══ Footer Nav ═══ */}
      <HushhTechFooter activeTab={HushhFooterTab.PROFILE} />
    </div>
  );
};

export default ProfilePage;
