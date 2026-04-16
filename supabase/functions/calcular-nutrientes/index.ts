// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// supabase/functions/calcular-nutrientes/index.ts
// Versão v53 - Compliance Total (RDC 429, IN 75) + Harmonização Automática de Porção

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==========================================
// 1. INTERFACES & TIPAGEM
// ==========================================

interface AnvisaRegraTabela {
  constituinte: string;
  unidade: string;
  limite_nao_significativo: number | null;
  expressao_nao_significativa: string | null;
  regra_arr_menor_1: number | null;
  regra_arr_menor_10: number | null;
  regra_arr_maior_10: number | null;
}

interface AnvisaVDR {
  constituinte: string;
  grupo_id: string;
  valor: number | null;
  unidade: string;
}

interface AnvisaLimiteLupa {
  nutriente: string;
  limite_solido_g: number;
  limite_liquido_g: number;
}

interface AnvisaAlegacaoCriterio {
  id: number;
  nutriente: string;
  atributo: string;
  termo_declaracao: string;
  base_calculo: string;
  condicao: string;
  tipo_valor: string;
  valor: number;
}

interface AnvisaMedidaCaseira {
  nome: string;
  nome_singular: string;
}

interface AlergenicoDetectado {
  id: number;
  nome: string;
  fonte: 'INGREDIENTE' | 'CONTAMINACAO_CRUZADA';
  is_direto?: boolean;
  is_derivado?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const NUTRIENTES_CONDICIONAIS = [
  'gordura_mono_g', 'gordura_poli_g', 'colesterol_mg', 'lactose_g', 'galactose_g',
  'poliois_totais_g', 'eritritol_g', 'manitol_g', 'sorbitol_g', 'xilitol_g', 'maltitol_g',
  'vitamina_a_mcg', 'vitamina_d_mcg', 'vitamina_e_mg', 'vitamina_k_mcg', 'vitamina_c_mg',
  'vitamina_b1_mg', 'vitamina_b2_mg', 'vitamina_b3_mg', 'vitamina_b5_mg', 'vitamina_b6_mg',
  'vitamina_b7_mcg', 'vitamina_b9_mcg', 'vitamina_b12_mcg', 'calcio_mg', 'cloreto_mg',
  'cobre_mcg', 'cromo_mcg', 'ferro_mg', 'fluor_mg', 'fosforo_mg', 'iodo_mcg',
  'magnesio_mg', 'manganes_mg', 'molibdenio_mcg', 'potassio_mg', 'selenio_mcg', 'zinco_mg'
];

// ==========================================
// 2. CARREGAMENTO DE DADOS
// ==========================================

async function loadComplianceData(supabaseAdmin: any) {
  const vdrPromise = supabaseAdmin.from('anvisa_vdr').select('*');
  const regrasPromise = supabaseAdmin.from('anvisa_regras_tabela').select('*');
  const lupasPromise = supabaseAdmin.from('anvisa_limites_lupa').select('*');
  const alergenicosPromise = supabaseAdmin.from('anvisa_alergenicos').select('id, nome');
  const alegacoesPromise = supabaseAdmin.from('anvisa_alegacoes_criterios').select('*');
  const medidasPromise = supabaseAdmin.from('anvisa_medidas_caseiras').select('nome, nome_singular');
  const aditivosPromise = supabaseAdmin.from('anvisa_aditivos').select('ins, is_artificial');

  const [vdrRes, regrasRes, lupasRes, alergenicosRes, alegacoesRes, medidasRes, aditivosRes] = await Promise.all([
    vdrPromise, regrasPromise, lupasPromise, alergenicosPromise, alegacoesPromise, medidasPromise, aditivosPromise
  ]);

  if (vdrRes.error) throw new Error(`Erro ao carregar VDR: ${vdrRes.error.message}`);
  if (regrasRes.error) throw new Error(`Erro ao carregar Regras: ${regrasRes.error.message}`);

  const regrasMap = new Map<string, AnvisaRegraTabela>();
  (regrasRes.data ?? []).forEach((d: any) => regrasMap.set(d.constituinte, d));

  const lupasMap = new Map<string, AnvisaLimiteLupa>();
  (lupasRes.data ?? []).forEach((d: any) => lupasMap.set(d.nutriente, d));

  const alergenicosMap = new Map<number, string>();
  (alergenicosRes.data ?? []).forEach((d: any) => alergenicosMap.set(Number(d.id), d.nome));

  const medidasMap = new Map<string, AnvisaMedidaCaseira>();
  (medidasRes.data ?? []).forEach((d: any) => medidasMap.set(d.nome, d));

  return {
    vdrList: vdrRes.data as AnvisaVDR[],
    regrasMap,
    lupasMap,
    alergenicosMap,
    alegacoesRegras: alegacoesRes.data as AnvisaAlegacaoCriterio[],
    medidasMap,
    aditivosMap: new Map<string, any>((aditivosRes.data ?? []).map((a: any) => [a.ins, a]))
  };
}

async function loadReceitaData(supabaseAdmin: any, receita_id: string) {
  const { data: receitaData, error } = await supabaseAdmin
    .from('receitas')
    .select(`*, anvisa_categorias (*), composicao_receitas ( * )`)
    .eq('id', receita_id)
    .single();

  if (error || !receitaData) throw new Error('Receita não encontrada.');
  return { receita: receitaData, composicao: receitaData.composicao_receitas || [] };
}

// ==========================================
// 3. CÁLCULOS E LÓGICA DE NEGÓCIO
// ==========================================

/**
 * FORMATAR VALOR (MEMORIAL DESCRITIVO)
 * 
 * Regra de Negócio: Realiza o arredondamento e formatação de valores nutricionais.
 * Base Legal: 
 *  - IN 75, Anexo III: Define o número de casas decimais por constituinte.
 *  - RDC 429, Anexo IV: Define as regras de arredondamento matemático.
 * 
 * @param valor - Valor bruto calculado.
 * @param constituinte - Nome do nutriente (ex: 'carboidrato_g').
 * @param regrasMap - Mapa de regras (anvisa_regras_tabela).
 * @param isSignificativo - Flag de significância cruzada (Art. 14, RDC 429).
 */
function formatarValor(valor: number, constituinte: string, regrasMap: Map<string, AnvisaRegraTabela>, isSignificativo = true) {
  const regra = regrasMap.get(constituinte);
  const isInteiroObrigatorio = constituinte === 'energia_kcal' || constituinte.startsWith('vd_') || constituinte === 'percentual_vd';

  // RDC 429: Valores não significativos
  // Se o nutriente não for significativo em NENHUMA das bases (100g ou porção), retornamos a expressão de zero
  if (!isSignificativo && regra && regra.limite_nao_significativo !== null) {
    return regra.expressao_nao_significativa ?? '0';
  }

  // RDC 429 Anexo IV: Regras de Arredondamento
  let casasDecimais = -1;
  if (regra) {
    if (isInteiroObrigatorio) casasDecimais = 0;
    else if (valor < 1 && regra.regra_arr_menor_1 !== null) casasDecimais = regra.regra_arr_menor_1;
    else if (valor < 10 && regra.regra_arr_menor_10 !== null) casasDecimais = regra.regra_arr_menor_10;
    else if (regra.regra_arr_maior_10 !== null) casasDecimais = regra.regra_arr_maior_10;
  }

  // Fallback padrão se não houver regra específica
  if (casasDecimais === -1) {
    casasDecimais = (valor < 10 && valor >= 1) ? 1 : 0;
  }

  // IN 75 Anexo III: Para valores entre 1 e 10, se a primeira casa decimal for 0, declarar como inteiro
  // Ex: 1,04 -> "1"
  if (!isInteiroObrigatorio && valor >= 1 && valor < 10) {
    const primeiraCasaDecimal = Math.floor((valor % 1) * 10 + 1e-9);
    if (primeiraCasaDecimal === 0) {
      casasDecimais = 0;
    }
  }

  const m = Math.pow(10, casasDecimais);
  const v = valor * m + 1e-9;
  const vf = (v - Math.floor(v)) >= 0.5 ? Math.ceil(v) / m : Math.floor(v) / m;

  // Retornamos com ponto para consistência com o motor de cálculo, 
  // mas o arredondamento agora respeita a significância cruzada.
  return vf.toFixed(casasDecimais);
}

async function calcularNutrientesRecursivo(composicao: any[], supabaseAdmin: any, alergenicosMap: Map<number, string>, aditivosMap: Map<string, any>) {
  const totaisBrutos: Record<string, number> = {};
  const ingredientesParaLista: any[] = [];
  const alergenicosColetados: AlergenicoDetectado[] = [];
  let contemGluten = false;
  let coloridoArtificialmente = false;
  let coloridoCarmim = false;
  let contemAspartame = false;
  let contemTartrazina = false;
  let contemAmareloCrepusculo = false;
  const ingredientesGMO = new Set<string>();

  // Pré-fetch em batch das IDs necessárias neste nível
  const ingIds = composicao.filter(i => i.item_type === 'ingrediente').map(i => i.item_id);
  const refIds = composicao.filter(i => i.item_type === 'ingrediente' && i.referencia_id).map(i => i.referencia_id);
  const recIds = composicao.filter(i => i.item_type === 'receita').map(i => i.item_id);

  const [ingRes, refRes, recRes, linksRes] = await Promise.all([
    ingIds.length > 0 ? supabaseAdmin.from('ingredientes').select('*').in('id', ingIds) : Promise.resolve({ data: [] }),
    refIds.length > 0 ? supabaseAdmin.from('referencias_nutricionais').select('*').in('id', refIds) : Promise.resolve({ data: [] }),
    recIds.length > 0 ? supabaseAdmin.from('receitas').select('*, composicao_receitas(*)').in('id', recIds) : Promise.resolve({ data: [] }),
    ingIds.length > 0 ? supabaseAdmin.from('ingrediente_alergenicos').select('*').in('ingrediente_id', ingIds) : Promise.resolve({ data: [] })
  ]);

  if (ingRes.error) throw new Error(`Erro ao buscar ingredientes: ${ingRes.error.message}`);
  if (refRes.error) throw new Error(`Erro ao buscar referências: ${refRes.error.message}`);
  if (recRes.error) throw new Error(`Erro ao buscar receitas: ${recRes.error.message}`);
  if (linksRes.error) throw new Error(`Erro ao buscar links de alérgenos: ${linksRes.error.message}`);

  console.log(`[DIAGNÓSTICO] IDs processados:`, ingIds);
  console.log(`[DIAGNÓSTICO] Encontados ${linksRes.data?.length || 0} links de alérgenos nesta etapa.`);

  const ingMap = new Map((ingRes.data || []).map((i: any) => [i.id, i]));
  const refMap = new Map((refRes.data || []).map((r: any) => [r.id, r]));
  const recMap = new Map((recRes.data || []).map((r: any) => [r.id, r]));

  // Agrupar links por ingrediente para facilitar acesso
  const linksPorIng = new Map<string, any[]>();
  (linksRes.data || []).forEach((l: any) => {
    const list = linksPorIng.get(l.ingrediente_id) || [];
    list.push(l);
    linksPorIng.set(l.ingrediente_id, list);
  });

  for (const item of composicao) {
    if (item.item_type === 'ingrediente') {
      const ing = ingMap.get(item.item_id);
      if (!ing) throw new Error(`Ingrediente ID ${item.item_id} não encontrado no batch.`);

      ingredientesParaLista.push({ peso_liquido_g: item.peso_liquido_g, ingrediente: ing });
      if (ing.contem_gluten) contemGluten = true;

      const insLimpo = ing.ins_code ? ing.ins_code.replace(/ins/i, '').trim() : '';
      const aditivoInfo = aditivosMap.get(insLimpo);
      if (aditivoInfo?.is_artificial) coloridoArtificialmente = true;
      if (insLimpo === '120') coloridoCarmim = true;

      if (ing.is_aspartame || insLimpo === '951') contemAspartame = true;
      if (ing.is_tartrazina || insLimpo === '102') contemTartrazina = true;
      if (ing.is_sunset_yellow || insLimpo === '110') contemAmareloCrepusculo = true;

      if (ing.is_transgenico || (ing.transgenicos && ing.transgenicos.length > 0)) {
        // Coletar itens transgênicos (novo formato JSONB ou legado)
        if (ing.transgenicos && Array.isArray(ing.transgenicos)) {
          ing.transgenicos.forEach((t: any) => {
            if (t.especie) {
              const esp = t.especie.trim().toLowerCase();
              const doa = t.doadora ? t.doadora.trim() : '';
              const gmoKey = doa ? `${esp} (doador: ${doa})` : esp;
              ingredientesGMO.add(gmoKey);
            }
          });
        } else {
          const esp = (ing.especie_transgenica || ing.nome || '').trim().toLowerCase();
          const doa = ing.especie_doadora ? ing.especie_doadora.trim() : '';
          const gmoKey = doa ? `${esp} (doador: ${doa})` : esp;
          ingredientesGMO.add(gmoKey);
        }
      }

      // NOVO: Coleta alérgenos detalhados da tabela de links
      const links = linksPorIng.get(ing.id) || [];
      if (links.length > 0) {
        links.forEach((l: any) => {
          // CORRIGIDO: Forçar Number para evitar falha no Map.get() (Deno BIGINT -> String)
          const aid = Number(l.anvisa_alergenico_id);
          const nome = alergenicosMap.get(aid);
          if (nome) {
            alergenicosColetados.push({
              id: aid,
              nome,
              fonte: l.nivel_contato === 'DIRETO' ? 'INGREDIENTE' : 'CONTAMINACAO_CRUZADA',
              is_direto: !!l.is_direto,
              is_derivado: !!l.is_derivado
            });
            console.log(`[DIAGNÓSTICO] Mapeado: ${nome} (ID: ${aid}, Tipo: ${l.nivel_contato})`);
          } else {
            console.log(`[AVISO] ID de alérgeno sem nome no Map: ${aid}`);
          }
        });
      } else if (ing.alergenicos_ids && Array.isArray(ing.alergenicos_ids)) {
        // Fallback robusto (compatibilidade)
        ing.alergenicos_ids.forEach((id: any) => {
          const aid = Number(id);
          const nome = alergenicosMap.get(aid);
          if (nome) {
            alergenicosColetados.push({ id: aid, nome, fonte: 'INGREDIENTE', is_direto: true });
            console.log(`[DIAGNÓSTICO] Fallback via array: ${nome} (ID: ${aid})`);
          }
        });
      }

      let dadosNutricionais = { ...ing };
      if (item.referencia_id) {
        const refData = refMap.get(item.referencia_id);
        if (refData) {
          if (refData.gordura_monoinsaturada_g !== undefined) refData.gordura_mono_g = refData.gordura_monoinsaturada_g;
          if (refData.gordura_poliinsaturada_g !== undefined) refData.gordura_poli_g = refData.gordura_poliinsaturada_g;

          for (const key in refData) {
            if (typeof refData[key] === 'number' && (key.endsWith('_g') || key.endsWith('_mg') || key.endsWith('_mcg') || key.endsWith('_kcal'))) {
              dadosNutricionais[key] = refData[key];
            }
          }
        }
      }

      const fator = item.peso_liquido_g / 100.0;
      for (const key in dadosNutricionais) {
        if (typeof dadosNutricionais[key] === 'number' && (key.endsWith('_g') || key.endsWith('_mg') || key.endsWith('_mcg') || key.endsWith('_kcal'))) {
          totaisBrutos[key] = (totaisBrutos[key] || 0) + ((dadosNutricionais[key] ?? 0) * fator);
        }
      }

    } else if (item.item_type === 'receita') {
      const sub = recMap.get(item.item_id);
      if (!sub) throw new Error(`Sub-receita ID ${item.item_id} não encontrada no batch.`);

      const resSub = await calcularNutrientesRecursivo(sub.composicao_receitas, supabaseAdmin, alergenicosMap, aditivosMap);
      if (resSub.contemGluten) contemGluten = true;
      if (resSub.coloridoArtificialmente) coloridoArtificialmente = true;
      if (resSub.coloridoCarmim) coloridoCarmim = true;
      if (resSub.contemAspartame) contemAspartame = true;
      if (resSub.contemTartrazina) contemTartrazina = true;
      if (resSub.contemAmareloCrepusculo) contemAmareloCrepusculo = true;
      resSub.ingredientesGMO.forEach((name: string) => ingredientesGMO.add(name));
      alergenicosColetados.push(...resSub.alergenicosColetados);

      // A array resSub.listaIngredientesFormatada vem do retorno de calcularNutrientesRecursivo
      const declSub = resSub.listaIngredientesFormatada.join(', ').toLowerCase();
      ingredientesParaLista.push({
        peso_liquido_g: item.peso_liquido_g,
        ingrediente: { nome: sub.nome, tipo_ingrediente: 'COMPOSTO', declaracao_ingredientes_fornecedor: declSub }
      });

      const rendimentoSub = sub.rendimento_total_g || sub.composicao_receitas.reduce((acc: any, i: any) => acc + i.peso_liquido_g, 0) || 1;
      const fator = item.peso_liquido_g / rendimentoSub;
      for (const key in resSub.totaisBrutos) {
        totaisBrutos[key] = (totaisBrutos[key] || 0) + (resSub.totaisBrutos[key] * fator);
      }
    }
  }

  const listaIngredientesFormatada = gerarListaDeIngredientes(ingredientesParaLista);
  return {
    totaisBrutos,
    alergenicosColetados,
    contemGluten,
    listaIngredientesFormatada,
    coloridoArtificialmente,
    coloridoCarmim,
    contemAspartame,
    contemTartrazina,
    contemAmareloCrepusculo,
    ingredientesGMO: Array.from(ingredientesGMO)
  };
}

function calculatePor100g(totais: Record<string, number>, rendimento: number) {
  if (rendimento === 0) return totais;
  const f = 100.0 / rendimento;
  const r: Record<string, number> = {};
  for (const k in totais) r[k] = totais[k] * f;
  return r;
}

function calculatePorPorcao(totais: Record<string, number>, rendimento: number, porcao: number) {
  const f = porcao / rendimento;
  const r: Record<string, number> = {};
  for (const k in totais) r[k] = totais[k] * f;
  return r;
}

function calculateVD(porPorcao: Record<string, number>, vdrMap: Map<string, AnvisaVDR>) {
  const vds: Record<string, string | null> = {};
  for (const k in porPorcao) {
    const vdr = vdrMap.get(k);
    vds[k] = (vdr && vdr.valor !== null && vdr.valor > 0) ?
      Math.round((porPorcao[k] / vdr.valor) * 100 + Number.EPSILON).toString() : null;
  }
  return vds;
}

/**
 * CÁLCULO DE LUPAS / FOP (FRONT-OF-PACKAGE)
 * 
 * Regra de Negócio: Identifica se o produto excede os limites de nutrientes críticos.
 * Base Legal: IN 75, Anexo XV.
 * 
 * @param por100g - Valores baseados em 100g ou 100ml.
 * @param lupasMap - Tabela de limites (anvisa_limites_lupa).
 * @param estado - 'solido' ou 'liquido' (determina a coluna de limite no Anexo XV).
 */
function calculateLupas(por100g: any, lupasMap: any, estado: string) {
  const lupas = { alto_em_acucar_adicionado: false, alto_em_gordura_saturada: false, alto_em_sodio: false };
  const t = estado === 'solido' ? 'limite_solido_g' : 'limite_liquido_g';

  const lAc = lupasMap.get('acucar_adicionado_g')?.[t] ?? (estado === 'solido' ? 15 : 7.5);
  if ((por100g['acucar_adicionado_g'] || 0) >= lAc) lupas.alto_em_acucar_adicionado = true;

  const lGd = lupasMap.get('gordura_saturada_g')?.[t] ?? (estado === 'solido' ? 6 : 3);
  if ((por100g['gordura_saturada_g'] || 0) >= lGd) lupas.alto_em_gordura_saturada = true;

  const lSdDB = lupasMap.get('sodio_mg')?.[t];
  const lSd = lSdDB !== undefined ? lSdDB * 1000 : (estado === 'solido' ? 600 : 300);
  if ((por100g['sodio_mg'] || 0) >= lSd) lupas.alto_em_sodio = true;

  return lupas;
}

// -------------------------------------------------------------
// FUNÇÃO CRÍTICA: CÁLCULO E HARMONIZAÇÃO DE PORÇÕES (RDC 429)
// -------------------------------------------------------------
function calcularPorcoesPorEmbalagem(pesoEmbalagem: number, porcao_g_ml: number) {
  if (!pesoEmbalagem || !porcao_g_ml || porcao_g_ml <= 0) return 'N/A';

  const n = pesoEmbalagem / porcao_g_ml;

  // Regra de Tolerância: Se for <= 2.05, considera unitário
  // (Ex: Embalagem 60g, Porção 30g -> n=2 -> É individual)
  if (n <= 2.05) {
    if (Math.abs(n - 1) < 0.1 || n <= 2) return '1';
  }

  const nar = Math.round(n + 1e-9);
  if (Math.abs(n - Math.round(n)) > Number.EPSILON) return `Cerca de ${nar}`;

  return nar.toString();
}

/**
 * CÁLCULO E HARMONIZAÇÃO DE PORÇÕES
 * 
 * Regra de Negócio: Ajusta o peso da porção declarada conforme o rendimento e a medida caseira.
 * Base Legal:
 *  - RDC 429, Art. 8: Produto individual (porção = embalagem).
 *  - RDC 429, Art. 10, §2º: Harmonização com tolerância de +/- 30%.
 * 
 * @param receita - Dados mestre da receita.
 * @param medidasMap - Catálogo de nomes de medidas (anvisa_medidas_caseiras).
 */
function calcularInfoPorcao(receita: any, medidasMap: Map<string, AnvisaMedidaCaseira>) {
  let { porcao_final_g_ml, peso_embalagem_g, medida_caseira_nome, medida_caseira_peso_g } = receita;

  // 1. Cálculo Inicial de Porções
  let total_porcoes_embalagem = calcularPorcoesPorEmbalagem(peso_embalagem_g, porcao_final_g_ml);

  // 2. Trava de Segurança (RDC 429 Art. 8)
  // Se for "1 porção", a porção TEM que ser igual à embalagem.
  if (total_porcoes_embalagem === '1' && peso_embalagem_g > 0) {
    porcao_final_g_ml = peso_embalagem_g;
  }
  // 3. Harmonização com a Unidade (RDC 429 Art. 10 §2)
  // Se a unidade (medida caseira) pesa X e a porção de referência é Y,
  // e X está entre 70% e 130% de Y, podemos usar X como porção oficial.
  else if (medida_caseira_peso_g > 0 && porcao_final_g_ml > 0) {
    // Verifica se a unidade (medida_caseira_peso_g) está dentro da tolerância da referência (porcao_final_g_ml)
    if (medida_caseira_peso_g >= (porcao_final_g_ml * 0.7) &&
      medida_caseira_peso_g <= (porcao_final_g_ml * 1.3)) {

      // Verifica se a divisão original daria número quebrado (ex: 1.2 unidades)
      const razao = porcao_final_g_ml / medida_caseira_peso_g;
      const isQuebrado = Math.abs(razao - Math.round(razao)) > 0.1 && Math.abs(razao - Math.round(razao * 2) / 2) > 0.1;

      if (isQuebrado) {
        // HARMONIZAÇÃO: Ajusta a porção declarada para ser igual à unidade
        // Ex: Muda de 50g (Ref) para 40g (Unidade) para declarar "1 unidade"
        porcao_final_g_ml = medida_caseira_peso_g;

        // Recalcula o número de porções na embalagem com a nova base
        total_porcoes_embalagem = calcularPorcoesPorEmbalagem(peso_embalagem_g, porcao_final_g_ml);
      }
    }
  }

  let medida_caseira_quantidade = null;
  let nomeMedidaAjustado = medida_caseira_nome;

  if (medida_caseira_peso_g > 0 && porcao_final_g_ml > 0) {
    const q = porcao_final_g_ml / medida_caseira_peso_g;

    // Arredondamento conforme IN 75
    if (q < 1) medida_caseira_quantidade = Math.round(q * 4) / 4; // 0.25, 0.5...
    else medida_caseira_quantidade = Math.round(q * 2) / 2;       // 1, 1.5, 2...

    // Ajuste para singular
    if (medida_caseira_quantidade === 1 && medida_caseira_nome) {
      const dadosMedida = medidasMap.get(medida_caseira_nome);
      if (dadosMedida && dadosMedida.nome_singular) {
        nomeMedidaAjustado = dadosMedida.nome_singular;
      }
    }
  }
  return { porcao_g_ml: porcao_final_g_ml, medida_caseira_nome: nomeMedidaAjustado, medida_caseira_quantidade, total_porcoes_embalagem };
}

function formatarListaComE(lista: string[], conjuntivo = 'e') {
  const items = (lista || []).map(i => i?.trim()).filter(i => !!i);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjuntivo} ${items[1]}`;
  const ultimo = items[items.length - 1];
  const primeiros = items.slice(0, -1);
  return `${primeiros.join(', ')} ${conjuntivo} ${ultimo}`;
}

function gerarListaDeIngredientes(lista: any[]) {
  // Segurança contra nulos ou formato inválido
  const itemsValidos = (lista || []).filter(i => i && i.ingrediente);

  const normais = itemsValidos.filter(i => i.ingrediente.tipo_ingrediente !== 'ADITIVO' && i.peso_liquido_g > 0);
  const aditivos = itemsValidos.filter(i => i.ingrediente.tipo_ingrediente === 'ADITIVO' && i.peso_liquido_g > 0);

  normais.sort((a, b) => b.peso_liquido_g - a.peso_liquido_g);

  const nomesNormais = normais.map(i => {
    let baseStyle = i.ingrediente.nome.toLowerCase();
    
    // Adicionar Texto de Transgênico (Decreto 4.680/2003)
    // REGRA: Apenas para SIMPLES. Industrializados já trazem na sub-lista (declaracao_ingredientes_fornecedor).
    if (i.ingrediente.tipo_ingrediente === 'SIMPLES' && (i.ingrediente.is_transgenico || (i.ingrediente.transgenicos && i.ingrediente.transgenicos.length > 0))) {
      const gmoItems: string[] = [];
      if (i.ingrediente.transgenicos && Array.isArray(i.ingrediente.transgenicos)) {
        i.ingrediente.transgenicos.forEach((t: any) => {
          const info = t.doadora ? ` (doador: ${t.doadora})` : '';
          gmoItems.push(`${t.especie}${info}`);
        });
      } else {
        const doadora = i.ingrediente.especie_doadora ? ` (doador: ${i.ingrediente.especie_doadora})` : '';
        gmoItems.push(`${i.ingrediente.especie_transgenica || i.ingrediente.nome}${doadora}`);
      }
      baseStyle = `${baseStyle} transgênico* (${gmoItems.join(', ')})`;
    }

    return i.ingrediente.tipo_ingrediente === 'COMPOSTO' && i.ingrediente.declaracao_ingredientes_fornecedor
      ? `${baseStyle} (${i.ingrediente.declaracao_ingredientes_fornecedor.toLowerCase()})`
      : baseStyle;
  });

  const funcoesAditivos = new Map<string, Set<string>>();
  for (const item of aditivos) {
    const ing = item.ingrediente;
    const funcao = (ing.funcao_aditivo || 'aditivo').toLowerCase();
    if (!funcoesAditivos.has(funcao)) funcoesAditivos.set(funcao, new Set());

    let nomeLimpo = ing.nome.toLowerCase().replace(/\s*\(ins\s*\d+[a-z]*\)/gi, "").trim();
    if (nomeLimpo.includes('/')) nomeLimpo = nomeLimpo.split('/')[0].trim();

    const insLimpo = ing.ins_code ? ing.ins_code.replace(/ins/i, '').trim() : '';
    let nomeAditivoFinal = ing.ins_code ? `${nomeLimpo} (INS ${insLimpo})` : nomeLimpo;

    // RDC 727: Tartrazina (102) deve obrigatoriamente declarar o nome
    if (insLimpo === '102') {
      nomeAditivoFinal = `corante tartrazina (INS 102)`;
    }

    funcoesAditivos.get(funcao)!.add(nomeAditivoFinal);
  }

  const nomesAditivos: string[] = [];
  [...funcoesAditivos.keys()].sort().forEach(f => {
    const listaNomes = Array.from(funcoesAditivos.get(f)!).sort();
    // RDC 727: Função tecnológica deve estar em CAIXA ALTA
    nomesAditivos.push(`${f.toUpperCase()}: ${formatarListaComE(listaNomes)}`);
  });

  return [...nomesNormais, ...nomesAditivos];
}

/**
 * PROCESSAR DECLARAÇÕES E ADVERTÊNCIAS
 * 
 * Regra de Negócio: Gera as frases obrigatórias de advertência.
 * Base Legal:
 *  - RDC 727, Art. 6º: Ordem e formatação de Alergênicos e Lactose.
 *  - Lei 10.674/2003: Declaração de Glúten (sempre obrigatória).
 *  - Decreto 4.680/2003: Identificação de Transgênicos (GMO).
 */
function processarDeclaracoes(rec: any, resRec: any, por100g: any, alergenicosMap: Map<number, string>) {
  const {
    contemGluten,
    alergenicosColetados,
    listaIngredientesFormatada,
    coloridoArtificialmente,
    coloridoCarmim,
    contemAspartame,
    contemTartrazina,
    contemAmareloCrepusculo
  } = resRec;
  const contemLactose = (por100g['lactose_g'] || 0) > 0.1;
  // Agrupar por ID para consolidar direto + derivado
  const mapAlergenicos = new Map<number, { nome: string, is_direto: boolean, is_derivado: boolean }>();

  alergenicosColetados.forEach((a: AlergenicoDetectado) => {
    const aid = Number(a.id); // Forçar Number novamente na agregação
    const existing = mapAlergenicos.get(aid) || { nome: a.nome.toUpperCase(), is_direto: false, is_derivado: false };
    
    // Alérgenos via link-table já trazem as flags
    if (a.is_direto) existing.is_direto = true;
    if (a.is_derivado) existing.is_derivado = true;
    
    // Se veio do fallback (fonte INGREDIENTE sem flags), assume direto (RDC 727)
    if (a.fonte === 'INGREDIENTE' && a.is_direto === undefined && a.is_derivado === undefined) {
      existing.is_direto = true;
    }
    // Caso padrão de segurança se nada foi marcado
    if (!existing.is_direto && !existing.is_derivado) existing.is_direto = true;
    
    mapAlergenicos.set(aid, existing);
  });

  // --- 1. CONSOLIDAR ALÉRGICOS (RDC 727/2022) ---
  const sortedIds = Array.from(mapAlergenicos.keys()).sort((a, b) => 
    (mapAlergenicos.get(a)?.nome || '').localeCompare(mapAlergenicos.get(b)?.nome || '')
  );

  const derivOnly: string[] = [];
  const directsAndMixed: string[] = [];

  sortedIds.forEach(id => {
    const v = mapAlergenicos.get(id);
    if (!v) return;
    if (v.is_direto && v.is_derivado) {
      directsAndMixed.push(`${v.nome} E DERIVADOS`);
    } else if (v.is_direto) {
      directsAndMixed.push(v.nome);
    } else if (v.is_derivado) {
      derivOnly.push(`DERIVADOS DE ${v.nome}`);
    }
  });

  // Reordenar: Itens "DERIVADOS DE" primeiro evita ambiguidades "E" no final.
  const listContem = [...derivOnly.sort(), ...directsAndMixed.sort()];
  
  const blocosAlergicos: string[] = [];
  if (listContem.length > 0) {
    blocosAlergicos.push(`CONTÉM ${formatarListaComE(listContem, 'E')}`);
  }

  // --- 2. CRUZADA (PODE CONTER) ---
  const setPodeConter = new Set<string>();
  const riscoIds = (rec.risco_contaminacao_cruzada_ids || []) as (string | number)[];

  for (const id of riscoIds) {
    const numId = Number(id);
    const nome = (alergenicosMap.get(numId) || '').trim().toUpperCase();
    if (nome && !mapAlergenicos.has(numId)) {
      setPodeConter.add(nome);
    }
  }

  const listaPode = Array.from(setPodeConter).sort();
  if (listaPode.length > 0) {
    blocosAlergicos.push(`PODE CONTER ${formatarListaComE(listaPode, 'E')}`);
  }

  // --- 3. MONTAGEM FINAL DA FRASE ÚNICA ---
  let alergenicos = null;
  if (blocosAlergicos.length > 0) {
    // Une os blocos (CONTÉM e PODE CONTER) com " E " conforme RDC 727.
    alergenicos = `ALÉRGICOS: ${formatarListaComE(blocosAlergicos,'.')}.`;
  }

  let txtI = null;
  if (listaIngredientesFormatada.length > 0) {
    const l = [...listaIngredientesFormatada];
    l[0] = l[0].charAt(0).toUpperCase() + l[0].slice(1);
    txtI = `Ingredientes: ${formatarListaComE(l)}.`;
  }

  // Advertência de Glúten (Lei 10.674/2003)
  const alertaGluten = contemGluten ? "CONTÉM GLÚTEN" : "NÃO CONTÉM GLÚTEN";

  // Advertência de Lactose (RDC 727/2022) - Limite 100mg/100g (0.1g)
  const lactose100g = por100g['lactose_g'] || 0;
  // Estratégia de Omissão: Se o produto contém leite nos ingredientes mas o valor de lactose está zerado/indeterminado
  const temLeiteIntencional = resRec.alergenicosColetados.some((a: any) => a.id === 10 || a.nome.toUpperCase() === "LEITE");
  const alertaLactose = (lactose100g > 0.1 || (temLeiteIntencional && lactose100g === 0)) ? "CONTÉM LACTOSE" : null;

  // Transgênicos (Decreto 4.680/2003)
  const gmoList = resRec.ingredientesGMO || [];
  let alertaGMO = null;
  if (gmoList.length > 0) {
    // Normalizar nomes para o alerta (usar apenas a espécie em caixa alta para a frase de destaque)
    const especiesUnicas = new Set<string>();
    gmoList.forEach((item: string) => {
        const especieOnly = item.split('(')[0].trim();
        especiesUnicas.add(especieOnly.toUpperCase());
    });
    alertaGMO = `CONTÉM ${formatarListaComE(Array.from(especiesUnicas).sort(), 'E')} TRANSGÊNICO(S).`;
  }

  // Efeito Laxativo (RDC 727/2022)
  const poliois100g = por100g['poliois_totais_g'] || 0;
  const alertaLaxativo = poliois100g > 10 ? "ESTE PRODUTO PODE TER EFEITO LAXATIVO" : null;

  // Frases de Advertência Específicas (RDC 727)
  const alertasEspecificos = [];
  if (contemAspartame) {
    alertasEspecificos.push("CONTÉM ASPARTAME");
    alertasEspecificos.push("CONTÉM FENILALANINA");
  }
  if (contemTartrazina) alertasEspecificos.push("ESTE PRODUTO CONTÉM O CORANTE AMARELO DE TARTRAZINA");
  if (contemAmareloCrepusculo) alertasEspecificos.push("ESTE PRODUTO CONTÉM O CORANTE AMARELO CREPÚSCULO");

  return {
    contem_gluten: contemGluten,
    contem_lactose: contemLactose,
    alerta_gluten: alertaGluten,
    alerta_lactose: alertaLactose,
    alerta_gmo: alertaGMO,
    alerta_laxativo: alertaLaxativo,
    alertas_especificos: alertasEspecificos,
    alergenicos: alergenicos,
    lista_ingredientes: txtI,
    colorido_artificialmente: coloridoArtificialmente,
    colorido_carmim: coloridoCarmim,
    modo_conservacao: rec.modo_conservacao || null,
    nota_preparo: rec.is_preparo ? "** No alimento pronto para o consumo." : null,
    isIsento: !!rec.is_isento_nutricional,
    tipoIsencao: rec.tipo_isencao || null,
    instrucoes_preparo: rec.instrucoes_preparo || null
  };
}

function processarAlegacoes(porPorcao: any, por100g: any, lupas: any, porcao: number, regras: AnvisaAlegacaoCriterio[], vdrMap: Map<string, AnvisaVDR>) {
  const conflitos = new Set<string>();
  if (lupas.alto_em_acucar_adicionado) conflitos.add('acucar_adicionado_g');
  if (lupas.alto_em_gordura_saturada) conflitos.add('gordura_saturada_g');
  if (lupas.alto_em_sodio) conflitos.add('sodio_mg');

  const regrasPorTermo = new Map<string, AnvisaAlegacaoCriterio[]>();
  for (const r of regras) {
    if (conflitos.has(r.nutriente)) continue;
    const key = `${r.nutriente}|${r.termo_declaracao}`;
    if (!regrasPorTermo.has(key)) regrasPorTermo.set(key, []);
    regrasPorTermo.get(key)!.push(r);
  }

  const candidatosPorNutriente = new Map<string, { termo: string, regras: AnvisaAlegacaoCriterio[] }[]>();
  for (const [key, listaRegras] of regrasPorTermo.entries()) {
    const [nutriente, termo] = key.split('|');
    let passouTodas = true;
    for (const r of listaRegras) {
      let val = 0;
      if (r.base_calculo === 'PORCAO') val = porPorcao[r.nutriente];
      else if (r.base_calculo === '100G') val = por100g[r.nutriente];
      else if (r.base_calculo === 'PORCAO_50G') val = porcao <= 30 ? por100g[r.nutriente] * 0.5 : porPorcao[r.nutriente];

      if (val === undefined || val === null) { passouTodas = false; break; }

      let lim = r.valor;
      if (r.tipo_valor === 'VDR_PERC') {
        const vdr = vdrMap.get(r.nutriente)?.valor;
        if (!vdr) { passouTodas = false; break; }
        lim = vdr * r.valor;
      }

      const passouRegra = (r.condicao === 'GTE' && val >= lim) || (r.condicao === 'LTE' && val <= lim);
      if (!passouRegra) { passouTodas = false; break; }
    }

    if (passouTodas) {
      if (!candidatosPorNutriente.has(nutriente)) candidatosPorNutriente.set(nutriente, []);
      candidatosPorNutriente.get(nutriente)!.push({ termo, regras: listaRegras });
    }
  }

  const alegacoesFinais: string[] = [];
  for (const [_, listaCandidatos] of candidatosPorNutriente.entries()) {
    const candidatosGTE = listaCandidatos.filter(c => c.regras[0].condicao === 'GTE');
    if (candidatosGTE.length > 0) {
      candidatosGTE.sort((a, b) => b.regras[0].valor - a.regras[0].valor);
      alegacoesFinais.push(candidatosGTE[0].termo);
    }
    const candidatosLTE = listaCandidatos.filter(c => c.regras[0].condicao === 'LTE');
    if (candidatosLTE.length > 0) {
      candidatosLTE.sort((a, b) => a.regras[0].valor - b.regras[0].valor);
      alegacoesFinais.push(candidatosLTE[0].termo);
    }
  }
  return alegacoesFinais.sort();
}

// ==========================================
// 4. HANDLER PRINCIPAL (Endpoint)
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { receita_id } = await req.json();
    if (!receita_id) throw new Error('ID obrigatório.');

    // 1. Configuração ADMIN e CLIENTE
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Configuração incompleta: variáveis de ambiente ausentes.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: Token ausente.');
    }

    // Client Autenticado - Respeita RLS (Row Level Security)
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Client Admin - Apenas para leitura de tabelas públicas (ANVISA)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autorizado: Token inválido.');
    }

    // 2. Carrega Dados
    const compliance = await loadComplianceData(supabaseAdmin);
    const dadosRec = await loadReceitaData(supabaseAdmin, receita_id);
    const recursivo = await calcularNutrientesRecursivo(dadosRec.composicao, supabaseAdmin, compliance.alergenicosMap, compliance.aditivosMap);

    // 1. CALCULAR PORÇÕES PRIMEIRO (Para determinar a massa base de cálculo)
    // Se a função decidir que a porção é 40g (unidade) e não 50g (banco), ela retorna isso em 'porcao_g_ml'
    const infoP = calcularInfoPorcao(dadosRec.receita, compliance.medidasMap);

    const grupoAlvo = dadosRec.receita.grupo_populacional_id || 'GERAL';
    const vdrMapFiltrado = new Map<string, AnvisaVDR>();
    compliance.vdrList.forEach(vdrItem => {
      if (vdrItem.grupo_id === grupoAlvo) vdrMapFiltrado.set(vdrItem.constituinte, vdrItem);
    });

    // Determine a massa base para o cálculo de 100g (RDC 429 Art. 8 §4º)
    const isPreparo = !!dadosRec.receita.is_preparo;
    const rendimentoBase = isPreparo && dadosRec.receita.rendimento_preparado_g
      ? Number(dadosRec.receita.rendimento_preparado_g)
      : (dadosRec.receita.rendimento_total_g || 1);

    // 2. USAR A PORÇÃO HARMONIZADA PARA O CÁLCULO NUTRICIONAL
    // Isso garante que a tabela reflita o valor real declarado (ex: 40g)
    const porc = infoP.porcao_g_ml;

    const p100 = calculatePor100g(recursivo.totaisBrutos, rendimentoBase);
    const pPorc = calculatePorPorcao(recursivo.totaisBrutos, rendimentoBase, porc);

    const p100Fmt: Record<string, string> = {};
    const pPorcFmt: Record<string, string> = {};
    for (const k in recursivo.totaisBrutos) {
      const v100 = p100[k] || 0;
      const vPorc = pPorc[k] || 0;
      const regra = compliance.regrasMap.get(k);
      const limite = regra?.limite_nao_significativo ?? -1;

      // Lógica de Significância Cruzada (Art. 14 RDC 429)
      // Se for significativo em QUALQUER uma das colunas, declaramos em AMBAS.
      const isSignificativo = (limite === -1) || (v100 > limite) || (vPorc > limite);

      p100Fmt[k] = formatarValor(v100, k, compliance.regrasMap, isSignificativo);
      pPorcFmt[k] = formatarValor(vPorc, k, compliance.regrasMap, isSignificativo);
    }

    const vd = calculateVD(pPorc, vdrMapFiltrado);
    const vd100 = calculateVD(p100, vdrMapFiltrado);
    const conds: string[] = [];
    for (const k of NUTRIENTES_CONDICIONAIS) {
      const regra = compliance.regrasMap.get(k);
      const lim = regra?.limite_nao_significativo ?? 0;
      if ((pPorc[k] || 0) <= lim) continue;

      const vdr = vdrMapFiltrado.get(k);
      const unidade = vdr?.unidade;
      if (unidade === 'mg' || unidade === 'mcg') {
        if (parseFloat(vd[k] || '0') >= 5) conds.push(k);
      } else {
        conds.push(k);
      }
    }

    const lupas = calculateLupas(p100, compliance.lupasMap, dadosRec.receita.estado_alimento);
    const decls = processarDeclaracoes(dadosRec.receita, recursivo, p100, compliance.alergenicosMap);
    const alegs = processarAlegacoes(pPorc, p100, lupas, porc, compliance.alegacoesRegras, vdrMapFiltrado);

    return new Response(JSON.stringify({
      infoPorcao: infoP,
      por100g: p100Fmt,
      porPorcao: pPorcFmt,
      percentualVD: vd,
      percentualVD100g: vd100,
      lupas,
      nutrientesCondicionais: conds,
      declaracoes: decls,
      alegacoes: alegs,
      grupo_populacional: grupoAlvo
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
