# research-toolkit

Online research skills that produce shareable artifacts.

## Install

```
/plugin marketplace add spacehub-mn/spacehub-skills
/plugin install research-toolkit@spacehub-mn
```

## Skills

| Skill | What it covers |
|---|---|
| [`deep-research`](skills/deep-research/SKILL.md) | Dispatches 4–6 parallel research subagents across the web, synthesizes findings into a single standalone HTML report (dark theme, inline CSS, cited), writes it to `/tmp/claude-research/`, and opens it in the default browser |
| [`ux-research`](skills/ux-research/SKILL.md) | Researches a UX/UI problem online, then presents 3–6 structurally-distinct UI variations as live-rendered HTML/CSS mockups (sandboxed iframes) inside a single dark-themed HTML report, with rationale, when-to-use, comparison matrix, antipatterns, a11y checklist, and cited inspirations. Written to `/tmp/claude-research/` and opened in the browser |
| [`ui-research`](skills/ui-research/SKILL.md) | Alias for `ux-research`. Same workflow, triggered by `/ui-research` instead of `/ux-research` |
| [`price-estimate`](skills/price-estimate/SKILL.md) | Researches competitive pricing for a product/service/SaaS idea, applies a pessimistic bias (costs round up, revenue anchors low), and produces an HTML report with competitor table, cost breakdown, hidden-tax analysis, tier suggestions, and a recommended price range |

See [CHANGELOG.md](CHANGELOG.md) for version history.
