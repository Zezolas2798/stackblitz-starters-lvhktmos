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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Edit,
  Building,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Profile, Role, ClienteUnidade } from '@/lib/types';
import UserInviteDialog from '../../../components/UserInviteDialog';
import UserEditDialog from '../../../components/UserEditDialog';
import UserPermissionEditor from '../../../components/UserPermissionEditor';

// Estilos Premium para a Tabela
const tableRowStyle = (theme: any) => ({
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, 0.02),
    '& .action-buttons': { opacity: 1 }
  },
  transition: 'background-color 0.2s'
});

export default function GestaoUsuariosPage() {
  const theme = useTheme();

  // Estados
  const [profiles, setProfiles] = useState<(Profile & { role_name?: string; unidade_nome?: string })[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [unidades, setUnidades] = useState<ClienteUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<(Profile & { role_id?: string; unidade_id?: string }) | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<(Profile & { role_id?: string; role_name?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga de Dados
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Buscar Perfis
      const { data: profilesData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profileErr) throw profileErr;

      // 2. Buscar Memberships (para saber cargos e unidades)
      const { data: membershipsData, error: memErr } = await supabase
        .from('app_user_memberships')
        .select(`
          usuario_id,
          role_id,
          unidade_id,
          app_roles (nome),
          cliente_unidades (nome_unidade)
        `);

      if (memErr) throw memErr;

      // 3. Buscar Cargos e Unidades para os dropdowns dos modais
      const [rolesRes, unitsRes] = await Promise.all([
        supabase.from('app_roles').select('*').eq('ativo', true),
        supabase.from('cliente_unidades').select('*').eq('ativo', true)
      ]);

      setRoles((rolesRes.data as Role[]) || []);
      setUnidades((unitsRes.data as ClienteUnidade[]) || []);

      // Mapear dados para a visualização - Agrupar múltiplas unidades por usuário
      const enrichedProfiles = (profilesData || []).map(p => {
        const userMems = membershipsData?.filter(m => m.usuario_id === p.id) || [];
        
        // Assumimos que o usuário tem o mesmo cargo em todas as unidades (conforme simplificação da UI)
        const primaryMem = userMems[0];
        const unidadeIds = userMems.map(m => m.unidade_id);
        const unidadeNomes = userMems.map(m => (m.cliente_unidades as any)?.nome_unidade).filter(Boolean);

        const isGlobalAdmin = p.role === 'super_admin' || p.role === 'company_owner';

        return {
          ...p,
          role_id: primaryMem?.role_id,
          unidade_id: primaryMem?.unidade_id,
          unidade_ids: unidadeIds,
          role_name: (primaryMem?.app_roles as any)?.nome || (isGlobalAdmin ? 'Administrador' : 'Sem Cargo'),
          unidade_nome: isGlobalAdmin ? 'Acesso Global' : (unidadeNomes.length > 0 ? unidadeNomes.join(', ') : 'Sem Unidade')
        };
      });

      setProfiles(enrichedProfiles as any);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Falha ao sincronizar dados dos funcionários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtro
  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" gutterBottom sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Users size={36} color={theme.palette.primary.main} />
            Gestão de Funcionários
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie acessos, vincule cargos e unidades, e convide novos membros para a equipe.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<UserPlus size={20} />}
          onClick={() => setIsInviteModalOpen(true)}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 'bold',
            boxShadow: theme.shadows[4]
          }}
        >
          Convidar Funcionário
        </Button>
      </Box>

      {/* FILTROS E BUSCA */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Buscar por nome, e-mail ou CPF..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color={theme.palette.text.disabled} />
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
        <IconButton onClick={fetchData} color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <RefreshCw size={20} />
        </IconButton>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* LISTA DE USUÁRIOS */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Documentos</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vínculo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }} color="text.secondary">Carregando quadro de funcionários...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Typography color="text.secondary">Nenhum funcionário encontrado.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((user) => (
                <TableRow key={user.id} sx={tableRowStyle(theme)}>
                  {/* Perfil */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold' }}>
                        {user.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{user.full_name || 'Usuário sem nome'}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Mail size={12} /> {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Documentos */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        icon={<User size={14} />}
                        label={user.cpf || 'CPF não informado'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', width: 'fit-content' }}
                      />
                      {user.registro_profissional && (
                        <Chip
                          icon={<Activity size={14} />}
                          label={user.registro_profissional}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', width: 'fit-content' }}
                      />
                    )}
                    </Box>
                  </TableCell>

                  {/* Vínculo */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield size={16} color={theme.palette.primary.main} />
                        <Typography variant="body2" fontWeight="500">{user.role_name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Building size={16} color={theme.palette.text.secondary} />
                        <Typography variant="caption" color="text.secondary">{user.unidade_nome}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {/* Exemplo de status baseado em campos extras ou se já confirmou email */}
                    <Chip
                      label="Ativo"
                      size="small"
                      color="success"
                      icon={<CheckCircle2 size={14} />}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>

                  {/* Ações */}
                  <TableCell align="right">
                    <Box className="action-buttons" sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 0.2s' }}>
                      <Tooltip title="Editar Dados">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => setSelectedUserForEdit(user)}
                        >
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Configurar Acessos">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => setSelectedUserForPerms(user)}
                        >
                          <Shield size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover">
                        <IconButton size="small" color="error">
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE CONVITE */}
      <UserInviteDialog
        open={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          fetchData();
        }}
        roles={roles}
        unidades={unidades}
      />

      {/* MODAL DE EDIÇÃO */}
      <UserEditDialog
        open={!!selectedUserForEdit}
        onClose={() => {
          setSelectedUserForEdit(null);
          fetchData();
        }}
        user={selectedUserForEdit}
        roles={roles}
        unidades={unidades}
      />
      {/* MODAL DE PERMISSÕES */}
      {selectedUserForPerms && (
        <UserPermissionEditor
          userId={selectedUserForPerms.id}
          userName={selectedUserForPerms.full_name || selectedUserForPerms.email || 'Usuário'}
          roleId={selectedUserForPerms.role_id}
          roleName={selectedUserForPerms.role_name}
          onClose={() => setSelectedUserForPerms(null)}
        />
      )}
    </Container>
  );
}

