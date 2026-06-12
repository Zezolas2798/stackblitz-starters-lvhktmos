---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# Integração UAN $\leftrightarrow$ Financeiro (Eixo 4)

## 1. Domain Overview
A integração entre os módulos UAN (Unidade de Alimentação e Nutrição) e Financeiro visa alinhar o planejamento de cardápios (especialmente através do NSGA-II solver) com a realidade financeira do negócio. Historicamente, a UAN considerava o `preco_ultima_compra` ou custos estáticos preenchidos nas Fichas Técnicas. Com essa integração, a "Single Source of Truth" para o custo dos insumos passa a ser o **Custo Médio Ponderado (CMP)** gerido pelo módulo Financeiro/Estoque.

## 2. Core Entities & Data Mapping

### 2.1 Custo Médio Ponderado (CMP)
- **Origem:** Módulo Financeiro / Movimentações de Estoque.
- **Definição:** Valor médio dos lotes em estoque de um determinado ingrediente, calculado sempre que há uma nova entrada (compra) ou reavaliação.
- **Uso na UAN:** Substitui o custo bruto (`custo_por_porcao` baseado no último preço) das Fichas Técnicas para os cálculos de viabilidade financeira (CMV) e no NSGA-II.

### 2.2 Ficha Técnica UAN
- **Estrutura Atual:** Baseada em ingredientes, per capita, fator de correção e fator de cocção.
- **Modificação:** O cálculo de custo da ficha não deve persistir o custo como um valor estático, mas sim calculá-lo dinamicamente ou realizar o fetch do CMP no momento da construção do cardápio/avaliação.

## 3. Operations & Workflows

### 3.1 Fetching de Custos (Pré-Solver)
Antes de despachar o problema para a Edge Function (`uan-nsga-solver`), a aplicação cliente (ou o backend intermediário) deve:
1. Identificar todos os ingredientes necessários para as opções de cardápio selecionadas.
2. Consultar o CMP de cada ingrediente.
3. Projetar o custo total de cada Ficha Técnica usando as per capitas e os CMPs.

### 3.2 Atualização do NSGA-II Solver
- **Arquivo:** `supabase/functions/uan-nsga-solver/index.ts`
- **Alteração:** O algoritmo evolucionário avaliará a "função objetivo" e a restrição `CUSTO_MAX_DIARIO` utilizando o CMP injetado no payload do problema, garantindo que os indivíduos (soluções de cardápio) respeitem o orçamento real atualizado da empresa.

## 4. Technical Constraints
- Performance: O cálculo do CMP para múltiplos ingredientes deve ser otimizado para não gargalar a geração de Fichas Técnicas e o planejamento. Se necessário, o CMP deve ser armazenado como um campo materializado (atualizado por triggers) na tabela de ingredientes/materiais.
- Fallback: Caso um ingrediente não tenha CMP (ex: nunca comprado), o sistema deve recorrer ao `preco_ultima_compra` ou um `preco_estimado` com um aviso (warning) de precisão de custo.

