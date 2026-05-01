---
name: Cyber-Velocity Gaming
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b23'
  surface-container: '#1d1f28'
  surface-container-high: '#282a32'
  surface-container-highest: '#33343d'
  on-surface: '#e1e1ed'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e1e1ed'
  inverse-on-surface: '#2e3039'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#e9b3ff'
  on-secondary: '#510074'
  secondary-container: '#7d01b1'
  on-secondary-container: '#e5a9ff'
  tertiary: '#ffffff'
  on-tertiary: '#2c303a'
  tertiary-container: '#dfe2ef'
  on-tertiary-container: '#606470'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e9b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#dfe2ef'
  tertiary-fixed-dim: '#c3c6d3'
  on-tertiary-fixed: '#181b25'
  on-tertiary-fixed-variant: '#434751'
  background: '#11131b'
  on-background: '#e1e1ed'
  surface-variant: '#33343d'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for a high-octane, competitive gaming audience. It evokes a sense of technical precision and nocturnal energy, drawing inspiration from high-end gaming hardware and futuristic "cyber" aesthetics. 

The visual style is a fusion of **Glassmorphism** and **High-Contrast Bold**. It utilizes translucent, layered surfaces to create depth, punctuated by intense neon accents that guide the user's eye to primary actions and critical information. The emotional response is one of immersion, speed, and digital mastery.

## Colors
The palette is built on a "Deep Sea Noir" foundation, using a mix of charcoal and navy to provide a richer, more dimensional dark mode than pure black.

- **Primary (Cyber Lime):** A high-frequency green used for primary calls to action, active states, and success indicators.
- **Secondary (Electric Purple):** A vibrant violet used for accent details, rare item states, and secondary interactions.
- **Backgrounds:** The base layer is a deep navy-charcoal (#0A0E17), with surface containers using a slightly lighter neutral (#12141C) to maintain contrast.
- **Accents:** Neon colors should be used sparingly but with high intensity, often accompanied by a soft glow (outer glow) to simulate light emission.

## Typography
This design system utilizes a dual-font strategy to balance character with utility. 

**Space Grotesk** is the voice of the system, used for all headlines and technical labels. Its geometric, slightly eccentric letterforms provide a "tech-forward" and futuristic feel. For body copy, **Inter** provides maximum legibility at all sizes, ensuring that dense gaming stats or community posts remain readable during long sessions. Headlines should often be presented in uppercase or with tight tracking to increase the "high-energy" impact.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop, centered within the viewport to maintain a premium, editorial feel. We use a 12-column grid system. 

The spacing rhythm is based on a 4px base unit, but transitions are aggressive—moving from tight internal padding in cards to wide, expansive margins between sections to create a rhythmic "pulse" in the layout. Use substantial vertical padding (80px+) between major content blocks to allow the neon elements and glass cards room to breathe without visual clutter.

## Elevation & Depth
Depth in this design system is achieved through **Glassmorphism** and light emission rather than traditional shadows.

1.  **The Background:** A deep, dark gradient from Navy to Charcoal.
2.  **Floating Layers:** Cards and panels use a semi-transparent background (approx. 40-60% opacity) with a high-density background blur (20px-40px). 
3.  **The "Inner Light":** Instead of drop shadows, elevated elements use a 1px semi-transparent white or primary-colored border to simulate a "rim light" hitting the edge of a glass pane.
4.  **Neon Bloom:** Active elements (like glowing buttons) utilize a multi-layered box-shadow with the primary color to create a "bloom" effect, suggesting the element is a light source.

## Shapes
The shape language of the design system is **Sharp** and geometric. To reinforce the technical, aggressive gaming aesthetic, we use 0px border-radii for almost all structural elements. 

To add visual interest, incorporate "chamfered" corners (45-degree cuts) on buttons and card headers. Geometric icons should be strictly linear, using 2px stroke weights with sharp joins—no rounded caps or corners allowed.

## Components

- **Glowing Buttons:** Primary buttons are solid Cyber Lime with black text. They feature a persistent 10px outer glow of the same color. On hover, the glow intensity doubles.
- **Glassmorphism Cards:** Use a dark, translucent fill with a "Rim Light" border (top and left edges slightly brighter than bottom and right). Content inside should have ample padding (24px+).
- **Technical Chips:** Small, rectangular tags with a secondary color border and uppercase Space Grotesk text. Used for "Live," "Pro," or "New" status indicators.
- **Input Fields:** Deep charcoal backgrounds with a simple 1px bottom border. The border flashes to the Primary color and glows when the field is focused.
- **Sharp Icons:** Custom geometric icon set. Use "broken" lines where a single stroke doesn't fully connect, emphasizing a blueprint/digital construction look.
- **Progress Bars:** Thin, high-contrast tracks. The filled portion should be a gradient from Secondary to Primary color, ending in a bright vertical "pulse" line.