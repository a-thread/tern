import type { TernClient } from '@shared/backend/supabase';
import { ok } from '@shared/backend/query';
import { JoinOutcome, type Ternary, TernaryRules } from './models/ternary';
import type { TernaryRepository } from './ternary.repository';
import { cleanSharedItems } from './models/recipeSwap';
import { cleanServings } from '../saved-meals/models/savedMeals';

/**
 * Ternaries on the server. Every table is closed to the app; these call the functions in
 * the `20261111000000_ternaries` migration and those after it, which decide what a friend
 * may see.
 */
export function createSupabaseTernaryRepository(
  db: TernClient,
): TernaryRepository {
  return {
    async mine(today) {
      const { data, error } = await db.rpc('ternary_state', { p_today: today });
      if (error) throw error;
      const ternary = (data as Ternary | null) ?? null;
      if (!ternary) return null;
      // Before 20261128000000_ternary_looks runs there's no look: fly as your place.
      return {
        ...ternary,
        members: (ternary.members ?? []).map((m, place) => ({
          ...m,
          look: Number.isInteger(m.look) ? m.look : place,
        })),
        // A friend's recipe is checked before it can be saved as anyone's meal.
        dishes: (ternary.dishes ?? []).map((d) => ({
          ...d,
          items: cleanSharedItems(d.items),
          servings: cleanServings(d.servings),
        })),
      };
    },
    create: (name, yourName, route, look) =>
      ok(
        db.rpc('ternary_create', {
          p_name: name,
          p_display_name: yourName,
          p_route: route,
          p_look: look,
        }),
      ),
    // The server holds a ternary to 8, one for each look, so no size is sent.
    async join(code, yourName, look) {
      const { data, error } = await db.rpc('ternary_join', {
        p_code: code,
        p_display_name: yourName,
        p_look: look,
      });
      if (error) throw error;
      const outcome = Object.values(JoinOutcome).find((o) => o === data);
      return outcome ?? JoinOutcome.NotFound;
    },
    async setLook(look) {
      const { data, error } = await db.rpc('ternary_set_look', {
        p_look: look,
      });
      if (error) throw error;
      return data === true;
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
          p_items: dish.items ?? null,
          p_servings: cleanServings(dish.servings),
        }),
      ),
    removeDish: (dishId) =>
      ok(db.rpc('ternary_remove_dish', { p_dish: dishId })),
    block: (userId) => ok(db.rpc('ternary_block', { p_user: userId })),
    unblock: (userId) => ok(db.rpc('ternary_unblock', { p_user: userId })),
    report: (kind, target) =>
      ok(db.rpc('ternary_report', { p_kind: kind, p_target: target })),
  };
}
