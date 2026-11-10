import { Credits, creditsSummary, listMeLink } from './credits';

describe('credits', () => {
  it('thanks a Supporter on the Settings row', () => {
    expect(creditsSummary(true)).toBe('Thank you for supporting Tern');
    expect(creditsSummary(false)).toBe('Who keeps Tern flying');
  });

  it('asks to be listed by email, leaving the name to them', () => {
    const link = listMeLink();
    expect(link.startsWith(`mailto:${Credits.CONTACT}?`)).toBe(true);
    expect(decodeURIComponent(link)).toContain('Please list me in the credits as: ');
  });
});
