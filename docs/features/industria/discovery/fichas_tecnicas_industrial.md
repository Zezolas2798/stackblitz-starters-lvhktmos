---
id: modulo.fichas_tecnicas_industrial
titulo: "Fichas Técnicas - Indústria (Rotulagem GxP)"
tipo: domain
modulo: fichas_tecnicas
status: auditado
ultima_revisao: 2026-04-15
tags:
  - feature/industria
  - dominio/fichas-tecnicas
  - dominio/industrial
  - entidade/receita
  - entidade/composicao
  - entidade/material
  - calculation/nutricional
  - calculation/custo
  - policy/recursividade
  - policy/snapshot
  - norma/rdc429
  - norma/in75
  - norma/rdc727
edges:
  - consome: "[[features/ingredientes/discovery/ingredientes]]"
  - especifica: "app/receitas/[id]/page.tsx"
  - especifica: "app/receitas/criar/page.tsx"
  - processado_por: "supabase/functions/calcular-nutrientes/index.ts"
  - processado_por: "supabase/functions/aprovar-receita/index.ts"
  - depende: "[[legislacao/hub-mestre]]"
  - renderiza: "[[features/ingredientes/spec-rotulagem]]"
  - consumido_por: "[[features/industria/discovery/producao]]"
codigo_relacionado:
  - app/receitas/[id]/page.tsx
  - app/receitas/criar/page.tsx
  - components/receitas/ReceitaHeader.tsx
  - components/receitas/ComposicaoDisplayList.tsx
  - components/receitas/TabParametros.tsx
  - components/NutritionalLabel.tsx
  - supabase/functions/calcular-nutrientes/index.ts
  - supabase/functions/aprovar-receita/index.ts
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-industria]]

---

# Fichas Técnicas — Indústria (Rotulagem GxP)

Este documento especifica a arquitetura, regras de negócio e infraestrutura do módulo de **Fichas Técnicas (Indústria)**. Atua de forma simbiótica ao [[features/ingredientes/discovery/ingredientes]], centralizando a inteligência de precificação, cálculo nutricional regulatório ([[legislacao/RDC_429_2020_IN_75_2020]]) e roteamento de sub-receitas para rotulagem.

---

## 1. Visão Geral e Topologia de Conceitos

| Entidade | Meta-Tipo | Descrição |
|----------|-----------|-----------|
| **Módulo Industrial (`receitas`)** | `Entity` | Receituário com foco em Rotulagem Nutricional, Lupa Frontal (IN 75), Alergênicos e vida de prateleira (GxP). |
| **Módulo UAN (`fichas_tecnicas_uan`)** | `Entity` | *Não coberto aqui*. Veja documentação específica de UAN. |
| **Composição (Insumos)** | `Value Object` | Relação NxN entre receita e elementos atômicos (`ingredientes`). Sofre Fator de Correção e Índice de Cocção. |
| **Material / Embalagem** | `Value Object` | Insumos não-comestíveis. Contribuem apenas para custo, sem impacto nutricional. |

---

## 2. Mapa Estrutural (Grafo de Domínio)

```mermaid
graph TD
    RECEITA["Ficha Técnica Industrial (receitas)"]
    INGREDIENTE["Ingrediente Base"]
    MATERIAL["Embalagem (un)"]
    SUBREC["Sub-Receita"]
    REF_NUTRI["Referência Nutricional"]
    ANVISA_CAT["Categoria ANVISA"]
    ANVISA_GP["Grupo Populacional"]
    ALERGENO["Alergênicos"]
    COMPOSICAO["Composição (composicao_receitas)"]
    AUDIT["Auditoria (Snapshots)"]

    RECEITA --> COMPOSICAO
    COMPOSICAO --> MATERIAL
    COMPOSICAO --> INGREDIENTE
    COMPOSICAO --> SUBREC
    COMPOSICAO -.-> REF_NUTRI
    ANVISA_CAT -.-> RECEITA
    ANVISA_GP -.-> RECEITA
    ALERGENO -.-> RECEITA
    RECEITA --> AUDIT

    classDef core fill:#2E7D32,stroke:#1B5E20,stroke-width:2px,color:#fff;
    classDef comp fill:#1565C0,stroke:#0D47A1,stroke-width:2px,color:#fff;
    classDef anvisa fill:#F57C00,stroke:#E65100,stroke-width:2px,color:#fff;
    classDef audit fill:#D32F2F,stroke:#B71C1C,stroke-width:2px,color:#fff;

    class RECEITA core;
    class COMPOSICAO,INGREDIENTE,MATERIAL,SUBREC comp;
    class ANVISA_CAT,ANVISA_GP,ALERGENO,REF_NUTRI anvisa;
    class AUDIT audit;
```

---

## 3. Regras de Negócio (Policies)

