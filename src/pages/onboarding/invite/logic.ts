/**
 * Public invitee page logic — token-only, no login. Loads the scrubbed invite
 * payload, lets the invited party fill ONLY their role's required fields, and
 * completes their section. This is NOT a wizard step for the primary investor.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  loadInvite,
  completeInvite,
  saveInviteSection,
  type LoadInviteResult,
} from '../../../services/onboarding/inviteService';
import { missingPartyFields } from '../../../services/onboarding/partyRequirements';

export type InviteScreenState =
  | 'loading'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'completed'
  | 'done'
  | 'error';

export function useInviteLogic() {
  const { token } = useParams<{ token: string }>();
  const [screen, setScreen] = useState<InviteScreenState>('loading');
  const [data, setData] = useState<LoadInviteResult | null>(null);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const run = async () => {
      if (!token) {
        setScreen('error');
        setError('Invalid invite link.');
        return;
      }
      try {
        const result = await loadInvite(token);
        setData(result);
        setProfile(result.profile || {});
        if (result.state === 'active') setScreen('active');
        else setScreen(result.state); // expired | revoked | completed
      } catch (e) {
        setScreen('error');
        setError(e instanceof Error ? e.message : 'This invite could not be loaded.');
      }
    };
    run();
  }, [token]);

  const setField = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    if (missing.length) setMissing((prev) => prev.filter((k) => k !== key));
  };

  const isComplete = data ? missingPartyFields(data.role, profile).length === 0 : false;

  const handleSaveDraft = async () => {
    if (!token || !data) return;
    try {
      await saveInviteSection(token, profile);
    } catch {
      // best-effort draft save; ignore failures (complete is the real gate)
    }
  };

  const handleComplete = async () => {
    if (!token || !data) return;
    const gaps = missingPartyFields(data.role, profile);
    if (gaps.length) {
      setMissing(gaps);
      setError('Please complete the required fields.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await completeInvite(token, profile);
      setScreen('done');
    } catch (e) {
      const details = (e as { details?: { missing?: string[] } })?.details;
      if (details?.missing) setMissing(details.missing);
      setError(e instanceof Error ? e.message : 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return {
    screen,
    data,
    profile,
    missing,
    saving,
    error,
    isComplete,
    setField,
    handleSaveDraft,
    handleComplete,
  };
}
