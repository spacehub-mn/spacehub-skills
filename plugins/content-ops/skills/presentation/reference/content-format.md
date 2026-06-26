# Content format & slide layouts

The editable source of a deck lives at `.presentation/decks/<slug>/content.md`. It is
the human-editable truth; the built HTML is regenerated from it. Keep it in sync — if
the user asks to tweak a slide, edit `content.md` and rebuild, don't hand-patch the HTML.

## content.md structure

```markdown
---
title: Migrating to Durable Objects
subtitle: A pragmatic path off the cron-and-KV stack
author: Batmend · Spacehub
date: 2026-06-26
theme: keynote-dark          # which .presentation/theme.css variant (informational)
footer: Spacehub · confidential
---

## [title]
# Migrating to Durable Objects
A pragmatic path off the cron-and-KV stack
::: notes
Open with the 2am incident story — that's why we're here.
:::

## [section] 01 — The problem
::: notes
Keep this to 90 seconds.
:::

## [content] Where the current stack hurts
- KV is eventually consistent ~> double-writes {fragment}
- Cron granularity is 1 minute, we need seconds {fragment}
- No per-entity locking ~> race conditions {fragment}

## [metrics]
- 1.2M | requests / day
- 340ms | p99 today
- 0 | locks available

## [quote] > Durable Objects gave us a single-writer per room for free.
— Platform team, after the migration

## [end] Questions?
batmend@spacehub.mn
```

## Rules the builder follows

- The fenced frontmatter (`--- … ---`) sets document `<title>`, the title-slide
  fields, and the page `footer`.
- Each slide starts with `## [layout] optional heading`. The `[layout]` token maps to a
  `data-layout` on the `<section class="slide">`.
- Lines after the marker are the slide body. Markdown → HTML: `-` lists become `<ul>`,
  `> text` becomes a blockquote, `**bold**`/`*italic*`/`` `code` `` inline, fenced code
  blocks become `<pre>`.
- Append `{fragment}` to a bullet or paragraph to make it reveal step-by-step (gets
  `class="fragment"`). Drop it for everything-at-once slides — don't fragment every slide,
  it gets tiring.
- A `::: notes … :::` block (or a trailing `Notes:` paragraph) becomes
  `<aside class="notes">` — shown only in presenter view, never on the slide.
- `metrics` rows use `value | label` per `-` line.
- `image` / `split` layouts reference assets by path: `image: assets/diagram.png`. At
  build time these are inlined as base64 so the final HTML is self-contained.

## Available layouts

| `[layout]` | Use it for | Shape |
|---|---|---|
| `title` | opening slide | big title + subtitle + author/date |
| `section` | divider between parts | index number + section name |
| `content` | the workhorse | kicker + heading + bullets/prose |
| `statement` | one bold idea | a single large left-aligned sentence |
| `two-col` | compare / before-after | heading + two text columns |
| `metrics` | numbers that land | row of big figures + labels |
| `quote` | testimonial / pull-quote | large quote + attribution |
| `image` | full-bleed visual | cover image + optional overlay title |
| `split` | image beside text | half media, half text pane |
| `end` | close / CTA | thank-you + contact/next step |

## Authoring guidance (this is where "beautiful" comes from)

- **One idea per slide.** If a slide has two headings' worth of content, split it.
- **Few words.** Headlines, not paragraphs. Aim ≤ 6 bullets, ≤ ~10 words each. The deck
  supports the speaker; it isn't the script (that's what notes are for).
- **Numbers > adjectives.** Prefer a `metrics` slide over "we got much faster".
- **Rhythm.** Vary layouts — don't ship 12 `content` slides in a row. A `section` or
  `statement` between clusters gives the audience a breath.
- **Front-load.** Title → why-it-matters → the meat → ask. Decide the closing ask first.
- Respect the user's input language for slide copy; keep layout tokens in English.
