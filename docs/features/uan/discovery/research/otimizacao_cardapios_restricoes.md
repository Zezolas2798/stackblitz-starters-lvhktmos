---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# Base de Conhecimento UAN: Otimização de Cardápios e Restrições Matemáticas

Documento de referência focado na transcrição estrutural e algébrica das lógicas intradiárias, interdiárias e funções de similaridade sensorial para evitar o "Colapso Sensorial" e a convergência predatória de algoritmos ingênuos.


## 1. Fundamentação do "Menu Planning Problem" (MPP)
O desafio computacional saltou do "Problema da Dieta" contínua e reducionista de Stigler (1945) para a Programação Linear Inteira Mista (MILP) discreta de Balintfy (1964). No SaaS, a unidade alocada é sempre a preparação completa ou Ficha Técnica.

### Variáveis e Conjuntos Básicos
Para a modelagem num banco de dados relacional e no motor resolvedor (*Solver*), define-se:
* $\mathcal{M}$: O inventário universal do acervo, onde $M$ é o volume total de fichas técnicas/receitas quantificadas.
* $\mathcal{D}$: Horizonte temporal, fracionado em dias operacionais $d \in \{1, 2, ..., D\}$.
* $\mathcal{R}$: Os turnos ou "slots" estruturais de refeição (Desjejum, Prato Principal, Guarnição), fracionados em momentos $r \in \mathcal{R}$.

**A Decisão Binária Fundamental Estrita:**
Para evitar fracionamentos irreais, utiliza-se a matriz tridimensional algorítmica:
```math
x_{m,d,r} \in \{0, 1\}
```
- $x = 1$: O prato $m$ é escalado no momento $r$ do dia $d$.
- $x = 0$: Não escalado.

**Função Objetivo Operacional Vetorial:**
```math
\text{Minimizar } Z = \sum_{d=1}^{D} \sum_{r=1}^{R} \sum_{m \in \mathcal{M}} C_m \cdot x_{m,d,r}
```
Onde $Z$ é o Custo Global e $C_m$ é o Custo Per Capita associado da preparação $m$.

### 1.1. Limites Nutricionais (Dietary Conformity)
Para cada matriz do acervo isolada $a_{n,m}$ (conteúdo do nutriente $n$ na porção de prato $m$), a soma não deve ultrapassar restrições legais ($b_n^{min}$ e $b_n^{max}$) do PAT:
```math
b_n^{min} \le \sum_{r=1}^{R}\sum_{m \in \mathcal{M}} a_{n,m} \cdot x_{m,d,r} \le b_n^{max} \quad \forall d, n
```

A otimização cega exclusiva no eixo $C_m$ e na restrição paramétrica $a_{n,m}$ incorrerá em **Convergência Predatória** (seleção diária monótona de arroz, soja e repolho, gerando quebra de aceitabilidade dos comensais).

---

## 2. Engenharia de Variedade e Restrições Fortes (Hard Constraints)
Para manter o paladar aderente e quebrar a dependência algorítmica do prato mais barato, o SaaS impõe **Restrições de Frequência Algébricas Intradiárias e Interdiárias**.

### 2.1. Controle de Frequência Intradiária (Mesmo Dia)
Subconjuntos baseados na ontologia do ingrediente previnem aberrações de replicação na mesma refeição. Seja $\mathcal{M}_{ave} \subset \mathcal{M}$ o subconjunto de todos os pratos primários à base de carne de frango.

Regra imperativa limitando a incidência de frango ($F_{max} = 1$) no mesmo almoço para afastar a seleção cruzada predatória:
```math
\sum_{r \in \mathcal{R}} \sum_{m \in \mathcal{M}_{ave}} x_{m,d,r} \le 1 \quad \forall d
```
Se for escolhido *Frango Assado*, o sistema tranca algebricamente o valor em `1` para o subconjunto, impedindo seleções lógicas simultâneas isoladas e avulsas como *Salpicão de Frango* no mesmo indexador de turnos estruturais operacionais daquele momento.

### 2.2. Distanciamento Interdiário (Controle de Compassos Semanais)
O encurtamento interdiário gera fadiga e *turn-over*. Para preparações chaves estruturais complexas isoladas, a aparição em um ciclo restritivo contínuo $d \in \mathcal{D}$ (expresso como a contagem de janela limitante cíclica de 5 a 6 dias contínuos parametrizada transversalmente pelo usuário corporativo na interface) é limitada com parâmetros restritivos vetoriais:
```math
\sum_{d \in Ciclo} x_{m,d,r} \le 1
```
(Para bases calóricas primárias pesadas e toleradas, como tubérculos compostos fracionados, macarrão base e preparos de feijão contínuo padronizados isolados, a barreira do bloco contínuo vetorial de frequências lógicas $F_{max}$ é suspensa para a somatória restritiva absoluta numérica final e afrouxada transacional e vetorialmente para $\le 2$).

---

## 3. A Função de Similaridade Sensorial e o Eixo Meta-Heurístico
Onde os *solvers* de MILP engessam as restrições intradiárias, topologias arquiteturais modernas híbridas, utilizando meta-heurísticas genéticas como o *GRASP+ILS* ou *SHARP Framework*, empregam abordagens mais suaves e humanas de controle através da **Função de Similaridade ($\mathcal{S}$)**. 

Essa Função rastreia a distância de sombreamento da sobreposição entre dias de cardápio adjacentes. Entre o planejamento sequencial paramétrico isolado numérico do primeiro instante $d_1$ e o limiar vetorial $d_2$:
```math
\mathcal{S}(d_1, d_2)
```

A aferição estatística estruturada (baseada em *Jaccard Index* ontológico dos arrays dos dias) baseia-se na intersecção matemática isolada global sobre ingredientes pautados estritos de montantes base para pratos coincidentes ($\mathcal{I}_{pratos}$), ingredientes constituintes macro globais comuns associados à sobreposição orgânica avaliativa ($\mathcal{I}_{ingr}$) e também nos próprios índices estritos taxonômicos da cadeia sistêmica de grupos repassada à inteligência algorítmica ponderada local vetorial ($\mathcal{I}_{grupos}$). 

**Limiar de Fadiga de Crossover:**
A semântica de cálculo afasta dias nutricionais repassados ao limite global tolerante vetorial estrito de corte ($\lambda$), ou seja, dias adjacentes que são "semelhantes demais":
```math
\mathcal{S}(d_1, d_2) \le \lambda
```

*Nota para Arquitetura Global:* É imperativo que os índices $\lambda$ (fator de tolerância orgânica de repetição ou limitação heurística do paladar avaliativo do trabalhador da UAN) e as restrições estritas de frequência semanal dos arrays $F_{max}$ sejam modelados em componentes de tolerância não enrijecidos (`Frequency_Parameters` tabelado exposto dinâmico), permitindo ajuste na nuvem sem necessidade remota de reescrever ou compilar lógicas cruzadas da nuvem logada SaaS.

