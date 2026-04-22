/**
 * MOTOR DE VALIDAÇÃO DE CARDÁPIOS UAN (LINTER AQPC)
 * 
 * Este módulo realiza a validação em tempo real da grade de cardápios, 
 * verificando conformidade com as Regras de Variedade configuradas.
 * 
 * OBJETIVOS:
 * 1. Garantir o balanço nutricional e a variedade sensorial (Linter AQPC).
 * 2. Prevenir a monotonia alimentar e fadiga de crossover.
 * 3. Assegurar conformidade com legislações como PAT (Programa de Alimentação do Trabalhador).
 * 
 * FUNDAMENTAÇÃO TÉCNICA:
 * - AQPC: Avaliação Qualitativa das Preparações do Cardápio.
 * - PAT: Lei 6.321/76 - Exige variedade e controle calórico/nutricional.
 * - NPP: Menu Planning Problem (Problema NP-Hard de otimização combinatória).
 * 
 * @see [[uan.cardapios]] Documentação de domínio.
 * @see [[08_modelagem_matematica_cardapios]] Fundamentação matemática.
 */

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
  custo_por_porcao?: number; // Injetado externamente
  proteina_familia_id?: string | null; // ID do Grupo de proteína dominante (Aves, Bovinos, etc.)
  ingredientes_subgrupos?: string[]; // IDs dos subgrupos dos ingredientes componentes
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
  const gradeByDayMeal: Record<string, Partial<CardapioDiaUAN>[]> = {};
  grade.forEach(item => {
    if (!item.data_consumo || !item.tipo_refeicao) return;
    const key = `${item.data_consumo}_${item.tipo_refeicao}`;
    if (!gradeByDayMeal[key]) gradeByDayMeal[key] = [];
    gradeByDayMeal[key].push(item);
  });

  const getFicha = (gridItem: Partial<CardapioDiaUAN>) => gridItem.ficha_uan_id ? fichasMap[gridItem.ficha_uan_id] : null;

  // 1. REGRAS DE VARIEDADE (AQPC & MONOTONIA)
  regras.filter(r => r.ativo).forEach(regra => {
    
    // Regra MAX DIARIO (Cor, Textura, Cocção, Enxofre)
    if (
      regra.tipo_regra === 'MAX_DIARIO_COR' || 
      regra.tipo_regra === 'MAX_DIARIO_TEXTURA' || 
      regra.tipo_regra === 'MAX_DIARIO_METODO_COCCAO' ||
      regra.tipo_regra === 'MAX_DIARIO_ENXOFRE'
    ) {
      diasAtivos.forEach(data => {
        const itemsNoDiaGrid = grade.filter(g => g.data_consumo === data);
        if (itemsNoDiaGrid.length === 0) return;

        const itemsNoDia = itemsNoDiaGrid.map(getFicha).filter(Boolean);
        
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
          const typeLabel = regra.tipo_regra === 'MAX_DIARIO_COR' ? `cor "${regra.parametro_alvo}"` : 
                           regra.tipo_regra === 'MAX_DIARIO_TEXTURA' ? `textura "${regra.parametro_alvo}"` :
                           regra.tipo_regra === 'MAX_DIARIO_METODO_COCCAO' ? `cocção "${regra.parametro_alvo}"` :
                           'itens flatulentos (Enxofre)';

          const msgPrefix = regra.tipo_regra === 'MAX_DIARIO_COR'
            ? `Variabilidade Cromática (${data}): A cor "${regra.parametro_alvo}" aparece`
            : `Frequência Digestiva/Flatulência (${data}): Máximo de ${typeLabel} excedido (Excluindo Prato Base)`;

          alerts.push({
            data_consumo: data,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `${msgPrefix} no dia (${count}/${regra.valor_limite}).`
          });
        }
      });
    }

    // Regra MAX POR REFEIÇÃO (Cromático ou Enxofre)
    if (
      (regra.tipo_regra === 'MAX_REFEICAO_COR' && regra.parametro_alvo) ||
      regra.tipo_regra === 'MAX_REFEICAO_ENXOFRE'
    ) {
      Object.keys(gradeByDayMeal).forEach(key => {
        const [data, refeicao] = key.split('_');
        const items = gradeByDayMeal[key].map(getFicha).filter(Boolean);
        
        let count = 0;
        let label = '';

        if (regra.tipo_regra === 'MAX_REFEICAO_COR') {
          count = items.filter(f => f!.cor_predominante === regra.parametro_alvo).length;
          label = `cor "${regra.parametro_alvo}"`;
        } else {
          // EXCEÇÃO PRATO BASE: Não contamos o básico (arroz/feijão dia a dia) para não "gastar" a cota.
          count = items.filter(f => f!.rico_em_enxofre && f!.categoria_uan !== 'Prato Base').length;
          label = 'itens flatulentos (Enxofre) extras';
        }

        if (regra.valor_limite !== null && regra.valor_limite !== undefined && count > regra.valor_limite) {
          const contextMsg = regra.tipo_regra === 'MAX_REFEICAO_COR' 
            ? `Harmonização Cromática: Evite excesso de preparações com a ${label} no mesmo prato.`
            : `Conforto Digestivo (${refeicao}): Limite de ${label} excedido (Excluindo Prato Base).`;

          alerts.push({
            data_consumo: data,
            tipo_refeicao: refeicao,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `${contextMsg} (${count}/${regra.valor_limite}).`
          });
        }
      });
    }

    // Regra CUSTO DIARIO
    if (regra.tipo_regra === 'CUSTO_MAX_DIARIO' && regra.valor_limite !== null) {
      diasAtivos.forEach(data => {
        const items = grade.filter(g => g.data_consumo === data);
        if (items.length === 0) return;

        let custoTotal = 0;
        items.forEach(it => {
          const f = getFicha(it);
          if (f?.custo_por_porcao) custoTotal += f.custo_por_porcao * (it.fator_multiplicador || 1);
        });
        
        if (custoTotal > regra.valor_limite!) {
          alerts.push({
            data_consumo: data,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Teto de Custo Diário: Previsto R$ ${custoTotal.toFixed(2)} (Limite R$ ${regra.valor_limite}).`
          });
        }
      });
    }

    // Regra CUSTO TETO POR REFEIÇÃO
    if (regra.tipo_regra === 'CUSTO_MAX_REFEICAO' && regra.valor_limite !== null) {
      Object.keys(gradeByDayMeal).forEach(key => {
        const [data, refeicao] = key.split('_');
        const items = gradeByDayMeal[key];
        if (!items || items.length === 0) return;

        let custoRefeicao = 0;
        items.forEach(it => {
          const f = getFicha(it);
          if (f?.custo_por_porcao) custoRefeicao += f.custo_por_porcao * (it.fator_multiplicador || 1);
        });

        if (custoRefeicao > regra.valor_limite!) {
          alerts.push({
            data_consumo: data,
            tipo_refeicao: refeicao,
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Teto de Custo (${refeicao}): Previsto R$ ${custoRefeicao.toFixed(2)} (Limite R$ ${regra.valor_limite}).`
          });
        }
      });
    }

    // Regra DISTÂNCIA MÍNIMA (ANTI-MONOTONIA / FADIGA DE CROSSOVER)
    // Garante que o mesmo prato ou família proteica não apareça em um curto espaço de tempo.
    if ((regra.tipo_regra === 'DISTANCIA_MINIMA_DIAS' || regra.tipo_regra === 'DISTANCIA_MINIMA_FAMILIA') && (regra.dias_janela || 0) > 0) {
      const occurances: Record<string, string[]> = {}; // targetId -> datas
      
      grade.forEach(g => {
        const f = getFicha(g);
        if (!f || !g.tipo_refeicao) return;
        
        // Verifica se este item pertence a um slot FIXO no perfil
        const perfilId = perfisRefeicao[g.tipo_refeicao];
        const perfil = perfisMap[perfilId];
        const slot = perfil?.slots?.find(s => s.categoria_uan === f.categoria_uan);
        if (slot?.fixo) return; // Ignora itens fixos para regras de distância/repetição

        const targetId = regra.tipo_regra === 'DISTANCIA_MINIMA_DIAS' ? g.ficha_uan_id : f.proteina_familia_id;
        if (!targetId) return;
        
        // Se for por família, só processamos se o target for a família alvo da regra
        if (regra.tipo_regra === 'DISTANCIA_MINIMA_FAMILIA' && targetId !== regra.parametro_alvo) return;
        
        if (!occurances[targetId]) occurances[targetId] = [];
        occurances[targetId].push(g.data_consumo!);
      });

      Object.entries(occurances).forEach(([targetId, datas]) => {
        const sortedDates = Array.from(new Set(datas)).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        for (let i = 1; i < sortedDates.length; i++) {
          const dtBase = new Date(sortedDates[i-1]);
          const dtNext = new Date(sortedDates[i]);
          const deltaDias = Math.floor((dtNext.getTime() - dtBase.getTime()) / (1000 * 3600 * 24));
          
          if (deltaDias < (regra.dias_janela || 0)) {
            const label = regra.tipo_regra === 'DISTANCIA_MINIMA_DIAS' 
              ? `"${fichasMap[targetId]?.nome || 'Ficha'}"` 
              : `Família Proteica "${regra.parametro_alvo}"`;

            alerts.push({
               data_consumo: sortedDates[i],
               severity: regra.severidade,
               ruleType: regra.tipo_regra,
               message: `Ineditismo: ${label} repetiu em ${deltaDias} dias (Mínimo: ${regra.dias_janela}).`
            });
          }
        }
      });
    }

    // Regra INCOMPATIBILIDADE PROTEICA (Diferenciação de Famílias)
    // Impede que dois pratos da mesma família (ex: Bife e Isca de Carne) sejam servidos na mesma refeição.
    // FUNDAMENTAÇÃO: AQPC (Variedade de cores e texturas).
    if (regra.tipo_regra === 'INCOMPATIBILIDADE_DIARIA') {
      const CLUSTER_PROTEICO = ['Prato Principal', 'Alternativa', 'Opção Vegetariana'];
      
      Object.keys(gradeByDayMeal).forEach(key => {
        const [data, refeicao] = key.split('_');
        const items = gradeByDayMeal[key].filter(it => {
          const f = getFicha(it);
          return f && CLUSTER_PROTEICO.includes(f.categoria_uan || '');
        });

        if (items.length <= 1) return;

        const proteinasNoTurno: Record<string, string[]> = {}; // subgrupo_id -> lista de nomes de pratos
        items.forEach(it => {
          const f = getFicha(it);
          if (f?.proteina_familia_id) {
            if (!proteinasNoTurno[f.proteina_familia_id]) proteinasNoTurno[f.proteina_familia_id] = [];
            proteinasNoTurno[f.proteina_familia_id].push(f.nome);
          }
        });

        Object.entries(proteinasNoTurno).forEach(([fid, nomes]) => {
          if (nomes.length > 1) {
            alerts.push({
              data_consumo: data,
              tipo_refeicao: refeicao,
              severity: regra.severidade,
              ruleType: regra.tipo_regra,
              message: `Incompatibilidade: Repetição da mesma família proteica no ${refeicao} (${nomes.join(' e ')}).`
            });
          }
        });
      });
    }

    // Regra MÁXIMO SEMANAL POR FAMÍLIA (Controle de Frequência PAT)
    // Limita a incidência de grupos (ex: Carne Vermelha) na semana para promover o balanço nutricional.
    // Ref: Legislacao PAT - Recomendação de variedade proteica.
    if (regra.tipo_regra === 'MAX_SEMANAL_FAMILIA' && regra.parametro_alvo && regra.valor_limite !== null) {
      const diasComAFamilia = new Set<string>();
      grade.forEach(g => {
        const f = getFicha(g);
        if (f?.proteina_familia_id === regra.parametro_alvo) {
          diasComAFamilia.add(g.data_consumo!);
        }
      });

      if (diasComAFamilia.size > regra.valor_limite!) {
        alerts.push({
          data_consumo: Array.from(diasComAFamilia).sort()[0],
          severity: regra.severidade,
          ruleType: regra.tipo_regra,
          message: `Frequência Semanal: Família Proteica excedeu o limite (${diasComAFamilia.size}/${regra.valor_limite} dias).`
        });
      }
    }

    // Regra MÁXIMO POR MÉTODO DE COCCÃO OU TEXTURA (REFEIÇÃO / DIA / SEMANA)
    if (['MAX_REFEICAO_METODO_COCCAO', 'MAX_REFEICAO_TEXTURA', 'MAX_DIARIO_METODO_COCCAO', 'MAX_SEMANAL_METODO_COCCAO'].includes(regra.tipo_regra) && regra.parametro_alvo && regra.valor_limite !== null) {
      if (regra.tipo_regra === 'MAX_REFEICAO_METODO_COCCAO' || regra.tipo_regra === 'MAX_REFEICAO_TEXTURA') {
        Object.keys(gradeByDayMeal).forEach(key => {
          const [data, refeicao] = key.split('_');
          const count = gradeByDayMeal[key].filter(it => {
             const f = getFicha(it);
             return regra.tipo_regra === 'MAX_REFEICAO_METODO_COCCAO' ? f?.metodo_coccao === regra.parametro_alvo : f?.textura_principal === regra.parametro_alvo;
          }).length;
          
          if (count > regra.valor_limite!) {
            const label = regra.tipo_regra === 'MAX_REFEICAO_METODO_COCCAO' ? 'preparação' : 'textura';
            alerts.push({
              data_consumo: data,
              tipo_refeicao: refeicao,
              severity: regra.severidade,
              ruleType: regra.tipo_regra,
              message: `Frequência por Refeição: "${regra.parametro_alvo}" (${label}) excedeu o limite (${count}/${regra.valor_limite}).`
            });
          }
        });
      } else if (regra.tipo_regra === 'MAX_SEMANAL_METODO_COCCAO') {
        const diasComMetodo = new Set<string>();
        grade.forEach(g => {
          if (getFicha(g)?.metodo_coccao === regra.parametro_alvo) {
            diasComMetodo.add(g.data_consumo!);
          }
        });
        if (diasComMetodo.size > regra.valor_limite!) {
          alerts.push({
            data_consumo: Array.from(diasComMetodo).sort()[0],
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Frequência Semanal: Método "${regra.parametro_alvo}" excedeu o limite (${diasComMetodo.size}/${regra.valor_limite} dias).`
          });
        }
      }
    }

    // Regra SIMILARIDADE ENTRE DIAS CONSECUTIVOS 
    // Calcula o Índice de Jaccard entre o "perfil sensorial" de dois dias.
    // Ref: [[09_planejamento_cardapios_ia]] - Seção 3.2
    if (regra.tipo_regra === 'SIMILARIDADE_ENTRE_DIAS' && (regra.limiar_similaridade || 0) > 0) {
      const sortedDays = Array.from(new Set(diasAtivos)).sort();
      
      const getDayFeatures = (data: string) => {
        const itemsGrade = grade.filter(g => g.data_consumo === data);
        const items = itemsGrade.map(g => {
          const f = getFicha(g);
          if (!f || !g.tipo_refeicao) return null;
          
          // Exclui itens de slots FIXOS do cálculo de similaridade
          const perfilId = perfisRefeicao[g.tipo_refeicao];
          const slot = perfisMap[perfilId]?.slots?.find(s => s.categoria_uan === f.categoria_uan);
          if (slot?.fixo) return null;
          
          return f;
        }).filter(Boolean) as FichaValidationData[];

        const colors = new Set(items.map(i => i.cor_predominante).filter(Boolean) as string[]);
        const textures = new Set(items.map(i => i.textura_principal).filter(Boolean) as string[]);
        const methods = new Set(items.map(i => i.metodo_coccao).filter(Boolean) as string[]);
        const subgroups = new Set(items.flatMap(i => i.ingredientes_subgrupos || []));
        return { colors, textures, methods, subgroups };
      };

      const calculateJaccard = (s1: Set<string>, s2: Set<string>) => {
        if (s1.size === 0 && s2.size === 0) return 1;
        const s1Arr = Array.from(s1);
        const s2Arr = Array.from(s2);
        const intersection = new Set(s1Arr.filter(x => s2.has(x)));
        const union = new Set([...s1Arr, ...s2Arr]);
        return union.size === 0 ? 0 : intersection.size / union.size;
      };

      for (let d = 1; d < sortedDays.length; d++) {
        const featA = getDayFeatures(sortedDays[d-1]);
        const featB = getDayFeatures(sortedDays[d]);

        // Média dos Jaccard Indices (Peso Igual por Atributo)
        const jColors = calculateJaccard(featA.colors, featB.colors);
        const jTextures = calculateJaccard(featA.textures, featB.textures);
        const jMethods = calculateJaccard(featA.methods, featB.methods);
        const jIngredients = calculateJaccard(featA.subgroups, featB.subgroups);
        const similarity = (jColors + jTextures + jMethods + jIngredients) / 4;
        const threshold = (regra.limiar_similaridade || 50) / 100;

        if (similarity > threshold) {
          const percSim = (similarity * 100).toFixed(0);
          const percLim = (threshold * 100).toFixed(0);
          
          alerts.push({
            data_consumo: sortedDays[d],
            severity: regra.severidade,
            ruleType: regra.tipo_regra,
            message: `Ineditismo Insuficiente: O cardápio é ${percSim}% similar ao dia anterior (Limite: ${percLim}%).`
          });
        }
      }
    }
  });

  // 2. VALIDAÇÃO DE COBERTURA DE SLOTS (PERFIL)
  diasAtivos.forEach(data => {
    Object.entries(perfisRefeicao).forEach(([ref, perfilId]) => {
      const items = grade.filter(g => g.data_consumo === data && g.tipo_refeicao === ref);
      if (items.length === 0) return; // Pula se não foi planejado nada ainda

      const perfil = perfisMap[perfilId];
      if (!perfil?.slots) return;

      perfil.slots.forEach(slot => {
        const count = items.filter(it => getFicha(it)?.categoria_uan === slot.categoria_uan).length;
        if (count < slot.quantidade_min) {
          alerts.push({
            data_consumo: data,
            tipo_refeicao: ref,
            severity: 'SOFT',
            ruleType: 'SLOT_VALIDATION',
            message: `Perfil "${perfil.nome}": Faltam preparações "${slot.categoria_uan}" (${count}/${slot.quantidade_min}).`
          });
        } else if (slot.quantidade_max > 0 && count > slot.quantidade_max) {
          alerts.push({
            data_consumo: data,
            tipo_refeicao: ref,
            severity: 'SOFT',
            ruleType: 'SLOT_VALIDATION',
            message: `Perfil "${perfil.nome}": Excesso de preparações "${slot.categoria_uan}" (${count}/${slot.quantidade_max}).`
          });
        }
      });
    });
  });

  // 3. VALIDAÇÃO DE ACEITABILIDADE (Clusters)
  const CLUSTER_PROTEICO = ['Prato Principal', 'Alternativa', 'Opção Vegetariana'];
  
  diasAtivos.forEach(data => {
    const refeicoesNoDia = Array.from(new Set(grade.filter(g => g.data_consumo === data).map(g => g.tipo_refeicao)));
    
    refeicoesNoDia.forEach(ref => {
      const items = grade.filter(g => g.data_consumo === data && g.tipo_refeicao === ref);
      if (items.length === 0) return;

      // Cluster Principal
      const itemsCluster = items.filter(it => {
        const f = getFicha(it);
        return f && CLUSTER_PROTEICO.includes(f.categoria_uan || '');
      });

      if (itemsCluster.length > 0) {
        const sum = itemsCluster.reduce((acc, curr) => acc + (curr.fator_multiplicador || 0), 0);
        if (sum < 0.98 || sum > 1.02) {
          alerts.push({
            data_consumo: data,
            tipo_refeicao: ref || undefined,
            severity: 'HARD',
            ruleType: 'SLOT_VALIDATION',
            message: `Aceitabilidade Cluster Principal: Soma ${Math.round(sum * 100)}% (Deve ser ~100%).`
          });
        }
      }

      // Outras Categorias com múltiplos itens (ex: Sobremesas)
      const categories = Array.from(new Set(items.map(it => getFicha(it)?.categoria_uan).filter(Boolean)));
      categories.forEach(cat => {
        if (cat === 'Prato Base' || CLUSTER_PROTEICO.includes(cat || '')) return;
        const catItems = items.filter(it => getFicha(it)?.categoria_uan === cat);
        if (catItems.length > 1) {
          const sumCat = catItems.reduce((acc, curr) => acc + (curr.fator_multiplicador || 0), 0);
          if (sumCat < 0.98 || sumCat > 1.02) {
            alerts.push({
              data_consumo: data,
              tipo_refeicao: ref || undefined,
              severity: 'HARD',
              ruleType: 'SLOT_VALIDATION',
              message: `Aceitabilidade ${cat}: Soma ${Math.round(sumCat * 100)}% (Deve ser ~100%).`
            });
          }
        }
      });
    });
  });

  return alerts;
}
