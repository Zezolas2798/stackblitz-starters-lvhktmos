---
tags:
  - feature/compras
node_type: domain
status: brownfield-translated
created_by: brownfield-translation
created: 2026-05-15
updated: 2026-05-19
feature: compras
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---

# Domínio do Módulo Compras e Suprimentos

> Discovery Source: [`discovery/brownfield-orcamentos.md`](../discovery/brownfield-orcamentos.md), [`discovery/brownfield-lancamentos.md`](../discovery/brownfield-lancamentos.md), [`discovery/brownfield-planejamento.md`](../discovery/brownfield-planejamento.md).

Este documento especifica todas as entidades, agregados e value objects do domínio de Compras.

---

## Aggregates & Entities

### `compras.Cotacao`

**Tabela:** `compras_orcamentos`

Entidade de fronteira que armazena a matriz de cotações de preços (R$/Kg/L) atualizada por fornecedor. Atua como registro do preço vigente oferecido pelo fornecedor para um determinado ingrediente.

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | UUID | NOT NULL | PK, `gen_random_uuid()` |
| `cliente_id` | UUID FK → `clientes` | NOT NULL | Tenant (RLS) |
| `unidade_id` | UUID FK → `cliente_unidades` | NOT NULL | Unidade operacional |
| `fornecedor_id` | UUID FK → `fornecedores` | NOT NULL | Quem forneceu o preço |
| `ingrediente_id` | UUID FK → `ingredientes` | NOT NULL | O que está sendo precificado |
| `data_orcamento` | DATE | NOT NULL | Data base da cotação (default: `CURRENT_DATE`) |
| `is_embalagem` | BOOLEAN | YES | Se a compra é por embalagem fechada |
| `unidades_por_embalagem` | NUMERIC | YES | Qtd de unidades no volume (se embalagem) |
| `peso_volume_por_unidade` | NUMERIC | YES | Peso líquido de cada unidade (Kg ou L) |
| `preco_embalagem` | NUMERIC | YES | Preço total do volume fechado (R$) |
| `preco_por_kg_l` | NUMERIC | NOT NULL | **Preço normalizado** (R$/Kg ou R$/L) |
| `created_at` | TIMESTAMPTZ | YES | Timestamp de criação |

**Key Constraints:**
- Esta tabela é o **analytical layer** para cotações de mercado.
- O `preco_por_kg_l` é SEMPRE o preço final normalizado — mesmo quando a compra é por embalagem, o sistema calcula: `preco_por_kg_l = preco_embalagem / (unidades_por_embalagem × peso_volume_por_unidade)`.
- Permite a criação do "CMV Projetado" no módulo Financeiro e serve de base para validação algorítmica de custos (NSGA-II) no módulo UAN.

**Invariantes:**
1. `preco_por_kg_l > 0`
2. Se `is_embalagem = true`, então `unidades_por_embalagem`, `peso_volume_por_unidade` e `preco_embalagem` devem ser preenchidos.
3. Cotações com `data_orcamento` anterior a 7 dias são classificadas como "Defasadas" (regra de UI, não constraint de banco).

> [!WARNING] Gap Identificado
> A tabela referencia apenas `ingrediente_id`. Para materiais não-alimentares (limpeza, EPI, etc.), será necessário adicionar um campo `material_id` FK → `materiais` ou uma chave universal de produto.

---

### `compras.CampanhaCotacao`

**Tabela:** `compras_campanhas`

Agregado raiz para o Planejamento de Cotações. Representa uma "Cesta" de demanda gerada a partir do cruzamento de Requisições da Produção/UAN subtraídas do Estoque atual, mais inserções manuais.

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | UUID | NOT NULL | PK, `gen_random_uuid()` |
| `cliente_id` | UUID FK → `clientes` | NOT NULL | Tenant (RLS) |
| `unidade_id` | UUID FK → `cliente_unidades` | NOT NULL | Unidade operacional |
| `status` | VARCHAR | NOT NULL | `'RASCUNHO'`, `'ENVIADA'`, `'CONCLUIDA'` |
| `data_criacao` | TIMESTAMPTZ | NOT NULL | Data de criação da campanha |
| `itens_cesta` | JSONB | NOT NULL | Lista de itens (ingredientes/materiais) e suas quantidades demandadas |
| `created_by` | UUID FK → `auth.users` | NOT NULL | Usuário que iniciou |

**Invariantes:**
1. A transição de status segue rigorosamente: `RASCUNHO` -> `ENVIADA` -> `CONCLUIDA`.
2. O JSONB `itens_cesta` deve conter a identificação do insumo e a quantidade alvo.

