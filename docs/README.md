# Tern docs

Start at the [project README](../README.md) for what Tern is. These are the working
documents.

| Document                                       | What's in it                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| [architecture.md](architecture.md)             | folder layout, the repository pattern, the waypoints ledger, schema |
| [design.md](design.md)                         | the palette rule, the design commitments, the earning rules         |
| [journey-route-sources.md](journey-route-sources.md) | where the migration route, its distances and stop facts come from |
| [health-connect.md](health-connect.md)         | Android steps: turning it on, what's configured, Play review        |
| [food-search.md](food-search.md)               | Open Food Facts and USDA, caching, attribution                      |
| [ternaries.md](ternaries.md)                   | friends who fly together: the design, earning, what must never happen |
| [RELEASING.md](RELEASING.md)                   | EAS builds, the GitHub workflow, submitting to Play                 |
| [store-listing.md](store-listing.md)           | the Play Store copy, kept in step with the app                      |
| [../supabase/README.md](../supabase/README.md) | setting up a Supabase project, migrations, what each table holds    |

## Hosted pages

GitHub Pages serves this folder at `https://purlieus.dev/tern/`, because the Purlieus site
(`a-thread/a-thread.github.io`) is the account's user site. The pages are linked from the app and
the store listings, so changing one changes what people see. They share the company site's
`/styles.css` and fonts; Tern's own images are in `assets/img/`. Each page has its own header and
footer, so a change to one goes in all of them (and in the Purlieus home and 404 pages).

- `index.html` — Tern's page: who it's for, features, store links
- `privacy/` — the privacy policy
- `support/` — support (the App Store's Support URL)
- `delete-account/` — how to delete an account, which Google Play requires (Apple wants it in the app, which it is)
- `delete-data/` — how to delete your data
- `delete-account.html`, `delete-data.html` — redirects from the old addresses
- `test.html` — how to join the closed test (Android) and TestFlight (iPhone), linked from social posts; its images are in `assets/testers/`

## Not built yet

- Onboarding, and the day-one empty states that go with it
- iPhone testing on a real device and the App Store listing — see [RELEASING.md](RELEASING.md)
