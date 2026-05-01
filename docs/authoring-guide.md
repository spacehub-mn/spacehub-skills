# Authoring guide

The single most important fact about a Claude Code skill: **Claude only reads the frontmatter at startup**. The body is loaded only when Claude or the user invokes the skill. So the description has to do all the work of getting the skill triggered in the first place.

## What goes in a skill

A skill is a folder with a `SKILL.md`. It can also bundle scripts, examples, and reference docs that the skill body cites. Keep `SKILL.md` under ~500 lines; move long reference material to sibling files referenced by name.

## Frontmatter fields you should care about

| Field | Required | Notes |
|---|---|---|
| `name` | optional | Defaults to the folder name. If set, must match the folder. Lowercase, digits, hyphens; max 64 chars. |
| `description` | recommended | What it does + when to trigger. The truncation budget for `description` + `when_to_use` is **1,536 characters**. |
| `when_to_use` | optional | Extra trigger context. Counts toward the same 1,536 cap. |
| `disable-model-invocation` | optional | `true` to make the skill user-only — Claude will not auto-trigger it. Use for actions with side effects. |
| `user-invocable` | optional | `false` to hide from the `/` menu. Use for background-knowledge skills. |
| `allowed-tools` | optional | Pre-approves listed tools while the skill is active. Does not restrict, only grants. |
| `argument-hint` | optional | Autocomplete hint, e.g. `[issue-number]`. |
| `arguments` | optional | Named positional args for `$name` substitution. |
| `context: fork` | optional | Run the skill in a forked subagent (isolated context). Pair with `agent: Explore` or similar. |
| `paths` | optional | Glob patterns that gate auto-loading to matching files. |

## Body structure we use

```markdown
# Skill Name

## When to use this skill
- Concrete trigger 1
- Concrete trigger 2

## Instructions
1. Step or principle
2. Step or principle

## Examples
**Trigger:** "..."
**Response shape:** ...

## Notes
- Edge cases, gotchas
```

This is the shape every existing skill in this repo follows. Stick to it unless you have a reason.

## What to optimize

1. **Description specificity.** The description is matched against the user's words. Vague ("helps with code") loses; specific ("use when wrangler d1 errors mention duplicate keys") wins.
2. **Single workflow per skill.** A skill that says "and then if X, also do Y, but otherwise Z" is two skills.
3. **Idempotence.** A skill body should be safe to invoke twice in the same session.
4. **No secrets.** Never commit real channel IDs, API keys, IPs, or non-public domains. The validator checks for common shapes; the gitleaks workflow catches the rest.

## See also

- [description-cookbook.md](description-cookbook.md) — examples of descriptions that trigger correctly.
- [testing.md](testing.md) — local trigger-phrase testing workflow.
- [Claude Code skills docs](https://code.claude.com/docs/en/skills) — authoritative spec.
