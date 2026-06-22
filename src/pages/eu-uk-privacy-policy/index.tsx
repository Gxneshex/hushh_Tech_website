import HushhTechLegalPage, {
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const euUkPrivacySections: LegalSection[] = [
  {
    title: "Last Updated: February 5, 2025",
    body: [
      "Hushh Technologies LLC and its affiliates (collectively, “Hushh”) are committed to protecting your privacy and maintaining the confidentiality and security of the personal information you provide in connection with your application for a position at Hushh (“Your Personal Information”). Any personal information processed by Hushh is controlled by Hushh, and Hushh acts as the data controller.",
    ],
  },
  {
    title: "Collection of Your Personal Information",
    body: ["Hushh collects Your Personal Information from the following sources:"],
    bullets: [
      "The careers website hosted at www.hushhTech.com (the “Careers Site”);",
      "Application forms, resumes, or CVs submitted to Hushh;",
      "Other interactions with Hushh, such as email or telephone communications.",
    ],
  },
  {
    title: "Your Personal Information May Include:",
    bullets: [
      "Identification data, including name, address, telephone number, email address.",
      "Social insurance or national ID number.",
      "Nationality and language proficiencies.",
      "Educational and professional qualifications.",
      "Work experience and employment history.",
      "Contact information of your spouse, partner, or dependents (if required).",
    ],
  },
  {
    title: "Reasons for Collecting Personal Information",
    body: ["Hushh collects and processes Your Personal Information for:"],
    bullets: [
      "Compliance with legal obligations, including employment laws.",
      "Performance of contractual obligations as a prospective employer.",
      "Legitimate business interests, including recruitment and administration purposes.",
    ],
  },
  {
    title: "Recipients of Your Personal Information",
    body: ["Hushh may share Your Personal Information with:"],
    bullets: [
      "Affiliates and agents assisting with recruitment.",
      "Third-party service providers, such as background check providers.",
      "Law enforcement agencies, courts, or regulators for compliance.",
    ],
  },
  {
    title: "Storage and Protection of Personal Information",
    body: [
      "Hushh stores Your Personal Information in the United States and ensures appropriate safeguards are in place.",
    ],
  },
  {
    title: "Your Rights",
    body: ["Under applicable law, you may have the following rights:"],
    bullets: [
      "Right to be informed about data collection and usage.",
      "Right to access, correct, or erase Your Personal Information.",
      "Right to restrict or object to processing.",
      "Right to withdraw consent.",
      "Right to lodge complaints with data protection authorities.",
    ],
  },
  {
    title: "Further Information",
    body: [
      <>
        To exercise your rights, contact DataRep at{" "}
        <a className="font-medium text-[#0066CC]" href="mailto:datarequest@datarep.com">
          datarequest@datarep.com
        </a>
        , quoting “Hushh Technologies LLC.”
      </>,
    ],
  },
  {
    title: "Contact Information",
    body: [
      <>
        For questions regarding this policy, contact{" "}
        <a className="font-medium text-[#0066CC]" href="mailto:legalcompliance@hushhTech.com">
          legalcompliance@hushhTech.com
        </a>
        .
      </>,
    ],
  },
];

const EUUKPrivacyPolicy = () => (
  <HushhTechLegalPage
    eyebrow="EU & UK Privacy"
    title="Notice of EU and UK Privacy Policy for Job Candidates"
    lede="How Hushh collects, uses, and protects your personal information when you apply for a role with us."
    updated="Last Updated: February 5, 2025"
    sections={euUkPrivacySections}
    primaryAction={{ label: "Open Roles", href: "/career" }}
    secondaryAction={{ label: "Support", href: "/support" }}
  />
);

export default EUUKPrivacyPolicy;
