/**
 * /my-documents — the user's signed NDA + reviewed fund documents.
 *
 * Auth-only (NOT payment-gated): any signed-in user who has signed the NDA can
 * always retrieve it here, reached directly from the nav menu — independent of
 * whether they've paid. The NDA surface itself is the shared MyNdaDocuments
 * component (also used inside the payment-gated profile page).
 */
import { useNavigate } from "react-router-dom";

import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, { HushhFooterTab } from "../../components/hushh-tech-footer/HushhTechFooter";
import { AppIcon, Display, Eyebrow, Lede, appleFont } from "../../components/hushh-tech-ui/HushhAppleUI";
import MyNdaDocuments from "../../components/nda/MyNdaDocuments";

export default function MyDocumentsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={() => navigate(-1)} rightType="hamburger" />

      <main className="mx-auto w-full max-w-[560px] flex-grow px-5 pb-48">
        <section className="pb-9 pt-8 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="shield" size={62} />
          </div>
          <Eyebrow>Your records</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[440px]">
            Documents &amp; agreements.
          </Display>
          <Lede className="mx-auto mt-3 max-w-[420px]">
            The agreement you signed and the fund documents you reviewed — always here when you need them.
          </Lede>
        </section>

        <MyNdaDocuments />
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.PROFILE} />
    </div>
  );
}
