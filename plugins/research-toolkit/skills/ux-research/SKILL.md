---
name: ux-research
description: Online research on a UX/UI problem (a screen, flow, component, or interaction) — fans out parallel subagents to study established patterns, real-world examples, antipatterns, accessibility, and mobile/responsive considerations, then presents 3–6 distinct UI variations as live rendered HTML/CSS mockups inside a single standalone dark-themed HTML report. Each variation includes a rationale, when-to-use guidance, and cited real-world inspirations. Writes the report to `/tmp/claude-research/` and opens it in the default browser. Use when the user invokes `/ux-research` or `/ui-research`, or says "research UX for X", "show me UI variations for X", "explore designs for X", "how do other apps handle X". The topic is the rest of the user message after the trigger phrase.
---

# UX research

Researches a UI/UX problem online and produces a self-contained HTML report
with **3–6 distinct UI variations rendered as live mockups**, plus rationale,
tradeoffs, and cited inspirations. The number of variations is adaptive —
only produce as many as the design space genuinely supports.

The output is **one HTML file**, dark-themed for the surrounding report
chrome, with each variation rendered inside a sandboxed `<iframe srcdoc>` so
each mockup carries its own scoped styling (and can be light or dark
internally to match what's idiomatic for that product/pattern).

This skill is invoked by either `/ux-research` (primary slug) or
`/ui-research` (alias — see the sibling `ui-research` skill, which delegates
here).

## Language

Respond to the user in their input language for the chat-side updates and
the report's prose. Mockup contents (button labels, sample copy) stay in
the user's input language too, unless the topic implies otherwise (e.g.
researching a Japanese product). Structural markers (file paths, severity
labels, section headings of the report) stay in English unless the user
explicitly asks for fully localized headings.

## Workflow

Follow these steps in order. Use parallel tool calls wherever steps are
independent.

### 1. Frame the design brief

Restate the topic in one short sentence to confirm understanding, then
without waiting derive a design brief:

- **The problem**: what UI/UX problem the user is researching
- **The surface**: screen, flow, component, or interaction
- **The platform**: web, mobile (iOS / Android), desktop app, watch, TV —
  inferred from topic or CLAUDE.md / project context; ask only if truly
  ambiguous
