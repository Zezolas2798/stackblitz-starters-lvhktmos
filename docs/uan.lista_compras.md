---
id: uan.lista_compras
titulo: "Lista de Compras UAN — Motor de Cálculo e Especificação"
node_type: spec
layer: domain
nature: reference, technical
status: consolidated
veracidade: high
convicção: high
modulo: uan
version: 1.0.0
last_updated: 2026-04-17
tags:
  - dominio/uan
  - dominio/lista-compras
  - dominio/logistica
  - dominio/custo
edges:
  - derives-from: "[[uan.cardapios]]"
  - queries: "[[fichas_tecnicas_uan]]"
  - queries: "[[ingredientes]]"
  - implements: "[[edge.calcularCardapioUAN]]"
  - contextualizes: "[[ARCHITECTURE]]"
  - refines: "[[sistema.registry#uan.ListaCompraUAN]]"
---

# Lista de Compras UAN — Motor de Cálculo e Especificação

> **Contexto:** A Lista de Compras é o produto final do planejamento de cardápios. Ela consolida a necessidade bruta de ingredientes para todo o ciclo, considerando o número de comensais por dia/refeição, os índices técnicos das fichas (FC, IC) e o estoque disponível (integração futura).

---

## 1. Arquitetura de Processamento: Decisão de Design

> [!IMPORTANT]
> **Decisão arquitetural registrada em 2026-04-17:**
>
> O motor de cálculo da Lista de Compras é implementado como **Edge Function** (`calcular-cardapio-uan`), não como lógica client-side. Esta decisão é definitiva e se aplica à versão refinada do módulo UAN.

### Justificativa

| Critério | Frontend (client-side) | Edge Function ✅ |
|---|---|---|
| **Latência** | 4+ round-trips cliente→banco (~400-800ms total) | 1 invocação → múltiplas queries locais (~20-50ms) |
| **Consistência** | Vulnerável a race conditions e dados parciais | Transacional, atomicamente consistente |
| **Integração com Estoque** | Requer novo round-trip adicional | Adiciona 1 query interna sem impacto no cliente |
| **Reutilização** | Acoplado ao componente React | Reutilizável por PDF export, relatórios, dashboards |
| **Padrão do projeto** | — | ✅ Segue o padrão `calcular-nutrientes` |

### Divisão Frontend / Edge Function

| Responsabilidade | Camada | Justificativa |
|---|---|---|
| FC = PB / PL (auto-calc) | Frontend | Feedback visual instantâneo ao digitar |
| Peso Final = PL × IC | Frontend | Valor derivado exibido em tempo real |
| Custo Per Capita por ficha | Frontend | Fórmula simples, 1 linha, sem round-trip |
| **Consolidação da Lista de Compras** | **Edge Function** | Multi-query pesado, reutilizável |
| **Análise nutricional agregada do ciclo** | **Edge Function** | Multi-ficha, futuro relatório |
| **Geração de PDF / Relatórios de Custo** | **Edge Function** | Feature futura — já suportada pela EF |

---

## 2. Modelo de Dados

### 2.1. Tabela `listas_compras_uan`

| Coluna | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` | uuid PK | ✅ | Chave primária |
| `cardapio_id` | uuid FK | ✅ | → `cardapios_uan(id)` |
| `data_geracao` | timestamptz | auto | Timestamp da geração |
| `status` | varchar | ✅ | `'Pendente'` \| `'Em Cotação'` \| `'Comprado'` |
| `itens_json` | jsonb | ✅ | Snapshot da lista calculada (ver §3.2) |

### 2.2. Estrutura do `itens_json`

```typescript
// Cada item armazenado no snapshot
interface ItemListaCompra {
  ingrediente_id: string;
  nome_ingrediente: string;
  grupo_id?: string;
  nome_grupo?: string;
  necessidade_bruta_g: number;       // Total do ciclo
  necessidade_bruta_kg: number;      // Convertido
  estoque_atual_kg: number;          // Snapshot do estoque na geração (futuro)
  estoque_minimo_kg: number;         // Buffer de segurança
  qtd_comprar_kg: number;            // MAX(0, necessidade - estoque + buffer)
  preco_ultima_compra: number;       // R$/kg no momento da geração
  custo_estimado_total: number;      // qtd_comprar_kg × preco
}
```

---

## 3. Motor de Cálculo — Algoritmo Completo

O algoritmo é executado pela Edge Function `calcular-cardapio-uan` ao receber um `cardapio_id`.

### Passo A — Carregar o Cardápio
```sql
SELECT id, comensais_modelo, config_excecoes_dias, dias_funcionamento, 
       refeicoes_oferecidas, data_inicio, data_fim
FROM cardapios_uan WHERE id = $cardapio_id
```

### Passo B — Carregar a Grade
```sql
SELECT data_consumo, tipo_refeicao, ficha_uan_id, fator_multiplicador
FROM cardapio_dias_uan WHERE cardapio_id = $cardapio_id
```

### Passo C — Resolver Comensais por Célula da Grade

Para cada linha da grade (`data × refeição`):

```
1. dia_semana = data_consumo.getDay()  (0=Dom, 1=Seg...)
2. override = config_excecoes_dias[data_consumo.toISOString()][refeicao]
3. comensais = override ?? comensais_modelo[dia_semana][refeicao] ?? comensais_estimados_dia
4. porcoes_ficha = comensais × fator_multiplicador
```

### Passo D — Agregar Porções por Ficha

```
fichas_porcoes: Map<ficha_uan_id, total_porcoes>

