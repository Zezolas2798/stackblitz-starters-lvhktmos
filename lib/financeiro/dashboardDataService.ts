/**
 * Dashboard Data Service — Agregador de dados financeiros reais para o Dashboard Executivo.
 * 
 * Este serviço busca dados de todas as fontes do módulo financeiro (vendas, despesas,
 * contas a pagar, receitas) e os transforma na estrutura DRE USAR + métricas de dashboard.
 */

import { supabase } from '@/lib/supabaseClient';
import { DreNode } from '@/components/financeiro/DreStatement';
import { calculateBrazilianTaxes } from './motorFiscal';
import { calculateCashLeakage, calculateEstimatedValuation } from './valuation';
import { calculateABCCurve, analyzeMenuEngineering, MenuItemEngineering, ABCEntry, MenuEngineeringResults } from './engenhariaCardapio';

// ── Tipos ──────────────────────────────────────────────

export interface TaxConfig {
  taxRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  estimatedRate: number; // ex: 4.5%
  beverageRevenuePercent: number; // ex: 30%
  mdrRatePercent: number; // ex: 2.5%
  anticipationRatePercent: number; // ex: 3.5%
  daysAnticipated: number; // ex: 25
}

export interface DashboardData {
  // Receita
  receitaBrutaAlimentos: number;
  receitaBrutaBebidas: number;
  receitaBrutaDelivery: number;
  receitaBrutaTotal: number;
  taxasPlataformaDelivery: number;
  pedidosDelivery: number;

  // CMV
  cmvAlimentos: number;
  cmvBebidas: number;
  cmvTotal: number;

  // Despesas por subtipo USAR
  custoMaoDeObra: number;
  custosControlaveis: number;
  custoOcupacao: number;
  outrasDespesas: number;
  custoDesperdicioEstoque: number;
  totalDespesas: number;

  // Detalhes das despesas (para expandir no DRE)
  despesasDetalhe: { nome: string; valor: number; subtipo: string }[];

  // Contas a Pagar
  contasAPagar: {
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
    totalAVencer: number;
    countPendente: number;
    countPago: number;
    countVencido: number;
    items: ContaPagarItem[];
  };

  // Vendas para BCG/ABC
  vendasPorReceita: VendaReceita[];

  // Mês selecionado
  mesAno: string;
}

export interface ContaPagarItem {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  origemModulo: string;
}

export interface VendaReceita {
  id: string;
  nome: string;
  quantidadeVendida: number;
  precoVenda: number;
  custoTeorico: number;
  margem: number;
  receitaTotal: number;
}

// ── Helpers ────────────────────────────────────────────

function getMonthRange(mesAno: string): { start: string; end: string } {
  const [year, month] = mesAno.split('-');
  const start = `${year}-${month}-01`;
  const lastDay = new Date(Number(year), Number(month), 0);
  lastDay.setMinutes(lastDay.getMinutes() - lastDay.getTimezoneOffset());
  const end = lastDay.toISOString().split('T')[0];
  return { start, end };
}

// ── Data Loaders ───────────────────────────────────────

/**
 * Carrega os dados de vendas mensais e calcula receita bruta e CMV.
 */
