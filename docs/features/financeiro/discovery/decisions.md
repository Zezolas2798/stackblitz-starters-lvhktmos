---
tags:
  - feature/financeiro
node_type: decisions
status: placeholder
created_by: brownfield-translation
created: 2026-05-15
feature: financeiro
---
---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-financeiro]]

---




# Decisões de Arquitetura - Módulo Financeiro

## Uso do Padrão DRE USAR (Uniform System of Accounts for Restaurants)
O WMS não adota um DRE puramente contábil padrão. Foi decidido a adoção do framework **USAR** (ou USALI adaptado) por focar na visão do gestor do restaurante. Isso garante que o Prime Cost (CMV + Mão de Obra) seja o foco da operação, permitindo isolar a ineficiência de desperdícios das ineficiências de gestão administrativa.

## CMV Teórico vs CMV Contábil
A plataforma separa completamente as notas fiscais de compra (`fin_lancamentos`) do custo lançado no CMV (`buildDreUSAR`). 
**Por que?** Em restaurantes, a compra de estoque não é despesa imediata. Para calcular margem real, o módulo financeiro foi arquitetado para ignorar os Lançamentos Manuais de Compras no DRE e substituir pelo **Custo Teórico** (Vendas x Ficha Técnica), atualizado dinamicamente pelo Custo Médio Ponderado (CMP) das compras mensais.

## Isolamento das Integrações de Delivery
Os relatórios separam as Receitas de Delivery da Receita de Salão, não apenas para acompanhamento logístico, mas para o motor de dedução deduzir adequadamente as altíssimas taxas das plataformas (ex: iFood), garantindo que a margem final do prato não seja prejudicada globalmente por comissões escondidas.

## Engenharia de Menu (Matriz Kasavana & Smith) baseada no CMP
Em vez de utilizar custo standard fixo ou "Último Custo de Compra", decidiu-se calcular a Engenharia de Cardápio cruzando fichas técnicas com o Custo Médio do mês. Isso garante que as "Estrelas" reais do cardápio sejam encontradas independentemente de surtos momentâneos inflacionários ou compras mal negociadas num dia específico.
