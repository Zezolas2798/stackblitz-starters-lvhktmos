---
id: estoque.Recebimento
titulo: "Recebimento e Logística de Entrada"
tipo: technical
modulo: estoque
status: auditado
layer: application
nature: specification
veracidade: high
convicção: high
ultima_revisao: 2026-04-20
tags:
  - processo/recebimento
  - tech/ocr
  - auditoria/gxp
  - qualidade/sif
edges:
  - referenciada_por: "[[modulo.estoque]]"
  - regula: "[[RDC_216_2004]]"
  - regula: "[[CVS_5_2013]]"
---

# Recebimento e Logística (OCR)

Este documento descreve o portal de recepção de mercadorias, integrando a validação fiscal, o controle de qualidade sanitário e a automação via OCR.

---

## 1. Regras de Negócio (Business Logic)

### 1.1. Protocolo de Inspeção de Qualidade
O sistema atua como uma barreira de segurança. No check-in físico, o receptor deve validar:
1.  **Integridade da Embalagem:** Inspeção visual de avarias.
2.  **Temperatura de Transporte:** Registro obrigatório para itens refrigerados/congelados. O sistema valida se está dentro da faixa permitida para a categoria.
3.  **Registro SIF/SIE:** Verificação do selo de inspeção federal/estadual para produtos de origem animal.

### 1.2. Fluxo de Recebimento em Lote (Batch Receiving)
O recebimento não é feito item por item manualmente. O processo ideal segue:
1.  Carregamento do XML ou PDF da Nota Fiscal.
2.  Mapeamento de produtos (Match entre o nome na NF e o Ingrediente no sistema).
3.  Confirmação de quantidades e datas de validade.
4.  Geração Massiva de Lotes e Etiquetas.

### 1.3. Hierarquia de Validade no Recebimento
Ao registrar a entrada, o sistema sugere a validade interna baseada na data de fabricação + vida útil. O usuário pode sobrescrever, mas o sistema emitirá um alerta se a validade digitada ultrapassar a regulamentação técnica.

---

## 2. Implementação Técnica (How it Works)

### 2.1. OCR Gateway
O sistema possui uma camada de abstração para extração de dados de notas fiscais.

#### Lógica Funcional (O que faz):
- Extrai: CNPJ do Fornecedor, Número da NF, Chave de Acesso, Itens (Descrição, Qtd, Unidade, Valor).
- Tenta correlacionar o CNPJ com a tabela `fornecedores`.
- Tenta correlacionar a descrição do item com `ingredientes` (usando busca por similaridade ou de-para histórico).

#### Status Técnico (Como está hoje):
- **Arquivo:** `app/estoque/entrada/page.tsx` (Função `handleOcrUpload`).
- **Implementação Atual:** Atualmente opera em modo **Simulação (MOCK)** via `setTimeout`, servindo como prova de conceito para a interface de usuário enquanto o backend de OCR (AWS Textract / Azure Form Recognizer) é provisionado.

### 2.2. Helpers de Cálculo
- **`calcularValidade`**: Função assíncrona que cruza dados fiscais com a tabela SQL `regras_validade_sanitaria`.
- **Zod Validation:** O formulário de entrada é validado estritamente para garantir que campos como `unidade_id` e `fornecedor_id` nunca sejam nulos durante a persistência.

### 2.3. Endpoints de Persistência
O checkpoint final ocorre no `POST` para `/api/estoque/entrada`.
1.  Recebe o array de lotes.
2.  Abre uma transação no banco.
3.  Cria os registros em `estoque_lotes`.
4.  Cria as movimentações iniciais em `estoque_movimentacoes` (tipo `ENTRADA`).
5.  Dispara os triggers financeiros e de auditoria citados em [[estoque.movimentacoes]].

---

## 3. Conformidade e Fiscal
- **Chave de Acesso:** O sistema armazena a chave da NF-e para futuras consultas à SEFAZ.
- **Divergência Fiscal:** Se o valor total dos lotes não bater com o valor total da NF, o sistema impede a finalização até que os impostos/fretes sejam devidamente rateados ou justificados.

