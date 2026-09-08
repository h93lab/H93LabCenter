# Routes and Page Inventory

## Authentication

| Route | Page | Notes |
|---|---|---|
| `/login` | Login | Owner login only. No public registration CTA in production. |
| `/auth/callback` | Auth callback | Handles Supabase redirect/magic-link if enabled. |

## Dashboard & Discover

| Route | Page | Core purpose |
|---|---|---|
| `/` | Dashboard | What changed and what deserves attention now. |
| `/discover/daily` | Daily Opportunity | Promoted idea or honest no-opportunity state. |
| `/opportunities` | Opportunities | Search/filter/rank market opportunities and concepts. |
| `/opportunities/:id` | Opportunity Detail | Market-level evidence, signals, concepts, history. |
| `/ideas/:id` | Idea Detail | Product-concept deep analysis and decision. |
| `/discover/trends` | Trends | Ranked signal clusters and trend movement. |
| `/discover/markets` | Markets | Country/region opportunity view. |
| `/discover/categories` | Categories | App/game category opportunity view. |

## Intelligence

| Route | Page | Core purpose |
|---|---|---|
| `/intelligence/signals` | Signals | Inspect extracted signals and source evidence. |
| `/intelligence/competitors` | Competitors | Competitor list with type and tracked snapshots. |
| `/intelligence/competitors/:id` | Competitor Detail | Store/platform/market history, features, reviews, evidence. |
| `/intelligence/reviews` | Review Intelligence | Complaint/request clusters across researched ideas. |
| `/intelligence/gaps` | Market Gaps | Gap clusters and associated opportunities. |
| `/intelligence/sources` | Sources | Source adapters, health, reliability, last runs. |

## Idea Collections

| Route | Page |
|---|---|
| `/ideas` | All analyzed product concepts |
| `/ideas/shortlist` | User-shortlisted concepts |
| `/ideas/watchlist` | Watching concepts |
| `/ideas/passed` | Passed concepts |
| `/ideas/killed` | Concepts killed by hard criteria |

## Projects

| Route | Page |
|---|---|
| `/projects` | Project list |
| `/projects/:id` | Project Overview |
| `/projects/:id/blueprint` | Blueprint Workspace |
| `/projects/:id/prototype` | Prototype Workspace |
| `/projects/:id/features` | Feature/requirement explorer |
| `/projects/:id/screens` | Screen inventory |
| `/projects/:id/architecture` | Technical blueprint |
| `/projects/:id/research` | Research traceability |
| `/projects/:id/decisions` | Product decisions |
| `/projects/:id/tasks` | Generated implementation task plan |
| `/projects/:id/files` | Generated document explorer |
| `/projects/:id/versions` | Blueprint version history/diffs |

## Operations

| Route | Page |
|---|---|
| `/research/runs` | Research Runs |
| `/research/runs/:id` | Run Detail |
| `/research/jobs` | Job Monitor |
| `/research/evidence/:id` | Evidence Detail |
| `/ai` | AI Roles & Models |
| `/ai/prompts` | Prompt Versions |
| `/ai/usage` | AI Usage & Costs |

## Settings

- `/settings/research`
- `/settings/markets`
- `/settings/sources`
- `/settings/scoring`
- `/settings/development-profile`
- `/settings/figma`
- `/settings/integrations`
- `/settings/account`

## Routing Rules

- All authenticated routes require owner session.
- Use route-level lazy loading for large feature areas.
- Invalid/stale IDs show a standard not-found state rather than redirecting silently.
- Preserve active filters in URL for list pages.
- Modal/sheet inspection may use route state only if back-button behavior remains predictable.
