# Changelog — research-toolkit

## 0.2.1 — 2026-05-19

- Added per-subagent tool-call budgets and early-stop instructions to `deep-research` and `ux-research` (5–10 calls typical, 10–15 for comparison-heavy angles) to address the documented "endless search" multi-agent failure mode.
- Synthesis steps now explicitly preserve dissent — single-source findings, especially criticisms and contrarian patterns, are kept with attribution rather than silently deduped away.
- `ux-research` subagent schema now includes a `Confidence: high | medium | low` field per finding, matching `deep-research` for consistency.

## 0.2.0 — 2026-05-19

- Added `ux-research` skill — researches a UX/UI problem online and produces 3–6 structurally-distinct UI variations as live-rendered HTML/CSS mockups (each in a sandboxed `<iframe srcdoc>`), inside a single self-contained dark-themed HTML report. Includes rationale, when-to-use, comparison matrix, antipatterns, accessibility checklist, and cited inspirations.
- Added `ui-research` skill — alias for `ux-research`, same workflow under a different slash-command trigger.

## 0.1.0 — 2026-05-19

- Initial release.
- Added `deep-research` skill — fans out 4–6 parallel research subagents over WebSearch/WebFetch, synthesizes a comprehensive standalone HTML report (single-file, dark theme, inline CSS, cited footnotes), writes it under `/tmp/claude-research/<slug>-<timestamp>.html`, and opens it with `open` on macOS.
