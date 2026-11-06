/** A place on the globe, in degrees: north and east are positive. */
export type GeoPoint = { lat: number; lon: number };

/** Which part of the year's trip a stop is on, for how its distance is worked out. */
export enum MigrationPhase {
  South = 'south',
  Winter = 'winter',
  North = 'north',
}

export type RouteStop = {
  id: string;
  name: string;
  /** A line about the place, for the card that celebrates reaching it. */
  note: string;
  /** A few short facts about the place, for its card on Journey. */
  facts: string[];
  /** Kilometres from the colony to this stop, as the tracked terns flew it. */
  km: number;
  /** Where the stop is, for the map on Journey. */
  at: GeoPoint;
  phase: MigrationPhase;
};

/**
 * One year's migration as tracked Greenland terns fly it (Egevang et al. 2010, with the
 * eastward swing into the Antarctic from Alerstam et al. 2019; see
 * docs/journey-route-sources.md). South from the colony, down the African coast and the
 * Benguela Current, east to the ice off Dronning Maud Land, west with the ice through the
 * southern summer, then home on the loops round the South and North Atlantic gyres.
 *
 * Each phase is as long as the tracked birds flew it on average (`PHASE_KM`); within a
 * phase, a stop's `km` shares that distance out by the great-circle length of each leg,
 * rounded to 50. Nothing here depends on weight or calories.
 */
export class MigrationRoute {
  /** How far the tern flies for each waypoint. A migration takes about a year at a typical pace. */
  static readonly KM_PER_WAYPOINT = 2.5;

  /** Mean distance flown in each phase by the tracked Greenland terns (Egevang et al. 2010). */
  static readonly PHASE_KM: Readonly<Record<MigrationPhase, number>> = {
    [MigrationPhase.South]: 34_600,
    [MigrationPhase.Winter]: 10_900,
    [MigrationPhase.North]: 25_700,
  };

  /** Where the trip starts and ends: the colony on Sand Island, northeast Greenland. */
  static readonly COLONY: GeoPoint = { lat: 74.3, lon: -20 };

