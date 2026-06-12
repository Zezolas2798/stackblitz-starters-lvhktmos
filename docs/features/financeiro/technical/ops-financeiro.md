---
tags:
  - feature/financeiro
node_type: operations
status: placeholder
created_by: brownfield-translation
created: 2026-05-15
feature: financeiro
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-financeiro]]

---

# Operações do Módulo Financeiro

Este documento define os Domain Services e operações encapsuladas responsáveis pelos cálculos e montagem de relatórios complexos.

## Domain Services

### DRE Builder (`buildDreUSAR`)
Responsável por orquestrar os dados brutos e compilá-los na árvore USAR.
**Comportamento:**
1. Acha a Receita Bruta Total.
2. Invoca o `Motor Fiscal` para calcular as Deduções (Simples/Lucro Presumido, Taxas de MDR, Cash Leakage).
3. Deduz CMV Teórico (buscando o CMP do mês) + Custo de Desperdício registrado pelo WMS.
4. Calcula o **Prime Cost** = CMV + Custo de Mão de Obra.
5. Agrega Despesas Controláveis para encontrar o **GOP** (Gross Operating Profit).
6. Deduz Custos de Ocupação para o **EBITDA**.

### Engenharia de Cardápio (`analyzeMenuEngineering`)
Implementa a matriz Kasavana & Smith.
**Entrada:** Uma lista de Vendas (`MenuItemEngineering`) onde o `cost` é obrigatoriamente preenchido cruzando a Ficha Técnica da Receita com o **Custo Médio Ponderado (CMP)** do mês.
**Cálculo:**
1. Média de Vendas (Total Vendas / Mix de Produtos).
2. Margem de Contribuição Média (Total Margem / Total Vendido).
3. Classificação de cada item:
   - **Estrela (Star):** Popularidade Alta, Margem Alta.
   - **Cavalo de Batalha (Plowhorse):** Popularidade Alta, Margem Baixa.
   - **Quebra-cabeça (Puzzle):** Popularidade Baixa, Margem Alta.
   - **Cão (Dog):** Popularidade Baixa, Margem Baixa.

### Curva ABC (`calculateABCCurve`)
Analisa o Princípio de Pareto (80/20) focado em Receita.
- **Classe A:** Responde por até 80% do faturamento acumulado.
- **Classe B:** Responde por até 95% do faturamento acumulado.
- **Classe C:** Os 5% restantes do faturamento.

### Previsão e Aging (`loadContasAPagar`)
Avalia a tabela de `fin_transacoes` cruzando a `data_vencimento` com a data de hoje. 
Isola dívidas vencidas e as projeta no fluxo de tesouraria do Dashboard Executivo.
