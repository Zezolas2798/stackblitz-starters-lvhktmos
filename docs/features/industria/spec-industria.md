---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---

# Módulo de Indústria (Produção e Fabricação)


## What This Module Owns

O módulo de Indústria gerencia o processo de transformação de matérias-primas e insumos (estoque) em produtos semi-acabados e acabados. Ele é responsável pelo rastreio da Ordem de Produção (OP), controle de rendimento (Yield) e apuração do custo de transformação para retroalimentar o Financeiro e o Estoque.

## Module Map

```mermaid
graph TD
     A[{Abertura de OP}] --> B[(producao.OrdemProducao)]
     B --> C[{Baixa de Insumos}]
     C --> D[{Cálculo de Custo Realizado}]
     D --> E{Modalidade}
     E -- Make-to-Stock --> F[(estoque.Lote Final)]
     E -- On-Demand --> G[{financeiro.Transacao: CPV}]
```

## Capabilities

| Capability | What | Key Aspects | Detail |
| --- | --- | --- | --- |
| [Gestão de Ordens](technical/operations.md#gestao-ordens) | Controle de fabricação | Status OP, Baixa automática | 2 entidades |
| [Custeio de Transformação](technical/operations.md#custeio-transformacao) | Apuração de CPV/CMP | Yield, rateio de insumos | 1 query complexa |

## Domain Concepts

| Concept | Type | Key Constraints |
| --- | --- | --- |
| [producao.OrdemProducao](domain/domain.md#producaoordemproducao) | Entity | Lifecycle rigoroso: Pendente → Preparo → Finalizada |
| [producao.SetorProducao](domain/domain.md#producaosetorproducao) | Entity | Divisão lógica da fábrica/cozinha |

## Concept Registry

| Concept | ID | Type |
| --- | --- | --- |
| [OrdemProducao](domain/domain.md#producaoordemproducao) | producao.OrdemProducao | Entity |
| [SetorProducao](domain/domain.md#producaosetorproducao) | producao.SetorProducao | Entity |

## Feature Concept Graph

| From | Edge | To | Evidence | Notes |
| --- | --- | --- | --- | --- |
| producao.OrdemProducao | queries | estoque.Lote | domain.md | Consome insumos para produzir |
| producao.OrdemProducao | produces | estoque.Lote | domain.md | Gera produto acabado (MTS) |
| producao.OrdemProducao | produces | financeiro.Transacao | [[spec-financeiro]] | Gera CPV na DRE (MTO) |
| producao.OrdemProducao | calculates | financeiro.CustoMedioPonderado | [[spec-financeiro]] | Define custo de entrada do item produzido |

## Aspect Docs

| Aspect | Contains | Key Concepts |
| --- | --- | --- |
| [[domain-industria]]|Domain]] | Entidades e lifecycle da OP | producao.OrdemProducao |

## Cross-Feature Dependencies

| Capability | Depends On | Via | Why |
| --- | --- | --- | --- |
| Custeio de Transformação | [[spec-estoque]] | Query | Obter custos dos insumos (CMP) |
| Finalização de OP | [[spec-financeiro]] | Event | Registrar custo do produto vendido |

## Produces For

| Consumer | Consumes Capability | Via | What |
| --- | --- | --- | --- |
| estoque | Gestão de Ordens | Event | Novos lotes de produtos acabados |
| financeiro | Custeio de Transformação | Event | Transações de custo (CMV/CPV) |

## Change History

## Related Discovery
- [[features/industria/discovery/producao|Discovery: Produção Industrial]]
- [[features/industria/discovery/fichas_tecnicas_industrial|Discovery: Fichas Técnicas]]
- [[features/industria/discovery/setores_producao|Discovery: Mapeamento de Setores]]

