# Journey route: sources

Where the route in [`MigrationRoute`](../src/domain/waypoints/models/migrationRoute.ts) comes from.

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

## Stop facts

Place facts (geography, history, wildlife) are general knowledge, checked against Wikipedia and the
relevant national, park or research body when written. Facts about where and when terns flew come from
the two papers above.
