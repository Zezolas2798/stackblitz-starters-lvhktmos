---
tags: [product-vision, project-baseline, quality-management, food-service]
node_type: discovery
layer: market
nature: explanatory
status: draft
version: 0.4.0
last_updated: 2026-08-14
---

# Nutridev V2 — Project Overview

## Summary

O Nutridev V2 será uma plataforma SaaS para gestão da qualidade em empresas de alimentação. O primeiro usuário e canal comercial é o consultor de alimentos — autônomo ou integrante de uma consultoria — enquanto a empresa de alimentação também pode contratar diretamente e operar com seu responsável técnico ou responsável da qualidade.

O primeiro problema de produto é centralizar auditorias, checklists, não conformidades, evidências, planos de ação, relatórios e documentos controlados. A implementação será iniciada do zero; o conteúdo de `_legacy` será usado somente como evidência brownfield e referência crítica.

## Discovery Mode

- Mode: brownfield
- Delivery posture: brownfield discovery, greenfield implementation
- Project state: discovery baseline with legacy evidence
- Interview period: 2026-08-02 to 2026-08-06
- Operator / owner: Nutridev product owner
- Readiness target for this cycle: project baseline only (`--no-init`)

## Problem Framing

- Primary user and first commercial channel: independent food consultant or food consultancy.
- Secondary direct customer: food company represented by its owner, technical responsible or quality responsible.
- Core problem: quality records, documents and deliverables are fragmented across paper, spreadsheets, messages and isolated files, slowing visits, reporting and follow-up.
- Value proposition: centralize evidence and documents, reduce repetitive work, accelerate deliverables and preserve a traceable history shared at the correct boundary.
- Business goal: establish a modular SaaS in which consultants solve their own operational problems and introduce the platform to food companies, while Nutridev retains the commercial relationship and controls module licensing.
- Non-goals for the first rollout: becoming a complete ERP; implementing every future module; serving highly specialized operations; or claiming automatic regulatory compliance.

## First-Rollout Boundary

| Boundary | In Scope | Out Of Scope For This Rollout | Evidence Type |
|---|---|---|---|
| Target segments | Commercial food service, institutional kitchens and events/catering | Prisons, airline catering, offshore operations, industrial food manufacturing and food retail | stated |
| Product domain | Quality management, Audit/CAPA, controlled documents and the reports required by those workflows | Finance, purchasing, inventory, production, menu planning, nutrition calculation and labeling | stated |
| Initial geography | City of São Paulo, considering federal, São Paulo state and municipal rules | Nationwide automatic legal coverage | stated |
| Implementation | New specifications and new implementation | Porting legacy code or treating legacy schemas as design authority | stated |
| Validation | Risk-based software quality practices and traceability | Certification claims or wholesale application of pharmaceutical GxP requirements | stated |

Labeling may later become a premium consultant capability, but it is not part of the initial delivery slice.

## Current State

| Item | Status | Evidence Type | Notes |
|---|---|---|---|
| Product scope | partial | stated | Initial domain and segments are selected; pricing and packaging still require validation. |
| Domain boundaries | partial | stated | Audit/CAPA is the first slice; Document Control follows. Analytics is derived downstream. |
| Existing implementation | substantial legacy | observed | Previous code, migrations and documentation are under `_legacy`; they are evidence, not authority. |
| New baseline artifacts | partial | observed | This overview exists; four companion startpoint artifacts are created in this cycle. |
| Metrics baseline | sources identified, unmeasured | stated | Founder-operated FoodChecker and legacy audit examples are available, but no trustworthy time-saving, rework, conversion or retention baseline has been measured. |
| Regulatory source baseline | partial | observed | Food regulations and an Anvisa computerized-systems guide exist locally, but provenance and applicability require controlled review. |

## Actors And Stakeholders

