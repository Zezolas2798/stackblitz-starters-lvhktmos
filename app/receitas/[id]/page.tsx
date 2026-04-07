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
  IconButton, Badge, Drawer, useTheme, alpha, Card, CardMedia,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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
  ChefHat, Scale, Settings, LayoutTemplate, FlaskConical, ScanEye, AlertTriangle, FileCheck, CheckCircle,
  Image as ImageIcon, BarChart3
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

import LoadingButton from '@mui/lab/LoadingButton';
import CalculateIcon from '@mui/icons-material/Calculate';

import { ResultadoCalculo, ReceitaVersao } from '@/lib/types';
import NutritionalLabel, { LupaFrontalANVISA, GMOIcon } from '@/components/NutritionalLabel';

// --- TIPOS ---
type TabelaLayout = 'VERTICAL' | 'VERTICAL_QUEBRADA' | 'HORIZONTAL' | 'HORIZONTAL_QUEBRADA' | 'LINEAR';
type LupaLayout = 'VERTICAL' | 'HORIZONTAL' | 'V1' | 'V2' | 'V3';

type ComposicaoDisplayItem = { 
  id: string; 
  nome: string; 
  peso_liquido_g: number; 
  fator_correcao: number;
  indice_coccao: number;
  tipo: 'ingrediente' | 'receita' | 'material'; 
  peso_unitario_g?: number | null;
  tipo_ingrediente?: string; 
  funcao_aditivo?: string | null;
  ins_code?: string | null;
  classificacao_nova?: number | null;
  preco_ultima_compra?: number;
  custo_medio?: number;
  unidade_medida?: string;
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
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [abaSubGrafico, setAbaSubGrafico] = useState(1); // 0: 100g, 1: Porção
 
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
      const { data: recData, error: recError } = await (supabase as any)
        .from('receitas')
        .select('*, anvisa_categorias(*), composicao_receitas(*), tipos_receita(*), modo_conservacao')
        .eq('id', recipeId)
        .eq('cliente_id', activeClientId!)
        .single();

      if (recError) throw recError;
      setReceitaAtual(recData);
      setReceitaExibida(recData);

      const { data: verData } = await (supabase as any)
        .from('receitas_versoes')
        .select('*')
        .eq('receita_id', recipeId)
        .order('versao', { ascending: false });
      
      if (verData) setHistoricoVersoes(verData);

      await processarComposicao(recData.composicao_receitas);

      if (recData.composicao_receitas?.length > 0) {
          handleCalculateInitial(recipeId, recData);
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
    const materialIds = composicao.filter((c: any) => c.item_type === 'material').map((c: any) => c.item_id);
    
    const [ingData, recData, matData] = await Promise.all([
      ingredienteIds.length > 0 ? supabase.from('ingredientes').select('id, nome, peso_unitario_g, tipo_ingrediente, funcao_aditivo, ins_code, classificacao_nova, preco_ultima_compra, custo_medio').in('id', ingredienteIds) : Promise.resolve({ data: [] }),
      receitaIds.length > 0 ? supabase.from('receitas').select('id, nome').in('id', receitaIds) : Promise.resolve({ data: [] }),
      materialIds.length > 0 ? supabase.from('materiais').select('id, nome, tipo_material, unidade_medida, custo_medio, preco_ultima_compra').in('id', materialIds) : Promise.resolve({ data: [] })
    ]);
    
    const infoMap = new Map();
    ingData.data?.forEach((item: any) => infoMap.set(item.id, item));
    recData.data?.forEach((item: any) => infoMap.set(item.id, { nome: item.nome, tipo_ingrediente: 'RECEITA' }));
    matData.data?.forEach((item: any) => infoMap.set(item.id, { ...item, tipo_ingrediente: 'MATERIAL' }));
    
    const listaMapeada = composicao.map((item: any) => {
      const nomeItem = item.nome_snapshot || infoMap.get(item.item_id)?.nome || 'Item desconhecido';
      const info = infoMap.get(item.item_id) || {};
      
      return { 
        id: item.id || item.item_id, 
        nome: nomeItem,
        peso_liquido_g: item.peso_liquido_g || item.quantidade,
        fator_correcao: Number(item.fator_correcao || 1),
        indice_coccao: Number(item.indice_coccao || 1),
        tipo: item.item_type || 'ingrediente',
        peso_unitario_g: info.peso_unitario_g,
        tipo_ingrediente: info.tipo_ingrediente,
        funcao_aditivo: info.funcao_aditivo,
        ins_code: info.ins_code,
        classificacao_nova: info.classificacao_nova ?? null,
        preco_ultima_compra: Number(info.preco_ultima_compra || 0),
        custo_medio: Number(info.custo_medio || 0),
        unidade_medida: info.unidade_medida || 'g'
      };
    });

    const normais = listaMapeada.filter((i: any) => i.tipo_ingrediente !== 'ADITIVO' && i.tipo !== 'material').sort((a: any, b: any) => b.peso_liquido_g - a.peso_liquido_g);
    const aditivos = listaMapeada.filter((i: any) => i.tipo_ingrediente === 'ADITIVO').sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    const materiais = listaMapeada.filter((i: any) => i.tipo === 'material').sort((a: any, b: any) => a.nome.localeCompare(b.nome));

    setComposicaoDisplay([...normais, ...aditivos, ...materiais]);
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
                  modo_conservacao: versao.modo_conservacao_snapshot,
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

  const handleCalculateInitial = async (id: string, recBase?: any) => {
      try {
        const { data } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: id } });
        if (data && !data.error) {
          const result = data as ResultadoCalculo;
          const conservacao = recBase?.modo_conservacao || receitaExibida?.modo_conservacao;
          if (conservacao) {
            result.declaracoes.modo_conservacao = conservacao;
          }
          setTabela(result);
        }
      } catch (e) { console.error("Auto-calc failed", e); }
  };

  const handleCalculate = async () => {
    setCalculating(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: recipeId } });
      if (error) throw error; if (data.error) throw new Error(data.error);
      const result = data as ResultadoCalculo;
      if (receitaExibida?.modo_conservacao) {
        result.declaracoes.modo_conservacao = receitaExibida.modo_conservacao;
      }
      setTabela(result);
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

  const custoTotalUltimo = composicaoDisplay.reduce((acc, item) => {
      if (item.tipo === 'ingrediente' && item.peso_unitario_g && item.preco_ultima_compra) {
          return acc + (item.peso_liquido_g / item.peso_unitario_g) * item.preco_ultima_compra;
      }
      if (item.tipo === 'material' && item.preco_ultima_compra) {
          // Para materiais, peso_liquido_g age como a "quantidade" em 'unidades', 'pct', etc.
          return acc + (item.peso_liquido_g * item.preco_ultima_compra);
      }
      return acc;
  }, 0);

  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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
              {custoTotalUltimo > 0 && (
                <Tooltip title="Custo dos ingredientes baseado na última compra">
                  <Chip 
                    label={`Custo Receita: ${formatoMoeda.format(custoTotalUltimo)}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Tooltip>
              )}
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

      <Stack spacing={4}>
        
        {/* 1. FOTO DA RECEITA (Estilo Estúdio) */}
        <Paper elevation={0} sx={{ 
            p: 0, 
            border: '1px solid #e0e0e0', 
            borderRadius: 2, 
            overflow: 'hidden', 
            height: 280,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#000'
        }}>
            {receitaExibida.foto_url ? (
                <>
                    {/* Fundo Desfocado (Blur) */}
                    <Box sx={{ 
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${receitaExibida.foto_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px) brightness(0.6)',
                        transform: 'scale(1.1)', // Evita vazamento de bordas do blur
                        opacity: 0.8
                    }} />
                    
                    {/* Foto Focal (Contain) */}
                    <CardMedia
                        component="img"
                        image={receitaExibida.foto_url}
                        alt={receitaExibida.nome}
                        sx={{ 
                            position: 'relative',
                            zIndex: 2,
                            maxHeight: '100%',
                            maxWidth: '100%',
                            width: 'auto',
                            objectFit: 'contain',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                    />
                </>
            ) : (
                <Box sx={{ 
                    height: '100%', 
                    width: '100%',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    bgcolor: '#f5f5f5',
                    color: 'text.secondary',
                    gap: 1
                }}>
                    <ImageIcon size={48} strokeWidth={1} />
                    <Typography variant="body1">Nenhuma foto cadastrada.</Typography>
                </Box>
            )}
        </Paper>

        {/* 2. COMPOSIÇÃO (Lista Compacta) */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
                <Scale size={24} /> Composição {isHistorico && '(Snapshot)'}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense disablePadding>
                {composicaoDisplay.map(item => (
                    <ListItem key={item.id} divider sx={{ px: 1 }}>
                        <ListItemText
                            primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                    {item.tipo_ingrediente === 'ADITIVO' && (
                                        <Chip label={item.funcao_aditivo || 'Aditivo'} size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                                    )}
                                </Box>
                            }
                            secondary={
                                item.tipo === 'ingrediente' && item.preco_ultima_compra ? (
                                    <Typography variant="caption" color="text.secondary">
                                        Custo Base: {formatoMoeda.format(item.preco_ultima_compra)} por {item.peso_unitario_g || 1000}g
                                    </Typography>
                                ) : null
                            }
                        />
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight={600} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                                    {item.peso_liquido_g}{item.tipo === 'material' ? item.unidade_medida : 'g'}
                                </Typography>
                                {item.tipo !== 'material' && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        FC: {item.fator_correcao.toFixed(2)} | IC: {item.indice_coccao.toFixed(2)}
                                    </Typography>
                                )}
                                {/* Custo Insumo */}
                                {item.tipo === 'ingrediente' && item.preco_ultima_compra && item.peso_unitario_g ? (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatoMoeda.format((item.peso_liquido_g / item.peso_unitario_g) * item.preco_ultima_compra)}
                                    </Typography>
                                ) : null}
                                {/* Custo Material */}
                                {item.tipo === 'material' && item.preco_ultima_compra ? (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatoMoeda.format(item.peso_liquido_g * item.preco_ultima_compra)}
                                    </Typography>
                                ) : null}
                            </Box>
                    </ListItem>
                ))}
            </List>
        </Paper>

        {/* 3. MODO DE PREPARO */}
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
                <ChefHat size={24} /> Modo de Preparo
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', textAlign: 'justify', lineHeight: 1.8 }}>
                {receitaExibida.modo_preparo || "Nenhum modo de preparo cadastrado."}
            </Typography>
        </Paper>

        {/* 4. CONTROLE DE VERSÃO */}
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="primary.main">Controle de Versão</Typography>
            </Box>
            
            <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                    <TextField
                        select
                        fullWidth
                        size="medium"
                        label="Versão em Visualização"
                        value={versaoSelecionadaId || 'ATUAL'}
                        onChange={(e) => handleSelecionarVersao(e.target.value)}
                    >
                        <MenuItem value="ATUAL">
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="bold">Versão Atual (Trabalho)</Typography>
                                {receitaAtual.status === 'RASCUNHO' && <Chip label="Rascunho" size="small" />}
                            </Box>
                        </MenuItem>
                        
                        {historicoVersoes.length > 0 && <Divider />}
                        
                        {historicoVersoes.map((v) => (
                            <MenuItem key={v.id} value={v.id}>
                                <Typography variant="body1">Versão {v.versao} - {new Date(v.data_aprovacao).toLocaleDateString()}</Typography>
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {versaoDetalhes && (
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`, borderRadius: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.dark">
                                DETALHES DO SNAPSHOT:
                            </Typography>
                            <Typography variant="body2" display="block"><b>Data:</b> {new Date(versaoDetalhes.data_aprovacao).toLocaleString()}</Typography>
                            <Typography variant="body2" display="block"><b>Motivo:</b> {versaoDetalhes.motivo_alteracao}</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Paper>

        {/* 5. ROTULAGEM & GRÁFICOS (TABS) */}
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
            <Tabs 
              value={abaAtiva} 
              onChange={(_, v) => setAbaAtiva(v)} 
              variant="fullWidth"
              sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: alpha(theme.palette.primary.main, 0.03) }}
            >
              <Tab icon={<ScanEye size={18} />} iconPosition="start" label={isHistorico ? 'Rótulo (Snapshot)' : 'Rotulagem IN 75'} />
              <Tab icon={<BarChart3 size={18} />} iconPosition="start" label="Gráficos Nutricionais" />
            </Tabs>

            <Box sx={{ p: 4 }}>

            {/* === ABA 0: RÓTULO === */}
            {abaAtiva === 0 && (
              <Box>
                {isHistorico && <Chip label="Arquivo Morto" color="warning" variant="outlined" sx={{ mb: 2 }} />}

                {!tabela && !isHistorico && (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', border: '2px dashed #eee', borderRadius: 2 }}>
                        <LoadingButton onClick={handleCalculate} loading={calculating} startIcon={<CalculateIcon />} variant="contained" size="large">
                            Gerar Rótulo Nutricional
                        </LoadingButton>
                    </Box>
                )}

                {tabela && (
                  <Box>
                    <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02), '@media print': { display: 'none' } }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>Formato da Tabela</InputLabel>
                            <Select value={layoutTabela} label="Formato da Tabela" onChange={(e) => setLayoutTabela(e.target.value as TabelaLayout)}>
                              <MenuItem value="VERTICAL">Vertical</MenuItem>
                              <MenuItem value="VERTICAL_QUEBRADA">Vertical Quebrada</MenuItem>
                              <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                              <MenuItem value="HORIZONTAL_QUEBRADA">Horizontal Quebrada</MenuItem>
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
                              <MenuItem value="V1">Misto V1</MenuItem>
                              <MenuItem value="V2">Misto V2</MenuItem>
                              <MenuItem value="V3">Misto V3</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button fullWidth variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadJPEG}>
                                Baixar Rótulo
                            </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Box 
                        sx={{ 
                            bgcolor: '#fff', p: 4, border: '1px solid #eee', borderRadius: 2, 
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            opacity: isHistorico ? 0.9 : 1,
                            position: 'relative',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }} 
                        ref={tabelaRef}
                    >
                      {isHistorico && (
                          <Box sx={{ position: 'absolute', top: 20, right: 20, border: '2px solid red', color: 'red', p: 1, transform: 'rotate(15deg)', fontWeight: 'bold', fontSize: '1.5rem', opacity: 0.2, zIndex: 10 }}>
                              CÓPIA CONTROLADA
                          </Box>
                      )}
                      <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                          {tabela.declaracoes?.alerta_gmo && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                               <GMOIcon width={50} />
                            </Box>
                          )}
                          <LupaFrontalANVISA lupas={tabela.lupas} areaPainelCm2={receitaExibida.area_painel_principal_cm2} layout={lupaLayout} />
                      </Box>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <NutritionalLabel tabela={tabela} modelo={layoutTabela} />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* === ABA 1: GRÁFICOS === */}
            {abaAtiva === 1 && (
              <Box>
                {!tabela ? (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', border: '2px dashed #eee', borderRadius: 2 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>Gere o rótulo nutricional primeiro para visualizar os gráficos.</Typography>
                        {!isHistorico && (
                          <LoadingButton onClick={handleCalculate} loading={calculating} startIcon={<CalculateIcon />} variant="contained" size="large" sx={{ mt: 2 }}>
                              Gerar Rótulo Nutricional
                          </LoadingButton>
                        )}
                    </Box>
                ) : (() => {
                    const sourceData = abaSubGrafico === 0 ? tabela.por100g : tabela.porPorcao;
                    const carbVal = parseFloat(sourceData?.carboidrato_g || '0');
                    const protVal = parseFloat(sourceData?.proteina_g || '0');
                    const lipVal = parseFloat(sourceData?.lipideos_g || '0');
                    
                    const macroData = [
                      { name: 'Carboidratos', value: carbVal, color: '#4FC3F7' },
                      { name: 'Proteínas', value: protVal, color: '#81C784' },
                      { name: 'Lipídeos', value: lipVal, color: '#FFB74D' },
                    ].filter(d => d.value > 0);

                    const NUTRIENT_LABELS: Record<string, string> = {
                      energia_kcal: 'Energia',
                      carboidrato_g: 'Carboidratos',
                      acucar_total_g: 'Açúcares Totais',
                      acucar_adicionado_g: 'Açúc. Adicionados',
                      proteina_g: 'Proteínas',
                      lipideos_g: 'Gorduras Totais',
                      gordura_saturada_g: 'Gord. Saturadas',
                      gordura_trans_g: 'Gord. Trans',
                      fibra_alimentar_g: 'Fibra Alimentar',
                      sodio_mg: 'Sódio',
                    };
                    
                    const vdSource = abaSubGrafico === 0 ? (tabela.percentualVD100g || {}) : (tabela.percentualVD || {});
                    const vdData = Object.entries(vdSource)
                      .filter(([key]) => NUTRIENT_LABELS[key])
                      .map(([key, val]) => ({
                        nutriente: NUTRIENT_LABELS[key] || key,
                        vd: parseFloat(val || '0'),
                      }))
                      .filter(d => d.vd > 0)
                      .sort((a, b) => b.vd - a.vd);

                    return (
                      <Stack spacing={4}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                          <Tabs 
                            value={abaSubGrafico} 
                            onChange={(_, v) => setAbaSubGrafico(v)}
                            indicatorColor="primary"
                            textColor="primary"
                            centered
                          >
                            <Tab label="Dados p/ 100g" />
                            <Tab label={`Dados p/ Porção (${tabela.infoPorcao?.porcao_g_ml}${receitaExibida?.estado_alimento === 'liquido' ? 'ml' : 'g'})`} />
                          </Tabs>
                        </Box>

                        {/* MACROS: TABELA + PIZZA */}
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          Divisão de Macronutrientes ({abaSubGrafico === 0 ? '100g' : 'Porção'})
                        </Typography>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={7}>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Macro</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Gramas</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Kcal</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>% Kcal</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>%VD</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(() => {
                                    const totalKcal = carbVal * 4 + protVal * 4 + lipVal * 9;
                                    const macroVdKeys: Record<string, string> = {
                                      'Carboidratos': 'carboidrato_g',
                                      'Proteínas': 'proteina_g',
                                      'Lipídeos': 'lipideos_g',
                                    };
                                    return [
                                      { nome: 'Carboidratos', g: carbVal, kcal: carbVal * 4, color: '#4FC3F7' },
                                      { nome: 'Proteínas', g: protVal, kcal: protVal * 4, color: '#81C784' },
                                      { nome: 'Lipídeos', g: lipVal, kcal: lipVal * 9, color: '#FFB74D' },
                                    ].map(row => {
                                      const vdKey = macroVdKeys[row.nome];
                                      const vdVal = vdSource[vdKey];
                                      return (
                                        <TableRow key={row.nome}>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.color }} />
                                              {row.nome}
                                            </Box>
                                          </TableCell>
                                          <TableCell align="right">{row.g.toFixed(1)}g</TableCell>
                                          <TableCell align="right">{row.kcal.toFixed(0)}</TableCell>
                                          <TableCell align="right">{totalKcal > 0 ? ((row.kcal / totalKcal) * 100).toFixed(0) : 0}%</TableCell>
                                          <TableCell align="right">{vdVal ? `${vdVal}%` : '-'}</TableCell>
                                        </TableRow>
                                      );
                                    });
                                  })()}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                          <Grid item xs={12} md={5}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <ResponsiveContainer width="100%" height={260}>
                                <PieChart title="Macros">
                                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ percent }: any) => percent ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                                    {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                  </Pie>
                                  <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}g` : value} />
                                  <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                              </ResponsiveContainer>
                            </Box>
                          </Grid>
                        </Grid>

                        <Divider />

                        {/* BARRAS: %VD */}
                        <Typography variant="h6" fontWeight="bold" color="primary.main">Nutrientes vs. Valor Diário (%VD)</Typography>
                        {vdData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={Math.max(300, vdData.length * 45)}>
                            <BarChart data={vdData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" domain={[0, (max: number) => Math.max(max + 10, 100)]} tickFormatter={(v) => `${v}%`} />
                              <YAxis type="category" dataKey="nutriente" width={130} tick={{ fontSize: 12 }} />
                              <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
                              <Bar dataKey="vd" name="% VD" radius={[0, 6, 6, 0]} barSize={20}>
                                {vdData.map((entry, i) => (
                                  <Cell key={i} fill={entry.vd > 100 ? '#EF5350' : entry.vd > 50 ? '#FFA726' : '#66BB6A'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Nenhum dado de %VD disponível.</Typography>
                        )}
                      </Stack>
                    );
                })()}

                {/* === CLASSIFICAÇÃO NOVA === */}
                {composicaoDisplay.length > 0 && (() => {
                  const NOVA_LABELS: Record<number, string> = {
                    1: 'In Natura / Min. Processado',
                    2: 'Ingred. Culinário Processado',
                    3: 'Alimento Processado',
                    4: 'Ultraprocessado',
                  };
                  const NOVA_COLORS: Record<number, string> = {
                    1: '#4CAF50',
                    2: '#2196F3',
                    3: '#FF9800',
                    4: '#F44336',
                  };

                  const pesoTotal = composicaoDisplay.reduce((s, i) => s + (i.peso_liquido_g || 0), 0);
                  const grupoMap: Record<number, number> = {};
                  let pesoNaoClassificado = 0;

                  composicaoDisplay.forEach(item => {
                    const g = item.classificacao_nova;
                    if (g && g >= 1 && g <= 4) {
                      grupoMap[g] = (grupoMap[g] || 0) + (item.peso_liquido_g || 0);
                    } else {
                      pesoNaoClassificado += (item.peso_liquido_g || 0);
                    }
                  });

                  const novaData = Object.entries(grupoMap).map(([g, peso]) => ({
                    name: NOVA_LABELS[Number(g)],
                    value: peso,
                    pct: pesoTotal > 0 ? (peso / pesoTotal) * 100 : 0,
                    color: NOVA_COLORS[Number(g)],
                    grupo: Number(g),
                  })).sort((a, b) => a.grupo - b.grupo);

                  if (pesoNaoClassificado > 0) {
                    novaData.push({
                      name: 'Não classificado',
                      value: pesoNaoClassificado,
                      pct: pesoTotal > 0 ? (pesoNaoClassificado / pesoTotal) * 100 : 0,
                      color: '#BDBDBD',
                      grupo: 0,
                    });
                  }

                  const pctUltra = grupoMap[4] ? ((grupoMap[4] / pesoTotal) * 100) : 0;

                  return (
                    <Box sx={{ mt: 4 }}>
                      <Divider sx={{ mb: 4 }} />
                      <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                        Classificação NOVA (Grau de Processamento)
                      </Typography>

                      {pctUltra > 0 && (
                        <Alert severity="warning" sx={{ mb: 3 }} icon={<AlertTriangle size={20} />}>
                          <strong>{pctUltra.toFixed(1)}%</strong> do peso desta receita é composto por ingredientes <strong>ultraprocessados</strong> (Grupo 4 NOVA).
                        </Alert>
                      )}

                      {novaData.length === 0 ? (
                        <Alert severity="info">Nenhum ingrediente desta receita possui classificação NOVA cadastrada.</Alert>
                      ) : (
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={5}>
                            <ResponsiveContainer width="100%" height={280}>
                              <PieChart>
                                <Pie
                                  data={novaData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={90}
                                  paddingAngle={3}
                                  dataKey="value"
                                  label={({ pct }: any) => pct > 0 ? `${pct.toFixed(0)}%` : ''}
                                  labelLine={false}
                                >
                                  {novaData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} stroke={entry.grupo === 4 ? '#B71C1C' : undefined} strokeWidth={entry.grupo === 4 ? 2 : 0} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any, name: any) => [`${typeof value === 'number' ? value.toFixed(1) : value}g`, name]} />
                                <Legend verticalAlign="bottom" height={50} />
                              </PieChart>
                            </ResponsiveContainer>
                          </Grid>
                          <Grid item xs={12} md={7}>
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Grupo NOVA</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Peso (g)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>% Receita</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {novaData.map(row => (
                                    <TableRow key={row.grupo} sx={row.grupo === 4 ? { bgcolor: alpha('#F44336', 0.05) } : {}}>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                                          <Typography variant="body2" fontWeight={row.grupo === 4 ? 700 : 400}>
                                            {row.grupo > 0 ? `G${row.grupo}` : ''} {row.name}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell align="right">{row.value.toFixed(1)}g</TableCell>
                                      <TableCell align="right">
                                        <Typography fontWeight={row.grupo === 4 ? 800 : 400} color={row.grupo === 4 ? 'error.main' : 'text.primary'}>
                                          {row.pct.toFixed(1)}%
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            )}

            </Box>
        </Paper>
      </Stack>

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