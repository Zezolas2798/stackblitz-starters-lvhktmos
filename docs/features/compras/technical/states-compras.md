---
tags:
  - feature/compras
node_type: technical
status: brownfield-translated
created_by: brownfield-translation
created: 2026-05-19
feature: compras
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---

# State Machines: Módulo Compras

## 1. Cotação (Vigência)

```mermaid
stateDiagram-v2
    [*] --> VIGENTE : insert (data_orcamento = today)
    VIGENTE --> DEFASADO : diff(now, data_orcamento) > 7 dias
    DEFASADO --> VIGENTE : novo insert com data_orcamento = today
    VIGENTE --> [*] : hard delete
    DEFASADO --> [*] : hard delete
```

**Notas:**
- Não há campo `status` na tabela — a vigência é calculada no frontend via `differenceInDays()`.
- Múltiplas cotações do mesmo fornecedor/ingrediente coexistem — apenas a mais recente por `data_orcamento` é relevante.

---

## 2. Requisição de Compra (via OP)

```mermaid
stateDiagram-v2
    [*] --> PENDENTE : producao_requisicoes created com FALTA_ESTOQUE
    PENDENTE --> COMPRADO : comprador marca como comprado
    COMPRADO --> [*] : operação concluída
```

**Campo:** `producao_requisicoes.status_compras`
**Transição:** Apenas PENDENTE → COMPRADO (sem rollback no fluxo atual)

---

## 3. Monitoramento UAN

```mermaid
stateDiagram-v2
    [*] --> PENDENTE : cardápio UAN publicado com insumos necessários
    PENDENTE --> COMPRADO : comprador marca via uan_compras_monitoramento
    COMPRADO --> [*]
```

**Campo:** `uan_compras_monitoramento.status_compras`
**Transição:** Upsert com `status_compras = 'COMPRADO'`

---

## 4. Lote de Estoque (criado por Compras)

```mermaid
stateDiagram-v2
    [*] --> PREVISTO : NF lançada por Compras
    PREVISTO --> QUARENTENA : check-in físico pelo Estoque
    QUARENTENA --> APROVADO : inspeção de recebimento OK
    QUARENTENA --> REJEITADO : inspeção reprovada
    APROVADO --> VENCIDO : validade expirada
    APROVADO --> CONSUMIDO : movimentação baixa saldo para zero
```

**Campo:** `estoque_lotes.status`
**Nota:** Compras **apenas cria** lotes no estado PREVISTO. A transição PREVISTO → QUARENTENA → APROVADO é responsabilidade do módulo Estoque/Qualidade.

---

## 5. Fornecedor (Homologação)

```mermaid
stateDiagram-v2
    [*] --> PENDENTE : cadastro inicial (via PreCadastroFornecedorDialog)
    PENDENTE --> APROVADO : homologação concluída
    APROVADO --> BLOQUEADO : restrição sanitária ou comercial
    BLOQUEADO --> APROVADO : reabilitação
    APROVADO --> [*] : soft delete
    PENDENTE --> [*] : soft delete
```

**Campo:** `fornecedores.status_homologacao`
**Nota:** Fornecedor BLOQUEADO deveria ser excluído de novas cotações (regra de negócio não 100% implementada no frontend).

---

## 6. Transação Financeira (criada por Compras)

```mermaid
stateDiagram-v2
    [*] --> ABERTO : NF lançada gera fin_transacoes
    ABERTO --> PAGO : conciliação bancária (módulo Financeiro)
    ABERTO --> CANCELADO : exclusão da NF (apenas lotes sofrem delete)
```

**Nota:** A exclusão de NF faz soft delete nos lotes mas **não remove** a `fin_transacoes` correspondente — gap identificado.
