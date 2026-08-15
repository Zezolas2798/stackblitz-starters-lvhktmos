---
tags: [project-decisions, governance, scope, source-of-truth]
node_type: implementation-plan
layer: domain
nature: reference
status: active
version: 0.4.0
last_updated: 2026-08-14
---

# Project Decisions

## Purpose

Capture project-level decisions that govern the Nutridev V2 baseline before feature planning, `domainspec-init` or implementation. A selected decision may still create a research obligation; only unresolved choices that prevent responsible progression are blockers.

## Decision Register

| ID | Decision | Options Considered | Selected Option | Status | Scope | Rationale | Source | Date |
|---|---|---|---|---|---|---|---|---|
| PD-001 | Discovery and implementation posture | greenfield; brownfield; hybrid | Brownfield discovery with greenfield implementation | selected | project | Existing artifacts are useful evidence, but new semantics and implementation must not inherit them silently | interview + repository audit | 2026-08-06 |
| PD-002 | First user and acquisition channel | sell only to companies; sell only to consultants; consultant-led with direct sales | Consultant/consultancy first, with direct Nutridev sales also supported | selected | business | The product first solves consultant work and uses consultants as a channel to companies | interview | 2026-08-05 |
| PD-003 | Vendor relationship | consultant resells/contracts; Nutridev contracts; mixed | Nutridev negotiates and contracts the software; consultant may introduce or refer | selected | business | Keeps licensing, support and commercial accountability with the software owner | interview | 2026-08-05 |
| PD-004 | Consultancy and company tenancy | consultancy parent/company child; independent tenants; linked organizations | Independent organization environments connected by an explicit engagement and shared artifacts | selected | project | A company must govern its own environment and may later contract directly | interview | 2026-08-05 |
| PD-005 | Company subscription prerequisite | company must subscribe before use; consultant-only shadow record; free connected company | Company may exist as a free connected workspace while managed by a consultancy | selected | business | Avoids breaking the consultant-led workflow and preserves a conversion path | interview | 2026-08-05 |
| PD-006 | Relationship cardinality | many consultancies per company; one active consultancy per company | Consultancy may serve many companies; company has at most one active consultancy | selected | domain | Matches the current operating model and reduces access ambiguity | interview | 2026-08-05 |
| PD-007 | Consultant modeling | separate autonomous-consultant tenant; one-person consultancy | Independent consultant is a one-person consultancy | selected | domain | Reuses the same portfolio and allocation model | interview | 2026-08-05 |
| PD-008 | Unit and allocation scope | company only; unit only; both scopes | Company may have many units; allocation supports whole company or selected units | selected | domain | Consultants may be responsible for all units or a subset and may be reassigned | interview | 2026-08-05 |
| PD-009 | Module authorization | consultant controls; company controls; Nutridev licenses and company grants users | Nutridev controls entitlement; company/consultancy administrators grant access within enabled scope | selected | project | Separates commercial capability from operational permissions | interview | 2026-08-05 |
| PD-010 | Initial target segments | all food sectors; one narrow business type; three initial groups | Commercial food service, institutional kitchens and events/catering | selected | market | Covers the stated consultant portfolio while avoiding specialized operations initially | interview | 2026-08-05 |
| PD-011 | Specialized segments | include immediately; defer | Prisons, airline catering and offshore are out of the first rollout | selected | market | Their distinctive operational and regulatory constraints would distort the first slice | interview | 2026-08-05 |
| PD-012 | Initial jurisdiction | nationwide; one state; São Paulo city hierarchy | City of São Paulo with federal → state → municipal applicability | selected | regulatory | Provides a complete three-level hierarchy with a bounded research surface | interview | 2026-08-05 |
| PD-013 | Initial product domain | broad suite; quality first; documents only | Quality first: Audit/CAPA as first slice and Document Control as next slice | selected | product | These workflows directly address consultant routine, centralization and deliverables | interview | 2026-08-05 |
| PD-014 | Analytics timing | primary input module; separate first module; derived later | Reports are operational outputs; dashboards and insights derive later from governed records | selected | product | Analytics needs trustworthy source workflows before it can be meaningful | interview | 2026-08-05 |
| PD-015 | Finding evidence timing | only at closure; only at detection; both | Detection evidence at finding time and resolution evidence after corrective work | selected | Audit/CAPA | Separates proof of the problem from proof of remediation | interview | 2026-08-05 |
| PD-016 | Report versus incomplete plan | block report; omit plan; allow explicit pending plan | Report may be issued with `plan pending`, with owner and definition deadline | selected | Audit/CAPA | Enables prompt delivery without fabricating action details | interview + synthesis | 2026-08-06 |
| PD-017 | Plan structure | many parallel plans; one immutable plan; one active version with many actions | One active plan revision per nonconformity, containing one or more actions | selected | Audit/CAPA | Avoids contradictory plan states while supporting complex remediation | discovery synthesis | 2026-08-06 |
| PD-018 | Resolution validation timing | same audit only; later audit; independent follow-up | Evidence may be submitted later and validated in a subsequent audit | selected | Audit/CAPA | Corrective work usually occurs after the originating audit; validation outside an audit remains undecided | interview | 2026-08-06 |
| PD-019 | Role accumulation | strict separation always; unrestricted; attributable accumulation with risk rules | The same person may execute a corrective action and later validate its result when necessary; both acts remain separately attributable and the absence of segregation is recorded | selected | Audit/CAPA | Consultancy and small-company operations may have only one qualified professional | interview | 2026-08-06 |
| PD-020 | Report lifecycle terminology | publish as one action; mutable shared document; emit/share/acknowledge | Emit freezes a version; share distributes it; acknowledge records company receipt | selected | reports | Keeps finalization, access and recipient action semantically distinct | interview + synthesis | 2026-08-06 |
| PD-021 | Company report acknowledgement | optional; informal; formal electronic acknowledgement | An authorized company representative must formally acknowledge a consultancy report after sharing | selected | reports | Creates a reliable receipt trail between consultancy and company | interview | 2026-08-06 |
| PD-022 | Issued-report mutation | edit in place; overwrite PDF; immutable version/addendum | Issued report versions are immutable; later changes produce another version or addendum | selected | reports | Preserves what was actually shared and acknowledged | discovery synthesis | 2026-08-06 |
| PD-023 | Computerized-system validation reference | ignore guide; treat as binding food rule; apply as voluntary risk-based reference | Use Anvisa guidance only where applicable as a non-binding engineering reference | selected | quality governance | The guide informs integrity and lifecycle practices but is not a food-service SaaS compliance certificate | interview + official-source review | 2026-08-06 |
| PD-024 | Legacy authority | legacy code; legacy docs; new decisions/specs | `_legacy` is evidence only; current approved docs and decisions are authoritative | selected | governance | The project is intentionally restarting rather than translating the previous implementation as requirements | interview | 2026-08-06 |
| PD-025 | Migration strictness | port wholesale; refactor incrementally; no automatic migration | No automatic code/schema migration; reuse requires an explicit evidence-to-requirement decision | selected | governance | Prevents accidental reintroduction of old assumptions and unsupported compliance claims | interview + repository audit | 2026-08-06 |
| PD-026 | Action-plan responsibility model | one owner for every activity; plan-level assignment only; stable follow-up plus per-action assignment | The originating process executor initially follows up the plan, while each corrective action has its own responsible user and may be reassigned independently | selected | Audit/CAPA | Plan follow-up is relatively stable, while execution responsibility varies by action | interview | 2026-08-06 |
| PD-027 | Validator configuration | choose on every validation; global immutable validator; scoped default copied to each plan | The company configures a company- or unit-scoped default validator that is copied to new plans and may be explicitly replaced on open plans | selected | Audit/CAPA | Reduces repetitive configuration while preserving controlled exceptions and historical authorship | interview + synthesis | 2026-08-06 |
| PD-028 | Original project asset ownership | unassigned; shared ownership; sole founder ownership | José Augusto Leite Teixeira is the sole declared owner of the original Nutridev project assets at this stage, subject to third-party rights and licenses | selected | governance | Establishes the current founder and asset-accountability baseline without claiming ownership over external sources or dependencies | owner statement | 2026-08-14 |
| PD-029 | Initial-segment modeling depth | segment label only; separate product per segment; segment plus operational applicability | Initial segments must be decomposed into business and unit operating profiles whose activities, flows and applicable capabilities are explicit | selected | domain / market | Companies within one segment may have materially different structures, including central production and multiple event units | owner clarification + professional experience | 2026-08-14 |
| PD-030 | Repository cleanup posture | delete apparent leftovers; migrate immediately; inventory before mutation | Audit and classify the current repository before moving or deleting anything; preserve every material artifact until the owner reviews its proposed destination | selected | governance | The V2 needs a clean boundary without risking loss of legacy knowledge or assets | owner decision | 2026-08-14 |
| PD-031 | Report access and acknowledgement semantics | access only after signature; signature means agreement; access on sharing and signature means awareness | Sharing grants an authorized recipient access to an issued version; acknowledgement records attributable awareness and receipt, not agreement, approval, admission or technical co-authorship | selected | reports | Preserves the consultant's technical authorship while proving which company representative received which immutable version | owner decision + synthesis | 2026-08-14 |
| PD-032 | Initial acknowledgement mechanism | image signature; unauthenticated checkbox; authenticated auditable act | Begin with an authenticated, attributable and auditable electronic acknowledgement; exact assurance level and provider remain under legal and technical review | selected principle | reports | Establishes the required product semantics without prematurely claiming a specific legal signature level | owner decision | 2026-08-14 |
| PD-033 | Audit-plan continuity | copy plan into every audit; hide until next review; reference open plan until accepted conclusion | An unresolved audit-originated plan remains visible and referenced in later audits until an authorized validation accepts conclusion; prior audits and plan history are not rewritten | selected | Audit/CAPA | Maintains continuity across visits without duplicating or silently closing remediation records | owner decision + synthesis | 2026-08-14 |
| PD-034 | Validation authority model | one global validator; fixed job title; context-specific capability policy | Validator eligibility is selected by originating process, role/capability, scope and risk; self-validation may be allowed where policy permits, while other cases require a third party | selected principle | quality governance | Audit follow-up and operational task verification have different authority and independence needs | owner decision + synthesis | 2026-08-14 |
| PD-035 | Effectiveness-verification policy | always required; never required; class/risk based | Later effectiveness verification is required according to source class and risk rather than for every accepted correction | selected principle | quality governance | Accepted resolution evidence does not always prove that correction remains effective | owner decision | 2026-08-14 |
| PD-036 | Engagement-termination principle | erase shared history; preserve full operational access; stop new operations and preserve governed history | Ending a consultancy-company engagement blocks new operations under that engagement while preserving authorship and already shared immutable versions | selected principle | governance | Protects historical integrity without granting indefinite authority to perform new work | owner decision | 2026-08-14 |
| PD-037 | Cross-origin remediation direction | audit-only forever; one generic task list; typed origins with source policies | Remediation must preserve a typed originating record; only audit-originated remediation is implemented first, while future sources retain their own trigger, deadline, evidence, validation and escalation policies | selected principle | domain architecture | Temperature deviations, operational checklist failures and other processes may require action plans without becoming audit records | owner direction + synthesis | 2026-08-14 |
| PD-038 | Progressive regulatory applicability | model all law upfront; let every module invent its own legal model; shared sources with module mapping | Govern source provenance, jurisdiction, version and effective period centrally, then map applicability progressively for each module, capability and operating profile | selected principle | regulatory | Keeps a consistent source model while allowing applicability to be discovered where each workflow is specified | owner decision + synthesis | 2026-08-14 |
| PD-039 | V2 repository destination | continue in legacy repository; include development tools in product repository; create a separate product repository | Create the V2 in the separate private GitHub repository `Zezolas2798/zelus-food-solution`, with `main` as the default branch and access initially restricted to the owner | selected | governance / delivery | Gives the greenfield implementation a clean history and boundary while preserving the current Nutridev repository as legacy evidence | owner decision | 2026-08-14 |
| PD-040 | Development-tool boundary | vendor tools into the product; use as submodules; keep as external development tools | Arcanum, DomainSpec and CyberAlchemy Orchestrator support development but are not components, submodules or runtime dependencies of Zelus Food Solution | selected | governance / tooling | Prevents the product repository and deployable system from inheriting the lifecycle of its development-assistance tools | owner decision | 2026-08-14 |
| PD-041 | Offline posture for the first slice | offline-first now; local server now; online first with later evaluation | Do not make offline operation or a customer-hosted local server a requirement of the first slice; reassess them later by contracted modules, operational need and cost | selected | architecture / scope | Offline resilience is valuable but not necessary to begin the Audit/CAPA slice, and the research shows that premature guarantees would add unresolved authority, synchronization and operational complexity | owner decision + offline-resilience research | 2026-08-14 |
| PD-042 | Initial public product name | retain Nutridev publicly; use Zelus only for the repository; use Zelus Food Solution publicly and technically | Use `Zelus Food Solution` as the public product name in this initial stage; `Nutridev` identifies the legacy project and historical evidence | selected | product identity / governance | Aligns the new product identity with the clean V2 repository boundary while preserving the provenance of legacy artifacts | owner decision | 2026-08-15 |

