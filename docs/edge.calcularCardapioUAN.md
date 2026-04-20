---
id: edge.calcularCardapioUAN
titulo: "Edge Function: calcular-cardapio-uan — Especificação Técnica"
node_type: spec
layer: application
nature: technical
status: draft
veracidade: high
convicção: high
modulo: uan
version: 1.0.0
last_updated: 2026-04-17
tags:
  - dominio/uan
  - edge-function
  - dominio/lista-compras
  - arquitetura/baasfirst
edges:
  - implements: "[[uan.lista_compras]]"
  - queries: "[[uan.cardapios]]"
  - queries: "[[fichas_tecnicas_uan]]"
  - queries: "[[ingredientes]]"
  - produces: "[[sistema.registry#uan.ListaCompraUAN]]"
  - contextualizes: "[[ARCHITECTURE]]"
  - derives-from: "[[edge.calcularNutrientes]]"
---

# Edge Function: `calcular-cardapio-uan`

> **Status:** `draft` — Especificado e aprovado. Implementação pendente como parte do refinamento do módulo UAN.
>
> Esta função é o equivalente UAN da `calcular-nutrientes`. Centraliza o processamento pesado de multi-query e resolvendo a lógica de comensais variáveis por data.

---

## 1. Propósito e Contexto

A Edge Function `calcular-cardapio-uan` resolve o problema de **4+ round-trips cliente→banco** atualmente presentes na página de Lista de Compras. Ao migrar essa lógica para o servidor Edge (co-localizado com o banco Supabase), o processamento que hoje leva ~400-800ms passará a ser executado em ~20-50ms.

Adicionalmente, esta função serve como **ponto único de extensão** para:
- Exportar PDF da lista de compras (futuro)
- Relatórios de custo mensal (futuro)
- Integração com módulo de estoque (planejado após refinamento UAN)
- Dashboard nutricional do ciclo (futuro)

---

## 2. Interface (Contrato de API)

### 2.1. Endpoint

```
POST /functions/v1/calcular-cardapio-uan
```

### 2.2. Headers Obrigatórios

```http
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

### 2.3. Request Body

```typescript
interface CalcularCardapioInput {
  cardapio_id: string;          // UUID obrigatório
  salvar_snapshot?: boolean;    // Persiste o resultado em listas_compras_uan (default: false)
}
```

### 2.4. Response Success (200)

```typescript
interface CalcularCardapioOutput {
  cardapio: {
    id: string;
    nome_ciclo: string;
    data_inicio: string;
    data_fim: string;
    status: string;
  };
  itens: ItemListaCompra[];
  resumo: {
    total_ingredientes: number;
    custo_total_estimado: number;     // R$
    peso_total_bruto_kg: number;
    dias_no_ciclo: number;
    total_porcoes_ciclo: number;
  };
  lista_id?: string;                  // Presente se salvar_snapshot = true
}

