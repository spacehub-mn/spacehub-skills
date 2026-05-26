---
name: price-estimate
description: Researches pricing for a product, service, or SaaS idea — fans out parallel subagents to study competitor pricing, cost structures, and market positioning, then synthesizes a pessimistic (conservative) price estimate into a standalone dark-themed HTML report with competitive landscape, cost breakdown, and recommended price range. Writes to `/tmp/claude-research/` and opens in the default browser. Use when the user asks to "estimate pricing for X", "how much should I charge for X", "price check X", "what should X cost", or invokes `/price-estimate <product>`. The topic is the rest of the user message after the trigger phrase.
---

# Price estimate

Researches the competitive pricing landscape for a product, service, or SaaS
idea and produces a self-contained HTML report with a **conservative price
estimate**, competitive analysis, and recommended positioning.

The output is **one HTML file**, dark-themed, with inline CSS and footnote
citations, written under `/tmp/claude-research/` and opened with `open`.

## Core philosophy: pessimistic bias

This skill is deliberately pessimistic — it protects the user from
underpricing risks and overestimating revenue:

- **Costs round UP**: $0.99 → $1.00; $9.70/mo infra → $10/mo. Always
  ceiling to the nearest clean number.
- **Revenue projections round DOWN**: if a comparable charges $49–$79, our
  estimate anchors closer to $49 than $79 until the user has differentiation
  to justify the premium.
- **Hidden costs get surfaced**: payment processing fees, support burden,
  infrastructure scaling, compliance costs — if competitors eat these silently,
  call them out so the user prices them in.
- **Free tiers are treated as costs**, not features — estimate the support
  and infrastructure load of free users and factor that into the paid-tier
  price.
- **"Market rate" is a floor, not a target** — the estimate should land at or
  slightly above the median competitor price, not below it, unless the user's
  product is explicitly a budget alternative.

When in doubt, round against the user's optimism. It is better to launch
at a price you can discount than one you need to raise.

## Language

Respond to the user in their input language for chat-side updates and inside
the HTML report's prose. Currency and number formatting follow the market
the user is targeting (inferred from context or defaulting to USD). Structural
markers (file paths, section headings) stay in English unless the user
explicitly asks otherwise.

## Workflow

Follow these steps in order. Use parallel tool calls wherever steps are
independent.

### 1. Frame the pricing brief

Restate what the user wants to price in one sentence, then derive:

- **Product/service**: what is being sold
- **Model**: SaaS subscription / one-time purchase / usage-based / freemium /
  marketplace / API / physical product / service retainer — inferred from the
  description
- **Target market**: B2B / B2C / prosumer / enterprise — inferred from
  context (CLAUDE.md, conversation, product description)
- **Geography/currency**: which market, which currency (default: USD)
- **Stage**: pre-launch idea / existing product needing repricing / competitor
  analysis for positioning
- **Known constraints**: anything the user mentioned (must be under $X, must
  have a free tier, must beat competitor Y on price)

Surface the brief in 3–4 lines. Don't wait for confirmation — proceed.

### 2. Pick the slug and output path

- Slug: kebab-case from the product name, ASCII-only, ≤60 chars, prefixed
  `price-` (e.g. `price-saas-database-hosting-2026`).
- Timestamp: `YYYYMMDD-HHMM` in local time.
- Output path: `/tmp/claude-research/<slug>-<timestamp>.html`.
- Create the directory if missing: `mkdir -p /tmp/claude-research`.

### 3. Dispatch parallel research subagents

Spawn **all subagents in a single message** so they run concurrently. Use
`subagent_type: "general-purpose"` (must have WebSearch + WebFetch).

Default angle set — adapt to fit the product type, but keep at least 4:

1. **Direct competitors & their pricing** — find 5–12 products/services
   that compete directly. For each, capture: product name, pricing page URL,
   tier names, tier prices, what's included at each tier, any usage limits,
   free tier details, enterprise/custom pricing signals. Prefer primary
   sources (pricing pages) over blog roundups. If a competitor hides pricing,
   note that explicitly — hidden pricing usually means high-touch sales and
   $X,000+/mo positioning.

2. **Adjacent / indirect competitors** — products in adjacent categories that
   a buyer might consider instead (e.g. for a SaaS database: self-hosting,
   managed Postgres providers, serverless options). Capture the same pricing
   details. This angle exists to catch substitutes the user might not have
   considered.

3. **Cost structure research** — what does it actually cost to deliver this
   kind of product? Infrastructure (compute, storage, bandwidth), third-party
   APIs, payment processing (Stripe ~2.9%+30¢), support staffing, compliance
   (SOC2, GDPR), domain-specific costs. Find real numbers: cloud pricing
   calculators, published case studies on infrastructure costs, public
   postmortems on scaling costs. Apply pessimistic rounding to all numbers.

