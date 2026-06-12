---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---


---

---
tags:
  - feature/uan

# 07 — Otimização de Cardápios em UAN (Pesquisa Operacional)

> **Fonte:** `Otimização de Cardápios em UAN.md`
> **Domínio:** Menu Planning Problem (MPP), Supply Chain, Pesquisa Operacional, Otimização Multiobjetivo, IA Evolutiva
> **Finalidade:** Algoritmos, formulações matemáticas e paradigmas para o motor de planejamento automatizado de cardápios no SaaS


## 1. Natureza do Problema — Menu Planning Problem (MPP)

### 1.1 Classificação
- **Tipo:** Problema combinatório NP-completo
- **Modelagem:** Problema da Mochila Multidimensional (Seljak, 2009)
- **Histórico:** "Problema da Dieta" (década de 1940, subsistência militar ao menor custo) → formulações computacionais institucionais (Balintfy, 1964) → MPP contemporâneo

### 1.2 Papel do Cardápio na Cadeia (Supply Chain)
O cardápio é o **motor deflagrador** de toda a cadeia de suprimentos:
- Dita previsões de demanda
- Define fluxos de caixa e capital de giro retido
- Determina necessidade de espaço físico de armazenagem
- Dimensiona força de trabalho no pré-preparo e cocção

**Consequência de erros:** CPC insustentável, gargalos de estoque, deterioração sensorial, desperdício catastrófico.

---

## 2. Otimização de Custo — Internalização de Rendimento

### 2.1 Função Objetivo Clássica
```
Minimizar Z = Σ (custo_insumo_i × variável_decisão_i)
```
- Programação linear binária: `x = 1` se receita selecionada, `x = 0` caso contrário

### 2.2 Custo Real Efetivo (Cre) — Variáveis de Rendimento
A otimização pelo "preço bruto de aquisição" é **falha**. Deve-se usar o **Custo Real Efetivo**:

```
Cre = (Custo_aquisição × FC) / FCOC + Custos_marginais
```

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| **FC (Fator de Correção)** | Perdas no pré-preparo (descascamento, desossa, aparas) | Cenoura crua → descarte cascas |
| **FCOC (Fator de Cocção)** | Retração térmica ou hidratação | Carne assada perde água; feijão ganha volume |
| **Custos Marginais** | Rateio de temperos, energia do equipamento, tempo padrão de mão de obra | — |

**Insight contra-intuitivo:** O algoritmo pode favorecer insumos com preço/kg superior, mas com FC + FCOC que resultam em menor CPC efetivo na bandeja final.

### 2.3 Tabela Comparativa — Paradigmas de Custo

| Modelo Determinístico Clássico | Modelo Estocástico Sazonal |
|-------------------------------|---------------------------|
| Preço estático/histórico | Preço dinâmico previsto `c(t)` |
| Rendimento ignorado (100%) | FC e FCOC integrados |
| Matriz de itens fixa | Matriz Core (60-70%) + Sazonal (20-30%) |
| Substituição manual/intuitiva | Substituição automatizada multivariável |

---

## 3. Sazonalidade e Otimização Dinâmica de Preços

### 3.1 Problema
Sazonalidade agrícola impõe **não-estacionariedade** nos custos: preços podem variar > 100% entre meses (safra/entressafra).

### 3.2 Modelos Preditivos de Preço
- **Alisamento Exponencial de Holt-Winters** (nível, tendência, ciclos)
- **Machine Learning:** Regressão Lasso, Random Forest, Gradient Boosting Regressor

### 3.3 Programação Dinâmica Temporal
```
Minimizar E[Z] = E[Σ c_i(t) × x_i(t)]   para t ∈ [1, T]
```
- Horizonte de planejamento `T` (ex: mensal)
- Estrutura particionada: itens **Core** (essenciais, baixa elasticidade-preço) + itens **Sazonais**
- Limites superior/inferior de custo como restrições flexíveis

