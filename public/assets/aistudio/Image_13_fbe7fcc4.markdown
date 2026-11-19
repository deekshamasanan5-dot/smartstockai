---
name: SmartStock Precision Inventory
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#313ba4'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a55be'
  on-tertiary-container: '#d7d8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bdc2ff'
  on-tertiary-fixed: '#000767'
  on-tertiary-fixed-variant: '#2f3aa3'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  metric-display:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a high-trust, clarity-driven operational command center tailored for SMB inventory controllers, warehouse leads, and supply chain managers. It rejects decorative excess in favor of a minimalist, high-density corporate aesthetic: high-contrast utility, crisp boundaries, tactile tabular feedback, and focused data architecture.

The emotional signature is poised, reliable, and proactively intelligent. Visual hierarchy prioritizes real-time comprehension over ornamentation. AI-generated forecasting, dynamic restocking signals, and anomaly alerts integrate into standard operational flows using distinct indigo/violet luminescent cues, signaling proactive computational assistance without disrupting standard transactional workflows.

## Colors
The palette balances structural utility against deliberate focal highlights:

- **Canvas & Structural Neutrals**: The global page canvas rests on `#F8FAFC` (Slate 50), providing soft separation from `#FFFFFF` functional surface containers. Structural lines, dividers, and ghost outlines leverage `#E5E7EB` (Gray 200). Foreground typography defaults to `#111827` (Gray 900) for headers and critical data, scaling down to `#4B5563` (Gray 600) for supporting copy and `#6B7280` (Gray 500) for metadata and table headers.
- **Brand & Action**: Primary interactions, active table row selections, and high-priority action targets use Indigo `#4F46E5`, accented by `#4338CA` on hover and `#EEF2FF` for selected states and active item backgrounds.
- **AI & Predictive Capabilities**: Dynamic restocking, inventory prediction, and machine insights use `#818CF8` along with `#EEF2FF` background tints to differentiate automated intelligence from user-generated ledger entries.
- **System Telemetry & Status**:
  - Success / In Stock / Balanced: `#16A34A` text on `#DCFCE7` badge surfaces.
  - Warning / Reorder Point Approaching: `#D97706` / `#F59E0B` text on `#FEF3C7` badge surfaces.
  - Critical / Stockout / Shrinkage Alert: `#DC2626` text on `#FEE2E2` badge surfaces.

## Typography
Inter delivers systematic legibility across tabular datasets, micro-metrics, and nested navigational trees. 

- **Numeric & Financial Uniformity**: Tabular figures (`font-variant-numeric: tabular-nums`) must be enabled across all inventory counts, monetary values (Indian Rupee `₹`), SKUs, and metric summaries.
- **Hierarchy Rules**: KPI values use `metric-display` with bold weight, pairing directly with `label-md` or `label-sm` in uppercase or muted tone for immediate context.
- **Micro-copy & Status**: Data table headers mandate `label-sm` with subtle tracking to avoid fatigue during long audits.

## Layout & Spacing
The layout adheres to a fixed-sidebar, fluid-content model optimized for 1440px desktop resolutions while scaling gracefully to tablets and mobile auditing devices.

- **Grid Architecture**: 
  - Desktop: Collapsible sidebar fixed at 260px (or 64px icon-only), with the remaining width forming a 12-column fluid grid using `1.5rem` gutters and `2rem` outer page margins.
  - Tablet (768px – 1024px): 8-column layout, sidebar transitions to a transient drawer or pinned top header, gutters compressed to `1rem`.
  - Mobile (<768px): Single-column stacking with sticky horizontal control bars, `0.75rem` gutters, and `1rem` margins.
- **Data Spacing**: Dense tabular views standardize on a 40px row height for high-volume auditing or 52px for rich rows incorporating thumbnail previews and predictive AI stock indicators.

## Elevation & Depth
Visual distinction relies on crisp 1px borders combined with low-deflection ambient shadows, avoiding heavy drops or skeuomorphic depth.

