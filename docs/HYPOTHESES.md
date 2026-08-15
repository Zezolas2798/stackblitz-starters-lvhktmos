---
tags: [hypotheses, product-discovery, consultant-channel, quality-management]
node_type: discovery
layer: market
nature: explanatory
status: exploratory
version: 0.3.0
last_updated: 2026-08-14
---

# Hypotheses

## Hypothesis Register

| ID | Proposition | Expected Effect | Confidence | Status |
|---|---|---|---|---|
| H1 | Consultants who gain immediate operational value will introduce Nutridev to client companies | Organic company activation through consultant portfolios | medium | evidence gathering |
| H2 | Audit/CAPA is the smallest coherent first slice with enough recurring value to change consultant behavior | Faster deliverables and repeat use across visits | medium | evidence gathering |
| H3 | Allowing a report to be issued with an explicit pending plan reduces delivery delay without creating an uncontrolled backlog | Lower report lead time while preserving treatment accountability | medium | proposed |
| H4 | A shared artifact boundary reduces duplicate entry while preserving trust between consultancy and company | More collaboration and fewer parallel records | medium | proposed |
| H5 | Formal company acknowledgement of an exact report version improves accountability more than it adds friction | Provable receipt and clearer follow-up ownership | medium | proposed |
| H6 | Most initial target companies can be modeled with one active consultancy relationship | Simpler access and engagement governance without excluding common cases | low–medium | evidence gathering |
| H7 | Document Control is the strongest second slice after Audit/CAPA | Higher recurring engagement and fewer expired/unapproved documents | medium | proposed |
| H8 | Risk-based validation of critical records increases trust without imposing pharmaceutical-grade ceremony on the whole product | Fewer integrity defects with acceptable delivery cost | medium | proposed |
| H9 | A common remediation model can serve multiple originating processes without erasing their distinct rules | One governed remediation portfolio with source-specific behavior | medium | proposed |
| H10 | Validation authority selected by process, role, scope and risk produces more reliable outcomes than one universal validator rule | Clear accountability with proportionate independence | medium | proposed |

## Hypothesis Details

### H1 — Consultant-Led Channel

- Proposition: If consultants receive clear time-saving value before a company subscription is required, they will connect multiple client companies and expose those companies to Nutridev.
- Decision owner: Nutridev product owner.
- Primary signal: connected companies with meaningful activity per active consultant.
- Expected direction: improve.
- Current evidence: founder experience in a consultancy with approximately 20 active clients and a stated pattern in which an owner or manager contracted the consultancy or software; no measured Nutridev acquisition data.
- Evidence type: stated + hypothesized.
- Why this might be true: consultants repeatedly execute similar workflows across a portfolio and directly influence the tools visible to their clients.
- Strongest counterargument: consultants may resist a platform that increases company visibility, threatens their differentiation or appears to turn them into unpaid sales representatives.
- Confounders: discounts, personal relationship with the founder and unusually digital pilot consultants.
- Disconfirming outcome: pilot consultants use private features but do not connect clients or share issued reports through Nutridev.
- Scope notes: commercial food service, institutional kitchens and events/catering; not specialized segments.

### H2 — Audit/CAPA As The Entry Wedge

- Proposition: If Nutridev supports the complete audit-to-follow-up workflow, consultants will use it in consecutive visits instead of reverting to paper, spreadsheets and manually assembled reports.
- Decision owner: Nutridev product owner and Audit/CAPA owner.
- Primary signal: percentage of pilot consultants completing a second real audit through the same workflow.
- Expected direction: improve.
- Current evidence: the founder reports executing audits in FoodChecker, compiling data in Excel for analysis and later testing audit reports and data exports in the Nutridev legacy project. Example artifacts are available but have not yet been inventoried or measured.
- Evidence type: stated + observed + hypothesized.
- Why this might be true: the slice combines field capture, reporting and follow-up, addressing both immediate work and later obligations.
- Strongest counterargument: document control may be more frequent, simpler and more valuable than structured audit execution.
- Confounders: checklist quality, mobile usability, connectivity and consultant familiarity with existing templates.
- Disconfirming outcome: consultants complete reports faster outside Nutridev or repeatedly request document alerts before using the audit workflow again.
- Scope notes: first product slice only; it does not validate the full suite.

### H3 — Pending Plan Without Delayed Report

