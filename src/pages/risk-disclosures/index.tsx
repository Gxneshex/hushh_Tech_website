import HushhTechLegalPage, {
  LegalInlineLink,
  type LegalSection,
} from "../../components/hushh-tech-legal-page/HushhTechLegalPage";

const riskSections: LegalSection[] = [
  {
    eyebrow: "Important",
    title: "Not an Offer",
    body: [
      "This page is provided for informational purposes only. It is not an offer to sell, or a solicitation of an offer to buy, any security or investment product.",
      "Any investment decision should be made only after reviewing the applicable private placement memorandum, subscription agreement, limited partnership agreement, and related fund documents.",
    ],
  },
  {
    title: "Investment Risk",
    body: [
      "Investing involves risk, including possible loss of principal. Past performance does not guarantee future results, and returns are not guaranteed.",
      "Target returns, projected performance, model outputs, and illustrative examples are not promises or assurances of actual results.",
    ],
  },
  {
    title: "Market and Concentration Risk",
    body: [
      "Fund strategies may be exposed to equity market risk, volatility risk, interest rate risk, currency risk, and sector-specific risk.",
      "A concentrated approach can increase dependence on a smaller number of companies, sectors, themes, or market conditions. Concentration can increase both potential return and potential loss.",
    ],
  },
  {
    title: "Options and Strategy Risk",
    body: [
      "Options strategies, including covered calls, cash-secured puts, and other short-option exposures, involve specific risks. A written option can lose value if the underlying asset moves sharply against the position.",
      "Options premiums are sensitive to implied volatility, liquidity, interest rates, and market stress. Hedging, collateral, and risk limits may reduce risk but cannot eliminate it.",
    ],
  },
  {
    title: "Liquidity and Redemption Risk",
    body: [
      "Private fund interests may be illiquid. Redemption windows, transfer restrictions, gates, lockups, notice periods, and other limits may apply.",
      "Market stress, operational constraints, or fund-level liquidity needs may affect the timing or availability of withdrawals or redemptions.",
    ],
  },
  {
    title: "Operational, Technology and AI Risk",
    body: [
      "Technology systems, data pipelines, AI models, third-party providers, execution venues, custodians, and administrative processes can fail, degrade, or produce incorrect results.",
      "AI-assisted analysis is a tool, not a guarantee. Human oversight, controls, and reviews are used, but model outputs can be incomplete, stale, biased, or wrong.",
    ],
  },
  {
    title: "Fees, Taxes and Eligibility",
    body: [
      "Fees and expenses reduce returns. Tax outcomes vary by investor and jurisdiction. Investors should consult their own tax, legal, and financial advisers.",
      "Private fund investments may be available only to eligible investors who satisfy applicable suitability, accreditation, or other legal requirements.",
    ],
  },
  {
    title: "Documents Control",
    body: [
      <>
        If there is any conflict between this summary and the applicable
        offering documents, the offering documents control. Please also review
        the <LegalInlineLink to="/terms">Terms of Use</LegalInlineLink> and{" "}
        <LegalInlineLink to="/privacy-policy">Privacy Policy</LegalInlineLink>.
      </>,
    ],
  },
];

const RiskDisclosuresPage = () => (
  <HushhTechLegalPage
    eyebrow="Disclosures"
    title="Risk Disclosures."
    lede="Plain-English investment and strategy risks to review before committing capital."
    updated="For investor review"
    sections={riskSections}
    primaryAction={{ label: "Terms of Use", href: "/terms" }}
    secondaryAction={{ label: "Support", href: "/support" }}
  />
);

export default RiskDisclosuresPage;
