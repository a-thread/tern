# Food search

Two databases, searched independently, because they're good at different things.

## Open Food Facts

Packaged products and barcodes. Free, keyless, no account.

```
https://world.openfoodfacts.org/api/v2/search?categories_tags=...&fields=code,product_name,brands,nutriments,nova_group
https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

The data is ODbL, so **credit Open Food Facts in-app** — it's in the footer of the Add
food screen, and in the store listing. The project runs on donations and asks that you
don't hammer the live API.

Tern caches search results in memory for the session
([`useFoodSearch.ts`](../src/food/hooks/useFoodSearch.ts), the last 60 queries per source) and
nothing beyond it. There is no server-side product cache; if you add one, that is what
Open Food Facts asks for.

## USDA FoodData Central

Everyday foods, with household portions ("1 medium apple") that Open Food Facts rarely
has. Needs a free API key in `EXPO_PUBLIC_USDA_API_KEY` — without it the source is
switched off ([`isUsdaEnabled`](../src/food/data/sources/usda.ts)) and search falls back to Open Food
Facts alone.

## What the user sees

Your own foods that match come first, then each database's results with the repeats
removed. A search that returns nothing usable offers manual entry rather than a dead end,
and a source that fails is named in the error so it's clear which half of the results are
missing.

## Amounts and units

Both databases give nutrition per 100 g, so Tern logs by *amount*: a unit and how many.
The units come from the food's household portions (USDA's "large egg", "cup"; an Open Food
Facts product's own serving, read as "bar" or "cookie"), plus grams. Switching unit keeps the
weight, and every count steps in quarters.

A bare USDA size ("1 large") is completed with the food's noun ("large egg"), see
[`nounFor`](../src/food/models/measure.ts).

The logged entry keeps its old shape (one serving of exactly what was eaten, so totals and
saved meals are unchanged) and adds a `measure`: per-100 g nutrition, the units on offer, and
the unit and quantity chosen. That is what lets Edit, Recent and saved meals stay in eggs
instead of a fixed label. Entries logged before it have no measure and keep working from their
serving label. The column is added by `20260928000000_food_entry_measure.sql`.
