'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Container, Tabs, Tab, Paper, Grid, alpha, useTheme,
  TextField, Chip, CircularProgress, Divider, Stack, Collapse, IconButton,
  Accordion, AccordionSummary, AccordionDetails, Alert
} from '@mui/material';
import BulletGraph from '@/components/financeiro/BulletGraph';
import DreStatement, { DreNode } from '@/components/financeiro/DreStatement';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, ScatterChart, Scatter, Cell, ComposedChart, Line, PieChart, Pie
} from 'recharts';
import { TrendingUp, DollarSign, PieChart as PieIcon, Activity, Calendar, Info, Settings, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { ExpandMore } from '@mui/icons-material';
import { useClient } from '@/lib/ClientContext';
import {
  loadDashboardData, buildDreUSAR, prepareAbcData, prepareBcgData,
  DashboardData, TaxConfig, VendaReceita
} from '@/lib/financeiro/dashboardDataService';
import { calculateEstimatedValuation } from '@/lib/financeiro/valuation';
import { ABCEntry } from '@/lib/financeiro/engenhariaCardapio';

// ── Configuração Fiscal Default ────────────────────────
const DEFAULT_TAX_CONFIG: TaxConfig = {
  taxRegime: 'SIMPLES_NACIONAL',
  estimatedRate: 6.0,
  beverageRevenuePercent: 25,
  mdrRatePercent: 2.5,
  anticipationRatePercent: 0,
  daysAnticipated: 0,
};

// ── Badge de proveniência do dado ──────────────────────
const DataBadge = ({ type }: { type: 'real' | 'estimated' | 'empty' }) => {
  if (type === 'real') return (
    <Chip icon={<CheckCircle size={12} />} label="Dado Real" size="small" color="success" variant="outlined"
      sx={{ fontSize: '0.6rem', height: 20, '& .MuiChip-icon': { fontSize: 12 } }} />
  );
  if (type === 'estimated') return (
    <Chip icon={<AlertTriangle size={12} />} label="Estimativa" size="small" color="warning" variant="outlined"
      sx={{ fontSize: '0.6rem', height: 20, '& .MuiChip-icon': { fontSize: 12 } }} />
  );
  return (
    <Chip icon={<Info size={12} />} label="Sem Dados" size="small" variant="outlined"
      sx={{ fontSize: '0.6rem', height: 20, '& .MuiChip-icon': { fontSize: 12 } }} />
  );
};

// ── KPI Card ───────────────────────────────────────────
const KpiCard = ({ title, value, subtitle, color, badge }: {
  title: string; value: string; subtitle?: string; color?: string; badge?: 'real' | 'estimated' | 'empty';
}) => {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{
      p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
      borderLeft: color ? `4px solid ${color}` : undefined,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
        {badge && <DataBadge type={badge} />}
      </Box>
      <Typography variant="h5" fontWeight="900" sx={{ color: color || 'text.primary', mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );
};

export default function FinanceiroDashboardPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dreNodes, setDreNodes] = useState<DreNode[]>([]);
  const [abcData, setAbcData] = useState<ABCEntry[]>([]);
  const [bcgData, setBcgData] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Filtro de mês
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [mesAno, setMesAno] = useState(currentMonth);

  // Configurações fiscais
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const formatCurrencyFull = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  // ── Carregar dados ─────────────────────────────────
  const loadData = useCallback(async () => {
    if (!activeClientId || !unidadeId) return;
    setLoading(true);
    try {
      const result = await loadDashboardData(activeClientId, unidadeId, mesAno);
      setData(result);

      // Montar DRE
      const dre = buildDreUSAR(result, taxConfig);
      setDreNodes(dre);

      // Montar ABC
      const abc = prepareAbcData(result.vendasPorReceita);
      setAbcData(abc);

      // Montar BCG
      const bcg = prepareBcgData(result.vendasPorReceita);
      setBcgData(bcg);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClientId, unidadeId, mesAno, taxConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Métricas derivadas ─────────────────────────────
  const hasRevenue = (data?.receitaBrutaTotal || 0) > 0;
  const receitaBruta = data?.receitaBrutaTotal || 0;
  const cmvTotal = data?.cmvTotal || 0;
  const cmvPercent = receitaBruta > 0 ? (cmvTotal / receitaBruta) * 100 : 0;
  const laborTotal = data?.custoMaoDeObra || 0;
  const laborPercent = receitaBruta > 0 ? (laborTotal / receitaBruta) * 100 : 0;
  const primeCostPercent = cmvPercent + laborPercent;

  // EBITDA from DRE
  const ebitdaNode = dreNodes.find(n => n.id === '11');
  const ebitdaValue = ebitdaNode?.value || 0;
  const ebitdaPercent = receitaBruta > 0 ? (ebitdaValue / receitaBruta) * 100 : 0;
  const ebitdaAnual = ebitdaValue * 12;
  const valuation = calculateEstimatedValuation(ebitdaAnual, 'INDEPENDENTE');

  // Mês formatado
  const mesFormatado = new Date(mesAno + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Painel Executivo Financeiro
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Métricas USAR, Fluxo de Caixa, Valuation e Inteligência de Vendas — {mesFormatado}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            type="month"
            size="small"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            InputProps={{
              startAdornment: <Calendar size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
            }}
            sx={{ minWidth: 180 }}
          />
          <IconButton
            onClick={() => setShowConfig(!showConfig)}
            color={showConfig ? 'primary' : 'default'}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <Settings size={18} />
          </IconButton>
        </Stack>
      </Box>

      {/* CONFIG PANEL (Collapsible) */}
      <Collapse in={showConfig}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#fafbfc' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            <Settings size={16} style={{ marginRight: 8 }} />
            Parâmetros de Cálculo (Estimativas Fiscais e Financeiras)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Regime Tributário"
                select
                fullWidth
                size="small"
                value={taxConfig.taxRegime}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, taxRegime: e.target.value as any }))}
                SelectProps={{ native: true }}
              >
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Alíquota (%)"
                type="number"
                fullWidth
                size="small"
                value={taxConfig.estimatedRate}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, estimatedRate: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="% Bebidas"
                type="number"
                fullWidth
                size="small"
                value={taxConfig.beverageRevenuePercent}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, beverageRevenuePercent: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label="Taxa MDR (%)"
                type="number"
                fullWidth
                size="small"
                value={taxConfig.mdrRatePercent}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, mdrRatePercent: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Antecipação (%/mês)"
                type="number"
                fullWidth
                size="small"
                value={taxConfig.anticipationRatePercent}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, anticipationRatePercent: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* KPI SUMMARY ROW */}
      {hasRevenue && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <KpiCard
              title="Receita Bruta"
              value={formatCurrency(receitaBruta)}
              subtitle={`${data?.vendasPorReceita.length || 0} produtos vendidos`}
              color={theme.palette.primary.main}
              badge="real"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard
              title="CMV"
              value={`${cmvPercent.toFixed(1)}%`}
              subtitle={formatCurrency(cmvTotal)}
              color={cmvPercent <= 33 ? theme.palette.success.main : theme.palette.warning.main}
              badge="real"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard
              title="Prime Cost"
              value={`${primeCostPercent.toFixed(1)}%`}
              subtitle="CMV + Mão de Obra"
              color={primeCostPercent <= 65 ? theme.palette.success.main : theme.palette.error.main}
              badge={laborTotal > 0 ? 'real' : 'estimated'}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard
              title="EBITDA"
              value={`${ebitdaPercent.toFixed(1)}%`}
              subtitle={formatCurrency(ebitdaValue)}
              color={ebitdaPercent >= 15 ? theme.palette.success.main : theme.palette.warning.main}
              badge={hasRevenue ? 'real' : 'empty'}
            />
          </Grid>
        </Grid>
      )}

      {!hasRevenue && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            <b>Nenhuma venda lançada para {mesFormatado}.</b> Lance as vendas em <b>Gestão Financeira → Vendas e Engenharia</b> para ver o DRE e métricas completas.
          </Typography>
        </Alert>
      )}

      {/* TABS (As 4 Visões) */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<DollarSign size={18} />} iconPosition="start" label="1. DRE Gerencial (USAR)" />
        <Tab icon={<Activity size={18} />} iconPosition="start" label="2. Fluxo e Tesouraria" />
        <Tab icon={<TrendingUp size={18} />} iconPosition="start" label="3. Valuation" />
        <Tab icon={<PieIcon size={18} />} iconPosition="start" label="4. Inteligência de Vendas" />
      </Tabs>

      {/* ═══════════════ VISÃO 1: DRE USAR ═══════════════ */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Coluna Esquerda: KPIs com Bullet Graph */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Saudabilidade (Real vs Meta)
                </Typography>
                <DataBadge type={hasRevenue ? 'real' : 'empty'} />
              </Box>

              <BulletGraph
                title="Prime Cost (CMV + Labor)"
                subtitle="O custo principal da operação. O ideal (alvo) é 60%."
                actual={primeCostPercent}
                target={60}
                ranges={[55, 65, 100]}
                format="percent"
                inverseColors={true}
              />

              <BulletGraph
                title="Custo de Mercadoria Vendida (CMV)"
                subtitle="Peso dos insumos. Alvo 30%."
                actual={cmvPercent}
                target={30}
                ranges={[25, 33, 100]}
                format="percent"
                inverseColors={true}
              />

              <BulletGraph
                title="Margem EBITDA"
                subtitle="Geração de caixa operacional. Alvo 15 a 20%."
                actual={ebitdaPercent}
                target={15}
                ranges={[10, 15, 30]}
                format="percent"
                inverseColors={false}
              />

              {laborTotal === 0 && hasRevenue && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 1.5 }}>
                  <Typography variant="caption">
                    <b>Mão de Obra não lançada.</b> Configure a categoria de despesa "Folha de Pagamento" com subtipo <b>CUSTO_MAO_DE_OBRA</b> para incluir no Prime Cost.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Coluna Direita: DRE Statement */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  Demonstrativo de Resultado (Padrão USAR)
                </Typography>
                <Stack direction="row" spacing={1}>
                  <DataBadge type={hasRevenue ? 'real' : 'empty'} />
                  <DataBadge type="estimated" />
                </Stack>
              </Box>
              {dreNodes.length > 0 ? (
                <DreStatement data={dreNodes} />
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">
                    Lance vendas e despesas para gerar o DRE automaticamente.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ═══════════════ VISÃO 2: FLUXO E TESOURARIA ═══════════════ */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Resumo Contas a Pagar */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Contas a Pagar — Resumo
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={18} color={theme.palette.warning.main} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">Pendentes</Typography>
                      <Typography variant="caption" color="text.secondary">{data?.contasAPagar.countPendente || 0} contas</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight="900" color="warning.main">
                    {formatCurrency(data?.contasAPagar.totalPendente || 0)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.08), borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={18} color={theme.palette.error.main} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">Vencidas</Typography>
                      <Typography variant="caption" color="text.secondary">{data?.contasAPagar.countVencido || 0} contas</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight="900" color="error.main">
                    {formatCurrency(data?.contasAPagar.totalVencido || 0)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={18} color={theme.palette.success.main} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">Pagas</Typography>
                      <Typography variant="caption" color="text.secondary">{data?.contasAPagar.countPago || 0} contas</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight="900" color="success.main">
                    {formatCurrency(data?.contasAPagar.totalPago || 0)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Aging / Timeline */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Timeline de Vencimentos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Distribuição dos compromissos por status no mês de {mesFormatado}.
              </Typography>

              {(data?.contasAPagar.items.length || 0) > 0 ? (
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={(() => {
                        const items = data?.contasAPagar.items || [];
                        // Agrupar por data de vencimento
                        const grouped: Record<string, { date: string; pendente: number; pago: number }> = {};
                        items.forEach(item => {
                          const dateKey = item.dataVencimento;
                          if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, pendente: 0, pago: 0 };
                          if (item.dataPagamento) {
                            grouped[dateKey].pago += item.valor;
                          } else {
                            grouped[dateKey].pendente += item.valor;
                          }
                        });
                        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).map(g => ({
                          ...g,
                          date: new Date(g.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => formatCurrencyFull(Number(val || 0))} />
                      <Bar dataKey="pago" name="Pago" stackId="a" fill={theme.palette.success.main} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pendente" name="Pendente" stackId="a" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Activity size={48} style={{ opacity: 0.15, marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">Nenhuma conta a pagar registrada para este mês.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Composição de Despesas */}
          {(data?.despesasDetalhe.length || 0) > 0 && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Composição de Despesas por Categoria USAR
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Mão de Obra', valor: data?.custoMaoDeObra || 0, color: theme.palette.info.main },
                    { label: 'Custos Controláveis', valor: data?.custosControlaveis || 0, color: theme.palette.warning.main },
                    { label: 'Custo de Ocupação', valor: data?.custoOcupacao || 0, color: theme.palette.error.main },
                    { label: 'Outras Despesas', valor: data?.outrasDespesas || 0, color: theme.palette.grey[500] },
                  ].filter(d => d.valor > 0).map((d, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <Box sx={{ p: 2, borderLeft: `4px solid ${d.color}`, bgcolor: alpha(d.color, 0.04), borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">{d.label}</Typography>
                        <Typography variant="h6" fontWeight="bold">{formatCurrency(d.valor)}</Typography>
                        {receitaBruta > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {((d.valor / receitaBruta) * 100).toFixed(1)}% da receita
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* ═══════════════ VISÃO 3: VALUATION ═══════════════ */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  Valuation Estimado
                </Typography>
                <DataBadge type={hasRevenue ? 'estimated' : 'empty'} />
              </Box>
              <Typography variant="h3" fontWeight="900" sx={{ mt: 2, mb: 1 }}>
                {formatCurrency(valuation)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Baseado em 2.5x o EBITDA Anualizado de {formatCurrency(ebitdaAnual)}.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Múltiplo de restaurante independente. Redes usam 4-6x.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">EBITDA Mensal</Typography>
              <Typography variant="h4" fontWeight="bold" color={ebitdaValue >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1, mb: 1 }}>
                {formatCurrency(ebitdaValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Margem: {formatPercent(ebitdaPercent)} — {ebitdaPercent >= 15 ? 'Saudável (≥15%)' : 'Abaixo do ideal (<15%)'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Receita Anualizada</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                {formatCurrency(receitaBruta * 12)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Projeção linear com base no faturamento de {mesFormatado}.
              </Typography>
            </Paper>
          </Grid>

          {/* Breakdown Visual */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Decomposição: De onde vem o EBITDA
              </Typography>
              {hasRevenue ? (
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: 'Receita Líq.', value: dreNodes.find(n => n.id === '3')?.value || 0, fill: theme.palette.success.main },
                        { name: 'CMV', value: -(data?.cmvTotal || 0), fill: theme.palette.error.main },
                        { name: 'Mão de Obra', value: -(data?.custoMaoDeObra || 0), fill: theme.palette.info.main },
                        { name: 'Desp. Controlável', value: -(data?.custosControlaveis || 0), fill: theme.palette.warning.main },
                        { name: 'Ocupação', value: -(data?.custoOcupacao || 0), fill: theme.palette.grey[500] },
                        { name: 'EBITDA', value: ebitdaValue, fill: theme.palette.primary.main },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => formatCurrencyFull(Number(val || 0))} />
                      <ReferenceLine y={0} stroke="#666" />
                      <Bar dataKey="value" name="Valor">
                        {[
                          theme.palette.success.main,
                          theme.palette.error.main,
                          theme.palette.info.main,
                          theme.palette.warning.main,
                          theme.palette.grey[500],
                          theme.palette.primary.main,
                        ].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <TrendingUp size={48} style={{ opacity: 0.15 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Lance vendas e despesas para ver a decomposição do EBITDA.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ═══════════════ VISÃO 4: INTELIGÊNCIA DE VENDAS ═══════════════ */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* CURVA ABC */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  Curva ABC de Faturamento (Pareto)
                </Typography>
                <DataBadge type={abcData.length > 0 ? 'real' : 'empty'} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Análise de concentração de faturamento por produto (Regra 80/15/5).
              </Typography>

              {abcData.length > 0 ? (
                <Box sx={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={abcData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: any) => typeof val === 'number' && val > 100 ? formatCurrencyFull(val) : `${Number(val).toFixed(1)}%`} />
                      <Bar yAxisId="left" dataKey="value" name="Faturamento (R$)" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="Acumulado (%)" stroke={theme.palette.secondary.main} strokeWidth={3} dot={{ fill: theme.palette.secondary.main }} />
                      <ReferenceLine yAxisId="right" y={80} stroke={theme.palette.error.main} strokeDasharray="3 3" label={{ value: 'Cat. A (80%)', position: 'insideTopRight', fill: theme.palette.error.main, fontSize: 10 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <PieIcon size={48} style={{ opacity: 0.15 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Lance vendas para gerar a Curva ABC.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Resumo ABC */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Classificação ABC / Pareto
              </Typography>

              {abcData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { cat: 'A', label: 'Estratégicos (Top 80%)', color: theme.palette.success.main, pct: 80 },
                    { cat: 'B', label: 'Táticos (Próximos 15%)', color: theme.palette.info.main, pct: 15 },
                    { cat: 'C', label: 'Operacionais (Últimos 5%)', color: theme.palette.warning.main, pct: 5 },
                  ].map((row) => {
                    const count = abcData.filter(d => d.category === row.cat).length;
                    const totalVal = abcData.filter(d => d.category === row.cat).reduce((acc, d) => acc + d.value, 0);
                    return (
                      <Box key={row.cat} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.color }} />
                            <Typography variant="subtitle2" fontWeight="bold">Categoria {row.cat}</Typography>
                          </Box>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: row.color }}>{formatCurrency(totalVal)}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          <b>{count}</b> produto(s) — {row.label}.
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Sem dados de vendas.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* BCG Resumo (se existir) */}
          {bcgData && bcgData.items && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  Resumo da Engenharia de Cardápio (Kasavana)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Classificação de produtos pela Matriz BCG Gastronômica. Para a análise detalhada, acesse <b>Vendas e Engenharia</b>.
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Estrelas', desc: 'Alta margem + Alta popularidade', color: theme.palette.success.main, cls: 'ESTRELA' },
                    { label: 'Burros de Carga', desc: 'Baixa margem + Alta popularidade', color: theme.palette.info.main, cls: 'CAVALO_DE_BATALHA' },
                    { label: 'Quebra-Cabeças', desc: 'Alta margem + Baixa popularidade', color: theme.palette.warning.main, cls: 'QUEBRA_CABECA' },
                    { label: 'Cães', desc: 'Baixa margem + Baixa popularidade', color: theme.palette.error.main, cls: 'CAO' },
                  ].map(q => {
                    const items = bcgData.items.filter((i: any) => i.classification === q.cls);
                    return (
                      <Grid item xs={6} sm={3} key={q.cls}>
                        <Box sx={{
                          p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                          bgcolor: alpha(q.color, 0.05),
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: q.color }} />
                            <Typography variant="subtitle2" fontWeight="bold">{q.label}</Typography>
                          </Box>
                          <Typography variant="h5" fontWeight="900" sx={{ color: q.color, mb: 0.5 }}>
                            {items.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{q.desc}</Typography>
                          {items.length > 0 && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 500 }}>
                              {items.map((i: any) => i.name).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
