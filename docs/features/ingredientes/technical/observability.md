---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: observability
status: drafted
created: 2026-05-10
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---



# Observability — Ingredientes

> Métricas, logs e alertas necessários para monitorar a saúde e o uso do módulo de ingredientes em produção.

## Telemetry Points

### 1. Funis de Criação

| Metric | Type | Purpose | Baseline |
|---|---|---|---|
| `ingrediente_creation_started` | Counter | Mede intenção de uso do editor | N/A |
| `ingrediente_creation_completed` | Counter | Mede sucesso (taxa de conversão do editor) | Target: > 80% |
| `ingrediente_quick_creation` | Counter | Mede uso do QuickDialog vs Editor Completo | N/A |

### 2. Uso de Dados Científicos

| Metric | Type | Purpose |
|---|---|---|
| `ingrediente_taco_linked` | Counter | Taxa de adoção da base científica |
| `ingrediente_tbca_linked` | Counter | Taxa de adoção da base científica |
| `ingrediente_incompleto_ratio` | Gauge | Proporção de ingredientes cadastrados sem `energia_kcal` (mede a qualidade do dado inserido pelos tenants) |

### 3. Business Rule Violations (Gaps)

> Como ainda não há validação Server-Side rígida (GAP-GOV-001), precisamos monitorar anomalias na base de dados.

| Alert | Query Condition | Severity |
|---|---|---|
| `Anomaly_Aditivo_GMO` | `tipo_ingrediente = 'ADITIVO' AND is_transgenico = true` | 🔴 High |
| `Anomaly_Lactose_Zero_Leite` | `lactose_g = 0 AND 'Leite' in alergenicos` | 🟡 Warning |

## Audit Logs (GxP)

As seguintes alterações devem gerar entradas em `audit_logs_gxp` (ver GAP-GOV-003):

- Mudança em macros principais (`energia_kcal`, `carboidrato_g`, `proteina_g`, `lipideos_g`)
- Inclusão/Remoção de alergênicos
- Mudança no status `is_transgenico`

## System Performance

- Latência do P95 da query de `fetchIngredientes` (não deve exceder 500ms)
- Tempo de resposta do endpoint que renderiza a busca paginada da base TACO/TBCA
