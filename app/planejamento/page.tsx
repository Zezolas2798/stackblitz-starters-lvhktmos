'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  CircularProgress, Alert, Container, useTheme, alpha, Tabs, Tab,
  Grid, Card, CardContent
} from '@mui/material';
import { Plus, Eye, Calendar as CalendarIcon, PackageCheck, ChefHat, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface producao_ordens_itens {
  quantidade_planejada: number;
  receitas: {
    nome: string;
  };
}

interface OrdemProducaoListagem {
  id: string;
  codigo: string;
  titulo: string | null;
  data_prevista: string | null;
  status: string;
  created_at: string;
  producao_ordens_itens: producao_ordens_itens[];
}

export default function PlanejamentoListPage() {
  const theme = useTheme();
  const { unidadeId } = useClient();
  const [ordens, setOrdens] = useState<OrdemProducaoListagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (unidadeId) {
      loadProducao();
    }
  }, [unidadeId, currentMonth]);

  async function loadProducao() {
    setLoading(true);
    setError('');
    
    // Calcular range do mês selecionado
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await (supabase as any).from('producao_ordens')
        .select(`
          id,
          codigo,
          titulo,
          data_prevista,
          status,
          created_at,
          producao_ordens_itens (
            quantidade_planejada,
            receitas ( nome )
          )
        `)
        .eq('unidade_id', unidadeId)
        .neq('status', 'CANCELADA')
        .gte('data_prevista', start)
        .lte('data_prevista', end)
        .order('data_prevista', { ascending: true });

      if (error) throw error;

      setOrdens(data as unknown as OrdemProducaoListagem[]);
    } catch (err: any) {
      console.error('Erro ao carregar ordens:', err);
      setError('Não foi possível carregar as ordens de produção.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANEJADA': return theme.palette.info.main;
      case 'SEPARADA': 
      case 'EM_PRODUCAO': return theme.palette.warning.dark;
      case 'CONCLUIDA': return theme.palette.success.main;
      case 'CANCELADA': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusChip = (status: string) => {
    const color = getStatusColor(status);
    return (
      <Chip 
        label={status.replace('_', ' ')} 
        size="small" 
        sx={{ 
          bgcolor: alpha(color, 0.1), 
          color: color, 
          fontWeight: 'bold',
          textTransform: 'capitalize'
        }} 
      />
    );
  };

  // Logica do Calendario
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
            Planejamento de Produção (OP)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualização e cronograma das ordens de serviço.
          </Typography>
        </Box>
        
        <Link href="/planejamento/nova" passHref style={{ textDecoration: 'none' }}>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<Plus size={20} />}
            sx={{ px: 3, fontWeight: 'bold', borderRadius: 2, boxShadow: theme.shadows[4] }}
          >
            Nova Produção
          </Button>
        </Link>
      </Box>

      {/* Navegação de Mês e Abas */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', p: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
          <IconButton onClick={handlePrevMonth} size="small" sx={{ mr: 1 }}>
            <ChevronLeft size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 160, textAlign: 'center', fontWeight: 'bold', textTransform: 'capitalize' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </Typography>
          <IconButton onClick={handleNextMonth} size="small" sx={{ ml: 1 }}>
            <ChevronRight size={20} />
          </IconButton>
        </Paper>

        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            borderRadius: 3,
            p: 0.5,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Tab 
            icon={<Clock size={18} />} 
            iconPosition="start" 
            label="Lista de Ordens" 
            sx={{ fontWeight: 'bold', minHeight: 48, borderRadius: 2 }}
          />
          <Tab 
            icon={<CalendarIcon size={18} />} 
            iconPosition="start" 
            label="Visão Calendário" 
            sx={{ fontWeight: 'bold', minHeight: 48, borderRadius: 2 }}
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ p: 12, textAlign: 'center' }}>
          <CircularProgress size={48} thickness={4} />
          <Typography sx={{ mt: 3, color: 'text.secondary', fontWeight: 500 }}>Sincronizando planejamento...</Typography>
        </Box>
      ) : ordens.length === 0 ? (
        <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
          <PackageCheck size={80} style={{ opacity: 0.1, marginBottom: 24 }} />
          <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>Nenhuma OP para este mês.</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Não foram encontradas ordens de produção previstas para o período de {format(currentMonth, 'MMMM', { locale: ptBR })}.
          </Typography>
          <Link href="/planejamento/nova" passHref style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="large" startIcon={<Plus size={20} />} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Criar Primeira OP</Button>
          </Link>
        </Paper>
      ) : activeTab === 0 ? (
        /* VISÃO LISTA */
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: '800', color: 'primary.dark', py: 2 }}>PREVISÃO</TableCell>
                <TableCell sx={{ fontWeight: '800', color: 'primary.dark' }}>IDENTIFICAÇÃO</TableCell>
                <TableCell sx={{ fontWeight: '800', color: 'primary.dark' }}>PRINCIPAIS ITENS</TableCell>
                <TableCell sx={{ fontWeight: '800', color: 'primary.dark' }}>TOTAL PLANEJADO</TableCell>
                <TableCell sx={{ fontWeight: '800', color: 'primary.dark' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: '800', color: 'primary.dark' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordens.map((ordem) => (
                <TableRow key={ordem.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1.5 }}>
                        <CalendarIcon size={18} color={theme.palette.primary.main} />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{ordem.titulo || 'Sem Título'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{ordem.codigo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {ordem.producao_ordens_itens?.slice(0, 2).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChefHat size={14} color={theme.palette.primary.main} />
                          <Typography variant="caption" color="text.primary" fontWeight={500}>
                            {item.receitas?.nome}
                          </Typography>
                        </Box>
                      ))}
                      {ordem.producao_ordens_itens?.length > 2 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pl: 3 }}>
                          + {ordem.producao_ordens_itens.length - 2} outros itens
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800} color="primary.main">
                      {ordem.producao_ordens_itens?.reduce((acc, item) => acc + Number(item.quantidade_planejada), 0)} un/kg
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(ordem.status)}</TableCell>
                  <TableCell align="right">
                    <Link href={`/planejamento/${ordem.id}`} passHref>
                      <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                        <Eye size={18} />
                      </IconButton>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* VISÃO CALENDÁRIO */
        <Box>
          <Grid container columns={7} sx={{ borderTop: '1px solid', borderLeft: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <Grid item xs={1} key={day} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">{day}</Typography>
              </Grid>
            ))}
            {calendarDays.map((date, idx) => {
              const dayOrdens = ordens.filter(o => o.data_prevista && isSameDay(parseISO(o.data_prevista), date));
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <Grid item xs={1} key={idx} sx={{ 
                  height: { xs: 120, md: 160 }, 
                  borderRight: '1px solid', 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: isCurrentMonth ? 'background.paper' : alpha(theme.palette.action.disabledBackground, 0.3),
                  p: 1,
                  position: 'relative',
                  overflowY: 'auto'
                }}>
                  <Typography 
                    variant="caption" 
                    fontWeight={isSameDay(date, new Date()) ? 'bold' : 'normal'}
                    sx={{ 
                      bgcolor: isSameDay(date, new Date()) ? 'primary.main' : 'transparent',
                      color: isSameDay(date, new Date()) ? 'white' : (isSameMonth(date, currentMonth) ? 'text.primary' : 'text.disabled'),
                      width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', mb: 1, ml: 'auto'
                    }}
                  >
                    {format(date, 'd')}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {dayOrdens.map(o => (
                      <Link key={o.id} href={`/planejamento/${o.id}`} style={{ textDecoration: 'none' }}>
                        <Box sx={{ 
                          p: 0.5, 
                          px: 1,
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          borderRadius: 1,
                          bgcolor: alpha(getStatusColor(o.status), 0.1),
                          color: getStatusColor(o.status),
                          borderLeft: `3px solid ${getStatusColor(o.status)}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          '&:hover': { bgcolor: alpha(getStatusColor(o.status), 0.15) }
                        }}>
                          {o.titulo || o.codigo}
                        </Box>
                      </Link>
                    ))}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Legenda do Calendário */}
          <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['PLANEJADA', 'EM_PRODUCAO', 'CONCLUIDA'].map(status => (
              <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ w: 12, h: 12, borderRadius: '50%', bgcolor: getStatusColor(status) }} />
                <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                  {status.replace('_', ' ')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
}
