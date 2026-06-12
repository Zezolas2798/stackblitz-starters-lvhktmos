---
tags:
  - feature/estoque
node_type: operations_spec
status: implemented
created: 2026-05-15
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-estoque]]

---

# Operations: Estoque

Este documento cataloga as operações de manipulação, workflows GxP e disparos de processos (triggers de banco de dados) que suportam o domínio de estoque.

## Commands (Mutations)

### `confirmarTodosDaNf` (Logística / Recebimento)
- **Description:** Validação e persistência em *batch* de produtos advindos de OCR fiscal. Insere os registros iniciais nas matrizes do Supabase.
- **Inputs:**
  - `itensConferencia` (Array de lotes propostos contendo destinos e validades).
- **Execution Rules:**
  - Avalia se todos os itens possuem destino preenchido.
  - O lote é consolidado convertendo as caixas / pacotes recebidos em volume padronizado `quantidade_inicial_g_ml`.
  - Gera Lotes Internos automaticamente (ex: `INT-timestamp`) via Client/Trigger se a NF carecer de lote.
  - Finaliza abrindo as instâncias originais no Postgres (`estoque_lotes`).

### `Finalizar Auditoria` (Inventário)
- **Description:** Conclui a consolidação de saldo lógico (esperado) versus saldo físico (conferido).
- **Execution Rules:**
  - Itera através dos `estoque_inventario_itens`.
  - Onde `divergencia_g != 0`, obriga o disparo autônomo de uma nova `estoque_movimentacoes` (tipo `AJUSTE_INVENTARIO`) contra o banco, com a justificativa de auditoria e apontando para o UUID do Lote afetado.
  - Encerra os itens marcando `ajuste_aplicado = true`.

## Triggers & Hooks (Automação de Banco de Dados)

### `trigger_lote_compra_to_ledger`
- **Phase:** Ao inserir um `estoque_lotes`.
- **Logic:** Sincroniza o WMS com o Financeiro. Se houve desembolso, insere registro em `fin_transacoes` de crédito em Fornecedores (Passivo) e débito contra a despesa do Insumo.

### `trigger_estoque_descarte_to_ledger`
- **Phase:** Ao registrar `SAIDA` com justificativa `DESCARTADO`.
- **Logic:** Calcula a perda via Custo Médio e deduz como Custo de Desperdício contábil (afeta CMV no DRE).

### `trigger_atualiza_custo_ingrediente_lotes`
- **Phase:** On Insert/Update `estoque_lotes` (Aprovados).
- **Logic:** Refatora a Média Ponderada para as queries de dashboard, sobrepondo o `custo_medio` na tabela master `ingredientes`.

## Domain Queries (Calculadora de Validade)
- **Logic:** A valoração sanitária (`lib/legislacao/calculadoraValidade`) reage instantaneamente aos parâmetros de entrada cruzando a prioridade local (Municipal vs Estadual vs Federal) para truncar agressivamente uma validade longa de prateleira caso a temperatura informada exija isso. Essa query impede a aprovação de lotes fisicamente vencidos.

## Integration Protocols
- **ZPL Labeling:** `lib/iot/zplGenerator.ts`
  - A impressão da etiqueta no término do check-in extrai de forma transparente o hash do `Lote`, a nomeação do Ingrediente e a Data de Validade calculada, formatando a saída para o protocolo Zebra (ZPL), injetado diretamente contra proxy Bluetooth/Local.
