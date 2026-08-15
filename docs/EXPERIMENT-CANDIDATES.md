---
tags: [experiments, product-discovery, audit-capa, consultant-channel]
node_type: discovery
layer: market
nature: procedural
status: exploratory
version: 0.3.0
last_updated: 2026-08-14
---

# Experiment Candidates

These are bounded discovery studies, not implementation tasks. EX-1 and EX-6 have initial founder evidence available; EX-9 is authorized. No experiment is complete, and thresholds remain initial decision rules to refine before broader recruitment.

## Candidate Register

| ID | Hypothesis | Intervention | Primary Signal | Cost | Priority | State |
|---|---|---|---|---|---|---|
| EX-1 | H2 | Shadow current audits from preparation through report delivery | Baseline audit-to-report time and rework map | low | now | evidence intake |
| EX-2 | H2, H3 | Walk through a low-fidelity Audit/CAPA prototype with real scenarios | End-to-end completion without invented data or external workaround | medium | now | proposed |
| EX-3 | H3 | Simulate pending-plan follow-up across two visits | Plans defined on time without delaying report issuance | low | now | proposed |
| EX-4 | H4 | Run a dual-workspace sharing and termination tabletop | Correct access decisions across private/shared states | low | now | proposed |
| EX-5 | H5 | Test report acknowledgement wording and flow with company recipients | Correct understanding and completion of acknowledgement | low | now | proposed |
| EX-6 | H6 | Interview target companies about concurrent consultancy relationships | Frequency of simultaneous-consultancy need | low | now | partial founder evidence |
| EX-7 | H1 | Concierge pilot with consultants managing several companies | Connected companies with meaningful shared activity | medium | later | proposed |
| EX-8 | H7 | Concierge document-control pilot after audit baseline | Required documents kept current and actively reviewed | medium | later | proposed |
| EX-9 | H8 | Build and review a validation applicability matrix for the first slice | Critical requirements mapped to proportionate evidence | medium | now | authorized |
| EX-10 | H9 | Compare remediation cases from multiple originating processes | Common contract preserves source-specific rules | low | now | proposed |
| EX-11 | H10 | Run a role/risk validation-authority tabletop and adversarial Robot-Talk | Consistent authority decisions across representative scenarios | low | now | proposed |
| EX-12 | PD-038, DD-007 | Build a module-scoped regulatory-applicability matrix | Applicable sources traced by activity, profile, jurisdiction and effective period | medium | now | proposed |

## Candidate Details

### EX-1 — Audit-to-Report Baseline Shadowing

- Linked hypothesis: H2.
- Decision owner: Nutridev product owner.
- Business question: Which steps actually consume time and which part of Audit/CAPA should be designed first?
- Intervention: Observe at least three real consultant workflows without changing them, from visit preparation through report delivery and first follow-up.
- Target segment or scope: At least one commercial food-service client and one institutional kitchen or catering operation in São Paulo.
- Duration or observation window: One complete workflow per observed audit.
- Primary signal: Median elapsed and active work time from audit start to report delivery.
- Secondary signals: Duplicate entry count, tools used, handoffs, missing evidence, report revisions and delayed decisions.
- Expected effect: A reliable baseline and a ranked friction map that supports or challenges Audit/CAPA as the first slice.
- Disconfirming outcome: Most costly friction lies outside Audit/CAPA or cannot be improved without a different upstream module.
- Risks: Observation bias, confidential records and atypical pilot clients.
- Preconditions: Lawful access or consent, provenance review, data-minimization rules and a standard observation sheet.
- Minimum instrumentation needed: Timestamped activity log and artifact inventory.
- Current evidence intake: The founder identified FoodChecker audit material from prior professional practice and audit/report/export experiments in `_legacy`. The first available case is an event-venue operation, and the founder acted as consultant. No files or measurements have been ingested yet.
- Recommended next step: receive and inventory the examples, confirm their permitted use, then select at least three workflows and one additional initial segment for measurement.

### EX-2 — End-to-End Audit/CAPA Scenario Test

