import HushhTechLegalPage, {
  LegalInlineLink,
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const careerPrivacySections: LegalSection[] = [
  {
    title: "Your Consent",
    body: [
      "Submitting personal information through the Careers site is voluntary. If you choose not to submit certain information, it may limit our ability to consider your candidacy.",
      "By sharing information through the Careers site, you consent to Hushh and its service providers processing that information for recruiting and related employment-review purposes.",
    ],
  },
  {
    title: "Information You Provide",
    body: [
      "This notice applies to personal information submitted as part of a job application or job search process, including resumes, application details, cover letters, and information shared during recruiting conversations.",
      "If you include information about a reference or third party, you represent that you have permission to share that information with Hushh.",
    ],
  },
  {
    title: "How Hushh Uses Information",
    body: [
      "Hushh uses Careers site information to assess qualifications, manage recruiting, plan onboarding, support internal workforce operations, and comply with applicable law.",
    ],
    bullets: [
      "Assessing qualifications for employment.",
      "Managing recruiting and interview workflows.",
      "Planning onboarding and related employment activities.",
      "Supporting security, compliance, and legal requirements.",
    ],
  },
  {
    title: "Disclosure of Personal Information",
    body: [
      "Career information may be reviewed by human resources personnel, technical services personnel, hiring managers, interviewers, and service providers that support recruiting operations.",
    ],
  },
  {
    title: "Retention and Security",
    body: [
      "Hushh retains career information as long as necessary for recruiting, business needs, and legal or regulatory obligations.",
      "Hushh uses reasonable measures to protect information submitted through the Careers site, but no system can be guaranteed to be completely secure.",
    ],
  },
  {
    title: "Updates and Contact",
    body: [
      <>
        Hushh may update this notice periodically. For questions, contact{" "}
        <a className="font-medium text-[#0066CC]" href="mailto:legalcompliance@hushhtech.com">
          legalcompliance@hushhtech.com
        </a>
        , or visit <LegalInlineLink to="/support">Support</LegalInlineLink>.
      </>,
    ],
  },
];

const CareersPrivacyPolicy = () => (
  <HushhTechLegalPage
    eyebrow="Careers Privacy"
    title="Careers Site Privacy Policy."
    sections={careerPrivacySections}
    primaryAction={{ label: "Open Roles", href: "/career" }}
    secondaryAction={{ label: "Support", href: "/support" }}
  />
);

export default CareersPrivacyPolicy;
