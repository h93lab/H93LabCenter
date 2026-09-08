# Information Architecture

## Primary Navigation

```text
Dashboard

Discover
  Daily
  Opportunities
  Trends
  Markets
  Categories

Intelligence
  Signals
  Competitors
  Reviews
  Market Gaps
  Sources

Ideas
  All
  Shortlist
  Watchlist
  Passed
  Killed

Projects
  All Projects
  Ready for Development

Research
  Runs
  Jobs
  Evidence

AI
  Models & Roles
  Prompts
  Usage & Costs

Settings
  Research
  Markets
  Sources
  Scoring
  Development Profile
  Figma
  Integrations
  Account
```

## Navigation Principles

- Use the sidebar pattern from the shadcndashboard reference.
- Navigation labels stay short; use page-level descriptions for context.
- Counts/badges are used only when actionable (failed jobs, new opportunities, stale prototype).
- The user's highest-frequency paths are Dashboard -> Idea detail -> GO/Watch/Pass and Projects -> Blueprint.
- Research administration is separate from intelligence consumption.

## Canonical Detail Routes

- `/discover/daily`
- `/opportunities`
- `/opportunities/:opportunityId`
- `/ideas/:conceptId`
- `/competitors/:competitorId`
- `/research/runs/:runId`
- `/research/evidence/:evidenceId`
- `/projects/:projectId`
- `/projects/:projectId/blueprint`
- `/projects/:projectId/blueprint/versions/:version`

## Project Workspace Tabs

```text
Overview
Blueprint
Prototype
Features
Screens
Architecture
Data
Research
Decisions
Tasks
Files
Versions
```

The project workspace exists only after GO and ends at Ready for Development.
