# Tern Plus: a better paid tier

A proposal, November 2026. The decisions are the owner's. This writes them down with the
reasoning behind them and an order to build them in. It changes no code.

## Where Plus stands

Plus today is one thing: an account. Signed in with Plus, the log lives on Tern's server
(`tern.has_plus()` guards every write), so it follows you to any phone you sign in to. When
Plus ends, the log is copied back to the phone and nothing is lost.

That's honest, but for most free users it isn't much of a reason to pay. The free app is
already backed up: Android Auto Backup and iCloud copy `tern.db`, and Settings › Your data
exports and restores a file. The paywall's first line ("a lost phone loses nothing") is
mostly true without Plus too. What Plus adds that free can't is **more than one phone** and
**anything that needs other people**. This proposal builds on the second.

## Guardrails (unchanged)

- No ads, no data selling.
- Disordered-eating safeguards (hiding numbers, gentle language, turning off streaks and
  goals) always stay free.
- No dark patterns: no countdowns, no "only N left", no guilt, nothing pre-ticked, and
  "Not now" is as easy as "Continue".
- The free local app stays fully usable. Plus adds convenience and company, never basic
  tracking.

## 1. What Plus includes

Scores: value to users (how many would pay for it), build effort at 8 hours a week, ongoing
server cost, and fit with the guardrails.

