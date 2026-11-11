# Ternaries

A small, invite-only circle of friends who fly one shared bird together. Everyone in it has
Tern Plus. It's called a **ternary**: a pun on tern, and a small circle of friends. ("Flock"
was ruled out because of Flock Safety, the surveillance company.)

The design comes from what real Arctic terns do ([tern-facts-sources.md](tern-facts-sources.md)):
they migrate in small, loose flocks, bring each other fish, and feed up together at stopovers.
How it's built is in [architecture.md](architecture.md#ternaries); the numbers are in
`TernaryRules` (`src/domain/ternary/models/ternary.ts`), mirrored in the
[migrations](../supabase/migrations/20261111000000_ternaries.sql).

## The parts

**The shared bird.** One bird on its own route, moved forward by everyone showing up. It's
cooperative and nothing is ranked. Each member's own journey carries on as it is.

**Flying together.** Friends who showed up today fly in a loose cluster around the shared
bird; a rest day counts. Terns don't fly in a V, so the cluster has no leader, and it starts
fresh every morning. A friend who isn't here today isn't drawn: no grey slot, no "missed", no
history. *Share that I'm resting* (off by default) shows a rest day as resting.

**Fly privately.** Your showing up still carries the bird, but you're never drawn. Friends
can't tell whether you're quiet or private, which makes everyone's quiet days unreadable too.

**Fish.** Tap a friend to bring them a fish, up to 3 a day. It waits for them with no push
notification, so it never reads as "come back". No read receipts, and it earns nothing.

**Postcards.** When your own tern reaches a stop, you can send the ternary a card of the
place with a fact about it, once per stop. Never a date, a total or how long it took: "where's
everyone?" is a moment someone chose to share, not a standing map of everyone's place.

**Recipe swap.** Each stop the shared bird reaches brings a new idea for what to share
(*Bring something warming*), and each member can share one saved meal per stop. Only the name
and foods are shared. A friend's recipe can be kept to cook, and reported. No likes or
comments, and nobody is shown as not having shared.

**Hide friends' food.** A free safeguard in Food display that hides friends' recipes.

**Taking a break, blocking, leaving.** *Hide the ternary for now* leaves one row on Journey to
bring it back, and friends see nothing change. Blocking is silent and can be undone. Leaving
keeps every waypoint you earned, and takes your fish, postcards and dishes with you.

## Earning together

| Source | Waypoints | For |
| --- | --- | --- |
| Showing up together | to the shared bird | Each day, 75 × (members who showed up ÷ members): about a lap a year if everyone shows up daily, whatever the size |
| Arrived together | 25, your own bird | When the shared bird reaches a stop, at most once a week |

- Fish, postcards and dishes earn nothing, and the arrival bonus never counts as showing up.
- No all-together bonus and no ternary streak. A quiet member only slows the bird; it never
  moves back.
- Finished days are written once, with no user ids, so the bird never jumps back when
  someone leaves.
- A member whose Plus ends drops out of the count quietly. Nobody is told why.

## Must never happen

- "You broke the ternary's streak", "X hasn't logged", or any nudge about a named member.
- A member listed as missing, behind or inactive, or an empty seat at the table.
- Rankings, or comparing contributions, totals or places on a route.
- Read receipts on fish or postcards.
- Fish, showing up or dishes that can be bought, banked or spent.
- Any food amount, weight, calorie, step, streak, date or stop number passing between members.
- Diet language in a stop's idea ("light", "healthy", "clean", "guilt-free").
- Ternary points protecting a personal streak.
