---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# Interfaces: UAN

Definição de contratos e APIs para o módulo UAN.

## Edge Functions

### `calcular-cardapio-uan`
- Endpoint: `POST /functions/v1/calcular-cardapio-uan`
- Auth: Required (JWT)
- Input: `MenuRequirement`
- Output: `OptimizationResult`

## React Hooks
- `useUanCardapio(id)`: Gestão de estado local do cardápio.
- `useFichasTecnicas()`: Listagem e filtros de receitas.
