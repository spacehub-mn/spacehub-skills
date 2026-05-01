# spacehub-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Validate skills](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml/badge.svg)](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml)

A curated set of Claude Code skills for Spacehub workflows, published as a plugin marketplace.

## Install

```
/plugin marketplace add spacehub-mn/spacehub-skills
/plugin install dev-toolkit@spacehub-mn
```

## Available plugins

| Plugin | Skills | Description |
|---|---|---|
| [`content-ops`](plugins/content-ops) | `session-report` | Mongolian session summary posted to Slack |
| [`dev-toolkit`](plugins/dev-toolkit) | `audit` | Multi-agent review of recent code changes |

Install any subset:

```
/plugin install content-ops@spacehub-mn
/plugin install dev-toolkit@spacehub-mn
```

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for the new-skill workflow, conventions, and PR checklist.

## License

MIT — see [LICENSE](LICENSE).
