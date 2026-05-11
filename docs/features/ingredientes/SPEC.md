---
feature: ingredientes
title: "Ingredientes e Matérias-Primas"
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
| Domain Model | [domain.md](domain.md) | translated |
| Operations | [operations.md](operations.md) | translated |
| States | [states.md](states.md) | translated |
| Events | [events.md](events.md) | translated |
| Interfaces | [interfaces.md](interfaces.md) | translated |
| Queries | [queries.md](queries.md) | translated |

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
