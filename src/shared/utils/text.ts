/** A name as it will be stored: trimmed, with inner runs of spaces collapsed. */
export const cleanSpaces = (text: string) => text.trim().replace(/\s+/g, ' ');

/** Whether two names are the same (case and extra spaces don't matter). */
export const sameName = (a: string, b: string) =>
  cleanSpaces(a).toLowerCase() === cleanSpaces(b).toLowerCase();
