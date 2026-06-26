# Changelog — content-ops

## 0.3.0 — 2026-06-26

- Added `presentation` skill — builds a beautiful, self-contained HTML slide deck from a topic or an existing doc into a reusable `.presentation/` project folder. Persists a per-project design system (`theme.css` + `design.md`) decided once and reused across decks; keeps editable `content.md` sources; auto-detects whether the user supplied finished content or just a topic. Decks ship keyboard/touch nav, presenter view, overview grid, progress bar, and PDF export, and deploy to a shareable link via PageDrop on request. Bundles a vetted deck engine (`assets/template.html`) plus `reference/` docs for the content format and starting design directions.

## 0.2.0 — 2026-05-01

- Added `session-report` skill — Mongolian session summary posted to Slack with per-project channel history.
- Removed the `slack-status-report` and `mongolian-copy-review` stubs from 0.1.0; their use cases are folded into `session-report` or deferred.

## 0.1.0 — 2026-05-01

Initial scaffold release (yanked content-wise — stubs only).
