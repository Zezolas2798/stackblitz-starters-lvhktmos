'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, X, Plus, ChevronRight, ChevronDown, FolderSearch } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid,
  Paper,
  IconButton,
  Autocomplete,
  Chip,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const MODALIDADES_COMPRAS = [
  'ALIMENTOS', 'EMBALAGENS', 'LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'
];
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';

interface PreCadastroFornecedorDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (fornecedor: any) => void;
  defaultModalidade?: string;
  tipo?: 'FORNECEDOR' | 'SERVICO';
}

export default function PreCadastroFornecedorDialog({
  open,
  onClose,
  onSuccess,
  defaultModalidade,
  tipo = 'FORNECEDOR',
}: PreCadastroFornecedorDialogProps) {
  const { activeClientId } = useClient();
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);

  useEffect(() => {
    if (open && activeClientId) {
      fetchCategorias();
      if (defaultModalidade) {
        setSelectedCategorias([defaultModalidade]);
      } else {
        setSelectedCategorias([]);
      }
    }
  }, [open, activeClientId, defaultModalidade, tipo]);

  const fetchCategorias = async () => {
    const { data } = await (supabase as any)
      .from('categorias_config')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('tipo', tipo)
      .is('deleted_at', null)
      .order('nome', { ascending: true });
    
    setCategoriasList(data || []);
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const handleBuscarCnpj = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return;

    setSearching(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!res.ok) throw new Error('CNPJ não encontrado ou erro na API.');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmar = async () => {
    if (!data || !activeClientId) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Inserir Fornecedor
      const { data: newFornecedor, error: insertError } = await (supabase as any)
        .from('fornecedores')
        .insert({
          cliente_id: activeClientId,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || data.razao_social,
          cnpj: cnpj,
          status_homologacao: 'PENDENTE',
          email: data.email,
          telefone: data.ddd_telefone_1,
          categorias_compras: selectedCategorias,
          situacao_cadastral: data.descricao_situacao_cadastral,
          tipo: tipo,
          cnae_principal: data.cnae_fiscal ? `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}` : null,
          endereco_completo: `${data.logradouro}, ${data.numero} ${data.complemento || ''} - ${data.bairro}, ${data.municipio}/${data.uf}`.trim()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (insertError) throw insertError;

      onSuccess(newFornecedor);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {tipo === 'SERVICO' ? 'Pré-cadastro de Prestador de Serviço' : 'Pré-cadastro de Fornecedor'}
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Insira o CNPJ para buscar os dados automaticamente na Brasil API.
          </Typography>
          
          {defaultModalidade && (
            <Alert severity="info" sx={{ mb: 1 }}>
              O fornecedor será cadastrado na categoria: <strong>{defaultModalidade}</strong>
            </Alert>
          )}

          <TextField
            label="CNPJ"
            fullWidth
            value={cnpj}
            autoFocus
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleBuscarCnpj}
                    disabled={searching || cnpj.replace(/\D/g, '').length !== 14}
                    startIcon={searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                  >
                    Buscar
                  </Button>
                </InputAdornment>
              ),
            }}
          />

           {error && <Alert severity="error">{error}</Alert>}

          {data && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Categoria do {tipo === 'SERVICO' ? 'Prestador' : 'Fornecedor'}
                </Typography>
                <Autocomplete
                  multiple
                  options={Array.from(new Set([...(tipo === 'FORNECEDOR' ? MODALIDADES_COMPRAS : []), ...categoriasList.map(c => c.nome)]))}
                  value={selectedCategorias}
                  onChange={(_, val) => setSelectedCategorias(val)}
                  renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Selecione as categorias..." />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} key={option} size="small" />
                    ))
                  }
                />
              </Box>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Razão Social</Typography>
                  <Typography variant="body2" fontWeight="bold">{data.razao_social}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Nome Fantasia</Typography>
                  <Typography variant="body2">{data.nome_fantasia || data.razao_social}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Situação</Typography>
                  <Typography variant="body2" color={data.descricao_situacao_cadastral === 'ATIVA' ? 'success.main' : 'error.main'} fontWeight="bold">
                    {data.descricao_situacao_cadastral}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Endereço</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {data.logradouro}, {data.numero} - {data.municipio}/{data.uf}
                  </Typography>
                </Grid>
              </Grid>
              </Paper>
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          size="large"
          disabled={!data || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
        >
          {loading ? 'Salvando...' : 'Confirmar e Cadastrar'}
        </Button>
      </DialogActions>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </Dialog>
  );
}
