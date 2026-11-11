import { Milestones } from '../../waypoints/models/milestone';
import {
  arrivalDue,
  promptFor,
  restingAt,
  StopoverPrompts,
} from './stopover';
import {
  cleanInviteCode,
  dishFromSavedMeal,
  fishable,
  flock,
  flockWithLooks,
  Presence,
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
    { userId: 'a', name: 'You', you: true, presence: Presence.Here },
    { userId: 'b', name: 'Maya', you: false, presence: Presence.Resting },
    { userId: 'c', name: 'Sam', you: false, presence: null },
  ];

  it('draws only who is here or resting, and never a quiet friend', () => {
    expect(flock(members).map((m) => m.name)).toEqual(['You', 'Maya']);
  });

  it('gives each friend their own look by their place, kept when others are quiet', () => {
    expect(flockWithLooks(members).map(({ member, look }) => [member.name, look])).toEqual([
      ['You', 0],
      ['Maya', 1],
    ]);
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
  it('carries a saved meal’s name and food names, and nothing else', () => {
    const dish = dishFromSavedMeal({
      id: 'm',
      name: 'Red lentil soup',
      createdAt: '2026-11-01',
      items: [
        { name: 'Red lentils', calories: 230 },
        { name: 'Carrot', calories: 25 },
        { name: 'Carrot', calories: 25 },
      ] as never,
    });
    expect(dish).toEqual({ name: 'Red lentil soup', foods: ['Red lentils', 'Carrot'] });
    expect(JSON.stringify(dish)).not.toMatch(/calories|\d/);
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
    expect(due).toEqual({ pay: true, seen: { stop: `1-${second.id}`, day: '2026-11-10' } });
    expect(arrivalDue(second.waypoints, due.seen, '2026-11-20').pay).toBe(false);
  });

  it('pays at most once a week, however fast the bird flies', () => {
    const seen = { stop: `1-${first.id}`, day: '2026-11-08' };
    expect(arrivalDue(second.waypoints, seen, '2026-11-10').pay).toBe(false);
    expect(arrivalDue(second.waypoints, seen, '2026-11-15').pay).toBe(true);
  });
});
