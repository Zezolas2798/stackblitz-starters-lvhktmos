'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Box, Typography, Container, Paper, Grid, MenuItem, Select, FormControl, 
  InputLabel, CircularProgress, Alert, useTheme, alpha, Stack, TextField, Button
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Thermometer, Calendar, Filter, ChevronLeft, Download } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function AnaliseTemperaturasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  
  const [loading, setLoading] = useState(true);
  const [equips, setEquips] = useState<any[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function loadEquips() {
      if (!activeClientId) return;
      const { data: res } = await supabase
        .from('cliente_equipamentos_config')
        .select('id, nome, temp_ideal_min, temp_ideal_max')
        .eq('cliente_id', activeClientId)
        .eq('grupo', 'Temperaturas');
      setEquips(res || []);
    }
    loadEquips();
  }, [activeClientId]);

  useEffect(() => {
    async function fetchData() {
      if (!activeClientId || !unidadeId) return;
      setLoading(true);
      try {
        let query = supabase
          .from('cliente_controle_temperatura')
          .select('*, equipamento:cliente_equipamentos_config(nome, temp_ideal_min, temp_ideal_max)')
          .eq('cliente_id', activeClientId)
          .eq('unidade_id', unidadeId)
          .gte('data', dateRange.start)
          .lte('data', dateRange.end)
          .order('data', { ascending: true })
          .order('hora_afericao', { ascending: true });

        if (selectedEquip !== 'all') {
          query = query.eq('equipamento_id', selectedEquip);
        }

        const { data: res, error } = await query;
        if (error) throw error;
        
        // Formatar para Recharts
        const formatted = (res || []).map(d => ({
          ...d,
          displayDate: format(new Date(d.data + 'T00:00:00'), 'dd/MM'),
          fullDateTime: `${format(new Date(d.data + 'T00:00:00'), 'dd/MM')} ${d.hora_afericao?.substring(0, 5) || ''}`,
          temp: parseFloat((d as any).temp_equipamento),
          min: d.equipamento?.temp_ideal_min,
          max: d.equipamento?.temp_ideal_max
        }));

        setData(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeClientId, unidadeId, selectedEquip, dateRange]);

  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, desvios: 0 };
    const desvios = data.filter(d => (d.temp < d.min || d.temp > d.max)).length;
    return {
      total: data.length,
      desvios,
      perc: ((data.length - desvios) / data.length * 100).toFixed(1)
    };
  }, [data]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
            <Link href="/consultoria" passHref style={{ textDecoration: 'none' }}>
                <Button startIcon={<ChevronLeft size={18}/>} sx={{ mb: 1, color: 'text.secondary' }}>Voltar ao Hub</Button>
            </Link>
            <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Thermometer size={32} color={theme.palette.error.main} /> Análise de Temperaturas
            </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<Download size={18}/>}>Exportar PDF</Button>
        </Stack>
      </Box>

      {/* FILTROS */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Equipamento</InputLabel>
              <Select
                value={selectedEquip}
                label="Equipamento"
                onChange={(e) => setSelectedEquip(e.target.value)}
              >
                <MenuItem value="all">Todos os Equipamentos</MenuItem>
                {equips.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
            <Button fullWidth variant="contained" startIcon={<Filter size={18}/>}>Filtrar</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPIS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Typography variant="overline" color="text.secondary">Aderência Térmica</Typography>
            <Typography variant="h3" fontWeight="bold" color="success.main">{stats.total > 0 ? stats.perc + '%' : '--'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
            <Typography variant="overline" color="text.secondary">Total de Desvios</Typography>
            <Typography variant="h3" fontWeight="bold" color="error.main">{stats.desvios}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <Typography variant="overline" color="text.secondary">Registros Totais</Typography>
            <Typography variant="h3" fontWeight="bold" color="info.main">{stats.total}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* GRÁFICO */}
      <Paper sx={{ p: 4, borderRadius: 4, minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : data.length === 0 ? (
          <Alert severity="info" variant="outlined">Nenhum dado encontrado para o período selecionado.</Alert>
        ) : (
          <Box sx={{ height: 500 }}>
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
              <YAxis domain={['auto', 'auto']} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              <Line 
                type="monotone" 
                dataKey="temp" 
                name="Temperatura (ºC)" 
                stroke={theme.palette.primary.main} 
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {selectedEquip !== 'all' && data[0]?.min !== undefined && (
                <>
                  <ReferenceLine y={data[0].min} label="Mín" stroke="orange" strokeDasharray="3 3" />
                  <ReferenceLine y={data[0].max} label="Máx" stroke="red" strokeDasharray="3 3" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
          </Box>
        )}
      </Paper>

    </Container>
  );
}