4. **Market sizing & willingness-to-pay signals** — what do people say they'd
   pay? Sources: surveys, pricing experiments reported in blog posts, Reddit
   /HN threads complaining about pricing (both "too expensive" and "suspiciously
   cheap" signals), SaaS benchmarking reports (OpenView, KeyBanc, Paddle).
   Capture direct quotes with URLs.

5. **Pricing model patterns & psychology** — for this category, what pricing
   models work best? Per-seat, usage-based, flat-rate, hybrid? Anchoring
   strategies, decoy pricing, annual discount norms (typically 15–20% for
   SaaS). Find category-specific advice from pricing consultants, SaaS
   analysts, or founder retrospectives.

6. **Recent pricing changes & market moves** — which competitors changed
   pricing in the last 12 months? Price increases, new free tiers, sunsetting
   of plans, acquisitions that changed pricing dynamics. This surfaces market
   direction and timing signals.

Drop angles that don't apply (e.g. drop angle 6 for a novel category with no
competitors; drop angle 3 for a consulting service where costs are mainly
labor). But keep at least 4 angles.

**Brief each subagent** like a colleague: the product description, the
specific angle, expected source mix, instruction to capture **pricing numbers
with URLs** for anything load-bearing, and a cap of ~15 findings. Tell them
to flag contradictions between sources.

**Tool budget per subagent**: 5–10 WebSearch/WebFetch calls for most angles;
up to 12–15 for "Direct competitors" since it needs to visit multiple pricing
pages. Stop early when findings are solid.

Each subagent returns findings in this schema:

```
- <finding in one sentence>
  Source: <URL>
  Product/authority: <name>
  Price point (if applicable): <amount, per unit, per period>
  Quote (if load-bearing): "<direct quote>"
  Confidence: high | medium | low
  Date: <publication date or "unknown">
```

Plus a short "open questions" list at the end.

### 4. Synthesize the competitive landscape

Once findings return:

- **Build the competitor table**: for each competitor, normalize pricing to
  comparable units (monthly, per-seat, per-GB, etc.). Always show the
  pessimistic comparison — if our product's unit costs are higher per unit
  than a competitor's advertised price, call it out.
- **Identify the pricing band**: what's the lowest real competitor price
  (floor) and the highest (ceiling) for comparable value? Where does the
  median sit?
- **Apply pessimistic bias to the recommendation**:
  - Anchor the suggested price at or slightly above the median, not the top
  - Add a cost buffer: take the estimated cost-to-serve per user and add
    20–30% margin safety net on top of the target gross margin
  - Round all suggested prices to clean, psychologically sound numbers
    ($9 → $10, $24 → $25, $49 stays $49, $99 stays $99)
  - If the user's product has no clear differentiation yet, recommend pricing
    at the 40th–50th percentile of competitors, not above
- **Surface the "hidden tax"**: payment processing, chargebacks, support
  cost per customer, free-tier subsidization. Estimate these as a
  percentage of revenue and show them explicitly.
- **Flag pricing risks**: races to the bottom, commoditization signals,
  enterprise pricing opacity, value metric mismatches.

### 5. Build the price recommendation

Produce a clear recommendation with:

- **Recommended price range**: floor–ceiling with a "start here" point
- **Suggested tiers** (if applicable): what to include at each tier, with
  price per tier
- **Annual discount**: what percentage, benchmarked against category norms
- **Free tier guidance**: yes/no, what to include, projected cost-to-serve
  per free user
- **Price positioning statement**: one sentence on where this price sits
  relative to the competitive landscape and why

### 6. Write the HTML report

