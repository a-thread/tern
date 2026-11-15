# Journey route: sources

Where the routes come from: the Greenland route in
[`MigrationRoute`](../src/domain/waypoints/models/migrationRoute.ts), which everyone's own journey
flies, and the Dutch route in [`NetherlandsRoute`](../src/domain/waypoints/models/netherlandsRoute.ts),
which a ternary can choose (see [The Dutch route](#the-dutch-route) below).

## The route and its distances

**Egevang C, Stenhouse IJ, Phillips RA, Petersen A, Fox JW, Silk JRD. 2010.** Tracking of Arctic terns
*Sterna paradisaea* reveals longest animal migration. *PNAS* 107:2078–2081.
https://doi.org/10.1073/pnas.0909493107 · full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC2836663/

Eleven terns tracked from Greenland (10) and Iceland (1) in 2007–08. The route and the phase lengths
come from here:

- Mean distances: 34,600 km southbound, 10,900 km in the wintering area, 25,700 km northbound
  (70,900 km a year on average). These are `MigrationRoute.PHASE_KM`. The three means add up to 71,200 km,
  which is the length of one migration in the app.
- The North Atlantic stopover: 41–53° N, 27–41° W, for 24.6 days on average (the North Atlantic stop).
- The southbound routes split south of the Cape Verde Islands, at about 10° N. Seven birds kept to the
  African coast and four crossed to Brazil. The app follows the African coast (the Bijagós stop).
- The wintering area: south of 58° S, between 0 and 61° W, the Weddell Sea included. Arrival 24 Nov,
  departure 16 Apr on average, after 149 days.
- Northbound: anticlockwise round the South Atlantic gyre, then clockwise round the North Atlantic gyre,
  over deep water. The equator crossing was on 3 May on average, the trip home took 40 days, and the
  birds returned to the North Atlantic stopover region in late May. Speeds were 330 km/day going south
  and 520 km/day coming home.

**Alerstam T, Bäckman J, Grönroos J, et al. 2019.** Hypotheses and tracking results about the longest
migration: the case of the arctic tern. *Ecology and Evolution* 9:9511–9531.
https://doi.org/10.1002/ece3.5459 · full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC6745660/

- Seven of the eleven Greenland terns went east into the Indian Ocean sector before reaching the ice
  (27–109° E, median 27° E). They then drifted west through the southern summer to the Weddell Sea. Hence
  the stop at the ice off Dronning Maud Land (27° E), and the winter stops running west.
- Greenland terns made a long stop in the North Atlantic, and spent a long time in the Benguela Current
  off southwest Africa (the Angolan and Namibian coast stops).
- Dutch terns stopped in the North Atlantic for about 6 days (a North Atlantic stopover fact).

The stops between those documented points are places on or beside the tracked routes, picked so that no
leg is too long. A tern doesn't land on most of them.

## The Dutch route

**Fijn RC, Hiemstra D, Phillips RA, van der Winden J. 2013.** Arctic Terns *Sterna paradisaea* from
the Netherlands migrate record distances across three oceans to Wilkes Land, East Antarctica.
*Ardea* 101:3–12. https://doi.org/10.5253/078.101.0102

Seven terns tagged in the Netherlands in 2011; five loggers gave tracks. The route and its phase
lengths come from here:

- About 90,000 km in a year, the longest bird migration recorded: the length of one Dutch migration
  in the app.
- Southbound: 29,700 km to Antarctic waters, reached around 12 November (`PHASE_KM` south). Out
  through the English Channel or the Irish Sea, about a week at the North Atlantic stopover, then a
  direct line down the Atlantic (none followed the South American coast), about a month in the
  Benguela Current over the Walvis Ridge, round Africa, a stopover in the Indian Ocean near Amsterdam
  Island (20–40° S), and for two birds the Great Australian Bight, to Wilkes Land.
- Wintering: drifting slowly west along the ice edge from mid-November to mid-March, between about
  35° E and 150° E, about 128 days in the ice zone. The winter phase is the rest of the 90,000 km
  (39,600 km), shared out along ten stretches of the East Antarctic coast from Wilkes Land to
  Lützow-Holm Bay.
- Northbound: home by the end of April after 34 days at about 610 km a day (20,700 km). The paper
  gives the trip's length and speed, not its path, so the northward stops (the South Atlantic, the
  tropical South Atlantic, the equator, the Azores, the Bay of Biscay) are places on the way home up
  the Atlantic.

As on the Greenland route, the stops between documented points are picked so that no leg takes more
than about four weeks at a typical pace; a test holds both routes to it. Stop ids start with `nl-`.
Each Dutch stop's facts come from Fijn et al. 2013, or from the general tern facts already cited in
[tern-facts-sources.md](tern-facts-sources.md).

The Dutch route is drawn on a flat map only (`JourneyMapShapes.NETHERLANDS_MAP`): its two ends are
nearly opposite each other on the globe, so no single globe view shows both.

## Stop facts

Place facts (geography, history, wildlife) are general knowledge, checked against Wikipedia and the
relevant national, park or research body when written. Facts about where and when terns flew come from
the papers above.