async function loadVendasData(
  clienteId: string,
  mesAno: string
): Promise<{
  receitaAlimentos: number;
  receitaBebidas: number;
  cmvAlimentos: number;
  cmvBebidas: number;
  vendasPorReceita: VendaReceita[];
}> {
  const competencia = mesAno + '-01';

  // Buscar vendas do mês com dados da receita
  const { data: vendas, error } = await supabase
    .from('fin_vendas_mensais')
    .select(`
      receita_id,
      quantidade_vendida,
      preco_venda,
      receitas (
        id,
        nome,
        rendimento_total_g,
        peso_embalagem_g,
        tipo_receita:tipos_receita(nome),
        composicao_receitas (
          peso_bruto_g,
          item_id,
          item_type
        )
      )
    `)
    .eq('cliente_id', clienteId)
    .eq('mes_ano', competencia);

  if (error || !vendas) {
    console.error('Erro ao carregar vendas:', error);
    return { receitaAlimentos: 0, receitaBebidas: 0, cmvAlimentos: 0, cmvBebidas: 0, vendasPorReceita: [] };
  }

  // Buscar ingredientes para calcular custos
  const { data: ingredientes } = await supabase
    .from('ingredientes')
    .select('id, preco_ultima_compra, peso_unitario_g')
    .eq('cliente_id', clienteId)
    .is('deleted_at', null);

  const ingMap = (ingredientes || []).reduce((acc: Record<string, any>, ing: any) => {
    acc[ing.id] = ing;
    return acc;
  }, {});

  // Buscar materiais para calcular custos
  const { data: materiais } = await supabase
    .from('materiais')
    .select('id, preco_ultima_compra, unidade_medida')
    .eq('cliente_id', clienteId);

  const matMap = (materiais || []).reduce((acc: Record<string, any>, mat: any) => {
    acc[mat.id] = mat;
    return acc;
  }, {});

  let receitaAlimentos = 0;
  let receitaBebidas = 0;
  let cmvAlimentos = 0;
  let cmvBebidas = 0;
  const vendasPorReceita: VendaReceita[] = [];

  for (const venda of vendas as any[]) {
    const receita = venda.receitas;
    if (!receita) continue;

    const qtd = Number(venda.quantidade_vendida) || 0;
    const preco = Number(venda.preco_venda) || 0;
    const receitaTotal = qtd * preco;

    // Calcular custo teórico
    let batchCost = 0;
    for (const comp of (receita.composicao_receitas || [])) {
      if (comp.item_type === 'ingrediente') {
        const ing = ingMap[comp.item_id];
        if (ing) {
          const precoBase = Number(ing.preco_ultima_compra) || 0;
          const pesoBase = Number(ing.peso_unitario_g) || 1000;
          const pesoUsado = Number(comp.peso_bruto_g) || 0;
          batchCost += (pesoUsado / pesoBase) * precoBase;
        }
      } else if (comp.item_type === 'material') {
        const mat = matMap[comp.item_id];
        if (mat) {
          const precoBase = Number(mat.preco_ultima_compra) || 0;
          const pesoUsado = Number(comp.peso_bruto_g) || 0;
          batchCost += pesoUsado * precoBase;
        }
      }
    }

    const rendimento = Number(receita.rendimento_total_g) || 1000;
    const porcao = Number(receita.peso_embalagem_g) || 100;
    const custoUnitario = (batchCost / rendimento) * porcao;
    const cmvTotal = custoUnitario * qtd;

    // Classificar como bebida ou alimento pelo tipo de receita
    const tipoNome = receita.tipo_receita?.nome?.toLowerCase() || '';
    const isBebida = tipoNome.includes('bebida') || tipoNome.includes('drink') || tipoNome.includes('suco') || tipoNome.includes('cocktail');

    if (isBebida) {
      receitaBebidas += receitaTotal;
      cmvBebidas += cmvTotal;
    } else {
      receitaAlimentos += receitaTotal;
      cmvAlimentos += cmvTotal;
    }

    vendasPorReceita.push({
      id: receita.id,
      nome: receita.nome,
      quantidadeVendida: qtd,
      precoVenda: preco,
      custoTeorico: custoUnitario,
      margem: preco - custoUnitario,
      receitaTotal,
    });
  }

  return { receitaAlimentos, receitaBebidas, cmvAlimentos, cmvBebidas, vendasPorReceita };
}

/**
 * Carrega despesas por subtipo USAR do plano de contas.
 */