| Candidate | Value | Build | Server cost | Fit | Decision |
| --- | --- | --- | --- | --- | --- |
| Sync across phones (today's Plus) | Medium | Done | Low | Good | **Keep**, and describe it honestly |
| Ternaries: friends who fly together (see §1a) | High | High (about 6–10 weeks) | Low (small rows, no realtime) | Good only with the rules below | **The new headline**, built after pricing |
| Supporter thank-you: a trail colour on Journey | Low–medium (to the people who want it) | Low | None | Good | **Yes**, as the Supporter tier |
| On-device appointment summary for a dietitian or therapist | High for some | Low–medium | None | Good, if free | **Free**: nobody should pay to show their care team their log |
| Live, consent-based share with a clinician | High for some | High | Low | Needs care | **Later**: the clinician-tier bet, after the Apr–Jun 2027 interviews |
| Household: Apple Family Sharing | High for couples | Almost none | Low | Good | **Not now**: it can't be switched off, it's iPhone only, and Play has no equivalent |
| Household: "Plus for two" (a server grant) | High for couples | Medium | Low | Good | **Not now**; revisit after ternaries ship |
| Backup history (30 days of snapshots) | Medium | Medium | Low–medium | Good | Not now: the account already is a backup |
| Longer trends (1 year, all time) | Medium | Low–medium | None | Weak: a paywall on your own history, and long weight charts feed fixating | **No** |
| Home-screen widgets | High | High (native targets on both platforms) | None | Good | Not at 8 hours a week |

### 1a. Ternaries

A small, invite-only circle of friends who fly together. Everyone in it has Plus. (Owner's
decision: a ternary is one more reason to subscribe, not a way in for free accounts.) It's
called a **ternary**: a pun on tern, and a small circle of friends. "Flock" was ruled out
because of Flock Safety, the surveillance company.

The design comes from what real Arctic terns do (`docs/tern-facts-sources.md`): they migrate
in small, loose flocks, bring each other fish, and feed up together at stopovers. Mocks:
the "Concept C" row of the Ternary mocks canvas
(https://claude.ai/artifact/3brHGhzt5Yyef9PWhHUGs3).

**The shared bird.** A ternary has one bird on its own route, moved forward by everyone
showing up together. It's cooperative and nothing is ranked. Each member's own journey
carries on as it is.

**Flying together (the map).** Friends who showed up today fly in a loose cluster around the
shared bird; a rest day counts. Terns don't fly in a V like geese, so the cluster has no
leader. It starts fresh every morning, so nobody is ahead or behind. A friend who isn't here
today isn't drawn: there's no grey slot, no "missed" and no history. A member who opts in to
*Share that I'm resting* (off by default) shows as resting.

**Bringing a fish.** This replaces cheers. You tap a friend to bring them a fish, which waits
in their tern's bill until they next open Tern. It sends no push notification, so it never
reads as "come back". A fish earns no waypoints, sent or received, so it's only kindness and
can't be farmed. Each person can bring up to 3 a day, and there are no read receipts.

**Postcards.** When your own tern reaches a stop on your own journey, you can choose to send
your ternary a postcard: an illustration of the place and a fact from the tern facts file.
It never shows a date, a total or how long the trip took. That gives "where's everyone?" as
moments people choose to share, instead of a standing map of everyone's place, which would
be a leaderboard in disguise. Received postcards collect in the ternary.

**Recipe swap (shared food).** Share a meal you love, and keep the ones friends share to
cook yourself. (It began as a "stopover table", which testing showed didn't explain itself.)
- Each time the shared bird reaches a stop there's a new idea for what to share, such as
  *Bring something warming*. Ideas never use diet words like "light", "healthy", "clean"
  or "guilt-free".
- Each member can share one meal from their saved meals per stop, if they like.
- Only the name and foods are shared: no amounts, calories, macros or NOVA levels.
- Tapping a friend's recipe opens it, with **Keep this recipe**: it goes to *Kept to cook*,
  names and foods only. Whoever cooks it logs the foods with their own amounts.
- Nobody is shown as not having shared anything, and there's no countdown. Earlier stops'
  recipes stay below, a recipe box with rhythm instead of an endless feed.
- There are no likes or comments. A friend's recipe can be reported from its page, because
  meal names are text people write.

**Earning waypoints together.**

| Source | Waypoints | For |
| --- | --- | --- |
| Showing up together | to the shared bird | Each day, 75 × (members who showed up ÷ members). Everyone showing up every day takes it round in about a year, whatever the ternary's size |
| Arrived together | 25, your own bird | Once per stop, when the shared bird reaches it, at most once a week |

- Fish, postcards and dishes earn nothing.
- A quiet friend can't cost anyone anything.
- There's no all-together bonus and no ternary streak. A member who doesn't show up only
  slows the bird; it never moves back, and nobody's absence is named.
- The shared bird has its own ledger and never adds to a member's own total. The arrival
  bonus adds at most about 650 waypoints a year, about 2% of a lap's 28,480.
- Days settle the way the ledger already does. Today's showing up follows today as it
  stands. At day's end a row `(ternary, day, showed_up, members)` is written once and never
  recomputed. It holds no user ids, so the bird never jumps back when someone leaves.
- A member whose Plus ends drops out of the count quietly. Nobody else is told why, since
  whether someone pays is their own business.

**Size.** Migrating Arctic terns usually travel in flocks of fewer than 15. A ternary stays
smaller than that. The exact cap is still open.

**Taking a break.** *Hide the ternary for now* takes it off Journey and stops fish and
postcards, without leaving. Friends see nothing change. Leaving keeps every waypoint you
earned. Blocking is silent: the blocked person just stops seeing you.

**Fly privately.** In a ternary of three, a friend who isn't drawn is easy to read as
missing. With *Fly privately* on, your showing up still carries the shared bird, but you're
never drawn in the flock. Friends can't tell whether you're quiet or just private, which
makes everyone's quiet days unreadable too.

**Hide friends' food.** A free safeguard beside the other food display settings. It hides
the recipes friends share, so seeing what friends eat never becomes something to
compare yourself against. Like every safeguard, it stays free.

**Must never happen**
- "You broke the ternary's streak", "X hasn't logged", or any nudge about a named member.
- A member listed as missing, behind or inactive, or an empty seat at the table.
- Rankings, or comparing contributions, totals or places on a route.
- Read receipts on fish or postcards.
- Fish, showing up or dishes that can be bought, banked or spent.
- Any food amount, weight, calorie, step, streak or stop number passing between members.
- Diet language in a table prompt.
- Ternary points protecting a personal streak.

**What it touches**
- A new `src/domain/ternary/`:
  - `TernaryContext.tsx`
  - the repository in Supabase and memory versions only. There's no on-phone (SQLite)
    version, because every member is signed in with Plus
  - `models/sharedBird.ts`: a `TernaryRules` class
- `WaypointSource.Arrival` in `src/domain/waypoints/models/waypoint.ts`, with its label in
  `src/journey/models/`.
- A migration:
  - tables `ternaries`, `ternary_members`, `ternary_days`, `ternary_fish`,
    `ternary_postcards` and `ternary_dishes`, with RLS scoped to members and
    `tern.has_plus()`
  - the waypoint source and points checks extended for the new source
  - the day's rows settled on the server, by `pg_cron` or a function beside `plus/`
  - a `security definer` function for today's presence. `waypoint_events` is readable only
    by its owner, so the function counts every member's showing up for the shared bird and
    returns only the members who aren't flying privately, with no totals.
- `BackendContext.tsx`: wire the new repository.
- Mount `TernaryProvider` at the journey navigator.
- Journey: `src/journey/ternary/`, with a flock layer on `JourneyMap`, fish, postcards and the
  recipe swap. Stop ideas and postcard facts sit beside the route's stop data.
- Shared dishes read saved meals through `SavedMealsContext`: names and foods only.
- Settings: *Share that I'm resting*, *Fly privately* and *Hide the ternary for now*, and
  *Hide friends' food* with the food display safeguards.
- Invites by code or link, plus leaving, blocking and reporting. Apple asks for these for
  anything people put in front of each other.
- Privacy, before ternaries leave beta:
  - The privacy policy (`docs/index.html`) says what ternary friends can see.
  - The App Store and Play privacy labels add data shared with other users.
  - "Delete my account" removes ternary memberships, fish, postcards and dishes. Past
    `ternary_days` rows stay, since they hold no user ids.
  - Reports go to a monitored inbox.

## 2. Tiers and prices

Two tiers, both subscriptions. There's no lifetime purchase: the founding price is the
founding offer, and a lifetime purchase would be a server cost carried forever.

| | Monthly | Yearly | Unlocks |
| --- | --- | --- | --- |
| **Tern Plus** | $4.99 (was $3.99) | $39.99 (was $29.99) | `plus` |
| **Tern Plus Supporter** | — | $59.99 | `plus` and `supporter` |
| Founding price (testers and the first 200 subscribers) | — | $29.99 while subscribed | `plus` |

After Apple's 15% (the Small Business Program; Play is also 15% on subscriptions), a yearly
subscriber brings in $25.49 at $29.99, $33.99 at $39.99 and $50.99 as a Supporter. With
running costs of about $750 a year, break-even is about 30 subscribers at the founding price
or about 22 at $39.99.

**Why monthly goes to $4.99.** At $3.99 a month, $39.99 a year saves only 16%, down from
37% at $29.99. That pushes people towards monthly, where they cancel more often. At $4.99
($59.88 over a year), yearly saves 33%. Existing monthly subscribers keep $3.99, the same way
founding yearly subscribers keep $29.99.

**How the founding price works without code.** Both stores let you raise a subscription's
price and keep existing subscribers on the old one: App Store Connect calls it "Preserve
current price", and Play keeps a legacy price for existing subscribers. So sell $29.99 until
the 200th subscriber (RevenueCat's dashboard shows the count), then raise the price with
existing subscribers kept. Neither store keeps the old price for someone who lets the
subscription lapse and comes back, so the promise has to say **"for as long as you stay
subscribed"**, never "for life". Testers on the `preview` build can't buy anything. They
either subscribe during the founding window or get a manual grant in `tern.entitlements`,
whichever you prefer.

**Supporter** goes in the same subscription group as Plus on iOS (and as a second base plan
or product on Play), so changing tier is an upgrade or a downgrade, never two charges. It has
no monthly plan: it's a yearly thank-you, not a feature tier.

## 3. Paywall and store listing

### Paywall (`src/auth/paywall/PaywallScreen.tsx`)

Subtitle, unchanged: *Everything in Tern stays free. Plus adds an account that keeps your
data safe.*

What Plus adds (`WHAT_PLUS_ADDS`), honest about what free already does:

- Your log on every phone you sign in to, kept on Tern's server
- Fly with friends in a ternary: one shared bird, carried by everyone showing up, and recipes swapped at every stopover
  *(add this line when ternaries ship, not before)*
- Tern kept going, with no ads and nothing sold

Plans, in order: Yearly (with the savings badge), Monthly, then Supporter. Supporter's
`PlanChoice` gets one plain line under its name: *Everything in Plus, with a thank-you: a
colour of your choosing for your tern's trail on Journey.* No "most popular" badge on it,
nothing pre-selected toward it, and no wording that makes Plus sound like the lesser choice.

While the founding price is on sale, the yearly plan's badge says *Founding price, kept
while you stay subscribed* instead of the savings line. There's no counter and no "N left".

The small print stays as it is, including *If Plus ever ends, nothing is deleted*.

### Settings (`plusSummary.ts`)

A Supporter's row reads *Tern Plus Supporter · renews {date}*. Everything else is unchanged.

### Store listing (`docs/store-listing.md`)

- Replace *Tern Plus is the one paid part: an account that syncs and backs up* with:
  *Tern Plus is the one paid part: an account that keeps your log on every phone you sign
  in to. Supporter is the same, with a thank-you.* Add the ternary line when ternaries ship.
- App Store "TERN PLUS" terms: *Tern Plus is an optional auto-renewing subscription, monthly
  or yearly; Tern Plus Supporter is yearly.* The rest of Apple's required text stays.
- Promotional text (it can change without a new build) is where the founding price goes:
  *Founding price: Tern Plus is $29.99 a year for the first 200 subscribers, kept for as
  long as you stay subscribed.*

## 4. Build order

1. **Prices, Supporter and wording.** *First, as decided.* Mostly store and RevenueCat setup:
   a `supporter_annual` product, a `supporter` entitlement attached alongside `plus`, both in
   the current offering, monthly raised to $4.99 (existing subscribers kept at $3.99), and
   the yearly raise once 200 is reached.
   Code:
   - `src/domain/subscription/models/subscription.ts`: a tier on `PlanOption` (an enum, not a
     string), `planName` and `priceLabel` for Supporter, and a `supporter` flag on
     `SubscriptionStatus`.
   - `subscription.revenuecat.ts`: map the Supporter package (it arrives as `CUSTOM`, which
     today falls to `Plan.Other`), and read the `supporter` entitlement in `statusFrom`.
   - `subscription.repository.ts`: a Supporter plan in `SAMPLE_PLANS`.
   - `SubscriptionContext.tsx`: expose `supporter`.
   - `PaywallScreen.tsx` and `PlanChoice.tsx`: the new lines, Supporter's description, and the
     founding badge.
   - `src/settings/models/plusSummary.ts`: Supporter wording.
   - `docs/store-listing.md` and the Tern Plus section of `docs/architecture.md`.
   - Tests beside each file.
   - The server is unchanged: Supporter also unlocks `plus`, which is all `tern.has_plus()`
     checks.
2. **Supporter thank-you and About Tern.** *Built.* A colour of the Supporter's choosing for
   the trail their tern has flown on Journey. It replaced alternate app icons, which are
   fiddly on Android. Names in a credits list were dropped: little value for the upkeep.
   Settings › About Tern says what Tern is for and the promises it keeps, holds the trail
   picker, and has a tip jar: one-off tips paid through the store, which unlock nothing. There
   is no Buy Me a Coffee link in the app: Google Play's Payments policy (section 4) and the
   App Store don't allow linking out to pay, tips included.
3. **Free appointment summary.** A readable summary the phone builds from the log and shares
   through the share sheet. It respects every hidden-number setting and uses no server.
   Touches `src/settings/data/` and the export utilities beside it.
4. **Ternaries.** The big one; see §1a for what it touches.
5. **Later.** Household sharing (Family Sharing or "Plus for two"), backup history, and the
   clinician tier once the interviews are in.
