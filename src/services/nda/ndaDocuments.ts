/**
 * Fund documents covered by the global NDA.
 *
 * Single source of truth shared by:
 *  - the sign page (`src/pages/sign-nda/index.tsx`) — what the user reviews + acknowledges,
 *  - the signer-confirmation email payload (the `fullName`s are sent to `nda-signed-notification`),
 *  - the profile "My NDA & Documents" section — what we show the user they reviewed.
 *
 * The set is static per NDA version (everyone signing v1.0 reviews the same four),
 * so the profile can render "documents reviewed" from this constant rather than
 * persisting a per-user list.
 */
export const FUND_DOCUMENTS = [
  {
    id: 'delaware-feeder-lpa',
    name: 'Delaware Feeder LPA',
    fullName: 'Hushh Alpha Aloha Fund A Delaware Feeder LPA',
    url: '/fund-documents/delaware-feeder-lpa.docx',
    description: 'Limited Partnership Agreement for the Delaware Feeder Fund.',
  },
  {
    id: 'investment-prospectus',
    name: 'Investment Prospectus',
    fullName: 'Hushh Alpha Aloha Fund A Investment Prospectus',
    url: '/fund-documents/investment-prospectus.docx',
    description: 'Detailed investment strategy, risks, and fund objectives.',
  },
  {
    id: 'lp-master-lpa',
    name: 'LP Master LPA',
    fullName: 'Hushh Alpha Aloha Fund A LP Master LPA',
    url: '/fund-documents/lp-master-lpa.docx',
    description: 'Master Limited Partnership Agreement governing LP interests.',
  },
  {
    id: 'ppm',
    name: 'Private Placement Memorandum',
    fullName: 'Hushh Alpha Aloha Fund A PPM',
    url: '/fund-documents/ppm.docx',
    description: 'Offering memorandum with terms, risks, and disclosures.',
  },
] as const;

export type FundDocument = (typeof FUND_DOCUMENTS)[number];

/**
 * The NDA / consent copy version a signer agrees to. Bump when the NDA text or
 * the acknowledged document set materially changes — a version bump re-notifies
 * the signer + admins; re-signing the same version notifies no one.
 */
export const NDA_CONSENT_VERSION = 'v1.0';
