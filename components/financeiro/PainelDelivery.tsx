'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, Divider, Alert
} from '@mui/material';
import { Truck, RefreshCw, Edit3, TrendingUp, DollarSign, ShoppingBag, Wifi, WifiOff, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { PLATAFORMA_META, DeliveryIntegration } from '@/lib/financeiro/deliveryApiService';

interface VendaDelivery {
  id: string;
  integracao_id: string;
  mes_ano: string;
  receita_bruta: number;
  taxa_plataforma: number;
  repasse_liquido: number;
  pedidos_total: number;
  ticket_medio: number;
  origem: 'API' | 'MANUAL';
}

interface PainelDeliveryProps {
  competencia: string; // YYYY-MM-01
}

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PainelDelivery({ competencia }: PainelDeliveryProps) {
  const { activeClientId, unidadeId } = useClient();
  const [integracoes, setIntegracoes] = useState<DeliveryIntegration[]>([]);
  const [vendasMap, setVendasMap] = useState<Record<string, VendaDelivery>>({});
  const [loading, setLoading] = useState(true);

  // Manual entry modal
  const [manualOpen, setManualOpen] = useState(false);
  const [manualIntegracao, setManualIntegracao] = useState<DeliveryIntegration | null>(null);
  const [manualForm, setManualForm] = useState({
    receita_bruta: '', pedidos_total: '', taxa_plataforma: ''
  });
  const [savingManual, setSavingManual] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);

    // Load configured platforms
    const { data: intData } = await supabase
      .from('fin_integracoes_delivery')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true)
      .order('created_at');

    const plataformas = (intData || []) as DeliveryIntegration[];
    setIntegracoes(plataformas);

    // Load sales data for the selected period
    if (plataformas.length > 0) {
      const ids = plataformas.map(p => p.id);
      const { data: vendas } = await supabase
        .from('fin_vendas_delivery')
        .select('*')
        .in('integracao_id', ids)
        .eq('mes_ano', competencia);

      const map: Record<string, VendaDelivery> = {};
      (vendas || []).forEach((v: any) => { map[v.integracao_id] = v; });
      setVendasMap(map);
    }

    setLoading(false);
  }, [activeClientId, competencia]);

  useEffect(() => { loadData(); }, [loadData]);

  function openManualEntry(integ: DeliveryIntegration) {
    setManualIntegracao(integ);
    const existing = vendasMap[integ.id];
    if (existing) {
      setManualForm({
        receita_bruta: existing.receita_bruta.toString(),
        pedidos_total: existing.pedidos_total.toString(),
        taxa_plataforma: existing.taxa_plataforma.toString(),
      });
    } else {
      setManualForm({ receita_bruta: '', pedidos_total: '', taxa_plataforma: '' });
    }
    setManualOpen(true);
  }

  async function handleSaveManual() {
    if (!manualIntegracao || !activeClientId) return;
    setSavingManual(true);

    const bruta = parseFloat(manualForm.receita_bruta) || 0;
    const taxa = parseFloat(manualForm.taxa_plataforma) || (bruta * (manualIntegracao.taxa_mdr / 100));
    const pedidos = parseInt(manualForm.pedidos_total) || 0;
    const liquido = bruta - taxa;
    const ticket = pedidos > 0 ? bruta / pedidos : 0;

    try {
      const payload = {
        cliente_id: activeClientId,
        unidade_id: unidadeId || null,
        integracao_id: manualIntegracao.id,
        mes_ano: competencia,
        receita_bruta: bruta,
        taxa_plataforma: taxa,
        repasse_liquido: liquido,
        pedidos_total: pedidos,
        ticket_medio: ticket,
        origem: 'MANUAL' as const,
      };

      const { error } = await supabase
        .from('fin_vendas_delivery')
        .upsert(payload, { onConflict: 'integracao_id, mes_ano' });

      if (error) throw error;

      setManualOpen(false);
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSavingManual(false);
    }
  }

  // Calculate totals
  const totalBruta = Object.values(vendasMap).reduce((s, v) => s + v.receita_bruta, 0);
  const totalTaxa = Object.values(vendasMap).reduce((s, v) => s + v.taxa_plataforma, 0);
  const totalLiquido = Object.values(vendasMap).reduce((s, v) => s + v.repasse_liquido, 0);
  const totalPedidos = Object.values(vendasMap).reduce((s, v) => s + v.pedidos_total, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (integracoes.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: 2,
          bgcolor: 'background.default'
        }}
      >
        <Truck size={40} color="#bdbdbd" />
        <Typography color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
          Nenhuma plataforma de delivery configurada.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Clique em "Configurar Plataformas" no header para adicionar iFood, Rappi, Uber Eats, etc.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary Row */}
      {Object.keys(vendasMap).length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2, mb: 3, borderRadius: 2,
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            border: '1px solid #bbdefb'
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total Delivery (Bruto)</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">{formatoMoeda.format(totalBruta)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Taxas Plataformas</Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">-{formatoMoeda.format(totalTaxa)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Repasse Líquido</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">{formatoMoeda.format(totalLiquido)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total Pedidos</Typography>
              <Typography variant="h6" fontWeight="bold">{totalPedidos.toLocaleString('pt-BR')}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Platform Cards */}
      <Grid container spacing={2}>
        {integracoes.map(integ => {
          const meta = PLATAFORMA_META[integ.plataforma];
          const data = vendasMap[integ.id];
          const hasApi = !!integ.client_id;

          return (
            <Grid item xs={12} sm={6} md={4} key={integ.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5, borderRadius: 2, height: '100%',
                  border: '1px solid',
                  borderColor: data ? meta.color + '40' : 'divider',
                  position: 'relative', overflow: 'hidden',
                  '&:hover': { borderColor: meta.color, boxShadow: `0 2px 12px ${meta.color}15` },
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontSize="1.5rem">{meta.logo}</Typography>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{integ.nome_exibicao}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {hasApi ? (
                          <><Wifi size={12} color="#4caf50" /><Typography variant="caption" color="success.main">API</Typography></>
                        ) : (
                          <><WifiOff size={12} color="#ff9800" /><Typography variant="caption" color="warning.main">Manual</Typography></>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Chip
                    label={`MDR ${integ.taxa_mdr}%`}
                    size="small"
                    sx={{
                      bgcolor: meta.color + '15',
                      color: meta.color,
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>

                {/* Data */}
                {data ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Receita Bruta</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatoMoeda.format(data.receita_bruta)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Taxa Plataforma</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">-{formatoMoeda.format(data.taxa_plataforma)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Repasse Líquido</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">{formatoMoeda.format(data.repasse_liquido)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Pedidos / Ticket Médio</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {data.pedidos_total} / {formatoMoeda.format(data.ticket_medio)}
                      </Typography>
                    </Box>
                    <Chip
                      label={data.origem === 'API' ? '📡 Via API' : '✏️ Manual'}
                      size="small" variant="outlined"
                      sx={{ mt: 1.5, fontSize: '0.65rem', fontWeight: 'bold' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <DollarSign size={28} color="#bdbdbd" />
                    <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                      Sem dados neste mês
                    </Typography>
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {hasApi && (
                    <Button
                      size="small" variant="outlined" fullWidth
                      startIcon={<RefreshCw size={14} />}
                      sx={{ borderColor: meta.color, color: meta.color, fontSize: '0.7rem' }}
                      disabled
                    >
                      Sincronizar
                    </Button>
                  )}
                  <Button
                    size="small" variant={hasApi ? 'text' : 'contained'} fullWidth
                    startIcon={<Edit3 size={14} />}
                    onClick={() => openManualEntry(integ)}
                    sx={{
                      fontSize: '0.7rem',
                      ...(hasApi ? {} : { bgcolor: meta.color, '&:hover': { bgcolor: meta.color + 'dd' } })
                    }}
                  >
                    {data ? 'Editar' : 'Lançar'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Manual Entry Modal */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          {manualIntegracao && (
            <Typography fontSize="1.3rem">{PLATAFORMA_META[manualIntegracao.plataforma]?.logo}</Typography>
          )}
          Lançar Vendas — {manualIntegracao?.nome_exibicao}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Insira os dados financeiros do mês. A taxa será calculada automaticamente pela MDR configurada ({manualIntegracao?.taxa_mdr}%) ou pode ser informada manualmente.
          </Typography>

          <TextField
            label="Receita Bruta"
            fullWidth sx={{ mb: 2 }}
            type="number"
            value={manualForm.receita_bruta}
            onChange={e => setManualForm(p => ({ ...p, receita_bruta: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
          />
          <TextField
            label="N° de Pedidos"
            fullWidth sx={{ mb: 2 }}
            type="number"
            value={manualForm.pedidos_total}
            onChange={e => setManualForm(p => ({ ...p, pedidos_total: e.target.value }))}
          />
          <TextField
            label="Taxa da Plataforma (Opcional)"
            fullWidth sx={{ mb: 2 }}
            type="number"
            value={manualForm.taxa_plataforma}
            onChange={e => setManualForm(p => ({ ...p, taxa_plataforma: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            helperText={`Se vazio, será calculado: ${manualIntegracao?.taxa_mdr || 0}% da receita bruta`}
          />

          {manualForm.receita_bruta && (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <strong>Previsão:</strong> Repasse Líquido ={' '}
              {formatoMoeda.format(
                (parseFloat(manualForm.receita_bruta) || 0) -
                (parseFloat(manualForm.taxa_plataforma) || (parseFloat(manualForm.receita_bruta) || 0) * ((manualIntegracao?.taxa_mdr || 0) / 100))
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setManualOpen(false)}>Cancelar</Button>
          <Button
            variant="contained" onClick={handleSaveManual}
            disabled={savingManual || !manualForm.receita_bruta}
          >
            {savingManual ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
