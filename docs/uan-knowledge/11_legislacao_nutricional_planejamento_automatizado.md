# Base de Conhecimento UAN: Legislação Nutricional e Planejamento Automatizado

Documento de referência dedicado à tradução das diretrizes legais de saúde pública (especificamente o Programa de Alimentação do Trabalhador - PAT) em inequações vetoriais de Programação Linear Inteira Mista (MILP).

---

## 1. O Problema da Dieta e a Base da Otimização Nutricional
A tradução de necessidades biológicas em álgebra linear deriva do modelo clássico ("The Diet Problem" - Stigler, 1945). O cardápio deixa de ser uma escolha empírica e torna-se o vetor de solução de um sistema de inequações:

### 1.1. Estrutura Matemática Primária (Programação Linear - PL)
*   **Variáveis de Decisão ($x_{m}$):** A quantidade a ser prescrita do alimento ou ficha técnica $m$. No limite discreto da UAN, trata-se de variáveis binárias ou inteiras.
*   **A Matriz Nutricional ($a_{n,m}$):** Parâmetro constante que define a concentração do nutriente $n$ em uma unidade monetária ou porção da receita $m$.
*   **Coeficiente de Custo ($C_{m}$):** O custo modular financeiro associado à decisão de escalonamento.

**Função Objetivo Clássica:**
O objetivo histórico é a minimização vetorial de custos $Z$, sujeito a limiares vitais de saúde:
```math
\text{Minimizar } Z = \sum_{m=1}^{M} C_m \cdot x_m
```

**As Restrições (Constraints) Biológicas Universais:**
Devem operar sempre limitadas por um Limite Inferior (Lower Bound - $b_n^{min}$) e um Limite Superior (Upper Bound - $b_n^{max}$) estabelecidos pelas DRIs/OMS:
```math
b_n^{min} \le \sum_{m=1}^{M} a_{n,m} \cdot x_m \le b_n^{max} \quad \forall n
```
*(Nota de Engenharia: Em UANs operacionais, alimentos granel, como Arroz e Feijão, repousam no domínio contínuo $\mathbb{R}$, enquanto pratos principais e embalados forçam a integralidade $\mathbb{Z}$, consolidando a topologia MILP/PLIM e atestando o problema como NP-Difícil).*

---

## 2. A Parametrização Regulatória Algébrica (Governança PAT)
O Programa de Alimentação do Trabalhador (PAT - Decreto nº 10.854/2021) impõe janelas restritivas fechadas que o motor da plataforma SaaS deve obedecer, evitando sanções federais. As exigências não são gramaturas absolutas, mas sim **proporções relativas dinâmicas** estruturadas em cima do Valor Energético Total (VET) real obtido no resultado do solver.

### 2.1. Limiares de Energia (VET) e Micronutrientes (Restrições Estáticas)
Para a refeição principal (Almoço/Jantar), aplicam-se restrições absolutas limítrofes como constantes *hard-coded*:
*   $600 \text{ kcal} \le VET \le 800 \text{ kcal}$ (Expansível algorítmicamente $+20\%$ via parâmetro laboral até 960 kcal)
*   $720 \text{ mg} \le \text{Sódio} \le 960 \text{ mg}$
*   $\text{Fibras} \ge 7 \text{ g}$ a $10 \text{ g}$

### 2.2. A Transladação das Restrições Macronutricionais Relativas
Como o VET final da dieta otimizada é uma variável volátil do solver, a conversão em gramas dos macronutrientes exige desmembramento em matrizes simultâneas de inequações cruzadas com constantes bioquímicas calóricas (Carboidratos = 4 kcal/g, Proteínas = 4 kcal/g, Lipídios = 9 kcal/g).

**Equacionamento Dinâmico para Carboidratos (CHO): $55\% \text{ a } 75\%$ do VET:**
```math
0.55 \cdot VET \le \Big( \sum_{m=1}^{M} CHO_{m} \cdot x_m \Big) \times 4 \le 0.75 \cdot VET
```
**Equacionamento Dinâmico para Proteínas (PTN): $10\% \text{ a } 15\%$ do VET:**
```math
0.10 \cdot VET \le \Big( \sum_{m=1}^{M} PTN_{m} \cdot x_m \Big) \times 4 \le 0.15 \cdot VET
```
**Equacionamento Dinâmico para Lipídios (LIP): $15\% \text{ a } 30\%$ do VET:**
```math
0.15 \cdot VET \le \Big( \sum_{m=1}^{M} LIP_{m} \cdot x_m \Big) \times 9 \le 0.30 \cdot VET
```
**Equacionamento Dinâmico Especial - Gordura Saturada:** Menos que $10\%$ do VET (Apenas Upper Bound):
```math
\Big( \sum_{m=1}^{M} LIP.Saturado_{m} \cdot x_m \Big) \times 9 \le 0.10 \cdot VET
```

O Solver de MILP atua nesses sistemas ajustando continuamente a matriz de gramatura $x_m$ para ancorá-la num subespaço aceitável.

---

## 3. A Complexidade Bioquímica e Modelagem Algébrica do NDpCal
O maior desafio arquitetural de *compliance* do menu em UAN é parametrizar o índice **NDpCal (Net Dietary Protein Calories)**, que deve figurar com margens de $6\%$ a $10\%$ das calorias parciais totais do eixo proteico (PAT).

O valor do NDpCal mensura a eficácia e digestibilidade biológica da retenção nitrogenada dos aminoácidos. A inteligência do sistema afere isso anexando um metadado imperativo às matrizes da taxonomia de ingredientes: o Fator NPU (Net Protein Utilization).

*   *Origem Animal:* Recebem vetores Fatores NPU próximos de 1.0 (ou $0.7 \sim 0.8$) dado o espectro ótimo bioquímico.
*   *Origem Vegetal:* Recebem vetores Fatores NPU reduzidos ($0.5 \sim 0.6$) mediante intercorrência de antinutricionais.

**Fórmula de Controle Regulatório Vetorial Transacional NDpCal:**
O sistema calculará as frações calóricas protéicas reais moduladas dinamicamente:
```math
\text{NDpCal}_{global} = \frac{\Big( \sum_{m=1}^{M} (PTN_m \cdot x_m) \times NPU_m \Big) \times 4}{VET}
```
Para ser homologado pelo Edge Function da UAN globalmente, aplica-se ativamente as fronteiras jurídicas exigidas em inspeção auditorial:
```math
0.06 \le \text{NDpCal}_{global} \le 0.10
```
Isso força a I.A. de Sugestões de pratos a combinar matrizes de cereais limitantes com aminoácidos conjugados sem elevar o Custo FCOC monetário total.