---

### `compras.CampanhaFornecedor`

**Tabela:** `compras_campanha_fornecedor`

Entidade que representa o envio de um fragmento da `CampanhaCotacao` para um fornecedor específico. Contém o "Link Mágico" gerado para acesso externo.

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | UUID | NOT NULL | PK |
| `campanha_id` | UUID FK → `compras_campanhas` | NOT NULL | Campanha pai |
| `fornecedor_id` | UUID FK → `fornecedores` | NOT NULL | O fornecedor segmentado |
| `token_acesso` | UUID | NOT NULL | Token seguro para acesso público via URL |
| `status` | VARCHAR | NOT NULL | `'AGUARDANDO'`, `'RESPONDIDO'`, `'EXPIRADO'` |
| `itens_solicitados` | JSONB | NOT NULL | Subconjunto da cesta que este fornecedor atende |
| `data_envio` | TIMESTAMPTZ | YES | Quando o WhatsApp foi acionado |
| `data_resposta` | TIMESTAMPTZ | YES | Quando o fornecedor salvou no portal |

**Key Constraints:**
- `token_acesso` deve ter constraint UNIQUE para roteamento na web pública.
- A intersecção dos `itens_solicitados` deve obedecer às restrições de `grupos_fornecidos` e `itens_fornecidos` da entidade `suprimentos.Fornecedor`.

---

### `suprimentos.Fornecedor`

**Tabela:** `fornecedores`

Entidade compartilhada entre Compras, Estoque e Qualidade. Armazena cadastro completo do fornecedor com dimensões logísticas, comerciais e sanitárias.

| Campo | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | UUID | NOT NULL | PK |
| `cliente_id` | UUID FK → `clientes` | NOT NULL | Tenant (RLS) |
| `razao_social` | TEXT | NOT NULL | Nome jurídico |
| `nome_fantasia` | TEXT | YES | Nome comercial |
| `cnpj` | TEXT | NOT NULL | Identificação fiscal |
| `licenca_sanitaria_numero` | TEXT | YES | Nº da licença sanitária (VISA) |
| `licenca_sanitaria_validade` | DATE | YES | Validade da licença |
| `status_homologacao` | TEXT | YES | `'PENDENTE'` → `'APROVADO'` → `'BLOQUEADO'` |
| `contato_qualidade_nome` | TEXT | YES | Responsável técnico |
| `contato_qualidade_email` | TEXT | YES | Email do responsável |
| `endereco_completo` | TEXT | YES | Endereço |
| `telefone` | TEXT | YES | Telefone |
| `email` | TEXT | YES | Email geral |
| `cnae_principal` | TEXT | YES | CNAE principal (via ReceitaWS) |
| `cnaes_secundarios` | JSONB | YES | CNAEs secundários |
| `situacao_cadastral` | TEXT | YES | Situação na Receita Federal |
| `categorias_compras` | TEXT[] | YES | Modalidades atendidas (`['ALIMENTOS', 'LIMPEZA']`) |
| `tipo` | TEXT | YES | `'FORNECEDOR'` (default) |
| **Campos Logísticos:** | | | |
| `lead_time_dias` | INTEGER | YES | Dias entre pedido e entrega (default: 0) |
| `frequencia_entrega` | VARCHAR | YES | Frequência de entrega |
| `lote_minimo_pedido` | NUMERIC | YES | Lote mínimo em Kg/L (default: 0) |
| `dia_semana_entrega` | TEXT[] | YES | Dias da semana para entrega |
| `prazo_pagamento_dias` | INTEGER | YES | Prazo em dias (default: 30) → impacta Contas a Pagar |
| **Campos de Vinculação:** | | | |
| `grupos_fornecidos` | UUID[] | YES | IDs de `grupos_produto` que o fornecedor atende |
| `subgrupos_fornecidos` | UUID[] | YES | IDs de `subgrupos_produto` |
| `itens_fornecidos` | UUID[] | YES | IDs específicos de `ingredientes` |
| `equipamentos_vinculados` | UUID[] | YES | IDs de `equipamentos` (para manutenção) |
| `setores_vinculados` | UUID[] | YES | IDs de `setores` |
| `pasta_documentos_id` | UUID FK → `documentos_pastas` | YES | Pasta de documentos (GED) |
| **Auditoria:** | | | |
| `created_at` | TIMESTAMPTZ | YES | |
| `updated_at` | TIMESTAMPTZ | YES | |
| `created_by` | UUID FK → `auth.users` | YES | |
| `updated_by` | UUID | YES | |
| `deleted_at` | TIMESTAMPTZ | YES | Soft delete |