### 3.4 Substituição Transversal Multidimensional
Se ingrediente-alvo está em entressafra (custo proibitivo), o algoritmo combina frações de outros ingredientes que:
1. Atingem o alvo nutricional
2. Mantêm volume no prato
3. Minimizam custo total

**Impacto documentado:** Redução de 15–25% nos custos diretos de aquisição (Williamson, 2016).

---

## 4. Integração com Logística, Estoque e Armazenagem

### 4.1 Premissa Fundamental
Algoritmos clássicos de dieta operam sob premissa falaciosa de **"capacidade infinita"**. O MPP deve ser acoplado a modelos de **Lot-Sizing and Scheduling** (Tempelmeier, 2017).

**Regra:** O algoritmo jamais deve propor um cardápio cujo volume agregado de insumos exceda a capacidade cúbica da câmara fria, almoxarifado ou capacidade horária de preparo.

### 4.2 Restrição de Capacidade de Armazenagem (V_max)

```
Σ (v_i × q_i,f(t)) ≤ V_max   ∀ t
```

| Variável | Significado |
|----------|------------|
| `V_max` | Capacidade volumétrica absoluta do armazém (m³ ou posições-palete) |
| `v_i` | Volume unitário de acondicionamento do insumo `i` |
| `q_i,f(t)` | Quantidade do insumo `i` do fornecedor `f` em estoque no período `t` |

Se o somatório viola `V_max`, o solver (Gurobi, CPLEX) marca a ramificação como **inviável** → força redistribuição temporal ou ingredientes substitutos de maior densidade calórica/menor pegada volumétrica.

### 4.3 Balanço de Massa — Conservação de Fluxo de Materiais

```
Estoque(t) = Estoque(t-1) + Compras(t) - Demanda(t)
```

- `Demanda(t)` = variáveis de seleção do cardápio × per capita × nº comensais

### 4.4 Restrição de Perecibilidade (Shelf-Life)
- Equações lógicas limitam períodos consecutivos que um lote pode permanecer em estoque
- Modelos de predição de qualidade: **Equação de Arrhenius** ou **Modelo de Gompertz**
- Ao atingir shelf-life → lote reclassificado como **resíduo** → penalização severa na função objetivo
- Força FIFO rigoroso ou **Least-Shelf-Life First-Out**

### 4.5 Estoque de Segurança Ótimo (S_seg)
```
Estoque(t) ≥ S_seg   ∀ t
```
- Amortecedor contra ruptura estocástica (não-conformidade do fornecedor, variações de consumo)
- Calculado via Dinâmica de Sistemas + Lógica Fuzzy
- **Desafio:** Fronteira exata onde S_seg evita desabastecimento sem violar V_max ou gerar perdas por apodrecimento

### 4.6 Sumário de Restrições Logísticas

| Restrição | Propósito |
|-----------|-----------|
| **Capacidade Cúbica** | Impede insumos volumosos que excedam câmara fria/secos |
| **Balanço de Materiais** | Sincroniza fichas técnicas com fluxos de recebimento/saída |
| **Limiar de Perecibilidade** | Força inserção no cardápio ou expurgo por degradação temporal |
| **Estoque Crítico** | Mitiga risco de paralisação por atraso na cadeia de fornecedores |

---

## 5. Engenharia da Sustentabilidade — Redução de Desperdício na Fonte

### 5.1 Otimização Robusta Ajustável (ARO) — Combate à Superprodução

**Causa raiz do desperdício pré-consumo:** Superprodução, estimulada por modelos determinísticos utópicos.

**Solução — ARO (Adjustable Robust Optimization):**
- Trabalha com **conjunto de incertezas** contínuo, data-driven (histórico massivo)
- **Dois estágios:**
  1. Decisões "aqui e agora" — definições matriciais do cardápio e lotes primários (estáticas)
  2. Restrições de recorrência — garantem que, mesmo no pior cenário de demanda, existe capacidade de reprocessamento viável