| Actor | Goal | Pain Point | Frequency | Evidence Type |
|---|---|---|---|---|
| Nutridev system administrator | Operate the platform, license modules and support customers | Needs safe multi-organization governance and auditable support operations | continuous | stated |
| Food consultancy | Manage its team and portfolio of client companies | Fragmented client information and inconsistent deliverables | daily / weekly | stated |
| Independent consultant | Perform the same work as a one-person consultancy | Repetitive field records, reports and follow-up | daily / weekly | stated |
| Allocated consultant | Execute authorized visits and audits for assigned companies or units | Context switching and duplicate records | per visit | stated |
| Food company owner or administrator | Govern the company environment, units and access | Low visibility of quality risks and consultant work | weekly / monthly | stated |
| Technical or quality responsible | Operate quality workflows in a direct customer and validate closure | Manual controls and dispersed evidence | daily / weekly | stated |
| Corrective-action responsible | Execute actions and submit resolution evidence | Unclear priorities, deadlines and proof requirements | as assigned | stated |
| Company representative receiving a report | Formally acknowledge the issued report | Informal delivery without a reliable receipt trail | per report | stated |

## Candidate Bounded Contexts

| Context | Responsibility | Key Concepts | Delivery Position | Evidence Type |
|---|---|---|---|---|
| Organizations and Access | Represent Nutridev, consultancies, companies, units, memberships and permissions | organization, unit, membership, module entitlement | foundation | stated + observed |
| Consultancy Portfolio | Manage client relationships and allocate, reallocate or remove consultants | engagement, client portfolio, consultant allocation, allocation scope | foundation | stated + observed |
| Audit and CAPA | Execute checklists, register findings and evidence, manage remediation and validate closure | audit, checklist, finding, nonconformity, action plan, action, evidence | first delivery slice | stated + observed |
| Remediation and Action Management | Preserve typed origins while presenting plans, actions, evidence and validation across governed processes | remediation case, origin reference, plan revision, action, validation decision | partition candidate; first use through Audit/CAPA only | stated + hypothesized |
| Report Issuance and Acknowledgement | Freeze, share and formally acknowledge audit reports | report version, issuance, sharing, acknowledgement, electronic signature | part of first slice | stated + observed |
| Document Control | Centralize documents, validity, review status and homologation | controlled document, validity, review, approval, expiry | next delivery slice | stated + observed |
| Regulatory Applicability | Determine which federal, state and municipal sources apply to an operation | jurisdiction, regulatory source, applicability, effective period | supporting context | stated + observed |
| Quality Analytics | Derive trends, dashboards and insights from governed operational records | indicator, trend, recurrence, closure time | later derivation | stated |

## Core Workflows

| Workflow | Trigger | Main Steps | Failure Mode | Evidence Type |
|---|---|---|---|---|
| Connect consultancy and company | Consultancy adds a client or a company accepts a relationship | create relationship → define units → authorize modules → allocate consultants | treating the company as a child tenant or exposing private consultancy data | stated |
| Allocate a consultant | Consultancy adds, reallocates or removes a professional | choose company scope or selected units → grant capabilities → record effective period | stale access after reassignment | stated |
| Execute an audit | Authorized consultant or direct-company quality authority starts an audit | select checklist → inspect → answer → record finding and detection evidence → conclude | audit executed by an unauthorized actor or evidence added without provenance | stated + observed |
| Issue and acknowledge a report | Auditor completes the report | emit immutable version → share and grant access → request acknowledgement → record authenticated awareness/receipt | treating acknowledgement as agreement or allowing silent report mutation | stated + observed |
| Treat a nonconformity | Finding requires remediation | mark plan pending or define plan → add actions → execute → submit resolution evidence → validate under the applicable authority policy → close or reopen → reference open cases in later audits | indefinite pending plans, copied plans or closure without evidence | stated + observed |
| Control a document | A required document is created, received or renewed | classify → store → review/homologate → monitor validity → alert → supersede/archive | expired or unapproved document treated as current | stated + observed |

## Constraints

