'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter
import { useClient } from '@/lib/ClientContext';
import { supabase } from '@/lib/supabaseClient';
import { Material, TipoMaterial } from '@/lib/types';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
  CircularProgress,
  Alert,
  Tooltip,
  Container,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Inventory,
  Save
} from '@mui/icons-material';

const UNIDADES_MEDIDA = ['un', 'pct', 'rl', 'kg', 'lt', 'cx'];

export default function MateriaisPage() {
  const router = useRouter();
  const theme = useTheme();
  const { unidadeSelecionada, loading: loadingContext } = useClient();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState<TipoMaterial>('EMBALAGEM');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Adição de Edição
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!unidadeSelecionada?.cliente_id) return;
    try {
      setLoadingData(true);
      
      const [matRes, catGlobalRes, catClientRes] = await Promise.all([
        (supabase as any).from('materiais').select('*').eq('cliente_id', unidadeSelecionada.cliente_id).order('nome'),
        (supabase as any).from('grupos_produto').select('*').is('cliente_id', null).order('nome'),
        (supabase as any).from('grupos_produto').select('*').eq('cliente_id', unidadeSelecionada.cliente_id).order('nome')
      ]);

      if (matRes.error) throw matRes.error;

      setMateriais(matRes.data || []);
      setCategorias([...(catGlobalRes.data || []), ...(catClientRes.data || [])]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  }, [unidadeSelecionada]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    const mat = materiais.find(m => m.id === id);
    if (!mat) return;

    if (!confirm(`Tem certeza que deseja excluir o material "${mat.nome}"?`)) return;

    try {
      setLoadingData(true);
      
      // 1. Verificamos se há lotes associados no banco de dados
      const { data: lotes, error: errorLotes } = await (supabase as any)
        .from('estoque_lotes')
        .select('id')
        .eq('material_id', id)
        .limit(1);
      
      if (errorLotes) throw errorLotes;

      if (lotes && lotes.length > 0) {
        // Se houver lotes, inativamos ao invés de excluir fisicamente
        const { error: errorUpdate } = await (supabase as any)
          .from('materiais')
          .update({ ativo: false })
          .eq('id', id);
        
        if (errorUpdate) throw errorUpdate;
        alert(`O material "${mat.nome}" possui histórico de estoque e não pode ser removido definitivamente. Ele foi desativado e não aparecerá mais em novas compras.`);
      } else {
        // Se for um órfão (como pré-cadastro de teste), excluímos de verdade
        const { error: errorDelete } = await (supabase as any)
          .from('materiais')
          .delete()
          .eq('id', id);
        
        if (errorDelete) throw errorDelete;
      }

      await loadData();
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao excluir: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenEdit = (mat: Material) => {
    router.push(`/materiais/${mat.id}/editar`);
  };

  // Removed: handleSaveEdit function

  // Removed: tabToTipo mapping as tabValue is already a string

  const filteredMateriais = materiais.filter(m => {
    const isAtivo = m.ativo !== false; // Considerar null/undefined como ativo para compatibilidade
    const matchesTab = m.tipo_material === tabValue;
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.grupo_id === selectedCategory;
    return isAtivo && matchesTab && matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';
  };

  if (loadingContext) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!unidadeSelecionada) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" variant="outlined">
          Por favor, selecione uma unidade no menu lateral para acessar o cadastro de materiais.
        </Alert>
      </Container>
    );
  }

  const modalityMapping = {
    'EMBALAGEM': 'EMBALAGENS',
    'LIMPEZA': 'LIMPEZA',
    'UTENSILIO': 'UTENSILIOS',
    'MANUTENCAO': 'MANUTENCAO',
    'EPI_EPC': 'EPI_EPC',
    'UNIFORME': 'UNIFORMES',
    'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
    'OUTROS': 'OUTROS'
  };

  const currentTabCategories = categorias.filter(c => {
    const modalidade = (modalityMapping as any)[tabValue] || tabValue;
    return c.modalidade === modalidade || c.modalidade === tabValue;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Materiais e Embalagens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão técnica para: <strong>{unidadeSelecionada.cliente?.nome_fantasia}</strong>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="/materiais/novo" passHref>
            <Button variant="contained" startIcon={<Add />} size="medium">
              Novo Material
            </Button>
          </Link>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => {
              setTabValue(newValue);
              setSelectedCategory('all'); // Reset filter when switching tabs
          }} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Embalagens" value="EMBALAGEM" />
          <Tab label="Utensílios" value="UTENSILIO" />
          <Tab label="Limpeza" value="LIMPEZA" />
          <Tab label="Manutenção" value="MANUTENCAO" />
          <Tab label="EPIs/EPCs" value="EPI_EPC" />
          <Tab label="Uniformes" value="UNIFORME" />
          <Tab label="Primeiros Socorros" value="PRIMEIROS_SOCORROS" />
          <Tab label="Outros" value="OUTROS" />
        </Tabs>
        
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome do material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '10px' } }}>
            <Chip 
              label="Ver Todas" 
              onClick={() => setSelectedCategory('all')}
              color={selectedCategory === 'all' ? 'primary' : 'default'}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            {currentTabCategories.map(cat => (
              <Chip 
                key={cat.id}
                label={cat.nome}
                onClick={() => setSelectedCategory(cat.id)}
                color={selectedCategory === cat.id ? 'primary' : 'default'}
                variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Nome do Material</TableCell>
              <TableCell>Subcategoria</TableCell>
              <TableCell>Unidade</TableCell>
              <TableCell align="right">Preço (Última Compra)</TableCell>
              <TableCell align="right">Custo Médio</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingData ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>Carregando dados...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredMateriais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Inventory sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Nenhum material encontrado.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMateriais.map((mat) => {
                const catName = categorias.find(c => c.id === mat.grupo_id)?.nome || '-';

                return (
                  <TableRow key={mat.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {mat.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={catName} 
                        size="small" 
                        variant={catName === '-' ? "outlined" : "filled"}
                        color={catName === '-' ? "default" : "primary"}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={mat.unidade_medida} size="small" variant="outlined" sx={{ height: 20 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {formatCurrency(mat.preco_ultima_compra)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(mat.custo_medio)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" component="span" onClick={() => handleOpenEdit(mat)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(mat.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

