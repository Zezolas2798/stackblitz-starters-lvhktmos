'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Container,
  Tabs,
  Tab,
  Chip,
  useTheme,
  alpha,
  TextField,
  Button,
  Grid,
  Autocomplete,
  IconButton,
  MenuItem,
  Collapse,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart, FileText, Package, ChevronDown, ChevronRight,
  Hash, Plus, Trash2, Save, Upload, CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';
import { Fornecedor } from '@/lib/types';
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';

interface RequisicaoFalta {
  id: string;
  ordem_id: string;
  ingrediente_id: string | null;
  grupo_estoque_id: string | null;
  qtd_necessaria_g: number;
  qtd_separada_g: number;
  status: string;
  created_at: string;
  ingredientes: { nome: string } | null;
  ingredientes_grupos: { nome: string } | null;
  producao_ordens: { codigo: string; titulo: string | null; data_prevista: string | null } | null;
}

interface NfItem {
  tempId: string;
  ingrediente_id: string;
  marca: string;
  qtdEmbalagens: string;
  pesoUnitario: string;
  unidadePeso: string;
  validade: string;
  lote: string;
}

export default function ComprasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState<RequisicaoFalta[]>([]);
  const [error, setError] = useState('');

  // --- NF UPLOAD STATE ---
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorNf, setFornecedorNf] = useState<Fornecedor | null>(null);
  const [numNf, setNumNf] = useState('');
  const [dataNf, setDataNf] = useState(new Date().toISOString().split('T')[0]);
  const [nfItens, setNfItens] = useState<NfItem[]>([
    { tempId: '1', ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', validade: '', lote: '' }
  ]);
  const [salvandoNf, setSalvandoNf] = useState(false);
  const [nfSucesso, setNfSucesso] = useState(false);

  // --- QUICK INGREDIENTE DIALOG ---
  const [modalOpen, setModalOpen] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [nfItemToLink, setNfItemToLink] = useState<string | null>(null);

  // --- OCR STATE ---
  const [ocrItems, setOcrItems] = useState<any[]>([]);
  const [isReadingOcr, setIsReadingOcr] = useState(false);


  const loadRequisicoes = useCallback(async () => {
    if (!unidadeId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await (supabase as any)
        .from('producao_requisicoes')
        .select(`
          id,
          ordem_id,
          ingrediente_id,
          grupo_estoque_id,
          qtd_necessaria_g,
          qtd_separada_g,
          status,
          created_at,
          ingredientes ( nome ),
          ingredientes_grupos ( nome ),
          producao_ordens!inner ( 
            codigo, 
            titulo, 
            data_prevista,
            unidade_id 
          )
        `)
        .eq('producao_ordens.unidade_id', unidadeId)
        .eq('status', 'FALTA_ESTOQUE')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequisicoes(((data as any) as RequisicaoFalta[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar requisições.');
      setRequisicoes([]);
    } finally {
      setLoading(false);
    }
  }, [unidadeId]);

  const loadDados = useCallback(async () => {
    if (!activeClientId) return;

    const { data: ingData } = await (supabase as any)
      .from('ingredientes')
      .select('id, nome, fonte, peso_unitario_g, grupo_estoque_id')
      .eq('cliente_id', activeClientId)
      .is('deleted_at', null)
      .order('nome');
    if (ingData) setIngredientes(ingData);

    const { data: fornData } = await (supabase as any)
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', activeClientId)
      .is('deleted_at', null)
      .order('razao_social');
    if (fornData) setListaFornecedores(fornData as any[]);
  }, [activeClientId]);

  // Lista consolidada agrupada por grupo_estoque ou ingrediente
  const consolidatedList = useMemo(() => {
    const map: { [key: string]: any } = {};
    requisicoes.forEach(req => {
      // Use grupo_estoque_id as key if available, otherwise ingrediente_id
      const key = req.grupo_estoque_id || req.ingrediente_id || req.id;
      const nome = req.grupo_estoque_id
        ? req.ingredientes_grupos?.nome
        : req.ingredientes?.nome;
      const falta = req.qtd_necessaria_g - req.qtd_separada_g;
      if (!map[key]) {
        map[key] = {
          id: key,
          nome: nome || 'Desconhecido',
          total_falta_g: 0,
          requisicoes_count: 0,
          isGrupo: !!req.grupo_estoque_id
        };
      }
      map[key].total_falta_g += falta;
      map[key].requisicoes_count += 1;
    });
    return Object.values(map).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [requisicoes]);

  // Agrupado por OP
  const groupedByOP = useMemo(() => {
    const map: { [key: string]: any } = {};
    requisicoes.forEach(req => {
      const oid = req.ordem_id;
      if (!map[oid]) {
        map[oid] = {
          id: oid,
          codigo: req.producao_ordens?.codigo || 'N/A',
          titulo: req.producao_ordens?.titulo || 'Sem Título',
          data_prevista: req.producao_ordens?.data_prevista,
          itens: []
        };
      }
      map[oid].itens.push(req);
    });
    return Object.values(map).sort((a: any, b: any) =>
      (b.data_prevista || '').localeCompare(a.data_prevista || '')
    );
  }, [requisicoes]);

  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const toggleOrder = (id: string) => {
    setExpandedOrders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (unidadeId) loadRequisicoes();
  }, [unidadeId, loadRequisicoes]);

  useEffect(() => {
    if (activeClientId) loadDados();
  }, [activeClientId, loadDados]);

  // --- NF ITEM HANDLERS ---
  const handleAddNfItem = () => {
    setNfItens([...nfItens, {
      tempId: Date.now().toString(),
      ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '',
      unidadePeso: 'KG', validade: '', lote: ''
    }]);
  };

  const handleRemoveNfItem = (tempId: string) => {
    setNfItens(nfItens.filter(i => i.tempId !== tempId));
  };

  const handleNfItemChange = (tempId: string, field: keyof NfItem, value: string) => {
    setNfItens(nfItens.map(i => i.tempId === tempId ? { ...i, [field]: value } : i));
  };

  // Auto-fill marca when ingredient selected
  const handleIngredienteSelect = (tempId: string, ingredienteId: string) => {
    const ing = ingredientes.find(i => i.id === ingredienteId);
    setNfItens(nfItens.map(i => {
      if (i.tempId !== tempId) return i;
      return {
        ...i,
        ingrediente_id: ingredienteId,
        marca: ing?.fonte || '',
        pesoUnitario: ing?.peso_unitario_g ? (ing.peso_unitario_g >= 1000 ? (ing.peso_unitario_g / 1000).toString() : ing.peso_unitario_g.toString()) : '',
        unidadePeso: ing?.peso_unitario_g >= 1000 ? 'KG' : 'G'
      };
    }));
  };

  // Handle ingredient created via QuickIngredienteDialog
  const handleIngredienteCriado = (novoIngrediente: any) => {
    setIngredientes(prev => [novoIngrediente, ...prev]);
    // If we have a target NF item, auto-select the new ingredient
    if (nfItemToLink) {
      handleIngredienteSelect(nfItemToLink, novoIngrediente.id);
      setNfItemToLink(null);
    }
  };

  // Build grouped ingredient options: requisitions first, then all
  const ingredienteSugestoes = useMemo(() => {
    const reqIngIds = new Set<string>();
    const sugestoes: { id: string; nome: string; fonte?: string; group: string }[] = [];

    // From requisitions (FALTA_ESTOQUE) — show ingredients that belong to the groups or specific
    requisicoes.forEach(req => {
      if (req.ingrediente_id && !reqIngIds.has(req.ingrediente_id)) {
        reqIngIds.add(req.ingrediente_id);
        sugestoes.push({
          id: req.ingrediente_id,
          nome: req.ingredientes?.nome || 'Desconhecido',
          group: '📋 Requisições (Falta Estoque)'
        });
      }
    });

    // Also add ingredients whose grupo_estoque_id matches any grupo from requisitions
    const reqGrupoIds = new Set(requisicoes.filter(r => r.grupo_estoque_id).map(r => r.grupo_estoque_id!));
    ingredientes.forEach(ing => {
      if (ing.grupo_estoque_id && reqGrupoIds.has(ing.grupo_estoque_id) && !reqIngIds.has(ing.id)) {
        reqIngIds.add(ing.id);
        sugestoes.push({
          id: ing.id,
          nome: ing.nome,
          fonte: ing.fonte,
          group: '📋 Requisições (Falta Estoque)'
        });
      }
    });

    // All ingredients
    ingredientes.forEach(ing => {
      if (!reqIngIds.has(ing.id)) {
        sugestoes.push({
          id: ing.id,
          nome: ing.nome,
          fonte: ing.fonte,
          group: '📦 Todos os Ingredientes'
        });
      }
    });

    return sugestoes;
  }, [ingredientes, requisicoes]);

  // OCR upload handler
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingOcr(true);
    setTimeout(() => {
      const extraidos = [
        { id: 1, nomeExtracao: 'Item 1 da NF', marca: '', lote: '', validade: '', qtd: 1, peso: 1, unid: 'KG' },
        { id: 2, nomeExtracao: 'Item 2 da NF', marca: '', lote: '', validade: '', qtd: 1, peso: 1, unid: 'KG' }
      ];

      const comMatch = extraidos.map(item => {
        const match = ingredientes.find(ing =>
          ing.nome.toLowerCase().includes(item.nomeExtracao.split(' ')[0].toLowerCase())
        );
        return {
          ...item,
          ingrediente_id: match ? match.id : '',
        };
      });

      setOcrItems(comMatch);
      setIsReadingOcr(false);
    }, 2000);
  };

  const handleSalvarNf = async () => {
    if (!fornecedorNf) {
      alert('Selecione o fornecedor.');
      return;
    }

    const validItens = nfItens.filter(i => i.ingrediente_id && i.qtdEmbalagens && i.pesoUnitario);
    if (validItens.length === 0) {
      alert('Adicione pelo menos um item com ingrediente e quantidade.');
      return;
    }

    setSalvandoNf(true);
    setNfSucesso(false);
    try {
      for (const item of validItens) {
        const qtdEmb = parseFloat(item.qtdEmbalagens);
        const pesoEmb = parseFloat(item.pesoUnitario);
        let qtdGml = qtdEmb * pesoEmb;
        if (item.unidadePeso === 'KG' || item.unidadePeso === 'L') {
          qtdGml *= 1000;
        }

        const { error: insertErr } = await (supabase as any).from('lotes_estoque').insert({
          unidade_id: unidadeId,
          ingrediente_id: item.ingrediente_id,
          fornecedor_id: fornecedorNf.id,
          numero_lote_fabricante: item.lote || `NF-${numNf || 'SN'}-${Date.now().toString().slice(-4)}`,
          nota_fiscal: numNf || null,
          data_fabricacao: dataNf,
          data_validade_rotulo: item.validade || null,
          quantidade_inicial_g_ml: qtdGml,
          quantidade_atual_g_ml: qtdGml,
          status: 'PREVISTO',
          qtd_embalagens: qtdEmb,
          peso_unitario_embalagem: pesoEmb,
          unidade_peso_embalagem: item.unidadePeso
        });

        if (insertErr) throw insertErr;
      }

      setNfSucesso(true);
      // Reset form
      setNfItens([
        { tempId: Date.now().toString(), ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', validade: '', lote: '' }
      ]);
      setNumNf('');

    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar NF: ' + err.message);
    } finally {
      setSalvandoNf(false);
    }
  };

  const getReqItemName = (req: RequisicaoFalta) =>
    req.grupo_estoque_id ? req.ingredientes_grupos?.nome : req.ingredientes?.nome;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart size={28} />
          Compras
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Requisições de compra, itens em falta e lançamento de notas fiscais.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <QuickIngredienteDialog
        open={modalOpen}
        onClose={() => { setModalOpen(false); setNfItemToLink(null); }}
        onSuccess={handleIngredienteCriado}
        nomeSugerido={termoBuscaIngrediente}
      />

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2 }}>
            <Tab icon={<Package size={18} />} iconPosition="start" label="Lista Consolidada" sx={{ fontWeight: 'bold', minHeight: 56 }} />
            <Tab icon={<Hash size={18} />} iconPosition="start" label="Agrupado por OP" sx={{ fontWeight: 'bold', minHeight: 56 }} />
            <Tab icon={<FileText size={18} />} iconPosition="start" label="Lançar Nota Fiscal" sx={{ fontWeight: 'bold', minHeight: 56 }} />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>

          {/* ──────── TAB 0: LISTA CONSOLIDADA ──────── */}
          {tabValue === 0 && (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : consolidatedList.length === 0 ? (
              <Alert severity="info">Nenhum item em falta de estoque no momento. 🎉</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtde. Total em Falta</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Nº de Requisições</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consolidatedList.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">{item.nome}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.isGrupo ? 'Grupo' : 'Específico'}
                            size="small"
                            variant="outlined"
                            color={item.isGrupo ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="error.main">
                            {(item.total_falta_g / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} Kg
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={item.requisicoes_count} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* ──────── TAB 1: AGRUPADO POR OP ──────── */}
          {tabValue === 1 && (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : groupedByOP.length === 0 ? (
              <Alert severity="info">Nenhuma ordem de produção com itens em falta.</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupedByOP.map((op: any) => {
                  const isExpanded = expandedOrders.includes(op.id);
                  return (
                    <Paper key={op.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <Box
                        onClick={() => toggleOrder(op.id)}
                        sx={{
                          p: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          bgcolor: isExpanded ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          <Box sx={{ bgcolor: 'secondary.main', color: 'white', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {op.codigo}
                          </Box>
                          <Typography fontWeight="bold">{op.titulo || 'Sem Título'}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {op.data_prevista ? format(parseISO(op.data_prevista), 'dd/MM/yyyy') : 'Sem data'}
                        </Typography>
                      </Box>
                      <Collapse in={isExpanded}>
                        <Divider />
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="center">Tipo</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="right">Falta</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }} align="right">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {op.itens.map((req: RequisicaoFalta) => (
                              <TableRow key={req.id}>
                                <TableCell>{getReqItemName(req)}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={req.grupo_estoque_id ? 'Grupo' : 'Espec.'}
                                    size="small" variant="outlined"
                                    color={req.grupo_estoque_id ? 'primary' : 'default'}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {((req.qtd_necessaria_g - req.qtd_separada_g) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} Kg
                                </TableCell>
                                <TableCell align="right">
                                  <Chip label="Falta" size="small" color="error" variant="outlined" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Box>
            )
          )}

          {/* ──────── TAB 2: LANÇAR NOTA FISCAL ──────── */}
          {tabValue === 2 && (
            <Box>
              {nfSucesso && (
                <Alert severity="success" icon={<CheckCircle size={20} />} sx={{ mb: 3 }}
                  onClose={() => setNfSucesso(false)}
                >
                  Nota Fiscal lançada com sucesso! Os itens foram criados como <strong>Recebimento Previsto</strong> e
                  aparecerão na aba "Aguardando Desembarque" do Recebimento de Mercadoria para conferência física.
                </Alert>
              )}

              {/* Cabeçalho da NF */}
              <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                    <FileText size={20} /> Dados da Nota Fiscal
                  </Typography>
                  <Tooltip title="Upload de NF para leitura automática (IA)">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={isReadingOcr ? <CircularProgress size={16} /> : <Upload size={16} />}
                      disabled={isReadingOcr}
                      size="small"
                    >
                      {isReadingOcr ? 'Lendo...' : 'Importar Digital (IA)'}
                      <input type="file" hidden accept="image/*,.pdf" onChange={handleOcrUpload} />
                    </Button>
                  </Tooltip>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={listaFornecedores}
                      getOptionLabel={(option) => option.nome_fantasia || option.razao_social || 'Sem Nome'}
                      value={fornecedorNf}
                      onChange={(_, newValue) => setFornecedorNf(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Fornecedor *"
                          placeholder="Quem enviou a mercadoria?"
                        />
                      )}
                      noOptionsText="Nenhum fornecedor encontrado"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Nº Nota Fiscal"
                      fullWidth
                      value={numNf}
                      onChange={e => setNumNf(e.target.value)}
                      placeholder="Ex: 000.123.456"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Data de Emissão"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={dataNf}
                      onChange={e => setDataNf(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Itens da NF */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={20} /> Itens da Nota
                    <Chip label={nfItens.length} size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleAddNfItem}
                    size="small"
                    sx={{ borderRadius: 2 }}
                  >
                    Adicionar Insumo
                  </Button>
                </Box>

                {nfItens.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                    <Typography color="text.secondary">Nenhum item adicionado ainda.</Typography>
                    <Button startIcon={<Plus size={16} />} onClick={handleAddNfItem} sx={{ mt: 1 }}>Adicionar o Primeiro</Button>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {nfItens.map((item, index) => {
                      const qtd = parseFloat(item.qtdEmbalagens) || 0;
                      const peso = parseFloat(item.pesoUnitario) || 0;
                      let total = qtd * peso;
                      const unidFinal = item.unidadePeso === 'G' ? 'Kg' : (item.unidadePeso === 'ML' ? 'L' : item.unidadePeso);
                      if (item.unidadePeso === 'G') total /= 1000;
                      if (item.unidadePeso === 'ML') total /= 1000;

                      return (
                        <Paper
                          key={item.tempId}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            position: 'relative',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
                            }
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveNfItem(item.tempId)}
                              disabled={nfItens.length === 1}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            {/* Linha 1: Identificação */}
                            <Grid item xs={12} md={7}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                INSUMO / INGREDIENTE *
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Autocomplete
                                  fullWidth
                                  size="small"
                                  options={ingredienteSugestoes}
                                  groupBy={(option) => option.group}
                                  getOptionLabel={(option) => `${option.nome}${option.fonte ? ` (${option.fonte})` : ''}`}
                                  value={ingredienteSugestoes.find(s => s.id === item.ingrediente_id) || null}
                                  onChange={(_, newVal) => {
                                    if (newVal) handleIngredienteSelect(item.tempId, newVal.id);
                                  }}
                                  onInputChange={(_, val) => setTermoBuscaIngrediente(val)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder="Busque por nome ou marca..."
                                    />
                                  )}
                                  noOptionsText="Nenhum ingrediente encontrado"
                                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                />
                                <Tooltip title="Cadastrar Novo Ingrediente">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setNfItemToLink(item.tempId);
                                      setModalOpen(true);
                                    }}
                                    sx={{ border: '1px solid', borderColor: 'divider' }}
                                  >
                                    <Plus size={20} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                MARCA (OPCIONAL)
                              </Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={item.marca}
                                onChange={e => handleNfItemChange(item.tempId, 'marca', e.target.value)}
                                placeholder="Marca do fabricante"
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <Divider sx={{ my: 1, opacity: 0.5 }} />
                            </Grid>

                            {/* Linha 2: Dados Técnicos */}
                            <Grid item xs={6} md={1.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Qtd. Emb.</Typography>
                              <TextField
                                type="number" size="small" fullWidth
                                value={item.qtdEmbalagens}
                                onChange={e => handleNfItemChange(item.tempId, 'qtdEmbalagens', e.target.value)}
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                            <Grid item xs={6} md={1.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Peso Unit.</Typography>
                              <TextField
                                type="number" size="small" fullWidth
                                value={item.pesoUnitario}
                                onChange={e => handleNfItemChange(item.tempId, 'pesoUnitario', e.target.value)}
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                            <Grid item xs={6} md={1.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Unid.</Typography>
                              <TextField
                                select size="small" fullWidth
                                value={item.unidadePeso}
                                onChange={e => handleNfItemChange(item.tempId, 'unidadePeso', e.target.value)}
                              >
                                <MenuItem value="KG">Kg</MenuItem>
                                <MenuItem value="G">g</MenuItem>
                                <MenuItem value="L">L</MenuItem>
                                <MenuItem value="ML">ml</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid item xs={6} md={2.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Validade</Typography>
                              <TextField
                                type="date" size="small" fullWidth
                                value={item.validade}
                                onChange={e => handleNfItemChange(item.tempId, 'validade', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            <Grid item xs={12} md={2.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Lote Fabricante</Typography>
                              <TextField
                                size="small" fullWidth
                                value={item.lote}
                                onChange={e => handleNfItemChange(item.tempId, 'lote', e.target.value)}
                                placeholder="ID do Lote"
                              />
                            </Grid>
                            <Grid item xs={12} md={2.5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { md: 'flex-end', xs: 'flex-start' } }}>
                              <Typography variant="caption" color="text.secondary">Total Calculado</Typography>
                              <Typography variant="h6" fontWeight="800" color="primary.main">
                                {total > 0 ? `${total.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unidFinal}` : '-'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Action bar fixada ou bem destacada */}
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex' }}>
                    <CheckCircle size={24} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Pronto para alocar?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Os itens serão registrados como <strong>Recebimento Previsto</strong>.
                      A conferência física ocorre no Recebimento de Mercadoria.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={salvandoNf ? <CircularProgress size={16} color="inherit" /> : <Save size={20} />}
                  disabled={salvandoNf || nfItens.length === 0}
                  onClick={handleSalvarNf}
                  sx={{
                    px: 6,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: '800',
                    borderRadius: 2,
                    boxShadow: theme.shadows[4]
                  }}
                >
                  {salvandoNf ? 'Processando...' : 'Finalizar Lançamento'}
                </Button>
              </Paper>
            </Box>
          )}

        </Box>
      </Paper>
    </Container>
  );
}
