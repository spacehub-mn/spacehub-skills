# Changelog — dev-toolkit

## 0.6.0 — 2026-05-19

- Added `audit-fixes` skill — applies fixes for the high-impact findings from a recent `audit` / `quick-audit` (🔴 severe bugs, UX-breakers, latent footguns, straight-out wrong code) and leaves style nits / speculation / abstraction suggestions alone. Shows the fix-list then proceeds, runs `pnpm lint` at the end.
- Added per-subagent tool-call budgets and early-stop instructions to `audit` and `quick-audit` to address the documented "endless search" multi-agent failure mode (per Anthropic's multi-agent research system writeup).
- `audit` and `quick-audit` synthesis steps now explicitly preserve dissent — single-persona / single-agent findings are kept with attribution (e.g. `[adversary only]`) rather than silently deduped away.
- `audit-fixes` description written in third person ("Applies fixes…") for consistent skill-routing per Anthropic's skill-authoring guidance.

## 0.5.0 — 2026-05-07

- Reworked `audit` from five personas to three (skeptic, adversary, maintainer): the skeptic absorbs cynical-veteran + meticulous-finisher; the maintainer absorbs convention-enforcer + product-intent reviewer; adversary unchanged. Three-way convergence is a clearer signal than five-way overlap.
- Added explicit severity rubric with a triage gate before publishing 🔴, plus an ℹ️ "watching brief" tier for "if you ever add X" findings that previously inflated the 🔴/🟡 lists.
- Skeptic now explicitly hunts timebombs (hardcoded dates, expiring secrets, EOL deps); maintainer now explicitly hunts deferred essential follow-ups (missing migrations, stale `.env.example`, unflipped flags).

## 0.4.0 — 2026-05-06

- Renamed previous `audit` (topic-split, fast) to `quick-audit` — same workflow, new name.
- Rewrote `audit` as a deeper five-persona review: cynical veteran, adversarial hacker, meticulous finisher, convention enforcer, and product-intent reviewer each read the whole diff and findings are deduped at synthesis. Costs more tokens; convergent findings carry more signal.

## 0.3.0 — 2026-05-01

- Removed `claude-code-settings` and `drizzle-d1-schema` stubs. Only `audit` remains; will reintroduce real versions of those skills with maintainer-supplied content.

## 0.2.0 — 2026-05-01

- Added `audit` skill — multi-agent review of recent Claude-touched code covering bugs, forgotten work, security, and convention violations.

## 0.1.0 — 2026-05-01

Initial scaffold release (yanked content-wise — stubs only).
