---
id: governance-gaps
title: "Governance Gaps — Brownfield Translation"
type: governance-gaps
status: active
created: 2026-05-10
feature-scope: ingredientes
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---




# Governance Gaps

> Lacunas de governança identificadas durante a brownfield translation do módulo Ingredientes. Cada gap tem severidade, impacto e remediação concreta.

## Critical Gaps

### GAP-GOV-001 — Sem validação server-side nas mutações

| Aspect | Detail |
|---|---|
| **Severity** | 🔴 Critical |
| **Description** | Toda validação de regras de negócio (GMO cleanup, array enforcement, completude) acontece **exclusivamente no frontend** (`handleSalvar`). Não há triggers, constraints ou edge functions validando no lado do servidor. |
| **Impact** | Um client malicioso ou chamada direta à API do Supabase pode inserir dados que violam regras de negócio (ex: ingrediente ADITIVO com campos GMO preenchidos) |
| **Remediation** | Criar constraints CHECK no PostgreSQL e/ou trigger `BEFORE INSERT/UPDATE` para `RegraGMOAditivo` e `RegraTransgenicosArray` |
| **DomainSpec Rule** | C5 — Violações críticas devem bloquear no gate mais próximo da persistência |

### GAP-GOV-002 — Soft Delete sem constraint de integridade

| Aspect | Detail |
|---|---|
| **Severity** | 🟡 High |
| **Description** | O soft delete é aplicado via `update({ deleted_at })` no frontend, mas não há `CHECK` constraint ou view que garanta que registros soft-deleted nunca apareçam em joins downstream |
| **Impact** | Fichas técnicas e receitas podem referenciar ingredientes "deletados" se não filtrarem explicitamente |
| **Remediation** | Criar view `ingredientes_ativos` com `WHERE deleted_at IS NULL` e usar nos joins cross-feature |

## High Gaps

### GAP-GOV-003 — Audit trail parcial

| Aspect | Detail |
|---|---|
| **Severity** | 🟡 High |
| **Description** | Embora `created_by`/`updated_by` existam no schema, a `audit_logs_gxp` não é populada para alterações em ingredientes |
| **Impact** | Rastreabilidade GxP incompleta — alterações nutricionais críticas não são logadas com justificativa |
| **Remediation** | Implementar trigger PostgreSQL para INSERT em `audit_logs_gxp` em alterações de campos regulatórios |

### GAP-GOV-004 — RLS não testado formalmente

| Aspect | Detail |
|---|---|
| **Severity** | 🟡 High |
| **Description** | A política RLS é citada nos docs e no código frontend, mas não há testes que validem o isolamento entre tenants |
| **Impact** | H-002 (hipótese de isolamento) permanece sem validação |
| **Remediation** | Criar teste E2E com dois tenants distintos verificando visibilidade cruzada |

## Medium Gaps

### GAP-GOV-005 — Sem code tags `@biz`/`@sys` no código

| Aspect | Detail |
|---|---|
| **Severity** | 🟠 Medium |
| **Description** | Nenhum arquivo do módulo ingredientes possui code tags para rastreabilidade spec→code |
| **Impact** | Impossível executar `domainspec:validate-tags` ou detectar drift automaticamente |
| **Remediation** | Aplicar code tags nas linhas relevantes (Fase 3 deste plano) |

### GAP-GOV-006 — Sem testes derivados de spec

| Aspect | Detail |
|---|---|
| **Severity** | 🟠 Medium |
| **Description** | Nenhum teste unitário valida as regras documentadas (GMO cleanup, lactose omission, completude) |
| **Impact** | Regressões em regras de negócio passam desapercebidas |
| **Remediation** | Derivar TEST-SPEC e implementar testes Vitest (Fase 3 deste plano) |

### GAP-GOV-007 — QuickIngredienteDialog hardcodes `tipo_ingrediente: 'COMPOSTO'`

| Aspect | Detail |
|---|---|
| **Severity** | 🟠 Medium |
| **Description** | O dialog de cadastro rápido sempre cria ingredientes como COMPOSTO, independente do input do usuário |
| **Impact** | Ingredientes simples e aditivos criados via quick dialog terão tipo errado, afetando rotulagem |
| **Remediation** | Adicionar seletor de `tipo_ingrediente` no QuickIngredienteDialog |

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 1 |
| 🟡 High | 3 |
| 🟠 Medium | 3 |
| **Total** | **7** |
