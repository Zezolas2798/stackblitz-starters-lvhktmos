---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---

# Módulo Financeiro


## What This Module Owns

O módulo Financeiro centraliza e analisa todas as movimentações monetárias do ecossistema. Atua como a inteligência executiva, consolidando receitas e custos para entregar relatórios táticos como DRE (padrão USAR), Prime Cost, GOP e EBITDA, além de análises de rentabilidade via Engenharia de Cardápio (Kasavana).

## Module Map

```mermaid
graph TD
     A[{Gestão de Lançamentos}] --> B[(financeiro.Transacao)]
     B --> C[{DRE / Fluxo de Caixa}]
     D[{Inteligência de Vendas}] --> E[{Engenharia de Menu}]
     F[{Custeio}] --> G[{CMV Projetado vs Realizado}]
```

## Capabilities

| Capability | What | Key Aspects | Detail |
| --- | --- | --- | --- |
| [[technical/operations|Gestão de Transações]] | Fluxo de caixa e aging | Contas a pagar/receber, conciliação | 2 entidades |
| [[technical/operations|Análise de Resultados]] | DRE padrão USAR | Prime Cost, GOP, EBITDA, Impostos | 1 query complexa |
| [[technical/operations|Engenharia de Menu]] | Rentabilidade | Kasavana, Curva ABC, Popularidade | 1 query analítica |
| Discovery | [[discovery/brownfield-financeiro|Financeiro Legado]] | Regras e processos brownfield | — |
| Project History | [[discovery/decisions|Decisões de Projeto]] | ADRs de integração Financeiro-UAN | — |

## Domain Concepts

| Concept | Type | Key Constraints |
| --- | --- | --- |
| [financeiro.Transacao](domain/domain.md#financierotransacao) | Entity | Raiz agregada imutável após conciliação |
| [financeiro.Lancamento](domain/domain.md#financierolancamento) | Entity | Sempre vinculado a uma transação e conta |
| [financeiro.Conta](domain/domain.md#financieroconta) | Entity | Classificação padrão USAR inativável (não deletável) |
| [financeiro.DreNode](domain/domain.md#financierodrenode) | Value Object | Estrutura hierárquica para visualização |

## Concept Registry

| Concept | ID | Type |
| --- | --- | --- |
| [Transacao](domain/domain.md#financierotransacao) | financeiro.Transacao | Entity |
| [Lancamento](domain/domain.md#financierolancamento) | financeiro.Lancamento | Entity |
| [Conta](domain/domain.md#financieroconta) | financeiro.Conta | Entity |
| [DreNode](domain/domain.md#financierodrenode) | financeiro.DreNode | Value Object |

## Feature Concept Graph

| From | Edge | To | Evidence | Notes |
| --- | --- | --- | --- | --- |
| financeiro.Transacao | contains | financeiro.Lancamento | domain.md | Relacionamento 1:N |
| financeiro.Lancamento | queries | financeiro.Conta | domain.md | Classificação contábil |
| estoque.Movimentacao | produces | financeiro.Transacao | [[spec-estoque]] | Trigger de estoque gera financeiro |
| compras.Orcamento | calculates | financeiro.CMVProjetado | domain.md | Base analítica de cotações |
| estoque.Movimentacao | calculates | financeiro.CustoMedioPonderado | [[spec-estoque]] | Base para CMV Realizado |

## Aspect Docs

| Aspect | Contains | Key Concepts |
| --- | --- | --- |
| [[domain-financeiro]]|Domain]] | Entidades, Value Objects e Enums | financeiro.Transacao, financeiro.Conta |
| [[technical/operations|Operations]] | Cálculos de DRE e Kasavana | Gestão de Lançamentos |

## Cross-Feature Dependencies

| Capability | Depends On | Via | Why |
| --- | --- | --- | --- |
| Custeio (CMV) | [[spec-compras]] | Query | Obter preços de mercado para CMV Projetado |
| Custeio (CMV) | [[spec-estoque]] | Event/Trigger | Obter custos realizados para CMP |
| Análise de Resultados | [PDV/Delivery API](#) | Interface | Obter faturamento e faturamento bruto |

## Produces For

| Consumer | Consumes Capability | Via | What |
| --- | --- | --- | --- |
| Executivos | Análise de Resultados | Query | DRE, Prime Cost, Rentabilidade |
| uan | Inteligência de Suprimentos | Query | Validação financeira de cardápios |

## Change History

- **2026-05-15:** Refatorado para conformidade total com DomainSpec.