async function loadDespesasData(
  clienteId: string,
  unidadeId: string,
  mesAno: string
): Promise<{
  custoMaoDeObra: number;
  custosControlaveis: number;
  custoOcupacao: number;
  outrasDespesas: number;
  custoDesperdicioEstoque: number;
  totalDespesas: number;
  despesasDetalhe: { nome: string; valor: number; subtipo: string }[];
}> {
  const { start, end } = getMonthRange(mesAno);

  // Buscar todas as transações do mês (MANUAL + ESTOQUE) com seus lançamentos e contas
  const { data: lancamentos, error } = await (supabase as any)
    .from('fin_lancamentos')
    .select(`
      valor,
      tipo_lancamento,
      conta_id,
      fin_contas!inner (
        nome,
        subtipo_usar,
        comportamento_custo
      ),
      fin_transacoes!inner (
        data_competencia,
        unidade_id,
        origem_modulo
      )
    `)
    .eq('fin_transacoes.unidade_id', unidadeId)
    .eq('tipo_lancamento', 'DEBITO')
    .gte('fin_transacoes.data_competencia', start)
    .lte('fin_transacoes.data_competencia', end);

  if (error || !lancamentos) {
    console.error('Erro ao carregar despesas:', error);
    return {
      custoMaoDeObra: 0, custosControlaveis: 0, custoOcupacao: 0,
      outrasDespesas: 0, custoDesperdicioEstoque: 0, totalDespesas: 0,
      despesasDetalhe: [],
    };
  }

  let custoMaoDeObra = 0;
  let custosControlaveis = 0;
  let custoOcupacao = 0;
  let outrasDespesas = 0;
  let custoDesperdicioEstoque = 0;
  const detalheMap: Record<string, { nome: string; valor: number; subtipo: string }> = {};

  for (const l of lancamentos as any[]) {
    const valor = Number(l.valor) || 0;
    const subtipo = l.fin_contas?.subtipo_usar || 'NAO_APLICAVEL';
    const nome = l.fin_contas?.nome || 'Sem Nome';
    const origemModulo = l.fin_transacoes?.origem_modulo;

    // Acumular por subtipo USAR
    switch (subtipo) {
      case 'CUSTO_MAO_DE_OBRA':
        custoMaoDeObra += valor;
        break;
      case 'CUSTOS_CONTROLAVEIS':
        custosControlaveis += valor;
        break;
      case 'CUSTO_OCUPACAO':
        custoOcupacao += valor;
        break;
      case 'CUSTO_DESPERDICIO':
        custoDesperdicioEstoque += valor;
        break;
      case 'CMV_ALIMENTOS':
      case 'CMV_BEBIDAS':
        // CMV vem do cálculo de vendas, não das despesas diretas
        // Mas se houver CMV registrado pelo trigger de compra, contabilizar
        if (origemModulo === 'ESTOQUE') {
          // Já contabilizado pelo CMV de vendas, skip to avoid double counting
          break;
        }
        outrasDespesas += valor;
        break;
      default:
        outrasDespesas += valor;
        break;
    }

    // Detalhe por conta
    const key = l.conta_id;
    if (!detalheMap[key]) {
      detalheMap[key] = { nome, valor: 0, subtipo };
    }
    detalheMap[key].valor += valor;
  }

  const totalDespesas = custoMaoDeObra + custosControlaveis + custoOcupacao + outrasDespesas + custoDesperdicioEstoque;

  return {
    custoMaoDeObra,
    custosControlaveis,
    custoOcupacao,
    outrasDespesas,
    custoDesperdicioEstoque,
    totalDespesas,
    despesasDetalhe: Object.values(detalheMap),
  };
}

/**
 * Carrega resumo de contas a pagar e aging.
 */
