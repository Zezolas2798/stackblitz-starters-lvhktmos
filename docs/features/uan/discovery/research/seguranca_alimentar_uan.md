---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

tags:
  - feature/uan

# 01 — Segurança Higiênico-Sanitária e APPCC

> **Fonte:** `UAN_ Segurança Higiênico-Sanitária e APPCC.md`
> **Domínio:** Compliance, Qualidade, APPCC/HACCP
> **Finalidade:** Base para codificação do módulo de Segurança e Compliance da UAN


## 1. Base Legal Obrigatória

| Norma | Foco | Aplicação no SaaS |
|-------|------|--------------------|
| **RDC 216/2004** (ANVISA) | Boas Práticas para Serviços de Alimentação | Regras de processo, temperaturas, manipuladores |
| **RDC 275/2002** (ANVISA) | POPs + Lista de Verificação (Anexo II) | Esqueleto do módulo de Auditoria Interna |
| **RDC 724/2022** + **IN 161/2022** | Padrões microbiológicos | Laudos laboratoriais, limites de contagem |
| **Portaria 1.428/1993** (MAPA) | Regulamento de Inspeção Sanitária | Base doutrinária APPCC |
| **Lei 6.437/1977** | Infrações sanitárias | Fundamentação de bloqueios |

---

## 2. Entidades e Estruturas de Dados

### 2.1 Checklist de Inspeção Predial
- **Respostas categóricas:** `SIM` | `NÃO` | `NA`
- **Blocos de inspeção (taxonomia RDC 275, Anexo II):**
  1. Edificação e Instalações
  2. Equipamentos e Móveis
  3. Matérias-primas e Produto Final
- **Saída:** Percentual de atendimento → Classificação em **Grupos de Risco Sanitário**
- **Ação derivada:** Geração de OMP (Ordem de Manutenção Preventiva) se não-conformidade

### 2.2 Controle de Água
- **Campos:** Teor de cloro residual livre (0,5–2,0 ppm), pH
- **Certificados:** Higienização de reservatórios (validade semestral)
- **Alertas automáticos:** 60, 30, 10 dias antes do vencimento
- **Bloqueio:** Não Conformidade Crítica se certificado expirar

### 2.3 Gestão de Manipuladores (RH Sanitário)
- **Documentos rastreados:** ASO, coproculturas, parasitológicos
- **Regra de bloqueio:** Escala de trabalho bloqueada se ASO vencido OU sintomas reportados (gastrointestinais, secreções, lesões cutâneas)
- **Capacitação:** Registro de carga horária, conteúdo, logs de participação

### 2.4 Cadastro de Ativos (Equipamentos)
- **Campos:** Número de série, tipo (termômetro, balança), laudos de calibração (RBC)
- **Regra:** Bloqueio lógico de equipamento com calibração/manutenção vencida
- **Cronograma:** Desobstrução de calhas, troca de filtros, aferição termométrica

### 2.5 Manual de Boas Práticas (MBP) — GED
- **Seções obrigatórias do MBP:**
  1. Identificação da Empresa e RT (CNPJ, Alvará, CNAE, capacidade refeições/dia, tipologia)
  2. Infraestrutura e Edificação (materiais, ventilação, coifas, luminárias, layout)
  3. Abastecimento de Água (rede pública vs poço artesiano, cloração)
  4. Saúde e Higiene dos Colaboradores
  5. Produção de Alimentos (recepção → expedição)
  6. Gerenciamento de Resíduos
- **Controle de versão:** Aprovação, data, assinatura digital do RT
- **Acesso:** Terminais locais exibem APENAS versão vigente

### 2.6 POPs — 8 Obrigatórios (RDC 275/2002)

| POP | Título | Regras-chave no SaaS |
|-----|--------|----------------------|
| 1 | Higienização de instalações/equipamentos/utensílios | Cadastrar princípios ativos (ppm, diluição, tempo contato). Escalas diária/semanal/mensal com assinatura digital |
| 2 | Controle da potabilidade da água | Planilhas pH + cloro. Alerta semestral para sanitização de reservatórios + upload certificado |
| 3 | Higiene e saúde dos manipuladores | Técnica de fricção antisséptica. Alertas PCMSO. Cronograma de capacitação |
| 4 | Manejo de resíduos | Coletores sem contato manual. Cadastro empresas coleta + horários (não coincidir com recebimento) |
| 5 | Manutenção preventiva e calibração | Cronogramas. Bloqueio de equipamento vencido |
| 6 | Controle integrado de vetores/pragas | Proibido execução química por funcionários UAN. Exigir comprovante empresa habilitada |
| 7 | Seleção de matérias-primas | Homologação fornecedores. Checklist doca: NF, temperatura, integridade embalagem → rastreabilidade |
| 8 | Programa de recolhimento (recall) | Pesquisa reversa: Lote X → Prato → NF Y → Matéria-prima Z. Meta: isolamento em < 2h |

**Estrutura de cada POP no sistema:**
- Nome da Operação
- Objetivo
- Setor de Aplicação
- Responsável pela Execução
- EPIs necessários
- Frequência
- Passo a Passo Procedimental
- Monitoramento
- Ações Corretivas
- Planilhas de Registro associadas

---

## 3. Regras de Negócio — Controle de Temperaturas

