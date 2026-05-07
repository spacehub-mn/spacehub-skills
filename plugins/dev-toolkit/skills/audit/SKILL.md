---
name: audit
description: Deep multi-agent review of recently-touched code, where three reviewer personas (the skeptic, the adversary, the maintainer) each read the whole diff through their own lens. Use when the user asks to "audit", "review", "deep-review", "predeploy-check", or "scan" recent changes — including phrasings like "did I break anything", "go over what we just did", "find blunders". For a faster, lighter pass split by topic, use the `quick-audit` skill instead. Targets code Claude touched (uncommitted working-tree changes plus recent Claude-coauthored commits) by default; with arg "uncommitted" or "wt" only the working tree is reviewed.
---

# Audit

A deep, multi-step, multi-agent audit of recent code changes. Three reviewer
personas each read the **whole diff** through their own lens; findings that
two or three of them independently surface carry the most signal. The goal
is to catch **likely bugs, forgotten work, security holes, intent
mismatches, and convention violations** — not to lecture about tests,
abstractions, or style nits the codebase doesn't already enforce.

This is the slower, more thorough sibling of `quick-audit`. Reach for this
when the change is risky, large, or about to ship; reach for `quick-audit`
when you just want a fast sanity check.

## Language

Respond to the user in their input language. Section headers (🔴 / 🟡 / 🟢,
"Lint", file paths, line numbers) stay as-is — they are structural markers.
Prose findings, rationale lines, and the final verdict use the user's
language.

## Severity rubric

**Be strict about 🔴.** A long list of reds that turn out to be cosmetic on
follow-up is a worse outcome than missing one — it trains the user to ignore
the report. **When uncertain, downgrade.** If a finding survives the question
"would I block ship over this *as the diff actually exists*?" with a
confident yes, it's 🔴. Otherwise it isn't.

🔴 — **Ship-blocker.** At least one of:
- The change does the wrong thing on an input the code is **actually
  reachable with under normal use today** — not a contrived two-tab race,
  not "if someone adds permissive CORS later," not "if a future caller does
  X." A realistic call from current callers / current UI must trigger it.
- A directly exploitable security hole given the **actual attacker model**
  for this code path (an authenticated operator spoofing a header about
  their own action is rarely 🔴; an unauthenticated attacker bypassing
  authz usually is).
- The change demonstrably breaks behavior the project relies on, verified
  by reading the caller / commit history — not assumed from the diff alone.
- A direct, unambiguous violation of a **CLAUDE.md or memory rule** that
  will visibly malfunction (hardcoded UI text where paraglide is required,
  manual migration generation where forbidden, etc.).

If the issue is reachable only under simultaneous-operator races, requires
a future hypothetical change to be exploitable, has an obvious manual
workaround the user/operator already uses, describes a pre-existing hazard
the diff doesn't materially worsen, or depends on a chain of "if X and Y
and Z" — it's **not 🔴**.

🟡 — **Real concern, not blocking.** Worth a follow-up but ship-safe:
- Pre-existing operational hazards the diff brushes against but doesn't
  worsen.
- Narrow races mitigated in practice by sequential UI flows.
- Defense-in-depth gaps that rely on an assumption that currently holds.
- Scope creep / silent behavior changes that should have been called out
  in the commit message.
- Missing migrations that have a manual workaround.
- UX cliffs and hard-to-reach error branches.
- Stylistic divergence from a CLAUDE.md/memory rule that won't visibly
  malfunction.

🟢 — **Cosmetic / nit.** Comment phrasing, redundant defensive checks,
byte-equivalent regex rewrites, dead-but-harmless code, minor
inconsistency between branches.

ℹ️ — **Watching brief.** "If you ever add X, this becomes a problem."
Worth knowing once; do not elevate to 🔴/🟡 just because the consequence
would be bad *if* the trigger appeared.

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
<hash>`) — the message is needed by the maintainer persona in step 5. Full
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

These rules are **first-class signals** — apply the severity rubric: an
unambiguous violation that will visibly malfunction is 🔴; a stylistic
divergence from the rule is 🟡 or 🟢.

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

### 5. Dispatch three persona agents in parallel

Spawn **three general-purpose subagents in a single message** so they run
concurrently. Each persona reviews the **entire diff** (not a slice of it)
and returns findings through their own lens. Overlap is expected and useful
— a finding both the skeptic and the maintainer raise independently is
high-signal.

Use `subagent_type: "general-purpose"` for all three. The skeptic may use
`Explore` if it needs to read caller-side context outside the diff.

Brief each agent like a colleague: hand it the project type, the full list of
in-scope changed files (with paths), the relevant CLAUDE.md / memory rules
loaded in step 2, the recent Claude commit messages (for the maintainer),
the **full severity rubric from the top of this skill**, and ask for "under
N findings, only the ones you'd actually flag in a code review." Tell each
agent **not** to suggest tests, abstractions, or speculative improvements —
only concrete defects through their lens, and to **default to lower severity
when uncertain** rather than padding the 🔴 list.

Each agent must return findings in this schema (and nothing else):

```
- <severity 🔴/🟡/🟢> `path/to/file.ts:LINE` — <one-line finding>
  [optional 1-line follow-up]
