'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { Save, X, Shield, Building, User, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Profile, Role, ClienteUnidade } from '@/lib/types';

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  user: (Profile & { role_id?: string; unidade_ids?: string[] }) | null;
  roles: Role[];
  unidades: ClienteUnidade[];
}

export default function UserEditDialog({ open, onClose, user, roles, unidades }: UserEditDialogProps) {
  const theme = useTheme();

  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    registro_profissional: '',
    role_id: '',
    unidade_ids: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Máscara de CPF
  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    return raw
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        cpf: formatCPF(user.cpf || ''),
        registro_profissional: user.registro_profissional || '',
        role_id: user.role_id || '',
        unidade_ids: user.unidade_ids || []
      });
    }
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isAdminRole && formData.unidade_ids.length === 0) {
      setError('Selecione pelo menos uma unidade.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Atualizar Perfil (Tabela Profiles)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          cpf: formData.cpf,
          registro_profissional: formData.registro_profissional
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Atualizar Memberships (Cargos e Unidades)
      // Primeiro limpamos os antigos
      await supabase.from('app_user_memberships').delete().eq('usuario_id', user.id);
      
      // Criamos os novos vínculos (um por unidade selecionada)
      const memberships = formData.unidade_ids.map(uId => ({
        usuario_id: user.id,
        role_id: formData.role_id,
        unidade_id: uId,
        ativo: true
      }));

      const { error: memError } = await supabase
        .from('app_user_memberships')
        .insert(memberships);

      if (memError) throw memError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error('Erro ao editar usuário:', err);
      setError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === formData.role_id);
  const roleNameLower = selectedRole?.nome?.toLowerCase() || '';
  const isTechnicalRole = roleNameLower.includes('nutricionista') || 
                           roleNameLower.includes('técnico') ||
                           roleNameLower.includes('engenheiro') ||
                           roleNameLower.includes('rt');
  
  const isAdminRole = roleNameLower === 'administrador';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), p: 1, borderRadius: 2, color: 'secondary.main' }}>
          <User size={24} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">Editar Dados do Funcionário</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>Dados atualizados com sucesso!</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Nome Completo"
                fullWidth
                required
                value={formData.full_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="cpf"
                label="CPF"
                fullWidth
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                inputProps={{ maxLength: 14 }}
                InputProps={{ startAdornment: <User size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
              />
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.disabled">MODIFICAR CARGO/UNIDADES</Typography></Divider></Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="role_id"
                label="Cargo / Função"
                fullWidth
                required
                value={formData.role_id}
                onChange={handleChange}
                InputProps={{ startAdornment: <Shield size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
              >
                {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.nome}</MenuItem>)}
              </TextField>
            </Grid>
            {!isAdminRole ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="unidade_ids"
                  label="Unidades de Trabalho"
                  fullWidth
                  required
                  value={formData.unidade_ids}
                  onChange={handleChange}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected: any) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value: string) => (
                          <Chip 
                            key={value} 
                            label={unidades.find(u => u.id === value)?.nome_unidade || value} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    )
                  }}
                  InputProps={{ startAdornment: <Building size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                >
                  {unidades.map((unit) => <MenuItem key={unit.id} value={unit.id}>{unit.nome_unidade}</MenuItem>)}
                </TextField>
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.success.main, 0.05), 
                  borderRadius: 2, 
                  border: `1px dashed ${alpha(theme.palette.success.main, 0.3)}`,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield size={16} />
                    Acesso Global: Todas as unidades ativas.
                  </Typography>
                </Box>
              </Grid>
            )}

            {isTechnicalRole && (
              <Grid item xs={12}>
                <TextField
                  name="registro_profissional"
                  label="Registro Profissional (CRN/CRM/etc)"
                  fullWidth
                  required
                  value={formData.registro_profissional}
                  onChange={handleChange}
                  InputProps={{ startAdornment: <Activity size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading || success} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
