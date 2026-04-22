/**
 * NSGA-II SOLVER — Motor Evolutivo de Geração de Cardápios UAN
 * 
 * Implementa o algoritmo NSGA-II (Non-dominated Sorting Genetic Algorithm II)
 * para otimização multiobjetivo de cardápios.
 * 
 * OBJETIVOS:
 *   f₁ — Minimizar violações de regras (HARD×1000 + SOFT×1)
 *   f₂ — Maximizar diversidade sensorial (cores, texturas, métodos, Jaccard)
 * 
 * CONTRATO: Mesmo input/output do uan-csp-generator (drop-in compatible).
 */

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- Config ---
const POP_SIZE = 100;
const MAX_GENERATIONS = 200;
const CROSSOVER_RATE = 0.8;
const MUTATION_RATE = 0.1;
const ELITISM_RATE = 0.1;
const TIME_LIMIT_MS = 50000; // 50s safety margin

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

interface Variable {
  day: string;
  ref: string;
  categoria: string;
  slotIndex: number;
  fixo?: boolean;
  fichaFixaId?: string;
}

interface Individual {
  genes: number[];
  f1: number; // violations score (minimize)
  f2: number; // -diversity score (minimize, so lower = more diverse)
  rank: number;
  crowdingDistance: number;
}

// --- Helpers ---

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function calculateJaccard(s1: Set<string>, s2: Set<string>): number {
  if (s1.size === 0 && s2.size === 0) return 1;
  const intersection = [...s1].filter(x => s2.has(x)).length;
  const union = new Set([...s1, ...s2]).size;
  return union === 0 ? 0 : intersection / union;
}

// --- Core NSGA-II ---

function decodeChromosome(
  genes: number[],
  variables: Variable[],
  dominios: Record<string, Ficha[]>,
  fichaById: Record<string, Ficha>
): any[] {
  return genes.map((geneIdx, i) => {
    const v = variables[i];

    // Fixed slot: use pre-defined ficha
    if (v.fixo && v.fichaFixaId && fichaById[v.fichaFixaId]) {
      const ficha = fichaById[v.fichaFixaId];
      return {
        data_consumo: v.day,
        tipo_refeicao: v.ref,
        ficha_uan_id: ficha.id,
        fator_multiplicador: 1,
        fichas_tecnicas_uan: { nome: ficha.nome, categoria_uan: ficha.categoria_uan },
        _ficha: ficha,
      };
    }

    // Variable slot: use gene index into domain
    const pool = dominios[v.categoria] || [];
    const ficha = pool[geneIdx % pool.length];
    if (!ficha) return null;
    return {
      data_consumo: v.day,
      tipo_refeicao: v.ref,
      ficha_uan_id: ficha.id,
      fator_multiplicador: 1,
      fichas_tecnicas_uan: { nome: ficha.nome, categoria_uan: ficha.categoria_uan },
      _ficha: ficha,
    };
  }).filter(Boolean);
}

function evaluateViolations(assignment: any[], regras: any[]): number {
  let score = 0;
  for (const r of regras) {
    if (!r.ativo) continue;
    const weight = r.severidade === 'HARD' ? 1000 : 1;
    const violations = countRuleViolations(assignment, r);
    score += violations * weight;
  }
  return score;
}

