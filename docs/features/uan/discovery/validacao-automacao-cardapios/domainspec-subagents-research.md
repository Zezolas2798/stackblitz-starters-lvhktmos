# Context + Goal

**Context:** O projeto possui um motor de planejamento automatizado de cardápios (CSP + NSGA-II), um linter de AQPC no frontend, e edge functions para lidar com listas de compras. Toda a base teórica está consolidada em 13 documentos densos de `uan-knowledge`. Porém, a arquitetura foi desenhada com um forte viés para o Programa de Alimentação do Trabalhador (PAT). Há a necessidade de validar se essa infraestrutura sistêmica e matemática consegue escalar para outros contextos (PNAE, Hospitalar) e se o que foi especificado teoricamente já suporta a carga prática de uma UAN real.

**Goal:** Investigar, por 4 eixos paralelos (Multi-Programa, Sensorial, Computacional e Financeiro), a completude da arquitetura atual de automação de cardápios, identificando quais regras matemáticas e de negócios precisam ser ajustadas antes que o motor de planejamento vá para produção.

---
tags:
  - feature/uan

## Agent A1: Compliance Multi-Programa (PAT, PNAE, Hospitalar, PNAN)

**Findings on Multi-Program Feasibility:**

A análise cruzada das formulações matemáticas (Docs 04 e 11) com legislações de outros programas revela que o modelo de Programação Linear Inteira Mista (MILP) atual é específico demais para o PAT.

1.  **PAT (Programa de Alimentação do Trabalhador):** Coberto. O sistema domina VET (600-800kcal), distribuição de Macronutrientes e a restrição complexa do NDpCal (6-10%).
2.  **PNAE (Programa Nacional de Alimentação Escolar):** GAP ALTO. A modelagem atual usa uma matriz bidimensional (nutriente vs. ficha técnica). O PNAE exige **Matrizes Tridimensionais (idade vs. nutriente vs. ficha)**. Creches, pré-escola e ensino médio têm bounds (limites) metabólicos diferentes. Além disso, o PNAE possui constraints rígidas de "proibição" (ex: açúcar adicionado proibido para menores de 3 anos) que exigiriam restrições do tipo Big-M no solver.
3.  **Ambiente Hospitalar (Dietoterapia):** GAP ALTO. O solver trabalha buscando calorias e proteínas. Em hospitais, a restrição primária é qualitativa e de consistência (Branda, Pastosa, Líquida, Hipossódica). O solver atual geraria soluções impossíveis (ex: prescrever salada crua para dieta pastosa) porque não há filtros binários rigorosos de patologia aplicados *antes* da otimização.
4.  **PNAN:** Coberto como diretriz geral (foco em in natura), que pode ser traduzido no NSGA-II minimizando processados, mas carece de regras matemáticas rígidas.

**Conclusion:** O solver requer uma camada de "Profile Selector" antes da execução do MILP para carregar os bounds dinâmicos e aplicar filtros de exclusão de Fichas Técnicas baseados no programa.

---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]

---

---

## Agent A2: Validação AQPC e Sensorial

**Findings on Quality and Organoleptic Constraints:**

A avaliação do Linter Front-end vs. Otimizador Back-end:

1.  **Linter vs. Solver:** A especificação da metodologia AQPC (Veiros & Proença) para cromatismo, repetições, fritura e enxofre está eximiamente documentada (Doc 04) e é validada pelo frontend no wizard de criação de cardápios (`uan.cardapios.md`). No entanto, **o solver (CSP/NSGA-II) é cego a essas regras**. Ele gera combinações financeiramente ótimas, mas que falham no linter sensorial pós-geração.
2.  **Matriz de Anti-Monotonia:** O Documento 10 especifica a matriz de Jaccard e matrizes booleanas para impedir a repetição do mesmo corte de carne em menos de 15 dias. Como o CSP não implementa isso formalmente, o backtracking engine fatalmente procurará o frango todos os dias se for o item de menor custo viável ($Z = \min \sum C_m \cdot x_m$).
3.  **Falta de Função Multi-Objetivo (MOO) Ativa:** Para a Inteligência Artificial ser eficaz, a pontuação AQPC deve integrar a Função Fitness do Algoritmo Genético (NSGA-II), maximizando o score AQPC enquanto minimiza o custo, resultando em uma Frente de Pareto para o nutricionista escolher.

**Conclusion:** Há um abismo entre validação (Linter) e prescrição (Solver). As regras do Linter precisam descer para a camada de restrições da Edge Function.

---

## Agent A3: Viabilidade Computacional

**Findings on Scalability and Edge Infrastructure:**

A formulação matemática (Doc 08 - MILP, e Doc 09 - Metaheurísticas) diante do ambiente de execução (Supabase Edge Functions):

1.  **Complexidade Combinatória:** Planejar 1 refeição escolhendo de um catálogo de 300 Fichas Técnicas é tratável. Planejar um ciclo de 30 dias (Almoço, Jantar, Ceia = 90 refeições), mantendo a restrição temporal (não repetir pratos), transforma a árvore de busca num problema NP-Difícil massivo.
2.  **Limites do Supabase Edge Functions:** Edge functions têm timeouts (geralmente 1 a 5 segundos para requests síncronos). Um solver CSP Backtracking não resolverá um mês inteiro antes do timeout. O NSGA-II iterando 500 gerações em TypeScript na Edge irá invariavelmente gerar um `FunctionExecutionTimeout`.
3.  **Gaps de Backtracking:** Foi identificado que o Solver CSP atual ignora `CUSTO_MAX_REFEICAO` justamente por questões de performance (podagem da árvore prematura).

**Conclusion:** É arquiteturalmente inviável rodar o gerador de cardápios mensual de forma síncrona na Edge. A arquitetura precisa migrar o Dispatch do solver para uma fila assíncrona (Inngest / Edge Background Tasks / Web Workers no Client), e notificar via WebSocket quando o cardápio estiver pronto.

---

## Agent A4: Gap Financeiro e Custo Real

**Findings on Financial Parametrization:**

O modelo depende visceralmente do custo para minimização (Doc 07).

1.  **O Problema do Custo Bruto vs. Líquido:** O sistema possui a documentação impecável do Fator de Correção (FC) e Fator de Cocção (FCOC) no Documento 13. Porém, se a Função Objetivo do Solver ($Z = C_m \cdot x_m$) alimentar os coeficientes de custo com o preço da Nota Fiscal (Preço Bruto), a Otimização será matematicamente corrompida.
2.  **Risco Prático:** Ao comparar Cebola *In Natura* (menor custo bruto, altíssimo desperdício de casca - FC alto) com Cebola Descascada à Vácuo (maior custo bruto, FC = 1.0), um solver descalibrado escolherá sempre a in natura. Ao final do mês, o Custo Real Efetivo (CRe) estourará o budget da UAN por conta do desperdício pago mas não servido na cuba.
3.  **Status da Edge:** A `calcularCardapioUAN` agrega comensais e grade, mas o vínculo do custo atrelado à curva de rendimento da ficha técnica ainda não é a métrica fundamental injetada na matriz de decisão do algoritmo genético.

**Conclusion:** Antes do solver buscar o menor custo, a base de dados de Fichas Técnicas precisa passar por um pipeline de normalização que gere uma view de "Custo por Porção Líquida Consumível", blindando o algoritmo contra a ilusão de custos de insumos sujos.
