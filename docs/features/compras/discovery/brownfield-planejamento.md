---
tags:
  - feature/compras
node_type: discovery
status: brownfield-translated
created_by: brownfield-translation
created: 2026-05-19
feature: compras_planejamento
---

---

> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-compras]]

---

# Brownfield Translation: Planejamento de Compras

> **TODO — human review**
> Reflete o estado "As-Is" da consolidação de demandas, compilado de `app/compras/page.tsx` (~521 linhas).

## Observed Behavior

### Fontes de Demanda (3 Origens)

#### 1. Ordens de Produção (OP) — Tab "Requisições de OP"
- Query: `producao_requisicoes` JOIN `producao_ordens` WHERE `status_compras = 'PENDENTE'` AND item contém status `FALTA_ESTOQUE`.
- Exibe: código da OP, data programada, ingrediente, quantidade faltante (Kg).
- Ação: botão "Marcar como Comprado" → atualiza `status_compras = 'COMPRADO'` + `comprado_em = now()`.

#### 2. Cardápios UAN — Tab "Necessidades UAN"
- Query complexa: `cardapios_uan` → `cardapio_dias_uan` → `composicao_fichas_uan` × `numero_comensais`.
- Resultado: lista de ingredientes × quantidade necessária (Kg) para o período do cardápio ativo.
- Exibe: cardápio nome, período, ingredientes por grupo (colapsável).
- **Margem de Segurança:**
  - **Modo Global:** % de margem aplicado a todos os ingredientes do cardápio (campo `margem_erro_compras_global` no `cardapios_uan`).
  - **Modo Detalhado:** % individual por insumo via `uan_cardapio_insumos_config`.
- Ação: "Marcar como Comprado" → upsert em `uan_compras_monitoramento` com `status_compras = 'COMPRADO'`.

#### 3. Consolidado — Tab "Visão Consolidada"
- Merge das duas fontes anteriores + estoque físico atual.
- Fórmula:
  ```
  sugestaoCompra = max(0, (demandaTotal + estoqueMinimo) - estoqueAtual)
  onde:
    demandaTotal = OP_faltante + UAN_necessidade
    estoqueAtual = SUM(estoque_lotes.quantidade_atual_g_ml) convertido para Kg
    estoqueMinimo = ingredientes.estoque_minimo_kg
  ```
- Cada linha mostra:
  - Ingrediente nome
  - Demanda OP (Kg)
  - Demanda UAN (Kg)
  - Estoque Atual (Kg)
  - **Sugestão de Compra** (Kg) — o valor final recomendado
  - Status visual (URGENTE se sugestão > 0 e estoque = 0; NECESSÁRIO se sugestão > 0; ADEQUADO se sugestão = 0)

### Interface

- **3 abas:** "Requisições de OP", "Necessidades UAN", "Visão Consolidada"
- **Filtros:** Busca por nome de ingrediente
- **Ações em Lote:** Marcar múltiplos itens como comprados

## Observed Decisions

- **Sem Geração de Pedido de Compra:** A tab consolidada é apenas informativa — não gera uma "Ordem de Compra" formal. O comprador deve ir manualmente até a página de Lançamento de NF quando receber os itens.
- **Demanda UAN é Estática:** A necessidade UAN é calculada uma vez baseada no cardápio publicado. Não recalcula automaticamente se o cardápio for alterado.
- **Estoque Mínimo como Safety Stock:** O campo `ingredientes.estoque_minimo_kg` funciona como buffer de segurança na fórmula do consolidado.

## Observed Constraints

- **Não há previsão temporal:** A visão consolidada mostra toda a demanda pendente de uma vez, sem segmentar por dia/semana. Dificulta planejamento de entregas escalonadas.
- **`listas_compras_uan`** existe no banco mas está **inativo** no código — a funcionalidade foi substituída pelo cálculo inline no `page.tsx`.
- **Sem integração com Par Level:** A Calculadora de Par Level (na página Inteligência) não alimenta diretamente a visão consolidada.
