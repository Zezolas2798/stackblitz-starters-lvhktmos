---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# 04 — Engenharia de Cardápios para UAN

> **Fonte:** `Engenharia de Cardápios para UAN.md`
> **Domínio:** PAT, Diretrizes Nutricionais, Harmonia Sensorial (AQPC), Per Capita
> **Finalidade:** Algoritmos de validação nutricional, regras de qualidade sensorial e tabelas de referência para fichas técnicas


## 1. Diretrizes Nutricionais — PAT (Programa de Alimentação do Trabalhador)

### 1.1 Base Legal
- **Portaria Interministerial nº 66/2006** — Parâmetros nutricionais (vigente)
- **Decreto nº 10.854/2021** — Regulamentação trabalhista
- **Portaria MTE nº 1.707/2024** — Vedações: proibido deságio, cashback, SVA. Foco exclusivo em segurança alimentar

### 1.2 Parâmetros de Energia (VET)

| Tipo de Refeição | VET Padrão | Acréscimo por Atividade Intensa |
|------------------|------------|--------------------------------|
| **Principal** (almoço, jantar, ceia) | **600–800 kcal** | Até +20% (teto: 1.200 kcal) |
| **Menor** (desjejum, lanche) | **300–400 kcal** | — |

**No SaaS:** Campo "Perfil da Coletividade" para ajustar teto validatório dinamicamente.

### 1.3 Distribuição de Macronutrientes (% do VET)

| Macronutriente | % Obrigatório | Regra Extra |
|----------------|---------------|-------------|
| **Carboidratos** | **60%** | Priorizar complexos (amido) sobre simples (sacarose) |
| **Proteínas** | **15%** | Pool de aminoácidos para massa magra e imunidade |
| **Lipídios** | **25%** | Gorduras saturadas < 10% do VET |

**Mesma proporção aplica-se** a refeições menores.
**Bloqueio:** Cardápio NÃO é liberado se proporções fora da faixa.

### 1.4 Micronutrientes e Fibras

| Nutriente | Refeição Principal | Refeição Menor |
|-----------|-------------------|----------------|
| **Fibras** | 7–10 g | 4–5 g |
| **Sódio** | Proporcional ao teto de **2.400 mg/dia** | — |

**Regras no SaaS:**
- Cardápio OBRIGA no mínimo: 1 fruta in natura + 1 hortaliça nas refeições principais
- Alerta severo se sódio excede proporção (bloquear caldos industrializados, embutidos, conservas)

### 1.5 Cálculo do NDpCal (Percentual Proteico-Calórico Líquido)

**Faixa obrigatória:** **6% ≤ NDpCal ≤ 10%**

**Fatores NPU por categoria alimentar:**

| Categoria | Fator NPU |
|-----------|-----------|
| Ovo (referência) | **1,0** |
| Carnes, pescados, laticínios | **0,7** |
| Leguminosas (feijão, lentilha, grão-de-bico) | **0,6** |
| Cereais, frutas, vegetais (arroz, trigo, milho) | **0,5** |

**Algoritmo de cálculo (4 etapas):**

```
1. NPU_ingrediente (g) = Proteína_Bruta (g) × Fator_NPU_categoria
2. NPCal (kcal) = Σ(NPU_todos_ingredientes) × 4
3. NDpCal (%) = (NPCal / VET_real) × 100
4. SE NDpCal ∉ [6.0, 10.0]:
   → BLOQUEAR aprovação do cardápio
   → Sugerir: substituir cortes, ajustar gramatura,
     balancear arroz (NPU 0,5) + feijão (NPU 0,6)
```

### 1.6 Compliance PAT no SaaS
- Gerar laudos técnicos diários: VET, NDpCal, fibras
- Audit trails imutáveis para fiscalização do MTE
- Provar que recursos subsidiados são investidos em alimentação adequada

---

## 2. Harmonia Sensorial — Método AQPC

### 2.1 Conceito
**AQPC (Avaliação Qualitativa das Preparações do Cardápio)** — Veiros & Proença (2003)
- Avalia além dos macronutrientes: cores, texturas, métodos de cocção, repetições, combinações antinutricionais
- Funciona em **paralelo** à validação do NDpCal

### 2.2 Critérios Computacionais

