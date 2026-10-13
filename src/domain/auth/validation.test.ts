import {
  isValidEmail,
  isValidName,
  isValidPassword,
  passwordsMatch,
} from './validation';

describe('auth validation', () => {
  it('accepts plausible emails and rejects malformed ones', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.de')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('needs a non-blank first name of reasonable length', () => {
    expect(isValidName('Aiden')).toBe(true);
    expect(isValidName('  Aiden  ')).toBe(true);
    expect(isValidName('   ')).toBe(false);
    expect(isValidName('')).toBe(false);
    expect(isValidName('a'.repeat(41))).toBe(false);
  });

  it('requires at least 6 characters', () => {
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('123456')).toBe(true);
  });

  it('compares password and confirmation', () => {
    expect(passwordsMatch('abcdef', 'abcdef')).toBe(true);
    expect(passwordsMatch('abcdef', 'abcdeg')).toBe(false);
  });
});
