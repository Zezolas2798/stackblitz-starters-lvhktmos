---
tags: [domain-language, initial-definitions, quality-management, tenancy]
node_type: conceptual
layer: domain
nature: reference
status: draft
version: 0.4.0
last_updated: 2026-08-14
---

# Initial Definitions

## Epistemic Convention

- `observed`: found in repository artifacts or implementation.
- `stated`: explicitly supplied by the product owner during discovery.
- `hypothesized`: plausible but not yet validated.
- `selected`: adopted in `docs/PROJECT-DECISIONS.md` for the current baseline.

The definitions below govern the new Nutridev baseline. Similar terms in `_legacy` do not override them.

## Glossary Seed

| Term | Working Definition | Category | Status | Evidence Type |
|---|---|---|---|---|
| Nutridev | Software vendor and platform operator that contracts customers, controls module entitlement and governs the product | business term | draft | stated |
| Food consultancy | Organization that manages consultants and a portfolio of food-company clients | organization | draft | stated |
| Independent consultant | One-person food consultancy; not a separate tenancy species | role / organization | draft | stated |
| Consultant | Professional belonging to a consultancy and allocatable to companies or units | role | draft | stated |
| Food company | Client organization that owns its environment and may contract directly or be connected through a consultancy | organization | draft | stated |
| Unit | Operational location belonging to one food company | organization | draft | stated + observed |
| Business segment | Market-level grouping such as commercial food service, institutional kitchens or events/catering; it is not sufficient by itself to determine system behavior | market taxonomy | draft | stated + selected |
| Operating profile | Description of the activities, flows and operational capabilities present in a company or unit; it refines a business segment for applicability decisions | domain taxonomy | draft | stated + selected |
| Unit role | Function performed by a unit in a wider company flow, such as central production or event operation | domain taxonomy | draft | stated + hypothesized |
| Central production unit | Unit that prepares food or components used by other units in the same company | organization / operation | draft | stated |
| Client portfolio | Set of food companies linked to a consultancy | business term | draft | stated |
| Consultancy-company engagement | Time-bounded relationship that enables allocation and explicit sharing without making either organization a child tenant | business term | draft | stated |
| Consultant allocation | Authorization assigning a consultant to a whole company or selected units for an effective period | workflow | draft | stated |
| Company-wide allocation | Allocation covering every current and future unit of a company until changed | business term | draft | stated |
| Unit-scoped allocation | Allocation restricted to explicitly selected company units | business term | draft | stated |
| Consultancy workspace | Private environment for consultancy portfolio and internal work | system | draft | stated |
| Company workspace | Environment governed by the food company owner or administrator, including its units | system | draft | stated |
| Shared artifact | Record deliberately made visible to both organizations while preserving origin, version and access history | system | draft | stated |
| Managed company | Company operated through a consultancy relationship, whether or not it has a paid Nutridev subscription | business term | draft | stated |
| Free connected company | Company identity and workspace connected to a consultancy without its own paid capabilities | business term | draft | stated |
| Direct customer | Food company contracting Nutridev without an active consultancy relationship | business term | draft | stated |
| Module entitlement | Nutridev-controlled authorization that enables product capabilities for an organization and scope | policy | draft | stated |
| Quality authority | Contextual capability held by an authorized consultant, technical responsible or quality responsible | role | draft | stated |
| Technical responsible | Professional formally responsible for technical or quality operations in the company context | role | draft | stated |
| Audit | Controlled inspection executed against a checklist for a company or unit by an authorized quality authority | workflow | draft | stated + observed |
| Checklist template | Versioned set of sections, questions and response rules used by an audit | system | draft | stated + observed |
| Finding | Observation recorded during an audit; it may be conforming, nonconforming, not applicable or another future classified result | business term | draft | stated + observed |
| Nonconformity | Finding that identifies failure to satisfy an applicable criterion and requires an explicit treatment decision | business term | draft | stated + observed |
| Detection evidence | Attributable evidence captured when a finding is recorded, supporting what was observed | system | draft | stated |
| Remediation case | Source-linked case representing a deviation or failure that may require treatment; its origin remains explicit | system | draft | stated + hypothesized |
| Origin reference | Immutable reference from a remediation case to its originating module, record, scope and trigger | system | draft | stated + hypothesized |
| Action plan | Versioned remediation container belonging to one source-linked case and containing one or more actions; the first supported origin is an audit nonconformity | workflow | draft | stated + selected |
| Plan pending | State indicating that remediation is required but its action plan is not yet fully defined | state | draft | stated |
| Corrective action | Specific, assignable and time-bounded step contained in an action plan | workflow | draft | stated |
| Pending action | Defined action that has not yet reached accepted completion; distinct from an undefined plan | state | draft | stated |
| Plan follow-up responsible | User who currently monitors a plan derived from an audit or another originating process; initially the executor of that process | role | draft | stated + selected |
| Action responsible | Authorized user assigned to execute a specific corrective action; different actions in one plan may have different responsible users | role | draft | stated + selected |
| Default validator | Company- or unit-scoped configuration copied to a new plan to identify who is expected to validate its resolution | policy | draft | stated + selected |
| Resolution evidence | Attributable evidence submitted after an action, supporting the claim that the problem was corrected | system | draft | stated |
| Validation authority policy | Policy selecting eligible validators and independence requirements from origin, capability, scope and risk | policy | draft | stated + selected |
| Validation decision | Attributable acceptance or rejection of a completion claim and its evidence by an authorized validator | system | draft | stated + selected |
| Closure validation | Professional judgment that resolution evidence is sufficient to close or reopen a source-linked remediation case | workflow | draft | stated |
| Effectiveness verification | Later check that the correction remains effective and the issue has not recurred | workflow | draft | hypothesized |
| Draft report | Mutable working representation before issuance | system | draft | selected |
| Report issuance | Operation that creates an immutable, attributable version of an audit report | workflow | draft | selected |
| Report sharing | Operation that makes an issued report version available to an authorized company recipient | workflow | draft | selected |
| Formal acknowledgement | Authenticated and attributable company act confirming awareness and receipt of the exact shared report version without expressing technical agreement or approval | workflow | draft | stated + selected |
| Company manifestation | Optional, separate and non-suspensive company response linked to a report finding or evidence item; it cannot mutate or annul the issued version | workflow | draft | hypothesized |
| Electronic signature | Broad electronic mechanism used to associate a person with an act; the required assurance level remains undecided | system | draft | stated + hypothesized |
| Digital signature | Specific cryptographic signature mechanism; it must not be used as a synonym for every electronic acknowledgement | system | draft | hypothesized |
| Controlled document | Versioned document whose applicability, owner, status and validity are managed | system | draft | stated + observed |
| Document validity | Period during which a controlled document may be treated as current, subject to review status | business term | draft | stated |
| Homologation | Authorized review decision accepting or rejecting a document for its intended use | workflow | draft | stated |
| Regulatory applicability | Determination of which federal, state and municipal sources apply to an organization, unit, activity and date | policy | draft | stated |
| Computerized-system validation | Documented demonstration that software consistently satisfies its intended use and critical requirements | workflow | draft | observed + stated |
| Legacy evidence | Historical code, schema or documentation that may inform discovery but has no authority over new requirements | governance term | active | selected |
| Project source of truth | Current approved project documentation and decisions from which future specs and implementation must derive | governance term | active | selected |

