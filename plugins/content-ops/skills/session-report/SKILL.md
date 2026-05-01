---
name: session-report
description: >
  Summarize the current Claude Code session and send the report to Slack in Mongolian.
  Trigger this skill whenever the user types "/report", "report", "тайлан", or asks to
  summarize and send the session to Slack. Also trigger when the user says things like
  "send a summary to Slack", "wrap up and report", "session report", or "илгээ".
  This skill handles the full flow: summarize accomplished work, pick a Slack channel,
  and send — no confirmation needed.
---

# Session Report

Generate a concise session report in Mongolian and send it to a Slack channel.

## Trigger

This skill activates on `/report` or similar commands. When triggered, execute the full
flow below without asking the user to confirm the send — just do it.

## Step 1: Determine scope

Figure out what work has been done **since the last `/report`** in this project.

- Check the file `.session-report-history.json` in the project root.
- If it exists, read the `last_report_timestamp` field. Only summarize work done after
  that point in the conversation.
- If it doesn't exist, summarize everything in the current session.

## Step 2: Write the report

Summarize the session in **Mongolian** using this structure:

```
📋 *Ажлын тайлан*
_{current date}_

*Хийсэн зүйлс:*
• {accomplished item 1}
• {accomplished item 2}
• ...
```

Rules for the report content:

### Impact-first reporting

The report should be written from the perspective of **what changed for the user or the
product**, not what changed in the code.

- **Lead with impact.** Describe what the user will now see, experience, or be able to
  do differently. For example, instead of "fixed null check in UserProfile component",
  write "Хэрэглэгчийн профайл хуудас алдаа заагдахгүй болсон" (profile page no longer
  shows an error).
- **De-emphasize low-impact housekeeping.** Things like linting fixes, type annotation
  fixes, import reordering, formatting changes, and similar mechanical cleanup should
  NOT get their own bullet points. If they were the only thing done, mention them
  briefly in a single grouped line like "Кодын цэвэрлэгээ хийсэн" (code cleanup). If
  they accompanied meaningful changes, simply omit them.
- **Include essential code-level changes** that other developers need to know about —
  infrastructure changes, dependency upgrades, database migrations, API contract changes,
  config changes, etc. These matter even if end users don't see them directly.
- **Group related work into one bullet** when multiple changes serve the same user-facing
  outcome. For example, if you fixed a bug and added a loading state to the same page,
  that can be one bullet describing the improved experience.

### General rules

- **Only include things that were actually done.** Completed tasks, fixed bugs, created
  files, resolved issues, implemented features, etc.
- **Never include** suggestions, future plans, next steps, "could also do", "consider
  doing", or anything forward-looking. The report is strictly retrospective.
- Keep each item concise — one line per accomplishment.
- Use natural Mongolian, not overly formal or robotic. Write like a developer
  summarizing their day to teammates.
- If very little was done (e.g., just a quick question/answer), still report what
  happened — even if it's just one bullet.

## Step 3: Pick the Slack channel

Read the channel history from `.session-report-history.json` in the project root.

The file structure:

```json
{
  "last_report_timestamp": "2025-01-15T10:30:00Z",
  "channel_history": [
    { "channel_id": "C123ABC", "channel_name": "#dev-updates", "use_count": 12 },
    { "channel_id": "C456DEF", "channel_name": "#general", "use_count": 3 }
  ]
}
```

**If channel history exists:**
- Present the channels sorted by `use_count` (most used first).
- Ask the user which one to use, showing the top option as the default. Example:
  ```
  Аль сувагт илгээх вэ?
  1. #dev-updates (⭐ хамгийн их)
  2. #general
  3. Өөр суваг бичих
  ```
- If the user picks a number, use that channel.
- If the user types a channel name, search for it and use it.

**If no history exists (first time):**
- Ask: `Аль Slack сувагт илгээх вэ?`
- Wait for the user to provide a channel name.
- Search for the channel using the Slack MCP tools.

## Step 4: Send to Slack

Use the Slack MCP integration to send the report message to the chosen channel.
**Do not ask for confirmation.** Just send it.

After sending:
- Tell the user it was sent: `✅ Тайлан #{channel_name} суваг руу илгээгдлээ.`
- Update `.session-report-history.json`:
  - Set `last_report_timestamp` to the current ISO timestamp.
  - Increment `use_count` for the chosen channel (or add it if new).
  - Write the file back to the project root.

## Step 5: Save state

Write/update `.session-report-history.json` in the project root with the updated
timestamp and channel history. Create the file if it doesn't exist.

Make sure this file is added to `.gitignore` if a `.gitignore` exists — this is local
state, not something to commit.

## Edge cases

- **User says a channel name that doesn't exist**: Tell them it wasn't found and ask
  again. Don't guess.
- **Nothing was accomplished**: Send a minimal report like `📋 *Ажлын тайлан* — энэ
  удаа онцгой ажил хийгдээгүй.` Still update the timestamp.
- **User wants to change the channel after picking**: Just switch — no friction.
- **Multiple projects**: The history file is per-project (lives in the project root),
  so different projects can have different default channels.
