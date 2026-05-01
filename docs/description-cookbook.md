# Description cookbook

The description is the single field that decides whether your skill triggers. Below: shapes that work, shapes that fail, and rewrites.

## The pattern

> Use this skill when **[concrete trigger conditions]**. Covers **[what it does]**. Trigger phrases include "**X**", "**Y**", "**Z**".

Three parts:

1. **Use this skill when** — primes the model to look for matches.
2. **Concrete trigger conditions** — file types, error shapes, command names, user phrasings.
3. **Trigger phrases** — literal strings the user might say. Include misspellings and shorthand if common.

## Examples

### Bad
> A helpful skill for working with databases.

Loses every time. No trigger. No specifics. "Databases" is too broad.

### Good
> Use this skill when running Cloudflare D1 migrations, restoring from Time Travel, or debugging migration failures. Covers wrangler d1 migrations apply, manual repair, point-in-time restore, and R2 export/import. Trigger phrases include "d1 migration failed", "duplicate key in d1", "restore d1", "time travel", "wrangler d1".

Specific product (D1), specific commands (`wrangler d1`), specific errors (`duplicate key`), and explicit phrases.

---

### Bad
> Reviews code.

Triggers on everything or nothing.

### Good
> Use this skill when reviewing Mongolian-language marketing copy, UI strings, or social posts for tone, register, and house style. Trigger phrases include "review mongolian copy", "монгол текст", "this copy okay?".

Scoped to language and content type. Includes a Mongolian-script trigger phrase so the skill activates for native speakers writing in Mongolian.

---

### Bad
> A skill for Slack things.

### Good
> Use this skill when the user wants to post a session summary, daily standup, or status report to Slack — especially for Mongolian-language teams using lowercase casual tone. Trigger phrases include "slack report", "session summary", "daily update", "өнөөдрийн", "post to slack".

## Rules of thumb

- **Lead with "Use this skill when"** — pushy phrasing, per Anthropic's own skill-creator guidance. Skills tend to under-trigger.
- **Name products and commands** — `wrangler`, `drizzle-kit`, `prometheus.yml`. Matchable strings.
- **List 3+ trigger phrases** — variants the user might say. Mix English and Mongolian when the team works bilingually.
- **Don't put when-to-trigger info only in the body.** Claude only reads frontmatter at startup.

## When to also fill `when_to_use`

Use it when the trigger conditions are too long for the description, or when the skill should fire on file-context cues (a file is open, an error is on screen) rather than user phrasing alone. Example:

```yaml
description: Use this skill when debugging a Cloudflare Worker — bundle size errors, memory limit hits, service binding issues. Trigger phrases include "1101 error", "wrangler tail", "service binding".
when_to_use: User is reading a wrangler error, a 1101/1102/1027 page, or output from `wrangler tail`; user mentions Worker memory limits or service bindings.
```

The combined `description` + `when_to_use` is capped at 1,536 characters.
