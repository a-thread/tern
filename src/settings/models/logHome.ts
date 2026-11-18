/** Where someone's log lives right now (see AuthGate). */
export enum LogHome {
  /** On the phone: no account yet, or Tern Plus has ended. */
  Phone = 'phone',
  /** In the Tern Plus account, synced. */
  Account = 'account',
}

/** Account when signed in with Plus (even if the store is unreachable); the phone otherwise. */
export const logHome = ({
  signedIn,
  lapsed,
}: {
  signedIn: boolean;
  lapsed: boolean;
}) => (signedIn && !lapsed ? LogHome.Account : LogHome.Phone);
