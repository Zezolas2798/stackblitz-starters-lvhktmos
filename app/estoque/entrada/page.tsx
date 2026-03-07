'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, TextField,
  MenuItem, Autocomplete, InputAdornment,
  FormControl, InputLabel, Select, Tooltip, Container,
  useTheme, alpha, Alert, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Chip,
  Tabs, Tab
} from '@mui/material';
import {
  Save, Thermometer, Scale, FileText, MapPin, Plus, History, PackageCheck, AlertTriangle, CheckCircle, Printer, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Fornecedor } from '@/lib/types';
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';

// --- NOVOS IMPORTS (FASE 2 e 3 DO MASTERPLAN) ---
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview'; // <--- O NOVO COMPONENTE
import { calcularValidade } from '@/lib/legislacao/calculadoraValidade';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';
import { differenceInCalendarDays } from 'date-fns';

export default function EntradaEstoquePage() {
  const router = useRouter();
  const theme = useTheme();

  // Contexto GxP: Cliente e Unidade são obrigatórios
  const { activeClientId: clienteId, unidadeId } = useClient();

  const [loading, setLoading] = useState(false);

  // --- DADOS DO SISTEMA ---
  const [modalOpen, setModalOpen] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<any[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<any[]>([]);

  // Lista de Fornecedores Homologados
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);

  // Sugestões de marcas (Histórico)
  const [marcasSugeridas, setMarcasSugeridas] = useState<string[]>([]);

  // --- ESTADOS DO FORMULÁRIO ---
  const [ingredienteSelecionado, setIngredienteSelecionado] = useState<any | null>(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);

  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [codigoLote, setCodigoLote] = useState('');
  const [qtdPacotes, setQtdPacotes] = useState('');
  const [pesoPacote, setPesoPacote] = useState('');
  const [unidadePeso, setUnidadePeso] = useState('KG');
  const [precoTotal, setPrecoTotal] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0]);
  const [validade, setValidade] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [estadoProduto, setEstadoProduto] = useState('CONFORME');
  const [local, setLocal] = useState('');
  const [registroSif, setRegistroSif] = useState('');

  // -- TABS DE NAVEGAÇÃO --
  const [activeTab, setActiveTab] = useState(0);

  // -- ESTADOS OCR BATCH --
  const [ocrItems, setOcrItems] = useState<any[]>([]);
  const [isReadingOcr, setIsReadingOcr] = useState(false);
  const [ocrItemToLink, setOcrItemToLink] = useState<number | null>(null);

  // Função p/ Teste do fluxo da interface (Substituirá para API GxP Real depois)
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingOcr(true);
    setTimeout(() => {
      const extraidos = [
        { id: 1, nomeExtracao: 'Manteiga Extra Aviação 500g', marca: 'Aviação', lote: 'L-8821', validade: '2027-01-10', sif: 'SIF 555', qtd: 20, peso: 0.5, unid: 'KG', minTemp: 2, maxTemp: 8, lido: false },
        { id: 2, nomeExtracao: 'Queijo Mussarela Fatiado', marca: 'President', lote: 'QJ-993', validade: '2026-12-15', sif: 'SIF 1024', qtd: 15, peso: 1.0, unid: 'KG', minTemp: 2, maxTemp: 8, lido: false },
        { id: 3, nomeExtracao: 'Farinha de Trigo Especial', marca: 'Dona Benta', lote: 'FB-221', validade: '2027-05-20', sif: '', qtd: 50, peso: 1.0, unid: 'KG', minTemp: 15, maxTemp: 30, lido: false }
      ];

      const comMatch = extraidos.map(item => {
        // Simulação de Auto-match Otimizado: Busca nome parecido + a marca
        const match = ingredientes.find(ing => ing.nome.toLowerCase().includes(item.nomeExtracao.split(' ')[0].toLowerCase()) || ing.fonte?.toLowerCase() === item.marca.toLowerCase());
        return {
          ...item,
          ingrediente_id: match ? match.id : '',
          local: ''
        };
      });

      setOcrItems(comMatch);
      setIsReadingOcr(false);
    }, 3500);
  };

  const handleConfirmarCaixa = (id: number) => {
    setOcrItems(prev => prev.map(item => item.id === id ? { ...item, lido: true, minTempAferida: 4 } : item));
  };

  // --- ESTADOS PARA IMPRESSÃO/PREVIEW ---
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [dadosEtiqueta, setDadosEtiqueta] = useState<DadosEtiqueta | null>(null);
  const [validadeStatus, setValidadeStatus] = useState<any>(null);

  // Carregamento Inicial
  useEffect(() => {
    if (clienteId && unidadeId) loadDados();
  }, [clienteId, unidadeId]);

  // Robô de Sugestão
  useEffect(() => {
    async function fetchHistoricoMarcas() {
      if (!ingredienteSelecionado || !clienteId) return;

      if (ingredienteSelecionado.fonte) {
        setMarca(ingredienteSelecionado.fonte);
        setMarcasSugeridas([]);
      } else {
        setMarca('');
        setMarcasSugeridas([]);
      }

      if (ingredienteSelecionado.peso_unitario_g) {
        if (ingredienteSelecionado.peso_unitario_g >= 1000) {
          setPesoPacote((ingredienteSelecionado.peso_unitario_g / 1000).toString());
          setUnidadePeso('KG');
        } else {
          setPesoPacote(ingredienteSelecionado.peso_unitario_g.toString());
          setUnidadePeso('G');
        }
      }
    }
    fetchHistoricoMarcas();
  }, [ingredienteSelecionado, clienteId]);

  // Simulação de Validade
  useEffect(() => {
    async function simularValidade() {
      if (validade && ingredienteSelecionado) {
        const resultado = await calcularValidade(
          categoria || 'GERAL',
          new Date(validade),
          new Date(),
          Number(temperatura) || 25
        );
        setValidadeStatus(resultado);
      } else {
        setValidadeStatus(null);
      }
    }
    simularValidade();
  }, [validade, categoria, temperatura, ingredienteSelecionado]);


  async function loadDados() {
    if (!clienteId || !unidadeId) return;

    const { data: ingData } = await supabase
      .from('ingredientes')
      .select('id, nome, fonte, peso_unitario_g')
      .eq('cliente_id', clienteId)
      .order('nome');
    if (ingData) setIngredientes(ingData);

    const { data: locaisData } = await supabase
      .from('cliente_locais_estoque')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('nome');
    if (locaisData) setLocaisDisponiveis(locaisData);

    const { data: catData } = await supabase
      .from('cliente_categorias_produto')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('nome');
    if (catData) setCategoriasDisponiveis(catData);

    const { data: fornData } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('razao_social');
    if (fornData) setListaFornecedores(fornData as any[]);
  }

  const handleIngredienteCriado = (novoIngrediente: any, categoriaSugerida?: string) => {
    // Flagar como OCR (opcionalmente passaremos via API)
    setIngredientes(prev => [{ ...novoIngrediente, pre_cadastro: true }, ...prev]);

    if (activeTab === 0) {
      setIngredienteSelecionado(novoIngrediente);
      if (novoIngrediente.fonte) setMarca(novoIngrediente.fonte);
      if (categoriaSugerida) {
        const existe = categoriasDisponiveis.some(c => c.nome === categoriaSugerida);
        if (!existe) {
          setCategoriasDisponiveis(prev => [...prev, { id: 'temp_' + Date.now(), nome: categoriaSugerida }]);
        }
        setCategoria(categoriaSugerida);
      }
    } else if (ocrItemToLink !== null) {
      // Associa a Caixa do Lote ao novo Cadastro automaticamente
      setOcrItems(prev => prev.map(i => i.id === ocrItemToLink ? { ...i, ingrediente_id: novoIngrediente.id } : i));
      setOcrItemToLink(null);
    }
  };

  const calcularTotalEstoque = () => {
    const qtd = Number(qtdPacotes);
    const peso = Number(pesoPacote);
    if (!qtd || !peso) return { valor: 0, unidade: 'KG' };
    let total = qtd * peso;
    let unidadeFinal = unidadePeso;
    if (unidadePeso === 'G') { total /= 1000; unidadeFinal = 'KG'; }
    else if (unidadePeso === 'ML') { total /= 1000; unidadeFinal = 'L'; }
    return { valor: parseFloat(total.toFixed(3)), unidade: unidadeFinal };
  };
  const estoqueCalculado = calcularTotalEstoque();

  const handleSalvar = async () => {
    if (!clienteId || !unidadeId || !ingredienteSelecionado || !validade || !qtdPacotes || !pesoPacote || !local) {
      alert('Preencha os campos obrigatórios (*).');
      return;
    }

    if (!fornecedorSelecionado) {
      alert('Atenção: Selecione um Fornecedor Homologado para garantir a rastreabilidade.');
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      const validadeCalculada = await calcularValidade(
        categoria,
        new Date(validade),
        new Date(),
        temperatura ? Number(temperatura) : 25
      );

      const diasRestantes = differenceInCalendarDays(validadeCalculada.dataValidadeFinal, new Date());
      const statusFinal = estadoProduto === 'AVARIADO' ? 'REJEITADO' : (diasRestantes < 0 ? 'VENCIDO' : 'QUARENTENA');

      // GxP: Calculando totais com base na unidade selecionada.
      // A tabela Phase 2 assume 'quantidade_atual_g_ml' que unifica tudo em a G/ML
      let qtdReal = estoqueCalculado.valor;
      if (estoqueCalculado.unidade === 'KG' || estoqueCalculado.unidade === 'L') {
        qtdReal = estoqueCalculado.valor * 1000;
      }

      // NOVA API BLINDADA (Fase 2 de Governança GxP)
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          unidade_id: unidadeId,
          ingrediente_id: ingredienteSelecionado.id,
          fornecedor_id: fornecedorSelecionado.id,
          numero_lote_fabricante: codigoLote.trim() === '' ? `INT-${Date.now()}` : codigoLote,
          nota_fiscal: notaFiscal || null,
          data_fabricacao: new Date(dataRecebimento).toISOString(),
          data_validade_rotulo: validade,
          data_validade_interna: validadeCalculada.dataValidadeFinal.toISOString(),
          quantidade_inicial_g_ml: qtdReal,
          status: statusFinal,
          registro_sif: registroSif || null,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        const msgDb = errorData.detalhes?.message ? ` - Detalhes do Banco: ${errorData.detalhes.message}` : '';
        throw new Error((errorData.erro || 'Falha ao processar entrada de lote') + msgDb);
      }

      const lote = await res.json();

      // Registro de Movimento de Log de Estoque (Estoque Log/Movimentação ainda no front, idealmente estaria no BD via trigger)

      const dadosParaEtiqueta: DadosEtiqueta = {
        empresa: {
          razaoSocial: fornecedorSelecionado.razao_social.substring(0, 30),
          cnpj: fornecedorSelecionado.cnpj || '00.000.000/0000-00',
          enderecoResumido: `Local: ${local}`
        },
        produto: {
          nome: ingredienteSelecionado.nome,
          lote: lote.numero_lote_fabricante || `INT-${lote.id.substring(0, 4)}`,
          peso: `${estoqueCalculado.valor} ${estoqueCalculado.unidade}`,
          tipoArmazenamento: temperatura ? `${temperatura}°C` : 'Ambiente'
        },
        datas: {
          manipulacao: new Date(),
          validadeOriginal: new Date(validade),
          validadeFinal: validadeCalculada.dataValidadeFinal
        },
        rastreabilidade: {
          idInterno: lote.id,
          responsavel: user?.email || 'Sistema'
        }
      };

      setDadosEtiqueta(dadosParaEtiqueta);
      setPrintModalOpen(true);

    } catch (err: any) {
      alert('Erro: ' + err.message);
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setPrintModalOpen(false);
    // Em vez de voltar pro Estoque (que agora é longe da Doca), apenas limpa o form pra nova entrada
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>

      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
              Recebimento de Mercadoria
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registro de entrada, rastreabilidade e controle de validade.
            </Typography>
          </Box>
        </Box>
      </Box>

      <QuickIngredienteDialog
        open={modalOpen}
        onClose={() => { setModalOpen(false); setOcrItemToLink(null); }}
        onSuccess={handleIngredienteCriado}
        nomeSugerido={termoBuscaIngrediente}
      />

      {/* ABAS DE SELEÇÃO: ENTRADA MANUAL VS INTELIGENTE */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Entrada Unitária (Convencional)" icon={<PackageCheck size={18} />} iconPosition="start" />
          <Tab label="Recebimento em Lote (Inteligência Artificial)" icon={<FileText size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Grid container spacing={3}>

          {/* COLUNA ESQUERDA: DADOS FISCAIS E PRODUTO */}
          <Grid item xs={12} md={8}>

            {/* CARD 1: Origem e Fiscal */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                <FileText size={20} /> 1. Origem e Fiscal
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField label="Data Recebimento *" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={dataRecebimento} onChange={e => setDataRecebimento(e.target.value)} />
                </Grid>

                <Grid item xs={12} md={8}>
                  <Autocomplete
                    options={listaFornecedores}
                    getOptionLabel={(option) => option.nome_fantasia || option.razao_social || 'Sem Nome'}
                    value={fornecedorSelecionado}
                    onChange={(_, newValue) => setFornecedorSelecionado(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Fornecedor Homologado *"
                        size="small"
                        fullWidth
                        placeholder="Selecione o fornecedor..."
                        helperText={fornecedorSelecionado?.status_homologacao === 'PENDENTE' ? "⚠️ Documentação pendente" : null}
                      />
                    )}
                    noOptionsText="Nenhum fornecedor encontrado"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField label="Nº Nota Fiscal" size="small" fullWidth value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Registro S.I.F / S.I.M" size="small" fullWidth value={registroSif} onChange={e => setRegistroSif(e.target.value)} placeholder="Ex: SIF 123" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Preço Total (R$)" size="small" fullWidth value={precoTotal} onChange={e => setPrecoTotal(e.target.value)} type="number" />
                </Grid>
              </Grid>
            </Paper>

            {/* CARD 2: Identificação do Produto */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                <PackageCheck size={20} /> 2. Identificação do Produto
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Autocomplete
                  fullWidth
                  options={ingredientes}
                  getOptionLabel={(option) => `${option.nome} ${option.fonte ? `(${option.fonte})` : ''}`}
                  value={ingredienteSelecionado}
                  onChange={(_, newValue) => setIngredienteSelecionado(newValue)}
                  onInputChange={(_, newInputValue) => setTermoBuscaIngrediente(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params} label="Ingrediente (Sistema) *" placeholder="Digite para buscar..."
                      helperText={ingredientes.length === 0 ? "Nenhum ingrediente cadastrado." : "A marca será sugerida automaticamente."}
                    />
                  )}
                />
                <Tooltip title="Item não cadastrado? Criar agora!">
                  <Button variant="contained" color="secondary" sx={{ minWidth: 50, height: 56, mb: 2 }} onClick={() => setModalOpen(true)}><Plus /></Button>
                </Tooltip>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={marcasSugeridas}
                    value={marca}
                    onInputChange={(_, newValue) => setMarca(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params} label="Marca do Produto" size="small" fullWidth placeholder="Selecione ou digite..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (<>{marcasSugeridas.length > 0 && <InputAdornment position="end"><History size={16} color="gray" /></InputAdornment>}{params.InputProps.endAdornment}</>)
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria de Armazenamento</InputLabel>
                    <Select value={categoria} label="Categoria de Armazenamento" onChange={e => setCategoria(e.target.value)}>
                      {categoriasDisponiveis.map((cat) => (<MenuItem key={cat.id} value={cat.nome}>{cat.nome}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* COLUNA DIREITA: CÁLCULO E QUALIDADE */}
          <Grid item xs={12} md={4}>

            {/* CARD 3: Conversão */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: 'success.light', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="success.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Scale size={18} /> Conversão de Estoque
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <TextField label="Quantidade de Embalagens" size="small" type="number" fullWidth value={qtdPacotes} onChange={e => setQtdPacotes(e.target.value)} sx={{ bgcolor: 'background.paper' }} placeholder="Ex: 5" />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Peso Unitário" size="small" type="number" fullWidth value={pesoPacote} onChange={e => setPesoPacote(e.target.value)} sx={{ bgcolor: 'background.paper' }} placeholder="Ex: 2" />
                </Grid>
                <Grid item xs={6}>
                  <TextField select label="Unidade" size="small" fullWidth value={unidadePeso} onChange={e => setUnidadePeso(e.target.value)} sx={{ bgcolor: 'background.paper' }}>
                    <MenuItem value="KG">KG</MenuItem><MenuItem value="G">G</MenuItem><MenuItem value="L">L</MenuItem><MenuItem value="ML">ML</MenuItem><MenuItem value="UN">UN</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'success.main', textAlign: 'center' }}>
                <Typography variant="caption" color="success.dark" fontWeight="bold">TOTAL A ENTRAR NO ESTOQUE</Typography>
                <Typography variant="h4" color="success.main" fontWeight="800">{estoqueCalculado.valor} <Typography component="span" variant="h6" fontWeight="bold">{estoqueCalculado.unidade}</Typography></Typography>
              </Box>
            </Paper>

            {/* CARD 4: Controle de Qualidade (PCC) */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="warning.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Thermometer size={18} /> Controle de Qualidade (PCC)
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {validadeStatus && (
                  <Alert
                    severity={validadeStatus.status === 'CRITICAL' ? 'error' : validadeStatus.status === 'WARNING' ? 'warning' : 'success'}
                    sx={{ fontSize: '0.75rem', py: 0 }}
                  >
                    <Typography variant="caption" fontWeight="bold" display="block">
                      {validadeStatus.regraAplicada}
                    </Typography>
                    {validadeStatus.isRestritiva && " (Lei aplicou restrição)"}
                  </Alert>
                )}

                <Box>
                  <TextField
                    label={codigoLote ? "Lote do Fabricante" : "Lote Interno (Automático)"}
                    size="small"
                    fullWidth
                    value={codigoLote}
                    onChange={e => setCodigoLote(e.target.value)}
                    color={codigoLote ? "primary" : "warning"}
                    focused={!codigoLote}
                  />
                </Box>

                <TextField label="Validade Rótulo *" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={validade} onChange={e => setValidade(e.target.value)} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Temp. (°C)" size="small" type="number" fullWidth value={temperatura} onChange={e => setTemperatura(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">°C</InputAdornment> }} />
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Destino</InputLabel>
                    <Select value={local} label="Destino" onChange={e => setLocal(e.target.value)}>
                      {locaisDisponiveis.map((loc) => (<MenuItem key={loc.id} value={loc.nome}><Box sx={{ display: 'flex', gap: 1 }}><MapPin size={16} /> {loc.nome}</Box></MenuItem>))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField select label="Avaliação Visual" size="small" fullWidth value={estadoProduto} onChange={e => setEstadoProduto(e.target.value)}>
                  <MenuItem value="CONFORME">✅ Conforme (Aprovado)</MenuItem>
                  <MenuItem value="EMBALAGEM_DANIFICADA">⚠️ Emb. Danificada</MenuItem>
                  <MenuItem value="AVARIADO">🚫 Avariado (Rejeitado)</MenuItem>
                </TextField>
              </Box>
            </Paper>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSalvar}
              disabled={loading}
              sx={{ mt: 3, height: 56, fontWeight: 'bold', boxShadow: 3 }}
            >
              {loading ? 'Registrando...' : 'Confirmar Entrada'}
            </Button>

          </Grid>
        </Grid>
      ) : (
        /* ABA DE RECEBIMENTO INTELIGENTE (OCR BATCH) */
        <Box sx={{ mt: 2 }}>
          {ocrItems.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mb: 3 }}>
                {isReadingOcr ? <CircularProgress size={48} /> : <FileText size={48} />}
              </Box>
              <Typography variant="h5" color="text.primary" fontWeight="bold" gutterBottom>
                {isReadingOcr ? 'Processando Documento com IA...' : 'Leitura Inteligente de NF-e e PDF'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                {isReadingOcr
                  ? 'Nossos modelos estao extraindo as informacoes das tabelas da NF-e. Isso pode levar alguns segundos.'
                  : 'Faça o upload do XML da NF-e ou de uma foto nítida do documento físico. Nossa inteligência artificial irá decodificar os produtos, extrair datas de validade, lotes e número do S.I.F.'}
              </Typography>
              {!isReadingOcr && (
                <Button variant="contained" size="large" startIcon={<Plus />} component="label" sx={{ px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem', borderRadius: 4 }}>
                  Carregar Documento
                  <input type="file" hidden accept=".pdf,.xml,image/*" onChange={handleOcrUpload} />
                </Button>
              )}
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 2 }}>
                Formatos suportados: PDF, XML ou Imagens JPG/PNG. Tempo estimado: 5 segundos.
              </Typography>
            </Paper>
          ) : (
            <Box>
              {/* HEADER DA NOTA FISCAL (GLOBAL PARA O LOTE/CAMINHÃO) */}
              <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'primary.light', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={20} /> 1. Vínculo da Nota Fiscal
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField label="Data Chegada (Docas)" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={dataRecebimento} onChange={e => setDataRecebimento(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Autocomplete
                      options={listaFornecedores}
                      getOptionLabel={(option) => option.nome_fantasia || option.razao_social || 'Sem Nome'}
                      value={fornecedorSelecionado}
                      onChange={(_, newValue) => setFornecedorSelecionado(newValue)}
                      renderInput={(params) => <TextField {...params} label="Fornecedor Homologado *" size="small" fullWidth error={!fornecedorSelecionado} helperText={!fornecedorSelecionado ? 'Obrigatório para rastreio' : ''} sx={{ bgcolor: 'white' }} />}
                      noOptionsText="Nenhum fornecedor encontrado"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Nº Nota Fiscal Aberta" size="small" fullWidth value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} sx={{ bgcolor: 'white' }} />
                  </Grid>
                </Grid>
              </Paper>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PackageCheck size={22} />
                  2. Inspeção de Fila: {ocrItems.filter(i => i.lido).length} de {ocrItems.length} caixas verificadas
                </Typography>
                <Button variant="outlined" color="error" size="small" onClick={() => setOcrItems([])}>Descartar Fila Total</Button>
              </Box>

              <Grid container spacing={3}>
                {ocrItems.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: item.lido ? 'success.main' : 'divider', bgcolor: item.lido ? alpha(theme.palette.success.main, 0.05) : 'background.paper' }}>

                      <Grid container spacing={2} alignItems="center">
                        {/* INFO DO OCR */}
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">Lido da NFe:</Typography>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap title={item.nomeExtracao}>{item.nomeExtracao}</Typography>
                          <Typography variant="body2" color="text.secondary">Lote: <b>{item.lote}</b> • Val: <b>{new Date(item.validade).toLocaleDateString('pt-BR')}</b></Typography>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            {item.qtd} cx ({item.peso}{item.unid}) {item.sif ? <Chip size="small" label={item.sif} sx={{ height: 18, ml: 1, fontSize: '0.6rem', bgcolor: 'primary.light', color: 'primary.dark' }} /> : <Chip size="small" label="SIF Ausente" color="warning" sx={{ height: 18, ml: 1, fontSize: '0.6rem' }} />}
                          </Typography>
                        </Grid>

                        {/* DE-PARA: PRODUTO */}
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color={item.ingrediente_id ? "text.secondary" : "error.main"} fontWeight="bold">1. Qual é o Produto? *</Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Autocomplete
                              size="small"
                              fullWidth
                              options={ingredientes}
                              getOptionLabel={(option) => {
                                let prefix = option.pre_cadastro ? '🟡 NEW - ' : '';
                                return `${prefix}${option.nome} ${option.fonte ? `(${option.fonte})` : ''}`;
                              }}
                              value={ingredientes.find(i => i.id === item.ingrediente_id) || null}
                              onChange={(_, newVal) => {
                                setOcrItems(prev => prev.map(i => i.id === item.id ? { ...i, ingrediente_id: newVal?.id || '' } : i));
                              }}
                              disabled={item.lido}
                              renderInput={(params) => <TextField {...params} placeholder={item.ingrediente_id ? "Produto vinculado" : "Auto-match falhou. Busque..."} error={!item.ingrediente_id} sx={{ bgcolor: 'white' }} />}
                            />
                            {!item.lido && (
                              <Tooltip title="Produto novo! Fazer Pré-cadastro Rápido">
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  sx={{ minWidth: 40, px: 1 }}
                                  onClick={() => {
                                    setOcrItemToLink(item.id);
                                    setTermoBuscaIngrediente(item.nomeExtracao);
                                    setModalOpen(true);
                                  }}
                                >
                                  <Plus size={18} />
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        </Grid>

                        {/* DE-PARA: DESTINO FÍSICO */}
                        <Grid item xs={12} md={2}>
                          <Typography variant="caption" color={item.local ? "text.secondary" : "error.main"} fontWeight="bold">2. Local de Guarda *</Typography>
                          <Select
                            size="small" fullWidth displayEmpty
                            value={item.local}
                            onChange={e => setOcrItems(prev => prev.map(i => i.id === item.id ? { ...i, local: e.target.value } : i))}
                            error={!item.local}
                            disabled={item.lido}
                            sx={{ bgcolor: 'white' }}
                          >
                            <MenuItem value="" disabled>Local...</MenuItem>
                            {locaisDisponiveis.map(loc => <MenuItem key={loc.id} value={loc.nome}>{loc.nome}</MenuItem>)}
                          </Select>
                        </Grid>

                        {/* FISCALIZAÇÃO */}
                        <Grid item xs={12} md={3}>
                          {!item.lido ? (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2 }}>
                              <TextField size="small" sx={{ width: '45%', bgcolor: 'white' }} placeholder={`Ex: ${item.minTemp}°C`} label="Temp (°C)" InputProps={{ endAdornment: <InputAdornment position="end">°C</InputAdornment> }} />
                              <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={() => handleConfirmarCaixa(item.id)}
                                disabled={!item.ingrediente_id || !item.local || !fornecedorSelecionado}
                                sx={{ height: 40 }}
                              >
                                Aprovar Item
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                              <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <CheckCircle size={18} /> Aprovado (Temp: {item.minTempAferida}°C)
                              </Typography>
                              <Typography variant="caption" color="success.dark">
                                Vínculo GxP Seguro e Verificado.
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={ocrItems.some(i => !i.lido) || !fornecedorSelecionado || loading}
                  sx={{ px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                  onClick={() => alert("Simulação Frontend Concluída! Integração com API Zod em Breve.")}
                >
                  {loading ? 'Gravando Lotes...' : 'Processar Recebimento do Caminhão'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* --- MODAL DE SUCESSO, PREVIEW E IMPRESSÃO --- */}
      <Dialog open={printModalOpen} onClose={() => { }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'success.main', color: 'white' }}>
          <CheckCircle size={28} />
          Entrada Registrada!
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>Lote gerado com sucesso.</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Confira os dados da etiqueta abaixo antes de imprimir.
            </Typography>

            {dadosEtiqueta && (
              <Box sx={{ mt: 1, mb: 3, display: 'flex', justifyContent: 'center' }}>
                {/* PREVIEW VISUAL DA ETIQUETA */}
                <EtiquetaPreview dados={dadosEtiqueta} />
              </Box>
            )}

            {dadosEtiqueta && (
              <Box sx={{ mt: 2 }}>
                <EtiquetaPrinter dados={dadosEtiqueta} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ mr: 'auto' }}>
            Pular Impressão e Sair
          </Button>
          <Button onClick={handleCloseModal} variant="contained" color="success">
            Concluir
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}