| Constraint | Type | Why It Matters | Evidence Type |
|---|---|---|---|
| A consultancy may serve many companies; a company has at most one active consultancy relationship | business | Matches the selected portfolio model while keeping company governance unambiguous | stated |
| A company may have many units | domain | Audits, documents, permissions and reporting may be company-wide or unit-scoped | stated + observed |
| Segment labels do not determine behavior by themselves | domain / market | Business and unit operating profiles must expose actual activities and flows, including central production supplying other units | stated + selected |
| A consultancy may have many consultants and may allocate them to all units or selected units | operational | Supports assignment, reassignment and removal without changing company ownership | stated |
| Independent consultant is modeled as a one-person consultancy | domain | Avoids a separate tenancy model | stated |
| A company can exist without a paid subscription while managed by a consultancy | business | Preserves the consultant-led acquisition path | stated |
| Nutridev negotiates contracts and controls module entitlement | business | Consultants introduce or refer; Nutridev remains the software vendor | stated |
| Private consultancy records and shared company artifacts require an explicit boundary | security / domain | Prevents accidental ownership transfer or data exposure | stated |
| Regulatory applicability is progressive and contextual | regulatory | Federal, state and municipal sources require analysis of competence, scope, specificity, effective period, revocation and coexistence for each module and operating profile | stated + selected |
| Issued reports and critical quality records require identity, timestamps, versioning and audit trail | quality / technical | Supports integrity, accountability and later validation | stated + observed |
| Report access precedes acknowledgement | domain / quality | Sharing grants authorized access; acknowledgement records awareness and receipt without agreement or technical co-authorship | stated + selected |
| Remediation preserves its source | domain | Audit, temperature, operational checklist and future origins may share action concepts but retain their own trigger, deadlines, evidence and validation policy | stated + selected principle |
| Validation authority is contextual | quality / domain | Executor, accountable person, validator and effectiveness verifier depend on origin, capability, scope and risk rather than job title alone | stated + selected principle |
| The Anvisa computerized-systems guide is a non-binding engineering reference used only where applicable | quality / regulatory | Avoids claiming pharmaceutical compliance for a food-service SaaS | observed + stated |

## Evidence Baseline

| Context | Observed Source | What It Demonstrates | Authority Posture |
|---|---|---|---|
| Organizations and units | `_legacy/docs/governanca/tenancy-mapping.md` | Prior modeling of consultancy, company, unit and scoped memberships | evidence only; hierarchy is superseded where it conflicts with current decisions |
| Audit and report | `_legacy/app/qualidade/relatorio/[id]/page.tsx` | Prior checklist reporting, nonconformity display, pending/concluded plans and auditor signature | evidence only |
| Audit record integrity | `_legacy/app/api/qualidade/auditorias/route.ts` | Prior soft-delete attempt for audit records | evidence only; legal claims in comments are not accepted |
| Action plan | `_legacy/supabase/migrations/20260611150000_qual_planos_acao.sql` | Prior persisted pending action-plan concept scoped to company and unit | evidence only |
| Document control | `_legacy/app/documentos/page.tsx` | Prior document checklist, storage, status and soft-delete behavior | evidence only |
| Food-service applicability | `_legacy/docs/legislacao/RDC_216_2004.md`, `_legacy/docs/legislacao/CVS_5_2013.md` and `docs/discovery/02.1-servico-comercial.md` | Prior federal/state source copies and current São Paulo segment research | evidence requiring official-source and effective-date verification |
| System validation | `_legacy/docs/legislacao/fontes/Guia_Validacao_Sistemas_ANVISA_Original.md` | Local 2010 guide text and risk-based validation concepts | source copy requiring version/provenance review |
| Professional audit workflow | Founder statement recorded in `docs/discovery/03-founder-evidence-intake-ex1-ex6-ex9.md` | FoodChecker audit execution followed by Excel compilation for analysis, plus later legacy report/export tests | stated source; artifacts and measurements pending |
| Consultancy portfolio and unit topology | Founder statement recorded in `docs/discovery/03-founder-evidence-intake-ex1-ex6-ex9.md` | Approximately 20 active clients in a former consultancy; examples with five units and six event units plus central production | stated source; independent EX-6 interviews pending |
| Pre-specification action and validation model | Product-owner decisions recorded in `docs/discovery/04-pre-specification-decisions-action-validation-acknowledgement.md` | Acknowledgement semantics, audit-plan carry-forward, cross-origin remediation direction and context-specific validation | selected principles; EX-5 and EX-10 through EX-12 remain required |

