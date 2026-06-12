---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# 03 — Engenharia de Processos em UAN

> **Fonte:** `Engenharia de Processos em UAN.md`
> **Domínio:** Layout, Fluxo Operacional, Tempo-Temperatura, Dimensionamento de Equipamentos
> **Finalidade:** Regras de negócio para fluxo de produção, bloqueios de sistema e capacity planning


## 1. Layout e Marcha à Frente (Fluxo Unidirecional)

### 1.1 Conceito Fundamental
- **Marcha à Frente:** Alimento percorre caminho contínuo e progressivo do recebimento à distribuição
- **Proibido:** Retrocesso ou cruzamento de etapas sujas com etapas limpas
- **Objetivo:** Eliminar contaminação cruzada (principal causa de DTAs)
- **Base legal:** RDC 216/2004

### 1.2 Zonas Operacionais (arquitetura de telas do SaaS)

| Zona | Setor | Função | Gate no SaaS |
|------|-------|--------|-------------|
| **Suja** | Recepção e Inspeção | Inspeção visual, pesagem bruta, aferição térmica | Gate 1: Exigir temp. do lote + condição embalagem → gerar etiqueta código de barras |
| **Intermediária** | Armazenamento (seco + câmaras frias) | Estocagem entre recepção e pré-preparo | Posicionamento estratégico no fluxo |
| **Transição** | Pré-preparo e Descondicionamento | Higienização de hortifrútis, corte de carnes | Separação física: carnes cruas ≠ vegetais |
| **Limpa** | Preparo e Cocção | Tratamento térmico (letalidade microbiana) | Produtos NÃO retornam ao pré-preparo |
| **Segura** | Distribuição | Entrega ao consumidor | Controle atmosférico rigoroso |
| **Reverso Isolado** | Devolução e Higienização | Lavagem de louças/panelas | Fisicamente blindado do fluxo principal |

### 1.3 Dimensionamento Físico

**Fórmula geral de área:** `0,5 m² por cliente` (quando > 1.000 clientes)

**Capacidades de estocagem fria** (Volume em litros):

| Tipo | Faixa Temp. | Fórmula | Exemplo 1.500 ref/dia × 15 dias |
|------|-------------|---------|--------------------------------|
| Carnes | 0°C a 2°C | `V = N × d × fator_carne` | Resultado específico por fórmula |
| Vegetais | 4°C a 6°C | `V = N × d × fator_vegetal` | Resultado específico por fórmula |
| Congelados | -15°C a -18°C | `V = N × d × fator_congelado` | Resultado específico por fórmula |

**Área plana por 1.000 refeições:**
- Câmara hortifrúti: **14 m²/1.000 ref** (21 m² para 1.500)
- Câmara carnes: **13 m²/1.000 ref** (19,5 m² para 1.500)

**Regra do SaaS:** Emitir alertas preditivos se pedidos de compra excedem capacidade volumétrica configurada.

### 1.4 Marcha à Frente na UX/UI — Regras de Bloqueio

**Estado machine:** Cada ordem de produção = entidade com `Status` imutável de retrocesso.

| Regra | Comportamento |
|-------|--------------|
| **Incompatibilidade de Telas** | Operador logado em "Higienização" NÃO pode dar baixa em "Distribuição" |
| **Color Coding** | Headers: Carne bovina = vermelho, Aves = amarelo, Vegetais = verde (padrão tábuas polietileno) |
| **Checklists Bloqueantes (Hard Stops)** | Status `ESTOQUE_CARNES` → `EM_PREPARO` exige confirmação digital (PIN/biometria) de sanitização da bancada |
| **Violação de Fluxo** | Tentativa de enviar sobras da Distribuição → Pré-preparo = **ERRO GRAVE** ("Violação de Fluxo Unidirecional — Contaminação Cruzada Iminente") |

---

## 2. Controle de Tempo e Temperatura (CVS 5/2013 + RDC 216/2004)

### 2.1 Armazenamento — Shelf-life por Faixa de Temperatura

#### Congelados

| Faixa de Temperatura | Prazo Máximo Legal |
|----------------------|-------------------|
| 0°C a -5°C | **10 dias** |
| -6°C a -10°C | **20 dias** |
| -11°C a -18°C | **30 dias** |
| Abaixo de -18°C | **90 dias** |

#### Refrigerados

| Categoria | Temp. Máxima | Prazo Máximo |
|-----------|-------------|-------------|
| Pescados crus manipulados | 2°C | **3 dias** |
| Pescados pós-cocção | 2°C | **1 dia** |
| Alimentos pós-cocção (exceto pescados) | 4°C | **3 dias** |
| Carnes cruas (bovina, suína, aves) | 4°C | **3 dias** |

**Algoritmo de Validade Automática no SaaS:**
```
QUANDO operador registra lote fracionado na tela "Entrada no Estoque":
  1. Inserir temperatura do equipamento (real-time)
  2. Sistema cruza temp. aferida × matrizes legais acima
  3. Gera automaticamente data de validade restritiva
  4. Impressora térmica emite etiqueta:
     - Data de Produção
     - Prazo de Validade (NÃO editável pelo operador)
     - Responsável
```

### 2.2 Cocção e Resfriamento Rápido

**Cocção:** Centro geométrico ≥ 70°C (parametrizado em graus-minuto)

**Resfriamento Rápido (Art. 45 e 47, CVS 5/2013):**
- Tempo máximo: **2 horas (120 min)**
- Destino refrigeração: Temp. < 5°C
- Destino congelamento: Temp. ≤ -18°C

