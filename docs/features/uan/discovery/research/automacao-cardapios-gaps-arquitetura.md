---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

scope: application
layer: architecture
status: active
version: 1.0.0
last_updated: 2026-05-14
---




# Discovery: Gaps de Arquitetura na Automação de Cardápios UAN

> **Contexto:** A feature de planejamento de cardápios possui uma rica base teórica (`uan-knowledge`) baseada em Otimização Multi-Objetivo (NSGA-II) e Restrições Rígidas (CSP/MILP). Uma pesquisa paralela multieixo foi conduzida para investigar a viabilidade computacional, financeira e regulatória do modelo atual. As descobertas aqui registradas devem guiar a refatoração do backend da funcionalidade.
> **Pesquisa de Origem:** `docs/features/uan-cardapios/research/validacao-automacao-cardapios/domainspec-subagents-findings.md`

## 1. Trade-offs e Tensões Mapeadas

### 1.1 Custo Computacional vs. Ambiente Edge
O domínio de negócio exige o cálculo mensal de cardápios (ex: 3 refeições x 30 dias x 300 fichas no catálogo). Os *solvers* de restrições exatas (CSP) sofrem explosão combinatória (NP-Hard), e os metaheurísticos (NSGA-II) exigem dezenas de gerações iterativas.
- **Tensão:** O motor atual na Supabase Edge Function não pode rodar isso de forma síncrona devido a limites rígidos de *timeout* (2 a 5 segundos).
- **Decisão Arquitetural:** O endpoint de geração de cardápios deve abandonar o request síncrono. O fluxo precisa adotar **mensageria assíncrona** (Workers em *background* ou in-browser Web Workers pesados), notificando o usuário ao final via WebSocket/Polling.

### 1.2 Regras de Negócio: Linter Frontend vs. Solver Backend
A metodologia AQPC (Cores, Fritura, Enxofre) está especificada no `uan-knowledge` e o sistema valida o cardápio criado no frontend (Linter).
- **Tensão:** O *solver* atual é cego a essas regras de pontuação sensorial durante a sua busca. Ele otimiza custo e macros, gerando soluções que o *frontend* invariavelmente irá sinalizar como falhas sensoriais.
- **Decisão Arquitetural:** O Linter não pode ser apenas uma validação reativa no Frontend. As métricas AQPC e a Matriz Anti-Monotonia (distância de Jaccard) devem ser acopladas à Função de Avaliação (*Fitness Function*) do Algoritmo Genético, para que a IA descarte pratos repetitivos *durante* a geração.

### 1.3 Custos Fictícios na Função Objetivo
A Função Objetivo matemática busca minimizar o somatório de custos ($Z = \min \sum C_m \cdot x_m$).
- **Tensão:** Se o $C_m$ usar o preço bruto de aquisição (NF), a Otimização será corrompida matematicamente, favorecendo insumos in natura que geram alto desperdício na cozinha.
- **Decisão Arquitetural:** O banco de dados ou a Edge precisa normalizar e trafegar o **Custo Real Efetivo (CRe = aquisição × FC / FCOC + marginais)** para a matriz do solver.

### 1.4 Generalização: PAT vs. Hospitais/PNAE
O motor é fortemente focado em atingir as metas nutricionais restritivas do PAT (VET e NDpCal).
- **Tensão:** Em contextos do PNAE (escolar) ou Hospitalar (dietas branda/pastosa), a matemática não é apenas buscar o valor-alvo; requer a *exclusão binária* de ingredientes ou matrizes de *bounds* diferentes por faixa etária.
- **Decisão Arquitetural:** Implementar um **Profile Selector** (Pipeline de Contexto) antes de acionar a matemática. O usuário escolhe o "Programa/Restrição", o sistema filtra o subconjunto de Fichas Técnicas permitidas e ajusta os limites superiores/inferiores da equação, só então enviando a matriz para o Solver.

## 2. Implicações para o Roteiro de Implementação
Qualquer futuro subagente encarregado de implementar ou refatorar o `edge.calcularCardapioUAN` e as telas de geração deve tratar estas regras como imperativas:
1.  **Nunca** prometer uma resposta de algoritmo genético na mesma requisição HTTP originária.
2.  **Nunca** executar minimização de custos ignorando Fatores de Correção/Cocção.
3.  **Sempre** validar a viabilidade qualitativa de um prato antes de permitir que o solver considere seu custo.

