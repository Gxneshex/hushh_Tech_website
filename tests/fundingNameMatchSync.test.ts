import { describe, expect, it } from 'vitest';

import {
  computeFundingNameMatch as clientCompute,
  extractPlaidHolderNames as clientExtract,
  FUNDING_NAME_MATCH_LABELS as CLIENT_LABELS,
} from '../src/services/onboarding/fundingNameMatch';
import {
  computeFundingNameMatch as denoCompute,
  extractPlaidHolderNames as denoExtract,
  FUNDING_NAME_MATCH_LABELS as DENO_LABELS,
} from '../supabase/functions/_shared/fundingNameMatch';

const identity = (names: string[]) => ({
  accounts: [{ owners: [{ names }] }],
});

describe('funding name match contract', () => {
  it('client and Deno labels are identical', () => {
    expect(CLIENT_LABELS).toEqual(DENO_LABELS);
  });

  it('matches the entity legal name ignoring legal suffixes', () => {
    const r = clientCompute({
      expectedName: 'Acme Holdings LLC',
      accountHolderNames: ['Acme Holdings'],
    });
    expect(r).toBe('match');
    expect(denoCompute({ expectedName: 'Acme Holdings LLC', accountHolderNames: ['Acme Holdings'] })).toBe('match');
  });

  it('flags a personal account funding an entity as a mismatch', () => {
    expect(
      clientCompute({ expectedName: 'Acme Capital LP', accountHolderNames: ['John Q Smith'] }),
    ).toBe('mismatch');
  });

  it('returns unavailable when expected name or holder names are missing', () => {
    expect(clientCompute({ expectedName: '', accountHolderNames: ['Acme'] })).toBe('unavailable');
    expect(clientCompute({ expectedName: 'Acme', accountHolderNames: [] })).toBe('unavailable');
    expect(clientCompute({ expectedName: 'Acme', accountHolderNames: [null, ''] })).toBe('unavailable');
  });

  it('extracts deduped Plaid holder names and agrees across copies', () => {
    const data = identity(['Acme Holdings', 'Acme Holdings', 'Jane Doe']);
    expect(clientExtract(data)).toEqual(['Acme Holdings', 'Jane Doe']);
    expect(denoExtract(data)).toEqual(clientExtract(data));
    expect(clientExtract(null)).toEqual([]);
  });
});
