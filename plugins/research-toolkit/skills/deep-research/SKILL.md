---
name: deep-research
description: Thorough online research about a topic, person, product, or question — fans out 4–6 parallel subagents over WebSearch/WebFetch covering different angles (overview, technical detail, criticism, comparisons, recent news, primary sources), synthesizes findings into a single standalone HTML report (dark theme, inline CSS, cited footnotes), writes it to `/tmp/claude-research/`, and opens it in the default browser. Use when the user asks to "research X", "deep-dive on X", "look into X and write it up", "do a deep research on X", "make me a report on X", "find everything you can about X", or invokes `/deep-research <topic>`. The topic is the rest of the user message after the trigger phrase.
---

# Deep research

Performs a wide, multi-source online research pass on a topic and produces a
self-contained HTML report that opens in the browser when finished. Designed
for topics you'd want to read carefully, not one-line lookups.

The output is **one HTML file**, dark-themed, with inline CSS and footnote
citations, written under `/tmp/claude-research/` and opened with `open`.

## Language

Respond to the user in their input language for the chat-side updates and
inside the HTML report's prose. Structural markers (file paths, section
headings of the report) stay in English unless the user explicitly asks for
all-Mongolian / all-Japanese / etc. headings.

## Workflow

Follow these steps in order. Use parallel tool calls wherever steps are
independent.

### 1. Frame the topic

Restate the topic in one short sentence to confirm understanding, then
without waiting derive a research brief:

- **Topic**: the literal subject
- **Why the user likely cares**: one-line guess from context (CLAUDE.md,
  recent conversation, project type) — this shapes which angles get
  emphasized
- **Time horizon**: is recency critical (news, fast-moving tech) or
  evergreen (historical, theoretical)?
- **Specificity**: people / products / standards / concepts each need a
  different source mix

Surface the brief in 2–3 lines so the user can interject if you've misread
the topic. Don't wait for confirmation — proceed.

### 2. Pick the slug and output path

- Slug: kebab-case from the topic, ASCII-only, ≤60 chars
  (e.g. `cloudflare-d1-vs-neon-2026`).
- Timestamp: `YYYYMMDD-HHMM` in local time.
- Output path: `/tmp/claude-research/<slug>-<timestamp>.html`.
- Create the directory if missing: `mkdir -p /tmp/claude-research`.

### 3. Dispatch 4–6 parallel research subagents

Spawn **all subagents in a single message** so they run concurrently. Use
`subagent_type: "general-purpose"`. Each subagent must have WebSearch and
WebFetch available; if `general-purpose` doesn't, use the agent type that
does.

Default angle set (adjust to fit the topic — drop or rename angles that
don't apply, but keep at least 4):

1. **Overview & definitions** — what is this, who made it, when, what
   problem does it solve. Authoritative / canonical sources (official
   docs, Wikipedia, primary documentation).
2. **Technical detail / mechanics** — how it works under the hood,
   architecture, key invariants, internals.
3. **Comparisons & alternatives** — what competing options exist, where
   each shines, head-to-head trade-offs. Multiple independent sources.
4. **Criticism / known issues / failure modes** — what people complain
   about, post-mortems, security advisories, lawsuits, deprecations.
   Do not soft-pedal — surface real dissent.
5. **Recent news / state in the last 6 months** — what changed lately,
   roadmap signals, funding/acquisitions, version releases. Bias toward
   primary announcements over rehashes.
6. **Adoption / case studies / primary use** — who actually uses this
   in production, public case studies, prominent examples.

For people/biographical topics, swap angles 2 and 6 for "career arc /
notable work" and "current activities / affiliations". For products being
evaluated, swap angle 6 for "pricing & licensing reality (including
gotchas)".

**Brief each subagent like a colleague:** topic, the specific angle, the
expected source mix, an instruction to capture **direct quotes with URLs**
for anything load-bearing, and a cap of ~15 findings. Tell them to flag
contradictions between sources rather than silently picking one.

**Tool budget per subagent**: 5–10 WebSearch/WebFetch calls for most angles;
up to 12–15 for "Comparisons & alternatives" since it spans multiple
products. Tell each subagent to stop early when they have solid findings —
endless searching past good-enough produces low-signal noise, not depth.

Each subagent must return findings in this schema:

```
- <claim or finding in one sentence>
  Source: <URL>
  Quote (if load-bearing): "<direct quote>"
  Confidence: high | medium | low
  Date: <publication date or "unknown">
```

Plus a short "open questions" list at the end with anything the angle
couldn't resolve.

### 4. Synthesize

While subagents run, sketch the report outline. Once findings return:

- **Deduplicate** facts that multiple angles surfaced — keep the source
  with the strongest provenance.
- **Highlight contradictions** explicitly in the report (`## Disagreements
  in the sources`) rather than picking a side silently.
- **Preserve dissent**: a finding raised by only one subagent — especially
  a criticism or failure mode — is not automatically weak. Keep
  single-source claims with explicit attribution and a confidence marker
  rather than dropping them in dedup.
- **Demote low-confidence claims** to a "tentative" subsection or drop
  them.
- **Build the citation list** as you go — every load-bearing claim gets a
  footnote linking to the source URL.

Report outline:

1. Executive summary (≤200 words, scannable)
2. Background / what this is
3. How it works / key facts (the meat)
4. Comparisons & alternatives (if applicable)
5. Criticism, risks, known issues
6. Recent developments
7. Disagreements in the sources (only if there are real ones)
8. Open questions / what wasn't answered
9. Sources (numbered, with title + URL + access date)

