import { singular } from './measure';

/** Lowercase, accents removed, punctuation turned to spaces: "Crème brûlée!" → "creme brulee". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The words of a name or a query, normalized and made singular, so "Eggs" and "egg" meet. */
export function wordsOf(text: string): string[] {
  const n = normalizeText(text);
  return n ? n.split(' ').map((w) => (w.length > 3 ? singular(w) : w)) : [];
}

/** Every query word starts some word of the text ("chick bre" finds "chicken breast"). */
export function allWordsPrefix(query: string[], words: string[]): boolean {
  return query.every((q) => words.some((w) => w.startsWith(q)));
}
