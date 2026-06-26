# content-ops

Content and communication skills.

## Install

```
pnpx skills add spacehub-mn/spacehub-skills content-ops
```

## Skills

| Skill | What it covers |
|---|---|
| [`session-report`](skills/session-report/SKILL.md) | Summarizes the current session in Mongolian and posts to Slack via the Slack MCP. Tracks per-project channel history in `.session-report-history.json`. |
| [`presentation`](skills/presentation/SKILL.md) | Builds a beautiful, **self-contained** HTML slide deck from a topic or an existing doc (auto-detects which). Keeps everything in a reusable `.presentation/` project folder — a per-project design system (`theme.css` + `design.md`) decided once and reused, plus editable `content.md` sources. The deck ships keyboard/touch nav, presenter view, overview grid, progress bar, and clean PDF export. Deploys to a shareable link via PageDrop on request. |

See [CHANGELOG.md](CHANGELOG.md) for version history.
