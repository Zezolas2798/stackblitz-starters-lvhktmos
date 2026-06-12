---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# States: UAN

Máquinas de estado para as entidades do módulo UAN.

## Cardápio State Machine

| From | Event | To | Condition |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `START_OPTIMIZATION` | `OPTIMIZING` | Requisitos nutricionais definidos. |
| `OPTIMIZING` | `SOLVER_SUCCESS` | `DRAFT` | Resultados retornados com sucesso. |
| `DRAFT` | `PUBLISH` | `PUBLISHED` | Aprovado pelo nutricionista. |
| `PUBLISHED` | `ARCHIVE` | `ARCHIVED` | Fim do período de vigência. |
