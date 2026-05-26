# dev-toolkit

Developer tooling skills.

## Install

```
pnpx skills add spacehub-mn/spacehub-skills dev-toolkit
```

## Skills

| Skill | What it covers |
|---|---|
| [`audit`](skills/audit/SKILL.md) | Deep three-persona review of recent Claude-touched code — the skeptic, the adversary, and the maintainer each read the whole diff. Slower; reach for it on risky/large changes |
| [`quick-audit`](skills/quick-audit/SKILL.md) | Fast multi-agent review split by topic (bugs / forgotten / security / conventions). Lighter pass for everyday sanity checks |
| [`audit-fixes`](skills/audit-fixes/SKILL.md) | Apply fixes for the high-impact findings from a recent `audit` / `quick-audit` — severe bugs, UX-breaking issues, latent footguns, and straight-out wrong code. Skips style nits and "needs-your-call" items |

See [CHANGELOG.md](CHANGELOG.md) for version history.