- Linked hypothesis: H2 and H3.
- Decision owner: Audit/CAPA owner.
- Business question: Can the proposed slice support a real audit without forcing false completeness?
- Intervention: Use a low-fidelity prototype or structured paper flow covering checklist selection, finding, detection evidence, nonconformity, pending/defined plan, actions, report issuance, sharing and later closure.
- Target segment or scope: Five consultants or quality professionals using recent anonymized cases.
- Duration or observation window: One moderated session per participant plus a short follow-up.
- Primary signal: Participants complete the scenario without external spreadsheets, invented plan details or facilitator correction.
- Secondary signals: Time per stage, terminology errors, omitted responsibilities and requested shortcuts.
- Expected effect: At least four of five participants complete the critical path and correctly distinguish detection from resolution evidence.
- Disconfirming outcome: Participants cannot map their real workflow, or Document Control repeatedly displaces Audit/CAPA as the necessary starting point.
- Risks: Prototype fidelity may hide field constraints.
- Preconditions: Agreed definitions and at least two representative scenarios.
- Minimum instrumentation needed: Task checklist, timing and structured error notes.
- Recommended next step: refine after EX-1, then run.

### EX-3 — Pending-Plan Longitudinal Simulation

- Linked hypothesis: H3.
- Decision owner: Audit/CAPA owner.
- Business question: Does `plan pending` accelerate reporting without creating forgotten remediation?
- Intervention: For recent nonconformities, issue a simulated report with owner and plan-definition deadline, then observe follow-up through a subsequent audit.
- Target segment or scope: Ten to twenty findings across at least three consultant-company relationships.
- Duration or observation window: Long enough to include the agreed plan-definition window and one follow-up checkpoint.
- Primary signal: Percentage of pending plans completely defined within the agreed period.
- Secondary signals: Report lead time, reminders required, overdue age and actions added per plan.
- Expected effect: Report lead time decreases while at least 80% of plans are defined within the pilot window.
- Disconfirming outcome: More than 30% remain overdue or participants enter placeholder actions only to clear the state.
- Risks: Arbitrary deadline, small sample and facilitator reminders stronger than future product behavior.
- Preconditions: Working definition of complete plan and pilot escalation rule.
- Minimum instrumentation needed: Finding, owner, deadline, version and transition timestamps.
- Current decision input: An unresolved audit-originated plan must remain visible in later audits until an authorized validation accepts conclusion. This carry-forward does not replace the still-open plan-definition, action-due and validation-target deadline decisions.
- Recommended next step: run after EX-2 validates the terminology.

### EX-4 — Private/Shared Boundary Tabletop

- Linked hypothesis: H4.
- Decision owner: Nutridev product owner.
- Business question: Can consultancy and company predict access and ownership across sharing and relationship termination?
- Intervention: Present scenarios covering private notes, draft audit, issued report, action evidence, consultant reassignment, company direct conversion and relationship termination.
- Target segment or scope: Pairs or separate representatives from consultancy and food-company perspectives.
- Duration or observation window: One structured workshop round, revised once after discrepancies.
- Primary signal: Percentage of scenarios in which participants independently choose the same expected visibility and editing rights.
- Secondary signals: Ownership disputes, retention expectations, export needs and exceptions requested.
- Expected effect: At least 80% agreement on ordinary scenarios and a finite set of explicit policy gaps.
- Disconfirming outcome: Core artifacts require incompatible ownership models or most scenarios need manual exceptions.
- Risks: Participants may answer normatively rather than from actual contracts.
- Preconditions: Neutral scenario cards and no implementation assumptions.
- Minimum instrumentation needed: Decision matrix by actor, artifact, lifecycle state and relationship state.
- Current decision input: Relationship termination blocks new operations while preserving historical authorship and already shared immutable versions. Exact retention periods, export rights and post-termination visibility remain open.
- Recommended next step: run now; use results to complete the artifact-specific parts of DD-005.

### EX-5 — Report Acknowledgement Comprehension Test

