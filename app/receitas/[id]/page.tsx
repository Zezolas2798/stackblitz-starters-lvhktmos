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
import RotulagemTab from '@/components/receitas/RotulagemTab';
import GraficosNutricionaisTab from '@/components/receitas/GraficosNutricionaisTab';
import ReceitaHeader from '@/components/receitas/ReceitaHeader';
import ComposicaoDisplayList from '@/components/receitas/ComposicaoDisplayList';
import VersionControl from '@/components/receitas/VersionControl';
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
  referencia_id?: string | null;
  referencia_info?: { nome: string, fonte: string } | null;
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
  const [dadosCliente, setDadosCliente] = useState<any | null>(null);
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
        .select('*, anvisa_categorias(*), composicao_receitas(*), tipos_receita(*), modo_conservacao, denominacao_venda, conteudo_liquido, fabricado_em')
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

      // Buscar Dados do Cliente e Unidade para Rotulagem
      const { data: clienteData } = await (supabase as any)
        .from('clientes')
        .select('razao_social, cnpj_raiz, cliente_unidades(*)')
        .eq('id', activeClientId!)
        .single();
      
      if (clienteData) {
        // Pegar a primeira unidade ativa ou qualquer unidade disponível
        const unidade = clienteData.cliente_unidades?.[0];
        setDadosCliente({
          razao_social: clienteData.razao_social,
          cnpj: unidade?.cnpj_completo || clienteData.cnpj_raiz,
          endereco: unidade?.endereco_completo || '',
          nacionalidade: 'Brasil' // Default conforme solicitado "nacionalidade da própria empresa"
        });
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
    
    const [ingData, recData, matData, refData] = await Promise.all([
      ingredienteIds.length > 0 ? supabase.from('ingredientes').select('id, nome, peso_unitario_g, tipo_ingrediente, funcao_aditivo, ins_code, classificacao_nova, preco_ultima_compra, custo_medio').in('id', ingredienteIds) : Promise.resolve({ data: [] }),
      receitaIds.length > 0 ? supabase.from('receitas').select('id, nome').in('id', receitaIds) : Promise.resolve({ data: [] }),
      materialIds.length > 0 ? supabase.from('materiais').select('id, nome, tipo_material, unidade_medida, custo_medio, preco_ultima_compra').in('id', materialIds) : Promise.resolve({ data: [] }),
      supabase.from('referencias_nutricionais').select('id, nome, fonte')
    ]);
    
    const infoMap = new Map();
    const refMap = new Map();
    ingData.data?.forEach((item: any) => infoMap.set(item.id, item));
    recData.data?.forEach((item: any) => infoMap.set(item.id, { nome: item.nome, tipo_ingrediente: 'RECEITA' }));
    matData.data?.forEach((item: any) => infoMap.set(item.id, { ...item, tipo_ingrediente: 'MATERIAL' }));
    refData.data?.forEach((item: any) => refMap.set(item.id, { nome: item.nome, fonte: item.fonte }));
    
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
        unidade_medida: info.unidade_medida || 'g',
        referencia_id: item.referencia_id,
        referencia_info: item.referencia_id ? refMap.get(item.referencia_id) : null
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
          const rec = recBase || receitaExibida;
          
          // Injetar dados de conformidade do banco (garante sincronia)
          if (rec) {
            if (rec.modo_conservacao) result.declaracoes.modo_conservacao = rec.modo_conservacao;
            if (rec.instrucoes_preparo) result.declaracoes.instrucoes_preparo = rec.instrucoes_preparo;
            result.declaracoes.is_preparo = !!rec.is_preparo;
            if (rec.is_isento_nutricional !== undefined) result.declaracoes.isIsento = !!rec.is_isento_nutricional;
            if (rec.tipo_isencao) result.declaracoes.tipoIsencao = rec.tipo_isencao;
            if (rec.denominacao_venda) result.declaracoes.denominacao_venda = rec.denominacao_venda;
            if (rec.fabricado_em) result.declaracoes.fabricado_em = rec.fabricado_em;
            if (rec.conteudo_liquido) result.declaracoes.conteudo_liquido = rec.conteudo_liquido;
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
      
      // Injetar dados de conformidade do banco (garante sincronia)
      if (receitaExibida) {
        if (receitaExibida.modo_conservacao) result.declaracoes.modo_conservacao = receitaExibida.modo_conservacao;
        if (receitaExibida.instrucoes_preparo) result.declaracoes.instrucoes_preparo = receitaExibida.instrucoes_preparo;
        result.declaracoes.is_preparo = !!receitaExibida.is_preparo;
        if (receitaExibida.is_isento_nutricional !== undefined) result.declaracoes.isIsento = !!receitaExibida.is_isento_nutricional;
        if (receitaExibida.tipo_isencao) result.declaracoes.tipoIsencao = receitaExibida.tipo_isencao;
        if (receitaExibida.denominacao_venda) result.declaracoes.denominacao_venda = receitaExibida.denominacao_venda;
        if (receitaExibida.fabricado_em) result.declaracoes.fabricado_em = receitaExibida.fabricado_em;
        if (receitaExibida.conteudo_liquido) result.declaracoes.conteudo_liquido = receitaExibida.conteudo_liquido;
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
      
      <ReceitaHeader
        receitaAtual={receitaAtual}
        receitaExibida={receitaExibida}
        temAlteracoesPendentes={temAlteracoesPendentes}
        isHistorico={isHistorico}
        custoTotalUltimo={custoTotalUltimo}
        formatoMoeda={formatoMoeda}
        historicoVersoes={historicoVersoes}
        setModalAprovacaoOpen={setModalAprovacaoOpen}
        handleSelecionarVersao={handleSelecionarVersao}
      />

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
        <ComposicaoDisplayList
          composicaoDisplay={composicaoDisplay}
          isHistorico={isHistorico}
          formatoMoeda={formatoMoeda}
        />
        
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
        <VersionControl
          receitaAtual={receitaAtual}
          historicoVersoes={historicoVersoes}
          versaoSelecionadaId={versaoSelecionadaId}
          handleSelecionarVersao={handleSelecionarVersao}
          versaoDetalhes={versaoDetalhes}
        />
        
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
              <RotulagemTab
                isHistorico={isHistorico}
                tabela={tabela}
                receitaExibida={receitaExibida}
                calculating={calculating}
                handleCalculate={handleCalculate}
                layoutTabela={layoutTabela}
                setLayoutTabela={setLayoutTabela}
                lupaLayout={lupaLayout}
                setLupaLayout={setLupaLayout}
                tabelaRef={tabelaRef}
                handleDownloadJPEG={handleDownloadJPEG}
                versaoSelecionadaId={versaoSelecionadaId}
                dadosCliente={dadosCliente}
              />
            )}
            
{/* === ABA 1: GRÁFICOS === */}
            {abaAtiva === 1 && (
              <GraficosNutricionaisTab
                isHistorico={isHistorico}
                tabela={tabela}
                abaSubGrafico={abaSubGrafico}
                setAbaSubGrafico={setAbaSubGrafico}
                receitaExibida={receitaExibida}
                calculating={calculating}
                handleCalculate={handleCalculate}
                composicaoDisplay={composicaoDisplay}
              />
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