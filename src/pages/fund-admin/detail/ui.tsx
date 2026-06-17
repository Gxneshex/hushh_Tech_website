import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFundAdminDetail, type FundReviewDecision } from './logic';
import {
  appleFont,
  appleDisplayFont,
  Card,
  Chip,
  DetailItem,
  StatusBadge,
  formatDateTime,
  formatDate,
  flagLabel,
} from '../shared';
import { Icon } from '../../../components/hushh-tech-ui/HushhAppleUI';

const PIECE_LABELS: Record<string, string> = {
  missing_onboarding_row: 'Bank linked, but no onboarding row found',
  onboarding_financial_link_status_not_completed: 'Bank linked, onboarding status not marked complete',
  bank_not_linked: 'Bank not linked',
  nda_not_signed: 'NDA not signed',
  payment_not_started: 'Payment not started',
  first_payment_not_paid: 'First payment not paid',
  awaiting_manual_verification: 'Awaiting manual verification',
  kyc_not_found: 'KYC not found',
  current_location_differs_from_residence: 'Current location differs from residence',
  signatory_not_confirmed: 'Authorised signatory not confirmed',
  account_type_fields_incomplete: 'Account-type details incomplete',
  required_party_not_completed: 'Required party not completed',
  application_not_submitted: 'Not yet submitted for review',
  funds_insufficient: 'Funds insufficient',
};

function auditLabel(value: string): string {
  return PIECE_LABELS[value] || value.replace(/_/g, ' ');
}

// One node in the onboarding funnel timeline.
function TimelineStep({
  label,
  done,
  detail,
  last,
}: {
  label: string;
  done: boolean;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <div
          className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{
            backgroundColor: done ? '#34C759' : '#FFFFFF',
            boxShadow: done
              ? '0 2px 6px rgba(52,199,89,0.35)'
              : 'inset 0 0 0 1.5px rgba(29,29,31,0.15)',
            color: done ? '#FFFFFF' : 'transparent',
          }}
        >
          ✓
        </div>
        {!last && (
          <div
            className="w-[2px] flex-grow"
            style={{ backgroundColor: done ? 'rgba(52,199,89,0.35)' : 'rgba(29,29,31,0.10)', minHeight: 20 }}
          />
        )}
      </div>
      <div className={last ? '' : 'pb-5'}>
        <div className="text-[14px] font-semibold text-[#1D1D1F]">{label}</div>
        <div className="mt-0.5 text-[12.5px] text-[#1D1D1F]/55">{detail}</div>
      </div>
    </div>
  );
}

