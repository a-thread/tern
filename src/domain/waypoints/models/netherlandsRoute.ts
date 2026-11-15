import {
  type GeoPoint,
  MigrationPhase,
  type RouteStop,
} from './migrationRoute';

const south = MigrationPhase.South;
const winter = MigrationPhase.Winter;
const north = MigrationPhase.North;

/**
 * One year's migration as tracked Dutch Arctic terns fly it (Fijn et al. 2013; see
 * docs/journey-route-sources.md): west through the English Channel, a short North Atlantic
 * stopover, straight down the Atlantic to the Walvis Ridge off Namibia, round Africa into the
 * Indian Ocean past Amsterdam Island and the Great Australian Bight, to Wilkes Land; west along
 * the East Antarctic ice through the southern summer; then home up the Atlantic in about 34
 * days. About 90,000 km, the longest bird migration recorded.
 *
 * Each phase is as long as the tracked birds flew it (`PHASE_KM`); within a phase, a stop's
 * `km` shares that distance out by the great-circle length of each leg, rounded to 50. The
 * stops between the documented places are on or beside the route, close enough together that
 * no leg takes more than about four weeks at a typical pace. The paper gives the trip north's
 * length and speed, not its path, so the northward stops are places on the way home up the
 * Atlantic. Stop ids start with `nl-`, so they never clash with the Greenland route's.
 * Nothing here depends on weight or calories.
 */
export class NetherlandsRoute {
  /**
   * South: 29,700 km to Antarctic waters (Fijn et al. 2013). North: 34 days at about 610 km
   * a day. Winter: the rest of the year's 90,000 km, foraging along the ice.
   */
  static readonly PHASE_KM: Readonly<Record<MigrationPhase, number>> = {
    [MigrationPhase.South]: 29_700,
    [MigrationPhase.Winter]: 39_600,
    [MigrationPhase.North]: 20_700,
  };

  static readonly SOURCES: { cite: string; title: string; url: string }[] = [
    {
      cite: 'Fijn et al. 2013, Ardea',
      title:
        'Arctic Terns Sterna paradisaea from the Netherlands migrate record distances across three oceans to Wilkes Land, East Antarctica',
      url: 'https://doi.org/10.5253/078.101.0102',
    },
  ];

  /** Where the trip starts and ends: the Dutch coast. */
  static readonly COLONY: GeoPoint = { lat: 52.6, lon: 4.6 };

