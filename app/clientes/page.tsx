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
  InputAdornment
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
  Search 
} from 'lucide-react';

import { Cliente } from '@/lib/types';

// O formulário usa um tipo parcial
type FormCliente = Omit<Cliente, 'id'>;

const clienteInicial: FormCliente = {
  nome_cliente: '',
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

  // Busca inicial
  async function fetchClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome_cliente', { ascending: true });

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nome_cliente.trim()) {
      alert('O nome da unidade é obrigatório.');
      return;
    }

    const { error } = editingId
      ? await supabase.from('clientes').update(formData).eq('id', editingId)
      : await supabase.from('clientes').insert(formData);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      resetForm();
      fetchClientes();
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('ATENÇÃO CRÍTICA:\n\nExcluir esta unidade apagará TODAS as receitas, fichas técnicas e estoques vinculados a ela.\n\nEsta ação é irreversível. Deseja continuar?')) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchClientes();
    }
  }

  function startEditing(cliente: Cliente) {
    setEditingId(cliente.id);
    setFormData({ nome_cliente: cliente.nome_cliente });
    // Scroll suave para o topo em mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setFormData(clienteInicial);
  }

  // Filtragem
  const clientesFiltrados = clientes.filter(c => 
    c.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase())
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
                            {cliente.nome_cliente}
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
                  name="nome_cliente"
                  label="Nome da Unidade / Cliente"
                  placeholder="Ex: Restaurante Central, Filial Sul..."
                  value={formData.nome_cliente}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  autoFocus={!!editingId}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Building2 size={18} color="gray"/></InputAdornment>
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