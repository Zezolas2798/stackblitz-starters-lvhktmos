'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Chip, 
  IconButton, 
  TextField, 
  useTheme, 
  alpha, 
  CircularProgress, 
  Alert,
  Collapse,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Shield, 
  Users, 
  Settings, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  ShieldCheck, 
  UserCog 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import RolePermissionEditor from '@/components/RolePermissionEditor';
import { Role } from '@/lib/types';


export default function GestaoCargosPage() {
  const theme = useTheme();
  
  // Estados de Dados
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de Ação
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Formulário de Criação
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  // 1. Carga Inicial
  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await (supabase as any).from('app_roles')
        .select('*')
        .order('is_system_role', { ascending: false }) // Sistema primeiro
        .order('nome', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar cargos:', err);
      setError('Não foi possível carregar a lista de cargos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // 2. Criar Novo Cargo
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setCreatingLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      const { error } = await (supabase as any).from('app_roles').insert({
        nome: newRoleName,
        descricao: newRoleDesc,
        is_system_role: false,
        // cliente_id: user.user_metadata?.cliente_id (Em produção)
      });

      if (error) throw error;

      // Sucesso: Limpa e recarrega
      setNewRoleName('');
      setNewRoleDesc('');
      setIsCreating(false);
      fetchRoles();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setCreatingLoading(false);
    }
  };

  // 3. Deletar Cargo
  const handleDeleteRole = async (id: string) => {
    if (!confirm('ATENÇÃO: Isso removerá o acesso de todos os usuários vinculados a este cargo. Deseja continuar?')) return;
    
    try {
      const { error } = await (supabase as any).from('app_roles').delete().eq('id', id);
      if (error) throw error;
      fetchRoles();
    } catch (err: any) {
      alert('Erro ao deletar: ' + err.message);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* CABEÇALHO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldCheck size={32} color={theme.palette.primary.main} />
            Cargos & Permissões
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
            Defina a hierarquia de acesso da sua equipe. Crie perfis personalizados ou utilize os padrões do sistema (GxP).
          </Typography>
        </Box>
        
        {!isCreating && (
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<Plus size={20} />}
            onClick={() => setIsCreating(true)}
            sx={{ px: 3, fontWeight: 'bold', borderRadius: 2 }}
          >
            Novo Cargo
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ÁREA DE CRIAÇÃO (Collapse) */}
      <Collapse in={isCreating}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            border: '1px dashed', 
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <UserCog size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight="bold" color="primary">Cadastrar Novo Perfil</Typography>
          </Box>
          
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <TextField 
                label="Nome do Cargo" 
                placeholder="Ex: Estagiário de Qualidade"
                fullWidth 
                variant="outlined"
                size="small"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                autoFocus
                sx={{ bgcolor: 'background.paper' }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField 
                label="Descrição / Responsabilidade" 
                placeholder="Ex: Acesso restrito a checklists de limpeza"
                fullWidth 
                variant="outlined"
                size="small"
                value={newRoleDesc}
                onChange={e => setNewRoleDesc(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="success"
                fullWidth
                onClick={handleCreateRole}
                disabled={creatingLoading || !newRoleName}
                startIcon={creatingLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
              >
                Salvar
              </Button>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* GRID DE CARGOS */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: role.is_system_role ? alpha(theme.palette.primary.main, 0.2) : 'divider',
                  borderRadius: 3,
                  bgcolor: role.is_system_role ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                {/* Header do Card */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: role.is_system_role ? 'primary.main' : 'grey.100',
                        color: role.is_system_role ? 'white' : 'grey.600'
                      }}
                    >
                      {role.is_system_role ? <Shield size={20} /> : <Users size={20} />}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {role.nome}
                      </Typography>
                      {role.is_system_role && (
                        <Typography variant="caption" color="primary.main" fontWeight="600">
                          Sistema (Padrão)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {role.is_system_role ? (
                    <Tooltip title="Cargo protegido do sistema">
                      <Chip label="Nativo" size="small" color="primary" variant="filled" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Excluir cargo">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteRole(role.id)}
                        sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Corpo do Card */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, minHeight: 40 }}>
                  {role.descricao || 'Sem descrição definida.'}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                {/* Footer / Ações */}
                <Button 
                  variant={role.is_system_role ? "outlined" : "outlined"}
                  color="primary"
                  fullWidth
                  startIcon={<Settings size={16} />}
                  onClick={() => setEditingRole(role)}
                  sx={{ 
                    justifyContent: 'center', 
                    fontWeight: 600,
                    borderWidth: role.is_system_role ? 2 : 1,
                    '&:hover': { borderWidth: role.is_system_role ? 2 : 1 }
                  }}
                >
                  Configurar Acessos
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* MODAL EDITOR (Mantendo a lógica funcional) */}
      {editingRole && (
        <RolePermissionEditor 
          roleId={editingRole.id}
          roleName={editingRole.nome}
          onClose={() => {
            setEditingRole(null);
            fetchRoles(); 
          }}
        />
      )}
    </Container>
  );
}


