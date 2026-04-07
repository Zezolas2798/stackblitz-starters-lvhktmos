'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Typography, Box,
  Chip, Alert, CircularProgress, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Divider, Paper, InputAdornment, Link
} from '@mui/material';
import { Truck, Wifi, WifiOff, Trash2, Plus, ExternalLink, TestTube } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  PLATAFORMA_META, PlataformaType, DeliveryIntegration,
  testPlatformConnection
} from '@/lib/financeiro/deliveryApiService';

interface ModalDeliveryConfigProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalDeliveryConfig({ open, onClose, onSaved }: ModalDeliveryConfigProps) {
  const { activeClientId, unidadeId } = useClient();
  const [integracoes, setIntegracoes] = useState<DeliveryIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [plataforma, setPlataforma] = useState<PlataformaType>('IFOOD');
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [taxaMdr, setTaxaMdr] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && activeClientId) loadIntegracoes();
  }, [open, activeClientId]);

  async function loadIntegracoes() {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('fin_integracoes_delivery')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (!error && data) setIntegracoes(data as DeliveryIntegration[]);
    setLoading(false);
  }

  function resetForm() {
    setPlataforma('IFOOD');
    setNomeExibicao('');
    setClientId('');
    setClientSecret('');
    setMerchantId('');
    setTaxaMdr('');
    setEditingId(null);
    setTestResult(null);
  }

  function handleEdit(item: DeliveryIntegration) {
    setEditingId(item.id);
    setPlataforma(item.plataforma);
    setNomeExibicao(item.nome_exibicao);
    setClientId(item.client_id || '');
    setClientSecret('');
    setMerchantId(item.merchant_id || '');
    setTaxaMdr(item.taxa_mdr?.toString() || '');
    setTestResult(null);
  }

  async function handleTestConnection() {
    if (!clientId || !clientSecret) {
      setTestResult({ success: false, message: 'Preencha Client ID e Client Secret para testar.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testPlatformConnection(plataforma, clientId, clientSecret);
    setTestResult(result);
    setTesting(false);
  }

  async function handleSave() {
    if (!nomeExibicao.trim() || !activeClientId) return;
    setSaving(true);

    try {
      const payload: any = {
        cliente_id: activeClientId,
        unidade_id: unidadeId || null,
        plataforma,
        nome_exibicao: nomeExibicao.trim(),
        client_id: clientId || null,
        merchant_id: merchantId || null,
        taxa_mdr: parseFloat(taxaMdr) || 0,
      };

      // Only update secret if it was provided (don't overwrite with empty)
      if (clientSecret) {
        payload.client_secret_encrypted = clientSecret;
      }

      if (editingId) {
        const { error } = await supabase
          .from('fin_integracoes_delivery')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        payload.client_secret_encrypted = clientSecret || null;
        const { error } = await supabase
          .from('fin_integracoes_delivery')
          .insert(payload);
        if (error) throw error;
      }

      resetForm();
      loadIntegracoes();
      onSaved?.();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar esta integração de delivery?')) return;
    await supabase.from('fin_integracoes_delivery').update({ ativo: false }).eq('id', id);
    loadIntegracoes();
    onSaved?.();
  }

  const meta = PLATAFORMA_META[plataforma];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 'bold' }}>
        <Truck size={22} />
        Configurar Plataformas de Delivery
      </DialogTitle>
      <DialogContent dividers>
        {/* Add/Edit Form */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: editingId ? '#fff9c4' : '#fafafa' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            {editingId ? 'Editando Plataforma' : 'Adicionar Nova Plataforma'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Plataforma</InputLabel>
                <Select
                  value={plataforma}
                  onChange={(e: any) => { setPlataforma(e.target.value); setTestResult(null); }}
                  label="Plataforma"
                >
                  {(Object.keys(PLATAFORMA_META) as PlataformaType[]).map(key => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{PLATAFORMA_META[key].logo}</span>
                        {PLATAFORMA_META[key].label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Nome de Exibição"
                fullWidth size="small"
                value={nomeExibicao}
                onChange={e => setNomeExibicao(e.target.value)}
                placeholder={`Ex: ${meta.label} - Loja Centro`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Taxa MDR / Comissão"
                fullWidth size="small" type="number"
                value={taxaMdr}
                onChange={e => setTaxaMdr(e.target.value)}
                placeholder="Ex: 12"
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>

            {/* API Credentials */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Credenciais da API (Opcional)
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Client ID"
                fullWidth size="small"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="Fornecido pelo portal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Client Secret"
                fullWidth size="small" type="password"
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder={editingId ? '••••••• (manter atual)' : 'Fornecido pelo portal'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Merchant / Store ID"
                fullWidth size="small"
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                placeholder="ID da loja na plataforma"
              />
            </Grid>

            {/* Test + Save Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined" size="small"
                  startIcon={testing ? <CircularProgress size={14} /> : <TestTube size={16} />}
                  onClick={handleTestConnection}
                  disabled={testing || !clientId}
                  color="secondary"
                >
                  Testar Conexão
                </Button>
                {meta.docsUrl && (
                  <Button
                    variant="text" size="small"
                    startIcon={<ExternalLink size={14} />}
                    href={meta.docsUrl}
                    target="_blank"
                    component="a"
                    color="info"
                  >
                    Portal {meta.label}
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                {editingId && <Button variant="outlined" size="small" onClick={resetForm}>Cancelar</Button>}
                <Button
                  variant="contained" size="small"
                  startIcon={<Plus size={16} />}
                  onClick={handleSave}
                  disabled={!nomeExibicao.trim() || saving}
                >
                  {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </Box>
            </Grid>

            {/* Test Result */}
            {testResult && (
              <Grid item xs={12}>
                <Alert severity={testResult.success ? 'success' : 'warning'} sx={{ borderRadius: 1.5 }}>
                  {testResult.message}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* List of configured platforms */}
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Plataformas Configuradas ({integracoes.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
        ) : integracoes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <Truck size={40} />
            <Typography sx={{ mt: 1 }}>Nenhuma plataforma configurada ainda.</Typography>
          </Box>
        ) : (
          <List dense sx={{ border: '1px solid #eee', borderRadius: 2 }}>
            {integracoes.map((item, idx) => {
              const pmeta = PLATAFORMA_META[item.plataforma];
              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontSize="1.2rem">{pmeta?.logo}</Typography>
                          <Typography fontWeight="bold">{item.nome_exibicao}</Typography>
                          <Chip
                            label={`MDR ${item.taxa_mdr}%`}
                            size="small" variant="outlined"
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: 'error.main', borderColor: 'error.light' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          {item.client_id ? (
                            <>
                              <Wifi size={14} color="#4caf50" />
                              <Typography variant="caption" color="success.main">Credenciais configuradas</Typography>
                            </>
                          ) : (
                            <>
                              <WifiOff size={14} color="#ff9800" />
                              <Typography variant="caption" color="warning.main">Modo manual (sem API)</Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                        <ExternalLink size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">Concluído</Button>
      </DialogActions>
    </Dialog>
  );
}