## Ratification Record

| Review Item | Decisions Covered | Outcome | Date | Notes |
|---|---|---|---|---|
| A1 — Legacy authority | PD-001, PD-024, PD-025 | approved | 2026-08-14 | Legacy remains evidence; reuse is explicit. |
| A2 — Broad vision and bounded first product | PD-013, PD-014 | approved | 2026-08-14 | Future modules remain conditional rather than removed from the product vision. |
| A3 — Audit/CAPA entry wedge | PD-013 and H2 experiment posture | approved | 2026-08-14 | Approved as a hypothesis to test, not a permanent product commitment. |
| A4 — Initial customer and channel | PD-002, PD-003, PD-005 | approved | 2026-08-14 | Consultant-led entry with direct company sales retained. |
| A5 — Consultancy–company model | PD-004, PD-006, PD-007, PD-008 | approved with EX-6 obligation | 2026-08-14 | Founder evidence supplied; additional interviews remain required. |
| A6 — Initial market scope | PD-010, PD-011, PD-012, PD-029 | approved with clarification | 2026-08-14 | Differences among business and unit operating profiles must be explicit. |
| A7 — Ownership | PD-028 | approved | 2026-08-14 | Sole declared founder ownership recorded; third-party rights remain separate. |
| A8 — Root cleanup | PD-030 | approved | 2026-08-14 | Audit first and lose nothing. |
| A9 — Repository destination | PD-039, PD-040 | approved | 2026-08-14 | V2 will use `Zezolas2798/zelus-food-solution`; the current repository remains legacy and the three development tools remain external to the product. |

