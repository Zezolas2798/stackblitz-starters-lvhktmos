---
tags: [ontology, governance]
node_type: constitution
layer: ontology
nature: reference, technical
status: consolidated
version: 1.0.1
last_updated: 2026-04-15
---

# Project Constitution: Governance & Ontology

> Este documento define o **Sistema de Classificação** e os **Metadados de Relacionamento** de todo o projeto. Todos os nós do vault devem seguir estas regras para garantir que o grafo de conhecimento permaneça rastreável e sem contradições.

---

## 1. Connections

| Document | Type | Description |
| :--- | :--- | :--- |
| [[sistema.registry]] | **refines** | A Constituição define as regras e o catálogo de edges usado pelo Registry. |

---

## 2. The Orthogonality Principle

**"A new label or node should only be created if it adds orthogonal information to what already exists."**

Cada documento e cada tag de metadados deve ter um propósito único e não redundante. Se dois documentos se sobrepuserem significativamente, eles devem ser mesclados ou um deve ser subordinado ao outro usando as edges `refines` ou `derives-from`.

---

## 3. Classification System (Frontmatter)

Cada nó carrega até 7 labels. Cada uma responde a uma pergunta diferente:

| Label | Question | Values |
| :--- | :--- | :--- |
| **node_type** | What role does this play? | axiom, premise, constitution, discovery, implementation-plan, spec, audit, conceptual, test, backlog, readme |
| **layer** | What part of the system? | ontology, architecture, market, domain, application |
| **nature** | What is the structural format? | explanatory, procedural, reference, technical |
| **status** | How mature/trusted is it? | draft, exploratory, active, consolidated, evergreen |
| **veracidade** | How much evidence backs it? | high, medium, low |
| **convicção** | How hard are we betting? | high, medium, low |
| **tags** | What are the domain topics? | `#food`, `#anvisa`, `#compliance`, `#iot`, etc. |

---

## 4. Relationship Edge Catalog

Relacionamentos são a "cola" do grafo de conhecimento. Eles são divididos em duas categorias:

### A. Domain Logic Edges (DomainSpec)
Usadas para conectar conceitos de negócio e comportamentos do sistema.

- `performs`: Entity → Operation
- `produces`: Operation → Event
- `enforces`: Rule → Operation
- `calculates`: Calculation → Operation
- `transitions`: Event → State Machine
- `exposes`: Interface → Operation/Query
- `orchestrates`: Workflow → Operation[]
- `applies`: Policy → Operation
- `maps`: Mapping → Entity/Interface
- `contains`: Entity → Value Object
- `queries`: Query → Entity
- `emits`: Entity → Event

### B. Epistemic Edges (Ontology)
Usadas para conectar documentos e alegações intelectuais.

- `resolves`: A resolve o problema em B.
- `derives-from`: A foi motivado por B (link com legislação).
- `implements`: A é o código ou doc que torna B real.
- `validates`: A fornece testes/evidências para B.
- `contradicts`: A tem conflito com B (Crítico para auditorias).
- `supersedes`: A substitui B como nova autoridade.
- `contextualizes`: Informação de fundo não funcional.

---

## 5. Meta-Concept to Design Pattern Mapping

Ao traduzir **Verbos de Domínio** para **Código Fonte**, seguimos os padrões Refactoring.Guru (GoF):

| DomainSpec Meta-Concept | Software Design Pattern |
| :--- | :--- |
| **State Machine** | [State Pattern](https://refactoring.guru/pt-br/design-patterns/state) |
| **Policy** | [Strategy Pattern](https://refactoring.guru/pt-br/design-patterns/strategy) |
| **Operation** | [Command Pattern](https://refactoring.guru/pt-br/design-patterns/command) |
| **Event** | [Observer Pattern](https://refactoring.guru/pt-br/design-patterns/observer) |
| **Rule** | [Specification Pattern](https://github.com/nicolasff/php-specification) |
| **Workflow** | [Saga / Orchestrator](https://microservices.io/patterns/data/saga.html) |
