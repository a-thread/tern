import { Milestones } from '../waypoints/models/milestone';
import {
  type Dish,
  type Fish,
  type Postcard,
  Presence,
  type Ternary,
  type TernaryMember,
} from './models/ternary';

/** Sample data only: a ternary to try the screens with, and made-up friends to show in one. */

/** A friend's recipe in both samples: names and foods, never amounts. */
const LENTIL_SOUP = {
  name: 'Red lentil soup',
  foods: ['Red lentils', 'Carrot', 'Onion', 'Cumin', 'Coconut milk', 'Lime'],
};

/** A ternary to try the screens with: two friends, one resting and one quiet. */
export function sampleTernary(today: string): Ternary {
  return {
    id: 'sample-ternary',
    name: 'Sunday Walkers',
    inviteCode: 'KTW4QP',
    total: 2100,
    members: [
      {
        userId: 'you',
        name: 'You',
        you: true,
        presence: Presence.Here,
        look: 0,
      },
      {
        userId: 'maya',
        name: 'Maya',
        you: false,
        presence: Presence.Here,
        look: 1,
      },
      {
        userId: 'jo',
        name: 'Jo',
        you: false,
        presence: Presence.Resting,
        look: 4,
      },
      { userId: 'sam', name: 'Sam', you: false, presence: null, look: 2 },
    ],
    fish: [{ id: 'f1', fromName: 'Maya', day: today }],
    fishSentToday: 0,
    postcards: [
      {
        id: 'p1',
        fromName: 'Maya',
        fromId: 'maya',
        stopId: '1-north-atlantic',
        yours: false,
      },
    ],
    dishes: [
      {
        id: 'd1',
        fromName: 'Maya',
        fromId: 'maya',
        stop: '1-iceland',
        ...LENTIL_SOUP,
        yours: false,
      },
    ],
    blocked: [],
    flyPrivately: false,
    shareResting: false,
  };
}

/**
 * Made-up friends shown alongside your real ternary (`withSampleFriends`): one of each way a
 * friend can look today (here, resting and shared, quiet), and what they send.
 */
export class SampleFriends {
  /** Every made-up id starts with this, so they're told apart from real accounts. */
  static readonly ID_PREFIX = 'sample-';

  /** Each with the bird they'd choose; `withSampleFriends` moves one a real friend flies. */
  static readonly MEMBERS: readonly TernaryMember[] = [
    SampleFriends.member('maya', 'Maya', Presence.Here, 1),
    SampleFriends.member('jo', 'Jo', Presence.Resting, 4),
    SampleFriends.member('ari', 'Ari', Presence.Here, 2),
    SampleFriends.member('sam', 'Sam', null, 6),
    SampleFriends.member('lou', 'Lou', Presence.Here, 3),
  ];

  static isOne(id: string): boolean {
    return id.startsWith(SampleFriends.ID_PREFIX);
  }

  static id(name: string): string {
    return `${SampleFriends.ID_PREFIX}${name}`;
  }

  /** A fish from Maya, waiting today. */
  static fish(today: string): Fish[] {
    return [{ id: SampleFriends.id('fish-1'), fromName: 'Maya', day: today }];
  }

  /** Postcards from the first two stops on everyone's own (Greenland) journey. */
  static postcards(): Postcard[] {
    return [
      {
        id: SampleFriends.id('card-1'),
        fromName: 'Maya',
        fromId: SampleFriends.id('maya'),
        stopId: `1-${Milestones.STOPS[1].id}`,
        yours: false,
      },
      {
        id: SampleFriends.id('card-2'),
        fromName: 'Jo',
        fromId: SampleFriends.id('jo'),
        stopId: `1-${Milestones.STOPS[0].id}`,
        yours: false,
      },
    ];
  }

  /** Two recipes at the stop the shared bird rests at (`stop`), one from an earlier stop. */
  static dishes(stop: string, earlier: string): Dish[] {
    return [
      {
        id: SampleFriends.id('dish-1'),
        fromName: 'Maya',
        fromId: SampleFriends.id('maya'),
        stop,
        ...LENTIL_SOUP,
        yours: false,
      },
      {
        id: SampleFriends.id('dish-2'),
        fromName: 'Jo',
        fromId: SampleFriends.id('jo'),
        stop,
        name: 'Mulled cider',
        foods: ['Apple cider', 'Orange', 'Cinnamon', 'Cloves'],
        yours: false,
      },
      {
        id: SampleFriends.id('dish-3'),
        fromName: 'Ari',
        fromId: SampleFriends.id('ari'),
        stop: earlier,
        name: 'Sunday pancakes',
        foods: [
          'Flour',
          'Eggs',
          'Milk',
          'Butter',
          'Blueberries',
          'Maple syrup',
        ],
        yours: false,
      },
    ];
  }

  private static member(
    name: string,
    display: string,
    presence: Presence | null,
    look: number,
  ): TernaryMember {
    return {
      userId: SampleFriends.id(name),
      name: display,
      you: false,
      presence,
      look,
    };
  }
}
