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

  const [vdrRes, regrasRes, lupasRes, alergenicosRes, alegacoesRes, medidasRes] = await Promise.all([
    vdrPromise, regrasPromise, lupasPromise, alergenicosPromise, alegacoesPromise, medidasPromise
  ]);

  if (vdrRes.error) throw new Error(`Erro ao carregar VDR: ${vdrRes.error.message}`);
  if (regrasRes.error) throw new Error(`Erro ao carregar Regras: ${regrasRes.error.message}`);

  const regrasMap = new Map<string, AnvisaRegraTabela>();
  (regrasRes.data ?? []).forEach((d: any) => regrasMap.set(d.constituinte, d));

  const lupasMap = new Map<string, AnvisaLimiteLupa>();
  (lupasRes.data ?? []).forEach((d: any) => lupasMap.set(d.nutriente, d));

  const alergenicosMap = new Map<number, string>();
  (alergenicosRes.data ?? []).forEach((d: any) => alergenicosMap.set(d.id, d.nome));

  const medidasMap = new Map<string, AnvisaMedidaCaseira>();
  (medidasRes.data ?? []).forEach((d: any) => medidasMap.set(d.nome, d));

  return {
    vdrList: vdrRes.data as AnvisaVDR[],
    regrasMap,
    lupasMap,
    alergenicosMap,
    alegacoesRegras: alegacoesRes.data as AnvisaAlegacaoCriterio[],
    medidasMap
  };
}

async function loadReceitaData(supabaseAdmin: any, receita_id: string) {
  const { data: receitaData, error } = await supabaseAdmin
    .from('receitas')
    .select(`*, anvisa_categorias (*), composicao_receitas ( * )`)
    .eq('id', receita_id)
    .single();

  if (error || !receitaData) throw new Error('Receita não encontrada.');
  return { receita: receitaData, composicao: receitaData.composicao_receitas };
}

// ==========================================
// 3. CÁLCULOS E LÓGICA DE NEGÓCIO
// ==========================================

function formatarValor(valor: number, constituinte: string, regrasMap: Map<string, AnvisaRegraTabela>) {
  const regra = regrasMap.get(constituinte);
  // RDC 429: Valores não significativos
  if (regra && regra.limite_nao_significativo !== null && valor <= regra.limite_nao_significativo) {
    return regra.expressao_nao_significativa ?? '0';
  }

  // RDC 429 Anexo IV: Regras de Arredondamento
  let casasDecimais = -1;
  if (regra) {
    if (constituinte === 'energia_kcal' && valor < 10 && valor >= 1) casasDecimais = 1;
    else if (valor < 1 && regra.regra_arr_menor_1 !== null) casasDecimais = regra.regra_arr_menor_1;
    else if (valor < 10 && regra.regra_arr_menor_10 !== null) casasDecimais = regra.regra_arr_menor_10;
    else if (regra.regra_arr_maior_10 !== null) casasDecimais = regra.regra_arr_maior_10;
  }
  if (casasDecimais === -1) casasDecimais = valor < 10 && valor >= 1 ? 1 : 0;

  const m = Math.pow(10, casasDecimais);
  const v = valor * m + 1e-9;
  const vf = (v - Math.floor(v)) >= 0.5 ? Math.ceil(v) / m : Math.floor(v) / m;

  return vf.toFixed(casasDecimais);
}