interface ItemListaCompra {
  ingrediente_id: string;
  nome_ingrediente: string;
  grupo_id: string | null;
  nome_grupo: string | null;
  necessidade_bruta_g: number;
  necessidade_bruta_kg: number;
  estoque_atual_kg: number;           // 0 na fase 1; real na fase 2 (integração estoque)
  estoque_minimo_kg: number;
  qtd_comprar_kg: number;             // MAX(0, necessidade - estoque + buffer)
  preco_ultima_compra: number;
  custo_estimado_total: number;
}
```

### 2.5. Erros

| HTTP | Código | Condição |
|---|---|---|
| 401 | `UNAUTHORIZED` | JWT inválido ou ausente |
| 403 | `FORBIDDEN` | `cardapio.cliente_id` não pertence ao tenant do JWT |
| 404 | `NOT_FOUND` | `cardapio_id` não encontrado |
| 400 | `MISSING_CARDAPIO_ID` | Body sem `cardapio_id` |
| 500 | `INTERNAL_ERROR` | Erro de banco ou processamento |

---

## 3. Implementação (Deno)

```typescript
// supabase/functions/calcular-cardapio-uan/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    // --- Auth e Multi-Tenancy ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse(401, "UNAUTHORIZED");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return errorResponse(401, "UNAUTHORIZED");

    // --- Parse Input ---
    const { cardapio_id, salvar_snapshot = false } = await req.json();
    if (!cardapio_id) return errorResponse(400, "MISSING_CARDAPIO_ID");

    // --- Step A: Carregar Cardápio ---
    const { data: cardapio, error: cardapioErr } = await supabaseClient
      .from("cardapios_uan")
      .select("*")
      .eq("id", cardapio_id)
      .single();

    if (cardapioErr || !cardapio) return errorResponse(404, "NOT_FOUND");

    // --- Validar tenant ---
    // RLS garante isolamento, mas validamos explicitamente
    // (Sem perfil/tenant check direto aqui — RLS do Supabase cobre isso)

    // --- Step B: Carregar Grade ---
    const { data: grade, error: gradeErr } = await supabaseClient
      .from("cardapio_dias_uan")
      .select("data_consumo, tipo_refeicao, ficha_uan_id, fator_multiplicador")
      .eq("cardapio_id", cardapio_id);

    if (gradeErr) throw gradeErr;
    if (!grade || grade.length === 0) {
      return new Response(JSON.stringify({
        cardapio, itens: [], resumo: {
          total_ingredientes: 0, custo_total_estimado: 0,
          peso_total_bruto_kg: 0, dias_no_ciclo: 0, total_porcoes_ciclo: 0
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // --- Step C: Resolver Comensais por Célula ---
    const fichasPortions = new Map<string, number>(); // ficha_uan_id → total_porcoes

    for (const celula of grade) {
      const dataStr = celula.data_consumo; // "YYYY-MM-DD"
      const diaDate = new Date(dataStr + "T12:00:00Z");
      const diaSemana = diaDate.getDay(); // 0=Dom, 1=Seg...

      // Resolução hierárquica de comensais
      const excecao = cardapio.config_excecoes_dias?.[dataStr]?.comensais?.[celula.tipo_refeicao];
      const modelo = cardapio.comensais_modelo?.[String(diaSemana)]?.[celula.tipo_refeicao];
      const comensais = excecao ?? modelo ?? cardapio.comensais_estimados_dia ?? 100;

      const porcoes = comensais * (celula.fator_multiplicador ?? 1);
      fichasPortions.set(
        celula.ficha_uan_id,
        (fichasPortions.get(celula.ficha_uan_id) ?? 0) + porcoes
      );
    }

    // --- Step E: Carregar Composição das Fichas ---
    const fichaIds = Array.from(fichasPortions.keys());
    const { data: composicoes, error: compErr } = await supabaseClient
      .from("composicao_fichas_uan")
      .select("ficha_uan_id, ingrediente_id, peso_bruto_g")
      .in("ficha_uan_id", fichaIds);

    if (compErr) throw compErr;

    // --- Step F: Necessidade Bruta por Ingrediente ---
    const necessidade = new Map<string, number>(); // ingrediente_id → total_g

    for (const comp of composicoes ?? []) {
      const totalPorcoes = fichasPortions.get(comp.ficha_uan_id) ?? 0;
      const totalG = comp.peso_bruto_g * totalPorcoes;
      necessidade.set(comp.ingrediente_id, (necessidade.get(comp.ingrediente_id) ?? 0) + totalG);
    }

    // --- Step H: Enriquecer com dados de Ingrediente ---
    const ingredienteIds = Array.from(necessidade.keys());
    const { data: ingredientes, error: ingErr } = await supabaseClient
      .from("ingredientes")
      .select("id, nome, preco_ultima_compra, estoque_minimo_kg, grupo_estoque_id, grupo_estoque:grupo_estoque_id(id, nome)")
      .in("id", ingredienteIds);

    if (ingErr) throw ingErr;

    // --- Step G (Phase 1): Estoque = 0 (integração futura) ---
    // TODO: Integrar com estoque_lotes após refinamento do módulo UAN
    // const { data: estoques } = await supabaseClient
    //   .from("estoque_lotes")
    //   .select("ingrediente_id, quantidade_atual, unidade_medida")
    //   .in("ingrediente_id", ingredienteIds)
    //   .eq("status_lote", "ATIVO");

    const itens: ItemListaCompra[] = (ingredientes ?? []).map((ing: any) => {
      const necessidadeG = necessidade.get(ing.id) ?? 0;
      const necessidadeKg = necessidadeG / 1000;
      const estoqueAtualKg = 0; // Phase 1
      const estoqueMinKg = ing.estoque_minimo_kg ?? 0;
      const qtdComprarKg = Math.max(0, necessidadeKg - estoqueAtualKg + estoqueMinKg);
      const preco = ing.preco_ultima_compra ?? 0;

      return {
        ingrediente_id: ing.id,
        nome_ingrediente: ing.nome,
        grupo_id: ing.grupo_estoque_id ?? null,
        nome_grupo: ing.grupo_estoque?.nome ?? null,
        necessidade_bruta_g: Math.round(necessidadeG),
        necessidade_bruta_kg: +necessidadeKg.toFixed(3),
        estoque_atual_kg: estoqueAtualKg,
        estoque_minimo_kg: estoqueMinKg,
        qtd_comprar_kg: +qtdComprarKg.toFixed(3),
        preco_ultima_compra: preco,
        custo_estimado_total: +(qtdComprarKg * preco).toFixed(2),
      };
    }).sort((a: any, b: any) =>
      (a.nome_grupo ?? "").localeCompare(b.nome_grupo ?? "") ||
      a.nome_ingrediente.localeCompare(b.nome_ingrediente)
    );

    // --- Resumo ---
    const resumo = {
      total_ingredientes: itens.length,
      custo_total_estimado: +itens.reduce((s: number, i: any) => s + i.custo_estimado_total, 0).toFixed(2),
      peso_total_bruto_kg: +itens.reduce((s: number, i: any) => s + i.necessidade_bruta_kg, 0).toFixed(3),
      dias_no_ciclo: new Set(grade.map((c: any) => c.data_consumo)).size,
      total_porcoes_ciclo: Math.round(Array.from(fichasPortions.values()).reduce((s, v) => s + v, 0)),
    };

    // --- Persistir Snapshot (Opcional) ---
    let listaId: string | undefined;
    if (salvar_snapshot) {
      const { data: lista, error: listaErr } = await supabaseClient
        .from("listas_compras_uan")
        .insert([{ cardapio_id, status: "Pendente", itens_json: itens }])
        .select("id")
        .single();
      if (listaErr) throw listaErr;
      listaId = lista?.id;
    }

    return new Response(
      JSON.stringify({ cardapio, itens, resumo, lista_id: listaId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    console.error("[calcular-cardapio-uan]", e);
    return errorResponse(500, "INTERNAL_ERROR", e.message);
  }
});

function errorResponse(status: number, code: string, detail?: string) {
  return new Response(
    JSON.stringify({ error: code, detail }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
```

---

## 4. Configuração de Deploy

```json
// supabase/functions/calcular-cardapio-uan/deno.json
{
  "imports": {
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2"
  }
}
```

- `verify_jwt: true` (obrigatório — autenticação por padrão)
- Runtime: Deno (Supabase Edge Runtime)

---

## 5. Evolução Planejada

| Fase | Feature | Trigger |
|---|---|---|
| **Fase 1 (atual)** | Motor base: grade → composição → ingredientes | Refinamento UAN |
| **Fase 2** | Integração com `estoque_lotes` para descontar estoque real | Após refinamento UAN |
| **Fase 3** | Suporte a exportar PDF da lista por categoria | Relatórios UAN |
| **Fase 4** | Análise nutricional agregada do ciclo completo | Relatórios UAN |

---

## 6. Conexões do Grafo

```
edge.calcularCardapioUAN ──implements──► uan.lista_compras (spec)
edge.calcularCardapioUAN ──queries─────► uan.CardapioUAN
edge.calcularCardapioUAN ──queries─────► uan.CardapioDiaUAN
edge.calcularCardapioUAN ──queries─────► uan.FichaTecnicaUAN
edge.calcularCardapioUAN ──queries─────► uan.ComposicaoFichaUAN
edge.calcularCardapioUAN ──queries─────► ingrediente.Ingrediente
edge.calcularCardapioUAN ──produces────► uan.ListaCompraUAN
uan.PoliticaResolucaoComensais ──applies──► edge.calcularCardapioUAN
edge.calcularCardapioUAN ──derives-from──► edge.calcularNutrientes (padrão arquitetural)
```

