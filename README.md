# spacehub-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Validate skills](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml/badge.svg)](https://github.com/spacehub-mn/spacehub-skills/actions/workflows/validate-skills.yml)

A curated set of Claude Code skills for Spacehub workflows — infrastructure, content, and developer tooling — published as a plugin marketplace.

## Install

Add the marketplace, then install the plugin bundles you want:

```bash
/plugin marketplace add spacehub-mn/spacehub-skills
/plugin install infra-toolkit@spacehub-mn
```

## Available plugins

| Plugin | Description |
|---|---|
| [`infra-toolkit`](plugins/infra-toolkit) | Cloudflare, Prometheus, and Linux server operations |
| [`content-ops`](plugins/content-ops) | Marketing, internal comms, and Mongolian copy review |
| [`dev-toolkit`](plugins/dev-toolkit) | Claude Code config, Drizzle + D1, SvelteKit on Workers |

Install any subset:

```bash
/plugin install content-ops@spacehub-mn
/plugin install dev-toolkit@spacehub-mn
```

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for the new-skill workflow, conventions, and PR checklist. Outside contributors welcome.

## License

MIT — see [LICENSE](LICENSE).
