import type { ImageSourcePropType } from 'react-native';

export type DestinationPhoto = {
  source: ImageSourcePropType;
  /** As the photographer is credited on Wikimedia Commons. */
  author: string;
  license: string;
  /** The photo's page on Wikimedia Commons, where its licence is given in full. */
  url: string;
};

/**
 * A photo for each stop, by `Milestones.STOPS` id: terns there where Wikimedia Commons has one,
 * else the kind of tern the stop's facts mention, else the place. All are free to reuse with
 * credit, which the card shows.
 */
export class DestinationPhotos {
  static readonly BY_STOP: Readonly<Record<string, DestinationPhoto>> = {
    iceland: {
      source: require('../../../../assets/destinations/iceland.jpg'),
      author: 'Charles J. Sharp',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Arctic_tern_(Sterna_paradisaea)_hovering_with_food_over_nest_Flatey.jpg',
    },
    'north-atlantic': {
      source: require('../../../../assets/destinations/north-atlantic.jpg'),
      author: 'Warren Garst',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Arctic_tern_in_flight_-_DPLA_-_4c236603f6795c57a240bc51f5992b5a.jpg',
    },
    azores: {
      source: require('../../../../assets/destinations/azores.jpg'),
      author: 'Jules Verne Times Two',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Common_terns_(Sterna_hirundo)_near_the_southern_cliffs_of_Santa_Maria,_Azores,_Portugal_(PPL1-Corrected)_(approx._GPS_location)_julesvernex2.jpg',
    },
    'cape-verde': {
      source: require('../../../../assets/destinations/cape-verde.jpg'),
      author: 'Cayambe',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Praia_coast_Cape_Verde_2011.jpg',
    },
    namibia: {
      source: require('../../../../assets/destinations/namibia.jpg'),
      author: 'baldcoot',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:Damara_Tern,_Cape_Recife,_Eastern_Cape,_South_Africa_1.jpg',
    },
    'cape-town': {
      source: require('../../../../assets/destinations/cape-town.jpg'),
      author: 'michael clarke stuff',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Antarctic_tern_-_Sterna_vittata.jpg',
    },
    weddell: {
      source: require('../../../../assets/destinations/weddell.jpg'),
      author: 'Jerzy Strzelecki',
      license: 'CC BY 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Antarctic,_arctic_terns_(js)_63.jpg',
    },
    'south-georgia': {
      source: require('../../../../assets/destinations/south-georgia.jpg'),
      author: 'Liam Quinn',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Antarctic_Tern_at_St._Andrews_Bay,_South_Georgia_(5817252970).jpg',
    },
    'mid-atlantic': {
      source: require('../../../../assets/destinations/mid-atlantic.jpg'),
      author: 'Warren Garst',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Arctic_tern_in_flight_-_DPLA_-_a1cba99ef72e4f2362968764cce43156.jpg',
    },
    newfoundland: {
      source: require('../../../../assets/destinations/newfoundland.jpg'),
      author: 'Ryan Hodnett',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Common_Terns_(Sterna_hirundo)_-_Springdale,_Newfoundland_2019-08-16.jpg',
    },
    greenland: {
      source: require('../../../../assets/destinations/greenland.jpg'),
      author: 'Charles J. Sharp',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Arctic_tern_(Sterna_paradisaea)_adult_with_juvenile_Flatey.jpg',
    },
  };
}

/** The photo for a stop, by its id within a migration (`iceland`, not `2-iceland`). */
export function photoFor(stopId: string): DestinationPhoto | null {
  return DestinationPhotos.BY_STOP[stopId] ?? null;
}