One self-contained file. No external CSS, no external JS, no CDN fonts.
Inline CSS in a single `<style>` block in `<head>`. Use this skeleton:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{PRODUCT}} — price estimate</title>
<style>
  :root {
    --bg: #0f1115;
    --bg-elev: #161922;
    --bg-elev-2: #1d2230;
    --fg: #e6e6e6;
    --fg-dim: #a3a8b3;
    --accent: #8ab4f8;
    --good: #7ed3a4;
    --warn: #f0c866;
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
  p, li { color: var(--fg); }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
  a:hover { border-bottom-style: solid; }
  code { background: var(--bg-elev); padding: 1px 6px; border-radius: 4px; font-size: .92em; }
  blockquote {
    margin: 1em 0; padding: .2em 1em;
    border-left: 3px solid #3a4252;
    color: var(--fg-dim);
  }
  hr { border: 0; border-top: 1px solid var(--rule); margin: 2.4em 0; }
  .meta { color: var(--fg-dim); font-size: .9rem; margin-bottom: 2em; }
  .brief, .summary { background: var(--bg-elev); border-radius: 8px; padding: 16px 22px; margin: 1.4em 0 2em; }
  .brief h2, .summary h2 { margin-top: 0; border: 0; padding: 0; font-size: .95rem; text-transform: uppercase; letter-spacing: .08em; color: var(--fg-dim); }
  .recommendation {
    background: var(--bg-elev-2);
    border: 2px solid var(--accent);
    border-radius: 10px;
    padding: 22px 26px;
    margin: 2em 0;
  }
  .recommendation h2 { margin-top: 0; border: 0; padding: 0; color: var(--accent); }
  .price-big {
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -.02em;
    margin: .2em 0;
  }
  .price-range { font-size: 1rem; color: var(--fg-dim); }
  .tier-card {
    background: var(--bg-elev);
    border-radius: 8px;
    padding: 16px 20px;
    margin: 10px 0;
  }
  .tier-card h4 { margin: 0 0 .4em; }
  .tier-card .tier-price { font-size: 1.4rem; font-weight: 700; color: var(--accent); }
  table.competitors { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: .9rem; }
  table.competitors th, table.competitors td {
    border-bottom: 1px solid var(--rule);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  table.competitors th { color: var(--fg-dim); font-weight: 600; white-space: nowrap; }
  table.competitors td:nth-child(2) { font-weight: 600; color: var(--accent); }
  .cost-bar {
    display: flex; align-items: center; gap: 8px; margin: 4px 0;
  }
  .cost-bar .bar {
    height: 10px; border-radius: 5px; background: var(--accent);
  }
  .cost-bar .label { font-size: .85rem; color: var(--fg-dim); white-space: nowrap; }
  .risk { background: var(--bg-elev); border-radius: 8px; padding: 12px 16px; margin: 8px 0; }
  .risk .severity { font-weight: 600; }
  .risk .severity.high { color: var(--bad); }
  .risk .severity.medium { color: var(--warn); }
  .risk .severity.low { color: var(--good); }
  .hidden-tax { background: var(--bg-elev); border-radius: 8px; padding: 14px 18px; margin: 12px 0; }
  .hidden-tax h4 { margin: 0 0 .4em; color: var(--warn); }
  .sources { font-size: .92rem; }
  .sources ol { padding-left: 1.4em; }
  .sources li { margin-bottom: .6em; }
  .footnote-ref { font-size: .8em; vertical-align: super; text-decoration: none; }
  @media (max-width: 640px) { body { padding: 24px 14px 64px; } }
  @media print {
    body { background: #fff; color: #000; max-width: 100%; }
    a { color: #000; border-bottom: none; }
    .brief, .summary, .tier-card, .risk, .hidden-tax { background: #f5f5f5; }
    .recommendation { border-color: #333; }
    .price-big, .tier-card .tier-price { color: #000; }
  }
</style>
</head>
<body>
  <h1>{{PRODUCT}} — Price Estimate</h1>
  <div class="meta">Generated {{ISO_DATE}} · {{N_COMPETITORS}} competitors analyzed · {{N_SOURCES}} sources · Bias: pessimistic</div>

  <div class="brief">
    <h2>Pricing brief</h2>
    <p>{{BRIEF_PROSE}}</p>
  </div>

  <div class="recommendation">
    <h2>Recommended price</h2>
    <div class="price-big">{{START_HERE_PRICE}}</div>
    <div class="price-range">Range: {{FLOOR}} – {{CEILING}} · Start at {{START_HERE_PRICE}}</div>
    <p>{{POSITIONING_STATEMENT}}</p>
  </div>

  <div class="summary">
    <h2>Executive summary</h2>
    <p>{{SUMMARY — ≤250 words, pessimistic lens}}</p>
  </div>

  <h2>Competitive landscape</h2>
  <table class="competitors">
    <thead>
      <tr><th>Product</th><th>Price</th><th>Model</th><th>Free tier</th><th>Notes</th></tr>
    </thead>
    <tbody>
      <!-- one row per competitor, sorted by price ascending -->
    </tbody>
  </table>

  <h2>Adjacent alternatives</h2>
  <p>{{Substitutes the buyer might consider instead}}</p>
  <table class="competitors">
    <!-- same format, for indirect competitors -->
  </table>

  <h2>Cost structure</h2>
  <p>Estimated cost to serve one customer per month (pessimistic):</p>
  <!-- cost-bar items for each cost component -->
  <div class="cost-bar">
    <span class="label">{{COMPONENT}}: {{AMOUNT}}</span>
    <div class="bar" style="width: {{PERCENT}}%"></div>
  </div>
  <p><strong>Total estimated cost per customer:</strong> {{TOTAL}}/mo<br>
  <strong>Recommended minimum price for healthy margin (≥70% gross):</strong> {{MIN_PRICE}}</p>

  <div class="hidden-tax">
    <h4>The hidden tax</h4>
    <ul>
      <li>Payment processing: ~{{X}}% of revenue</li>
      <li>Support burden: ~{{Y}} per customer per month</li>
      <li>Free-tier subsidy: ~{{Z}} per free user per month</li>
      <!-- more items as applicable -->
    </ul>
    <p><strong>Effective margin after hidden costs:</strong> {{EFFECTIVE_MARGIN}}%</p>
  </div>

  <h2>Suggested tiers</h2>
  <!-- repeat per tier -->
  <div class="tier-card">
    <h4>{{TIER_NAME}}</h4>
    <div class="tier-price">{{PRICE}}/mo</div>
    <ul><li>{{feature}}</li></ul>
  </div>

  <h2>Pricing risks</h2>
  <!-- repeat per risk -->
  <div class="risk">
    <span class="severity {{LEVEL}}">{{LEVEL}}</span> — {{RISK_DESCRIPTION}}
  </div>

  <h2>Willingness-to-pay signals</h2>
  <p>{{What the market says about pricing in this category}}</p>

  <h2>Market moves (last 12 months)</h2>
  <ul>
    <li>{{Competitor changed pricing — what, when, why}}<a class="footnote-ref" href="#sN">[N]</a></li>
  </ul>

  <hr>
  <section class="sources">
    <h2>Sources</h2>
    <ol>
      <li id="s1"><a href="{{URL}}">{{TITLE}}</a> — {{PUBLISHER}}, {{DATE}}. Accessed {{ISO_DATE}}.</li>
    </ol>
  </section>
</body>
</html>
```

Citation convention: in body prose, use `<a href="#sN" class="footnote-ref">[N]</a>`
referencing entries in the Sources `<ol>`. Every pricing claim and cost
figure gets at least one citation.

Write the file with the Write tool. Build the HTML string directly — no
shell templating.

### 7. Open the file

On macOS: `open "/tmp/claude-research/<slug>-<timestamp>.html"`.
On Linux: `xdg-open`. On WSL: `wslview` or `explorer.exe`. If detection
fails or the user passed `--no-open`, print the path.

### 8. Report

End with:

```
Wrote /tmp/claude-research/<slug>-<timestamp>.html
({{N_COMPETITORS}} competitors · {{N_SOURCES}} sources). Opened in browser.
```

Plus one sentence on the most surprising pricing finding — this earns the
read.

## What NOT to do

- Don't invent competitor pricing. Every number must trace to a real
  WebSearch/WebFetch result from this session. If you can't verify a price,
  mark it as "unverified / last known" with the date.
- Don't be optimistic. The user can always discount from a conservative
  estimate — they can't easily raise a price they've already published.
- Don't recommend pricing below the estimated cost-to-serve. If the math
  doesn't work, say so explicitly.
- Don't ignore the free tier cost. A free tier with 10,000 users and $0.02
  per user/month infra cost is $200/month that paid users must subsidize.
- Don't present a single price as "the answer". Always give a range with a
  recommended starting point and the reasoning behind it.
- Don't pad the competitor table with irrelevant products. Only include
  competitors a real buyer would compare against.
- Don't soft-pedal pricing risks. If the market is commoditizing or a
  major player offers it free, say so plainly.
- Don't write multiple files. One HTML report, one open command.
- Don't depend on external assets. The file must render correctly offline.
- Don't save to the project directory. Output path is `/tmp/claude-research/`.
- Don't run subagents serially when they can parallelize.

## Calling conventions

- Trigger phrases: `/price-estimate <product>`, or free-text like "how much
  should I charge for X", "estimate pricing for X", "price check X",
  "what should X cost", "pricing analysis for X".
- Argument is the **product/service description** — free-form text after the
  trigger phrase.
- If no product is given, ask once: "What product or service should I
  estimate pricing for?" and stop.
- Optional inline flags:
  - `--currency=<code>` — force a currency (default: USD)
  - `--model=<type>` — force a pricing model (subscription, usage, one-time,
    freemium)
  - `--no-open` — write the file but skip opening
  - `--lang=<code>` — write report prose in that language (default: user's
    input language)

Strip flags from the product description before slug generation.