  static readonly STOPS: RouteStop[] = [
    {
      id: 'nl-channel',
      name: 'The English Channel',
      note: 'After a while at sea near the North Sea, Dutch terns head west through the English Channel or the Irish Sea.',
      km: 650,
      at: { lat: 50, lon: -2.5 },
      phase: south,
      facts: [
        'After breeding, Dutch terns first stay at sea near the North Sea, then head west through the English Channel or the Irish Sea.',
        'All seven terns fitted with 1.5 g trackers in the Netherlands in 2011 were recaptured the next year, and five loggers still held their data.',
      ],
    },
    {
      id: 'nl-north-atlantic',
      name: 'The North Atlantic stopover',
      note: 'Dutch terns stop out here too, but only for about a week.',
      km: 3_100,
      at: { lat: 46, lon: -32 },
      phase: south,
      facts: [
        'Greenland terns lingered about a month at their North Atlantic stopover, while Dutch terns stayed only about a week.',
        'An Arctic tern doesn’t fly nonstop. It stops along the way to feed and rest, and it reaches the far end all the same.',
      ],
    },
    {
      id: 'nl-cape-verde',
      name: 'Off West Africa',
      note: 'From here the Dutch birds take a direct line south across the Atlantic.',
      km: 7_100,
      at: { lat: 14, lon: -24 },
      phase: south,
      facts: [
        'Unlike some Greenland birds, none of the tracked Dutch terns followed the South American coast. They took a more direct route across the Atlantic.',
        'When the winds are with it, a migrating tern can cover hundreds of kilometres in a day.',
      ],
    },
    {
      id: 'nl-equatorial-atlantic',
      name: 'The equatorial Atlantic',
      note: 'Over the equator and into the southern half of the world.',
      km: 9_750,
      at: { lat: -4, lon: -12 },
      phase: south,
      facts: [
        'In one year an Arctic tern flies farther than the distance around the Earth at the equator.',
        'Migrating Arctic terns usually travel in small flocks of fewer than 15 birds, yet the tracked birds crossed the equator within days of each other.',
      ],
    },
    {
      id: 'nl-walvis-ridge',
      name: 'The Walvis Ridge',
      note: 'A month of feeding in the Benguela Current, over a chain of underwater mountains.',
      km: 12_850,
      at: { lat: -22, lon: 6 },
      phase: south,
      facts: [
        'Dutch terns spent about a month in the Benguela Current off Namibia, feeding over an underwater chain of seamounts called the Walvis Ridge.',
      ],
    },
    {
      id: 'nl-agulhas',
      name: 'Cape Agulhas',
      note: 'Round the southern tip of Africa, out of the Atlantic and into a second ocean.',
      km: 15_200,
      at: { lat: -37, lon: 20 },
      phase: south,
      facts: [
        'Arctic terns from the Netherlands flew about 90,000 km in a year, nearly 20,000 km more than Greenland terns, the longest bird migration recorded.',
      ],
    },
    {
      id: 'nl-southwest-indian',
      name: 'The southwest Indian Ocean',
      note: 'East across the Indian Ocean, where Greenland terns never go.',
      km: 17_950,
      at: { lat: -39, lon: 48 },
      phase: south,
      facts: [
        'Arctic terns that nest in the Netherlands also fly to Antarctica, and some spend the southern summer on the opposite side of the continent from the Greenland birds.',
      ],
    },
    {
      id: 'nl-amsterdam-island',
      name: 'Amsterdam Island',
      note: 'A stopover in the middle of the Indian Ocean that nobody knew about until these terns were tracked.',
      km: 20_750,
      at: { lat: -37.8, lon: 77.5 },
      phase: south,
      facts: [
        'Dutch Arctic terns found a stopover nobody knew of, in the Indian Ocean near Amsterdam Island, between 20 and 40°S.',
      ],
    },
    {
      id: 'nl-great-australian-bight',
      name: 'The Great Australian Bight',
      note: 'Some Dutch terns detour along southern Australia before turning south for the ice.',
      km: 25_950,
      at: { lat: -36, lon: 131 },
      phase: south,
      facts: [
        'Two tracked Dutch terns spent time in the Great Australian Bight on their way south to Antarctica.',
        'One tern tagged in the Netherlands flew on past Australia to New Zealand before turning south to Antarctica.',
      ],
    },
    {
      id: 'nl-wilkes-land',
      name: 'Wilkes Land',
      note: 'Antarctic waters at last, on the far side of the world from home.',
      km: 29_700,
      at: { lat: -65, lon: 115 },
      phase: south,
      facts: [
        'Dutch terns reached Antarctic waters around 12 November, after about 110 days and 29,700 km of travel.',
        'A Dutch tern’s breeding colony and its farthest winter spot lie almost exactly on opposite sides of the globe.',
        'A ringed Danish tern was recovered in Wilkes Land, East Antarctica, long before trackers confirmed that terns winter there.',
      ],
    },
    {
      id: 'nl-knox-coast',
      name: 'The Knox Coast',
      note: 'Drifting slowly west along the edge of the ice, feeding through the southern summer.',
      km: 34_050,
      at: { lat: -65.5, lon: 107 },
      phase: winter,
      facts: [
        'In Antarctica, tracked Dutch terns drifted slowly westward along the ice edge between mid-November and mid-March.',
      ],
    },
    {
      id: 'nl-shackleton',
      name: 'The Shackleton Ice Shelf',
      note: 'Still westward along the ice, in waters busy with terns.',
      km: 38_350,
      at: { lat: -65.5, lon: 99 },
      phase: winter,
      facts: [
        'Arctic terns are among the most abundant birds off East Antarctica in the southern summer, according to ship surveys.',
      ],
    },
    {
      id: 'nl-queen-mary-land',
      name: 'Queen Mary Land',
      note: 'Pack ice as far as the eye can see, and food all through it.',
      km: 42_600,
      at: { lat: -66, lon: 91 },
      phase: winter,
      facts: [
        'In the Antarctic, Arctic terns concentrate in the pack-ice zone, notably off East Antarctica and in the Weddell, Ross and Amundsen seas.',
      ],
    },
    {
      id: 'nl-west-ice-shelf',
      name: 'The West Ice Shelf',
      note: 'A chance to rest on the ice between long days of fishing.',
      km: 46_250,
      at: { lat: -66, lon: 84 },
      phase: winter,
      facts: [
        'Terns have been seen resting on drifting ice floes in the southern summer.',
      ],
    },
    {
      id: 'nl-prydz-bay',
      name: 'Prydz Bay',
      note: 'Still on the ice edge, months into the long Antarctic summer.',
      km: 50_100,
      at: { lat: -67, lon: 77 },
      phase: winter,
      facts: [
        'Terns tracked from the Netherlands spent about 273 days away from their colony, nearly nine months, including roughly 128 days in the Antarctic ice zone.',
      ],
    },
    {
      id: 'nl-lars-christensen',
      name: 'The Lars Christensen Coast',
      note: 'Fishing in the channels between the floes.',
      km: 53_600,
      at: { lat: -67, lon: 70 },
      phase: winter,
      facts: [
        'In winter, Arctic terns forage near ice floes and icebergs, up to about 24 km offshore, often in the channels between floes.',
      ],
    },
    {
      id: 'nl-mac-robertson-land',
      name: 'Mac. Robertson Land',
      note: 'The westward drift goes on, between the ice and the open Southern Ocean.',
      km: 57_150,
      at: { lat: -67, lon: 63 },
      phase: winter,
      facts: [
        'Dutch terns spent most of the austral summer in the Southern Ocean between about 35°E and 150°E.',
        'Researchers once suggested that terns circle Antarctica before flying north, but tracking of Dutch terns found no sign of it.',
      ],
    },
    {
      id: 'nl-kemp-land',
      name: 'Kemp Land',
      note: 'Krill swarms in the cold water feed the whole long summer.',
      km: 60_750,
      at: { lat: -66.5, lon: 56 },
      phase: winter,
      facts: [
        'In the far south, terns feed on krill, tiny shrimp-like animals that swarm in the cold ocean.',
        'In the Antarctic, Arctic terns may forage alongside Antarctic minke whales in open water north of the pack ice.',
      ],
    },
    {
      id: 'nl-enderby-land',
      name: 'Enderby Land',
      note: 'Nearing the western end of the summer on the ice.',
      km: 64_950,
      at: { lat: -66, lon: 48 },
      phase: winter,
      facts: [
        'Terns from the Netherlands winter off East Antarctica, not in the Weddell Sea like Greenland terns, so not all Arctic terns share one winter home.',
      ],
    },
    {
      id: 'nl-lutzow-holm',
      name: 'Lützow-Holm Bay',
      note: 'The last of the ice before the long flight home.',
      km: 69_300,
      at: { lat: -68, lon: 41 },
      phase: winter,
      facts: [
        'An Arctic tern’s winter range is about twice the size of its breeding range, roughly 126 million versus 65 million square kilometers.',
      ],
    },
    {
      id: 'nl-south-atlantic',
      name: 'The South Atlantic',
      note: 'Heading home: north up the Atlantic, fast.',
      km: 73_450,
      at: { lat: -45, lon: 5 },
      phase: north,
      facts: [
        'All five tracked Dutch terns were back at their colonies by the end of April, after a 34-day trip north that averaged about 610 km a day.',
      ],
    },
    {
      id: 'nl-tropical-atlantic',
      name: 'The tropical South Atlantic',
      note: 'Warm water again after months on the ice.',
      km: 78_150,
      at: { lat: -15, lon: -12 },
      phase: north,
      facts: [
        'Arctic terns recorded on the way north have taken between 25 and 46 days to fly from Antarctic waters back to the Arctic.',
      ],
    },
    {
      id: 'nl-equator',
      name: 'The equator',
      note: 'Back into the northern half of the world, halfway home.',
      km: 81_500,
      at: { lat: 5, lon: -25 },
      phase: north,
      facts: [
        'Researchers suggest that terns from Norway, Svalbard or Arctic Russia could migrate even farther than Dutch terns if they winter off East Antarctica.',
      ],
    },
    {
      id: 'nl-azores',
      name: 'Past the Azores',
      note: 'The North Atlantic once more, with Europe ahead.',
      km: 86_150,
      at: { lat: 38, lon: -28 },
      phase: north,
      facts: [
        'The first big review of where Arctic terns migrate, in 1967, was pieced together from ring recoveries and sightings.',
      ],
    },
    {
      id: 'nl-biscay',
      name: 'The Bay of Biscay',
      note: 'Europe again, with the North Sea only a few days away.',
      km: 88_500,
      at: { lat: 46, lon: -8 },
      phase: north,
      facts: [
        'Hundreds of Arctic terns cross Britain from the Atlantic to the North Sea each spring, and may pause at lakes and reservoirs on the way.',
      ],
    },
    {
      id: 'nl-colony',
      name: 'The Netherlands',
      note: 'Home to the Dutch coast, about 90,000 km later.',
      km: 90_000,
      at: { lat: 52.6, lon: 4.6 },
      phase: north,
      facts: [
        'Arctic terns reach their colonies from late April in the Netherlands to late June around Hudson Bay.',
      ],
    },
  ];
}
