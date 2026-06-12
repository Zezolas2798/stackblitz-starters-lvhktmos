import { SupabaseClient } from '@supabase/supabase-js';

export interface RegraTemperatura {
  id: string;
  categoria_slug: string;
  nome_exibicao: string;
  tipo: 'INGREDIENTE' | 'PREPARACAO';
  temp_resfriado_min: number;
  temp_resfriado_max: number;
  validade_resfriado_dias: number;
  validade_congelado_excelente_dias: number;
  validade_congelado_bom_dias: number;
  validade_congelado_regular_dias: number;
  validade_congelado_atencao_dias: number;
}

export interface FaixaCalculada {
  min: number | null;
  max: number | null;
  regra_aplicada: string; // nome_exibicao da regra mais restritiva
  validade_dias: number | null;
  cenario: 'A_ESTOQUE' | 'B_EQUIPAMENTO_DIRETO' | 'C_PRODUTO' | 'D_RECEITA' | 'MANUAL';
  tipo_regra: 'CONGELADO' | 'QUENTE' | 'RESFRIADO' | 'MANUAL';
  debug_tipo?: string;
}

/**
 * Calcula a faixa de temperatura para um equipamento específico.
 */
export async function calcularFaixaEquipamento(
  supabase: SupabaseClient,
  equipamentoId: string,
  receitaId?: string | null, // Passado caso o registro atual seja uma preparação específica
  produtoId?: string | null  // Passado caso o registro atual seja um ingrediente específico
): Promise<FaixaCalculada | null> {
  try {
    // 1. Busca as configurações do equipamento
    const { data: equip, error: equipError } = await supabase
      .from('equipamentos_config')
      .select('id, temp_ideal_min, temp_ideal_max, tipo_equipamento, grupos_permitidos_ids')
      .eq('id', equipamentoId)
      .single();

    if (equipError) {
        console.error(`[DEBUG] Erro ao buscar equipamento ${equipamentoId}:`, equipError);
    }

    if (!equip) {
      console.log(`[DEBUG] Equipamento não encontrado: ${equipamentoId}`);
      return null;
    }

    console.log(`[DEBUG] Equipamento: ${equip.id} | Tipo: ${equip.tipo_equipamento} | Grupos: ${equip.grupos_permitidos_ids}`);

    // A. Intercepta baseado no tipo físico do equipamento (Independe do alimento)
    const tiposQuentes = ['ESTUFA', 'BANHO_MARIA', 'BALCAO_AQUECIDO', 'PASS_THROUGH_QUENTE'];
    const tiposCongelados = ['CAMARA_FRIA_CONGELADOS', 'FREEZER_VERTICAL', 'FREEZER_HORIZONTAL', 'ULTRACONGELADOR'];

    if (tiposQuentes.includes(equip.tipo_equipamento)) {
      console.log(`[DEBUG] Tipo Quente detectado para ${equip.id}`);
      return {
        min: 60,
        max: null, // Sem limite superior
        regra_aplicada: 'Conservação a Quente (Legislação: > 60°C)',
        validade_dias: null,
        cenario: 'A_ESTOQUE', // Reusando Enum para simplificar
        tipo_regra: 'QUENTE'
      };
    }

    if (tiposCongelados.includes(equip.tipo_equipamento)) {
      console.log(`[DEBUG] Tipo Congelado detectado para ${equip.id}`);
      return {
        min: null, // Sem limite inferior
        max: -18,
        regra_aplicada: 'Conservação de Congelados (Legislação: ≤ -18°C)',
        validade_dias: null,
        cenario: 'A_ESTOQUE',
        tipo_regra: 'CONGELADO'
      };
    }

    // A partir daqui, as regras de Resfriados (que dependem do alimento)
    // Se houver uma receita associada no registro de aferição, prevalece a composição da receita
    if (receitaId) {
      const { data: composicao } = await supabase
        .from('composicao_receitas')
        .select(`
          item_id,
          ingredientes (
            grupo_id,
            subgrupo_id
          )
        `)
        .eq('receita_id', receitaId);

      if (composicao && composicao.length > 0) {
        const gruposIds = composicao.map(c => (c as any).ingredientes?.grupo_id).filter(Boolean);
        const subgruposIds = composicao.map(c => (c as any).ingredientes?.subgrupo_id).filter(Boolean);
        
        const faixa = await buscarRegraMaisRestritiva(supabase, gruposIds, subgruposIds, 'PREPARACAO');
        if (faixa) {
          return {
            min: faixa.temp_resfriado_min,
            max: faixa.temp_resfriado_max,
            regra_aplicada: faixa.nome_exibicao,
            validade_dias: faixa.validade_resfriado_dias,
            cenario: 'A_ESTOQUE',
            tipo_regra: 'RESFRIADO'
          };
        }
      }
    }

    // Se houver um produto associado no registro de aferição, prevalece a regra desse produto
    if (produtoId) {
      const { data: ing } = await supabase
        .from('ingredientes')
        .select('grupo_id, subgrupo_id')
        .eq('id', produtoId)
        .single();

      if (ing && (ing.grupo_id || ing.subgrupo_id)) {
        const faixa = await buscarRegraMaisRestritiva(
          supabase,
          [ing.grupo_id].filter(Boolean),
          [ing.subgrupo_id].filter(Boolean),
          'INGREDIENTE'
        );
        if (faixa) {
          return {
            min: faixa.temp_resfriado_min,
            max: faixa.temp_resfriado_max,
            regra_aplicada: faixa.nome_exibicao,
            validade_dias: faixa.validade_resfriado_dias,
            cenario: 'A_ESTOQUE',
            tipo_regra: 'RESFRIADO'
          };
        }
      }
    }

    // 2. Tenta Cenário A: Vinculado ao Estoque (Lotes -> Ingredientes)
    const { data: locais } = await supabase
      .from('estoque_locais')
      .select('id')
      .eq('equipamento_config_id', equipamentoId);

    if (locais && locais.length > 0) {
      const locaisIds = locais.map(l => l.id);
      
      // Busca ingredientes armazenados lá via estoque_lotes
      const { data: lotes } = await supabase
        .from('estoque_lotes')
        .select(`
          ingredientes (
            grupo_id,
            subgrupo_id
          )
        `)
        .in('local_estoque_id', locaisIds)
        .gt('quantidade_atual_g_ml', 0); // Lotes com saldo

      if (lotes && lotes.length > 0) {
        const gruposIds = lotes.map(l => (l as any).ingredientes?.grupo_id).filter(Boolean);
        const subgruposIds = lotes.map(l => (l as any).ingredientes?.subgrupo_id).filter(Boolean);

        const faixa = await buscarRegraMaisRestritiva(supabase, gruposIds, subgruposIds, 'INGREDIENTE');
        if (faixa) {
          return {
            min: faixa.temp_resfriado_min,
            max: faixa.temp_resfriado_max,
            regra_aplicada: faixa.nome_exibicao,
            validade_dias: faixa.validade_resfriado_dias,
            cenario: 'A_ESTOQUE',
            tipo_regra: 'RESFRIADO'
          };
        }
      }
    }

    // 3. Cenário B: Equipamento configurado com grupos_permitidos_ids diretos (Ex: Estufa, Balcão)
    if (equip.grupos_permitidos_ids && equip.grupos_permitidos_ids.length > 0) {
      const faixa = await buscarRegraMaisRestritiva(supabase, equip.grupos_permitidos_ids, [], 'INGREDIENTE');
      if (faixa) {
        return {
          min: faixa.temp_resfriado_min,
          max: faixa.temp_resfriado_max,
          regra_aplicada: faixa.nome_exibicao,
          validade_dias: faixa.validade_resfriado_dias,
          cenario: 'B_EQUIPAMENTO_DIRETO',
          tipo_regra: 'RESFRIADO'
        };
      }
    }

    // 4. Fallback: Usa os valores manuais definidos no equipamento pelo RT
    if (equip.temp_ideal_min !== null && equip.temp_ideal_max !== null) {
      console.log(`[DEBUG] Fallback Manual para ${equip.id} (Min: ${equip.temp_ideal_min}, Max: ${equip.temp_ideal_max})`);
      return {
        min: Number(equip.temp_ideal_min),
        max: Number(equip.temp_ideal_max),
        regra_aplicada: 'Configuração Manual (RT)',
        validade_dias: null,
        cenario: 'MANUAL',
        tipo_regra: 'MANUAL',
        debug_tipo: equip.tipo_equipamento || 'NULO'
      };
    }

    console.log(`[DEBUG] Nenhum cenário satisfeito para ${equip.id}`);
    return null;

  } catch (error) {
    console.error('Erro ao calcular faixa do equipamento:', error);
    return null;
  }
}

