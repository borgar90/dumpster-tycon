import {
  normalizeBio,
  normalizeDisplayName,
  validateBio,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '@/lib/authValidation';

describe('authValidation', () => {
  it('accepts valid email and password values', () => {
    expect(validateEmail('scavenger@example.com')).toBeNull();
    expect(validatePassword('supersecure')).toBeNull();
  });

  it('normalizes and validates display names', () => {
    expect(normalizeDisplayName('  Yard   Boss  ')).toBe('Yard Boss');
    expect(validateDisplayName('Yard Boss')).toBeNull();
    expect(validateDisplayName('!bad')).toBe('Display name can only use letters, numbers, spaces, dots, dashes, and underscores.');
  });

  it('trims bios and blocks control characters', () => {
    expect(normalizeBio('  scrap king  ')).toBe('scrap king');
    expect(validateBio('working hard')).toBeNull();
    expect(validateBio('bad\u0007bio')).toBe('Bio contains invalid characters.');
  });
});