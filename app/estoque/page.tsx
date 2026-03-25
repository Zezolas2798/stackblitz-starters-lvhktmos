'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Box, Typography, Button, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, MenuItem, TextField,
  InputAdornment, Container, useTheme, alpha, Collapse,
  Tabs, Tab, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Alert, Tooltip
} from '@mui/material';

import Grid from '@mui/material/Grid';

import { 
  Package, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, 
  AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Info,
  Trash2, Edit, Save, Plus, MoveHorizontal, Truck, ScanLine, Tag, MapPin, ArrowRightLeft, History,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatarQuantidade } from '@/components/MovimentacaoEstoqueDialog';
import MovimentacaoEstoqueDialog from '@/components/MovimentacaoEstoqueDialog';
import MovimentacaoGeralDialog from '@/components/MovimentacaoGeralDialog';
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import MovimentoEtiquetaDialog from '@/components/etiquetas/MovimentoEtiquetaDialog';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

const STATUS_VALIDADE_OPTIONS = [
  { value: 'VENCIDO', label: '🔴 Vencidos (< 0 dias)' },
  { value: 'CRITICO', label: '🟠 Quase Vencendo (0 a 30 dias)' },
  { value: 'ALERTA', label: '🟡 Perto do Vencimento (31 a 89 dias)' },
  { value: 'OK', label: '🟢 Longe do Vencimento (90+ dias)' },
];