- **Likely users**: power users / first-timers / mixed; consumer / B2B
- **Key constraints**: any constraints implied by the topic ("dense
  data", "low literacy", "offline-first", "accessible", "minimal")

Surface the brief in 3–4 lines. Don't wait for confirmation — proceed.

### 2. Pick the slug and output path

- Slug: kebab-case from the topic, ASCII-only, ≤60 chars, prefixed `ux-`
  (e.g. `ux-onboarding-flow-fintech-2026`).
- Timestamp: `YYYYMMDD-HHMM` in local time.
- Output path: `/tmp/claude-research/<slug>-<timestamp>.html`.
- Create the directory if missing: `mkdir -p /tmp/claude-research`.

### 3. Dispatch parallel research subagents

Spawn **all subagents in a single message** so they run concurrently. Use
`subagent_type: "general-purpose"` (must have WebSearch + WebFetch).

Default angle set — adapt names to fit the topic, but keep at least 4:

1. **Established patterns & heuristics** — what does the literature say
   (NN/g, Refactoring UI, Material, Apple HIG, Shopify Polaris, web.dev).
   Surface named patterns with a one-sentence description of each.
2. **Real-world examples** — which products implement this well, and
   what specific choices did they make? Capture product name, screen
   name, URL, and one or two distinctive choices per example. Aim for
   8–15 examples across the angle so the synthesis step has range.
3. **Antipatterns & known failure modes** — what goes wrong, what
   complaints recur in App Store / Reddit / Hacker News / product
   reviews. Surface concrete "don't do X because Y" statements.
4. **Accessibility considerations** — keyboard nav, screen reader
   behavior, color-contrast pitfalls, touch-target sizing, focus order,
   ARIA gotchas specific to this UI pattern.
5. **Mobile / responsive behavior** — how the pattern degrades or
   transforms at small widths, thumb-zone considerations, gesture
   conflicts.
6. **Emerging or contrarian takes** — recent (≤12 months) writing or
   product launches that challenge the established pattern. Source from
   product blogs, design Twitter/Bluesky, conf talks if findable.

Drop angle 6 if the topic is timeless (e.g. "checkbox vs radio");
emphasize it if the topic is fast-moving (e.g. AI chat UIs).

**Brief each subagent** like a colleague: topic, the specific angle, the
expected source mix, ask for **direct quotes with URLs** for anything
load-bearing and **specific product names** for examples. Tell them to
flag contradictions explicitly and cap each subagent at ~15 findings.

**Tool budget per subagent**: 5–10 WebSearch/WebFetch calls for most
angles; 10–12 for "Real-world examples" (which needs broader product
coverage). Stop early when findings are solid — chasing past good-enough
adds low-signal noise, not depth.

Each subagent returns findings in this schema:

```
- <finding in one sentence>
  Source: <URL>
  Product / authority: <name>
  Quote (if load-bearing): "<direct quote>"
  Confidence: high | medium | low
  Date: <publication date or "unknown">
```

Plus a short "open questions" list at the end.

### 4. Decide the variation set

While subagents run, sketch the variation space. After findings return:

- Cluster examples by structural approach (e.g. "single-column scroll",
  "stepper", "card grid", "left-rail nav", "command palette"). Each
  cluster is a candidate variation.
- Keep **3–6 variations** that are **structurally distinct**, not minor
  visual reskins. If only 3 real approaches exist in the design space,
  ship 3 — never pad.
- Each variation must be defensible: at least one well-known product
  uses it OR an established heuristic justifies it. No invented
  patterns.
- **Preserve dissent**: if a contrarian or emerging pattern surfaced in
  only one subagent's findings, include it as a variation when it
  represents a genuinely different structural approach — minority
  patterns are often the most interesting comparison points. Mark such
  variations as "Emerging" in their rationale line.
- For each, lock in: a short title, one-line rationale, when-to-use,
  when-not-to-use, 2–4 cited inspirations (product + URL).

### 5. Render the mockups

Each variation is a self-contained mockup rendered inside an
`<iframe srcdoc="…" class="mockup">` block inside the main report. The
iframe sandbox keeps each mockup's CSS from leaking into the report or
into other mockups.

Mockup ground rules:

- **Self-contained HTML inside `srcdoc`**: `<!doctype html>` + inline
  `<style>` + `<body>` markup. No external CSS, no external fonts, no
  scripts. System font stack only.
- **Realistic sample content** — real-sounding labels, not "Lorem ipsum".
  Use plausible product names, plausible copy, plausible data shapes.
- **Polished, not perfect** — clean spacing, consistent typography
  inside the mockup, visible interactive affordances (hover/focus
  styles, even if static). Avoid the AI-generic look: no rainbow
  gradients, no purple-pink CTAs unless the pattern calls for it.
- **Internally consistent palette** — each mockup picks one palette
  (light or dark) and stays in it. Different mockups can pick different
  palettes if that's idiomatic for the pattern they show.
- **Sized for the report** — mockups render in an iframe ~720px wide ×
  variable height (set explicit `height` attribute per mockup, typical
  range 360–640px). For mobile-pattern mockups, render a phone-frame
  width (~360–420px) centered.
- **Escaping**: write `srcdoc` with double quotes; HTML-escape any `"`
  inside the mockup content (use `&quot;`). Use single quotes for HTML
  attributes inside the mockup so srcdoc-quoting stays clean.

If a variation has a meaningful interaction (e.g. step-through wizard,
expand/collapse), render the **most informative single state** and
annotate the other states textually next to the mockup — do not add
JavaScript.

### 6. Synthesize the report

Report outline:

1. Title + meta line (topic, date, source count, variation count)
2. The brief (the 3–4 line frame from step 1)
3. Executive summary (≤200 words): the design space at a glance,
   which variation suits which situation, what to avoid
4. **Variations** (3–6 sections, each):
   - `<h2>` variation title
   - One-line rationale
   - Rendered mockup (iframe)
   - **When to use** / **When not to use** (two short lists)
   - **Inspired by**: cited products with URLs
5. **Comparison matrix**: a small table — variations as rows, key
   criteria as columns (e.g. cognitive load, discoverability, mobile
   fit, accessibility, dev cost). Mark cells with ●○◐ (filled / empty
   / half) plus a one-word qualifier.
6. **Antipatterns** — short list of "do nots" surfaced by subagent 3,
   with a cited source per item
7. **Accessibility checklist** — short, actionable, drawn from subagent 4
8. **Sources** — numbered list of every URL referenced, with title,
   publisher, and date

### 7. Write the HTML

One self-contained file. No external CSS, no external JS, no CDN fonts.
Inline CSS in a single `<style>` block in `<head>`. Use this skeleton:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TOPIC}} — UX research & UI variations</title>
<style>
  :root {
    --bg: #0f1115;
    --bg-elev: #161922;
    --bg-elev-2: #1d2230;
    --fg: #e6e6e6;
    --fg-dim: #a3a8b3;
    --accent: #8ab4f8;
    --good: #7ed3a4;
    --bad: #f08a8a;
    --rule: #2a2f3a;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
  body {
    font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI",
          Roboto, Helvetica, Arial, sans-serif;
    max-width: 880px;
    margin: 0 auto;
    padding: 48px 24px 96px;
  }
  h1 { font-size: 2rem; line-height: 1.25; margin: 0 0 .25em; letter-spacing: -.01em; }
  h2 { font-size: 1.35rem; margin-top: 2.6em; border-bottom: 1px solid var(--rule); padding-bottom: .3em; }
  h3 { font-size: 1.05rem; margin-top: 1.6em; }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
  a:hover { border-bottom-style: solid; }
  code { background: var(--bg-elev); padding: 1px 6px; border-radius: 4px; font-size: .92em; }
  .meta { color: var(--fg-dim); font-size: .9rem; margin-bottom: 2em; }
  .brief, .summary { background: var(--bg-elev); border-radius: 8px; padding: 16px 22px; margin: 1.4em 0 2em; }
  .summary h2, .brief h2 { margin-top: 0; border: 0; padding: 0; font-size: .95rem; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-dim); }
  .variation { margin-top: 2.4em; }
  .variation .rationale { color: var(--fg-dim); margin: -.3em 0 1em; }
  .mockup-frame {
    width: 100%;
    border: 1px solid var(--rule);
    border-radius: 8px;
    background: #fff;
    display: block;
    margin: 0 auto;
  }
  .usage { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 16px 0; }
  .usage > div { background: var(--bg-elev); border-radius: 8px; padding: 12px 16px; }
  .usage h4 { margin: 0 0 .4em; font-size: .85rem; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-dim); }
  .usage ul { margin: 0; padding-left: 1.2em; }
  .inspirations { font-size: .92rem; color: var(--fg-dim); margin-top: 10px; }
  table.compare { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: .92rem; }
  table.compare th, table.compare td {
    border-bottom: 1px solid var(--rule);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  table.compare th { color: var(--fg-dim); font-weight: 600; }
  .sources { font-size: .92rem; }
  .sources ol { padding-left: 1.4em; }
  .sources li { margin-bottom: .6em; }
  .footnote-ref { font-size: .8em; vertical-align: super; text-decoration: none; }
  @media (max-width: 640px) { .usage { grid-template-columns: 1fr; } }
  @media print {
    body { background: #fff; color: #000; max-width: 100%; }
    a { color: #000; border-bottom: none; }
    .brief, .summary, .usage > div { background: #f5f5f5; }
    iframe.mockup-frame { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>{{TOPIC}}</h1>
  <div class="meta">Generated {{ISO_DATE}} · {{N_SOURCES}} sources · {{N_VARIATIONS}} variations</div>

  <div class="brief">
    <h2>The brief</h2>
    <p>{{BRIEF_PROSE}}</p>
  </div>

  <div class="summary">
    <h2>Executive summary</h2>
    <p>{{SUMMARY_PROSE}}</p>
  </div>

  <!-- repeat per variation -->
  <section class="variation">
    <h2>{{N}}. {{VARIATION_TITLE}}</h2>
    <p class="rationale">{{ONE_LINE_RATIONALE}}</p>
    <iframe class="mockup-frame" height="480" sandbox="allow-same-origin"
            srcdoc="{{ESCAPED_MOCKUP_HTML}}"></iframe>
    <div class="usage">
      <div>
        <h4>When to use</h4>
        <ul><li>…</li></ul>
      </div>
      <div>
        <h4>When not to use</h4>
        <ul><li>…</li></ul>
      </div>
    </div>
    <p class="inspirations">Inspired by: <a href="…">Product A</a>, <a href="…">Product B</a></p>
  </section>

  <h2>At a glance</h2>
  <table class="compare">
    <thead>
      <tr><th>Variation</th><th>Cognitive load</th><th>Discoverability</th>
          <th>Mobile fit</th><th>A11y</th><th>Dev cost</th></tr>
    </thead>
    <tbody>
      <!-- one row per variation, cells use ●/◐/○ + one word -->
    </tbody>
  </table>

  <h2>Antipatterns</h2>
  <ul>
    <li>…<a class="footnote-ref" href="#s1">[1]</a></li>
  </ul>

  <h2>Accessibility checklist</h2>
  <ul>
    <li>…</li>
  </ul>

  <section class="sources">
    <h2>Sources</h2>
    <ol>
      <li id="s1"><a href="{{URL}}">{{TITLE}}</a> — {{PUBLISHER}}, {{DATE}}. Accessed {{ISO_DATE}}.</li>
    </ol>
  </section>
</body>
</html>
```

Write the file with the Write tool. Build the HTML string in Claude and
write once. Don't try to template it through shell.

### 8. Open the file

On macOS, run `open "/tmp/claude-research/<slug>-<timestamp>.html"`.

On Linux: `xdg-open …`. On WSL: `wslview …` or `explorer.exe …`. If
detection fails (or the user passed `--no-open`), print the absolute
path and tell the user to open it manually.

### 9. Report

End with two short lines plus a hook:

```
Wrote /tmp/claude-research/<slug>-<timestamp>.html
({{N_VARIATIONS}} variations · {{N_SOURCES}} sources). Opened in browser.
```

Plus one sentence calling out the variation you'd reach for first and
why — this earns the read.

## What NOT to do

- Don't invent products or URLs. Every cited inspiration must trace
  back to a real WebSearch/WebFetch result from this session. If you
  can't source it, drop it.
- Don't pad to hit a variation count. 3 strong variations > 6 with
  filler. The user asked for adaptive 3–6 — honor the adaptive part.
- Don't embed screenshots from researched products — copyright /
  broken-link risk. Render original mockups inspired by them and link
  to the source URL instead.
- Don't add JavaScript to mockups. Static, single-state. Multi-state
  behavior is annotated textually next to the mockup.
- Don't use external fonts, CDN CSS, or remote images. Everything inline.
- Don't make every mockup look identical (the AI-generic dark-card-with-
  blue-button look). Vary palette, density, and structural approach
  per variation — that's the whole point.
- Don't save to the project directory or `~/Documents/`. Output path is
  fixed to `/tmp/claude-research/`.
- Don't run subagents serially when they can parallelize.

## Calling conventions

- Trigger phrases: `/ux-research <topic>`, `/ui-research <topic>`, or any
  free-text request matching the description.
- Argument is the **topic / problem** — free-form text after the trigger.
- If no topic is given, ask once: "What UX problem should I research?"
  and stop.
- Inline flags inside the topic string:
  - `--platform=<web|ios|android|desktop>` — pin the platform (otherwise
    inferred)
  - `--count=<N>` — force exactly N variations (override adaptive 3–6)
  - `--no-open` — write the file but skip opening
  - `--lang=<code>` — write the report prose in that language (default:
    user's input language)

Strip flags from the topic before slug generation.
