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

# Operations: Módulo Compras

## Overview

Todas as operações de escrita do módulo Compras são executadas **diretamente nas páginas** (sem service layer separada). As queries Supabase usam `(supabase as any)` para contornar tipos gerados — isto é um tech debt documentado.

---

## 1. Cotações

### `AtualizarCotacao` (Manual — Dialog)
**Trigger:** Botão "Novo Orçamento Manual" ou ícone de edição na lista.
**Page:** `app/compras/orcamentos/page.tsx` → `handleSave()`
**Writes:**
- `compras_orcamentos` → INSERT ou UPDATE (se `form.id` presente)
**Payload:**
```typescript
{
  cliente_id, unidade_id, fornecedor_id, ingrediente_id,
  data_orcamento,
  is_embalagem, unidades_por_embalagem, peso_volume_por_unidade,
  preco_embalagem, preco_por_kg_l
}
```

### `CotacaoEmLote` (Batch — Grid)
**Trigger:** Edição de células no Quadro Comparativo + botão "Salvar N Alterações".
**Page:** `app/compras/orcamentos/page.tsx` → `handleSaveBatch()`
**Writes:**
- `compras_orcamentos` → INSERT (múltiplos registros)
**Payload por item:**
```typescript
{
  cliente_id, unidade_id,
  fornecedor_id: key.split('|')[1],
  ingrediente_id: key.split('|')[0],
  data_orcamento: today,
  preco_por_kg_l: price,
  is_embalagem: false
}
```

> [!WARNING] Gap
> O batch insert **não faz upsert** — cria novos registros ao invés de atualizar existentes. Cotações do mesmo fornecedor/ingrediente se acumulam como histórico, mas o sistema usa apenas a mais recente por data.

### `ExcluirCotacao`
**Trigger:** Ícone de lixeira na lista.
**Page:** `app/compras/orcamentos/page.tsx` → `handleDelete()`
**Writes:** `compras_orcamentos` → DELETE (hard delete)

---

## 2. Planejamento

### `MarcarRequisicaoComprada`
**Trigger:** Botão "Marcar como Comprado" na tab OP.
**Page:** `app/compras/page.tsx`
**Writes:**
- `producao_requisicoes` → UPDATE `{ status_compras: 'COMPRADO', comprado_em: now() }`

### `MarcarUANComprado`
**Trigger:** Botão na tab UAN.
**Page:** `app/compras/page.tsx`
**Writes:**
- `uan_compras_monitoramento` → UPSERT `{ cardapio_id, ingrediente_id, quantidade_comprada, status_compras: 'COMPRADO' }`

---

## 3. Lançamento de Notas

### `LancarNotaFiscal`
**Trigger:** Botão "Finalizar Lançamento".
**Page:** `app/compras/lancamentos/page.tsx` → `handleSalvarNf()`
**Multi-Write (Sequential, Not Atomic):**

**Step 1 — Para cada item válido:**
```typescript
estoque_lotes → INSERT {
  unidade_id, cliente_id, fornecedor_id,
  numero_lote_fabricante: `NF-${numNf}-${suffix}`,
  nota_fiscal: numNf,
  data_fabricacao: dataNf,
  quantidade_inicial_g_ml: qtdGml,
  quantidade_atual_g_ml: qtdGml,
  status: 'PREVISTO',
  financeiro_processado: true,
  valor_unitario, valor_total,
  data_vencimento_financeiro: dataVencimentoNf,
  // + ingrediente_id ou material_id dependendo da modalidade
  // + categoria_produto (para materiais)
}
```

**Step 2 — Se valorTotalNF > 0:**
```typescript
fin_transacoes → INSERT {
  unidade_id,
  data_competencia: dataNf,
  data_vencimento: dataVencimentoNf,
  nota_fiscal: numNf,
  descricao: `Compra (${modalidade}): ${fornecedor} (NF ${numNf})`,
  valor_total: valorTotalNFCalculado,
  origem_modulo: 'ESTOQUE'
}

fin_lancamentos → INSERT {
  transacao_id: novaTransacao.id,
  conta_id: contaAutoId,  // Lookup por nome na fin_contas
  tipo_lancamento: 'DEBITO',
  valor: valorTotalNFCalculado
}
```

> [!CAUTION] Risco Transacional
> Os 3 inserts (lotes + transação + lançamento) não estão em uma transação atômica. Se o insert de `fin_transacoes` falhar, os lotes ficam no banco sem contrapartida financeira.

### `ImportarNFAutomatica`
**Trigger:** Botão "Importar (XML/PDF/IA)".
**Page:** `app/compras/lancamentos/page.tsx` → `handleOcrUpload()`
**Behavior:** Parse do arquivo → preenche formulário (não salva automaticamente).
**Parser:** `lib/utils/nf-parser.ts` → estratégia multi-formato:
- XML: DOM Parser (melhor qualidade)
- PDF: `pdf.js` text extraction (cabeçalho apenas)
- Imagem: `Tesseract.js` OCR (placeholder)

### `ExcluirNF`
**Trigger:** Ícone de lixeira no histórico.
**Page:** `app/compras/lancamentos/page.tsx` → `handleDeleteNF()`
**Writes:** `estoque_lotes` → UPDATE `{ deleted_at: now() }` WHERE `nota_fiscal = nf AND fornecedor_id AND unidade_id`

### `EditarLoteHistorico`
**Trigger:** Ícone de edição no histórico.
**Page:** `app/compras/lancamentos/page.tsx` → `handleEditItemSave()`
**Writes:** `estoque_lotes` → UPDATE `{ nota_fiscal, quantidade_inicial_g_ml, quantidade_atual_g_ml, valor_total, valor_unitario }`

> [!WARNING] Gap
> A edição do lote no histórico **não atualiza** a `fin_transacoes` correspondente. Se o valor do lote mudar, a despesa financeira fica desatualizada.

---

## 4. Inteligência

### `AtualizarParLevel`
**Trigger:** Edição inline nos campos ADU e Safety Stock % na tab Par Level.
**Page:** `app/compras/inteligencia/components/ParLevelSetup.tsx`
**Writes:**
```typescript
ingredientes → UPDATE {
  uso_medio_diario: newADU,
  estoque_seguranca_perc: newSafetyPct
}
```

---

## 5. Fornecedores

### `CadastrarFornecedor`
**Trigger:** Botão "+" no Autocomplete do Lançamento de NF ou página de Fornecedores.
**Component:** `components/PreCadastroFornecedorDialog.tsx`
**Behavior:**
1. Usuário insere CNPJ
2. Sistema consulta `brasilapi.com.br/api/cnpj/v1/{cnpj}` (fetch externo)
3. Auto-preenche razão social, endereço, CNAEs
4. INSERT em `fornecedores` com `status_homologacao = 'PENDENTE'`

### `AtualizarFornecedor`
**Page:** `app/fornecedores/[id]/page.tsx`
**Writes:** `fornecedores` → UPDATE com:
- Dados básicos (razão social, contatos, logísticos)
- Portfólio hierárquico: `categorias_compras[]`, `grupos_fornecidos[]`, `subgrupos_fornecidos[]`, `itens_fornecidos[]`
- Vínculos de equipamentos/setores (para tipo SERVICO)

### `ExcluirFornecedor`
**Page:** `app/fornecedores/page.tsx`
**Writes:** `fornecedores` → UPDATE `{ deleted_at: now() }` (soft delete)