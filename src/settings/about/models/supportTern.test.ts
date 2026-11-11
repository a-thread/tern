import { aboutSummary, SupportTern } from './supportTern';

describe('supporting Tern', () => {
  it('thanks a Supporter on the Settings row', () => {
    expect(aboutSummary(true)).toBe('What Tern is for · thank you for supporting it');
    expect(aboutSummary(false)).toBe('What Tern is for, and supporting it');
  });

  it('links to the coffee page over https', () => {
    expect(SupportTern.COFFEE_URL).toBe('https://buymeacoffee.com/athread');
  });
});
