import { describe, expect, it } from 'vitest';
import { getUiFieldProfile, normalizeUiFieldPath, type UiProfile } from '../src/app/ui-profile';

describe('UI Profile helpers', () => {
  it('normalizes string and form segment field paths', () => {
    expect(normalizeUiFieldPath(' subject.name ')).toBe('subject.name');
    expect(normalizeUiFieldPath(['extensions', 0, 'extnValue'])).toBe('extensions.0.extnValue');
  });

  it('looks up field-level hints without requiring a profile', () => {
    const profile: UiProfile = {
      id: 'example.person',
      typeName: 'Person',
      fields: {
        name: { label: 'Name', placeholder: 'Alice' },
        'payload.bytes': { inputMode: 'hex', widget: 'bytes' }
      }
    };

    expect(getUiFieldProfile(profile, ['name'])).toEqual({ label: 'Name', placeholder: 'Alice' });
    expect(getUiFieldProfile(profile, ['payload', 'bytes'])).toEqual({ inputMode: 'hex', widget: 'bytes' });
    expect(getUiFieldProfile(undefined, ['name'])).toBeUndefined();
  });
});