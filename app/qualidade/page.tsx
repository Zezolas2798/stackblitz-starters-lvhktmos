'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, 
  Tooltip, CircularProgress, Grid, Card, CardContent, Stack
} from '@mui/material';
import { 
  Plus, FileText, ClipboardList, Calendar, User, 
  Eye, Edit, Trash2 // Ícones novos
} from 'lucide-react';

export default function DashboardQualidadePage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeClientId) {
      fetchAuditorias();
    }
  }, [activeClientId]);

  const fetchAuditorias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_auditorias')
      .select(`
        *,
        checklist_modelos (titulo)
      `)
      .eq('cliente_id', activeClientId)
      .order('data_inicio', { ascending: false });

    if (error) {
        console.error('Erro ao buscar auditorias:', error);
    } else {
        setAuditorias(data || []);
    }
    setLoading(false);
  };

  // --- FUNÇÃO DE EXCLUSÃO ---
  const handleDelete = async (id: string) => {
      // Confirmação simples (pode ser melhorada com um Dialog depois)
      if (!confirm('Tem certeza que deseja EXCLUIR esta auditoria? Todas as respostas e fotos serão perdidas. Essa ação não pode ser desfeita.')) {
          return;
      }

      try {
          const { error } = await supabase
              .from('checklist_auditorias')
              .delete()
              .eq('id', id);

          if (error) throw error;

          // Atualiza a lista visualmente removendo o item excluído
          setAuditorias(prev => prev.filter(a => a.id !== id));
          
      } catch (err: any) {
          alert('Erro ao excluir: ' + err.message);
      }
  };

  // Helpers de Visualização
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'CONCLUIDO': return 'success';
          case 'EM_ANDAMENTO': return 'warning';
          case 'CANCELADO': return 'error';
          default: return 'default';
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'CONCLUIDO': return 'Finalizado';
          case 'EM_ANDAMENTO': return 'Em Andamento';
          case 'CANCELADO': return 'Cancelado';
          default: return status;
      }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER E AÇÕES RÁPIDAS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                Controle de Qualidade
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Gestão de auditorias, checklists e não-conformidades.
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
                variant="outlined" 
                startIcon={<ClipboardList />} 
                onClick={() => router.push('/qualidade/modelos')}
            >
                Gerenciar Modelos
            </Button>
            <Button 
                variant="contained" 
                size="large"
                startIcon={<Plus />} 
                onClick={() => router.push('/qualidade/novo')}
                sx={{ fontWeight: 'bold', boxShadow: 3 }}
            >
                Nova Auditoria
            </Button>
        </Box>
      </Box>

      {/* KPI CARDS (RESUMO) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', bgcolor: '#f8fafc' }}>
                  <CardContent>
                      <Typography variant="overline" color="text.secondary">Total Realizado</Typography>
                      <Typography variant="h4" fontWeight="bold">{auditorias.length}</Typography>
                  </CardContent>
              </Card>
          </Grid>
          <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', bgcolor: '#fff7ed' }}>
                  <CardContent>
                      <Typography variant="overline" color="warning.main">Em Aberto</Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.dark">
                          {auditorias.filter(a => a.status === 'EM_ANDAMENTO').length}
                      </Typography>
                  </CardContent>
              </Card>
          </Grid>
          <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', bgcolor: '#f0fdf4' }}>
                  <CardContent>
                      <Typography variant="overline" color="success.main">Concluídas</Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.dark">
                          {auditorias.filter(a => a.status === 'CONCLUIDO').length}
                      </Typography>
                  </CardContent>
              </Card>
          </Grid>
      </Grid>

      {/* LISTA DE AUDITORIAS */}
      {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {auditorias.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                    <FileText size={48} color="#ccc" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary">Nenhuma auditoria realizada ainda.</Typography>
                    <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.push('/qualidade/nova')}>Iniciar a Primeira</Button>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell>Auditoria / Checklist</TableCell>
                                <TableCell>Data Início</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Responsável</TableCell>
                                <TableCell align="right">Opções</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {auditorias.map((audit) => (
                                <TableRow key={audit.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography fontWeight="bold" variant="body1">
                                                {audit.titulo || audit.checklist_modelos?.titulo || 'Auditoria Sem Nome'}
                                            </Typography>
                                            {audit.titulo && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Modelo: {audit.checklist_modelos?.titulo}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(audit.data_inicio).toLocaleDateString()} 
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                {new Date(audit.data_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={getStatusLabel(audit.status)} 
                                            size="small" 
                                            color={getStatusColor(audit.status) as any} 
                                            variant="filled"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Usuário Responsável">
                                            <User size={18} color="#888" />
                                        </Tooltip>
                                    </TableCell>
                                    
                                    {/* --- COLUNA DE AÇÕES ATUALIZADA --- */}
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            
                                            <Tooltip title="Ver Auditoria">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => router.push(`/qualidade/relatorio/${audit.id}`)}
                                                >
                                                    <Eye size={18} className="text-gray-600" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Editar / Continuar">
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => router.push(`/qualidade/execucao/${audit.id}`)}
                                                >
                                                    <Edit size={18} />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Excluir Definitivamente">
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDelete(audit.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </Tooltip>

                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
          </Paper>
      )}
    </Container>
  );
}