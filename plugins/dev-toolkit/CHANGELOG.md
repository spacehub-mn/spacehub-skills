# Changelog — dev-toolkit

## 0.4.0 — 2026-05-06

- Renamed previous `audit` (topic-split, fast) to `quick-audit` — same workflow, new name.
- Rewrote `audit` as a deeper five-persona review: cynical veteran, adversarial hacker, meticulous finisher, convention enforcer, and product-intent reviewer each read the whole diff and findings are deduped at synthesis. Costs more tokens; convergent findings carry more signal.

## 0.3.0 — 2026-05-01

- Removed `claude-code-settings` and `drizzle-d1-schema` stubs. Only `audit` remains; will reintroduce real versions of those skills with maintainer-supplied content.

## 0.2.0 — 2026-05-01

- Added `audit` skill — multi-agent review of recent Claude-touched code covering bugs, forgotten work, security, and convention violations.

## 0.1.0 — 2026-05-01

Initial scaffold release (yanked content-wise — stubs only).
