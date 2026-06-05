import HushhTechLegalPage, {
  LegalInlineLink,
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const privacySections: LegalSection[] = [
  {
    title: "Introduction",
    body: [
      'This website privacy policy (the "Policy") describes how Hushh Technologies LLC and its affiliates ("Hushh") treat personal information collected on the HushhTech.com website (the "Website"). This Policy does not apply to information Hushh may collect through other means.',
    ],
  },
  {
    title: "Information That Hushh Collects",
    body: [
      "When you visit the Website, Hushh may collect personal information such as your name, address, email address, and other information you provide through forms or documents.",
      "Hushh may also collect nonpersonal information about visits, including IP address, domain name, browser type, operating system, visit date and time, visit duration, repeat visits, and referring source.",
      "For some information, Hushh uses tracking tools such as browser cookies and web beacons.",
    ],
  },
  {
    title: "How Hushh Uses Information",
    body: ["Hushh uses information it collects to respond to requests, communicate with you, improve the Website and services, and support security and legal compliance."],
    bullets: [
      "Responding to questions or requests.",
      "Communicating with you about your relationship with Hushh.",
      "Improving the Website and services.",
      "Supporting security, compliance, and fraud prevention.",
      "Using information as otherwise permitted by law.",
    ],
  },
  {
    title: "Limited Sharing",
    body: [
      "Hushh may share information with employees, agents, or third-party service providers who need it to perform their work, including responding to requests or questions.",
      "Hushh may also share information to comply with legal requirements, respond to legal requests, support regulatory inquiries, investigate potential fraud, or as otherwise permitted by law.",
    ],
  },
  {
    title: "Protection of Information",
    body: [
      "Hushh is committed to protecting personal information collected through the Website against unauthorized access, use, or disclosure.",
      "Hushh has implemented procedures to safeguard information technology assets, including authentication, monitoring, auditing, and encryption. No method of safeguarding information is completely secure, and Hushh cannot guarantee that safeguards will be effective or sufficient in every circumstance.",
      "Information provided through the Website may be stored within the United States. If you live outside the United States, you understand and agree that Hushh may store your information in the United States.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Hushh retains personal information to the extent it deems necessary to carry out the activities described in this Policy, comply with applicable laws and requests, and protect Hushh, its partners, users, and third parties.",
    ],
  },
  {
    title: "Cookies and Tracking Tools",
    body: [
      "Hushh may use necessary cookies and similar tools to allow the Website to function properly. Your browser may give you the ability to control cookies, but options are browser and device specific.",
      "Hushh does not engage in automated decision-making for the processing of personal information collected through this Website.",
    ],
  },
  {
    title: "Children and the Website",
    body: [
      "The Website is meant for adults. Hushh does not knowingly collect personally identifiable information from children under age 16. By using the services provided by the Website, you represent that you are 16 years of age or older.",
    ],
  },
  {
    title: "Business Transfer",
    body: [
      "Hushh may in the future sell or transfer some or all of its business, operations, or assets to a third party. Personal information obtained through the Website may be disclosed to potential or actual acquirers and may be among the transferred assets.",
    ],
  },
  {
    title: "Links to Other Sites",
    body: [
      "If you click a third-party link on the Website, you will be taken to a website Hushh does not control. This Policy does not apply to that website. Please read third-party privacy policies carefully.",
    ],
  },
  {
    title: "Updates and Contact",
    body: [
      <>
        This Policy replaces previous disclosures and may be updated by posting
        a revised Policy. For questions, contact{" "}
        <a className="font-medium text-[#0066CC]" href="mailto:ir@hushh.ai">
          ir@hushh.ai
        </a>
        . For website terms, see the{" "}
        <LegalInlineLink to="/terms">Terms of Use</LegalInlineLink>.
      </>,
    ],
  },
];

const PrivacyPolicyPage = () => (
  <HushhTechLegalPage
    eyebrow="Privacy"
    title="Website Privacy Policy."
    updated="Last updated February 5, 2025"
    sections={privacySections}
    primaryAction={{ label: "Terms of Use", href: "/terms" }}
    secondaryAction={{ label: "Support", href: "/support" }}
  />
);

export default PrivacyPolicyPage;
