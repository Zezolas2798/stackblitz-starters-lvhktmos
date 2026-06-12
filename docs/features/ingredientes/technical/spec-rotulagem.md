---
id: legislacao.gerenciamento_rotulagem
titulo: "Guia de Gerenciamento de Rotulagem e Produto"
tipo: domain
modulo: rotulagem
status: auditado
ultima_revisao: 2026-04-15
tags:
  - feature/ingredientes
  - dominio/rotulagem
  - entidade/rotulo
  - entidade/snapshot
  - calculation/porcao
  - calculation/lupa
  - interface/nutritional-label
  - workflow/aprovacao
edges:
  - depende: "[[legislacao/hub-mestre]]"
  - depende: "[[features/industria/discovery/fichas_tecnicas_industrial]]"
  - depende: "[[features/ingredientes/discovery/ingredientes]]"
  - especifica: "app/receitas/[id]/page.tsx"
  - especifica: "components/NutritionalLabel.tsx"
  - especifica: "components/LupaFrontalANVISA.tsx"
codigo_relacionado:
  - app/receitas/[id]/page.tsx
  - components/NutritionalLabel.tsx
  - components/LupaFrontalANVISA.tsx
  - supabase/functions/calcular-nutrientes/index.ts
  - supabase/functions/aprovar-receita/index.ts
---


# Guia de Gerenciamento de Rotulagem e Produto

Este documento detalha a engenharia por trás da **Página do Produto** e do **Motor de Geração de Rótulos**, integrando a lógica de software com os requisitos do [[legislacao/hub-mestre]].

---

## 1. Arquitetura da Página do Produto (`/receitas/[id]`)

A página de detalhes do produto é o centro nervoso do sistema, orquestrando dados de ingredientes, cálculos nutricionais e conformidade visual.

### 1.1. Fluxo de Dados e Orquestração
*   **Identificação (ID):** A página utiliza o `id` da receita para buscar dados em batch (Ingredientes, Sub-receitas e Materiais).
*   **Cálculo em Tempo Real:** Ao carregar ou alterar a composição, o frontend invoca a Edge Function `calcular-nutrientes`, que retorna o objeto `ResultadoCalculo` com:
    *   Valores por 100g e por porção.
    *   Determinação automática de **Lupas (FOP)**.
    *   Geração automática da **Lista de Ingredientes** decrescente.
    *   Detecção de **Alergênicos, Glúten e Lactose**.

### 1.2. Gerenciamento de Estado: Rascunho vs. Snapshot
O sistema opera sob rígidos controles de procedência de dados:
*   **Draft (Rascunho):** Versão atual editável no banco de dados. O sistema detecta alterações comparando o rascunho com a última versão aprovada (`verificarSeTemAlteracoes`).
*   **Snapshot (Versão Aprovada):** Quando uma receita é aprovada, o sistema gera uma **Cópia Controlada** (JSONB) imutável. Isso garante que, se um ingrediente mudar de preço ou info nutricional no futuro, o rótulo aprovado no passado permaneça juridicamente idêntico ao que foi impresso.

---

## 2. O Motor de Rotulagem (Label Engine)

A renderização visual segue estritamente os padrões geométricos da **RDC 429** e **IN 75**.

### 2.1. Componente `NutritionalLabel`
Este componente é responsável pela "física" do rótulo, suportando diversos layouts para diferentes tipos de embalagens:
*   **Vertical e Vertical Quebrada:** Padrão para embalagens retangulares.
*   **Horizontal e Horizontal Quebrada:** Para embalagens baixas ou largas.
*   **Linear:** Formato de texto corrido para embalagens muito pequenas (APP < 100cm²).

### 2.2. Lupa Frontal (FOP - Front of Package)
A lógica de exibição da Lupa é automática:
*   **Gatilhos:** Ativada se os níveis de Açúcar Adicionado, Gordura Saturada ou Sódio excederem os limites da **IN 75**.
*   **Escalabilidade:** O tamanho da Lupa é calculado dinamicamente com base na **APP (Área do Painel Principal)**.
*   **Modelos de Lupa:** Suporta layouts V1, V2 e V3 (Mistos) dependendo de quantos nutrientes críticos foram detectados.

