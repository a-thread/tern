/** Matches Lichen (and Supabase's default minimum). */
export const MIN_PASSWORD = 6;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD;
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