async function calcularNutrientesRecursivo(composicao: any[], supabaseAdmin: any, alergenicosMap: Map<number, string>) {
  const totaisBrutos: Record<string, number> = {};
  const ingredientesParaLista: any[] = [];
  const alergenicosColetados: AlergenicoDetectado[] = [];
  let contemGluten = false;

  for (const item of composicao) {
    if (item.item_type === 'ingrediente') {
      const { data: ing, error } = await supabaseAdmin.from('ingredientes').select('*').eq('id', item.item_id).single();
      if (error || !ing) throw new Error(`Ingrediente ID ${item.item_id} não encontrado.`);

      ingredientesParaLista.push({ peso_liquido_g: item.peso_liquido_g, ingrediente: ing });
      if (ing.contem_gluten) contemGluten = true;

      // Schema: alergenicos_ids é array de inteiros
      if (ing.alergenicos_ids && Array.isArray(ing.alergenicos_ids)) {
        ing.alergenicos_ids.forEach((id: number) => {
          const nome = alergenicosMap.get(id);
          if (nome) alergenicosColetados.push({ id, nome, fonte: 'INGREDIENTE' });
        });
      }

      const fator = item.peso_liquido_g / 100.0;
      for (const key in ing) {
        if (typeof ing[key] === 'number' && (key.endsWith('_g') || key.endsWith('_mg') || key.endsWith('_mcg') || key.endsWith('_kcal'))) {
          totaisBrutos[key] = (totaisBrutos[key] || 0) + ((ing[key] ?? 0) * fator);
        }
      }

    } else if (item.item_type === 'receita') {
      const { data: sub, error } = await supabaseAdmin.from('receitas').select('*, composicao_receitas(*)').eq('id', item.item_id).single();
      if (error || !sub) throw new Error(`Sub-receita ID ${item.item_id} não encontrada.`);

      const resSub = await calcularNutrientesRecursivo(sub.composicao_receitas, supabaseAdmin, alergenicosMap);
      if (resSub.contemGluten) contemGluten = true;
      alergenicosColetados.push(...resSub.alergenicosColetados);

      const declSub = resSub.listaIngredientesFormatada.join(', ').toLowerCase();
      ingredientesParaLista.push({
        peso_liquido_g: item.peso_liquido_g,
        ingrediente: { nome: sub.nome, tipo_ingrediente: 'COMPOSTO', declaracao_ingredientes_fornecedor: declSub }
      });

      const fator = item.peso_liquido_g / sub.rendimento_total_g;
      for (const key in resSub.totaisBrutos) {
        totaisBrutos[key] = (totaisBrutos[key] || 0) + (resSub.totaisBrutos[key] * fator);
      }
    }
  }

  const listaIngredientesFormatada = gerarListaDeIngredientes(ingredientesParaLista);
  return { totaisBrutos, alergenicosColetados, contemGluten, listaIngredientesFormatada };
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
    if (Math.abs(n - 1) < 0.1 || n <= 2) return "1";
  }

  const nar = Math.round(n + 1e-9);
  if (Math.abs(n - Math.round(n)) > Number.EPSILON) return `Cerca de ${nar}`;

  return nar.toString();
}

