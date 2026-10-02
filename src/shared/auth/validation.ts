/** What a password and a name must satisfy. */
export class AccountLimits {
  /** Matches Lichen (and Supabase's default minimum). */
  static readonly MIN_PASSWORD_LENGTH = 6;

  static readonly MAX_NAME_LENGTH = 40;
}

export function isValidName(name: string): boolean {
  const n = name.trim();
  return n.length > 0 && n.length <= AccountLimits.MAX_NAME_LENGTH;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= AccountLimits.MIN_PASSWORD_LENGTH;
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
