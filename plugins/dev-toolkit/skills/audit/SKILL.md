---
name: audit
description: Deep multi-agent review of recently-touched code, where five reviewer personas (cynical veteran, adversarial hacker, meticulous finisher, convention enforcer, product-intent reviewer) each read the whole diff through their own lens. Use when the user asks to "audit", "review", "deep-review", "predeploy-check", or "scan" recent changes — including phrasings like "did I break anything", "go over what we just did", "find blunders". For a faster, lighter pass split by topic, use the `quick-audit` skill instead. Targets code Claude touched (uncommitted working-tree changes plus recent Claude-coauthored commits) by default; with arg "uncommitted" or "wt" only the working tree is reviewed.
---

# Audit

A deep, multi-step, multi-agent audit of recent code changes. Five reviewer
personas each read the **whole diff** through their own lens; findings that
multiple personas independently surface carry the most signal. The goal is to
catch **likely bugs, forgotten work, security holes, intent mismatches, and
convention violations** — not to lecture about tests, abstractions, or style
nits the codebase doesn't already enforce.

This is the slower, more thorough sibling of `quick-audit`. Reach for this
when the change is risky, large, or about to ship; reach for `quick-audit`
when you just want a fast sanity check.

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

For each Claude-coauthored commit found, capture both the stats
(`git show --stat <hash>`) and the commit message (`git show -s --format=%B
<hash>`) — the message is needed by the product-intent persona in step 5. Full
diffs go to the sub-agents.

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

### 5. Dispatch five persona agents in parallel

Spawn **five general-purpose subagents in a single message** so they run
concurrently. Each persona reviews the **entire diff** (not a slice of it) and
returns findings through their own lens. Overlap is expected and useful —
findings raised by multiple personas independently are the highest-signal.

Use `subagent_type: "general-purpose"` for personas 1–5, except the cynical
veteran which can use `Explore` if it needs to read a lot of caller-side
context outside the diff.

Brief each agent like a colleague: hand it the project type, the full list of
in-scope changed files (with paths), the relevant CLAUDE.md / memory rules
loaded in step 2, the recent Claude commit messages (for persona 5), and ask
for "under N findings, only the ones you'd actually flag in a code review."
Tell each agent **not** to suggest tests, abstractions, or speculative
improvements — only concrete defects through their lens.

Each agent must return findings in this schema (and nothing else):

```
- <severity 🔴/🟡/🟢> `path/to/file.ts:LINE` — <one-line finding>
  [optional 1-line follow-up]
```

#### Persona 1 — Cynical veteran

> "I've seen this fail in prod before."

Looks for: regressions in untouched callers, broken null/undefined handling,
race conditions, off-by-one errors, mismatched types crossing boundaries,
silent failure modes, retry-loop bombs, missed error paths at real boundaries
(network/IO/user input). **Reads callers of changed functions** to detect
breakage outside the diff.

#### Persona 2 — Adversarial hacker

> "How do I exploit this?"

Looks for: missing authz/authn checks, SQL/NoSQL injection, unsafe HTML
rendering / XSS, open redirect, SSRF, CSRF assumption breaks, weak input
validation at the trust boundary, secrets/keys committed to code, PII in logs,
prototype pollution, path traversal. Doesn't speculate about purely
hypothetical attacks — only concrete vectors traceable through this diff.

#### Persona 3 — Meticulous finisher

> "Did you actually finish?"

Looks for: half-wired features, message keys referenced but not added, env
vars used but not declared (`.env.example`, deployment config), new components
not exported, TODOs/FIXMEs added in this diff, dead code, callers not updated
to match a changed signature, feature flags left on the wrong default,
dangling imports, partially renamed symbols.

#### Persona 4 — Convention enforcer

> "Does this match the house style?"

Looks for: violations of the loaded `CLAUDE.md` and memory rules (paraglide
source-of-truth, no manual migration generation, format-on-finish, pnpm not
npm, etc.), divergence from neighboring-file patterns in the same project,
framework-idiom violations specific to this stack. Cross-checks against
neighboring code, **not** generic best practices.

#### Persona 5 — Product-intent reviewer

> "Does the code do what the commit/PR claims?"

Reads the recent Claude commit messages and the diff together. Looks for:
scope creep (changes unrelated to the stated goal), silent behavior changes
not mentioned in the message, intent/implementation mismatches, places where
the message describes one thing but the code does another, "drive-by" edits
that should have been their own commit.

### 6. Synthesize the report

Merge all five personas' findings + lint output. **Deduplicate aggressively**:
when multiple personas raise the same issue, keep the clearest phrasing and
note the convergence inline (e.g. "[flagged by 3 personas]" — this is a
strong signal). Drop anything that violates the **out-of-scope** list below.
Sort within each tier by file path.

```
## 🔴 Likely bugs / security
- `path/to/file.ts:42` — <one-line why>. [flagged by 3 personas]
  <optional 2nd line if needed>
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

End with a one-sentence verdict that reflects the convergence: e.g. "Looks
shippable, two 🟡 worth a quick pass" or "Don't ship — 🔴 #1 was independently
flagged by 4 of 5 personas and will break login."

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
- Treat any other arg as a free-text focus hint passed to all five personas
  ("focus on auth changes", "look hard at the migration").
