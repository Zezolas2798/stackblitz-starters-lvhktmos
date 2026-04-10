'use client';

import { useState } from 'react';
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
import { UserPlus, Mail, Send, X, Shield, Building, User, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Role, ClienteUnidade } from '@/lib/types';

interface UserInviteDialogProps {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  unidades: ClienteUnidade[];
}

export default function UserInviteDialog({ open, onClose, roles, unidades }: UserInviteDialogProps) {
  const theme = useTheme();

  // Estado do Formulário
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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
    if (!isAdminRole && formData.unidade_ids.length === 0) {
      setError('Selecione pelo menos uma unidade.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar Edge Function (Atualizada para aceitar unidade_ids)
      const { data, error: fnError } = await supabase.functions.invoke('convidar-usuario', {
        body: formData
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          full_name: '',
          email: '',
          cpf: '',
          registro_profissional: '',
          role_id: '',
          unidade_ids: []
        });
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao convidar:', err);
      setError(err.message || 'Erro ao enviar convite.');
    } finally {
      setLoading(false);
    }
  };

  // Determinar se precisa mostrar campo de registro técnico (baseado no cargo selecionado)
  const selectedRole = roles.find(r => r.id === formData.role_id);
  const roleNameLower = selectedRole?.nome?.toLowerCase() || '';
  const isTechnicalRole = roleNameLower.includes('nutricionista') || 
                           roleNameLower.includes('técnico') ||
                           roleNameLower.includes('engenheiro') ||
                           roleNameLower.includes('rt');
  
  const isAdminRole = roleNameLower === 'administrador';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10] }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 2, color: 'primary.main' }}>
          <UserPlus size={24} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">Convidar Novo Funcionário</Typography>
          <Typography variant="caption" color="text.secondary">O funcionário receberá um convite por e-mail para criar sua senha.</Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Convite enviado com sucesso!</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="full_name"
                label="Nome Completo"
                fullWidth
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ex: João da Silva"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="E-mail"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="joao@empresa.com"
                InputProps={{
                  startAdornment: <Mail size={18} style={{ marginRight: 8, opacity: 0.5 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="cpf"
                label="CPF"
                fullWidth
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                inputProps={{ maxLength: 14 }}
                InputProps={{
                  startAdornment: <User size={18} style={{ marginRight: 8, opacity: 0.5 }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.disabled">ATRIBUIÇÕES</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                name="role_id"
                label="Cargo / Função"
                fullWidth
                required
                value={formData.role_id}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <Shield size={18} style={{ marginRight: 8, opacity: 0.5 }} />
                }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.nome}
                  </MenuItem>
                ))}
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
                            color="primary" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    )
                  }}
                  InputProps={{
                    startAdornment: <Building size={18} style={{ marginRight: 8, opacity: 0.5 }} />
                  }}
                >
                  {unidades.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.nome_unidade}
                    </MenuItem>
                  ))}
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
                  placeholder="Ex: CRN-3 12345"
                  helperText="Obrigatório para cargos técnicos."
                  InputProps={{
                    startAdornment: <Activity size={18} style={{ marginRight: 8, opacity: 0.5 }} />
                  }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={loading} startIcon={<X size={18} />}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || success}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
            sx={{ fontWeight: 'bold', px: 4 }}
          >
            {loading ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
