/**
 * MOTOR DE GERAÇÃO AUTOMÁTICA DE CARDÁPIOS (SOLVER CSP)
 * 
 * Esta Edge Function resolve o 'Menu Planning Problem' (MPP) utilizando uma 
 * abordagem de CSP (Constraint Satisfaction Problem) com Algoritmo de Backtracking.
 * 
 * OBJETIVO:
 * Gerar uma grade de cardápio completa que satisfaça todas as restrições 'HARD'
 * (Severas) configuradas pelo nutricionista, minimizando o esforço manual.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ficha {
  id: string;
  nome: string;
  categoria_uan: string;
  cor_predominante?: string;
  textura_principal?: string;
  metodo_coccao?: string;
  rico_em_enxofre?: boolean;
  custo_por_porcao?: number;
  ingredientes_subgrupos?: string[];
  proteina_familia_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: any = await req.json();
    const { diasAtivos, perfisRefeicao, perfisMap, regras, fichas } = body;

    // 1. PREPARAÇÃO DE DOMÍNIOS
    const dominios: Record<string, Ficha[]> = {};
    fichas.forEach((f: Ficha) => {
      if (!dominios[f.categoria_uan]) dominios[f.categoria_uan] = [];
      dominios[f.categoria_uan].push(f);
    });

    // 2. EXTRAÇÃO DE VARIÁVEIS (Slots a preencher)
    // Mapa de fichas por ID para resolver fichas_fixas
    const fichaById: Record<string, Ficha> = {};
    fichas.forEach((f: Ficha) => { fichaById[f.id] = f; });

    const variables: { day: string, ref: string, categoria: string, slotIndex: number, fixo?: boolean, fichaFixa?: Ficha }[] = [];
    (diasAtivos as string[]).forEach((day) => {
      Object.keys(perfisRefeicao).forEach((ref) => {
        const perfilId = perfisRefeicao[ref];
        const perfil = perfisMap[perfilId];
        if (!perfil || !perfil.slots) return;
        perfil.slots.forEach((s: any) => {
          if (s.quantidade_min > 0) {
            // Slot fixo: atribui fichas pré-definidas
            if (s.fixo && s.fichas_fixas && s.fichas_fixas.length > 0) {
              s.fichas_fixas.forEach((fichaId: string, i: number) => {
                const ficha = fichaById[fichaId];
                if (ficha) {
                  variables.push({ day, ref, categoria: s.categoria_uan, slotIndex: i, fixo: true, fichaFixa: ficha });
                }
              });
            } else {
              // Slot variável: solver decide
              for(let i = 0; i < s.quantidade_min; i++) {
                variables.push({ day, ref, categoria: s.categoria_uan, slotIndex: i });
              }
            }
          }
        });
      });
    });

    const checkValidAssignment = (currentAssignment: any[]): boolean => {
      // Usamos apenas as regras ativas e severas (HARD) para o CSP
      const activeHardRules = (regras as any[]).filter(r => r.ativo && r.severidade === 'HARD');

      for (const r of activeHardRules) {
        // Custo Max Diário
        if (r.tipo_regra === 'CUSTO_MAX_DIARIO' && r.valor_limite) {
          const dictCost: Record<string, number> = {};
          for (const a of currentAssignment) {
            dictCost[a.data_consumo] = (dictCost[a.data_consumo] || 0) + (a._ficha.custo_por_porcao || 0);
            if (dictCost[a.data_consumo] > r.valor_limite) return false;
          }
        }

        // Frequência de Cores (Diária / Refeição)
        if (['MAX_DIARIO_COR', 'MAX_REFEICAO_COR'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
          if (r.tipo_regra === 'MAX_DIARIO_COR') {
            const dictCor: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.cor_predominante === r.parametro_alvo) {
                dictCor[a.data_consumo] = (dictCor[a.data_consumo] || 0) + 1;
                if (dictCor[a.data_consumo] > r.valor_limite) return false;
              }
            }
          } else {
            const dictRef: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.cor_predominante === r.parametro_alvo) {
                const key = `${a.data_consumo}_${a.tipo_refeicao}`;
                dictRef[key] = (dictRef[key] || 0) + 1;
                if (dictRef[key] > r.valor_limite) return false;
              }
            }
          }
        }

        // Frequência de Texturas (Diária / Refeição)
        if (['MAX_DIARIO_TEXTURA', 'MAX_REFEICAO_TEXTURA'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
          if (r.tipo_regra === 'MAX_DIARIO_TEXTURA') {
            const dictTex: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.textura_principal === r.parametro_alvo) {
                dictTex[a.data_consumo] = (dictTex[a.data_consumo] || 0) + 1;
                if (dictTex[a.data_consumo] > r.valor_limite) return false;
              }
            }
          } else {
            const dictRef: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.textura_principal === r.parametro_alvo) {
                const key = `${a.data_consumo}_${a.tipo_refeicao}`;
                dictRef[key] = (dictRef[key] || 0) + 1;
                if (dictRef[key] > r.valor_limite) return false;
              }
            }
          }
        }

        // Enxofre (Diário / Refeição)
        if (['MAX_DIARIO_ENXOFRE', 'MAX_REFEICAO_ENXOFRE'].includes(r.tipo_regra) && r.valor_limite) {
          if (r.tipo_regra === 'MAX_DIARIO_ENXOFRE') {
            const dictEnx: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.rico_em_enxofre && a._ficha.categoria_uan !== 'Prato Base') {
                dictEnx[a.data_consumo] = (dictEnx[a.data_consumo] || 0) + 1;
                if (dictEnx[a.data_consumo] > r.valor_limite) return false;
              }
            }
          } else {
            const dictRef: Record<string, number> = {};
            for (const a of currentAssignment) {
              if (a._ficha.rico_em_enxofre && a._ficha.categoria_uan !== 'Prato Base') {
                const key = `${a.data_consumo}_${a.tipo_refeicao}`;
                dictRef[key] = (dictRef[key] || 0) + 1;
                if (dictRef[key] > r.valor_limite) return false;
              }
            }
          }
        }

        // Distância Mínima Família Proteica
        if (r.tipo_regra === 'DISTANCIA_MINIMA_FAMILIA' && r.parametro_alvo && r.dias_janela) {
          const dates = currentAssignment
            .filter(a => a._ficha.proteina_familia_id === r.parametro_alvo)
            .map(a => a.data_consumo)
            .sort();
          
          for (let i = 1; i < dates.length; i++) {
            const d1 = new Date(dates[i-1]);
            const d2 = new Date(dates[i]);
            const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
            if (diff < r.dias_janela) return false;
          }
        }

        // Distância Mínima Dias (Ficha Individual)
        if (r.tipo_regra === 'DISTANCIA_MINIMA_DIAS' && r.dias_janela) {
          const fDates: Record<string, string[]> = {};
          for (const a of currentAssignment) {
            if (!fDates[a.ficha_uan_id]) fDates[a.ficha_uan_id] = [];
            fDates[a.ficha_uan_id].push(a.data_consumo);
          }
          for (const fId in fDates) {
            const datas = Array.from(new Set(fDates[fId])).sort();
            for (let i = 1; i < datas.length; i++) {
              const delta = Math.floor((new Date(datas[i]).getTime() - new Date(datas[i-1]).getTime()) / (1000 * 3600 * 24));
              if (delta < r.dias_janela) return false;
            }
          }
        }

        // Frequência de Métodos de Cocção (Refeição / Dia / Semana)
        if (['MAX_REFEICAO_METODO_COCCAO', 'MAX_DIARIO_METODO_COCCAO', 'MAX_SEMANAL_METODO_COCCAO'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
          if (r.tipo_regra === 'MAX_REFEICAO_METODO_COCCAO') {
             const dictRef: Record<string, number> = {};
             for (const a of currentAssignment) {
               if (a._ficha.metodo_coccao === r.parametro_alvo) {
                 const key = `${a.data_consumo}_${a.tipo_refeicao}`;
                 dictRef[key] = (dictRef[key] || 0) + 1;
                 if (dictRef[key] > r.valor_limite) return false;
               }
             }
          } else if (r.tipo_regra === 'MAX_DIARIO_METODO_COCCAO') {
             const dictDia: Record<string, number> = {};
             for (const a of currentAssignment) {
               if (a._ficha.metodo_coccao === r.parametro_alvo) {
                 dictDia[a.data_consumo] = (dictDia[a.data_consumo] || 0) + 1;
                 if (dictDia[a.data_consumo] > r.valor_limite) return false;
               }
             }
          } else if (r.tipo_regra === 'MAX_SEMANAL_METODO_COCCAO') {
             const daysWithMethod = new Set(currentAssignment.filter(a => a._ficha.metodo_coccao === r.parametro_alvo).map(a => a.data_consumo));
             if (daysWithMethod.size > r.valor_limite) return false;
          }
        }

        // Incompatibilidade Diária (Repetição de Família Proteica na Refeição)
        if (r.tipo_regra === 'INCOMPATIBILIDADE_DIARIA') {
          const CLUSTER_PROTEICO = ['Prato Principal', 'Alternativa', 'Opção Vegetariana'];
          const dictProt: Record<string, Set<string>> = {}; // key -> Set of family IDs
          
          for (const a of currentAssignment) {
            const f = a._ficha;
            if (f.proteina_familia_id && CLUSTER_PROTEICO.includes(f.categoria_uan)) {
              const key = `${a.data_consumo}_${a.tipo_refeicao}`;
              if (!dictProt[key]) dictProt[key] = new Set();
              
              if (dictProt[key].has(f.proteina_familia_id)) return false; // Já existe essa família nesta refeição
              dictProt[key].add(f.proteina_familia_id);
            }
          }
        }

        // Máximo Semanal por Família
        if (r.tipo_regra === 'MAX_SEMANAL_FAMILIA' && r.parametro_alvo && r.valor_limite !== null) {
          const uniqueDays = new Set(
            currentAssignment
              .filter(a => a._ficha.proteina_familia_id === r.parametro_alvo)
              .map(a => a.data_consumo)
          );
          if (uniqueDays.size > r.valor_limite) return false;
        }

        // Similaridade Entre Dias Consecutivos (Jaccard Index)
        if (r.tipo_regra === 'SIMILARIDADE_ENTRE_DIAS' && (r.limiar_similaridade || 0) > 0) {
          const sortedDays = Array.from(new Set(currentAssignment.map(a => a.data_consumo))).sort();
          if (sortedDays.length > 1) {
            const calculateJaccard = (s1: Set<string>, s2: Set<string>) => {
              if (s1.size === 0 && s2.size === 0) return 1;
              const s1Arr = Array.from(s1);
              const s2Arr = Array.from(s2);
              const intersection = s1Arr.filter(x => s2.has(x));
              const union = new Set([...s1Arr, ...s2Arr]);
              return union.size === 0 ? 0 : intersection.length / union.size;
            };

            const getDayFeatures = (data: string) => {
              const dayItems = currentAssignment.filter(a => a.data_consumo === data).map(a => a._ficha);
              return {
                colors: new Set(dayItems.map(i => i.cor_predominante).filter(Boolean) as string[]),
                textures: new Set(dayItems.map(i => i.textura_principal).filter(Boolean) as string[]),
                methods: new Set(dayItems.map(i => i.metodo_coccao).filter(Boolean) as string[]),
                subgroups: new Set(dayItems.flatMap(i => i.ingredientes_subgrupos || []))
              };
            };

            for (let i = 1; i < sortedDays.length; i++) {
              const featA = getDayFeatures(sortedDays[i-1]);
              const featB = getDayFeatures(sortedDays[i]);
              const jColors = calculateJaccard(featA.colors, featB.colors);
              const jTextures = calculateJaccard(featA.textures, featB.textures);
              const jMethods = calculateJaccard(featA.methods, featB.methods);
              const jIngredients = calculateJaccard(featA.subgroups, featB.subgroups);
              const similarity = (jColors + jTextures + jMethods + jIngredients) / 4;
              const threshold = (r.limiar_similaridade || 50) / 100;
              if (similarity > threshold) return false;
            }
          }
        }
      }
      return true;
    };

    const finalAssignment: any[] = [];
    const startTime = Date.now();
    let isStuck = false;

    const solve = (varIndex: number): boolean => {
      if (Date.now() - startTime > 9000) { isStuck = true; return false; }
      if (varIndex === variables.length) return true;
      const v = variables[varIndex];

      // Slot fixo: atribui diretamente sem buscar no domínio
      if (v.fixo && v.fichaFixa) {
        const item = {
          data_consumo: v.day,
          tipo_refeicao: v.ref,
          ficha_uan_id: v.fichaFixa.id,
          fator_multiplicador: 1,
          fichas_tecnicas_uan: { nome: v.fichaFixa.nome, categoria_uan: v.fichaFixa.categoria_uan },
          _ficha: v.fichaFixa
        };
        finalAssignment.push(item);
        return solve(varIndex + 1);
      }

      // Slot variável: busca no domínio (comportamento original)
      let options = [...(dominios[v.categoria] || [])].sort(() => Math.random() - 0.5);
      if (options.length === 0) return false;

      for (const ficha of options) {
        const item = {
          data_consumo: v.day,
          tipo_refeicao: v.ref,
          ficha_uan_id: ficha.id,
          fator_multiplicador: 1,
          fichas_tecnicas_uan: { nome: ficha.nome, categoria_uan: ficha.categoria_uan },
          _ficha: ficha
        };
        finalAssignment.push(item);
        if (checkValidAssignment(finalAssignment)) {
          if (solve(varIndex + 1)) return true;
        }
        finalAssignment.pop();
      }
      return false;
    };

    if (solve(0)) {
      const output = finalAssignment.map(({ _ficha, ...rest }) => rest);
      return new Response(JSON.stringify({ gradeOutput: output }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const msg = isStuck ? "Timeout: Problema muito complexo para o tempo limite." : "CSP Impossível: Restrições HARD impedem qualquer combinação.";
      return new Response(JSON.stringify({ error: msg }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
