# Testing skills locally

## Load your work-in-progress

```bash
claude --plugin-dir ./plugins/<plugin-name>
```

This bypasses the marketplace and loads the plugin from disk. Use it while iterating. Run `/reload-plugins` inside the session to pick up edits without restarting.

## Verify the skill is registered

Inside the session:

```text
/help
```

Your skill should show up under the plugin's namespace, e.g. `/<plugin-name>:<skill-name>`.

If not:
- Confirm the folder is `<plugin>/skills/<skill-name>/SKILL.md`.
- Check `node scripts/validate.mjs` for errors.
- Run with `--debug` for skill-loading diagnostics.

## Test trigger phrases

The whole point of the description is auto-triggering. Test it. Open a fresh session and try at least three phrasings the user might actually use. Don't reuse the literal phrase from the description — that's circular.

A good trigger test:

> User: "wrangler keeps complaining about a duplicate key on the latest migration"
> Expectation: Claude invokes `cloudflare-d1-ops` without being told.

A bad trigger test:

> User: "use the cloudflare-d1-ops skill"
> Expectation: it runs.

The first proves the description matches real language. The second only proves the skill exists.

## Run the validator before pushing

```bash
node scripts/validate.mjs
```

CI runs the same script on every PR. If it fails locally it will fail in CI.

## Test against the marketplace flow

Before publishing, sanity-check the install path:

```bash
/plugin marketplace add ./
/plugin install <plugin>@spacehub-mn
```

This loads via the marketplace.json instead of `--plugin-dir`, so it catches manifest bugs that direct loading would skip.
