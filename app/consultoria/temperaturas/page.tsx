'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { calcularFaixaEquipamento, avaliarAfericao, FaixaCalculada } from '@/lib/temperatura/calcularFaixaEquipamento';
import {
  Box, Typography, Container, Paper, Grid, MenuItem, Select, FormControl, 
  InputLabel, CircularProgress, Alert, useTheme, alpha, Stack, TextField, Button,
  Tabs, Tab
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, ReferenceLine, ReferenceArea 
} from 'recharts';
import { Thermometer, Calendar, Filter, ChevronLeft, Download, AlertTriangle, CheckCircle, Plus, Sparkles } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Checkbox
} from '@mui/material';

export default function AnaliseTemperaturasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId, activeClientName } = useClient();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'resfriamento'>('equipamentos');

  // Estados de Equipamentos
  const [loading, setLoading] = useState(true);
  const [equips, setEquips] = useState<any[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [data, setData] = useState<any[]>([]);
  const [planosAcao, setPlanosAcao] = useState<any[]>([]);
  const [selectedDesvios, setSelectedDesvios] = useState<any[]>([]);
  const [openPlanoModal, setOpenPlanoModal] = useState(false);
  const [planoForm, setPlanoForm] = useState({
    equipamento_id: '',
    equipamento_nome: '',
    data_desvio: '',
    datas_exibicao: '',
    causa_raiz: '',
    acao_corretiva: '',
    insights: ''
  });

  // Estados de Resfriamento
  const [resfriamentoLogs, setResfriamentoLogs] = useState<any[]>([]);
  const [resfriamentoLoading, setResfriamentoLoading] = useState(false);
  const [resfriamentoRange, setResfriamentoRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedResfriamentoDesvios, setSelectedResfriamentoDesvios] = useState<any[]>([]);
  const [openResPlanoModal, setOpenResPlanoModal] = useState(false);
  const [resPlanoForm, setResPlanoForm] = useState({
    alimento_nome: '',
    data_desvio: '',
    causa_raiz: '',
    acao_corretiva: '',
    insights: ''
  });

  // 1. Carregar lista de Equipamentos (inclui cálculo de faixa de temperatura)
  useEffect(() => {
    async function loadEquips() {
      if (!unidadeId) return;
      const { data: res } = await supabase
        .from('equipamentos_config')
        .select('id, nome, temp_ideal_min, temp_ideal_max, tipo_equipamento, grupos_permitidos_ids')
        .eq('unidade_id', unidadeId)
        .eq('grupo', 'Temperaturas')
        .not('parent_id', 'is', null);
      
      if (res) {
        const enhanced = await Promise.all(res.map(async (e) => {
          const faixa = await calcularFaixaEquipamento(supabase, e.id);
          return {
            ...e,
            faixa
          };
        }));
        setEquips(enhanced);
      } else {
        setEquips([]);
      }
    }
    loadEquips();
  }, [activeClientId, unidadeId]);

  // 2. Carregar Dados de Controle de Temperatura (Equipamentos)
  useEffect(() => {
    async function fetchData() {
      if (!activeClientId || !unidadeId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('controle_temperatura')
          .select('*, equipamento:equipamentos_config(nome, temp_ideal_min, temp_ideal_max)')
          .eq('cliente_id', activeClientId)
          .eq('unidade_id', unidadeId)
          .order('data', { ascending: true })
          .order('hora_afericao', { ascending: true });

        if (selectedEquip === 'all') {
          // Visão Geral (Cards): buscar últimos 30 dias para todos
          const start30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          query = query.gte('data', start30).lte('data', format(new Date(), 'yyyy-MM-dd'));
        } else {
          // Detalhamento: buscar período específico para 1 equipamento
          query = query.gte('data', dateRange.start).lte('data', dateRange.end).eq('equipamento_id', selectedEquip);
        }

        const { data: res, error } = await query;
        if (error) throw error;
        
        // Resolve regras de temperatura
        const faixasCache = new Map<string, FaixaCalculada | null>();

        const formatted = await Promise.all((res || []).map(async (d) => {
           const cacheKey = `${d.equipamento_id}_${d.receita_id || 'null'}_${d.produto_id || 'null'}`;
           let faixa = faixasCache.get(cacheKey);
           if (!faixasCache.has(cacheKey)) {
               faixa = await calcularFaixaEquipamento(supabase as any, d.equipamento_id as string, d.receita_id, d.produto_id);
               faixasCache.set(cacheKey, faixa || null);
           }
           
           const equipTemp = d.temp_equipamento !== null && d.temp_equipamento !== undefined ? Number(d.temp_equipamento) : null;
           const alimTemp = d.temp_alimento !== null && d.temp_alimento !== undefined ? Number(d.temp_alimento) : null;
           
           const evEquip = avaliarAfericao(equipTemp, faixa, d.equipamento?.temp_ideal_min, d.equipamento?.temp_ideal_max);
           const evAlim = avaliarAfericao(alimTemp, faixa, d.equipamento?.temp_ideal_min, d.equipamento?.temp_ideal_max);
           
           const isOut = (evEquip && !evEquip.isValid) || (evAlim && !evAlim.isValid);

           return {
             ...d,
             displayDate: format(new Date(d.data + 'T00:00:00'), 'dd/MM'),
             fullDateTime: `${format(new Date(d.data + 'T00:00:00'), 'dd/MM')} ${d.hora_afericao?.substring(0, 5) || ''}`,
             temp: equipTemp, // Para o gráfico mantemos a de equipamento
             min: faixa && faixa.min !== null ? faixa.min : d.equipamento?.temp_ideal_min,
             max: faixa && faixa.max !== null ? faixa.max : d.equipamento?.temp_ideal_max,
             tipoRegra: faixa?.tipo_regra,
             isOut,
             evEquip,
             evAlim
           };
        }));

        setData(formatted);

        // Fetch Planos de Ação
        const { data: planosRes } = await supabase
          .from('qual_planos_acao')
          .select('*')
          .eq('cliente_id', activeClientId)
          .eq('unidade_id', unidadeId)
          .eq('origem_modulo', 'PLANILHA_TEMPERATURA');
        
        setPlanosAcao(planosRes || []);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeClientId, unidadeId, selectedEquip, dateRange]);

  // 3. Carregar Dados de Resfriamento
  const loadResfriamentoData = useCallback(async () => {
    if (!activeClientId || !unidadeId) return;
    setResfriamentoLoading(true);
    try {
      const { data: res, error } = await supabase
        .from('controle_resfriamento')
        .select('*')
        .eq('cliente_id', activeClientId)
        .eq('unidade_id', unidadeId)
        .gte('data', resfriamentoRange.start)
        .lte('data', resfriamentoRange.end)
        .order('data', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) throw error;
      setResfriamentoLogs(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setResfriamentoLoading(false);
    }
  }, [activeClientId, unidadeId, resfriamentoRange]);

  useEffect(() => {
    if (activeTab === 'resfriamento') {
      loadResfriamentoData();
    }
  }, [activeTab, loadResfriamentoData]);

  // Estatísticas de Equipamentos
  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, desvios: 0, compliance: '100.0' };
    const desvios = data.filter(d => d.isOut).length;
    return {
      total: data.length,
      desvios,
      compliance: ((data.length - desvios) / data.length * 100).toFixed(1)
    };
  }, [data]);

  // Listar Desvios Pendentes de Equipamentos
  const desviosPendentes = useMemo(() => {
    const pendentes: any[] = [];
    data.forEach(d => {
      if (d.isOut) {
        const refString = `${d.data}_${d.periodo}`;
        const temPlano = planosAcao.some(p => p.origem_id === d.equipamento_id && p.periodo_referencia?.includes(refString));
        if (!temPlano) {
          pendentes.push({
            ...d,
            refString
          });
        }
      }
    });
    return pendentes.sort((a, b) => b.data.localeCompare(a.data));
  }, [data, planosAcao]);

  // Estatísticas de Resfriamento
  const resfriamentoStats = useMemo(() => {
    if (resfriamentoLogs.length === 0) return { total: 0, desvios: 0, compliance: '100.0' };
    const desvios = resfriamentoLogs.filter(d => d.is_out).length;
    return {
      total: resfriamentoLogs.length,
      desvios,
      compliance: ((resfriamentoLogs.length - desvios) / resfriamentoLogs.length * 100).toFixed(1)
    };
  }, [resfriamentoLogs]);

  // Listar Desvios Pendentes de Resfriamento
  const resfriamentoDesviosPendentes = useMemo(() => {
    return resfriamentoLogs.filter(d => d.is_out && (!d.observacao || d.observacao.trim() === ''));
  }, [resfriamentoLogs]);

  const handleSalvarPlano = async () => {
    if (!planoForm.causa_raiz || !planoForm.acao_corretiva) return;
    try {
      const { error } = await supabase.from('qual_planos_acao').insert({
        cliente_id: activeClientId,
        unidade_id: unidadeId,
        origem_modulo: 'PLANILHA_TEMPERATURA',
        origem_id: planoForm.equipamento_id,
        periodo_referencia: planoForm.data_desvio,
        causa_raiz: planoForm.causa_raiz,
        acao_corretiva: planoForm.acao_corretiva,
        insights: planoForm.insights,
        status: 'RESOLVED'
      });
      if (error) throw error;
      
      // Refresh Planos
      const { data: planosRes } = await supabase
        .from('qual_planos_acao')
        .select('*')
        .eq('cliente_id', activeClientId)
        .eq('unidade_id', unidadeId)
        .eq('origem_modulo', 'PLANILHA_TEMPERATURA');
      setPlanosAcao(planosRes || []);
      
      setSelectedDesvios([]);
      setOpenPlanoModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar plano.');
    }
  };

  const handleSalvarResPlano = async () => {
    if (!resPlanoForm.causa_raiz || !resPlanoForm.acao_corretiva) return;
    try {
      // Salva na observação do resfriamento a ação corretiva
      const obsFinal = `[Causa Raiz: ${resPlanoForm.causa_raiz}] • [Ação Corretiva: ${resPlanoForm.acao_corretiva}]${resPlanoForm.insights ? ` • [RT Insights: ${resPlanoForm.insights}]` : ''}`;
      
      const idsToUpdate = selectedResfriamentoDesvios.map(d => d.id);
      
      const { error } = await supabase
        .from('controle_resfriamento')
        .update({ observacao: obsFinal })
        .in('id', idsToUpdate);

      if (error) throw error;
      
      // Também adiciona em qual_planos_acao para consolidar a Central de Controle
      await supabase.from('qual_planos_acao').insert({
        cliente_id: activeClientId,
        unidade_id: unidadeId,
        origem_modulo: 'PLANILHA_RESFRIAMENTO',
        origem_id: idsToUpdate[0], // Vincula ao primeiro registro do desvio
        periodo_referencia: selectedResfriamentoDesvios.map(d => d.data).join(', '),
        causa_raiz: resPlanoForm.causa_raiz,
        acao_corretiva: resPlanoForm.acao_corretiva,
        insights: resPlanoForm.insights,
        status: 'RESOLVED'
      });

      setSelectedResfriamentoDesvios([]);
      setOpenResPlanoModal(false);
      loadResfriamentoData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar plano de resfriamento.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
            <Link href="/consultoria" passHref style={{ textDecoration: 'none' }}>
                <Button startIcon={<ChevronLeft size={18}/>} sx={{ mb: 1, color: 'text.secondary' }}>Voltar ao Hub</Button>
            </Link>
            <Typography variant="h4" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '-0.02em', color: 'primary.main' }}>
                <Thermometer size={32} color={theme.palette.primary.main} /> Central de Controle Térmico
            </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<Download size={18}/>} onClick={() => window.print()}>Exportar PDF</Button>
        </Stack>
      </Box>

      {/* TABS DE SELEÇÃO */}
      <Tabs 
        value={activeTab} 
        onChange={(e, val) => { setActiveTab(val); setSelectedEquip('all'); }} 
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Equipamentos e Alimentos" value="equipamentos" sx={{ fontWeight: 'bold' }} />
        <Tab label="Resfriamento Rápido (RDC 216)" value="resfriamento" sx={{ fontWeight: 'bold' }} />
      </Tabs>

      {/* ABA 1: EQUIPAMENTOS */}
      {activeTab === 'equipamentos' && (
        <>
          {selectedEquip === 'all' ? (
            <>
              <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>Monitores de Equipamentos</Typography>
                  <Typography variant="body1" color="text.secondary">Selecione um equipamento abaixo para detalhar o histórico, analisar gráficos e aplicar planos de ação nos desvios pendentes.</Typography>
              </Box>
              
              {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
              ) : equips.length === 0 ? (
                  <Alert severity="info">Nenhum equipamento configurado para temperatura nesta unidade.</Alert>
              ) : (
                  <Grid container spacing={3}>
                      {equips.map(equip => {
                          const count = desviosPendentes.filter(d => d.equipamento_id === equip.id).length;
                          const faixaDesc = equip.faixa 
                            ? (equip.faixa.min !== null && equip.faixa.max !== null 
                                ? `${equip.faixa.min}ºC a ${equip.faixa.max}ºC` 
                                : equip.faixa.max !== null 
                                  ? `≤ ${equip.faixa.max}ºC` 
                                  : `≥ ${equip.faixa.min}ºC`)
                            : 'Definição da Legislação';

                          const isManual = equip.faixa?.cenario === 'MANUAL';

                          return (
                              <Grid item xs={12} sm={6} md={4} key={equip.id}>
                                  <Paper 
                                      onClick={() => setSelectedEquip(equip.id)}
                                      sx={{ 
                                          p: 3, 
                                          borderRadius: 4, 
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          border: '1px solid',
                                          borderColor: count > 0 ? alpha(theme.palette.error.main, 0.4) : 'divider',
                                          bgcolor: count > 0 ? alpha(theme.palette.error.main, 0.01) : 'background.paper',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                          '&:hover': {
                                              transform: 'translateY(-4px)',
                                              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                              borderColor: theme.palette.primary.main
                                          }
                                      }}
                                  >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{equip.nome}</Typography>
                                          <Chip 
                                              label={count > 0 ? `${count} Desvios` : 'Conforme'} 
                                              color={count > 0 ? 'error' : 'success'}
                                              size="small"
                                              sx={{ fontWeight: 'bold' }}
                                          />
                                      </Box>
                                      <Box sx={{ mt: 1 }}>
                                          <Typography variant="body2" color="text.primary" fontWeight="500">
                                              Faixa da Regra: {faixaDesc}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                              {isManual ? 'Configuração Manual do RT' : `Regra: ${equip.faixa?.regra_aplicada || 'Legislação Aplicada'}`}
                                          </Typography>
                                      </Box>
                                  </Paper>
                              </Grid>
                          );
                      })}
                  </Grid>
              )}
            </>
          ) : (
            <Box>
                {/* BOTÃO VOLTAR E TÍTULO EQUIPAMENTO */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => setSelectedEquip('all')} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                        <ChevronLeft size={20} />
                    </IconButton>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                          {equips.find(e => e.id === selectedEquip)?.nome || 'Equipamento'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Histórico detalhado e conformidade regulatória
                      </Typography>
                    </Box>
                </Box>

                {/* FILTROS DE DATA */}
                <Paper sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={3} alignItems="flex-end">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Início"
                                InputLabelProps={{ shrink: true }}
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Fim"
                                InputLabelProps={{ shrink: true }}
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button fullWidth variant="contained" startIcon={<Filter size={18}/>} sx={{ borderRadius: '8px' }}>Filtrar</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* KPIS EQUIPAMENTO */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                      <Typography variant="overline" color="text.secondary" fontWeight="bold">Aderência Térmica</Typography>
                      <Typography variant="h3" fontWeight="bold" color="success.main">{stats.total > 0 ? stats.compliance + '%' : '--'}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                      <Typography variant="overline" color="text.secondary" fontWeight="bold">Total de Desvios</Typography>
                      <Typography variant="h3" fontWeight="bold" color="error.main">{stats.desvios}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                      <Typography variant="overline" color="text.secondary" fontWeight="bold">Registros Totais</Typography>
                      <Typography variant="h3" fontWeight="bold" color="info.main">{stats.total}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* GRÁFICO EQUIPAMENTO */}
                <Paper sx={{ p: 4, borderRadius: 4, minHeight: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                  ) : data.length === 0 ? (
                    <Alert severity="info" variant="outlined">Nenhum dado encontrado para o período selecionado.</Alert>
                  ) : (
                    <Box sx={{ height: 450 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis 
                            dataKey="fullDateTime" 
                            angle={-45} 
                            textAnchor="end" 
                            interval={Math.ceil(data.length / 12)}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis 
                            domain={[
                              (dataMin: number) => {
                                if (data[0]?.tipoRegra === 'CONGELADO') return Math.min(dataMin, -20);
                                if (data[0]?.min !== undefined) return Math.floor(Math.min(dataMin, data[0].min - 2));
                                return dataMin;
                              },
                              (dataMax: number) => {
                                if (data[0]?.tipoRegra === 'CONGELADO') return Math.max(dataMax, 2);
                                if (data[0]?.max !== undefined) return Math.ceil(Math.max(dataMax, data[0].max + 2));
                                return dataMax;
                              }
                            ]} 
                          />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          
                          {data[0]?.min !== undefined && (
                            <>
                              {data[0]?.tipoRegra === 'CONGELADO' ? (
                                  <>
                                      <ReferenceArea y1={-100} y2={-18} fill="#2196f3" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Excelente (≤ -18ºC)', fill: '#1565c0', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      <ReferenceArea y1={-18} y2={-11} fill="#4caf50" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Bom (≤ -11ºC)', fill: '#2e7d32', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      <ReferenceArea y1={-11} y2={-6} fill="#ffeb3b" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Regular', fill: '#f57f17', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      <ReferenceArea y1={-6} y2={-1} fill="#ff9800" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Atenção', fill: '#e65100', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      <ReferenceArea y1={-1} y2={100} fill="#f44336" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Crítico', fill: '#c62828', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                  </>
                              ) : (
                                  <>
                                      {data[0]?.min !== undefined && (
                                          <ReferenceArea y1={-200} y2={data[0]?.min} fill="#f44336" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      )}
                                      <ReferenceArea 
                                          y1={data[0]?.min ?? -200} 
                                          y2={data[0]?.max ?? 200} 
                                          fill="#4caf50" fillOpacity={0.08} 
                                          label={{ position: 'insideTopLeft', value: 'Conforme', fill: '#2e7d32', fontSize: 10, fontWeight: 'bold' }} 
                                          ifOverflow="hidden"
                                      />
                                      {data[0]?.max !== undefined && (
                                          <ReferenceArea y1={data[0]?.max} y2={200} fill="#f44336" fillOpacity={0.08} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 10, fontWeight: 'bold' }} ifOverflow="hidden" />
                                      )}
                                  </>
                              )}
                              {data[0]?.min !== null && <ReferenceLine y={data[0].min} stroke="orange" strokeDasharray="3 3" />}
                              {data[0]?.max !== null && <ReferenceLine y={data[0].max} stroke="red" strokeDasharray="3 3" />}
                            </>
                          )}

                          <Line 
                            type="monotone" 
                            dataKey="temp" 
                            name="Temperatura (ºC)" 
                            stroke={theme.palette.primary.main} 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>

                {/* DESVIOS PENDENTES DO EQUIPAMENTO */}
                <Box sx={{ mt: 6, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AlertTriangle color={theme.palette.warning.main} size={28} />
                      <Typography variant="h5" fontWeight="bold">Desvios Pendentes de Ação (Equipamento)</Typography>
                    </Box>
                    {selectedDesvios.length > 0 && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Plus size={18}/>}
                        onClick={() => {
                          const equip = selectedDesvios[0].equipamento?.nome || selectedDesvios[0].equipamento_nome || 'Equipamento';
                          const equipId = selectedDesvios[0].equipamento_id;
                          const datas = Array.from(new Set(selectedDesvios.map(d => format(parseISO(d.data), 'dd/MM/yyyy')))).join(', ');
                          const refs = selectedDesvios.map(d => d.refString).join(', ');
                          
                          setPlanoForm({
                            equipamento_id: equipId,
                            equipamento_nome: equip,
                            data_desvio: refs,
                            datas_exibicao: datas,
                            causa_raiz: '',
                            acao_corretiva: '',
                            insights: ''
                          });
                          setOpenPlanoModal(true);
                        }}
                      >
                        Criar Plano ({selectedDesvios.length})
                      </Button>
                    )}
                </Box>

                <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', mb: 8, border: '1px solid', borderColor: 'divider' }}>
                  {desviosPendentes.filter(d => d.equipamento_id === selectedEquip).length > 0 ? (
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox 
                              indeterminate={selectedDesvios.length > 0 && selectedDesvios.length < desviosPendentes.filter(d => d.equipamento_id === selectedEquip).length}
                              checked={selectedDesvios.length > 0 && selectedDesvios.length === desviosPendentes.filter(d => d.equipamento_id === selectedEquip).length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDesvios(desviosPendentes.filter(d => d.equipamento_id === selectedEquip));
                                } else {
                                  setSelectedDesvios([]);
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Data e Hora</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Equipamento</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Medição / Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {desviosPendentes.filter(d => d.equipamento_id === selectedEquip).map((d, i) => {
                          const isSelected = selectedDesvios.some(sel => sel.id === d.id);
                          const isAlimPior = d.evAlim && !d.evAlim.isValid;
                          const statusText = isAlimPior ? d.evAlim.text : (d.evEquip?.text || 'Não Conforme');
                          const tempExibida = isAlimPior ? d.temp_alimento : d.temp_equipamento;

                          return (
                            <TableRow key={d.id || i} hover selected={isSelected}>
                              <TableCell padding="checkbox">
                                <Checkbox 
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedDesvios(prev => prev.filter(sel => sel.id !== d.id));
                                    } else {
                                      setSelectedDesvios(prev => [...prev, d]);
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>{format(parseISO(d.data), 'dd/MM/yyyy')} {d.hora_afericao?.substring(0, 5)}</TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>{d.equipamento?.nome || d.equipamento_id}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontWeight="bold" color="error.main">{tempExibida !== null && tempExibida !== undefined ? `${Number(tempExibida).toFixed(1)}ºC` : '-'}</Typography>
                                  <Chip label={statusText} size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontWeight: 'bold' }} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <CheckCircle color={theme.palette.success.main} size={48} style={{ marginBottom: 16 }} />
                      <Typography variant="h6" color="text.secondary">Sem desvios pendentes</Typography>
                      <Typography variant="body2" color="text.secondary">O equipamento está funcionando de acordo com as faixas de conformidade regulatórias.</Typography>
                    </Box>
                  )}
                </Paper>
            </Box>
          )}
        </>
      )}

      {/* ABA 2: RESFRIAMENTO */}
      {activeTab === 'resfriamento' && (
        <Box>
          <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>Análise de Resfriamento Rápido</Typography>
              <Typography variant="body1" color="text.secondary">Foco na legislação RDC 216: Redução controlada de 60ºC para 10ºC em até 2 horas para garantir a inocuidade do alimento.</Typography>
          </Box>

          {/* FILTROS RESFRIAMENTO */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} md={5}>
                      <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Início"
                          InputLabelProps={{ shrink: true }}
                          value={resfriamentoRange.start}
                          onChange={(e) => setResfriamentoRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                  </Grid>
                  <Grid item xs={12} md={5}>
                      <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Fim"
                          InputLabelProps={{ shrink: true }}
                          value={resfriamentoRange.end}
                          onChange={(e) => setResfriamentoRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                  </Grid>
                  <Grid item xs={12} md={2}>
                      <Button fullWidth variant="contained" startIcon={<Filter size={18}/>} onClick={loadResfriamentoData} sx={{ borderRadius: '8px' }}>Filtrar</Button>
                  </Grid>
              </Grid>
          </Paper>

          {/* KPIS RESFRIAMENTO */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Índice de Resfriamento Conforme</Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">{resfriamentoLogs.length > 0 ? resfriamentoStats.compliance + '%' : '--'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1) }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Desvios de Resfriamento</Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main">{resfriamentoStats.desvios}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Total de Alimentos Monitorados</Typography>
                <Typography variant="h3" fontWeight="bold" color="info.main">{resfriamentoStats.total}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* DESVIOS RESFRIAMENTO PENDENTES */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AlertTriangle color={theme.palette.warning.main} size={28} />
                <Typography variant="h5" fontWeight="bold">Desvios de Resfriamento Pendentes</Typography>
              </Box>
              {selectedResfriamentoDesvios.length > 0 && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Plus size={18}/>}
                  onClick={() => {
                    const alimentos = Array.from(new Set(selectedResfriamentoDesvios.map(d => d.alimento_nome))).join(', ');
                    const datas = Array.from(new Set(selectedResfriamentoDesvios.map(d => format(parseISO(d.data), 'dd/MM/yyyy')))).join(', ');
                    
                    setResPlanoForm({
                      alimento_nome: alimentos,
                      data_desvio: datas,
                      causa_raiz: '',
                      acao_corretiva: '',
                      insights: ''
                    });
                    setOpenResPlanoModal(true);
                  }}
                >
                  Tratar Desvio ({selectedResfriamentoDesvios.length})
                </Button>
              )}
          </Box>

          <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', mb: 6, border: '1px solid', borderColor: 'divider' }}>
            {resfriamentoDesviosPendentes.length > 0 ? (
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        indeterminate={selectedResfriamentoDesvios.length > 0 && selectedResfriamentoDesvios.length < resfriamentoDesviosPendentes.length}
                        checked={selectedResfriamentoDesvios.length > 0 && selectedResfriamentoDesvios.length === resfriamentoDesviosPendentes.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResfriamentoDesvios(resfriamentoDesviosPendentes);
                          } else {
                            setSelectedResfriamentoDesvios([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Alimento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hora Início</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Temp Inicial</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hora Fim</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Temp 2h</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resfriamentoDesviosPendentes.map((d, i) => {
                    const isSelected = selectedResfriamentoDesvios.some(sel => sel.id === d.id);
                    return (
                      <TableRow key={d.id || i} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedResfriamentoDesvios(prev => prev.filter(sel => sel.id !== d.id));
                              } else {
                                setSelectedResfriamentoDesvios(prev => [...prev, d]);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{format(parseISO(d.data), 'dd/MM/yyyy')}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{d.alimento_nome}</TableCell>
                        <TableCell>{d.hora_inicio?.substring(0, 5)}</TableCell>
                        <TableCell>{d.temp_pos_preparo}°C</TableCell>
                        <TableCell>{d.hora_fim?.substring(0, 5) || '-'}</TableCell>
                        <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>{d.temp_apos_2h}°C</TableCell>
                        <TableCell>
                          <Chip label="Desvio RDC 216" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircle color={theme.palette.success.main} size={48} style={{ marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary">Nenhum desvio em aberto!</Typography>
                <Typography variant="body2" color="text.secondary">Todos os registros do período estão em conformidade com as regras de resfriamento da RDC 216.</Typography>
              </Box>
            )}
          </Paper>

          {/* HISTÓRICO COMPLETO DE RESFRIAMENTO */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">Histórico Completo de Resfriamento</Typography>
          </Box>
          <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            {resfriamentoLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : resfriamentoLogs.length > 0 ? (
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Alimento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hora Início</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Temp Inicial</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Hora Fim</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Temp 2h</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tratamento / Observações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resfriamentoLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(parseISO(log.data), 'dd/MM/yyyy')}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>{log.alimento_nome}</TableCell>
                      <TableCell>{log.hora_inicio?.substring(0, 5)}</TableCell>
                      <TableCell>{log.temp_pos_preparo}°C</TableCell>
                      <TableCell>{log.hora_fim?.substring(0, 5) || '-'}</TableCell>
                      <TableCell sx={{ color: log.is_out ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                        {log.temp_apos_2h}°C
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="caption" 
                          fontWeight="bold" 
                          color={log.is_out ? 'error.main' : 'success.main'}
                        >
                          {log.is_out ? 'DESVIO' : 'CONFORME'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{log.observacao || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Nenhum registro encontrado.</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* MODAL PLANO DE AÇÃO (EQUIPAMENTO) */}
      <Dialog open={openPlanoModal} onClose={() => setOpenPlanoModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Novo Plano de Ação - Equipamento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">Equipamento: <b>{planoForm.equipamento_nome}</b></Typography>
            <Typography variant="body2" color="text.secondary">Dias Afetados: <b>{planoForm.datas_exibicao}</b></Typography>
          </Box>
          <Stack spacing={3}>
            <TextField 
              label="Causa Raiz do Problema" 
              multiline rows={2} 
              fullWidth 
              value={planoForm.causa_raiz}
              onChange={e => setPlanoForm({...planoForm, causa_raiz: e.target.value})}
              placeholder="Ex: Borracha da porta danificada, equipamento aberto por muito tempo..."
            />
            <TextField 
              label="Ação Corretiva" 
              multiline rows={3} 
              fullWidth 
              value={planoForm.acao_corretiva}
              onChange={e => setPlanoForm({...planoForm, acao_corretiva: e.target.value})}
              placeholder="Ex: Acionada manutenção terceirizada. Produtos remanejados temporariamente para a câmara fria 2."
            />
            <TextField 
              label="Insights (Opcional)" 
              multiline rows={2} 
              fullWidth 
              value={planoForm.insights}
              onChange={e => setPlanoForm({...planoForm, insights: e.target.value})}
              placeholder="Ex: Revisado com a equipe a importância de manter a porta trancada."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPlanoModal(false)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSalvarPlano}
            disabled={!planoForm.causa_raiz || !planoForm.acao_corretiva}
          >
            Salvar e Resolver
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL PLANO DE AÇÃO (RESFRIAMENTO) */}
      <Dialog open={openResPlanoModal} onClose={() => setOpenResPlanoModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tratar Desvio de Resfriamento - RDC 216</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">Alimento(s): <b>{resPlanoForm.alimento_nome}</b></Typography>
            <Typography variant="body2" color="text.secondary">Dia(s): <b>{resPlanoForm.data_desvio}</b></Typography>
          </Box>
          <Stack spacing={3}>
            <TextField 
              label="Causa Raiz" 
              multiline rows={2} 
              fullWidth 
              value={resPlanoForm.causa_raiz}
              onChange={e => setResPlanoForm({...resPlanoForm, causa_raiz: e.target.value})}
              placeholder="Ex: Resfriamento lento devido à espessura da camada de alimento na assadeira..."
            />
            <TextField 
              label="Medidas de Ação Corretiva" 
              multiline rows={3} 
              fullWidth 
              value={resPlanoForm.acao_corretiva}
              onChange={e => setResPlanoForm({...resPlanoForm, acao_corretiva: e.target.value})}
              placeholder="Ex: Descartado o lote devido à proliferação microbiana latente / Fracionado em assadeiras de menor profundidade..."
            />
            <TextField 
              label="Observações do RT" 
              multiline rows={2} 
              fullWidth 
              value={resPlanoForm.insights}
              onChange={e => setResPlanoForm({...resPlanoForm, insights: e.target.value})}
              placeholder="Ex: Treinamento aplicado na equipe de cozinheiros sobre técnicas de fracionamento de alimentos pós preparo."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenResPlanoModal(false)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSalvarResPlano}
            disabled={!resPlanoForm.causa_raiz || !resPlanoForm.acao_corretiva}
          >
            Salvar e Registrar Ação
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}