**UX/UI do Blast Chiller no SaaS:**
```
1. Ordem de produção finaliza cocção
2. Cronômetro regressivo inicia: 02:00:00
3. Ao final do ciclo: exigir leitura de sonda térmica
   (manual OU via IoT)
4. SE temp. < 5°C NÃO atestada em 2h:
   → Trava lógica
   → Status do lote = "Inadequado"
   → Impede expedição para estoque de distribuição
```

### 2.3 Distribuição — Rampa de Manutenção

**Banho-maria:** Água sob cuba = **80°C a 90°C**

| Condição | Temp. Centro Geométrico | Tempo Máximo |
|----------|------------------------|-------------|
| Distribuição a Quente | ≥ 60°C | **6 horas** |
| Distribuição a Quente | < 60°C | **1 hora** |
| Distribuição a Frio | ≤ 10°C | **4 horas** |
| Distribuição a Frio | 10°C a 21°C | **2 horas** |

**Dashboard de Rampa no SaaS:**
```
QUANDO cuba de arroz (Quente) atinge rampa:
  → Tracking iniciado
  SE aferição = 62°C → Permite 6 horas
  SE aferição subsequente = 58°C (< 60°C):
    → Alerta vermelho escarlate (piscar)
    → Reescrever timer: 6h → 1h (dinamicamente)
    → Push notification: "Ação Corretiva Imediata: Reaquecer ou Descartar"
```

### 2.4 Guarda de Amostras (Art. 52, CVS 5/2013)

| Parâmetro | Regra |
|-----------|-------|
| Momento da coleta | Durante a **2ª hora** do tempo de distribuição |
| Amostras quentes | Congelar a **-18°C** por **72 horas** |
| Amostras frias/líquidas | Refrigerar a **≤ 4°C** por **72 horas** |

**Automação no SaaS:**
- Lembrete às 1h45 de distribuição: "Recolher amostra"
- Alerta silencioso 3 dias depois: "Aprovar descarte da amostra retida"

---

## 3. Dimensionamento de Equipamentos (Capacity Planning)

### 3.1 Variáveis Fundamentais

| Variável | Definição | Uso no SaaS |
|----------|-----------|-------------|
| **Per Capita Líquido (P.C.)** | Massa de alimento cru/limpo por porção (em gramas) | Input da ficha técnica |
| **Fator de Correção (FC)** | Peso bruto / Peso líquido (perda de aparas, cascas, ossos) | Módulo de Compras |
| **Fator de Cocção (FCc)** | Peso cozido / Peso cru limpo | FCc < 1 para proteínas (perdem água), FCc > 1 para carboidratos (absorvem líquido: 2,0–2,5) |

### 3.2 Fórmula de Dimensionamento — Caldeirões

**Regra de segurança:** Volume efetivo ≤ 90% da capacidade (10% = câmara de ar de segurança)

```
V_necessário = (N_comensais × P.C. × FCc) / 1000
V_total = V_necessário × 1.10  (+ 10% câmara de ar)
```

**Exemplos práticos:**

| Caso | Preparação | Comensais | P.C. | FCc | V_base | V_total (c/ 10%) | Equipamento |
|------|-----------|-----------|------|-----|--------|-------------------|-------------|
| 1 | Arroz | 1.500 | 100g | 2,5 | 375 L | 412,5 L | **1× Caldeirão 500L** |
| 2 | Arroz | 2.300 | 74g | 2,33 | 396,5 L | ~436 L | **1× Caldeirão 500L** |
| 3 | Feijão | 1.500 | 50g | 2,0 | 150 L | 165 L | **1× Caldeirão 300L** |

### 3.3 Dimensionamento — Fornos Combinados (Sistema Gastronorm)

**Unidade base:** GN 1/1 (530mm × 325mm)

| Tamanho do Forno | Produção por Turno |
|------------------|--------------------|
| 3 GNs (compacto) | ~100 refeições |
| 6 GNs (bancada) | ~210 refeições |
| 10 GNs (vertical) | ~350 refeições |
| 20 GNs (industrial chão) | ~700 refeições |
| 40 GNs (Roll-in) | ~1.400 refeições |

**Regra:** Planejar para ~133% da capacidade nominal (ex: 1.500 ref → infraestrutura para 2.000)

**UI de Agendamento:** Se cozinha possui apenas 1× Forno 20 GNs (700 ref):
- SaaS gera **Gráfico de Gantt** de escalonamento
- Fracionamento em 2–3 ciclos consecutivos
- Distribui racionalmente ao longo das horas matutinas

### 3.4 Maquinário Complementar

**Para ~1.500 refeições:**
- **12 bocas térmicas** industriais (2 grelhas × 6 bocas = 2 ilhas operacionais)
- **Frigideira Basculante:** ~60 litros

**Regra de bloqueio no SaaS:**
```
SE cozinheiro tenta preparar estrogonofe para 1.500 comensais
   APENAS na frigideira basculante de 60L:
→ BLOQUEIO do cardápio
→ Aviso de subdimensionamento físico
→ Transferência mandatória do peso para Caldeirão
```

---

## 4. Regra Transversal: SaaS como Sistema Ciberfísico

O SaaS **NÃO** é um ERP passivo. É um **Sistema Ciberfísico (CPS)** e **PCC digital**:

- **Máquina de estados finitos (state-machine):** Avanço de lote para próxima etapa é logicamente impossível sem validação
- **Bloqueios de incompatibilidade** entre terminais e zonas
- **Capacity planning integrado:** Cardápio só é validado se somatório dos volumes nominais ≤ capacidade física instalada
- **Color coding** reforça segregação física
- **Assinatura digital** (PIN/biometria) para transições críticas

