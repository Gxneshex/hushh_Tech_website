import HushhTechLegalPage, {
  LegalInlineLink,
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const termsSections: LegalSection[] = [
  {
    eyebrow: "Agreement",
    title: "Ownership of Site; Agreement to Terms of Use",
    body: [
      'These Terms and Conditions of Use (the "Terms of Use") apply to the Hushh Technologies Corporation LLC website located at www.hushhtech.com, and all associated sites linked to www.hushhtech.com by Hushh Technologies Corporation, its subsidiaries, LLP and LLC investment vehicles, and affiliates, including HushhTech sites around the world (collectively, the "Site"). The Site is the property of Hushh Technologies Corporation ("HushhTech") and its licensors.',
      "BY USING THE SITE, YOU AGREE TO THESE TERMS OF USE; IF YOU DO NOT AGREE, DO NOT USE THE SITE.",
      "HushhTech reserves the right, at its sole discretion, to change, modify, add or remove portions of these Terms of Use at any time. Your continued use of the Site following the posting of changes will mean that you accept and agree to the changes.",
    ],
  },
  {
    title: "Content",
    body: [
      'All text, graphics, user interfaces, visual interfaces, photographs, trademarks, logos, sounds, music, artwork, and computer code (collectively, "Content"), including the design, structure, selection, coordination, expression, look and feel, and arrangement of such Content, contained on the Site is owned, controlled, or licensed by or to HushhTech.',
      "Except as expressly provided in these Terms of Use, no part of the Site and no Content may be copied, reproduced, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, or distributed in any way without HushhTech's express prior written consent.",
    ],
    bullets: [
      "Do not remove any proprietary notice language in copies of documents.",
      "Use information made available for download only for your personal, non-commercial informational purpose.",
      "Do not modify such information or make additional representations or warranties relating to those documents.",
    ],
  },
  {
    title: "Your Use of the Site",
    body: [
      "You may not use any deep-link, page-scrape, robot, spider, or other automatic device, program, algorithm, methodology, or similar process to access, acquire, copy, or monitor any portion of the Site or Content.",
      "You may not attempt to gain unauthorized access to any portion or feature of the Site, any systems or networks connected to the Site, any HushhTech server, or any services offered on or through the Site.",
    ],
    bullets: [
      "Do not probe, scan, or test the vulnerability of the Site or any connected network.",
      "Do not reverse look-up, trace, or seek to trace information on any other user or visitor.",
      "Do not take action that imposes an unreasonable load on HushhTech systems or networks.",
      "Do not interfere with the proper working of the Site or any transaction being conducted on the Site.",
      "Do not impersonate another individual or entity, forge headers, or manipulate identifiers.",
      "Do not use the Site or Content for any unlawful or prohibited purpose.",
    ],
  },
  {
    title: "Purchases; Other Terms and Conditions",
    body: [
      "Additional terms and conditions may apply to purchases of goods or services and to specific portions or features of the Site, including contests, promotions, or other similar features. You agree to abide by such other terms and conditions.",
    ],
  },
  {
    title: "Accounts, Passwords and Security",
    body: [
      "Certain features or services offered on or through the Site may require you to open an account. You are entirely responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account.",
    ],
  },
  {
    title: "Privacy",
    body: [
      <>
        HushhTech's Privacy Policy applies to use of this Site and its terms are
        made a part of these Terms of Use by this reference. View the{" "}
        <LegalInlineLink to="/privacy-policy">Privacy Policy</LegalInlineLink>.
      </>,
    ],
  },
  {
    title: "Links to Other Sites",
    body: [
      "This Site may contain links to independent third-party websites. These Linked Sites are provided solely as a convenience to our visitors. Such Linked Sites are not under HushhTech's control, and HushhTech is not responsible for and does not endorse their content.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "HUSHHTECH DOES NOT PROMISE THAT THE SITE OR ANY CONTENT, SERVICE, OR FEATURE OF THE SITE WILL BE ERROR-FREE OR UNINTERRUPTED. THE SITE AND ITS CONTENT ARE DELIVERED ON AN AS-IS AND AS-AVAILABLE BASIS.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "Except where prohibited by law, in no event will HushhTech be liable to you for any indirect, consequential, exemplary, incidental, or punitive damages.",
    ],
  },
  {
    title: "Indemnity",
    body: [
      "You agree to indemnify and hold HushhTech, its officers, directors, shareholders, predecessors, successors, employees, agents, subsidiaries, and affiliates harmless from any demands, loss, liability, claims, or expenses, including attorneys' fees, made against HushhTech by any third party due to or arising out of your use of the Site.",
    ],
  },
  {
    title: "Violation of These Terms of Use",
    body: [
      "HushhTech reserves the right to disclose any information it deems necessary to comply with applicable law or legal process, and to take any action it considers appropriate to protect the rights, property, and safety of HushhTech and its users.",
    ],
  },
  {
    title: "Governing Law; Dispute Resolution",
    body: [
      "You agree that all matters relating to your access to or use of the Site will be governed by the laws of the State of Washington, United States. Venue shall be in King County, Washington.",
    ],
  },
  {
    title: "Void Where Prohibited",
    body: [
      "Although the Site is accessible worldwide, not all products or services discussed or offered through the Site are available to all persons or in all geographic locations. HushhTech reserves the right to limit the availability of any product or service to any person, geographic area, or jurisdiction.",
    ],
  },
  {
    title: "Miscellaneous",
    body: [
      "If any provision of these Terms of Use is held to be unlawful, void, or unenforceable, the remaining provisions shall remain in full force and effect.",
      "Copyright 2025 Hushh Technologies Corporation. All rights reserved. Hushh Technologies Corporation, 1021 5th St W, Kirkland, WA 98033, USA. Contact: privacy@hushh.ai.",
    ],
  },
];

const TermsOfServicePage = () => (
  <HushhTechLegalPage
    eyebrow="Legal Information & Notices"
    title="Website Terms of Use."
    lede="The approved terms governing access to hushhtech.com and related HushhTech website experiences."
    updated="Approved Terms of Use"
    sections={termsSections}
    primaryAction={{ label: "Privacy Policy", href: "/privacy-policy" }}
    secondaryAction={{ label: "Risk Disclosures", href: "/risk-disclosures" }}
  />
);

export default TermsOfServicePage;