#### Critério 1: Contraste Cromático (Bimodal)
- **Tag no BD:** Cor predominante por preparação. Expansão para 1 Paleta de 10 opções: `Branco`, `Marrom`, `Verde`, `Vermelho`, `Amarelo`, `Laranja`, `Roxo`, `Preto`, `Bege`, `Misto`.
- **Frequência Bimodal (Configurável):**
  - **Limite por Refeição (Visual):** Focado na harmonia da bandeja. Máximo padrão sugerido: 2 itens da mesma cor.
  - **Limite por Dia (Variedade):** Focado na diversidade de fitoquímicos no ciclo circadiano. Máximo padrão sugerido: 3 itens da mesma cor.
- **Ação:** Bloqueio ou Aviso conforme configuração de severidade (`SOFT`/`HARD`).

#### Critério 2: Técnicas de Cocção e Frituras
- **Tag obrigatória:** Método primário de cocção (Cozido vapor, Assado, Grelhado, Frito imersão, Salteado, Cru)
- **Alerta moderado:** Presença de qualquer preparação frita
- **Alerta VERMELHO:** Fritura + doce rico em açúcar na sobremesa no mesmo dia
  - Lógica: hiperlipidemia + pico glicêmico → letargia pós-prandial → queda de produtividade
  - **Ação:** Sugerir troca do doce por fruta fresca

#### Critério 3: Alimentos Ricos em Enxofre (Flatulência - Detecção Automática)
- **Motor de Detecção:** Identificação via **Subgrupo de Ingrediente** mapeado na taxonomia (`MAP_SUBGRUPO_ENXOFRE`).
- **Limiar de Relevância (Threshold):** Ignorar se ingrediente flatulento for < 5% do peso bruto total da ficha técnica (evita alertas por temperos como alho/cebola).
- **EXCEÇÃO CULTURAL:** "Feijão" é ignorado **APENAS** se vinculado à categoria `"Prato Base"`. Preparações como "Feijão Tropeiro" (Guarnição) seguem a regra padrão de peso.
- **Validação Bimodal:**
  - **Limite por Refeição:** Máximo sugerido 1-2 itens (foco no desconforto imediato).
  - **Limite por Dia:** Máximo sugerido 2-3 itens (foco no balanço digestivo diário).
- **Alerta:** Aviso de "Desconforto Gástrico/Flatulência".

#### Critério 4: Repetições e Carnes Gordurosas
- **Rastreador temporal:** Impedir repetição de cortes/texturas/sabores na mesma semana
- **Monitorar:** costela, pernil, linguiças, salsichas, feijoada, hambúrgueres industriais
- **Alerta:** Carne gordurosa + sobremesa doce no mesmo dia = aspecto qualitativo ruim

#### Critério 5: Indicadores Positivos
- **Pontuação Verde:** Hortaliças cruas folhosas variadas presentes + frutas in natura como sobremesa

### 2.3 Escore Global AQPC — Classificação

| Classificação | % Aspectos Positivos | Ação no Sistema |
|---------------|---------------------|-----------------|
| **Ótimo** | ≥ 90% | Aprovação automática |
| **Bom** | 75% a < 90% | Falhas menores de planejamento |
| **Regular** | 50% a < 75% | Alerta Amarelo — revisão pontual |
| **Ruim** | 25% a < 50% | Alerta Vermelho — inadequado |
| **Péssimo** | < 25% | Bloqueio recomendado — insalubre |

---

## 3. Referências de Per Capita

### 3.1 Variáveis Fundamentais

| Variável | Definição | Fórmula |
|----------|-----------|---------|
| **PL (Per Capita Líquido)** | Peso do alimento após pré-preparo (parte edível) | Base para cálculo nutricional |
| **PB (Per Capita Bruto)** | Peso do alimento como adquirido (com cascas, ossos, etc.) | Base para MRP/Compras |
| **FC (Fator de Correção)** | Índice de perda de pré-preparo | `FC = PB / PL` |
| **FCy (Fator de Cocção)** | Razão peso cozido / peso cru limpo | < 1 proteínas; > 1 carboidratos |

### 3.2 Tabela de Proteínas — Per Capita Padrão

