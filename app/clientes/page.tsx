'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  Divider,
  useTheme,
  alpha,
  ListItemAvatar,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material';

// Ícones Modernos (Lucide)
import { 
  Building2, 
  MapPin, 
  Plus, 
  Save, 
  Edit2, 
  Trash2, 
  X, 
  Search,
  RefreshCcw
} from 'lucide-react';

import { Cliente } from '@/lib/types';

// O formulário usa um tipo parcial
type FormCliente = Omit<Cliente, 'id'>;

const clienteInicial: FormCliente = {
  razao_social: '',
  nome_fantasia: '',
  cnpj_raiz: '',
  ativo: true,
  endereco_completo: '',
  cep: '',
  cnaes: []
};

// --- Funções Auxiliares para CNPJ ---
const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const gerarCnpjCompleto = (cnpjRaiz: string): string | null => {
  const digits = cnpjRaiz.replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return null;
  
  const base = digits + '0001'; // 12 dígitos
  
  // Primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(base[i]) * weights1[i];
  }
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;
  
  // Segundo dígito verificador
  const base2 = base + d1;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(base2[i]) * weights2[i];
  }
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;
  
  return base2 + d2;
};

const validarCnpjCompleto = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  
  const raiz = digits.slice(0, 8);
  const filial = digits.slice(8, 12);
  const dv = digits.slice(12, 14);
  
  const base = raiz + filial;
  
  // Primeiro dígito
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(base[i]) * weights1[i];
  }
  const rem1 = sum1 % 11;
  const d1 = rem1 < 2 ? 0 : 11 - rem1;
  
  // Segundo dígito
  const base2 = base + d1;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(base2[i]) * weights2[i];
  }
  const rem2 = sum2 % 11;
  const d2 = rem2 < 2 ? 0 : 11 - rem2;
  
  return `${d1}${d2}` === dv;
};

