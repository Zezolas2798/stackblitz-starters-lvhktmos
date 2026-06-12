---
> [!NOTE] Ancestry
> ⬆️ **Parent**: [[spec-uan]]
---

layer: domain
nature: reference, technical
status: consolidated
veracidade: high
convicção: high
modulo: uan
version: 1.1.0
last_updated: 2026-04-17
tags:
  - feature/uan
  - dominio/uan
  - dominio/fichas-tecnicas
  - dominio/custo
  - dominio/nutricao-clinica
edges:
  - contains: "[[spec-uan]]"
  - queries: "[[features/ingredientes/discovery/ingredientes]]"
  - contextualizes: "[[shared/spec-architecture]]"
  - derives-from: "[[legislacao/RDC_216_2004]]"
  - refines: "[[registry#uan.FichaTecnicaUAN]]"


## 1. Definição de Domínio

Uma **Ficha Técnica UAN (FT-UAN)** é uma entidade que descreve:

- A **composição** de uma preparação culinária (ingredientes com quantidades e índices técnicos)
- O **dimensionamento** para servir em escala (rendimento em porções + peso por porção)
- O **custo estimado** per capita (calculado a partir dos preços de última compra dos ingredientes)
- A **análise nutricional clínica** voluntária (via referência TACO/TBCA por ingrediente)

---

## 2. Modelo de Dados

### 2.1. Tabela `fichas_tecnicas_uan` (Master)

