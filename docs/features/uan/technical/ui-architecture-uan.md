---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# UI Architecture: UAN

Padrões de interface e UX para o módulo UAN.

## Components Hierarchy
- `UanWizard`: Orquestrador da geração de cardápios.
- `FichaTecnicaCard`: Visualização compacta de receitas.
- `OptimizationRadar`: Feedback visual sobre o balanceamento do cardápio.

## Design Patterns
- Uso de `Skeleton` durante o processamento do solver.
- Dialogs modais para edição rápida de ingredientes em fichas.
