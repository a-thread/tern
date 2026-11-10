import type { TernClient } from '@shared/backend/supabase';
import { ok } from '@shared/backend/query';
import {
  JoinOutcome,
  type Ternary,
  TernaryRules,
} from './models/ternary';
import type { TernaryRepository } from './ternary.repository';

/**
 * Ternaries on the server. Every table is closed to the app; these call the functions in
 * the `20261110000000_ternaries` migration, which decide what a friend may see.
 */
export function createSupabaseTernaryRepository(db: TernClient): TernaryRepository {
  return {
    async mine(today) {
      const { data, error } = await db.rpc('ternary_state', { p_today: today });
      if (error) throw error;
      return (data as Ternary | null) ?? null;
    },
    create: (name, yourName) =>
      ok(db.rpc('ternary_create', { p_name: name, p_display_name: yourName })),
    async join(code, yourName) {
      const { data, error } = await db.rpc('ternary_join', {
        p_code: code,
        p_display_name: yourName,
        p_max: TernaryRules.MAX_MEMBERS,
      });
      if (error) throw error;
      const outcome = Object.values(JoinOutcome).find((o) => o === data);
      return outcome ?? JoinOutcome.NotFound;
    },
    leave: () => ok(db.rpc('ternary_leave')),
    setPrivacy: ({ flyPrivately, shareResting }) =>
      ok(
        db.rpc('ternary_set_privacy', {
          p_fly_privately: flyPrivately,
          p_share_resting: shareResting,
        }),
      ),
    bringFish: (toUserId, today) =>
      ok(
        db.rpc('ternary_bring_fish', {
          p_to: toUserId,
          p_day: today,
          p_max: TernaryRules.MAX_FISH_PER_DAY,
        }),
      ),
    sendPostcard: (stopId, today) =>
      ok(db.rpc('ternary_send_postcard', { p_stop_id: stopId, p_day: today })),
    bringDish: (stop, dish) =>
      ok(
        db.rpc('ternary_bring_dish', {
          p_stop: stop,
          p_name: dish.name,
          p_foods: dish.foods,
        }),
      ),
    block: (userId) => ok(db.rpc('ternary_block', { p_user: userId })),
    report: (kind, target) =>
      ok(db.rpc('ternary_report', { p_kind: kind, p_target: target })),
  };
}
