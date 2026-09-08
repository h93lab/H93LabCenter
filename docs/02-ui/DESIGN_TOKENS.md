# Design Tokens and Visual Rules

## Canonical Rule

Prefer extracting/reusing tokens from the chosen `shadcndashboard/shadcndashboard` version instead of hardcoding a divergent palette. This file defines semantic token intent; implementation should map it to the reference's Tailwind/shadcn CSS variables.

## Typography

- Font family: Cairo.
- Body default: normal/400.
- Interactive labels: medium/500 or semibold where used by reference.
- Page title: follow reference sizing; avoid oversized marketing typography.
- Numerical score: tabular numbers where available to reduce visual jitter.

## Semantic Colors

Use theme CSS variables rather than raw colors in feature code:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `border`
- `input`
- `ring`
- chart tokens from reference.

Add semantic product status tokens only when needed:
- positive/build;
- warning/validate;
- neutral/watch;
- negative/pass;
- critical/killed;
- confidence-high/medium/low.

These must work in both light and dark themes and cannot be the only carrier of meaning.

## Radius / Borders / Elevation

Reuse the reference `--radius` system and border/shadow behavior. Do not create a separate glassmorphism/neumorphism style.

## Spacing

Use Tailwind scale and reference page/card gaps. Avoid arbitrary one-off pixel values except where required for charts or precise device-frame preview.

## Icons

Use the same icon library already adopted by the reference or a single consistent library such as Lucide. Do not mix multiple filled/outlined icon families.

## Tables

- dense but readable;
- sticky header only for long analytical tables;
- right-align numeric columns where beneficial;
- truncate long text with accessible full-value tooltip/sheet;
- highlight current/best values subtly rather than with saturated backgrounds.

## Charts

Charts are for trend/movement/time-series information. A chart must include:
- title and scope;
- date range;
- units;
- legend when multiple series;
- empty/partial-data state;
- accessible textual summary or table for important values.
