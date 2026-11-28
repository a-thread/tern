import { Milestones, routeMilestones } from '../../waypoints/models/milestone';
import { RouteId } from '../../waypoints/models/routes';
import {
  arrivalDue,
  promptFor,
  restingAt,
  stopNamed,
  StopoverPrompts,
} from './stopover';
import {
  cleanInviteCode,
  dishFromSavedMeal,
  fishable,
  flock,
  flockWithLooks,
  freeLook,
  takenLooks,
  Presence,
  routeOf,
  showUpPoints,
  TernaryRules,
} from './ternary';

const first = Milestones.STOPS[0];
const second = Milestones.STOPS[1];

describe('the shared bird', () => {
  it('flies 75 on a day everyone shows up, whatever the size', () => {
    expect(showUpPoints(3, 3)).toBe(75);
    expect(showUpPoints(8, 8)).toBe(75);
  });

  it('flies a share of that on a partial day, and nothing with nobody', () => {
    expect(showUpPoints(1, 3)).toBe(25);
    expect(showUpPoints(0, 3)).toBe(0);
    expect(showUpPoints(0, 0)).toBe(0);
  });

  it('never flies more than a full day', () => {
    expect(showUpPoints(5, 3)).toBe(TernaryRules.SHOW_UP_POINTS);
  });
});

describe('the flock', () => {
  const members = [
    { userId: 'a', name: 'You', you: true, presence: Presence.Here, look: 5 },
    {
      userId: 'b',
      name: 'Maya',
      you: false,
      presence: Presence.Resting,
      look: 2,
    },
    { userId: 'c', name: 'Sam', you: false, presence: null, look: 0 },
  ];

  it('draws only who is here or resting, and never a quiet friend', () => {
    expect(flock(members).map((m) => m.name)).toEqual(['You', 'Maya']);
  });

  it('draws each friend as the bird they chose', () => {
    expect(
      flockWithLooks(members).map(({ member, look }) => [member.name, look]),
    ).toEqual([
      ['You', 5],
      ['Maya', 2],
    ]);
  });

  it('counts only friends’ birds as taken, quiet ones included', () => {
    expect([...takenLooks(members)].sort()).toEqual([0, 2]);
  });

  it('gives the bird you chose, or the first free one if a friend flies it', () => {
    expect(freeLook(members, 6)).toBe(6);
    expect(freeLook(members, 5)).toBe(5);
    expect(freeLook(members, 2)).toBe(1);
  });

  it('offers a fish to every friend, quiet or not', () => {
    expect(fishable(members).map((m) => m.name)).toEqual(['Maya', 'Sam']);
  });
});

describe('invite codes', () => {
  it('reads a code however it is typed', () => {
    expect(cleanInviteCode(' ktw-4qp ')).toBe('KTW4QP');
  });
});

describe('dishes', () => {
  it('carries a saved meal as its recipe: names, foods with amounts, and servings', () => {
    const items = [
      { name: 'Red lentils', calories: 230 },
      { name: 'Carrot', calories: 25 },
      { name: 'Carrot', calories: 25 },
    ] as never[];
    const dish = dishFromSavedMeal({
      id: 'm',
      name: 'Red lentil soup',
      createdAt: '2026-11-01',
      servings: 4,
      items,
    });
    expect(dish).toEqual({
      name: 'Red lentil soup',
      foods: ['Red lentils', 'Carrot'],
      items,
      servings: 4,
    });
    // Copies, so changing the saved meal later can't change what was shared.
    expect(dish.items![0]).not.toBe(items[0]);
  });

  it('shares a meal saved from the log as names only, since its amounts are what was eaten', () => {
    const dish = dishFromSavedMeal({
      id: 'm',
      name: 'Lunch',
      createdAt: '2026-11-01',
      servings: 1,
      items: [{ name: 'Rice', servings: 1.5, calories: 300 }] as never[],
    });
    expect(dish).toEqual({ name: 'Lunch', foods: ['Rice'] });
    expect(JSON.stringify(dish)).not.toMatch(/\d/);
  });

  it('sends only the portion each amount is measured in', () => {
    const measure = {
      per100: { calories: 100, protein: 1, carbs: 1, fat: 1 },
      portions: [
        { label: 'cup', grams: 200 },
        { label: 'tbsp', grams: 12 },
      ],
      unit: 'cup',
      quantity: 1,
    };
    const dish = dishFromSavedMeal({
      id: 'm',
      name: 'Soup',
      createdAt: '2026-11-01',
      servings: 4,
      items: [{ name: 'Lentils', servings: 1, measure }] as never[],
    });
    expect(dish.items![0].measure!.portions).toEqual([
      { label: 'cup', grams: 200 },
    ]);
  });

  it('shares a recipe too big for the server as names only', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      name: `Food ${i}`,
      servings: 1,
      servingLabel: 'x'.repeat(2000),
    })) as never[];
    const dish = dishFromSavedMeal({
      id: 'm',
      name: 'Feast',
      createdAt: '2026-11-01',
      servings: 10,
      items,
    });
    expect(dish.items).toBeUndefined();
    expect(dish.foods).toHaveLength(50);
  });
});

