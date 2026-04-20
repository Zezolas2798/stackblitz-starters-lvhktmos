---
id: estoque.Inventario
titulo: "Auditoria Física (Inventários)"
tipo: technical
modulo: estoque
status: auditado
layer: application
nature: specification
veracidade: high
convicção: high
ultima_revisao: 2026-04-20
tags:
  - processo/inventario
  - auditoria/gxp
  - reconciliacao/estoque
edges:
  - referenciada_por: "[[modulo.estoque]]"
---

# Auditoria Física (Inventários)

Este documento detalha o processo de reconciliação entre o saldo lógico (sistema) e o saldo físico (prateleira), garantindo a precisão do patrimônio da unidade.

---

## 1. Regras de Negócio (Business Logic)

### 1.1. Tipos de Inventário
O sistema suporta dois modelos operacionais:
*   **Inventário Geral (Wall-to-Wall):** Contagem de todos os itens da unidade. Geralmente realizado mensalmente para fechamento financeiro.
*   **Inventário Rotativo (Cycle Counting):** Auditoria de uma categoria específica ou local (Ex: Apenas a "Câmara de Congelados").

### 1.2. O Fluxo de "Cego" vs "Aberto"
*   **Cego (Recomendado):** O conferente não vê o saldo esperado no sistema, forçando uma contagem real.
*   **Aberto:** O sistema exibe o esperado, útil para conferências rápidas de itens de baixo valor.

### 1.3. Política de Ajuste e Justificativa
Qualquer divergência superior a um limite parametrizável (Ex: 5%) exige uma justificativa detalhada. O sistema gera automaticamente uma movimentação de tipo `AJUSTE_INVENTARIO` para equalizar os saldos após a finalização da auditoria.

---

## 2. Implementação Técnica (How it Works)

### 2.1. Arquitetura de Tabelas
O processo é dividido em cabeçalho e itens para suportar auditorias de longa duração.

#### A. Cabeçalho: `estoque_inventarios`
Armazena o estado da sessão de auditoria.
- `status`: `EM_ANDAMENTO`, `FINALIZADO`, `CANCELADO`.
- `local_estoque_id`: Vincula a auditoria a um setor físico específico.

#### B. Itens: `estoque_inventario_itens`
Registra a contagem individual por lote.
- `qtd_esperada_g`: Saldo que o sistema tinha no momento da abertura do inventário.
- `qtd_conferida_g`: Saldo real digitado pelo usuário.
- `divergencia_g`: Calculado (`conferida` - `esperada`).

### 2.2. Algoritmo de Reconciliação
Ao clicar em "Finalizar Inventário", o sistema executa:
1.  Varre todos os itens com `conferido = true`.
2.  Para cada item com `divergencia_g != 0`:
    - Insere um registro em `estoque_movimentacoes` (tipo `AJUSTE_INVENTARIO`).
    - Atualiza a `quantidade_atual_g_ml` no registro pai em `estoque_lotes`.
3.  Marca `ajuste_aplicado = true` no item do inventário.

### 2.3. Seguros de Auditoria (GxP)
- **Bloqueio de Simultaneidade:** Enquanto um inventário está `EM_ANDAMENTO` para um Local X, o sistema deve alertar (ou travar) novas movimentações manuais naquele local para evitar "estoque fantasma".
- **Identificação do Auditor:** Grava `conferido_por` (UUID) para cada linha auditada.

---

## 3. Interface e Experiência (UX)
- **Localização:** `app/estoque/inventarios/page.tsx`.
- **Modo Mobile:** Design otimizado para tablets/coletores de dados, com foco em digitação rápida e leitura de código de barras.