function countRuleViolations(assignment: any[], r: any): number {
  let violations = 0;

  if (r.tipo_regra === 'CUSTO_MAX_DIARIO' && r.valor_limite) {
    const dict: Record<string, number> = {};
    for (const a of assignment) {
      dict[a.data_consumo] = (dict[a.data_consumo] || 0) + (a._ficha.custo_por_porcao || 0);
    }
    for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
  }

  if (['MAX_DIARIO_COR', 'MAX_REFEICAO_COR'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
    const isDaily = r.tipo_regra === 'MAX_DIARIO_COR';
    const dict: Record<string, number> = {};
    for (const a of assignment) {
      if (a._ficha.cor_predominante === r.parametro_alvo) {
        const key = isDaily ? a.data_consumo : `${a.data_consumo}_${a.tipo_refeicao}`;
        dict[key] = (dict[key] || 0) + 1;
      }
    }
    for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
  }

  if (['MAX_DIARIO_TEXTURA', 'MAX_REFEICAO_TEXTURA'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
    const isDaily = r.tipo_regra === 'MAX_DIARIO_TEXTURA';
    const dict: Record<string, number> = {};
    for (const a of assignment) {
      if (a._ficha.textura_principal === r.parametro_alvo) {
        const key = isDaily ? a.data_consumo : `${a.data_consumo}_${a.tipo_refeicao}`;
        dict[key] = (dict[key] || 0) + 1;
      }
    }
    for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
  }

  if (['MAX_DIARIO_ENXOFRE', 'MAX_REFEICAO_ENXOFRE'].includes(r.tipo_regra) && r.valor_limite) {
    const isDaily = r.tipo_regra === 'MAX_DIARIO_ENXOFRE';
    const dict: Record<string, number> = {};
    for (const a of assignment) {
      if (a._ficha.rico_em_enxofre && a._ficha.categoria_uan !== 'Prato Base') {
        const key = isDaily ? a.data_consumo : `${a.data_consumo}_${a.tipo_refeicao}`;
        dict[key] = (dict[key] || 0) + 1;
      }
    }
    for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
  }

  if (r.tipo_regra === 'DISTANCIA_MINIMA_FAMILIA' && r.parametro_alvo && r.dias_janela) {
    const dates = assignment
      .filter(a => a._ficha.proteina_familia_id === r.parametro_alvo)
      .map(a => a.data_consumo).sort();
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.floor((new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000);
      if (diff < r.dias_janela) violations++;
    }
  }

  if (r.tipo_regra === 'DISTANCIA_MINIMA_DIAS' && r.dias_janela) {
    const fDates: Record<string, string[]> = {};
    for (const a of assignment) {
      if (!fDates[a.ficha_uan_id]) fDates[a.ficha_uan_id] = [];
      fDates[a.ficha_uan_id].push(a.data_consumo);
    }
    for (const fId in fDates) {
      const datas = [...new Set(fDates[fId])].sort();
      for (let i = 1; i < datas.length; i++) {
        const delta = Math.floor((new Date(datas[i]).getTime() - new Date(datas[i-1]).getTime()) / 86400000);
        if (delta < r.dias_janela) violations++;
      }
    }
  }

  if (['MAX_REFEICAO_METODO_COCCAO', 'MAX_DIARIO_METODO_COCCAO', 'MAX_SEMANAL_METODO_COCCAO'].includes(r.tipo_regra) && r.parametro_alvo && r.valor_limite !== null) {
    if (r.tipo_regra === 'MAX_SEMANAL_METODO_COCCAO') {
      const days = new Set(assignment.filter(a => a._ficha.metodo_coccao === r.parametro_alvo).map(a => a.data_consumo));
      if (days.size > r.valor_limite) violations++;
    } else {
      const isDaily = r.tipo_regra === 'MAX_DIARIO_METODO_COCCAO';
      const dict: Record<string, number> = {};
      for (const a of assignment) {
        if (a._ficha.metodo_coccao === r.parametro_alvo) {
          const key = isDaily ? a.data_consumo : `${a.data_consumo}_${a.tipo_refeicao}`;
          dict[key] = (dict[key] || 0) + 1;
        }
      }
      for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
    }
  }

  if (r.tipo_regra === 'INCOMPATIBILIDADE_DIARIA') {
    const CLUSTER = ['Prato Principal', 'Alternativa', 'Opção Vegetariana'];
    const dict: Record<string, Set<string>> = {};
    for (const a of assignment) {
      if (a._ficha.proteina_familia_id && CLUSTER.includes(a._ficha.categoria_uan)) {
        const key = `${a.data_consumo}_${a.tipo_refeicao}`;
        if (!dict[key]) dict[key] = new Set();
        if (dict[key].has(a._ficha.proteina_familia_id)) violations++;
        dict[key].add(a._ficha.proteina_familia_id);
      }
    }
  }

  if (r.tipo_regra === 'MAX_SEMANAL_FAMILIA' && r.parametro_alvo && r.valor_limite !== null) {
    const days = new Set(assignment.filter(a => a._ficha.proteina_familia_id === r.parametro_alvo).map(a => a.data_consumo));
    if (days.size > r.valor_limite) violations++;
  }

  if (r.tipo_regra === 'SIMILARIDADE_ENTRE_DIAS' && (r.limiar_similaridade || 0) > 0) {
    const sortedDays = [...new Set(assignment.map(a => a.data_consumo))].sort();
    const threshold = (r.limiar_similaridade || 50) / 100;
    for (let i = 1; i < sortedDays.length; i++) {
      const getFeats = (d: string) => {
        const items = assignment.filter(a => a.data_consumo === d).map(a => a._ficha);
        return {
          colors: new Set(items.map(x => x.cor_predominante).filter(Boolean)),
          textures: new Set(items.map(x => x.textura_principal).filter(Boolean)),
          methods: new Set(items.map(x => x.metodo_coccao).filter(Boolean)),
          subs: new Set(items.flatMap(x => x.ingredientes_subgrupos || [])),
        };
      };
      const fA = getFeats(sortedDays[i-1]), fB = getFeats(sortedDays[i]);
      const sim = (
        calculateJaccard(fA.colors, fB.colors) +
        calculateJaccard(fA.textures, fB.textures) +
        calculateJaccard(fA.methods, fB.methods) +
        calculateJaccard(fA.subs, fB.subs)
      ) / 4;
      if (sim > threshold) violations++;
    }
  }

  if (r.tipo_regra === 'CUSTO_MAX_REFEICAO' && r.valor_limite) {
    const dict: Record<string, number> = {};
    for (const a of assignment) {
      const key = `${a.data_consumo}_${a.tipo_refeicao}`;
      dict[key] = (dict[key] || 0) + (a._ficha.custo_por_porcao || 0);
    }
    for (const v of Object.values(dict)) { if (v > r.valor_limite) violations++; }
  }

  return violations;
}

function evaluateDiversity(assignment: any[]): number {
  const allColors = new Set<string>();
  const allTextures = new Set<string>();
  const allMethods = new Set<string>();

  for (const a of assignment) {
    if (a._ficha.cor_predominante) allColors.add(a._ficha.cor_predominante);
    if (a._ficha.textura_principal) allTextures.add(a._ficha.textura_principal);
    if (a._ficha.metodo_coccao) allMethods.add(a._ficha.metodo_coccao);
  }

  const sColors = allColors.size / 11; // 11 cores possíveis
  const sTextures = allTextures.size / 6; // 6 texturas
  const sMethods = allMethods.size / 9; // 9 métodos

  // Jaccard médio entre dias consecutivos (queremos BAIXO = diverso)
  const sortedDays = [...new Set(assignment.map(a => a.data_consumo))].sort();
  let jaccardSum = 0;
  let jaccardCount = 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const fichasA = new Set(assignment.filter(a => a.data_consumo === sortedDays[i-1]).map(a => a.ficha_uan_id));
    const fichasB = new Set(assignment.filter(a => a.data_consumo === sortedDays[i]).map(a => a.ficha_uan_id));
    jaccardSum += calculateJaccard(fichasA, fichasB);
    jaccardCount++;
  }
  const avgJaccard = jaccardCount > 0 ? jaccardSum / jaccardCount : 0;
  const sJaccard = 1 - avgJaccard; // invertido: alta diversidade = baixo Jaccard

  return -(sColors + sTextures + sMethods + sJaccard) / 4; // negate to minimize
}

// --- NSGA-II Sorting ---

function nonDominatedSort(pop: Individual[]): Individual[][] {
  const fronts: Individual[][] = [[]];
  const dominationCount: number[] = new Array(pop.length).fill(0);
  const dominatedSet: number[][] = pop.map(() => []);

  for (let i = 0; i < pop.length; i++) {
    for (let j = i + 1; j < pop.length; j++) {
      if (dominates(pop[i], pop[j])) {
        dominatedSet[i].push(j);
        dominationCount[j]++;
      } else if (dominates(pop[j], pop[i])) {
        dominatedSet[j].push(i);
        dominationCount[i]++;
      }
    }
    if (dominationCount[i] === 0) {
      pop[i].rank = 0;
      fronts[0].push(pop[i]);
    }
  }

  let k = 0;
  while (fronts[k].length > 0) {
    const nextFront: Individual[] = [];
    for (const p of fronts[k]) {
      const pIdx = pop.indexOf(p);
      for (const qIdx of dominatedSet[pIdx]) {
        dominationCount[qIdx]--;
        if (dominationCount[qIdx] === 0) {
          pop[qIdx].rank = k + 1;
          nextFront.push(pop[qIdx]);
        }
      }
    }
    k++;
    fronts.push(nextFront);
  }

  return fronts.filter(f => f.length > 0);
}

function dominates(a: Individual, b: Individual): boolean {
  const better1 = a.f1 <= b.f1;
  const better2 = a.f2 <= b.f2;
  const strictlyBetter = a.f1 < b.f1 || a.f2 < b.f2;
  return better1 && better2 && strictlyBetter;
}

function assignCrowdingDistance(front: Individual[]): void {
  const n = front.length;
  if (n <= 2) { front.forEach(ind => ind.crowdingDistance = Infinity); return; }

  front.forEach(ind => ind.crowdingDistance = 0);

  for (const obj of ['f1', 'f2'] as const) {
    front.sort((a, b) => a[obj] - b[obj]);
    front[0].crowdingDistance = Infinity;
    front[n - 1].crowdingDistance = Infinity;
    const range = front[n - 1][obj] - front[0][obj];
    if (range === 0) continue;
    for (let i = 1; i < n - 1; i++) {
      front[i].crowdingDistance += (front[i + 1][obj] - front[i - 1][obj]) / range;
    }
  }
}

// --- Genetic Operators ---

function tournamentSelect(pop: Individual[]): Individual {
  const a = pop[randInt(pop.length)];
  const b = pop[randInt(pop.length)];
  if (a.rank < b.rank) return a;
  if (b.rank < a.rank) return b;
  return a.crowdingDistance >= b.crowdingDistance ? a : b;
}

function crossover(p1: Individual, p2: Individual, variables: Variable[]): [number[], number[]] {
  if (Math.random() > CROSSOVER_RATE) return [[...p1.genes], [...p2.genes]];

  const child1: number[] = [];
  const child2: number[] = [];
  const days = [...new Set(variables.map(v => v.day))];
  const daySet = new Set<string>();

  // Pick random days from parent 1
  for (const d of days) {
    if (Math.random() < 0.5) daySet.add(d);
  }

  for (let i = 0; i < variables.length; i++) {
    if (daySet.has(variables[i].day)) {
      child1.push(p1.genes[i]);
      child2.push(p2.genes[i]);
    } else {
      child1.push(p2.genes[i]);
      child2.push(p1.genes[i]);
    }
  }

  return [child1, child2];
}

function mutate(genes: number[], variables: Variable[], dominios: Record<string, Ficha[]>): number[] {
  const result = [...genes];
  for (let i = 0; i < result.length; i++) {
    // Skip fixed slots — their genes are immutable
    if (variables[i].fixo) continue;
    if (Math.random() < MUTATION_RATE) {
      const pool = dominios[variables[i].categoria] || [];
      if (pool.length > 1) {
        let newGene: number;
        do { newGene = randInt(pool.length); } while (newGene === result[i] && pool.length > 1);
        result[i] = newGene;
      }
    }
  }
  return result;
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: any = await req.json();
    const { diasAtivos, perfisRefeicao, perfisMap, regras, fichas } = body;
    const startTime = Date.now();

    // 1. Build domains
    const dominios: Record<string, Ficha[]> = {};
    fichas.forEach((f: Ficha) => {
      if (!dominios[f.categoria_uan]) dominios[f.categoria_uan] = [];
      dominios[f.categoria_uan].push(f);
    });

    // 2. Extract variables
    // Build ficha lookup by ID for fixed slots
    const fichaById: Record<string, Ficha> = {};
    fichas.forEach((f: Ficha) => { fichaById[f.id] = f; });

    const variables: Variable[] = [];
    (diasAtivos as string[]).forEach((day) => {
      Object.keys(perfisRefeicao).forEach((ref) => {
        const perfilId = perfisRefeicao[ref];
        const perfil = perfisMap[perfilId];
        if (!perfil || !perfil.slots) return;
        perfil.slots.forEach((s: any) => {
          if (s.quantidade_min > 0) {
            // Fixed slot: create one variable per fixed ficha
            if (s.fixo && s.fichas_fixas && s.fichas_fixas.length > 0) {
              s.fichas_fixas.forEach((fichaId: string, i: number) => {
                variables.push({ day, ref, categoria: s.categoria_uan, slotIndex: i, fixo: true, fichaFixaId: fichaId });
              });
            } else {
              // Variable slot: solver decides
              for (let i = 0; i < s.quantidade_min; i++) {
                variables.push({ day, ref, categoria: s.categoria_uan, slotIndex: i });
              }
            }
          }
        });
      });
    });

    if (variables.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma variável para resolver. Verifique perfis e slots.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Initialize population
    let population: Individual[] = [];
    for (let i = 0; i < POP_SIZE; i++) {
      const genes = variables.map(v => {
        // Fixed slots get gene -1 (placeholder, decoded via fichaById)
        if (v.fixo) return -1;
        const pool = dominios[v.categoria] || [];
        return pool.length > 0 ? randInt(pool.length) : 0;
      });
      const assignment = decodeChromosome(genes, variables, dominios, fichaById);
      population.push({
        genes,
        f1: evaluateViolations(assignment, regras),
        f2: evaluateDiversity(assignment),
        rank: 0,
        crowdingDistance: 0,
      });
    }

    // 4. Evolutionary loop
    let generation = 0;
    for (; generation < MAX_GENERATIONS; generation++) {
      if (Date.now() - startTime > TIME_LIMIT_MS) break;

      // Check early termination: if best has f1=0, run 20 more gens then stop
      const bestF1 = Math.min(...population.map(p => p.f1));
      if (bestF1 === 0 && generation > 50) break;

      // Non-dominated sort
      const fronts = nonDominatedSort(population);
      for (const front of fronts) assignCrowdingDistance(front);

      // Generate offspring
      const offspring: Individual[] = [];

      // Elitism: keep top individuals
      const eliteCount = Math.floor(POP_SIZE * ELITISM_RATE);
      const elite = fronts[0].sort((a, b) => a.f1 - b.f1 || a.f2 - b.f2).slice(0, eliteCount);
      offspring.push(...elite);

      while (offspring.length < POP_SIZE) {
        const p1 = tournamentSelect(population);
        const p2 = tournamentSelect(population);
        const [c1Genes, c2Genes] = crossover(p1, p2, variables);
        const m1 = mutate(c1Genes, variables, dominios);
        const m2 = mutate(c2Genes, variables, dominios);

        for (const genes of [m1, m2]) {
          if (offspring.length >= POP_SIZE) break;
          const assignment = decodeChromosome(genes, variables, dominios, fichaById);
          offspring.push({
            genes,
            f1: evaluateViolations(assignment, regras),
            f2: evaluateDiversity(assignment),
            rank: 0,
            crowdingDistance: 0,
          });
        }
      }

      population = offspring;
    }

    // 5. Final sort and select best
    const finalFronts = nonDominatedSort(population);
    for (const front of finalFronts) assignCrowdingDistance(front);

    // Pick best: prefer f1=0 (no HARD violations), then best f2
    let best = population[0];
    const feasible = population.filter(p => p.f1 === 0);

    if (feasible.length > 0) {
      best = feasible.sort((a, b) => a.f2 - b.f2)[0]; // best diversity
    } else {
      best = population.sort((a, b) => a.f1 - b.f1 || a.f2 - b.f2)[0]; // least violations
    }

    const bestAssignment = decodeChromosome(best.genes, variables, dominios, fichaById);
    const output = bestAssignment.map(({ _ficha, ...rest }: any) => rest);

    const meta = {
      solver: 'NSGA-II',
      generations: generation,
      population_size: POP_SIZE,
      elapsed_ms: Date.now() - startTime,
      best_f1_violations: best.f1,
      best_f2_diversity: best.f2,
      feasible_solutions: feasible.length,
      pareto_front_size: finalFronts[0]?.length || 0,
      has_hard_violations: best.f1 >= 1000,
    };

    return new Response(JSON.stringify({ gradeOutput: output, meta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