- Proposition: If a nonconformity may be marked `plan pending` with an owner and definition deadline, consultants will issue reports sooner without materially increasing overdue treatment.
- Decision owner: Audit/CAPA owner.
- Primary signal: report lead time paired with percentage of pending plans defined within the agreed window.
- Expected direction: reduce report time and stabilize overdue backlog.
- Current evidence: the product owner states that unresolved audit plans must remain visible in later audits until the consultant records an accepted conclusion; legacy records included pending plan status. This supports continuity but does not establish deadline policy.
- Evidence type: stated + observed + hypothesized.
- Why this might be true: a consultant need not invent a remediation plan during fieldwork, and accountability remains visible.
- Strongest counterargument: “pending” may become a convenient terminal state and transfer hidden work to later visits.
- Confounders: deadline length, reminder behavior, action ownership and audit frequency.
- Disconfirming outcome: report time improves but a material share of plans remains undefined past the agreed deadline.
- Scope notes: pending plan is not the same as a defined but unexecuted action.

### H4 — Shared Artifact Boundary

- Proposition: If consultancy-private work and explicitly shared company artifacts are visibly separated, both parties will collaborate in one system without maintaining duplicate official records.
- Decision owner: Nutridev product owner.
- Primary signal: percentage of issued artifacts consumed or acted on by both organizations without manual re-entry.
- Expected direction: improve.
- Current evidence: stated desired model; old tenancy documentation used a parent-child structure that does not test this boundary.
- Evidence type: stated + hypothesized.
- Why this might be true: provenance and access are clearer when sharing is an explicit act rather than inherited visibility.
- Strongest counterargument: the parties may disagree about ownership, editing rights or continued access after the engagement ends.
- Confounders: contract language, company digital maturity and consultant trust.
- Disconfirming outcome: pilots export and resend artifacts outside Nutridev or require inconsistent ownership exceptions.
- Scope notes: new operations stop after relationship termination and historical shared versions remain preserved; exact retention periods, export rights and visibility remain unresolved.

### H5 — Formal Report Acknowledgement

- Proposition: If an authorized company representative can acknowledge the exact issued report version with a low-friction electronic act, report receipt and follow-up responsibility will become clearer.
- Decision owner: Nutridev product owner and company quality authority.
- Primary signal: acknowledgement completion within the agreed window.
- Expected direction: improve.
- Current evidence: explicit product-owner decision that sharing grants report access and the recipient's authenticated act records awareness/receipt rather than agreement; legacy report displayed an auditor signature but not a governed company acknowledgement lifecycle.
- Evidence type: stated + observed + hypothesized.
- Why this might be true: the system can prove which version was received, by whom and when.
- Strongest counterargument: recipients may perceive acknowledgement as legal agreement and avoid signing.
- Confounders: wording, authentication method, mobile flow and internal company authority.
- Disconfirming outcome: acknowledgement rates remain low or signing does not reduce disputes and follow-up ambiguity.
- Scope notes: acknowledgement is selected as awareness and receipt of an exact version, not agreement. Whether a separate audited-party manifestation belongs in the first slice remains open.

### H6 — One Active Consultancy Per Company

- Proposition: For the initial segments, a company normally has one principal food consultancy even when several consultants from that consultancy serve different units.
- Decision owner: Nutridev product owner.
- Primary signal: percentage of interviewed target companies requiring simultaneous relationships with different consultancies.
- Expected direction: reveal.
- Current evidence: the founder has not observed a company hiring two consultancies for the same function at the same time. His former consultancy had approximately 20 active clients, including multi-unit clients and an event-venue operation with six event units plus a central production unit. This is one non-independent account and does not yet test distinct specialist scopes.
- Evidence type: stated + hypothesized; independent evidence pending.
- Why this might be true: the principal consultancy commonly coordinates the quality scope and assigns its own team.
- Strongest counterargument: companies may hire separate consultancies for regulatory, labeling, training or unit-specific scopes.
- Confounders: company size, geography and procurement model.
- Disconfirming outcome: a meaningful share of target companies cannot represent their real operation without simultaneous consultancy relationships.
- Scope notes: the selected one-active-consultancy rule may be revised if this hypothesis fails.

The current evidence increases plausibility but does not complete EX-6. Interviews must distinguish a second consultancy performing the same function from specialist providers operating under different scopes.

### H7 — Document Control As Second Slice