export default function FundAdminInvestorDetail() {
  const { userId } = useParams<{ userId: string }>();
  const {
    investor,
    sourceWarnings,
    loading,
    error,
    note,
    setNote,
    actioning,
    actionError,
    banner,
    canReview,
    approve,
    reject,
    refresh,
    addNote,
    addTag,
    removeTag,
    crmBusy,
    crmError,
    resendLink,
    sendReminder,
    opsBusy,
    opsBanner,
    opsError,
    kycGate,
    kycAck,
    setKycAck,
    recordKycReview,
    kycBusy,
    kycError,
    runAutomatedScreen,
    screenBusy,
  } = useFundAdminDetail(userId);

  const [confirming, setConfirming] = useState<FundReviewDecision | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [kycReviewOpen, setKycReviewOpen] = useState(false);
  const [kycRiskBand, setKycRiskBand] = useState('');
  const [kycSanctions, setKycSanctions] = useState(true);
  const [kycPep, setKycPep] = useState(true);
  const [kycReviewNote, setKycReviewNote] = useState('');
  const initial = investor?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  const kycRisky =
    !!investor &&
    (!investor.kyc ||
      (investor.kyc.riskBand || '').toUpperCase() === 'HIGH' ||
      (investor.kyc.status ? investor.kyc.status.toLowerCase() !== 'active' : false));
  const kycExpired = !!investor?.kyc?.expiresAt && new Date(investor.kyc.expiresAt) < new Date();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Glass header ═══ */}
      <header
        className="sticky top-0 z-40 border-b border-[#1D1D1F]/[0.06]"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/fund-admin"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0066CC] transition hover:opacity-75"
          >
            {Icon.back('currentColor', 16)} All investors
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-[#0066CC] transition hover:opacity-75 disabled:opacity-40"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(0,102,204,0.30)' }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[880px] flex-grow px-4 pb-28 pt-6 sm:px-6">
        {loading && !investor ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
              <p className="mt-4 text-[13px] tracking-[0.02em] text-[#1D1D1F]/45">Loading investor…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[18px] px-5 py-4 text-[14px] font-medium text-[#B42318]"
            style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
          >
            {error}
          </div>
        ) : investor ? (
          <div className="space-y-4">
            {banner && (
              <div
                className="rounded-[16px] px-4 py-3.5 text-[14px] font-medium text-[#1E7E34]"
                style={{ backgroundColor: 'rgba(52,199,89,0.12)', boxShadow: 'inset 0 0 0 1px rgba(52,199,89,0.20)' }}
              >
                {banner}
              </div>
            )}
            {actionError && (
              <div
                className="rounded-[16px] px-4 py-3.5 text-[14px] font-medium text-[#B42318]"
                style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
              >
                {actionError}
              </div>
            )}
            {sourceWarnings.length > 0 && (
              <div
                className="rounded-[16px] px-4 py-3.5 text-[13px] font-medium text-[#B25A00]"
                style={{ backgroundColor: 'rgba(255,149,0,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,149,0,0.18)' }}
              >
                Some optional sources could not be read: {sourceWarnings.map((w) => w.source).join(', ')}.
              </div>
            )}

            {/* Identity header */}
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-white"
                    style={{ background: 'linear-gradient(160deg, #2997ff 0%, #0066CC 100%)', boxShadow: '0 6px 16px rgba(0,102,204,0.30)' }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-[24px] font-medium tracking-[-0.02em]" style={{ fontFamily: appleDisplayFont }}>
                      {investor.name}
                    </h1>
                    <p className="mt-0.5 text-[14px] text-[#1D1D1F]/55 break-all">
                      {investor.email || 'No email on file'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {investor.investment?.status ? (
                    <StatusBadge status={investor.investment.status} />
                  ) : (
                    <span className="text-[13px] text-[#1D1D1F]/45">No payment yet</span>
                  )}
                  {investor.investment?.requestReference && (
                    <p className="mt-1.5 font-mono text-[11px] text-[#1D1D1F]/45">
                      {investor.investment.requestReference}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <DetailItem label="Phone" value={investor.phone} />
                <DetailItem label="Account type" value={investor.accountType} />
                <DetailItem label="Date of birth" value={investor.dobMasked} />
                <DetailItem label="SSN on file" value={investor.ssnProvided ? 'Provided ✓' : 'Not provided'} />
                <DetailItem
                  label="Onboarding"
                  value={
                    investor.onboardingComplete
                      ? 'Complete'
                      : investor.currentStep
                        ? `Step ${investor.currentStep}`
                        : 'Not started'
                  }
                />
                <div className="col-span-2 sm:col-span-3">
                  <DetailItem label="Address" value={investor.address} />
                </div>
              </div>
            </Card>

            {/* Operations */}
            <Card title="Operations">
              {opsBanner && (
                <div className="mb-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium text-[#1E7E34]" style={{ backgroundColor: 'rgba(52,199,89,0.12)' }}>
                  {opsBanner}
                </div>
              )}
              {opsError && (
                <div className="mb-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium text-[#B42318]" style={{ backgroundColor: 'rgba(255,59,48,0.10)' }}>
                  {opsError}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resendLink}
                  disabled={Boolean(opsBusy)}
                  className="rounded-full bg-[#0066CC] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {opsBusy === 'resend' ? 'Resending…' : 'Resend payment link'}
                </button>
                {([
                  ['complete_payment', 'Nudge: complete payment'],
                  ['finish_onboarding', 'Nudge: finish onboarding'],
                  ['link_bank', 'Nudge: link bank'],
                  ['sign_nda', 'Nudge: sign NDA'],
                ] as const).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => sendReminder(type)}
                    disabled={Boolean(opsBusy)}
                    className="rounded-full bg-[#F5F5F7] px-4 py-2 text-[13px] font-medium text-[#1D1D1F] transition hover:bg-[#ECECEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {opsBusy === `remind:${type}` ? 'Sending…' : label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-[#1D1D1F]/45">
                Resend re-sends the investor&rsquo;s active payment link; nudges send a friendly reminder email.
              </p>
            </Card>

            {/* Notes & tags */}
            <Card title="Notes & tags">
              {crmError && (
                <div className="mb-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium text-[#B42318]" style={{ backgroundColor: 'rgba(255,59,48,0.10)' }}>
                  {crmError}
                </div>
              )}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {investor.tags.length === 0 && <span className="text-[12.5px] text-[#1D1D1F]/45">No tags yet.</span>}
                {investor.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-1 text-[12px] font-semibold text-[#1D1D1F]">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={crmBusy}
                      className="text-[14px] leading-none text-[#1D1D1F]/40 transition hover:text-[#B42318] disabled:opacity-40"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form
                className="mb-5 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = tagDraft.trim();
                  if (t) {
                    addTag(t);
                    setTagDraft('');
                  }
                }}
              >
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="Add a tag…"
                  maxLength={40}
                  className="flex-1 rounded-full border-none bg-[#F5F5F7] px-4 py-2 text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                />
                <button type="submit" disabled={crmBusy || !tagDraft.trim()} className="rounded-full bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white transition disabled:opacity-40">
                  Add
                </button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = noteDraft.trim();
                  if (t) {
                    addNote(t);
                    setNoteDraft('');
                  }
                }}
              >
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={2}
                  placeholder="Add an internal note about this investor…"
                  className="w-full resize-y rounded-[14px] border-none bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                />
                <div className="mt-2 flex justify-end">
                  <button type="submit" disabled={crmBusy || !noteDraft.trim()} className="rounded-full bg-[#0066CC] px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                    {crmBusy ? 'Saving…' : 'Add note'}
                  </button>
                </div>
              </form>
              {investor.notes.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {investor.notes.map((n) => (
                    <div key={n.id} className="rounded-[14px] bg-[#F5F5F7] px-3.5 py-3">
                      <div className="whitespace-pre-wrap text-[13.5px] text-[#1D1D1F]">{n.body}</div>
                      <div className="mt-1 text-[11.5px] text-[#1D1D1F]/45">
                        {n.authorEmail ? `${n.authorEmail} · ` : ''}
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Audit truth */}
            <Card title="Onboarding audit">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <DetailItem label="NDA" value={investor.audit.ndaSigned ? 'Signed' : 'Missing'} />
                <DetailItem label="Bank linked" value={investor.audit.bankLinked ? 'Yes' : 'No'} />
                <DetailItem label="Financial data" value={investor.audit.financialDataStatus} />
                <DetailItem label="Financial link status" value={investor.audit.financialLinkStatus} />
                <DetailItem label="First payment" value={investor.audit.firstPaymentPaid ? 'Paid' : 'Not paid'} />
                <DetailItem label="Manual investor status" value={investor.audit.manualInvestorStatus} />
                <DetailItem label="KYC status" value={investor.audit.kycStatus} />
                <DetailItem label="Proof of funds" value={investor.audit.proofOfFunds} />
              </div>

              {investor.audit.missingPieces.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                    Missing / needs attention
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.audit.missingPieces.map((piece) => (
                      <Chip key={piece} label={auditLabel(piece)} tone="orange" />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                  Data sources
                </div>
                <div className="flex flex-wrap gap-2">
                  {investor.audit.dataSources.length > 0 ? (
                    investor.audit.dataSources.map((source) => (
                      <Chip key={source} label={source} tone="blue" />
                    ))
                  ) : (
                    <Chip label="No source rows found" />
                  )}
                </div>
              </div>
            </Card>

            {/* Parties & signatory (account-type accounts) */}
            {investor.accountType && investor.accountType !== 'individual' && (
              <Card title="Parties & signatory">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <DetailItem label="Application status" value={investor.applicationStatus ?? 'started'} />
                  <DetailItem
                    label="Signatory confirmed"
                    value={
                      investor.signatory?.confirmedAt
                        ? formatDateTime(investor.signatory.confirmedAt)
                        : 'No'
                    }
                  />
                </div>
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                    Additional parties
                  </div>
                  {investor.parties && investor.parties.length > 0 ? (
                    <div className="space-y-2">
                      {investor.parties.map((p, i) => (
                        <div
                          key={`${p.role}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-[12px] bg-[#F5F5F7] px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-[13px] text-[#1D1D1F]">
                            {(p.displayName || p.email || 'Invited party')} · {p.role.replace(/_/g, ' ')}
                          </span>
                          <Chip
                            label={p.status.replace(/_/g, ' ')}
                            tone={p.status === 'completed' ? 'green' : 'orange'}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Chip label="No additional parties invited yet" />
                  )}
                </div>
              </Card>
            )}

            {/* Funnel timeline */}
            <Card title="Funnel timeline">
              <TimelineStep
                label="NDA signed"
                done={Boolean(investor.timeline.ndaSignedAt)}
                detail={
                  investor.timeline.ndaSignedAt
                    ? `${formatDateTime(investor.timeline.ndaSignedAt)}${
                        investor.timeline.ndaVersion ? ` · ${investor.timeline.ndaVersion}` : ''
                      }`
                    : 'Not yet signed'
                }
              />
              <TimelineStep
                label="Meet the CEO"
                done={Boolean(investor.timeline.meetCeo?.paid)}
                detail={
                  investor.timeline.meetCeo?.paid
                    ? `Paid $1${
                        investor.timeline.meetCeo.meetingStartTime
                          ? ` · meeting ${formatDateTime(investor.timeline.meetCeo.meetingStartTime)}`
                          : investor.timeline.meetCeo.calendlyBooked
                            ? ' · call booked'
                            : ''
                      }`
                    : 'Not completed'
                }
              />
              <TimelineStep
                label="First payment ($1 activation)"
                done={Boolean(investor.timeline.firstPaidAt)}
                detail={
                  investor.timeline.firstPaidAt
                    ? formatDateTime(investor.timeline.firstPaidAt)
                    : 'Not paid'
                }
              />
              <TimelineStep
                label={investor.timeline.rejectedAt ? 'Rejected' : 'Verified'}
                done={Boolean(investor.timeline.verifiedAt || investor.timeline.rejectedAt)}
                detail={
                  investor.timeline.verifiedAt
                    ? formatDateTime(investor.timeline.verifiedAt)
                    : investor.timeline.rejectedAt
                      ? formatDateTime(investor.timeline.rejectedAt)
                      : 'Awaiting decision'
                }
                last
              />
            </Card>

            {/* Investment */}
            {investor.investment && (
              <Card title="Investment">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <DetailItem label="Fund" value={investor.investment.selectedFund} />
                  <DetailItem label="Commitment" value={investor.investment.commitment} />
                  <DetailItem label="First payment" value={investor.investment.firstPayment} />
                  <DetailItem
                    label="Units (A / B / C)"
                    value={`${investor.investment.units.a} / ${investor.investment.units.b} / ${investor.investment.units.c}`}
                  />
                  <DetailItem label="Recurring" value={investor.investment.recurring} />
                </div>
                {investor.investment.riskFlags.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                      Risk flags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {investor.investment.riskFlags.map((flag) => (
                        <Chip key={flag} label={flagLabel(flag)} tone="orange" />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Plaid */}
            <Card title="Linked financials (Plaid)">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <DetailItem label="Institution" value={investor.plaid.institution} />
                <DetailItem label="Sync status" value={investor.plaid.syncStatus} />
              </div>

              {investor.plaid.accounts.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                    Accounts
                  </div>
                  {investor.plaid.accounts.map((a, i) => (
                    <div
                      key={`${a.name}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-[14px] bg-[#F5F5F7] px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-[#1D1D1F]">
                          {a.name}
                          {a.mask && <span className="ml-1.5 text-[#1D1D1F]/45">••{a.mask}</span>}
                        </div>
                        <div className="text-[11.5px] text-[#1D1D1F]/50">
                          {[a.type, a.subtype].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                      <div className="shrink-0 text-[13.5px] font-semibold text-[#1D1D1F]">
                        {a.balance || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {investor.plaid.products.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                    Product sync
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.plaid.products.map((p) => (
                      <Chip
                        key={p.product}
                        tone={p.available ? 'green' : 'neutral'}
                        label={
                          <>
                            {p.product}
                            <span className="opacity-60">
                              {p.status}
                              {p.records != null ? ` (${p.records})` : ''}
                            </span>
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {investor.plaid.accounts.length === 0 && investor.plaid.products.length === 0 && (
                <p className="mt-3 text-[13px] text-[#1D1D1F]/45">No linked financial data.</p>
              )}
            </Card>

            {/* KYC */}
            <Card title="KYC / risk">
              {investor.kyc ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                    <DetailItem label="Status" value={investor.kyc.status} />
                    <DetailItem label="Risk band" value={investor.kyc.riskBand} />
                    <DetailItem label="Risk score" value={investor.kyc.riskScore} />
                    <DetailItem label="Sanctions" value={investor.kyc.sanctionsChecked ? 'Checked' : 'Not checked'} />
                    <DetailItem label="PEP" value={investor.kyc.pepChecked ? 'Checked' : 'Not checked'} />
                    <DetailItem label="AML score" value={investor.kyc.amlScore ?? '—'} />
                    <DetailItem label="Level" value={investor.kyc.verificationLevel} />
                    <DetailItem label="Provider" value={investor.kyc.provider} />
                    <DetailItem label="Verified at" value={formatDate(investor.kyc.verifiedAt)} />
                    <DetailItem label="Expires at" value={investor.kyc.expiresAt ? formatDate(investor.kyc.expiresAt) : '—'} />
                  </div>
                  {(!investor.kyc.sanctionsChecked || !investor.kyc.pepChecked || kycExpired) && (
                    <div
                      className="mt-3 rounded-[12px] px-3 py-2 text-[12.5px]"
                      style={{ backgroundColor: 'rgba(255,149,0,0.10)', color: '#B25A00' }}
                    >
                      {kycExpired && <span>This attestation has expired. </span>}
                      {(!investor.kyc.sanctionsChecked || !investor.kyc.pepChecked) && (
                        <span>No real sanctions/PEP screening on file — record a manual review or run an automated screen.</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-[#1D1D1F]/55">
                  No KYC attestation on file. Record a manual review below to clear or flag this investor.
                </p>
              )}

              {/* Record a manual KYC review (vendor-independent; satisfies the approval gate) */}
              <div className="mt-4 border-t border-[#1D1D1F]/[0.06] pt-4">
                {!kycReviewOpen ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setKycReviewOpen(true)}
                        className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-[#0066CC] transition hover:bg-[#F5F5F7]"
                        style={{ boxShadow: 'inset 0 0 0 1px rgba(0,102,204,0.30)' }}
                      >
                        Record KYC review
                      </button>
                      <button
                        type="button"
                        onClick={() => void runAutomatedScreen()}
                        disabled={screenBusy}
                        className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7] disabled:opacity-40"
                        style={{ boxShadow: 'inset 0 0 0 1px rgba(29,29,31,0.12)' }}
                      >
                        {screenBusy ? 'Screening…' : 'Run automated screen'}
                      </button>
                    </div>
                    {kycError && <div className="text-[12.5px] font-medium text-[#B42318]">{kycError}</div>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[13px] font-semibold text-[#1D1D1F]">Record a manual KYC review</div>
                    <p className="text-[12px] leading-[1.45] text-[#1D1D1F]/55">
                      Records the outcome of diligence you performed (e.g. a sanctions / PEP lookup). Writes a dated, audited
                      attestation — a “cleared” review satisfies the approval gate.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
                      <label className="flex items-center gap-2 text-[13px] text-[#1D1D1F]">
                        Risk band
                        <select
                          value={kycRiskBand}
                          onChange={(e) => setKycRiskBand(e.target.value)}
                          className="rounded-[10px] bg-[#F5F5F7] px-2.5 py-1.5 text-[13px] outline-none"
                          style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                        >
                          <option value="">Auto</option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 text-[13px] text-[#1D1D1F]">
                        <input
                          type="checkbox"
                          checked={kycSanctions}
                          onChange={(e) => setKycSanctions(e.target.checked)}
                          className="h-4 w-4 accent-[#0066CC]"
                        />
                        Sanctions checked
                      </label>
                      <label className="flex items-center gap-2 text-[13px] text-[#1D1D1F]">
                        <input
                          type="checkbox"
                          checked={kycPep}
                          onChange={(e) => setKycPep(e.target.checked)}
                          className="h-4 w-4 accent-[#0066CC]"
                        />
                        PEP checked
                      </label>
                    </div>
                    <textarea
                      value={kycReviewNote}
                      onChange={(e) => setKycReviewNote(e.target.value)}
                      rows={2}
                      placeholder="Reviewer note — what you checked, the source, the result…"
                      className="w-full rounded-[12px] bg-[#F5F5F7] px-3.5 py-2.5 text-[13px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                      style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                    />
                    {kycError && <div className="text-[12.5px] font-medium text-[#B42318]">{kycError}</div>}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        disabled={kycBusy}
                        onClick={() =>
                          void recordKycReview({
                            decision: 'cleared',
                            riskBand: kycRiskBand || undefined,
                            sanctionsChecked: kycSanctions,
                            pepChecked: kycPep,
                            note: kycReviewNote.trim() || undefined,
                          })
                        }
                        className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white transition disabled:opacity-40"
                        style={{ backgroundColor: '#34C759' }}
                      >
                        {kycBusy ? 'Saving…' : 'Mark cleared'}
                      </button>
                      <button
                        type="button"
                        disabled={kycBusy}
                        onClick={() =>
                          void recordKycReview({
                            decision: 'flagged',
                            riskBand: kycRiskBand || undefined,
                            sanctionsChecked: kycSanctions,
                            pepChecked: kycPep,
                            note: kycReviewNote.trim() || undefined,
                          })
                        }
                        className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white transition disabled:opacity-40"
                        style={{ backgroundColor: '#FF9500' }}
                      >
                        {kycBusy ? 'Saving…' : 'Flag'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setKycReviewOpen(false)}
                        className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium text-[#1D1D1F]/60 transition hover:bg-[#F5F5F7]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Review history */}
            {investor.reviews.length > 0 && (
              <Card title="Review history">
                <div className="space-y-3">
                  {investor.reviews.map((r, i) => (
                    <div key={i} className="rounded-[14px] bg-[#F5F5F7] px-3.5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={r.status} />
                        <span className="text-[12px] text-[#1D1D1F]/50">{formatDateTime(r.reviewedAt)}</span>
                      </div>
                      <div className="mt-1.5 text-[12.5px] text-[#1D1D1F]/60">
                        {r.reviewerEmail ? `By ${r.reviewerEmail}` : 'Reviewer unknown'}
                      </div>
                      {r.notes && <div className="mt-1 text-[13.5px] text-[#1D1D1F]">{r.notes}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Approve / reject */}
            {canReview ? (
              <Card title="Decision">
                <label
                  htmlFor="review-note"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45"
                >
                  Review note <span className="normal-case text-[#1D1D1F]/35">(required to reject)</span>
                </label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Compliance note, decision rationale, follow-ups…"
                  className="w-full resize-y rounded-[14px] border-none bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F] outline-none transition placeholder:text-[#1D1D1F]/35 focus:bg-white"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                />

                {(kycRisky || kycGate) && (
                  <div
                    className="mt-4 rounded-[14px] px-3.5 py-3 text-[13px]"
                    style={{ backgroundColor: 'rgba(255,149,0,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,149,0,0.20)' }}
                  >
                    <div className="font-semibold text-[#B25A00]">KYC review needed before approval</div>
                    <div className="mt-1 text-[#1D1D1F]/70">
                      {!investor.kyc
                        ? 'No KYC attestation on file for this investor.'
                        : `KYC status: ${investor.kyc.status ?? '—'} · risk band: ${investor.kyc.riskBand ?? '—'}.`}
                    </div>
                    <label className="mt-2.5 flex items-center gap-2 text-[13px] font-medium text-[#1D1D1F]">
                      <input
                        type="checkbox"
                        checked={kycAck}
                        onChange={(e) => setKycAck(e.target.checked)}
                        className="h-4 w-4 accent-[#0066CC]"
                      />
                      I have reviewed KYC and acknowledge the risk.
                    </label>
                  </div>
                )}

                {confirming ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-[14px] font-medium text-[#1D1D1F]">
                      {confirming === 'verified_investor'
                        ? `Approve ${investor.name} as a verified investor?`
                        : `Reject ${investor.name}? This is recorded against your account.`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirming === 'verified_investor') approve();
                        else reject();
                        setConfirming(null);
                      }}
                      disabled={actioning}
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: confirming === 'verified_investor' ? '#34C759' : '#FF3B30' }}
                    >
                      {actioning
                        ? 'Working…'
                        : `Confirm ${confirming === 'verified_investor' ? 'approval' : 'rejection'}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      disabled={actioning}
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#1D1D1F]/70 transition hover:opacity-75 disabled:opacity-40"
                      style={{ boxShadow: 'inset 0 0 0 1px rgba(29,29,31,0.15)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirming('verified_investor')}
                      disabled={actioning || (kycRisky && !kycAck)}
                      className="rounded-full px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: '#34C759' }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming('rejected')}
                      disabled={actioning}
                      className="rounded-full px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: '#FF3B30' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Card>
            ) : investor.investment && investor.investment.status !== 'pending_manual_verification' ? (
              <div
                className="rounded-[16px] bg-white px-4 py-3.5 text-[13px] text-[#1D1D1F]/55"
                style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
              >
                {investor.investment.status === 'verified_investor'
                  ? 'This investor is already verified.'
                  : investor.investment.status === 'rejected'
                    ? 'This investor was rejected.'
                    : 'Approval unlocks after Stripe confirms the first payment.'}
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
