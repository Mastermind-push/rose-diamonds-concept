# ROSÉ Diamonds — Homepage Concept & Design System

Version 1.0 · 26 August 2026

## 1. Creative direction

### Concept: Rosé Prism

The visual metaphor is not “everything in pink”. A diamond catches one beam of light and releases a spectrum. Rosé turns that spectrum into mood, energy and personal expression.

**Design thesis:** Quiet frame. Vivid soul.

The interface must feel exact, calm and expensive. Colour appears in controlled, emotionally intense chapters: the hero, Rosé Dopamine, Shop by Mood, diamond-text headlines and campaign transitions.

Recommended brand language:

- Brilliance, in every mood.
- Diamonds with a pulse.
- Born in Hong Kong. Made to be noticed.
- Fine jewellery for your brightest self.

Primary hero message:

> BORN IN HONG KONG · FINE DIAMONDS & COLOUR  
> Brilliance, in every mood.  
> Natural and lab-grown diamonds in 18K gold, made for women who never blend in.

Primary CTA: **Discover Rosé Dopamine**  
Secondary CTA: **Shop rings**

## 2. Brand principles

1. **Product before decoration.** Colour frames the jewellery; it never competes with the stone.
2. **One emotional peak per viewport.** A strong image, headline or interaction—never all at once.
3. **Contrast creates value.** Porcelain, ink and negative space make vivid colour feel intentional.
4. **Mobile is the primary composition.** Mobile photography, copy breaks and interactions are designed independently.
5. **Real product fidelity.** AI may create scenes and atmospheres, but final jewellery must use photography, accurate 3D or compositing.
6. **Luxury is rhythm.** Large pauses, precise typography and slow controlled motion matter as much as colour.

## 3. Production stack

### Core

- React 19 with TypeScript.
- Next-compatible Vinext application structure for fast rendering and Cloudflare deployment.
- Server-rendered initial HTML with client-side interaction only where required.
- Native CSS design tokens for art direction rather than a utility-only styling layer.

### Colour system

- OKLCH is the authoring space for UI tokens, gradients and lightness relationships.
- `color-mix(in oklch, …)` is used for translucent surfaces and derived states.
- A conventional sRGB fallback must precede critical OKLCH declarations when supporting older embedded browsers.
- Display-P3 may be introduced for campaign accents under `@supports (color: color(display-p3 1 0 0))` after device QA.
- Product photography remains colour-managed. Wide-gamut delivery must never change the perceived stone or metal colour.

OKLCH is valuable because equal changes in lightness or chroma are visually more predictable than raw RGB channel changes. It does not automatically make colours “more premium”; the premium result comes from disciplined contrast, gamut control and art direction.

### Motion

- CSS transforms and opacity for hover, shimmer, header and micro-interactions.
- Intersection Observer for section reveals without a heavy runtime.
- Motion can be added later for shared layout and component transitions.
- GSAP/ScrollTrigger should be reserved for one or two authored campaign sequences, not every section.
- No global scroll hijacking. Native scroll remains intact.
- Every animation has a `prefers-reduced-motion` fallback.

### Media pipeline

- Hero: `<picture>` with separate desktop and mobile art direction.
- AVIF first, WebP fallback, high-quality JPEG only where needed.
- Responsive `srcset` and explicit dimensions to prevent layout shift.
- Below-fold imagery loads lazily.
- Product cards use exact 3:4 masters, recommended 1800 × 2400 px.
- Campaign masters retain a colour profile; exported web variants are tested on iPhone, Android OLED, calibrated desktop and a standard laptop display.

## 4. Colour tokens

