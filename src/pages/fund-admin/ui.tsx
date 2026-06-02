import { Link } from 'react-router-dom';
import { useFundAdminOverview, type FundAdminTab, type FundInvestorRow } from './logic';
import {
  appleFont,
  appleDisplayFont,
  Chip,
  SectionEyebrow,
  StageBadge,
  StatTile,
  formatDate,
} from './shared';
import { HushhMark, Icon } from '../../components/hushh-tech-ui/HushhAppleUI';

const TAB_LABELS: { key: FundAdminTab; label: string }[] = [
  { key: 'needs_attention', label: 'Needs attention' },
  { key: 'completed_onboarding', label: 'Completed onboarding' },
  { key: 'bank_linked', label: 'Bank linked' },
  { key: 'payment_review', label: 'Payment / review' },
  { key: 'manually_approved', label: 'Manually approved' },
  { key: 'all', label: 'All' },
];

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

function InvestorRow({ row, highlighted }: { row: FundInvestorRow; highlighted: boolean }) {
  // A compact, scannable row. The whole row deep-links to the full profile,
  // where the team reviews everything before Approve/Reject (compliance-sound:
  // decide only after seeing Plaid, KYC, commitment and the funnel timeline).
  const dateLabel =
    row.manualInvestorStatus === 'verified_investor'
      ? `Manually approved ${formatDate(row.verifiedAt)}`
      : row.manualInvestorStatus === 'rejected'
        ? `Rejected ${formatDate(row.rejectedAt)}`
        : row.paidAt
          ? `Paid ${formatDate(row.paidAt)}`
          : row.onboardingComplete
            ? 'Onboarding complete'
            : row.bankLinked
              ? 'Bank linked'
              : row.ndaSignedAt
                ? `NDA ${formatDate(row.ndaSignedAt)}`
                : row.currentStep
                  ? `Onboarding step ${row.currentStep}`
                  : 'No activity yet';

  return (
    <Link
      to={`/fund-admin/${row.userId}`}
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-[#F5F5F7]/70 sm:px-5"
      style={{ borderLeft: highlighted ? '3px solid #0066CC' : '3px solid transparent' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
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
            <span className="ml-2 font-mono text-[11px] text-[#1D1D1F]/40">{row.requestReference}</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {row.ndaSigned && <Chip label="NDA" tone="green" />}
          {row.bankLinked && (
            <Chip
              label={`Bank ${row.financialDataStatus}`}
              tone={row.financialDataStatus === 'complete' ? 'green' : 'blue'}
            />
          )}
          {row.onboardingComplete && <Chip label="Onboarding complete" tone="green" />}
          {row.firstPaymentPaid && <Chip label="$1 paid" tone="blue" />}
          {row.manualInvestorStatus === 'verified_investor' && <Chip label="Manual approved" tone="green" />}
          {row.manualInvestorStatus === 'rejected' && <Chip label="Rejected" tone="red" />}
          {row.missingPieces.slice(0, 2).map((piece) => (
            <Chip key={piece} label={auditLabel(piece)} tone="orange" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[14px] font-semibold text-[#1D1D1F]">{row.commitmentLabel || '—'}</div>
          <div className="mt-0.5 text-[11.5px] text-[#1D1D1F]/50">{dateLabel}</div>
          {row.institutionName && (
            <div className="mt-0.5 max-w-[180px] truncate text-[11.5px] text-[#1D1D1F]/40">
              {row.institutionName}
            </div>
          )}
        </div>
        <StageBadge stage={row.stage} />
        <span className="text-[#1D1D1F]/25" aria-hidden>
          {Icon.chevronRight('currentColor', 15)}
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
    sourceWarnings,
    loading,
    listLoading,
    error,
    tab,
    setTab,
    search,
    setSearch,
    counts,
    filtered,
    total,
    hasMore,
    loadMore,
    exporting,
    exportCsv,
    refresh,
  } = useFundAdminOverview();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased"
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
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <HushhMark size={30} />
            <div className="leading-none">
              <div className="text-[15px] font-semibold tracking-[-0.01em]">Hushh Fund</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0066CC]/85">
                Operations
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {reviewerEmail && (
              <span className="hidden max-w-[200px] truncate text-[12.5px] text-[#1D1D1F]/50 sm:inline">
                {reviewerEmail}
              </span>
            )}
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting || filtered.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7] disabled:opacity-40"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(29,29,31,0.12)' }}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-grow px-4 pb-28 sm:px-6">
        {loading && !funnel ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
              <p className="mt-4 text-[13px] tracking-[0.02em] text-[#1D1D1F]/45">Loading the onboarding audit…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-8 rounded-[18px] px-5 py-4 text-[14px] font-medium text-[#B42318]"
            style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
          >
            {error}
          </div>
        ) : (
          <>
            {/* ═══ Hero band ═══ */}
            <section className="px-2 pb-9 pt-12 text-center">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0066CC]/85">
                Investor Operations
              </div>
              <h1
                className="mx-auto max-w-[680px] text-[30px] font-medium leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[42px]"
                style={{ fontFamily: appleDisplayFont, textWrap: 'balance' }}
              >
                Your fund, end to end.
              </h1>
              <p className="mx-auto mt-3.5 max-w-[480px] text-[15px] font-light leading-[1.45] text-[#1D1D1F]/55 sm:text-[17px]">
                NDA, bank link, onboarding, payment and review — every investor signal in one live audit.
              </p>
            </section>

            {/* ① Funnel strip */}
            {funnel && (
              <section className="mb-8">
                <SectionEyebrow className="mb-3">Onboarding audit</SectionEyebrow>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                  <StatTile label="NDA signed" value={funnel.ndaSigned} />
                  <StatTile label="Bank linked" value={funnel.bankLinked} accent="#0066CC" />
                  <StatTile label="Financial ready" value={funnel.financialDataReady} accent="#1E7E34" />
                  <StatTile label="Financial partial" value={funnel.financialDataPartial} accent="#B25A00" />
                  <StatTile label="Onboarding complete" value={funnel.onboardingComplete} />
                  <StatTile label="Payment link sent" value={funnel.paymentLinkSent} />
                  <StatTile label="$1 paid" value={funnel.firstPaymentPaid} accent="#0066CC" />
                  <StatTile label="Manual approved" value={funnel.verified} accent="#1E7E34" />
                </div>

                <SectionEyebrow className="mb-3 mt-6">Review</SectionEyebrow>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <StatTile label="Needs attention" value={funnel.needsAttention} accent="#B25A00" topAccent="#FF9500" />
                  <StatTile label="Met CEO" value={funnel.meetCeoDone} />
                  <StatTile label="Awaiting review" value={funnel.pendingReview} accent="#0066CC" />
                  <StatTile label="Rejected" value={funnel.rejected} accent="#B42318" />
                </div>

                <SectionEyebrow className="mb-3 mt-6">Capital</SectionEyebrow>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <StatTile label="Committed" value={funnel.money.committed} emphasis topAccent="#0066CC" />
                  <StatTile label="Approved" value={funnel.money.approved} accent="#1E7E34" emphasis topAccent="#34C759" />
                  <StatTile label="Collected" value={funnel.money.collected} accent="#0066CC" emphasis topAccent="#0066CC" />
                </div>
              </section>
            )}

            {sourceWarnings.length > 0 && (
              <div
                className="mb-5 rounded-[16px] px-4 py-3 text-[13px] text-[#B25A00]"
                style={{ backgroundColor: 'rgba(255,149,0,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,149,0,0.18)' }}
              >
                Some optional sources could not be read. Dashboard is showing available data only:{' '}
                {sourceWarnings.map((w) => w.source).join(', ')}.
              </div>
            )}

            {/* ② Tabs + search */}
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              {TAB_LABELS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition active:scale-[0.98]"
                    style={active ? { backgroundColor: '#1D1D1F', color: '#FFFFFF' } : { backgroundColor: '#F5F5F7', color: '#1D1D1F' }}
                  >
                    {t.label}
                    <span
                      className="rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums"
                      style={
                        active
                          ? { backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }
                          : { backgroundColor: 'rgba(29,29,31,0.06)', color: 'rgba(29,29,31,0.55)' }
                      }
                    >
                      {counts[t.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative mb-4">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                {Icon.search('rgba(29,29,31,0.35)', 16)}
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, institution, source or reference…"
                className="w-full rounded-full border-none bg-[#F5F5F7] py-3 pl-11 pr-4 text-[14px] text-[#1D1D1F] outline-none transition placeholder:text-[#1D1D1F]/35 focus:bg-white"
                style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.10)' }}
              />
            </div>

            {/* ③ Investor list */}
            {filtered.length === 0 ? (
              <div
                className="rounded-[22px] bg-white px-5 py-14 text-center text-[14px] text-[#1D1D1F]/55"
                style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.08)' }}
              >
                {listLoading
                  ? 'Loading investors…'
                  : search
                    ? 'No investors match your search.'
                    : 'No investors in this list yet.'}
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-[22px] bg-white"
                style={{ boxShadow: '0 8px 24px rgba(29,29,31,0.06), inset 0 0 0 0.5px rgba(29,29,31,0.06)' }}
              >
                {filtered.map((row, idx) => (
                  <div
                    key={row.userId}
                    style={{ borderTop: idx === 0 ? 'none' : '0.5px solid rgba(29,29,31,0.08)' }}
                  >
                    <InvestorRow
                      row={row}
                      highlighted={Boolean(highlightRef && row.requestReference === highlightRef)}
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 text-center text-[12px] text-[#1D1D1F]/40">
              Tap any investor to see exactly which data sources exist and what is still missing.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
