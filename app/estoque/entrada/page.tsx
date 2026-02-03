'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Button, Paper, TextField, 
  MenuItem, Autocomplete, InputAdornment, 
  FormControl, InputLabel, Select, Tooltip, Container, 
  useTheme, alpha, Alert, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { 
  Save, ArrowLeft, Thermometer, Scale, FileText, MapPin, Plus, History, PackageCheck, CheckCircle, Printer, Eye 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Fornecedor } from '@/lib/types'; 
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';

// IMPORTAÇÕES CORRETAS DOS COMPONENTES CRIADOS ACIMA
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview';
import { calcularValidade } from '@/lib/legislacao/calculadoraValidade';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

export default function EntradaEstoquePage() {
  const router = useRouter();
  const theme = useTheme();
  const { activeClientId: clienteId, unidadeId } = useClient();
  const [loading, setLoading] = useState(false);
  
  // Dados do Sistema
  const [modalOpen, setModalOpen] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<any[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [marcasSugeridas, setMarcasSugeridas] = useState<string[]>([]);
  
  // Formulário
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

  // Estados de Impressão
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [dadosEtiqueta, setDadosEtiqueta] = useState<DadosEtiqueta | null>(null);
  const [validadeStatus, setValidadeStatus] = useState<any>(null);

  useEffect(() => {
    if (clienteId && unidadeId) loadDados();
  }, [clienteId, unidadeId]);

  // Carregar dados iniciais
  async function loadDados() {
    const { data: ingData } = await supabase.from('ingredientes').select('id, nome, fonte, peso_unitario_g').eq('cliente_id', clienteId).order('nome');
    if (ingData) setIngredientes(ingData);

    const { data: locaisData } = await supabase.from('cliente_locais_estoque').select('*').eq('unidade_id', unidadeId).order('nome');
    if (locaisData) setLocaisDisponiveis(locaisData);

    const { data: catData } = await supabase.from('cliente_categorias_produto').select('*').eq('cliente_id', clienteId).order('nome');
    if (catData) setCategoriasDisponiveis(catData);

    const { data: fornData } = await supabase.from('fornecedores').select('*').eq('cliente_id', clienteId).order('razao_social');
    if (fornData) setListaFornecedores(fornData as Fornecedor[]);
  }

  // Sugestão de Marca
  useEffect(() => {
    async function fetchHistoricoMarcas() {
      if (!ingredienteSelecionado || !clienteId) return;
      if (ingredienteSelecionado.fonte) {
        setMarca(ingredienteSelecionado.fonte);
        setMarcasSugeridas([]); 
      } else {
        setMarca(''); 
        const { data } = await supabase.from('estoque_lotes').select('marca').eq('cliente_id', clienteId).eq('ingrediente_id', ingredienteSelecionado.id).not('marca', 'is', null);
        if (data) {
          const marcasUnicas = Array.from(new Set(data.map(item => item.marca).filter(Boolean)));
          setMarcasSugeridas(marcasUnicas as string[]);
        }
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

  // Cálculo de Validade
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

  const handleIngredienteCriado = (novoIngrediente: any, categoriaSugerida?: string) => {
    setIngredientes(prev => [novoIngrediente, ...prev]);
    setIngredienteSelecionado(novoIngrediente);
    if (novoIngrediente.fonte) setMarca(novoIngrediente.fonte);
    if (categoriaSugerida) {
      const existe = categoriasDisponiveis.some(c => c.nome === categoriaSugerida);
      if (!existe) {
        setCategoriasDisponiveis(prev => [...prev, { id: 'temp_' + Date.now(), nome: categoriaSugerida }]);
      }
      setCategoria(categoriaSugerida);
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
        categoria, new Date(validade), new Date(), temperatura ? Number(temperatura) : 25
      );

      const payload = {
          cliente_id: clienteId,
          unidade_id: unidadeId,
          ingrediente_id: ingredienteSelecionado.id,
          data_recebimento: new Date(dataRecebimento).toISOString(),
          fornecedor_id: fornecedorSelecionado.id,
          fornecedor: fornecedorSelecionado.nome_fantasia || fornecedorSelecionado.razao_social, 
          marca: marca, 
          nota_fiscal: notaFiscal, 
          categoria_produto: categoria,
          codigo_lote_fornecedor: codigoLote.trim() === '' ? null : codigoLote, 
          data_validade_original: validade, 
          data_validade_atual: validadeCalculada.dataValidadeFinal.toISOString(), 
          qtd_embalagens: Number(qtdPacotes), 
          peso_unitario_embalagem: Number(pesoPacote), 
          unidade_peso_embalagem: unidadePeso as any,
          quantidade_inicial: estoqueCalculado.valor, 
          quantidade_atual: estoqueCalculado.valor, 
          unidade_medida: estoqueCalculado.unidade,
          valor_unitario: precoTotal ? (Number(precoTotal) / estoqueCalculado.valor) : null,
          temperatura_recebimento: temperatura ? Number(temperatura) : null, 
          estado_produto: estadoProduto, 
          local_armazenamento: local,
          status_lote: estadoProduto === 'CONFORME' ? 'ATIVO' : 'BLOQUEADO'
      };

      const { data: lote, error: erroLote } = await supabase.from('estoque_lotes').insert(payload).select().single();
      if (erroLote) throw erroLote;
      
      await supabase.from('estoque_movimentacoes').insert({
        lote_id: lote.id, 
        tipo_movimento: 'ENTRADA', 
        quantidade_movimentada: estoqueCalculado.valor,
        quantidade_nova: estoqueCalculado.valor, 
        data_movimento: new Date().toISOString(), 
        justificativa: `Recebimento NF ${notaFiscal} -> ${local}`,
        responsavel_id: user?.id,
        fornecedor_id: fornecedorSelecionado.id,
        unidade_id: unidadeId
      });

      // Preparar dados para etiqueta
      const dadosParaEtiqueta: DadosEtiqueta = {
        empresa: {
            razaoSocial: fornecedorSelecionado.razao_social.substring(0,30), 
            cnpj: fornecedorSelecionado.cnpj || '00.000.000/0000-00', 
            enderecoResumido: `Local: ${local}`
        },
        produto: {
            nome: ingredienteSelecionado.nome,
            lote: lote.codigo_lote_fornecedor || `INT-${lote.id.substring(0,4)}`,
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
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setPrintModalOpen(false);
    router.push('/estoque'); 
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowLeft />} onClick={() => router.back()} color="inherit">Voltar</Button>
          <Box>
              <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>Recebimento de Mercadoria</Typography>
              <Typography variant="body2" color="text.secondary">Registro de entrada, rastreabilidade e controle de validade.</Typography>
          </Box>
      </Box>

      <QuickIngredienteDialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={handleIngredienteCriado}
        nomeSugerido={termoBuscaIngrediente}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
                        renderInput={(params) => <TextField {...params} label="Fornecedor Homologado *" size="small" fullWidth placeholder="Selecione o fornecedor..." helperText={fornecedorSelecionado?.status_homologacao === 'PENDENTE' ? "⚠️ Documentação pendente" : null} />}
                        noOptionsText="Nenhum fornecedor encontrado"
                      />
                  </Grid>
                  <Grid item xs={12} md={4}><TextField label="Nº Nota Fiscal" size="small" fullWidth value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} /></Grid>
                  <Grid item xs={12} md={4}><TextField label="Preço Total (R$)" size="small" fullWidth value={precoTotal} onChange={e => setPrecoTotal(e.target.value)} type="number" /></Grid>
                </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                  <PackageCheck size={20} /> 2. Identificação do Produto
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <Autocomplete fullWidth options={ingredientes} getOptionLabel={(option) => `${option.nome} ${option.fonte ? `(${option.fonte})` : ''}`} value={ingredienteSelecionado} onChange={(_, newValue) => setIngredienteSelecionado(newValue)} onInputChange={(_, newInputValue) => setTermoBuscaIngrediente(newInputValue)} renderInput={(params) => <TextField {...params} label="Ingrediente (Sistema) *" placeholder="Digite para buscar..." />} />
                    <Tooltip title="Item não cadastrado? Criar agora!"><Button variant="contained" color="secondary" sx={{ minWidth: 50, height: 56, mb: 2 }} onClick={() => setModalOpen(true)}><Plus /></Button></Tooltip>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Autocomplete freeSolo options={marcasSugeridas} value={marca} onInputChange={(_, newValue) => setMarca(newValue)} renderInput={(params) => <TextField {...params} label="Marca do Produto" size="small" fullWidth placeholder="Selecione ou digite..." InputProps={{...params.InputProps, endAdornment: (<>{marcasSugeridas.length > 0 && <InputAdornment position="end"><History size={16} color="gray" /></InputAdornment>}{params.InputProps.endAdornment}</>)}} />} />
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

        <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: 'success.light', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="success.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Scale size={18} /> Conversão de Estoque</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}><TextField label="Quantidade de Embalagens" size="small" type="number" fullWidth value={qtdPacotes} onChange={e => setQtdPacotes(e.target.value)} sx={{ bgcolor: 'white' }} /></Grid>
                    <Grid item xs={6}><TextField label="Peso Unitário" size="small" type="number" fullWidth value={pesoPacote} onChange={e => setPesoPacote(e.target.value)} sx={{ bgcolor: 'white' }} /></Grid>
                    <Grid item xs={6}>
                        <TextField select label="Unidade" size="small" fullWidth value={unidadePeso} onChange={e => setUnidadePeso(e.target.value)} sx={{ bgcolor: 'white' }}>
                            <MenuItem value="KG">KG</MenuItem><MenuItem value="G">G</MenuItem><MenuItem value="L">L</MenuItem><MenuItem value="ML">ML</MenuItem><MenuItem value="UN">UN</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'success.main', textAlign: 'center' }}>
                    <Typography variant="caption" color="success.dark" fontWeight="bold">TOTAL A ENTRAR NO ESTOQUE</Typography>
                    <Typography variant="h4" color="success.main" fontWeight="800">{estoqueCalculado.valor} <Typography component="span" variant="h6" fontWeight="bold">{estoqueCalculado.unidade}</Typography></Typography>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="warning.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Thermometer size={18} /> Controle de Qualidade (PCC)</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {validadeStatus && <Alert severity={validadeStatus.status === 'CRITICAL' ? 'error' : validadeStatus.status === 'WARNING' ? 'warning' : 'success'} sx={{ fontSize: '0.75rem', py: 0 }}><Typography variant="caption" fontWeight="bold" display="block">{validadeStatus.regraAplicada}</Typography>{validadeStatus.isRestritiva && " (Lei aplicou restrição)"}</Alert>}
                    <Box><TextField label={codigoLote ? "Lote do Fabricante" : "Lote Interno (Automático)"} size="small" fullWidth value={codigoLote} onChange={e => setCodigoLote(e.target.value)} color={codigoLote ? "primary" : "warning"} focused={!codigoLote} /></Box>
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
                        <MenuItem value="CONFORME">✅ Conforme (Aprovado)</MenuItem><MenuItem value="EMBALAGEM_DANIFICADA">⚠️ Emb. Danificada</MenuItem><MenuItem value="AVARIADO">🚫 Avariado (Rejeitado)</MenuItem>
                    </TextField>
                </Box>
            </Paper>

            <Button variant="contained" size="large" fullWidth startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Save />} onClick={handleSalvar} disabled={loading} sx={{ mt: 3, height: 56, fontWeight: 'bold', boxShadow: 3 }}>
                {loading ? 'Registrando...' : 'Confirmar Entrada'}
            </Button>
        </Grid>
      </Grid>

      {/* MODAL DE SUCESSO / IMPRESSÃO */}
      <Dialog open={printModalOpen} onClose={() => {}} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'success.main', color: 'white' }}><CheckCircle size={28} /> Entrada Registrada!</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" gutterBottom>Lote gerado com sucesso.</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>Confira os dados da etiqueta abaixo antes de imprimir.</Typography>
                {dadosEtiqueta && <Box sx={{ mt: 1, mb: 3, display: 'flex', justifyContent: 'center' }}><EtiquetaPreview dados={dadosEtiqueta} /></Box>}
                {dadosEtiqueta && <Box sx={{ mt: 2 }}><EtiquetaPrinter dados={dadosEtiqueta} /></Box>}
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Button onClick={handleCloseModal} color="inherit" sx={{ mr: 'auto' }}>Pular Impressão e Sair</Button>
            <Button onClick={handleCloseModal} variant="contained" color="success">Concluir</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}