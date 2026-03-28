'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Paper, TextField,
  CircularProgress, Grid, Tabs, Tab, Alert, MenuItem, Select,
  FormControl, InputLabel, Chip, Tooltip, InputAdornment, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [categoriasConfig, setCategoriasConfig] = useState<any[]>([]);

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
        categorias_compras: data.categorias_compras || []
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
    }
  }, [activeClientId, fornecedor.tipo]);

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
      // Garantir que as modalidades de compras básicas sempre existam na lista de opções
      const existingNames = cats.map((c: any) => c.nome);
      MODALIDADES_COMPRAS.forEach(m => {
        if (!existingNames.includes(m)) {
          cats.push({ nome: m, documentos_obrigatorios: [] });
        }
      });
    }
    setCategoriasConfig(cats);
  };

  const handleChange = (field: string, value: any) => {
    setFornecedor((prev: any) => ({ ...prev, [field]: value }));
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

        // ─── Lógica de Sincronização GED Automatizada ───
        await ensureFolderExists();

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

  // ─── Criação Automática de Pasta GED ───
  const ensureFolderExists = async () => {
    if (isNew || !activeClientId) return;

    try {
      setFolderError(null);
      
      // 1. Identificar a pasta base padrão (3.1.1 ou 3.2) como fallback global
      const searchNome = fornecedor.tipo === 'SERVICO' ? '%3.2%' : '%3.1.1%';
      const { data: baseFolder } = await (supabase as any)
        .from('documentos_pastas')
        .select('id, documentos_categorias!inner(cliente_id)')
        .eq('documentos_categorias.cliente_id', activeClientId)
        .ilike('nome', searchNome)
        .limit(1)
        .maybeSingle();

      const targetParentId = baseFolder?.id || null;

      // 2. Sincronizar placeholders para as categorias do fornecedor
      const categoriesToProcess = fornecedor.categorias_compras || [];
      const razaoSocial = fornecedor.razao_social;

      // Se ainda não temos uma pasta vinculada ao fornecedor (ou se mudou), tentamos atualizar o registro
      if (targetParentId && fornecedor.pasta_documentos_id !== targetParentId) {
        await (supabase as any)
          .from('fornecedores')
          .update({ pasta_documentos_id: targetParentId })
          .eq('id', id);
        setFornecedor((prev: any) => ({ ...prev, pasta_documentos_id: targetParentId }));
      }

      if (categoriesToProcess.length === 0) return;

      // 3. Gerar placeholders para documentos obrigatórios
      // Buscar o que já existe para o fornecedor para evitar duplicatas
      const { data: allExistingFiles } = await (supabase as any)
        .from('documentos_arquivos')
        .select('id, nome_arquivo, pasta_id')
        .filter('nome_arquivo', 'ilike', `%[${razaoSocial}]%`)
        .is('deleted_at', null);

      for (const catName of categoriesToProcess) {
        const { data: catDocs } = await (supabase as any)
          .from('categorias_config')
          .select('documentos_obrigatorios, ged_pasta_id')
          .eq('cliente_id', activeClientId)
          .eq('nome', catName)
          .maybeSingle();

        if (catDocs?.documentos_obrigatorios && Array.isArray(catDocs.documentos_obrigatorios)) {
          const categoryDefaultFolder = catDocs.ged_pasta_id || targetParentId;

          for (const doc of catDocs.documentos_obrigatorios) {
            const docName = typeof doc === 'string' ? doc : doc.nome;
            const docPastaId = typeof doc === 'object' ? doc.ged_pasta_id : null;
            const finalTargetFolderId = docPastaId || categoryDefaultFolder;
            
            if (!finalTargetFolderId) continue;

            const fullTargetName = `[${razaoSocial}] ${docName}`;
            
            // Verificar se o documento JÁ EXISTE nesta pasta específica
            const existsInFolder = allExistingFiles?.some((f: any) => 
              f.pasta_id === finalTargetFolderId && 
              f.nome_arquivo.toLowerCase() === fullTargetName.toLowerCase()
            );

            if (!existsInFolder) {
              await (supabase as any)
                .from('documentos_arquivos')
                .insert({
                  pasta_id: finalTargetFolderId,
                  nome_arquivo: fullTargetName,
                  url_storage: null, // Placeholder pendente
                  versao: 1
                });
              
              // Adicionamos à lista local para evitar duplicatas por múltiplas categorias
              if (allExistingFiles) {
                allExistingFiles.push({ pasta_id: finalTargetFolderId, nome_arquivo: fullTargetName });
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao gerar placeholders automáticos:', err);
      // O erro só bloqueia visualmente se realmente não conseguimos nem uma pasta raiz
      if (!fornecedor.pasta_documentos_id) {
        setFolderError(`Atenção: Algumas pastas do GED podem não ter sido localizadas.`);
      }
    }
  };

  const handleTabChange = async (_: any, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      await ensureFolderExists();
    }
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
                        Nenhuma categoria configurada. Vá em "Gerenciar Categorias" para definir.
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    As categorias definem a organização no GED e os documentos exigidos para homologação.
                  </Typography>
                </Paper>
              </Grid>

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
                    />
                  ) : folderError ? (
                    <Alert severity="error" action={
                      <Button color="inherit" size="small" onClick={ensureFolderExists}>
                        Tentar Novamente
                      </Button>
                    }>
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
