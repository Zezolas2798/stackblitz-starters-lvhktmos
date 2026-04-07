'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Typography, Box,
  Chip, Alert, CircularProgress, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Divider, Paper
} from '@mui/material';
import { Monitor, Wifi, WifiOff, Trash2, Plus, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { PDV_META, PdvType, PdvIntegration } from '@/lib/financeiro/deliveryApiService';

interface ModalPDVProps {
  open: boolean;
  onClose: () => void;
}

export default function ModalPDV({ open, onClose }: ModalPDVProps) {
  const { activeClientId, unidadeId } = useClient();
  const [integracoes, setIntegracoes] = useState<PdvIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [tipoPdv, setTipoPdv] = useState<PdvType>('OUTRO');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && activeClientId) loadIntegracoes();
  }, [open, activeClientId]);

  async function loadIntegracoes() {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('fin_integracoes_pdv')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (!error && data) setIntegracoes(data as PdvIntegration[]);
    setLoading(false);
  }

  function resetForm() {
    setNome('');
    setTipoPdv('OUTRO');
    setApiEndpoint('');
    setApiKey('');
    setEditingId(null);
  }

  function handleEdit(item: PdvIntegration) {
    setEditingId(item.id);
    setNome(item.nome);
    setTipoPdv(item.tipo_pdv);
    setApiEndpoint(item.api_endpoint || '');
    setApiKey(''); // Never show stored key
  }

  async function handleSave() {
    if (!nome.trim() || !activeClientId) return;
    setSaving(true);

    try {
      const payload: any = {
        cliente_id: activeClientId,
        unidade_id: unidadeId || null,
        nome: nome.trim(),
        tipo_pdv: tipoPdv,
        api_endpoint: apiEndpoint || null,
        api_key_encrypted: apiKey || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('fin_integracoes_pdv')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fin_integracoes_pdv')
          .insert(payload);
        if (error) throw error;
      }

      resetForm();
      loadIntegracoes();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Desativar esta integração PDV?')) return;
    await supabase.from('fin_integracoes_pdv').update({ ativo: false }).eq('id', id);
    loadIntegracoes();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 'bold' }}>
        <Monitor size={22} />
        Integração com PDV
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Configure seu sistema de PDV para importar vendas automaticamente. 
          Após configurar as credenciais, o sistema poderá sincronizar os dados de vendas diretamente.
        </Alert>

        {/* Add/Edit Form */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: editingId ? '#fff9c4' : '#fafafa' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            {editingId ? 'Editando PDV' : 'Adicionar Novo PDV'}
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Nome do PDV"
                fullWidth size="small"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Caixa Principal"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sistema</InputLabel>
                <Select value={tipoPdv} onChange={(e: any) => setTipoPdv(e.target.value)} label="Sistema">
                  {(Object.keys(PDV_META) as PdvType[]).map(key => (
                    <MenuItem key={key} value={key}>{PDV_META[key].label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Endpoint da API (Opcional)"
                fullWidth size="small"
                value={apiEndpoint}
                onChange={e => setApiEndpoint(e.target.value)}
                placeholder="https://api.meusistema.com/v1"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Chave de API (Opcional)"
                fullWidth size="small" type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Informe a chave para autenticação"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editingId && (
                  <Button variant="outlined" size="small" onClick={resetForm}>Cancelar</Button>
                )}
                <Button
                  variant="contained" size="small" fullWidth={!editingId}
                  startIcon={<Plus size={16} />}
                  onClick={handleSave}
                  disabled={!nome.trim() || saving}
                >
                  {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* List of configured PDVs */}
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          PDVs Configurados ({integracoes.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
        ) : integracoes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <Monitor size={40} />
            <Typography sx={{ mt: 1 }}>Nenhum PDV configurado ainda.</Typography>
          </Box>
        ) : (
          <List dense sx={{ border: '1px solid #eee', borderRadius: 2 }}>
            {integracoes.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="bold">{item.nome}</Typography>
                        <Chip label={PDV_META[item.tipo_pdv]?.label || item.tipo_pdv} size="small" variant="outlined"
                          sx={{ borderColor: PDV_META[item.tipo_pdv]?.color, color: PDV_META[item.tipo_pdv]?.color, fontWeight: 'bold', fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {item.api_endpoint ? (
                          <>
                            <Wifi size={14} color="#4caf50" />
                            <Typography variant="caption" color="success.main">Endpoint configurado</Typography>
                          </>
                        ) : (
                          <>
                            <WifiOff size={14} color="#bdbdbd" />
                            <Typography variant="caption" color="text.disabled">Aguardando integração</Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                      <Settings size={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                      <Trash2 size={16} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">Concluído</Button>
      </DialogActions>
    </Dialog>
  );
}
