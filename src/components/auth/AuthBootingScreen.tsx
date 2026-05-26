import { Link } from "react-router-dom";

import HushhTechFooter, {
  HushhFooterTab,
} from "../hushh-tech-footer/HushhTechFooter";
import HushhTechHeader from "../hushh-tech-header/HushhTechHeader";
import {
  AppleSection,
  Display,
  Eyebrow,
  HushhMark,
  Lede,
  SmallSpinner,
  appleFont,
} from "../hushh-tech-ui/HushhAppleUI";

export default function AuthBootingScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader showTicker={false} />

      <main id="main-content">
        <AppleSection tone="light" pad="tight" fill last>
          <Link
            to="/"
            className="mx-auto mb-7 flex w-fit rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
            aria-label="Go to Hushh home"
          >
            <HushhMark size={76} />
          </Link>
          <Eyebrow>Secure Sign In</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[420px]">
            {title}
          </Display>
          <Lede>{description}</Lede>
          <SmallSpinner label="Preparing secure sign-in" />
        </AppleSection>
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.PROFILE} />
    </div>
  );
}
