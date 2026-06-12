---
tags:
  - feature/uan
---

---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


# Domain: UAN (Unidade de Alimentação e Nutrição)

Responsável pelo planejamento nutricional, gestão de fichas técnicas e elaboração de cardápios otimizados.

## Concept Registry

| ID | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `uan.FichaTecnica` | Ficha Técnica | Entity | Composição detalhada de um prato, incluindo ingredientes, per capita e custos. |
| `uan.Cardapio` | Cardápio | Aggregate | Planejamento de refeições para um período específico. |
| `uan.OpcaoCardapio` | Opção de Cardápio | Value Object | Prato específico selecionado para um dia/refeição no cardápio. |
| `uan.ListaCompras` | Lista de Compras | Entity | Consolidação de insumos necessários para executar um cardápio. |
| `uan.Planejamento` | Planejamento Automatizado | Operation | Processo de geração de cardápios via algoritmo NSGA-II. |

## Relationships

- `uan.Cardapio` **contains** `uan.OpcaoCardapio`
- `uan.OpcaoCardapio` **references** `uan.FichaTecnica`
- `uan.FichaTecnica` **contains** `ingredientes.Ingrediente`
- `uan.ListaCompras` **derives-from** `uan.Cardapio`
- `uan.Planejamento` **optimizes** `uan.Cardapio`
- `uan.Planejamento` **enforces** `financeiro.Orcamento` (via Custo Médio Ponderado)

## States: uan.Cardapio

- `DRAFT`: Planejamento em edição.
- `OPTIMIZING`: Sendo processado pelo motor NSGA-II.
- `PUBLISHED`: Aprovado e visível para produção.
- `ARCHIVED`: Histórico de períodos passados.
