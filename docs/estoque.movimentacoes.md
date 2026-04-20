---
id: estoque.Movimentacao
titulo: "Movimentações e Integração Financeira"
tipo: technical
modulo: estoque
status: auditado
layer: application
nature: specification
veracidade: high
convicção: high
ultima_revisao: 2026-04-20
tags:
  - evento/movimentacao
  - financeiro/cmv
  - contabil/ledger
  - policy/gxp
edges:
  - referenciada_por: "[[modulo.estoque]]"
  - regula: "[[financeiro]]"
---

# Movimentações e Integração Financeira

Este documento descreve como o sistema registra fluxos de entrada e saída, e como esses eventos disparam automações contábeis e financeiras (CMV).

---

## 1. Regras de Negócio (Business Logic)

### 1.1. Tipos de Movimentação
Toda alteração física no saldo de um lote deve ser tipificada para fins de auditoria:

| Tipo | Natureza | Descrição | Impacto Financeiro |
|------|----------|-----------|--------------------|
| **ENTRADA** | Positiva | Compra de fornecedor ou devolução. | Gera Contas a Pagar / Ativo |
| **SAIDA** | Negativa | Baixa manual por consumo ou devolução ao fornecedor. | - |
| **TRANSFERENCIA**| Neutra | Movimentação entre locais (Ex: De Depósito A para Cozinha). | - |
| **CONSUMO** | Negativa | Baixa automática via requisição de Produção. | Gera Custo de Venda (CMV) |
| **DESCARTE** | Negativa | Baixa por vencimento ou avaria. | Gera Custo de Desperdício |
| **AJUSTE** | Híbrida | Resultado de reconciliação via Inventário. | Gera Ajuste Patrimonial |

### 1.2. Rastreabilidade de Responsabilidade
Toda movimentação grava o `responsavel_id` (UUID do usuário logado) e uma `justificativa`, garantindo a integridade GxP do fluxo.

### 1.3. Custo Médio Ponderado (CMP)
O sistema não usa custo fixo. O custo de um ingrediente é a média ponderada de todos os lotes ativos, atualizada instantaneamente a cada nova entrada.

---

## 2. Implementação Técnica (How it Works)

### 2.1. Tabela: `estoque_movimentacoes`
Centraliza todos os eventos de estoque.
- **Isolamento:** Filtrada via RLS pela coluna `unidade_id`.
- **Integridade:** FK para `lote_id`. Impede a exclusão de lotes que possuam movimentações.

### 2.2. Automação Financeira (Triggers)
O sistema utiliza **Postgres Triggers** para garantir que a logística e o financeiro andem sincronizados, sem intervenção manual.

#### A. Entrada de Compra (`trigger_lote_compra_to_ledger`)
Ao inserir um novo lote em `estoque_lotes` com valor financeiro:
1. Cria uma transação em `fin_transacoes`.
2. Realiza um lançamento de **CRÉDITO** no Passivo (Fornecedores).
3. Realiza um lançamento de **DÉBITO** na conta de Despesa/Insumo correspondente (Alimentos, Limpeza, etc).

#### B. Descarte de Estoque (`trigger_estoque_descarte_to_ledger`)
Ao registrar uma `SAIDA` com justificativa contendo `DESCARTADO` em `estoque_movimentacoes`:
1. Calcula o custo da perda (Qtd Movimentada * Preço Unitário do Lote).
2. Gera uma transação de débito automático na conta de `CUSTO_DESPERDICIO`.

### 2.3. Cálculo de Custo Médio
Implementado via `trigger_atualiza_custo_ingrediente_lotes`.
1. Soma o `valor_total` de todos os lotes do ingrediente (`status = 'APROVADO'`).
2. Divide pela soma das `quantidade_atual_g_ml`.
3. Atualiza as colunas `custo_medio` e `preco_ultima_compra` na tabela `ingredientes`.

---

## 3. Segurança e Audit Log
- **Imutabilidade:** Aplicamos uma restrição lógica onde o `DELETE` em `estoque_movimentacoes` é bloqueado no banco (RLS restrict ou Trigger), permitindo apenas inserções de estorno.
- **Audit GxP:** Todas as movimentações são espelhadas em um log de auditoria via `trigger_audit_log_gxp`.