**Resultado:** Restringir vértices do conjunto de incertezas a cenários extremos selecionados = **imunidade total contra superprodução**, em tempo computacional de segundos.

### 5.2 Matrizes de Receitas Flexíveis — Reutilização de Sobras Limpas

- Componentes de refeição modelados como **nós de trânsito** em grafo logístico de reuso contínuo
- **3 vias de destinação em cada nó:**
  1. Consumo integral (servido)
  2. Excedente termicamente confinado em inventário temporário
  3. **Reengenharia culinária** → ingrediente de entrada para nova receita no dia `t+1`

**Exemplo:** Sobra limpa de pães amanhecidos do dia `t` → variável de ingrediente para pudins, farinhas, espessantes no dia `t+1`.

- **Rastreamento de shelf-life obrigatório:** se não reaproveitado dentro do prazo → expurgo com penalização
- **Resultado empírico:** Redução de 28% no desperdício global + redução de 11–19% em emissões de carbono (Yilmaz et al., 2025)

### 5.3 Restrições de Lotes Discretos (Embalagem Fechada)

**Problema:**Algoritmos contínuos geram demandas fracionárias (ex: 3,2 kg de molho), mas atacado vende em lotes inteiros (ex: fardo de 5 kg). Excedente de fim de lote → vencimento precoce → desperdício silencioso.

**Solução:** Substituir variáveis contínuas por **restrições inteiras** atreladas ao Lote Econômico de Compras e embalagem fechada. Demandas agregadas devem perfazer **múltiplos inteiros** do portfólio B2B.

### 5.4 Sumário — Abordagens Anti-Desperdício

| Origem do Desperdício | Abordagem | Modelagem |
|----------------------|-----------|-----------|
| Superprodução por incerteza | ARO de Demanda | Conjuntos de incerteza data-driven + ML/regressão |
| Descarte de sobras inflexíveis | Receitas Flexíveis | Nós logísticos + fluxo intradiário + reengenharia culinária |
| Sobra de fim de lote | Lotes Discretos | Programação inteira com múltiplos de embalagem comercial |

---

## 6. Trade-off: Custo × Nutrição × Qualidade Sensorial

### 6.1 O "Paradoxo do Fígado com Repolho e Soja"
Otimização monobjetivo (custo mínimo + restrições nutricionais) → pratos "algebricamente perfeitos" mas **humanamente intragáveis e esteticamente repulsivos**. Solução: pivotar para **Otimização Multiobjetivo (MOO)**.

### 6.2 Otimização Multiobjetivo (MOO) — Fronteira de Pareto

**3 pilares simultâneos conflitantes:**
1. **f₁** — Minimizar custos de aquisição
2. **f₂** — Minimizar desvios em relação à IDR (Ingestão Diária Recomendada)
3. **f₃** — Maximizar diversidade estética, variedade morfológica e aceitação sensorial

**Fronteira de Pareto:** Conjunto de soluções onde é impossível melhorar um objetivo sem piorar outro. Não existe "solução ótima única".

### 6.3 Goal Programming (Programação com Objetivos Flexíveis)
- Transforma restrições rígidas em **metas tolerantes**
- Injeta desvios relativos: `d⁻` (folga negativa) e `d⁺` (desvio por excesso)
- Meta: `Minimizar Σ w_k × (d⁻_k + d⁺_k)`
- `w_k` = vetor de prioridade paramétrica → reflete **diretriz ideológica** da UAN (peso nutrição vs. retenção de liquidez)

### 6.4 Penalidades Sensoriais — Controle de Fadiga Estética

**Fadiga Sensorial:** Curvas de desfrute caem em decaimento logarítmico quando há repetição visual/gustativa.

**Sistema de Penalidades por Sobreuso:**
```
Se preparação_x apareceu no dia d:
  → Infligir penalidade incremental sintética nas iterações subsequentes
  → Se ocorrências cumulativas > limiar (Lmax, parametrizado):
      → Bloquear preparação_x nos dias seguintes
```

