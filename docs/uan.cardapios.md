---
id: uan.cardapios
titulo: "Cardápios UAN — Planejamento de Ciclos e Grade Operacional"
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
  - dominio/cardapios
  - dominio/planejamento
  - dominio/comensais
edges:
  - contains: "[[uan.cardapio_dias_uan]]"
  - queries: "[[fichas_tecnicas_uan]]"
  - produces: "[[uan.lista_compras]]"
  - contextualizes: "[[ARCHITECTURE]]"
  - derives-from: "[[legislacao/RDC_216_2004]]"
  - refines: "[[sistema.registry#uan.CardapioUAN]]"
---

# Cardápios UAN — Planejamento de Ciclos e Grade Operacional

> **Contexto:** O módulo de Cardápios gerencia ciclos mensais de planejamento alimentar para UANs. Um cardápio define **quando**, **quantas pessoas** e **quais preparações** serão servidas — e é o ponto de partida obrigatório para gerar a [[uan.lista_compras]].

---

## 1. Modelo de Dados

### 1.1. Tabela `cardapios_uan` (CardapioUAN — Entidade Master)

| Coluna | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` | uuid PK | ✅ | Chave primária |
| `cliente_id` | uuid FK | ✅ | Multi-tenancy → `clientes(id)` |
| `nome_ciclo` | varchar | ✅ | Nome descritivo do ciclo (ex: "Maio 2026 — Lote 2") |
| `data_inicio` | date | ✅ | 1º dia do período (gerado como primeiro dia do mês) |
| `data_fim` | date | ✅ | Último dia do período (gerado como último dia do mês via UTC) |
| `status` | varchar | ✅ | Estado atual do ciclo (ver State Machine §3) |
| `comensais_estimados_dia` | integer | ✅ | Meta padrão de comensais/dia (usado como fallback) |
| `dias_funcionamento` | jsonb | ✅ | Array: dias da semana que a UAN opera (0=Dom, 1=Seg...6=Sáb) |
| `refeicoes_oferecidas` | jsonb | ✅ | Array de refeições do ciclo (ex: `["Almoço","Jantar"]`) |
| `comensais_modelo` | jsonb | ✅ | Mapa: `{"1":{"Almoço":120,"Jantar":80}, "6":{"Almoço":60}}` (por dia_semana → refeição → qtd) |
| `config_excecoes_dias` | jsonb | ❌ | Override por data específica: `{"2026-05-01":{"comensais":{"Almoço":0}}}` |
| `horario_refeicoes` | jsonb | ❌ | Horários de atendimento por refeição: `{"Almoço":{"inicio":"11:30","fim":"13:00"}}` |
| `setor_producao_id` | uuid FK | ❌ | Setor de produção padrão (filtrado por `unidade_id`) → [[setores_producao]] |
| `created_at` | timestamptz | auto | Timestamp de criação |

> [!WARNING]
> A interface TypeScript `CardapioUAN` declara `unidade_id: string` e `setor_producao_id?: string`, mas ambos podem estar ausentes na DDL do banco. Verificar e criar migration formal se necessário.

---

### 1.2. Tabela `cardapio_dias_uan` (Grade — Value Object)

Representa cada célula da grade: **um dia × uma refeição × uma ficha técnica**.

| Coluna | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` | uuid PK | ✅ | Chave primária |
| `cardapio_id` | uuid FK | ✅ | → `cardapios_uan(id)` |
| `data_consumo` | date | ✅ | Data específica do consumo (não dia_semana — data real) |
| `tipo_refeicao` | varchar | ✅ | `'Almoço'`, `'Jantar'`, `'Ceia'`, `'Desjejum'`, etc. |
| `ficha_uan_id` | uuid FK | ✅ | → `fichas_tecnicas_uan(id)` |
| `fator_multiplicador` | numeric | ✅ | Ajuste de escala (default: 1). Permite variações do rendimento base. |

> Uma ficha técnica pode aparecer **N vezes** na grade (ex: Arroz Branco toda segunda-feira no Almoço), com um registro separado em `cardapio_dias_uan` para cada ocorrência.

---

## 2. Fluxo de Criação (Wizard)

O processo de criação segue duas etapas sequenciais:

```
Etapa 1 — Parâmetros do Ciclo          Etapa 2 — Grade do Cardápio
┌──────────────────────────────┐        ┌────────────────────────────────────────┐
│ Nome do ciclo                │        │                                        │
│ Mês de referência            │   ──►  │  Grade: Dia × Refeição × Ficha        │
│ Dias da semana               │        │  (arrastar fichas para células)        │
│ Refeições oferecidas         │        │                                        │
│ Comensais por dia/refeição   │        └────────────────────────────────────────┘
│ Horários de funcionamento    │
│ Setor de produção padrão     │
└──────────────────────────────┘
```

