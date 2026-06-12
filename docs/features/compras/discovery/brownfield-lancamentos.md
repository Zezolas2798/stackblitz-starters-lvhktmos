---
tags:
  - feature/compras
node_type: discovery
status: brownfield-translated
created_by: brownfield-translation
created: 2026-05-19
feature: compras_lancamentos
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---

# Brownfield Translation: Lançamento de Notas Fiscais

> **TODO — human review**
> Este documento reflete o estado "As-Is" do fluxo de lançamento de notas fiscais, compilado a partir da engenharia reversa de `app/compras/lancamentos/page.tsx` (~908 linhas) e `lib/utils/nf-parser.ts`.

## Observed Behavior

### Importação Multi-Formato
- **XML (NF-e):** Parser DOM completo que extrai todos os campos da nota (fornecedor, CNPJ, itens, lotes, valores, datas). Melhor qualidade de dados.
- **PDF:** Extração de texto via `pdf.js` com regex patterns para cabeçalho (número, data, CNPJ). Itens têm extração limitada.
- **Imagem/Foto:** OCR via `Tesseract.js` com qualidade placeholder — útil apenas para pré-preenchimento parcial.

### Fluxo de Lançamento
1. **Cabeçalho:** Selecionar Modalidade → Fornecedor (Autocomplete) → Nº NF → Datas (Emissão + Vencimento).
2. **Itens:** Cada linha da NF deve ser vinculada a um ingrediente/material do cadastro do sistema. Se não existir, o operador pode usar `QuickIngredienteDialog` ou `QuickMaterialDialog` para cadastro rápido inline.
3. **Quantidades:** Campos: Qtd Embalagens × Peso Unitário × Unidade (KG/G/L/ML/UN) = Volume Total.
4. **Preço Total:** Valor total da linha em R$.
5. **Finalizar:** Cria `estoque_lotes` + `fin_transacoes` + `fin_lancamentos` em sequência.

### Geração Automática de Dados

Ao finalizar o lançamento, o sistema executa:

```
Para cada item válido da NF:
  1. Cria estoque_lotes com:
     - status = 'PREVISTO' (aguardando check-in físico)
     - financeiro_processado = true
     - data_vencimento_financeiro = dataVencimentoNf
     - valor_unitario = precoTotal / qtdEmbalagens
     - valor_total = precoTotal

2. Se valorTotalNF > 0:
   - Busca fin_contas onde nome = mapping[modalidade]
   - Cria fin_transacoes com origem_modulo = 'ESTOQUE'
   - Cria fin_lancamentos com tipo_lancamento = 'DEBITO'
```

### Mapeamento Modalidade → Conta USAR

| Modalidade | Conta USAR Alvo |
|---|---|
| `ALIMENTOS` | Compras de Alimentos |
| `EMBALAGENS` | Material de Embalagem |
| `LIMPEZA` | Produtos de Limpeza |
| `MANUTENCAO` | Manutenção e Reparos |
| `UTENSILIOS` | Utensílios e Ferramentas |
| `EPI_EPC` | Equipamentos de Proteção |
| `UNIFORMES` | Uniformes e Vestuário |
| `PRIMEIROS_SOCORROS` | Material de Primeiros Socorros |

### Histórico de Lançamentos
- **Aba 2:** Visualização agrupada por Categoria (ALIMENTOS, LIMPEZA...) → NF → Itens.
- Cada NF mostra status: `AGUARDANDO` (lotes PREVISTO) ou `RECEBIDO` (lotes APROVADO).
- Suporta edição inline de quantidades/valores e exclusão (soft delete via `deleted_at`).

## Observed Decisions

- **Acoplamento Direto Compras → Financeiro:** A geração de `fin_transacoes` acontece diretamente na página de Lançamentos, sem fila de eventos ou serviço intermediário. Decisão por simplicidade, mas cria risco de inconsistência se apenas um dos inserts falhar.
- **Lote PREVISTO como Default:** Todo lote criado via NF nasce como `PREVISTO`, exigindo que o setor de Estoque/Qualidade faça o check-in físico (inspeção de recebimento) para mudar para `APROVADO`.
- **`financeiro_processado = true`:** Flag já marcada como `true` no lançamento — indica que a despesa financeira já foi gerada, evitando dupla contabilização por outros processos.
- **Sem Ordem de Compra Formal:** O sistema pula a etapa de "Pedido de Compra" e vai direto do Planejamento para o Lançamento de NF. Não existe entidade `PedidoCompra`.

## Observed Constraints

- **Fragilidade Transacional:** Os inserts de `estoque_lotes` e `fin_transacoes` não estão em uma transação atômica do Supabase. Se o insert financeiro falhar, os lotes ficam órfãos.
- **Lançamento por Item, Não por NF:** A nota fiscal não tem uma entidade própria no banco — os lotes são agrupados pelo campo `nota_fiscal` (TEXT) no `estoque_lotes`, que é um campo livre.
- **OCR de Qualidade Limitada:** A extração de itens por imagem (Tesseract) é praticamente placeholder — funciona bem apenas para XML.
