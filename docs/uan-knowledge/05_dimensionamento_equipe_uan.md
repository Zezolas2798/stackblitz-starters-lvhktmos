# 05 — Dimensionamento de Equipe em UAN

> **Fonte:** `Dimensionamento de Equipe em UAN.md`
> **Domínio:** RH, Dimensionamento de Pessoal, Indicadores de Produtividade, Ergonomia (NR-17)
> **Finalidade:** Fórmulas e regras de negócio para módulo de RH analítico-preditivo

---

## 1. Fórmulas de Dimensionamento de Pessoal

### 1.1 Indicador de Pessoal Fixo (IPF)

**Definição:** Quantidade absoluta de funcionários que devem estar simultaneamente presentes para executar o volume diário de refeições.

```
IPF = (N_refeições × Tempo_médio_por_refeição_min) / (Jornada_diária_horas × 60)
```

**Regras para o SaaS:**
- **Conversão de equivalência:** 10 pequenas refeições = 1 grande refeição (desjejum, colações, lanches → conversão para volume produtivo padronizado)
- **Tempo médio (IR):** Varia inversamente ao volume (economia de escala) — ver Seção 2
- **Segmentação por turno:** Se UAN opera 24h (hospitais), calcular IPF por turno quando há regimes mistos (8h + 12h)

**Exemplo:** 1.000 refeições, jornada 8h, IR = 12 min:
```
IPF = (1.000 × 12) / (8 × 60) = 12.000 / 480 = 25 funcionários fixos
```

### 1.2 Indicador de Substituição de Descanso (ISD) e Pessoal Substituto (IPS)

**ISD:** Coeficiente que correlaciona dias trabalhados no ano com dias de afastamento remunerado.

```
ISD = Dias_trabalhados / Dias_descanso
```

**Por tipo de escala:**

| Escala | Dias Descanso/Ano | Dias Trabalhados | ISD |
|--------|-------------------|-----------------|-----|
| **6×1** | ~90 (30 férias + 48 domingos + 12 feriados) | 275 | **~3,05** |
| **12×36** | ~198 (30 férias + 168 alternância) | 167 | **~0,84** |

**IPS (Pessoal Substituto = folguistas):**
```
IPS = IPF / ISD
```

**Regra crítica:** Arredondamento SEMPRE para cima (ceiling). Fração inferior = descobertura de turno.

**Exemplo (6×1):** IPS = 25 / 3,05 = 8,19 → **9 substitutos**

### 1.3 Absenteísmo (IAD) e Pessoal Total (IPT)

**IAD (Indicador de Absenteísmo Diário):**
```
IAD (%) = (Média_diária_ausentes / IPF) × 100
```

**Teto aceitável:** **5%** (acima = impacto direto no nível de serviço)

**Reserva de contingência:** O SaaS calcula 5% do IPF como funcionários de reserva.

**IPT (Indicador de Pessoal Total):**
```
IPT = IPF + IPS + Reserva_absenteísmo
```

**Exemplo:** IPT = 25 + 9 + 2 = **36 funcionários**

**Alertas do SaaS:**
- Efetivo ativo < IPT → Alerta "Sobrecarga da Equipe"
- Botão "Sugerir Novas Contratações"

### 1.4 Compliance Legal — Resolução CFN nº 600/2018

**Natureza:** Hard constraint (restrição absoluta) — infração = multas do CRN.

**UANs Institucionais (alimentação coletiva):**
- **30 horas semanais** do nutricionista a cada incremento de **1.000 grandes refeições/dia**
- Trigger: quando média móvel mensal cruza barreira de milhar → Alerta "Inconformidade Legal"

**ILPIs (Instituições de Longa Permanência para Idosos):**

| Volume (refeições/dia) | Nutricionistas Mín. | Carga Horária Cada |
|-----------------------|---------------------|-------------------|
| Até 100 | 1 | 20h/semana |
| 101–300 | 1 | 30h/semana |
| 301–500 | 2 | 30h/semana |
| 501–2.000 | 3 | 30h/semana |
| 2.001–3.000 | 4 | 30h/semana |
| > 3.000 | 4 + 1 por 1.000 extras | 30h/semana |

**Validação no SaaS:** Cruzar refeições (módulo produção) × folha de pagamento (módulo RH). Detectar violações e emitir alerta jurídico.

### 1.5 Proporção Interna do Efetivo Operacional

| Categoria | % do IPT | Funções |
|-----------|---------|---------|
| Chefia/Liderança | 8–10% | Chef, líderes de turno, almoxarife |
| Técnico Especializado | 20–25% | Cozinheiros, confeiteiros, padeiros, açougueiros |
| Base Operacional | 65–72% | Auxiliares de cozinha, ASGs (pré-preparo + higienização) |

**SaaS:** Botão "Sugerir Contratações" gera requisições balanceadas por categoria.

---

## 2. Indicadores de Produtividade

### 2.1 Indicador de Rendimento (IR) — Matriz de Gandra e Gambardella

**Tempo ideal (minutos/refeição) por faixa de volume:**

| Volume (refeições/dia) | Tempo Médio Aceitável (min/ref) |
|------------------------|-------------------------------|
| 300–500 | 15–14 |
| 500–700 | 14–13 |
| 700–1.000 | 13–10 |
| 1.000–1.300 | 10–9 |
| 1.300–2.500 | 9–8 |
| > 2.500 | < 7 |

