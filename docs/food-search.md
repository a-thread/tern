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