## Bounded Context Definitions

| Context | Responsibility | In Scope | Out Of Scope | Status |
|---|---|---|---|---|
| Organizations and Access | Organizational identity, units, memberships, permissions and module entitlement | Nutridev, consultancy, company, unit, user membership, scoped access | Commercial pricing calculation and detailed billing implementation | candidate |
| Consultancy Portfolio | Consultancy-company engagement and consultant allocation | portfolio, invitation/connection, allocation, reassignment, removal, effective scope | Company operational ownership and Nutridev contract negotiation | candidate |
| Audit and CAPA | Audit execution through nonconformity closure | checklist execution, findings, evidence, action plans, actions, validation, reopening | General task management unrelated to quality findings | candidate |
| Remediation and Action Management | Source-linked cases, plans, actions, evidence, validation and effectiveness across governed origins | typed origin, remediation case, plan revision, action, completion claim, validation decision, effectiveness check | Owning the source workflow or becoming general-purpose task management | partition candidate; first use through Audit/CAPA only |
| Report Issuance and Acknowledgement | Official report version, distribution and company acknowledgement | draft, issuance, versioning, sharing, recipient, acknowledgement | Legal agreement acceptance unless explicitly added later | candidate |
| Document Control | Lifecycle of required company and unit documents | classification, upload, review, homologation, validity, supersession, archive | General-purpose file storage | candidate |
| Regulatory Applicability | Versioned legal and technical source applicability | federal/state/municipal hierarchy, scope and effective period | Automated legal advice or a guarantee of compliance | candidate |
| Quality Analytics | Derived indicators from governed operational records | trends, recurrence, ageing, closure and document status | Editing source records or using untraceable calculations | candidate / later |

## Core Concepts