async function loadContasAPagar(
  unidadeId: string,
  mesAno: string
): Promise<DashboardData['contasAPagar']> {
  const { start, end } = getMonthRange(mesAno);
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('fin_transacoes')
    .select('id, descricao, valor_total, data_vencimento, data_competencia, data_pagamento, origem_modulo')
    .eq('unidade_id', unidadeId)
    .or(`data_vencimento.gte.${start},data_competencia.gte.${start}`)
    .order('data_vencimento', { ascending: true });

  if (error || !data) {
    console.error('Erro ao carregar contas a pagar:', error);
    return { totalPendente: 0, totalPago: 0, totalVencido: 0, totalAVencer: 0, countPendente: 0, countPago: 0, countVencido: 0, items: [] };
  }

  // Filtrar para o mês correto
  const filtered = (data as any[]).filter((t: any) => {
    const dateToUse = t.data_vencimento || t.data_competencia;
    return dateToUse >= start && dateToUse <= end;
  });

  let totalPendente = 0;
  let totalPago = 0;
  let totalVencido = 0;
  let totalAVencer = 0;
  let countPendente = 0;
  let countPago = 0;
  let countVencido = 0;
  const items: ContaPagarItem[] = [];

  for (const t of filtered) {
    const valor = Number(t.valor_total) || 0;
    const dataVenc = t.data_vencimento || t.data_competencia;

    if (t.data_pagamento) {
      totalPago += valor;
      countPago++;
    } else {
      totalPendente += valor;
      countPendente++;
      if (dataVenc < today) {
        totalVencido += valor;
        countVencido++;
      } else {
        totalAVencer += valor;
      }
    }

    items.push({
      id: t.id,
      descricao: t.descricao,
      valor,
      dataVencimento: dataVenc,
      dataPagamento: t.data_pagamento,
      origemModulo: t.origem_modulo,
    });
  }

  return { totalPendente, totalPago, totalVencido, totalAVencer, countPendente, countPago, countVencido, items };
}

/**
 * Carrega dados de vendas de plataformas de delivery (iFood, Rappi, etc).
 */
async function loadDeliverySalesData(
  clienteId: string,
  mesAno: string
): Promise<{
  receitaBruta: number;
  taxaPlataforma: number;
  pedidosTotal: number;
}> {
  const competencia = mesAno + '-01';

  const { data, error } = await supabase
    .from('fin_vendas_delivery')
    .select('receita_bruta, taxa_plataforma, pedidos_total')
    .eq('cliente_id', clienteId)
    .eq('mes_ano', competencia);

  if (error || !data) {
    if (error) console.error('Erro ao carregar vendas delivery:', error);
    return { receitaBruta: 0, taxaPlataforma: 0, pedidosTotal: 0 };
  }

  const totals = (data as any[]).reduce((acc, curr) => ({
    receitaBruta: acc.receitaBruta + (Number(curr.receita_bruta) || 0),
    taxaPlataforma: acc.taxaPlataforma + (Number(curr.taxa_plataforma) || 0),
    pedidosTotal: acc.pedidosTotal + (Number(curr.pedidos_total) || 0),
  }), { receitaBruta: 0, taxaPlataforma: 0, pedidosTotal: 0 });

  return totals;
}

// ── DRE Builder ────────────────────────────────────────

/**
 * Monta a árvore DRE no padrão USAR a partir dos dados reais.
 */
