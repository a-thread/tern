# Food search

Search answers from the phone first and the network second, in one ranked list.

1. **Your foods**: what you've logged in the last 90 days.
2. **Common foods**: a list of about 3,000 everyday foods with clean names, kept on the
   phone and searched on every keystroke.
3. **Packaged foods**: Open Food Facts, after a pause in typing.
4. **USDA**: live FoodData Central search, only when the phone has fewer than three matches
   (`LookupRules.USDA_BELOW` in [`useFoodLookup.ts`](../src/food/hooks/useFoodLookup.ts)).

## Common foods

Built from USDA FoodData Central (public domain) bulk downloads: Survey (FNDDS), Foundation
and SR Legacy. [`scripts/buildCommonFoods.ts`](../scripts/buildCommonFoods.ts) does the build:

- It turns raw descriptions into a name and a detail ("Chicken, broilers or fryers, breast,
  meat only, cooked, roasted" → "Chicken breast" · "meat only, cooked, roasted"), using
  [`splitUsdaName`](../src/food/models/commonFoodName.ts).
- It keeps household portions first ("medium banana" before "oz").
- It picks one food per name and detail, favoring plain forms ("Egg, whole, raw" over
  "Egg, creamed") and foods as people eat them.
- It suggests a NOVA type only for clear cases ([`suggestTier`](../src/food/models/commonFoodTier.ts):
  whole foods, culinary ingredients, bread and cheese; never ultra-processed).
- Hand corrections (names, aliases like "oj", ranks, types) live in
  [`scripts/commonFoods/overrides.json`](../scripts/commonFoods/overrides.json). The build lists
  overrides that matched nothing.

To update the list:

```
npx tsx scripts/buildCommonFoods.ts --fndds <surveyDownload.json> --foundation <foundation.json> --sr <srLegacy.json>
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/publishCommonFoods.ts
```

The list lives in `tern.common_foods`, readable by signed-in users
(`20261007000000_common_foods.sql`). `tern.common_foods_meta` holds a version: a hash of the
list.

[`CommonFoodsProvider`](../src/food/CommonFoodsContext.tsx) uses the copy saved on the phone
straight away, asks for the version, and downloads only when it changed. It never holds the
app back. Until the first download, search has no common foods. Local mode uses a small seed
([`commonFoods.seed.ts`](../src/food/data/commonFoods.seed.ts)).

## Open Food Facts

Packaged products and barcodes. Free, keyless, no account.

```
https://search.openfoodfacts.org/search?q=...&langs=en&fields=...   (search)
https://world.openfoodfacts.org/api/v2/product/{barcode}.json        (barcode)
```

Search asks for English-language products (`lang:en`). It retries in every language only when
nothing came back and the phone had nothing either, since that second request is slow. A
search gives up after 6 s; a barcode lookup waits 10 s.

The data is ODbL, so **credit Open Food Facts in-app**. The credit is in the footer of the Add
food screen and in the store listing. The project runs on donations and asks that you don't
hammer the live API.

Tern caches search results in memory for the session
([`useFoodSearch.ts`](../src/food/hooks/useFoodSearch.ts), the last 60 queries per source).

## USDA FoodData Central (live)

It needs a free API key in `EXPO_PUBLIC_USDA_API_KEY`. Without one it's switched off
([`isUsdaEnabled`](../src/food/data/sources/usda.ts)). Branded foods are not searched;
packaged products come from Open Food Facts.

## What the user sees

One list: [`rankFoods`](../src/food/models/foodRanking.ts) scores every row.

- Name matches come first: exact, then the name starting with the query, then word matches,
  then detail-only matches.
- Shorter, more common names and your own foods rank higher.
- Packaged rows sink when their macros are missing, and rise when the query names their brand.
- Repeats are removed.

Each row is tagged with its source ("Your food", "Common", "Packaged", "USDA"). It shows the
calories for its first portion ("1 large egg · 72 cal") when it has one.

Nothing jumps:

- **While you type:** network results from the last query stay on screen, narrowed to the new
  words, until fresh ones arrive.
- **Late results:** they fold in with [`stableMerge`](../src/food/models/foodRanking.ts). Rows
  already on screen keep their order, and only a much better match passes the top rows.
- **Loading:** a thin line in the search field, not a spinner row.
- **A source that fails:** one quiet line with Try again. What was found stays.
- **"No matches":** shown only once every source has answered.

## Amounts and units

Every source gives nutrition per 100 g, so Tern logs by *amount*: a unit and how many. The
units come from the food's household portions (a common food's "large egg" or "cup", an Open
Food Facts product's own serving read as "bar" or "cookie"), plus grams. Switching unit keeps
the weight, and every count steps in quarters.

A bare USDA size ("1 large") is completed with the food's noun ("large egg"), see
[`nounFor`](../src/food/models/measure.ts).

The logged entry keeps its old shape (one serving of exactly what was eaten, so totals and
saved meals are unchanged) and adds a `measure`: per-100 g nutrition, the units on offer, and
the unit and quantity chosen. That is what lets Edit, Recent and saved meals stay in eggs
instead of a fixed label. Entries logged before it have no measure and keep working from their
serving label. The column is added by `20260928000000_food_entry_measure.sql`.
