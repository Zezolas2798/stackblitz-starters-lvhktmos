---
tags:
  - feature/financeiro
node_type: domain
status: placeholder
created_by: brownfield-translation
created: 2026-05-15
feature: financeiro
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-financeiro]]

---

# Domínio do Módulo Financeiro

Este documento especifica as entidades centrais e agregados do domínio financeiro.

## Aggregates & Entities

### `financeiro.Transacao`
A raiz agregada de qualquer movimentação monetária (previsão ou efetivada).
- `data_competencia`: Define em qual mês/ano a transação impactará o DRE.
- `data_vencimento`: A data de cobrança no fluxo de caixa.
- `valor_total`: Valor bruto consolidado da transação.
- `origem_modulo`: Identifica se a transação nasceu de "ESTOQUE", "VENDAS" ou "MANUAL".

### `financeiro.Lancamento`
Itens dentro de uma transação. Permite o rateio de uma nota fiscal em differentes contas.
- `conta_id`: Vínculo direto ao plano de contas (`financeiro.Conta`).
- `tipo_lancamento`: "CREDITO" ou "DEBITO".
- `valor`: O valor específico desta linha da transação.

### `financeiro.Conta` (Plano de Contas USAR)
A base hierárquica do financeiro.
- `subtipo_usar`: O categorizador crucial (`CUSTO_MAO_DE_OBRA`, `CUSTOS_CONTROLAVEIS`, `CUSTO_OCUPACAO`, `CUSTO_DESPERDICIO`).
- `comportamento_custo`: Fixo ou Variável.

### `financeiro.VendasMensais` & `financeiro.VendasDelivery`
Registros agregados de receita para análise de DRE.

## Value Objects

### `financeiro.TaxConfig`
Estrutura imutável que rege a tributação do mês.

### `financeiro.DreNode`
A estrutura em árvore do relatório DRE para renderização e exportação.

### `financeiro.ABCEntry` & `financeiro.MenuItemEngineering`
Objetos utilitários para análise matemática das vendas (Matriz Kasavana e Pareto).
