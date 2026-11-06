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
    canaries: {
      source: require('../../../../assets/destinations/canaries.jpg'),
      author: 'Bengt Nyman',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Sterna_hirundo_EM1B3116_(46730474795).jpg',
    },
    bijagos: {
      source: require('../../../../assets/destinations/bijagos.jpg'),
      author: 'rangersara',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:Thalasseus_albididorsalis,_Langue_de_Barbarie_NP,_Saint-Louis_Region,_Senegal_05.jpg',
    },
    'cape-palmas': {
      source: require('../../../../assets/destinations/cape-palmas.jpg'),
      author: 'Denis Carrascosa',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:2015-11-21_Thalasseus_albididorsalis,_Assinie,_C%C3%B4te_d%27Ivoire.jpg',
    },
    'gulf-of-guinea': {
      source: require('../../../../assets/destinations/gulf-of-guinea.jpg'),
      author: 'Charles J. Sharp',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Brown_noddy_(Anous_stolidus_stolidus)_in_flight.jpg',
    },
    angola: {
      source: require('../../../../assets/destinations/angola.jpg'),
      author: 'jlrsousa',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Beach_of_Coatinha_in_Benguela,_Angola.jpg',
    },
    'polar-front': {
      source: require('../../../../assets/destinations/polar-front.jpg'),
      author: 'David Stanley',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Southern_Ocean_Iceberg_(15784345808).jpg',
    },
    'maud-land': {
      source: require('../../../../assets/destinations/maud-land.jpg'),
      author: 'NASA ICE',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Pack_edge_(30205822773).jpg',
    },
    brunt: {
      source: require('../../../../assets/destinations/brunt.jpg'),
      author: 'NASA/Michael Studinger',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Brunt_Ice_Shelf_(6245421670).jpg',
    },
    peninsula: {
      source: require('../../../../assets/destinations/peninsula.jpg'),
      author: 'Greg Lasley',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Chick_and_adult_Antarctic_tern.jpg',
    },
    'south-orkney': {
      source: require('../../../../assets/destinations/south-orkney.jpg'),
      author: 'Morhua',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:South_Orkney_Islands.jpg',
    },
    tristan: {
      source: require('../../../../assets/destinations/tristan.jpg'),
      author: 'michael clarke stuff',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Antarctic_Tern.jpg',
    },
    'st-helena': {
      source: require('../../../../assets/destinations/st-helena.jpg'),
      author: 'Kevstan',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:White_terns_in_Saint_Helena.jpg',
    },
    ascension: {
      source: require('../../../../assets/destinations/ascension.jpg'),
      author: 'Drew Avery',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Onychoprion_fuscatus_Ascension_Island_1.jpg',
    },
    sargasso: {
      source: require('../../../../assets/destinations/sargasso.jpg'),
      author: 'James St. John',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Sargassum_natans_(brown_algae)_(San_Salvador_Island,_Bahamas)_1_(15867880028).jpg',
    },
    scoresby: {
      source: require('../../../../assets/destinations/scoresby.jpg'),
      author: 'Hannes Grobe',
      license: 'CC BY-SA 2.5',
      url: 'https://commons.wikimedia.org/wiki/File:Greenland-scoresby-sund_hg.jpg',
    },
  };
}

/** The photo for a stop, by its id within a migration (`iceland`, not `2-iceland`). */
export function photoFor(stopId: string): DestinationPhoto | null {
  return DestinationPhotos.BY_STOP[stopId] ?? null;
}