| Concept | Suggested Meta-Type | Context | Description | Status |
|---|---|---|---|---|
| Consultancy | Entity | Organizations and Access | Organization that owns a consultant team and client portfolio | draft |
| FoodCompany | Entity | Organizations and Access | Company that governs one or more operational units | draft |
| Unit | Entity | Organizations and Access | Operational location belonging to a food company | draft |
| BusinessSegment | Enum / Type | Organizations and Access | Market-level classification used for discovery and product scope, not as the sole applicability input | draft |
| OperatingProfile | Value Object | Organizations and Access | Activities, flows and operational capabilities that refine company or unit applicability | draft |
| UnitRole | Enum / Type | Organizations and Access | Candidate classification of a unit's function within company operations; values require segment discovery | draft |
| Membership | Entity | Organizations and Access | Time-bounded user participation in an organization with capabilities | draft |
| ModuleEntitlement | Entity | Organizations and Access | Nutridev-issued capability grant for organization and scope | draft |
| ConsultancyCompanyEngagement | Entity | Consultancy Portfolio | Relationship between one consultancy and one food company | draft |
| ConsultantAllocation | Entity | Consultancy Portfolio | Time-bounded assignment to whole-company or selected-unit scope | draft |
| AllocationScope | Value Object | Consultancy Portfolio | Company-wide or selected-unit boundary carried by an allocation | draft |
| Audit | Entity | Audit and CAPA | Identity-bearing inspection with actor, target, checklist version and lifecycle | draft |
| ChecklistTemplate | Entity | Audit and CAPA | Versioned source of audit criteria | draft |
| Finding | Entity | Audit and CAPA | Attributable answer or observation linked to an audit criterion | draft |
| Nonconformity | Entity | Audit and CAPA | Nonconforming finding with remediation lifecycle | draft |
| DetectionEvidence | Entity | Audit and CAPA | Evidence linked to the finding that existed at detection time | draft |
| ActionPlan | Entity | Audit and CAPA | Versioned plan for one source-linked remediation case; the first supported case is an audit nonconformity and final cross-origin ownership remains under DD-011 | draft |
| CorrectiveAction | Entity | Audit and CAPA | Assignable action within a plan; cross-origin reuse remains under H9 and DD-011 | draft |
| ResolutionEvidence | Entity | Audit and CAPA | Evidence submitted to support action or case resolution; source-specific evidence rules remain mandatory | draft |
| RemediationCase | Entity | Remediation and Action Management | Source-linked case that may require a plan and preserves its originating context | draft / partition candidate |
| OriginReference | Value Object | Remediation and Action Management | Immutable module, source-record, company/unit scope and trigger reference | draft / partition candidate |
| ValidationDecision | Entity | Remediation and Action Management | Attributable acceptance or rejection by a validator authorized for the source and risk | draft / partition candidate |
| ValidationAuthorityPolicy | Policy | Remediation and Action Management | Selects eligible validators and independence obligations from origin, capability, scope and risk | draft / partition candidate |
| NonconformityLifecycle | State Machine | Audit and CAPA | Open → plan pending/defined → in progress → evidence submitted → validation → closed/reopened | draft |
| AuditWorkflow | Workflow | Audit and CAPA | Coordinates checklist execution, findings, report issuance and follow-up | draft |
| AuditReport | Entity | Report Issuance and Acknowledgement | Versioned report derived from a completed audit | draft |
| ReportVersion | Value Object | Report Issuance and Acknowledgement | Immutable version identifier, digest and issuance metadata | draft |
| ReportAcknowledgement | Entity | Report Issuance and Acknowledgement | Recipient act tied to an exact report version | draft |
| CompanyManifestation | Entity | Report Issuance and Acknowledgement | Optional response or objective correction request linked to an issued version without mutating it | hypothesized |
| ReportLifecycle | State Machine | Report Issuance and Acknowledgement | Draft → issued → shared/awaiting acknowledgement → acknowledged | draft |
| ControlledDocument | Entity | Document Control | Document with identity, version, owner, scope and lifecycle | draft |
| DocumentReview | Entity | Document Control | Attributable homologation or rejection decision | draft |
| DocumentLifecycle | State Machine | Document Control | Draft/received → under review → approved/rejected → expiring/expired → superseded/archived | draft |
| RegulatorySource | Entity | Regulatory Applicability | Versioned source with jurisdiction, provenance and effective period | draft |
| ApplicabilityPolicy | Policy | Regulatory Applicability | Selects sources and criteria for organization/unit/date context | draft |
| QualityIndicator | Calculation | Quality Analytics | Reproducible metric derived from governed records | draft |

## Rules And Policies

