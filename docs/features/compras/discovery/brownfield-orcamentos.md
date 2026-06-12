---
tags:
  - feature/compras
node_type: discovery
status: draft
created_by: brownfield-translation
created: 2026-05-15
feature: compras_orcamentos
---
---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---




# Brownfield Translation: Módulo de Compras (Orçamentos/Cotações)

> **TODO — human review**
> Este documento reflete o estado "As-Is" do módulo de Compras, focado na seção de Orçamentos (Cotações), compilado a partir da leitura da documentação e da engenharia reversa do código-fonte (em especial `app/compras/orcamentos/page.tsx` e `20260404172300_fase3_orcamentos_kraljic.sql`).

## Observed Behavior
- **Quadro Comparativo (Cotações):** A funcionalidade principal é uma interface matricial que cruza Insumos (agrupados por Categoria e Subgrupo) contra Fornecedores, permitindo a entrada ágil de preços de mercado.
- **Conversão Automática (Embalagem -> Kg/L):** O sistema suporta compras tanto a granel quanto em embalagens fechadas. Se `is_embalagem` é verdadeiro, o sistema calcula o `preco_por_kg_l` com base nas variáveis `unidades_por_embalagem` e `peso_volume_por_unidade`, garantindo a padronização do custo na unidade base (Kg/L) para fins comparativos e de CMV.
- **Vigência e Defasagem:** Cada orçamento/cotação possui uma data (`data_orcamento`). Cotações com mais de 7 dias são visualmente marcadas com a tag `Defasado`, acionando um alerta de risco de variação de preço.
- **Inteligência de Suprimentos (Kraljic):** A tela incorpora uma lógica simplificada da Matriz de Kraljic (Alavancagem, Estratégico, Rotineiro, Gargalo), baseada no Lead Time do ingrediente e na quantidade de fornecedores que operam a categoria.
- **Diferenciação por Modalidade:** O filtro de modalidade (ex: ALIMENTOS, DIVERSOS) segmenta as cotações, respeitando a separação de domínios entre itens de cardápio e não-alimentares.

## Observed Decisions
- **Foco em Custo Padrão (Market Price) vs CMP:** A tabela `compras_orcamentos` armazena o preço "futuro" ou "ofertado" no mercado (`preco_por_kg_l`), que se difere do Custo Médio Ponderado (CMP) armazenado no Estoque. Isso prepara o terreno para calcular as variações de CMV (Custo Teórico vs. Real).
- **Hardened RLS:** O isolamento multi-tenant é mantido rigorosamente em `compras_orcamentos` com políticas RLS (Row Level Security) atreladas ao `cliente_id` e `unidade_id` do usuário autenticado.
- **Design de Interface Horizontal (Data Grid):** Optou-se por um design onde os fornecedores viram colunas dinâmicas (grid overflow_x), o que facilita o preenchimento em massa ("bulk update") por parte do setor de compras, reduzindo a fricção operacional em comparação com um formulário de página única para cada cotação.

## Observed Constraints
- **Granularidade da Tabela:** Atualmente, as cotações estão focadas majoritariamente em `ingredientes`. A expansão do módulo para materiais e outras categorias não-alimentares requer que a tabela `compras_orcamentos` referencie uma chave universal de produtos ou mantenha a tabela `materiais` em sincronia. Atualmente, o schema foca na FK `ingrediente_id`.
- **Desacoplamento do WMS:** A tabela não debita ou credita estoques. As cotações são um instrumento analítico e preditivo. A integração prática acontece quando essa cotação se transforma numa "Ordem de Compra" aprovada e posteriormente em uma "Nota Fiscal" (entrada de estoque).
- **Validação de Cardápios UAN:** O custo utilizado pela inteligência artificial de cardápios (NSGA-II) no módulo UAN deve olhar para o menor `preco_por_kg_l` não-defasado desta tabela para garantir viabilidade financeira, antes do custo se tornar CMP via compra efetiva.