describe('stopover tables', () => {
  it('never prompts with diet words', () => {
    for (const prompt of StopoverPrompts.ALL) {
      for (const word of StopoverPrompts.NEVER) {
        // As a word, so "slow" isn't taken for "low".
        expect(prompt.toLowerCase()).not.toMatch(new RegExp(`\\b${word}`));
      }
    }
  });

  it('gives every stop a prompt, the same on every lap', () => {
    expect(promptFor(`1-${first.id}`)).toBe(promptFor(`2-${first.id}`));
    expect(promptFor('nowhere')).toBe(StopoverPrompts.ALL[0]);
  });

  it('sets the table where the shared bird rests', () => {
    expect(restingAt(0)).toBeNull();
    expect(restingAt(first.waypoints)?.id).toBe(`1-${first.id}`);
  });
});

describe('arriving together', () => {
  it('only remembers on the first look', () => {
    expect(arrivalDue(second.waypoints, null, '2026-11-10')).toEqual({
      pay: false,
      seen: { stop: `1-${second.id}`, day: null },
    });
  });

  it('pays once for each new stop', () => {
    const seen = { stop: `1-${first.id}`, day: null };
    const due = arrivalDue(second.waypoints, seen, '2026-11-10');
    expect(due).toEqual({
      pay: true,
      seen: { stop: `1-${second.id}`, day: '2026-11-10' },
    });
    expect(arrivalDue(second.waypoints, due.seen, '2026-11-20').pay).toBe(
      false,
    );
  });

  it('pays at most once a week, however fast the bird flies', () => {
    const seen = { stop: `1-${first.id}`, day: '2026-11-08' };
    expect(arrivalDue(second.waypoints, seen, '2026-11-10').pay).toBe(false);
    expect(arrivalDue(second.waypoints, seen, '2026-11-15').pay).toBe(true);
  });

  it('only remembers on the first look at another ternary, keeping the week', () => {
    const seen = { ternary: 'old', stop: `1-${first.id}`, day: '2026-11-08' };
    expect(
      arrivalDue(
        second.waypoints,
        seen,
        '2026-11-20',
        RouteId.Greenland,
        'new',
      ),
    ).toEqual({
      pay: false,
      seen: { ternary: 'new', stop: `1-${second.id}`, day: '2026-11-08' },
    });
  });
});

describe('a ternary on the Dutch route', () => {
  const dutch = routeMilestones(RouteId.Netherlands);

  it('rests at the Dutch stops, not Greenland’s', () => {
    expect(restingAt(dutch[0].waypoints, RouteId.Netherlands)?.id).toBe(
      `1-${dutch[0].id}`,
    );
    expect(restingAt(dutch[0].waypoints, RouteId.Netherlands)?.name).toBe(
      'The English Channel',
    );
  });

  it('finds a stop by id on either route', () => {
    expect(stopNamed('2-nl-amsterdam-island')?.name).toBe('Amsterdam Island');
    expect(stopNamed(`1-${first.id}`)?.id).toBe(first.id);
    expect(stopNamed('nowhere')).toBeUndefined();
  });

  it('pays an arrival at a Dutch stop', () => {
    const seen = { stop: `1-${dutch[0].id}`, day: null };
    expect(
      arrivalDue(dutch[1].waypoints, seen, '2026-11-15', RouteId.Netherlands),
    ).toEqual({
      pay: true,
      seen: { stop: `1-${dutch[1].id}`, day: '2026-11-15' },
    });
  });

  it('reads an unknown or missing route as Greenland’s', () => {
    expect(routeOf({})).toBe(RouteId.Greenland);
    expect(routeOf({ route: RouteId.Netherlands })).toBe(RouteId.Netherlands);
  });
});
