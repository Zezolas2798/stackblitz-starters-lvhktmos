---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: operations
status: brownfield-translated
evidence: observed
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---



# Operations — Ingredientes

> [!IMPORTANT] Ontology Reference
> These operations implement the business rules and constraints defined in the Discovery Source: [`docs/ingredientes.md`](../../ingredientes.md).

## Mutations

### CreateIngrediente

> Cria um novo ingrediente vinculado ao tenant atual.

| Aspect | Detail |
|---|---|
| **Trigger** | Botão "Novo Ingrediente" ou QuickIngredienteDialog |
| **Actor** | Usuário autenticado com membership no tenant |
| **Pre-conditions** | `nome` não vazio, `activeClientId` presente |
| **Implementation** | `supabase.from('ingredientes').insert(payload)` |
| **Post-conditions** | Registro criado com `cliente_id = activeClientId` |
| **Evidence** | `app/ingredientes/novo/page.tsx`, `QuickIngredienteDialog.tsx:104-201` |

**Business Rules Applied:**

| Rule | Expression | Evidence |
|---|---|---|
| `RegraGMOAditivo` | `SE tipo === 'ADITIVO' → limpar campos GMO` | `QuickIngredienteDialog` hardcodes `tipo_ingrediente: 'COMPOSTO'`; full editor applies rule |
| `PoliticaMultiTenant` | `cliente_id = activeClientId` | Always set on insert |

### UpdateIngrediente

> Atualiza um ingrediente existente.

| Aspect | Detail |
|---|---|
| **Trigger** | Botão "Salvar" no editor |
| **Actor** | Owner do tenant |
| **Pre-conditions** | `ingrediente.cliente_id === tenant` (não pode editar ingredientes de sistema) |
| **Implementation** | `supabase.from('ingredientes').update(payload).eq('id', id)` |
| **Evidence** | `app/ingredientes/[id]/editar/page.tsx` |

**Business Rules Applied (`handleSalvar`):**

| Rule | Expression | When |
|---|---|---|
| `RegraGMOAditivo` | `SE tipo_ingrediente === 'ADITIVO' → is_transgenico=false, especie_transgenica=null, especie_doadora=null, transgenicos=[]` | Before persist |
| `RegraGMOCleanup` | `SE is_transgenico === false → nulificar especie_transgenica, especie_doadora, transgenicos=[]` | Before persist |
| `RegraTransgenicosArray` | `transgenicos é SEMPRE enviado como Array (nunca null/undefined/0)` | Before persist |

### SoftDeleteIngrediente

> Exclusão lógica (GxP — sem DELETE físico).

| Aspect | Detail |
|---|---|
| **Trigger** | Botão "Excluir" na listagem |
| **Actor** | Owner do tenant |
| **Guard** | `ingrediente.cliente_id !== null` (não pode excluir ingredientes de sistema) |
| **Implementation** | `supabase.from('ingredientes').update({ deleted_at: new Date().toISOString() }).eq('id', id)` |
| **Evidence** | `app/ingredientes/page.tsx:89-98` |

### ManageGrupos

> CRUD de grupos de ingrediente (categorias hierárquicas).

| Aspect | Detail |
|---|---|
| **Trigger** | Botão "Gerenciar Grupos" |
| **Implementation** | `GerenciarGruposDialog.tsx` |
| **Evidence** | `components/GerenciarGruposDialog.tsx` |

### LinkAlergenicos

> Vincula alergênicos ANVISA ao ingrediente via tabela pivô.

| Aspect | Detail |
|---|---|
| **Trigger** | Seleção na aba "Alergênicos" do editor |
| **Implementation** | `supabase.from('ingrediente_alergenicos').insert(links)` |
| **Evidence** | `QuickIngredienteDialog.tsx:188-191` |

---

## Calculations

### CalculoCompletude

> Determina se o ingrediente está "Incompleto" — previne somas erradas em fichas técnicas.

| Aspect | Detail |
|---|---|
| **Expression** | `SE (energia_kcal IS NULL OR energia_kcal === undefined) → estado = INCOMPLETO` |
| **Used By** | Listagem (chip visual), filtro "Mostrar Incompletos" |
| **Evidence** | `app/ingredientes/page.tsx:105, 215` |

---

## Rules

### RegraGMOAditivo

| Aspect | Detail |
|---|---|
| **Expression** | `SE tipo_ingrediente === 'ADITIVO' → limpar todos os campos GMO` |
| **Enforces** | `handleSalvar` no editor |
| **Legislation** | Decreto 4680/2003 — aditivos não possuem declaração de transgenia. Referência: [`docs/ingredientes.md`](../../ingredientes.md) |

### RegraLactoseOmissao

| Aspect | Detail |
|---|---|
| **Expression** | `SE alergenico("Leite") E lactose_g IS NULL → "CONTÉM LACTOSE"` |
| **Enforces** | Edge Function `calcular-nutrientes` → `processarDeclaracoes()` |
| **Legislation** | RDC 727/2022, Art. 18 e 19. Referência: [`docs/ingredientes.md`](../../ingredientes.md) |

### RegraIsolamentoTenant

| Aspect | Detail |
|---|---|
| **Expression** | `(cliente_id = {tenantAtual}) OR (cliente_id IS NULL)` |
| **Enforces** | Toda query de listagem e edição |
| **Implementation** | RLS policy + filtro explícito no frontend |
| **Evidence** | `app/ingredientes/page.tsx:67-70` |

---

## Policies

### PoliticaTransgenico

> Contextualizaçäo de transgenia por tipo de ingrediente.

| TipoIngrediente | Comportamento ao Salvar | Comportamento no Rótulo |
|---|---|---|
| `SIMPLES` | Campos GMO persistidos | Nome + sufixo com espécie doadora |
| `COMPOSTO` | Campos GMO persistidos, edição bloqueada | Info já na `declaracao_ingredientes_fornecedor` |
| `ADITIVO` | Campos GMO limpos automaticamente | Nenhuma referência a transgênico |

### PoliticaOrigemNutricional

> Determina a fonte dos dados nutricionais.

| Fonte | Quando | Impacto |
|---|---|---|
| TACO/TBCA | Insumo puro, sem marca | Dados de `referencias_nutricionais` |
| Manual (Fornecedor) | Insumo de marca | Digitação manual do rótulo |
| Override | `referencia_id` presente na composição | Sobrescreve macros no cálculo |

### PoliticaSoftDelete

> Nenhum ingrediente é deletado fisicamente.

| Aspect | Detail |
|---|---|
| **Expression** | `DELETE` → `UPDATE SET deleted_at = NOW()` |
| **Enforces** | Toda listagem filtra por `deleted_at IS NULL` |
| **Legislation** | Compliance GxP — rastreabilidade obrigatória |
