import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Fix for IDEs not recognizing the Deno global namespace
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ficha {
  id: string;
  categoria_uan: string;
  cor_predominante?: string;
  textura_principal?: string;
  metodo_coccao?: string;
  rico_em_enxofre?: boolean;
  custo_por_porcao?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: any = await req.json();
    const { diasAtivos, perfisRefeicao, perfisMap, regras, fichas } = body;

    // 1. Preparar Domínios (Agrupar fichas por categoria)
    const dominios: Record<string, Ficha[]> = {};
    fichas.forEach((f: Ficha) => {
      if (!dominios[f.categoria_uan]) dominios[f.categoria_uan] = [];
      dominios[f.categoria_uan].push(f);
    });

    // 2. Extrair Variáveis (o que precisamos preencher)
    // Para cada Dia -> Para cada Refeição -> Para cada Slot com qtde > 0
    const variables: { day: string, ref: string, categoria: string, slotIndex: number }[] = [];
    
    (diasAtivos as string[]).forEach((day) => {
      Object.keys(perfisRefeicao).forEach((ref) => {
        const perfilId = perfisRefeicao[ref];
        const perfil = perfisMap[perfilId];
        if (!perfil || !perfil.slots) return;
        
        perfil.slots.forEach((s: any) => {
          if (s.quantidade_min > 0) {
            for(let i = 0; i < s.quantidade_min; i++) {
              variables.push({ day, ref, categoria: s.categoria_uan, slotIndex: i });
            }
          }
        });
      });
    });

    // Filtra apenas regras HARD e que conseguimos aplicar no CSP
    const hardRules = (regras as any[]).filter(r => r.severidade === 'HARD' && r.ativo);

    const checkValidAssignment = (assignment: any[]): boolean => {
      // Regras de Monotonia Diária (Cor, Textura, Cocção, Enxofre, Custo) e Repetição
      for (const r of hardRules) {
        
        // Custo Max Diário
        if (r.tipo_regra === 'CUSTO_MAX_DIARIO' && r.valor_limite) {
          const dictCost: Record<string, number> = {};
          for (const a of assignment) {
            dictCost[a.data_consumo] = (dictCost[a.data_consumo] || 0) + (a._ficha.custo_por_porcao || 0);
            if (dictCost[a.data_consumo] > r.valor_limite) return false;
          }
        }

        // Cor Max Diária
        if (r.tipo_regra === 'MAX_DIARIO_COR' && r.parametro_alvo) {
          const dictCor: Record<string, number> = {};
          for (const a of assignment) {
            if (a._ficha.cor_predominante === r.parametro_alvo) {
              dictCor[a.data_consumo] = (dictCor[a.data_consumo] || 0) + 1;
              if (dictCor[a.data_consumo] > r.valor_limite) return false;
            }
          }
        }

        // Textura Max Diária
        if (r.tipo_regra === 'MAX_DIARIO_TEXTURA' && r.parametro_alvo) {
          const dictTex: Record<string, number> = {};
          for (const a of assignment) {
            if (a._ficha.textura_principal === r.parametro_alvo) {
              dictTex[a.data_consumo] = (dictTex[a.data_consumo] || 0) + 1;
              if (dictTex[a.data_consumo] > r.valor_limite) return false;
            }
          }
        }

        // Distância Mínima Dias (Não repetir o mesmo prato em menos de X dias)
        // Como o assignment é on-the-fly, podemos olhar as datas dessa ficha
        if (r.tipo_regra === 'DISTANCIA_MINIMA_DIAS' && r.dias_janela) {
          const fDates: Record<string, string[]> = {};
          for (const a of assignment) {
            if (!fDates[a.ficha_uan_id]) fDates[a.ficha_uan_id] = [];
            fDates[a.ficha_uan_id].push(a.data_consumo);
          }
          
          for (const fId in fDates) {
            const datas = Array.from(new Set(fDates[fId])).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
            for (let i = 1; i < datas.length; i++) {
              const dt1 = new Date(datas[i-1]);
              const dt2 = new Date(datas[i]);
              const delta = Math.floor((dt2.getTime() - dt1.getTime()) / (1000 * 3600 * 24));
              if (delta < r.dias_janela) return false;
            }
          }
        }
      }
      return true;
    };

    const assignment: any[] = [];
    const startTime = Date.now();
    let isStuck = false;

    // CSP com Backtracking
    const solve = (varIndex: number): boolean => {
      if (Date.now() - startTime > 9000) {
        // Timeout de segurança após 9s
        isStuck = true; 
        return false;
      }

      if (varIndex === variables.length) return true;

      const v = variables[varIndex];
      let options = [...(dominios[v.categoria] || [])];
      
      // Heurística Randomizada: embaralha para não gerar os mesmos pratos sempre
      options = options.sort(() => Math.random() - 0.5);

      if (options.length === 0) {
        // Se NÃO há NENHUMA ficha para essa categoria, falha irreversível.
        return false;
      }

      for (const ficha of options) {
        const item = {
          data_consumo: v.day,
          tipo_refeicao: v.ref,
          ficha_uan_id: ficha.id,
          fator_multiplicador: 1,
          fichas_tecnicas_uan: { nome: (ficha as any).nome, categoria_uan: ficha.categoria_uan },
          _ficha: ficha
        };
        
        assignment.push(item);
        
        if (checkValidAssignment(assignment)) {
          if (solve(varIndex + 1)) return true;
        }
        
        assignment.pop();
      }
      return false;
    };

    const success = solve(0);

    // Remove _ficha proxy info if solved
    const cleanAssignment = assignment.map(a => {
      const { _ficha, ...rest } = a;
      return rest;
    });

    if (isStuck || !success) {
      return new Response(
        JSON.stringify({ error: "CSP Impossível Satisfazer. Não há combinação matemática que atenda às restrições HARD com o estque de fichas atual (Faltam fichas ou tetos são irreais)." }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ gradeOutput: cleanAssignment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

