---
id: qualidade-planilha-temperatura
titulo: "3.7.12 Planilha de Temperatura dos Equipamentos"
tipo: feature-spec
status: active
layer: qualidade
---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[registry]]

# Planilha de Temperatura dos Equipamentos

> **Status:** Documentação Canônica (DomainSpec).

## 1. Objetivo (Objective)
Registrar as aferições diárias de temperatura dos equipamentos de armazenamento térmico (Freezers, Geladeiras, Câmaras Frias, Estufas, etc.) e dos alimentos contidos neles, garantindo o rastreio e conformidade com as exigências da vigilância sanitária.

## 2. Marco Regulatório e Compliance
- **RDC 216/2004**: Exige o controle rigoroso da cadeia de frio/quente.
- **CVS 5/2013 (SP)**: Determina a necessidade de registrar não apenas a temperatura, mas as ações corretivas em caso de desvios.
- **Rastreabilidade**: É mandatório o uso de assinatura física ou digital do Responsável Técnico (RT) validando a veracidade dos dados aferidos.

## 3. Modelo de Dados (Domain)
A funcionalidade consome a tabela `controle_temperatura`.
- **Aferições Diárias**: O sistema agrupa aferições por `data` e `periodo` (Manhã, Tarde, Noite).
- **Meta-Tipos de Faixa de Temperatura**: A validação (Conforme / Não Conforme) depende das regras configuradas em `equipamentos_config`. Congelados seguem curva própria (Excelente, Bom, Regular, Crítico), enquanto resfriados obedecem um piso e teto lineares (min/max).

## 4. Central de Controle de Planos de Ação (Ações Corretivas)
Desvios (Status "NC") demandam ação. Em vez de registrar a ação a cada medição isolada, o sistema agrega eventos na seção **"Análise de Desvios e Planos de Ação"**.
O RT avalia um bloco de inconformidade temporal para o equipamento, indicando:
- **Causa**: Diagnóstico do problema (ex: pico de energia).
- **Solução (Ação Corretiva)**: O que foi feito para mitigar o risco sanitário.
- **Insights**: Orientações preventivas para a equipe.

## 5. UI e Output (Artifact)
O relatório em `page.tsx` é projetado para:
1. **Filtros e Geração Rápida**: Resolução de Ids em lote (`.in()`) para performance O(1).
2. **Gráficos e Zonas de Risco**: Gráficos lineares sobrepostos a faixas semânticas coloridas (`<ReferenceArea>`) para facilitar a identificação visual de NCs.
3. **Assinatura Digital**: Componente de coleta de assinatura em tela com validação por Cargo/CRN. As assinaturas geradas são imutáveis e renderizadas em formato imagem no rodapé da folha de impressão (A4).
