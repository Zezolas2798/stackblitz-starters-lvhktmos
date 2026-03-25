/**
 * Módulo de Valuation, Unit Economics e Projeções Financeiras.
 */

/**
 * Calcula Múltiplo de Valuation simplificado por faixas de eficiência e Porte.
 * Baseado no artigo de Valuation (Food Tech vs Independente).
 */
export function calculateEstimatedValuation(ebitdaAnual: number, portType: 'INDEPENDENTE' | 'ESTRUTURADO' | 'REDE'): number {
  let multiplier = 2.5; // Padrão mínimo

  if (portType === 'INDEPENDENTE') multiplier = 2.5;
  if (portType === 'ESTRUTURADO') multiplier = 4.0;
  if (portType === 'REDE') multiplier = 6.0;

  return ebitdaAnual * multiplier;
}

/**
 * Custo de Aquisição de Clientes (CAC)
 */
export function calculateCAC(marketingExpense: number, newCustomers: number): number {
  if (newCustomers <= 0) return 0;
  return marketingExpense / newCustomers;
}

/**
 * Lifetime Value Simplificado (LTV)
 */
export function calculateLTV(averageTicket: number, averageVisitsPerMonth: number, lifespanMonths: number, grossMarginPercent: number): number {
  return (averageTicket * averageVisitsPerMonth) * lifespanMonths * (grossMarginPercent / 100);
}

/**
 * Calcula o Vazamento Financeiro de Antecipações de Recebíveis (MDR e Antecipação)
 */
export function calculateCashLeakage(grossRevenue: number, mdrRatePercent: number, anticipationRatePercent: number, daysAnticipated: number): {
  mdrCost: number;
  anticipationCost: number;
  netRevenue: number;
} {
  const mdrCost = grossRevenue * (mdrRatePercent / 100);
  const revenueAfterMdr = grossRevenue - mdrCost;

  // Juros Simples pro-rata die (típico de adquirente)
  const anticipationCost = revenueAfterMdr * ((anticipationRatePercent / 100) / 30) * daysAnticipated;

  const netRevenue = revenueAfterMdr - anticipationCost;

  return {
    mdrCost,
    anticipationCost,
    netRevenue
  };
}
