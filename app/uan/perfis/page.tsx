'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { PerfilCardapio, PerfilCardapioSlot, CategoriaUAN } from '@/lib/types';
import { MEAL_CATEGORY_GROUPS } from '@/lib/uan-constants';
import {
  Box, Typography, Button, Paper, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Layers, Copy } from 'lucide-react';

export default function PerfisCardapioPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [perfis, setPerfis] = useState<(PerfilCardapio & { slots?: PerfilCardapioSlot[] })[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { loadPerfis(); }, [loadPerfis]);

  // Abrir modal para novo perfil
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

  // Abrir modal para editar
  const handleEditar = (perfil: PerfilCardapio & { slots?: PerfilCardapioSlot[] }) => {
    setEditingPerfil({ ...perfil });
    setEditingSlots(perfil.slots ? perfil.slots.map(s => ({ ...s })) : []);
    setModalOpen(true);
  };

  // Adicionar slot
  const addSlot = () => {
    const grupo = editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR';
    const categoriasDisponiveis = MEAL_CATEGORY_GROUPS[grupo] || [];
    setEditingSlots(prev => [...prev, {
      categoria_uan: categoriasDisponiveis[0] || 'Prato Base',
      quantidade_min: 1,
      quantidade_max: 1,
      obrigatorio: true,
      rotulo_display: '',
      ordem_exibicao: prev.length
    }]);
  };

  // Remover slot
  const removeSlot = (idx: number) => {
    setEditingSlots(prev => prev.filter((_, i) => i !== idx));
  };

  // Atualizar slot
  const updateSlot = (idx: number, updates: Partial<PerfilCardapioSlot>) => {
    setEditingSlots(prev => {
      const list = [...prev];
      list[idx] = { ...list[idx], ...updates };
      return list;
    });
  };

  // Salvar perfil (criar ou atualizar)
  const handleSalvar = async () => {
    if (!activeClientId || !editingPerfil?.nome) return alert('Preencha o nome do perfil.');
    if (editingSlots.length === 0) return alert('Adicione pelo menos um slot de categoria.');

    try {
      let perfilId = editingPerfil.id;

      if (perfilId) {
        // UPDATE
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

        // Deletar slots antigos e reinserir
        await supabase.from('perfil_cardapio_slots').delete().eq('perfil_id', perfilId);
      } else {
        // INSERT
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

      // Inserir slots
      const slotsPayload = editingSlots.map((s, idx) => ({
        perfil_id: perfilId!,
        categoria_uan: s.categoria_uan!,
        quantidade_min: Number(s.quantidade_min || 1),
        quantidade_max: Number(s.quantidade_max || 1),
        obrigatorio: s.obrigatorio ?? true,
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

  // Excluir perfil
  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este perfil de cardápio? Os slots serão removidos junto.')) return;
    const { error } = await supabase.from('perfis_cardapio').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      loadPerfis();
    }
  };

  const categoriasDoGrupo = MEAL_CATEGORY_GROUPS[editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR'] || [];

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold">Perfis de Cardápio</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure templates de refeição definindo quantas opções de cada categoria devem existir no cardápio.
        Cada refeição de um ciclo pode usar um perfil diferente (ex: Almoço com 3 saladas, Jantar com 1 salada).
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<PlusCircle size={18} />} onClick={handleNovo}>
          Novo Perfil
        </Button>
      </Box>

      {/* LISTAGEM DE PERFIS */}
      <Grid container spacing={3}>
        {perfis.map(perfil => (
          <Grid item xs={12} md={6} lg={4} key={perfil.id}>
            <Paper sx={{ p: 3, height: '100%', opacity: perfil.ativo ? 1 : 0.6, position: 'relative' }}>
              {!perfil.ativo && (
                <Chip label="Inativo" size="small" color="default" sx={{ position: 'absolute', top: 12, right: 12 }} />
              )}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Layers size={20} color="#1976d2" />
                <Typography variant="h6" fontWeight="bold">{perfil.nome}</Typography>
              </Box>
              <Chip 
                label={perfil.refeicao_grupo === 'ALMOCO_JANTAR' ? '🍽️ Almoço/Jantar' : '☕ Café/Lanches'} 
                size="small" variant="outlined" sx={{ mb: 2 }}
              />
              {perfil.descricao && (
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  {perfil.descricao}
                </Typography>
              )}

              {/* Slots resumo */}
              <Box sx={{ mb: 2 }}>
                {(perfil.slots || [])
                  .sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0))
                  .map((slot, idx) => (
                  <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" 
                    sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Typography variant="body2">
                      {slot.rotulo_display || slot.categoria_uan}
                      {!slot.obrigatorio && <Chip label="Opcional" size="small" sx={{ ml: 1, fontSize: 10, height: 18 }} />}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {slot.quantidade_min === slot.quantidade_max 
                        ? `${slot.quantidade_min}×`
                        : `${slot.quantidade_min}–${slot.quantidade_max}×`
                      }
                    </Typography>
                  </Box>
                ))}
                {(!perfil.slots || perfil.slots.length === 0) && (
                  <Typography variant="caption" color="text.secondary" fontStyle="italic">
                    Nenhum slot definido
                  </Typography>
                )}
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
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Layers size={48} color="#ccc" />
              <Typography variant="h6" color="text.secondary" mt={2}>
                Nenhum perfil criado ainda
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Crie um perfil para definir quantas opções de cada categoria (salada, proteína, etc.) compõem cada refeição.
              </Typography>
              <Button variant="contained" startIcon={<PlusCircle size={18} />} onClick={handleNovo}>
                Criar Primeiro Perfil
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPerfil?.id ? 'Editar Perfil de Cardápio' : 'Novo Perfil de Cardápio'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Nome do Perfil"
                value={editingPerfil?.nome || ''}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Almoço Industrial Completo"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select fullWidth label="Grupo de Refeição"
                value={editingPerfil?.refeicao_grupo || 'ALMOCO_JANTAR'}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, refeicao_grupo: e.target.value as any }))}
              >
                <MenuItem value="ALMOCO_JANTAR">🍽️ Almoço / Jantar</MenuItem>
                <MenuItem value="CAFE_LANCHES">☕ Café / Lanches</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPerfil?.ativo ?? true}
                    onChange={(e) => setEditingPerfil(prev => ({ ...prev, ativo: e.target.checked }))}
                  />
                }
                label="Ativo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Descrição (opcional)" multiline rows={2}
                value={editingPerfil?.descricao || ''}
                onChange={(e) => setEditingPerfil(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Template para almoços com 3 opções de salada e opção vegetariana"
              />
            </Grid>
          </Grid>

          {/* SLOTS */}
          <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Slots de Categoria</Typography>
            <Button variant="outlined" size="small" startIcon={<PlusCircle size={16} />} onClick={addSlot}>
              Adicionar Slot
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Cada slot define uma "posição" na refeição. Ex: 2-3 Saladas + 1 Prato Principal + 1 Alternativa.
          </Typography>

          {editingSlots.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Typography variant="body2" color="text.secondary">
                Clique em "Adicionar Slot" para começar a montar o template de refeição.
              </Typography>
            </Paper>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Categoria UAN</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Rótulo Display</TableCell>
                  <TableCell align="center" width={80}>Mín</TableCell>
                  <TableCell align="center" width={80}>Máx</TableCell>
                  <TableCell align="center" width={80}>Obrigatório</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editingSlots.map((slot, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth variant="standard"
                        value={slot.categoria_uan || ''}
                        onChange={(e) => updateSlot(idx, { categoria_uan: e.target.value })}
                      >
                        {categoriasDoGrupo.map(c => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth variant="standard"
                        value={slot.rotulo_display || ''}
                        onChange={(e) => updateSlot(idx, { rotulo_display: e.target.value })}
                        placeholder={slot.categoria_uan || 'Rótulo...'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small" type="number" variant="standard"
                        value={slot.quantidade_min ?? 1}
                        onChange={(e) => updateSlot(idx, { quantidade_min: Number(e.target.value) })}
                        inputProps={{ min: 0, max: 10, style: { textAlign: 'center' } }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small" type="number" variant="standard"
                        value={slot.quantidade_max ?? 1}
                        onChange={(e) => updateSlot(idx, { quantidade_max: Number(e.target.value) })}
                        inputProps={{ min: 1, max: 10, style: { textAlign: 'center' } }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={slot.obrigatorio ?? true}
                        onChange={(e) => updateSlot(idx, { obrigatorio: e.target.checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeSlot(idx)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar}>Salvar Perfil</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
