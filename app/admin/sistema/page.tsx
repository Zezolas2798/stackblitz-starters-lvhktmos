'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Building2,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Layers,
  MapPin,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { useClient } from '@/lib/ClientContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
  const theme = useTheme();
  const router = useRouter();
  const { setClient, setUnit } = useClient();
  const { role, loading: loadingPerms } = usePermission();

  // Estados principais
  const [clientes, setClientes] = useState<any[]>([]);
  const [appModulos, setAppModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Modais
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openModulesDialog, setOpenModulesDialog] = useState(false);
  const [openUnitsDialog, setOpenUnitsDialog] = useState(false);
  const [openConfigMenu, setOpenConfigMenu] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj_raiz: '',
    logo_url: '',
    ativo: true,
    endereco_completo: '',
    cep: '',
    cnaes: [] as any[]
  });

  const [searchingCnpj, setSearchingCnpj] = useState(false);

  const handleBuscarCnpj = async () => {
    const rawCnpj = formData.cnpj_raiz || '';
    const cnpj = rawCnpj.trim().replace(/\D/g, '');
    
    if (cnpj.length < 8) {
      alert('Informe ao menos os 8 dígitos iniciais do CNPJ (CNPJ Raiz).');
      return;
    }

    let cnpjBusca = cnpj;
    if (cnpj.length === 8) {
      cnpjBusca = cnpj + '000191';
    }

    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjBusca}`;
    console.log('[DEBUG] Brasil API Admin - Iniciando busca:', url);

    setSearchingCnpj(true);
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Brasil API Admin - Resposta Erro:', response.status, errorText);
        throw new Error(`Servidor retornou status ${response.status}. Certifique-se que o CNPJ existe.`);
      }
      
      const data = await response.json();
      console.log('[DEBUG] Brasil API Admin - Sucesso:', data);
      
      // Formata endereço completo
      const logradouro = data.logradouro || '';
      const numero = data.numero || 'S/N';
      const complemento = data.complemento ? `, ${data.complemento}` : '';
      const bairro = data.bairro || '';
      const cidade = data.municipio || '';
      const uf = data.uf || '';
      const cep = data.cep || '';

      const endereco = `${logradouro}, ${numero}${complemento}, ${bairro}, ${cidade}/${uf} - CEP: ${cep}`;
      const listCnaes = [
        { codigo: data.cnae_fiscal, descricao: data.cnae_fiscal_descricao, principal: true },
        ...(data.cnaes_secundarios || []).map((s: any) => ({ ...s, principal: false }))
      ];

      setFormData(prev => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia || data.razao_social,
        endereco_completo: endereco,
        cep: cep,
        cnaes: listCnaes
      }));

    } catch (err: any) {
      console.error('[DEBUG] Brasil API Admin - Erro de Fetch:', err);
      alert(`Erro na busca: ${err.message}\n\nVerifique o console (F12) para detalhes técnicos.`);
    } finally {
      setSearchingCnpj(false);
    }
  };

  const [clientModules, setClientModules] = useState<Record<string, boolean>>({});
  const [clientUnits, setClientUnits] = useState<any[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [uploading, setUploading] = useState(false);

  // 1. Verificação de Acesso
  useEffect(() => {
    if (!loadingPerms && role && (role !== 'super_admin' && role !== 'company_owner')) {
      router.push('/');
    }
  }, [role, loadingPerms, router]);

  // 2. Carga de Dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cls, mods] = await Promise.all([
        (supabase as any).from('clientes').select('*, cliente_modulos(modulo_slug, ativo)').order('razao_social'),
        (supabase as any).from('app_modulos').select('*').order('nome')
      ]);

      if (cls.error) throw cls.error;
      if (mods.error) throw mods.error;

      setClientes(cls.data || []);
      setAppModulos(mods.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3. Handlers Clientes
  const handleOpenClient = (client?: any) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        razao_social: client.razao_social,
        nome_fantasia: client.nome_fantasia || '',
        cnpj_raiz: client.cnpj_raiz,
        logo_url: client.logo_url || '',
        ativo: client.ativo ?? true,
        endereco_completo: client.endereco_completo || '',
        cep: client.cep || '',
        cnaes: client.cnaes || []
      });
    } else {
      setSelectedClient(null);
      setFormData({ 
        razao_social: '', 
        nome_fantasia: '', 
        cnpj_raiz: '', 
        logo_url: '', 
        ativo: true,
        endereco_completo: '',
        cep: '',
        cnaes: []
      });
    }
    setOpenClientDialog(true);
  };

  const saveClient = async () => {
    try {
      const { error } = selectedClient
        ? await supabase.from('clientes').update(formData).eq('id', selectedClient.id)
        : await supabase.from('clientes').insert([formData]);
      
      if (error) throw error;
      setOpenClientDialog(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('client-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = (supabase as any).storage
        .from('client-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 4. Handlers Módulos
  const handleOpenModules = async (client: any) => {
    setSelectedClient(client);
    const initialModules: Record<string, boolean> = {};
    appModulos.forEach(m => {
      const active = client.cliente_modulos?.find((cm: any) => cm.modulo_slug === m.slug)?.ativo ?? false;
      initialModules[m.slug] = active;
    });
    setClientModules(initialModules);
    setOpenModulesDialog(true);
  };

  const toggleModule = (slug: string) => {
    setClientModules(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const saveModules = async () => {
    try {
      const entries = Object.entries(clientModules).map(([slug, ativo]) => ({
        cliente_id: selectedClient.id,
        modulo_slug: slug,
        ativo
      }));

      const { error } = await (supabase as any).from('cliente_modulos').upsert(entries, { onConflict: 'cliente_id, modulo_slug' });
      if (error) throw error;
      setOpenModulesDialog(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5. Handlers Unidades
  const handleOpenUnits = async (client: any) => {
    setSelectedClient(client);
    const { data } = await supabase.from('cliente_unidades').select('*').eq('cliente_id', client.id);
    setClientUnits(data || []);
    setOpenUnitsDialog(true);
  };

  const addUnit = async () => {
    if (!newUnitName.trim()) return;
    try {
      const { error } = await supabase.from('cliente_unidades').insert([{
        cliente_id: selectedClient.id,
        nome_unidade: newUnitName,
        ativo: true
      }]);
      if (error) throw error;
      setNewUnitName('');
      handleOpenUnits(selectedClient);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 6. "Assumir Controle"
  const impersonateClient = async (client: any) => {
    // 1. Buscar a primeira unidade ativa do cliente
    const { data: units } = await supabase.from('cliente_unidades').select('id').eq('cliente_id', client.id).eq('ativo', true).limit(1);
    
    if (!units || units.length === 0) {
      alert('Este cliente não possui unidades ativas para acessar.');
      return;
    }

    setClient(client.id);
    setUnit(units[0].id);
    router.push('/');
  };

  if (loadingPerms || loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  const filteredClientes = clientes.filter(c => 
    c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConfig = (client: any) => {
    setSelectedClient(client);
    // Popula o formData antecipadamente para que o preview no menu central use os dados mais recentes
    setFormData({
      razao_social: client.razao_social,
      nome_fantasia: client.nome_fantasia || '',
      cnpj_raiz: client.cnpj_raiz,
      logo_url: client.logo_url || '',
      ativo: client.ativo ?? true,
      endereco_completo: client.endereco_completo || '',
      cep: client.cep || '',
      cnaes: client.cnaes || []
    });
    setOpenConfigMenu(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Shield size={32} color={theme.palette.primary.main} /> Painel do Sistema GxP
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão macro de clientes, módulos de software e unidades de negócio.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus />} 
          size="large"
          onClick={() => handleOpenClient()}
          sx={{ borderRadius: 2, px: 4 }}
        >
          Novo Cliente
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* BUSCA */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar cliente por nome ou razão social..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>
          }}
        />
      </Paper>

      {/* GRID DE CARDS DE CLIENTES */}
      <Grid container spacing={3}>
        {filteredClientes.map((c) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[10],
                  '& .overlay-settings': { opacity: 1 }
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleOpenConfig(c)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                {/* Logo Area */}
                <Box sx={{ 
                  height: 180, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {c.logo_url ? (
                    <Box 
                      component="img" 
                      src={c.logo_url} 
                      alt={c.nome_fantasia}
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Building2 size={64} color={alpha(theme.palette.text.secondary, 0.2)} />
                  )}
                  
                  {/* Status Overlay */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                    <Chip 
                      label={c.ativo ? 'Ativo' : 'Inativo'} 
                      size="small" 
                      color={c.ativo ? 'success' : 'error'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" noWrap gutterBottom>
                    {c.nome_fantasia || 'Sem Nome'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                    {c.razao_social}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Chip 
                      variant="outlined"
                      size="small" 
                      icon={<Layers size={14} />} 
                      label={`${c.cliente_modulos?.filter((m: any) => m.ativo).length || 0} Módulos`} 
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
              
              {/* Quick Actions Footer */}
              <Divider />
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Button 
                  size="small" 
                  startIcon={<ExternalLink size={14} />}
                  onClick={(e) => { e.stopPropagation(); impersonateClient(c); }}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Assumir Controle
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
        {filteredClientes.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.01), border: '2px dashed #eee' }}>
              <Typography variant="h6" color="text.secondary">Nenhum cliente encontrado.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* MODAL CENTRAL DE CONFIGURAÇÕES */}
      <Dialog 
        open={openConfigMenu} 
        onClose={() => setOpenConfigMenu(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Avatar 
            src={formData.logo_url} 
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'background.default', border: '2px solid #eee' }}
          >
            <Building2 size={40} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">Configurações</Typography>
          <Typography variant="body2" color="text.secondary">{formData.nome_fantasia || formData.razao_social}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 4 }}>
          <List sx={{ mt: 2 }}>
            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton 
                onClick={() => { setOpenConfigMenu(false); handleOpenClient(selectedClient); }}
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
              >
                <ListItemIcon><Edit2 size={24} color={theme.palette.primary.main} /></ListItemIcon>
                <ListItemText primary="Editar Dados Cadastrais" secondary="Alterar nome, CNPJ e logo" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton 
                onClick={() => { setOpenConfigMenu(false); handleOpenModules(selectedClient); }}
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}
              >
                <ListItemIcon><Layers size={24} color={theme.palette.info.main} /></ListItemIcon>
                <ListItemText primary="Módulos & Funções" secondary="Habilitar/desabilitar permissões" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton 
                onClick={() => { setOpenConfigMenu(false); handleOpenUnits(selectedClient); }}
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}
              >
                <ListItemIcon><MapPin size={24} color={theme.palette.secondary.main} /></ListItemIcon>
                <ListItemText primary="Unidades & Filiais" secondary="Gerenciar locais cadastrados" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => { setOpenConfigMenu(false); impersonateClient(selectedClient); }}
                sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}
              >
                <ListItemIcon><ExternalLink size={24} color={theme.palette.success.main} /></ListItemIcon>
                <ListItemText primary="Acessar Ambiente" secondary="Entrar no sistema como este cliente" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button fullWidth variant="outlined" onClick={() => setOpenConfigMenu(false)} sx={{ borderRadius: 2 }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: CLIENTE */}
      <Dialog open={openClientDialog} onClose={() => setOpenClientDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{selectedClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                label="Razão Social" 
                fullWidth 
                required 
                value={formData.razao_social} 
                onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Nome Fantasia" 
                fullWidth 
                value={formData.nome_fantasia} 
                onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="CNPJ Raiz" 
                fullWidth 
                required 
                placeholder="00.000.000"
                value={formData.cnpj_raiz} 
                onChange={(e) => setFormData({...formData, cnpj_raiz: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Sincronizar com Brasil API">
                        <IconButton 
                          onClick={handleBuscarCnpj} 
                          disabled={searchingCnpj}
                          size="small"
                          color="primary"
                        >
                          {searchingCnpj ? <CircularProgress size={16} /> : <RefreshCcw size={16} />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
               <FormControlLabel
                control={<Switch checked={formData.ativo} onChange={(e) => setFormData({...formData, ativo: e.target.checked})} />}
                label="Cliente Ativo"
                sx={{ ml: 1 }}
              />
            </Grid>

            {/* NOVOS CAMPOS: ENDEREÇO E CNAE */}
            <Grid item xs={12}>
              <TextField 
                label="Endereço Completo" 
                fullWidth 
                multiline
                rows={2}
                placeholder="Sincronize com o CNPJ para preencher automaticamente"
                value={formData.endereco_completo} 
                onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
              />
            </Grid>

            {formData.cnaes && formData.cnaes.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">CNAES Identificados:</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.cnaes.map((c: any, idx: number) => (
                    <Tooltip key={idx} title={c.descricao}>
                      <Chip 
                        label={`${c.codigo}${c.principal ? ' (Principal)' : ''}`} 
                        size="small" 
                        variant={c.principal ? "filled" : "outlined"}
                        color={c.principal ? "primary" : "default"}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Logo da Empresa</Typography>
              <Box 
                sx={{ 
                  border: '2px dashed',
                  borderColor: theme.palette.divider,
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.01),
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.03)
                  }
                }}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <input
                  type="file"
                  id="logo-upload"
                  hidden
                  accept="image/*"
                  onChange={handleUploadLogo}
                />
                
                {uploading ? (
                  <Box sx={{ py: 2 }}>
                    <Loader2 className="animate-spin" size={32} color={theme.palette.primary.main} />
                    <Typography variant="body2" sx={{ mt: 1 }}>Enviando imagem...</Typography>
                  </Box>
                ) : formData.logo_url ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box 
                      component="img" 
                      src={formData.logo_url} 
                      sx={{ maxHeight: 120, borderRadius: 2, display: 'block' }} 
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: -10, 
                      right: -10, 
                      bgcolor: 'white', 
                      borderRadius: '50%',
                      p: 0.5,
                      boxShadow: 2
                    }}>
                      <Edit2 size={16} color={theme.palette.primary.main} />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <UploadCloud size={40} color={theme.palette.text.disabled} />
                    <Typography variant="body2" color="text.secondary">
                      Clique para fazer upload da logo (Máx. 2MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenClientDialog(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save />} onClick={saveClient}>Salvar Dados</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: MÓDULOS */}
      <Dialog open={openModulesDialog} onClose={() => setOpenModulesDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers size={20} /> Funções Habilitadas
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Marque os módulos que o cliente {selectedClient?.nome_fantasia || selectedClient?.razao_social} terá acesso no sistema.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {appModulos.map((m) => (
              <Box key={m.slug} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Box>
                  <Typography variant="body2" fontWeight="600">{m.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.slug}</Typography>
                </Box>
                <Switch 
                  checked={clientModules[m.slug] || false} 
                  onChange={() => toggleModule(m.slug)}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModulesDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveModules}>Atualizar Funções</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: UNIDADES */}
      <Dialog open={openUnitsDialog} onClose={() => setOpenUnitsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Unidades de Negócio</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Nova unidade..." 
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
            />
            <Button variant="outlined" onClick={addUnit} startIcon={<Plus />}>Adicionar</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome da Unidade</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientUnits.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome_unidade}</TableCell>
                  <TableCell align="right">
                    <Chip label={u.ativo ? 'Ativo' : 'Inativo'} size="small" color={u.ativo ? 'success' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
              {clientUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>Nenhuma unidade cadastrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenUnitsDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}