export function buildDreUSAR(data: DashboardData, taxConfig: TaxConfig): DreNode[] {
  const receitaBruta = data.receitaBrutaTotal;
  if (receitaBruta === 0) return [];

  const pct = (val: number) => receitaBruta > 0 ? (val / receitaBruta) * 100 : 0;

  // Calcular impostos
  const taxResult = calculateBrazilianTaxes(
    receitaBruta,
    taxConfig.beverageRevenuePercent,
    taxConfig.taxRegime,
    taxConfig.estimatedRate
  );

  // Calcular MDR/Antecipação
  const leakage = calculateCashLeakage(
    receitaBruta,
    taxConfig.mdrRatePercent,
    taxConfig.anticipationRatePercent,
    taxConfig.daysAnticipated
  );

  const deducoes = taxResult.totalTaxes + leakage.mdrCost + leakage.anticipationCost + data.taxasPlataformaDelivery;
  const receitaLiquida = receitaBruta - deducoes;
  const cmvTotal = data.cmvTotal;
  const laborTotal = data.custoMaoDeObra;
  const primeCost = cmvTotal + laborTotal;
  const lucroBruto = receitaLiquida - cmvTotal;
  const controlaveisTotal = data.custosControlaveis;
  const ocupacaoTotal = data.custoOcupacao;
  const gop = lucroBruto - laborTotal - controlaveisTotal;
  const ebitda = gop - ocupacaoTotal;

  // Agrupar despesas controláveis por nome
  const despControlaveis = data.despesasDetalhe
    .filter(d => d.subtipo === 'CUSTOS_CONTROLAVEIS')
    .map((d, i) => ({ id: `8.${i + 1}`, name: d.nome, value: -d.valor }));

  // Agrupar mão de obra por nome
  const despLabor = data.despesasDetalhe
    .filter(d => d.subtipo === 'CUSTO_MAO_DE_OBRA')
    .map((d, i) => ({ id: `5.${i + 1}`, name: d.nome, value: -d.valor }));

  const dreNodes: DreNode[] = [
    {
      id: '1', name: 'Receita Bruta Total', value: receitaBruta, percentage: 100, isTotal: true,
      children: [
        { id: '1.1', name: 'Vendas Loja (Alimentos)', value: data.receitaBrutaAlimentos, percentage: pct(data.receitaBrutaAlimentos) },
        { id: '1.2', name: 'Vendas Loja (Bebidas)', value: data.receitaBrutaBebidas, percentage: pct(data.receitaBrutaBebidas) },
        { id: '1.3', name: 'Vendas Delivery (Plataformas)', value: data.receitaBrutaDelivery, percentage: pct(data.receitaBrutaDelivery) },
      ]
    },
    {
      id: '2', name: '(-) Deduções da Receita Bruta', value: -deducoes, percentage: pct(deducoes), isTotal: false,
      children: [
        { id: '2.1', name: 'Impostos (Estimativa Fiscal)', value: -taxResult.totalTaxes },
        { id: '2.2', name: 'Taxas Adquirentes (Estimativa MDR Loja)', value: -leakage.mdrCost },
        { id: '2.3', name: 'Comissões Delivery (Lançamento Manual/Apps)', value: -data.taxasPlataformaDelivery },
        ...(leakage.anticipationCost > 0 ? [{ id: '2.4', name: 'Custo Antecipação (Estimativa)', value: -leakage.anticipationCost }] : []),
      ]
    },
    { id: '3', name: 'Receita Líquida (Net Sales)', value: receitaLiquida, percentage: pct(receitaLiquida), isTotal: true },
    {
      id: '4', name: 'Custo de Mercadoria Vendida (CMV)', value: -cmvTotal, percentage: pct(cmvTotal), isTotal: true,
      children: [
        { id: '4.1', name: 'CMV Loja (Calculado por Ficha Técnica)', value: -data.cmvTotal },
        ...(data.custoDesperdicioEstoque > 0 ? [{ id: '4.2', name: 'Desperdício/Perda (Estoque)', value: -data.custoDesperdicioEstoque }] : []),
      ]
    },
    {
      id: '5', name: laborTotal > 0 ? 'Custo de Mão de Obra Total (Labor)' : 'Custo de Mão de Obra (Pendente Lançamento)', 
      value: -laborTotal, percentage: pct(laborTotal), isTotal: true,
      children: despLabor.length > 0 ? despLabor : [
        { id: '5.1', name: 'Sem lançamentos detectados', value: 0 },
      ]
    },
    { id: '6', name: 'PRIME COST (CMV + Labor)', value: -primeCost, percentage: pct(primeCost), isTotal: true },
    { id: '7', name: 'Lucro Operacional Bruto', value: lucroBruto - laborTotal, percentage: pct(lucroBruto - laborTotal), isTotal: true },
    {
      id: '8', name: controlaveisTotal > 0 ? 'Despesas Controláveis' : 'Despesas Controláveis (Pendente Lançamento)', 
      value: -controlaveisTotal, percentage: pct(controlaveisTotal), isTotal: true,
      children: despControlaveis.length > 0 ? despControlaveis : [
        { id: '8.1', name: 'Sem despesas controláveis detectadas', value: 0 },
      ]
    },
    { id: '9', name: 'GOP (Gross Operating Profit)', value: gop, percentage: pct(gop), isTotal: true },
    { 
      id: '10', name: ocupacaoTotal > 0 ? 'Custo de Ocupação' : 'Custo de Ocupação (Pendente Lançamento)', 
      value: -ocupacaoTotal, percentage: pct(ocupacaoTotal), isTotal: true 
    },
    { id: '11', name: 'EBITDA (Fluxo Operacional)', value: ebitda, percentage: pct(ebitda), isTotal: true },
  ];

  return dreNodes;
}

