---
name: ui-research
description: Alias for the `ux-research` skill — same workflow, different trigger phrase. Use when the user invokes `/ui-research`, says "do UI research on X", "show me UI variations for X", "explore UI designs for X", or otherwise leads with UI rather than UX phrasing. The underlying flow is identical: parallel web research on patterns + real-world examples + antipatterns + accessibility, synthesized into a standalone dark-themed HTML report with 3–6 live-rendered HTML/CSS mockup variations, written to `/tmp/claude-research/` and opened in the default browser. The topic is the rest of the user message after the trigger phrase.
---

# UI research (alias)

This skill is an alias for [`ux-research`](../ux-research/SKILL.md). The
workflow, deliverable, output path, and calling conventions are all
identical — only the trigger phrasing differs.

The naming distinction is purely user-facing:

- `/ui-research` emphasizes the **deliverable** (rendered UI variations)
- `/ux-research` emphasizes the **method** (UX pattern research)

There is one workflow. Follow the steps defined in
`plugins/research-toolkit/skills/ux-research/SKILL.md` exactly:

1. Frame the design brief (3–4 lines)
2. Pick slug + output path under `/tmp/claude-research/`
3. Dispatch parallel research subagents (patterns, real-world examples,
   antipatterns, accessibility, responsive, emerging takes)
4. Decide a structurally-distinct variation set (adaptive 3–6)
5. Render mockups as sandboxed `<iframe srcdoc>` blocks
6. Synthesize the report (brief, summary, variations, comparison matrix,
   antipatterns, a11y checklist, sources)
7. Write the single self-contained HTML file
8. Open it with `open` (macOS) / `xdg-open` (Linux) / `wslview` (WSL)
9. Report file path + variation count + one-line hook

All inline flags from `ux-research` apply unchanged: `--platform=<…>`,
`--count=<N>`, `--no-open`, `--lang=<code>`.