**Restrições de incompatibilidade por classe:**
- Vetar combinações monocromáticas no mesmo prato (ex: feijão + caldo marrom)
- Vetar texturas idênticas em paralelo (ex: purê amiláceo + frango cozido brando)
- Implementação: **zero-one programming** com penalização de convergência de classe

### 6.5 Inteligência Artificial — NSGA-II + Lógica Fuzzy

#### NSGA-II (Non-dominated Sorting Genetic Algorithm II)
- **Metaheurística evolucionária:** "semeia" milhões de cardápios-candidato (genótipos)
- Mutações genéticas entre gerações de simulação
- Abate algorítmico de todos os genótipos que violam:
  - Margens de aceitabilidade sensorial
  - Limites do HEI — Healthy Eating Index

#### Lógica Fuzzy
- Percepções sensoriais humanas **nunca** são binárias (0/1) → representação contínua [0.0 ; 1.0]
- Permite **afrouxamento nebuloso temporário** do teto de custo contratual:
  - Se custo ligeiramente acima do contrato, MAS satisfação sensorial prevista é formidável → aceitar trade-off
- Equaliza UANs não apenas em margem monetária, mas em **fidelização e sucesso operacional**

#### Particle Swarm Optimization (PSO)
- Complementar ao NSGA-II
- Acoplado via compilação conjunta ao solver Gurobi Optimizer

### 6.6 Tabela — Evolução dos Métodos

| Método | Mecânica | Limitações |
|--------|----------|------------|
| **Monobjetivo Linear Clássica** | Min custo Z com limites nutricionais | "Paradoxo de Repolho" — fadiga sensorial |
| **Goal Programming Multiobjetivo** | Vetores biológicos como metas tolerantes (d⁺, d⁻) | Depende da ponderação ideológica `w_k` definida pelo supervisor |
| **NSGA-II + Fuzzy + Gurobi** | Fronteira de Pareto + penalizações contínuas + restrições temporais cruzadas | Alta complexidade computacional, mas elimina inviabilidades sensoriais |

---

## 7. Requisitos para o Motor de Cardápio do SaaS

| Funcionalidade | Detalhamento |
|----------------|-------------|
| **Custo Real Efetivo** | Cálculo de CPC usando FC + FCOC + custos marginais (não preço de nota fiscal) |
| **Previsão de preços sazonais** | Integração com série temporal ou ML para `c(t)` dinâmico |
| **Partição Core/Sazonal** | Separar itens estáveis de variáveis para flexibilidade orçamentária |
| **Substituição multidimensional** | Motor de substiuição automática mantendo alvo nutricional + volume |
| **Restrição de armazenagem** | V_max parametrizável; validação volumétrica antes de gerar cardápio |
| **Balanço de massa dinâmico** | Sincronização estoque × fichas técnicas × cronograma de recebimento |
| **Controle de perecibilidade** | Shelf-life por lote; forçar uso FIFO; penalização por expiração |
| **Estoque de segurança** | S_seg calculado; alerta de ruptura iminente |
| **ARO para demanda** | Conjunto de incertezas data-driven; cenários extremos → imunidade à superprodução |
| **Receitas flexíveis** | Grafo de reuso de sobras limpas com tracking de shelf-life |
| **Lotes discretos** | Compras em múltiplos inteiros de embalagem B2B |
| **MOO — Fronteira de Pareto** | 3 objetivos simultâneos: custo, nutrição, sensorial |
| **Goal Programming** | Ponderações `w_k` configuráveis por contrato/unidade |
| **Penalidades sensoriais** | Controle de repetição por família gastronômica; bloqueio de monotonia cromática/textural |
| **NSGA-II / PSO** | Metaheurísticas para exploração eficiente do espaço NP-completo |
| **Lógica Fuzzy** | Flexibilidade contínua [0,1] para aceitabilidade sensorial e afrouxamento tático de custos |

