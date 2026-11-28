import { useCallback } from 'react';
import { Share } from 'react-native';

import { useTernary } from '@/domain/ternary/TernaryContext';

/** Opens the share sheet with your ternary's name and invite code, for a friend to join. */
export function useInvite() {
  const { ternary } = useTernary();
  return useCallback(() => {
    if (!ternary) return;
    Share.share({
      message: `Fly with me in Tern: join my ternary “${ternary.name}” with the code ${ternary.inviteCode}.`,
    }).catch(() => {});
  }, [ternary]);
}
