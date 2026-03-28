'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
  Paper, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Chip, useTheme, alpha, Divider, Grid,
  FormControlLabel, Switch
} from '@mui/material';
import { 
  FileText, Printer, CheckCircle, XCircle, AlertTriangle, 
  MapPin, Calendar, User, Package, Download 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  inventarioId: string | null;
}

export default function InventarioDetalhesDialog({ open, onClose, inventarioId }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [inv, setInv] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [soDivergencias, setSoDivergencias] = useState(false);

  useEffect(() => {
    if (open && inventarioId) {
      loadDetails();
    } else {
      setInv(null);
      setItens([]);
    }
  }, [open, inventarioId]);

  async function loadDetails() {
    setLoading(true);
    try {
      // 1. Session data
      const { data: invData } = await (supabase as any)
        .from('estoque_inventarios')
        .select(`
          *,
          cliente_locais_estoque(nome)
        `)
        .eq('id', inventarioId)
        .single();
      
      setInv(invData);

      // 2. Items data
      const { data: itensData } = await (supabase as any)
        .from('estoque_inventario_itens')
        .select(`
          *,
          lotes_estoque(
            numero_lote_fabricante,
            unidade_peso_embalagem,
            ingredientes(nome),
            materiais(nome)
          )
        `)
        .eq('inventario_id', inventarioId)
        .order('created_at', { ascending: true });

      const mapped = (itensData || []).map((it: any) => ({
        ...it,
        nome: it.lotes_estoque?.ingredientes?.nome || it.lotes_estoque?.materiais?.nome || 'Desconhecido',
        lote_fabricante: it.lotes_estoque?.numero_lote_fabricante,
        unidade: it.lotes_estoque?.unidade_peso_embalagem
      }));

      setItens(mapped);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    } finally {
      setLoading(false);
    }
  }

  const fmtQtd = (g: number, un?: string) => {
    if (un === 'UN') return `${Math.round(g)} Un`;
    if (Math.abs(g) >= 1000) return `${(g / 1000).toFixed(2)} Kg`;
    return `${g.toFixed(0)} g`;
  };

  const itensFiltrados = soDivergencias 
    ? itens.filter(it => !it.conferido || Math.abs(it.divergencia_g) > 0.5)
    : itens;

  function handlePrint() {
    window.print();
  }

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={22} />
          <Typography variant="h6" fontWeight="bold">Relatório de Inventário #{inventarioId?.substring(0, 8).toUpperCase()}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><XCircle size={20} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>
        ) : !inv ? (
          <Box sx={{ p: 10, textAlign: 'center' }}>Inventário não encontrado.</Box>
        ) : (
          <Box id="printable-area" sx={{ p: 3 }}>
            {/* Header Info */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <Calendar size={14} /> <Typography variant="caption" fontWeight="bold">DATA/HORA</Typography>
                  </Box>
                  <Typography variant="body2">{format(parseISO(inv.data_inicio), 'dd/MM/yyyy HH:mm')}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <MapPin size={14} /> <Typography variant="caption" fontWeight="bold">LOCAL</Typography>
                  </Box>
                  <Typography variant="body2">{inv.cliente_locais_estoque?.nome || 'Geral'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <User size={14} /> <Typography variant="caption" fontWeight="bold">RESPONSÁVEL</Typography>
                  </Box>
                  <Typography variant="body2">{inv.responsavel_nome || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.5 }}>
                    <Package size={14} /> <Typography variant="caption" fontWeight="bold">ITENS</Typography>
                  </Box>
                  <Typography variant="body2">{inv.total_conferido} / {inv.total_esperado} conferidos</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Overall Stats */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'success.light', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">{inv.total_conferido - inv.total_divergencias}</Typography>
                <Typography variant="caption">ITENS CONFORMES</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'warning.light', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                <Typography variant="h5" fontWeight="bold" color="warning.main">{inv.total_divergencias}</Typography>
                <Typography variant="caption">DIVERGÊNCIAS</Typography>
              </Paper>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Filter Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Detalhamento dos Itens</Typography>
              <FormControlLabel 
                control={<Switch size="small" checked={soDivergencias} onChange={e => setSoDivergencias(e.target.checked)} />}
                label={<Typography variant="caption">Mostrar apenas divergências</Typography>}
              />
            </Box>

            {/* Table */}
            <Table size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Insumo / Lote</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Esperado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Conferido</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Divergência</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ajuste</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itensFiltrados.map((it) => {
                  const isOk = it.conferido && Math.abs(it.divergencia_g) <= 0.5;
                  const isNotFound = !it.conferido;
                  return (
                    <TableRow key={it.id} sx={{ bgcolor: isNotFound ? alpha(theme.palette.error.main, 0.02) : 'transparent' }}>
                      <TableCell>
                        {isOk ? <CheckCircle size={14} color={theme.palette.success.main} /> : 
                         isNotFound ? <XCircle size={14} color={theme.palette.error.main} /> : 
                         <AlertTriangle size={14} color={theme.palette.warning.main} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{it.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">Lote: {it.lote_fabricante}</Typography>
                      </TableCell>
                      <TableCell align="right">{fmtQtd(it.qtd_esperada_g, it.unidade)}</TableCell>
                      <TableCell align="right">{it.conferido ? fmtQtd(it.qtd_conferida_g, it.unidade) : '—'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color={it.divergencia_g < 0 ? 'error.main' : it.divergencia_g > 0 ? 'success.main' : 'text.primary'}>
                          {it.divergencia_g > 0 ? '+' : ''}{fmtQtd(it.divergencia_g, it.unidade)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {it.ajuste_aplicado ? (
                          <Chip label="APLICADO" size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled">N/A</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {itensFiltrados.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Nenhum item com divergência encontrado.</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button startIcon={<Printer size={18} />} onClick={handlePrint} color="inherit">Imprimir</Button>
        <Button variant="contained" onClick={onClose}>Fechar</Button>
      </DialogActions>

      {/* Style for printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .MuiDialogActions-root, .MuiDialogTitle-root { display: none !important; }
        }
      `}</style>
    </Dialog>
  );
}
