import { useState } from 'react';
import { useFundAdminLogic, type FundAdminInvestorRow, type FundReviewDecision } from './logic';
import { appleFont } from '../../components/hushh-tech-ui/HushhAppleUI';

const FLAG_LABELS: Record<string, string> = {
  minimum_payment_against_large_commitment: 'Minimum payment vs. large commitment',
  weak_or_skipped_plaid_data: 'Weak / skipped Plaid data',
  recurring_requires_manual_activation: 'Recurring needs manual activation',
};

const flagLabel = (flag: string): string =>
  FLAG_LABELS[flag] || flag.replace(/_/g, ' ');

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    verified_investor: { bg: 'rgba(52,199,89,0.12)', fg: '#1E7E34', label: 'Verified' },
    rejected: { bg: 'rgba(255,59,48,0.12)', fg: '#B42318', label: 'Rejected' },
    pending_manual_verification: { bg: 'rgba(0,102,204,0.12)', fg: '#0066CC', label: 'Pending review' },
  };
  const style = map[status] || { bg: 'rgba(29,29,31,0.08)', fg: '#1D1D1F', label: status };
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {style.label}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-medium text-[#1D1D1F] break-words">
        {value === null || value === undefined || value === '' ? '—' : value}
      </div>
    </div>
  );
}

