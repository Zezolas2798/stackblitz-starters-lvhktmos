'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClient } from '@/lib/ClientContext';
import { supabase } from '@/lib/supabaseClient';
import { Ingrediente } from '@/lib/types';
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
  CircularProgress,
  Alert,
  Tooltip,
  Container
} from '@mui/material';
import { 
  Add, 
  Search, 
  Edit, 
  Delete, 
  FilterList,
  Science,
  Restaurant
} from '@mui/icons-material';

export default function IngredientesPage() {
  const { unidadeSelecionada, loading: loadingContext } = useClient();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Busca ingredientes sempre que a Unidade mudar
  useEffect(() => {
    if (unidadeSelecionada?.cliente_id) {
      fetchIngredientes();
    }
  }, [unidadeSelecionada]);

  const fetchIngredientes = async () => {
    try {
      setLoadingData(true);
      
      // REGRA DE OURO GxP:
      // Busca ingredientes do Cliente Atual OU Ingredientes do Sistema (cliente_id IS NULL)
      // Isso isola os dados para que um cliente não veja os dados do outro.
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*')
        .or(`cliente_id.eq.${unidadeSelecionada!.cliente_id},cliente_id.is.null`)
        .order('nome');

      if (error) throw error;
      setIngredientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar ingredientes:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ingrediente?')) return;
    try {
      const { error } = await supabase.from('ingredientes').delete().eq('id', id);
      if (error) throw error;
      fetchIngredientes(); // Atualiza a lista
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // Filtragem local (Busca rápida no Frontend)
  const filteredIngredientes = ingredientes.filter(ing => 
    ing.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estados de Interface
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
          Por favor, selecione uma unidade no menu lateral para acessar o cadastro de ingredientes.
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Ingredientes e Matérias-Primas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão técnica para: <strong>{unidadeSelecionada.cliente?.nome_fantasia}</strong>
          </Typography>
        </Box>
        <Link href="/ingredientes/novo" passHref>
          <Button variant="contained" startIcon={<Add />} size="large">
            Novo Ingrediente
          </Button>
        </Link>
      </Box>

      {/* Barra de Busca e Filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome, código ou aditivo..."
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
        />
        <Button variant="outlined" startIcon={<FilterList />} sx={{ whiteSpace: 'nowrap' }}>
          Filtros Avançados
        </Button>
      </Paper>

      {/* Tabela de Dados */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Nome do Ingrediente</TableCell>
              <TableCell>Classificação</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell align="right">Energia (kcal)</TableCell>
              <TableCell align="center">Alergênicos</TableCell>
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
            ) : filteredIngredientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Science sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Nenhum ingrediente encontrado.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredientes.map((ing) => (
                <TableRow key={ing.id} hover>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="medium">
                      {ing.nome}
                    </Typography>
                    {ing.declaracao_ingredientes_fornecedor && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 300 }}>
                        Lista: {ing.declaracao_ingredientes_fornecedor.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={ing.tipo_ingrediente || 'SIMPLES'} 
                      size="small" 
                      color={ing.tipo_ingrediente === 'COMPOSTO' ? 'info' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {ing.cliente_id ? (
                      <Chip 
                        icon={<Restaurant style={{ fontSize: 14 }} />} 
                        label="Próprio" 
                        size="small" 
                        color="primary" 
                        sx={{ height: 24 }} 
                      />
                    ) : (
                      <Chip 
                        label="Sistema (TACO)" 
                        size="small" 
                        sx={{ bgcolor: 'grey.200', color: 'text.secondary' }} 
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {ing.energia_kcal !== null ? ing.energia_kcal?.toFixed(0) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {ing.alergenicos_ids && ing.alergenicos_ids.length > 0 ? (
                      <Tooltip title="Contém Alergênicos">
                        <Chip label="ALERTA" color="error" size="small" sx={{ fontWeight: 'bold', height: 20 }} />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {ing.cliente_id && (
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDelete(ing.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}