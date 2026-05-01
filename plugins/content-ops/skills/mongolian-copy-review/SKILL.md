---
name: mongolian-copy-review
description: Use this skill when reviewing Mongolian-language marketing copy, UI strings, or social posts for tone, register, and house style. The Spacehub house style is lowercase casual — no formal honorifics, no all-caps headlines, no overly literal English-to-Mongolian translation. Trigger phrases include "review mongolian copy", "монгол текст", "this copy okay?", "Mongolian tone check".
when_to_use: User pastes Mongolian text and asks for review or rewrite; user is editing Mongolian UI strings or marketing copy; user asks whether a translation reads naturally.
---

# Mongolian Copy Review

## When to use this skill

- Reviewing Mongolian marketing copy, social posts, or UI strings against house style.
- Catching unnatural English-to-Mongolian translations (calques, literal phrasing).
- Flagging tone mismatches: too formal, too aggressive, or off-brand.

## Instructions

1. **Read the original first**, identify intent (informational, promotional, alert, error message). Tone follows intent.
2. **House style checks**:
   - Lowercase by default. No SHOUTY headlines.
   - Casual register — avoid `Та` honorific in product UI unless the surface is explicitly formal (legal, billing receipts).
   - Prefer native Mongolian phrasing over loan words when both exist and the native term is widely understood.
   - Numbers and units follow Mongolian conventions; keep `₮` after the amount (e.g., `12,000₮`).
3. **Translation smell tests**:
   - Word-for-word from English usually reads stilted. Rewrite for the idea, not the words.
   - English idioms ("at the end of the day", "low-hanging fruit") should not be literally translated.
   - Verb-final word order is correct Mongolian; English-style SVO sentences are a red flag.
4. **Output**: present (a) issues found with location, (b) suggested rewrite, (c) reasoning. Keep reasoning brief.
5. **The maintainer supplies the actual Mongolian rewrites.** This skill identifies issues and shapes; do not generate replacement Mongolian text from scratch unless the user explicitly asks for it and acknowledges the model may produce unnatural phrasing.

## Examples

**Trigger:** User pastes a button label "Бүртгүүлэх Одоо!" and asks "is this okay?"
**Response shape:** Flag the capital letters and exclamation as off-style for casual UI; flag word order; suggest the maintainer try lowercase variants.

## Notes

- This skill is a reviewer, not a translator. For full translation work, the user should engage a human reviewer.
- Domain-specific terminology (fintech, medtech) often has no settled Mongolian standard — flag when the term is borderline rather than picking a side.

<!-- TODO: Maintainer to supply approved terminology glossary. -->
