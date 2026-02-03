'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Switch, 
  FormControlLabel, 
  Typography, 
  Box, 
  Divider, 
  Chip, 
  CircularProgress, 
  useTheme, 
  alpha,
  Grid
} from '@mui/material';
import { 
  Shield, 
  Check, 
  Save, 
  X, 
  ChefHat, 
  Package, 
  ClipboardCheck, 
  Settings 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Permission = {
  slug: string;
  descricao: string;
  modulo: string;
};

type RolePermissionEditorProps = {
  roleId: string;
  roleName: string;
  onClose: () => void;
};

// Ícones por módulo para facilitar identificação visual
const MODULE_ICONS: Record<string, any> = {
  'NUTRICAO': <ChefHat size={18} />,
  'ESTOQUE': <Package size={18} />,
  'PRODUCAO': <ChefHat size={18} />, // Reuso intencional ou pode ser outro
  'QUALIDADE': <ClipboardCheck size={18} />,
  'SISTEMA': <Settings size={18} />
};

export default function RolePermissionEditor({ roleId, roleName, onClose }: RolePermissionEditorProps) {
  const theme = useTheme();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Carrega dados
  useEffect(() => {
    async function loadData() {
      // Catálogo completo
      const { data: allPerms } = await supabase
        .from('app_permissions')
        .select('*')
        .order('modulo', { ascending: false }) // Sistema/Qualidade primeiro geralmente
        .order('descricao', { ascending: true });

      // O que o cargo já tem
      const { data: currentRolePerms } = await supabase
        .from('app_role_permissions')
        .select('permission_slug')
        .eq('role_id', roleId);

      if (allPerms) setPermissions(allPerms as Permission[]);
      
      const currentSet = new Set<string>();
      currentRolePerms?.forEach((p: any) => currentSet.add(p.permission_slug));
      setSelectedSlugs(currentSet);
      
      setLoading(false);
    }
    loadData();
  }, [roleId]);

  // 2. Agrupa por módulo
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.modulo]) acc[perm.modulo] = [];
    acc[perm.modulo].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // 3. Toggle
  const handleToggle = (slug: string) => {
    const next = new Set(selectedSlugs);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedSlugs(next);
  };

  // 4. Salvar
  const handleSave = async () => {
    setSaving(true);
    
    // Transação manual: Limpar -> Inserir
    const { error: delErr } = await supabase.from('app_role_permissions').delete().eq('role_id', roleId);
    if (delErr) {
      alert('Erro ao limpar: ' + delErr.message);
      setSaving(false);
      return;
    }

    const inserts = Array.from(selectedSlugs).map(slug => ({
      role_id: roleId,
      permission_slug: slug
    }));

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from('app_role_permissions').insert(inserts);
      if (insErr) {
        alert('Erro ao salvar: ' + insErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onClose();
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10] }
      }}
    >
      {/* CABEÇALHO */}
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 2, display: 'flex' }}>
          <Shield size={24} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">Configurar Acessos</Typography>
          <Typography variant="body2" color="text.secondary">
            Cargo: <span style={{ color: theme.palette.primary.main, fontWeight: 600 }}>{roleName}</span>
          </Typography>
        </Box>
      </DialogTitle>

      {/* CONTEÚDO */}
      <DialogContent sx={{ py: 3, bgcolor: '#FAFAFA' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {Object.entries(groupedPermissions).map(([modulo, perms]) => (
              <Grid item xs={12} key={modulo}>
                {/* Título do Módulo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    {MODULE_ICONS[modulo] || <Settings size={18} />}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    {modulo}
                  </Typography>
                  <Divider sx={{ flexGrow: 1, ml: 2 }} />
                </Box>

                {/* Grid de Switches */}
                <Grid container spacing={2}>
                  {perms.map((perm) => {
                    const isSelected = selectedSlugs.has(perm.slug);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={perm.slug}>
                        <Box 
                          onClick={() => handleToggle(perm.slug)}
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'white', 
                            border: '1px solid', 
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) }
                          }}
                        >
                          <Box sx={{ pr: 1 }}>
                            <Typography variant="body2" fontWeight={isSelected ? 600 : 500} color={isSelected ? 'text.primary' : 'text.secondary'}>
                              {perm.descricao}
                            </Typography>
                            {/* <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                              {perm.slug}
                            </Typography> */}
                          </Box>
                          <Switch 
                            checked={isSelected}
                            size="small"
                            color="primary"
                            sx={{ pointerEvents: 'none' }} // O clique é no Box inteiro
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

      {/* RODAPÉ */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          {saving ? 'Salvando...' : 'Salvar Acessos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}