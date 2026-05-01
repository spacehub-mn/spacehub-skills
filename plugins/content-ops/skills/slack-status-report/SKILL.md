---
name: slack-status-report
description: Use this skill when the user wants to post a session summary, daily standup, or status report to Slack — especially for Mongolian-language teams using lowercase casual tone. Covers structure (what was done / what is next / blockers), tone, length, and the exact Slack message formatting. Trigger phrases include "slack report", "session summary", "daily update", "өнөөдрийн", "status post", "post to slack".
when_to_use: User is wrapping up a coding or work session and wants to share what they did; user pastes raw notes and asks for a summary; user explicitly says "make a Slack post" or refers to Mongolian session-report conventions.
---

# Slack Status Report

## When to use this skill

- Closing out a working session and producing a short, scannable Slack post.
- Converting raw notes into the team's standard report shape.
- Drafting a weekly or daily standup-style summary.

## Instructions

1. **Ask for the source material** if not already provided: what was worked on, what is unfinished, any blockers, links to PRs/issues.
2. **Use the team's structure**:
   - One-line headline (what shipped / what was the focus).
   - Done: 2–5 bullets, past tense, concrete.
   - Next: 1–3 bullets, what is queued.
   - Blockers (only if any).
3. **Tone**: lowercase casual for Mongolian-language teams; preserve the same shape for English. Do not switch to formal register unless asked.
4. **Formatting**: Slack mrkdwn — `*bold*` not `**bold**`, `_italic_`, `<https://url|text>` for links, `>` for quotes. Plain dashes `-` for bullets.
5. **Length cap**: keep under ~12 lines total. If notes overflow, push detail to a thread reply rather than the main message.
6. **Mongolian copy is maintainer-supplied.** Do not generate Mongolian sentences unless the user explicitly provides the source text or asks for translation.

## Examples

**Trigger:** "make a slack post from these notes: fixed the auth bug, deployed v0.4, started on billing"

**Output shape:**
```
*v0.4 shipped + auth fix*
Done:
- fixed auth bug (<PR-link|#123>)
- deployed v0.4 to prod
- started billing flow

Next:
- finish billing checkout
```

## Notes

- Channel IDs and webhook URLs are user-supplied; never embed real ones in the skill body.
- For threads, the first message is the headline; details go in replies. This is the team default.
- If the user wants the post sent (not just drafted), they will provide a Slack MCP tool or webhook explicitly — do not assume.

<!-- TODO: Maintainer to supply Mongolian template phrases. -->
