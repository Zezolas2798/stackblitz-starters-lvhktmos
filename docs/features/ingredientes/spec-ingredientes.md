---
tags:
  - feature/ingredientes
feature: ingredientes
title: Ingredientes e Matérias-Primas
status: brownfield-translated
translation-mode: brownfield
translation-date: 2026-05-10
brownfield-bootstrapped: true
discovery_source: docs/ingredientes.md + app/ingredientes/ + components/QuickIngredienteDialog.tsx
evidence-confidence: observed
---

# Feature: Ingredientes e Matérias-Primas

> Master Data de insumos alimentares com rastreabilidade nutricional, classificação sanitária e conformidade regulatória ANVISA.

## Aspect Docs

| Aspect | File | Status |
|---|---|---|
| Domain Model | [[domain-ingredientes]] | translated |
| Operations | [[discovery/operations-legacy]] | legacy-discovery |
| States | [[technical/states]] | translated |
| Events | [[technical/events]] | translated |
| Interfaces | [[technical/interfaces]] | translated |
| Queries | [[technical/queries]] | translated |
| Observability | [[technical/observability]] | translated |
| Test Spec | [[technical/test-spec-ingredientes]] | translated |
| UI Architecture | [[technical/ui-architecture]] | translated |
| Rotulagem Spec | [[technical/spec-rotulagem]] | translated |

## Legacy Lineage & Ontology

Esta feature está diretamente ancorada no Global Concept Registry do projeto. O mapeamento abaixo garante a rastreabilidade com a ontologia original e legislações aplicáveis.

| Local Concept | Registry ID | Meta-Type | Origem / Discovery |
|---|---|---|---|
| `Ingrediente` | `ingrediente.Ingrediente` | Entity | [[discovery/ingredientes|discovery/ingredientes.md]] |
| `Alergenico` | `ingrediente.Alergenico` | Value Object | [[discovery/ingredientes|discovery/ingredientes.md]] |
| `GrupoIngrediente` | `ingrediente.GrupoIngrediente` | Entity | [[discovery/ingredientes|discovery/ingredientes.md]] |
| `InfoNutricional` | `ingrediente.InfoNutricional` | Value Object | [[discovery/ingredientes|discovery/ingredientes.md]] |
| `TipoIngrediente` | `ingrediente.TipoIngrediente` | Enum | [[discovery/ingredientes|discovery/ingredientes.md]] |


## Implementation Files (Observed)

| File | Layer | Purpose |
|---|---|---|
| `app/ingredientes/page.tsx` | Interface | Listagem com filtros e busca |
| `app/ingredientes/[id]/editar/page.tsx` | Interface | Editor completo multi-seção |
| `app/ingredientes/novo/page.tsx` | Interface | Criação de novo ingrediente |
| `components/QuickIngredienteDialog.tsx` | Interface | Cadastro rápido inline (usado por fichas técnicas) |
| `components/GerenciarGruposDialog.tsx` | Interface | CRUD de grupos de ingrediente |
| `lib/types.ts` | Domain | Tipos TypeScript (Ingrediente interface) |
| `lib/database.types.ts` | Infrastructure | Tipos gerados do Supabase |

## Cross-Feature Dependencies

| Depends On | Relationship | Evidence |
|---|---|---|
| Supabase Auth (RLS) | `enforced-by` | Query usa `cliente_id` + RLS policies |
| `anvisa_alergenicos` | `queries` | Tabela mestre de alergênicos ANVISA |
| `referencias_nutricionais` | `queries` | Tabelas TACO/TBCA |
| `grupos_produto` | `queries` | Grupos de configuração |

## Depended By

| Feature | Relationship | Evidence |
|---|---|---|
| Receitas / Fichas Técnicas | `contains` via `composicao_receitas` | `ingrediente_id` FK |
| UAN Fichas Técnicas | `contains` via `composicao_fichas_uan` | `ingrediente_id` FK |
| UAN Cardápios | `queries` via edge function | `calcular-cardapio-uan` |
| Estoque / Lotes | `tracks` via `estoque_lotes` | `ingrediente_id` FK |
| Rotulagem | `queries` via edge function | `calcular-nutrientes` |