/**
 * Retorna a regra de temperatura mais restritiva baseada nos IDs de grupos/subgrupos passados.
 */
async function buscarRegraMaisRestritiva(
  supabase: SupabaseClient,
  gruposIds: string[],
  subgruposIds: string[],
  tipoFiltro: 'INGREDIENTE' | 'PREPARACAO'
): Promise<RegraTemperatura | null> {
  if (!gruposIds.length && !subgruposIds.length) return null;

  let query = supabase
    .from('grupo_regra_temperatura')
    .select(`
      regras_temperatura (*)
    `);

  let mappings: any[] = [];
  
  if (gruposIds.length > 0) {
      const { data, error } = await query.in('grupo_id', gruposIds);
      if (data && !error) mappings.push(...data);
  }
  
  if (subgruposIds.length > 0) {
      // Re-create query because the previous .in mutated the query builder or we can just fetch again
      const { data, error } = await supabase.from('grupo_regra_temperatura').select('regras_temperatura(*)').in('subgrupo_id', subgruposIds);
      if (data && !error) mappings.push(...data);
  }

  if (mappings.length === 0) return null;

  // Extrai as regras de temperatura que sejam do 'tipo' especificado (preparação tem regras diferentes de ingrediente bruto)
  let regrasValidas = mappings
    .map(m => (m as any).regras_temperatura as RegraTemperatura)
    .filter(r => r && r.tipo === tipoFiltro);

  // Se for preparação e não encontrou regra específica, tenta fallback para INGREDIENTE para ser seguro (edge case)
  if (regrasValidas.length === 0 && tipoFiltro === 'PREPARACAO') {
     regrasValidas = mappings
       .map(m => (m as any).regras_temperatura as RegraTemperatura)
       .filter(r => r);
  }

  if (regrasValidas.length === 0) return null;

  // Encontra a MAIS restritiva (a que tiver a MENOR temp_resfriado_max)
  regrasValidas.sort((a, b) => a.temp_resfriado_max - b.temp_resfriado_max);

  return regrasValidas[0];
}

