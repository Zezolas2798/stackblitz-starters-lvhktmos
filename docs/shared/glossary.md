---
id: glossary
title: "Domain Glossary"
type: glossary
status: active
created: 2026-05-10
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]
---


# Glossário do Domínio

> Vocabulário canônico do SaaS Food Service. Quando houver dúvida sobre o significado de um termo, este documento é a referência.

## A

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Alergênico** | Substância capaz de causar reação alérgica, listada pela ANVISA. Relação NxN com Ingrediente | Value Object | Ingredientes, Rotulagem |
| **Audit Trail** | Registro imutável de alterações em dados sensíveis (GxP) | Policy | Sistema |

## C

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Cardápio UAN** | Ciclo de planejamento alimentar (diário/semanal/mensal) para refeições coletivas | Entity | UAN |
| **Classificação NOVA** | Escala 1-4 (USP/Nupens) do grau de processamento de alimentos | Enum | Ingredientes |
| **Composição** | Item de uma receita/ficha técnica: ingrediente + quantidade + referência nutricional | Entity | Receitas, UAN |
| **CMP** | Custo Médio Ponderado. Média do custo dos lotes em estoque | Calculation | Estoque, Financeiro |
| **CMV** | Custo de Mercadoria Vendida. Valor contábil dos insumos consumidos | Calculation | Financeiro |

## D

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Declaração de Ingredientes** | Lista textual de ingredientes do fornecedor para produtos compostos | Value Object | Ingredientes |

## F

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Fator de Correção (FC)** | Razão Peso Bruto / Peso Líquido. Compensa perdas de higienização e preparo | Calculation | UAN |
| **FEFO** | First Expired, First Out. Regra de consumo de estoque por validade | Policy | Estoque |
| **Ficha Técnica UAN** | Receituário operacional para refeitórios com custo per capita | Entity | UAN |

## G

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **GxP** | Good Practice compliance. Conjunto de normas de boas práticas (BPF, BPH) | Policy | Qualidade |
| **Grupo de Ingrediente** | Classificação hierárquica para agrupamento de estoque e categorias | Entity | Ingredientes |

## I

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Índice de Cocção (IC)** | Fator de transformação térmico (peso final / peso líquido) | Calculation | UAN |
| **Ingrediente** | Insumo primário, composto ou aditivo com rastreabilidade nutricional | Entity | Ingredientes |
| **Ingrediente de Sistema** | Ingrediente com `cliente_id = NULL`, visível para todos, read-only | Entity | Ingredientes |

## L

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Lista de Compras UAN** | Snapshot calculado da necessidade de compra de um ciclo de cardápio | Entity | UAN |
| **Lote** | Unidade de rastreabilidade com validade, saldo e localização | Entity | Estoque |
| **Lupa ANVISA** | Selo frontal obrigatório para alimentos com alto teor de açúcar, gordura ou sódio | Calculation | Rotulagem |

## K

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Kraljic** | Matriz de risco e impacto financeiro para classificação de suprimentos | Value Object | Compras |

## M

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Material** | Item não-alimentar (embalagem, limpeza, EPI) gerenciado no estoque | Entity | Estoque |
| **Multi-Tenant** | Modelo de isolamento onde cada cliente vê apenas seus dados | Policy | Sistema |

## O

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Orçamento (Compras)** | Matriz de cotações vigentes de ingredientes por fornecedor | Entity | Compras |

## P

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Per Capita** | Custo unitário por comensal para uma preparação | Calculation | UAN |

## R

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Receita** | Formulação industrial com composição, custos e rotulagem GxP | Entity | Receitas |
| **Referência Nutricional** | Tabela matricial governamental (TACO/TBCA) com dados nutricionais por 100g | Value Object | Ingredientes |
| **RLS** | Row Level Security. Isolamento de dados por tenant/unidade no PostgreSQL | Policy | Sistema |

## S

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **Soft Delete** | Exclusão lógica via `deleted_at` timestamp. Sem deleção física (GxP) | Policy | Sistema |

## T

| Term | Definition | Meta-Type | Context |
|---|---|---|---|
| **TACO** | Tabela de Composição de Alimentos do IBGE/USP | Source | Ingredientes |
| **Tenant** | Cliente/empresa no modelo multi-tenant | Actor | Sistema |
| **Transgênico** | Organismo geneticamente modificado, regulado pelo Decreto 4680/2003 | Value Object | Ingredientes, Rotulagem |