## Required Startpoint Decisions

| Key | Selected Resolution | Status |
|---|---|---|
| scope-boundary | In: organization/access foundations, consultant portfolio, Audit/CAPA, report acknowledgement and next-slice Document Control for the selected São Paulo segments. Out: complete ERP, other product modules and specialized segments. | selected |
| initial-delivery-slice | Audit/CAPA vertical slice: authorized audit → finding and detection evidence → nonconformity → pending/defined plan → actions → resolution evidence → validation → immutable report sharing and company acknowledgement. | selected |
| source-of-truth-policy | Current approved project documents and decisions are semantic authority. `_legacy` and current code are observed evidence only. | selected |
| migration-strictness | Greenfield implementation; no wholesale port. Any reused concept, data shape or code requires explicit review against the new spec. | selected |
| verification-baseline-command | For this documentation-only cycle: `git diff --check -- docs/PROJECT-OVERVIEW.md docs/INITIAL-DEFINITIONS.md docs/PROJECT-DECISIONS.md docs/HYPOTHESES.md docs/EXPERIMENT-CANDIDATES.md`, plus a frontmatter and required-section check. Executable application verification must be selected before `domainspec-init`. | selected |

## Deferred Decisions

| ID | Decision | Why Deferred | Owner | Required Before |
|---|---|---|---|---|
| DD-001 | Exact electronic-acknowledgement assurance level, identity proof and provider | The authenticated and auditable baseline is selected, but legal effect and evidence requirements need legal and technical comparison | Nutridev product owner | report acknowledgement interface specification |
| DD-003 | Plan-definition deadline, action due date, validation target and escalation by origin/risk | Carry-forward visibility is selected but does not replace the three distinct clocks or their escalation rules | Audit/CAPA and source-module owners | action-plan rules specification |
| DD-004 | Exact validation-authority and independence matrix | Context-specific validation is selected, but criticality thresholds, required independence, fallback and warnings need scenario and professional review | Quality governance owner | closure-validation rules specification |
| DD-005 | Retention periods, export rights and post-termination visibility by artifact class | The termination principle is selected, but privacy, contract and artifact-specific rules remain unresolved | Nutridev product owner | engagement lifecycle specification |
| DD-006 | Executable stack and verification commands | The new implementation architecture has not yet been selected | Technical owner | `domainspec-init` or implementation planning |
| DD-007 | Exact Anvisa guide edition and applicability matrix | Local source is the 2010 edition; later Guide 33/2020 requires controlled sourcing | Quality governance owner | validation plan for critical features |
| DD-008 | Audit-plan validation in an independent follow-up between audits | The consultant is eligible and open plans surface in later audits, but whether an authorized standalone review may close the plan is not yet explicit | Audit/CAPA owner | closure-validation rules specification |
| DD-010 | Separate company manifestation or technical-correction request | Acknowledgement is not contestation, but objective errors or contextual evidence may require an attributable, non-suspensive response path | Nutridev product owner and Audit/CAPA owner | report interaction specification |
| DD-011 | Ownership boundary for cross-origin remediation | A typed-origin direction is selected, but a shared bounded context versus source-owned plans with a common projection requires EX-10 | Technical and domain owners | context partition and first action-plan specification |

