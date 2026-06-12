---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# Events: UAN

Eventos de domínio disparados pelo módulo UAN.

## Domain Events

- `uan.cardapio.created`: Novo rascunho de cardápio iniciado.
- `uan.cardapio.optimized`: Solver concluiu o processamento.
- `uan.cardapio.published`: Cardápio liberado para produção (dispara reserva de estoque).
- `uan.ficha_tecnica.updated`: Alteração em receita (dispara re-calculo de custos em cardápios DRAFT).