Para cada célula da grade:
  fichas_porcoes[ficha_uan_id] += porcoes_ficha
```

### Passo E — Carregar Composição das Fichas

```sql
SELECT cfu.ficha_uan_id, cfu.ingrediente_id, cfu.peso_bruto_g, cfu.fator_correcao
FROM composicao_fichas_uan cfu
WHERE cfu.ficha_uan_id IN ($lista_de_fichas_ativas)
```

### Passo F — Calcular Necessidade Bruta por Ingrediente

```
necessidade_bruta_g[ingrediente_id] += peso_bruto_g × total_porcoes_ficha
```

> O `peso_bruto_g` da composição já representa a quantidade para **1 porção** do rendimento da ficha. A multiplicação por `total_porcoes_ficha` escala para o ciclo inteiro.

### Passo G — Aplicar Estoque (Fase Futura)

```
-- ATUAL (fase 1): estoque não integrado
qtd_comprar_kg = MAX(0, necessidade_bruta_kg)

-- FUTURO (após integração com módulo de estoque):
estoque_atual_kg = SUM(estoque_lotes.quantidade WHERE ingrediente_id AND status = 'ATIVO')
qtd_comprar_kg = MAX(0, necessidade_bruta_kg - estoque_atual_kg + estoque_minimo_kg)
```

> [!NOTE]
> A integração com o módulo de estoque (`estoque_lotes`) está planejada para **após o refinamento do módulo UAN**. A Edge Function já suporta a adição dessa query sem alterar o contrato da API.

### Passo H — Calcular Custo Estimado e Consolidar

```sql
SELECT id, nome, preco_ultima_compra, estoque_minimo_kg, grupo_estoque_id
FROM ingredientes WHERE id IN ($lista_de_ingredientes)
```

```
Para cada ingrediente:
  custo_estimado = qtd_comprar_kg × preco_ultima_compra
  
Ordenar por: grupo_estoque_id, nome (agrupado para facilitar cotações)
```

---

## 4. Especificação da Edge Function: `calcular-cardapio-uan`

> Documento completo em [[edge.calcularCardapioUAN]]

### 4.1. Contrato de API

**Endpoint:** `POST /functions/v1/calcular-cardapio-uan`

**Headers:**
```
Authorization: Bearer <jwt>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  cardapio_id: string;          // UUID do cardápio
  salvar_snapshot?: boolean;    // Se true, persiste em listas_compras_uan (default: false)
}
```

**Response:**
```typescript
{
  cardapio: { nome_ciclo, data_inicio, data_fim, status },
  itens: ItemListaCompra[],
  resumo: {
    total_ingredientes: number,
    custo_total_estimado: number,
    peso_total_bruto_kg: number,
    dias_no_ciclo: number,
    total_porcoes_ciclo: number
  },
  lista_id?: string  // Se salvar_snapshot = true
}
```

### 4.2. Autenticação e Multi-Tenancy

- JWT obrigatório (`verify_jwt: true`)
- A função valida que `cardapio.cliente_id` pertence ao tenant do JWT antes de processar
- RLS do banco aplica isolamento adicional

---

## 5. Rotas Frontend

| Rota | Arquivo | Função |
|---|---|---|
| `/uan/lista-compras` | `app/uan/lista-compras/page.tsx` | Seleção de cardápio + exibição da lista consolidada |

### 5.1. Comportamento Atual (a migrar para Edge Function)

O código atual em `lista-compras/page.tsx` (288 linhas) executa 4 queries client-side sequencialmente. Este comportamento deve ser substituído por uma única chamada `invoke('calcular-cardapio-uan', { body: { cardapio_id } })`.

---

## 6. State Machine — `uan.StatusListaCompra`

```
Pendente ──► Em Cotação ──► Comprado
```

| Status | Significado |
|---|---|
| `Pendente` | Lista gerada mas não enviada ao financeiro/compras |
| `Em Cotação` | Itens sendo cotados com fornecedores |
| `Comprado` | Pedido realizado e confirmado |

---

## 7. Conexões do Grafo

```
uan.ListaCompraUAN       ──derives-from──► uan.CardapioUAN
edge.calcularCardapioUAN ──queries───────► uan.CardapioUAN
edge.calcularCardapioUAN ──queries───────► uan.CardapioDiaUAN
edge.calcularCardapioUAN ──queries───────► uan.FichaTecnicaUAN
edge.calcularCardapioUAN ──queries───────► uan.ComposicaoFichaUAN
edge.calcularCardapioUAN ──queries───────► ingrediente.Ingrediente
edge.calcularCardapioUAN ──produces──────► uan.ListaCompraUAN
uan.PoliticaResolucaoComensais ──applies──► edge.calcularCardapioUAN
```

---

## 8. Débitos Técnicos

| Item | Prioridade | Descrição |
|---|---|---|
| Migrar para Edge Function | Alta | Substituir 4 queries client-side por invocação da EF |
| Integrar estoque real | Futura | `estoque_atual_kg` hardcoded como 0 na versão atual |
| Export PDF | Média | Botão existe mas sem handler implementado |
| Soft Delete nas listas | Alta | Exclusão física sem `deleted_at` |

