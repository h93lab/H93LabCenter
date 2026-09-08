# UI Implementation Specification

## Reference Requirement

The implementation must use `https://github.com/shadcndashboard/shadcndashboard` as the primary visual reference. The goal is not merely “use shadcn”; it is to preserve the reference project's overall dashboard language:

- sidebar proportions and navigation rhythm;
- header density;
- card radius, border treatment, shadows/elevation, spacing, and typography hierarchy;
- button hierarchy and sizing;
- form and table density;
- badges, tabs, dropdowns, dialogs, sheets, tooltips, breadcrumbs, and pagination treatment;
- chart visual language;
- light/dark theme behavior;
- responsive navigation patterns.

When a needed component does not exist in the reference, compose it from the same primitives and tokens rather than introducing a second design system.

## Frontend Architecture

Recommended structure:

```text
src/
  app/
    providers/
    router/
  components/
    ui/                 # reference/shadcn primitives only
    layout/             # sidebar/header/page shell
    domain/             # reusable domain visualizations
  features/
    dashboard/
    research/
    opportunities/
    competitors/
    reviews/
    projects/
    blueprint/
    ai-settings/
    settings/
  lib/
    supabase/
    api/
    query/
    validation/
    format/
  types/
  styles/
```

Feature folders may contain views, hooks, query keys, schemas, and local components. Avoid a single global `components/` directory containing every domain component.

## State Strategy

- Supabase/API server state: TanStack Query or an equivalent query cache.
- Forms: React Hook Form + Zod.
- Tables: TanStack Table.
- URL state: filters/search/sort that users may bookmark belong in query parameters.
- Local interaction state: local React state unless shared across distant components.
- Theme: preserve the reference ThemeProvider approach.

## Typography

Use Cairo for all application text. Recommended CSS family:

```css
font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
```

Use variable weights if the selected Cairo distribution supports them. Do not add a second display font.

## Page Shell

Desktop:

- persistent/collapsible left sidebar;
- top header with page breadcrumbs/context and compact global actions;
- page content constrained by the reference dashboard's content rhythm rather than a narrow marketing-site container.

Mobile/tablet:

- sidebar becomes drawer/sheet;
- cards stack;
- wide analytical tables use prioritized columns + horizontal scroll or responsive detail sheets;
- fixed action bars are acceptable only on decision-heavy screens such as Idea Detail.

## Core UI Patterns

### Metric Card
Used for score, confidence, trend, counts, cost. Must include semantic label, primary value, optional delta, optional explanation tooltip. A number must never rely on color only.

### Score Component
Shows 0–100, label, optional rating band, scoring model version, and click behavior. Clicking opens explainability panel.

### Confidence Indicator
Shows numeric confidence plus High/Medium/Low label. Never merge visually with Opportunity Score.

### Evidence Chip
Displays verification status and source class. Opens evidence detail when clickable.

### Recommendation Badge
Use text + icon + color:
- Strong Build
- Build
- Validate First
- Watch
- Pass
- Killed

### Data Table
Server-pagination ready, filterable, sortable, column visibility, loading skeleton, empty state, error state, row actions.

### Timeline
Used for opportunity history, score changes, competitor movements, Blueprint version history.

### Side Sheet
Preferred for score explanations, evidence inspection, short competitor detail, impact-analysis preview. Avoid unnecessary route changes for context inspection.

## Content Rules

- Product UI copy is English.
- Avoid marketing hype such as “revolutionary opportunity.”
- Label estimated values explicitly.
- Include data date/recency near time-sensitive analysis.
- Use `Unknown` rather than blank or `0` for unavailable metrics.
- Use `Not applicable` for structurally irrelevant metrics.

## Loading/Error/Empty Requirements

Every data view must define:

- loading skeleton;
- empty result state;
- request/server error state;
- partial-data warning when some research stages failed;
- stale-data indicator when the latest successful research is older than the configured freshness threshold.
