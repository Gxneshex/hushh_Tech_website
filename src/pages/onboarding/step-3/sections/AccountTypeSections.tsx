/**
 * Step-3 account-type sections (rendered inside the existing Step-3 page).
 *
 * Driven entirely by the selected account type (Step 2). Individual sees only a
 * signatory confirmation note; Retirement/Trust additionally see their account-type
 * fields; all non-individual types must confirm the authorised signatory (§3.2).
 * Joint's co-owner invites are wired in a later slice; the signatory section already
 * applies here.
 */
import ConsentCheckbox from '../../../../components/consent/ConsentCheckbox';
import {
  RequiredAsterisk,
  OptionalMarker,
} from '../../../../components/onboarding-field-marker/FieldMarkers';
import { getAccountTypeConfig } from '../../../../services/onboarding/accountTypeConfig';
import PartiesSection from './PartiesSection';
import {
  RETIREMENT_ACCOUNT_TYPES,
  ENTITY_TYPES,
  type UseStep3AccountTypeSections,
} from './logic';

const panelClass =
  'rounded-[28px] bg-white p-5 shadow-[0_18px_48px_rgba(29,29,31,0.06),inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:p-6';
const fieldClass =
  'min-h-[74px] rounded-[18px] bg-[#F5F5F7] px-4 py-3.5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]';
const labelClass =
  'mb-1 block text-[11px] font-medium uppercase tracking-[1.3px] text-[#1D1D1F]/55';
const inputClass =
  'w-full border-none bg-transparent p-0 text-[16px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/42 focus:ring-0';
const selectClass =
  'w-full cursor-pointer appearance-none border-none bg-transparent p-0 pr-7 text-[16px] font-medium text-[#1D1D1F] outline-none';
const headingClass =
  'text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85';
const subClass = 'mt-1 text-[13px] font-normal leading-[1.45] text-[#1D1D1F]/50';

function ChevronedSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        aria-label={ariaLabel}
      >
        <option value="" disabled>
          Select
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-[#1D1D1F]/30">
        expand_more
      </span>
    </div>
  );
}

