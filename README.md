# spacehub-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Validate skills](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml/badge.svg)](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml)

A curated set of skills for Spacehub workflows.

## Install

```
pnpx skills add spacehub-mn/spacehub-skills dev-toolkit
```

## Available plugins

| Plugin | Skills | Description |
|---|---|---|
| [`content-ops`](plugins/content-ops) | `session-report` | Mongolian session summary posted to Slack |
| [`dev-toolkit`](plugins/dev-toolkit) | `audit`, `quick-audit`, `audit-fixes` | Multi-agent review of recent code changes, plus an `audit-fixes` pass to apply the high-impact findings |
| [`research-toolkit`](plugins/research-toolkit) | `deep-research`, `ux-research`, `ui-research`, `price-estimate` | Wide multi-agent web research → standalone HTML reports. `ux-research` / `ui-research` adds live-rendered UI variation mockups; `price-estimate` adds pessimistic competitive pricing analysis |

Install any subset:

```
pnpx skills add spacehub-mn/spacehub-skills content-ops
pnpx skills add spacehub-mn/spacehub-skills dev-toolkit
pnpx skills add spacehub-mn/spacehub-skills research-toolkit
```

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for the new-skill workflow, conventions, and PR checklist.

## License

MIT — see [LICENSE](LICENSE).
