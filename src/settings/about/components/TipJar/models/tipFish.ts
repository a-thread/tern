/** By rank, smallest first. App-only names; the store says "Small tip" and so on. */
export class TipFish {
  static readonly NAMES = ['sand eel', 'capelin', 'herring'] as const;
  /** The fish icon's size on each tile, growing with the tip. */
  static readonly SIZES = [16, 20, 24] as const;

  /** A 4th or later tip is the largest fish. */
  static nameAt(index: number): string {
    return TipFish.NAMES[TipFish.clamp(index, TipFish.NAMES.length)];
  }

  static sizeAt(index: number): number {
    return TipFish.SIZES[TipFish.clamp(index, TipFish.SIZES.length)];
  }

  private static clamp(index: number, length: number): number {
    return Math.min(Math.max(0, index), length - 1);
  }
}
