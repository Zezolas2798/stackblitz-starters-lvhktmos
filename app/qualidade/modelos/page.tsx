'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, 
  Tooltip, CircularProgress, Alert
} from '@mui/material';
import { 
  Plus, Edit, Trash2, FileCheck, ArrowLeft, Calendar
} from 'lucide-react';

interface ChecklistModelo {
  id: string;
  titulo: string;
  frequencia_sugerida: string;
  versao: number;
  ativo: boolean;
  created_at: string;
}

export default function ListaModelosPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [modelos, setModelos] = useState<ChecklistModelo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeClientId) {
      fetchModelos();
    }
  }, [activeClientId]);

  async function fetchModelos() {
    setLoading(true);
    const { data, error } = await (supabase as any).from('checklist_modelos')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true) // Filtro de Soft Delete
      .order('created_at', { ascending: false });

    if (data) {
        // Mapeia para garantir compatibilidade caso o campo seja 'nome' ou 'titulo'
        const mapeados = data.map((m: any) => ({
            ...m,
            titulo: m.titulo || m.nome // Fallback de segurança
        }));
        setModelos(mapeados);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo? Isso não afetará auditorias passadas, mas impedirá novas.')) return;
    
    // Soft Delete (Recomendado para GxP)
    // Atualizamos 'ativo' para false em vez de deletar o registro físico
    const { error } = await (supabase as any)
        .from('checklist_modelos')
        .update({ ativo: false })
        .eq('id', id);
    
    if (error) {
        alert('Erro ao excluir: ' + error.message);
    } else {
        fetchModelos();
    }
  };

  const getFrequenciaLabel = (freq: string) => {
      const map: Record<string, string> = {
          'DIARIO': 'Diário',
          'SEMANAL': 'Semanal',
          'MENSAL': 'Mensal',
          'EVENTUAL': 'Eventual'
      };
      return map[freq] || freq;
  };

  const getFrequenciaColor = (freq: string) => {
      switch(freq) {
          case 'DIARIO': return 'success';
          case 'SEMANAL': return 'info';
          case 'MENSAL': return 'warning';
          default: return 'default';
      }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowLeft />} onClick={() => router.push('/qualidade')} color="inherit">Voltar</Button>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Modelos de Checklist
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gerencie os formulários de auditoria e controle de qualidade.
                </Typography>
            </Box>
        </Box>
        <Button 
            variant="contained" 
            size="large" 
            startIcon={<Plus />} 
            onClick={() => router.push('/qualidade/modelos/novo')} // Rota de Criação
            sx={{ fontWeight: 'bold', boxShadow: 3 }}
        >
            Novo Modelo
        </Button>
      </Box>

      {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {modelos.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                    <FileCheck size={48} color="#ccc" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary">Nenhum modelo cadastrado.</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Crie seu primeiro checklist para começar as auditorias.</Typography>
                    <Button variant="outlined" onClick={() => router.push('/qualidade/modelos/novo')}>Criar Agora</Button>
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell>Título do Checklist</TableCell>
                                <TableCell>Frequência</TableCell>
                                <TableCell>Versão</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modelos.map((modelo) => (
                                <TableRow key={modelo.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="bold" variant="body1">{modelo.titulo}</Typography>
                                        <Typography variant="caption" color="text.secondary">ID: {modelo.id.slice(0,8)}...</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={<Calendar size={14} />} 
                                            label={getFrequenciaLabel(modelo.frequencia_sugerida)} 
                                            size="small" 
                                            color={getFrequenciaColor(modelo.frequencia_sugerida) as any} 
                                            variant="outlined" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`v${modelo.versao || 1}`} size="small" sx={{ bgcolor: 'action.hover' }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Tooltip title="Editar Modelo">
                                                {/* AQUI ESTAVA O ERRO: O LINK CORRETO É COM QUERY PARAM */}
                                                <IconButton 
                                                    color="primary" 
                                                    size="small" 
                                                    onClick={() => router.push(`/qualidade/modelos/novo?id=${modelo.id}`)}
                                                >
                                                    <Edit size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton color="error" size="small" onClick={() => handleDelete(modelo.id)}>
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
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


