---
feature: ingredientes
aspect: events
status: brownfield-translated
evidence: hypothesized
---

# Events — Ingredientes

> [!NOTE]
> O módulo Ingredientes **não emite eventos explícitos** atualmente. Não há sistema de pub/sub, event bus, ou webhooks. As "reações" são todas síncronas e acopladas ao frontend.

## Eventos Implícitos (Observados via Side Effects)

| Event | Trigger | Side Effect | Evidence |
|---|---|---|---|
| `IngredienteCriado` | Insert no Supabase | Lista atualizada via `fetchIngredientes()` | `page.tsx:60-80` |
| `IngredienteAtualizado` | Update no Supabase | Redirect para listagem | Editor page |
| `IngredienteSoftDeleted` | Update `deleted_at` | Lista recarregada | `page.tsx:89-98` |
| `AlergenicosVinculados` | Insert em `ingrediente_alergenicos` | Nenhum side effect adicional | `QuickIngredienteDialog.tsx:188-191` |
| `GrupoCriado` | Insert em `grupos_produto` | Autocomplete atualizado | `QuickIngredienteDialog.tsx:153-155` |

## Eventos que Deveriam Existir (Gaps)

> [!WARNING]
> **GAP-EVENTS-001**: A ausência de eventos formais impede:
> - Invalidação de cache de fichas técnicas quando um ingrediente muda
> - Reindexação automática de receitas afetadas por mudanças nutricionais
> - Audit trail automático de alterações em dados regulatórios
>
> **Recomendação**: Implementar triggers PostgreSQL ou Supabase Realtime para eventos críticos como `IngredienteNutricionalAlterado`.
