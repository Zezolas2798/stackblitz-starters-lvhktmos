'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  Typography,
  Box,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
  Grid,
  Alert
} from '@mui/material';
import {
  Shield,
  Save,
  Check,
  ChefHat,
  Package,
  ClipboardCheck,
  Settings,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Permission = {
  slug: string;
  descricao: string;
  modulo: string;
};

interface UserPermissionEditorProps {
  userId: string;
  userName: string;
  roleId?: string;
  roleName?: string;
  onClose: () => void;
}

const MODULE_ICONS: Record<string, any> = {
  'NUTRICAO': <ChefHat size={18} />,
  'ESTOQUE': <Package size={18} />,
  'PRODUCAO': <ChefHat size={18} />,
  'QUALIDADE': <ClipboardCheck size={18} />,
  'SISTEMA': <Settings size={18} />
};

export default function UserPermissionEditor({ userId, userName, roleId, roleName, onClose }: UserPermissionEditorProps) {
  const theme = useTheme();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [inheritedSlugs, setInheritedSlugs] = useState<Set<string>>(new Set());
  const [individualSlugs, setIndividualSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Catálogo completo
      const { data: allPerms } = await supabase.from('app_permissions')
        .select('*')
        .order('modulo', { ascending: false })
        .order('descricao', { ascending: true });

      // 2. Permissões do Cargo (Herdadas)
      let roleSet = new Set<string>();
      if (roleId) {
        const { data: rolePerms } = await supabase.from('app_role_permissions')
          .select('permission_slug')
          .eq('role_id', roleId);
        rolePerms?.forEach((p: any) => roleSet.add(p.permission_slug));
      }

      // 3. Permissões Individuais (Overrides)
      const { data: userPerms } = await supabase.from('app_user_permissions')
        .select('permission_slug')
        .eq('usuario_id', userId);

      const userSet = new Set<string>();
      userPerms?.forEach((p: any) => userSet.add(p.permission_slug));

      if (allPerms) setPermissions(allPerms as Permission[]);
      setInheritedSlugs(roleSet);
      setIndividualSlugs(userSet);
      setLoading(false);
    }
    loadData();
  }, [userId, roleId]);

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.modulo]) acc[perm.modulo] = [];
    acc[perm.modulo].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleToggle = (slug: string) => {
    // Se já é herdada, não permitimos "desligar" via override individual (neste modelo simples)
    // Mas permitimos adicionar se não for herdada.
    if (inheritedSlugs.has(slug)) return;

    const next = new Set(individualSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setIndividualSlugs(next);
  };

  const handleSave = async () => {
    setSaving(true);
    // Limpar e Inserir overrides individuais
    await supabase.from('app_user_permissions').delete().eq('usuario_id', userId);
    
    if (individualSlugs.size > 0) {
      const inserts = Array.from(individualSlugs).map(slug => ({
        usuario_id: userId,
        permission_slug: slug
      }));
      await supabase.from('app_user_permissions').insert(inserts);
    }

    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 2, display: 'flex' }}>
            <Shield size={24} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">Personalizar Acessos</Typography>
            <Typography variant="body2" color="text.secondary">
              Usuário: <span style={{ color: theme.palette.primary.main, fontWeight: 600 }}>{userName}</span> 
              {roleName && <Typography component="span" variant="caption" sx={{ ml: 1 }}>(Cargo: {roleName})</Typography>}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3, bgcolor: 'background.default' }}>
        <Alert icon={<Info size={18} />} severity="info" sx={{ mb: 3 }}>
          As permissões marcadas em <b>azul</b> são herdadas do cargo e não podem ser removidas individualmente. 
          Use os switches para adicionar permissões extras.
        </Alert>

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : (
          <Grid container spacing={3}>
            {Object.entries(groupedPermissions).map(([modulo, perms]) => (
              <Grid item xs={12} key={modulo}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    {MODULE_ICONS[modulo] || <Settings size={18} />}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>{modulo}</Typography>
                  <Divider sx={{ flexGrow: 1, ml: 2 }} />
                </Box>

                <Grid container spacing={1.5}>
                  {perms.map((perm) => {
                    const isInherited = inheritedSlugs.has(perm.slug);
                    const isIndividual = individualSlugs.has(perm.slug);
                    const isActive = isInherited || isIndividual;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={perm.slug}>
                        <Box
                          onClick={() => !isInherited && handleToggle(perm.slug)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isInherited ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                            border: '1px solid',
                            borderColor: isActive ? 'primary.main' : 'divider',
                            cursor: isInherited ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: isInherited ? 0.9 : 1
                          }}
                        >
                          <Box sx={{ pr: 1 }}>
                            <Typography variant="body2" fontWeight={isActive ? 600 : 400}>
                              {perm.descricao}
                            </Typography>
                            {isInherited && (
                              <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
                                <Check size={10} /> Herdado do cargo
                              </Typography>
                            )}
                          </Box>
                          <Switch
                            checked={isActive}
                            disabled={isInherited}
                            size="small"
                            color={isInherited ? "primary" : "secondary"}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
        >
          Salvar Personalização
        </Button>
      </DialogActions>
    </Dialog>
  );
}
