/**
 * The people who keep Tern flying. Supporters are listed only when they ask to be, by name
 * as they gave it; the list ships with the app and is updated each release.
 */
export class Credits {
  static readonly SUPPORTERS: readonly string[] = [];
  /** Where to ask to be listed: the same address the privacy policy gives. */
  static readonly CONTACT = 'aiden.threadgoode@gmail.com';
}

/** The Credits row on the Settings index. */
export function creditsSummary(supporter: boolean): string {
  return supporter ? 'Thank you for supporting Tern' : 'Who keeps Tern flying';
}

/** A ready-to-send email asking to be listed, with the name left for them to write. */
export function listMeLink(): string {
  const subject = encodeURIComponent('Tern credits');
  const body = encodeURIComponent('Please list me in the credits as: ');
  return `mailto:${Credits.CONTACT}?subject=${subject}&body=${body}`;
}
