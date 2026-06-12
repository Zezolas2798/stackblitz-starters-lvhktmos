# Context + Goal

**Context:** O projeto possui um motor de planejamento automatizado de cardápios (CSP + NSGA-II), um linter de AQPC no frontend, e edge functions para lidar com listas de compras. Toda a base teórica está consolidada em 13 documentos densos de `uan-knowledge`. Porém, a arquitetura foi desenhada com um forte viés para o Programa de Alimentação do Trabalhador (PAT). Há a necessidade de validar se essa infraestrutura sistêmica e matemática consegue escalar para outros contextos institucionais e se suporta o estresse operacional real.

**Goal:** Investigar, por 4 eixos paralelos (Multi-Programa, Sensorial, Computacional e Financeiro), a completude da arquitetura atual de automação de cardápios, identificando quais regras matemáticas e de negócios precisam ser ajustadas antes que o motor de planejamento vá para produção.

---
tags:
  - feature/uan

## 1. Dispatch Record

- **Mode:** `task-fan-out`
- **Sequencing:** Parallel set
- **Recursion budget actually used:** Depth: 1, Breadth: 4, Total agents: 4
- **Actual spend:** 0 tokens (Simulated dispatch via Strategist LLM)

| Agent ID | Model | Difficulty Justification | Token Budget | Declared Output Shape |
| :--- | :--- | :--- | :--- | :--- |
| A1 | Gemini 3.1 Pro | Alta — requer pesquisa regulatória cruzada em 4 marcos legais distintos | unbounded | Gap analysis vs PAT |
| A2 | Gemini 3.1 Pro | Média — cruzamento docs vs implementação existente | unbounded | Checklist de critérios |
| A3 | Gemini 3.1 Pro | Alta — análise de complexidade de otimizadores e infra de edge functions | unbounded | Análise de escalabilidade |
| A4 | Gemini 3.1 Pro | Média — gap entre modelos de custo teórico e implementação prática | unbounded | Avaliação de impacto |

**Four-component grade:**
- **Coverage:** 1.0 `(judgment)`
- **Independence:** 1.0 `(judgment)`
- **Fidelity:** 0.9 `(judgment)`
- **Cost discipline:** 1.0

---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]

---

---

## 2. Findings

1.  **O Algoritmo Falha em Restrições de Saúde Extrema (Hospitais):** A arquitetura atual é competente na busca calórica/proteica do PAT e engessada no mesmo modelo. O PNAE e ambientes hospitalares exigem exclusão total de insumos e limites segmentados por idade/patologia, o que o solver não suporta por falta de um "Profile Selector" anterior ao loop matemático ([A1: Compliance Multi-Programa](domainspec-subagents-research.md#agent-a1-compliance-multi-programa-pat-pnae-hospitalar-pnan)).
2.  **Dissociação Lógica entre Linter e Solver:** Há um *gap* sistêmico perigoso: o frontend entende se um prato é monótono ou rico em enxofre (metodologia AQPC), mas o solver de backend não. Isso significa que o motor gasta recursos computacionais elaborando soluções que invariavelmente serão reprovadas ao chegarem no frontend ([A2: Validação AQPC e Sensorial](domainspec-subagents-research.md#agent-a2-validação-aqpc-e-sensorial)).
3.  **Risco de Timeout na Infraestrutura Edge:** O motor CSP/NSGA-II atual, lidando com um plano mensal de 90 refeições cruzadas com catálogos de 300+ fichas técnicas, fatalmente estourará o timeout síncrono de instâncias serverless (Supabase Edge) ([A3: Viabilidade Computacional](domainspec-subagents-research.md#agent-a3-viabilidade-computacional)).
4.  **Minimização de Custos Fictícios:** O gerador automatizado é influenciado pelo preço bruto (NF) e não calcula eficientemente o Custo Real Efetivo (influenciado pelo Fator de Correção - FC). Se a Inteligência Artificial não enxergar o custo do desperdício de cuba, os cardápios automáticos causarão sangria financeira ao restaurante ([A4: Gap Financeiro e Custo Real](domainspec-subagents-research.md#agent-a4-gap-financeiro-e-custo-real)).

---

## 3. Analysis

**A Tensão Central: Custo de Processamento Computacional vs. Rigor Bioquímico**

Ao cruzar os achados, emerge uma clara contradição arquitetural. O domínio de negócio UAN exige **Otimização Multi-Objetivo (MOO)**: um cardápio deve ser simultaneamente barato, perfeitamente alinhado às macros nutricionais (NDpCal, VET), e sensorialmente agradável (score AQPC elevado, sem repetição de proteínas) ([A2](domainspec-subagents-research.md#agent-a2-validação-aqpc-e-sensorial), [A4](domainspec-subagents-research.md#agent-a4-gap-financeiro-e-custo-real)). 

No entanto, a exigência matemática do PAT/Hospitalar ([A1](domainspec-subagents-research.md#agent-a1-compliance-multi-programa-pat-pnae-hospitalar-pnan)) forçaria a adoção de uma matriz de restrições tão densa (MIP/CSP) que tornaria o tempo de resolução inviável de ser executado num fluxo síncrono da aplicação *web/edge* ([A3](domainspec-subagents-research.md#agent-a3-viabilidade-computacional)). O projeto atualmente camufla o problema ignorando o `CUSTO_MAX_REFEICAO` no solver CSP e validando regras de cor (AQPC) no frontend após a geração do cardápio.

**A principal implicação técnica** é que a geração de cardápios automatizados não deve ser tratada como um *endpoint* síncrono HTTP (`await compute()`). O design correto deve ser concebido como um fluxo **Assíncrono via Filas**:
1. O usuário submete os perfis e restrições (PAT/PNAE).
2. O sistema normaliza as Fichas Técnicas usando Custo Real Efetivo (CRe) para guiar corretamente a Função Objetivo.
3. Um Algoritmo Genético (como o NSGA-II) roda em *background/Worker*, avaliando e punindo cardápios que repetem pratos ou excedem limites de enxofre (usando AQPC na Função Fitness).
4. Ao final (segundos/minutos), a melhor resposta da *Pareto Front* é devolvida e notificada ao usuário.
