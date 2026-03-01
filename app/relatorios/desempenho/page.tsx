'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress, 
  LinearProgress, Avatar, Stack, Divider, Chip, 
  FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, 
  Trophy, TrendingUp, Calendar 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { differenceInDays, parseISO } from 'date-fns';

export default function DesempenhoPage() {
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30'); // Dias
  
  // Estado das Métricas
  const [stats, setStats] = useState({
    totalConcluidas: 0,
    taxaConclusao: 0,
    dentroDoPrazo: 0,
    taxaPontualidade: 0,
    tempoMedioDias: 0,
    tarefasEmAberto: 0
  });

  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    if (activeClientId) loadMetrics();
  }, [activeClientId, periodo]);

  async function loadMetrics() {
    setLoading(true);
    
    // Calcula data de corte baseada no filtro
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - parseInt(periodo));

    // 1. Buscar Tarefas
    const { data: tarefas } = await supabase
      .from('operacao_tarefas')
      .select('*, responsavel:responsavel_id(full_name)')
      .eq('cliente_id', activeClientId)
      .gte('created_at', dataCorte.toISOString());

    if (!tarefas) {
      setLoading(false);
      return;
    }

    // 2. Processar Dados Gerais
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.status === 'CONCLUIDA');
    const emAberto = total - concluidas.length;
    
    // Cálculo de Pontualidade (SLA)
    let noPrazo = 0;
    let somaDiasConclusao = 0;

    concluidas.forEach(t => {
      // Se não tinha prazo, considera no prazo. Se tinha, compara.
      if (!t.prazo_limite || new Date(t.concluida_em) <= new Date(t.prazo_limite)) {
        noPrazo++;
      }

      // Tempo médio
      if (t.concluida_em && t.created_at) {
        const dias = differenceInDays(parseISO(t.concluida_em), parseISO(t.created_at));
        somaDiasConclusao += (dias < 0 ? 0 : dias); // Evita negativos
      }
    });

    // 3. Processar Ranking de Equipe
    const userMap = new Map();

    tarefas.forEach(t => {
      if (!t.responsavel) return;
      const nome = t.responsavel.full_name;
      
      if (!userMap.has(nome)) {
        userMap.set(nome, { nome, total: 0, concluidas: 0, noPrazo: 0 });
      }
      
      const userStat = userMap.get(nome);
      userStat.total++;
      if (t.status === 'CONCLUIDA') {
        userStat.concluidas++;
        if (!t.prazo_limite || new Date(t.concluida_em) <= new Date(t.prazo_limite)) {
          userStat.noPrazo++;
        }
      }
    });

    const rankingArray = Array.from(userMap.values())
      .sort((a, b) => b.concluidas - a.concluidas); // Ordena quem concluiu mais

    // Atualiza Estados
    setStats({
      totalConcluidas: concluidas.length,
      taxaConclusao: total > 0 ? (concluidas.length / total) * 100 : 0,
      dentroDoPrazo: noPrazo,
      taxaPontualidade: concluidas.length > 0 ? (noPrazo / concluidas.length) * 100 : 100,
      tempoMedioDias: concluidas.length > 0 ? (somaDiasConclusao / concluidas.length) : 0,
      tarefasEmAberto: emAberto
    });

    setRanking(rankingArray);
    setLoading(false);
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="primary">
            Performance Operacional
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Métricas de produtividade e conformidade da equipe.
          </Typography>
        </Box>
        
        {/* Filtro de Período */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Período</InputLabel>
          <Select 
            value={periodo} 
            label="Período"
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <MenuItem value="7">Últimos 7 dias</MenuItem>
            <MenuItem value="15">Últimos 15 dias</MenuItem>
            <MenuItem value="30">Últimos 30 dias</MenuItem>
            <MenuItem value="90">Últimos 3 Meses</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <>
          {/* CARDS DE KPI */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
                    <BarChart3 size={24} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">TOTAL CONCLUÍDO</Typography>
                </Stack>
                <Typography variant="h3" fontWeight="800" color="text.primary">
                  {stats.totalConcluidas}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  de {stats.totalConcluidas + stats.tarefasEmAberto} demandas abertas
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.taxaConclusao} 
                  sx={{ mt: 2, borderRadius: 1, height: 6, bgcolor: 'grey.200' }} 
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1, bgcolor: stats.taxaPontualidade > 90 ? 'success.light' : 'warning.light', borderRadius: 2, color: 'white' }}>
                    <Clock size={24} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">PONTUALIDADE</Typography>
                </Stack>
                <Typography variant="h3" fontWeight="800" color="text.primary">
                  {stats.taxaPontualidade.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Entregues dentro do prazo limite
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
                    <TrendingUp size={24} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">TEMPO MÉDIO</Typography>
                </Stack>
                <Typography variant="h3" fontWeight="800" color="text.primary">
                  {stats.tempoMedioDias.toFixed(1)} <span style={{fontSize: '1rem'}}>dias</span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Do início até a conclusão
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* RANKING DA EQUIPE */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trophy size={20} color="#D97706" />
            Ranking de Produtividade
          </Typography>
          
          <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            {ranking.map((user, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: index !== ranking.length - 1 ? '1px solid #eee' : 'none',
                  bgcolor: index === 0 ? 'action.selected' : 'background.paper' // Destaque suave pro 1º lugar
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: index === 0 ? '#F59E0B' : 'grey.300', fontWeight: 'bold' }}>
                    {index + 1}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user.nome} {index === 0 && '👑'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.concluidas} concluídas / {user.total} atribuídas
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" display="block" color="text.secondary">Pontualidade</Typography>
                    <Typography variant="body2" fontWeight="bold" color={
                        (user.noPrazo / user.concluidas) >= 0.9 ? 'success.main' : 'text.primary'
                    }>
                      {user.concluidas > 0 ? ((user.noPrazo / user.concluidas) * 100).toFixed(0) : 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ width: 100 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={user.total > 0 ? (user.concluidas / user.total) * 100 : 0} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              </Box>
            ))}
            {ranking.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                Nenhum dado de equipe neste período.
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}