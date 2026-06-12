---
tags:
  - feature/compras
node_type: technical
status: brownfield-translated
created_by: brownfield-translation
created: 2026-05-19
feature: compras
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---

# Interfaces: Módulo Compras

## Overview

O módulo Compras possui 4 páginas e 5 componentes reutilizáveis. Toda a lógica de negócio está embarcada nas páginas (sem service layer).

---

## Pages

### 1. `/compras` — Planejamento de Compras

| Aspecto | Valor |
|---|---|
| **Arquivo** | `app/compras/page.tsx` (~521 linhas) |
| **Layout** | 3 abas: "Requisições de OP", "Necessidades UAN", "Visão Consolidada" |
| **Context** | `activeClientId`, `unidadeId` via `useClient()` |
| **Queries** | `producao_requisicoes`, `producao_ordens`, `cardapios_uan`, `cardapio_dias_uan`, `composicao_fichas_uan`, `ingredientes`, `uan_compras_monitoramento`, `uan_cardapio_insumos_config`, `estoque_lotes` |
| **Writes** | `producao_requisicoes.status_compras`, `uan_compras_monitoramento` |
| **Key UX** | Tab consolidada com colunas: Ingrediente, Demanda OP, Demanda UAN, Estoque Atual, Sugestão de Compra |

---

### 2. `/compras/orcamentos` — Planilha de Orçamentos

| Aspecto | Valor |
|---|---|
| **Arquivo** | `app/compras/orcamentos/page.tsx` (~702 linhas) |
| **Layout** | 2 abas: "Lista de Cotações" (tabela), "Quadro Comparativo" (data grid) |
| **Quadro Comparativo** | Accordion hierárquico: Modalidade (tab) → Categoria (accordion nível 1) → Subgrupo (accordion nível 2) → Tabela Insumos × Fornecedores com inputs editáveis |
| **Context** | `activeClientId`, `unidadeId` via `useClient()` |
| **Queries** | `compras_orcamentos` JOIN `fornecedores` + `ingredientes`, `subgrupos_produto`, `grupos_produto` |
| **Writes** | `compras_orcamentos` INSERT/UPDATE/DELETE |
| **Key UX** | Inline price editing no grid, conversão de embalagem no dialog, Kraljic chips na lista, batch save de modificações |
| **useMemo Heavy** | `quadroComparativo` é computado via `useMemo` com filtragem por modalidade + agrupamento hierárquico |

**Grid Visual:**
```
┌────────────────┬──────────────┬──────────────┬──────────────┐
│  INSUMO        │ Fornecedor A │ Fornecedor B │ Fornecedor C │
├────────────────┼──────────────┼──────────────┼──────────────┤
│ Arroz Tipo 1   │ [5.20]       │ [5.50]       │ [---]        │
│ Feijão Carioca │ [8.10]       │ [---]        │ [7.90]       │ ← melhor preço em verde
│ Óleo de Soja   │ [12.00]      │ [11.50]      │ [11.80]      │
└────────────────┴──────────────┴──────────────┴──────────────┘
```

---

### 3. `/compras/lancamentos` — Lançamento de Notas

| Aspecto | Valor |
|---|---|
| **Arquivo** | `app/compras/lancamentos/page.tsx` (~908 linhas) |
| **Layout** | 2 abas: "Lançar Nota Fiscal" (formulário), "Histórico de Lançamentos" (accordions) |
| **Formulário NF** | Cabeçalho (Modalidade + Fornecedor + Nº NF + Datas) → Itens dinâmicos (lista variável com +/-) |
| **Context** | `activeClientId`, `unidadeId` via `useClient()` |
| **Queries** | `ingredientes`, `materiais`, `fornecedores`, `estoque_lotes`, `fin_contas` |
| **Writes** | `estoque_lotes` INSERT, `fin_transacoes` INSERT, `fin_lancamentos` INSERT |
| **Import** | Upload de XML/PDF/Imagem → `processNFFile()` → preenche formulário |
| **Quick Dialogs** | `QuickIngredienteDialog`, `QuickMaterialDialog`, `PreCadastroFornecedorDialog` |
| **Key UX** | Item NF com descrição extraída + campo de vinculação ao cadastro do sistema |

---

### 4. `/compras/inteligencia` — Inteligência de Suprimentos

| Aspecto | Valor |
|---|---|
| **Arquivo** | `app/compras/inteligencia/page.tsx` (~103 linhas) |
| **Layout** | 2 abas: "Matriz Estratégica de Kraljic", "Calculadora de Par Level" |
| **Components** | `KraljicMatrix.tsx`, `ParLevelSetup.tsx` |
| **Data Source** | View `gerencial_compras_kraljic_base` |
| **Writes** | `ingredientes.uso_medio_diario`, `ingredientes.estoque_seguranca_perc` |

---

## Components

