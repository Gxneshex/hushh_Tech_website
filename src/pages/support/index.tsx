import HushhTechLegalPage, {
  LegalInlineLink,
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const supportSections: LegalSection[] = [
  {
    eyebrow: "Primary",
    title: "Investor and Website Support",
    body: [
      <>
        For account, onboarding, document, or website questions, email{" "}
        <a className="font-medium text-[#0066CC]" href="mailto:support@hushh.ai">
          support@hushh.ai
        </a>
        . Include the page URL and a short description so the team can route it
        quickly.
      </>,
    ],
    bullets: [
      "Phone: (888) 462-1726",
      "Office hours: Monday - Friday, 9:00 AM - 6:00 PM PST",
      "Address: 1021 5th St W, Kirkland, WA 98033",
    ],
  },
  {
    title: "Common Help Paths",
    body: ["These quick paths cover the pages most investors need during review and onboarding."],
    bullets: [
      <LegalInlineLink to="/faq">Frequently Asked Questions</LegalInlineLink>,
      <LegalInlineLink to="/risk-disclosures">Risk Disclosures</LegalInlineLink>,
      <LegalInlineLink to="/privacy-policy">Website Privacy Policy</LegalInlineLink>,
      <LegalInlineLink to="/terms">Website Terms of Use</LegalInlineLink>,
    ],
  },
  {
    title: "Need to Send a Message?",
    body: [
      <>
        Use the full contact form when you want to submit a structured inquiry
        with reason, message, company, phone, and email fields. Go to{" "}
        <LegalInlineLink to="/contact">Contact</LegalInlineLink>.
      </>,
    ],
  },
];

const SupportPage = () => (
  <HushhTechLegalPage
    eyebrow="Support"
    title="How can we help?"
    sections={supportSections}
    primaryAction={{ label: "Email Support", href: "mailto:support@hushh.ai" }}
    secondaryAction={{ label: "Contact Form", href: "/contact" }}
  />
);

export default SupportPage;