| Gênero | PB (g) | PL Estimado (g) | FC Aproximado |
|--------|--------|-----------------|---------------|
| Carne bovina muscular (bife, alcatra) | 200 | 130–150 | ~1,5 |
| Carne bovina moída | 150 | 130 | ~1,15 |
| Carne bovina com osso (costela, rabada) | 290–300 | 140 | ~2,1 |
| Carne suína com osso (bisteca) | 250 | 130 | ~1,9 |
| Carne suína desossada (pernil, lombo) | 180–200 | 140 | ~1,4 |
| Aves com osso (coxa, sobrecoxa) | 300 | 140–160 | ~2,0 |
| Aves desossadas (filé de peito, sassami) | 180 | 130–150 | ~1,3 |
| Pescados limpos (filé tilápia, merluza) | 150 | 130 | ~1,1 |
| Pescados com osso (posta) | 200 | 140 | ~1,4 |
| Vísceras (fígado bovino) | 180 | 140 | ~1,3 |
| Embutidos (calabresa, toscana) | 150 | 140 | ~1,05 |

### 3.3 Tabela de Cereais, Guarnições e Amiláceos

| Gênero | PB Seco (g) | Rendimento Pós-Cocção | Observações |
|--------|-------------|----------------------|-------------|
| Arroz branco/parboilizado | 100 | 250–300g (FCy ~2,5) | Base dos 60% de carboidratos do PAT |
| Feijão seco | 50 | ~150g (FCy ~2,0–3,0) | NPU 0,6. Principal fonte de fibras e complexo B |
| Massa (espaguete, penne) | 50 | Expansão moderada | Guarnição densa em energia |
| Lentilha / Grão-de-bico | 30–40 | Hidratação intensa | Substituto rotacional do feijão |
| Farináceos (farofa) | 40 | FC/FCy ~1,0 | Alta densidade calórica sem expansão |
| Batata (purê) | 150 | ~120g PL após cocção | Liga com laticínios e óleos |
| Batata (frita palito) | 180 | Perda severa por desidratação | PB alto pelo processo de fritura a 180°C |
| Mandioca/Aipim | 180–200 | FC muito alto | Casca lenhosa, entrecasco, cordão fibroso |

### 3.4 Tabela de Saladas e Hortaliças

| Gênero | PB (g) | PL Estimado (g) | Observações |
|--------|--------|-----------------|-------------|
| Folhosos (alface, rúcula, agrião) | 80 | 40–50 | FC sazonal muito alto e volátil |
| Tomate | 80 | Moderado | Perda de pedúnculo, extremidades, sementes |
| Cenoura crua (ralada) | 60 | ~FC 1,1–1,2 | Excelente rendimento |
| Cenoura cozida (guarnição quente) | 150 | Compactação e desidratação | PB maior que versão crua |
| Beterraba crua (ralada) | 60 | Similar à cenoura | Baixa perda de casca |
| Brócolis | 120 | FC alto | Flag AQPC: rico em enxofre |
| Couve-flor | 150 | FC alto | Flag AQPC: rico em enxofre |
| Chuchu | 220–250 | Muito baixo rendimento | FC altíssimo (casca, semente, seiva) |
| Abobrinha | 120 | FC baixo | Bom aproveitamento cru e cozido |

**Nota:** FC de hortaliças é o mais volátil. SaaS deve prever revisão sazonal pelo comprador.

---

## 4. Requisitos Funcionais para o SaaS

| Requisito | Detalhamento |
|-----------|-------------|
| **Validação PAT bloqueante** | VET, macronutrientes, NDpCal, fibras, sódio — hard constraints |
| **Motor AQPC** | 5 critérios sensoriais em paralelo ao nutricional |
| **Cálculo NDpCal automático** | BD mapeado com NPU por categoria alimentar |
| **Tabelas de Per Capita default** | Seed data configurável por nutricionista chefe |
| **FC = PB/PL como trigger** | Inserção de PL auto-calcula PB para compras |
| **Perfil da Coletividade** | Ajustar teto calórico por atividade física |
| **Audit trails** | Laudos técnicos diários para MTE |
| **Dashboard AQPC** | Escore global mensal (Ótimo → Péssimo) |
| **Alertas visuais** | Cores: Verde (positivo), Azul (enxofre), Rosa (monotonia cor), Vermelho (fritura+doce) |