### `KraljicMatrix.tsx` (8.8 KB)
- **Input:** View `gerencial_compras_kraljic_base`
- **Output:** Scatter plot CSS-based com 4 quadrantes
- **Calculation:**
  - `impactoFinanceiro = custo_ref × adu × 30 / maxSpend × 100` (normalizado 0-100)
  - `riscoAbastecimento = 100 − (fornecedores_ativos × 25) + (lead_time × 1.5)` (clamped 5-100)
- **Interação:** Filtrar por quadrante ao clicar

### `ParLevelSetup.tsx` (9.6 KB)
- **Input:** View `gerencial_compras_kraljic_base`
- **Output:** Tabela com campos editáveis (ADU, Safety %) e status visual
- **Formula:**
  - `base = MRP > 0 ? demandaMRP : ADU × leadTime`
  - `parLevel = ceil(base + base × safetyPct/100)`
- **Status Thresholds:**
  - 🔴 Ruptura: stock = 0
  - 🟡 Crítico: stock ≤ 30% par
  - 🟠 Atenção: stock ≤ 80% par
  - 🟢 Adequado: within range
  - 🔵 Excesso: stock > 150% par

### `PreCadastroFornecedorDialog.tsx` (266 linhas)
- **Input:** CNPJ digitado pelo operador
- **External Call:** `brasilapi.com.br/api/cnpj/v1/{cnpj}`
- **Output:** Fornecedor cadastrado com status PENDENTE
- **Used By:** Lançamento de NF + Página de Fornecedores

### `QuickIngredienteDialog.tsx`
- **Purpose:** Cadastrar ingrediente rápido durante vinculação de NF (modo ALIMENTOS)
- **Writes:** `ingredientes` INSERT

### `QuickMaterialDialog.tsx` (155 linhas)
- **Purpose:** Cadastrar material rápido durante vinculação de NF (modos não-alimentares)
- **Validation:** Zod schemas por `tipo_material` via `lib/schemas/materiais-modalidade.ts`
- **Writes:** `materiais` INSERT

---

## Supporting Infrastructure

### `lib/utils/nf-parser.ts` (165 linhas)
- **Exported:** `processNFFile(file: File): Promise<ParsedNF>`
- **Strategy Pattern:**
  1. XML → DOM Parser (full extraction)
  2. PDF → `pdfjs-dist` text extraction (header + limited items)
  3. Image → `Tesseract.js` OCR (minimal, placeholder quality)
- **Returns:** `ParsedNF { numero, dataEmissao, fornecedorCnpj, fornecedorNome, valorTotalNf, dataVencimento, itens[] }`

### `gerencial_compras_kraljic_base` (Supabase VIEW)
- **Aggregated From:** `ingredientes`, `compras_orcamentos`, `fornecedores`, `estoque_lotes`
- **Key Columns:** `ingrediente_id`, `ingrediente_nome`, `custo_referencia`, `uso_medio_diario`, `lead_time_considerado`, `fornecedores_ativos`, `estoque_atual`, `demanda_programada_kg`, `estoque_seguranca_perc`
- **Used By:** KraljicMatrix + ParLevelSetup

### `lib/types.ts` (interfaces relevantes)

```typescript
interface Fornecedor {
  id: string; cliente_id: string; razao_social: string; cnpj: string;
  status_homologacao: string; categorias_compras: string[];
  lead_time_dias: number; grupos_fornecidos: string[];
  itens_fornecidos: string[]; // ... (40+ campos)
}

interface OrcamentoFornecedor {
  id: string; fornecedor_id: string; ingrediente_id: string;
  preco_por_kg_l: number; is_embalagem: boolean;
  unidades_por_embalagem?: number; peso_volume_por_unidade?: number;
  preco_embalagem?: number; data_orcamento: string;
}
```

---

## Tech Debt Inventory

| # | Item | Severity | Location |
|---|---|---|---|
| 1 | `(supabase as any)` em todas as queries | Medium | All pages |
| 2 | Lógica de negócio embarcada no componente (sem service layer) | High | All pages |
| 3 | Batch save em cotações cria registros duplicados (sem upsert) | Medium | orcamentos/page.tsx |
| 4 | Exclusão de NF não remove `fin_transacoes` correspondente | High | lancamentos/page.tsx |
| 5 | Edição de lote no histórico não atualiza transação financeira | High | lancamentos/page.tsx |
| 6 | Multi-write sem transação atômica (lotes + financeiro) | High | lancamentos/page.tsx |
| 7 | `listas_compras_uan` table exists but is unused in code | Low | database |
| 8 | Cotações apenas para `ingredientes`, não `materiais` | Medium | orcamentos/page.tsx |
| 9 | Par Level não alimenta visão consolidada diretamente | Low | inteligencia/components + compras/page.tsx |
| 10 | OCR image parser é placeholder (baixa qualidade) | Low | lib/utils/nf-parser.ts |
