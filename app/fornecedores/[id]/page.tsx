'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Paper, TextField,
  CircularProgress, Grid, Tabs, Tab, Alert, MenuItem, Select,
  FormControl, InputLabel, Chip, Tooltip, InputAdornment, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Autocomplete, Checkbox
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { ArrowLeft, Save, HelpCircle, ChevronRight, Settings, Search, Loader2, Trash2 } from 'lucide-react';

const MODALIDADES_COMPRAS = [
  'ALIMENTOS', 'EMBALAGENS', 'LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'
];
import DocumentosFornecedor from '@/components/documentos/DocumentosFornecedor';

interface BrasilApiCnpjResponse {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  uf: string;
  cep: string;
  bairro: string;
  numero: string;
  municipio: string;
  logradouro: string;
  complemento: string;
  descricao_tipo_de_logradouro: string;
  email: string | null;
  ddd_telefone_1: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: { codigo: number; descricao: string }[];
  descricao_situacao_cadastral: string;
}

export default function EditFornecedorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const queryTipo = searchParams?.get('tipo') || 'FORNECEDOR';
  const isNew = id === 'novo';
  const { activeClientId } = useClient();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [categoriasConfig, setCategoriasConfig] = useState<any[]>([]);
  const [gruposDisponiveis, setGruposDisponiveis] = useState<any[]>([]);
  const [subgruposDisponiveis, setSubgruposDisponiveis] = useState<any[]>([]);
  const [itensDisponiveis, setItensDisponiveis] = useState<any[]>([]);
  const [carregandoPortfolio, setCarregandoPortfolio] = useState(false);
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<any[]>([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<any[]>([]);
  const [carregandoAtivos, setCarregandoAtivos] = useState(false);

  const [fornecedor, setFornecedor] = useState<any>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    status_homologacao: 'PENDENTE',
    licenca_sanitaria_validade: '',
    pasta_documentos_id: null,
    endereco_completo: '',
    telefone: '',
    email: '',
    cnae_principal: '',
    cnaes_secundarios: null,
    situacao_cadastral: '',
    categorias_compras: [],
    grupos_fornecidos: [],
    subgrupos_fornecidos: [],
    itens_fornecidos: [],
    equipamentos_vinculados: [],
    setores_vinculados: [],
    tipo: queryTipo
  });
  const [originalFornecedor, setOriginalFornecedor] = useState<any>(null);

  const loadFornecedor = useCallback(async () => {
    if (isNew) {
      setFornecedor((prev: any) => ({ ...prev, tipo: queryTipo }));
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      const formatted = {
        ...data,
        licenca_sanitaria_validade: data.licenca_sanitaria_validade
          ? new Date(data.licenca_sanitaria_validade).toISOString().split('T')[0]
          : '',
        categorias_compras: data.categorias_compras || [],
        equipamentos_vinculados: data.equipamentos_vinculados || [],
        setores_vinculados: data.setores_vinculados || []
      };
      setFornecedor(formatted);
      setOriginalFornecedor(formatted);
    }
    setLoading(false);
  }, [id, isNew]);

  useEffect(() => {
    loadFornecedor();
  }, [loadFornecedor]);

  useEffect(() => {
    if (activeClientId) {
      fetchCategorias();
      if (fornecedor.tipo === 'SERVICO') {
        fetchAtivosData();
      }
    }
  }, [activeClientId, fornecedor.tipo]);

  const fetchAtivosData = async () => {
    if (!activeClientId) return;
    try {
      setCarregandoAtivos(true);
      const [equipRes, setoresRes] = await Promise.all([
        (supabase as any).from('equipamentos_config').select('id, nome, grupo').eq('cliente_id', activeClientId).is('ativo', true),
        (supabase as any).from('setores_producao').select('id, nome').eq('cliente_id', activeClientId)
      ]);
      setEquipamentosDisponiveis(equipRes.data || []);
      setSetoresDisponiveis(setoresRes.data || []);
    } catch (err) {
      console.error('Erro ao buscar ativos:', err);
    } finally {
      setCarregandoAtivos(false);
    }
  };

  const fetchCategorias = async () => {
    const { data } = await (supabase as any)
      .from('categorias_config')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('tipo', fornecedor.tipo)
      .is('deleted_at', null)
      .order('nome', { ascending: true });
    
    let cats = data || [];
    if (fornecedor.tipo === 'FORNECEDOR') {
      const existingNames = cats.map((c: any) => c.nome);
      MODALIDADES_COMPRAS.forEach(m => {
        if (!existingNames.includes(m)) {
          cats.push({ nome: m, documentos_obrigatorios: [] });
        }
      });
    }
    setCategoriasConfig(cats);
  };

  // Efeito para carregar o portfólio assim que as categorias do fornecedor estiverem disponíveis
  useEffect(() => {
    if (activeClientId && fornecedor.id && fornecedor.tipo === 'FORNECEDOR' && fornecedor.categorias_compras?.length > 0) {
      fetchPortfolioData(fornecedor.categorias_compras);
    } else if (fornecedor.categorias_compras?.length === 0 || fornecedor.tipo === 'SERVICO') {
      setGruposDisponiveis([]);
      setSubgruposDisponiveis([]);
      setItensDisponiveis([]);
    }
  }, [activeClientId, fornecedor.id, JSON.stringify(fornecedor.categorias_compras)]);

  const fetchPortfolioData = async (categoriasToFetch?: string[]) => {
    if (!activeClientId) return;
    
    const categorias = categoriasToFetch || fornecedor.categorias_compras || [];
    if (categorias.length === 0) {
      setGruposDisponiveis([]);
      setItensDisponiveis([]);
      return;
    }

    try {
      setCarregandoPortfolio(true);
      
      // 1. Buscar Grupos (Level 2)
      const { data: grupos } = await (supabase as any)
        .from('grupos_produto')
        .select('*')
        .eq('cliente_id', activeClientId)
        .in('modalidade', categorias)
        .order('modalidade')
        .order('nome');

      setGruposDisponiveis(grupos || []);

      // 2. Buscar Subgrupos (Level 3)
      const { data: subgrupos } = await (supabase as any)
        .from('subgrupos_produto')
        .select('*')
        .eq('cliente_id', activeClientId)
        .order('nome');
      
      setSubgruposDisponiveis(subgrupos || []);

      // 3. Buscar Itens (Level 4 / Ingredientes)
      const { data: ingredientes } = await (supabase as any)
        .from('ingredientes')
        .select('id, nome, subgrupo_id, grupo_id')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null)
        .order('nome');
      
      // Mapear modalidades para filtragem visual
      const catMap: Record<string, string> = {};
      grupos?.forEach((c: any) => { catMap[c.id] = c.modalidade; });

      const mappedItens = (ingredientes || []).map((i: any) => {
        const catId = i.grupo_id || (subgrupos?.find((s: any) => s.id === i.subgrupo_id)?.grupo_id);
        const mod = catId ? catMap[catId] : null;
        
        return {
          id: i.id,
          nome: i.nome,
          grupo_id: catId,
          subgrupo_id: i.subgrupo_id,
          modalidade: mod
        };
      });

      const filteredItens = mappedItens.filter((i: any) => i.modalidade && categorias.includes(i.modalidade));
      setItensDisponiveis(filteredItens);
    } catch (err) {
      console.error('Erro ao carregar portfólio:', err);
    } finally {
      setCarregandoPortfolio(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFornecedor((prev: any) => {
      const next = { ...prev, [field]: value };
      return next;
    });
    
    // Se mudou categorias_compras, buscar portfólio restrito
    if (field === 'categorias_compras') {
      fetchPortfolioData(value);
    }
  };

  const handleUpdateGrupos = (event: any, newValue: any[]) => {
    const novosIds = newValue.map(v => v.id);
    
    setFornecedor((prev: any) => {
      // Se removeu um grupo, remover também os subgrupos e itens vinculados a ele
      const gruposRemovidos = (prev.grupos_fornecidos || []).filter((id: string) => !novosIds.includes(id));
      let subgruposRestantes = prev.subgrupos_fornecidos || [];
      let itensRestantes = prev.itens_fornecidos || [];
      
      if (gruposRemovidos.length > 0) {
        const subgruposParaRemover = subgruposDisponiveis
          .filter((s: any) => gruposRemovidos.includes(s.grupo_id))
          .map((s: any) => s.id);
        
        const itensParaRemover = itensDisponiveis
          .filter((i: any) => gruposRemovidos.includes(i.grupo_id))
          .map((i: any) => i.id);
          
        subgruposRestantes = subgruposRestantes.filter((id: string) => !subgruposParaRemover.includes(id));
        itensRestantes = itensRestantes.filter((id: string) => !itensParaRemover.includes(id));
      }
      
      return {
        ...prev,
        grupos_fornecidos: novosIds,
        subgrupos_fornecidos: subgruposRestantes,
        itens_fornecidos: itensRestantes
      };
    });
  };

  const handleUpdateSubgrupos = (event: any, newValue: any[]) => {
    const novosIds = newValue.map(v => v.id);
    setFornecedor((prev: any) => {
      const subgruposRemovidos = (prev.subgrupos_fornecidos || []).filter((id: string) => !novosIds.includes(id));
      let itensRestantes = prev.itens_fornecidos || [];
      
      if (subgruposRemovidos.length > 0) {
        const itensParaRemover = itensDisponiveis
          .filter((i: any) => subgruposRemovidos.includes(i.subgrupo_id))
          .map((i: any) => i.id);
        itensRestantes = itensRestantes.filter((id: string) => !itensParaRemover.includes(id));
      }
      
      return {
        ...prev,
        subgrupos_fornecidos: novosIds,
        itens_fornecidos: itensRestantes
      };
    });
  };

  const handleUpdateItens = (event: any, newValue: any[]) => {
    setFornecedor((prev: any) => ({
      ...prev,
      itens_fornecidos: newValue.map(v => v.id)
    }));
  };

  // ─── Busca CNPJ via Brasil API ───
  const handleBuscarCnpj = async () => {
    const cnpjLimpo = fornecedor.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setSnackbar({ open: true, message: 'CNPJ deve conter exatamente 14 dígitos.', severity: 'error' });
      return;
    }

    setBuscandoCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'CNPJ não encontrado.');
      }
      const data: BrasilApiCnpjResponse = await res.json();

      const enderecoPartes = [
        data.descricao_tipo_de_logradouro,
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro ? `- ${data.bairro}` : '',
        data.municipio ? `- ${data.municipio}` : '',
        data.uf ? `/ ${data.uf}` : '',
        data.cep ? `- CEP: ${data.cep}` : ''
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

      setFornecedor((prev: any) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social || prev.nome_fantasia,
        endereco_completo: enderecoPartes || prev.endereco_completo,
        telefone: data.ddd_telefone_1 || prev.telefone,
        email: data.email || prev.email,
        cnae_principal: data.cnae_fiscal
          ? `${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`
          : prev.cnae_principal,
        cnaes_secundarios: data.cnaes_secundarios?.length
          ? data.cnaes_secundarios
          : prev.cnaes_secundarios,
        situacao_cadastral: data.descricao_situacao_cadastral || prev.situacao_cadastral,
      }));

      setSnackbar({ open: true, message: 'Dados do CNPJ carregados com sucesso!', severity: 'success' });
    } catch (err: any) {
      console.error('Erro ao buscar CNPJ:', err);
      setSnackbar({ open: true, message: `Erro ao buscar CNPJ: ${err.message}`, severity: 'error' });
    } finally {
      setBuscandoCnpj(false);
    }
  };

  // ─── Salvar ───
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        cliente_id: activeClientId,
        razao_social: fornecedor.razao_social,
        nome_fantasia: fornecedor.nome_fantasia,
        cnpj: fornecedor.cnpj,
        status_homologacao: fornecedor.status_homologacao,
        licenca_sanitaria_validade: fornecedor.licenca_sanitaria_validade || null,
        endereco_completo: fornecedor.endereco_completo || null,
        telefone: fornecedor.telefone || null,
        email: fornecedor.email || null,
        cnae_principal: fornecedor.cnae_principal || null,
        cnaes_secundarios: fornecedor.cnaes_secundarios || null,
        situacao_cadastral: fornecedor.situacao_cadastral || null,
        categorias_compras: fornecedor.categorias_compras || [],
        grupos_fornecidos: fornecedor.grupos_fornecidos || [],
        subgrupos_fornecidos: fornecedor.subgrupos_fornecidos || [],
        itens_fornecidos: fornecedor.itens_fornecidos || [],
        equipamentos_vinculados: fornecedor.equipamentos_vinculados || [],
        setores_vinculados: fornecedor.setores_vinculados || [],
        tipo: fornecedor.tipo
      };

      if (isNew) {
        const { error, data } = await (supabase as any).from('fornecedores').insert(payload).select().single();
        if (error) throw error;
        setSnackbar({ open: true, message: 'Fornecedor criado com sucesso!', severity: 'success' });
        router.push(`/fornecedores/${data.id}`);
      } else {
        const { error } = await (supabase as any).from('fornecedores').update(payload).eq('id', id);
        if (error) throw error;

        setOriginalFornecedor({ ...fornecedor });
        setSnackbar({ open: true, message: 'Fornecedor atualizado com sucesso!', severity: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao salvar fornecedor: ' + err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Excluir ───
  const handleDelete = async () => {
    try {
      setSaving(true);
      const { error } = await (supabase as any)
        .from('fornecedores')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setSnackbar({ open: true, message: 'Fornecedor excluído com sucesso!', severity: 'success' });
      router.push('/fornecedores');
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao excluir fornecedor: ' + err.message, severity: 'error' });
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };


  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  // ─── Formatação CNPJ ───
  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(fornecedor.tipo === 'SERVICO' ? '/servicos' : '/fornecedores')} variant="outlined">
          Voltar
        </Button>
        <Box>
          <Typography variant="h4" fontWeight="800">
            {isNew 
              ? (fornecedor.tipo === 'SERVICO' ? 'Novo Prestador' : 'Novo Fornecedor') 
              : (fornecedor.razao_social || (fornecedor.tipo === 'SERVICO' ? 'Editar Prestador' : 'Editar Fornecedor'))
            }
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Dados Básicos" />
            <Tab label="Homologação & Documentos (GED)" />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {/* ── CNPJ com botão de busca ── */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="CNPJ"
                  fullWidth
                  value={fornecedor.cnpj}
                  onChange={(e) => handleChange('cnpj', formatCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Buscar dados pela Brasil API">
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={handleBuscarCnpj}
                              disabled={buscandoCnpj || fornecedor.cnpj.replace(/\D/g, '').length !== 14}
                              sx={{ minWidth: 'auto', px: 2, fontWeight: 'bold' }}
                              startIcon={buscandoCnpj ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            >
                              {buscandoCnpj ? 'Buscando...' : (isNew ? 'Buscar' : 'Atualizar via API')}
                            </Button>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* ── Situação Cadastral (somente leitura) ── */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Situação Cadastral (Receita Federal)"
                  fullWidth
                  value={fornecedor.situacao_cadastral || '—'}
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: fornecedor.situacao_cadastral === 'ATIVA' ? 'green' :
                             fornecedor.situacao_cadastral === 'BAIXADA' ? 'red' : 'inherit',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Grid>

              {/* ── Razão Social ── */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Razão Social"
                  fullWidth
                  value={fornecedor.razao_social}
                  onChange={(e) => handleChange('razao_social', e.target.value)}
                />
              </Grid>

              {/* ── Categorias (Destaque) ── */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {fornecedor.tipo === 'SERVICO' ? 'Categorias de Serviço' : 'Categorias de Compras'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {(categoriasConfig.length > 0 ? categoriasConfig : []).map((catObj) => {
                      const cat = catObj.nome;
                      return (
                        <Chip
                          key={cat}
                          label={cat}
                          onClick={() => {
                            const current = fornecedor.categorias_compras || [];
                            const next = current.includes(cat)
                              ? current.filter((c: string) => c !== cat)
                              : [...current, cat];
                            handleChange('categorias_compras', next);
                          }}
                          color={fornecedor.categorias_compras?.includes(cat) ? 'primary' : 'default'}
                          variant={fornecedor.categorias_compras?.includes(cat) ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      );
                    })}
                    {categoriasConfig.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma categoria configurada.
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    As categorias definem a organização no GED e os documentos exigidos para homologação.
                  </Typography>
                </Paper>
              </Grid>

              {/* ── Seleção Granular de Portfólio (Exclusiva para FORNECEDOR) ── */}
              {fornecedor.tipo === 'FORNECEDOR' && fornecedor.categorias_compras?.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
                        Hierarquia de Portfólio: Grupos & Subgrupos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Especifique o portfólio detalhado conforme as categorias selecionadas acima.
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      {/* GRUPOS DE COMPRAS */}
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          options={gruposDisponiveis}
                          groupBy={(option) => option.modalidade || 'Outros'}
                          getOptionLabel={(option) => option.nome}
                          value={gruposDisponiveis.filter(g => (fornecedor.grupos_fornecidos || []).includes(g.id))}
                          onChange={handleUpdateGrupos}
                          loading={carregandoPortfolio}
                          renderOption={(props, option, { selected }) => (
                            <li {...props}>
                              <Checkbox
                                size="small"
                                style={{ marginRight: 8 }}
                                checked={selected}
                              />
                              {option.nome}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Grupos Fornecidos (Level 2)"
                              placeholder="Ex: Farinhas, Carnes..."
                              helperText="Grupos organizados por modalidade"
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                label={option.nome}
                                {...getTagProps({ index })}
                                color="primary"
                                size="small"
                              />
                            ))
                          }
                        />
                      </Grid>

                      {/* SUBGRUPOS (LEVEL 3) */}
                      {(fornecedor.grupos_fornecidos || []).length > 0 && (
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={subgruposDisponiveis.filter(s => 
                              (fornecedor.grupos_fornecidos || []).includes(s.grupo_id)
                            )}
                            getOptionLabel={(option) => option.nome}
                            value={subgruposDisponiveis.filter(s => (fornecedor.subgrupos_fornecidos || []).includes(s.id))}
                            onChange={handleUpdateSubgrupos}
                            renderOption={(props, option, { selected }) => (
                              <li {...props}>
                                <Checkbox
                                  size="small"
                                  style={{ marginRight: 8 }}
                                  checked={selected}
                                />
                                {option.nome}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Subgrupos (Level 3)"
                                placeholder="Filtro fino de categorias"
                              />
                            )}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  label={option.nome}
                                  {...getTagProps({ index })}
                                  color="info"
                                  size="small"
                                />
                              ))
                            }
                          />
                        </Grid>
                      )}

                      {/* ITENS / INGREDIENTES (LEVEL 4) */}
                      {(fornecedor.grupos_fornecidos || []).length > 0 && (
                        <Grid item xs={12}>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={itensDisponiveis.filter(i => 
                              (fornecedor.grupos_fornecidos || []).includes(i.grupo_id) &&
                              ((fornecedor.subgrupos_fornecidos || []).length === 0 || (fornecedor.subgrupos_fornecidos || []).includes(i.subgrupo_id))
                            )}
                            getOptionLabel={(option) => option.nome}
                            value={itensDisponiveis.filter(i => (fornecedor.itens_fornecidos || []).includes(i.id))}
                            onChange={handleUpdateItens}
                            renderOption={(props, option, { selected }) => (
                              <li {...props}>
                                <Checkbox
                                  size="small"
                                  style={{ marginRight: 8 }}
                                  checked={selected}
                                />
                                {option.nome}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Itens Específicos (Level 4)"
                                placeholder="Ex: Farinha de Trigo Tipo 1..."
                                helperText="Especifique os insumos homologados deste fornecedor"
                              />
                            )}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  label={option.nome}
                                  {...getTagProps({ index })}
                                  color="secondary"
                                  size="small"
                                />
                              ))
                            }
                          />
                        </Grid>
                      )}
                    </Grid>

                    {gruposDisponiveis.length === 0 && !carregandoPortfolio && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Nenhum Grupo configurado no sistema para as categorias selecionadas.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* ── Seção de Ativos/Setores (Exclusiva para SERVICO e Reativa à Categoria) ── */}
              {fornecedor.tipo === 'SERVICO' && (categoriasConfig.some(c => (fornecedor.categorias_compras || []).includes(c.nome) && ['EQUIPAMENTO', 'SETOR'].includes(c.tipo_escopo))) && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'secondary.main', mb: 0.5 }}>
                        Escopo Técnico: Ativos & Áreas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vínculo de recursos técnicos habilitado com base nas categorias selecionadas.
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      {categoriasConfig.some(c => (fornecedor.categorias_compras || []).includes(c.nome) && c.tipo_escopo === 'EQUIPAMENTO') && (
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            multiple
                            options={equipamentosDisponiveis}
                            groupBy={(option) => option.grupo || 'Geral'}
                            getOptionLabel={(option) => option.nome}
                            value={equipamentosDisponiveis.filter(e => (fornecedor.equipamentos_vinculados || []).includes(e.id))}
                            onChange={(_, newValue) => handleChange('equipamentos_vinculados', newValue.map(v => v.id))}
                            loading={carregandoAtivos}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Equipamentos Atendidos"
                                placeholder="Ex: Fornos, Geladeiras..."
                              />
                            )}
                          />
                        </Grid>
                      )}

                      {categoriasConfig.some(c => (fornecedor.categorias_compras || []).includes(c.nome) && c.tipo_escopo === 'SETOR') && (
                        <Grid item xs={12} md={6}>
                          <Autocomplete
                            multiple
                            options={setoresDisponiveis}
                            getOptionLabel={(option) => option.nome}
                            value={setoresDisponiveis.filter(s => (fornecedor.setores_vinculados || []).includes(s.id))}
                            onChange={(_, newValue) => handleChange('setores_vinculados', newValue.map(v => v.id))}
                            loading={carregandoAtivos}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Setores de Atuação"
                                placeholder="Ex: Cozinha Quente, Depósito..."
                              />
                            )}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* ── Nome Fantasia ── */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome Fantasia"
                  fullWidth
                  value={fornecedor.nome_fantasia}
                  onChange={(e) => handleChange('nome_fantasia', e.target.value)}
                />
              </Grid>

              {/* ── Endereço Completo ── */}
              <Grid item xs={12}>
                <TextField
                  label="Endereço Completo"
                  fullWidth
                  value={fornecedor.endereco_completo}
                  onChange={(e) => handleChange('endereco_completo', e.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>

              {/* ── Telefone e Email ── */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone"
                  fullWidth
                  value={fornecedor.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="E-mail"
                  fullWidth
                  type="email"
                  value={fornecedor.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Grid>

              {/* ── CNAE Principal ── */}
              <Grid item xs={12}>
                <TextField
                  label="CNAE Principal"
                  fullWidth
                  value={fornecedor.cnae_principal}
                  InputProps={{ readOnly: true }}
                  helperText="Preenchido automaticamente via consulta CNPJ"
                />
              </Grid>

              {/* ── CNAEs Secundários ── */}
              {fornecedor.cnaes_secundarios && fornecedor.cnaes_secundarios.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    CNAEs Secundários
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {fornecedor.cnaes_secundarios.map((cnae: { codigo: number; descricao: string }, idx: number) => (
                      <Chip
                        key={idx}
                        label={`${cnae.codigo} - ${cnae.descricao}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Grid>
              )}


              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving || !fornecedor.razao_social}
                  >
                    {saving ? 'Salvando...' : 'Salvar Dados'}
                  </Button>

                  {!isNew && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Trash2 size={18} />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      {fornecedor.tipo === 'SERVICO' ? 'Excluir Prestador' : 'Excluir Fornecedor'}
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <Box>
              {isNew ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Para acessar a gestão de documentos e homologação, você precisa primeiro salvar os dados básicos do fornecedor.
                  </Alert>
                  <Button variant="contained" onClick={handleSave}>
                    Salvar Fornecedor Agora
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status da Homologação</InputLabel>
                        <Select
                          value={fornecedor.status_homologacao}
                          label="Status da Homologação"
                          onChange={(e) => {
                            handleChange('status_homologacao', e.target.value);
                            handleSave();
                          }}
                        >
                          <MenuItem value="PENDENTE">Pendente de Avaliação</MenuItem>
                          <MenuItem value="APROVADO">Aprovado</MenuItem>
                          <MenuItem value="REJEITADO">Rejeitado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Validade da Licença Sanitária"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={fornecedor.licenca_sanitaria_validade}
                        onChange={(e) => handleChange('licenca_sanitaria_validade', e.target.value)}
                        onBlur={handleSave}
                      />
                    </Grid>
                  </Grid>

                  {fornecedor.pasta_documentos_id ? (
                    <DocumentosFornecedor 
                      pastaId={fornecedor.pasta_documentos_id} 
                      categoriasSelecionadas={fornecedor.categorias_compras} 
                      razaoSocial={fornecedor.razao_social}
                      entidadeId={id as string}
                    />
                  ) : folderError ? (
                    <Alert severity="error">
                      {folderError}
                    </Alert>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography color="text.secondary">Criando pasta segura no GED...</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* ── Snackbar de feedback ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Diálogo de Exclusão ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o fornecedor <strong>{fornecedor.razao_social}</strong>? 
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained" 
            autoFocus
            disabled={saving}
          >
            {saving ? 'Excluindo...' : 'Sim, Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
