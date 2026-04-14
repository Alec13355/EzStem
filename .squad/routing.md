# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Technical architecture, system design, ADRs | Danny | Tech stack decisions, cross-cutting patterns, code review |
| .NET API, backend logic, database, Azure services | Linus | Endpoints, EF migrations, Service Bus, auth, Key Vault |
| Angular UI, components, routing, state | Rusty | Feature modules, forms, HTTP services, responsive layout |
| UX flows, wireframes, interaction design, accessibility | Tess | User journeys, screen specs, usability review |
| Backlog, planning, scope, priorities, status | Reuben | Sprint planning, risk tracking, acceptance criteria |
| Azure infra, CI/CD pipelines, deployments, monitoring | Basher | Bicep/ARM, GitHub Actions/Azure DevOps, App Insights |
| Florist domain knowledge, workflow validation | Saul | Industry requirements, seasonal constraints, workflow review |
| Code review (backend) | Danny + Linus | Review PRs, check quality, patterns |
| Code review (frontend) | Danny + Rusty | Angular patterns, type safety |
| Testing | Linus (backend), Rusty (frontend) | Unit tests, integration tests, edge cases |
| Session logging | Scribe | Automatic — never needs routing |
| Work queue monitoring | Ralph | GitHub issues, PR status, CI health |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Danny (Lead) |
| `squad:danny` | Architecture, tech decisions, code review | Danny |
| `squad:linus` | Backend .NET work, API, database | Linus |
| `squad:rusty` | Angular frontend work, UI components | Rusty |
| `squad:tess` | UX flows, design, accessibility | Tess |
| `squad:reuben` | PM tasks, backlog, planning | Reuben |
| `squad:basher` | DevOps, Azure infra, pipelines | Basher |
| `squad:saul` | Domain expertise, florist workflow validation | Saul |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, **Danny** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Tess for UX + Saul for domain validation simultaneously with implementation.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Danny handles all `squad` (base label) triage.

