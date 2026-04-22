'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { PerfilCardapio, PerfilCardapioSlot, FichaTecnicaUAN } from '@/lib/types';
import { MEAL_CATEGORY_GROUPS } from '@/lib/uan-constants';
import {
  Box, Typography, Button, Paper, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Switch, FormControlLabel, CircularProgress,
  Autocomplete, Tooltip
} from '@mui/material';
import { PlusCircle, Edit3, Trash2, Layers, Lock, Unlock } from 'lucide-react';

export default function PerfisCardapioTab() {
  const { activeClientId } = useClient();
  const [perfis, setPerfis] = useState<(PerfilCardapio & { slots?: PerfilCardapioSlot[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [fichasDisponiveis, setFichasDisponiveis] = useState<FichaTecnicaUAN[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Partial<PerfilCardapio> | null>(null);
  const [editingSlots, setEditingSlots] = useState<Partial<PerfilCardapioSlot>[]>([]);

  const loadPerfis = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis_cardapio')
      .select('*, slots:perfil_cardapio_slots(*)')
      .eq('cliente_id', activeClientId)
      .order('created_at', { ascending: false });

    if (data) setPerfis(data as any);
    if (error) console.error('Erro ao carregar perfis:', error);
    setLoading(false);
  }, [activeClientId]);

  const loadFichas = useCallback(async () => {
    if (!activeClientId) return;
    const { data } = await supabase
      .from('fichas_tecnicas_uan')
      .select('id, nome, categoria_uan')
      .eq('cliente_id', activeClientId)
      .order('nome');
    if (data) setFichasDisponiveis(data as unknown as FichaTecnicaUAN[]);
  }, [activeClientId]);

  useEffect(() => { loadPerfis(); loadFichas(); }, [loadPerfis, loadFichas]);

  const handleNovo = () => {
    setEditingPerfil({
      nome: '',
      refeicao_grupo: 'ALMOCO_JANTAR',
      descricao: '',
      ativo: true
    });
    setEditingSlots([]);
    setModalOpen(true);
  };

  const handleEditar = (perfil: PerfilCardapio & { slots?: PerfilCardapioSlot[] }) => {
    setEditingPerfil({ ...perfil });
    setEditingSlots(perfil.slots ? perfil.slots.map(s => ({ ...s })) : []);
    setModalOpen(true);
  };

  const addSlot = () => {
    const grupo = editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR';
    const categoriasDisponiveis = MEAL_CATEGORY_GROUPS[grupo] || [];
    setEditingSlots(prev => [...prev, {
      categoria_uan: categoriasDisponiveis[0] || 'Prato Base',
      quantidade_min: 1,
      quantidade_max: 1,
      obrigatorio: true,
      fixo: false,
      fichas_fixas: null,
      rotulo_display: '',
      ordem_exibicao: prev.length
    }]);
  };

  const removeSlot = (idx: number) => {
    setEditingSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, updates: Partial<PerfilCardapioSlot>) => {
    setEditingSlots(prev => {
      const list = [...prev];
      list[idx] = { ...list[idx], ...updates };
      // Se desativar fixo, limpa fichas fixas
      if (updates.fixo === false) {
        list[idx].fichas_fixas = null;
      }
      return list;
    });
  };

  const handleSalvar = async () => {
    if (!activeClientId || !editingPerfil?.nome) return alert('Preencha o nome do perfil.');
    if (editingSlots.length === 0) return alert('Adicione pelo menos um slot de categoria.');

    // Validação: slots fixos devem ter fichas selecionadas
    const invalidFixed = editingSlots.find(s => s.fixo && (!s.fichas_fixas || s.fichas_fixas.length === 0));
    if (invalidFixed) {
      return alert(`O slot fixo "${invalidFixed.rotulo_display || invalidFixed.categoria_uan}" precisa ter pelo menos uma ficha selecionada.`);
    }

    try {
      let perfilId = editingPerfil.id;

      if (perfilId) {
        const { error } = await supabase
          .from('perfis_cardapio')
          .update({
            nome: editingPerfil.nome,
            descricao: editingPerfil.descricao || null,
            refeicao_grupo: editingPerfil.refeicao_grupo,
            ativo: editingPerfil.ativo ?? true,
            updated_at: new Date().toISOString()
          })
          .eq('id', perfilId);
        if (error) throw error;
        await supabase.from('perfil_cardapio_slots').delete().eq('perfil_id', perfilId);
      } else {
        const { data, error } = await supabase
          .from('perfis_cardapio')
          .insert({
            cliente_id: activeClientId,
            nome: editingPerfil.nome,
            descricao: editingPerfil.descricao || null,
            refeicao_grupo: editingPerfil.refeicao_grupo,
            ativo: editingPerfil.ativo ?? true
          } as any)
          .select()
          .single();
        if (error || !data) throw error;
        perfilId = data.id;
      }

      const slotsPayload = editingSlots.map((s, idx) => ({
        perfil_id: perfilId!,
        categoria_uan: s.categoria_uan!,
        quantidade_min: Number(s.quantidade_min || 1),
        quantidade_max: Number(s.quantidade_max || 1),
        obrigatorio: s.obrigatorio ?? true,
        fixo: s.fixo ?? false,
        fichas_fixas: s.fixo && s.fichas_fixas?.length ? s.fichas_fixas : null,
        rotulo_display: s.rotulo_display || null,
        ordem_exibicao: idx
      }));

      const { error: errSlots } = await supabase.from('perfil_cardapio_slots').insert(slotsPayload as any);
      if (errSlots) throw errSlots;

      setModalOpen(false);
      loadPerfis();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar: ' + e.message);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este perfil de cardápio? Os slots serão removidos junto.')) return;
    const { error } = await supabase.from('perfis_cardapio').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else loadPerfis();
  };

  const categoriasDoGrupo = MEAL_CATEGORY_GROUPS[editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR'] || [];

  // Filtra fichas compatíveis com a categoria do slot
  const getFichasParaCategoria = (categoriaUan: string) => {
    return fichasDisponiveis.filter(f => f.categoria_uan === categoriaUan);
  };

  if (loading && perfis.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Configure templates de refeição definindo quantas opções de cada categoria devem existir no cardápio.
        </Typography>
        <Button variant="contained" startIcon={<PlusCircle size={18} />} onClick={handleNovo} size="small">
          Novo Perfil
        </Button>
      </Box>

      <Grid container spacing={2}>
        {perfis.map(perfil => (
          <Grid item xs={12} md={6} key={perfil.id}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', opacity: perfil.ativo ? 1 : 0.6, position: 'relative' }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Layers size={18} color="#1976d2" />
                <Typography variant="subtitle1" fontWeight="bold">{perfil.nome}</Typography>
                {!perfil.ativo && <Chip label="Inativo" size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
              </Box>
              
              <Chip 
                label={perfil.refeicao_grupo === 'ALMOCO_JANTAR' ? '🍽️ Almoço/Jantar' : '☕ Café/Lanches'} 
                size="small" variant="outlined" color="info" sx={{ mb: 1, height: 20, fontSize: 10 }}
              />

              <Box sx={{ mb: 2, maxHeight: 150, overflowY: 'auto' }}>
                {(perfil.slots || [])
                  .sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0))
                  .map((slot, idx) => (
                  <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" 
                    sx={{ py: 0.25, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {slot.fixo && (
                        <Tooltip title="Slot fixo — mesma(s) ficha(s) todo dia">
                          <Lock size={12} color="#f59e0b" />
                        </Tooltip>
                      )}
                      <Typography variant="caption">
                        {slot.rotulo_display || slot.categoria_uan}
                      </Typography>
                      {slot.fixo && slot.fichas_fixas && slot.fichas_fixas.length > 0 && (
                        <Chip 
                          label={`${slot.fichas_fixas.length} fixa(s)`} 
                          size="small" 
                          sx={{ height: 16, fontSize: 9, bgcolor: '#fef3c7', color: '#92400e' }} 
                        />
                      )}
                    </Box>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      {slot.quantidade_min === slot.quantidade_max ? `${slot.quantidade_min}×` : `${slot.quantidade_min}–${slot.quantidade_max}×`}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box display="flex" gap={1}>
                <Button size="small" startIcon={<Edit3 size={14} />} onClick={() => handleEditar(perfil)}>
                  Editar
                </Button>
                <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={() => handleExcluir(perfil.id)}>
                  Excluir
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
        {perfis.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary">Nenhum perfil de cardápio configurado.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPerfil?.id ? 'Editar Perfil' : 'Novo Perfil'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Nome do Perfil" size="small"
                value={editingPerfil?.nome || ''}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select fullWidth label="Grupo" size="small"
                value={editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR'}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, refeicao_grupo: e.target.value as any }))}
              >
                <MenuItem value="ALMOCO_JANTAR">🍽️ Almoço/Jantar</MenuItem>
                <MenuItem value="CAFE_LANCHES">☕ Café/Lanches</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={<Switch size="small" checked={editingPerfil?.ativo ?? true} onChange={(e) => setEditingPerfil(prev => ({ ...prev, ativo: e.target.checked }))} />}
                label="Ativo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Descrição" size="small" multiline rows={2}
                value={editingPerfil?.descricao || ''}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" fontWeight="bold">Slots de Categoria</Typography>
            <Button variant="outlined" size="small" startIcon={<PlusCircle size={14} />} onClick={addSlot}>
              Adicionar Slot
            </Button>
          </Box>

          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Categoria</TableCell>
                <TableCell>Rótulo</TableCell>
                <TableCell align="center">Mín</TableCell>
                <TableCell align="center">Máx</TableCell>
                <TableCell align="center">Obrigatório</TableCell>
                <TableCell align="center">
                  <Tooltip title="Slot fixo: mesma(s) ficha(s) todo dia, sem variação">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Lock size={12} /> Fixo
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell width={40}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editingSlots.map((slot, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth variant="standard"
                        value={slot.categoria_uan || ''}
                        onChange={(e) => updateSlot(idx, { categoria_uan: e.target.value, fichas_fixas: null })}
                      >
                        {categoriasDoGrupo.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth variant="standard"
                        value={slot.rotulo_display || ''}
                        onChange={(e) => updateSlot(idx, { rotulo_display: e.target.value })}
                        placeholder={slot.categoria_uan as string}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small" type="number" variant="standard" sx={{ width: 40 }}
                        value={slot.quantidade_min ?? 1}
                        onChange={(e) => updateSlot(idx, { quantidade_min: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small" type="number" variant="standard" sx={{ width: 40 }}
                        value={slot.quantidade_max ?? 1}
                        onChange={(e) => updateSlot(idx, { quantidade_max: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch size="small" checked={slot.obrigatorio ?? true} onChange={(e) => updateSlot(idx, { obrigatorio: e.target.checked })} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={slot.fixo ? 'Fixo: mesma(s) ficha(s) todo dia' : 'Variável: solver escolhe automaticamente'}>
                        <Switch 
                          size="small" 
                          checked={slot.fixo ?? false} 
                          onChange={(e) => updateSlot(idx, { fixo: e.target.checked })}
                          color="warning"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeSlot(idx)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {/* Seletor de fichas fixas (visível apenas quando fixo=true) */}
                  {slot.fixo && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 1, bgcolor: '#fffbeb', borderLeft: '3px solid #f59e0b' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Lock size={14} color="#f59e0b" />
                          <Typography variant="caption" fontWeight="bold" color="#92400e">
                            Fichas fixas para "{slot.rotulo_display || slot.categoria_uan}":
                          </Typography>
                        </Box>
                        <Autocomplete
                          multiple
                          size="small"
                          options={getFichasParaCategoria(slot.categoria_uan as string)}
                          getOptionLabel={(opt) => opt.nome}
                          value={fichasDisponiveis.filter(f => (slot.fichas_fixas || []).includes(f.id))}
                          onChange={(_, selected) => updateSlot(idx, { fichas_fixas: selected.map(f => f.id) })}
                          renderInput={(params) => (
                            <TextField {...params} variant="outlined" placeholder="Selecione as fichas que serão fixas todo dia..." size="small" sx={{ mt: 0.5 }} />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((opt, i) => (
                              <Chip {...getTagProps({ index: i })} key={opt.id} label={opt.nome} size="small" 
                                sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }} />
                            ))
                          }
                          noOptionsText="Nenhuma ficha desta categoria encontrada"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