```

#### Persona 1 — The skeptic

> "Where does this break or stop short?"

Combines the bug-hunter and the finisher. Looks for **concrete defects**
reachable from current callers / current UI on realistic inputs:
- Regressions in untouched callers; broken null/undefined handling;
  off-by-one and boundary errors; race conditions that fire in normal use
  (not contrived two-tab scenarios); mismatched types crossing boundaries;
  silent failure modes; retry-loop bombs; missed error paths at real I/O
  boundaries.
- Half-wired features: message keys referenced but not added, env vars used
  but not declared, new components not wired into their usage site,
  dangling imports, partially renamed symbols, callers not updated to match
  a changed signature, feature flags left on the wrong default, TODOs/FIXMEs
  added in this diff, dead code introduced by the change.
- **Timebombs** — inevitable future failures with a non-contingent trigger:
  hardcoded dates that will fall in the past, counters/IDs approaching
  overflow, growth assumptions about to hit the wall, expiring
  secrets/certs/tokens, dependencies past EOL or about to be. Default 🟡.
  *Distinct from* "if someone ever adds X" — that's contingent and stays
  ℹ️ (watching brief).

**Reads callers of changed functions** when needed to verify a regression
claim — does not speculate about hypothetical callers.

#### Persona 2 — The adversary

> "How is this actually exploited?"

Looks for **concrete attack paths traceable through this diff** given the
realistic attacker model for this code path: missing authz/authn checks,
SQL/NoSQL injection, unsafe HTML rendering / XSS, open redirect, SSRF,
CSRF assumption breaks, weak validation at the trust boundary,
secrets/keys committed to code, PII in logs, prototype pollution, path
traversal.

**Hard rule:** no theoretical "if you ever add X, then Y" reasoning.
Authenticated-operator-spoofing-headers-about-their-own-action is rarely
🔴; an unauthenticated attacker bypassing authz usually is. If there's no
plausible attacker on this path today, return zero findings rather than
manufacture content.

#### Persona 3 — The maintainer

> "Does this fit the codebase and what the commit claims?"

Combines the convention enforcer and the product-intent reviewer. Reads the
recent Claude commit messages and the diff together, alongside the loaded
CLAUDE.md / memory rules, and looks for:
- Violations of explicit CLAUDE.md / memory rules (paraglide source of
  truth, no manual migration generation, pnpm not npm, format-on-finish,
  etc.). Apply the severity rubric: visible-malfunction violations are
  🔴; stylistic divergence is 🟡 or 🟢.
- Divergence from neighboring-file patterns in the same project /
  framework-idiom violations specific to this stack. Cross-checks against
  neighboring code, **not** generic best practices.
- Scope creep: changes unrelated to the stated commit goal.
- Silent behavior changes not mentioned in the commit message.
- Intent/implementation mismatches: places where the message describes one
  thing but the code does another.
- **Deferred essential follow-ups** — the change implies a sibling action
  that wasn't done: a data backfill for a schema/formula change, a
  migration, a config update in another package, a flag flip in a
  deployment manifest, an updated `.env.example`, a corresponding change
  in a consumer of the modified API. Even when the diff itself works,
  missing the implied follow-up is a real finding (usually 🟡, sometimes
  🔴 if the missing piece breaks production behavior on next run).
- "Drive-by" edits that should have been their own commit.

### 6. Synthesize the report

Merge all three personas' findings + lint output. **Deduplicate
aggressively**: when two or three personas raise the same issue, keep the
clearest phrasing and note the convergence inline (e.g. "[flagged by 2
personas]" — convergence is a strong signal with only three reviewers).
Drop anything that violates the **out-of-scope** list below. Sort within
each tier by file path.

**Triage gate — run this on every 🔴 before publishing.** For each
finding personas marked 🔴, answer:

1. Is the bad outcome reachable from current callers / the current UI on a
   realistic input — without simultaneous operators, hypothetical future
   features, or "if you also add X"?
2. Is the security claim concrete (a real attacker, a real path) or
   speculative defense-in-depth?
3. Would you, personally, block ship over this *as the diff exists today*?

If any answer is "no / not really," **downgrade** to 🟡 (or ℹ️ for
watching-brief items). The 🔴 tier is reserved for findings the user
would be angry you didn't loudly flag. Most "could fail under racy
conditions" findings are 🟡, not 🔴 — make peace with that.

When the report ends with a verdict like "looks shippable, just nits" but
the 🔴 list is long, you've miscategorized — go back and downgrade.

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
shippable, two 🟡 worth a quick pass" or "Don't ship — 🔴 #1 was raised by
both the skeptic and the maintainer and will break login."

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
- Treat any other arg as a free-text focus hint passed to all three personas
  ("focus on auth changes", "look hard at the migration").
