'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Box, Typography, Container, Paper, Grid, MenuItem, Select, FormControl, 
  InputLabel, CircularProgress, Alert, useTheme, alpha, Stack, TextField, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton, Collapse
} from '@mui/material';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, LabelList, ReferenceArea, ReferenceLine
} from 'recharts';
import { ChartDefinitions, getGradientUrl } from '@/components/charts/ChartStyles';
import { 
  X, Check, AlertTriangle, ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon, 
  Table as TableIcon, TrendingUp, BarChart3, Download, ChevronLeft, Filter, Calendar, ClipboardCheck 
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function AnaliseChecklistPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  
  const [loading, setLoading] = useState(true);
  const [modelos, setModelos] = useState<any[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subDays(new Date(), 90)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [data, setData] = useState<any[]>([]);
  const [rawAudits, setRawAudits] = useState<any[]>([]);

  useEffect(() => {
    async function loadModelosAplicados() {
      if (!activeClientId) return;
      
      // Buscar apenas modelos que possuem auditorias concluídas
      let query = supabase
        .from('checklist_execucoes')
        .select('modelo_id, modelo:checklist_modelos(id, titulo)')
        .eq('cliente_id', activeClientId)
        .eq('status', 'CONCLUIDO');

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data: res } = await query;

      // Extrair modelos únicos (deduplicar por modelo_id)
      const modelosMap = new Map<string, { id: string; titulo: string }>();
      (res || []).forEach((exec: any) => {
        if (exec.modelo && !modelosMap.has(exec.modelo_id)) {
          modelosMap.set(exec.modelo_id, { id: exec.modelo.id, titulo: exec.modelo.titulo });
        }
      });

      const modelosUnicos = Array.from(modelosMap.values());
      setModelos(modelosUnicos);

      // Pré-selecionar o primeiro modelo disponível (se nenhum selecionado ainda)
      if (modelosUnicos.length > 0 && selectedModelo === 'all') {
        setSelectedModelo(modelosUnicos[0].id);
      }
    }
    loadModelosAplicados();
  }, [activeClientId, unidadeId]);

  useEffect(() => {
    async function fetchData() {
      if (!activeClientId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('checklist_execucoes')
          .select(`
            id, 
            data_fim, 
            status,
            modelo:checklist_modelos(titulo),
            respostas:checklist_respostas(
                conforme, 
                nao_se_aplica, 
                resposta_valor, 
                comentario,
                observacao,
                item:checklist_itens(
                    secao:checklist_secoes(titulo, ordem),
                    peso,
                    classificacao,
                    texto_pergunta,
                    ordem
                )
            )
          `)
          .eq('cliente_id', activeClientId)
          .eq('status', 'CONCLUIDO')
          .gte('data_fim', dateRange.start)
          .lte('data_fim', dateRange.end)
          .order('data_fim', { ascending: true });

        if (selectedModelo !== 'all') {
          query = query.eq('modelo_id', selectedModelo);
        }

        if (unidadeId) {
          query = query.eq('unidade_id', unidadeId);
        }

        const { data: res, error } = await query;
        if (error) throw error;
        
        setRawAudits(res || []);

        // Calcular conformidade geral por auditoria (LINEAR)
        const formatted = (res || []).map(audit => {
          const auditDate = audit.data_fim ? new Date(audit.data_fim) : new Date();
          const auditRespostas = (audit as any).respostas || [];
          const validRespostas = auditRespostas.filter((r: any) => !r.nao_se_aplica);
          const totalValid = validRespostas.length;
          const confCount = validRespostas.filter((r: any) => 
            (r.conforme === true || r.resposta_valor === 'CONFORME')
          ).length;
          
          const compliance = totalValid > 0 ? (confCount / totalValid * 100) : 0;

          return {
            id: audit.id,
            date: format(auditDate, 'dd/MM'),
            fullDate: format(auditDate, 'dd/MM/yyyy'),
            compliance: parseFloat(compliance.toFixed(1)),
            modelo: audit.modelo?.titulo
          };
        });

        setData(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeClientId, unidadeId, selectedModelo, dateRange]);

  const stats = useMemo(() => {
    if (data.length === 0) return { avg: 0, total: 0, max: 0, min: 0 };
    const sum = data.reduce((acc, curr) => acc + curr.compliance, 0);
    return {
      avg: (sum / data.length).toFixed(1),
      total: data.length,
      max: Math.max(...data.map(d => d.compliance)),
      min: Math.min(...data.map(d => d.compliance))
    };
  }, [data]);

  // LÓGICA DA MATRIZ DE CONFORMIDADE (HEATMAP)
  const heatmapData = useMemo(() => {
    if (rawAudits.length === 0) return { headers: [], rows: [] };

    const sectionsOrderMap = new Map<string, number>();
    const itemOrderMap = new Map<string, number>();
    const auditsList: any[] = [];

    rawAudits.forEach(audit => {
      const auditDate = format(new Date(audit.data_fim), 'dd/MM/yy');
      const sectionsPerformance: Record<string, { total: number, conf: number, items: Record<string, { total: number, conf: number, classification: string, comments: string[], order: number }> }> = {};
      
      const respArr = (audit as any).respostas || [];
      respArr.forEach((r: any) => {
        if (r.nao_se_aplica) return;
        const secaoTitulo = r.item?.secao?.titulo || 'Sem Seção';
        const secaoOrdem = r.item?.secao?.ordem || 0;
        const itemOrdem = r.item?.ordem || 0;
        const classification = r.item?.classificacao || 'RECOMENDAVEL';
        
        if (!sectionsOrderMap.has(secaoTitulo)) {
          sectionsOrderMap.set(secaoTitulo, secaoOrdem);
        }
        
        if (!sectionsPerformance[secaoTitulo]) {
          sectionsPerformance[secaoTitulo] = { total: 0, conf: 0, items: {} };
        }
        
        const conforme = r.conforme === true || r.resposta_valor === 'CONFORME';
        sectionsPerformance[secaoTitulo].total++;
        if (conforme) sectionsPerformance[secaoTitulo].conf++;

        const itemText = r.item?.texto_pergunta || 'Item';
        itemOrderMap.set(itemText, itemOrdem);

        if (!sectionsPerformance[secaoTitulo].items[itemText]) {
          sectionsPerformance[secaoTitulo].items[itemText] = { total: 0, conf: 0, classification, comments: [] as string[], order: itemOrdem };
        }
        sectionsPerformance[secaoTitulo].items[itemText].total++;
        if (conforme) sectionsPerformance[secaoTitulo].items[itemText].conf++;
        
        const comment = r.comentario || r.observacao;
        if (comment) {
          sectionsPerformance[secaoTitulo].items[itemText].comments.push(comment);
        }
      });

      const scores: Record<string, number> = {};
      const allItemsMap: Record<string, any[]> = {};

      Object.entries(sectionsPerformance).forEach(([name, data]) => {
        scores[name] = data.total > 0 ? parseFloat((data.conf / data.total * 100).toFixed(1)) : 0;
        allItemsMap[name] = Object.entries(data.items).map(([text, info]) => ({
          text,
          classification: info.classification,
          compliance: parseFloat((info.conf / info.total * 100).toFixed(1)),
          comments: Array.from(new Set(info.comments)),
          order: info.order
        }));
      });

      auditsList.push({
        id: audit.id,
        label: auditDate,
        scores,
        allItemsMap
      });
    });

    const headers = auditsList.map(a => a.label);
    const rows = Array.from(sectionsOrderMap.entries()).map(([sectionName, sectionOrder]) => {
      const scores = auditsList.map(audit => ({
        auditLabel: audit.label,
        value: audit.scores[sectionName] ?? null,
        items: audit.allItemsMap[sectionName] || []
      }));
      
      const validScores = scores.filter(s => s.value !== null);
      const avg = validScores.length > 0 ? validScores.reduce((acc, curr) => acc + (curr.value || 0), 0) / validScores.length : 0;
      
      return { sectionName, sectionOrder, scores, avg };
    });

    // Ordenar seções pela ordem do modelo
    rows.sort((a, b) => a.sectionOrder - b.sectionOrder);

    return { headers, rows, itemOrderMap: Object.fromEntries(itemOrderMap) };
  }, [rawAudits]);

  const getHeatmapColor = (value: number | null) => {
    if (value === null) return alpha(theme.palette.action.disabledBackground, 0.1);
    if (value >= 90) return alpha(theme.palette.info.main, 0.2);
    if (value >= 75) return alpha(theme.palette.success.main, 0.2);
    if (value >= 60) return alpha(theme.palette.warning.main, 0.2);
    return alpha(theme.palette.error.main, 0.2);
  };

  const getHeatmapTextColor = (value: number | null) => {
    if (value === null) return theme.palette.text.disabled;
    if (value >= 90) return theme.palette.info.dark;
    if (value >= 75) return theme.palette.success.dark;
    if (value >= 60) return theme.palette.warning.dark;
    return theme.palette.error.dark;
  };

  const HeatmapSectionRow = ({ row }: { row: any }) => {
    const [open, setOpen] = useState(false);
    
    // Obter TODOS os itens que tiveram alguma NÃO conformidade em qualquer auditoria (< 100%)
    const allNCRItems = useMemo(() => {
      const itemTexts = Array.from(new Set(
        row.scores.flatMap((s: any) => s.items.map((ci: any) => ci.text))
      )).filter(itemText => {
        return row.scores.some((s: any) => {
          const itemScore = s.items.find((ci: any) => ci.text === itemText);
          return itemScore && itemScore.compliance < 100;
        });
      }) as string[];

      // Ordenar os itens pela ordem original do modelo
      return itemTexts.sort((a, b) => (heatmapData.itemOrderMap?.[a] || 0) - (heatmapData.itemOrderMap?.[b] || 0));
    }, [row.scores, heatmapData.itemOrderMap]);

    // Agrupar itens por classificação
    const groupedNCs = useMemo(() => {
      const groups: Record<string, string[]> = {
        'IMPRESCINDIVEL': [],
        'NECESSARIO': [],
        'RECOMENDAVEL': []
      };
      
      allNCRItems.forEach(text => {
        const itemInfo = row.scores.flatMap((s: any) => s.items).find((ci: any) => ci.text === text);
        if (itemInfo && groups[itemInfo.classification]) {
          groups[itemInfo.classification].push(text);
        } else if (itemInfo) {
          if (!groups[itemInfo.classification]) groups[itemInfo.classification] = [];
          groups[itemInfo.classification].push(text);
        }
      });
      return groups;
    }, [allNCRItems, row.scores]);

    const getClassificationLabel = (type: string) => {
      switch(type) {
        case 'IMPRESCINDIVEL': return { label: 'I', color: theme.palette.error.main, desc: 'Imprescindível' };
        case 'NECESSARIO': return { label: 'N', color: theme.palette.warning.main, desc: 'Necessário' };
        case 'RECOMENDAVEL': return { label: 'R', color: theme.palette.info.main, desc: 'Recomendável' };
        default: return { label: '?', color: theme.palette.text.disabled, desc: 'Outros' };
      }
    };

    return (
      <React.Fragment>
        {/* ROW PRINCIPAL DA SEÇÃO */}
        <TableRow hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }, '& td': { borderBottom: open ? 'none' : '1px solid #e0e0e0' } }} onClick={() => setOpen(!open)}>
          <TableCell sx={{ fontWeight: '700', fontSize: '0.85rem', py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" sx={{ p: 0.5 }}>
                {open ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
              </IconButton>
              <Typography variant="inherit">{row.sectionName}</Typography>
            </Stack>
          </TableCell>
          {row.scores.map((score: any, j: number) => (
            <TableCell 
              key={j} 
              align="center"
              sx={{ 
                bgcolor: getHeatmapColor(score.value),
                color: getHeatmapTextColor(score.value),
                fontWeight: 'bold',
                fontSize: '0.9rem',
                borderLeft: '1px solid #fff',
                borderRight: '1px solid #fff',
              }}
            >
              {score.value !== null ? `${score.value}%` : '-'}
            </TableCell>
          ))}
        </TableRow>

        {/* ROWS DE DETALHAMENTO EXPANDIDO (NATIVAS) */}
        {open && (
           <>
              <TableRow sx={{ bgcolor: '#fcfcfc' }}>
                 <TableCell colSpan={row.scores.length + 1} sx={{ py: 1.5, pl: 2, borderBottom: '1px dashed #e0e0e0' }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                       <AlertTriangle size={14} /> Detalhamento de Não Conformidades (Agrupado por Criticidade)
                    </Typography>
                 </TableCell>
              </TableRow>

              {allNCRItems.length === 0 ? (
                 <TableRow sx={{ bgcolor: '#fcfcfc' }}>
                    <TableCell colSpan={row.scores.length + 1} sx={{ borderBottom: '1px solid #eee', py: 2, px: 2 }}>
                       <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Nenhuma não conformidade identificada nesta seção.</Typography>
                    </TableCell>
                 </TableRow>
              ) : (
                 Object.entries(groupedNCs).map(([classification, items]) => (
                    items.length > 0 && (
                       <React.Fragment key={classification}>
                          <TableRow sx={{ bgcolor: alpha(getClassificationLabel(classification).color, 0.05) }}>
                             <TableCell colSpan={row.scores.length + 1} sx={{ py: 0.5, borderBottom: 'none', pl: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                   <Chip label={getClassificationLabel(classification).label} size="small" sx={{ height: 20, width: 20, fontSize: '0.7rem', fontWeight: 'bold', bgcolor: getClassificationLabel(classification).color, color: '#fff' }} />
                                   <Typography fontSize="0.75rem" fontWeight="bold" color={getClassificationLabel(classification).color}>
                                      {getClassificationLabel(classification).desc}
                                   </Typography>
                                </Stack>
                             </TableCell>
                          </TableRow>
                          
                          {items.map((itemText, k) => (
                             <TableRow key={`${classification}-${k}`} sx={{ bgcolor: '#fcfcfc', '&:last-child td': { borderBottom: '1px solid #efefef' } }}>
                                <TableCell sx={{ py: 1.5, pl: 4, pr: 2, fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'normal', position: 'relative', borderBottom: '1px dashed #f0f0f0', '&::before': { content: '""', position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, bgcolor: alpha(getClassificationLabel(classification).color, 0.2) } }}>
                                   {itemText}
                                </TableCell>
                                {row.scores.map((s: any, l: number) => {
                                   const itemScore = s.items.find((ci: any) => ci.text === itemText);
                                   const isNC = itemScore && itemScore.compliance < 100;
                                   const hasData = !!itemScore;
                                   return (
                                     <TableCell key={l} align="center" sx={{ py: 1, px: 1, bgcolor: isNC ? alpha(theme.palette.error.main, 0.05) : 'transparent', borderLeft: '1px solid #eee', borderBottom: '1px dashed #f0f0f0' }}>
                                        <Stack spacing={0.5} alignItems="center" justifyContent="center">
                                           {isNC ? (
                                              <Chip label="NC" size="small" sx={{ height: 18, width: 32, fontSize: '0.65rem', fontWeight: '900', bgcolor: theme.palette.error.main, color: '#fff' }} />
                                           ) : hasData ? (
                                              <Chip label="C" size="small" variant="outlined" sx={{ height: 18, width: 30, fontSize: '0.65rem', fontWeight: 'bold', borderColor: theme.palette.success.main, color: theme.palette.success.main }} />
                                           ) : '-'}
                                           
                                           {itemScore?.comments?.map((comment: string, idx: number) => (
                                              <Typography key={idx} variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.6rem', color: 'text.primary', fontStyle: 'italic', lineHeight: 1.1 }}>
                                                 {comment}
                                              </Typography>
                                           ))}
                                        </Stack>
                                     </TableCell>
                                   );
                                })}
                             </TableRow>
                          ))}
                       </React.Fragment>
                    )
                 ))
              )}
           </>
        )}
      </React.Fragment>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 10, px: { xs: 1.5, md: 3 } }}>
      {/* HEADER */}
      <Box sx={{ mb: { xs: 2, md: 4 }, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
            <Link href="/consultoria" passHref style={{ textDecoration: 'none' }}>
                <Button startIcon={<ChevronLeft size={18}/>} sx={{ mb: 1, color: 'text.secondary' }}>Voltar ao Hub</Button>
            </Link>
            <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: { xs: '1.3rem', md: '2.125rem' } }}>
                <BarChart3 size={32} color={theme.palette.info.main} /> Dashboards de Qualidade
            </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<Download size={18}/>}>Relatório Consolidado</Button>
        </Stack>
      </Box>

      {/* FILTROS */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Grid container spacing={{ xs: 1.5, md: 3 }} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Modelo de Checklist</InputLabel>
              <Select
                value={selectedModelo}
                label="Modelo de Checklist"
                onChange={(e) => setSelectedModelo(e.target.value)}
              >
                {modelos.map(m => (
                  <MenuItem key={m.id} value={m.id}>{m.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
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
          <Grid item xs={6} sm={3} md={3}>
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
          <Grid item xs={12} sm={6} md={2}>
            <Button fullWidth variant="contained" startIcon={<Filter size={18}/>}>Aplicar</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPIS */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eee', borderRadius: 4 }}>
            <Typography variant="overline" color="text.secondary" fontWeight="700">Média de Conformidade</Typography>
            <Typography variant="h3" fontWeight="900" color="primary.main">{stats.total > 0 ? stats.avg + '%' : '--'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eee', borderRadius: 4 }}>
            <Typography variant="overline" color="text.secondary" fontWeight="700">Auditorias Realizadas</Typography>
            <Typography variant="h3" fontWeight="900">{stats.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eee', bgcolor: alpha(theme.palette.success.main, 0.02), borderRadius: 4 }}>
            <Typography variant="overline" color="success.main" fontWeight="700">Melhor Resultado</Typography>
            <Typography variant="h3" fontWeight="900" color="success.main">{stats.total > 0 ? stats.max + '%' : '--'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eee', bgcolor: alpha(theme.palette.error.main, 0.02), borderRadius: 4 }}>
            <Typography variant="overline" color="error.main" fontWeight="700">Pior Resultado</Typography>
            <Typography variant="h3" fontWeight="900" color="error.main">{stats.total > 0 ? stats.min + '%' : '--'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* GRÁFICO DE TENDÊNCIA */}
        <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
                    <TrendingUp size={20} color={theme.palette.primary.main} /> Evolução Detalhada da Conformidade
                </Typography>
                {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                ) : data.length === 0 ? (
                <Alert severity="info" variant="outlined">Nenhuma auditoria encontrada para os filtros selecionados.</Alert>
                ) : (
                <Box sx={{ height: { xs: 300, md: 450 } }}>
                <ChartDefinitions />
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                        dataKey="fullDate" 
                        tick={{ fontSize: 11, fontWeight: 'bold' }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip 
                        formatter={(value: any) => [`${value}%`, 'Conformidade']}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                    />
                    
                    {/* FAIXAS DE REFERÊNCIA NO EIXO Y */}
                    <ReferenceArea y1={90} y2={100} fill={alpha(theme.palette.info.main, 0.08)} stroke="none" label={{ position: 'insideRight', value: 'Excelente', fill: theme.palette.info.main, fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={75} y2={90} fill={alpha(theme.palette.success.main, 0.08)} stroke="none" label={{ position: 'insideRight', value: 'Bom', fill: theme.palette.success.main, fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={60} y2={75} fill={alpha(theme.palette.warning.main, 0.08)} stroke="none" label={{ position: 'insideRight', value: 'Regular', fill: theme.palette.warning.main, fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={0} y2={60} fill={alpha(theme.palette.error.main, 0.08)} stroke="none" label={{ position: 'insideRight', value: 'Inadequado', fill: theme.palette.error.main, fontSize: 10, fontWeight: 'bold' }} />

                    {/* LINHAS DE DIVISÃO */}
                    <ReferenceLine y={90} stroke={theme.palette.info.main} strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'right', value: '90%', fill: theme.palette.info.main, fontSize: 10 }} />
                    <ReferenceLine y={75} stroke={theme.palette.success.main} strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'right', value: '75%', fill: theme.palette.success.main, fontSize: 10 }} />
                    <ReferenceLine y={60} stroke={theme.palette.warning.main} strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'right', value: '60%', fill: theme.palette.warning.main, fontSize: 10 }} />

                    <Area 
                        type="monotone" 
                        dataKey="compliance" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={4}
                        fill="url(#gradientPrimary)"
                        fillOpacity={0.15}
                        dot={{ r: 6, fill: '#fff', stroke: theme.palette.primary.main, strokeWidth: 3 }}
                        activeDot={{ r: 8, filter: 'url(#shadowDepth)' }}
                    >
                        <LabelList 
                            dataKey="compliance" 
                            position="top" 
                            offset={15}
                            formatter={(val: any) => `${val}%`}
                            style={{ fontSize: 13, fontWeight: '900', fill: theme.palette.primary.main }}
                        />
                    </Area>
                    </AreaChart>
                </ResponsiveContainer>
                </Box>
                )}
            </Paper>
        </Grid>

        {/* MATRIZ DE CONFORMIDADE (HEATMAP) */}
        <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
                <Box sx={{ mb: { xs: 2, md: 4 }, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TableIcon size={20} color={theme.palette.secondary.main} /> Matriz de Evolução por Seção (Heatmap)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Mostrando {heatmapData.rows.length} seções vs {heatmapData.headers.length} auditorias
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                ) : heatmapData.rows.length === 0 ? (
                    <Alert severity="info" variant="outlined">Dados insuficientes para gerar a matriz.</Alert>
                ) : (
                    <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2, overflowX: 'auto' }}>
                        <Table size="small" sx={{ minWidth: 500 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 250, py: 2, color: theme.palette.primary.main }}>Seção do Checklist</TableCell>
                                    {heatmapData.headers.map((h, i) => (
                                        <TableCell key={i} align="center" sx={{ fontWeight: 'bold', minWidth: 100, width: 100, color: theme.palette.primary.main }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {heatmapData.rows.map((row, i) => (
                                    <HeatmapSectionRow key={i} row={row} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                
                <Box sx={{ mt: 3, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.2), border: `1px solid ${theme.palette.info.main}` }} />
                        <Typography variant="caption" fontWeight="bold">≥ 90% (Excelente)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.2), border: `1px solid ${theme.palette.success.main}` }} />
                        <Typography variant="caption" fontWeight="bold">75% - 89% (Bom)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.2), border: `1px solid ${theme.palette.warning.main}` }} />
                        <Typography variant="caption" fontWeight="bold">60% - 74% (Regular)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: alpha(theme.palette.error.main, 0.2), border: `1px solid ${theme.palette.error.main}` }} />
                        <Typography variant="caption" fontWeight="bold">{'<'} 60% (Inadequado)</Typography>
                    </Box>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center', fontStyle: 'italic' }}>
                    * As seções estão ordenadas da pior para a melhor média no período, destacando áreas críticas no topo.
                </Typography>
            </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