export default function EstoquePage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- TABS ---
  const [categoriaPrincipal, setCategoriaPrincipal] = useState<'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS'>('ALIMENTOS');
  const [activeTab, setActiveTab] = useState(0);
  // Remove subTabFisico as it's now top-level via categoriaPrincipal
  // const [subTabFisico, setSubTabFisico] = useState<'TODOS' | 'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO'>('TODOS');

  // --- FILTROS ESTOQUE ---
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroValidade, setFiltroValidade] = useState('');
  const [valStatusMensagem, setValStatusMensagem] = useState<any>(null); // Análise de risco validade
  const [userName, setUserName] = useState('');

  const [etiquetaModalData, setEtiquetaModalData] = useState<{
    open: boolean;
    lote: any;
    qtdMovedGml: number;
    opContext?: string;
  }>({ open: false, lote: null, qtdMovedGml: 0 });
  
  const [unidadeInfo, setUnidadeInfo] = useState<any>(null);
  
  // --- DESCARTES & USOS ---
  const [descartes, setDescartes] = useState<any[]>([]);
  const [descartesLoading, setDescartesLoading] = useState(false);
  const [usos, setUsos] = useState<any[]>([]);
  const [usosLoading, setUsosLoading] = useState(false);
  const [filtroDescDataInicio, setFiltroDescDataInicio] = useState('');
  const [filtroDescDataFim, setFiltroDescDataFim] = useState('');
  const [filtroDescBusca, setFiltroDescBusca] = useState('');
  const [filtroDescCategoria, setFiltroDescCategoria] = useState('');
  const [categoriasDescDisponiveis, setCategoriasDescDisponiveis] = useState<string[]>([]);
  
  // --- RESERVAS ---
  const [ordensComReservas, setOrdensComReservas] = useState<any[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  
  // Estados para Alocação de Lotes (Portado da Produção)
  const [reservaDialog, setReservaDialog] = useState<any>(null);
  const [lotesSugestao, setLotesSugestao] = useState<any[]>([]);
  const [salvandoReserva, setSalvandoReserva] = useState(false);

  // --- DROPDOWNS ESTOQUE ---
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<any[]>([]);
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);

  // --- MOVIMENTAÇÃO ---
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null);
  const [buscaGeralOpen, setBuscaGeralOpen] = useState(false);

  const handleOpenMovimentacao = (lote: any) => {
    setLoteSelecionado(lote);
    setMovimentacaoOpen(true);
  };

  const handleLoteSelecionadoDaBusca = (lote: any) => {
    setBuscaGeralOpen(false);
    handleOpenMovimentacao(lote);
  };

  useEffect(() => {
    if (activeClientId) {
      if (activeTab === 0) {
        loadEstoque();
      } else if (activeTab === 1) {
        loadMovimentacoes();
      } else if (activeTab === 2) {
        if (['ALIMENTOS', 'EMBALAGENS'].includes(categoriaPrincipal)) {
          loadReservas();
        } else {
          // If not ALIMENTOS/EMBALAGENS, tab 2 shows movimentacoes
          loadMovimentacoes();
        }
      }
      loadUnidadeInfo();
    }
  }, [activeClientId, activeTab, unidadeId, categoriaPrincipal]);

  async function loadUnidadeInfo() {
    if (!unidadeId) return;
    const { data } = await (supabase as any)
      .from('cliente_unidades')
      .select('*')
      .eq('id', unidadeId)
      .single();
    if (data) setUnidadeInfo(data);
  }

  async function loadEstoque() {
    setLoading(true);

    if (!unidadeId) {
      setLoading(false);
      return;
    }

    // Busca os lotes que estão no estoque físico (Não rejeitados e não previstos)
    const { data: lotesData, error } = await (supabase as any)
      .from('lotes_estoque')
      .select('*, ingredientes(nome, grupo_estoque_id, ingredientes_grupos(nome)), materiais(nome, tipo_material), fornecedores(razao_social, nome_fantasia, cnpj), cliente_locais_estoque(nome)')
      .eq('unidade_id', unidadeId)
      .gt('quantidade_atual_g_ml', 0)
      .neq('status', 'REJEITADO')
      .neq('status', 'PREVISTO')
      .is('deleted_at', null)
      .order('data_validade_rotulo', { ascending: true });

    // Busca as reservas ativas
    const { data: reservasData } = await (supabase as any)
      .from('producao_reservas_estoque')
      .select('estoque_lote_id, quantidade_reservada_g, producao_requisicoes(producao_ordens(codigo))')
      .eq('status', 'RESERVADO');

    // Busca todos os locais de estoque ativos da unidade para o filtro
    const { data: locaisData } = await (supabase as any).from('cliente_locais_estoque')
      .select('nome, categorias_permitidas')
      .eq('unidade_id', unidadeId)
      .eq('ativo', true);

    // Busca todas as categorias de produto do cliente para o filtro
    const { data: catsData } = await (supabase as any)
      .from('cliente_categorias_produto')
      .select('id, nome, modalidade')
      .eq('cliente_id', activeClientId!);

    if (lotesData) {
      const lotesComReserva = lotesData.map((lote: any) => {
        const reservas = (reservasData || []).filter((r: any) => r.estoque_lote_id === lote.id);
        const totalReservadoG = reservas.reduce((acc: number, r: any) => acc + (Number(r.quantidade_reservada_g) || 0), 0);
        return {
          ...lote,
          reservas,
          total_reservado_g: totalReservadoG
        };
      });

      setLotes(lotesComReserva);

      setLocaisDisponiveis(locaisData || []);
      setCategoriasDb(catsData || []);
    }
    setLoading(false);
  }

  async function loadMovimentacoes() {
    setDescartesLoading(true);
    setUsosLoading(true);
    if (!unidadeId) {
      setDescartesLoading(false);
      setUsosLoading(false);
      return;
    }

    // Busca SAIDAS (Descartes e Usos) relacionadas aos lotes da unidade
    const { data: movData } = await (supabase as any)
      .from('estoque_movimentacoes')
      .select(`
        *,
        lote:lotes_estoque!estoque_movimentacoes_lote_id_fkey!inner(
          *,
          ingredientes(id, nome),
          materiais(id, nome, tipo_material),
          fornecedores(razao_social)
        )
      `)
      .eq('tipo_movimento', 'SAIDA')
      .eq('lote.unidade_id', unidadeId)
      .order('data_movimento', { ascending: false });

    if (movData) {
      // Filtrar descartes (contém 'DESCARTADO' na justificativa)
      const descItems = movData.filter((m: any) => (m.justificativa || '').toUpperCase().includes('DESCARTADO'));
      setDescartes(descItems);

      // Filtrar usos (contém 'USO' na justificativa)
      const usoItems = movData.filter((m: any) => (m.justificativa || '').toUpperCase().includes('USO'));
      setUsos(usoItems);

      // Busca categorias para filtros
      const { data: catsData } = await (supabase as any)
        .from('cliente_categorias_produto')
        .select('nome')
        .eq('cliente_id', activeClientId!);

      const catsDb = catsData ? catsData.map((c: any) => c.nome) : [];
      setCategoriasDescDisponiveis(Array.from(new Set([...catsDb, 'Geral', 'Embalagens', 'Limpeza', 'Manutenção'])));
    }
    setDescartesLoading(false);
    setUsosLoading(false);
  }

  async function loadReservas() {
    setReservasLoading(true);
    if (!unidadeId) {
      setReservasLoading(false);
      return;
    }

    try {
      console.log('DEBUG [loadReservas] Iniciando busca unificada de requisições...');
      
      // Buscar TODAS as requisições ativas para a unidade
      const { data: reqData, error: reqErr } = await (supabase as any)
        .from('producao_requisicoes')
        .select(`
          id,
          ordem_id,
          ingrediente_id,
          qtd_necessaria_g,
          qtd_separada_g,
          status,
          created_at,
          ingredientes(nome, grupo_estoque_id),
          producao_ordens!inner(
            id,
            codigo,
            titulo,
            status,
            data_prevista,
            unidade_id,
            producao_ordens_itens(
              cliente_setores_producao(nome)
            )
          ),
          producao_reservas_estoque(
            id,
            quantidade_reservada_g,
            status,
            estoque_lote_id,
            lotes_estoque(
              *,
              ingredientes(nome),
              fornecedores(razao_social, nome_fantasia, cnpj),
              cliente_locais_estoque(nome)
            )
          )
        `)
        .eq('producao_ordens.unidade_id', unidadeId)
        .in('producao_ordens.status', ['PLANEJADA', 'EM_PRODUCAO', 'PENDENTE', 'EM_PREPARO'])
        .neq('producao_ordens.status', 'CANCELADA')
        .order('created_at', { ascending: false });

      if (reqErr) throw reqErr;

      // 2. Buscar Saldo de Estoque Atual para todos os ingredientes/grupos
      const { data: stockLevels } = await (supabase as any)
        .from('lotes_estoque')
        .select('quantidade_atual_g_ml, ingrediente_id, unidade_peso_embalagem, ingredientes(grupo_estoque_id)')
        .eq('unidade_id', unidadeId)
        .neq('status', 'REJEITADO')
        .neq('status', 'PREVISTO')
        .is('deleted_at', null);

      // Agrupar saldo por Grupo ou Ingrediente (Fallback)
      const stockBalanceMap: { [key: string]: { total: number, unidade?: string } } = {};
      (stockLevels || []).forEach((s: any) => {
        const key = s.ingredientes?.grupo_estoque_id || s.ingrediente_id;
        if (!stockBalanceMap[key]) {
            stockBalanceMap[key] = { total: 0, unidade: s.unidade_peso_embalagem };
        }
        stockBalanceMap[key].total += Number(s.quantidade_atual_g_ml || 0);
      });

      console.log('DEBUG [loadReservas] Requisições encontradas:', reqData?.length);

      // Agrupar por Ordem de Produção
      const ordensMap: { [key: string]: any } = {};

      (reqData || []).forEach((req: any) => {
        // Vincula o saldo de estoque ao vivo na requisição
        const key = req.ingredientes?.grupo_estoque_id || req.ingrediente_id;
        const stockData = stockBalanceMap[key];
        req.saldo_estoque_live = stockData?.total || 0;
        req.unidade_estoque = stockData?.unidade;

        const ordem = req.producao_ordens;
        if (!ordem) return;

        if (!ordensMap[ordem.id]) {
          const setoresSet = new Set<string>();
          ordem.producao_ordens_itens?.forEach((item: any) => {
            if (item.cliente_setores_producao?.nome) {
              setoresSet.add(item.cliente_setores_producao.nome);
            }
          });

          ordensMap[ordem.id] = {
            ...ordem,
            setores_nomes: Array.from(setoresSet).join(', ') || 'Geral',
            requisicoes: []
          };
        }

        ordensMap[ordem.id].requisicoes.push(req);
      });

      const ordensFinal = Object.values(ordensMap).sort((a: any, b: any) => 
        (b.data_prevista || '').localeCompare(a.data_prevista || '')
      );

      setOrdensComReservas(ordensFinal);
    } catch (err: any) {
      console.error('Erro ao carregar reservas:', err);
    } finally {
      setReservasLoading(false);
    }
  }

  // Funções de Alocação (Adaptadas da página de Produção)
  function getFatorConversao(unidade: string): number {
    const u = unidade?.toLowerCase().trim() || 'g';
    if (['kg', 'l', 'litro', 'litros'].includes(u)) return 1000;
    if (u === 'mg') return 0.001;
    return 1;
  }

  async function openAlocarLotes(req: any) {
    setReservaDialog(req);
    setLotesSugestao([]);
    
    try {
      // 1. Verificar se o ingrediente requisitado pertence a um grupo
      const { data: itemBanco } = await (supabase as any)
        .from('ingredientes')
        .select('id, grupo_estoque_id')
        .eq('id', req.ingrediente_id)
        .is('deleted_at', null)
        .single();
        
      let filterColumn = 'ingrediente_id';
      let filterValue: any = req.ingrediente_id;
      
      // Se tiver grupo, vamos buscar todos os ingredientes desse grupo
      if (itemBanco && itemBanco.grupo_estoque_id) {
        const { data: itensDoGrupo } = await (supabase as any)
          .from('ingredientes')
          .select('id')
          .eq('grupo_estoque_id', itemBanco.grupo_estoque_id)
          .is('deleted_at', null);
          
        if (itensDoGrupo && itensDoGrupo.length > 0) {
          filterColumn = 'ingrediente_id';
          filterValue = itensDoGrupo.map((i: any) => i.id);
        }
      }

      // 2. Buscar lotes disponíveis (do ingrediente específico ou do grupo todo)
      let query = (supabase as any)
        .from('lotes_estoque')
        .select('*, ingredientes(nome, id), fornecedores(razao_social, nome_fantasia, cnpj)')
        .gt('quantidade_atual_g_ml', 0)
        .in('status', ['APROVADO', 'QUARENTENA'])
        .order('data_validade_rotulo', { ascending: true });
        
      if (Array.isArray(filterValue)) {
        query = query.in(filterColumn, filterValue);
      } else {
        query = query.eq(filterColumn, filterValue);
      }

      const { data: lotes, error } = await query;
      
      if (error) throw error;
      
      if (lotes) {
        let faltaG = req.qtd_necessaria_g - req.qtd_separada_g;
      const suggestions = lotes.map((lote: any) => {
        const estoqueG = lote.quantidade_atual_g_ml;
        let usarG = 0;
        if (faltaG > 0) {
          usarG = Math.min(estoqueG, faltaG);
          faltaG = Math.max(0, faltaG - usarG);
        }

        let usarEmbalagens = 0;
        if (lote.qtd_embalagens && lote.peso_unitario_embalagem && lote.unidade_peso_embalagem) {
           const pesoTotalNoCad = lote.qtd_embalagens * lote.peso_unitario_embalagem * getFatorConversao(lote.unidade_peso_embalagem);
           if (pesoTotalNoCad > 0) {
             const proporcao = usarG / pesoTotalNoCad;
             usarEmbalagens = lote.qtd_embalagens * proporcao;
           }
        }
        
        const isKgL = estoqueG >= 1000;
        const fatorExibicao = isKgL ? 1000 : 1;
        const unidadeExibicao = isKgL ? 'Kg' : 'g';

        return {
          lote_id: lote.id,
          codigo: lote.numero_lote_fabricante,
          ingrediente_nome: lote.ingredientes?.nome || 'Desconhecido',
          validade: lote.data_validade_interna || lote.data_validade_rotulo || '',
          qtd_disponivel_g: estoqueG,
          unidade_medida: unidadeExibicao,
          fator: fatorExibicao,
          qtd_a_usar_g: usarG,
          qtd_a_usar_original: Number((usarG / fatorExibicao).toFixed(3)),
          qtd_embalagens: lote.qtd_embalagens,
          peso_unitario: lote.peso_unitario_embalagem,
          unidade_embalagem: lote.unidade_peso_embalagem,
          inputMode: 'peso',
          qtd_a_usar_embalagem: usarEmbalagens,
          originalLote: lote
        };
      });
      setLotesSugestao(suggestions);
    }
    } catch (err: any) {
      console.error('Erro ao buscar lotes para alocação:', err);
      alert('Erro ao buscar lotes disponíveis.');
    }
  }

  const handleReservaQuantidadeChange = (loteIndex: number, novoValorStr: string, fieldType: 'peso' | 'embalagem' = 'peso') => {
    const valLimpo = novoValorStr.replace(',', '.');
    const novoValorOrig = parseFloat(valLimpo);
    if (isNaN(novoValorOrig) && valLimpo !== '') return;

    const newList = [...lotesSugestao];
    const lote = newList[loteIndex];
    const valFinal = isNaN(novoValorOrig) ? 0 : novoValorOrig;
    
    if (fieldType === 'embalagem') {
      lote.qtd_a_usar_embalagem = valFinal;
      if (lote.peso_unitario && lote.unidade_embalagem && valFinal > 0) {
        const pesoTotalG = valFinal * lote.peso_unitario * getFatorConversao(lote.unidade_embalagem);
        lote.qtd_a_usar_g = pesoTotalG;
        lote.qtd_a_usar_original = Number((pesoTotalG / lote.fator).toFixed(3));
      } else {
        lote.qtd_a_usar_g = 0;
        lote.qtd_a_usar_original = 0;
      }
    } else {
      lote.qtd_a_usar_original = valFinal;
      lote.qtd_a_usar_g = valFinal * lote.fator;
      if (lote.peso_unitario && lote.unidade_embalagem && valFinal > 0) {
        const pesoPorEmbG = lote.peso_unitario * getFatorConversao(lote.unidade_embalagem);
        if (pesoPorEmbG > 0) lote.qtd_a_usar_embalagem = valFinal * lote.fator / pesoPorEmbG;
      } else {
        lote.qtd_a_usar_embalagem = 0;
      }
    }
    setLotesSugestao(newList);
  };

  async function handleConfirmarReserva() {
    if (!reservaDialog) return;
    setSalvandoReserva(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;
      const lotesParaReservar = lotesSugestao.filter(l => l.qtd_a_usar_g > 0);
      
      if (lotesParaReservar.length > 0) {
        const reservasPayload = lotesParaReservar.map(l => ({
          requisicao_id: reservaDialog.id,
          estoque_lote_id: l.lote_id,
          quantidade_reservada_g: l.qtd_a_usar_g,
          status: 'RESERVADO',
          reservado_por: userId
        }));

        const { error: resErr } = await (supabase as any).from('producao_reservas_estoque').insert(reservasPayload);
        if (resErr) throw resErr;
      }
      
      const totalReservadoG = lotesParaReservar.reduce((acc, l) => acc + l.qtd_a_usar_g, 0);
      const novaSeparadaG = reservaDialog.qtd_separada_g + totalReservadoG;
      const novoStatus = novaSeparadaG >= reservaDialog.qtd_necessaria_g ? 'SEPARADO' : 'PENDENTE';
      
      const { error: reqUpdErr } = await (supabase as any)
        .from('producao_requisicoes')
        .update({ qtd_separada_g: novaSeparadaG, status: novoStatus })
        .eq('id', reservaDialog.id);
        
      if (reqUpdErr) throw reqUpdErr;

      // Sugerir etiqueta para o primeiro lote alocado (simplificação)
      if (lotesParaReservar.length > 0) {
        const firstLote = lotesParaReservar[0];
        // Precisamos dos dados completos do lote para a etiqueta (já vieram no query atualizado)
        // Mas o objeto in `lotesParaReservar` é o mapeado... vamos buscar o original
        // No openAlocarLotes mapeamos para 'suggestions'. 
        // Vamos garantir que o objeto lote original ou os campos necessários estejam lá.
        
        // Na verdade, o 'lote' passado para o modal precisa ter estrutura de banco.
        // Vou passar os dados necessários.
        setEtiquetaModalData({
            open: true,
            lote: firstLote.originalLote, // Vou guardar o original no map
            qtdMovedGml: firstLote.qtd_a_usar_g,
            opContext: `Alocação OP ${reservaDialog.producao_ordens?.codigo || ''}`
        });
      }
      
      setReservaDialog(null);
      await loadReservas();
    } catch (err: any) {
      console.error('Erro na reserva:', err);
      alert('Erro ao reservar: ' + err.message);
    } finally {
      setSalvandoReserva(false);
    }
  }

  const handleConfirmarEntregaRaiz = async (lote: any, reserva: any) => {
    if (!window.confirm(`Confirmar a entrega de ${formatarQuantidade(reserva.quantidade_reservada_g)} para a OP ${reserva.producao_requisicoes?.producao_ordens?.codigo || 'selecionada'}?`)) return;

    setLoading(true); // Opcional: usar um loading local se preferir
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // 1. Baixar o estoque do lote
      const novaQtdGml = Math.max(0, lote.quantidade_atual_g_ml - reserva.quantidade_reservada_g);
      
      const { error: errLote } = await (supabase as any).from('lotes_estoque')
        .update({ quantidade_atual_g_ml: novaQtdGml })
        .eq('id', lote.id);
      if (errLote) throw errLote;

      // 2. Atualizar status da reserva
      const { error: errRes } = await (supabase as any).from('producao_reservas_estoque')
        .update({ status: 'CONSUMIDO' })
        .eq('id', reserva.id);
      if (errRes) throw errRes;

      // 3. Registrar movimentação
      const { error: errHist } = await (supabase as any).from('estoque_movimentacoes')
        .insert({
          lote_id: lote.id,
          tipo_movimento: 'SAIDA',
          quantidade_movimentada: reserva.quantidade_reservada_g,
          quantidade_nova: novaQtdGml,
          data_movimento: new Date().toISOString(),
          justificativa: `Alocação Automática - OP ${reserva.producao_requisicoes?.producao_ordens?.codigo || 'N/A'}`,
          responsavel_id: user?.id
        });
      if (errHist) throw errHist;

      // Chama modal de etiqueta em vez de alert
      setEtiquetaModalData({
        open: true,
        lote: reserva.lotes_estoque, // Usa o objeto completo da reserva
        qtdMovedGml: reserva.quantidade_reservada_g,
        opContext: `OP ${reserva.producao_requisicoes?.producao_ordens?.codigo || ''}`
      });
      
      if (activeTab === 2) loadReservas();
      else loadEstoque();
    } catch (err: any) {
      console.error('Erro na alocação automática:', err);
      alert('Erro ao processar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularStatusValidade = (dataValidade: string) => {
    if (!dataValidade) return 'OK';
    const diasRestantes = differenceInCalendarDays(parseISO(dataValidade), new Date());
    if (diasRestantes < 0) return 'VENCIDO';
    if (diasRestantes <= 30) return 'CRITICO';
    if (diasRestantes <= 89) return 'ALERTA';
    return 'OK';
  };

  const formatarQuantidade = (volumeGml: number, unidade?: string) => {
    if (unidade === 'UN') {
      return `${Math.round(volumeGml).toLocaleString('pt-BR')} Un`;
    }
    if (volumeGml >= 1000) {
      return `${(volumeGml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg/L`;
    }
    return `${volumeGml.toLocaleString('pt-BR')} g/ml`;
  };

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const lotesFiltrados = lotes.filter(lote => {
    const termo = filtroBusca.toLowerCase();
    
    // Check if it belongs to a group, otherwise use its own naming
    const nomeInsumo = lote.ingredientes?.ingredientes_grupos?.nome 
        || lote.ingredientes?.nome 
        || lote.materiais?.nome
        || '';

    const matchBusca =
      nomeInsumo.toLowerCase().includes(termo) ||
      (lote.ingredientes?.nome || '').toLowerCase().includes(termo) ||
      (lote.fornecedores?.razao_social || '').toLowerCase().includes(termo) ||
      (lote.numero_lote_fabricante || '').toLowerCase().includes(termo);

    const matchLocal = filtroLocal ? (lote.cliente_locais_estoque?.nome === filtroLocal) : true;
    
    // Virtual category mapping for materiais vs ingredientes
    let loteCategoriaVirtual = lote.categoria_produto;
    if (lote.materiais) {
      if (lote.materiais.tipo_material === 'EMBALAGEM') loteCategoriaVirtual = 'Embalagens';
      if (lote.materiais.tipo_material === 'LIMPEZA') loteCategoriaVirtual = 'Limpeza';
      if (lote.materiais.tipo_material === 'MANUTENCAO') loteCategoriaVirtual = 'Manutenção';
    }

    const matchCategoria = filtroCategoria ? (loteCategoriaVirtual === filtroCategoria) : true;

    let matchValidade = true;
    if (filtroValidade) {
      const statusCalculado = calcularStatusValidade(lote.data_validade_rotulo);
      matchValidade = statusCalculado === filtroValidade;
    }

    // --- FILTRO POR CATEGORIA PRINCIPAL (TOP TABS) ---
    let matchPrincipal = false;
    if (categoriaPrincipal === 'ALIMENTOS') {
      matchPrincipal = !lote.materiais;
    } else if (['EMBALAGENS', 'LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'].includes(categoriaPrincipal)) {
      const tipoMaterialMap: Record<string, string> = {
        'EMBALAGENS': 'EMBALAGEM',
        'LIMPEZA': 'LIMPEZA',
        'MANUTENCAO': 'MANUTENCAO',
        'UTENSILIOS': 'UTENSILIO',
        'EPI_EPC': 'EPI_EPC',
        'UNIFORMES': 'UNIFORME',
        'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
      };
      matchPrincipal = lote.materiais?.tipo_material === tipoMaterialMap[categoriaPrincipal];

      // Fallback: check categoria_produto if tipo_material doesn't match (e.g., older records)
      if (!matchPrincipal) {
        const catObjeto = categoriasDb.find(c => c.nome === lote.categoria_produto);
        matchPrincipal = catObjeto?.modalidade === categoriaPrincipal;
      }
      if (!matchPrincipal) {
        const legacyMap: Record<string, string> = {
          'UTENSILIOS': 'Utensílios',
          'EPI_EPC': 'EPIs/EPCs',
          'UNIFORMES': 'Uniformes',
          'PRIMEIROS_SOCORROS': 'Primeiros Socorros'
        };
        matchPrincipal = lote.categoria_produto === legacyMap[categoriaPrincipal];
      }
    }

    return matchBusca && matchLocal && matchCategoria && matchValidade && matchPrincipal;
  });

  const descartesFiltrados = descartes.filter(desc => {
    const rawLote = desc.lote || desc.lotes_estoque;
    const lote = Array.isArray(rawLote) ? rawLote[0] : rawLote;
    if (!lote) return false;

    const rawMaterial = lote.materiais;
    const material = Array.isArray(rawMaterial) ? rawMaterial[0] : rawMaterial;

    let matchPrincipal = false;
    if (categoriaPrincipal === 'ALIMENTOS') {
      matchPrincipal = !material;
    }
    else {
      // Tenta match por tipo_material primeiro (inclui todos os tipos)
      const tipoMaterialMap: Record<string, string> = {
        'EMBALAGENS': 'EMBALAGEM',
        'LIMPEZA': 'LIMPEZA',
        'MANUTENCAO': 'MANUTENCAO',
        'UTENSILIOS': 'UTENSILIO',
        'EPI_EPC': 'EPI_EPC',
        'UNIFORMES': 'UNIFORME',
        'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
      };
      if (tipoMaterialMap[categoriaPrincipal]) {
        matchPrincipal = material?.tipo_material === tipoMaterialMap[categoriaPrincipal];
      }

      // Fallback universal para categorias vinculadas (especialmente para ingredientes em abas de materiais)
      if (!matchPrincipal) {
        const catObjeto = categoriasDb.find(c => c.nome === lote.categoria_produto);
        matchPrincipal = catObjeto?.modalidade === categoriaPrincipal;
        
        if (!matchPrincipal) {
          const legacyMap: Record<string, string> = {
            'UTENSILIOS': 'Utensílios',
            'EPI_EPC': 'EPIs/EPCs',
            'UNIFORMES': 'Uniformes',
            'PRIMEIROS_SOCORROS': 'Primeiros Socorros'
          };
          matchPrincipal = lote.categoria_produto === legacyMap[categoriaPrincipal];
        }
      }
    }

    if (!matchPrincipal) return false;

    const rawIngrediente = lote.ingredientes;
    const ingrediente = Array.isArray(rawIngrediente) ? rawIngrediente[0] : rawIngrediente;

    const nomeProduto = ingrediente?.nome || material?.nome || '';
    const rawFornecedor = lote.fornecedores;
    const fornecedor = Array.isArray(rawFornecedor) ? rawFornecedor[0] : rawFornecedor;
    const nomeFornecedor = fornecedor?.razao_social || '';
    
    const loteProduto = lote.numero_lote_fabricante || '';
    const categoria = lote.categoria_produto || '';

    const termo = filtroDescBusca.toLowerCase();
    const matchBusca =
      nomeProduto.toLowerCase().includes(termo) ||
      nomeFornecedor.toLowerCase().includes(termo) ||
      loteProduto.toLowerCase().includes(termo);

    const matchCategoria = filtroDescCategoria ? categoria === filtroDescCategoria : true;

    const dataMovimento = parseISO(desc.data_movimento).getTime();
    const dataInicio = filtroDescDataInicio ? new Date(filtroDescDataInicio).getTime() : 0;
    const dataFim = filtroDescDataFim ? new Date(filtroDescDataFim).getTime() + 86400000 : Infinity;
    const matchData = dataMovimento >= dataInicio && dataMovimento <= dataFim;

    return matchBusca && matchCategoria && matchData;
  });

  const usosFiltrados = usos.filter(uso => {
    const rawLote = uso.lote || uso.lotes_estoque;
    const lote = Array.isArray(rawLote) ? rawLote[0] : rawLote;
    if (!lote) return false;

    const rawMaterial = lote.materiais;
    const material = Array.isArray(rawMaterial) ? rawMaterial[0] : rawMaterial;

    let matchPrincipal = false;
    if (categoriaPrincipal === 'ALIMENTOS') {
      matchPrincipal = !material;
    }
    else {
      const tipoMaterialMap: Record<string, string> = {
        'EMBALAGENS': 'EMBALAGEM',
        'LIMPEZA': 'LIMPEZA',
        'MANUTENCAO': 'MANUTENCAO',
        'UTENSILIOS': 'UTENSILIO',
        'EPI_EPC': 'EPI_EPC',
        'UNIFORMES': 'UNIFORME',
        'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
      };
      if (tipoMaterialMap[categoriaPrincipal]) {
        matchPrincipal = material?.tipo_material === tipoMaterialMap[categoriaPrincipal];
      }

      if (!matchPrincipal) {
        const catObjeto = categoriasDb.find(c => c.nome === lote.categoria_produto);
        matchPrincipal = catObjeto?.modalidade === categoriaPrincipal;
        
        if (!matchPrincipal) {
          const legacyMap: Record<string, string> = {
            'UTENSILIOS': 'Utensílios',
            'EPI_EPC': 'EPIs/EPCs',
            'UNIFORMES': 'Uniformes',
            'PRIMEIROS_SOCORROS': 'Primeiros Socorros'
          };
          matchPrincipal = lote.categoria_produto === legacyMap[categoriaPrincipal];
        }
      }
    }

    if (!matchPrincipal) return false;

    const rawIngrediente = lote.ingredientes;
    const ingrediente = Array.isArray(rawIngrediente) ? rawIngrediente[0] : rawIngrediente;

    const nomeProduto = ingrediente?.nome || material?.nome || '';
    const termo = filtroDescBusca.toLowerCase();
    const matchBusca = nomeProduto.toLowerCase().includes(termo);

    const dataMovimento = parseISO(uso.data_movimento).getTime();
    const dataInicio = filtroDescDataInicio ? new Date(filtroDescDataInicio).getTime() : 0;
    const dataFim = filtroDescDataFim ? new Date(filtroDescDataFim).getTime() + 86400000 : Infinity;
    const matchData = dataMovimento >= dataInicio && dataMovimento <= dataFim;

    return matchBusca && matchData;
  });

  // Agrupamento atualizado: Primeiro por Grupo de Estoque (se houver), se não, pelo Nome da Matéria-Prima
  const groupedLotes = useMemo(() => {
    const grupos: Record<string, { tituloGrupo: string, lotes: any[], totalGml: number, unidade?: string }> = {};
    
    lotesFiltrados.forEach(lote => {
      // Determina o nome do grupo agregador
      const tituloGrupo = lote.ingredientes?.ingredientes_grupos?.nome || lote.ingredientes?.nome || lote.materiais?.nome || 'Produto Desconhecido';
      
      if (!grupos[tituloGrupo]) {
        grupos[tituloGrupo] = { tituloGrupo, lotes: [], totalGml: 0, unidade: lote.unidade_peso_embalagem };
      }
      
      grupos[tituloGrupo].lotes.push(lote);
      grupos[tituloGrupo].totalGml += Number(lote.quantidade_atual_g_ml || 0);
    });
    
    return Object.values(grupos).sort((a, b) => a.tituloGrupo.localeCompare(b.tituloGrupo));
  }, [lotesFiltrados]);

  const renderChipValidade = (dataValidade: string) => {
    const status = calcularStatusValidade(dataValidade);
    const dias = differenceInCalendarDays(parseISO(dataValidade), new Date());

    let color: 'default' | 'error' | 'warning' | 'success' = 'success';
    let label = `${dias} dias`;
    let bgcolor = alpha(theme.palette.success.main, 0.1);
    let textColor = theme.palette.success.dark;

    switch (status) {
      case 'VENCIDO':
        color = 'error';
        label = `Vencido há ${Math.abs(dias)} dias`;
        bgcolor = alpha(theme.palette.error.main, 0.1);
        textColor = theme.palette.error.dark;
        break;
      case 'CRITICO':
        color = 'error';
        label = `Vence em ${dias} dias`;
        bgcolor = alpha(theme.palette.error.main, 0.1);
        textColor = theme.palette.error.dark;
        break;
      case 'ALERTA':
        color = 'warning';
        label = `Vence em ${dias} dias`;
        bgcolor = alpha(theme.palette.warning.main, 0.1);
        textColor = theme.palette.warning.dark;
        break;
      case 'OK':
        color = 'success';
        label = `Vence em ${dias} dias`;
        break;
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 'bold',
          bgcolor: bgcolor,
          color: textColor,
          border: '1px solid',
          borderColor: alpha(textColor, 0.3)
        }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Controle de Estoque
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão inteligente, rastreabilidade e análise de perdas.
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<History size={18} />} color="inherit">
              Histórico
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ScanLine size={18} />}
              onClick={() => setBuscaGeralOpen(true)}
            >
              Movimentar Insumo / QR Code
            </Button>
          </Box>
        )}
      </Box>

      {/* 1. ABAS PRINCIPAIS (CATEGORIAS) */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 1, borderRadius: 0, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Tabs
          value={categoriaPrincipal}
          onChange={(e, val) => {
            setCategoriaPrincipal(val);
            setActiveTab(0); // Volta para Estoque Físico ao trocar de macro-categoria
          }}
          textColor="primary"
          indicatorColor="primary"
          centered={false}
          sx={{ px: 2 }}
        >
          <Tab label="Alimentos" value="ALIMENTOS" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Embalagens" value="EMBALAGENS" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Limpeza" value="LIMPEZA" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Manutenção" value="MANUTENCAO" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Utensílios" value="UTENSILIOS" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="EPIs/EPCs" value="EPI_EPC" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Uniformes" value="UNIFORMES" sx={{ fontWeight: 800, py: 2 }} />
          <Tab label="Primeiros Socorros" value="PRIMEIROS_SOCORROS" sx={{ fontWeight: 800, py: 2 }} />
        </Tabs>
      </Paper>

      {/* 2. ABAS SECUNDÁRIAS (VISÕES) */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Package size={18} />} iconPosition="start" label="Estoque Físico (FEFO)" />
        <Tab 
          icon={<Trash2 size={18} />} 
          iconPosition="start" 
          label={['LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'].includes(categoriaPrincipal) ? "Descarte / Perdas" : "Análise de Descarte"} 
        />
        <Tab 
          icon={['LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'].includes(categoriaPrincipal) ? <History size={18} /> : <Truck size={18} />} 
          iconPosition="start" 
          label={['LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'].includes(categoriaPrincipal) ? "Controle de Uso" : "Reservas (Produção)"} 
        />
      </Tabs>

      {/* ABA 0: ESTOQUE FÍSICO */}
      {activeTab === 0 && (
        <>
          {/* BARRA DE FILTROS AVANÇADA */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
              <Filter size={18} />
              <Typography variant="subtitle2" fontWeight="bold">Filtros Avançados</Typography>
            </Box>

            <Grid container spacing={2}>
              {/* 1. Busca Texto */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth size="small"
                  placeholder="Buscar Produto, Marca ou Lote..."
                  value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
                />
              </Grid>

              {/* 2. Filtro Local */}
              <Grid item xs={12} md={2}>
                <TextField
                  select fullWidth size="small" label="Local"
                  value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  InputLabelProps={{ shrink: true }} // <--- CORREÇÃO AQUI
                >
                  <MenuItem value="">Todos os Locais</MenuItem>
                  {locaisDisponiveis
                    .filter(loc => !loc.categorias_permitidas || loc.categorias_permitidas.length === 0 || loc.categorias_permitidas.includes(categoriaPrincipal))
                    .map(loc => <MenuItem key={loc.nome} value={loc.nome}>{loc.nome}</MenuItem>)}
                </TextField>
              </Grid>

              {/* 3. Filtro Categoria */}
              <Grid item xs={12} md={3}>
                <TextField
                  select fullWidth size="small" label="Categoria"
                  value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">Todas as Categorias</MenuItem>
                {categoriasDb
                  .filter(cat => cat.modalidade === categoriaPrincipal || (!cat.modalidade && categoriaPrincipal === 'ALIMENTOS'))
                  .map((cat) => (
                    <MenuItem key={cat.id} value={cat.nome}>{cat.nome}</MenuItem>
                  ))
                }
                </TextField>
              </Grid>

              {/* 4. Filtro Validade */}
              <Grid item xs={12} md={3}>
                <TextField
                  select fullWidth size="small" label="Situação Validade"
                  value={filtroValidade} onChange={e => setFiltroValidade(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  InputLabelProps={{ shrink: true }} // <--- CORREÇÃO AQUI
                >
                  <MenuItem value="">Todas as Situações</MenuItem>
                  {STATUS_VALIDADE_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabela de Resultados */}
          <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            {loading ? (
              <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
            ) : lotesFiltrados.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <Package size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                <Typography variant="h6" color="text.secondary">Nenhum item encontrado</Typography>
                <Typography variant="body2" color="text.secondary">Tente ajustar os filtros de busca.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>PRODUTO / DETALHES</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>LOCALIZAÇÃO</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>LOTE & VALIDADE</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>QUANTIDADE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>AÇÕES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedLotes.map((grupo) => {
                      const key = grupo.tituloGrupo;
                      const isExpanded = expandedGroups.includes(key);

                      return (
                        <React.Fragment key={key}>
                          {/* Linha Mestre do Grupo */}
                          <TableRow hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }, cursor: 'pointer' }} onClick={() => toggleGroup(key)}>
                            <TableCell colSpan={3}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isExpanded ? <ChevronDown size={20} color={theme.palette.primary.main} /> : <ChevronRight size={20} color={theme.palette.text.secondary} />}
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                    {grupo.tituloGrupo}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
                                {formatarQuantidade(grupo.totalGml, (grupo as any).unidade)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={`${grupo.lotes.length} lotes`} size="small" color="primary" variant="outlined" />
                            </TableCell>
                          </TableRow>

                          {/* Lotes do Grupo (Colapsáveis) */}
                          {isExpanded && grupo.lotes.map((lote) => (
                            <TableRow key={lote.id} hover sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                              <TableCell sx={{ pl: 6 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {lote.ingredientes?.nome || lote.materiais?.nome || 'Produto Desconhecido'}
                                    </Typography>
                                    {/* Assuming the data fetching query for lotes_estoque includes:
                                        .select(`
                                            *,
                                            ingredientes(nome),
                                            fornecedores(razao_social, cnpj),
                                            producao_reservas_estoque(
                                    `)
                                    */}
                                    <Chip label={lote.fornecedores?.razao_social || 'Sem Fornecedor'} size="small" sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'grey.200' }} />
                                  </Box>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    {lote.qtd_embalagens && lote.peso_unitario_embalagem
                                      ? `${lote.qtd_embalagens} emb. × ${lote.peso_unitario_embalagem} ${lote.unidade_peso_embalagem || ''}`
                                      : 'Qtd/Embalagem N/A'
                                    }
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                  <MapPin size={16} />
                                  <Typography variant="body2" fontWeight={500}>
                                    {lote.cliente_locais_estoque?.nome || 'Local Não Definido'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                    Lote: {lote.numero_lote_fabricante}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {lote.data_validade_rotulo ? format(parseISO(lote.data_validade_rotulo), 'dd/MM/yyyy') : '-'}
                                    </Typography>
                                    {renderChipValidade(lote.data_validade_rotulo)}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatarQuantidade(lote.quantidade_atual_g_ml - (lote.total_reservado_g || 0), lote.unidade_peso_embalagem)} 
                                    <Typography component="span" sx={{ fontWeight: 'normal', color: 'text.secondary', fontSize: '0.8rem', ml: 0.5 }}>Disp.</Typography>
                                  </Typography>
                                  {(lote.total_reservado_g || 0) > 0 && (
                                    <Tooltip title={
                                      lote.reservas?.map((r: any) => `${r.producao_requisicoes?.producao_ordens?.codigo || 'OP'}: ${formatarQuantidade(r.quantidade_reservada_g)}`).join(' | ') || ''
                                    }>
                                      <Chip 
                                        label={`${formatarQuantidade(lote.total_reservado_g, lote.unidade_peso_embalagem)} Reserv.`} 
                                        size="small" 
                                        color="warning" 
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} 
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Movimentar / Ajustar este Lote">
                                  <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenMovimentacao(lote); }}>
                                    <ArrowRightLeft size={18} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      {/* ABA 1: ANÁLISE DE DESCARTE */}
      {activeTab === 1 && (
        <>
          {/* FILTROS DESCARTE */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'error.main' }}>
              <Filter size={18} />
              <Typography variant="subtitle2" fontWeight="bold">Filtros de Descarte</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth size="small"
                  placeholder="Buscar Produto, Marca ou Lote..."
                  value={filtroDescBusca} onChange={e => setFiltroDescBusca(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select fullWidth size="small" label="Categoria"
                  value={filtroDescCategoria} onChange={e => setFiltroDescCategoria(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">Todas as Categorias</MenuItem>
                  {categoriasDescDisponiveis.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth size="small" label="Data Início" type="date"
                  value={filtroDescDataInicio} onChange={e => setFiltroDescDataInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth size="small" label="Data Fim" type="date"
                  value={filtroDescDataFim} onChange={e => setFiltroDescDataFim(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* TABELA DE DESCARTE */}
          <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
            {descartesLoading ? (
              <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress color="error" /></Box>
            ) : descartesFiltrados.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <Trash2 size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                <Typography variant="h6" color="text.secondary">Nenhum descarte encontrado</Typography>
                <Typography variant="body2" color="text.secondary">Nesta janela de tempo não houve descartes para estes filtros.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>DATA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>INSUMO / LOTE</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>CATEGORIA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>QTD DESCARTADA</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'error.dark' }}>JUSTIFICATIVA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {descartesFiltrados.map((desc) => (
                      <TableRow key={desc.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {format(parseISO(desc.data_movimento), 'dd/MM/yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(desc.data_movimento), 'HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {desc.lotes_estoque?.ingredientes?.nome || 'Insumo Excluído'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            Lote: {desc.lotes_estoque?.numero_lote_fabricante || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={desc.lotes_estoque?.categoria_produto || 'S/ Categoria'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main" fontWeight={700}>
                            {formatarQuantidade(desc.quantidade_movimentada, desc.lotes_estoque?.unidade_peso_embalagem)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300, whiteSpace: 'normal' }}>
                            {desc.justificativa}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            por {desc.usuario_id?.split('@')[0] || 'Desconhecido'} {/* Fallback simples p/ email/user_id */}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      {/* ABA 2: RESERVAS (PRODUÇÃO) OU CONTROLE DE USO */}
      {activeTab === 2 && (
        <>
          {['ALIMENTOS', 'EMBALAGENS'].includes(categoriaPrincipal) ? (
            <>
              {/* LAYOUT DE RESERVAS ATUAL */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Itens reservados para Ordens de Produção ativas. Organize a saída física para os setores.
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<History size={16} />} 
                  onClick={loadReservas}
                  disabled={reservasLoading}
                  sx={{ textTransform: 'none' }}
                >
                  Atualizar Dados
                </Button>
              </Box>

              {reservasLoading ? (
                <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
              ) : ordensComReservas.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Truck size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                  <Typography variant="h6" color="text.secondary">Nenhuma reserva ativa encontrada</Typography>
                  <Typography variant="body2" color="text.secondary">As reservas aparecem aqui quando são alocadas em Ordens de Produção.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ordensComReservas.map((ordem: any) => {
                    const isExpanded = expandedOrders.includes(ordem.id);
                    const toggleOrder = (id: string) => {
                      setExpandedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    };

                    return (
                      <Paper key={ordem.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box 
                          onClick={() => toggleOrder(ordem.id)}
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
                              {ordem.codigo}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {ordem.titulo || 'Sem Título'}
                                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}>
                                  ({ordem.requisicoes?.length || 0} itens)
                                </Typography>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">Destino: {ordem.setores_nomes}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Entrega: {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : 'N/A'}
                            </Typography>
                            <Chip size="small" label={ordem.status} variant="outlined" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </Box>
                        </Box>

                        <Collapse in={isExpanded}>
                          <Divider />
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Item / Requisicão</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Lote Alocado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtde. Reservada</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="center">Ação / Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ordem.requisicoes.map((req: any) => {
                                const reservas = req.producao_reservas_estoque || [];
                                
                                return (
                                  <React.Fragment key={req.id}>
                                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{req.ingredientes?.nome}</Typography>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                          <Typography variant="caption" color="text.secondary">Nec.: {formatarQuantidade(req.qtd_necessaria_g, req.unidade_estoque)}</Typography>
                                          <Typography variant="caption" sx={{ 
                                            fontWeight: 700, 
                                            color: (req.saldo_estoque_live || 0) > 0 ? 'success.main' : 'error.main',
                                            bgcolor: alpha((req.saldo_estoque_live || 0) > 0 ? theme.palette.success.main : theme.palette.error.main, 0.08),
                                            px: 0.5, borderRadius: 0.5
                                          }}>
                                            Saldo em Estoque: {formatarQuantidade(req.saldo_estoque_live || 0, req.unidade_estoque)}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell colSpan={2}>
                                        {(req.saldo_estoque_live || 0) <= 0 && req.qtd_separada_g < req.qtd_necessaria_g ? (
                                          <Chip label="Aguardando Recebimento" size="small" color="error" variant="filled" sx={{ fontWeight: 'bold' }} />
                                        ) : req.qtd_separada_g >= req.qtd_necessaria_g ? (
                                          <Chip label="Totalmente Alocado" size="small" color="success" variant="outlined" />
                                        ) : (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="warning.dark" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
                                              Pendente Separar: {formatarQuantidade(req.qtd_necessaria_g - req.qtd_separada_g, req.unidade_estoque)}
                                            </Typography>
                                            {(req.saldo_estoque_live || 0) < (req.qtd_necessaria_g - req.qtd_separada_g) && (
                                               <Chip label="Saldo Insuficiente" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            )}
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell align="center">
                                        {req.qtd_separada_g < req.qtd_necessaria_g && (req.saldo_estoque_live || 0) > 0 && (
                                          <Button 
                                            size="small" 
                                            variant="contained" 
                                            onClick={() => openAlocarLotes(req)}
                                            sx={{ textTransform: 'none', px: 2 }}
                                          >
                                            Alocar Lotes
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>

                                    {reservas.map((res: any) => (
                                      <TableRow key={res.id}>
                                        <TableCell sx={{ pl: 4 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ArrowUpRight size={14} color={theme.palette.success.main} />
                                            <Typography variant="caption" color="text.secondary">Reserva Vinculada</Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" fontFamily="monospace">{res.lotes_estoque?.numero_lote_fabricante || 'Lote N/A'}</Typography>
                                          <Typography variant="caption" color="text.secondary">{res.lotes_estoque?.cliente_locais_estoque?.nome}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" fontWeight="bold">{formatarQuantidade(res.quantidade_reservada_g, res.lotes_estoque?.unidade_peso_embalagem)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          {res.status === 'RESERVADO' ? (
                                            <Button
                                              variant="outlined"
                                              color="success"
                                              size="small"
                                              onClick={() => handleConfirmarEntregaRaiz(res.lotes_estoque, { ...res, producao_requisicoes: { producao_ordens: ordem } })}
                                              sx={{ textTransform: 'none' }}
                                            >
                                              Entregar
                                            </Button>
                                          ) : (
                                            <Chip label="Entregue" size="small" color="success" />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </>
          ) : (
            <>
              {/* LAYOUT DE CONTROLE DE USO (Limpeza/Manutenção) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Registro de utilização rotineira de itens de {categoriaPrincipal.replace('_', ' ').toLowerCase()}.
                </Typography>

                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                    <Filter size={18} />
                    <Typography variant="subtitle2" fontWeight="bold">Filtros de Uso</Typography>
                  </Box>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth size="small"
                        placeholder="Buscar Material ou Lote..."
                        value={filtroDescBusca} onChange={e => setFiltroDescBusca(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2.5}>
                      <TextField
                        fullWidth size="small" label="Data Início" type="date"
                        value={filtroDescDataInicio} onChange={e => setFiltroDescDataInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2.5}>
                      <TextField
                        fullWidth size="small" label="Data Fim" type="date"
                        value={filtroDescDataFim} onChange={e => setFiltroDescDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        startIcon={<History size={16} />} 
                        onClick={loadMovimentacoes}
                        disabled={usosLoading}
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                      >
                        Atualizar Dados
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                {usosLoading ? (
                  <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
                ) : usosFiltrados.length === 0 ? (
                  <Box sx={{ p: 8, textAlign: 'center' }}>
                    <History size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                    <Typography variant="h6" color="text.secondary">Nenhum registro de uso encontrado</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>DATA</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>MATERIAL / LOTE</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>QTD UTILIZADA</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>LOCAL / RESPONSÁVEL</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {usosFiltrados.map((uso) => (
                          <TableRow key={uso.id} hover>
                            <TableCell>
                              {format(parseISO(uso.data_movimento), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {(() => {
                                  const rawLote = uso.lote || uso.lotes_estoque;
                                  const lote = Array.isArray(rawLote) ? rawLote[0] : rawLote;
                                  const rawIngrediente = lote?.ingredientes;
                                  const rawMaterial = lote?.materiais;
                                  const ingrediente = Array.isArray(rawIngrediente) ? rawIngrediente[0] : rawIngrediente;
                                  const material = Array.isArray(rawMaterial) ? rawMaterial[0] : rawMaterial;
                                  return ingrediente?.nome || material?.nome || 'Material Excluído';
                                })()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Lote: {(uso.lote || (Array.isArray(uso.lotes_estoque) ? uso.lotes_estoque[0] : uso.lotes_estoque))?.numero_lote_fabricante || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="primary.main" fontWeight={700}>
                                {(() => {
                                  const rawLote = uso.lote || uso.lotes_estoque;
                                  const lote = Array.isArray(rawLote) ? rawLote[0] : rawLote;
                                  return formatarQuantidade(uso.quantidade_movimentada, lote?.unidade_peso_embalagem);
                                })()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{uso.justificativa}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Responsável: {uso.responsavel_id?.substring(0, 8) || 'Desconhecido'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </>
          )}
        </>
      )}

      <MovimentacaoEstoqueDialog
        open={movimentacaoOpen}
        onClose={() => setMovimentacaoOpen(false)}
        lote={loteSelecionado}
        onSuccess={() => {
          loadEstoque();
          loadReservas();
        }}
      />
      <MovimentacaoGeralDialog
        open={buscaGeralOpen}
        onClose={() => setBuscaGeralOpen(false)}
        clienteId={unidadeId}
        onLoteSelected={handleLoteSelecionadoDaBusca}
        onSuccess={() => {
          loadEstoque();
          loadReservas();
        }}
      />

      {/* DIALOG DE ALOCAÇÃO (Portado da Produção) */}
      <Dialog open={!!reservaDialog} onClose={() => setReservaDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Package size={20} />
           Alocação de Lotes para {reservaDialog?.ingredientes?.nome}
        </DialogTitle>
        <DialogContent dividers>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
             Selecione os lotes disponíveis para atender a requisição da OP {reservaDialog?.producao_ordens?.codigo}.
           </Typography>
           
           <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
             <Grid container spacing={2}>
               <Grid item xs={6}>
                 <Typography variant="caption" color="text.secondary">Falta Separar:</Typography>
                 <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {reservaDialog ? formatarQuantidade(reservaDialog.qtd_necessaria_g - reservaDialog.qtd_separada_g, (reservaDialog as any)?.unidade_estoque) : '0'}
                 </Typography>
               </Grid>
               <Grid item xs={6} sx={{ textAlign: 'right' }}>
                 <Typography variant="caption" color="text.secondary">Soma das Alocações:</Typography>
                 <Typography variant="h6" fontWeight="bold" color={lotesSugestao.reduce((acc, l) => acc + l.qtd_a_usar_g, 0) >= (reservaDialog?.qtd_necessaria_g || 0) - (reservaDialog?.qtd_separada_g || 0) ? 'success.main' : 'warning.dark'}>
                    {formatarQuantidade(lotesSugestao.reduce((acc, l) => acc + l.qtd_a_usar_g, 0), (reservaDialog as any)?.unidade_estoque)}
                 </Typography>
               </Grid>
             </Grid>
           </Box>

           {lotesSugestao.length === 0 ? (
             <Alert severity="error">Nenhum lote disponível em estoque para este ingrediente.</Alert>
           ) : (
             <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
               <Table size="small">
                 <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                   <TableRow>
                     <TableCell sx={{ fontWeight: 'bold' }}>Lote</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }}>Validade</TableCell>
                     <TableCell sx={{ fontWeight: 'bold' }} align="right">Disp. Mínima</TableCell>
                     <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }} align="right" width={160}>Qtd a Separar</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {lotesSugestao.map((lote, index) => (
                      <TableRow key={lote.lote_id} sx={{ bgcolor: lote.qtd_a_usar_g > 0 ? alpha(theme.palette.success.main, 0.02) : 'inherit' }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{lote.codigo}</Typography>
                          {lote.ingrediente_nome !== reservaDialog?.ingredientes?.nome && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                  {lote.ingrediente_nome}
                              </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{lote.validade ? format(parseISO(lote.validade), 'dd/MM/yyyy') : 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatarQuantidade(lote.qtd_disponivel_g, lote.originalLote?.unidade_peso_embalagem)}</Typography>
                          {lote.qtd_embalagens > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {lote.qtd_embalagens} emb. ({lote.peso_unitario} {lote.unidade_embalagem})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            {lote.peso_unitario > 0 && (
                               <IconButton size="small" onClick={() => {
                                 const newList = [...lotesSugestao];
                                 newList[index].inputMode = lote.inputMode === 'peso' ? 'embalagem' : 'peso';
                                 setLotesSugestao(newList);
                               }}>
                                 <MoveHorizontal size={14} />
                               </IconButton>
                            )}
                            <TextField
                              size="small"
                              type="number"
                              value={lote.inputMode === 'embalagem' ? (lote.qtd_a_usar_embalagem || '') : (lote.qtd_a_usar_original || '')}
                              onChange={(e) => handleReservaQuantidadeChange(index, e.target.value, lote.inputMode)}
                              inputProps={{ min: 0, step: '0.001', style: { textAlign: 'right', fontSize: '0.875rem' } }}
                              sx={{ width: 90 }}
                            />
                            <Typography variant="caption">{lote.inputMode === 'embalagem' ? 'emb.' : lote.unidade_medida}</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
             </TableContainer>
           )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReservaDialog(null)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            startIcon={salvandoReserva ? <CircularProgress size={16} /> : <Save size={16} />}
            disabled={salvandoReserva || lotesSugestao.every(l => l.qtd_a_usar_g === 0)}
            onClick={handleConfirmarReserva}
          >
            Confirmar Reserva
          </Button>
        </DialogActions>
      </Dialog>
      
      <MovimentoEtiquetaDialog
        open={etiquetaModalData.open}
        onClose={() => setEtiquetaModalData({ ...etiquetaModalData, open: false })}
        lote={etiquetaModalData.lote}
        quantidadeMovimentadaGml={etiquetaModalData.qtdMovedGml}
        contextoDestino={etiquetaModalData.opContext}
        userName={userName}
        unidadeInfo={unidadeInfo}
      />
    </Container>
  );
}