**Key Constraints:**
- Fornecedor é uma entidade **cross-domain** — Compras gerencia o cadastro, mas Estoque e Qualidade consomem.
- O campo `categorias_compras[]` segmenta os fornecedores no Quadro Comparativo por modalidade.
- A lógica de **granularidade de fornecimento** (3 níveis) é implementada no frontend:
  - **Nível 1 (Atacadista):** Apenas `categorias_compras` preenchido → atende tudo naquela modalidade.
  - **Nível 2 (Grupo):** `grupos_fornecidos` preenchido → atende categorias específicas.
  - **Nível 3 (Item):** `itens_fornecidos` preenchido → atende ingredientes individuais.

**Invariantes:**
1. `cnpj` deve ser válido (14 dígitos).
2. `status_homologacao` é o guardião sanitário — fornecedor BLOQUEADO não deve aparecer em novas cotações.

---

## Bridge Tables (Managed by Compras)

### `producao_requisicoes` — campos gerenciados por Compras

| Campo | Descrição |
|---|---|
| `status_compras` | VARCHAR `'PENDENTE'` → `'COMPRADO'` |
| `comprado_em` | TIMESTAMPTZ — quando o comprador marcou como adquirido |

### `uan_compras_monitoramento` — tracking de compras UAN

| Campo | Tipo | Descrição |
|---|---|---|
| `cardapio_id` | UUID FK → `cardapios_uan` | Cardápio de referência |
| `ingrediente_id` | UUID FK → `ingredientes` | Insumo monitorado |
| `quantidade_comprada` | NUMERIC | Kg já adquiridos |
| `status_compras` | VARCHAR | `'PENDENTE'` → `'COMPRADO'` |

### `uan_cardapio_insumos_config` — margem de erro por insumo

| Campo | Tipo | Descrição |
|---|---|---|
| `cardapio_id` | UUID FK → `cardapios_uan` | Cardápio |
| `ingrediente_id` | UUID FK → `ingredientes` | Insumo |
| `margem_erro` | NUMERIC | % de margem de segurança individual |

---

## Value Objects

### `compras.MatrizKraljic`

Ferramenta analítica aplicada às cotações para classificar o risco de fornecimento:

| Quadrante | Risco Fornecimento | Impacto Lucro | Ação |
|---|---|---|---|
| **Alavancagem** | Baixo | Alto | Negociar agressivamente |
| **Estratégico** | Alto | Alto | Parcerias de longo prazo |
| **Rotineiro** | Baixo | Baixo | Automatizar compras |
| **Gargalo** | Alto | Baixo | Diversificar fornecedores |

**Implementação Observada:**
```
matriz = 'ROTINEIRO' (default)
if (escassez === 'ALTA' && leadTimeAlto) → 'GARGALO'
if (escassez === 'BAIXA' && !leadTimeAlto) → 'ALAVANCAGEM'
if (escassez === 'ALTA' && !leadTimeAlto) → 'ESTRATEGICO'

escassez = qtdFornecedoresDoItem <= 1 ? 'ALTA' : 'BAIXA'
leadTimeAlto = leadTime > 3 dias
```

### `compras.ParLevel`

Nível ideal de ressuprimento calculado para cada insumo:

```
ParLevel = (consumo_medio_diario × dias_cobertura) + estoque_minimo
Sugestão de Compra = max(0, ParLevel - estoque_atual)
```

### `compras.ConversaoEmbalagem`

Value object que normaliza preços de embalagens para a unidade base (Kg/L):

```
volume_total = unidades_por_embalagem × peso_volume_por_unidade
preco_por_kg_l = preco_embalagem / volume_total
```

---

## Enums

### `status_lote_estoque` (usado pelo Bridge com Estoque)
- `QUARENTENA` — Aguardando inspeção
- `APROVADO` — Liberado para uso
- `REJEITADO` — Devolvido ao fornecedor
- `VENCIDO` — Expirado
- `PREVISTO` — Lançado por NF, aguardando recebimento físico (default quando Compras cria)

### `fin_modulo_origem` (usado pelo Bridge com Financeiro)
- `ESTOQUE` — Origem usada quando Compras gera transação financeira via lançamento de NF

### `status_homologacao` (fornecedores)
- `PENDENTE` → `APROVADO` → `BLOQUEADO`
