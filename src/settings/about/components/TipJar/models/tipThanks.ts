import { TipResult } from '@/domain/subscription/models/subscription';

/** What the card says after a tip, or null when the person backed out. */
export function tipThanks(result: TipResult, fish: string): string | null {
  switch (result) {
    case TipResult.Paid:
      return `Thank you for the ${fish}. It keeps Tern flying.`;
    case TipResult.Pending:
      return 'Thank you. Your tip will go through once the payment does.';
    case TipResult.Cancelled:
      return null;
  }
}
