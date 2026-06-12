---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# 06 — Indicadores de Desperdício em UAN

> **Fonte:** `Indicadores de Desperdício em UAN.md`
> **Domínio:** Controle de Desperdício, ESG, Balanço de Massa, Destinação de Resíduos
> **Finalidade:** Fórmulas de desperdício, benchmarks para dashboards (gauges verde/amarelo/vermelho), estratégias de mitigação e compliance ESG


## 1. Taxonomia do Desperdício

O desperdício é um **processo cumulativo** — do recebimento até a devolução de bandejas. Para produtos finalizados (prontos para consumo), a literatura categoriza em três dimensões:

### 1.1 Sobra Limpa (Produção Não Distribuída)

**Definição:** Alimento planejado, processado e finalizado na cozinha, mas que **nunca foi exposto** no balcão/self-service. Permaneceu em panelas, estufas, pass-throughs ou câmaras na área interna.

- **Integridade microbiológica preservada** → pode ser reaproveitado (com resfriamento rápido e etiquetagem)
- **Diagnóstico:** Alto índice = falha de forecasting, per capita superdimensionado, "medo de faltar"

**Fórmula:**
```
% Sobra Limpa = (Peso_sobra_limpa / Peso_total_produzido) × 100
```

### 1.2 Sobra Suja (Resto de Balcão)

**Definição:** Alimento que **foi exposto** nos balcões térmicos, vitrines ou rampas de self-service, mas não foi servido e remanesceu nas cubas após encerramento.

- **IMPRÓPRIO para consumo humano** — proibido reaproveitamento ou doação
- Razão: quebra da cadeia de biossegurança (oscilações térmicas, perdigotos, talheres compartilhados)
- **Diagnóstico:** Reposições excessivas nos minutos finais (cultura estética de "aparência de abundância")

**Fórmula:**
```
% Sobra Suja = (Peso_sobra_suja / Peso_total_produzido) × 100
```

### 1.3 Índice de Sobras Totais (IST)

**Métrica agregadora:**
```
IST (%) = [(Peso_sobra_limpa + Peso_sobra_suja) / Peso_total_produzido] × 100
```

### 1.4 Resto-Ingesta (RI) — Devolução do Comensal

**Definição:** Alimento servido e depositado nos pratos/bandejas dos comensais, mas **rejeitado e devolvido** nas lixeiras (escarção). Desperdício de ponta de linha.

- **Maior gravidade financeira:** embute custo do insumo + água + energia + mão de obra + desgaste de equipamento + distribuição
- **Causas:** cardápio monótono, falha culinária, utensílios de porcionamento grandes demais, ausência de educação alimentar

**Regra crítica:** O denominador do % RI é a **Refeição Distribuída**, NÃO a produção total.

```
Refeição Distribuída (kg) = Peso_total_produzido – (Peso_sobra_limpa + Peso_sobra_suja)
```

**Fórmula Percentual:**
```
% RI = (Peso_resto_ingesta / Peso_refeição_distribuída) × 100
```

**Fórmula Per Capita:**
```
RI per capita (g) = (Peso_resto_ingesta / N_comensais) × 1000
```

**Nota ESG:** Descontar partes não comestíveis (ossos, cascas, espinhas) conforme FLW Protocol.

---

## 2. Benchmarks — Gauges do Dashboard

### Premissa fundamental
A parametrização **difere conforme o perfil da coletividade:**
- **Coletividades enfermas** (hospitais): RI organicamente muito superior → parâmetros diferentes
- **Coletividades sadias** (restaurantes industriais PAT, universitários, corporativos): tolerância severa

> Os benchmarks abaixo são para **coletividade sadia**.

### 2.1 Benchmarks de Resto-Ingesta

**Referências:** Vaz (2006) — excelência: **2–5%** / **15–45g per capita**; Mezomo — escala flexível.

| Status (Gauge) | % RI | Per Capita (g/pessoa) | Avaliação |
|----------------|------|-----------------------|-----------|
| 🟢 **Verde (Excelência)** | ≤ 5,0% | ≤ 45,0g | Eficiência máxima. Cardápio alinhado ao consumidor. Porcionamento excelente |
| 🟡 **Amarelo (Atenção)** | 5,1% a 10,0% | 45,1g a 60,0g | Aceitável com flutuações. Falhas pontuais de porcionamento ou prato com rejeição moderada |
| 🔴 **Vermelho (Crítico)** | > 10,0% | > 60,0g | Risco severo de prejuízo. Ausência de campanhas educativas, cardápio rechaçado, falha de cocção |

**Dados de campo:** UANs sem gestão ativa: média 9,45%, > 77,82g/pessoa.

### 2.2 Benchmarks de Sobras Totais

**Referência:** Vaz (2006) — teto: **7–10%**.

| Status (Gauge) | IST (%) | Avaliação |
|----------------|---------|-----------|
| 🟢 **Verde (Eficiência)** | ≤ 7,0% | Forecasting assertivo. Just-in-Time nas reposições. Controle térmico alto |
| 🟡 **Amarelo (Alerta)** | 7,1% a 10,0% | Excesso de margem de segurança. Produção de lotes máximos cedo demais |
| 🔴 **Vermelho (Ineficiência)** | > 10,0% | Compras superdimensionadas. Inobservância de fichas técnicas. Produção perdulária |

### 2.3 Inteligência de Correlação

