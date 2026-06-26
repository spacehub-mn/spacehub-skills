# Starting design directions

Offer these as a *starting point* when a project has no `.presentation/theme.css` yet.
Show the user 3–4 named directions, let them pick one and adjust (accent, light/dark,
fonts), then persist the result to `theme.css` + `design.md`. After that, reuse silently.

Each direction is just a set of token overrides for the `:root` block in `theme.css`.
The template supplies sane defaults; a direction only overrides what differs.

## How to present the choice

Ask three quick things, then propose:

1. **Light or dark room?** (projector in a bright room → light; a stage / screen-share → dark)
2. **Accent colour** — brand hex if they have one, else pick from the direction.
3. **Personality** — editorial / corporate-clean / technical / bold-marketing.

Then show the directions below as a short menu. Don't over-ask; one round, then build.

---

## 1. Editorial Light  — calm, serif, lots of air
For thoughtful internal docs, strategy, narrative decks.
```css
:root{
  --bg:#faf9f6; --fg:#1a1916; --muted:#6b6760; --surface:#f0eee8; --border:#e2ddd2;
  --accent:#b5482e; --accent-2:#1a1916; --accent-fg:#faf9f6;
  --font-display:"Iowan Old Style","Palatino Linotype",Georgia,serif;
  --font-sans:-apple-system,"Inter","Segoe UI",sans-serif;
}
```

## 2. Keynote Dark  — the default, high-contrast, confident
Stage talks, demos, screen-shares. Ships as the template default.
```css
:root{
  --bg:#0e1014; --fg:#f4f5f7; --muted:#9aa3b0; --surface:#181b22; --border:#272b34;
  --accent:#7aa2ff; --accent-2:#b388ff; --accent-fg:#0e1014;
}
```

## 3. Mono Brutalist  — flat, monospace, grid-y, technical
Engineering reviews, infra decks, anything that should read as "built, not decorated".
```css
:root{
  --bg:#ffffff; --fg:#0a0a0a; --muted:#666; --surface:#f4f4f4; --border:#0a0a0a;
  --accent:#0a0a0a; --accent-2:#1f6feb; --accent-fg:#ffffff; --radius:0px;
  --font-display:ui-monospace,"JetBrains Mono","SF Mono",monospace;
  --font-sans:ui-monospace,"JetBrains Mono","SF Mono",monospace;
}
/* tip: pair with thicker borders — set --border-width via custom rules in design.md */
```

## 4. Warm Gradient  — soft, marketing, friendly
Pitch decks, launches, customer-facing. The one place a tasteful gradient earns its keep.
```css
:root{
  --bg:#1a1228; --fg:#fbf7ff; --muted:#b9a9d4; --surface:#251a3a; --border:#3a2c55;
  --accent:#ff8a5c; --accent-2:#c86bff; --accent-fg:#1a1228;
}
.slide[data-layout="title"], .slide[data-layout="section"], .slide[data-layout="end"]{
  background:radial-gradient(120% 120% at 80% -10%, color-mix(in srgb,var(--accent) 22%, transparent), transparent 60%),
             radial-gradient(120% 120% at -10% 110%, color-mix(in srgb,var(--accent-2) 22%, transparent), transparent 55%);
}
```

---

## Making it genuinely beautiful (apply regardless of direction)

- **Type scale & restraint.** The template's scale is already large and confident. Resist
  shrinking text to fit more on — cut content instead.
- **One accent, used sparingly.** Accent on kickers, the progress bar, list markers, key
  numbers — not on body text. A second accent is for gradients/section dividers only.
- **Whitespace is the design.** Generous `--pad` (88px) and `--gap`. Don't fill the frame.
- **Real fonts, self-hosted.** System stacks render instantly and travel anywhere. Only
  embed a custom display font (base64 `@font-face` in `theme.css`) when the brand demands
  it — and embed `woff2` only, subset if large, to keep the file shippable to PageDrop.
- **Consistent imagery.** If using photos, keep them tonally consistent (all duotone, or
  all desaturated, or all full-colour) — mixed treatments read as amateur.
- **Contrast check.** Body text on `--bg` should clear WCAG AA. The template assumes it;
  if the user picks a low-contrast accent, warn and nudge.

## What gets persisted

After the user settles on a look, write two files into `.presentation/`:

- **`theme.css`** — the `:root` overrides above plus any custom rules. This is what gets
  inlined into every built deck for the project.
- **`design.md`** — a short human note: the chosen direction & why, the accent hex,
  font choices, any do/don't the user stated ("never use the orange", "logo always
  bottom-left"). Future runs read this first so the project's decks stay coherent.