| ID | Name | Type | Description | Source | Status |
|---|---|---|---|---|---|
| R-ORG-01 | Independent consultant normalization | invariant | An independent consultant is represented as a consultancy with one consultant | operator | selected |
| R-ORG-02 | Company units | invariant | One food company may own many units | operator + observed repo | selected |
| R-ENG-01 | Consultancy portfolio cardinality | invariant | One consultancy may have many client companies; one company has at most one active consultancy engagement | operator | selected |
| R-ALLOC-01 | Allocation scopes | rule | Consultant allocation supports whole-company and selected-unit scope | operator | selected |
| R-ALLOC-02 | Reallocation history | invariant | Allocation changes end or replace access prospectively without erasing history | inferred from stated need | draft |
| R-MOD-01 | Module authority | policy | Nutridev controls module entitlement; organization administrators control user access within enabled capabilities | operator | selected |
| R-AUD-01 | Authorized audit actor | rule | Consultancy-managed audits are executed by an allocated consultant; direct-company audits are executed by an authorized technical or quality responsible | operator | selected |
| R-AUD-02 | Detection evidence timing | rule | A nonconformity records attributable evidence at detection time | operator | selected |
| R-CAPA-01 | Plan cardinality | invariant | One source-linked remediation case has at most one active action-plan revision and that plan may contain many actions; the first supported case origin is an audit nonconformity | discovery synthesis + operator | draft |
| R-CAPA-02 | Pending-plan allowance | policy | A report may be issued while a nonconformity has `plan pending`, provided responsibility and a definition deadline are recorded | operator + discovery synthesis | selected |
| R-CAPA-03 | Deferred resolution evidence | rule | Resolution evidence may be submitted after the originating audit; unresolved audit cases remain available to later audits, while standalone validation between audits remains under decision | operator | selected / DD-008 open |
| R-CAPA-04 | Role accumulation | policy | One person may execute and validate only when the origin/risk authority policy permits; the acts remain separately attributable and any absence of segregation is recorded | operator | selected principle |
| R-CAPA-05 | Evidence-required closure | rule | A remediation case cannot close without required resolution evidence and an attributable validation decision from an eligible validator | operator + discovery synthesis | selected |
| R-CAPA-06 | Plan follow-up responsibility | rule | The executor of the audit or other originating process initially becomes responsible for following up its resulting plans; reassignment changes current responsibility without changing the immutable authorship of earlier acts | operator | selected |
| R-CAPA-07 | Per-action assignment | rule | Each corrective action has its own authorized responsible user, deadline, status and evidence, independently assignable and reassignable within the relevant company or unit scope | operator | selected |
| R-CAPA-08 | Default validator snapshot | policy | A new plan may receive a company- or unit-scoped default validator only if eligible under its origin/risk authority policy; replacement on an open plan cannot rewrite completed validation history | operator + discovery synthesis | selected principle |
| R-CAPA-09 | Origin lineage | invariant | Every remediation case and plan preserves an immutable reference to the originating module, record, company/unit scope and trigger | operator + synthesis | selected principle |
| R-CAPA-10 | Audit carry-forward | rule | Open audit-originated cases are referenced in later audits within the applicable scope until accepted closure; they are not copied into or erased by the later audit | operator + synthesis | selected |
| R-CAPA-11 | Distinct remediation clocks | policy | Plan-definition deadline, each action due date and validation target are distinct policy inputs selected by origin, class and risk | synthesis | draft |
| R-REP-01 | Issuance immutability | invariant | Issuing a report freezes an immutable version; later information creates another version or addendum | discovery synthesis | selected |
| R-REP-02 | Sharing boundary | rule | Only an issued report version may be shared for formal company acknowledgement, and sharing grants authorized access before acknowledgement | discovery synthesis + operator | selected |
| R-REP-03 | Formal company acknowledgement | rule | Sharing an issued consultancy report requests attributable acknowledgement by an authorized company representative | operator | selected |
| R-REP-04 | Acknowledgement semantics | policy | Acknowledgement proves attributable awareness and receipt of an exact version; it does not mean agreement, approval, admission of responsibility or technical validation by the recipient | operator + synthesis | selected |
| R-REP-05 | Separate manifestation | policy | Any future company response or technical-correction request is a separate, non-suspensive act that cannot mutate or annul the issued report | synthesis | hypothesized / DD-010 open |
| R-DOC-01 | Current-document rule | rule | Only a valid and appropriately approved document may be presented as current | operator | draft |
| R-REG-01 | Jurisdiction applicability | policy | Applicability evaluation considers federal, São Paulo state and São Paulo municipal sources through competence, scope, specificity, effective period, revocation and coexistence rather than a simplistic linear precedence | operator + synthesis | selected principle |
| R-REG-02 | Progressive module mapping | policy | Shared source governance is centralized, while each module maps requirements to its activities, capabilities and operating profiles during discovery | operator + synthesis | selected principle |
| R-VAL-01 | Risk-based validation | policy | Validation rigor is proportional to intended use, criticality and complexity | Anvisa guide + operator | selected |
| R-VAL-02 | Context-specific authority | policy | Eligible executor, accountable person, validator and effectiveness verifier are selected by process, capability, scope and risk rather than job title alone | operator + synthesis | selected principle |
| R-GOV-01 | Source-of-truth boundary | invariant | Current project docs and selected decisions govern; `_legacy` is evidence only | operator | selected |

