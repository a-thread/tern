import { useCallback } from 'react';
import { Share } from 'react-native';

import { useTernary } from '@/domain/ternary/TernaryContext';
import { joinLinkFor } from '@/domain/ternary/models/joinLink';

/** Opens the share sheet with a link to join your ternary, and its code for typing in. */
export function useInvite() {
  const { ternary } = useTernary();
  return useCallback(() => {
    if (!ternary) return;
    Share.share({
      message: `Fly with me in Tern: join my ternary “${ternary.name}” here: ${joinLinkFor(ternary.inviteCode)} (or enter the code ${ternary.inviteCode}).`,
    }).catch(() => {});
  }, [ternary]);
}
