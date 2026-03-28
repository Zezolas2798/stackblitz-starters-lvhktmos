'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Container, useTheme, alpha,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Chip, CircularProgress, Divider, Collapse, IconButton, Tooltip,
  Tabs, Tab
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, Package, Warehouse, ChevronDown, ChevronRight,
  AlertTriangle, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';

// Paleta premium de cores para categorias
const COLORS = [
  '#0f766e', '#0284c7', '#7c3aed', '#c026d3', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'
];

interface LoteComValor {
  id: string;
  nome: string;
  categoria: string;
  local: string;
  qtd_atual_g: number;
  qtd_inicial_g: number;
  valor_total_lote: number;
  valor_atual_estimado: number;
  unidade: string;
  grupo?: string;
}

export default function AnaliseFinanceiraEstoquePage() {
  const theme = useTheme();
  const { unidadeId, activeClientId } = useClient();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [lotes, setLotes] = useState<LoteComValor[]>([]);
  const [perdas, setPerdas] = useState<any[]>([]);
  const [movsDescarte, setMovsDescarte] = useState<any[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [expandedLocal, setExpandedLocal] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (unidadeId) {
      loadData();
      loadPerdasData();
    }
  }, [unidadeId]);

  async function loadData() {
    setLoading(true);
    try {
      const [lotesRes, catRes] = await Promise.all([
        (supabase as any)
          .from('lotes_estoque')
          .select(`
            id, categoria_produto, quantidade_atual_g_ml, quantidade_inicial_g_ml,
            valor_unitario, valor_total, unidade_peso_embalagem,
            ingredientes(nome, preco_ultima_compra, ingredientes_grupos(nome)),
            materiais(nome, tipo_material, marca, categoria_id),
            cliente_locais_estoque(nome)
          `)
          .eq('unidade_id', unidadeId)
          .is('deleted_at', null)
          .neq('status', 'REJEITADO')
          .neq('status', 'PREVISTO')
          .gt('quantidade_atual_g_ml', 0),
        (supabase as any)
          .from('cliente_categorias_produto')
          .select('id, nome')
          .eq('cliente_id', activeClientId)
      ]);

      if (lotesRes.error) throw lotesRes.error;

      const mapped: LoteComValor[] = (lotesRes.data || []).map((l: any) => {
        const ingrediente = Array.isArray(l.ingredientes) ? l.ingredientes[0] : l.ingredientes;
        const material = Array.isArray(l.materiais) ? l.materiais[0] : l.materiais;
        const qtdAtual = Number(l.quantidade_atual_g_ml) || 0;
        const qtdInicial = Number(l.quantidade_inicial_g_ml) || 1;
        const valorTotal = Number(l.valor_total) || 0;

        // Calcular valor atual proporcional
        let valorAtual = 0;
        if (valorTotal > 0 && qtdInicial > 0) {
          valorAtual = valorTotal * (qtdAtual / qtdInicial);
        } else if (ingrediente?.preco_ultima_compra) {
          // Fallback: usar preço última compra como estimativa por Kg
          const precoKg = Number(ingrediente.preco_ultima_compra);
          valorAtual = (qtdAtual / 1000) * precoKg;
        }

        // Determinar categoria canônica
        const catMap: Record<string, string> = {
          'ALIMENTOS': 'Alimentos (Insumos)',
          'EMBALAGENS': 'Embalagens',
          'LIMPEZA': 'Produtos de Limpeza',
          'MANUTENCAO': 'Outros',
          'UTENSILIOS': 'Utensílios',
          'EPI_EPC': 'EPI/EPC',
          'UNIFORMES': 'Uniformes',
          'PRIMEIROS_SOCORROS': 'Primeiros socorros'
        };

        let categoria = 'Outros';
        if (ingrediente) {
          categoria = 'Alimentos (Insumos)';
        } else if (l.categoria_produto && catMap[l.categoria_produto]) {
          categoria = catMap[l.categoria_produto];
        } else if (material) {
          const typeToCat: Record<string, string> = {
            'EMBALAGEM': 'Embalagens',
            'LIMPEZA': 'Produtos de Limpeza',
            'UTENSILIO': 'Utensílios',
            'EPI_EPC': 'EPI/EPC',
            'UNIFORME': 'Uniformes',
            'PRIMEIROS_SOCORROS': 'Primeiros socorros'
          };
          categoria = typeToCat[material.tipo_material] || 'Outros';
        }

        // Determinar grupo (subcategoria)
        let grupoNome = 'Outros';
        if (ingrediente) {
          grupoNome = ingrediente.ingredientes_grupos?.nome || 'Outros';
        } else if (material) {
          const subcat = catRes.data?.find((c: any) => c.id === material.categoria_id);
          grupoNome = subcat?.nome || material.marca || 'Geral';
        }

        return {
          id: l.id,
          nome: ingrediente?.nome || material?.nome || 'Desconhecido',
          categoria,
          grupo: grupoNome || 'Outros',
          local: l.cliente_locais_estoque?.nome || 'Geral',
          qtd_atual_g: qtdAtual,
          qtd_inicial_g: qtdInicial,
          valor_total_lote: valorTotal,
          valor_atual_estimado: Math.round(valorAtual * 100) / 100,
          unidade: l.unidade_peso_embalagem || 'g'
        };
      });

      setLotes(mapped);
    } catch (err: any) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPerdasData() {
    try {
      // 1. Produção Perdas
      const { data: pData } = await (supabase as any)
        .from('producao_perdas')
        .select(`
          *,
          ingredientes(nome, preco_ultima_compra)
        `)
        .eq('unidade_id', unidadeId)
        .order('created_at', { ascending: false });

      setPerdas(pData || []);

      // 2. Movimentações de Descarte do Estoque
      const { data: mData } = await (supabase as any)
        .from('estoque_movimentacoes')
        .select(`
          *,
          lotes_estoque(
            id, valor_unitario, valor_total, quantidade_inicial_g_ml,
            ingredientes(nome), materiais(nome)
          )
        `)
        .eq('tipo_movimento', 'SAIDA')
        .or('justificativa.ilike.%descarte%,justificativa.ilike.%vencid%,justificativa.ilike.%perda%')
        .limit(50);

      setMovsDescarte(mData || []);
    } catch (err) {
      console.error('Erro ao carregar perdas:', err);
    }
  }

  // Metrics
  const totalCapital = useMemo(() => lotes.reduce((sum, l) => sum + l.valor_atual_estimado, 0), [lotes]);
  const totalLotes = lotes.length;

  // Loss Metrics
  const totalPerdaProducao = useMemo(() => 
    perdas.reduce((sum, p) => sum + (Number(p.custo_estimado) || 0), 0), 
  [perdas]);

  const totalPerdaEstoque = useMemo(() => {
    return movsDescarte.reduce((sum, m) => {
      const lote = m.lotes_estoque;
      if (!lote) return sum;
      const valorUnit = Number(lote.valor_unitario) || 0;
      const qtdMov = Math.abs(Number(m.quantidade_movimentada) || 0);
      return sum + (valorUnit * qtdMov / 1000); // Supondo que valor_unitario é por Kg
    }, 0);
  }, [movsDescarte]);

  const totalPrejuizo = totalPerdaProducao + totalPerdaEstoque;

  // Group by category with nested groups
  const porCategoria = useMemo(() => {
    const categories: Record<string, { 
      nome: string; 
      valorTotal: number; 
      qtdLotes: number; 
      grupos: Record<string, { nome: string; valor: number; qtd: number; lotes: LoteComValor[] }> 
    }> = {};

    lotes.forEach(l => {
      if (!categories[l.categoria]) {
        categories[l.categoria] = { nome: l.categoria, valorTotal: 0, qtdLotes: 0, grupos: {} };
      }
      categories[l.categoria].valorTotal += l.valor_atual_estimado;
      categories[l.categoria].qtdLotes += 1;

      const gNome = l.grupo || 'Outros';
      if (!categories[l.categoria].grupos[gNome]) {
        categories[l.categoria].grupos[gNome] = { nome: gNome, valor: 0, qtd: 0, lotes: [] };
      }
      categories[l.categoria].grupos[gNome].valor += l.valor_atual_estimado;
      categories[l.categoria].grupos[gNome].qtd += 1;
      categories[l.categoria].grupos[gNome].lotes.push(l);
    });

    return Object.values(categories).map(cat => ({
      ...cat,
      gruposArray: Object.values(cat.grupos).sort((a, b) => b.valor - a.valor)
    })).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [lotes]);

  // Group by location
  const porLocal = useMemo(() => {
    const grupos: Record<string, { nome: string; valor: number; qtd: number; lotes: LoteComValor[] }> = {};
    lotes.forEach(l => {
      if (!grupos[l.local]) {
        grupos[l.local] = { nome: l.local, valor: 0, qtd: 0, lotes: [] };
      }
      grupos[l.local].valor += l.valor_atual_estimado;
      grupos[l.local].qtd += 1;
      grupos[l.local].lotes.push(l);
    });
    return Object.values(grupos).sort((a, b) => b.valor - a.valor);
  }, [lotes]);

  // Pie chart data for categories
  const pieData = porCategoria.map(c => ({ name: c.nome, value: Math.round(c.valorTotal * 100) / 100 }));

  // Bar chart data for locations
  const barData = porLocal.map(l => ({ name: l.nome, valor: Math.round(l.valor * 100) / 100 }));

  // Loss chart data
  const lossReasonData = [
    { name: 'Descarte Estoque', value: totalPerdaEstoque },
    { name: 'Perda Produção', value: totalPerdaProducao }
  ];

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtQtd = (g: number, un?: string) => {
    if (un === 'UN') return `${Math.round(g)} Un`;
    if (g >= 1000) return `${(g / 1000).toFixed(2)} Kg`;
    return `${g.toFixed(0)} g`;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center', py: 20 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>Carregando análise financeira...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
          Análise Financeira de Estoque
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Capital investido e perdas — Visão em tempo real das movimentações financeiras.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} aria-label="Abas de análise">
          <Tab label="Investimento Imobilizado" sx={{ fontWeight: 'bold' }} />
          <Tab label="Descartes e Perdas" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        <>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 3, borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DollarSign size={20} />
                  <Typography variant="overline" sx={{ opacity: 0.8 }}>Capital Total em Estoque</Typography>
                </Box>
                <Typography variant="h3" fontWeight="900">{fmtBRL(totalCapital)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{totalLotes} lotes ativos em {porLocal.length} locais</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'warning.main' }}>
                  <Package size={20} />
                  <Typography variant="overline">Maior Categoria</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">{porCategoria[0]?.nome || '—'}</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">{fmtBRL(porCategoria[0]?.valorTotal || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">{porCategoria[0]?.qtdLotes || 0} lotes</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'success.main' }}>
                  <Warehouse size={20} />
                  <Typography variant="overline">Maior Local</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">{porLocal[0]?.nome || '—'}</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">{fmtBRL(porLocal[0]?.valor || 0)}</Typography>
                <Typography variant="caption" color="text.secondary">{porLocal[0]?.qtd || 0} lotes</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Distribuição por Categoria</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(v: any) => fmtBRL(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Capital por Local de Estoque</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `R$${(v / 1).toFixed(0)}`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <RTooltip formatter={(v: any) => fmtBRL(Number(v))} />
                      <Bar dataKey="valor" fill={theme.palette.primary.main} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Detailed Breakdown by Category */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Detalhamento por Categoria
            </Typography>
            {porCategoria.map((cat, idx) => {
              const isExpCat = expandedCat === cat.nome;
              const pct = totalCapital > 0 ? ((cat.valorTotal / totalCapital) * 100).toFixed(1) : '0';

              return (
                <Box key={cat.nome} sx={{ mb: 1 }}>
                  <Box
                    onClick={() => setExpandedCat(isExpCat ? null : cat.nome)}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      p: 2, cursor: 'pointer', borderRadius: 2,
                      bgcolor: isExpCat ? alpha(COLORS[idx % COLORS.length], 0.08) : 'transparent',
                      '&:hover': { bgcolor: alpha(COLORS[idx % COLORS.length], 0.05) },
                      border: '1px solid', borderColor: isExpCat ? alpha(COLORS[idx % COLORS.length], 0.3) : 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {isExpCat ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                      <Typography variant="subtitle1" fontWeight="bold">{cat.nome}</Typography>
                      <Chip label={`${cat.qtdLotes} lotes`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={`${pct}%`}
                        size="small"
                        sx={{ bgcolor: alpha(COLORS[idx % COLORS.length], 0.1), color: COLORS[idx % COLORS.length], fontWeight: 'bold' }}
                      />
                      <Typography variant="h6" fontWeight="bold" color="primary.main">{fmtBRL(cat.valorTotal)}</Typography>
                    </Box>
                  </Box>

                  <Collapse in={isExpCat}>
                    <Box sx={{ ml: 4, mt: 1 }}>
                      {cat.gruposArray.map((grupo) => {
                        const isExpGrp = expandedGroup === `${cat.nome}-${grupo.nome}`;
                        return (
                          <Box key={grupo.nome} sx={{ mb: 1 }}>
                            <Box
                              onClick={() => setExpandedGroup(isExpGrp ? null : `${cat.nome}-${grupo.nome}`)}
                              sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                p: 1.5, cursor: 'pointer', borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' },
                                borderLeft: '4px solid', borderLeftColor: alpha(COLORS[idx % COLORS.length], 0.4)
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {isExpGrp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <Typography variant="body1" fontWeight="bold">{grupo.nome}</Typography>
                                <Chip label={`${grupo.qtd} itens`} size="small" sx={{ fontSize: '0.65rem' }} />
                              </Box>
                              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                                {fmtBRL(grupo.valor)}
                              </Typography>
                            </Box>

                            <Collapse in={isExpGrp}>
                              <TableContainer sx={{ ml: 2, my: 1 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtd</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {grupo.lotes.map((l: any) => (
                                      <TableRow key={l.id} hover>
                                        <TableCell><Typography variant="body2">{l.nome}</Typography></TableCell>
                                        <TableCell align="right">{fmtQtd(l.qtd_atual_g, l.unidade)}</TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                                            {fmtBRL(l.valor_atual_estimado)}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Paper>

          {/* Breakdown by Location */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              <MapPin size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
              Detalhamento por Local de Estoque
            </Typography>
            {porLocal.map((loc) => {
              const isExpLoc = expandedLocal === loc.nome;
              const pct = totalCapital > 0 ? ((loc.valor / totalCapital) * 100).toFixed(1) : '0';

              return (
                <Box key={loc.nome} sx={{ mb: 1 }}>
                  <Box
                    onClick={() => setExpandedLocal(isExpLoc ? null : loc.nome)}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      p: 2, cursor: 'pointer', borderRadius: 2,
                      bgcolor: isExpLoc ? alpha(theme.palette.info.main, 0.06) : 'transparent',
                      border: '1px solid', borderColor: isExpLoc ? alpha(theme.palette.info.main, 0.3) : 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {isExpLoc ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <MapPin size={16} />
                      <Typography variant="subtitle1" fontWeight="bold">{loc.nome}</Typography>
                      <Chip label={`${loc.qtd} lotes`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip label={`${pct}%`} size="small" />
                      <Typography variant="h6" fontWeight="bold" color="primary.main">{fmtBRL(loc.valor)}</Typography>
                    </Box>
                  </Box>
                  <Collapse in={isExpLoc}>
                    <TableContainer sx={{ ml: 4, mr: 2, my: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow><TableCell>Produto</TableCell><TableCell align="right">Valor</TableCell></TableRow>
                        </TableHead>
                        <TableBody>
                          {loc.lotes.map(l => (
                            <TableRow key={l.id}><TableCell>{l.nome}</TableCell><TableCell align="right">{fmtBRL(l.valor_atual_estimado)}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </Box>
              );
            })}
          </Paper>
        </>
      ) : (
        <>
          {/* Loss KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 3, borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                color: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUp size={20} />
                  <Typography variant="overline" sx={{ opacity: 0.8 }}>Prejuízo Total (Acumulado)</Typography>
                </Box>
                <Typography variant="h3" fontWeight="900">{fmtBRL(totalPrejuizo)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Stock: {fmtBRL(totalPerdaEstoque)} | Prod: {fmtBRL(totalPerdaProducao)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'error.main' }}>
                  <AlertTriangle size={20} />
                  <Typography variant="overline">Ocorrências de Perda</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">{(perdas.length + movsDescarte.length)} Ocorrências</Typography>
                <Typography variant="body2" color="text.secondary">Total acumulado de registros de desperdício.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'info.main' }}>
                  <Package size={20} />
                  <Typography variant="overline">Impacto no Patrimônio</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {totalCapital > 0 ? ((totalPrejuizo / (totalCapital + totalPrejuizo)) * 100).toFixed(1) : '0'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">Percentual de capital perdido vs total imobilizado.</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Loss Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Distribuição por Origem</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={lossReasonData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {lossReasonData.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(v: any) => fmtBRL(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Prejuízo: Estoque vs Produção</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Estoque', valor: totalPerdaEstoque },
                      { name: 'Produção', valor: totalPerdaProducao }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `R$${(v / 1).toFixed(0)}`} />
                      <RTooltip formatter={(v: any) => fmtBRL(Number(v))} />
                      <Bar dataKey="valor" fill={theme.palette.error.main} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Registros de Descarte (Estoque)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Justificativa</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Prejuízo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movsDescarte.map((m: any) => {
                    const lote = m.lotes_estoque;
                    const prej = (Number(lote?.valor_unitario) || 0) * Math.abs(Number(m.quantidade_movimentada) || 0) / 1000;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.data_movimento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{lote?.ingredientes?.nome || lote?.materiais?.nome}</TableCell>
                        <TableCell>{m.justificativa}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>{fmtBRL(prej)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>Perdas na Produção</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Custo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {perdas.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{p.ingredientes?.nome || 'Produção'}</TableCell>
                      <TableCell>{p.motivo_perda}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>{fmtBRL(p.custo_estimado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
}