// ── Main Loader ────────────────────────────────────────

/**
 * Carrega todos os dados financeiros necessários para o Dashboard Executivo.
 */
export async function loadDashboardData(
  clienteId: string,
  unidadeId: string,
  mesAno: string // 'YYYY-MM'
): Promise<DashboardData> {
  // Carregar dados em paralelo
  const [vendasResult, despesasResult, contasResult, deliveryResult] = await Promise.all([
    loadVendasData(clienteId, mesAno),
    loadDespesasData(clienteId, unidadeId, mesAno),
    loadContasAPagar(unidadeId, mesAno),
    loadDeliverySalesData(clienteId, mesAno),
  ]);

  return {
    receitaBrutaAlimentos: vendasResult.receitaAlimentos,
    receitaBrutaBebidas: vendasResult.receitaBebidas,
    receitaBrutaDelivery: deliveryResult.receitaBruta,
    receitaBrutaTotal: vendasResult.receitaAlimentos + vendasResult.receitaBebidas + deliveryResult.receitaBruta,
    taxasPlataformaDelivery: deliveryResult.taxaPlataforma,
    pedidosDelivery: deliveryResult.pedidosTotal,
    cmvAlimentos: vendasResult.cmvAlimentos,
    cmvBebidas: vendasResult.cmvBebidas,
    cmvTotal: vendasResult.cmvAlimentos + vendasResult.cmvBebidas,
    custoMaoDeObra: despesasResult.custoMaoDeObra,
    custosControlaveis: despesasResult.custosControlaveis,
    custoOcupacao: despesasResult.custoOcupacao,
    outrasDespesas: despesasResult.outrasDespesas,
    custoDesperdicioEstoque: despesasResult.custoDesperdicioEstoque,
    totalDespesas: despesasResult.totalDespesas,
    despesasDetalhe: despesasResult.despesasDetalhe,
    contasAPagar: contasResult,
    vendasPorReceita: vendasResult.vendasPorReceita,
    mesAno,
  };
}

/**
 * Prepara dados para a Curva ABC a partir das vendas.
 */
export function prepareAbcData(vendas: VendaReceita[]): ABCEntry[] {
  const items = vendas
    .filter(v => v.receitaTotal > 0)
    .map(v => ({ id: v.id, name: v.nome, value: v.receitaTotal }));
  return calculateABCCurve(items);
}

/**
 * Prepara dados para a Engenharia de Cardápio (BCG/Kasavana).
 */
export function prepareBcgData(vendas: VendaReceita[]): MenuEngineeringResults | null {
  const items: MenuItemEngineering[] = vendas
    .filter(v => v.quantidadeVendida > 0 && v.precoVenda > 0)
    .map(v => ({
      id: v.id,
      name: v.nome,
      price: v.precoVenda,
      cost: v.custoTeorico,
      quantitySold: v.quantidadeVendida,
    }));

  if (items.length === 0) return null;
  return analyzeMenuEngineering(items);
}
