'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  Switch,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import {
  Shield,
  Save,
  ChevronRight,
  Info,
  Layers,
  Users,
  Search,
  X,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  Trophy
} from 'lucide-react';

interface Role {
  id: string;
  nome: string;
  descricao: string | null;
  is_system_role: boolean;
}

interface Permission {
  slug: string;
  descricao: string | null;
  modulo: string;
}

export default function GestaoPermissoesSistemaV2() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Carregar todos os cargos globais (catálogo completo)
      const { data: rolesData, error: rolesError } = await supabase
        .from('app_roles')
        .select('*')
        .is('cliente_id', null)
        .eq('ativo', true)
        .order('nome');

      const { data: permsData, error: permsError } = await supabase
        .from('app_permissions')
        .select('*')
        .order('modulo', { ascending: true })
        .order('descricao', { ascending: true });

      if (rolesError) throw rolesError;
      if (permsError) throw permsError;

      setRoles(rolesData || []);
      setPermissions(permsData || []);
      
      if (rolesData && rolesData.length > 0) {
        handleSelectRole(rolesData[0].id);
      }
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (roleId: string) => {
    setSelectedRoleId(roleId);
    setSuccess(false);
    try {
      const { data, error } = await supabase
        .from('app_role_permissions')
        .select('permission_slug')
        .eq('role_id', roleId);

      if (error) throw error;
      setRolePermissions(new Set(data.map(p => p.permission_slug)));
    } catch (err: any) {
      setError('Erro ao carregar permissões do cargo: ' + err.message);
    }
  };

  const togglePermission = (slug: string) => {
    const next = new Set(rolePermissions);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setRolePermissions(next);
    setSuccess(false);
  };

  const toggleAllInModule = (modulo: string, active: boolean) => {
    const next = new Set(rolePermissions);
    const modulePerms = permissions.filter(p => p.modulo === modulo);
    
    modulePerms.forEach(p => {
      if (active) next.add(p.slug);
      else next.delete(p.slug);
    });

    setRolePermissions(next);
    setSuccess(false);
  };

  const saveChanges = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Remover permissões atuais
      const { error: deleteError } = await supabase
        .from('app_role_permissions')
        .delete()
        .eq('role_id', selectedRoleId);

      if (deleteError) throw deleteError;

      // 2. Inserir novas permissões
      if (rolePermissions.size > 0) {
        const toInsert = Array.from(rolePermissions).map(slug => ({
          role_id: selectedRoleId,
          permission_slug: slug
        }));

        const { error: insertError } = await supabase
          .from('app_role_permissions')
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(r => 
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.descricao?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  // Agrupar permissões por módulo
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(p => {
      if (!grouped[p.modulo]) grouped[p.modulo] = [];
      grouped[p.modulo].push(p);
    });
    return grouped;
  }, [permissions]);

  const getModuleStats = (modulo: string) => {
    const perms = groupedPermissions[modulo] || [];
    const active = perms.filter(p => rolePermissions.has(p.slug)).length;
    return { active, total: perms.length };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="body1" sx={{ animate: 'pulse 1.5s infinite' }}>Carregando catálogo de cargos...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Header Premium */}
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <Shield size={32} />
            </Box>
            <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>
              Ecossistema de Cargos
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight="400">
            Defina o padrão de acesso para as centenas de funções do ecossistema.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={fetchData}
            startIcon={<RefreshCw size={18} />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Sincronizar
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            disabled={saving || !selectedRoleId}
            onClick={saveChanges}
            sx={{ 
              borderRadius: 2, 
              px: 5, 
              py: 1.5,
              boxShadow: theme.shadows[4],
              '&:hover': { boxShadow: theme.shadows[8] }
            }}
          >
            {saving ? 'Publicando...' : 'Publicar Gabarito'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3, py: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 3, py: 2 }}>As alterações foram publicadas para todos os clientes do ecossistema.</Alert>}

      <Grid container spacing={4}>
        {/* Lado Esquerdo: Biblioteca de Cargos */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ 
            height: '75vh', 
            borderRadius: 4, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1)
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: theme.palette.divider }}>
              <Typography variant="subtitle2" fontWeight="800" color="primary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Biblioteca de Cargos
              </Typography>
              <TextField 
                fullWidth
                size="small"
                placeholder="Pesquisar cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color={theme.palette.text.disabled} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <X size={14} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.8) }
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {filteredRoles.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Nenhum cargo encontrado.</Typography>
                </Box>
              ) : (
                <List>
                  {filteredRoles.map((role) => (
                    <ListItemButton 
                      key={role.id}
                      selected={selectedRoleId === role.id}
                      onClick={() => handleSelectRole(role.id)}
                      sx={{
                        borderRadius: 3,
                        mb: 0.5,
                        py: 1.5,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                          '& .MuiListItemText-primary': { fontWeight: 800 }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: selectedRoleId === role.id ? 'inherit' : alpha(theme.palette.text.primary, 0.3) }}>
                        {role.is_system_role ? <Shield size={20} /> : <Users size={20} />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={role.nome} 
                        secondary={role.descricao}
                        primaryTypographyProps={{ variant: 'body2', sx: { noWrap: true } }}
                        secondaryTypographyProps={{ variant: 'caption', sx: { noWrap: true, opacity: 0.6 } }}
                      />
                      <ChevronRight size={16} style={{ opacity: selectedRoleId === role.id ? 1 : 0.2 }} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
            
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.8), borderTop: '1px solid', borderColor: theme.palette.divider }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Trophy size={14} /> {filteredRoles.length} cargos no diretório global
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Lado Direito: Matriz de Permissões V2 */}
        <Grid item xs={12} md={8} lg={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Banner de Cargo Ativo */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 4, 
              bgcolor: theme.palette.primary.main, 
              color: 'white',
              boxShadow: '0 8px 32px ' + alpha(theme.palette.primary.main, 0.25),
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>Editando Gabarito Padrão</Typography>
                  <Typography variant="h4" fontWeight="800">{roles.find(r => r.id === selectedRoleId)?.nome}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{roles.find(r => r.id === selectedRoleId)?.descricao || 'Cargo padrão do ecossistema'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h2" fontWeight="900" sx={{ opacity: 0.3 }}>{rolePermissions.size}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Permissões Ativas</Typography>
                </Box>
              </Box>
              <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, transform: 'rotate(-15deg)' }}>
                <Shield size={180} />
              </Box>
            </Paper>

            {/* Matriz de Módulos */}
            <Grid container spacing={3}>
              {Object.entries(groupedPermissions).map(([modulo, perms]) => {
                const stats = getModuleStats(modulo);
                const allActive = stats.active === stats.total;
                
                return (
                  <Grid item xs={12} lg={6} key={modulo}>
                    <Paper sx={{ 
                      borderRadius: 4, 
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.divider, 0.1),
                    }}>
                      {/* Header do Módulo */}
                      <Box sx={{ 
                        p: 2.5, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.03)
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Badge 
                            badgeContent={`${stats.active}/${stats.total}`} 
                            color="primary"
                            sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}
                          >
                            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'white', color: theme.palette.primary.main, boxShadow: theme.shadows[1] }}>
                              <Layers size={20} />
                            </Box>
                          </Badge>
                          <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: 0.5 }}>{modulo}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title={allActive ? "Desmarcar Todos" : "Marcar Todos"}>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleAllInModule(modulo, !allActive)}
                              sx={{ 
                                bgcolor: allActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                color: allActive ? theme.palette.primary.main : 'inherit'
                              }}
                            >
                              {allActive ? <CheckSquare size={18} /> : <Square size={18} />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Divider />

                      {/* Lista de Permissões do Módulo */}
                      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {perms.map((perm) => (
                          <Box 
                            key={perm.slug} 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              p: 1.5,
                              borderRadius: 2,
                              transition: 'all 0.2s',
                              bgcolor: rolePermissions.has(perm.slug) ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="700" color={rolePermissions.has(perm.slug) ? 'primary' : 'text.primary'}>
                                {perm.descricao || perm.slug}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {perm.slug}
                              </Typography>
                            </Box>
                            <Switch 
                              checked={rolePermissions.has(perm.slug)}
                              onChange={() => togglePermission(perm.slug)}
                              color="primary"
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Rodapé Informativo */}
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              borderRadius: 4, 
              bgcolor: alpha(theme.palette.info.main, 0.05),
              border: '1px dashed ' + alpha(theme.palette.info.main, 0.3),
              display: 'flex',
              gap: 3,
              alignItems: 'center'
            }}>
              <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'white', color: theme.palette.info.main, boxShadow: theme.shadows[1] }}>
                <Info size={24} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="800" color="info.main">Sobre a Governança de Gabaritos</Typography>
                <Typography variant="body2" color="text.secondary">
                  As permissões definidas nesta tela servem como a **espinha dorsal** do sistema. Ao serem salvas, elas tornam-se o acesso padrão para cada usuário vinculado a esse cargo em qualquer cliente. Diferenciações individuais para funcionários multi-tarefas podem ser feitas diretamente na gestão de usuários de cada unidade.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
