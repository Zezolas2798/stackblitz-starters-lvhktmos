---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-estoque]]

---

---
tags:
  - feature/estoque

# Decisões de Arquitetura: Módulo de Estoque (WMS)

Este documento registra as decisões estruturais e inegociáveis para o rastreio e gestão do Estoque.

## 1. Modelo de Rastreabilidade (Batch vs Serialização)
**Decisão:** Rastreamento por Lote (Batch Control).
**Contexto:** Ao receber múltiplas embalagens idênticas do mesmo lote (ex: 10 caixas de leite do Lote X), o sistema criará apenas **1 (um) registro** na tabela `estoque_lotes` com `qtd_embalagens = 10`.
**Justificativa:** Reduz atrito operacional na recepção e varredura.
**Mitigação de Movimentação Individual:** Para permitir movimentações granulares (ex: mover apenas 1 caixa para a cozinha), a tabela `estoque_lotes` controla o saldo `quantidade_atual_g_ml`. O operador informará "Mover 1 embalagem do Lote X para Local Y". A operação fará um Split do Lote ou registrará a movimentação parcial via `estoque_movimentacoes`.

## 2. Formulário de Recebimento Contextual (Modalidades)
**Decisão:** UX Polimórfica guiada pela Categoria/Modalidade.
**Contexto:** O formulário de conferência na entrada de Notas Fiscais deve ocultar/exibir campos baseados na modalidade do item associado.
**Justificativa:** Impedir que o operador seja forçado a preencher "Temperatura de Aferição" para um Rodo de Limpeza ou Material de Expedição, garantindo velocidade e coerência de dados.

## 3. Identificação e Etiquetagem Interna
**Decisão:** QRCode codificando a tupla `[Produto, Lote Interno]`.
**Contexto:** Caso a mercadoria venha sem lote legível do fornecedor, o sistema gera o Lote Interno. A etiqueta ZPL impressa terá o QR Code que mapeará o ID do Lote.
**Justificativa:** A leitura do QR Code pelo WMS Web/Mobile instantaneamente identifica o produto e sua validade, independente da caixa que o operador pegar.
