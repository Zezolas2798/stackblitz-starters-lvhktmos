/**
 * EDGE FUNCTION: calcular-cardapio-uan
 * 
 * Motor de cálculo da Lista de Compras para o módulo UAN.
 * Consolida a necessidade bruta de ingredientes para todo o ciclo de um cardápio,
 * considerando comensais variáveis por dia/refeição e composição das fichas técnicas.
 * 
 * SUBSTITUI as 4 queries client-side da página lista-compras/page.tsx
 * por uma única invocação server-side co-localizada com o banco.
 * 
 * @see [[uan.lista_compras]] Especificação de domínio
 * @see [[edge.calcularCardapioUAN]] Especificação técnica
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

declare const Deno: any;

// --- Tipos ---

interface ItemListaCompra {
  ingrediente_id: string;
  nome_ingrediente: string;
  grupo_id: string | null;
  nome_grupo: string | null;
  necessidade_bruta_g: number;
  necessidade_bruta_kg: number;
  estoque_atual_kg: number;
  estoque_minimo_kg: number;
  qtd_comprar_kg: number;
  preco_ultima_compra: number;
  custo_estimado_total: number;
}

// --- Helpers ---

function errorResponse(status: number, code: string, detail?: string) {
  return new Response(
    JSON.stringify({ error: code, detail }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// --- Handler Principal ---

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // --- Step B: Carregar Grade ---
    const { data: grade, error: gradeErr } = await supabaseClient
      .from("cardapio_dias_uan")
      .select("data_consumo, tipo_refeicao, ficha_uan_id, fator_multiplicador")
      .eq("cardapio_id", cardapio_id);

    if (gradeErr) throw gradeErr;

    // Grade vazia → retorno vazio válido
    if (!grade || grade.length === 0) {
      return new Response(JSON.stringify({
        cardapio: {
          id: cardapio.id,
          nome_ciclo: cardapio.nome_ciclo,
          data_inicio: cardapio.data_inicio,
          data_fim: cardapio.data_fim,
          status: cardapio.status,
        },
        itens: [],
        resumo: {
          total_ingredientes: 0,
          custo_total_estimado: 0,
          peso_total_bruto_kg: 0,
          dias_no_ciclo: 0,
          total_porcoes_ciclo: 0,
        },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Step C: Resolver Comensais por Célula da Grade ---
    // Hierarquia: config_excecoes_dias > comensais_modelo > comensais_estimados_dia
    const fichasPortions = new Map<string, number>();

    for (const celula of grade) {
      const dataStr = celula.data_consumo; // "YYYY-MM-DD"
      const diaDate = new Date(dataStr + "T12:00:00Z"); // Evita shift de timezone
      const diaSemana = diaDate.getDay(); // 0=Dom, 1=Seg...

      // Resolução hierárquica
      const excecao = cardapio.config_excecoes_dias?.[dataStr]?.comensais?.[celula.tipo_refeicao];
      const modelo = cardapio.comensais_modelo?.[String(diaSemana)]?.[celula.tipo_refeicao];
      const comensais: number = excecao ?? modelo ?? cardapio.comensais_estimados_dia ?? 100;

      const porcoes = comensais * (celula.fator_multiplicador ?? 1);
      fichasPortions.set(
        celula.ficha_uan_id,
        (fichasPortions.get(celula.ficha_uan_id) ?? 0) + porcoes
      );
    }

    // --- Step D: Carregar Composição das Fichas ---
    const fichaIds = Array.from(fichasPortions.keys());
    const { data: composicoes, error: compErr } = await supabaseClient
      .from("composicao_fichas_uan")
      .select("ficha_uan_id, ingrediente_id, peso_bruto_g")
      .in("ficha_uan_id", fichaIds);

    if (compErr) throw compErr;

    // --- Step E: Calcular Necessidade Bruta por Ingrediente ---
    const necessidade = new Map<string, number>(); // ingrediente_id → total_g

    for (const comp of composicoes ?? []) {
      const totalPorcoes = fichasPortions.get(comp.ficha_uan_id) ?? 0;
      const totalG = comp.peso_bruto_g * totalPorcoes;
      necessidade.set(
        comp.ingrediente_id,
        (necessidade.get(comp.ingrediente_id) ?? 0) + totalG
      );
    }

    // --- Step F: Enriquecer com dados de Ingrediente ---
    const ingredienteIds = Array.from(necessidade.keys());

    if (ingredienteIds.length === 0) {
      return new Response(JSON.stringify({
        cardapio: {
          id: cardapio.id,
          nome_ciclo: cardapio.nome_ciclo,
          data_inicio: cardapio.data_inicio,
          data_fim: cardapio.data_fim,
          status: cardapio.status,
        },
        itens: [],
        resumo: {
          total_ingredientes: 0,
          custo_total_estimado: 0,
          peso_total_bruto_kg: 0,
          dias_no_ciclo: new Set(grade.map((c: any) => c.data_consumo)).size,
          total_porcoes_ciclo: Math.round(Array.from(fichasPortions.values()).reduce((s, v) => s + v, 0)),
        },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: ingredientes, error: ingErr } = await supabaseClient
      .from("ingredientes")
      .select("id, nome, preco_ultima_compra, estoque_minimo_kg, grupo_id, grupos_produto(id, nome)")
      .in("id", ingredienteIds);

    if (ingErr) throw ingErr;

    // --- Step G: Montar Lista de Compras ---
    // Fase 1: estoque_atual = 0 (integração com estoque_lotes é futura)
    // TODO: Integrar com estoque_lotes após refinamento do módulo UAN
    // const { data: estoques } = await supabaseClient
    //   .from("estoque_lotes")
    //   .select("ingrediente_id, quantidade_atual, unidade_medida")
    //   .in("ingrediente_id", ingredienteIds)
    //   .eq("status_lote", "ATIVO");

    const itens: ItemListaCompra[] = (ingredientes ?? []).map((ing: any) => {
      const necessidadeG = necessidade.get(ing.id) ?? 0;
      const necessidadeKg = necessidadeG / 1000;
      const estoqueAtualKg = 0; // Phase 1 — integração futura
      const estoqueMinKg = ing.estoque_minimo_kg ?? 0;
      const qtdComprarKg = Math.max(0, necessidadeKg - estoqueAtualKg + estoqueMinKg);
      const preco = ing.preco_ultima_compra ?? 0;

      // Resolver nome do grupo (pode vir como objeto ou array)
      let nomeGrupo: string | null = null;
      let grupoId: string | null = ing.grupo_id ?? null;
      if (ing.grupos_produto) {
        if (Array.isArray(ing.grupos_produto)) {
          nomeGrupo = ing.grupos_produto[0]?.nome ?? null;
          grupoId = ing.grupos_produto[0]?.id ?? grupoId;
        } else {
          nomeGrupo = ing.grupos_produto.nome ?? null;
          grupoId = ing.grupos_produto.id ?? grupoId;
        }
      }

      return {
        ingrediente_id: ing.id,
        nome_ingrediente: ing.nome,
        grupo_id: grupoId,
        nome_grupo: nomeGrupo,
        necessidade_bruta_g: Math.round(necessidadeG),
        necessidade_bruta_kg: +necessidadeKg.toFixed(3),
        estoque_atual_kg: estoqueAtualKg,
        estoque_minimo_kg: estoqueMinKg,
        qtd_comprar_kg: +qtdComprarKg.toFixed(3),
        preco_ultima_compra: preco,
        custo_estimado_total: +(qtdComprarKg * preco).toFixed(2),
      };
    }).sort((a: ItemListaCompra, b: ItemListaCompra) =>
      (a.nome_grupo ?? "").localeCompare(b.nome_grupo ?? "") ||
      a.nome_ingrediente.localeCompare(b.nome_ingrediente)
    );

    // --- Resumo ---
    const resumo = {
      total_ingredientes: itens.length,
      custo_total_estimado: +itens.reduce((s, i) => s + i.custo_estimado_total, 0).toFixed(2),
      peso_total_bruto_kg: +itens.reduce((s, i) => s + i.necessidade_bruta_kg, 0).toFixed(3),
      dias_no_ciclo: new Set(grade.map((c: any) => c.data_consumo)).size,
      total_porcoes_ciclo: Math.round(Array.from(fichasPortions.values()).reduce((s, v) => s + v, 0)),
    };

    // --- Persistir Snapshot (Opcional) ---
    let listaId: string | undefined;
    if (salvar_snapshot) {
      const { data: lista, error: listaErr } = await supabaseClient
        .from("listas_compras_uan")
        .insert([{
          cardapio_id,
          status: "Pendente",
          itens_json: itens,
        }])
        .select("id")
        .single();

      if (listaErr) throw listaErr;
      listaId = lista?.id;
    }

    // --- Response ---
    return new Response(
      JSON.stringify({
        cardapio: {
          id: cardapio.id,
          nome_ciclo: cardapio.nome_ciclo,
          data_inicio: cardapio.data_inicio,
          data_fim: cardapio.data_fim,
          status: cardapio.status,
        },
        itens,
        resumo,
        lista_id: listaId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    console.error("[calcular-cardapio-uan]", e);
    return errorResponse(500, "INTERNAL_ERROR", e.message);
  }
});