## Success Signals

| Signal | Why It Matters | Current Baseline | Target Direction |
|---|---|---|---|
| Time from audit completion to issued report | Tests the promised delivery agility | unknown | reduce |
| Percentage of findings with a plan defined within the agreed period | Prevents “plan pending” from becoming a dead end | unknown | improve |
| Median nonconformity closure time | Shows follow-up effectiveness | unknown | reduce |
| Percentage of reports formally acknowledged | Shows whether report delivery is provable | unknown | improve |
| Active companies per consultant | Tests portfolio scalability | unknown | improve without harming service quality |
| Percentage of controlled documents current and approved | Measures document-control value | unknown | improve |
| Recurrence rate of previously closed findings | Tests whether closure is effective rather than administrative | unknown | reduce |

## Counter-Positioning

| Central Proposition | Plausible Counter-Position | Invalidation Signal |
|---|---|---|
| Consultants are an effective channel to food companies | Consultants may see shared visibility as loss of control or may not want to sell software | Pilots use private tools but do not invite clients or share reports through Nutridev |
| Audit/CAPA is the best first slice | Document validity or another workflow may be more frequent and easier to adopt | Consultants continue audits outside the system but repeatedly request document alerts first |
| A free connected-company state supports conversion | Companies may consume reports without ever perceiving direct software value | Connected companies do not return independently or adopt paid capabilities |
| One active consultancy per company is sufficient | Companies may use different consultancies for different scopes | Target companies consistently require simultaneous consultancy relationships |
| Formal acknowledgement improves governance | Signing may add friction without changing follow-up behavior | Acknowledgement completion is low and does not improve action ownership or disputes |

## Risks And Unknowns

| Risk | Why Risky | Severity | What Would Reduce It |
|---|---|---|---|
| Shared-data ownership and retention after relationship termination | Both parties may expect continuing control over the same artifact | high | explicit lifecycle policy and contract review |
| Electronic-signature legal effect | “Science”, approval and agreement have different legal meanings | high | targeted legal research and signature-level decision |
| Regulatory source drift | Federal, state and municipal rules change at different times | high | versioned source registry and applicability review process |
| Excessive validation ceremony | Pharmaceutical validation practices could slow a lower-risk product | medium | documented risk classification and applicability matrix |
| Consultant adoption resistance | The product may create more work during field visits | high | shadowing, time measurements and usability trials |
| Multi-organization permission errors | A consultant works across companies and units | high | explicit access invariants and adversarial authorization tests |
| Pending-plan backlog | Fast report issuance can defer responsibility indefinitely | high | owner, definition deadline, ageing alerts and pilot thresholds |
| Generic action-management collapse | A shared plan model may erase why a case exists and which policy governs it | high | typed origin, source policy and EX-10 partition comparison |
| Validation-authority misconfiguration | Fixed titles or excessive configurability may permit unsafe approval or block small teams | high | capability/risk policy, explicit fallback and EX-11 review |

## Recommended Next Artifacts

1. `docs/INITIAL-DEFINITIONS.md`
2. `docs/PROJECT-DECISIONS.md`
3. `docs/HYPOTHESES.md`
4. `docs/EXPERIMENT-CANDIDATES.md`
5. Audit/CAPA feature discovery only after the startpoint gates pass and `domainspec-init` is explicitly authorized.

## Open Questions

1. Which assurance level, identity evidence and provider are sufficient for authenticated report acknowledgement?
2. Does the first slice need a separate, non-suspensive company manifestation or objective correction-request path?
3. May audit resolution evidence be validated in an authorized standalone follow-up between audits?
4. Which policies govern plan-definition deadline, action due date and validation target by origin, class and risk?
5. Which cases require independent validation, and what fallback applies when a small company lacks a second qualified person?
6. Should cross-origin remediation belong to one shared context or remain source-owned with a common portfolio projection?
7. What retention periods, export rights and post-termination visibility apply to each shared artifact class?
