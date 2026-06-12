---
id: experiment-candidates
title: "Experiment Candidates"
type: experiment-candidates
status: baseline
created: 2026-05-10
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---




# Experiment Candidates

> Validation experiments ordered by information value. Each defines a signal, expected effect, and disconfirming outcome.

| ID | Experiment | Signal | Expected Effect | Disconfirming Outcome | Priority |
|---|---|---|---|---|---|
| E-001 | Brownfield translation do módulo Ingredientes | Feature pack completeness | 100% entidades, rules, calculations traduzidas | > 20% de conceitos sem mapeamento possível | high |
| E-002 | Code tag coverage no módulo Ingredientes | `@biz` tag count vs registry entries | ≥ 80% de calculations/rules/policies taggeadas | < 50% coverage — indica debt de rastreabilidade | high |
| E-003 | Test derivation from spec | Test count derivado | ≥ 1 teste por rule/boundary condition | < 50% das rules sem teste derivável | medium |
| E-004 | Drift detection entre spec e código | Drift audit signals | Zero drift critical signals | > 3 critical drift signals no piloto | medium |
| E-005 | Cardápio UAN — precisão da lista de compras | Desvio compra vs planejado | ±5% para ciclo de 20 dias | > 10% desvio consistente | high |
| E-006 | Performance do cálculo nutricional com receitas complexas | Response time P95 | < 3s para receita com 50 ingredientes | > 5s P95 em produção | medium |
