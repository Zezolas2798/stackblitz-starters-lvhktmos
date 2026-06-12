---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# Test Spec: UAN

Plano de testes para validação das regras de negócio UAN.

## Unit Tests
- `math.calculateNDpCal`: Validação da fórmula de densidade proteica.
- `logic.applyCorrectionFactor`: Precisão do cálculo de custo líquido.

## Integration Tests
- `flow.generateMenu`: Fluxo completo do Wizard até o banco de dados.
- `edge.solverIntegration`: Comunicação entre frontend e Supabase Functions.
