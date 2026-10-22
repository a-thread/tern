/** Where someone's log lives right now (see AuthGate). */
export enum LogHome {
  /** On the phone: no account yet, or Tern Plus has ended. */
  Phone = 'phone',
  /** In the Tern Plus account, synced. */
  Account = 'account',
}

/**
 * Signed in with Plus, the log is in the account (also while the store can't be reached,
 * since the account is still what's used). Otherwise it's on the phone: signed out, which
 * includes Plus bought before making an account, or signed in once Plus has ended.
 */
export const logHome = ({ signedIn, lapsed }: { signedIn: boolean; lapsed: boolean }) =>
  signedIn && !lapsed ? LogHome.Account : LogHome.Phone;