**Cenário de "Inversão de Polaridade":**
- Sobras 🔴 (muito excedente) + RI 🟢 (rejeição zero)
- Significado: comensais aprovam a comida, mas cozinha perdeu controle da produção
- SaaS deve alertar gestor sobre desperdício interno mesmo com satisfação do comensal

**Correlação estatística:** Pesquisas com coeficiente de Spearman mostram correlação positiva entre Sobra Limpa de guarnições e RI → preparação rejeitada na frente também acumula na retaguarda.

---

## 3. Estratégias de Mitigação e Destinação (ESG)

### 3.1 Redução de Resto-Ingesta — Eixo Operacional

#### Técnico (Gestão)
- **Ficha Técnica de Preparação (FTP):** Padroniza sal, especiarias, tempo de cocção e rendimento por cuba
- Treinamento contínuo em FTP previne rejeição por falhas culinárias
- **Nudge Theory:** Utensílios menores na rampa (escumadeiras fracionadas, carnes cortadas em pedaços discretos) → quebra ciclo de excesso visual

#### Comportamental (Campanhas)
- **Campanhas Educativas Gamificadas** > avisos estáticos
- Resultados documentados:
  - 25 dias de campanha: RI de 60,0g → 39,3g (**–34,6% no custo**)
  - Estudo Souza (1995): **–31,4%** no RI
  - Estudo Corrêa (2006): **–91,95%** no RI

**Funcionalidade SaaS:**
- Reporting dinâmico: infográficos em tempo real para TVs no refeitório
- Exemplo: "Nesta semana evitamos o desperdício de 300kg. Parabéns a todos!"

### 3.2 Doação de Alimentos — Eixo Social (ESG "S")

#### Base Legal: Lei Federal nº 14.016/2020
- **Combate ao desperdício** por isenção de responsabilidade objetiva ao doador
- Doador **só responde** se comprovado **dolo** (intenção criminosa) ou **culpa grave** com total desprezo sanitário
- Alimentos doados devem: manter propriedades nutricionais, obedecer prazo de validade, estar seguros

**Aplicação:** Apenas **Sobras Limpas** (integridade microbiológica preservada). Sobras Sujas e RI = PROIBIDOS.

**Funcionalidade SaaS:**
- Módulo Social integrado
- Registrar volume de Sobra Limpa → gerar **Termos de Doação** (Lei 14.016/2020) com 1 clique
- Rastrear temperatura de saída e documentar transferência para banco de alimentos
- Algoritmo: Peso doado × fator de refeição padrão → relatório ESG: "Nº de Famílias Atendidas", "Impacto Social Gerado"
- Audit trail para relatórios de sustentabilidade

### 3.3 Gestão de Resíduos Orgânicos — Eixo Ambiental (ESG "E")

#### Base Legal: PNRS — Lei nº 12.305/2010
- Dever jurídico de redução, reutilização e reciclagem
- Aterro = **última linha** (apenas rejeitos inertes esgotados tecnologicamente)
- Resíduos orgânicos de cozinhas **não são rejeitos** → matéria-prima para economia circular
- Leis municipais (ex: PL 472/2022 SP) vedam aterro para lixo orgânico industrial/comercial

#### Destinações Corretas

| Método | Processo | Resultado |
|--------|---------|-----------|
| **Compostagem Aeróbia Industrial** | Revolvimento mecânico + controle de umidade + inoculação aeróbia → temperatura até 70°C | Fertilizante húmico (composto agrícola) → hortas sociais, áreas verdes |
| **Biodigestão Anaeróbia** | Dornas seladas + arqueas metanogênicas → biogás confinado | Energia renovável → caldeiras, turbinas de cogeração, cocção da própria UAN |

**Funcionalidade SaaS:**
- Registro diário: X kg Sobra Suja + Y kg RI → notas de serviço para compostagem/biodigestão
- Fatores de conversão ISO → cálculo de **"Pegada de Carbono Mitigada"** (toneladas de GEE evitadas)
- Triangulação: peso do desperdício × doação solidária × reciclagem orgânica

---

## 4. Requisitos para o Módulo de Desperdício/ESG do SaaS

| Funcionalidade | Detalhamento |
|----------------|-------------|
| **Pesagem diária por turno** | Inserção de: Peso produzido, Sobra Limpa, Sobra Suja, Resto-Ingesta (descontando taras) |
| **Cálculo automático** | % Sobra Limpa, % Sobra Suja, IST, % RI, RI per capita |
| **Base correta do RI** | Denominador = Refeição Distribuída (produzido – sobras), NÃO produção total |
| **Gauges verde/amarelo/vermelho** | Parametrizados por perfil (sadia vs. enferma) com benchmarks Vaz + Mezomo |
| **Correlação sobras × RI** | Detecção de "inversão de polaridade" e correlações Spearman |
| **Módulo de Campanhas** | Reporting dinâmico, infográficos para TV, gamificação |
| **Módulo Social (Doação)** | Termos de Doação (Lei 14.016/2020), rastreamento térmico, impacto social |
| **Módulo Ambiental (PNRS)** | Notas de serviço para compostagem/biodigestão, pegada de carbono mitigada |
| **FTP como espinha dorsal** | Integração com Ficha Técnica para padronizar produção e reduzir RI |
| **Audit trail ESG** | Relatórios corporativos de sustentabilidade auditáveis |

