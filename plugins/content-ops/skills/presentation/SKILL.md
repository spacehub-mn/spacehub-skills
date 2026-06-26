---
name: presentation
description: >
  Build a really beautiful, self-contained HTML presentation (slide deck) from a topic
  or an existing doc. Use this skill when the user says "make a presentation", "create a
  deck", "make slides", "build a slideshow", "turn this into slides / a deck", "pitch
  deck", "make a presentation about X", or runs "/content-ops:presentation". The output
  is ONE self-contained .html (keyboard + touch nav, presenter view, PDF export, overview
  grid) plus an editable source, saved in a reusable `.presentation/` project folder. The
  project's visual design is decided once (the skill asks), persisted to `.presentation/`,
  and reused for every later deck. Auto-detects whether the user gave finished content
  (designs it) or just a topic (writes it first). Deploys to a shareable link via PageDrop
  on request. Trigger on deck / slides / presentation / slideshow / keynote requests.
---

# Presentation

Turn a topic or a document into a polished, self-contained HTML slide deck, kept in a
reusable `.presentation/` folder so a project's decks stay consistent and re-buildable.

## When to use this skill

- "Make a presentation / deck / slides about X", "build a slideshow", "pitch deck"
- "Turn this doc / README / notes into a presentation"
- "Update slide 4", "add a slide on pricing", "rebuild the deck" (edit `content.md` → rebuild)
- "Deploy / share the deck" → build (if needed) then PageDrop
- `/content-ops:presentation [topic or file]`

If the user wants a Google Slides / PowerPoint / Canva file, this isn't it — this produces
a standalone HTML deck. Say so and offer the HTML.

## What you produce

A `.presentation/` folder at the **project root** (git top-level if in a repo, else cwd):

```
.presentation/
  design.md              # the chosen look + rationale + do/don'ts (human note)
  theme.css              # the project's design tokens — inlined into every deck
  assets/                # source logos, images, fonts (reusable across decks)
  decks/
    <slug>/
      content.md         # editable slide source (the source of truth)
      <slug>.html        # the built, self-contained deck (open / share this)
  README.md              # one-paragraph explainer + how to rebuild
```

The **bundled `assets/template.html`** in this skill is the deck engine (scaled 16:9 stage,
keyboard/touch nav, fragments, progress bar, overview grid `O`, presenter view `S`, PDF
print styles). You fill in the theme + slides; you do **not** hand-write the controls JS.

## Workflow

Read the two reference files in this skill before building:
`reference/content-format.md` (slide source format + layouts) and
`reference/design-directions.md` (starting looks + how to ask).

### 1. Establish or load the project design system

- Resolve the project root (`git rev-parse --show-toplevel` or cwd). Look for
  `.presentation/theme.css` + `design.md`.
