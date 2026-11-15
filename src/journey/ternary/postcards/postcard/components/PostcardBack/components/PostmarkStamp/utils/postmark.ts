/** How a stop's name fits in a postmark's circle. */
export class Postmark {
  static readonly LINE_CHARS = 11;
  static readonly MAX_LINES = 3;
}

/**
 * A stop's name as a postmark prints it: capitals, without a leading "The", in at most three
 * short lines ("The North Atlantic stopover" → NORTH / ATLANTIC / STOPOVER). A word too long
 * for a line gets a line of its own; anything past the third line is left off.
 */
export function postmarkLines(name: string): string[] {
  const words = name
    .replace(/^the\s+/i, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last && `${last} ${word}`.length <= Postmark.LINE_CHARS) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines.slice(0, Postmark.MAX_LINES);
}