- Linked hypothesis: H5.
- Decision owner: Nutridev product owner.
- Business question: Can formal acknowledgement prove receipt without being mistaken for agreement or admission?
- Intervention: Test acknowledgement wording and authenticated interaction flows against one immutable report version, with access available before acknowledgement. Compare no response channel with a separate, non-suspensive company manifestation or technical-correction request.
- Target segment or scope: Owners, managers, technical responsibles and quality responsibles from target companies.
- Duration or observation window: Short moderated usability/comprehension sessions.
- Primary signal: Participants correctly explain what their act means before completing it.
- Secondary signals: Completion rate, hesitation, time, perceived legal risk, objective correction needs and desired response path.
- Expected effect: At least 80% correctly identify the act as receipt of a specific version and complete it without assistance.
- Disconfirming outcome: Participants consistently interpret acknowledgement as agreement, refuse it, or require a separate approval hierarchy.
- Risks: Legal wording tested without legal counsel must not be treated as approved language.
- Preconditions: Selected acknowledgement semantics and candidate manifestation semantics clearly separated.
- Minimum instrumentation needed: Comprehension question, completion event, actor identity and report-version digest.
- Recommended next step: run a product-language test now; legal review before specification.

### EX-6 — Consultancy Cardinality Interview

- Linked hypothesis: H6.
- Decision owner: Nutridev product owner.
- Business question: Is one active consultancy per company a safe first-rollout invariant?
- Intervention: Interview companies and consultants about current and recent relationships, scopes and overlapping providers.
- Target segment or scope: At least ten companies across the three initial segment groups, including multi-unit operations.
- Duration or observation window: One interview round with evidence from real engagements where possible.
- Primary signal: Percentage requiring two or more simultaneous consultancy organizations in the same period.
- Secondary signals: Reasons for overlap, module scope, unit scope and procurement constraints.
- Expected effect: Simultaneous multi-consultancy need is rare and can be deferred without blocking the first rollout.
- Disconfirming outcome: More than a small minority cannot model real engagements under the selected invariant.
- Risks: Convenience sample biased toward the product owner's current network.
- Preconditions: Define “consultancy” separately from multiple consultants and specialist contractors.
- Minimum instrumentation needed: Company segment, units, provider count, scope and overlap period.
- Current evidence intake: The founder has not observed simultaneous consultancies performing the same function. His former consultancy had approximately 20 active clients; examples included clients with five units and an event-venue client with six event units plus a central production unit. Owners or managers normally contracted the service or software.
- Evidence limit: One founder account does not satisfy the target sample and may underrepresent specialist providers, different procurement models or other initial segments.
- Recommended next step: preserve this account as the first interview record, then recruit company-side and additional consultant participants before organization/access specification.

### EX-7 — Consultant-Led Concierge Pilot

- Linked hypothesis: H1.
- Decision owner: Nutridev product owner.
- Business question: Will consultants naturally activate client companies when Nutridev solves their operational work?
- Intervention: Provide the validated Audit/CAPA workflow to a small consultant cohort and manually support company connection and report sharing.
- Target segment or scope: Three to five consultants with multiple active client companies.
- Duration or observation window: Enough for at least two real service cycles per consultant.
- Primary signal: Connected companies with at least one shared report acknowledgement or action interaction.
- Secondary signals: Invitations sent, companies returning independently, consultant retention and support effort.
- Expected effect: A majority of active consultants connect at least two real companies without Nutridev directly selling each connection.
- Disconfirming outcome: Consultants use private workflow only, require Nutridev to sell every company, or avoid sharing through the platform.
- Risks: Founder-led support and incentives may overstate scalable behavior.
- Preconditions: EX-2 through EX-5 critical findings resolved and privacy/consent terms ready.
- Minimum instrumentation needed: Consultant, company, invitation, sharing, acknowledgement and follow-up events.
- Recommended next step: later, after the first workflow is testable.

### EX-8 — Document-Control Concierge Pilot

