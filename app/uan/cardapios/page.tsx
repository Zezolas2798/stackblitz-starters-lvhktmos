'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton
} from '@mui/material';
import { Plus, Edit, CalendarDays, Eye, ArrowLeft, Loader2, Trash2 } from 'lucide-react';

export default function CardapiosUANPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [cardapios, setCardapios] = useState<CardapioUAN[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCardapios = async () => {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cardapios_uan')
      .select('*')
      .eq('cliente_id', activeClientId)
      .order('data_inicio', { ascending: false });

    if (!error && data) {
      setCardapios(data as unknown as CardapioUAN[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCardapios();
  }, [activeClientId]);

  const handleExcluir = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cardápio "${nome}"? Esta ação removerá também todas as fichas planejadas na grade dele.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cardapios_uan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Cardápio excluído com sucesso.');
      fetchCardapios();
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  // Função Helpers (Mock até tela final de Planejamento ser construída)
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aprovado': return 'success';
      case 'Enviado para Compras': return 'info';
      case 'Em Execução': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan')}>Painel</Button>
        <Typography variant="h5" fontWeight="bold" flexGrow={1}>
          Planejamento de Cardápios (UAN)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => router.push('/uan/cardapios/novo')}
        >
          Novo Período/Ciclo
        </Button>
      </Box>

      {loading ? (
         <Box display="flex" justifyContent="center" p={4}><Loader2 className="animate-spin" /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Ciclo (Nome)</TableCell>
                <TableCell align="center">Período</TableCell>
                <TableCell align="center">Comensais (Diário)</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cardapios.length > 0 ? (
                cardapios.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                       <Box display="flex" alignItems="center" gap={1}>
                         <CalendarDays size={18} color="#9e9e9e" />
                         {c.nome_ciclo}
                       </Box>
                    </TableCell>
                    <TableCell align="center">
                      {new Date(c.data_inicio).toLocaleDateString()} a {new Date(c.data_fim).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">{c.comensais_estimados_dia}</TableCell>
                    <TableCell align="center">
                      <Chip label={c.status} size="small" color={getStatusColor(c.status) as any} />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button size="small" variant="outlined" startIcon={<Eye size={16} />} onClick={() => router.push(`/uan/cardapios/${c.id}/grade`)}>
                           Grade
                        </Button>
                        <IconButton size="small" color="primary" onClick={() => router.push(`/uan/cardapios/${c.id}/editar`)}>
                           <Edit size={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleExcluir(c.id, c.nome_ciclo)}>
                           <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Nenhum cardápio de UAN planejado ainda.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
