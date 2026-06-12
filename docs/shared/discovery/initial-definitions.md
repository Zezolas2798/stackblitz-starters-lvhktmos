---
id: initial-definitions
title: "Initial Definitions — Core Vocabulary"
type: initial-definitions
status: baseline
created: 2026-05-10
source: brownfield-translation (observed from docs/sistema.registry.md)
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[../../registry|Global Registry]]

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-architecture]]

---



# Initial Definitions

> Core vocabulary extracted from the existing system. Each term maps to a meta-type in [[shared/discovery/sistema.taxonomy]].

## Bounded Contexts

| Context | Scope | Key Entities |
|---|---|---|
| **Ingredientes** | Cadastro, classificação e propriedades nutricionais de insumos | Ingrediente, GrupoIngrediente, Alergênico, InfoNutricional |
| **Receitas / Fichas Técnicas** | Formulação industrial com rotulagem GxP | Receita, Composição, Material, StatusReceita |
| **UAN** | Planejamento alimentar operacional para refeitórios | FichaTecnicaUAN, CardapioUAN, ListaCompraUAN, CardapioDiaUAN |
| **Estoque** | Rastreabilidade de lotes, movimentações e inventário | Lote, Movimentação, Inventário, Recebimento, Local |
| **Produção** | Execução de ordens de produção com baixa de estoque | OrdemProducao, SetorProducao |
| **Fornecedores** | Homologação de parceiros comerciais | Fornecedor |
| **Serviços** | Gestão de prestadores técnicos | Prestador |
| **Rotulagem** | Cálculo nutricional e conformidade regulatória | CalculoNutricional, CalculoLupa, CalculoPorcao, FormatarValue |
| **Legislação** | Normas regulatórias da ANVISA e suas especificações de engenharia | RDC_429, IN_75, RDC_727, Lei_10674, Decreto_4680 |

## Core Terms

| Term | Definition | Meta-Type |
|---|---|---|
| Ingrediente | Insumo primário, composto ou aditivo com rastreabilidade nutricional | Entity |
| Receita | Formulação industrial com composição, custos e rotulagem | Entity |
| Ficha Técnica UAN | Receituário operacional para refeitórios com custo per capita | Entity |
| Cardápio UAN | Ciclo mensal de planejamento alimentar | Entity |
| Lista de Compras UAN | Snapshot calculado da necessidade de compra do ciclo | Entity |
| Lote | Unidade de rastreabilidade com validade e saldo | Entity |
| Fator de Correção (FC) | Razão Peso Bruto / Peso Líquido — compensa perdas de preparo | Calculation |
| Índice de Cocção (IC) | Fator de transformação térmico (peso final / peso líquido) | Calculation |
| Per Capita | Custo unitário por comensal para uma preparação | Calculation |
| FEFO | First Expired, First Out — regra de consumo de estoque | Policy |
| RLS | Row Level Security — isolamento de dados por tenant/unidade | Policy |
| Soft Delete | Exclusão lógica via `deleted_at` — sem deleção física | Policy |
| Code Tag | Marcação `@biz`/`@sys` no código para rastreabilidade spec→code | Governance |