### 2.3. Identificação Automática de Origem (Art. 35, RDC 727)
O software automatiza a declaração do fabricante para eliminar erros manuais:
- **Fonte de Dados:** Busca a Razão Social, CNPJ e Endereço diretamente das tabelas `clientes` e `cliente_unidades` no momento da renderização da aba de rotulagem.
- **Procedência:** O campo "Indústria Brasileira" (ou internacional) é derivado do perfil da unidade produtora.

### 2.4. Notas de Rodapé e Travas de Preparo
- **Gatilho de Exibição (`is_preparo`):** A nota `* No alimento pronto para o consumo.` e o bloco de **Instruções de Preparo** são ocultados automaticamente se a chave de preparo estiver desativada. Isso evita a poluição visual em produtos "Prontos para Consumo".
- **Estilo Visual:** Para conformidade com a RDC 429, a nota de rodapé **NÃO é renderizada em negrito**, mantendo o peso visual secundário em relação às advertências de saúde.

### 2.5. Distinção Sistêmica: Produção vs. Consumidor
O software opera com dois fluxos distintos de instruções:
1.  **Modo de Preparo (Operacional):** Campo técnico detalhando o processo de fabricação culinária. Sempre visível na página de detalhes para auditoria de produção.
2.  **Instruções de Preparo (Regulatório):** Campo voltado ao consumidor final. Sua exibição no rótulo e na aba de rotulagem é estritamente condicionada à ativação da flag `is_preparo`.

---

## 3. Lógica de Harmonização de Porções (RDC 429)

Um dos módulos mais complexos do sistema é o ajuste automático de porções, que segue dois artigos críticos:

1.  **Regra da Unidade (Art. 8):** Se o produto é individual (ex: um muffin), o peso da porção DEVE ser igual ao peso da embalagem.
2.  **Tolerância de Harmonização (Art. 10):** Se a porção de referência da ANVISA é 50g, mas a unidade (medida caseira) pesa 42g, o sistema harmoniza automaticamente a declaração para "1 unidade (42g)" para evitar frações confusas ao consumidor (ex: "1,2 unidades"), desde que esteja dentro da margem de +/- 30%.

---

## 4. Segurança e Rastreabilidade (GxP)

Para conformidade com auditorias de qualidade:
*   **Log de Aprovação:** Toda aprovação exige uma justificativa textual e registra o ID do usuário autorizador.
*   **Integridade de Dados:** O PDF e o Rótulo gerado a partir de um Snapshot exibem a marca d'água **"CÓPIA CONTROLADA"**, impedindo o uso de rascunhos em linhas de produção.

---

## 4. Memorial Descritivo (Mapeamento Código vs. Legislação)

Esta seção justifica as decisões algorítmicas tomadas no desenvolvimento da Edge Function `calcular-nutrientes` com base nos artigos da legislação federal brasileira.

### 4.1. Regras de Arredondamento e Significância
-   **Lógica no Código:** Função `formatarValor()`.
-   **Justificativa Legal:** 
    -   **IN 75, Anexo III:** Define o número de casas decimais para cada nutriente (ex: Carboidratos = 1 casa, Gorduras Saturadas = 1 casa, Sódio = 0 casas).
    -   **RDC 429, Anexo IV:** Estabelece os critérios de arredondamento matemático para cima/baixo na transição de valores decimais para inteiros.
-   **Significância Cruzada (Art. 14, RDC 429):** O código implementa uma trava onde, se um valor for significativo na base 100g mas não na Porção (ou vice-versa), ele **deve ser declarado em ambas as colunas**. Isso evita que o rótulo omita informações importantes em uma das bases de comparação.