export default function AccountTypeSections({ at }: { at: UseStep3AccountTypeSections }) {
  const { accountType } = at;
  if (!accountType) return null;
  const cfg = getAccountTypeConfig(accountType);
  const str = (key: Parameters<typeof at.setField>[0]) => String(at.fields[key] ?? '');

  return (
    <>
      {/* ── Retirement details (§6) ── */}
      {accountType === 'retirement' && (
        <section className={panelClass}>
          <div className="mb-4">
            <h3 className={headingClass}>Retirement Account</h3>
            <p className={subClass}>
              Tell us about the retirement account this investment is for.
            </p>
          </div>
          <div className="grid gap-3">
            <label className={fieldClass}>
              <span className={labelClass}>
                Retirement account type
                <RequiredAsterisk />
              </span>
              <ChevronedSelect
                value={str('retirement_account_type')}
                onChange={(v) => at.setField('retirement_account_type', v)}
                options={RETIREMENT_ACCOUNT_TYPES}
                ariaLabel="Retirement account type"
              />
            </label>
            <label className={fieldClass}>
              <span className={labelClass}>
                Custodian name
                <RequiredAsterisk />
              </span>
              <input
                type="text"
                value={str('custodian_name')}
                onChange={(e) => at.setField('custodian_name', e.target.value)}
                placeholder="e.g. Fidelity, Schwab"
                className={inputClass}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={fieldClass}>
                <span className={labelClass}>
                  Custodian email
                  <OptionalMarker />
                </span>
                <input
                  type="email"
                  value={str('custodian_contact_email')}
                  onChange={(e) => at.setField('custodian_contact_email', e.target.value)}
                  placeholder="custodian@example.com"
                  className={inputClass}
                />
              </label>
              <label className={fieldClass}>
                <span className={labelClass}>
                  Custodian phone
                  <OptionalMarker />
                </span>
                <input
                  type="tel"
                  value={str('custodian_contact_phone')}
                  onChange={(e) => at.setField('custodian_contact_phone', e.target.value)}
                  placeholder="(000) 000-0000"
                  className={inputClass}
                />
              </label>
            </div>
            <label className={fieldClass}>
              <span className={labelClass}>
                Custodian account number
                <OptionalMarker />
              </span>
              <input
                type="text"
                value={str('custodian_account_number')}
                onChange={(e) => at.setField('custodian_account_number', e.target.value)}
                placeholder="Account number, if applicable"
                className={inputClass}
                autoComplete="off"
              />
            </label>
            <ConsentCheckbox
              id="custodian-approval-required"
              checked={Boolean(at.fields.custodian_approval_required)}
              onChange={(checked) => at.setField('custodian_approval_required', checked)}
            >
              Custodian approval or signature is required for this investment.
            </ConsentCheckbox>
          </div>
        </section>
      )}

      {/* ── Trust / Entity details (§7) ── */}
      {accountType === 'trust' && (
        <section className={panelClass}>
          <div className="mb-4">
            <h3 className={headingClass}>Trust / Entity</h3>
            <p className={subClass}>
              Basic details of the trust or entity investing. Supporting documents may
              be requested during review.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={fieldClass}>
                <span className={labelClass}>
                  Entity type
                  <RequiredAsterisk />
                </span>
                <ChevronedSelect
                  value={str('entity_type')}
                  onChange={(v) => at.setField('entity_type', v)}
                  options={ENTITY_TYPES}
                  ariaLabel="Entity type"
                />
              </label>
              <label className={fieldClass}>
                <span className={labelClass}>
                  Legal name
                  <RequiredAsterisk />
                </span>
                <input
                  type="text"
                  value={str('entity_legal_name')}
                  onChange={(e) => at.setField('entity_legal_name', e.target.value)}
                  placeholder="Full legal name"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={fieldClass}>
                <span className={labelClass}>
                  Tax ID / EIN
                  <OptionalMarker />
                </span>
                <input
                  type="text"
                  value={str('entity_tax_id_ein')}
                  onChange={(e) => at.setField('entity_tax_id_ein', e.target.value)}
                  placeholder="EIN, if applicable"
                  className={inputClass}
                  autoComplete="off"
                />
              </label>
              <label className={fieldClass}>
                <span className={labelClass}>
                  Formation state
                  <OptionalMarker />
                </span>
                <input
                  type="text"
                  value={str('formation_state')}
                  onChange={(e) => at.setField('formation_state', e.target.value)}
                  placeholder="e.g. Delaware"
                  className={inputClass}
                />
              </label>
            </div>
            <label className={fieldClass}>
              <span className={labelClass}>
                Formation country
                <OptionalMarker />
              </span>
              <input
                type="text"
                value={str('formation_country')}
                onChange={(e) => at.setField('formation_country', e.target.value)}
                placeholder="e.g. United States"
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              <span className={labelClass}>
                Registered address
                <OptionalMarker />
              </span>
              <input
                type="text"
                value={str('registered_address')}
                onChange={(e) => at.setField('registered_address', e.target.value)}
                placeholder="Registered address"
                className={inputClass}
              />
            </label>
            <label className={fieldClass}>
              <span className={labelClass}>
                Principal address
                <OptionalMarker />
              </span>
              <input
                type="text"
                value={str('principal_address')}
                onChange={(e) => at.setField('principal_address', e.target.value)}
                placeholder="Principal place of business"
                className={inputClass}
              />
            </label>
          </div>
        </section>
      )}

      {/* ── Additional parties + invites (§5/§6/§7) ── */}
      {cfg.requiredParties.length > 0 && <PartiesSection accountType={accountType} />}

      {/* ── Authorised signatory (§3.2) — all account types ── */}
      <section className={panelClass}>
        <div className="mb-4">
          <h3 className={headingClass}>Authorised Signatory</h3>
          <p className={subClass}>
            Confirms who is authorised to complete and submit this application.
          </p>
        </div>
        {cfg.signatory.requiresExplicitConfirm ? (
          <ConsentCheckbox
            id="authorised-signatory"
            checked={at.signatoryConfirmed}
            onChange={at.setSignatoryConfirmed}
            error={at.showErrors && !at.signatoryConfirmed}
          >
            I confirm I am the authorised signatory for this account and am
            authorised to complete and submit this application.
          </ConsentCheckbox>
        ) : (
          <div className="flex items-start gap-3 rounded-[18px] bg-[#F5F5F7]/70 px-4 py-3 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.06)]">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-[#34C759]">
              verified_user
            </span>
            <p className="text-[13px] font-normal leading-[1.45] text-[#1D1D1F]/55">
              As the individual investor, you are the authorised signatory for this
              application.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
