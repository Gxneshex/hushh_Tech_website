/**
 * Public invitee page logic — token-only, no login. Loads the scrubbed invite
 * payload and walks the invited party through their own KYC as sub-steps
 * (Identity → Residence → Tax → Contact → Bank → Review). Joint owners complete
 * FULL KYC parity with the primary and connect their OWN bank via Plaid. This is
 * NOT a wizard step for the primary investor.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import {
  loadInvite,
  completeInvite,
  saveInviteSection,
  createInviteLinkToken,
  exchangeInvitePlaid,
  type LoadInviteResult,
} from '../../../services/onboarding/inviteService';
import {
  missingPartyFields,
  type PartyFieldDef,
} from '../../../services/onboarding/partyRequirements';
import { MINIMUM_ONBOARDING_AGE, resolveDobEligibility } from '../../../services/onboarding/dob';

export type InviteScreenState =
  | 'loading'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'completed'
  | 'done'
  | 'error';

export type InviteStepKind = 'fields' | 'bank' | 'review';
export interface InviteStep {
  kind: InviteStepKind;
  title: string;
  fields?: PartyFieldDef[];
}

const DEFAULT_SECTION = 'Your details';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// OAuth banks redirect back to this fixed path (the reserved token value 'oauth');
// the real invite token + Plaid link token are restored from sessionStorage. The
// path must be registered in the Plaid dashboard for each host.
const OAUTH_RETURN_PATH = '/onboarding/invite/oauth';
const SS_OAUTH_TOKEN = 'hushh_invite_oauth_token';
const SS_OAUTH_LINK = 'hushh_invite_oauth_link_token';

/** Only joint owners connect their own bank in PR1. */
const roleNeedsOwnBank = (role: string): boolean => role === 'joint_owner';

const validateField = (field: PartyFieldDef, value: string): string | null => {
  const v = String(value ?? '').trim();
  if (!v) return null; // presence handled by the required gate
  if (field.type === 'email' && !EMAIL_RE.test(v)) return 'Enter a valid email address';
  if (field.type === 'date') {
    const [y, m, d] = v.split('-');
    const { isValidDate, isAdult } = resolveDobEligibility(String(Number(m)), String(Number(d)), y);
    if (!isValidDate) return 'Enter a valid date';
    if (!isAdult) return `Must be at least ${MINIMUM_ONBOARDING_AGE} years old`;
  }
  return null;
};