| Token | CSS | Role |
|---|---|---|
| Porcelain | `oklch(98.2% 0.008 35)` | Primary page background |
| Paper | `oklch(99.6% 0.003 30)` | Cards, menus, clean contrast |
| Ink | `oklch(18% 0.018 20)` | Primary typography, dark chapters |
| Deep Plum | `oklch(25% 0.065 8)` | Heritage and Hong Kong story |
| Rosé | `oklch(47% 0.17 8)` | Signature action and navigation accent |
| Blush Mist | `oklch(91% 0.045 6)` | Secondary tonal surface only |
| Diamond Silver | `oklch(89% 0.012 240)` | Neutral product light |
| Electric Violet | `oklch(58% 0.24 295)` | Dopamine spectrum |
| Prism Aqua | `oklch(83% 0.14 190)` | Ice/light accent |
| Prism Lime | `oklch(86% 0.17 128)` | High-energy accent |

Recommended page balance:

- 70% neutral space.
- 20% photography.
- 10% saturated colour and prismatic effects.

Do not use the rainbow gradient on ordinary commerce buttons. Primary commerce actions remain Ink, Paper or Deep Rosé.

## 5. Typography

### Production recommendation

- Display: Canela, Editorial New or Ivar Display.
- UI/body: Suisse International, Neue Haas Grotesk or ABC Diatype.

The prototype uses high-quality system serif/sans fallbacks so it remains self-contained. Before launch, licensed fonts should be supplied as local WOFF2 files and preloaded.

### Scale

| Style | Desktop | Mobile | Notes |
|---|---:|---:|---|
| Hero | 68–112 px | 52–66 px | 0.86–0.9 line height |
| Section display | 54–92 px | 48–54 px | Tight tracking, short copy |
| Product title | 18–24 px | 18–20 px | Display serif |
| Body | 14–17 px | 13–16 px | Minimum 1.5 line height |
| Eyebrow | 8–10 px | 8 px | Uppercase, controlled tracking |

Uppercase and wide tracking are used for metadata, never for long paragraphs.

## 6. Diamond-text system

Diamond-text is real live text with `background-clip: text`, not a rasterized headline. This preserves accessibility, responsiveness and sharpness.

Variants:

- **Ice:** silver, blue, aqua and white facets.
- **Rosé:** ruby, pink sapphire and pale blush facets.
- **Emerald:** deep green, mint and white facets.
- **Champagne:** warm gold, cream and amber facets.

Implementation layers:

1. Base conic gradient creates broad faceting.
2. Small radial gradients create controlled highlights.
3. Slow background-position movement creates light travel.
4. A low-opacity drop shadow separates the texture from the page.
5. Solid-colour fallback remains readable if text clipping is unavailable.

Rules:

- Use on no more than three to five important phrases per homepage.
- Minimum recommended size is 48 px on mobile.
- Never animate with fast glitter or random flashing.
- Shimmer duration: 6–10 seconds.
- Keep body copy and product data untextured.

Later, a photographic diamond texture may replace the procedural CSS gradient, but it must remain clipped to live text and include a solid fallback.

## 7. Motion system

### Timing tokens

| Token | Duration | Use |
|---|---:|---|
| Instant | 120–180 ms | Focus, small button state |
| Responsive | 280–360 ms | Hover, drawers, card actions |
| Reveal | 700–1000 ms | Section entrance |
| Scene | 1200–1800 ms | Hero or campaign transitions |
| Ambient | 8–14 s | Prismatic light and diamond texture |

Primary easing: `cubic-bezier(.2,.7,.2,1)`  
Expressive easing: `cubic-bezier(.16,1,.3,1)`

### Choreography

- Header changes from transparent to blurred Paper after scroll.
- Hero aura moves almost imperceptibly; jewellery itself stays stable.
- Section reveals use opacity plus 32–42 px vertical movement.
- Category and product imagery scale by no more than 3–4.5% on hover.
- Product action rises from the bottom of the 3:4 image.
- Mobile product and UGC rails use native swipe with a visible next-card “peek”.
- Shop by Mood changes the entire colour field gradually on hover, focus or tap.
- Hotspots pulse slowly and stop being animated under reduced-motion preferences.

