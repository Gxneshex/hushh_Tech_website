import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFundAdminDetail, type FundReviewDecision } from './logic';
import {
  appleFont,
  DetailItem,
  StatusBadge,
  formatDateTime,
  formatDate,
  flagLabel,
} from '../shared';

const PIECE_LABELS: Record<string, string> = {
  missing_onboarding_row: 'Bank linked, but no onboarding row found',
  onboarding_financial_link_status_not_completed: 'Bank linked, onboarding status not marked complete',
  bank_not_linked: 'Bank not linked',
  nda_not_signed: 'NDA not signed',
  payment_not_started: 'Payment not started',
  first_payment_not_paid: 'First payment not paid',
  awaiting_manual_verification: 'Awaiting manual verification',
  kyc_not_found: 'KYC not found',
};

function auditLabel(value: string): string {
  return PIECE_LABELS[value] || value.replace(/_/g, ' ');
}

function AuditPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'green' | 'blue' | 'orange' | 'red' }) {
  const palette = {
    neutral: { bg: 'rgba(29,29,31,0.06)', fg: '#6E6E73' },
    green: { bg: 'rgba(52,199,89,0.10)', fg: '#1E7E34' },
    blue: { bg: 'rgba(0,102,204,0.10)', fg: '#0066CC' },
    orange: { bg: 'rgba(255,149,0,0.12)', fg: '#B25A00' },
    red: { bg: 'rgba(255,59,48,0.10)', fg: '#B42318' },
  }[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {label}
    </span>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-[22px] bg-white p-5 sm:p-6"
      style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
    >
      {title && (
        <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
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
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ backgroundColor: done ? '#34C759' : 'rgba(29,29,31,0.15)' }}
        >
          {done ? '✓' : ''}
        </div>
        {!last && (
          <div
            className="w-[2px] flex-grow"
            style={{ backgroundColor: done ? 'rgba(52,199,89,0.35)' : 'rgba(29,29,31,0.10)', minHeight: 18 }}
          />
        )}
      </div>
      <div className={last ? '' : 'pb-4'}>
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
  } = useFundAdminDetail(userId);

  const [confirming, setConfirming] = useState<FundReviewDecision | null>(null);

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      <header className="border-b border-[#1D1D1F]/[0.08] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-3">
          <Link
            to="/fund-admin"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0066CC]"
          >
            <span aria-hidden>‹</span> All investors
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#0066CC] transition disabled:opacity-40"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(0,102,204,0.35)' }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[860px] flex-grow px-4 pb-24 pt-6 sm:px-6">
        {loading && !investor ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#0066CC]" />
              <p className="mt-4 text-[14px] text-[#1D1D1F]/55">Loading investor…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[16px] px-4 py-4 text-[14px] font-medium text-[#B42318]"
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
                <div className="min-w-0">
                  <h1 className="text-[24px] font-semibold tracking-[-0.015em]">{investor.name}</h1>
                  <p className="mt-0.5 text-[14px] text-[#1D1D1F]/55 break-all">
                    {investor.email || 'No email on file'}
                  </p>
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

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
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
              </div>

              {investor.audit.missingPieces.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                    Missing / needs attention
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.audit.missingPieces.map((piece) => (
                      <AuditPill key={piece} label={auditLabel(piece)} tone="orange" />
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
                      <AuditPill key={source} label={source} tone="blue" />
                    ))
                  ) : (
                    <AuditPill label="No source rows found" />
                  )}
                </div>
              </div>
            </Card>

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
                        <span
                          key={flag}
                          className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ backgroundColor: 'rgba(255,149,0,0.12)', color: '#B25A00' }}
                        >
                          {flagLabel(flag)}
                        </span>
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
                      className="flex items-center justify-between gap-3 rounded-[12px] bg-[#F5F5F7] px-3.5 py-2.5"
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
                      <span
                        key={p.product}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                        style={{
                          backgroundColor: p.available ? 'rgba(52,199,89,0.10)' : 'rgba(29,29,31,0.06)',
                          color: p.available ? '#1E7E34' : '#6E6E73',
                        }}
                      >
                        {p.product}
                        <span className="opacity-60">
                          {p.status}
                          {p.records != null ? ` (${p.records})` : ''}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {investor.plaid.accounts.length === 0 && investor.plaid.products.length === 0 && (
                <p className="mt-3 text-[13px] text-[#1D1D1F]/45">No linked financial data.</p>
              )}
            </Card>

            {/* KYC */}
            {investor.kyc && (
              <Card title="KYC / risk">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <DetailItem label="Status" value={investor.kyc.status} />
                  <DetailItem label="Risk band" value={investor.kyc.riskBand} />
                  <DetailItem label="Risk score" value={investor.kyc.riskScore} />
                  <DetailItem label="Provider" value={investor.kyc.provider} />
                  <DetailItem label="Verified at" value={formatDate(investor.kyc.verifiedAt)} />
                </div>
              </Card>
            )}

            {/* Review history */}
            {investor.reviews.length > 0 && (
              <Card title="Review history">
                <div className="space-y-3">
                  {investor.reviews.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-[12px] bg-[#F5F5F7] px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={r.status} />
                        <span className="text-[12px] text-[#1D1D1F]/50">
                          {formatDateTime(r.reviewedAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[12.5px] text-[#1D1D1F]/60">
                        {r.reviewerEmail ? `By ${r.reviewerEmail}` : 'Reviewer unknown'}
                      </div>
                      {r.notes && (
                        <div className="mt-1 text-[13.5px] text-[#1D1D1F]">{r.notes}</div>
                      )}
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
                  Review note{' '}
                  <span className="normal-case text-[#1D1D1F]/35">(required to reject)</span>
                </label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Compliance note, decision rationale, follow-ups…"
                  className="w-full resize-y rounded-[14px] border-none bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
                />

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
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
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
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#1D1D1F]/70 transition disabled:opacity-40"
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
                      disabled={actioning}
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: '#34C759' }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming('rejected')}
                      disabled={actioning}
                      className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: '#FF3B30' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Card>
            ) : investor.investment && investor.investment.status !== 'pending_manual_verification' ? (
              <div className="rounded-[16px] bg-white px-4 py-3.5 text-[13px] text-[#1D1D1F]/55" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}>
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
