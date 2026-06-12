---
tags:
  - feature/estoque
node_type: discovery
status: placeholder
created_by: brownfield-translation
created: 2026-05-15
feature: estoque
---
---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-estoque]]

---




# Brownfield Translation: Módulo de Estoque (WMS)

> **TODO — human review**
> Este documento reflete o estado "As-Is" do módulo de estoque, compilado a partir da leitura da documentação legada (`docs/modulo.estoque.md` e relacionados) e análise do código.

## Observed Behavior
- O módulo gerencia a rastreabilidade completa de itens (alimentos, insumos e materiais), conectando o recebimento da Nota Fiscal ao consumo final ou descarte.
- A entrada é operada através de um sistema híbrido de "Recebimento e Logística", com suporte planejado para OCR (atualmente mockado) e preenchimento de metadados como SIF/SIE, validade de rótulo e temperatura no ato do recebimento.
- Todos os itens em estoque circulam através do conceito de `Lotes`, sendo o "Lote Interno" gerado automaticamente para itens não etiquetados pelo fornecedor.
- A baixa (Saída/Consumo) reflete na geração de Custos de Venda (CMV) ou de Desperdício através de triggers no banco de dados.
- O Inventário suporta abordagens globais (Wall-to-wall) e locais (Rotativo/Cycle Counting), e as divergências ativam movimentações automáticas de ajuste, rastreando o auditor (`conferido_por`).

## Observed Decisions
- **Arquitetura Isolada (RLS Hardened):** Separação estrita entre "Master Data" (como `ingredientes` e `grupos_produto`, filtrados pelo `cliente_id`) e "Transaction Data" (`estoque_lotes` e `estoque_movimentacoes`, filtrados por `unidade_id`), com uso agressivo de Postgres RLS para bloquear contaminação multi-tenant.
- **Integração Financeira via Triggers:** Movimentações de estoque não disparam APIs externas imediatas para atualizar o financeiro; ao invés disso, triggers SQL robustos interceptam transações e efetuam débitos/créditos automáticos nas tabelas financeiras e atualizam o custo médio (CMP).
- **Array Híbrido (`grupos_permitidos_ids`):** A matriz de locais de estoque filtra contaminações cruzadas utilizando um array que mescla nomes textuais (`"ALIMENTOS"`) com UUIDs de grupos em vez de uma tabela relacional pesada.
- **Design Modular:** Processos fragmentados em módulos operacionais claros (Lotes, Locais, Movimentações, Recebimento, Inventários).

## Observed Constraints
- **Imutabilidade Operacional:** `estoque_movimentacoes` segue uma política *append-only* no banco, sendo a edição manual de saldo (DELETEs) rigorosamente proibida para preservar integridade fiscal e CMV. Corrigir um erro requer um evento de ajuste/estorno.
- **Soft Deletes Inegociáveis:** `estoque_locais` usa o campo `ativo = false` em vez de deleção física para evitar que as referências a transações antigas sejam perdidas na DRE.
- **Seguro Sanitário Termal:** O Lote retém a validade baseada na pior restrição entre rótulo, abertura e validade sanitária por temperatura (Municipal > Estadual > Federal), suportada pelo módulo auxiliar de `calculadoraValidade`.
- **Rastreio de Identidade:** O sistema trava a geração de lote fantasma caso um produto chegue sem procedência, forçando a criação in-house via regex pré-programada `INT-YYYYMMDD-UUID4`.