- **If they exist:** load them, confirm in one line ("Using this project's existing
  keynote-dark look"), and skip to step 2. Don't re-ask unless the user wants a change.
- **If this is the first deck:** establish the look. Ask the **three** quick questions in
  `reference/design-directions.md` (light/dark, accent, personality), show 3–4 named
  directions, let the user pick + tweak. One round — don't belabour it. Then write
  `.presentation/theme.css` (the `:root` token overrides) and `.presentation/design.md`
  (chosen direction, accent hex, fonts, any stated do/don'ts). Create `assets/` and a
  short `README.md`.
- If the user named a brand or gave a logo/site, derive the palette from it and record
  that in `design.md`.

### 2. Get the content — auto-detect

Decide where the slides come from, don't ask if it's obvious:

- **They gave content** (a file path, pasted outline, a doc/README, "turn this into
  slides") → parse it into slides. Preserve their wording; restructure into one-idea
  slides, pull headlines out, move detail into speaker notes. Don't invent claims.
- **They gave only a topic / brief** ("make a deck about our Q3 roadmap") → write the deck.
  First draft a short outline (title → why → 3–6 beats → ask) and show it in chat in a few
  lines so the user can redirect; proceed without waiting for explicit approval unless they
  asked to review the outline. Then write the slide copy + speaker notes.
- Either way, write the result to `.presentation/decks/<slug>/content.md` using the format
  in `reference/content-format.md`. `<slug>` = kebab-case of the title. This file is the
  source of truth — for later edits, change it and rebuild.

Keep it tight: headlines not paragraphs, vary layouts, numbers over adjectives. The
authoring guidance in `reference/content-format.md` is what makes a deck land.

### 3. Build the self-contained deck

Produce **one** HTML file from the bundled `assets/template.html`:

1. Read `assets/template.html`.
2. Substitute the placeholders:
   - `{{LANG}}` → content language code (e.g. `en`, `mn`).
   - `{{TITLE}}` → deck title.
   - `{{THEME}}` → the **full contents** of `.presentation/theme.css` (inlined — no link).
   - `{{SLIDES}}` → the `<section class="slide" data-layout="…">…</section>` markup
     compiled from `content.md`, including `<aside class="notes">` per slide and
     `class="fragment"` on step-reveal items.
3. **Inline every asset** so the file is self-contained (PageDrop needs a single file,
   and it must render offline): convert images referenced from `assets/` to base64 data
   URIs (`base64 -i path` / `data:image/png;base64,…`). Prefer system font stacks; only
   embed a `woff2` as base64 `@font-face` if the design truly needs a custom display face.
   No CDN links, no external CSS/JS/fonts.
4. Write to `.presentation/decks/<slug>/<slug>.html`.

Self-containment is non-negotiable: if you can't inline an asset, leave it out and note
it rather than hot-linking. Watch total size — base64 inflates ~33%; keep the file well
under PageDrop's 16 MB limit (compress/resize big images first).

### 4. Preview

Open the built file: `open` (macOS) / `xdg-open` (Linux) / `explorer.exe` (WSL). If
detection is unclear, print the absolute path. Tell the user the key controls in one line:
arrows/space to move, **O** overview, **S** presenter view, **F** fullscreen, **Cmd/Ctrl+P**
→ Save as PDF.

### 5. Deploy on request (PageDrop)

Only when the user asks to share/deploy/host it:

- If the **`pagedrop` skill is available**, use it to upload the built HTML and return the
  link. Otherwise POST the file directly to the documented endpoint:
  ```bash
  curl -X POST https://pagedrop.io/api/upload \
    -H "Content-Type: application/json" \
    -d @<(jq -Rs '{html: ., ttl: "3d", fileName: "<slug>.html"}' < .presentation/decks/<slug>/<slug>.html)
  ```
  Send **only** `Content-Type: application/json` (no `Origin`/`Sec-Fetch-*` — those get
  browser-blocked). For sensitive decks add a `password` and a short `ttl` (`1h`/`1d`).
- Report the returned URL (and password, if set). Note it expires per the TTL.

## Editing an existing deck

The HTML is a build artifact — never hand-patch it. Edit
`.presentation/decks/<slug>/content.md` (or `theme.css` for a look change), then redo
step 3 and re-open. A theme edit re-styles every deck in the project on its next build.

## Notes

- **Idempotent.** Re-running rebuilds in place. Re-establishing a design only happens when
  `theme.css` is missing or the user explicitly asks to restyle.
- **Reusable, so commit it.** `.presentation/` is meant to be kept (design + content are
  reusable). Don't add it to `.gitignore` unless asked; if the built `*.html` feels noisy
  in diffs, offer to ignore just `decks/**/*.html` and keep the sources.
- **Language.** Slide copy and notes follow the user's input language; layout tokens and
  file paths stay English unless they ask otherwise.
- **Don't over-design the first run.** Three questions, a pick, build. The look is
  persisted — there's time to refine on the next deck.
- **No invented facts.** When turning a doc into slides, every claim must trace to the
  source. When generating from a topic, flag anything you're unsure of rather than
  asserting it.
- **One deck per invocation.** A request for "a deck on X and also one on Y" is two runs.

## Calling conventions

- Argument is the **topic or a file path** after the trigger / `/content-ops:presentation`.
- No argument → ask once: "What's the deck about, or point me at a doc?" then stop.
- Inline flags (stripped before slug generation):
  - `--from <path>` — force "design this existing content" mode on a file.
  - `--restyle` — re-run the design step even though `theme.css` exists.
  - `--deploy` — build then upload to PageDrop in one go.
  - `--no-open` — write the file but skip opening the browser (print the path).
