import { 
  PerfilCardapio, 
  PerfilCardapioSlot, 
  CardapioRegraVariedade, 
  CardapioDiaUAN,
  FichaTecnicaUAN,
  SeveridadeRegra,
  TipoRegraVariedade
} from './types';

export interface ValidationAlert {
  data_consumo: string;
  tipo_refeicao?: string;
  message: string;
  severity: SeveridadeRegra;
  ruleType: TipoRegraVariedade | 'SLOT_VALIDATION';
}

export interface FichaValidationData extends FichaTecnicaUAN {
  custo_por_porcao?: number; // Injetado externamente caso queiramos checar custos
}

export function validateMenuGrid(
  grade: Partial<CardapioDiaUAN>[],
  perfisRefeicao: Record<string, string>, // { 'Almoço': 'perfil-uuid' }
  perfisMap: Record<string, PerfilCardapio & { slots?: PerfilCardapioSlot[] }>,
  regras: CardapioRegraVariedade[],
  fichasMap: Record<string, FichaValidationData>,
  diasAtivos: string[] // Ex: ['2026-05-01', '2026-05-02']
): ValidationAlert[] {
  
  const alerts: ValidationAlert[] = [];
  if (!grade || grade.length === 0) return alerts;

  // Organiza grade para fácil acesso
  // gradeByDayMeal: { '2026-05-01_Almoço': [...] }
  const gradeByDayMeal: Record<string, Partial<CardapioDiaUAN>[]> = {};
  grade.forEach(item => {
    if (!item.data_consumo || !item.tipo_refeicao) return;
    const key = `${item.data_consumo}_${item.tipo_refeicao}`;
    if (!gradeByDayMeal[key]) gradeByDayMeal[key] = [];
    gradeByDayMeal[key].push(item);
  });

  // 1. VALIDAÇÃO DE SLOTS ESTRUTURAIS DOS PERFIS
  diasAtivos.forEach(data => {
    Object.entries(perfisRefeicao).forEach(([refeicao, perfilId]) => {
      const perfil = perfisMap[perfilId];
      if (!perfil || !perfil.slots || perfil.slots.length === 0) return;

      const itemsInSlot = gradeByDayMeal[`${data}_${refeicao}`] || [];
      
      // Conta as preparações agendadas por categoria
      const catCount: Record<string, number> = {};
      itemsInSlot.forEach(i => {
        if (!i.ficha_uan_id) return;
        const f = fichasMap[i.ficha_uan_id];
        if (!f) return;
        const cat = f.categoria_uan;
        catCount[cat] = (catCount[cat] || 0) + 1;
      });

      // Valida cada Slot
      perfil.slots.forEach(slot => {
        const count = catCount[slot.categoria_uan] || 0;
        const displayLabel = slot.rotulo_display || slot.categoria_uan;

        // Se é obrigatório e count = 0
        if (slot.obrigatorio && count === 0 && slot.quantidade_min > 0) {
           alerts.push({
             data_consumo: data,
             tipo_refeicao: refeicao,
             severity: 'HARD',
             ruleType: 'SLOT_VALIDATION',
             message: `Slot obrigatório "${displayLabel}" pendente. Necessário Mínimo de ${slot.quantidade_min}.`
           });
        }
        // Validar mínimos (se não tem nada, mas não é obrigatório, ok. Mas se tiver algo, tem que respeitar min/max?)
        // Normalmente obrigatório ou não, se configurou range, vamos checar só quando quebra.
        else if (count < slot.quantidade_min && (count > 0 || slot.obrigatorio)) {
           alerts.push({
             data_consumo: data,
             tipo_refeicao: refeicao,
             severity: 'HARD',
             ruleType: 'SLOT_VALIDATION',
             message: `Faltam opções para "${displayLabel}". Agendadas: ${count}. Mínimo exigido: ${slot.quantidade_min}.`
           });
        } else if (slot.quantidade_max > 0 && count > slot.quantidade_max) {
           alerts.push({
             data_consumo: data,
             tipo_refeicao: refeicao,
             severity: 'SOFT',
             ruleType: 'SLOT_VALIDATION',
             message: `Excesso de opções para "${displayLabel}". Agendadas: ${count}. Máximo permitido: ${slot.quantidade_max}.`
           });
        }
      });
    });
  });

  // 2. VALIDAÇÃO DAS REGRAS AQPC & MONOTONIA
  const getFicha = (gridItem: Partial<CardapioDiaUAN>) => gridItem.ficha_uan_id ? fichasMap[gridItem.ficha_uan_id] : null;

  regras.filter(r => r.ativo).forEach(regra => {
    
    // Regra MAX DIARIO (Cor, Textura, Cocção, Enxofre)
    if (
      regra.tipo_regra === 'MAX_DIARIO_COR' || 
      regra.tipo_regra === 'MAX_DIARIO_TEXTURA' || 
      regra.tipo_regra === 'MAX_DIARIO_METODO_COCCAO' ||
      regra.tipo_regra === 'MAX_DIARIO_ENXOFRE'
    ) {
      diasAtivos.forEach(data => {
        // Agrupa por dia (soma todas as refeições do dia)
        const itemsNoDia = grade.filter(g => g.data_consumo === data).map(getFicha).filter(Boolean);
        
        let count = 0;
        if (regra.tipo_regra === 'MAX_DIARIO_COR' && regra.parametro_alvo) {
          count = itemsNoDia.filter(f => f!.cor_predominante === regra.parametro_alvo).length;
        } else if (regra.tipo_regra === 'MAX_DIARIO_TEXTURA' && regra.parametro_alvo) {
          count = itemsNoDia.filter(f => f!.textura_principal === regra.parametro_alvo).length;
        } else if (regra.tipo_regra === 'MAX_DIARIO_METODO_COCCAO' && regra.parametro_alvo) {
          count = itemsNoDia.filter(f => f!.metodo_coccao === regra.parametro_alvo).length;
        } else if (regra.tipo_regra === 'MAX_DIARIO_ENXOFRE') {
          count = itemsNoDia.filter(f => f!.rico_em_enxofre).length;
        }

        if (regra.valor_limite !== null && regra.valor_limite !== undefined && count > regra.valor_limite) {
          alerts.push({
            data_consumo: data,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Regra de Variedade Rompida: Máx Diário de ${regra.tipo_regra.replace('MAX_DIARIO_', '')} (${regra.parametro_alvo || 'Enxofre'}) excedido. Agendados: ${count}, Máx: ${regra.valor_limite}.`
          });
        }
      });
    }

    // Regra CUSTO DIARIO
    if (regra.tipo_regra === 'CUSTO_MAX_DIARIO' && regra.valor_limite !== null) {
      diasAtivos.forEach(data => {
        const items = grade.filter(g => g.data_consumo === data);
        let custoTotal = 0;
        items.forEach(it => {
          const f = getFicha(it);
          if (f?.custo_por_porcao) custoTotal += f.custo_por_porcao * (it.fator_multiplicador || 1);
        });
        
        if (regra.valor_limite !== null && regra.valor_limite !== undefined && custoTotal > regra.valor_limite) {
          alerts.push({
            data_consumo: data,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Teto de Custo Diário Estourado: Previsto: R$ ${custoTotal.toFixed(2)}, Limite: R$ ${regra.valor_limite}.`
          });
        }
      });
    }

    // Regra CUSTO TETO POR REFEIÇÃO
    if (regra.tipo_regra === 'CUSTO_MAX_REFEICAO' && regra.valor_limite !== null) {
      Object.keys(gradeByDayMeal).forEach(key => {
        const [data, refeicao] = key.split('_');
        const items = gradeByDayMeal[key];
        let custoRefeicao = 0;
        items.forEach(it => {
          const f = getFicha(it);
          if (f?.custo_por_porcao) custoRefeicao += f.custo_por_porcao * (it.fator_multiplicador || 1);
        });

        if (regra.valor_limite !== null && regra.valor_limite !== undefined && custoRefeicao > regra.valor_limite) {
          alerts.push({
            data_consumo: data,
            tipo_refeicao: refeicao,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Teto de Custo da Refeição (${refeicao}) Estourado: Previsto: R$ ${custoRefeicao.toFixed(2)}, Limite: R$ ${regra.valor_limite}.`
          });
        }
      });
    }

    // Regra DISTÂNCIA MÍNIMA (Dias) - Anti-Monotonia (repetição da mesma ficha)
    if (regra.tipo_regra === 'DISTANCIA_MINIMA_DIAS' && regra.dias_janela !== null) {
      // Agrupar todas as fichas pelos seus IDs na timeline
      const occurancesByFicha: Record<string, string[]> = {};
      grade.forEach(g => {
        if (!g.ficha_uan_id || !g.data_consumo) return;
        if (!occurancesByFicha[g.ficha_uan_id]) occurancesByFicha[g.ficha_uan_id] = [];
        occurancesByFicha[g.ficha_uan_id].push(g.data_consumo);
      });

      Object.entries(occurancesByFicha).forEach(([fichaId, datas]) => {
        // Ordena por data
        const sortedDates = Array.from(new Set(datas)).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        for (let i = 1; i < sortedDates.length; i++) {
          const dtBase = new Date(sortedDates[i-1]);
          const dtNext = new Date(sortedDates[i]);
          const deltaDias = Math.floor((dtNext.getTime() - dtBase.getTime()) / (1000 * 3600 * 24));
          
          if (deltaDias < regra.dias_janela!) {
            const fNome = fichasMap[fichaId]?.nome || 'Desconhecida';
            alerts.push({
               data_consumo: sortedDates[i],
               severity: regra.severidade,
               ruleType: regra.tipo_regra,
               message: `Preparaçao "${fNome}" repetiu em ${deltaDias} dias (Lim. exigido: ${regra.dias_janela} dias).`
            });
          }
        }
      });
    }

  });

  return alerts;
}
