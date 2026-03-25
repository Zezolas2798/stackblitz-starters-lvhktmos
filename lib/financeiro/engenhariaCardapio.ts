/**
 * Módulo de Inteligência de Vendas e Engenharia de Cardápio (Padrão USAR)
 * Baseado na "BCG Matrix Gastronômica" (Kasavana & Smith).
 */

export interface MenuItemEngineering {
  id: string;
  name: string;
  price: number; // Preço de Venda
  cost: number;  // Custo Teórico (Prime Cost - Insumo)
  quantitySold: number; // Quantidade Vendida no período
}

export interface MenuItemAnalyzed extends MenuItemEngineering {
  margin: number;       // Margem de Contribuição Unitária (Preço - Custo)
  totalMargin: number;  // Margem Total Gerada
  mixPercent: number;   // % de Popularidade no Mix de Vendas
  marginCategory: 'ALTA' | 'BAIXA';
  popularityCategory: 'ALTA' | 'BAIXA';
  classification: 'ESTRELA' | 'CAVALO_DE_BATALHA' | 'QUEBRA_CABECA' | 'CAO';
}

export interface MenuEngineeringResults {
  items: MenuItemAnalyzed[];
  averageMargin: number;
  popularityCutoff: number;
  totalQuantitySold: number;
  totalMarginGenerated: number;
}

export interface ABCEntry {
  id: string;
  name: string;
  value: number; // Faturamento ou Margem
  percentage: number;
  cumulativePercentage: number;
  category: 'A' | 'B' | 'C';
}

/**
 * Avalia o Mix de Produtos e os classifica na Matriz de Engenharia de Cardápio.
 */
export function analyzeMenuEngineering(items: MenuItemEngineering[]): MenuEngineeringResults {
  if (items.length === 0) return { items: [], averageMargin: 0, popularityCutoff: 0, totalQuantitySold: 0, totalMarginGenerated: 0 };

  const totalQuantitySold = items.reduce((acc, item) => acc + item.quantitySold, 0);
  const totalMarginGenerated = items.reduce((acc, item) => acc + ((item.price - item.cost) * item.quantitySold), 0);

  // 1. Média de Margem de Contribuição
  const averageMargin = totalQuantitySold > 0 ? totalMarginGenerated / totalQuantitySold : 0;

  // 2. Média 'Corte' de Popularidade (Em geral, considera-se 70% da média esperada)
  const expectedPopularityPercent = (1 / items.length) * 100;
  const popularityCutoff = expectedPopularityPercent * 0.7; // Padrão da indústria USAR

  const analyzedItems = items.map(item => {
    const margin = item.price - item.cost;
    const mixPercent = totalQuantitySold > 0 ? (item.quantitySold / totalQuantitySold) * 100 : 0;

    const isHighMargin = margin >= averageMargin;
    const isHighPopularity = mixPercent >= popularityCutoff;

    let classification: MenuItemAnalyzed['classification'];
    if (isHighMargin && isHighPopularity) {
      classification = 'ESTRELA'; // Manter consistência, não mexer no preço
    } else if (!isHighMargin && isHighPopularity) {
      classification = 'CAVALO_DE_BATALHA'; // Reduzir porção ou aumentar levemente o preço
    } else if (isHighMargin && !isHighPopularity) {
      classification = 'QUEBRA_CABECA'; // Mudar destaque no cardápio, treinar garçons
    } else {
      classification = 'CAO'; // Retirar do cardápio ou reinventar
    }

    const result: MenuItemAnalyzed = {
      ...item,
      margin,
      totalMargin: margin * item.quantitySold,
      mixPercent,
      marginCategory: isHighMargin ? 'ALTA' : 'BAIXA',
      popularityCategory: isHighPopularity ? 'ALTA' : 'BAIXA',
      classification
    };
    return result;
  });

  return {
    items: analyzedItems,
    averageMargin,
    popularityCutoff,
    totalQuantitySold,
    totalMarginGenerated
  };
}

/**
 * Calcula o RevPASH (Revenue Per Available Seat Hour)
 * Indicador vital de capacidade e eficiência de giro de mesas.
 */
export function calculateRevPASH(revenue: number, availableSeats: number, hoursOpen: number): number {
  if (availableSeats <= 0 || hoursOpen <= 0) return 0;
  return revenue / (availableSeats * hoursOpen);
}

/**
 * Calcula o Throughput (Geração de Margem por Minuto)
 * Quão rápido a cozinha converte insumos em dinheiro (Margem / Minutos de Produção Total).
 */
export function calculateThroughput(totalMargin: number, productionMinutesTotal: number): number {
  if (productionMinutesTotal <= 0) return 0;
  return totalMargin / productionMinutesTotal;
}

/**
 * Calcula a Curva ABC (Pareto) de itens.
 * Clasifica em:
 * A: Até 80% do valor acumulado
 * B: De 80% a 95% do valor acumulado
 * C: De 95% a 100% do valor acumulado
 */
export function calculateABCCurve(items: { id: string, name: string, value: number }[]): ABCEntry[] {
  const totalValue = items.reduce((acc, item) => acc + item.value, 0);
  if (totalValue === 0) return [];

  // Ordenar decrescente pelo valor
  const sorted = [...items].sort((a, b) => b.value - a.value);
  let cumulativeValue = 0;

  return sorted.map(item => {
    cumulativeValue += item.value;
    const percentage = (item.value / totalValue) * 100;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;

    let category: 'A' | 'B' | 'C';
    // Usamos um pequeno ajuste para evitar problemas de arredondamento
    if (cumulativePercentage <= 80.001) category = 'A';
    else if (cumulativePercentage <= 95.001) category = 'B';
    else category = 'C';

    return {
      ...item,
      percentage,
      cumulativePercentage,
      category
    };
  });
}