## Resolved Deferred Decisions

| ID | Resolution | Decision | Date |
|---|---|---|---|
| DD-002 | Acknowledgement means attributable awareness and receipt of an exact shared version, not agreement or approval; any company response is a separate act | PD-031 | 2026-08-14 |
| DD-009 | V2 begins in the separate private repository `Zezolas2798/zelus-food-solution`; the current repository remains legacy and the development tools remain external | PD-039, PD-040 | 2026-08-14 |

## Blockers

No blocker-level project decision remains open for completing this documentation baseline. The deferred decisions above prevent their respective feature specifications or implementation stages, not the five-artifact startpoint itself.

## Guardrails

1. Do not run `domainspec-init`, create feature specs or implement code as part of this cycle.
2. Do not infer current requirements from `_legacy` without an explicit decision or hypothesis.
3. Do not describe Nutridev as “Anvisa validated”, “GxP compliant” or legally compliant merely because a guide informed engineering practices.
4. Do not equate company acknowledgement with agreement, approval, admission of responsibility or technical validation by the recipient.
5. Do not stage the entire dirty worktree; any future commit must name the intended files explicitly.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-08-06 | Initial project decision baseline created from operator interview and repository evidence | Codex with Nutridev product owner |
| 2026-08-14 | Recorded A1–A8 ratification, sole-founder ownership statement, segment-modeling requirement and lossless repository-audit policy | Codex with Nutridev product owner |
| 2026-08-14 | Recorded report acknowledgement, audit-plan continuity, context-specific validation, effectiveness, termination, cross-origin remediation and progressive regulatory-applicability decisions | Codex with Nutridev product owner |
| 2026-08-14 | Resolved the V2 repository destination, established the external development-tool boundary and deferred offline/local-server requirements beyond the first slice | Codex with Nutridev product owner |
| 2026-08-15 | Selected Zelus Food Solution as the initial public product name and retained Nutridev as the legacy-project identifier | Codex with product owner |
