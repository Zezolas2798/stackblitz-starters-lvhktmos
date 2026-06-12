---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: queries
status: brownfield-translated
evidence: observed
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---



# Queries — Ingredientes

## ListIngredientes

> Lista ingredientes do tenant + ingredientes de sistema, excluindo soft-deleted.

| Aspect | Detail |
|---|---|
| **Caller** | `app/ingredientes/page.tsx` |
| **Table** | `ingredientes` |
| **Filter** | `.or(cliente_id.eq.{tenant}, cliente_id.is.null).is(deleted_at, null)` |
| **Order** | `.order('nome')` |
| **Returns** | `Ingrediente[]` |
| **Frontend Filter** | Busca por `nome`/`fonte` + toggle "Incompletos" |
| **Evidence** | `page.tsx:60-80` |

## ListAlergenicosMestre

> Lista todos os alergênicos ANVISA (tabela mestre global).

| Aspect | Detail |
|---|---|
| **Caller** | `QuickIngredienteDialog.tsx` |
| **Table** | `anvisa_alergenicos` |
| **Filter** | Nenhum |
| **Order** | `.order('nome')` |
| **Returns** | `Alergenico[]` |
| **Evidence** | `QuickIngredienteDialog.tsx:83` |

## ListGruposProduto

> Lista grupos de produto do tenant.

| Aspect | Detail |
|---|---|
| **Caller** | `QuickIngredienteDialog.tsx` |
| **Table** | `grupos_produto` |
| **Filter** | `.eq('cliente_id', activeClientId)` |
| **Order** | `.order('nome')` |
| **Returns** | `{ id, nome }[]` |
| **Evidence** | `QuickIngredienteDialog.tsx:86-89` |

## GetIngredienteById

> Carrega ingrediente completo para edição.

| Aspect | Detail |
|---|---|
| **Caller** | `app/ingredientes/[id]/editar/page.tsx` |
| **Table** | `ingredientes` |
| **Filter** | `.eq('id', id).single()` |
| **Returns** | `Ingrediente` |
| **Evidence** | Editor page (inferred) |

## Cross-Feature Queries (Downstream)

| Query | Caller | Table | Join | Purpose |
|---|---|---|---|---|
| Composição de Receita | `composicao_receitas` | `ingredientes` | FK `ingrediente_id` | Monta lista de ingredientes da ficha técnica |
| Composição UAN | `composicao_fichas_uan` | `ingredientes` | FK `ingrediente_id` | Monta composição da ficha UAN |
| Cálculo Nutricional | Edge Function `calcular-nutrientes` | `ingredientes` | Join com composição | Soma ponderada de macros |
| Lista de Compras | Edge Function `calcular-cardapio-uan` | `ingredientes` | Via composição UAN | Necessidade bruta por ingrediente |
