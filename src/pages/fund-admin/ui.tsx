import { Link } from 'react-router-dom';
import { useFundAdminOverview, type FundAdminTab, type FundInvestorRow } from './logic';
import { appleFont, StageBadge, formatDate } from './shared';

// ── Funnel & money strip ───────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      className="rounded-[16px] bg-white px-4 py-3.5"
      style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#1D1D1F]/45">
        {label}
      </div>
      <div
        className="mt-1 text-[24px] font-semibold tracking-[-0.02em]"
        style={{ color: accent || '#1D1D1F' }}
      >
        {value}
      </div>
    </div>
  );
}

const TAB_LABELS: { key: FundAdminTab; label: string }[] = [
  { key: 'awaiting_review', label: 'Awaiting review' },
  { key: 'verified', label: 'Verified' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

function InvestorRow({ row, highlighted }: { row: FundInvestorRow; highlighted: boolean }) {
  // A compact, scannable row. The whole row deep-links to the full profile,
  // where the team reviews everything before Approve/Reject (compliance-sound:
  // decide only after seeing Plaid, KYC, commitment and the funnel timeline).
  const dateLabel =
    row.stage === 'verified'
      ? `Verified ${formatDate(row.verifiedAt)}`
      : row.stage === 'rejected'
        ? `Rejected ${formatDate(row.rejectedAt)}`
        : row.paidAt
          ? `Paid ${formatDate(row.paidAt)}`
          : row.ndaSignedAt
            ? `NDA ${formatDate(row.ndaSignedAt)}`
            : row.currentStep
              ? `Onboarding step ${row.currentStep}`
              : 'No activity yet';

  return (
    <Link
      to={`/fund-admin/${row.userId}`}
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[#F5F5F7] sm:px-5"
      style={{
        borderLeft: highlighted ? '3px solid #0066CC' : '3px solid transparent',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-[#1D1D1F]">
            {row.recipientName}
          </span>
          {row.riskFlags.length > 0 && (
            <span
              title={`${row.riskFlags.length} risk flag(s)`}
              className="inline-flex h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ backgroundColor: '#FF9500' }}
            />
          )}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-[#1D1D1F]/55">
          {row.userEmail || 'No email on file'}
          {row.requestReference && (
            <span className="ml-2 font-mono text-[11px] text-[#1D1D1F]/40">
              {row.requestReference}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[14px] font-semibold text-[#1D1D1F]">
            {row.commitmentLabel || '—'}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[#1D1D1F]/50">{dateLabel}</div>
        </div>
        <StageBadge stage={row.stage} />
        <span className="text-[#1D1D1F]/30" aria-hidden>
          ›
        </span>
      </div>
    </Link>
  );
}

export default function FundAdminPage() {
  const {
    reviewerEmail,
    highlightRef,
    funnel,
    loading,
    error,
    tab,
    setTab,
    search,
    setSearch,
    counts,
    filtered,
    refresh,
  } = useFundAdminOverview();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      <header className="border-b border-[#1D1D1F]/[0.08] px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.015em]">
              Hushh Fund — Investor Operations
            </h1>
            <p className="mt-0.5 text-[13px] text-[#1D1D1F]/55">
              {reviewerEmail ? `Signed in as ${reviewerEmail}` : 'Team operations console'}
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

      <main className="mx-auto w-full max-w-[1040px] flex-grow px-4 pb-24 pt-6 sm:px-6">
        {loading && !funnel ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#0066CC]" />
              <p className="mt-4 text-[14px] text-[#1D1D1F]/55">Loading the fund pipeline…</p>
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
            {/* ① Funnel strip */}
            {funnel && (
              <section className="mb-6">
                <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                  Pipeline
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="NDA signed" value={funnel.ndaSigned} />
                  <StatCard label="Met CEO" value={funnel.meetCeoDone} />
                  <StatCard label="$1 activated" value={funnel.firstPaymentPaid} />
                  <StatCard label="Awaiting review" value={funnel.pendingReview} accent="#0066CC" />
                  <StatCard label="Verified" value={funnel.verified} accent="#1E7E34" />
                  <StatCard label="Rejected" value={funnel.rejected} accent="#B42318" />
                </div>

                <h2 className="mb-2.5 mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
                  Capital
                </h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <StatCard label="Committed" value={funnel.money.committed} />
                  <StatCard label="Approved" value={funnel.money.approved} accent="#1E7E34" />
                  <StatCard label="Collected" value={funnel.money.collected} accent="#0066CC" />
                </div>
              </section>
            )}

            {/* ② Tabs + search */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {TAB_LABELS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition"
                    style={
                      active
                        ? { backgroundColor: '#1D1D1F', color: '#FFFFFF' }
                        : { backgroundColor: '#F5F5F7', color: '#1D1D1F' }
                    }
                  >
                    {t.label}
                    <span className={active ? 'ml-1.5 text-white/60' : 'ml-1.5 text-[#1D1D1F]/40'}>
                      {counts[t.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or reference…"
              className="mb-4 w-full rounded-[14px] border-none bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
              style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
            />

            {/* ③ Investor list */}
            {filtered.length === 0 ? (
              <div className="rounded-[18px] bg-[#F5F5F7] px-5 py-10 text-center text-[14px] text-[#1D1D1F]/55">
                {search ? 'No investors match your search.' : 'No investors in this list yet.'}
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-[18px]"
                style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
              >
                {filtered.map((row, idx) => (
                  <div
                    key={row.userId}
                    style={{ borderTop: idx === 0 ? 'none' : '0.5px solid rgba(29,29,31,0.10)' }}
                  >
                    <InvestorRow
                      row={row}
                      highlighted={Boolean(highlightRef && row.requestReference === highlightRef)}
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-center text-[12px] text-[#1D1D1F]/40">
              Tap any investor to open their full profile and approve or reject.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
