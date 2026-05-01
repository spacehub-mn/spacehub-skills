---
name: claude-code-settings
description: Use this skill when configuring `.claude/settings.json` — defaultMode, permission allow/deny lists, environment variables, hooks, statusLine, or MCP server entries. Covers scope (user vs project vs local vs managed), precedence rules, and common misconfigurations. Trigger phrases include "claude settings", "settings.json", "permission denied by claude", "default mode", "claude hook", "allow npm in claude".
when_to_use: User is editing or debugging `.claude/settings.json` or `~/.claude/settings.json`; user mentions permission prompts, hooks, defaultMode, or MCP server config; user asks how to grant or deny a specific tool.
---

# Claude Code Settings

## When to use this skill

- Adjusting permission rules to silence repeated prompts (Bash, Read, Write, MCP tool calls).
- Setting `defaultMode` (acceptEdits, plan, bypassPermissions, default).
- Configuring hooks for SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, etc.
- Wiring statusLine, output style, or model overrides.

## Instructions

1. **Identify the scope**: managed (org-wide, read-only for users) > user (`~/.claude/settings.json`) > project (`<repo>/.claude/settings.json`) > local (`.claude/settings.local.json`, gitignored). Higher scopes win on conflict for some keys; permissions are merged, not overridden.
2. **For permission edits**, prefer the narrowest grant. `Bash(npm install)` over `Bash(*)`. Use the `deny` list to claw back specific cases inside a broad `allow`.
3. **For hooks**, remember the event taxonomy:
   - `SessionStart` — fires once per session (boot context).
   - `UserPromptSubmit` — every user turn before the model sees it; can inject context.
   - `PreToolUse` / `PostToolUse` — bracket each tool call; can block or annotate.
   - `Stop` / `SubagentStop` — when Claude finishes a turn or a subagent returns.
4. **Hook commands run in the user's shell** with no Claude context other than the env passed in. Always quote the command, escape paths, and write hooks idempotent — they may fire many times per session.
5. **For "permission denied" loops**, look for: (a) a `deny` rule overriding the `allow`, (b) a missing wildcard, (c) the prompt-mode mismatch (default mode ignores `acceptEdits` for tools).
6. **MCP server entries** live under `mcpServers`. The config matches the MCP server's own startup contract — wrong args here surface as opaque "tool failed" errors at runtime.

## Examples

**Trigger:** "stop asking me to confirm git status"
**Response shape:** Add `Bash(git status*)` to the project or user `allow` list, explaining the difference.

**Trigger:** "I want a hook that runs prettier after every edit"
**Response shape:** Show a `PostToolUse` hook with `matcher: "Edit|Write"` invoking prettier on the changed file.

## Notes

- `settings.local.json` is the right home for personal experiments; never commit it.
- Hook stdin gives you the structured event JSON — pipe through `jq` to extract paths.
- The `disable-skill-shell-execution` setting blocks `` !`...` `` injection inside skills — useful for managed environments, breaks dynamic-context skills.

<!-- TODO: Reference the team's standard settings.json once it is published. -->