### 5. Write the HTML

One self-contained file. No external CSS, no external JS, no CDN fonts
(use system stacks). Inline CSS in a single `<style>` block at the top of
`<head>`. Use this skeleton (substitute the topic, body, and sources):

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TOPIC}} — research report</title>
<style>
  :root {
    --bg: #0f1115;
    --bg-elev: #161922;
    --fg: #e6e6e6;
    --fg-dim: #a3a8b3;
    --accent: #8ab4f8;
    --rule: #2a2f3a;
    --quote-bar: #3a4252;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
  body {
    font: 17px/1.7 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI",
          Roboto, Helvetica, Arial, sans-serif;
    max-width: 760px;
    margin: 0 auto;
    padding: 56px 24px 96px;
  }
  h1 { font-size: 2rem; line-height: 1.25; margin: 0 0 .25em; letter-spacing: -.01em; }
  h2 { font-size: 1.35rem; margin-top: 2.4em; border-bottom: 1px solid var(--rule); padding-bottom: .3em; }
  h3 { font-size: 1.1rem; margin-top: 1.8em; }
  p, li { color: var(--fg); }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
  a:hover { border-bottom-style: solid; }
  code { background: var(--bg-elev); padding: 1px 6px; border-radius: 4px; font-size: .92em; }
  pre { background: var(--bg-elev); padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  blockquote {
    margin: 1em 0; padding: .2em 1em;
    border-left: 3px solid var(--quote-bar);
    color: var(--fg-dim);
  }
  hr { border: 0; border-top: 1px solid var(--rule); margin: 2.4em 0; }
  .meta { color: var(--fg-dim); font-size: .9rem; margin-bottom: 2.4em; }
  .summary { background: var(--bg-elev); border-radius: 8px; padding: 18px 22px; margin: 1.6em 0 2.4em; }
  .summary h2 { margin-top: 0; border: 0; padding: 0; font-size: 1.05rem; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-dim); }
  .sources { font-size: .92rem; }
  .sources ol { padding-left: 1.4em; }
  .sources li { margin-bottom: .6em; }
  .footnote-ref { font-size: .8em; vertical-align: super; text-decoration: none; }
  @media print {
    body { background: #fff; color: #000; max-width: 100%; }
    a { color: #000; border-bottom: none; }
    .summary { background: #f4f4f4; }
  }
</style>
</head>
<body>
  <h1>{{TOPIC}}</h1>
  <div class="meta">Generated {{ISO_DATE}} · {{N_SOURCES}} sources · Research depth: wide (6 angles)</div>
  <div class="summary">
    <h2>Executive summary</h2>
    <p>{{200_WORD_SUMMARY}}</p>
  </div>

  <!-- ...body sections (h2 per outline item)... -->

  <hr>
  <section class="sources">
    <h2>Sources</h2>
    <ol>
      <li id="s1"><a href="{{URL}}">{{TITLE}}</a> — {{PUBLISHER}}, {{DATE}}. Accessed {{ISO_DATE}}.</li>
      <!-- ... -->
    </ol>
  </section>
</body>
</html>
```

Citation convention: in body prose, use `<a href="#s7" class="footnote-ref">[7]</a>`
referencing entries in the Sources `<ol>`. Every load-bearing claim gets at
least one citation. Direct quotes go in `<blockquote>` followed by the
citation marker.

Write the file with the Write tool. Don't run a templating tool — just
build the HTML string in Claude and write it once.

### 6. Open the file

On macOS, run `open "/tmp/claude-research/<slug>-<timestamp>.html"`.

If the user is on Linux, use `xdg-open` (detect via `uname -s` if you
haven't already in step 2). If on Windows-via-WSL, use `wslview` or
`explorer.exe`. If detection fails, just print the absolute path and tell
the user to open it.

### 7. Report

End with two short lines:

```
Wrote /tmp/claude-research/<slug>-<timestamp>.html (<N> sources)
Opened in browser.
```

Plus one sentence on a notable finding or surprising result the user
should look at — this earns the read.

## What NOT to do

- Don't invent URLs. Every citation must trace back to a real
  WebSearch/WebFetch result from this session. If a claim can't be
  sourced, drop it or mark it explicitly as inferred.
- Don't pad with filler. A 3000-word report with thin content is worse
  than a 1200-word one with cited substance.
- Don't soft-pedal criticism. If sources are negative, the report is
  negative — neutrality is not the same as fairness to sources.
- Don't write multiple files. One HTML report, one open command.
- Don't depend on external assets (CDN fonts, remote CSS, images you'd
  hot-link). The file must render correctly offline.
- Don't auto-include screenshots or images fetched from the web —
  copyright and broken-link risk. Text + links only.
- Don't save to the project directory or `~/Documents/`. Output path is
  fixed to `/tmp/claude-research/` so files are clearly ephemeral.
- Don't run the research in series when subagents can parallelize. The
  whole point of the wide fan-out is concurrency.

## Calling conventions

- Argument is the **topic** — free-form text after the trigger phrase or
  slash command. Everything after `/deep-research` is the topic.
- If no topic is given, ask once: "What should I research?" and stop.
- Optional inline flags inside the topic string:
  - `--shallow` — drop to 2–3 angles (use the `quick` variant of the
    workflow: overview + comparisons + recent news only)
  - `--no-open` — write the file but skip the `open` step (print the
    path instead)
  - `--lang=<code>` — write the report prose in that language (default:
    user's input language)

These flags are stripped from the topic before slug generation.
