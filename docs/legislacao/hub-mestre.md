---
id: legislacao.hub_mestre
titulo: "Registro de Conformidade Legislativa e Rotulagem (Hub Mestre)"
tipo: legislacao
modulo: rotulagem
status: auditado
ultima_revisao: 2026-04-15
tags:
  - hub/conformidade
  - norma/anvisa
  - norma/mapa
  - norma/inmetro
  - tema/rotulagem
  - tema/alergenicos
  - tema/gluten
  - tema/lactose
  - tema/transgenicos
edges:
  - orquestra: "[[legislacao/RDC_727_2022]]"
  - orquestra: "[[legislacao/RDC_429_2020_IN_75_2020]]"
  - orquestra: "[[legislacao/RDC_54_2012_IN_75_2020_INC]]"
  - orquestra: "[[legislacao/Decreto_4680_2003]]"
  - orquestra: "[[legislacao/Decreto_9013_2017_RIISPOA]]"
  - orquestra: "[[legislacao/Lei_10674_2003]]"
  - orquestra: "[[legislacao/Portaria_INMETRO_249_2021]]"
  - orquestra: "[[legislacao/VDR_Tabelas_Populacionais]]"
  - implementado_por: "[[features/ingredientes/discovery/ingredientes]]"
  - implementado_por: "[[features/industria/discovery/fichas_tecnicas_industrial]]"
  - implementado_por: "[[features/ingredientes/spec-rotulagem]]"
---

# Registro de Conformidade Legislativa e Rotulagem (Hub Mestre)

Este documento é a **Referência Canônica** e o Hub Central de orquestração de conformidade para o sistema. Ele integra todas as legislações auditadas (ANVISA, MAPA, INMETRO) e define como o software deve processar os dados para garantir 100% de conformidade regulatória.

---

## 📋 Guia de Referência Rápida (Glossário)

- **APP (Área do Painel Principal):** Área da maior face da embalagem. Define o tamanho mínimo das letras e da Lupa.
- **FOP (Front-of-Package):** Rotulagem Nutricional Frontal (a Lupa de advertência).
- **INC (Informação Nutricional Complementar):** São as "Alegações" nutricionais (ex: *Zero Açúcar, Fonte de Fibras, Baixo Sódio*).
- **VDR (Valor Diário de Referência):** Índice base usado para calcular o %VD na tabela.
- **RIISPOA:** Conjunto de regras do MAPA para produtos de origem animal (Carnes, Ovos, Mel, Leite).
- **Painel Principal:** A face da embalagem visível ao consumidor no momento da compra.

---

## 🛡️ Checklist de Auditoria: Itens Obrigatórios

Todo rótulo gerado ou validado pelo sistema **DEVE** conter os seguintes elementos (conforme RDC 727, Art. 6º):

1. **Denominação de Venda:** Nome específico do produto (ex: "Iogurte de Morango").
2. **Lista de Ingredientes:** Em ordem decrescente de peso (do maior para o menor).
3. **Conteúdo Líquido:** Declaração quantitativa em métricas legais ([[legislacao/Portaria_INMETRO_249_2021]]).
4. **Identificação de Origem:** Razão social, endereço e CNPJ do fabricante/importador (Preenchimento Automático via Perfil do Cliente).
5. **Identificação do Lote:** Código rastreável de produção.
6. **Prazo de Validade:** Data de expiração legível.
7. **Instruções de Uso:** Obrigatório somente se o preparo for necessário para o consumo (Lógica condicional via chave `is_preparo`).
8. **Advertências:** Alergênicos, Glúten e Lactose (seguindo a hierarquia abaixo).

---

## 1. Matriz de Legislações Federadas

| Esfera Legislativa | Tema Principal | Especificação Técnica |
|---|---|---|
| **ANVISA** | Tabela Nutricional e Lupa (FOP) | [[legislacao/RDC_429_2020_IN_75_2020]] |
| **ANVISA** | Alergênicos, Lactose e Regras Gerais | [[legislacao/RDC_727_2022]] |
| **ANVISA** | Advertência para Alergênicos (Legado) | [[legislacao/RDC_136_2017]] |
| **ANVISA** | Alegações Nutricionais (INC) | [[legislacao/RDC_54_2012_IN_75_2020_INC]] |
| **MAPA** | Produtos de Origem Animal (RIISPOA) | [[legislacao/Decreto_9013_2017_RIISPOA]] |
| **INMETRO** | Metrologia (Conteúdo Líquido) | [[legislacao/Portaria_INMETRO_249_2021]] |
| **Lei Federal** | Glúten (Presença/Ausência) | [[legislacao/Lei_10674_2003]] |
| **Lei Federal** | Transgênicos (Selo T) | [[legislacao/Decreto_4680_2003]] |
| **Referência** | VDR por Grupo Populacional | [[legislacao/VDR_Tabelas_Populacionais]] |

---

## 2. Orquestração Sistêmica (Workflow de Dados)

### 2.1. Nível 1: Master Data (Ingredientes e Fornecedores)
- **Implementação Tecnológica:** [[features/ingredientes/discovery/ingredientes]]
- **Validação:** Cada ingrediente novo deve ter campos obrigatórios preenchidos para Alergênicos, Glúten, Lactose e Transgenia.
- **Rápida Resposta:** O sistema sinaliza imediatamente se um ingrediente importado possui declarações conflitantes.

### 2.2. Nível 2: Processamento (Ficha Técnica e Cálculos)
- **Implementação Tecnológica:** [[features/industria/discovery/fichas_tecnicas_industrial]]
- **Cálculo Nutricional:** A Edge Function `calcular-nutrientes` cruza quantidades de cada ingrediente com tabelas de VDR populacionais e define os disparos da **Lupa Frontal**.
- **Regras de Preparo:** Aplicação da lógica "Tal Qual" vs "Preparado" para alegações (INC).

### 2.3. Nível 3: Produção Visual (Geração de Etiquetas)
- **Implementação Tecnológica:** [[features/ingredientes/spec-rotulagem]]
- **Layout Engine:** Aplica as regras de contraste ([[legislacao/RDC_727_2022]]), altura mínima de fontes ([[legislacao/Portaria_INMETRO_249_2021]]) e inserção de selos (SIF/T/Arte).

---

## 3. Constraints Globais e Hierarquia Visual

### 3.1. Ordem de Declaração das Advertências

As frases de alerta devem aparecer imediatamente **após** a lista de ingredientes, nesta ordem:

1. **ALÉRGICOS:** `CONTÉM [NOMES]`
2. **ALÉRGICOS:** `PODE CONTER [NOMES]` (Risco Cruzado)
3. **LACTOSE:** `CONTÉM LACTOSE` (Se > 100mg/100g)
4. **GLÚTEN:** `CONTÉM GLÚTEN` ou `NÃO CONTÉM GLÚTEN` ([[legislacao/Lei_10674_2003]])
5. **NOTA DE PREPARO:** `** No alimento pronto para o consumo.`

### 3.2. Legibilidade e Contraste
- **Cores:** Fundo branco com caracteres pretos (Padrão Ouro).
- **Fontes:** Mínimo de 1mm para textos gerais e 2mm para advertências (se APP > 100cm²).
- **Vedação:** Proibido uso de expressões terapêuticas ou curativas.

---

## 4. Manutenção e Auditoria

Qualquer alteração em legislações base deve ser refletida primeiro em seu respectivo arquivo `.md` e depois validada neste Hub Mestre para checar impactos colaterais em outras normas.
