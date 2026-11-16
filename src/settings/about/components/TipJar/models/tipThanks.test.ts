import { TipResult } from '@/domain/subscription/models/subscription';
import { tipThanks } from './tipThanks';

describe('tipThanks', () => {
  it('thanks someone for the fish they paid for', () => {
    expect(tipThanks(TipResult.Paid, 'herring')).toBe(
      'Thank you for the herring. It keeps Tern flying.',
    );
  });

  it('says a held payment will go through, rather than calling it a failure', () => {
    expect(tipThanks(TipResult.Pending, 'herring')).toBe(
      'Thank you. Your tip will go through once the payment does.',
    );
  });

  it('says nothing when the person backed out', () => {
    expect(tipThanks(TipResult.Cancelled, 'herring')).toBeNull();
  });
});