Avoid loaders, spinning diamonds, cursor trails and scroll-jacking.

## 8. Layout and responsive system

### Desktop

- 12-column conceptual grid.
- 40–64 px side margins.
- Content max width: 1600 px.
- Full-bleed campaign chapters escape the grid.
- Section rhythm: 112–160 px.

### Mobile

- Primary reference frame: 390 × 844 px.
- Supported width: 360–430 px.
- 20 px page margins.
- Header: 64 px, reducing to 60 px after scroll.
- Categories: 2 × 2 grid, all images 3:4.
- Product rail: approximately 1.2 cards visible.
- Important CTA remains inside the first viewport.
- No large floating chat bubble. Concierge becomes a small contextual control later.

## 9. Component inventory

- Transparent/sticky header.
- Full-screen accessible menu.
- Hero with separate mobile/desktop image slots.
- Certification ribbon.
- 3:4 category cards.
- Rosé Dopamine campaign chapter.
- 3:4 product rail.
- Shop the Stack hotspots.
- Shop by Mood colour field.
- Design Your Piece teaser.
- Born in Hong Kong story.
- Confidence/education cards.
- UGC rail.
- Private concierge CTA.
- Newsletter and structured footer.

## 10. Homepage sequence

1. Desire — immersive hero.
2. Trust — certification ribbon.
3. Orientation — category grid.
4. Differentiation — Rosé Dopamine.
5. Commerce — new and most wanted.
6. Styling — Shop the Stack.
7. Identity — Shop by Mood.
8. Personalisation — Design Your Piece.
9. Provenance — Born in Hong Kong.
10. Confidence — diamond and craftsmanship education.
11. Social proof — Rosé in the Wild.
12. Human help — private concierge.
13. Retention — newsletter and footer.

## 11. Image production plan

| ID | Slot | Ratio | Recommended master | Status |
|---|---|---:|---:|---|
| H01-D | Hero desktop | 16:10 | 2400 × 1500 | New campaign image |
| H01-M | Hero mobile | 4:5 / 9:16 | 1440 × 1920 | New independent composition |
| D01 | Dopamine chapter | 4:5 | 2000 × 2500 | Current image temporarily used |
| P01–P12 | Product cards | 3:4 | 1800 × 2400 | Exact product photography/3D |
| S01 | Shop the Stack | 4:5 | 2000 × 2500 | New editorial portrait |
| HK01 | Hong Kong story | 16:10 | 2400 × 1500 | New night editorial image |
| U01–U03 | Client/UGC | 4:5 / 9:16 | 1600 × 2000+ | New verified client content |

Current Rose assets are used for the category grid, product examples and the temporary Dopamine chapter. Hero, Shop the Stack, Hong Kong and UGC remain clearly marked placeholders.

## 12. Accessibility and performance acceptance

- Body text meets WCAG AA contrast.
- Keyboard focus is visible on menus, buttons, rails and mood controls.
- Menu has dialog semantics and body scroll locking.
- Motion is reduced when requested by the operating system.
- All product imagery has meaningful alt text.
- Decorative placeholders remain non-essential to understanding the page.
- Target LCP under 2.5 s on a representative mobile connection after final media optimisation.
- No layout shift from image loading.
- Animations use transform and opacity whenever possible and should remain smooth at 60 fps on current mobile devices.

## 13. Prototype status

Implemented in the current homepage prototype:

- Full responsive page structure.
- OKLCH token palette and derived colour mixing.
- Procedural Ice, Rosé, Emerald and Champagne diamond-text variants.
- Transparent-to-blurred sticky header.
- Full-screen responsive menu.
- Scroll reveals, ambient gradients, product hover and mood interaction.
- Exact 3:4 commerce cards and mobile swipe rails.
- Existing Rose images where appropriate.
- Explicitly labelled placeholders for all future campaign imagery.
- Reduced-motion support.

The next visual phase is to replace the labelled slots one family at a time without changing the layout system.
