---
name: drizzle-d1-schema
description: Use this skill when designing or refactoring a Drizzle ORM schema for Cloudflare D1 — table definitions, indices, single-join query patterns, and migration generation. D1 is SQLite at the edge, so Drizzle's `sqlite-core` adapter applies, with extra constraints around connection pooling and migration application. Trigger phrases include "drizzle schema", "d1 schema", "drizzle migration", "drizzle relation", "drizzle query".
when_to_use: User is editing a `schema.ts`/`schema/*.ts` file with Drizzle imports targeting D1; user runs `drizzle-kit generate`; user asks how to model a table, index, or relation for D1.
---

# Drizzle + D1 Schema

## When to use this skill

- Modeling a new table or relation in a Drizzle schema for a D1 database.
- Generating and applying migrations: `drizzle-kit generate` followed by `wrangler d1 migrations apply`.
- Writing queries — especially when the user is reaching for an N+1 pattern that should be a single join.

## Instructions

1. **Confirm the adapter**: import from `drizzle-orm/sqlite-core` for table definitions, `drizzle-orm/d1` for the runtime client. Mixing in `pg-core` or `mysql-core` is a common copy-paste mistake.
2. **Schema rules for D1**:
   - Always set a primary key. D1 silently allows tables without one; queries get awkward.
   - Use `text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` for UUID-style IDs, or `integer("id").primaryKey({ autoIncrement: true })` for serial.
   - Timestamps: `integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date())`. SQLite has no native timestamp type; mode handles conversion.
   - Index foreign-key columns explicitly. SQLite does not auto-index FKs.
3. **Relations**: define them with `relations()` even when not using the relational query API. They make `db.query.<table>.findMany({ with: {...} })` work — which is single-query under the hood, no N+1.
4. **Migration flow**: `drizzle-kit generate` writes SQL to `drizzle/`. Then `wrangler d1 migrations apply <db> --local` for local, `--remote` for production. Never hand-edit generated SQL unless you also edit `drizzle/meta/_journal.json`.
5. **Query patterns**: prefer the relational query builder over manual joins for legibility. For aggregates and complex filters, the SQL builder is fine. Avoid sequential `await db.select()` calls that could be a single join — D1 latency dominates.

## Examples

**Trigger:** "add a posts table with author relation"
**Response shape:** Show the `posts` table with FK to `users.id`, explicit FK index, `relations()` block on both sides, then the `findMany({ with: { author: true } })` query.

**Trigger:** "drizzle generate produced a destructive migration"
**Response shape:** Read the generated SQL, identify the `DROP COLUMN` or `ALTER`, propose either preserving the column with a deprecated comment or writing a manual migration that backfills.

## Notes

- D1 has a 100 MB per-database soft limit (paid tier higher). Large blob columns belong in R2.
- SQLite ALTER TABLE is limited — Drizzle generates table-rebuild migrations for column type changes. They are slow and lock the table; schedule for low traffic.
- The relational query API requires `relations()` to be defined and exported from the schema barrel.

<!-- TODO: Reference the team's preferred schema barrel pattern once standardized. -->
