'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas'; 
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; 
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, CircularProgress, Alert, 
  Paper, Grid, List, ListItem, ListItemText, Chip, 
  FormControl, InputLabel, Select, MenuItem, Stack, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Badge, Drawer, useTheme, alpha
} from '@mui/material';

// Ícones
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import RestoreIcon from '@mui/icons-material/Restore';
import { 
  ChefHat, Scale, Settings, LayoutTemplate, FlaskConical, ScanEye, AlertTriangle, FileCheck, CheckCircle 
} from 'lucide-react';

import LoadingButton from '@mui/lab/LoadingButton';
import CalculateIcon from '@mui/icons-material/Calculate';

import { ResultadoCalculo, ReceitaVersao } from '@/lib/types';
import NutritionalLabel, { LupaFrontalANVISA } from '@/components/NutritionalLabel';

// --- TIPOS ---
type TabelaLayout = 'VERTICAL' | 'VERTICAL_QUEBRADA' | 'HORIZONTAL' | 'HORIZONTAL_QUEBRADA' | 'LINEAR';
type LupaLayout = 'VERTICAL' | 'HORIZONTAL' | 'COMPACTO';

type ComposicaoDisplayItem = { 
  id: string; 
  nome: string; 
  peso_liquido_g: number; 
  tipo: 'ingrediente' | 'receita'; 
  peso_unitario_g?: number | null;
  tipo_ingrediente?: string; 
  funcao_aditivo?: string | null;
  ins_code?: string | null;
};