| Situação | Parâmetro | Ação se violado |
|----------|-----------|-----------------|
| Resfriamento de alimentos preparados | 60°C → 10°C em ≤ 2 horas | Ação corretiva obrigatória |
| Manutenção a quente | > 60°C, máx 6 horas exposição | Reaquecimento a 70°C ou descarte |
| Temperatura sub-crítica (ex: 55°C) | Desvio detectado no monitoramento | Tela de Ação Corretiva bloqueante |
| Pescados resfriados no recebimento | 0°C a 2°C | Rejeição se fora da faixa |
| Câmara fria com abuso (ex: 12°C) | Violação do limite crítico | Bloqueio + Ação sobre Produto + Ação sobre Processo |
| Cocção (centro geométrico) | ≥ 74°C por 2 min (exemplo carne suína) | PCC — bloqueio se não atingido |

---

## 4. Sistema APPCC — 7 Princípios (Algoritmos)

### Princípio 1: Análise de Perigos
- **Interface:** Fluxograma visual (Diagrama de Blocos)
- **Fases:** Recepção → Armazenamento Seco → Câmara Fria → Preparo Prévio → Cocção → Resfriamento Rápido → Porcionamento → Manutenção Quente/Fria → Expedição
- **Algoritmo:** Matriz de Risco = `Probabilidade (Alta/Média/Baixa) × Severidade (Leve/Grave/Fatal)`
- **Regra:** Perigos com matriz significativa exigem Medidas Preventivas para avançar

### Princípio 2: Determinação dos PCCs
- **Algoritmo:** Árvore de Decisão do Codex (perguntas booleanas)
  - Q1: Existem medidas preventivas? (S/N)
  - Q2: Esta etapa elimina/reduz o perigo a níveis aceitáveis? (S/N)
  - [continuação da árvore padrão Codex]
- **Saída:** Etapa marcada como `PCC` (ícone vermelho) ou `PC` (gerido por POP)

### Princípio 3: Limites Críticos
- **Regra:** Sistema NÃO aceita entradas subjetivas ("quente", "bem cozido")
- **Obrigatório:** Parâmetros mensuráveis (temperatura °C, tempo min, ppm, pH)
- **Exemplo:** "Temp. interna centro geométrico ≥ 74°C por 2 min"

### Princípio 4: Monitoramento
- **Registro obrigatório:** O Quê + Como + Frequência + Quem
- **Interface:** Push notifications/alarmes em tablets industriais
- **Bloqueio:** Ordens de serviço não avançam sem inserção do valor pelo responsável

### Princípio 5: Ações Corretivas (MAIS CRÍTICO para automação)
- **Trigger:** Desvio detectado no monitoramento
- **Comportamento:** Bloqueio da continuidade operacional
- **Tela obrigatória com duas vertentes:**
  1. **Ação sobre o Produto:** Dropdown (remanejamento / descarte / reprocessamento se < 2h)
  2. **Ação sobre o Processo:** Abertura de OS urgente

### Princípio 6: Verificação
- **Rotinas:** Coletas quinzenais de laudos laboratoriais
- **Confronto:** Contagens vs limites IN 161/2022
- **Revisão semanal:** RT atesta ações corretivas dos turnos

### Princípio 7: Documentação e Registros
- **Logs:** Timestamped, imutáveis, não editáveis
- **Rastreabilidade ponta-a-ponta:** Fornecedor → Recebimento (hora, temp) → Cocção (temp centro) → Serviço (temp rechaud) → Consumo → Assinatura RT
- **Exportação:** Dossiê completo para inspeção sanitária em segundos

---

## 5. Categorias de Perigos (base microbiológica)

### Perigos Biológicos
| Categoria | Patógenos | Risco Principal |
|-----------|-----------|-----------------|
| Gram-negativas entéricas | *Salmonella*, *Campylobacter*, *E. coli* (Shiga) | Aves, ovos, carne moída |
| Psicrotróficas | *Listeria monocytogenes* | Multiplica sob refrigeração (2–8°C). Saladas frias, fatiados |
| Esporulantes/Toxigênicos | *C. perfringens*, *C. botulinum*, *B. cereus* | Esporos termorresistentes — risco no resfriamento lento |
| Toxina termoestável | *S. aureus* | Enterotoxina NÃO inativada por calor posterior |

### Perigos Químicos
- Resíduos de praguicidas, amônia de limpeza, micotoxinas, migração de metais pesados

### Perigos Físicos
- Fragmentos de ossos, metais de esteiras, paletes de madeira, plásticos duros

---

## 6. Laudos Laboratoriais (RDC 724/2022 + IN 161/2022)
- **Análises:** Estafilococos coagulase+, clostrídios sulfito redutores, *Salmonella*
- **Planos de 3 classes:** Limite máximo permissível ($M$) e número aceitável de tolerância ($c$)
- **Regra:** Se a contagem excede $M$ ou $c$ → acionamento automático do POP 8 (Recall)

---

## 7. Requisitos Técnicos do Sistema

| Requisito | Especificação |
|-----------|---------------|
| Motor de regras | Bloqueio ativo, não repositório passivo |
| GED (Gerenciador Eletrônico de Documentos) | MBP + POPs com controle de versão e assinatura digital |
| Logs | Timestamped, imutáveis, auditáveis |
| Assinatura | Tokens criptográficos para RT |
| Interoperabilidade | Preparado para novos regulamentos microbiológicos |
| Exportação | Dossiê completo para fiscalização em segundos |
| Acesso chão de fábrica | Apenas versão vigente dos documentos |
| Dispositivos | Tablets industriais, coletores de dados |

