# dev-toolkit

Developer tooling for Claude Code config, Drizzle + D1, and SvelteKit on Workers.

## Install

```bash
/plugin marketplace add spacehub-mn/spacehub-skills
/plugin install dev-toolkit@spacehub-mn
```

## Skills

| Skill | What it covers |
|---|---|
| [`audit`](skills/audit/SKILL.md) | Multi-agent review of recent code changes — bugs, oversights, security holes, convention violations |
| [`claude-code-settings`](skills/claude-code-settings/SKILL.md) | `.claude/settings.json` — defaultMode, permissions, hooks, MCP entries |
| [`drizzle-d1-schema`](skills/drizzle-d1-schema/SKILL.md) | Drizzle schema design for D1, single-join queries, migration generation |

See [CHANGELOG.md](CHANGELOG.md) for version history.
