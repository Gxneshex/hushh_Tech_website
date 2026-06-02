// Shared presentational helpers for the /fund-admin cockpit (overview + detail).
// Visual language mirrors the marketing pages (HushhAppleUI): SF Pro type,
// -0.028em display tracking, soft elevated white cards, and SYS color tokens.
import type { ReactNode } from 'react';
import { appleFont, appleDisplayFont, SYS } from '../../components/hushh-tech-ui/HushhAppleUI';

export { appleFont, appleDisplayFont, SYS };

// Soft, elevated white surface — the marketing-grade card used across the cockpit.
export const CARD_SHADOW =
  '0 8px 24px rgba(29,29,31,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(29,29,31,0.06)';

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
  manual_approved: { label: 'Manual approved', bg: 'rgba(52,199,89,0.12)', fg: '#1E7E34' },
  awaiting_manual_review: { label: 'Awaiting review', bg: 'rgba(0,102,204,0.12)', fg: '#0066CC' },
  payment_started: { label: 'Payment started', bg: 'rgba(0,102,204,0.10)', fg: '#0066CC' },
  onboarding_complete: { label: 'Onboarding complete', bg: 'rgba(52,199,89,0.10)', fg: '#1E7E34' },
  bank_linked: { label: 'Bank linked', bg: 'rgba(0,102,204,0.10)', fg: '#0066CC' },
  in_onboarding: { label: 'In onboarding', bg: 'rgba(255,149,0,0.14)', fg: '#B25A00' },
  nda_signed: { label: 'NDA signed', bg: 'rgba(29,29,31,0.06)', fg: '#3A3A3C' },
  manual_rejected: { label: 'Rejected', bg: 'rgba(255,59,48,0.12)', fg: '#B42318' },
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
    verified_investor: { bg: 'rgba(52,199,89,0.12)', fg: '#1E7E34', label: 'Manual approved' },
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

// ── Premium primitives (shared by overview + detail) ────────────────

// Elevated white card. Optional eyebrow title.
export function Card({
  title,
  right,
  children,
  className = '',
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] bg-white p-5 sm:p-6 ${className}`}
      style={{ boxShadow: CARD_SHADOW }}
    >
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0066CC]/85">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

// Section label — the blue uppercase eyebrow used between content blocks.
export function SectionEyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0066CC]/85 ${className}`}>
      {children}
    </h2>
  );
}

// Stat tile — big SF Pro number on a soft white card.
export function StatTile({
  label,
  value,
  accent,
  emphasis = false,
  topAccent,
}: {
  label: string;
  value: string | number;
  accent?: string;
  emphasis?: boolean;
  topAccent?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] bg-white px-4 py-4"
      style={{ boxShadow: CARD_SHADOW }}
    >
      {topAccent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: topAccent }}
        />
      )}
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1D1F]/45">
        {label}
      </div>
      <div
        className="mt-1.5 font-medium leading-none tracking-[-0.03em]"
        style={{
          color: accent || '#1D1D1F',
          fontSize: emphasis ? 30 : 26,
          fontFamily: appleDisplayFont,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const CHIP_PALETTE = {
  neutral: { bg: 'rgba(29,29,31,0.06)', fg: '#6E6E73' },
  green: { bg: 'rgba(52,199,89,0.10)', fg: '#1E7E34' },
  blue: { bg: 'rgba(0,102,204,0.10)', fg: '#0066CC' },
  orange: { bg: 'rgba(255,149,0,0.12)', fg: '#B25A00' },
  red: { bg: 'rgba(255,59,48,0.10)', fg: '#B42318' },
} as const;

export type ChipTone = keyof typeof CHIP_PALETTE;

// Small rounded status chip (used for funnel signals, audit gaps, products).
export function Chip({ label, tone = 'neutral' }: { label: ReactNode; tone?: ChipTone }) {
  const p = CHIP_PALETTE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: p.bg, color: p.fg }}
    >
      {label}
    </span>
  );
}
