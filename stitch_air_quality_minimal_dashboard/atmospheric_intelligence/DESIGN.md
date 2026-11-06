---
name: Atmospheric Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-metric:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.03em
  metric-large:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  card-label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  detail-link:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  badge-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system delivers a calm, ultra-minimal, and clinical telemetry interface for industrial manufacturing environments. Designed specifically for plant managers, health & safety officers, and facility engineers overseeing powder coating and curing lines, the experience replaces industrial clutter with an airy, breathing digital space.

The emotional goal is radical calm under operational scrutiny. Volatile Organic Compounds (VOCs) and particulate thresholds demand immediate awareness without sensory overload. The interface relies on generous whitespace, whisper-soft gradients, precise metrics, and a zero-clutter philosophy. High-stakes safety data is framed with effortless optical clarity, moving operators from anxiety to composed, decisive control.

## Colors

The palette establishes an ultra-clean base with sharp, focused telemetry indicators. 

### Core Surfaces and Neutrals
- **Canvas (`#F8FAFC`)**: A cool, clinical light tint that reduces eye fatigue across 12-hour shifts.
- **Card Surfaces (`#FFFFFF`)**: Pure white resting above the canvas, subtly highlighted with micro-opacity ambient pastel inner gradients (`rgba(37, 99, 235, 0.02)` to `transparent`).
- **Borders (`#E2E8F0`)**: Crisp 1px structural framing preserving card boundaries against the light canvas.
- **Primary Accent (`#2563EB`)**: A vibrant industrial blue reserved for interactive links, primary action triggers, and primary device anchors.
- **Typography Primary (`#0F172A`)**: Deep slate for maximum contrast and instantaneous readability on telemetry figures.
- **Typography Subtle (`#64748B`)**: Neutral slate used exclusively for technical card headers, secondary units, and metadata.

### Strict Telemetry System
The following five telemetry accents represent air quality severity and e-nose detection spectra:
- **Very Good**: `#00C0FF` (Cyan)
- **Good**: `#00CC66` (Emerald)
- **Moderate**: `#FFD100` (Amber Yellow)
- **Unhealthy**: `#FF7E00` (Vibrant Orange)
- **Hazardous**: `#FF0000` (Pure Red)

**Strict Color Governance**: Telemetry colors are **strictly prohibited** from filling large surfaces, modal backgrounds, or card bodies. They must be confined to small indicators: 6px–8px dot badges, outline pills, SVG gauge arcs, and 2px stroke lines on sparkline charts. Cards must always remain pure white to maintain systemic calm.

## Typography

Typography relies entirely on **Inter** to maintain an engineered, objective aesthetic with robust tabular figures.

### Typographic Hierarchy
- **Metric Big Numbers (`display-metric`, `metric-large`)**: Ranging from 44px to 56px in Semi-Bold or Bold, paired with tight negative letter spacing (`-0.02em` to `-0.03em`). Numbers must be configured with `font-feature-settings: 'tnum' on` (tabular numbers) to eliminate layout jitter during live telemetry ingestion.
- **Card Titles & Section Markers (`card-label`)**: 14px, medium weight, rendered in slate-500 (`#64748B`) uppercase with tracking expanded to `+0.05em` to serve as unambiguous, low-contrast section anchors.
- **Body & Action Copy (`body-default`, `detail-link`)**: Body text never dips below 14px to guarantee field legibility on industrial touch monitors and tablets.
- **Links (`detail-link`)**: 14px Medium in primary accent blue (`#2563EB`) accompanied by the literal glyph `" →"`.

## Layout & Spacing

The dashboard operates on a strict spatial hierarchy engineered to prevent cognitive saturation in critical safety situations.

### Shell Architecture
- **Left Sidebar**: Fixed `240px` width running the full height of the viewport. Surface is `#FFFFFF` separated by a 1px border (`#E2E8F0`). Hosts minimal icon-plus-label navigation items with generous internal padding.
- **Top Header Bar**: Fixed `64px` height, spanning the remaining width. Hosts live line location metadata (e.g., "Line 3 — Electrostatic Booth"), real-time gateway status, and quiet notification badges.
- **Main Canvas**: Fluid width over `#F8FAFC` using a consistent `2rem` (32px) margin and `1.5rem` (24px) gutters.