function PendingCard({
  row,
  note,
  setNote,
  approve,
  reject,
  isActioning,
  isHighlighted,
}: {
  row: FundAdminInvestorRow;
  note: string;
  setNote: (id: string, note: string) => void;
  approve: (row: FundAdminInvestorRow) => void;
  reject: (row: FundAdminInvestorRow) => void;
  isActioning: boolean;
  isHighlighted: boolean;
}) {
  const canApprove = Boolean(row.paidAt);
  const [confirming, setConfirming] = useState<FundReviewDecision | null>(null);
  return (
    <article
      className="rounded-[22px] bg-white p-5 sm:p-6"
      style={{
        boxShadow: isHighlighted
          ? 'inset 0 0 0 2px #0066CC'
          : 'inset 0 0 0 0.5px rgba(29,29,31,0.10)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
            {row.recipientName}
          </h3>
          <p className="mt-0.5 text-[13px] text-[#1D1D1F]/55 break-all">
            {row.userEmail || 'No email on file'}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={row.status} />
          {row.requestReference && (
            <p className="mt-1.5 font-mono text-[11px] text-[#1D1D1F]/45">
              {row.requestReference}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <DetailItem label="Fund" value={row.selectedFund} />
        <DetailItem label="Commitment" value={row.commitmentLabel} />
        <DetailItem label="First payment" value={row.firstPaymentLabel} />
        <DetailItem
          label="Units (A / B / C)"
          value={`${row.classAUnits} / ${row.classBUnits} / ${row.classCUnits}`}
        />
        <DetailItem label="Plaid status" value={row.plaidStatus} />
        <DetailItem label="KYC status" value={row.kycStatus} />
        <DetailItem label="Recurring" value={row.recurringSummary} />
        <DetailItem label="Paid at" value={formatDateTime(row.paidAt)} />
      </div>

      {row.riskFlags.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
            Risk flags
          </div>
          <div className="flex flex-wrap gap-2">
            {row.riskFlags.map((flag) => (
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

      <div className="mt-5">
        <label
          htmlFor={`note-${row.paymentRequestId}`}
          className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45"
        >
          Review note <span className="normal-case text-[#1D1D1F]/35">(required to reject)</span>
        </label>
        <textarea
          id={`note-${row.paymentRequestId}`}
          value={note}
          onChange={(e) => setNote(row.paymentRequestId, e.target.value)}
          rows={2}
          placeholder="Compliance note, decision rationale, follow-ups…"
          className="w-full resize-y rounded-[14px] border-none bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
          style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
        />
      </div>

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[14px] font-medium text-[#1D1D1F]">
            {confirming === 'verified_investor'
              ? `Approve ${row.recipientName} as a verified investor?`
              : `Reject ${row.recipientName}? This is recorded against your account.`}
          </span>
          <button
            type="button"
            onClick={() => {
              if (confirming === 'verified_investor') approve(row);
              else reject(row);
            }}
            disabled={isActioning}
            className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: confirming === 'verified_investor' ? '#34C759' : '#FF3B30' }}
          >
            {isActioning ? 'Working…' : `Confirm ${confirming === 'verified_investor' ? 'approval' : 'rejection'}`}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(null)}
            disabled={isActioning}
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
            disabled={isActioning || !canApprove}
            className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: '#34C759' }}
            title={canApprove ? undefined : 'Awaiting Stripe payment confirmation'}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setConfirming('rejected')}
            disabled={isActioning}
            className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: '#FF3B30' }}
          >
            Reject
          </button>
          {!canApprove && (
            <span className="self-center text-[12px] text-[#1D1D1F]/45">
              Approval unlocks after Stripe confirms payment.
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export default function FundAdminPage() {
  const {
    reviewerEmail,
    highlightRef,
    pending,
    reviewed,
    loading,
    error,
    notesById,
    setNote,
    approve,
    reject,
    actioningId,
    actionError,
    banner,
    refresh,
  } = useFundAdminLogic();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      <header className="border-b border-[#1D1D1F]/[0.08] px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-[960px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
              Hushh Fund — Investor Verification
            </h1>
            <p className="mt-0.5 text-[13px] text-[#1D1D1F]/55">
              {reviewerEmail ? `Signed in as ${reviewerEmail}` : 'Team review console'}
            </p>
          </div>
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

      <main className="mx-auto w-full max-w-[960px] flex-grow px-4 pb-24 pt-6 sm:px-6">
        {banner && (
          <div
            className="mb-5 rounded-[16px] px-4 py-3.5 text-[14px] font-medium text-[#1E7E34]"
            style={{ backgroundColor: 'rgba(52,199,89,0.12)', boxShadow: 'inset 0 0 0 1px rgba(52,199,89,0.20)' }}
          >
            {banner}
          </div>
        )}
        {actionError && (
          <div
            className="mb-5 rounded-[16px] px-4 py-3.5 text-[14px] font-medium text-[#B42318]"
            style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
          >
            {actionError}
          </div>
        )}

        {loading && pending.length === 0 && reviewed.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066CC] mx-auto" />
              <p className="mt-4 text-[14px] text-[#1D1D1F]/55">Loading investors…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-[16px] px-4 py-4 text-[14px] font-medium text-[#B42318]"
            style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
          >
            {error}
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
                  Awaiting review
                </h2>
                <span className="text-[13px] text-[#1D1D1F]/45">
                  {pending.length} pending
                </span>
              </div>
              {pending.length === 0 ? (
                <div className="rounded-[18px] bg-[#F5F5F7] px-5 py-8 text-center text-[14px] text-[#1D1D1F]/55">
                  No investors awaiting review.
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((row) => (
                    <PendingCard
                      key={row.paymentRequestId}
                      row={row}
                      note={notesById[row.paymentRequestId] || ''}
                      setNote={setNote}
                      approve={approve}
                      reject={reject}
                      isActioning={actioningId === row.paymentRequestId}
                      isHighlighted={Boolean(highlightRef && row.requestReference === highlightRef)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-[16px] font-semibold tracking-[-0.01em]">
                Recently reviewed
              </h2>
              {reviewed.length === 0 ? (
                <div className="rounded-[18px] bg-[#F5F5F7] px-5 py-6 text-center text-[14px] text-[#1D1D1F]/55">
                  No recent reviews.
                </div>
              ) : (
                <div className="overflow-hidden rounded-[18px]" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}>
                  {reviewed.map((row, idx) => (
                    <div
                      key={row.paymentRequestId}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                      style={{ borderTop: idx === 0 ? 'none' : '0.5px solid rgba(29,29,31,0.10)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-[#1D1D1F]">
                          {row.recipientName}
                          {row.requestReference && (
                            <span className="ml-2 font-mono text-[11px] text-[#1D1D1F]/40">
                              {row.requestReference}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#1D1D1F]/50">
                          {row.reviewedBy ? `By ${row.reviewedBy}` : 'Reviewer unknown'} · {formatDateTime(row.reviewedAt)}
                          {row.reviewerNote ? ` · ${row.reviewerNote}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
