/** Matches Lichen (and Supabase's default minimum). */
export const MIN_PASSWORD = 6;

export const MAX_NAME = 40;

export function isValidName(name: string): boolean {
  const n = name.trim();
  return n.length > 0 && n.length <= MAX_NAME;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD;
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
