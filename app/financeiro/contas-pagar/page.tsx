'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Alert, IconButton,
  Tabs, Tab, Stack, InputAdornment, Tooltip
} from '@mui/material';
import { 
  Calendar, FileText, CheckCircle, Clock, Upload, Eye, 
  Filter, Receipt, AlertCircle, Trash2, Download
} from 'lucide-react';
import { format, isBefore, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransacaoPagar {
  id: string;
  descricao: string;
  data_competencia: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_total: number;
  nota_fiscal: string | null;
  comprovante_url: string | null;
  origem_modulo: string;
  fin_lancamentos: {
    valor: number;
    fin_contas: {
      nome: string;
    }
  }[];
}

export default function ContasPagarPage() {
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<TransacaoPagar[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0: A Pagar, 1: Pagas
  
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const [filtroMes, setFiltroMes] = useState(currentMonthStr);
  
  // Modal Pagar
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState<TransacaoPagar | null>(null);
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadTransacoes = useCallback(async () => {
    if (!unidadeId) return;
    setLoading(true);
    try {
      const start = `${filtroMes}-01`;
      const end = format(endOfMonth(parseISO(start)), 'yyyy-MM-dd');

      // Busca transações que tem vencimento no mês OU competência no mês (para contemplar legados ou notas sem vencimento explícito)
      const { data, error } = await (supabase as any)
        .from('fin_transacoes')
        .select(`
          *,
          fin_lancamentos(
            valor,
            fin_contas(nome)
          )
        `)
        .eq('unidade_id', unidadeId)
        .or(`data_vencimento.gte.${start},origem_modulo.eq.ESTOQUE`)
        .order('data_vencimento', { ascending: true })
        .order('data_competencia', { ascending: true });

      if (error) throw error;

      // Filtragem manual para garantir o mês correto caso o OR tenha trazido a mais
      const filteredData = (data || []).filter((t: any) => {
        const dateToUse = t.data_vencimento || t.data_competencia;
        return dateToUse >= start && dateToUse <= end;
      });

      setTransacoes(filteredData);
    } catch (err: any) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoading(false);
    }
  }, [unidadeId, filtroMes]);

  useEffect(() => {
    loadTransacoes();
  }, [loadTransacoes]);

  const handlePagarClick = (transacao: TransacaoPagar) => {
    setSelectedTransacao(transacao);
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'));
    setFile(null);
    setPagarModalOpen(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedTransacao) return;
    setUploading(true);
    try {
      let comprovanteUrl = selectedTransacao.comprovante_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${activeClientId}/vencimentos/${selectedTransacao.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ged_documentos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        comprovanteUrl = uploadData.path;
      }

      const { error: updateError } = await (supabase as any)
        .from('fin_transacoes')
        .update({
          data_pagamento: dataPagamento,
          comprovante_url: comprovanteUrl
        })
        .eq('id', selectedTransacao.id);

      if (updateError) throw updateError;

      alert('Pagamento registrado com sucesso!');
      setPagarModalOpen(false);
      loadTransacoes();
    } catch (err: any) {
      alert('Erro ao registrar pagamento: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerComprovante = async (path: string) => {
    const { data } = supabase.storage.from('ged_documentos').getPublicUrl(path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  const transacoesFiltradas = transacoes.filter(t => {
    if (activeTab === 0) return t.data_pagamento === null;
    return t.data_pagamento !== null;
  });

  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Receipt size={32} />
          Contas a pagar e Vencimentos
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
          <Filter size={20} />
          <Typography variant="body2" fontWeight="bold">Vencimento:</Typography>
          <TextField
            type="month"
            size="small"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            sx={{ width: 150 }}
          />
        </Paper>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab 
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Clock size={18} />
                <span>Pendentes ({transacoes.filter(t => !t.data_pagamento).length})</span>
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle size={18} />
                <span>Pagas ({transacoes.filter(t => t.data_pagamento).length})</span>
              </Stack>
            } 
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e1e4e8', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell><b>Vencimento</b></TableCell>
                <TableCell><b>Categoria / NF</b></TableCell>
                <TableCell><b>Descrição / Fornecedor</b></TableCell>
                <TableCell align="right"><b>Valor</b></TableCell>
                <TableCell align="center"><b>Status</b></TableCell>
                <TableCell align="right"><b>Ações</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>
                      <FileText size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <Typography>Nenhuma conta encontrada para este período.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                transacoesFiltradas.map((t) => {
                  const contaNome = t.fin_lancamentos?.[0]?.fin_contas?.nome || 'Sem Categoria';
                  const dataFinal = t.data_vencimento || t.data_competencia;
                  const isVencido = !t.data_pagamento && isBefore(parseISO(dataFinal), startOfMonth(new Date())) && format(parseISO(dataFinal), 'yyyy-MM') < currentMonthStr;
                  const isVencendoHoje = !t.data_pagamento && dataFinal === format(new Date(), 'yyyy-MM-dd');
                  const sVencimento = !t.data_vencimento;

                  return (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {format(parseISO(dataFinal), 'dd/MM/yyyy')}
                        </Typography>
                        {sVencimento && <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Previsto p/ Entrega</Typography>}
                        {isVencido && <Typography variant="caption" color="error" display="block">Atrasado</Typography>}
                        {isVencendoHoje && <Typography variant="caption" color="warning.main" display="block">Vence hoje</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={contaNome} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                        <Typography variant="caption" display="block">NF: {t.nota_fiscal || 'S/N'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{t.descricao}</Typography>
                        <Typography variant="caption" color="text.secondary">Módulo: {t.origem_modulo}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {formatoMoeda.format(t.valor_total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={t.data_pagamento ? 'PAGO' : 'PENDENTE'}
                          size="small"
                          color={t.data_pagamento ? 'success' : 'warning'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {!t.data_pagamento ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Upload size={14} />}
                              onClick={() => handlePagarClick(t)}
                            >
                              Pagar
                            </Button>
                          ) : (
                            <>
                              {t.comprovante_url && (
                                <Tooltip title="Ver Comprovante">
                                  <IconButton size="small" color="primary" onClick={() => handleVerComprovante(t.comprovante_url!)}>
                                    <Eye size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Baixar Comprovante">
                                <IconButton size="small" onClick={() => t.comprovante_url && handleVerComprovante(t.comprovante_url)}>
                                  <Download size={18} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* MODAL PAGAMENTO */}
      <Dialog open={pagarModalOpen} onClose={() => setPagarModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Registrar Pagamento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">Lançamento:</Typography>
            <Typography variant="body1" fontWeight="bold">{selectedTransacao?.descricao}</Typography>
            <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
              {selectedTransacao && formatoMoeda.format(selectedTransacao.valor_total)}
            </Typography>
          </Box>

          <Stack spacing={3}>
            <TextField
              label="Data do Pagamento"
              type="date"
              fullWidth
              size="small"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Comprovante (Opcional)</Typography>
              <input
                type="file"
                accept="application/pdf,image/*"
                style={{ display: 'none' }}
                id="receipt-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="receipt-upload">
                <Button
                  component="span"
                  variant="outlined"
                  fullWidth
                  startIcon={<Upload size={18} />}
                  color={file ? 'success' : 'primary'}
                >
                  {file ? file.name : 'Selecionar Arquivo'}
                </Button>
              </label>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPagarModalOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmarPagamento}
            disabled={uploading}
          >
            {uploading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