- Proposition: After Audit/CAPA, controlled-document validity and homologation will create the strongest recurring reason for companies and consultants to return.
- Decision owner: Nutridev product owner and Document Control owner.
- Primary signal: weekly accounts reviewing, renewing or homologating required documents.
- Expected direction: improve.
- Current evidence: operator prioritization and legacy document-screen evidence; no measured workflow demand.
- Evidence type: stated + observed + hypothesized.
- Why this might be true: document expiry is continuous, visible and directly related to inspection readiness.
- Strongest counterargument: reminders alone may be a commodity and insufficient for willingness to pay.
- Confounders: number of documents, renewal frequency and existing cloud-drive practices.
- Disconfirming outcome: users ignore document status after initial setup or prefer external storage plus calendar reminders.
- Scope notes: full document authoring is not assumed; control and evidence come first.

### H8 — Proportional System Validation

- Proposition: If validation rigor is concentrated on critical quality records and state transitions, Nutridev can improve data integrity without making low-risk changes prohibitively expensive.
- Decision owner: technical and quality governance owners.
- Primary signal: critical requirement-to-test traceability coverage paired with validation effort per release.
- Expected direction: improve coverage and stabilize cost.
- Current evidence: Anvisa risk-based guide principles and legacy attempts; product applicability is not yet mapped.
- Evidence type: observed + hypothesized.
- Why this might be true: audit evidence, permissions, reports and closures have materially higher consequence than visual preferences.
- Strongest counterargument: adopting a pharmaceutical guide may create ceremonial documentation without reducing food-service risk.
- Confounders: risk-classification quality, automation and team experience.
- Disconfirming outcome: validation effort grows broadly while critical integrity defects or traceability gaps persist.
- Scope notes: the guide is a voluntary engineering reference, not a compliance claim.

### H9 — Cross-Origin Remediation

- Proposition: If every remediation case preserves a typed origin while sharing a common action vocabulary, Nutridev can present one coherent portfolio without forcing audit, temperature, operational-task and future processes into identical rules.
- Decision owner: Nutridev product owner and action-management owner.
- Primary signal: representative cases from distinct sources can share ownership, action, evidence and history concepts while retaining source-specific deadlines, validation and escalation.
- Expected direction: improve coherence without semantic flattening.
- Current evidence: the product owner expects audit, temperature, operational checklist, workplace-accident and other processes to generate plans with different deadline and validation needs.
- Evidence type: stated + hypothesized.
- Why this might be true: remediation has recurring concepts, but its trigger, authority and risk policy belong to the originating process.
- Strongest counterargument: a shared action context may become generic task management and weaken the source module's invariants.
- Confounders: source diversity, premature generalization and UI pressure for one portfolio.
- Disconfirming outcome: representative origins require incompatible plan lifecycles or lose necessary meaning when mapped to a shared contract.
- Scope notes: only audit-originated remediation is in the first implementation slice.

### H10 — Context-Specific Validation Authority

- Proposition: If validation authority is selected by originating process, role, scope and risk, Nutridev can allow consultant validation where appropriate and require third-party validation where independence matters.
- Decision owner: quality governance owner and each source-module owner.
- Primary signal: domain participants consistently assign executor, accountable person and validator in representative scenarios and correctly predict rejected-validation consequences.
- Expected direction: improve accountability and proportional independence.
- Current evidence: the product owner distinguishes consultant validation in audit follow-up from an operational checklist in which a sector responsible coordinates execution and an owner, manager, technical responsible or consultant validates.
- Evidence type: stated + hypothesized.
- Why this might be true: authority arises from the meaning and risk of the process rather than one global role hierarchy.
- Strongest counterargument: configurable matrices may become too complex, inconsistent or easy to misconfigure.
- Confounders: company size, staffing, risk classification, legal responsibility and terminology differences among segments.
- Disconfirming outcome: participants cannot agree on authority for common scenarios, or exceptions dominate the proposed policy.
- Scope notes: execution and validation must remain separately attributable even when policy allows one person to perform both.

## Prioritization

| Hypothesis ID | Value If True | Cost To Test | Risk If Wrong | Priority |
|---|---|---|---|---|
| H1 | high | medium | high | now |
| H2 | high | medium | high | now |
| H3 | high | low | high | now |
| H4 | high | medium | high | now |
| H5 | medium | low | high | now |
| H6 | medium | low | high | now |
| H7 | high | medium | medium | later |
| H8 | high | medium | high | now |
| H9 | high | low | high | now |
| H10 | high | low | high | now |

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-08-14 | Incorporated founder evidence intake for H1, H2 and H6 without treating it as independent validation | Codex with Nutridev product owner |
| 2026-08-14 | Added cross-origin remediation and context-specific validation-authority hypotheses from the pre-specification review | Codex with Nutridev product owner |
