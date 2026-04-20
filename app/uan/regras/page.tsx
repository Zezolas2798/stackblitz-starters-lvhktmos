'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioRegraVariedade, TipoRegraVariedade, SeveridadeRegra } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Switch, FormControlLabel, InputAdornment, Tooltip
} from '@mui/material';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Scale, AlertTriangle, ShieldAlert } from 'lucide-react';

const TIPOS_REGRA: { value: TipoRegraVariedade, label: string, helper: string, hasAlvo?: boolean, hasLimite?: boolean, hasJanela?: boolean, hasSimilaridade?: boolean, unidade?: string }[] = [
  { value: 'MAX_SEMANAL_FAMILIA', label: 'Máx. por Semana (Família Proteica)', helper: 'Ex: Frango no máximo 2 vezes a cada 7 dias.', hasAlvo: true, hasLimite: true, hasJanela: true, unidade: 'vezes' },
  { value: 'DISTANCIA_MINIMA_DIAS', label: 'Distância Mínima (Dias)', helper: 'Ex: Pratos exatos devem ter pelo menos 5 dias de distância.', hasJanela: true, unidade: 'dias' },
  { value: 'MAX_DIARIO_COR', label: 'Máximo Diário (Cor)', helper: 'Ex: Máximo de 2 preparações "Marrom" por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_TEXTURA', label: 'Máximo Diário (Textura)', helper: 'Ex: Máximo de 2 preparações "Crocante" por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_METODO_COCCAO', label: 'Máximo Diário (Método de Cocção)', helper: 'Ex: Máximo de 1 fritura de imersão por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_ENXOFRE', label: 'Máximo Diário (Rico em Enxofre)', helper: 'Evita excesso de alimentos flatulentos em uma mesma refeição.', hasLimite: true, unidade: 'preparações' },
  { value: 'INCOMPATIBILIDADE_DIARIA', label: 'Incompatibilidade Diária (Ex: Fritura + Doce)', helper: 'Combinações proibidas no mesmo dia. (Use "+" entre os parâmetros)', hasAlvo: true },
  { value: 'SIMILARIDADE_ENTRE_DIAS', label: 'Similaridade entre Dias Consecutivos (Jaccard)', helper: 'Limite do índice de similaridade (0 a 1.0) entre dois dias seguidos.', hasSimilaridade: true },
  { value: 'CUSTO_MAX_REFEICAO', label: 'Teto de Custo por Refeição', helper: 'Custo médio alvo (CPC) máximo permitido por comensal.', hasLimite: true, unidade: 'R$' },
  { value: 'CUSTO_MAX_DIARIO', label: 'Teto de Custo Diário', helper: 'Custo médio alvo diário máximo permitido por comensal.', hasLimite: true, unidade: 'R$' }
];

