---
tags:
  - feature/taxonomia-materiais
node_type: discovery
status: placeholder
created_by: brownfield-translation
created: 2026-05-14
feature: taxonomia-materiais
scope: application
layer: domain
evidence-confidence: observed
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-taxonomia-materiais]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-taxonomia-materiais]]

---



# Discovery: Taxonomia de Materiais por Modalidade

> **Brownfield Translation** — Este documento foi gerado a partir da análise de código existente e pesquisa regulatória. Status `placeholder` até revisão humana.

## Observed Behavior

O sistema atualmente separa insumos em duas tabelas físicas:
- `public.ingredientes` — exclusiva para alimentos (modalidade `ALIMENTOS`)
- `public.materiais` — para todas as demais modalidades (8 tipos)

A tabela `materiais` possui colunas ricas (`material_base`, `capacidade`, `apropriado_alimentos`, `ficha_tecnica`, `especificacoes_adicionais`) que **nunca são coletadas** pela UI. O `QuickMaterialDialog` coleta apenas `nome` e `marca`.

A taxonomia hierárquica (modalidade → grupo → subgrupo) compartilha a tabela `grupos_produto` entre todas as modalidades via coluna `modalidade` (enum `modalidade_produto_enum`), mas a UI não filtra por modalidade ao listar grupos.

## Observed Decisions

- **Polimorfismo no estoque:** `estoque_lotes` usa `ingrediente_id` XOR `material_id` (mutuamente exclusivos, nunca ambos).
- **Enum de modalidades:** 9 valores (`ALIMENTOS`, `EMBALAGENS`, `EPI_EPC`, `LIMPEZA`, `MANUTENCAO`, `UTENSILIOS`, `UNIFORMES`, `PRIMEIROS_SOCORROS`, `OUTROS`).
- **Mapeamento tipo_material:** O `QuickMaterialDialog` traduz a modalidade para `tipo_material` (ex: `EMBALAGENS` → `EMBALAGEM`).
- **JSON flexível:** A coluna `especificacoes_adicionais` (JSONB) já existe na tabela `materiais`.

## Observed Constraints

- Cada modalidade tem requisitos regulatórios distintos (NR-6 para EPI, NBR 14725:2023/FDS para Limpeza, RDC 843/2024 para Embalagens, etc.).
- A tabela `materiais` NÃO possui `subgrupo_id` (diferente de `ingredientes`).
- A coluna `tipo_material` na tabela `materiais` é `text`, não enum tipado.
- O campo `especificacoes_adicionais` é JSONB sem schema enforcement no banco.

## Open Questions for Human Review

1. **Prioridade regulatória:** Quais modalidades devem ter validação obrigatória vs opcional? (Recomendação: EPI e Limpeza como obrigatórias por risco de auditoria)
2. **Migração de dados:** Materiais já cadastrados devem ter `especificacoes_adicionais` retroativamente preenchido?
3. **Subgrupo para materiais:** Implementar `subgrupo_id` na tabela `materiais` para paridade com `ingredientes`?

## Promotion Path

Quando o humano revisar e adicionar intent/rationale, alterar `status: placeholder` → `status: active`.