### The 4-Block Screen Constraint
To ensure immediate readability during production:
- **Maximum 4 content blocks per view**: Screens must contain no more than four primary analytical cards or modules concurrently.
- **Card Content Limit**: Every analytical card presents strictly **one** primary metric value, **one** short status or unit label, and fewer than 15 total words per card. Deeper diagnostic logs, historical drift metrics, and calibration curves must be tucked away behind contextual `"View details →"` trigger overlays or slide-outs.

## Elevation & Depth

Visual hierarchy is achieved through soft, low-amplitude ambient diffusion rather than traditional drop shadows. Cards float smoothly over the `#F8FAFC` foundation.

### Shadow Characteristics
- **Resting Metric Card**: `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02);`
- **Interactive Element / Flyout**: `box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03);`

### Border & Background Fusion
Every surface is bound by a structural `1px solid #E2E8F0` hairline border. Interior depth within cards is introduced through very subtle pastel ambient gradients—such as a top-right corner radial glow using `rgba(37, 99, 235, 0.025)` decaying into `#FFFFFF`—imbuing the container with atmospheric volume without distracting from the numerical data.

## Shapes

The design system adopts a large-radius form factor:

- **Cards & Primary Modules**: Fixed `24px` radius (`rounded-3xl`). This curvature softens the harsh industrial data, reinforcing an approachable, modern SaaS presentation.
- **Pills, Badges, and Status Chips**: Fully rounded pill shapes (`9999px` radius) to cleanly frame telemetry numbers and sensor health tags.
- **Interactive Form Inputs and Buttons**: Consistent `12px` to `16px` radius (`rounded-xl` to `rounded-2xl`), matching the softness of the parent container cards.

## Components

### 1. Telemetry Metric Cards
- **Geometry**: White card (`#FFFFFF`), `24px` border radius, `1px solid #E2E8F0`, padded with `1.5rem` to `2rem`.
- **Content Hierarchy**:
  1. Header: 14px uppercase slate-500 (`#64748B`) metric title with optional telemetry dot.
  2. Main Metric: 44px–56px bold tabular figures in `#0F172A`.
  3. Context / Trend: Micro sparkline stroke (2px) or clean unit label (e.g., "ppm", "ppb", "VOC Index").
  4. Footer: Clean text action `"View details →"` in `#2563EB` aligned to the bottom.
- **Strict Limitation**: Paragraphs, explanatory tooltips on display, or multi-metric stacking within a single card are strictly prohibited. Total word count must not exceed 15 words.

### 2. Status Pills and Badges
- **Dimensions**: 24px height, fully rounded pill (`9999px`).
- **Styling**: `1px solid currentColor` with an ultra-light tint background (`rgba(color, 0.08)`).
- **Indicator**: Contains a 6px solid circular pip featuring the active air status color (Very Good through Hazardous) paired with 12px Semi-Bold text.

### 3. Telemetry Table
- **Strict Constraint**: Max 5 visible rows and max 4 columns.
- **Usage**: Dedicated to sensor rack summaries or recent threshold breaches.
- **Structure**: Transparent or `#FFFFFF` background, `0px` vertical borders, hairline horizontal row dividers (`#E2E8F0`). Cell padding is `0.75rem 1rem`. Body text 14px regular; metric values rendered in tabular figures.

### 4. Interactive Navigation & Action Triggers
- **Sidebar Links**: 40px height, 12px radius, `#64748B` text resting; active state uses `#F1F5F9` background with `#2563EB` bold indicator and blue text.
- **Primary Buttons**: Minimal `#2563EB` solid fill, white text, 12px radius, subtle hover lift without heavy dark shadows.
- **Detail Flyout Links**: Transparent, inline-flex items showing blue `#2563EB` hover transitions with a 2px horizontal slide translation on the arrow icon (`→`).

### 5. Sensor Sparkline / Gauge
- **Gauges**: Single semi-circular radial gauge with a 6px track in `#F1F5F9` and active colored arc matching current AQI status.
- **Sparklines**: Ultra-smooth cubic bezier line chart; strictly 2px stroke width colored in the current telemetry status tint, zero background fill, and minimal 1px dotted target line indicators.