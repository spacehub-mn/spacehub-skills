## What

<!-- What does this PR add or change? One or two sentences. -->

## Why

<!-- Why is this skill or change useful? What workflow does it capture? -->

## PR checklist

- [ ] `SKILL.md` has YAML frontmatter with at minimum a `description`
- [ ] If `name` frontmatter is set, it matches the parent folder
- [ ] Description states *what it does* and *when to trigger*, with literal trigger phrases
- [ ] Combined `description` + `when_to_use` is under 1,536 characters
- [ ] No secrets, API keys, real Slack/Grafana IDs, real IPs, or non-public domains
- [ ] Tested with at least 3 trigger phrases
- [ ] Added to the plugin's `README.md` skill table
- [ ] `node scripts/validate.mjs` passes locally
- [ ] Bumped the plugin's `version` and added a `CHANGELOG.md` entry
