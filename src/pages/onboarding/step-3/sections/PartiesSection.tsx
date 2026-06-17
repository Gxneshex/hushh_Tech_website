/**
 * Additional-parties section + inline completion dashboard (§5), rendered in Step-3
 * for Joint / Retirement / Trust. The primary investor invites required parties by
 * email and tracks each party's status. Completion is enforced at Step-5.
 */
import { useState } from 'react';
import { useStep3Parties } from './parties.logic';
import type { PartyRole } from '../../../../services/onboarding/accountTypeConfig';
import type { UIAccountType } from '../../../../types/onboarding';

const panelClass =
  'rounded-[28px] bg-white p-5 shadow-[0_18px_48px_rgba(29,29,31,0.06),inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:p-6';
const fieldClass =
  'min-h-[60px] flex-1 rounded-[16px] bg-[#F5F5F7] px-4 py-2.5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]';
const inputClass =
  'w-full border-none bg-transparent p-0 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/42 focus:ring-0';

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  link_opened: 'Link opened',
  in_progress: 'In progress',
  plaid_pending: 'Bank pending',
  plaid_connected: 'Bank connected',
  kyc_pending: 'KYC pending',
  completed: 'Completed',
  manual_review: 'Manual review',
};

function StatusChip({ status, inviteStatus }: { status: string; inviteStatus: string | null }) {
  const revoked = inviteStatus === 'revoked';
  const done = status === 'completed';
  const label = revoked ? 'Revoked' : STATUS_LABELS[status] || status;
  const cls = revoked
    ? 'bg-[#FF3B30]/10 text-[#B42318]'
    : done
    ? 'bg-[#34C759]/12 text-[#1E7A33]'
    : 'bg-[#0066CC]/10 text-[#0066CC]';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{label}</span>
  );
}

function RoleBlock({
  role,
  label,
  helpText,
  parties,
}: {
  role: PartyRole;
  label: string;
  helpText?: string;
  parties: ReturnType<typeof useStep3Parties>;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const rows = parties.rows.filter((r) => r.role === role);

  const onSend = async () => {
    const ok = await parties.sendInvite(role, email.trim(), name.trim() || undefined);
    if (ok) {
      setEmail('');
      setName('');
    }
  };

  return (
    <div className="rounded-[20px] bg-[#F5F5F7]/60 p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.06)]">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#1D1D1F]">{label}</span>
      </div>
      {helpText && (
        <p className="mb-3 text-[12px] font-normal leading-[1.4] text-[#1D1D1F]/50">{helpText}</p>
      )}

      {rows.length > 0 && (
        <ul className="mb-3 space-y-2">
          {rows.map((r) => (
            <li
              key={r.partyId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-white px-3 py-2.5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#1D1D1F]">
                  {r.displayName || r.email}
                </p>
                {r.displayName && (
                  <p className="truncate text-[11px] text-[#1D1D1F]/45">{r.email}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={r.status} inviteStatus={r.inviteStatus} />
                {r.status !== 'completed' && r.inviteStatus !== 'revoked' && r.inviteId && (
                  <>
                    <button
                      type="button"
                      onClick={() => parties.resend(r.inviteId!, r.partyId)}
                      disabled={parties.busy}
                      className="text-[11px] font-medium text-[#0066CC] hover:underline disabled:opacity-40"
                    >
                      Resend
                    </button>
                    <button
                      type="button"
                      onClick={() => parties.revoke(r.inviteId!)}
                      disabled={parties.busy}
                      className="text-[11px] font-medium text-[#1D1D1F]/45 hover:underline disabled:opacity-40"
                    >
                      Revoke
                    </button>
                  </>
                )}
                {parties.links[r.partyId] && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(parties.links[r.partyId])}
                    className="text-[11px] font-medium text-[#1D1D1F]/45 hover:underline"
                  >
                    Copy link
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className={fieldClass}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className={inputClass}
          />
        </div>
        <div className={fieldClass}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={parties.busy || !email.trim()}
          className="shrink-0 rounded-full border border-[#0066CC] bg-[#0066CC] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {parties.busy ? 'Sending…' : 'Send link'}
        </button>
      </div>
    </div>
  );
}

export default function PartiesSection({ accountType }: { accountType: UIAccountType }) {
  const parties = useStep3Parties(accountType);
  if (parties.requiredParties.length === 0) return null;

  return (
    <section className={panelClass}>
      <div className="mb-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
          Additional Parties
        </h3>
        <p className="mt-1 text-[13px] font-normal leading-[1.45] text-[#1D1D1F]/50">
          Invite the other people on this account by email. Each completes their own
          section via a secure link — you can track their status here.
        </p>
      </div>

      {parties.error && (
        <div className="mb-3 rounded-[14px] bg-[#FF3B30]/10 px-3 py-2 text-[12px] font-medium text-[#B42318]">
          {parties.error}
        </div>
      )}

      <div className="space-y-3">
        {parties.requiredParties
          .filter((p) => p.invitable)
          .map((p) => (
            <RoleBlock
              key={p.role}
              role={p.role}
              label={p.label}
              helpText={p.helpText}
              parties={parties}
            />
          ))}
      </div>
    </section>
  );
}
