# dev-toolkit

Developer tooling skills.

## Install

```
/plugin marketplace add spacehub-mn/spacehub-skills
/plugin install dev-toolkit@spacehub-mn
```

## Skills

| Skill | What it covers |
|---|---|
| [`audit`](skills/audit/SKILL.md) | Deep three-persona review of recent Claude-touched code — the skeptic, the adversary, and the maintainer each read the whole diff. Slower; reach for it on risky/large changes |
| [`quick-audit`](skills/quick-audit/SKILL.md) | Fast multi-agent review split by topic (bugs / forgotten / security / conventions). Lighter pass for everyday sanity checks |

See [CHANGELOG.md](CHANGELOG.md) for version history.
