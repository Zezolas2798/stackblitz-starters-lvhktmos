import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import { Edit2, Trash2, Save, X, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface GrupoEstoque {
  id: string;
  nome: string;
  count: number;
}

interface GerenciarGruposDialogProps {
  open: boolean;
  onClose: () => void;
  clienteId: string;
}

export default function GerenciarGruposDialog({ open, onClose, clienteId }: GerenciarGruposDialogProps) {
  const theme = useTheme();
  const [grupos, setGrupos] = useState<GrupoEstoque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (open && clienteId) {
      loadGrupos();
    }
  }, [open, clienteId]);

  async function loadGrupos() {
    setLoading(true);
    setError(null);
    try {
      // Fetch all groups for this client
      const { data: gruposData, error: gruposError } = await (supabase as any)
        .from('subgrupos_produto')
        .select('id, nome')
        .eq('cliente_id', clienteId)
        .order('nome');

      if (gruposError) throw gruposError;

      // Fetch usage count for each group to prevent deleting groups in use
      const gruposComContagem = await Promise.all((gruposData || []).map(async (grupo: any) => {
        const { count, error: countError } = await (supabase as any)
          .from('ingredientes')
          .select('*', { count: 'exact', head: true })
          .eq('subgrupo_id', grupo.id);
          
        if (countError) throw countError;
        
        return { ...grupo, count: count || 0 };
      }));

      setGrupos(gruposComContagem);
    } catch (err: any) {
      console.error('Erro ao carregar grupos:', err);
      setError('Falha ao carregar os grupos de estoque.');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(grupo: GrupoEstoque) {
    setEditingId(grupo.id);
    setEditName(grupo.nome);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      const { error } = await (supabase as any)
        .from('subgrupos_produto')
        .update({ nome: editName.trim() })
        .eq('id', id);

      if (error) throw error;
      
      cancelEdit();
      loadGrupos();
    } catch (err: any) {
      alert('Erro ao salvar alteração: ' + err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;
    try {
      const { error } = await (supabase as any)
        .from('subgrupos_produto')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadGrupos();
    } catch (err: any) {
      alert('Erro ao excluir grupo: ' + err.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Package size={20} />
        Gerenciar Grupos de Estoque
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Grupos de estoque unem ingredientes do mesmo tipo, mas de marcas diferentes, permitindo alocação flexível na produção.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : grupos.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhum grupo cadastrado para esta unidade. Crie grupos ao cadastrar novos ingredientes.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {grupos.map(grupo => (
              <ListItem 
                key={grupo.id} 
                divider 
                sx={{ 
                  bgcolor: editingId === grupo.id ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  px: 1
                }}
              >
                {editingId === grupo.id ? (
                  // MODO EDIÇÃO
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <IconButton color="success" onClick={() => handleSaveEdit(grupo.id)} disabled={!editName.trim()}>
                      <Save size={18} />
                    </IconButton>
                    <IconButton color="default" onClick={cancelEdit}>
                      <X size={18} />
                    </IconButton>
                  </Box>
                ) : (
                  // MODO VISUALIZAÇÃO
                  <>
                    <ListItemText 
                      primary={<Typography fontWeight="medium">{grupo.nome}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {grupo.count} ingrediente{grupo.count !== 1 ? 's' : ''} vinculado{grupo.count !== 1 ? 's' : ''}
                        </Typography>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => startEdit(grupo)}>
                        <Edit2 size={18} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(grupo.id)}
                        disabled={grupo.count > 0} // Não permite excluir se houver ingredientes vinculados
                        title={grupo.count > 0 ? "Remova os ingredientes deste grupo antes de excluí-lo." : "Excluir Grupo"}
                      >
                        <Trash2 size={18} opacity={grupo.count > 0 ? 0.3 : 1} />
                      </IconButton>
                    </Box>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