/**
 * Helper para classificar temperatura de congelados
 */
export function classificarCongelado(temp: number): { classificacao: string; validade_key: keyof RegraTemperatura; color: string } {
  if (temp <= -18) return { classificacao: 'Excelente', validade_key: 'validade_congelado_excelente_dias', color: '#2196f3' }; // Azul
  if (temp <= -11) return { classificacao: 'Bom', validade_key: 'validade_congelado_bom_dias', color: '#4caf50' }; // Verde
  if (temp <= -6) return { classificacao: 'Regular', validade_key: 'validade_congelado_regular_dias', color: '#ffeb3b' }; // Amarelo
  if (temp <= -1) return { classificacao: 'Atenção', validade_key: 'validade_congelado_atencao_dias', color: '#ff9800' }; // Laranja
  return { classificacao: 'Crítico', validade_key: 'validade_congelado_atencao_dias', color: '#f44336' }; // Vermelho
}

/**
 * Avalia se uma temperatura aferida (de equipamento ou alimento) está adequada ou não,
 * baseado na faixa calculada e nos limites padrão do equipamento.
 */
export function avaliarAfericao(
  temp: number | null | undefined,
  faixaEquipamento: FaixaCalculada | null | undefined,
  equipMin: number | null | undefined,
  equipMax: number | null | undefined
): { text: string; color: string; isValid: boolean } | null {
  if (temp === null || temp === undefined) return null;

  const tipo = faixaEquipamento?.tipo_regra || 'MANUAL';
  
  if (tipo === 'CONGELADO') {
      const { classificacao, color } = classificarCongelado(temp);
      return {
          text: classificacao,
          color,
          // Considera inválido apenas o "Crítico", ou você pode ajustar se "Atenção" também for desvio
          isValid: classificacao !== 'Crítico'
      };
  }

  const currentMin = faixaEquipamento && faixaEquipamento.min !== null ? faixaEquipamento.min : equipMin;
  const currentMax = faixaEquipamento && faixaEquipamento.max !== null ? faixaEquipamento.max : equipMax;

  let isOut = false;
  if (currentMin !== null && currentMin !== undefined && temp < currentMin) isOut = true;
  if (currentMax !== null && currentMax !== undefined && temp > currentMax) isOut = true;

  return {
      text: isOut ? 'Inadequado' : 'Adequado',
      color: isOut ? '#f44336' : '#4caf50', // error.main : success.main aprox.
      isValid: !isOut
  };
}
