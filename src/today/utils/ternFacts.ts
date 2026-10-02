/** Short facts about Arctic terns, one shown per day on Today. Keep each to a sentence or two. */
export const TERN_FACTS: readonly string[] = [
  'An Arctic tern flies about 44,000 miles (70,000 km) every year, the longest migration of any animal.',
  'Arctic terns chase the summer: they spend the northern summer in the Arctic and the southern summer near Antarctica, so they see more daylight than any other animal.',
  'A long-lived Arctic tern may fly over 1.5 million miles in its lifetime, about three trips to the Moon and back.',
  'For all that distance, an Arctic tern weighs only about 100 grams (about 3½ ounces).',
  'Terns don’t fly straight south. They follow a winding, S-shaped route down the Atlantic, using the winds to make the trip easier.',
  'Nobody knew how far Arctic terns really travel until 2010, when tiny trackers small enough for a bird this light traced whole journeys.',
  'An Arctic tern can hover over the water, then plunge-dive to catch a small fish.',
  'The Arctic tern’s scientific name, Sterna paradisaea, means “paradise tern.”',
  'Sailors called terns “sea swallows” for their long wings and forked tails.',
  'Terns nest in busy colonies on open ground, laying one to three eggs in a shallow scrape.',
  'Tern chicks are speckled to match the pebbles and grass around the nest.',
  'Young terns are ready to fly about three to four weeks after hatching, and soon after they set off on their first great migration.',
  'Terns are fierce parents. They dive at anything that gets too close to the nest, people included.',
  'Some ducks nest right beside tern colonies, because the terns drive predators away.',
  'The oldest known Arctic tern lived to at least 34 years old.',
  'Arctic terns leave the far north in late summer and reach the Antarctic seas around November.',
  'Arctic terns breed across the far north, from Greenland and Iceland to Alaska and Siberia.',
  'An Arctic tern doesn’t fly nonstop. It stops along the way to feed and rest, and it reaches the far end all the same.',
  'Terns have short legs and rarely walk far. Most of their lives are spent in the air.',
  'Arctic terns almost never settle on the water. They rest on land, or on floating ice.',
  'A tern’s red-orange bill and legs stand out against its white body and black cap.',
  'Arctic terns eat mostly small fish and tiny shrimp-like crustaceans, caught at or just below the surface.',
  'A tern’s long, narrow wings make gliding on the wind easy on the body.',
  'Arctic terns get through their year without ever settling into a winter. They swap one summer for the next.',
  'The longest journey is made the same way as any other: one steady wingbeat after another.',
];

/** Days since 1970-01-01 for a YYYY-MM-DD key, independent of time zone. */
function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** The fact for a day: the same one all day, the next one tomorrow, cycling through the list. */
export function factForDay(day: string): string {
  const n = TERN_FACTS.length;
  return TERN_FACTS[((dayNumber(day) % n) + n) % n];
}
