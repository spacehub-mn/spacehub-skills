# Contributing

Thanks for considering a contribution. This repo is a Claude Code plugin marketplace; everything ships as either a new skill inside an existing plugin or a new plugin bundle.

## What makes a good skill

- **Focused** — one workflow per skill, not many. If a skill description has "and" three times, split it.
- **Specific trigger description** — frontmatter `description` must state both *what* the skill does and *when* Claude should invoke it. Include literal trigger phrases users would say.
- **Idempotent instructions** — running the skill twice should not corrupt state.
- **No secrets** — no API keys, real channel IDs, real internal URLs, server IPs, or non-public domain names.
- **Tested** — invoked successfully with at least 3 different trigger phrases before the PR is opened.

## Repo conventions

- Folder names: kebab-case (lowercase letters, digits, hyphens).
- `SKILL.md` filename: uppercase as shown.
- Plugins live under `plugins/<plugin-name>/`. Each plugin holds related skills under `skills/<skill-name>/SKILL.md`.
- Description rules: see [docs/description-cookbook.md](docs/description-cookbook.md).
- Mongolian copy inside skills should be supplied by a maintainer or marked as `<!-- TODO: maintainer-supplied copy -->`.

## Create a new skill

```bash
node scripts/new-skill.mjs <plugin>/<skill-name>
# example:
node scripts/new-skill.mjs infra-toolkit/cloudflare-r2-cors
```

The scaffolder writes `plugins/<plugin>/skills/<skill-name>/SKILL.md` from the template. Edit the frontmatter and body, then validate:

```bash
node scripts/validate.mjs
```

## PR checklist

- [ ] `SKILL.md` has YAML frontmatter with at minimum a `description`.
- [ ] If `name` frontmatter is set, it matches the parent folder.
- [ ] Description states *what it does* and *when to trigger*, including literal trigger phrases.
- [ ] Combined `description` + `when_to_use` under 1,536 characters.
- [ ] No secrets, API keys, real Slack/Grafana IDs, real IPs, or non-public domains.
- [ ] Tested with at least 3 trigger phrases.
- [ ] Added to the plugin's README.md skill table.
- [ ] `node scripts/validate.mjs` passes locally.
- [ ] Bumped the plugin's `version` in `plugin.json` and added a `CHANGELOG.md` entry.

## Code of Conduct

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