| Coluna | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` | uuid PK | ✅ | Chave primária (gerada automaticamente) |
| `cliente_id` | uuid FK | ✅ | Multi-tenancy → `clientes(id)` |
| `nome` | varchar | ✅ | Nome da preparação (ex: "Frango Grelhado ao Limão") |
| `categoria_uan` | varchar | ✅ | Categoria da preparação (ver Enum §3.1) |
| `rendimento_porcoes` | integer | ✅ | Qtd de porções que a receita produz (default: 1) |
| `peso_porcao_g` | numeric | ✅ | Peso de cada porção em gramas |
| `modo_preparo` | text | ❌ | Descrição textual da execução (higienização, cocção, armazenamento) |
| `tempo_preparo_min` | integer | ❌ | Tempo total estimado em minutos |
| `refeicoes` | varchar[] | ❌ | Refeições onde esta preparação pode ser servida |
| `created_at` | timestamptz | auto | Timestamp de criação (UTC) |
| `updated_at` | timestamptz | auto | Timestamp de atualização (UTC) |

> [!WARNING]
> O campo `refeicoes` está presente na tipagem TypeScript (`FichaTecnicaUAN.refeicoes?: string[]`) e no frontend, mas **não consta na DDL de referência do schema**. Deve ser verificado e adicionado via migração formal se ausente no banco.

### 2.2. Tabela `composicao_fichas_uan` (Detalhe NxN)

| Coluna | Tipo | Obrig. | Descrição |
|---|---|---|---|
| `id` | uuid PK | ✅ | Chave primária |
| `ficha_uan_id` | uuid FK | ✅ | → `fichas_tecnicas_uan(id)` |
| `ingrediente_id` | uuid FK | ✅ | → `ingredientes(id)` (base de compras) |
| `referencia_id` | uuid FK | ❌ | → `referencias_nutricionais(id)` (TACO/TBCA — override clínico) |
| `peso_bruto_g` | numeric | ✅ | Peso do ingrediente antes do preparo |
| `peso_liquido_g` | numeric | ✅ | Peso após higienização/limpeza |
| `fator_correcao` | numeric | ✅ | FC = PB / PL (auto-calculado, default: 1) |
| `indice_coccao` | numeric | ✅ | IC — perda ou ganho de peso na cocção (default: 1) |

#### Separação entre Base de Compras e Base Científica

| Campo | Propósito | Tabela Fonte |
|---|---|---|
| `ingrediente_id` | Preço de compra, estoque, custo | `ingredientes` |
| `referencia_id` | Dados nutricionais TACO/TBCA para cálculo clínico | `referencias_nutricionais` |

Esta separação é intencional: o insumo comprado pode ser "Peito de Frango Resfriado (Fornecedor X)", enquanto a referência nutricional é "Frango, peito, sem pele, cru — TACO".

---

## 3. Enums e Constantes

### 3.1. `CategoriaUAN` (Union Type TypeScript)

Definida em `lib/types.ts` L55. Separação por grupo de refeição (em `lib/uan-constants.ts`):

| Grupo | Refeições | Categorias Permitidas |
|---|---|---|
| `ALMOCO_JANTAR` | Almoço, Jantar | Prato Base, Prato Principal, Alternativa, Opção Vegetariana, Guarnição, Saladas, Bebidas, Complemento, Sopa |
| `CAFE_LANCHES` | Desjejum, Colação, Lanche da Tarde, Ceia | Bebida Quente, Bebida Fria, Base, Recheio, Complemento, Sobremesa, Prato Principal |

O frontend aplica o filtro dinâmico via `MEAL_CATEGORY_GROUPS` + `REFEICAO_TO_GROUP`: se a ficha for vinculada a refeições específicas, apenas as categorias daquele grupo ficam disponíveis no select.

---

## 4. Regras de Negócio e Cálculos

### 4.1. `uan.CalculoFC` — Fator de Correção (Frontend)

```
FC = Peso Bruto (g) / Peso Líquido (g)
```

Auto-calculado no `onChange` do formulário quando PB e PL estão preenchidos. Reflete as perdas de higienização/descascamento. Armazenado na `composicao_fichas_uan.fator_correcao`.

### 4.2. `uan.CalculoPesoFinal` — Peso Final da Preparação (Frontend)

```
Peso Final (g) = Peso Líquido (g) × Índice de Cocção (IC)
```

Calculado e exibido em tempo real na tabela de composição. **Não é persistido** — valor derivado e re-calculado no carregamento. Representa o peso do ingrediente **após a cocção** (pode ganhar ou perder massa dependendo do processo).

### 4.3. `uan.CalculoPerCapita` — Custo Per Capita (Frontend)

```
Custo da Receita  = Σ [ (Peso Bruto_i (g) / 1000) × Preço/kg_i ]
Custo Per Capita  = Custo da Receita / Rendimento (porções)
```

Exibido em tempo real no box dinâmico do formulário. Usa `ingredientes.preco_ultima_compra` como referência de preço.

> [!NOTE]
> O custo é uma **estimativa atual** baseada no preço de última compra. Não reflete contratos ou cotações futuras. Para rastreabilidade de custo histórico, será necessário o módulo de cotações (futuro).

### 4.4. `uan.CalculoNutricionalClinico` — Análise TACO/TBCA (Frontend)

```
Peso Final_i (g) = Peso Líquido_i × IC_i
Nutriente_total = Σ [ Peso Final_i / 100 × Valor_nutriente_por_100g_i ]
Nutriente_porcao = Nutriente_total / Rendimento_porcoes
```

Disponível no botão "Análise Nutricional (TACO/TBCA)" — abre um modal que calcula e exibe os nutrientes por porção e por receita total. **Inclui apenas ingredientes que possuem `referencia_id` vinculada**; os demais são ignorados com aviso ao usuário.

Nutrientes calculados: Energia (kcal), Carboidratos Totais (g), Carboidratos Disponíveis (g), Proteínas (g), Gorduras Totais (g), Fibras (g), Cálcio (mg), Sódio (mg).

### 4.5. Detecção Automática de Família Proteica (Linter)

O sistema utiliza a **composição** da ficha para identificar automaticamente qual a proteína predominante. Esta informação é fundamental para o motor de validação do cardápio.

**Algoritmo de Detecção:**
1. O sistema filtra os ingredientes da composição que pertencem aos grupos de proteína (Aves, Bovinos, Suínos, Pescados, Ovos, Embutidos).
2. Dentre os ingredientes encontrados, ele seleciona aquele com o maior **Peso Bruto (g)**.
3. O `grupo_id` deste ingrediente é atribuído à ficha técnica como `proteina_familia_id` durante o carregamento da grade.

> [!NOTE]
> Essa lógica de "Peso Dominante" garante que pratos mistos (ex: Escondidinho de Carne com Bacon) sejam classificados corretamente pela proteína principal (Carne), evitando que o bacon dispare alertas de família suína indevidamente.

---

## 5. Regras de Validação (Salvar)

| Regra | Expressão |
|---|---|
| Nome obrigatório | `nome !== ''` |
| Ao menos 1 ingrediente | `linhas.length > 0` |
| Anti-fantasma | Linhas com todos os campos vazios são removidas antes de salvar |
| Completude das linhas | Toda linha não-fantasma deve ter `ingrediente_id`, `peso_bruto_g` e `peso_liquido_g` |

### 5.1. Estratégia de Persistência (Update)

Na edição (`/uan/fichas/[id]`), a sincronização da composição é feita por **Delete + Insert**:

1. `DELETE FROM composicao_fichas_uan WHERE ficha_uan_id = $id`
2. `INSERT INTO composicao_fichas_uan (...)` com todas as linhas atuais

> [!WARNING]
> Esta estratégia é simples e eficaz, mas perde histórico de composição entre edições. Se o versionamento de fichas UAN for implementado no futuro, este ponto será o principal a refatorar.

---

## 6. Rotas Frontend

| Rota | Arquivo | Função |
|---|---|---|
| `/uan/fichas` | `app/uan/fichas/page.tsx` | Listagem com busca por nome, exclusão |
| `/uan/fichas/nova` | `app/uan/fichas/nova/page.tsx` | Formulário de criação (484 linhas) |
| `/uan/fichas/[id]` | `app/uan/fichas/[id]/page.tsx` | Formulário de edição (529 linhas) |

### Dependências de UI

- `@mui/material` — TextField, Autocomplete, Table, Dialog, Chip
- `lucide-react` — Ícones (Save, ArrowLeft, Trash2, PlusCircle, Calculator, ActivitySquare)
- `lib/uan-constants.ts` — Mapeamento categorias/refeições
- `lib/supabaseClient.ts` — Acesso direto ao banco (client-side)
- `lib/ClientContext.tsx` — `activeClientId` para multi-tenancy

---

## 7. Débitos Técnicos e Evolução

| Item | Tipo | Prioridade | Descrição |
|---|---|---|---|
| Refatorar Nova/Editar em componente único | DRY | Alta | ~90% do código duplicado entre `nova/` e `[id]/` |
| Soft Delete | Compliance | Alta | Atualmente usa `DELETE` físico — violação da política ARCHITECTURE.md |
| Audit Trail | Compliance | Alta | Nenhuma entrada em `audit_logs_gxp` para criação/edição/exclusão |
| Tipagem de Referências | TypeSafety | Média | `referenciasDB` tipado como `any[]` em vez de `ReferenciaNutricional[]` |
| Versionamento de Fichas | Feature | Baixa | FT-UAN não tem snapshot histórico (diferente de `receitas_versoes`) |
| Migração formal `refeicoes` | Schema | Alta | Campo implementado no app mas ausente na DDL formal |

---

## 8. Conexões do Grafo

```
uan.FichaTecnicaUAN  ──contains──►  uan.ComposicaoFichaUAN
uan.FichaTecnicaUAN  ──queries───►  ingrediente.Ingrediente
uan.FichaTecnicaUAN  ──queries───►  ingrediente.ReferenciaNutricional (opcional)
uan.CardapioDiaUAN   ──queries───►  uan.FichaTecnicaUAN
edge.calcularCardapioUAN ──queries──► uan.FichaTecnicaUAN
RDC_216_2004         ──enforces──►  fichas_tecnicas_uan (Boas Práticas)
```

