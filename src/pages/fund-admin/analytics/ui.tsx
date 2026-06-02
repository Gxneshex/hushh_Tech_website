import { Link } from 'react-router-dom';
import { useFundAdminAnalytics } from './logic';
import { appleFont, appleDisplayFont, Icon, HushhMark } from '../../../components/hushh-tech-ui/HushhAppleUI';

const CARD_SHADOW =
  '0 8px 24px rgba(29,29,31,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(29,29,31,0.06)';

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] bg-white p-5 sm:p-6" style={{ boxShadow: CARD_SHADOW }}>
      {title && (
        <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0066CC]/85">{title}</h2>
      )}
      {children}
    </section>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-[18px] bg-white px-4 py-4" style={{ boxShadow: CARD_SHADOW }}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">{label}</div>
      <div
        className="mt-1.5 font-medium leading-none tracking-[-0.03em]"
        style={{ color: accent || '#1D1D1F', fontSize: 26, fontFamily: appleDisplayFont }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-[#1D1D1F]/45">{sub}</div>}
    </div>
  );
}

// Horizontal bar row used by the funnel / capital / share-class charts.
function BarRow({
  label,
  value,
  pct,
  note,
  color = '#0066CC',
}: {
  label: string;
  value: string;
  pct: number;
  note?: string;
  color?: string;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium text-[#1D1D1F]">{label}</span>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#1D1D1F]">
          {value}
          {note && <span className="ml-2 text-[11.5px] font-normal text-[#1D1D1F]/45">{note}</span>}
        </span>
      </div>
      <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#F5F5F7]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const fmtDays = (n: number | null) => (n == null ? '—' : `${n} ${n === 1 ? 'day' : 'days'}`);
const weekLabel = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

export default function FundAdminAnalytics() {
  const { data, loading, error, refresh } = useFundAdminAnalytics();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F7] text-[#1D1D1F] antialiased" style={{ fontFamily: appleFont }}>
      {/* Glass header */}
      <header
        className="sticky top-0 z-40 border-b border-[#1D1D1F]/[0.06]"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/fund-admin" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0066CC] transition hover:opacity-75">
            {Icon.back('currentColor', 16)} Operations
          </Link>
          <div className="flex items-center gap-2.5">
            <HushhMark size={26} />
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

      <main className="mx-auto w-full max-w-[1040px] flex-grow px-4 pb-28 sm:px-6">
        {loading && !data ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
              <p className="mt-4 text-[13px] tracking-[0.02em] text-[#1D1D1F]/45">Crunching the numbers…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-8 rounded-[18px] px-5 py-4 text-[14px] font-medium text-[#B42318]"
            style={{ backgroundColor: 'rgba(255,59,48,0.10)', boxShadow: 'inset 0 0 0 1px rgba(255,59,48,0.18)' }}
          >
            {error}
          </div>
        ) : data ? (
          <>
            {/* Hero */}
            <section className="px-2 pb-8 pt-12 text-center">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0066CC]/85">Analytics</div>
              <h1
                className="mx-auto max-w-[680px] text-[30px] font-medium leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[42px]"
                style={{ fontFamily: appleDisplayFont, textWrap: 'balance' }}
              >
                Fund performance.
              </h1>
              <p className="mx-auto mt-3.5 max-w-[480px] text-[15px] font-light leading-[1.45] text-[#1D1D1F]/55 sm:text-[17px]">
                Conversion, capital and AUM across {data.totalInvestors} investor{data.totalInvestors === 1 ? '' : 's'} in the funnel.
              </p>
            </section>

            {/* Totals strip */}
            <div className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="AUM (verified)" value={data.totals.aum} accent="#1E7E34" />
              <StatTile label="Committed" value={data.totals.committed} />
              <StatTile label="Collected" value={data.totals.collected} accent="#0066CC" />
              <StatTile label="Recurring / mo" value={data.totals.recurringMonthly} sub={`${data.totals.recurringCount} active`} accent="#7D3CB5" />
              <StatTile label="Verified" value={data.funnel.find((s) => s.key === 'verified')?.count ?? 0} accent="#1E7E34" />
              <StatTile label="Met CEO" value={data.meetCeoDone} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Funnel conversion */}
              <Card title="Funnel conversion">
                <div>
                  {data.funnel.map((s) => (
                    <BarRow
                      key={s.key}
                      label={s.label}
                      value={String(s.count)}
                      pct={s.conversionFromTop ?? 0}
                      note={s.conversionFromPrev != null && s.key !== 'entered' ? `${s.conversionFromPrev}% of prev` : undefined}
                      color={s.key === 'verified' ? '#34C759' : s.key === 'first_paid' ? '#0066CC' : '#1D1D1F'}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-[#1D1D1F]/45">Bar width is the share of everyone who entered the funnel.</p>
              </Card>

              {/* Time in stage */}
              <Card title="Median time in stage">
                <div className="grid grid-cols-1 gap-2.5">
                  <StatTile label="NDA → Onboarding complete" value={fmtDays(data.timeInStageDays.ndaToOnboarding)} />
                  <StatTile label="Onboarding → $1 paid" value={fmtDays(data.timeInStageDays.onboardingToPaid)} accent="#0066CC" />
                  <StatTile label="$1 paid → Verified" value={fmtDays(data.timeInStageDays.paidToVerified)} accent="#1E7E34" />
                </div>
              </Card>

              {/* Capital over time */}
              <Card title="Capital collected (weekly)">
                {data.capitalWeekly.length === 0 ? (
                  <p className="text-[13px] text-[#1D1D1F]/45">No payments collected yet.</p>
                ) : (
                  <div>
                    {(() => {
                      const max = Math.max(...data.capitalWeekly.map((w) => w.collectedCents), 1);
                      return data.capitalWeekly.map((w) => (
                        <BarRow
                          key={w.weekStart}
                          label={`Week of ${weekLabel(w.weekStart)}`}
                          value={w.collected}
                          pct={(w.collectedCents / max) * 100}
                          note={`${w.payments} pmt${w.payments === 1 ? '' : 's'}`}
                          color="#0066CC"
                        />
                      ));
                    })()}
                  </div>
                )}
              </Card>

              {/* By share class */}
              <Card title="Units by share class">
                {(() => {
                  const sc = data.byShareClass;
                  const max = Math.max(sc.a, sc.b, sc.c, 1);
                  return (
                    <div>
                      <BarRow label="Class A" value={`${sc.a} units`} pct={(sc.a / max) * 100} color="#1D1D1F" />
                      <BarRow label="Class B" value={`${sc.b} units`} pct={(sc.b / max) * 100} color="#B25A00" />
                      <BarRow label="Class C" value={`${sc.c} units`} pct={(sc.c / max) * 100} color="#0066CC" />
                    </div>
                  );
                })()}
                <p className="mt-3 text-[11.5px] text-[#1D1D1F]/45">Across activated ($1 paid) investors.</p>
              </Card>
            </div>

            {/* By fund */}
            <div className="mt-4">
              <Card title="By fund">
                {data.byFund.length === 0 ? (
                  <p className="text-[13px] text-[#1D1D1F]/45">No fund data yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-[14px]" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(29,29,31,0.08)' }}>
                    {data.byFund.map((f, idx) => (
                      <div
                        key={f.fund}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        style={{ borderTop: idx === 0 ? 'none' : '0.5px solid rgba(29,29,31,0.08)' }}
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[#1D1D1F]">{f.label}</div>
                          <div className="text-[12px] text-[#1D1D1F]/50">{f.investors} investor{f.investors === 1 ? '' : 's'}</div>
                        </div>
                        <div className="flex items-center gap-5 text-right">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1D1D1F]/40">Committed</div>
                            <div className="text-[14px] font-semibold text-[#1D1D1F]">{f.committed}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1D1D1F]/40">Approved</div>
                            <div className="text-[14px] font-semibold text-[#1E7E34]">{f.approved}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* KYC */}
            <div className="mt-4">
              <Card title="KYC coverage & risk">
                <div className="flex flex-wrap items-center gap-4">
                  <StatTile
                    label="KYC coverage"
                    value={data.kyc.coveragePct != null ? `${data.kyc.coveragePct}%` : '—'}
                    sub={`${data.kyc.covered} of ${data.totalInvestors}`}
                  />
                  <div className="flex flex-1 flex-wrap gap-2">
                    {([['LOW', '#1E7E34'], ['MEDIUM', '#B25A00'], ['HIGH', '#B42318'], ['unknown', '#6E6E73']] as const).map(([band, color]) => (
                      <span
                        key={band}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold capitalize"
                        style={{ backgroundColor: `${color}1A`, color }}
                      >
                        {band.toLowerCase()}: {data.kyc.riskBands[band]}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