export default function DetalhesReceitaPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const { activeClientId } = useClient();
  const theme = useTheme();
  
  const tabelaRef = useRef<HTMLDivElement>(null);

  // === ESTADOS DE DADOS ===
  const [receitaAtual, setReceitaAtual] = useState<any | null>(null);
  const [receitaExibida, setReceitaExibida] = useState<any | null>(null);
  
  const [tabela, setTabela] = useState<ResultadoCalculo | null>(null);
  const [composicaoDisplay, setComposicaoDisplay] = useState<ComposicaoDisplayItem[]>([]);
  
  // Controle de Versões
  const [historicoVersoes, setHistoricoVersoes] = useState<ReceitaVersao[]>([]);
  const [versaoSelecionadaId, setVersaoSelecionadaId] = useState<string | null>(null); 
  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);
  const [motivoAprovacao, setMotivoAprovacao] = useState('');
  
  // Controle de Mudanças (Diff)
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  
  // Controle de UI
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoutTabela, setLayoutTabela] = useState<TabelaLayout>('VERTICAL');
  const [lupaLayout, setLupaLayout] = useState<LupaLayout>('VERTICAL');
 
  // === 1. CARREGAMENTO DE DADOS ===
  useEffect(() => {
    if (recipeId && activeClientId) {
      fetchDadosCompletos();
    }
  }, [recipeId, activeClientId]);

  // Efeito para verificar alterações sempre que os dados mudarem
  useEffect(() => {
    if (receitaAtual && historicoVersoes) {
        verificarSeTemAlteracoes();
    }
  }, [receitaAtual, historicoVersoes]);

  const fetchDadosCompletos = async () => {
    setLoading(true);
    try {
      const { data: recData, error: recError } = await supabase
        .from('receitas')
        .select('*, anvisa_categorias(*), composicao_receitas(*), tipos_receita(*)')
        .eq('id', recipeId)
        .eq('cliente_id', activeClientId)
        .single();

      if (recError) throw recError;
      setReceitaAtual(recData);
      setReceitaExibida(recData);

      const { data: verData } = await supabase
        .from('receitas_versoes')
        .select('*')
        .eq('receita_id', recipeId)
        .order('versao', { ascending: false });
      
      if (verData) setHistoricoVersoes(verData);

      await processarComposicao(recData.composicao_receitas);

      if (recData.composicao_receitas?.length > 0) {
          handleCalculateInitial(recipeId);
      }

    } catch (err: any) {
      setError('Erro ao carregar receita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === LÓGICA DE COMPARAÇÃO (DIFF) ===
  const verificarSeTemAlteracoes = () => {
    // Se não tem histórico, é a primeira vez, então tem alteração (criação)
    if (!historicoVersoes || historicoVersoes.length === 0) {
        setTemAlteracoesPendentes(true);
        return;
    }

    const ultima = historicoVersoes[0]; // Última aprovada (v10, por exemplo)
    const atual = receitaAtual;

    let mudou = false;

    // 1. Comparação de Campos Básicos (Strings/Numbers)
    if (atual.nome !== ultima.nome_snapshot) mudou = true;
    if ((atual.modo_preparo || '') !== (ultima.modo_preparo_snapshot || '')) mudou = true;
    if (Number(atual.rendimento_total_g) !== Number(ultima.rendimento_snapshot)) mudou = true;

    // 2. Comparação de Porção e Medidas (Extraindo do JSON da tabela antiga)
    // Precisamos ver se a porção mudou, pois isso afeta o rótulo mesmo se ingredientes forem iguais
    if (ultima.tabela_nutricional_snapshot && ultima.tabela_nutricional_snapshot.infoPorcao) {
        const infoAntiga = ultima.tabela_nutricional_snapshot.infoPorcao;
        if (Math.abs(Number(atual.porcao_final_g_ml) - Number(infoAntiga.porcao_g_ml)) > 0.1) mudou = true;
        if ((atual.medida_caseira_nome || '') !== (infoAntiga.medida_caseira_nome || '')) mudou = true;
    }

    // 3. Comparação Profunda de Composição (Ingredientes)
    if (!mudou) {
        // Normaliza Atual
        const itensAtual = (atual.composicao_receitas || []).map((i: any) => ({
            id: i.item_id,
            qtd: Number(i.peso_liquido_g),
            tipo: i.item_type
        })).sort((a: any, b: any) => a.id.localeCompare(b.id));

        // Normaliza Snapshot (JSONB)
        const itensSnapshot = (ultima.composicao_snapshot || []).map((i: any) => ({
            id: i.item_id,
            qtd: Number(i.quantidade), // Note que o campo no snapshot chama 'quantidade'
            tipo: i.tipo
        })).sort((a: any, b: any) => a.id.localeCompare(b.id));

        if (itensAtual.length !== itensSnapshot.length) {
            mudou = true;
        } else {
            for (let i = 0; i < itensAtual.length; i++) {
                if (itensAtual[i].id !== itensSnapshot[i].id) { mudou = true; break; }
                if (Math.abs(itensAtual[i].qtd - itensSnapshot[i].qtd) > 0.01) { mudou = true; break; } // Tolerância 0.01g
                // if (itensAtual[i].tipo !== itensSnapshot[i].tipo) { mudou = true; break; }
            }
        }
    }

    setTemAlteracoesPendentes(mudou);
  };

  const processarComposicao = async (composicao: any[]) => {
    if (!composicao || composicao.length === 0) {
        setComposicaoDisplay([]);
        return;
    }

    const ingredienteIds = composicao.filter((c: any) => c.item_type === 'ingrediente').map((c: any) => c.item_id);
    const receitaIds = composicao.filter((c: any) => c.item_type === 'receita').map((c: any) => c.item_id);
    
    const [ingData, recData] = await Promise.all([
      ingredienteIds.length > 0 ? supabase.from('ingredientes').select('id, nome, peso_unitario_g, tipo_ingrediente, funcao_aditivo, ins_code').in('id', ingredienteIds) : Promise.resolve({ data: [] }),
      receitaIds.length > 0 ? supabase.from('receitas').select('id, nome').in('id', receitaIds) : Promise.resolve({ data: [] })
    ]);
    
    const infoMap = new Map();
    ingData.data?.forEach((item: any) => infoMap.set(item.id, item));
    recData.data?.forEach((item: any) => infoMap.set(item.id, { nome: item.nome, tipo_ingrediente: 'RECEITA' }));
    
    const listaMapeada = composicao.map((item: any) => {
      const nomeItem = item.nome_snapshot || infoMap.get(item.item_id)?.nome || 'Item desconhecido';
      const info = infoMap.get(item.item_id) || {};
      
      return { 
        id: item.id || item.item_id, 
        nome: nomeItem,
        peso_liquido_g: item.peso_liquido_g || item.quantidade,
        tipo: item.item_type || 'ingrediente',
        peso_unitario_g: info.peso_unitario_g,
        tipo_ingrediente: info.tipo_ingrediente,
        funcao_aditivo: info.funcao_aditivo,
        ins_code: info.ins_code
      };
    });

    const normais = listaMapeada.filter((i: any) => i.tipo_ingrediente !== 'ADITIVO').sort((a: any, b: any) => b.peso_liquido_g - a.peso_liquido_g);
    const aditivos = listaMapeada.filter((i: any) => i.tipo_ingrediente === 'ADITIVO').sort((a: any, b: any) => a.nome.localeCompare(b.nome));

    setComposicaoDisplay([...normais, ...aditivos]);
  };

  const handleSelecionarVersao = (valor: string) => {
      if (valor === 'ATUAL') {
          setVersaoSelecionadaId(null);
          setReceitaExibida(receitaAtual);
          processarComposicao(receitaAtual.composicao_receitas);
          handleCalculateInitial(receitaAtual.id);
      } else {
          setVersaoSelecionadaId(valor);
          const versao = historicoVersoes.find(v => v.id === valor);
          if (versao) {
              const receitaSnapshot = {
                  ...receitaAtual,
                  nome: versao.nome_snapshot,
                  modo_preparo: versao.modo_preparo_snapshot,
                  rendimento_total_g: versao.rendimento_snapshot,
                  status: 'HISTORICO',
                  data_aprovacao: versao.data_aprovacao
              };
              setReceitaExibida(receitaSnapshot);
              
              if (versao.composicao_snapshot) processarComposicao(versao.composicao_snapshot);
              if (versao.tabela_nutricional_snapshot) setTabela(versao.tabela_nutricional_snapshot);
          }
      }
  };

  const handleAprovarVersao = async () => {
    if (!motivoAprovacao) return alert("Justifique a aprovação.");
    setApproving(true);
    try {
        const { data, error } = await supabase.functions.invoke('aprovar-receita', {
            body: { receita_id: recipeId, motivo_aprovacao: motivoAprovacao }
        });
        if (error || (data && data.error)) throw new Error(data?.error || error?.message);

        alert("Versão aprovada e congelada!");
        setModalAprovacaoOpen(false);
        setMotivoAprovacao('');
        fetchDadosCompletos();
    } catch (err: any) {
        alert("Erro ao aprovar: " + err.message);
    } finally {
        setApproving(false);
    }
  };

  const handleCalculateInitial = async (id: string) => {
      try {
        const { data } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: id } });
        if (data && !data.error) setTabela(data as ResultadoCalculo);
      } catch (e) { console.error("Auto-calc failed", e); }
  };

  const handleCalculate = async () => {
    setCalculating(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: recipeId } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      setTabela(data as ResultadoCalculo);
    } catch (err: any) { setError(err.message); } finally { setCalculating(false); }
  };

  const handleDownloadJPEG = () => {
    if (!tabelaRef.current) return;
    html2canvas(tabelaRef.current, { scale: 3, backgroundColor: '#FFFFFF', useCORS: true }).then(canvas => {
      const link = document.createElement('a'); link.href = canvas.toDataURL('image/jpeg', 0.9); link.download = `${receitaExibida?.nome || 'rotulo'}-v${versaoSelecionadaId ? 'hist' : 'atual'}.jpg`; link.click();
    });
  };

  const getVersaoSelecionadaDetalhes = () => {
     if (!versaoSelecionadaId) return null;
     return historicoVersoes.find(v => v.id === versaoSelecionadaId);
  };
  const versaoDetalhes = getVersaoSelecionadaDetalhes();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!receitaAtual) return <Container><Alert severity="error">Receita não encontrada.</Alert></Container>;

  const isHistorico = versaoSelecionadaId !== null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/receitas')} variant="outlined" color="inherit">Voltar</Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>{receitaExibida.nome}</Typography>
                {isHistorico && <Chip icon={<HistoryIcon />} label="VERSÃO HISTÓRICA" color="warning" />}
            </Box>
            
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip label={`Rendimento: ${receitaExibida.rendimento_total_g}g`} size="small" variant="outlined" />
              {receitaExibida.status === 'APROVADA' && !isHistorico && <Chip icon={<VerifiedIcon />} label="Aprovada (Vigente)" color="success" size="small" />}
              {receitaExibida.status === 'RASCUNHO' && !isHistorico && <Chip icon={<EditIcon />} label="Rascunho (Em Edição)" color="default" size="small" />}
            </Stack>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
            {!isHistorico && (
                <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir</Button>
                    
                    {/* BOTÃO INTELIGENTE COM LÓGICA DE BLOQUEIO */}
                    <Tooltip title={!temAlteracoesPendentes ? "Nenhuma alteração detectada desde a última aprovação." : "Aprovar nova versão para auditoria."}>
                      <span>
                        <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<FileCheck />} 
                            onClick={() => setModalAprovacaoOpen(true)}
                            disabled={!temAlteracoesPendentes} 
                            sx={{ boxShadow: 2 }}
                        >
                            Aprovar Versão
                        </Button>
                      </span>
                    </Tooltip>

                    <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => router.push(`/receitas/criar?id=${receitaAtual.id}`)}>
                        Editar
                    </Button>
                </>
            )}
            {isHistorico && (
                <Button variant="contained" color="inherit" startIcon={<RestoreIcon />} onClick={() => handleSelecionarVersao('ATUAL')}>
                    Voltar para Versão Atual
                </Button>
            )}
        </Box>
      </Box>
      
      {isHistorico && (
          <Alert severity="warning" variant="filled" sx={{ mb: 3, alignItems: 'center' }} icon={<LockIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">MODO DE AUDITORIA: VISUALIZANDO SNAPSHOT</Typography>
              Versão congelada em {new Date(receitaExibida.data_aprovacao).toLocaleDateString()}.
          </Alert>
      )}

      {!isHistorico && !temAlteracoesPendentes && historicoVersoes.length > 0 && (
          <Alert severity="success" variant="outlined" sx={{ mb: 3 }} icon={<CheckCircle />}>
              <b>Tudo em dia!</b> Esta receita está idêntica à última versão aprovada (v{historicoVersoes[0].versao}). Nenhuma ação de conformidade é necessária.
          </Alert>
      )}

      <Grid container spacing={4}>
        
        {/* COLUNA ESQUERDA: HISTÓRICO + DADOS */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
             
             {/* Menu Suspenso de Versões */}
             <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon color="action" />
                    <Typography variant="subtitle2" fontWeight="bold">Controle de Versão</Typography>
                </Box>

                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Selecione a Versão"
                    value={versaoSelecionadaId || 'ATUAL'}
                    onChange={(e) => handleSelecionarVersao(e.target.value)}
                >
                    <MenuItem value="ATUAL">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">Versão Atual (Trabalho)</Typography>
                            {receitaAtual.status === 'RASCUNHO' && <Chip label="Rascunho" size="small" sx={{ height: 20 }} />}
                        </Box>
                    </MenuItem>
                    
                    {historicoVersoes.length > 0 && <Divider />}
                    
                    {historicoVersoes.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                            <Box>
                                <Typography variant="body2">Versão {v.versao} - {new Date(v.data_aprovacao).toLocaleDateString()}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </TextField>

                {versaoDetalhes && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fffde7', border: '1px solid #fff9c4', borderRadius: 1 }}>
                         <Typography variant="caption" fontWeight="bold" display="block" gutterBottom color="warning.dark">
                             DETALHES DO SNAPSHOT:
                         </Typography>
                         <Typography variant="caption" display="block"><b>Data:</b> {new Date(versaoDetalhes.data_aprovacao).toLocaleString()}</Typography>
                         <Typography variant="caption" display="block"><b>Motivo:</b> {versaoDetalhes.motivo_alteracao}</Typography>
                    </Box>
                )}
             </Paper>

            {/* MODO DE PREPARO */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                  <ChefHat color={theme.palette.primary.main} size={20} /> Modo de Preparo
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', textAlign: 'justify', lineHeight: 1.6 }}>
                  {receitaExibida.modo_preparo || "Nenhum modo de preparo cadastrado."}
              </Typography>
            </Paper>
            
            {/* COMPOSIÇÃO */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                  <Scale color={theme.palette.primary.main} size={20} /> Composição {isHistorico && '(Snapshot)'}
              </Typography>
              <List dense sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                {composicaoDisplay.map(item => (
                  <ListItem key={item.id} divider>
                    <ListItemText 
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                          {item.tipo_ingrediente === 'ADITIVO' && (
                               <Chip label={item.funcao_aditivo || 'Aditivo'} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      } 
                      secondary={`${item.peso_liquido_g}g`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Stack>
        </Grid>

        {/* COLUNA DIREITA: ROTULAGEM */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, bgcolor: '#fff', border: '1px solid #ddd', minHeight: '80vh' }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScanEye color={isHistorico ? theme.palette.warning.main : theme.palette.success.main} /> 
                  {isHistorico ? 'Tabela Nutricional (Arquivo Morto)' : 'Rotulagem IN 75 (Ao Vivo)'}
              </Typography>
              {isHistorico && <Chip label="Visualização Apenas" color="default" size="small" />}
            </Box>

            {!tabela && !isHistorico && (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', border: '2px dashed #eee', borderRadius: 2 }}>
                    <LoadingButton onClick={handleCalculate} loading={calculating} startIcon={<CalculateIcon />} variant="contained" size="large">
                        Gerar Rótulo Nutricional
                    </LoadingButton>
                </Box>
            )}

            {tabela && (
              <Box sx={{ mt: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), '@media print': { display: 'none' } }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Formato da Tabela</InputLabel>
                        <Select value={layoutTabela} label="Formato da Tabela" onChange={(e) => setLayoutTabela(e.target.value as TabelaLayout)}>
                          <MenuItem value="VERTICAL">Vertical</MenuItem>
                          <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                          <MenuItem value="LINEAR">Linear</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Layout da Lupa</InputLabel>
                        <Select value={lupaLayout} label="Layout da Lupa" onChange={(e) => setLupaLayout(e.target.value as LupaLayout)}>
                          <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                          <MenuItem value="VERTICAL">Vertical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button fullWidth variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadJPEG}>
                            Baixar JPG
                        </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <Box 
                    sx={{ 
                        bgcolor: 'white', p: 4, border: '1px solid #ccc', borderRadius: 1, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        opacity: isHistorico ? 0.9 : 1,
                        position: 'relative'
                    }} 
                    ref={tabelaRef}
                >
                  {isHistorico && (
                      <Box sx={{ position: 'absolute', top: 10, right: 10, border: '2px solid red', color: 'red', p: 1, transform: 'rotate(15deg)', fontWeight: 'bold', fontSize: '1.2rem', opacity: 0.3 }}>
                          CÓPIA CONTROLADA
                      </Box>
                  )}
                  <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <LupaFrontalANVISA lupas={tabela.lupas} areaPainelCm2={receitaExibida.area_painel_principal_cm2} layout={lupaLayout} />
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <NutritionalLabel tabela={tabela} modelo={layoutTabela} />
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={modalAprovacaoOpen} onClose={() => setModalAprovacaoOpen(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedIcon color="success" /> Aprovar e Congelar Versão
          </DialogTitle>
          <DialogContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                  Esta ação irá gerar uma <b>Versão Imutável</b> (Snapshot) desta receita.
                  Isso é obrigatório para garantir a rastreabilidade caso a fórmula mude no futuro.
              </Alert>
              <TextField
                  autoFocus
                  margin="dense"
                  label="Motivo da Aprovação / Alteração"
                  fullWidth
                  variant="outlined"
                  placeholder="Ex: Mudança de marca de farinha; Lançamento do produto..."
                  value={motivoAprovacao}
                  onChange={(e) => setMotivoAprovacao(e.target.value)}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setModalAprovacaoOpen(false)} color="inherit">Cancelar</Button>
              <LoadingButton onClick={handleAprovarVersao} loading={approving} variant="contained" color="success">
                  Confirmar Aprovação
              </LoadingButton>
          </DialogActions>
      </Dialog>

    </Container>
  );
}