Após salvar a Etapa 1, o sistema redireciona para `/uan/cardapios/{id}/grade`.

### 2.1. Rotas Frontend

| Rota | Arquivo | Função |
|---|---|---|
| `/uan/cardapios` | `app/uan/cardapios/page.tsx` | Listagem com status e ações |
| `/uan/cardapios/novo` | `app/uan/cardapios/novo/page.tsx` | Wizard Etapa 1 — Parâmetros |
| `/uan/cardapios/[id]/grade` | `app/uan/cardapios/[id]/grade/page.tsx` | Grade visual dia×refeição (39.9 KB) |
| `/uan/cardapios/[id]/editar` | `app/uan/cardapios/[id]/editar/` | Edição dos parâmetros do ciclo |

---

## 3. State Machine — `uan.StatusCardapio`

```
Rascunho ──► Em Planejamento ──► Aprovado ──► Enviado para Compras ──► Em Execução
                                    │
                                    └──► (rejeitado → volta para Rascunho)
```

| Status | Significado | Ação Possível |
|---|---|---|
| `Rascunho` | Criado mas incompleto | Editar grade |
| `Em Planejamento` | Em construção ativa | Editar grade, alterar parâmetros |
| `Aprovado` | Validado pelo nutricionista | Enviar para compras |
| `Enviado para Compras` | Lista de compras gerada | Aguardar recebimento |
| `Em Execução` | Período de atendimento ativo | Somente leitura |

> [!NOTE]
> A transição de estados **não está implementada** como State Machine formal no frontend atual. O status é salvo diretamente na tabela. A automação das transições é um débito técnico a endereçar.

---

## 4. Modelo de Comensais (Regras de Cálculo)

O sistema usa uma hierarquia para determinar a quantidade de comensais em um dia/refeição:

```
1. Verificar config_excecoes_dias[data_real]      (mais específico)
   └─► se tiver override → usar esse valor

2. Verificar comensais_modelo[dia_semana]
   └─► dict{"Almoço": N, "Jantar": M}

3. Fallback: comensais_estimados_dia              (mais genérico)
```

**Exemplo prático** para uma segunda-feira com almoço:
- `comensais_modelo["1"]["Almoço"] = 120` → base semanal
- `config_excecoes_dias["2026-05-01"]["comensais"]["Almoço"] = 0` → feriado, sem atendimento

> [!IMPORTANT]
> Esta lógica de resolução de comensais é executada na Edge Function `calcular-cardapio-uan` — não no frontend. O frontend apenas **persiste** o modelo; a **resolução** happens server-side para garantir consistência.

---

## 5. Grade do Cardápio (`cardapio_dias_uan`)

A grade é o coração operacional do módulo. Cada linha representa uma alocação:

```
Data        | Refeição | Ficha Técnica          | Fator
------------|----------|------------------------|-------
2026-05-05  | Almoço   | Arroz Branco           | 1.0
2026-05-05  | Almoço   | Frango Grelhado        | 1.0
2026-05-05  | Almoço   | Salada Verde Refogada  | 1.0
2026-05-05  | Almoço   | Suco de Laranja        | 0.5   ← metade das porções
2026-05-05  | Jantar   | Arroz Branco           | 1.0
```

**Uma ficha pode aparecer múltiplas vezes** na mesma grade (ex: Arroz Branco toda segunda), gerando registros separados.

O `fator_multiplicador` permite ajustar o rendimento sem alterar a ficha base — útil para cardápios onde uma mesma preparação é servida em escala reduzida em determinados dias.

---

## 6. Conexões do Grafo

```
uan.CardapioUAN     ──contains──►  uan.CardapioDiaUAN
uan.CardapioDiaUAN  ──queries───►  uan.FichaTecnicaUAN
uan.CardapioUAN     ──produces──►  uan.ListaCompraUAN
uan.StatusCardapio  ──transitions──  Em Planejamento → Aprovado → Em Execução
edge.calcularCardapioUAN ──queries──► uan.CardapioUAN
edge.calcularCardapioUAN ──queries──► uan.CardapioDiaUAN
```

---

## 7. Débitos Técnicos

| Item | Prioridade | Descrição |
|---|---|---|
| State Machine formal | Média | Transições de status sem validação de guards e sem audit trail |
| Soft Delete | Alta | Cardápios excluídos via `DELETE` físico |
| Verificar `unidade_id` no banco | Alta | Campo no TypeScript mas possivelmente ausente no schema SQL. **Nota: Todos os setores agora exigem este campo.** |
| Automação status → Enviado | Baixa | Ao gerar lista de compras, status não é atualizado automaticamente |
| Página de edição de parâmetros | Média | Rota `/[id]/editar` existe mas não foi auditada completamente |
