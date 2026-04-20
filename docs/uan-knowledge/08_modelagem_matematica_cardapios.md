# Base de Conhecimento UAN: Modelagem Matemática para Cardápios

Documento de referência arquitetural e algorítmica focado nos motores de otimização matemática avançada necessários para a elaboração preditiva de cardápios (Menu Planning Problem - MPP) no SaaS voltado a Unidades de Alimentação e Nutrição.

---

## 1. Fundamentação Teórica: MPP (Menu Planning Problem)
A definição de um cardápio transcende a intuição gastronômica, caracterizando-se matematicamente como um problema de **Otimização Combinatória NP-Difícil (Mochila Multidimensional)**.

### O Problema da Dieta Clássico (Stigler - 1945)
O modelo clássico é uma Programação Linear (PL) contínua focada em minimização absoluta de custo financeiro submetida a limites inferiores de ingestão diária (RDAs).

**Formulação Algébrica Clássica:**
```math
\text{Minimizar } Z = \sum_{j=1}^{n} c_j x_j
```
**Sujeito a:**
```math
\sum_{j=1}^{n} a_{ij} x_j \ge b_i \quad \forall i \in \{1, ..., m\}
```
```math
x_j \ge 0
```
Onde:
* $c_j$ = Custo financeiro unitário do alimento $j$.
* $x_j$ = Quantidade do alimento $j$ (Variável de decisão contínua).
* $a_{ij}$ = Quantidade do nutriente $i$ no alimento $j$.
* $b_i$ = Ingestão Diária Recomendada (RDA) do nutriente $i$.

**Falhas Críticas do Modelo Antigo (A serem evitadas na IA):**
- **Soluções de Canto:** Foca nos alimentos de maior densidade nutritiva por centavo, gerando monotonia.
- **Ausência de Limites Superiores ($b_i^{max}$):** Ignora a capacidade gástrica e o risco de hipervitaminose (toxicidade).
- **Fracionamento Contínuo:** Exige "0,34 maçãs", incompatível com compras B2B.

> **Stigler Gap:** É o custo financeiro adicional para transformar uma dieta teórica de sobrevivência em uma dieta palatável e culturalmente aceitável.

---

## 2. Paradigma Moderno e Estrutura Algébrica (SaaS MPP)
O sistema abandona insumos isolados em prol de **Preparações Culinárias Estruturadas (Fichas Técnicas)** sob uma matriz cronológica.

### 2.1. Conjuntos e Índices Otimizados
* $D$: Horizonte de Dias da otimização, índice $d \in \{1, ..., N\}$ (ex: 30 dias).
* $R$: Períodos de Refeição Diários, índice $r \in \{1, ..., K\}$ (ex: Desjejum, Almoço, Jantar).
* $M$: Repositório de Preparações (Fichas Técnicas), índice $m \in \{1, ..., P\}$.

### 2.2. Variáveis de Decisão
**O Domínio Booleano (Decisão Binária):** Impede o fracionamento irreal de preparações.
```math
x_{m,d,r} \in \{0, 1\}
```
$x_{m,d,r} = 1$ se a preparação $m$ for servida no dia $d$ e refeição $r$, caso contrário $0$.

### 2.3. Funções Objetivo (Modos Operacionais do SaaS)
O SaaS deve permitir alternar a Função Objetivo (FO) baseada na estratégia do cliente:

**1. Minimização de Impacto Econômico (Licitações/PAT):**
```math
\text{Minimizar } Z = \sum_{d=1}^{N} \sum_{r=1}^{K} \sum_{m=1}^{P} C_m \cdot x_{m,d,r}
```
Onde $C_m$ é o Custo Real Efetivo da porção $m$.

**2. Goal Programming (Clínico/Hospitalar):**
Minimização de desvios ($d^+$, $d^-$) em relação a uma meta nutricional exata, usando variáveis contínuas auxiliares.
```math
\text{Minimizar } Z = \sum_{i} (w_i^+ \cdot d_i^+ + w_i^- \cdot d_i^-)
```
Onde $w_i$ são as penalidades de desvio (peso alto para excesso de potássio em renais crônicos, por exemplo).

**3. Pegada Ecológica (ESG):**
Substitui o custo monetário $C_m$ pela conversão em emissão de CO2 equivalente por grama ($CO2e_m$).

---

## 3. Matriz de Restrições Estruturais e Logísticas ($Ax \ge B$)

### A. Limites Biométricos de Balanço Nutricional (Limits Constraints)
Garante a ingestão mínima normativa e impede excessos perigosos (ex. Sódio).
```math
b_i^{min} \le \sum_{m \in M} a_{im} \cdot x_{m,d,r} \le b_i^{max} \quad \forall i, d, r
```
* $a_{im}$ = Teor do micronutriente $i$ presente na preparação $m$.
* $b_i^{min}$ / $b_i^{max}$ = DRIs ou legislações (PNAE/PAT).

### B. Morfologia e Arquitetura do Prato
Define que, para subgrupos morfológicos $S_k \subset M$ (Prato Principal, Guarnição, Salada), exatamente UMA preparação deve ser escolhida:
```math
\sum_{m \in S_k} x_{m,d,r} = 1 \quad \forall d, r, k
```
*Garante que uma refeição tenha exatamente um prato principal, não dois, e não zero.*

### C. Chaves Anti-Monotonia (Restrições de Espaçamento Temporal)
Se o intervalo de purgação/distanciamento for de $T$ dias para a preparação $m$:
```math
x_{m,d,r} + \sum_{t=1}^{T} x_{m, d+t, r} \le 1 \quad \forall m, d, r
```
*Força o item $m$ (ex: Frango assado) de hoje ($x=1$) a zerar os próximos $T$ dias daquela matriz na mesma refeição, eliminando a monotonia algorítmica.*

---

## 4. Arquitetura Computacional Exigida: MILP (Mixed Integer Linear Programming)
O arcabouço basal do software deve orquestrar:

1. **Variáveis Híbridas (Mixed):**
   * **Booleanas/Inteiras ($x_{m,d,r}$):** Para confirmar ou rejeitar a presença da ficha técnica integral.
   * **Contínuas/Fracionárias ($d^+, d^-, massas$):** Tolerâncias de sobras, desvios nutricionais em Goal Programming e fechamento orçamentário.
2. **Linearização Estrita:** Para manter o problema tratável pelos *Solvers* (ex: CPLEX, Gurobi, GLPK num serverless ou container Edge), a matriz da UAN **jamais deve conter multiplicação direta de variáveis (equações polinomiais ou quadráticas)**. Relações de proporção devem ser deduzidas via equações lineares (e.g., $NDpCal \ge 0.06 \cdot Energia$).
3. **Poda Algorítmica (Branch-and-Bound):** Essencial para combater a explosão combinatória. O motor resolverá inicialmente os limites relaxados (contínuos) para podar ramos inviáveis de cardápio de forma massiva antes de fixar as variáveis binárias definitivas.
