---
name: audit-fixes
description: Applies fixes for the high-impact findings from a recent `/audit` or `/quick-audit` — severe problems, UX-breaking issues, latent footguns, and straight-out wrong code. Leaves style nits, speculation, abstraction/test suggestions, and ℹ️ "needs-your-call" items alone. Use when the user says "fix the audit findings", "apply the fixes", "fix the important ones", "fix what matters from the audit", "/audit-fixes", or otherwise asks Claude to act on a prior audit report. Expects an audit report to already exist in the conversation — if not, tells the user to run audit first.
---

# Audit fixes

Acts on the output of a recent `/audit` or `/quick-audit` and fixes the
findings that matter:

- 🔴 severe bugs and security issues
- Anything that affects user-visible behavior (broken UX, error users see)
- Latent footguns that will cause trouble later (races, leaks, retry-bombs,
  half-wired features, dangling imports, partially renamed symbols)
- Straight-out wrong code (clear defects, broken contracts, wrong API usage)

Leaves alone: 🟢 style nits, abstraction / test suggestions, speculation
without a concrete trigger, ℹ️ "needs-your-call" items, and any preexisting
issue not introduced by the audited diff.

## Language

Respond in the user's input language. Severity markers (🔴 / 🟡 / 🟢), file
paths, line numbers, and section headers ("Fixed", "Skipped", "Lint") stay
as-is — they are structural markers. Prose rationale and the final verdict
use the user's language.

## Prerequisites

This skill expects audit findings to already exist in the current
conversation — typically from a recent `/audit` or `/quick-audit` run.

If there is no reasonably recent audit report in context, respond:

> No recent audit findings in this conversation. Run `/audit` or
> `/quick-audit` first, then I can apply the important fixes.

…and stop. Do not invoke `/audit` yourself — the user decides which audit
depth they want.

"Reasonably recent" means: the audit report is visible in this conversation
and the diff that produced it hasn't materially shifted (no new commits, the
same files are still touched). If the working tree has drifted noticeably
since the report, surface that and ask the user to re-run audit.

## Workflow

### 1. Locate the audit report

Scan the conversation back to the most recent audit output. Pull every
finding line into a working list with: severity, `path:line`, one-line
rationale.

If multiple audit reports exist, use the most recent one only. Ignore
intermediate findings from sub-agents — work from the synthesized report
the user actually saw.

### 2. Classify each finding — fix or skip

For every finding, decide **Fix** or **Skip**.

**Fix** if any of these apply:

- 🔴 severity (likely bug or security issue) — almost always fix
- The finding describes a concrete defect: wrong logic, broken null check,
  missing authz, half-wired feature, dangling import, partially renamed
  symbol, broken paraglide message key, env var used but not declared,
  signature change without caller updates, off-by-one with a real trigger
- Affects UX: visible misbehavior, an error path the user will see, a perf
  cliff on a user-facing path
- Latent footgun: race condition, retry-loop bomb, resource leak, code that
  "happens to work" but is semantically wrong
- Violates a loaded `CLAUDE.md` / memory rule (treat as 🔴 even if the
  audit styled it as 🟡)

**Skip** if any of these apply:

- 🟢 nit / pure style / opinion-based item
- "Add tests" / "extract a helper" / abstraction suggestion / "consider X"
- Speculative ("could be a problem if…") with no concrete trigger
- Preexisting pattern not introduced by the audited diff
- ℹ️ Notes / "things to confirm" — those need user judgment, not a fix
- The finding itself marks the code as intentional or "by design"

Borderline 🟡: if it looks cosmetic or organizational, skip. If it looks
like it will bite later (half-wired, dangling, broken contract,
inconsistent state), fix.