- Linked hypothesis: H7.
- Decision owner: Document Control owner.
- Business question: Does document control produce recurring value beyond reminders and file storage?
- Intervention: Manually establish required-document inventories, validity, review status and renewal alerts for pilot companies.
- Target segment or scope: Companies already participating in the Audit/CAPA pilot.
- Duration or observation window: One or more meaningful document-renewal cycles.
- Primary signal: Required documents reviewed, renewed or homologated through the pilot process.
- Secondary signals: Expired-document reduction, weekly return, missing requirement discovery and manual support load.
- Expected effect: Participants repeatedly use status and review information and identify measurable risk prevented by the workflow.
- Disconfirming outcome: A cloud folder plus calendar reminder satisfies the need at materially lower complexity.
- Risks: Short observation windows may not include enough expiries.
- Preconditions: Stable document definitions and a bounded São Paulo requirement set.
- Minimum instrumentation needed: Requirement, document, version, status, validity, reviewer and transition history.
- Recommended next step: later, after Audit/CAPA baseline learning.

### EX-9 — Validation Applicability Matrix Review

- Linked hypothesis: H8.
- Decision owner: quality governance and technical owners.
- Business question: Which computerized-system validation practices are justified for the first slice?
- Intervention: Map intended use and each critical Audit/CAPA/report capability to risk, requirement, verification evidence, change impact and non-applicable guide sections.
- Target segment or scope: Audit records, evidence, permissions, plans, validation decisions, report versions and acknowledgement.
- Duration or observation window: One draft and one independent review round before implementation planning.
- Primary signal: Percentage of critical requirements with an accepted requirement-to-test evidence path.
- Secondary signals: Unjustified controls removed, open risks, review disagreements and estimated maintenance cost.
- Expected effect: All critical records have proportionate evidence obligations, while low-risk UI preferences remain outside formal validation scope.
- Disconfirming outcome: The matrix cannot distinguish criticality or simply copies pharmaceutical controls without Nutridev-specific rationale.
- Risks: Using the local 2010 guide as if it were the current or directly applicable authority.
- Preconditions: Controlled source for Guide 33/2020, intended-use statement and criticality criteria.
- Minimum instrumentation needed: Versioned applicability matrix with source, requirement, risk, evidence and reviewer.
- Authorization: Approved by the Nutridev product owner on 2026-08-14. Authorization covers source verification, intended-use and criticality drafts, the matrix draft and one independent review round; it is not evidence of validation or compliance.
- Recommended next step: start controlled-source verification and draft the intended-use statement; complete the reviewed matrix before the first feature implementation plan.

### EX-10 — Multi-Origin Remediation Tabletop

- Linked hypothesis: H9.
- Decision owner: Nutridev product owner and action-management owner.
- Business question: Which remediation concepts are genuinely shared, and which must remain owned by the originating process?
- Intervention: Model representative cases originating from an audit nonconformity, temperature deviation, failed operational-cleaning checklist and workplace-accident record. Compare a shared remediation context with source-owned plans exposed through a common portfolio.
- Target segment or scope: Founder cases followed by review with at least one consultant and one company-side quality or operational authority.
- Duration or observation window: One modeling round, one adversarial review and one revised comparison.
- Primary signal: Every case preserves origin, scope, evidence and authority without inventing generic states or losing source-specific rules.
- Secondary signals: Shared fields, incompatible states, deadline types, escalation needs, validator candidates and effectiveness obligations.
- Expected effect: A minimal common contract emerges while origin-specific policies remain explicit.
- Disconfirming outcome: The proposed common model becomes generic task management or requires conditional branches for nearly every field and transition.
- Risks: Designing future modules from imagined rather than observed workflows, especially workplace-accident handling.
- Preconditions: Representative scenarios labeled as observed, stated or hypothetical; no future module promoted into the first slice.
- Minimum instrumentation needed: Origin, source record, trigger, scope, plan-definition deadline, action deadline, validation target, evidence, authority and terminal-state matrix.
- Recommended next step: prepare after the current decision review; run before assigning bounded-context ownership to action plans.

### EX-11 — Validation Authority and Segregation Tabletop