## External Interfaces

| Interface | Purpose | Owner | Dependency Type | Status |
|---|---|---|---|---|
| Consultant workspace | Portfolio, allocations, audit execution and private consultancy work | Nutridev / consultancy | user-facing | candidate |
| Company workspace | Company/unit governance, shared artifacts, action follow-up and documents | Nutridev / food company | user-facing | candidate |
| Formal acknowledgement surface | Present exact report version and record authenticated company acknowledgement | Nutridev / company recipient | user-facing | candidate |
| Company manifestation surface | Submit an optional response or objective correction request separately from acknowledgement | Nutridev / company recipient | user-facing | deferred / DD-010 |
| Remediation portfolio | Present source-linked cases and actions without erasing origin-specific policy | Nutridev / consultancy / company | user-facing | partition candidate / DD-011 |
| Regulatory source registry | Maintain provenance, jurisdiction, version and effective periods | Nutridev | internal | candidate |
| Notification channel | Notify assignments, pending plans, document expiry and acknowledgement requests | Nutridev | partner / infra | deferred |

## Metrics And Definitions

| Metric | Definition | Decision It Supports | Status |
|---|---|---|---|
| Report lead time | Time from audit completion to report issuance | Whether the first slice increases delivery agility | draft |
| Plan-definition lead time | Time from nonconformity creation to first complete action-plan revision | Whether pending-plan flexibility creates harmful backlog | draft |
| Action ageing | Time a corrective action remains in a non-terminal state | Prioritization and escalation policy | draft |
| Closure lead time | Time from nonconformity creation to accepted closure | Follow-up effectiveness | draft |
| Acknowledgement rate | Issued and shared reports acknowledged within an agreed window divided by reports requesting acknowledgement | Value and friction of formal acknowledgement | draft |
| Finding recurrence rate | Closed findings that recur in a later comparable audit divided by closed findings checked | Need for effectiveness verification | draft |
| Document currency rate | Required controlled documents both valid and approved divided by required documents | Value of Document Control | draft |
| Portfolio activation | Client companies with at least one meaningful governed action in a period per consultant | Consultant-channel scalability | draft |

## Ambiguities To Resolve

| Topic | Why Ambiguous | Resolution Needed |
|---|---|---|
| Electronic-acknowledgement assurance | An authenticated and auditable act is selected, but legal assurance, identity evidence and provider remain open | Targeted legal/technical research before specifying the acknowledgement interface |
| Company manifestation | Acknowledgement is receipt rather than agreement, but an objective error or contextual evidence may require a separate response | Decide whether a non-suspensive correction/request path belongs in the first slice |
| Closure outside a later audit | The consultant is eligible and open plans surface later, but waiting for another audit may delay legitimate closure | Decide whether an authorized standalone follow-up may validate evidence independently |
| Remediation deadlines | Carry-forward does not define when a plan, action or validation becomes overdue | Define separate plan-definition, action-due and validation-target policies by origin/class/risk |
| Cross-origin remediation ownership | Shared concepts may support many sources, but premature generalization may create generic task management | Run EX-10 before selecting shared-context or source-owned-plan architecture |
| Shared-artifact retention | New operations stop at relationship termination, but artifact-specific access and legal retention vary | Define export, retention period, visibility and provenance rules per artifact class |
| Validation authority and segregation | Context-specific authority is selected, but small customers and critical cases need fallback rules | Run EX-11 and classify required independence, warnings, justification and reassignment |
| Effectiveness verification | Class/risk-based verification is selected, but thresholds and observation windows are unknown | Determine required evidence and timing for each source class |
| Regulatory-source interaction | Sources may differ by competence, scope, specificity, effective period, revocation or coexistence | Use EX-12 to research conflicts and cumulative applicability for the São Paulo pilot |
