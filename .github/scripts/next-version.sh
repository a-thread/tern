#!/usr/bin/env bash
# Prints the next release version (X.Y.Z) from the conventional commits since the last v* tag,
# or nothing when no commit warrants a release. Needs full history and tags (fetch-depth: 0).
#   feat!: / BREAKING CHANGE → major (minor while below 1.0)
#   feat:                    → minor
#   fix: / perf: / revert:   → patch
#   anything else (ci, chore, docs, refactor, test, style, build) → no release
set -euo pipefail

last="$(git describe --tags --abbrev=0 --match 'v[0-9]*' 2>/dev/null || true)"
range="${last:+$last..}HEAD"
current="${last#v}"
current="${current:-0.0.0}"

bump=none
rank() { case "$1" in major) echo 3 ;; minor) echo 2 ;; patch) echo 1 ;; *) echo 0 ;; esac; }
raise() { if [ "$(rank "$1")" -gt "$(rank "$bump")" ]; then bump="$1"; fi; }

while IFS= read -r -d $'\x1e' commit; do
  subject="$(printf '%s' "$commit" | sed -n '1p')"
  if printf '%s' "$subject" | grep -Eq '^[a-z]+(\([^)]*\))?!:' ||
    printf '%s' "$commit" | grep -Eq '^BREAKING[ -]CHANGE:'; then
    raise major
  elif printf '%s' "$subject" | grep -Eq '^feat(\([^)]*\))?:'; then
    raise minor
  elif printf '%s' "$subject" | grep -Eq '^(fix|perf|revert)(\([^)]*\))?:'; then
    raise patch
  fi
done < <(git log --format='%s%n%b%x1e' "$range")

IFS=. read -r major minor patch <<< "$current"
if [ "$bump" = major ] && [ "$major" -eq 0 ]; then bump=minor; fi
case "$bump" in
  major) echo "$((major + 1)).0.0" ;;
  minor) echo "$major.$((minor + 1)).0" ;;
  patch) echo "$major.$minor.$((patch + 1))" ;;
esac
