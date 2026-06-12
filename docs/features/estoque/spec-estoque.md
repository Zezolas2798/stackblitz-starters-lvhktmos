---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---

# Módulo de Estoque (WMS)


## What This Module Owns

A gestão de estoque na indústria de A&B (Alimentos e Bebidas) exige rastreabilidade integral para garantir conformidade sanitária e auditoria financeira acurada (CMV e Ledger). O módulo WMS atua como a *Single Source of Truth* das quantidades físicas e do Custo Médio Ponderado (CMP).

## Module Map

```mermaid
graph TD
     A[{Recebimento NFe}] --> B[(estoque.Lote)]
     B --> C[{Alocação em Local}]
     B --> D[{Movimentação / Consumo}]
     D --> E[{Trigger Financeiro: CMP/Ledger}]
     F[{Inventário Cego}] --> D
```

## Capabilities

| Capability | What | Key Aspects | Detail |
| --- | --- | --- | --- |
| [[technical/operations|Gestão de Inventário]] | Reconciliação física | Inventário Cego, Wall-to-Wall | 2 entidades |
| [[technical/operations|Rastreabilidade GxP]] | Controle sanitário | Lotes, Validade, Temperatura | 2 entidades |
| [[technical/operations|Custeio Automático]] | Integração Financeira | CMP, Trigger Ledger | 1 operação, 1 trigger |
| Project History | [[discovery/decisions|Decisões de Projeto]] | ADRs, Mudanças de Arquitetura | — |

## Domain Concepts

| Concept | Type | Key Constraints |
| --- | --- | --- |
| [estoque.Movimentacao](domain/domain.md#estoquemovimentacoes) | Entity | Registro imutável (Append-only) |
| [estoque.Lote](domain/domain.md#estoquelotes) | Entity | Unidade fundamental de saldo e validade |
| [estoque.Inventario](domain/domain.md#estoqueinventarios) | Entity | Sessão de auditoria bloqueante |
| [estoque.Local](domain/domain.md#estoquelocais) | Value Object | Endereço físico com travas de temperatura |

## Concept Registry

| Concept | ID | Type |
| --- | --- | --- |
| [Movimentacao](domain/domain.md#estoquemovimentacoes) | estoque.Movimentacao | Entity |
| [Lote](domain/domain.md#estoquelotes) | estoque.Lote | Entity |
| [Inventario](domain/domain.md#estoqueinventarios) | estoque.Inventario | Entity |
| [Local](domain/domain.md#estoquelocais) | estoque.Local | Value Object |

## Feature Concept Graph

| From | Edge | To | Evidence | Notes |
| --- | --- | --- | --- | --- |
| estoque.Movimentacao | queries | estoque.Lote | domain.md | Altera o saldo do lote |
| estoque.Lote | contains | estoque.Local | domain.md | Localização física do lote |
| estoque.Movimentacao | produces | financeiro.Transacao | [[spec-financeiro]] | Integração Ledger |
| estoque.Movimentacao | calculates | financeiro.CustoMedioPonderado | [[spec-financeiro]] | Recálculo de CMP |

## Aspect Docs

| Aspect | Contains | Key Concepts |
| --- | --- | --- |
| [[domain-estoque]]|Domain]] | Entidades, Value Objects e Enums | estoque.Lote, estoque.Movimentacao |
| [[technical/operations|Operations]] | Regras de alocação e triggers | Recebimento, Ajuste |

## Cross-Feature Dependencies

| Capability | Depends On | Via | Why |
| --- | --- | --- | --- |
| Recebimento NFe | [[registry|fornecedor.Fornecedor]] | Query | Identificar origem da mercadoria |
| Integração Contábil | [[spec-financeiro]] | Event | Registrar impacto no Ledger |

## Produces For

| Consumer | Consumes Capability | Via | What |
| --- | --- | --- | --- |
| financeiro | Custeio Automático | Trigger | CMP e Transações de Ledger |
| industria | Rastreabilidade GxP | Query | Insumos disponíveis para OP |

## Change History

## Related Discovery
- [[features/estoque/discovery/brownfield-estoque|Discovery: Estudo de Caso Estoque Legado]]

