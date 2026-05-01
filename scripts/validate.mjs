#!/usr/bin/env node
// Validates the marketplace, plugin manifests, and SKILL.md files.
// Exits non-zero on any error; prints a summary at the end.

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const MARKETPLACE_PATH = join(ROOT, ".claude-plugin", "marketplace.json");
const PLUGINS_DIR = join(ROOT, "plugins");

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DESC_CAP = 1536;
const NAME_CAP = 64;

const errors = [];
const warnings = [];

const fail = (where, msg) => errors.push(`[ERROR] ${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`[WARN]  ${where}: ${msg}`);

function parseFrontmatter(src, where) {
  if (!src.startsWith("---\n") && !src.startsWith("---\r\n")) {
    fail(where, "missing YAML frontmatter (must start with `---`)");
    return null;
  }
  const rest = src.replace(/^---\r?\n/, "");
  const end = rest.indexOf("\n---");
  if (end === -1) {
    fail(where, "frontmatter not terminated with `---`");
    return null;
  }
  const block = rest.slice(0, end);
  const lines = block.split(/\r?\n/);
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (val === ">" || val === ">-" || val === "|" || val === "|-") {
      const folded = val.startsWith(">");
      const collected = [];
      let baseIndent = null;
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (next.length === 0) {
          if (!folded) collected.push("");
          i++;
          continue;
        }
        const indentMatch = next.match(/^(\s+)/);
        if (!indentMatch) break;
        const indent = indentMatch[1].length;
        if (baseIndent === null) baseIndent = indent;
        if (indent < baseIndent) break;
        collected.push(next.slice(baseIndent));
        i++;
      }
      val = folded ? collected.join(" ").replace(/\s+/g, " ").trim() : collected.join("\n");
    } else {
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function validateMarketplace() {
  if (!existsSync(MARKETPLACE_PATH)) {
    fail("marketplace.json", `not found at ${relative(ROOT, MARKETPLACE_PATH)}`);
    return null;
  }
  let json;
  try {
    json = JSON.parse(await readFile(MARKETPLACE_PATH, "utf8"));
  } catch (e) {
    fail("marketplace.json", `invalid JSON: ${e.message}`);
    return null;
  }
  if (!json.name) fail("marketplace.json", "missing required `name`");
  else if (!KEBAB.test(json.name)) warn("marketplace.json", `name "${json.name}" should be kebab-case`);
  if (!json.owner || !json.owner.name) fail("marketplace.json", "missing required `owner.name`");
  if (!Array.isArray(json.plugins)) {
    fail("marketplace.json", "missing or non-array `plugins`");
    return json;
  }
  if (json.plugins.length === 0) warn("marketplace.json", "no plugins declared");
  const seen = new Set();
  for (const [i, p] of json.plugins.entries()) {
    const where = `marketplace.json plugins[${i}]`;
    if (!p.name) fail(where, "missing `name`");
    else {
      if (!KEBAB.test(p.name)) warn(where, `name "${p.name}" should be kebab-case`);
      if (seen.has(p.name)) fail(where, `duplicate plugin name "${p.name}"`);
      seen.add(p.name);
    }
    if (!p.source) fail(where, "missing `source`");
    if (typeof p.source === "string") {
      if (!p.source.startsWith("./")) fail(where, "relative source must start with `./`");
      if (p.source.includes("..")) fail(where, "source contains `..`");
      const resolved = join(ROOT, p.source);
      if (!existsSync(resolved)) fail(where, `source path does not exist: ${p.source}`);
    }
  }
  return json;
}

async function validatePlugin(pluginDir) {
  const name = basename(pluginDir);
  const manifestPath = join(pluginDir, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    fail(`plugin ${name}`, "missing .claude-plugin/plugin.json");
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (e) {
    fail(`plugin ${name}`, `invalid plugin.json: ${e.message}`);
    return;
  }
  if (!manifest.name) fail(`plugin ${name}`, "plugin.json missing `name`");
  else if (manifest.name !== name) fail(`plugin ${name}`, `plugin.json name "${manifest.name}" does not match folder name "${name}"`);
  if (!manifest.version) warn(`plugin ${name}`, "no `version` set; updates will use commit SHA");

  const skillsDir = join(pluginDir, "skills");
  if (!existsSync(skillsDir)) {
    warn(`plugin ${name}`, "no skills/ directory");
    return;
  }
  for (const skillName of await readdir(skillsDir)) {
    const skillDir = join(skillsDir, skillName);
    if (!(await stat(skillDir)).isDirectory()) continue;
    await validateSkill(name, skillName, skillDir);
  }
}

async function validateSkill(pluginName, skillName, skillDir) {
  const where = `${pluginName}/${skillName}`;
  if (!KEBAB.test(skillName)) warn(where, "folder name should be kebab-case");
  const skillPath = join(skillDir, "SKILL.md");
  if (!existsSync(skillPath)) {
    fail(where, "missing SKILL.md");
    return;
  }
  const src = await readFile(skillPath, "utf8");
  const fm = parseFrontmatter(src, where);
  if (!fm) return;
  if (fm.name) {
    if (fm.name !== skillName) fail(where, `frontmatter name "${fm.name}" does not match folder "${skillName}"`);
    if (fm.name.length > NAME_CAP) fail(where, `name exceeds ${NAME_CAP} chars`);
    if (!KEBAB.test(fm.name)) warn(where, "name should be kebab-case");
  }
  if (!fm.description) {
    warn(where, "no `description` — Claude will fall back to the first paragraph");
  } else {
    const combined = fm.description.length + (fm.when_to_use?.length ?? 0);
    if (combined > DESC_CAP) {
      fail(where, `description + when_to_use is ${combined} chars (cap ${DESC_CAP})`);
    }
    if (!/use this skill|trigger|when /i.test(fm.description)) {
      warn(where, "description does not mention triggers/use cases — risk of under-triggering");
    }
  }
  await scanSecrets(where, src);
}

async function scanSecrets(where, src) {
  const patterns = [
    [/[A-Z][A-Z0-9_]{4,}\s*=\s*['"][^'"]{12,}['"]/g, "looks like an inline secret/env"],
    [/(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{16,}/g, "Stripe key"],
    [/ghp_[A-Za-z0-9]{20,}/g, "GitHub personal access token"],
    [/AIza[0-9A-Za-z_-]{20,}/g, "Google API key"],
    [/xox[baprs]-[A-Za-z0-9-]{10,}/g, "Slack token"],
  ];
  for (const [re, label] of patterns) {
    if (re.test(src)) fail(where, `possible ${label} in SKILL.md`);
  }
}

async function main() {
  const market = await validateMarketplace();
  if (existsSync(PLUGINS_DIR)) {
    for (const dir of await readdir(PLUGINS_DIR)) {
      const full = join(PLUGINS_DIR, dir);
      if (!(await stat(full)).isDirectory()) continue;
      await validatePlugin(full);
    }
  }
  if (market?.plugins) {
    for (const p of market.plugins) {
      if (typeof p.source === "string" && p.source.startsWith("./plugins/")) {
        const expected = p.source.replace("./plugins/", "");
        if (!existsSync(join(PLUGINS_DIR, expected))) {
          fail("marketplace.json", `plugin "${p.name}" references missing folder ${p.source}`);
        }
      }
    }
  }
  for (const w of warnings) console.warn(w);
  for (const e of errors) console.error(e);
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
