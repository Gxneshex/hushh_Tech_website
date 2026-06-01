// Shared presentational helpers for the /fund-admin cockpit (overview + detail).
import { appleFont } from '../../components/hushh-tech-ui/HushhAppleUI';

export { appleFont };

export const FLAG_LABELS: Record<string, string> = {
  minimum_payment_against_large_commitment: 'Minimum payment vs. large commitment',
  weak_or_skipped_plaid_data: 'Weak / skipped Plaid data',
  recurring_requires_manual_activation: 'Recurring needs manual activation',
};

export const flagLabel = (flag: string): string => FLAG_LABELS[flag] || flag.replace(/_/g, ' ');

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

// Furthest-stage metadata — drives the stage chips in the list and detail header.
export const STAGE_META: Record<string, { label: string; bg: string; fg: string }> = {
  verified: { label: 'Verified', bg: 'rgba(52,199,89,0.12)', fg: '#1E7E34' },
  awaiting_review: { label: 'Awaiting review', bg: 'rgba(0,102,204,0.12)', fg: '#0066CC' },
  meet_ceo: { label: 'Met CEO', bg: 'rgba(175,82,222,0.12)', fg: '#7D3CB5' },
  onboarding: { label: 'In onboarding', bg: 'rgba(255,149,0,0.14)', fg: '#B25A00' },
  nda_signed: { label: 'NDA signed', bg: 'rgba(29,29,31,0.06)', fg: '#3A3A3C' },
  rejected: { label: 'Rejected', bg: 'rgba(255,59,48,0.12)', fg: '#B42318' },
  lead: { label: 'Lead', bg: 'rgba(29,29,31,0.06)', fg: '#6E6E73' },
};

export function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_META[stage] || { label: stage, bg: 'rgba(29,29,31,0.08)', fg: '#1D1D1F' };
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    verified_investor: { bg: 'rgba(52,199,89,0.12)', fg: '#1E7E34', label: 'Verified' },
    rejected: { bg: 'rgba(255,59,48,0.12)', fg: '#B42318', label: 'Rejected' },
    pending_manual_verification: { bg: 'rgba(0,102,204,0.12)', fg: '#0066CC', label: 'Pending review' },
    paid: { bg: 'rgba(0,102,204,0.12)', fg: '#0066CC', label: 'Paid' },
    payment_link_sent: { bg: 'rgba(29,29,31,0.06)', fg: '#6E6E73', label: 'Link sent' },
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

export function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[14px] font-medium text-[#1D1D1F] break-words ${mono ? 'font-mono text-[13px]' : ''}`}
      >
        {empty ? '—' : value}
      </div>
    </div>
  );
}
