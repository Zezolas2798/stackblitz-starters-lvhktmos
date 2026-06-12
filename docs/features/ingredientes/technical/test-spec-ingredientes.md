---
tags:
  - feature/ingredientes
feature: ingredientes
aspect: test-spec
status: derived
derived-from: operations.md + states.md
created: 2026-05-10
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-ingredientes]]

---



# TEST-SPEC — Ingredientes

> Especificação de testes derivados das regras de negócio documentadas. Cada teste tem rastreabilidade para a rule/policy de origem.

## Unit Tests

### T-ING-001 — RegraGMOAditivo: campos GMO limpos para ADITIVO

| Aspect | Detail |
|---|---|
| **Rule** | `RegraGMOAditivo` |
| **Input** | `{ tipo_ingrediente: 'ADITIVO', is_transgenico: true, especie_transgenica: 'Milho', transgenicos: [{especie: 'Milho', doador: 'Bt'}] }` |
| **Expected** | `{ is_transgenico: false, especie_transgenica: null, especie_doadora: null, transgenicos: [] }` |
| **Boundary** | Verificar que tipo `SIMPLES` e `COMPOSTO` NÃO limpam os campos |

### T-ING-002 — RegraGMOCleanup: campos GMO limpos quando `is_transgenico = false`

| Aspect | Detail |
|---|---|
| **Rule** | `RegraGMOCleanup` |
| **Input** | `{ is_transgenico: false, especie_transgenica: 'Soja', especie_doadora: 'Agrobacterium', transgenicos: [{...}] }` |
| **Expected** | `{ especie_transgenica: null, especie_doadora: null, transgenicos: [] }` |
| **Boundary** | `is_transgenico: true` deve preservar todos os campos |

### T-ING-003 — RegraTransgenicosArray: transgenicos é sempre array

| Aspect | Detail |
|---|---|
| **Rule** | `RegraTransgenicosArray` |
| **Inputs** | `null`, `undefined`, `0`, `''`, `'invalid'` |
| **Expected** | `[]` (array vazio) em todos os casos |

### T-ING-004 — CalculoCompletude: ingrediente sem energia é incompleto

| Aspect | Detail |
|---|---|
| **Rule** | `CalculoCompletude` |
| **Cases** | |

| Input `energia_kcal` | Expected `isIncompleto` |
|---|---|
| `null` | `true` |
| `undefined` | `true` |
| `0` | `false` |
| `350.5` | `false` |

### T-ING-005 — PoliticaSoftDelete: delete usa `deleted_at`, nunca `DELETE`

| Aspect | Detail |
|---|---|
| **Policy** | `PoliticaSoftDelete` |
| **Expected** | `handleDelete` chama `.update({ deleted_at })`, nunca `.delete()` |
| **Boundary** | Ingredientes de sistema (`cliente_id === null`) não podem ser deletados |

### T-ING-006 — RegraIsolamentoTenant: query filtra por tenant + sistema

| Aspect | Detail |
|---|---|
| **Policy** | `RegraIsolamentoTenant` |
| **Expected** | Query contém `.or(cliente_id.eq.{tenant}, cliente_id.is.null)` |
| **Boundary** | Ingredientes de outro tenant nunca retornados |

### T-ING-007 — RegraLactoseOmissao: lactose_g null com alergênico Leite dispara CONTÉM LACTOSE

| Aspect | Detail |
|---|---|
| **Rule** | `RegraLactoseOmissao` |
| **Input** | `{ alergenicos: ['Leite'], lactose_g: null }` |
| **Expected** | Declaração "CONTÉM LACTOSE" |
| **Boundary** | `lactose_g: 0` → "NÃO CONTÉM LACTOSE"; `lactose_g: 5.2` → "CONTÉM LACTOSE" |

### T-ING-008 — QuickDialog: ingrediente não-alimentar cria material

| Aspect | Detail |
|---|---|
| **Component** | `QuickIngredienteDialog` |
| **Input** | `categoriaPrincipal: 'EMBALAGENS'` |
| **Expected** | Insert em tabela `materiais`, não em `ingredientes` |

## Integration Tests (Propostos)

### T-ING-INT-001 — RLS cross-tenant isolation

| Aspect | Detail |
|---|---|
| **Test** | Login como Tenant A, criar ingrediente. Login como Tenant B, verificar que não aparece na listagem |
| **Type** | E2E (Playwright ou Supabase test client) |
| **Validates** | H-002 (hipótese de isolamento RLS) |

### T-ING-INT-002 — Cascata de soft delete

| Aspect | Detail |
|---|---|
| **Test** | Soft-delete um ingrediente e verificar que fichas técnicas que o referenciam continuam funcionais |
| **Type** | Integration |

---

## Coverage Matrix

| Rule/Policy | Test ID | Status |
|---|---|---|
| RegraGMOAditivo | T-ING-001 | to-implement |
| RegraGMOCleanup | T-ING-002 | to-implement |
| RegraTransgenicosArray | T-ING-003 | to-implement |
| CalculoCompletude | T-ING-004 | to-implement |
| PoliticaSoftDelete | T-ING-005 | to-implement |
| RegraIsolamentoTenant | T-ING-006 | to-implement |
| RegraLactoseOmissao | T-ING-007 | to-implement |
| QuickDialog material redirect | T-ING-008 | to-implement |
| RLS cross-tenant | T-ING-INT-001 | to-implement |
| Soft delete cascade | T-ING-INT-002 | to-implement |