export default function RegrasVariedadePage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [regras, setRegras] = useState<CardapioRegraVariedade[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<Partial<CardapioRegraVariedade> | null>(null);

  const loadRegras = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cardapio_regras_variedade')
      .select('*')
      .eq('cliente_id', activeClientId)
      .order('created_at', { ascending: false });

    if (data) setRegras(data as any);
    if (error) console.error('Erro ao carregar regras:', error);
    setLoading(false);
  }, [activeClientId]);

  useEffect(() => { loadRegras(); }, [loadRegras]);

  const handleNovo = () => {
    setEditingRegra({
      tipo_regra: 'MAX_SEMANAL_FAMILIA',
      severidade: 'SOFT',
      ativo: true,
      valor_limite: 1,
      dias_janela: 7
    });
    setModalOpen(true);
  };

  const handleEditar = (regra: CardapioRegraVariedade) => {
    setEditingRegra({ ...regra });
    setModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!activeClientId || !editingRegra?.tipo_regra) return;

    try {
      const payload = {
        cliente_id: activeClientId,
        tipo_regra: editingRegra.tipo_regra,
        descricao: editingRegra.descricao || null,
        parametro_alvo: editingRegra.parametro_alvo || null,
        valor_limite: editingRegra.valor_limite || null,
        dias_janela: editingRegra.dias_janela || null,
        limiar_similaridade: editingRegra.limiar_similaridade || null,
        severidade: editingRegra.severidade || 'SOFT',
        ativo: editingRegra.ativo ?? true,
        updated_at: new Date().toISOString()
      };

      if (editingRegra.id) {
        const { error } = await supabase.from('cardapio_regras_variedade').update(payload).eq('id', editingRegra.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cardapio_regras_variedade').insert(payload as any);
        if (error) throw error;
      }

      setModalOpen(false);
      loadRegras();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar regra: ' + e.message);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return;
    const { error } = await supabase.from('cardapio_regras_variedade').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else loadRegras();
  };

  const getTipoMeta = (tipo: string) => TIPOS_REGRA.find(t => t.value === tipo);

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold">Regras Sensoriais e de Custo (AQPC)</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure as restrições que o motor de cardápios usará para emitir alertas (regra SOFT) ou bloquear aprovação e forçar backtacking na geração automática (regra HARD).
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<PlusCircle size={18} />} onClick={handleNovo} color="secondary">
          Nova Regra
        </Button>
      </Box>

      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Tipo da Regra</TableCell>
              <TableCell>Configuração (Alvo / Limite / Janela)</TableCell>
              <TableCell>Severidade</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regras.map(regra => {
              const meta = getTipoMeta(regra.tipo_regra);
              return (
                <TableRow key={regra.id} hover sx={{ opacity: regra.ativo ? 1 : 0.5 }}>
                  <TableCell>
                    <Switch 
                      size="small" checked={regra.ativo} 
                      onChange={async (e) => {
                        await supabase.from('cardapio_regras_variedade').update({ ativo: e.target.checked }).eq('id', regra.id);
                        loadRegras();
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{meta?.label || regra.tipo_regra}</Typography>
                    {regra.descricao && <Typography variant="caption" color="text.secondary" display="block">{regra.descricao}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {regra.parametro_alvo && <Chip size="small" label={`Alvo: ${regra.parametro_alvo}`} />}
                      {regra.valor_limite !== null && regra.valor_limite !== undefined && (
                        <Chip size="small" color="primary" variant="outlined" 
                          label={meta?.unidade === 'R$' ? `Limite: R$ ${regra.valor_limite}` : `Limite: ${regra.valor_limite} ${meta?.unidade || ''}`} 
                        />
                      )}
                      {regra.dias_janela && <Chip size="small" label={`Janela: ${regra.dias_janela} dias`} />}
                      {regra.limiar_similaridade !== null && <Chip size="small" color="info" label={`Limiar: ${regra.limiar_similaridade}`} />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {regra.severidade === 'HARD' ? <ShieldAlert size={16} color="#d32f2f" /> : <AlertTriangle size={16} color="#ed6c02" />}
                      <Typography variant="body2" color={regra.severidade === 'HARD' ? 'error.main' : 'warning.main'} fontWeight={500}>
                        {regra.severidade}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleEditar(regra)}>
                      <Edit3 size={16} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleExcluir(regra.id)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {regras.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Scale size={48} color="#ccc" />
                  <Typography variant="h6" color="text.secondary" mt={2}>
                    Nenhuma regra configurada
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL EDIÇÃO */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRegra?.id ? 'Editar Regra' : 'Nova Regra de Variedade'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Tipo de Regra"
                value={editingRegra?.tipo_regra || ''}
                onChange={(e) => setEditingRegra({ ...editingRegra, tipo_regra: e.target.value as any, parametro_alvo: '', valor_limite: null, dias_janela: null, limiar_similaridade: null })}
              >
                {TIPOS_REGRA.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {getTipoMeta(editingRegra?.tipo_regra as any)?.helper}
              </Typography>
            </Grid>

            {getTipoMeta(editingRegra?.tipo_regra as any)?.hasAlvo && (
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Parâmetro Alvo (Ex: Aves, Vermelho)"
                  value={editingRegra?.parametro_alvo || ''}
                  onChange={(e) => setEditingRegra({ ...editingRegra, parametro_alvo: e.target.value })}
                  placeholder="Nome exato da família, cor, ou textura alvo..."
                />
              </Grid>
            )}

            {getTipoMeta(editingRegra?.tipo_regra as any)?.hasLimite && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth type="number" label={`Limite/Máx (${getTipoMeta(editingRegra?.tipo_regra as any)?.unidade || ''})`}
                  value={editingRegra?.valor_limite ?? ''}
                  onChange={(e) => setEditingRegra({ ...editingRegra, valor_limite: e.target.value ? Number(e.target.value) : null })}
                  InputProps={{
                    startAdornment: getTipoMeta(editingRegra?.tipo_regra as any)?.unidade === 'R$' ? <InputAdornment position="start">R$</InputAdornment> : null
                  }}
                />
              </Grid>
            )}

            {getTipoMeta(editingRegra?.tipo_regra as any)?.hasJanela && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth type="number" label="Janela (Dias)"
                  value={editingRegra?.dias_janela ?? ''}
                  onChange={(e) => setEditingRegra({ ...editingRegra, dias_janela: e.target.value ? Number(e.target.value) : null })}
                />
              </Grid>
            )}

            {getTipoMeta(editingRegra?.tipo_regra as any)?.hasSimilaridade && (
              <Grid item xs={12}>
                <TextField
                  fullWidth type="number" label="Limiar de Similaridade (0.0 a 1.0)"
                  value={editingRegra?.limiar_similaridade ?? ''}
                  onChange={(e) => setEditingRegra({ ...editingRegra, limiar_similaridade: e.target.value ? Number(e.target.value) : null })}
                  inputProps={{ step: 0.05, min: 0, max: 1 }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Severidade"
                value={editingRegra?.severidade || 'SOFT'}
                onChange={(e) => setEditingRegra({ ...editingRegra, severidade: e.target.value as any })}
              >
                <MenuItem value="SOFT">SOFT (Aviso Visual)</MenuItem>
                <MenuItem value="HARD">HARD (Bloqueio Total)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingRegra?.ativo ?? true}
                    onChange={(e) => setEditingRegra({ ...editingRegra, ativo: e.target.checked })}
                  />
                }
                label="Regra Ativada"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth label="Descrição/Nota Personalizada (Opcional)" multiline rows={2}
                value={editingRegra?.descricao || ''}
                onChange={(e) => setEditingRegra({ ...editingRegra, descricao: e.target.value })}
              />
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="secondary" onClick={handleSalvar}>Salvar Regra</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