### 4.2. Harmonização e Arredondamento de Porções
-   **Lógica no Código:** Função `calcularInfoPorcao()`.
-   **Justificativa Legal:**
    -   **RDC 429, Art. 8:** Impõe que em produtos de consumo individual, a porção declarada seja o conteúdo total da embalagem.
    -   **RDC 429, Art. 10, §2º:** Permite a harmonização da medida caseira com a porção de referência. O código aplica a tolerância de **+/- 30%** para ajustar o peso da porção e evitar frações de unidades (ex: ajusta 50g para 42g para declarar "1 unidade" exata).

### 4.3. Gatilhos de Rotulagem Frontal (Lupa)
-   **Lógica no Código:** Função `calculateLupas()`.
-   **Justificativa Legal:**
    -   **IN 75, Anexo XV:** Define os limites de "Alto Em" para Açúcares Adicionados, Gorduras Saturadas e Sódio. 
    -   **Diferenciação Sólido/Líquido:** O motor de cálculo identifica o campo `estado_alimento` no banco de dados e aplica limites diferentes (ex: Sódio para sólidos é 600mg/100g; para líquidos é 300mg/100ml).

### 4.4. Advertências de Alergênicos e Glúten
-   **Lógica no Código:** Função `processarDeclaracoes()`.
-   **Justificativa Legal:**
    -   **RDC 727, Art. 6º:** O código gera automaticamente a lista em CAIXA ALTA e NEGRITO (via CSS) para "ALÉRGICOS: CONTÉM...".
    -   **Lei 10.674/2003:** O sistema verifica a flag `contem_gluten` em todos os ingredientes da árvore e dispara obrigatoriamente "CONTÉM GLÚTEN" ou "NÃO CONTÉM GLÚTEN" de forma binária e excludente.

---

## 5. Especificação Técnica (Arquitetura Full-Stack)

Esta seção detalha a implementação para desenvolvedores e auditores de sistemas.

### 5.1. Camada de Dados (PostgreSQL / Supabase)
As Tabelas Core que sustentam a inteligência de rotulagem são:
-   `receitas`: Dados mestre e rascunho atual.
-   `composicao_receitas`: Tabela de junção dinâmica (Ingredientes e Sub-receitas).
-   `receitas_versoes`: Repositório de Snapshots. Armazena o campo `tabela_nutricional_snapshot` (JSONB) que contém o objeto completo retornado pela Edge Function no momento da aprovação.

### 5.2. Camada de Funções (Edge Functions - Deno)
O coração lógico reside em **`calcular-nutrientes`**:
-   **Entrada:** `receita_id`.
-   **Processamento:** 
    1.  Busca recursiva de toda a árvore de ingredientes.
    2.  Aplicação de Perdas/Ganhos (Fator de Correção/Índice de Cocção).
    3.  Consulta a tabelas de conformidade ANVISA.
-   **Saída:** Objeto `ResultadoCalculo` contendo `por100g`, `porPorcao`, `lupas` e `declaracoes`.

### 5.3. Camada de Interface (Frontend - Next.js/React)
-   **Página Mestre:** `app/receitas/[id]/page.tsx` (Gerencia o estado global e o fetch dos dados).
-   **Gerenciador de Versões:** `components/receitas/VersionControl.tsx` (Interface para rollback e visualização de históricos).
-   **Visualizador de Rótulos:** `components/NutritionalLabel.tsx` (Renderização pura em React/MUI para garantir fidelidade visual na exportação).

---

## 6. Lógica de Auditoria e Erros
-   **Detecção de Inconsistência:** Se um ingrediente principal for deletado ou alterado sem uma nova aprovação da receita, o sistema sinaliza "Alterações Pendentes" e bloqueia a impressão da Cópia Controlada.
-   **Garantia de Rounding:** O sistema aplica arredondamentos da RDC 429 no backend (Edge Function) para evitar divergências de precisão entre diferentes telas do app.

---

**Links Relacionados:**
- [[legislacao/hub-mestre]]
- [[features/ingredientes/discovery/ingredientes]]
- [[features/industria/discovery/fichas_tecnicas_industrial]]

