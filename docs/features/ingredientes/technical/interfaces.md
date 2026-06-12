---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: interfaces
status: brownfield-translated
evidence: observed
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

# Interfaces — Ingredientes

## API Interfaces

### Supabase Direct (BaaS-First)

> Não há API REST separada. O frontend consome o Supabase diretamente via `supabaseClient`.

| Operation | Method | Table | Filter | Evidence |
|---|---|---|---|---|
| List | `SELECT *` | `ingredientes` | `.or(cliente_id.eq.{tenant}, cliente_id.is.null).is(deleted_at, null).order(nome)` | `page.tsx:67-71` |
| Create | `INSERT` | `ingredientes` | — | `QuickIngredienteDialog.tsx:183` |
| Update | `UPDATE` | `ingredientes` | `.eq(id, id)` | Editor page |
| Soft Delete | `UPDATE` | `ingredientes` | `.eq(id, id)` → `SET deleted_at` | `page.tsx:92` |
| Link Alergênicos | `INSERT` | `ingrediente_alergenicos` | — | `QuickIngredienteDialog.tsx:189-190` |
| List Alergênicos | `SELECT *` | `anvisa_alergenicos` | `.order(nome)` | `QuickIngredienteDialog.tsx:83` |
| List Grupos | `SELECT id, nome` | `grupos_produto` | `.eq(cliente_id, activeClientId).order(nome)` | `QuickIngredienteDialog.tsx:86-89` |
| Create Grupo | `INSERT` | `grupos_produto` | — | `QuickIngredienteDialog.tsx:154` |

### Edge Functions (Downstream)

| Function | Role | Relationship |
|---|---|---|
| `calcular-nutrientes` | Lê dados do ingrediente para cálculos de rotulagem | queries Ingrediente |
| `calcular-cardapio-uan` | Lê dados para cálculo de lista de compras | queries Ingrediente |

## UI Interfaces

### Listagem (`app/ingredientes/page.tsx`)

| Element | Type | Behavior |
|---|---|---|
| Search | TextField com debounce implícito | Filtro local por `nome` e `fonte` |
| Filtro Incompletos | Toggle button | Filtra `energia_kcal IS NULL` |
| Chips | Indicadores visuais | "Cadastro Incompleto" (warning), "Transgênico", "Sistema" vs "Próprio" |
| Tabela | MUI Table com hover | Colunas: Nome, Classificação, Origem, Energia, Alergênicos, Ações |
| Ações | IconButtons | Editar (todos), Excluir (apenas se `cliente_id !== null`) |

### Editor (`app/ingredientes/[id]/editar/page.tsx`)

| Section | Fields | Behavior |
|---|---|---|
| Dados Básicos | Nome, Tipo, Grupo, Classificação NOVA | Tipo condiciona visibilidade de GMO |
| Info Nutricional | 40+ campos (macros + micros) | Per 100g, acordeões colapsáveis |
| Alergênicos | Autocomplete múltiplo | Tabela ANVISA |
| Transgênicos | Checkbox + campos textuais | Condicional: oculto se ADITIVO |
| Fornecedor | `declaracao_ingredientes_fornecedor` | Habilitado se COMPOSTO |

### Quick Dialog (`components/QuickIngredienteDialog.tsx`)

| Feature | Detail |
|---|---|
| Purpose | Cadastro rápido inline usado por fichas técnicas |
| Tabs | Identificação / Nutricional / Alergênicos |
| Default Type | Hardcoded `COMPOSTO` |
| Category | Autocomplete com opção "Adicionar nova" |
| Material Support | Redireciona para `materiais` se categoria ≠ ALIMENTOS |