function calcularInfoPorcao(receita: any, medidasMap: Map<string, AnvisaMedidaCaseira>) {
  let { porcao_final_g_ml, peso_embalagem_g, medida_caseira_nome, medida_caseira_peso_g } = receita;

  // 1. Cálculo Inicial de Porções
  let total_porcoes_embalagem = calcularPorcoesPorEmbalagem(peso_embalagem_g, porcao_final_g_ml);

  // 2. Trava de Segurança (RDC 429 Art. 8)
  // Se for "1 porção", a porção TEM que ser igual à embalagem.
  if (total_porcoes_embalagem === "1" && peso_embalagem_g > 0) {
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

function formatarListaComE(lista: string[]) {
  if (lista.length === 0) return "";
  if (lista.length === 1) return lista[0];
  if (lista.length === 2) return lista.join(' e ');
  const ultimo = lista[lista.length - 1];
  const primeiros = lista.slice(0, -1);
  return `${primeiros.join(', ')} e ${ultimo}`;
}

function gerarListaDeIngredientes(lista: any[]) {
  const normais = lista.filter(i => i.ingrediente.tipo_ingrediente !== 'ADITIVO' && i.peso_liquido_g > 0);
  const aditivos = lista.filter(i => i.ingrediente.tipo_ingrediente === 'ADITIVO' && i.peso_liquido_g > 0);

  normais.sort((a, b) => b.peso_liquido_g - a.peso_liquido_g);

  const nomesNormais = normais.map(i => {
    const base = i.ingrediente.nome.toLowerCase();
    return i.ingrediente.tipo_ingrediente === 'COMPOSTO' && i.ingrediente.declaracao_ingredientes_fornecedor
      ? `${base} (${i.ingrediente.declaracao_ingredientes_fornecedor.toLowerCase()})`
      : base;
  });

  const funcoesAditivos = new Map<string, string[]>();
  for (const item of aditivos) {
    const ing = item.ingrediente;
    const funcao = (ing.funcao_aditivo || 'aditivo').toLowerCase();
    if (!funcoesAditivos.has(funcao)) funcoesAditivos.set(funcao, []);

    let nomeLimpo = ing.nome.toLowerCase().replace(/\s*\(ins\s*\d+[a-z]*\)/gi, "").trim();
    if (nomeLimpo.includes('/')) nomeLimpo = nomeLimpo.split('/')[0].trim();
    const nomeAditivoFinal = ing.ins_code ? `${nomeLimpo} (INS ${ing.ins_code.replace(/ins/i, '').trim()})` : nomeLimpo;
    funcoesAditivos.get(funcao)!.push(nomeAditivoFinal);
  }

  const nomesAditivos: string[] = [];
  [...funcoesAditivos.keys()].sort().forEach(f => {
    const listaNomes = funcoesAditivos.get(f)!.sort();
    nomesAditivos.push(`${f.charAt(0).toUpperCase() + f.slice(1)}: ${formatarListaComE(listaNomes)}`);
  });

  return [...nomesNormais, ...nomesAditivos];
}

function processarDeclaracoes(rec: any, resRec: any, por100g: any, alergenicosMap: Map<number, string>) {
  const { contemGluten, alergenicosColetados, listaIngredientesFormatada } = resRec;
  const contemLactose = (por100g['lactose_g'] || 0) > 0.1;
  const setAlergenicos = new Set<string>();

  alergenicosColetados.forEach((a: AlergenicoDetectado) => setAlergenicos.add(a.nome.toUpperCase()));

  const setPodeConter = new Set<string>();
  if (rec.risco_contaminacao_cruzada_ids && Array.isArray(rec.risco_contaminacao_cruzada_ids)) {
    rec.risco_contaminacao_cruzada_ids.forEach((id: number) => {
      const nome = alergenicosMap.get(id);
      if (nome && !setAlergenicos.has(nome.toUpperCase())) setPodeConter.add(nome.toUpperCase());
    });
  }

  const listaContem = Array.from(setAlergenicos).sort();
  const listaPode = Array.from(setPodeConter).sort();

  let txtA = null;
  if (listaContem.length > 0) txtA = `ALÉRGICOS: CONTÉM ${formatarListaComE(listaContem)}.`;

  if (listaPode.length > 0) {
    const txtP = `PODE CONTER ${formatarListaComE(listaPode)}.`;
    txtA = txtA ? `${txtA} ${txtP}` : `ALÉRGICOS: ${txtP}`;
  }

  let txtI = null;
  if (listaIngredientesFormatada.length > 0) {
    const l = [...listaIngredientesFormatada];
    l[0] = l[0].charAt(0).toUpperCase() + l[0].slice(1);
    txtI = `Ingredientes: ${formatarListaComE(l)}.`;
  }

  return {
    contem_gluten: contemGluten,
    contem_lactose: contemLactose,
    alergenicos: txtA,
    lista_ingredientes: txtI
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
    const compliance = await loadComplianceData(supabaseAdmin); // Tabelas ANVISA são públicas e estáticas, admin OK
    const dadosRec = await loadReceitaData(supabaseClient, receita_id); // A receita DEVE usar o client autenticado (RLS)
    const recursivo = await calcularNutrientesRecursivo(dadosRec.composicao, supabaseClient, compliance.alergenicosMap); // Ingredientes via RLS

    // 1. CALCULAR PORÇÕES PRIMEIRO (Para determinar a massa base de cálculo)
    // Se a função decidir que a porção é 40g (unidade) e não 50g (banco), ela retorna isso em 'porcao_g_ml'
    const infoP = calcularInfoPorcao(dadosRec.receita, compliance.medidasMap);

    const grupoAlvo = dadosRec.receita.grupo_populacional_id || 'GERAL';
    const vdrMapFiltrado = new Map<string, AnvisaVDR>();
    compliance.vdrList.forEach(vdrItem => {
      if (vdrItem.grupo_id === grupoAlvo) vdrMapFiltrado.set(vdrItem.constituinte, vdrItem);
    });

    const rend = dadosRec.receita.rendimento_total_g;

    // 2. USAR A PORÇÃO HARMONIZADA PARA O CÁLCULO NUTRICIONAL
    // Isso garante que a tabela reflita o valor real declarado (ex: 40g)
    const porc = infoP.porcao_g_ml;

    const p100 = calculatePor100g(recursivo.totaisBrutos, rend);
    const pPorc = calculatePorPorcao(recursivo.totaisBrutos, rend, porc);

    const p100Fmt: Record<string, string> = {};
    const pPorcFmt: Record<string, string> = {};
    for (const k in recursivo.totaisBrutos) {
      p100Fmt[k] = formatarValor(p100[k] || 0, k, compliance.regrasMap);
      pPorcFmt[k] = formatarValor(pPorc[k] || 0, k, compliance.regrasMap);
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

