#!/usr/bin/env node
// Scaffolds a new skill: node scripts/new-skill.mjs <plugin>/<skill-name>

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const arg = process.argv[2];
if (!arg || !arg.includes("/")) {
  console.error("Usage: node scripts/new-skill.mjs <plugin>/<skill-name>");
  process.exit(2);
}

const [plugin, skill] = arg.split("/");
if (!KEBAB.test(plugin) || !KEBAB.test(skill)) {
  console.error(`Both plugin and skill names must be kebab-case. Got: "${plugin}/${skill}"`);
  process.exit(2);
}

const pluginDir = join(ROOT, "plugins", plugin);
if (!existsSync(pluginDir)) {
  console.error(`Plugin "${plugin}" does not exist at ${pluginDir}`);
  console.error(`Create the plugin first by adding it to marketplace.json and creating .claude-plugin/plugin.json.`);
  process.exit(2);
}

const skillDir = join(pluginDir, "skills", skill);
const skillFile = join(skillDir, "SKILL.md");
if (existsSync(skillFile)) {
  console.error(`Skill already exists: ${skillFile}`);
  process.exit(2);
}

const template = `---
name: ${skill}
description: Use this skill when [specific trigger conditions]. Covers [what it does]. Trigger phrases include "X", "Y", "Z".
when_to_use: [Concrete situations where Claude should reach for this skill — file types, error shapes, user phrasings.]
---

# ${skill.replace(/-/g, " ").replace(/\\b\\w/g, (c) => c.toUpperCase())}

## When to use this skill

- [Trigger 1]
- [Trigger 2]
- [Trigger 3]

## Instructions

1. [Step or principle]
2. [Step or principle]
3. [Step or principle]

## Examples

**Trigger:** "[example user phrasing]"
**Response shape:** [what the model should do]

## Notes

- [Edge case or gotcha]
`;

await mkdir(skillDir, { recursive: true });
await writeFile(skillFile, template);
console.log(`Created ${skillFile}`);
console.log(`Next: edit the frontmatter (especially description), then run \`node scripts/validate.mjs\`.`);