export function useInviteLogic() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  // Plaid OAuth banks return to /onboarding/invite/oauth; the real token is restored
  // from sessionStorage so the link can resume.
  const isOAuthReturn = token === 'oauth';
  const [oauthRealToken, setOauthRealToken] = useState<string | null>(null);
  const effectiveToken = isOAuthReturn ? oauthRealToken : token ?? null;
  const [screen, setScreen] = useState<InviteScreenState>('loading');
  const [data, setData] = useState<LoadInviteResult | null>(null);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Bank (Plaid) state
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [bankConnected, setBankConnected] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const run = async () => {
      // Returning from a Plaid OAuth bank: restore the real token + link token and
      // let usePlaidLink resume (via receivedRedirectUri) to finish the connection.
      const realToken = isOAuthReturn ? sessionStorage.getItem(SS_OAUTH_TOKEN) : token;
      if (isOAuthReturn) {
        setOauthRealToken(realToken);
        const savedLink = sessionStorage.getItem(SS_OAUTH_LINK);
        if (savedLink) setLinkToken(savedLink);
      }
      if (!realToken) {
        setScreen('error');
        setError('Invalid invite link.');
        return;
      }
      try {
        const result = await loadInvite(realToken);
        setData(result);
        setProfile(result.profile || {});
        setBankConnected(Boolean(result.bank_connected));
        if (result.state === 'active') setScreen('active');
        else setScreen(result.state); // expired | revoked | completed
      } catch (e) {
        setScreen('error');
        setError(e instanceof Error ? e.message : 'This invite could not be loaded.');
      }
    };
    run();
  }, [token, isOAuthReturn]);

  // Build the ordered sub-steps from the role's field sections (+ bank, + review).
  const steps = useMemo<InviteStep[]>(() => {
    if (!data) return [];
    const sections: InviteStep[] = [];
    for (const f of data.fields) {
      const title = f.section || DEFAULT_SECTION;
      let sec = sections.find((s) => s.title === title);
      if (!sec) {
        sec = { kind: 'fields', title, fields: [] };
        sections.push(sec);
      }
      sec.fields!.push(f);
    }
    const out = [...sections];
    if (roleNeedsOwnBank(data.role)) out.push({ kind: 'bank', title: 'Bank' });
    out.push({ kind: 'review', title: 'Review & submit' });
    return out;
  }, [data]);

  const currentStep = steps[stepIndex] ?? null;
  const needsBank = data ? roleNeedsOwnBank(data.role) : false;

  const setField = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = useCallback(async () => {
    if (!effectiveToken || !data) return;
    try {
      await saveInviteSection(effectiveToken, profile);
    } catch {
      // best-effort draft save; ignore failures (complete is the real gate)
    }
  }, [effectiveToken, data, profile]);

  // Required gaps for the whole role, and for the current sub-step only.
  const allMissing = data ? missingPartyFields(data.role, profile) : [];
  const fieldErrorFor = (field: PartyFieldDef): string | null =>
    validateField(field, profile[field.key] ?? '');

  const currentStepFields = currentStep?.fields ?? [];
  const currentStepMissing = currentStepFields
    .filter((f) => allMissing.includes(f.key))
    .map((f) => f.key);
  const currentStepHasFieldError = currentStepFields.some((f) => fieldErrorFor(f) !== null);

  const isComplete = data
    ? allMissing.length === 0 &&
      data.fields.every((f) => fieldErrorFor(f) === null) &&
      (!needsBank || bankConnected) &&
      consentChecked
    : false;

  const canAdvance = (() => {
    if (!currentStep) return false;
    if (currentStep.kind === 'fields') {
      return currentStepMissing.length === 0 && !currentStepHasFieldError;
    }
    return true; // bank + review steps never block forward navigation
  })();

  const goBack = () => {
    setShowErrors(false);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const goNext = async () => {
    if (!currentStep) return;
    if (currentStep.kind === 'fields' && !canAdvance) {
      setShowErrors(true);
      setError('Please complete the required fields.');
      return;
    }
    setError(null);
    setShowErrors(false);
    await handleSaveDraft();
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  // ── Plaid (joint owner connects their OWN bank) ──
  const onPlaidSuccess = useCallback(
    async (publicToken: string, metadata: { institution?: { name?: string; institution_id?: string } }) => {
      const t = effectiveToken;
      if (!t) return;
      setBankBusy(true);
      setBankError(null);
      try {
        await exchangeInvitePlaid(t, {
          publicToken,
          institutionName: metadata?.institution?.name ?? null,
          institutionId: metadata?.institution?.institution_id ?? null,
        });
        setBankConnected(true);
        if (isOAuthReturn) {
          // Came back via the OAuth redirect — clean up and return to the real
          // invite page (now bank-connected) to finish review & submit.
          sessionStorage.removeItem(SS_OAUTH_TOKEN);
          sessionStorage.removeItem(SS_OAUTH_LINK);
          navigate(`/onboarding/invite/${t}`);
        }
      } catch (e) {
        setBankError(e instanceof Error ? e.message : 'Could not connect your bank. Please try again.');
      } finally {
        setBankBusy(false);
        setLinkToken(null);
      }
    },
    [effectiveToken, isOAuthReturn, navigate],
  );

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    // On the OAuth return page, hand Plaid the redirect URL so Link resumes.
    receivedRedirectUri: isOAuthReturn ? window.location.href : undefined,
    onSuccess: (publicToken, metadata) => void onPlaidSuccess(publicToken, metadata as never),
    onExit: () => {
      setBankBusy(false);
      setLinkToken(null);
    },
  });

  useEffect(() => {
    if (linkToken && plaidReady) openPlaid();
  }, [linkToken, plaidReady, openPlaid]);

  const connectBank = async () => {
    const t = effectiveToken;
    if (!t) return;
    setBankError(null);
    setBankBusy(true);
    try {
      const redirectUri = `${window.location.origin}${OAUTH_RETURN_PATH}`;
      const res = await createInviteLinkToken(t, redirectUri);
      // Persist so an OAuth round-trip (which reloads the page) can resume.
      sessionStorage.setItem(SS_OAUTH_TOKEN, t);
      sessionStorage.setItem(SS_OAUTH_LINK, res.link_token);
      setLinkToken(res.link_token); // effect opens Link once the SDK is ready
    } catch (e) {
      setBankError(e instanceof Error ? e.message : 'Could not start the bank connection.');
      setBankBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!effectiveToken || !data) return;
    if (!isComplete) {
      setShowErrors(true);
      setError(
        needsBank && !bankConnected
          ? 'Please connect your bank to finish.'
          : !consentChecked
          ? 'Please confirm the consent to finish.'
          : 'Please complete the required fields.',
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await completeInvite(effectiveToken, profile);
      setScreen('done');
    } catch (e) {
      const details = (e as { details?: { missing?: string[] } })?.details;
      if (details?.missing) setShowErrors(true);
      setError(e instanceof Error ? e.message : 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return {
    screen,
    data,
    profile,
    // True while a Plaid OAuth bank is being resumed on the return page.
    oauthResuming: isOAuthReturn && !bankConnected,
    setField,
    handleSaveDraft,
    // sub-steps
    steps,
    stepIndex,
    currentStep,
    goNext,
    goBack,
    canAdvance,
    showErrors,
    fieldErrorFor,
    currentStepMissing,
    // bank
    needsBank,
    bankConnected,
    bankBusy,
    bankError,
    connectBank,
    // consent + submit
    consentChecked,
    setConsentChecked,
    isComplete,
    saving,
    error,
    handleComplete,
  };
}