export default function ClientesPage() {
  const theme = useTheme();
  
  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormCliente>(clienteInicial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingCnpj, setSearchingCnpj] = useState(false);

  const handleBuscarCnpj = async () => {
    const rawCnpj = formData.cnpj_raiz || '';
    const cnpj = rawCnpj.trim().replace(/\D/g, '');
    
    if (cnpj.length < 8) {
      alert('Informe ao menos os 8 dígitos iniciais do CNPJ (CNPJ Raiz).');
      return;
    }

    if (cnpj.length > 8 && cnpj.length < 14) {
      alert('Informe o CNPJ com 8 dígitos (CNPJ Raiz) ou 14 dígitos (CNPJ Completo).');
      return;
    }

    let cnpjBusca = cnpj;
    if (cnpj.length === 8) {
      const cnpjGerado = gerarCnpjCompleto(cnpj);
      if (!cnpjGerado) {
        alert('Erro ao calcular os dígitos verificadores do CNPJ.');
        return;
      }
      cnpjBusca = cnpjGerado;
    } else if (cnpj.length === 14) {
      if (!validarCnpjCompleto(cnpj)) {
        alert('Dígitos verificadores do CNPJ são inválidos. Verifique os números digitados.');
        return;
      }
    }

    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjBusca}`;
    console.log('[DEBUG] Brasil API Clientes - Iniciando busca:', url);

    setSearchingCnpj(true);
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Brasil API Clientes - Resposta Erro:', response.status, errorText);
        throw new Error(`Servidor retornou status ${response.status}. Certifique-se que o CNPJ existe.`);
      }
      
      const data = await response.json();
      console.log('[DEBUG] Brasil API Clientes - Sucesso:', data);
      
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
        cnpj_raiz: formatCnpj(cnpjBusca),
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia || data.razao_social,
        endereco_completo: endereco,
        cep: cep,
        cnaes: listCnaes
      }));

    } catch (err: any) {
      console.error('[DEBUG] Brasil API Clientes - Erro de Fetch:', err);
      alert(`Erro na busca: ${err.message}\n\nVerifique o console (F12) para detalhes técnicos.`);
    } finally {
      setSearchingCnpj(false);
    }
  };

  // Busca inicial
  async function fetchClientes() {
    setLoading(true);
    const { data, error } = await (supabase as any).from('clientes')
      .select('*')
      .order('razao_social', { ascending: true });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      setError('Falha ao buscar unidades.');
    } else {
      setClientes(data as Cliente[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  // Handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'cnpj_raiz' ? formatCnpj(value) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.razao_social.trim() || !formData.cnpj_raiz.trim()) {
      alert('Razão Social e CNPJ Raiz são obrigatórios.');
      return;
    }

    const { error } = editingId
      ? await (supabase as any).from('clientes').update(formData).eq('id', editingId)
      : await (supabase as any).from('clientes').insert(formData);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      resetForm();
      fetchClientes();
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('ATENÇÃO CRÍTICA:\n\nExcluir esta unidade apagará TODAS as receitas, fichas técnicas e estoques vinculados a ela.\n\nEsta ação é irreversível. Deseja continuar?')) {
      const { error } = await (supabase as any).from('clientes').delete().eq('id', id);
      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchClientes();
    }
  }

  function startEditing(cliente: Cliente) {
    setEditingId(cliente.id);
    setFormData({ 
      razao_social: cliente.razao_social,
      nome_fantasia: cliente.nome_fantasia || '',
      cnpj_raiz: cliente.cnpj_raiz,
      ativo: cliente.ativo
    });
    // Scroll suave para o topo em mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setFormData(clienteInicial);
  }

  // Filtragem
  const clientesFiltrados = clientes.filter(c => 
    c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
          Unidades & Clientes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestão de restaurantes, UANs e locais de produção.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        
        {/* COLUNA ESQUERDA: LISTAGEM */}
        <Grid item xs={12} md={7} order={{ xs: 2, md: 1 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
             <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building2 size={20} /> Unidades Cadastradas
                <Typography component="span" variant="caption" sx={{ bgcolor: 'primary.light', color: 'white', px: 1, borderRadius: 1, fontWeight: 'bold' }}>
                   {clientes.length}
                </Typography>
             </Typography>
             
             {/* Busca Rápida */}
             {clientes.length > 5 && (
               <TextField 
                 placeholder="Buscar unidade..." 
                 size="small" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 InputProps={{
                    startAdornment: <InputAdornment position="start"><Search size={16}/></InputAdornment>
                 }}
                 sx={{ width: 200, bgcolor: 'background.paper' }}
               />
             )}
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <List sx={{ p: 0 }}>
              {clientesFiltrados.map((cliente) => (
                <ListItem
                  key={cliente.id}
                  divider
                  sx={{ 
                    transition: 'all 0.2s',
                    bgcolor: editingId === cliente.id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                  }}
                  secondaryAction={
                    <Box>
                      <IconButton size="small" onClick={() => startEditing(cliente)} color={editingId === cliente.id ? "primary" : "default"}>
                        <Edit2 size={18} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cliente.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: editingId === cliente.id ? 'primary.main' : 'background.default', 
                        color: editingId === cliente.id ? 'white' : 'text.secondary',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Building2 size={20} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                        <Typography variant="body1" fontWeight={editingId === cliente.id ? 700 : 500}>
                            {cliente.nome_fantasia || cliente.razao_social}
                        </Typography>
                    }
                    secondary={
                        <Typography variant="caption" display="block" color="text.secondary">
                            ID: {cliente.id.split('-')[0]}...
                        </Typography>
                    }
                  />
                </ListItem>
              ))}
              
              {clientesFiltrados.length === 0 && (
                 <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <MapPin size={40} opacity={0.3} style={{ marginBottom: 8 }} />
                    <Typography>Nenhuma unidade encontrada.</Typography>
                 </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* COLUNA DIREITA: FORMULÁRIO (FIXO EM DESKTOP) */}
        <Grid item xs={12} md={5} order={{ xs: 1, md: 2 }}>
           <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
              <Paper 
                component="form" 
                onSubmit={handleSubmit} 
                elevation={0}
                sx={{ 
                  p: 3, 
                  border: '1px solid', 
                  borderColor: editingId ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  boxShadow: editingId ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: editingId ? 'primary.main' : 'text.primary' }}>
                  {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                  {editingId ? 'Editar Unidade' : 'Cadastrar Unidade'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                   {editingId 
                     ? 'Atualize o nome da unidade abaixo.' 
                     : 'Crie um novo ambiente de produção para gerenciar receitas e estoques.'}
                </Typography>

                <TextField
                  name="razao_social"
                  label="Razão Social"
                  placeholder="Ex: Empresa de Alimentos LTDA"
                  value={formData.razao_social}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="nome_fantasia"
                  label="Nome Fantasia (Opcional)"
                  placeholder="Ex: Restaurante do Porto"
                  value={formData.nome_fantasia || ''}
                  onChange={handleFormChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="cnpj_raiz"
                  label="CNPJ / Raiz"
                  placeholder="Ex: 12.345.678/0001-90"
                  value={formData.cnpj_raiz}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Building2 size={18} color="gray"/></InputAdornment>,
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

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  {editingId && (
                    <Button 
                        onClick={resetForm} 
                        variant="outlined" 
                        color="inherit" 
                        fullWidth
                        startIcon={<X size={18} />}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    startIcon={editingId ? <Save size={18} /> : <Plus size={18} />}
                  >
                    {editingId ? 'Salvar Alterações' : 'Criar Unidade'}
                  </Button>
                </Box>
              </Paper>

              {/* Dica Pro */}
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                  <strong>Dica de Validação:</strong> Cadastre o nome oficial (Razão Social ou Fantasia) conforme consta na Licença Sanitária.
              </Alert>
           </Box>
        </Grid>

      </Grid>
    </Container>
  );
}


