---
id: project-decisions
title: "Project Decisions"
type: project-decisions
status: baseline
created: 2026-05-10
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---


# Project Decisions

> Decisions that affect the entire project. Each decision must have a selected option or explicit `blocked` status.

| Decision ID | Question | Selected Option | Status |
|---|---|---|---|
| PD-001 | Architecture pattern | BaaS-First (Supabase + Next.js App Router) | selected |
| PD-002 | Source of truth policy | Code is as-is authority; docs are updated to match before refactors | selected |
| PD-003 | Multi-tenancy model | RLS per client + per unit isolation for operational data | selected |
| PD-004 | Data deletion policy | Soft delete only (`deleted_at`). No physical deletion of transactional records. | selected |
| PD-005 | UI framework | Material UI (MUI) 5 | selected |
| PD-006 | Testing framework | Vitest + Testing Library + JSDOM | selected |
| PD-007 | Edge function runtime | Deno (Supabase Edge Functions) | selected |
| PD-008 | DomainSpec adoption scope | Full framework — brownfield translation first, then spec-first for new features | selected |
| PD-009 | DomainSpec pilot feature | `ingredientes` module | selected |
| PD-010 | Deployment target | GitHub + local dev (Vercel/VPS TBD for production) | deferred |
| PD-011 | CI/CD pipeline | GitHub Actions (to be configured after DomainSpec baseline) | deferred |
| PD-012 | Domain-specific meta-type: Legislação | Added to taxonomy as active regulatory actor, not passive documentation | selected |