- Linked hypothesis: H10.
- Decision owner: quality governance owner and source-module owners.
- Business question: Who may execute, answer for, validate and verify effectiveness in each process and risk class?
- Intervention: Present scenarios varying origin, risk, organization size, unit scope and available roles. Run a structured authority matrix followed by an adversarial Robot-Talk to search for conflicts and unsafe self-validation.
- Target segment or scope: Audit follow-up and operational-cleaning checklist first; temperature and other origins only as clearly labeled candidate cases.
- Duration or observation window: One internal model, one adversarial round and later field review with relevant professionals.
- Primary signal: Participants consistently distinguish executor, accountable person, validator and effectiveness verifier and agree on fallback when independence is unavailable.
- Secondary signals: Required independence, warnings, justification, reassignment, rejection consequences and authority misconfiguration risks.
- Expected effect: A small policy based on capability, scope, origin and risk replaces fixed job-title assumptions.
- Disconfirming outcome: Most cases require manual exceptions or participants cannot agree on who has authority.
- Risks: Treating job titles as universal authority or treating a Robot-Talk result as field validation.
- Preconditions: Role definitions, representative scenarios and explicit distinction between completion claim and accepted validation.
- Minimum instrumentation needed: Scenario-by-role authority matrix, rationale, disagreement log and counterexamples.
- Recommended next step: run the internal tabletop before closure-validation rules; obtain external review before implementation.

### EX-12 — Module Regulatory Applicability Matrix

- Linked decision: PD-038 and DD-007.
- Decision owner: regulatory-applicability and source-module owners.
- Business question: Can each module derive applicable requirements from official, versioned sources without assuming a simplistic federal-state-municipal precedence chain?
- Intervention: For one Audit/CAPA capability and one selected operating profile, map activity, jurisdiction, competence, scope, specificity, effective period, revocation or coexistence and the resulting product rule.
- Target segment or scope: City of São Paulo pilot; expand only when a new module or operating profile enters discovery.
- Duration or observation window: One bounded matrix and one independent domain review per module slice.
- Primary signal: Every product rule traces to controlled sources and an explicit applicability rationale.
- Secondary signals: Conflicts, cumulative obligations, superseded sources, unresolved interpretation and maintenance cost.
- Expected effect: Shared source governance supports progressive module discovery without pretending all laws are modeled upfront.
- Disconfirming outcome: Rules depend on uncited summaries, linear hierarchy assumptions or sources whose effective status cannot be established.
- Risks: Legal interpretation beyond product competence and source drift.
- Preconditions: Official-source verification, effective-date recording and escalation of unresolved interpretation to qualified review.
- Minimum instrumentation needed: Source, version, jurisdiction, competence, scope, effective period, relationship to other sources, requirement and affected capability.
- Recommended next step: align with EX-9 source verification and execute first for the Audit/CAPA specification boundary.

## Sequencing Notes

1. Run EX-1 and EX-6 first because they can invalidate the slice or organization model cheaply.
2. Use EX-1 evidence to refine EX-2; do not build a high-fidelity product before the end-to-end scenario works.
3. Run EX-3, EX-4 and EX-5 against the same semantic baseline so results remain comparable.
4. Prepare EX-9 in parallel with discovery, but do not confuse source review with a claim of compliance.
5. Run EX-7 only after the sharing and acknowledgement boundary is safe enough for real company data.
6. Introduce EX-8 after the first Audit/CAPA cycle so Document Control can be compared against observed retention needs.
7. Record baselines before interventions and avoid overlapping incentives that hide attribution.
8. Use EX-10 before deciding whether remediation becomes a shared bounded context; do not generalize from names alone.
9. Run the internal part of EX-11 before closure-validation rules and treat professional field review as a separate evidence gate.
10. Start EX-12 with the Audit/CAPA slice and one operating profile; add matrices progressively as modules enter discovery.

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-08-14 | Recorded founder inputs for EX-1 and EX-6 and product-owner authorization for EX-9 | Codex with Nutridev product owner |
| 2026-08-14 | Added EX-10 through EX-12 for multi-origin remediation, validation authority and progressive regulatory applicability | Codex with Nutridev product owner |
