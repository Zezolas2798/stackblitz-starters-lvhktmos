---
tags:
  - feature/financeiro
node_type: discovery
status: placeholder
created_by: brownfield-translation
created: 2026-05-15
feature: financeiro
---
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-financeiro]]
---





# Brownfield Translation: Módulo Financeiro

> **TODO — human review**
> Este documento reflete o estado "As-Is" do módulo financeiro, compilado a partir da leitura do código atual, em especial o `dashboardDataService.ts` e a estrutura de telas em `app/financeiro`.

## Observed Behavior
- O módulo financeiro não se limita a fluxo de caixa simples; ele possui um Dashboard Executivo denso baseado no **DRE Gerencial Padrão USAR** (Uniform System of Accounts for Restaurants).
- Há sub-módulos integrados para Contas a Pagar, Conciliação, Despesas e Vendas.
- **Valuation:** Há um cálculo estimado do Valuation da operação utilizando múltiplos sobre o EBITDA extraído do DRE.
- **Inteligência de Vendas (Engenharia de Cardápio):** 
  - Cálculo de Curva ABC para os itens do cardápio.
  - Classificação de vendas baseada na Matriz Kasavana (Estrelas, Cavalos de Batalha, Quebra-cabeças, Cães) para otimização de rentabilidade versus popularidade.

## Observed Decisions
- **Cálculo de CMV Teórico vs Real:** No painel de DRE e na Engenharia de Menu, o Custo de Mercadoria Vendida (CMV) é calculado de forma *teórica* (cruza-se a Ficha Técnica com o Custo Médio Ponderado das notas fiscais) em vez de simplesmente lançar compras como despesas. Lançamentos manuais de compras no DRE são isolados para evitar "dupla contagem" de CMV e despesa operacional.
- **Deduções de Receita:** Estimações agressivas de deduções. O sistema aplica algoritmos de `motorFiscal` para deduzir impostos (Simples Nacional, Lucro Presumido, Lucro Real) de forma preditiva, além de deduções contratuais como MDR (Taxa da Maquininha) e Taxa de Antecipação de Recebíveis (Cash Leakage).
- **Integrações de Delivery:** Os registros de plataformas como iFood/Rappi (`fin_vendas_delivery`) são consolidados com vendas de PDV para compor a Receita Bruta Total. Foi acordado que essa integração se dará via API futuramente.

## Observed Constraints
- **Fichas Técnicas como Dependência Forte:** Sem a criação de receitas, `composicao_receitas`, `ingredientes` e `materiais`, os relatórios de CMV e Engenharia de Cardápio exibirão custo zero, mascarando prejuízos.
- **Regime Tributário:** O cliente precisa obrigatoriamente preencher uma `TaxConfig` coerente para que o DRE possa refletir o GOP e o EBITDA corretamente.
