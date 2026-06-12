---
tags:
  - feature/estoque
node_type: domain_spec
status: implemented
created: 2026-05-15
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-estoque]]

---

# Domain Model: Estoque

Este documento define a ontologia do módulo de Estoque. A rastreabilidade de insumos conecta a Nota Fiscal ao prato final através de quatro pilares ontológicos.

## Bounded Context: `estoque`

### Entities

#### `estoque_movimentacoes`
- **Definition:** Registro de log transacional imutável que altera fisicamente e logicamente os saldos da aplicação. Dispara triggers financeiros (CMV e Ledger) de forma síncrona.
- **Attributes:**
  - `id`: UUID
  - `unidade_id`: UUID (RLS Identifier)
  - `lote_id`: UUID (Relacionamento com `estoque_lotes`)
  - `tipo`: Enum (`ENTRADA`, `SAIDA`, `TRANSFERENCIA`, `CONSUMO`, `DESCARTE`, `AJUSTE`)
  - `quantidade_g_ml`: Numeric
  - `responsavel_id`: UUID
  - `justificativa`: String
- **Invariant Rules:** 
  - Restrição rígida anti-delete (Append-Only ledger). 
  - O relacionamento com um lote restringe que um lote contendo movimentações jamais seja removido da base.

#### `estoque_inventarios`
- **Definition:** A sessão de auditoria que reconcilia o estado lógico contra o mundo físico.
- **Attributes:**
  - `id`: UUID
  - `unidade_id`: UUID
  - `status`: Enum (`EM_ANDAMENTO`, `FINALIZADO`, `CANCELADO`)
  - `local_estoque_id`: UUID (Opcional, demarca Cycle Counting se preenchido)
- **Invariant Rules:** 
  - Enquanto o status for `EM_ANDAMENTO`, travas otimistas na UI devem desencorajar (ou proibir) que movimentações afetem as contagens daquele escopo simultaneamente.

### Value Objects

#### `estoque_locais`
- **Definition:** A demarcação da prateleira/infraestrutura física (Almoxarifados, Câmaras). Intercepta validações térmicas e sanitárias caso intersecione com equipamentos.
- **Structural Identity:** 
  - `cliente_id`, `unidade_id`, `nome`
  - `tipo_ambiente` (String)
  - `grupos_permitidos_ids` (String[] híbrido: suporta textos abertos de modalidades ou UUIDs estritos para blindagem contra contaminação cruzada)
  - `ativo` (Boolean, para soft-delete inegociável)

#### `estoque_lotes`
- **Definition:** Unidade fundamental da rastreabilidade sanitária e operacional.
- **Structural Identity:** 
  - `numero_lote_fabricante` (String) ou Lote Interno gerado (Formato: `INT-YYYYMMDD-UUID4`)
  - `data_validade_interna` (Timestamp)
  - `quantidade_atual_g_ml` (Numeric)
  - `status` (Enum: `PREVISTO`, `APROVADO`, `VENCIDO`, `USADO`)

## Ubiquitous Language
- **Inventário Cego:** Metodologia onde o conferente da prateleira não enxerga a meta do sistema.
- **Master Data:** Registros que permeiam todo um `cliente_id` (Ingredientes e Locais Básicos).
- **Transaction Data:** Registros que nascem e morrem dentro do escopo isolado de uma `unidade_id` (Movimentações, Lotes de Saldo).
- **Lote Interno:** Entidade autogerada para assegurar identificação de itens recebidos sem lote fiscal do fornecedor.