  static readonly STOPS: RouteStop[] = [
    {
      id: 'iceland',
      name: 'Iceland',
      note: 'Heading south, the route passes Iceland, home to one of the largest Arctic tern colonies anywhere.',
      km: 1_900,
      at: { lat: 65, lon: -22 },
      phase: MigrationPhase.South,
      facts: [
        'Icelanders call the Arctic tern kría, after the sound of its call.',
        'Nesting terns dive at anyone who walks too close, so walkers near colonies sometimes hold a stick above their heads.',
        'In midsummer the sun barely sets here, so terns can fish almost around the clock.',
      ],
    },
    {
      id: 'north-atlantic',
      name: 'The North Atlantic stopover',
      note: 'Tracked terns pause out here for weeks, feeding up before the long run south.',
      km: 5_850,
      at: { lat: 47, lon: -35 },
      phase: MigrationPhase.South,
      facts: [
        'Nobody knew about this stopover until tiny trackers, fitted to Greenland terns in 2007, showed them circling this patch of ocean.',
        'Greenland terns spend about 25 days out here, feeding up before the long run south.',
        'Terns from Iceland and from the Netherlands stop here too, though the Dutch birds only stay about a week.',
      ],
    },
    {
      id: 'azores',
      name: 'The Azores',
      note: 'Islands in the middle of the ocean, a rare patch of land that terns fly past on the way south.',
      km: 7_850,
      at: { lat: 38.5, lon: -28 },
      phase: MigrationPhase.South,
      facts: [
        'The Azores are nine volcanic islands, about 1,400 km west of Portugal.',
        'Common and roseate terns nest here, and the islands are one of the most important places in Europe for roseate terns.',
      ],
    },
    {
      id: 'canaries',
      name: 'The Canary Islands',
      note: 'Off northwest Africa the cool Canary Current runs south, and the terns follow it toward the tropics.',
      km: 10_700,
      at: { lat: 28.3, lon: -16.5 },
      phase: MigrationPhase.South,
      facts: [
        'The nearest of the islands is only about 100 km from the coast of Morocco.',
        'Mount Teide on Tenerife, at 3,715 m, is the highest mountain in Spain.',
        'The islands are named after dogs (canis in Latin), not birds. The canary was named after the islands.',
      ],
    },
    {
      id: 'cape-verde',
      name: 'Cape Verde',
      note: 'The terns keep south past these islands, toward the place where their routes split.',
      km: 13_700,
      at: { lat: 15, lon: -23.6 },
      phase: MigrationPhase.South,
      facts: [
        'Ten volcanic islands sit about 570 km off the coast of West Africa.',
        'The Cape Verde shearwater, a seabird that breeds nowhere else in the world, nests on these islands.',
      ],
    },
    {
      id: 'bijagos',
      name: 'The Bijagós Islands',
      note: 'Around here the routes split: most tracked terns kept to the African coast, while some crossed the ocean to Brazil.',
      km: 15_350,
      at: { lat: 11.3, lon: -16.1 },
      phase: MigrationPhase.South,
      facts: [
        'The archipelago off Guinea-Bissau has 88 islands and islets, and people live on only about 20 of them.',
        'Its tidal mudflats hold hundreds of thousands of wintering shorebirds, among the most anywhere in West Africa.',
        'Hippos here swim in the sea between the islands, something they do almost nowhere else.',
      ],
    },
    {
      id: 'cape-palmas',
      name: 'Cape Palmas',
      note: 'At the southern tip of Liberia the coast turns east, and the Gulf of Guinea begins.',
      km: 17_600,
      at: { lat: 4.4, lon: -7.7 },
      phase: MigrationPhase.South,
      facts: [
        'Geographers draw the western edge of the Gulf of Guinea from here.',
        'The town of Harper, on the cape, began in the 1830s as Maryland in Africa, a colony founded by freed African Americans.',
      ],
    },
    {
      id: 'gulf-of-guinea',
      name: 'São Tomé and the Gulf of Guinea',
      note: 'The route crosses the equator in the Gulf of Guinea, past the volcanic islands of São Tomé and Príncipe.',
      km: 20_650,
      at: { lat: 0.3, lon: 6.6 },
      phase: MigrationPhase.South,
      facts: [
        'The equator and the prime meridian cross in this gulf, out at sea south of Ghana.',
        'The equator runs right across Ilhéu das Rolas, a small island just off São Tomé.',
        'São Tomé and Príncipe is the second-smallest country in Africa.',
      ],
    },
    {
      id: 'angola',
      name: 'The Angolan coast',
      note: 'South of the equator, the terns follow cold, fish-rich water down the coast of Angola.',
      km: 23_500,
      at: { lat: -12.5, lon: 12.5 },
      phase: MigrationPhase.South,
      facts: [
        'The Benguela Current, the cold current that feeds terns all the way down to the Cape, is named after the Angolan port of Benguela.',
        'In the far south of Angola the Namib Desert runs right down to the sea.',
        "The country's currency, the kwanza, takes its name from the Kwanza River.",
      ],
    },
    {
      id: 'namibia',
      name: 'The Namibian coast',
      note: 'Tracked terns linger in the cold, rich Benguela Current, feeding up for the Southern Ocean.',
      km: 25_650,
      at: { lat: -23, lon: 13.5 },
      phase: MigrationPhase.South,
      facts: [
        'The cold Benguela Current flows north along this coast, carrying rich water up from the deep.',
        'The Namib, one of the oldest deserts on Earth, runs right down to the sea here.',
        'Damara terns, among the smallest terns in the world, nest on the gravel plains near the shore.',
      ],
    },
    {
      id: 'cape-town',
      name: 'Cape Town',
      note: 'At the tip of Africa, the route turns toward the Southern Ocean.',
      km: 28_050,
      at: { lat: -34.3, lon: 17.6 },
      phase: MigrationPhase.South,
      facts: [
        'Many say the Atlantic and Indian Oceans meet at Cape Point, though the official line is at Cape Agulhas, further east.',
        'Antarctic terns, close cousins of the Arctic tern, spend the southern winter on these shores.',
      ],
    },
    {
      id: 'polar-front',
      name: 'The Antarctic Polar Front',
      note: 'Here the cold Southern Ocean slides under warmer water from the north, and the sea turns colder within a short distance.',
      km: 31_300,
      at: { lat: -50, lon: 22 },
      phase: MigrationPhase.South,
      facts: [
        'Sailors named these latitudes the Roaring Forties and the Furious Fifties, for winds that blow almost unbroken round the globe.',
        'The front circles the whole of Antarctica without a break, at roughly 50 to 60 degrees south.',
      ],
    },
    {
      id: 'maud-land',
      name: 'The ice off Dronning Maud Land',
      note: 'Most tracked Greenland terns swung east before they reached the ice, then turned west and followed its edge.',
      km: 34_600,
      at: { lat: -66, lon: 27 },
      phase: MigrationPhase.South,
      facts: [
        'This coast is named after Queen Maud of Norway, wife of King Haakon VII.',
        'Sea ice around Antarctica grows to about 18 million km² each winter and shrinks to about 3 million km² by the end of summer.',
        'Tracked terns reached the ice in November, as it began to break up for the southern summer.',
      ],
    },
    {
      id: 'brunt',
      name: 'The Brunt Ice Shelf',
      note: 'Through the southern summer the terns drift slowly west along the ice, feeding as they go.',
      km: 39_650,
      at: { lat: -75.5, lon: -26.5 },
      phase: MigrationPhase.Winter,
      facts: [
        "The British Antarctic Survey's Halley station stands on this floating ice on legs with skis, so it can be towed somewhere safer.",
        'In 1985 scientists working at Halley published the discovery of the ozone hole.',
        'In 2023 a piece of the shelf about 1,550 km² broke away as a new iceberg.',
      ],
    },
    {
      id: 'weddell',
      name: 'The Weddell Sea',
      note: 'Terns spend the southern summer here by the pack ice, in almost constant daylight.',
      km: 41_300,
      at: { lat: -72, lon: -45 },
      phase: MigrationPhase.Winter,
      facts: [
        'The sea is named after James Weddell, a British sealer who sailed into it in 1823.',
        "Shackleton's ship Endurance was crushed by its ice in 1915. The wreck was found in 2022, about 3,000 m down.",
        'With summer at both ends of the trip, Arctic terns see more daylight than any other animal.',
      ],
    },
    {
      id: 'peninsula',
      name: 'The Antarctic Peninsula',
      note: 'At the western edge of their summer range, terns reach the long arm of Antarctica that points toward South America.',
      km: 43_900,
      at: { lat: -63.3, lon: -57 },
      phase: MigrationPhase.Winter,
      facts: [
        'The Drake Passage, about 800 km wide, separates the peninsula from Cape Horn.',
        'Since the 1950s, its western side has warmed faster than almost anywhere else in the Southern Hemisphere.',
        'Antarctic terns nest here; Arctic terns, only visiting for the southern summer, never do.',
      ],
    },
    {
      id: 'south-orkney',
      name: 'The South Orkney Islands',
      note: 'The last stop by the ice. Tracked terns set off north from these waters in mid-April.',
      km: 45_500,
      at: { lat: -60.6, lon: -45.5 },
      phase: MigrationPhase.Winter,
      facts: [
        "Argentina's Orcadas base on Laurie Island has been staffed since 1904, the longest of any station in Antarctica.",
        'The sealers George Powell and Nathaniel Palmer found the islands in 1821.',
        'In 2009 the sea south of the islands became the first marine protected area set up entirely on the high seas.',
      ],
    },
    {
      id: 'south-georgia',
      name: 'South Georgia',
      note: 'A wild island famous for its seabirds, at the edge of the Southern Ocean that terns leave behind on the way north.',
      km: 46_750,
      at: { lat: -54.3, lon: -36.5 },
      phase: MigrationPhase.North,
      facts: [
        "The explorer Ernest Shackleton is buried at Grytviken, the island's old whaling station.",
        'Millions of seabirds, seals and penguins breed here, including king penguins and wandering albatrosses.',
      ],
    },
    {
      id: 'tristan',
      name: 'Tristan da Cunha',
      note: 'Heading home, the terns loop anticlockwise round the South Atlantic, past the most remote inhabited island on Earth.',
      km: 50_450,
      at: { lat: -37.1, lon: -12.3 },
      phase: MigrationPhase.North,
      facts: [
        'About 250 people live here, some 2,400 km from Cape Town, all in one village, Edinburgh of the Seven Seas.',
        'In 1961 a volcanic eruption sent the whole island to England for two years.',
        'Nearby Gough Island is one of the most important seabird islands in the world.',
      ],
    },
    {
      id: 'st-helena',
      name: 'St Helena',
      note: 'Riding the trade winds, the terns swing northwest past this lone island.',
      km: 53_900,
      at: { lat: -15.95, lon: -5.7 },
      phase: MigrationPhase.North,
      facts: [
        'Napoleon was exiled here after Waterloo, and died on the island in 1821.',
        'Jonathan, a giant tortoise living here, hatched around 1832 and is thought to be the oldest land animal alive.',
        'Until its airport opened to regular flights in 2017, the only way to get here was by ship.',
      ],
    },
    {
      id: 'ascension',
      name: 'Ascension Island',
      note: 'A volcanic island in the middle of the ocean, and one of the great tern colonies of the tropics.',
      km: 55_700,
      at: { lat: -7.95, lon: -14.4 },
      phase: MigrationPhase.North,
      facts: [
        'Sooty terns nest here in huge numbers. Their call earned them the local name "wideawake", and the airfield is named after them.',
        'Green turtles swim more than 2,000 km from Brazil to lay their eggs on its beaches.',
        'The cloud forest on Green Mountain was planted by people, starting in the 1840s on the advice of the botanist Joseph Hooker.',
      ],
    },
    {
      id: 'mid-atlantic',
      name: 'The mid-Atlantic',
      note: 'Tracked terns crossed the equator here in early May, much faster than on the way south.',
      km: 58_900,
      at: { lat: 5, lon: -30 },
      phase: MigrationPhase.North,
      facts: [
        'The trip home is much quicker than the trip south: about 40 days instead of about 90.',
        'Heading north, tracked terns averaged about 520 km a day, against about 330 km a day going south.',
        'Far below runs the Mid-Atlantic Ridge, the longest mountain range on Earth, almost all of it under water.',
      ],
    },
    {
      id: 'sargasso',
      name: 'The edge of the Sargasso Sea',
      note: 'North of the equator the route bends west, clockwise round the North Atlantic gyre, whose calm centre is the Sargasso Sea.',
      km: 63_250,
      at: { lat: 27, lon: -48 },
      phase: MigrationPhase.North,
      facts: [
        'It is the only sea with no coastline. Ocean currents are its only borders.',
        'It is named after sargassum, a seaweed that floats on the surface in great golden mats.',
        'European and American eels both travel here to spawn.',
      ],
    },
    {
      id: 'newfoundland',
      name: 'Newfoundland',
      note: 'Round the gyre the route turns north past Newfoundland, back to the stretch of ocean the terns stopped at on the way south.',
      km: 66_700,
      at: { lat: 49, lon: -49.5 },
      phase: MigrationPhase.North,
      facts: [
        'Arctic terns and common terns both nest along these coasts.',
        'In spring, icebergs from Greenland drift past here along what locals call Iceberg Alley.',
      ],
    },
    {
      id: 'scoresby',
      name: 'Scoresby Sound',
      note: 'Almost home: the last stretch runs up the east coast of Greenland.',
      km: 70_600,
      at: { lat: 70.5, lon: -22 },
      phase: MigrationPhase.North,
      facts: [
        'It is one of the largest fjord systems in the world, with arms reaching about 350 km inland.',
        'Ittoqqortoormiit, at its mouth, is one of the most remote towns on Earth, home to about 330 people.',
        'The whaler and scientist William Scoresby charted this coast in 1822.',
      ],
    },
    {
      id: 'greenland',
      name: 'Home to Greenland',
      note: 'Back at the colony, where terns return to nest year after year, often to the same spot.',
      km: 71_200,
      at: { lat: 74.3, lon: -20 },
      phase: MigrationPhase.North,
      facts: [
        'Tracked Greenland terns flew about 70,900 km in a year, the longest migration then recorded for any animal.',
        'Arctic terns can live for more than 30 years, and a lifetime of migrations adds up to about three trips to the Moon and back.',
      ],
    },
  ];
}
