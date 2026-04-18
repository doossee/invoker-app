---
name: invoker-design
description: Use this skill to generate well-branded interfaces and assets for Invoker (a Bruno-like API client for the web/desktop), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- Start by reading `README.md` (CONTENT FUNDAMENTALS, VISUAL FOUNDATIONS, ICONOGRAPHY).
- Use `colors_and_type.css` for all tokens — import it directly, don't retype values.
- Grab UI primitives from `ui_kits/invoker-app/*.jsx` — they are cosmetic but pixel-accurate.
- Icons are Lucide; the 16 used in product are inlined in `ui_kits/invoker-app/icons.jsx` (copy from there).
- `src_ref/` is a full read-only copy of the invoker-app repo for deeper lookup.

## Non-negotiables
- One accent color (warm amber `#e6c188`). No gradients, no purple-blue.
- Ghost borders (inset shadow), not hard borders, everywhere except form inputs.
- No drop shadows, no imagery, no emoji.
- Manrope display · Inter body · JetBrains Mono code.
- HTTP methods keep their colors (GET green / POST amber / PUT tan / PATCH peach / DEL coral).
- Copy is dry, terse, dev-to-dev. Title Case buttons; sentence case helper text.
