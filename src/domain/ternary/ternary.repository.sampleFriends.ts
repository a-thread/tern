import { routeMilestones } from '../waypoints/models/milestone';
import { restingAt } from './models/stopover';
import { routeOf, TernaryRules } from './models/ternary';
import type { TernaryRepository } from './ternary.repository';
import { SampleFriends } from './ternary.mock';

/**
 * Your real ternary with made-up friends mixed in, for trying the screens locally
 * (`sampleFriends`). Everything you do still goes to `repo` for real, except anything aimed
 * at a made-up friend, which is only remembered here. If the shared bird hasn't reached a
 * stop yet, it's shown at the second one so the recipe swap and postcards have something to
 * show; the ternary is marked `sample`, so no arrival bonus is paid for that.
 */
export function withSampleFriends(repo: TernaryRepository): TernaryRepository {
  let fishSent = 0;
  let fishDay = '';
  const blocked = new Set<string>();
  const visible = (id: string) => !blocked.has(id);

  return {
    ...repo,
    async mine(today) {
      const real = await repo.mine(today);
      if (!real) return null;
      const sentToday = fishDay === today ? fishSent : 0;
      // On whichever route the ternary flies; postcards stay on everyone's own (Greenland's).
      const route = routeOf(real);
      const stops = routeMilestones(route);
      const total = Math.max(real.total, stops[1].waypoints + 300);
      const stop = restingAt(total, route)?.id ?? `1-${stops[1].id}`;
      return {
        ...real,
        sample: true,
        total,
        members: [
          ...real.members,
          ...SampleFriends.MEMBERS.filter((m) => visible(m.userId)),
        ],
        fish: [
          ...(visible(SampleFriends.id('maya'))
            ? SampleFriends.fish(today)
            : []),
          ...real.fish,
        ],
        fishSentToday: real.fishSentToday + sentToday,
        postcards: [...real.postcards, ...SampleFriends.postcards()],
        dishes: [
          ...real.dishes,
          ...SampleFriends.dishes(stop, `1-${stops[0].id}`).filter((d) =>
            visible(d.fromId),
          ),
        ],
        blocked: [
          ...real.blocked,
          ...SampleFriends.MEMBERS.filter((m) => !visible(m.userId)).map(
            (m) => ({ userId: m.userId, name: m.name }),
          ),
        ],
      };
    },
    async bringFish(toUserId, today) {
      if (!SampleFriends.isOne(toUserId))
        return repo.bringFish(toUserId, today);
      // The count is for one day: a new day starts it again.
      if (fishDay !== today) {
        fishDay = today;
        fishSent = 0;
      }
      if (fishSent >= TernaryRules.MAX_FISH_PER_DAY) {
        throw new Error('That’s all the fish for today');
      }
      fishSent += 1;
    },
    async block(userId) {
      if (SampleFriends.isOne(userId)) blocked.add(userId);
      else await repo.block(userId);
    },
    async unblock(userId) {
      if (SampleFriends.isOne(userId)) blocked.delete(userId);
      else await repo.unblock(userId);
    },
    async report(kind, target) {
      if (!SampleFriends.isOne(target)) await repo.report(kind, target);
    },
  };
}