### 3.1. Recursividade em Árvore de Receitas

Uma Ficha pode conter *N* Sub-Receitas (ex: `Bolo Mestre` incorpora `Recheio Doce de Leite`).
- O sistema "achata" (flatten) as receitas filhas até sua unidade atômica (ingredientes).
- Multiplica proporcionalmente a participação, calculando contribuição nutricional e de custo.
- **Rastreio alergênico se propaga hierarquicamente para cima.**

### 3.2. Motor de Cálculo Edge (Deno)

A Edge Function `calcular-nutrientes` é o coração nutricional:

- **Batching:** Varre todos os `item_id` das composições e faz fetch único (`WHERE id IN (...)`).
- **Override de Referência:** Se `referencia_id` presente na linha → sobrescreve macros com dados TACO/TBCA. Se ausente → usa dados do ingrediente base.
- **Invariante de Segurança:** Alergênicos e Transgênicos vêm **sempre** do cadastro original do ingrediente, nunca da referência override.

### 3.3. Configuração Regulatória e Lupa Frontal

🔗 Detalhes completos em [[legislacao/hub-mestre]] e [[features/ingredientes/spec-rotulagem]].

### 3.4. Alergênicos e Contaminação

- **Nativos:** Adquiridos automaticamente pela árvore de insumos e sub-receitas.
- **Risco Cruzado:** Lançados manualmente na aba "Riscos". Policy impede duplicidade: risco cruzado não pode ser declarado se o alérgeno já é nativo.

### 3.5. Embalagens

Alimentada por `materiais` com filtro `tipo_material === 'EMBALAGEM'`. Unidade fixa em `un`. Custo contribui apenas para variável financeira.

---

## 4. Gestão de Custos

```text
Custo Ingrediente = (Peso Líquido na Ficha / Peso Unitário Comprado) × Preço Mestre
Custo Embalagem   = Quantidade Usada × Preço de Custo
```

---

## 5. Auditoria e Snapshot (Imutabilidade GxP)

### 5.1. Snapshot Deep Copy

A tabela `receitas_versoes` armazena JSONB com cópia exata da Receita + Composição + Tabela Nutricional no momento da aprovação. Garante rastreabilidade jurídica. Campos: `composicao_snapshot`, `tabela_nutricional_snapshot`, `nome_snapshot`, `versao`, `aprovado_por`, `data_aprovacao`, `motivo_alteracao`.

### 5.2. Bloqueio de Aprovação Fantasma

O `<ReceitaHeader />` verifica se o rascunho é idêntico ao último snapshot. Se sim, bloqueia o botão de aprovar para evitar salvamentos passivos.

---

## 6. Interface do Usuário (Frontend)

### 6.1. Arquitetura de Componentes

- **`app/receitas/[id]/page.tsx`** — Container Mestre. Fetcher global e despachador de propriedades.
- **`<ReceitaHeader />`** — Controle de estado + modal de versões (assinatura eletrônica).
- **`<ComposicaoDisplayList />`** — Lista visual com Chips de tipo (aditivo) e Tags de referência Override.
- **`<TabParametros />`** — Campos de Preparo/Reconstituição (`is_preparo`, `peso_pronto`, `instrucoes`).
- **`<RotulagemTab />`** — Consumidor de dados calculados. Aplica travas de ocultação em instruções se `is_preparo` inativo.
- **`<NutritionalLabel />`** — Renderização pura do rótulo. Suporta layouts: Vertical, Horizontal, Linear.

### 6.2. Fluxo de Dados

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant EF as Edge Function
    participant DB as Supabase DB

    UI->>DB: Fetch receita + composição
    UI->>EF: POST calcular-nutrientes(receita_id)
    EF->>DB: Fetch ingredientes (batch)
    EF->>DB: Fetch referências TACO
    EF->>DB: Fetch categorias ANVISA
    EF-->>UI: ResultadoCalculo {por100g, porPorcao, lupas, declaracoes}
    UI->>UI: Renderizar NutritionalLabel + Declarações
```

---

## 7. Legislação Aplicável

| Tema | Spec de Engenharia | Fonte Original |
|------|-------------------|----------------|
| Tabela Nutricional e Lupa | [[legislacao/RDC_429_2020_IN_75_2020]] | [[legislacao/fontes/RDC_429_IN75_Original]] |
| Alergênicos e Regras Gerais | [[legislacao/RDC_727_2022]] | [[legislacao/fontes/RDC_727_Original]] |
| Alegações Nutricionais (INC) | [[legislacao/RDC_54_2012_IN_75_2012_INC]] | [[legislacao/fontes/RDC_54_Original]] |
| Rotulagem Frontal (FOP) | [[features/ingredientes/spec-rotulagem]] | — |

---

## 8. Hub de Conformidade

🔗 [[legislacao/hub-mestre]]
