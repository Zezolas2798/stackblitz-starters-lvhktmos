'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
  Paper, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Chip, useTheme, alpha, Tooltip
} from '@mui/material';
import { 
  History, Eye, Calendar, User, MapPin, 
  AlertTriangle, CheckCircle, FileText, Download 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';
import InventarioDetalhesDialog from './InventarioDetalhesDialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InventarioHistoricoDialog({ open, onClose }: Props) {
  const theme = useTheme();
  const { unidadeId } = useClient();
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInv, setSelectedInv] = useState<string | null>(null);

  useEffect(() => {
    if (open && unidadeId) {
      loadHistory();
    }
  }, [open, unidadeId]);

  async function loadHistory() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('estoque_inventarios')
      .select(`
        *,
        cliente_locais_estoque(nome)
      `)
      .eq('unidade_id', unidadeId)
      .order('data_inicio', { ascending: false });

    if (error) {
      console.error('Erro ao carregar histórico:', error);
    } else {
      setInventarios(data || []);
    }
    setLoading(false);
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <History size={22} />
          Histórico de Inventários
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 10, textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Carregando histórico...</Typography>
            </Box>
          ) : inventarios.length === 0 ? (
            <Box sx={{ p: 10, textAlign: 'center' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary">Nenhum inventário realizado.</Typography>
              <Typography variant="body2" color="text.disabled">Inicie um novo inventário na página principal.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Data / Início</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Local</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Responsável</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Divergências</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventarios.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={14} color="gray" />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {format(parseISO(inv.data_inicio), 'dd/MM/yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(inv.data_inicio), 'HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapPin size={14} color="gray" />
                        <Typography variant="body2">{inv.cliente_locais_estoque?.nome || 'Geral'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <User size={14} color="gray" />
                        <Typography variant="body2">{inv.responsavel_nome || 'Sistema'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={inv.total_divergencias || 0}
                        size="small"
                        color={inv.total_divergencias > 0 ? 'warning' : 'success'}
                        variant={inv.total_divergencias > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 'bold', minWidth: 40 }}
                        icon={inv.total_divergencias > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={inv.status}
                        size="small"
                        color={inv.status === 'FINALIZADO' ? 'success' : 'primary'}
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Relatório Detalhado">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => setSelectedInv(inv.id)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Fechar</Button>
        </DialogActions>
      </Dialog>

      <InventarioDetalhesDialog 
        open={!!selectedInv} 
        onClose={() => setSelectedInv(null)}
        inventarioId={selectedInv}
      />
    </>
  );
}
