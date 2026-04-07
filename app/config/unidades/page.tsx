'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, Button, 
  Grid, Card, CardContent, IconButton, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, alpha, useTheme, Chip, Divider,
  Tooltip
} from '@mui/material';
import { 
  Building2, MapPin, Plus, Search, Edit2, Trash2, 
  CheckCircle2, X, Save, ShieldCheck, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { ClienteUnidade } from '@/lib/types';

export default function UnidadesPage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  
  const [unidades, setUnidades] = useState<ClienteUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_unidade: '',
    cnpj_completo: '',
    cnae_principal: '',
    endereco_completo: '',
    responsavel_tecnico_nome: '',
    responsavel_tecnico_registro: '',
    ativo: true
  });

  useEffect(() => {
    if (activeClientId) loadUnidades();
  }, [activeClientId]);

  async function loadUnidades() {
    if (!activeClientId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('cliente_unidades')
      .select('*')
      .eq('cliente_id', activeClientId)
      .order('nome_unidade', { ascending: true });

    if (error) {
      console.error('Erro ao carregar unidades:', error);
    } else {
      setUnidades(data || []);
    }
    setLoading(false);
  }

  const handleOpen = (unidade?: ClienteUnidade) => {
    if (unidade) {
      setEditingId(unidade.id);
      setFormData({
        nome_unidade: unidade.nome_unidade,
        cnpj_completo: unidade.cnpj_completo || '',
        cnae_principal: unidade.cnae_principal || '',
        endereco_completo: unidade.endereco_completo || '',
        responsavel_tecnico_nome: unidade.responsavel_tecnico_nome || '',
        responsavel_tecnico_registro: unidade.responsavel_tecnico_registro || '',
        ativo: unidade.ativo
      });
    } else {
      setEditingId(null);
      setFormData({
        nome_unidade: '',
        cnpj_completo: '',
        cnae_principal: '',
        endereco_completo: '',
        responsavel_tecnico_nome: '',
        responsavel_tecnico_registro: '',
        ativo: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.nome_unidade || !activeClientId) {
      alert('Dados obrigatórios faltando.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await (supabase as any)
          .from('cliente_unidades')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('cliente_unidades')
          .insert({ ...formData, cliente_id: activeClientId });
        if (error) throw error;
      }
      loadUnidades();
      handleClose();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja desativar a unidade "${nome}"? \nIsso impedirá novas operações neste local.`)) return;
    
    // Soft delete ou status inativo? O sistema usa o campo 'ativo'
    const { error } = await (supabase as any)
      .from('cliente_unidades')
      .update({ ativo: false })
      .eq('id', id);

    if (error) alert('Erro ao desativar: ' + error.message);
    else loadUnidades();
  };

  const filteredUnidades = unidades.filter(u => 
    u.nome_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cnpj_completo || '').includes(searchTerm)
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
            Gestão de Unidades & Filiais
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure os dados fiscais e operacionais de cada ponto de venda ou produção.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nova Unidade
        </Button>
      </Box>

      {/* FILTROS */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              TOTAL: {unidades.length} UNIDADES
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* LISTAGEM */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredUnidades.length > 0 ? (
        <Grid container spacing={3}>
          {filteredUnidades.map((unidade) => (
            <Grid item xs={12} md={6} lg={4} key={unidade.id}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: 40, height: 40, borderRadius: 2, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Building2 size={24} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {unidade.nome_unidade}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {unidade.cnpj_completo || 'CNPJ não informado'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={unidade.ativo ? "ATIVO" : "INATIVO"} 
                      size="small" 
                      color={unidade.ativo ? "success" : "default"}
                      sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                    />
                  </Box>

                  <Divider sx={{ my: 2, opacity: 0.6 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapPin size={14} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {unidade.endereco_completo || 'Endereço não informado'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle2 size={14} color={theme.palette.success.main} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        RT: {unidade.responsavel_tecnico_nome || 'Não definido'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Editar Unidade">
                      <IconButton size="small" onClick={() => handleOpen(unidade)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <Edit2 size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desativar">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(unidade.id, unidade.nome_unidade)}
                        sx={{ border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Building2 size={48} opacity={0.2} style={{ marginBottom: 16 }} />
          <Typography color="text.secondary">Nenhuma unidade encontrada para este cliente.</Typography>
          <Button variant="text" sx={{ mt: 1 }} onClick={() => handleOpen()}>Cadastrar a primeira unidade</Button>
        </Paper>
      )}

      {/* DIALOG DE CADASTRO/EDIÇÃO */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
          {editingId ? 'Editar Unidade' : 'Cadastrar Nova Unidade'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Dados Cadastrais</Typography>
              <TextField
                fullWidth label="Nome da Unidade / Filial"
                placeholder="Ex: Unidade Centro, Fábrica Sul..."
                value={formData.nome_unidade}
                onChange={(e) => setFormData({...formData, nome_unidade: e.target.value})}
                required sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth label="CNPJ Completo"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj_completo}
                    onChange={(e) => setFormData({...formData, cnpj_completo: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="CNAE Principal"
                    placeholder="5611-2/01"
                    value={formData.cnae_principal}
                    onChange={(e) => setFormData({...formData, cnae_principal: e.target.value})}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth label="Endereço Completo"
                placeholder="Rua, Número, Bairro, Cidade, UF"
                multiline rows={2}
                value={formData.endereco_completo}
                onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
              />
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldCheck size={16} color={theme.palette.primary.main} /> Qualidade & Compliance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth label="Responsável Técnico (RT)"
                    placeholder="Nome do Nutricionista resp."
                    value={formData.responsavel_tecnico_nome}
                    onChange={(e) => setFormData({...formData, responsavel_tecnico_nome: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth label="Registro Profissional"
                    placeholder="Ex: CRN-3 12345"
                    value={formData.responsavel_tecnico_registro}
                    onChange={(e) => setFormData({...formData, responsavel_tecnico_registro: e.target.value})}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" icon={<Info size={16}/>}>
                <Typography variant="caption">
                  Estes dados serão utilizados no cabeçalho das etiquetas e relatórios de auditoria.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : <Save size={18} />}
          >
            {editingId ? 'Salvar Alterações' : 'Criar Unidade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