- **Base Layer (Surface 0)**: Page viewport tinted `#F8FAFC`.
- **Card Containers (Surface 1)**: Flat `#FFFFFF` bound by a solid `1px` border of `#E5E7EB` and an ultra-subtle ambient shadow: `0 1px 2px 0 rgba(17, 24, 39, 0.05)`.
- **Raised Elements / Popovers (Surface 2)**: Filter dropdowns, context menus, and inline stock adjustments float with `0 4px 6px -1px rgba(17, 24, 39, 0.08), 0 2px 4px -2px rgba(17, 24, 39, 0.04)` surrounded by a `1px` border of `#E5E7EB`.
- **Modals & Slide-outs (Surface 3)**: Overlay workflows (e.g., bulk stock transfer, purchase order builder) cast `0 20px 25px -5px rgba(17, 24, 39, 0.1), 0 8px 10px -6px rgba(17, 24, 39, 0.04)`.
- **AI Elevation Cue**: Containers driven by machine suggestions feature an ambient ring highlight: `0 0 0 1px #818CF8, 0 1px 3px 0 rgba(79, 70, 229, 0.15)`.

## Shapes
A unified roundedness level of 2 (`0.5rem` or 8px) anchors interactive components, establishing a balanced, modern software profile.

- **Inputs, Buttons, and Cards**: Default border-radius of `0.5rem` (8px).
- **Larger Modular Panels**: Canvas sections, modals, and global metric cards scale to `rounded-lg` (`1rem` / 16px).
- **Badges and Status Chips**: Utilize full pill curves (`9999px`) to distinguish categorical indicators from actionable buttons and cards.

## Components

### Buttons
- **Primary**: Solid `#4F46E5` background, `#FFFFFF` text, `0.5rem` radius, bold label. Hover: `#4338CA`. Active: `#3730A3`. Height: 38px (desktop), 44px (mobile).
- **Secondary**: `#FFFFFF` background, `1px solid #E5E7EB`, `#374151` text. Hover: `#F9FAFB` with `#D1D5DB` border.
- **AI Action**: Gradient border or solid `#EEF2FF` fill with `#4F46E5` text, paired with a spark icon indicator.

### Input Fields & Search
- Surface: `#FFFFFF` encased in a `1px solid #D1D5DB` border.
- Focus: Transition to `1px solid #4F46E5` with an outer ring `0 0 0 3px rgba(79, 70, 229, 0.15)`.
- Currency prefix: Persistent `₹` locked inline on the left edge with `#6B7280` coloring.

### Inventory Data Tables
- Header: `#F9FAFB` background, `1px solid #E5E7EB` bottom border, `11px` uppercase medium-contrast text (`#6B7280`).
- Rows: `#FFFFFF` default, alternating with a subtle hover state of `#F8FAFC`. Selected rows shift to `#EEF2FF`.
- Numeric Cells: Aligned right, rendered in monospace or tabular numbers.

### Badges & Inventory Chips
- Construction: Height 24px, pill-shaped radius (`9999px`), horizontal padding `0.625rem`.
- Variants:
  - *In Stock*: Background `#DCFCE7`, text `#16A34A`.
  - *Low Stock*: Background `#FEF3C7`, text `#D97706`.
  - *Out of Stock / Critical*: Background `#FEE2E2`, text `#DC2626`.
  - *AI Recommendation*: Background `#EEF2FF`, text `#4F46E5`, leading sparkle icon.

### Metric Cards
- White `#FFFFFF` card, `1px solid #E5E7EB` border, `1.25rem` internal padding.
- Structure: Subdued top label (`#6B7280`), followed by a large numeric readout (`metric-display` in `#111827`), paired with a trend delta pill (e.g., green `+12.4% vs last month` or red stock burn indicator).

### Reorder Alert Banners
- Surface `#FEF3C7` border-l-4 with `#F59E0B`, displaying an actionable inline reorder CTA linking to vendor order drafting.