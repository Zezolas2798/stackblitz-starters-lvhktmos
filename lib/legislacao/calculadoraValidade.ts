import { supabase } from '@/lib/supabaseClient';
import { addDays, addHours, isAfter, differenceInCalendarDays, format } from 'date-fns';

export type ResultadoValidade = {
  dataValidadeFinal: Date;
  diasRestantes: number;
  regraAplicada: string; // Explicação detalhada da decisão
  fonteLegal: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  corHex: string; // Para usar na UI
};

/**
 * MOTOR DE VALIDADE HÍBRIDO (GXP COMPLIANT)
 * Cruza: [Rótulo Original] vs [Instrução Fornecedor] vs [Lei Sanitária]
 */
export async function calcularValidade(
  categoriaAlimento: string,      // Ex: 'FRIOS_EMBUTIDOS' (Chave da tabela SQL)
  dataValidadeOriginal: Date,     // A validade "fechado" do rótulo
  dataManipulacao: Date,          // Data/Hora atual (Abertura ou Preparo)
  tempArmazenamento: number,      // Ex: 4.0 (Temperatura do equipamento)
  diasAbertoFornecedor?: number   // Instrução opcional: "Consumir em X dias após aberto"
): Promise<ResultadoValidade> {

  // 1. DATA TETO 1: A validade original do produto NUNCA pode ser ultrapassada.
  // Se o presunto vence amanhã, não importa se a lei dá 3 dias. Vence amanhã.
  let dataFinal = dataValidadeOriginal;
  let regraVencedora = "Validade Original do Fabricante (Rótulo)";
  let fonte = "Fabricante";

  // 2. DATA TETO 2: Instrução do Fornecedor (Após Aberto)
  if (diasAbertoFornecedor && diasAbertoFornecedor > 0) {
    const validadeAposAberto = addDays(dataManipulacao, diasAbertoFornecedor);
    
    // Se a regra "após aberto" for MENOR que a data atual, atualizamos.
    if (validadeAposAberto < dataFinal) {
      dataFinal = validadeAposAberto;
      regraVencedora = `Regra do Fabricante: Consumir em ${diasAbertoFornecedor} dias após aberto`;
      fonte = "Rótulo/Fornecedor";
    }
  }

  // 3. DATA TETO 3: Legislação Sanitária (O Guardião da Lei)
  // Busca a regra mais restritiva para a categoria e temperatura atual
  const { data: regras } = await supabase
    .from('regras_validade_sanitaria')
    .select('*')
    .eq('categoria_alimento', categoriaAlimento)
    .lte('temp_min', tempArmazenamento) // Temp Min da regra <= Temp Equipamento
    .gte('temp_max', tempArmazenamento) // Temp Max da regra >= Temp Equipamento
    .eq('ativo', true)
    .order('prioridade', { ascending: true }) // Prioridade 1 (Municipal) primeiro
    .limit(1);

  if (regras && regras.length > 0) {
    const lei = regras[0];
    let validadeLei: Date;

    if (lei.dias_validade > 0) {
      validadeLei = addDays(dataManipulacao, lei.dias_validade);
    } else {
      // Regra em horas (ex: Pescados Crus)
      validadeLei = addHours(dataManipulacao, lei.horas_validade || 0);
    }

    // O confronto final: Se a LEI for mais curta que o Fabricante, a LEI ganha.
    if (validadeLei < dataFinal) {
      dataFinal = validadeLei;
      regraVencedora = `${lei.descricao_regra} (Limite: ${lei.dias_validade}d/${lei.horas_validade}h)`;
      fonte = lei.fonte_legal; // Ex: "Portaria 2619/11"
    }
  } else {
    // Se não achou regra, adiciona um aviso no log, mas mantém a regra do fabricante
    if (fonte !== "Fabricante" && fonte !== "Rótulo/Fornecedor") {
        regraVencedora += " (Nenhuma legislação específica encontrada para esta temp/categoria)";
    }
  }

  // 4. Diagnóstico de Risco
  const hoje = new Date();
  const diasRestantes = differenceInCalendarDays(dataFinal, hoje);
  
  let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  let corHex = '#2e7d32'; // Verde

  if (diasRestantes < 0) {
    status = 'CRITICAL';
    corHex = '#d32f2f'; // Vermelho (Vencido)
    regraVencedora = "PRODUTO VENCIDO - DESCARTAR";
  } else if (diasRestantes <= 1) {
    status = 'WARNING';
    corHex = '#ed6c02'; // Laranja (Vence hoje ou amanhã)
  }

  return {
    dataValidadeFinal: dataFinal,
    diasRestantes,
    regraAplicada: regraVencedora,
    fonteLegal: fonte,
    status,
    corHex
  };
}