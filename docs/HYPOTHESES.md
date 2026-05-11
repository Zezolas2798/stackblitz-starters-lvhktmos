---
id: hypotheses
title: "Hypotheses"
type: hypotheses
status: baseline
created: 2026-05-10
---

# Hypotheses

> Explicit assumptions that must be validated. Each hypothesis is falsifiable and has a clear disconfirming condition.

| ID | Hypothesis | Evidence Type | Disconfirming Condition | Status |
|---|---|---|---|---|
| H-001 | O modelo BaaS-First com Supabase escala para 100+ tenants sem degradação | Load test | Latência P95 > 2s com 100 tenants simultâneos | untested |
| H-002 | RLS por unidade garante isolamento completo de dados operacionais | Security audit | Qualquer query cross-tenant retorna dados | untested |
| H-003 | Edge Functions Deno suportam cálculos nutricionais complexos sem timeout | Production metrics | Timeout > 10s para receitas com 50+ ingredientes | partially-validated |
| H-004 | O registry de conceitos cobre 100% das entidades implementadas | Brownfield audit | Entidade encontrada no código sem entrada no registry | untested |
| H-005 | A taxonomia Food Tech (com Legislação como meta-tipo) captura todos os conceitos regulatórios | Domain review | Conceito regulatório que não se encaixa em nenhum meta-tipo | untested |
| H-006 | Fichas Técnicas UAN com composição auto-calculada reduzem tempo de cadastro em 60% | User testing | Tempo de cadastro > 40% do baseline manual | untested |
| H-007 | O módulo de cardápios UAN gera lista de compras com precisão de ±5% do real | Production data | Desvio > 10% entre lista gerada e compra efetiva | untested |
