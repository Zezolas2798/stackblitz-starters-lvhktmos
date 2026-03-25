/**
 * Motor Fiscal Brasileiro Simplificado para Restaurantes.
 * Simula regras de Simples Nacional, Lucro Presumido e impacto ICMS/PIS/COFINS.
 */

export interface TaxDeductionResult {
  simplesNacional: number;
  pisCofinsMonofasico: number; // Produtos frios (bebidas) com PIS/COFINS Monofásico
  icmsSt: number; // ICMS Substituição Tributária
  totalTaxes: number;
  netRevenueLimit: number; // Receita Mínima após impostos
}

export function calculateBrazilianTaxes(
  grossRevenue: number, 
  beverageRevenuePercent: number, // % da receita bruta que é bebida fria (Monofásico)
  taxRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL',
  estimatedRate: number // Ex: 4.5% no Simples Anexo I
): TaxDeductionResult {
  
  let totalTaxes = 0;
  let pisCofinsMonofasico = 0;
  let icmsSt = 0;
  let simplesNacional = 0;

  const beverageRevenue = grossRevenue * (beverageRevenuePercent / 100);

  if (taxRegime === 'SIMPLES_NACIONAL') {
    // Restaurantes no Simples geralmente Anexo I (Comércio).
    // Bebidas frias (Cerveja, Refri, Água) possuem tributação Monofásica de PIS/COFINS e ICMS-ST.
    // Isso significa que a alíquota sobre a bebida é menor (deduz-se a parcela do PIS/COFINS e ICMS da DAS).
    
    // Simplificação: Assume-se que a alíquota base é aplicada sobre Alimentos.
    const foodRevenue = grossRevenue - beverageRevenue;
    simplesNacional = foodRevenue * (estimatedRate / 100);

    // Para bebidas, a taxa cai (ex: deduz 30% da DAS referente a impostos já pagos na fábrica)
    const reducedRate = estimatedRate * 0.7; 
    simplesNacional += beverageRevenue * (reducedRate / 100);

    totalTaxes = simplesNacional;
  } else if (taxRegime === 'LUCRO_PRESUMIDO') {
    // Presunção geral de comércio é 8% para IRPJ e 12% para CSLL, totalizando aprox. 5.93% federais.
    // + PIS (0.65%) + COFINS (3.0%) = 3.65%
    // + ICMS dependendo do estado.
    // Simplificação:
    totalTaxes = grossRevenue * (estimatedRate / 100); // estimatedRate input seria o mix completo (ex: 12%).
  }

  // A dedução dos impostos define a Top-Line Revenue (Receita Líquida) do DRE.
  return {
    simplesNacional,
    pisCofinsMonofasico,
    icmsSt,
    totalTaxes,
    netRevenueLimit: grossRevenue - totalTaxes
  };
}
