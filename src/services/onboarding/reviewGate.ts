/**
 * Review/submit gate (§9) — account-type-aware conditions that must hold before a
 * non-individual application can move past Review. Kept pure + unit-tested; a hook
 * (useReviewAccountTypeGate) loads the data and feeds it here, and the step-8 review
 * screen ANDs `ok` into its existing required-profile gate. Individual accounts are
 * unaffected (no parties, no required account-type fields, signatory auto-confirmed).
 */
import { getAccountTypeConfig } from './accountTypeConfig';
import type { UIAccountType } from '../types/onboarding';

export type ReviewGateReason =
  | 'signatory_not_confirmed'
  | 'account_type_fields_incomplete'
  | 'required_party_not_completed';

export interface ReviewGateInput {
  accountType: UIAccountType | null | undefined;
  /** onboarding_data.authorised_signatory_confirmed_at */
  signatoryConfirmedAt: string | null | undefined;
  /** all REQUIRED account-type fields present (retirement/entity) */
  accountTypeFieldsComplete: boolean;
  /** every REQUIRED party role has >= its min count of completed parties */
  requiredPartiesComplete: boolean;
}

export interface ReviewGateResult {
  ok: boolean;
  reasons: ReviewGateReason[];
}

export const REVIEW_GATE_REASON_LABELS: Record<ReviewGateReason, string> = {
  signatory_not_confirmed: 'Confirm the authorised signatory',
  account_type_fields_incomplete: 'Complete the account-type details',
  required_party_not_completed: 'All required parties must finish their sections',
};

export const computeAccountTypeReviewGate = (input: ReviewGateInput): ReviewGateResult => {
  const cfg = getAccountTypeConfig(input.accountType);
  const reasons: ReviewGateReason[] = [];

  if (cfg.signatory.requiresExplicitConfirm && !input.signatoryConfirmedAt) {
    reasons.push('signatory_not_confirmed');
  }

  const hasRequiredFields = cfg.accountTypeFields.some((f) => f.required);
  if (hasRequiredFields && !input.accountTypeFieldsComplete) {
    reasons.push('account_type_fields_incomplete');
  }

  const hasRequiredParties = cfg.requiredParties.some((p) => p.required && p.min > 0);
  if (hasRequiredParties && !input.requiredPartiesComplete) {
    reasons.push('required_party_not_completed');
  }

  return { ok: reasons.length === 0, reasons };
};