**Cálculo do IRD real (diário):**
```
IRD = (N_funcionários × Jornada_horas × 60) / N_refeições_servidas
```

**Cross-checking no SaaS:**
- IRD **abaixo** da faixa de Gandra → **Alerta "Sobrecarga de Produção — Risco Operacional Elevado"** (fadiga, acidentes com facas, queimaduras)
- IRD **acima** da faixa de Gandra (ex: 16 min onde norma prevê 12) → **Alerta "Ociosidade e Ineficiência"** (remanejamento ou congelamento de contratações)

### 2.2 Indicador de Produtividade Individual (IPI) — Matriz de Mezomo

**Refeições por empregado por dia:**

| Volume (refeições/dia) | IPI Ideal (ref/funcionário) |
|------------------------|---------------------------|
| Até 100 | 30 |
| 100–300 | 35 |
| 300–500 | 40 |
| 500–1.000 | 50 |
| 1.000–1.500 | 55 |
| 1.500–3.000 | 60 |
| > 3.000 | 66 (teto) |

**Dashboard do SaaS:** Gráficos em tempo real:
- 🟢 Verde = adequação
- 🟡 Amarelo = alerta
- 🔴 Vermelho = risco

**Exemplo:** 25 funcionários servindo 2.000 pratos → IPI real = 80. Faixa 1.500–3.000 permite máximo 60. IPI 80 = **33% acima do limite de exaustão** → Bloquear cortes na escala, acionar recrutamento emergencial.

---

## 3. Ergonomia e NR-17

### 3.1 Biomecânica e Movimentação de Cargas (Item 17.5)

**Regras legais com impacto no SaaS:**

| Item NR-17 | Regra | Impacto no Módulo RH |
|------------|-------|---------------------|
| 17.5 | Proibido transporte manual de carga que comprometa saúde física | — |
| 17.5.1.1 | **Redução obrigatória** de carga para mulheres e menores | SaaS deve ler gender mix e faixa etária → reduzir expectativa de rendimento ou sugerir ↑ IPS ou aquisição de equipamentos mecânicos |
| 17.5.2.1 | Proibido levantamento rotineiro se distância horizontal > 60cm do eixo corporal | Bancadas largas → Alerta de Passivo Ergonômico |
| 17.5.4.e | Pausas compensatórias obrigatórias | Se pausas 10 min/2h: jornada efetiva = ~440 min (não 480) → IPF aumenta |

**Efeito no IPF:**
```
SE pausa_compensatória ativa:
  Jornada_efetiva = 440 min (não 480)
  IPF recalculado com denominador menor → mais funcionários necessários
```

### 3.2 Sobrecarga Termometabólica (Item 17.8)

**Problema:** Estresse térmico em áreas de cocção → queda de rendimento metabólico.

**Integração IoT:**
- Sensores ambientais ou laudos LTCAT com índice IBUTG
- SaaS detecta faixas de sobrecarga térmica

**Deflator de IPI:**
```
SE IBUTG em faixa de sobrecarga:
  IPI_tolerado = IPI_normal × deflator (ex: 50 → 45 ou 40)
  → Sistema induz contratação de horistas (part-time) sazonal
```

### 3.3 Ritmo Impositivo e Fadiga Psicofisiológica

**"Horário de Rampa":** Pico de 2 horas do almoço condensa toda a pressão sobre a brigada.

**Ciclo vicioso detectável pelo SaaS:**
```
1. Gestor nega contratações sugeridas
2. IPI > 60, IRD < 8 min → "Sobrecarga Alta" mantida por semanas
3. Curva de IAD na dashboard começa a subir: 5% → 12% → 18%
4. Faltas abruptas (mialgias, crises hipertensivas, burnout)
5. IPI dos remanescentes explode → ciclo vicioso letal
```

**Alerta avançado do SaaS:**
- Não indica apenas "falta de pessoal"
- Codifica: "Organização do trabalho desequilibrada (NR-17 item 17.4) → violação PGR (NR-01) → risco de culpa in vigilando em contencioso trabalhista / ação regressiva do INSS"

---

## 4. Requisitos para o Módulo de RH do SaaS

| Funcionalidade | Detalhamento |
|----------------|-------------|
| **Cálculo automático IPF** | Dados de produção (comensais) + contratos (jornada) + conversão de equivalência |
| **ISD dinâmico** | Parametrizado por tipo de escala cadastrada (6×1, 12×36, etc.) |
| **IPS com ceiling** | Arredondamento obrigatório para cima |
| **Monitoramento IAD** | Integração com catracas/relógios de ponto |
| **IPT = IPF + IPS + reserva** | Métrica final exibida ao gestor |
| **Compliance CFN 600/2018** | Trigger automático por faixa de volume × nutricionistas |
| **IRD real vs. Gandra** | Cross-checking diário com alertas bidirecionais |
| **IPI real vs. Mezomo** | Dashboard com semáforo (verde/amarelo/vermelho) |
| **Ergonomia NR-17** | Leitura de gender mix, pausas compensatórias, deflator térmico |
| **Preditivo de absenteísmo** | Curva mensal + correlação com IPI/IRD para prever ciclo vicioso |
| **Alertas jurídicos** | NR-17 + NR-01 (PGR) + CFN → compliance trabalhista |