If the user passed a free-text focus hint (e.g. "only the 🔴s", "skip the
i18n stuff"), apply it on top of this classification.

### 3. Show the plan, then proceed

Print two short sections — the fix-list and the skip-list — and **proceed
without waiting** for confirmation. The user can interrupt.

```
## Fixing
- 🔴 `path/to/file.ts:42` — <rationale> → <one-line plan>
- 🟡 `path/to/file.ts:88` — <rationale> → <one-line plan>

## Skipping
- 🟢 `path/to/file.ts:12` — style nit, not enforced
- ℹ️ `path/to/file.ts:55` — needs your call
```

Group same-file fixes together when there are 3+ in one file. Keep each
"plan" to one line — concrete verb, not vague intent ("set default to
`false`", not "fix the flag").

### 4. Apply the fixes

For each fix, in file order (group same-file fixes to avoid Read churn):

- Read the relevant region of the file.
- Make the **smallest possible** edit that resolves the finding.
- One finding, one targeted edit. No restyling, renaming, or "while I'm
  here" cleanup.
- No new abstractions, helpers, or comments beyond what the fix demands.
- If the fix changes a function signature, update direct callers as part
  of the same fix — but stop at the immediate impact, don't sprawl.
- For paraglide message keys: add the key to `messages/en.json` (and
  other locale files if present) — never edit generated bundles under
  `**/paraglide/messages/`.

**Surface back to the user, don't fix**, if:

- The fix needs information you don't have (ambiguous intent, business
  rule, unclear correct value).
- Multiple competing fixes are equally valid and the user should pick.
- The "right" fix requires a much larger restructuring — mention it in
  the report as a follow-up, don't attempt.

### 5. Run lint

After all fixes are applied:

- If the root `package.json` has a `lint` script, run `pnpm lint`.
- For monorepos with no root lint script, run `pnpm -r lint`, or
  `pnpm --filter "<pkg>" lint` per touched package.
- Time-limit each invocation to ~3 minutes. Capture stdout+stderr.
- If `pnpm lint` doesn't exist anywhere, skip this step silently — do
  **not** fall back to `tsc`, `eslint`, `svelte-check`, or `prettier`
  directly.
- If lint reports issues introduced **by the fixes**, loop back into
  step 4 for those specific items and fix them too.
- If lint complains about preexisting issues unrelated to the fixes,
  leave them alone and note them in the report.

### 6. Report

End with a tight report:

```
## Fixed
- `path/to/file.ts:42` — <one-line what changed>
- `path/to/file.ts:88` — <one-line what changed>

## Skipped
- `path/to/file.ts:12` — style nit, not enforced
- `path/to/file.ts:55` — needs your call: <one-line question>

## Lint
- ✅ pnpm lint clean — OR — N issues (list)
```

One-sentence verdict at the end, reflecting reality: e.g. "5 fixed, 2
skipped, lint clean — give it a once-over before committing" or "Fixed
the 🔴s; 1 🟡 left because it needs your call on the rate limit value."

## What NOT to do

- Don't fix things that weren't in the audit report. If you spot a
  separate issue while editing, mention it but don't expand scope.
- Don't rewrite, rename, or restructure code "while you're in there."
- Don't add tests, docs, comments, or examples unless the finding
  explicitly required them.
- Don't fix preexisting issues unrelated to the audited diff — lint
  complaints about untouched code are out of scope.
- Don't auto-commit or amend. Stop at "fixes applied + lint clean" and
  let the user commit.
- Don't re-run audit at the end. The user can run `/quick-audit` or
  `/audit` again themselves if they want a fresh pass on the post-fix
  diff.

## Calling conventions

- `<no arg>` — default: act on the most recent audit report in
  conversation, fixing everything that qualifies.
- Free-text focus hint — narrows what gets fixed:
  - `"only 🔴"` / `"only red"` / `"only severe"` — skip 🟡s
  - `"skip <topic>"` — skip findings matching that topic (e.g.
    `"skip the i18n issues"`)
  - `"only <path>"` — limit fixes to a path prefix
  - Any other free text is treated as a soft filter, applied on top of
    the standard fix/skip classification.
