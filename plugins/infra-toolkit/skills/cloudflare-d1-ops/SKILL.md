---
name: cloudflare-d1-ops
description: Use this skill whenever the user is running Cloudflare D1 migrations, restoring from Time Travel or R2 backups, or debugging migration failures. Covers wrangler d1 migrations apply, manual repair via wrangler d1 execute, Time Travel point-in-time restore, and R2 export/import. Trigger phrases include "d1 migration failed", "duplicate key in d1", "restore d1", "time travel", "wrangler d1".
when_to_use: A wrangler d1 command was just run or pasted; an error mentions D1, sqlite_constraint, or "no such column"; the user mentions backups, restore, or schema drift on a D1 database.
---

# Cloudflare D1 Operations

## When to use this skill

- Applying or rolling back a wrangler migration on a D1 database.
- Diagnosing failed migrations: duplicate rows, missing columns, schema drift between local and remote.
- Restoring data via Time Travel or from an R2-stored export.
- Inspecting current schema (`wrangler d1 execute --command "SELECT sql FROM sqlite_master"`).

## Instructions

1. **Identify the database** the user is acting on. Ask for the binding name or database name if unclear — never guess across multiple D1 instances.
2. **Always preview before applying** destructive migrations. Use `wrangler d1 migrations apply <db> --remote --preview` (or local equivalent) and inspect the diff.
3. **For migration failures**, read the exact wrangler error and locate the offending statement. Common causes: a column already exists, a `NOT NULL` added without default on a non-empty table, or a foreign key violation.
4. **Restore strategy**:
   - First choice: Time Travel (`wrangler d1 time-travel restore`) — point to a timestamp before the bad migration.
   - Fallback: re-import from the most recent R2 export with `wrangler d1 execute --file=<exported.sql>`.
5. **After any restore**, re-run `wrangler d1 migrations list` to confirm the migrations table state and decide whether to re-apply pending migrations.
6. **Document** the incident: timestamp, what failed, restore source, current state. The user will likely paste this into Slack.

## Examples

**Trigger:** "wrangler d1 migrations apply blew up with duplicate rows on the 0042 migration"
**Response shape:** Identify database, dump the failing migration, propose either deduping inline or rolling back via Time Travel, then re-applying.

**Trigger:** "we need to restore the prod d1 to yesterday"
**Response shape:** Confirm target timestamp, run Time Travel info to verify the bookmark exists, then restore. Warn that any writes since the timestamp are lost.

## Notes

- D1 Time Travel currently retains bookmarks for ~30 days; older recoveries must come from R2 exports.
- The `wrangler d1 export` output is plain SQL and can be diffed across days to detect drift.
- Never run a destructive migration on `--remote` without first running it on a local copy. The local file lives at `.wrangler/state/v3/d1/`.

<!-- TODO: Add real recovery runbook references once the public ops doc is published. -->
