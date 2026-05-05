---
name: quick-audit
description: Fast multi-agent review of recently-touched code, split by topic (bugs / forgotten / security / conventions). Use when the user asks for a "quick audit", "fast review", "sanity-check", or "predeploy-check" of recent changes — including phrasings like "did I break anything", "go over what we just did". For a deeper review with five reviewer personas, use the `audit` skill instead. Targets code Claude touched (uncommitted working-tree changes plus recent Claude-coauthored commits) by default; with arg "uncommitted" or "wt" only the working tree is reviewed.
---

# Quick audit

A fast multi-step, multi-agent audit of recent code changes, split by topic.
The goal is to catch **likely bugs, forgotten work, security holes, and
convention violations** — not to lecture about tests, abstractions, or style
nits the codebase doesn't already enforce.

For a slower, more thorough review where five reviewer personas each read the
whole diff through their own lens, use the `audit` skill instead.

## Language

Respond to the user in their input language. Section headers (🔴 / 🟡 / 🟢,
"Lint", file paths, line numbers) stay as-is — they are structural markers.
Prose findings, rationale lines, and the final verdict use the user's
language.

## Workflow

Follow these steps in order. Use parallel tool calls wherever steps are
independent.

### 1. Determine the target diff

Run these in **parallel**:

- `git status --short`
- `git diff HEAD` (uncommitted, including staged)
- `git log -30 --pretty=format:"%H%x09%an%x09%s" --grep="Co-Authored-By: Claude"` (recent Claude commits)
- `git rev-parse --abbrev-ref HEAD` and `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` to find the upstream/main

If the user passed an arg of `uncommitted` / `wt` / `working-tree`, **skip**
the Claude-commits search and only review the uncommitted diff.

If the user passed `branch` or `vs-main`, also include `git diff <main>...HEAD`
(use the branch returned by `git symbolic-ref refs/remotes/origin/HEAD` or fall
back to `main`).

For each Claude-coauthored commit found, capture the diff with
`git show --stat <hash>` (just stats — full diffs go to sub-agents).

If the combined target is empty, report "No recent Claude-touched changes to
audit." and stop.

### 2. Load project conventions

In **parallel**:

- Read every `CLAUDE.md` from the repo root and any in subdirs that the diff
  touched (`find . -name CLAUDE.md -not -path "*/node_modules/*"`, then read
  the ones above touched files).
- Encode the cwd to its memory slug (replace `/` with `-`, drop the leading
  `-`) and read `~/.claude/projects/-<encoded>/memory/MEMORY.md` if it exists.
  Then read each linked memory file referenced by that index that looks
  topically relevant to the diff (lint/format rules, generation taboos,
  framework conventions, deployment rules).
- Read the repo's `package.json` (or root) to understand what kind of project
  this is.

These rules are **first-class signals** — a violation of a CLAUDE.md or memory
rule is a 🔴 finding, not a nit.

### 3. Filter the file list

Exclude these from the review (silently — don't mention them):

- Generated / build outputs: `.svelte-kit/`, `dist/`, `build/`, `.next/`,
  `node_modules/`, `out/`, `coverage/`, `.turbo/`
- Lockfiles: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`
- Auto-generated message bundles when the project uses paraglide/inlang:
  `**/lib/paraglide/messages/`, `**/paraglide/runtime/`
- Type-declaration outputs: any `.d.ts` inside `dist/`
- Worker bundles: `.svelte-kit/cloudflare/_worker.js`

Touched root-level `messages/*.json` (paraglide source files) **are** in scope.

### 4. Run real linters in parallel

For any TypeScript / JavaScript / Svelte / Node project:

- If the root `package.json` has a `lint` script, run `pnpm lint`.
- For monorepos (turborepo / pnpm workspaces): also try `pnpm -r lint` if a
  root script doesn't exist, or filter to affected workspaces:
  `pnpm --filter "<pkg>" lint` for each touched package.
- Time-limit each lint invocation to ~3 minutes. Don't fail the audit on lint
  errors; capture stdout+stderr.
- If `pnpm lint` doesn't exist anywhere, skip silently — do **not** fall back
  to `tsc`, `svelte-check`, `eslint`, or `prettier`. Only `pnpm lint`.

Run lint in the background in parallel with the agent dispatch in step 5 — by
the time agents return, lint output is usually ready.

### 5. Dispatch parallel investigation agents

Spawn **multiple Explore / general-purpose subagents in a single message** so
they run concurrently. Each gets a focused brief and a list of relevant files
from the diff.

Suggested split (collapse or expand based on diff size):

- **Bugs & correctness** — wrong logic, off-by-one, race conditions, broken
  null checks, regressed behavior, mismatched types, missed error paths at
  real boundaries (network/IO/user input). Read callers of changed functions
  to detect breakage outside the diff.
- **Forgotten / incomplete** — half-wired features, message keys referenced
  but not added, env vars used but not declared, new components not exported,
  TODOs added, dead code, callers not updated to match a changed signature,
  feature flags left on the wrong default.
- **Security** — secrets in code, missing authz checks, SQL/NoSQL injection,
  unsafe HTML rendering, open redirect / SSRF, weak input validation at the
  boundary, leaked PII in logs, broken CSRF assumptions. Don't speculate
  about purely hypothetical attacks.
- **Conventions** — violations of the loaded `CLAUDE.md` and memory rules
  (e.g. paraglide source-of-truth, no manual migration generation, format-on-
  finish, use pnpm not npm). Cross-check style against neighboring code in the
  same project, not against generic best practices.

Each agent must return findings in the schema below — nothing else.

Brief each agent like a colleague: tell it the project type, the specific
files in its slice of the diff (with paths), the relevant CLAUDE.md / memory
rules to enforce, and ask for "under N findings, only the ones you'd actually
flag in a code review." Tell each agent **not** to suggest tests, abstractions,
or speculative improvements — only concrete defects.

### 6. Synthesize the report

Merge agent findings + lint output. Deduplicate. Drop anything that violates
the **out-of-scope** list below. Sort within each tier by file path.

```
## 🔴 Likely bugs / security
- `path/to/file.ts:42` — <one-line why>. <optional 2nd line if needed>
- ...

## 🟡 Forgotten / incomplete
- `path/to/file.ts:88` — <one-line why>.

## 🟢 Style / nits
- `path/to/file.ts:12` — <one-line why>.

## ℹ️ Notes
- <thing worth confirming, not necessarily wrong>

## Lint
- ✅ pnpm lint clean — OR — N issues (pasted/summarized below)
```

Each line: file path with line number, one-line rationale. **No wall-of-text
explanations.** If something genuinely needs more, add one indented follow-up
line max.

End with a one-sentence verdict: e.g. "Looks shippable, two 🟡 worth a quick
pass" or "Don't ship — 🔴 #1 will break login."

## Out of scope (do NOT flag)

- Missing or insufficient tests
- "You should add error handling here" for internal-only call sites
- Suggested abstractions, helper extractions, premature DRY
- Comment density / docstring suggestions
- Generic best-practice lectures unrelated to the actual diff
- Performance speculation without a concrete trigger
- Any file inside the exclusion list in step 3
- TypeScript `any`s that already existed before the change
- Style nits that aren't enforced by the project's lint config

## Calling conventions

- The skill takes one optional positional arg:
  - `<no arg>` — default: uncommitted + recent Claude commits
  - `uncommitted` / `wt` — working tree only
  - `branch` / `vs-main` — full branch diff vs main
- Treat any other arg as a free-text focus hint passed to the agents
  ("focus on auth changes", "look hard at the migration").
