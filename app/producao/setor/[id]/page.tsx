'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  Chip, LinearProgress, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  CircularProgress, Alert, Container, useTheme, alpha,
  Divider, Tooltip, List, ListItemButton, Breadcrumbs,
  Link, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, ToggleButtonGroup, ToggleButton, MenuItem, InputAdornment,
  Autocomplete, Stack
} from '@mui/material';
import { format, addDays, parseISO } from 'date-fns';
import { Layers, ChevronRight, Play, CheckCircle, ChefHat, Info, History, Trash2, Tag, Printer, Save, MapPin, Calendar, User, ArrowLeft, ClipboardList, Clock, Package, ChevronDown, Check, AlertTriangle, RotateCcw, Scan, Box as BoxIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { formatarQuantidade } from '@/components/MovimentacaoEstoqueDialog';
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

interface Setor {
  id: string;
  nome: string;
}

interface ItemProducao {
  id: string;
  receita_id: string;
  ordem_id: string;
  setor_producao_id: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  receitas: {
    nome: string;
    modo_preparo: string | null;
    rendimento_total_g: number;
    peso_embalagem_g: number | null;
  };
  producao_ordens: {
    id: string;
    codigo: string;
    titulo: string | null;
    status: string;
    data_prevista: string | null;
  };
}

interface RequisicaoItem {
  id: string;
  ingrediente_id: string;
  grupo_estoque_id: string | null;
  qtd_necessaria_g: number;
  qtd_separada_g: number;
  nome?: string;
  ingredientes: {
    nome: string;
  } | null;
  ingredientes_grupos: {
    nome: string;
  } | null;
}

export default function SetorExecucaoPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const setorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [setor, setSetor] = useState<Setor | null>(null);
  const [itensPorOrdem, setItensPorOrdem] = useState<Record<string, { ordem: any, itens: ItemProducao[] }>>({});
  const [userName, setUserName] = useState('');
  const [quickEtiqueta, setQuickEtiqueta] = useState<{
    open: boolean;
    type: 'INSUMO' | 'PRODUTO';
    item: any;
    loteOrOp: any;
    peso: number;
    destinoId?: string;
    destinoTipo?: 'LOCAL' | 'SETOR';
  } | null>(null);

  // Estados do Dialog de Execução
  const [selectedItem, setSelectedItem] = useState<ItemProducao | null>(null);
  const [requisicoes, setRequisicoes] = useState<RequisicaoItem[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [qtdProduzida, setQtdProduzida] = useState<number>(0);
  const [sobra, setSobra] = useState<number>(0);
  const [resto, setResto] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);
  const [execucaoTab, setExecucaoTab] = useState(0);
  const [selectedOPForSobras, setSelectedOPForSobras] = useState<any | null>(null);
  const [loadingOPReqs, setLoadingOPReqs] = useState(false);
  const [opRequisicoes, setOpRequisicoes] = useState<any[]>([]);
  const [existingPerdas, setExistingPerdas] = useState<any[]>([]);
  const [sobrasInsumos, setSobrasInsumos] = useState<Record<string, number>>({});
  const [sobrasProdutos, setSobrasProdutos] = useState<Record<string, { sobra: number, resto: number }>>({});
  const [sobrasDestinos, setSobrasDestinos] = useState<Record<string, { type: 'LOCAL' | 'SETOR', id: string }>>({});
  const [locais, setLocais] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [savingStage, setSavingStage] = useState<'FORM' | 'SUMMARY'>('FORM');
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [unidadeInfo, setUnidadeInfo] = useState<any>(null);

  // Estados para Reserva de Insumos (Manual e Smart)
  const [reservaOPDialogOpen, setReservaOPDialogOpen] = useState(false);
  const [selectedOPForReserva, setSelectedOPForReserva] = useState<any | null>(null);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [requisicoesOP, setRequisicoesOP] = useState<any[]>([]);
  const [alocacaoManualReq, setAlocacaoManualReq] = useState<any | null>(null);
  const [lotesSugestao, setLotesSugestao] = useState<any[]>([]);
  const [salvandoReserva, setSalvandoReserva] = useState(false);
  const [smartAllocationDraft, setSmartAllocationDraft] = useState<any | null>(null);
  const [showSmartDraft, setShowSmartDraft] = useState(false);
  const [labelSetorOpen, setLabelSetorOpen] = useState(false);

  useEffect(() => {
    if (unidadeId && setorId) {
      fetchData();
    }
  }, [unidadeId, setorId]);

  async function fetchData() {
    if (!unidadeId) return;
    setLoading(true);
    // setError(''); // Assuming setError is defined elsewhere or removed
    try {
      // 1. Buscar info do setor
      if (setorId !== 'unassigned') {
        const { data: sData, error: sErr } = await supabase
          .from('cliente_setores_producao')
          .select('id, nome')
          .eq('id', setorId)
          .single();
        if (sErr) throw sErr;
        setSetor(sData);
      } else {
        setSetor({ id: 'unassigned', nome: 'Sem Setor Atribuído' });
      }

      // 2. Buscar itens de OPs ativas para este setor
      let query = supabase
        .from('producao_ordens_itens')
        .select(`
          id,
          receita_id,
          ordem_id,
          setor_producao_id,
          quantidade_planejada,
          quantidade_produzida,
          receitas ( nome, modo_preparo, rendimento_total_g, peso_embalagem_g ),
          producao_ordens ( id, codigo, titulo, status, data_prevista )
        `)
        .in('producao_ordens.status', ['PLANEJADA', 'SEPARADA', 'EM_PRODUCAO'])
      const { data: itensData, error: itensErr } = await query;
      if (itensErr) throw itensErr;

      const validItens = (itensData as any[]).filter(i => i.producao_ordens);

      // Agrupar por Ordem de Produção
      const agroupped: Record<string, { ordem: any, itens: ItemProducao[] }> = {};
      validItens.forEach(item => {
        const oId = item.ordem_id;
        if (!agroupped[oId]) {
          agroupped[oId] = {
            ordem: item.producao_ordens,
            itens: []
          };
        }
        agroupped[oId].itens.push(item);
      });

      setItensPorOrdem(agroupped);

      // 3. Buscar info da unidade para etiquetas
      const { data: uData } = await supabase.from('cliente_unidades').select('*').eq('id', unidadeId).single();
      setUnidadeInfo(uData);

    } catch (err: any) {
      console.error(err);
      // setError('Erro ao carregar dados do setor.'); // Assuming setError is defined elsewhere or removed
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE RESERVA DE INSUMOS ---

  function getFatorConversao(unidade: string): number {
    const u = unidade?.toLowerCase().trim() || 'g';
    if (['kg', 'l', 'litro', 'litros'].includes(u)) return 1000;
    if (u === 'mg') return 0.001;
    return 1;
  }

  const handleOpenReservaOP = async (op: any) => {
    setSelectedOPForReserva(op);
    setReservaOPDialogOpen(true);
    setLoadingReserva(true);
    try {
      // 1. Buscar requisições da OP
      const { data: reqs, error: reqErr } = await supabase
        .from('producao_requisicoes')
        .select(`
          *,
          ingredientes ( id, nome, grupo_estoque_id ),
          ingredientes_grupos ( id, nome )
        `)
        .eq('ordem_id', op.id);
      
      if (reqErr) throw reqErr;

      // 2. Buscar Saldo de Estoque Atual (Live) para cada item/grupo
      const { data: stockLevels } = await supabase
        .from('lotes_estoque')
        .select('quantidade_atual_g_ml, ingrediente_id, unidade_peso_embalagem, ingredientes(grupo_estoque_id)')
        .eq('unidade_id', unidadeId as string)
        .neq('status', 'REJEITADO')
        .neq('status', 'PREVISTO')
        .is('deleted_at', null);

      const stockBalanceMap: Record<string, number> = {};
      (stockLevels || []).forEach((s: any) => {
        const key = s.ingredientes?.grupo_estoque_id || s.ingrediente_id;
        if (key) {
          stockBalanceMap[key] = (stockBalanceMap[key] || 0) + Number(s.quantidade_atual_g_ml || 0);
        }
      });

      const formattedReqs = (reqs || []).map(r => {
        const key = (r.ingredientes?.grupo_estoque_id || r.ingrediente_id) as string;
        return {
          ...r,
          saldo_estoque_live: key ? (stockBalanceMap[key] || 0) : 0
        };
      });

      setRequisicoesOP(formattedReqs);
    } catch (err) {
      console.error('Erro ao buscar requisitos:', err);
    } finally {
      setLoadingReserva(false);
    }
  };

  const openAlocarLotesManual = async (req: any) => {
    setAlocacaoManualReq(req);
    setLotesSugestao([]);
    try {
      const { data: itemBanco } = await supabase
        .from('ingredientes')
        .select('id, grupo_estoque_id')
        .eq('id', req.ingrediente_id)
        .single();
        
      let filterValue: any = req.ingrediente_id;
      if (itemBanco?.grupo_estoque_id) {
        const { data: itensDoGrupo } = await supabase
          .from('ingredientes')
          .select('id')
          .eq('grupo_estoque_id', itemBanco.grupo_estoque_id);
        if (itensDoGrupo && itensDoGrupo.length > 0) {
          filterValue = itensDoGrupo.map(i => i.id);
        }
      }

      const { data: lotes, error } = await supabase
        .from('lotes_estoque')
        .select('*, ingredientes(nome, id), fornecedores(razao_social)')
        .gt('quantidade_atual_g_ml', 0)
        .in('status', ['APROVADO', 'QUARENTENA'])
        .in('ingrediente_id', (Array.isArray(filterValue) ? filterValue : [filterValue]) as string[])
        .order('data_validade_rotulo', { ascending: true });

      if (error) throw error;

      let faltaG = req.qtd_necessaria_g - req.qtd_separada_g;
      const suggs = (lotes || []).map(lote => {
        const usarG = Math.max(0, Math.min(lote.quantidade_atual_g_ml, faltaG));
        faltaG = Math.max(0, faltaG - usarG);
        
        const isKgL = lote.quantidade_atual_g_ml >= 1000 || (lote.unidade_peso_embalagem === 'KG' || lote.unidade_peso_embalagem === 'L');
        const weightUnit = isKgL ? 'KG_L' : 'G_ML';
        
        // Determinar se podemos usar modo EMBALAGEM
        const hasWeightPerPackage = !!lote.peso_unitario_embalagem;
        const defaultMode = hasWeightPerPackage ? 'EMBALAGEM' : 'PESO';

        // Cálculo de embalagens
        const factorBase = (lote.unidade_peso_embalagem === 'KG' || lote.unidade_peso_embalagem === 'L') ? 1000 : 1;
        const weightPerPackageG = (lote.peso_unitario_embalagem || 0) * factorBase;
        const embalagensAUsar = weightPerPackageG >= 1 ? Math.floor(usarG / weightPerPackageG) : 0;
        const disponivelEmbalagens = weightPerPackageG >= 1 ? Math.floor(lote.quantidade_atual_g_ml / weightPerPackageG) : 0;

        return {
          lote_id: lote.id,
          codigo: lote.numero_lote_fabricante,
          ingrediente_nome: lote.ingredientes?.nome,
          validade: lote.data_validade_rotulo || '',
          qtd_disponivel_g: lote.quantidade_atual_g_ml,
          qtd_a_usar_g: usarG,
          
          inputMode: defaultMode,
          unidadePeso: weightUnit,
          qtd_a_usar_original: Number((usarG / (weightUnit === 'KG_L' ? 1000 : 1)).toFixed(3)),
          qtd_embalagens_a_usar: embalagensAUsar,
          
          peso_unitario_g: weightPerPackageG,
          label_unidade_original: lote.unidade_peso_embalagem || (isKgL ? 'Kg' : 'g'),
          disponivelEmbalagens: disponivelEmbalagens,
          originalLote: lote
        };
      });
      setLotesSugestao(suggs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmarReservaManual = async () => {
    if (!alocacaoManualReq || !selectedOPForReserva) return;
    setSalvandoReserva(true);
    try {
      const activeUser = (await supabase.auth.getUser()).data.user;
      const lotesParaReservar = lotesSugestao.filter(l => l.qtd_a_usar_g > 0);

      if (lotesParaReservar.length > 0) {
        const payload = lotesParaReservar.map(l => ({
          requisicao_id: alocacaoManualReq.id,
          estoque_lote_id: l.lote_id,
          quantidade_reservada_g: l.qtd_a_usar_g,
          status: 'RESERVADO',
          reservado_por: activeUser?.id
        }));
        const { error: resErr } = await supabase.from('producao_reservas_estoque').insert(payload);
        if (resErr) throw resErr;

        const totalReservadoG = lotesParaReservar.reduce((acc, l) => acc + l.qtd_a_usar_g, 0);
        const novaSeparadaG = alocacaoManualReq.qtd_separada_g + totalReservadoG;
        const novoStatus = novaSeparadaG >= alocacaoManualReq.qtd_necessaria_g ? 'SEPARADO' : 'PENDENTE';

        await supabase
          .from('producao_requisicoes')
          .update({ qtd_separada_g: novaSeparadaG, status: novoStatus })
          .eq('id', alocacaoManualReq.id);
      }
      setAlocacaoManualReq(null);
      handleOpenReservaOP(selectedOPForReserva); // Refresh reqs list
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar reserva manual.');
    } finally {
      setSalvandoReserva(false);
    }
  };

  const handleSmartAllocateOP = async (op: any) => {
    setLoadingReserva(true);
    try {
      const { data: reqs } = await supabase
        .from('producao_requisicoes')
        .select(`*, ingredientes(id, nome, grupo_estoque_id)`)
        .eq('ordem_id', op.id);
      
      if (!reqs) return;

      const draft: any[] = [];

      for (const req of reqs) {
        let faltaG = req.qtd_necessaria_g - (req.qtd_separada_g ?? 0);
        if (faltaG <= 0.1) continue;

        let filterValue: any = req.ingrediente_id;
        if (req.ingredientes?.grupo_estoque_id) {
          const { data: members } = await supabase
            .from('ingredientes')
            .select('id')
            .eq('grupo_estoque_id', req.ingredientes.grupo_estoque_id);
          if (members && members.length > 0) filterValue = members.map(m => m.id);
        }

        const { data: availableLots } = await supabase
          .from('lotes_estoque')
          .select('*, ingredientes(nome)')
          .gt('quantidade_atual_g_ml', 0)
          .in('status', ['APROVADO', 'QUARENTENA'])
          .in('ingrediente_id', Array.isArray(filterValue) ? filterValue : [filterValue])
          .order('data_validade_rotulo', { ascending: true });

        if (!availableLots) continue;

        for (const lote of availableLots) {
          if (faltaG <= 0.1) break;
          const usable = Math.min(lote.quantidade_atual_g_ml, faltaG);
          draft.push({
            req_id: req.id,
            ing_nome: lote.ingredientes?.nome || req.ingredientes?.nome,
            lote_id: lote.id,
            lote_codigo: lote.numero_lote_fabricante,
            qtd_g: usable,
            validade: lote.data_validade_rotulo
          });
          faltaG -= usable;
        }
      }

      setSmartAllocationDraft(draft);
      setShowSmartDraft(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao calcular alocação sugerida.');
    } finally {
      setLoadingReserva(false);
    }
  };

  const confirmSmartAllocation = async () => {
    if (!smartAllocationDraft || !selectedOPForReserva) return;
    setSalvandoReserva(true);
    try {
      const activeUser = (await supabase.auth.getUser()).data.user;
      
      // 1. Inserir reservas
      const inserts = smartAllocationDraft.map((d: any) => ({
        requisicao_id: d.req_id,
        estoque_lote_id: d.lote_id,
        quantidade_reservada_g: d.qtd_g,
        status: 'RESERVADO',
        reservado_por: activeUser?.id
      }));
      
      const { error: insErr } = await supabase.from('producao_reservas_estoque').insert(inserts);
      if (insErr) throw insErr;

      // 2. Atualizar requisições
      const reqIds = Array.from(new Set(smartAllocationDraft.map((d: any) => d.req_id))) as string[];
      for (const rid of reqIds) {
        const { data: currentReq } = await supabase.from('producao_requisicoes').select('qtd_separada_g, qtd_necessaria_g').eq('id', rid as string).single();
        const allocatedForReq = smartAllocationDraft.filter((d: any) => d.req_id === rid).reduce((acc: number, d: any) => acc + d.qtd_g, 0);
        const novaQtd = (Number(currentReq?.qtd_separada_g) || 0) + allocatedForReq;
        const novoStatus = novaQtd >= (Number(currentReq?.qtd_necessaria_g) || 0) ? 'SEPARADO' : 'PENDENTE';
        await supabase.from('producao_requisicoes').update({ qtd_separada_g: novaQtd, status: novoStatus }).eq('id', rid as string);
      }

      // 3. Verificar se a OP pode ir para 'SEPARADA'
      const { data: allReqs } = await supabase.from('producao_requisicoes').select('status').eq('ordem_id', selectedOPForReserva.id as string);
      if (allReqs && allReqs.every(r => r.status === 'SEPARADO')) {
        await supabase.from('producao_ordens').update({ status: 'SEPARADA' }).eq('id', selectedOPForReserva.id as string);
      }

      setShowSmartDraft(false);
      setSmartAllocationDraft(null);
      await handleOpenReservaOP(selectedOPForReserva);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alocação sugerida.');
    } finally {
      setSalvandoReserva(false);
    }
  };

  const handleOpenExecucao = async (item: ItemProducao) => {
    setSelectedItem(item);
    setQtdProduzida(item.quantidade_planejada - item.quantidade_produzida);
    setSobra(0);
    setResto(0);
    setLoadingReqs(true);
    
    try {
      // 1. Buscar a composição da receita (ingredientes que compõem o produto)
      const { data: comp, error: compErr } = await supabase
        .from('composicao_receitas')
        .select('id, item_id, item_type, peso_liquido_g')
        .eq('receita_id', item.receita_id);

      if (compErr) throw compErr;

      // 2. Buscar nomes dos itens (ingredientes ou receitas filhas)
      const ingIds = (comp || []).filter(c => c.item_type === 'ingrediente').map(c => c.item_id);
      const recIds = (comp || []).filter(c => c.item_type === 'receita').map(c => c.item_id);

      const [ingRes, recRes] = await Promise.all([
        ingIds.length > 0 ? supabase.from('ingredientes').select('id, nome').in('id', ingIds) : Promise.resolve({ data: [] }),
        recIds.length > 0 ? supabase.from('receitas').select('id, nome').in('id', recIds) : Promise.resolve({ data: [] })
      ]);

      const nameMap = new Map();
      (ingRes.data || []).forEach((i: any) => nameMap.set(i.id.toString(), i.nome));
      (recRes.data || []).forEach((r: any) => nameMap.set(r.id.toString(), r.nome));

      // 3. Buscar as requisições originais da OP para ter contexto de status do estoque
      const { data: reqs, error: reqsErr } = await supabase
        .from('producao_requisicoes')
        .select('ingrediente_id, grupo_estoque_id, qtd_separada_g, qtd_necessaria_g')
        .eq('ordem_id', item.ordem_id);

      if (reqsErr) throw reqsErr;

      // 4. Calcular o fator de escala baseado na regra da indústria:
      // Fator = (Qtd de produtos na OP * Peso de cada embalagem) / Rendimento base da receita
      const totalPesoDesejadoG = item.quantidade_planejada * (item.receitas.peso_embalagem_g || 0);
      const yieldBase = item.receitas.rendimento_total_g || 1;
      const factor = totalPesoDesejadoG / yieldBase;

      // 5. Montar a lista de insumos específicos
      const computedReqs = (comp || []).map(c => {
        const itemIdStr = c.item_id?.toString();
        const reqMatch = reqs?.find(r => r.ingrediente_id?.toString() === itemIdStr || r.grupo_estoque_id?.toString() === itemIdStr);
        
        return {
          id: c.id,
          ingrediente_id: c.item_id,
          nome: nameMap.get(itemIdStr) || 'Insumo',
          ingredientes: { nome: nameMap.get(itemIdStr) || 'Insumo' }, // Compatibilidade com JSX anterior
          qtd_necessaria_g: (c.peso_liquido_g || 0) * factor,
          qtd_separada_g: reqMatch ? ((reqMatch.qtd_separada_g ?? 0) * ((c.peso_liquido_g * factor) / (reqMatch.qtd_necessaria_g || 1))) : 0 
        };
      });

      setRequisicoes(computedReqs as any[]);
    } catch (err) {
      console.error('Erro ao buscar composição:', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleSaveProducao = async () => {
    if (!selectedItem) return;
    setSalvando(true);
    try {
      const novaQtd = Number(selectedItem.quantidade_produzida) + Number(qtdProduzida);
      await supabase
        .from('producao_ordens_itens')
        .update({ quantidade_produzida: novaQtd })
        .eq('id', selectedItem.id);

      // Registro simplificado apenas de quantidade produzida
      setSelectedItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produção.');
    } finally {
      setSalvando(false);
    }
  };

  async function handleOpenSobrasOP(op: any) {
    setSelectedOPForSobras(op);
    setLoadingOPReqs(true);
    setSavingStage('FORM');
    setSavedRecords([]);
    try {
      // 1. Insumos da OP
      const { data: reqs } = await (supabase as any)
        .from('producao_requisicoes')
        .select(`
          *,
          ingredientes ( id, nome, grupo_estoque_id ),
          ingredientes_grupos ( id, nome )
        `)
        .eq('ordem_id', op.id);
      
      setOpRequisicoes(reqs || []);

      // 2. Buscar perdas já registradas para esta OP
      const { data: perdas } = await (supabase as any)
        .from('producao_perdas')
        .select('*')
        .eq('ordem_producao_id', op.id);
      
      setExistingPerdas(perdas || []);

      // 3. Buscar Locais e Setores para destinos
      const { data: locaisData } = await (supabase as any).from('cliente_locais_estoque').select('id, nome').eq('unidade_id', unidadeId).eq('ativo', true);
      const { data: setoresData } = await (supabase as any).from('cliente_setores_producao').select('id, nome').eq('cliente_id', activeClientId).eq('ativo', true);
      
      setLocais(locaisData || []);
      setSetores(setoresData || []);

      // Reset states
      setSobrasInsumos({});
      setSobrasProdutos({});
      setSobrasDestinos({});

      // 4. Inicializar estado de sobras de produtos
      const opItens = itensPorOrdem[op.id]?.itens || [];
      const initialProdSobras: Record<string, { sobra: number, resto: number }> = {};
      opItens.forEach(item => {
        initialProdSobras[item.id] = { sobra: 0, resto: 0 };
      });
      setSobrasProdutos(initialProdSobras);

    } catch (err) {
      console.error('Erro ao pesquisar sobras da OP:', err);
    } finally {
      setLoadingOPReqs(false);
    }
  }

  const handleSaveSobrasOP = async () => {
    if (!selectedOPForSobras) return;
    setSalvando(true);
    try {
      const recordsToLabel: any[] = [];

      // 1. Salvar sobras de insumos
      const insumoEntries = Object.entries(sobrasInsumos).filter(([_, val]) => val > 0);
      for (const [ingredienteId, val] of insumoEntries) {
        const destino = sobrasDestinos[ingredienteId];
        if (!destino?.id) {
          alert('Por favor, selecione o destino para todos os itens com sobra.');
          setSalvando(false);
          return;
        }

        const { data: inserted, error } = await (supabase as any).from('producao_perdas').insert({
          unidade_id: unidadeId,
          ingrediente_id: ingredienteId,
          ordem_producao_id: selectedOPForSobras.id,
          quantidade_perdida: val,
          tipo_perda: 'SOBRA',
          motivo_perda: 'Sobra de insumo na OP',
          destino_id: destino.id,
          tipo_destino: destino.type
        }).select().single();

        if (error) throw error;
        
        const reqItem = opRequisicoes.find(r => (r.ingrediente_id || r.grupo_estoque_id) === ingredienteId);
        recordsToLabel.push({
          ...inserted,
          nome: reqItem?.ingredientes?.nome || reqItem?.ingredientes_grupos?.nome,
          type: 'INSUMO',
          item: reqItem?.ingredientes || reqItem?.ingredientes_grupos
        });
      }

      // 2. Salvar sobras e restos de produtos
      for (const itemId in sobrasProdutos) {
        const data = sobrasProdutos[itemId];
        const itemProd = itensPorOrdem[selectedOPForSobras.id]?.itens.find(i => i.id === itemId);
        const destino = sobrasDestinos[itemId];

        if (data.sobra > 0) {
          if (!destino?.id) {
            alert('Por favor, selecione o destino para todos os produtos com sobra.');
            setSalvando(false);
            return;
          }

          const { data: inserted, error } = await (supabase as any).from('producao_perdas').insert({
            unidade_id: unidadeId,
            item_ordem_id: itemId,
            ordem_producao_id: selectedOPForSobras.id,
            quantidade_perdida: data.sobra,
            tipo_perda: 'SOBRA',
            motivo_perda: 'Sobra de produto na OP',
            destino_id: destino.id,
            tipo_destino: destino.type
          }).select().single();

          if (error) throw error;
          recordsToLabel.push({
            ...inserted,
            nome: itemProd?.receitas?.nome,
            type: 'PRODUTO',
            item: itemProd?.receitas
          });
        }
        if (data.resto > 0) {
          await (supabase as any).from('producao_perdas').insert({
            unidade_id: unidadeId,
            item_ordem_id: itemId,
            ordem_producao_id: selectedOPForSobras.id,
            quantidade_perdida: data.resto,
            tipo_perda: 'RESTO',
            motivo_perda: 'Resto/Descarte de produto na OP'
          });
        }
      }

      setSavedRecords(recordsToLabel);
      setSavingStage('SUMMARY');
      alert('Sobras e restos registrados com sucesso! Você pode imprimir as etiquetas agora.');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'PGRST204' || err?.message?.includes('destino_id')) {
        alert('Erro de Banco de Dados: A coluna "destino_id" não foi encontrada na tabela "producao_perdas". Por favor, execute o SQL de migração fornecido para atualizar seu banco de dados.');
      } else {
        alert('Erro ao salvar sobras. Verifique a conexão ou o console do navegador.');
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => router.push('/producao')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ChefHat size={16} /> Produção
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>{setor?.nome}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/producao')} sx={{ bgcolor: 'action.hover' }}>
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
              Setor: {setor?.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize e aponte a produção por Ordem de Produção.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<Tag size={20} />}
          onClick={() => setLabelSetorOpen(true)}
          sx={{ 
            fontWeight: 'bold', 
            borderRadius: 2, 
            px: 3, 
            py: 1.5,
            boxShadow: theme.shadows[4]
          }}
        >
          Gerar Etiqueta
        </Button>
      </Box>

      {/* {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>} */} {/* Assuming error state is defined elsewhere or removed */}

      {Object.keys(itensPorOrdem).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <History size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">Nenhuma produção ativa para este setor.</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => router.push('/producao')}>Voltar ao Dashboard</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Object.values(itensPorOrdem).map(({ ordem, itens }) => (
            <Grid item xs={12} key={ordem.id}>
              <Accordion 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                  mb: 2
                }}
              >
                <AccordionSummary 
                  expandIcon={<ChevronRight size={20} />}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, width: '100%', pr: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {ordem.titulo || 'Sem Título'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '600' }}>
                          #{ordem.codigo}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'none', md: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} /> Previsão: {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : '-'}
                      </Typography>

                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        startIcon={<Scan size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSmartAllocateOP(ordem);
                        }}
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      >
                        Reserva Inteligente
                      </Button>

                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        startIcon={<ClipboardList size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReservaOP(ordem);
                        }}
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      >
                        Reservar Insumos
                      </Button>

                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<Layers size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSobrasOP(ordem);
                        }}
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      >
                        Sobras/Perdas
                      </Button>
                      <Chip 
                        label={ordem.status} 
                        size="small" 
                        color={ordem.status === 'EM_PRODUCAO' ? 'info' : (ordem.status === 'SEPARADA' ? 'success' : 'default')} 
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {itens.map((item, idx) => {
                      const progress = (item.quantidade_produzida / item.quantidade_planejada) * 100;
                      return (
                        <Box key={item.id}>
                          <ListItemButton sx={{ p: 3 }} onClick={() => handleOpenExecucao(item)}>
                            <Grid container alignItems="center" spacing={2}>
                              <Grid item xs={12} md={5}>
                                <Typography variant="subtitle1" fontWeight="bold">{item.receitas?.nome}</Typography>
                                <Typography variant="caption" color="text.secondary">Receita ID: {item.receita_id}</Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={progress} 
                                      sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.3) }} 
                                    />
                                  </Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {item.quantidade_produzida} / {item.quantidade_planejada}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="success"
                                  startIcon={<Play size={14} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenExecucao(item);
                                  }}
                                >
                                  Apontar
                                </Button>
                              </Grid>
                            </Grid>
                          </ListItemButton>
                          {idx < itens.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Execução (Simplificado) */}
      <Dialog open={!!selectedItem} onClose={() => !salvando && setSelectedItem(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Play size={24} color={theme.palette.success.main} />
          Apontamento: {selectedItem?.receitas?.nome}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History size={20} /> Insumos Necessários
              </Typography>
              {loadingReqs ? (
                <CircularProgress size={24} />
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pedido</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Disponível</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requisicoes.map((req) => {
                        const falta = req.qtd_necessaria_g - req.qtd_separada_g;
                        
                        // Função helper local para seguir a regra do usuário de > 1000
                        const formatarDinamico = (valor_g: number) => {
                          if (valor_g >= 1000) {
                            // Se terminou em 'L' ou 'ml' originalmente (ou se preferir genérico)
                            // Aqui vamos assumir Kg/L para > 1000.
                            const valorConvertido = valor_g / 1000;
                            return `${valorConvertido.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/L`;
                          }
                          return `${Math.round(valor_g)} g/ml`;
                        };

                        return (
                          <TableRow key={req.id}>
                            <TableCell>{req.nome || req.ingredientes?.nome || 'Item Desconhecido'}</TableCell>
                            <TableCell align="right">
                              {formatarDinamico(req.qtd_necessaria_g)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: falta > 0.1 ? 'warning.main' : 'success.main', fontWeight: 'bold' }}>
                              {formatarDinamico(req.qtd_separada_g)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedItem?.receitas?.modo_preparo && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChefHat size={20} /> Modo de Preparo
                  </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.secondary.main, 0.03), 
                      border: '1px solid', 
                      borderColor: alpha(theme.palette.secondary.main, 0.1),
                      borderRadius: 2,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <Typography variant="body2">{selectedItem.receitas.modo_preparo}</Typography>
                  </Paper>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Registrar Produção</Typography>
                <TextField 
                  label="Quantidade Produzida"
                  type="number"
                  fullWidth
                  value={qtdProduzida}
                  onChange={(e) => setQtdProduzida(Number(e.target.value))}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  O registro de sobras e desperdícios agora é feito diretamente no cabeçalho da Ordem de Produção.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            variant="text" 
            color="primary" 
            startIcon={<Info size={18} />}
            onClick={() => router.push(`/receitas/${selectedItem?.receita_id}`)}
          >
            Ver Detalhes da Receita
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setSelectedItem(null)} variant="outlined">Cancelar</Button>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
              onClick={handleSaveProducao}
              disabled={salvando || qtdProduzida <= 0}
            >
              Confirmar Produção
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Novo Diálogo de Sobras da OP (Consolidado) */}
      <Dialog open={!!selectedOPForSobras} onClose={() => !salvando && setSelectedOPForSobras(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', flexDirection: 'column', pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Layers size={24} color={theme.palette.secondary.main} />
            <Typography variant="h6" fontWeight="bold">Sobras e Perdas: OP {selectedOPForSobras?.codigo}</Typography>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={execucaoTab} 
              onChange={(_, v) => setExecucaoTab(v)}
              variant="fullWidth"
            >
              <Tab icon={<Layers size={18} />} label="Sobras de Insumos" iconPosition="start" />
              <Tab icon={<Trash2 size={18} />} label="Sobras/Restos de Produtos" iconPosition="start" />
            </Tabs>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 400 }}>
          {savingStage === 'SUMMARY' ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Sobras registradas com sucesso! Imprima as etiquetas abaixo para identificação.
              </Alert>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qtd</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Etiqueta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedRecords.map((rec, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{rec.nome}</TableCell>
                        <TableCell align="right">{formatarQuantidade(rec.quantidade_perdida)}</TableCell>
                        <TableCell align="center">
                          <EtiquetaPrinter 
                            dados={{
                              empresa: { razaoSocial: 'Unidade Produção', cnpj: '', enderecoResumido: '', enderecoCompleto: '' },
                              produto: { 
                                nome: rec.nome, 
                                lote: rec.type === 'INSUMO' ? 'SOBRA-INS' : (selectedOPForSobras?.codigo || 'SOBRA-PROD'),
                                peso: formatarQuantidade(rec.quantidade_perdida),
                                marcaForn: rec.type === 'INSUMO' ? 'SOBRA' : 'PRÓPRIA',
                                tipoArmazenamento: 'Refrigerado'
                              },
                              datas: { manipulacao: new Date(), validadeOriginal: new Date(), validadeFinal: addDays(new Date(), 2) },
                              rastreabilidade: { idInterno: rec.id?.substring(0,8) || 'QUICK', responsavel: userName }
                            }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <>
              {execucaoTab === 0 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Informe a quantidade e o destino dos insumos que sobraram desta OP.
                  </Alert>
                  {loadingOPReqs ? (
                    <CircularProgress size={24} />
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qtd. Sobra (g/ml)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Destino de Armazenamento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {opRequisicoes.map((req) => {
                            const ingId = req.ingrediente_id || req.grupo_estoque_id;
                            const isReg = existingPerdas.some(p => p.ingrediente_id === ingId && p.tipo_perda === 'SOBRA');
                            
                            return (
                              <TableRow key={req.id} sx={{ opacity: isReg ? 0.6 : 1, bgcolor: isReg ? 'action.hover' : 'inherit' }}>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">{req.ingredientes?.nome || req.ingredientes_grupos?.nome}</Typography>
                                    {isReg && <Chip label="Já registrado" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    type="number"
                                    size="small"
                                    disabled={isReg}
                                    value={sobrasInsumos[ingId] || ''}
                                    onChange={(e) => setSobrasInsumos({
                                      ...sobrasInsumos,
                                      [ingId]: Number(e.target.value)
                                    })}
                                    placeholder="0"
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    disabled={isReg || !(sobrasInsumos[ingId] > 0)}
                                    value={sobrasDestinos[ingId]?.id || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const type = setores.some(s => s.id === val) ? 'SETOR' : 'LOCAL';
                                      setSobrasDestinos({ ...sobrasDestinos, [ingId]: { id: val, type } });
                                    }}
                                    SelectProps={{ native: true }}
                                  >
                                    <option value="">Selecione o destino...</option>
                                    <optgroup label="Locais de Estoque">
                                      {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                                    </optgroup>
                                    <optgroup label="Setores de Produção">
                                      {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </optgroup>
                                  </TextField>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {execucaoTab === 1 && (
                <Box>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Informe sobras aproveitáveis e descarte de cada produto.
                  </Alert>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sobra (g/ml)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Resto (g/ml)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Destino Sobra</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(itensPorOrdem[selectedOPForSobras?.id]?.itens || []).map((item) => {
                          const isReg = existingPerdas.some(p => p.item_ordem_id === item.id && p.tipo_perda === 'SOBRA');
                          
                          return (
                            <TableRow key={item.id} sx={{ opacity: isReg ? 0.6 : 1, bgcolor: isReg ? 'action.hover' : 'inherit' }}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">{item.receitas?.nome}</Typography>
                                  {isReg && <Chip label="Já registrado" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  disabled={isReg}
                                  value={sobrasProdutos[item.id]?.sobra || ''}
                                  onChange={(e) => setSobrasProdutos({
                                    ...sobrasProdutos,
                                    [item.id]: { ...sobrasProdutos[item.id], sobra: Number(e.target.value) }
                                  })}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  disabled={isReg}
                                  value={sobrasProdutos[item.id]?.resto || ''}
                                  onChange={(e) => setSobrasProdutos({
                                    ...sobrasProdutos,
                                    [item.id]: { ...sobrasProdutos[item.id], resto: Number(e.target.value) }
                                  })}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell>
                                  <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    disabled={isReg || !(sobrasProdutos[item.id]?.sobra > 0)}
                                    value={sobrasDestinos[item.id]?.id || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const type = setores.some(s => s.id === val) ? 'SETOR' : 'LOCAL';
                                      setSobrasDestinos({ ...sobrasDestinos, [item.id]: { id: val, type } });
                                    }}
                                    SelectProps={{ native: true }}
                                  >
                                    <option value="">Selecione o destino...</option>
                                    <optgroup label="Locais de Estoque">
                                      {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                                    </optgroup>
                                    <optgroup label="Setores de Produção">
                                      {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                    </optgroup>
                                  </TextField>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {savingStage === 'SUMMARY' ? (
            <Button onClick={() => setSelectedOPForSobras(null)} variant="contained" color="primary">Concluir e Fechar</Button>
          ) : (
            <>
              <Button onClick={() => setSelectedOPForSobras(null)} variant="outlined" disabled={salvando}>Cancelar</Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                onClick={handleSaveSobrasOP}
                disabled={salvando || (Object.values(sobrasInsumos).every(v => v <= 0) && Object.values(sobrasProdutos).every(v => v.sobra <= 0 && v.resto <= 0))}
              >
                Confirmar e Salvar Tudo
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* QuickEtiquetaDialog Integration */}
      {quickEtiqueta && (
        <Dialog 
          open={quickEtiqueta.open} 
          onClose={() => setQuickEtiqueta(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tag size={20} /> Gerar Etiqueta de Sobra
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Item:</Typography>
                <Typography variant="h6" fontWeight="bold">{quickEtiqueta.item?.nome}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Peso/Quantidade (g/ml)"
                  fullWidth
                  type="number"
                  value={quickEtiqueta.peso}
                  onChange={(e) => setQuickEtiqueta({ ...quickEtiqueta, peso: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data de Validade"
                  fullWidth
                  type="date"
                  defaultValue={format(addDays(new Date(), quickEtiqueta.type === 'INSUMO' ? 3 : 2), 'yyyy-MM-dd')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                 <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, display: 'flex', justifyContent: 'center' }}>
                    {/* Mocked DadosEtiqueta for Preview */}
                    <EtiquetaPreview dados={{
                      empresa: { razaoSocial: 'Unidade Produção', cnpj: '', enderecoResumido: '', enderecoCompleto: '' },
                      produto: { 
                        nome: quickEtiqueta.item?.nome, 
                        lote: quickEtiqueta.type === 'INSUMO' ? 'SOBRA-INS' : (quickEtiqueta.loteOrOp?.codigo || 'SOBRA-PROD'),
                        peso: formatarQuantidade(quickEtiqueta.peso),
                        marcaForn: quickEtiqueta.type === 'INSUMO' ? 'SOBRA' : 'PRÓPRIA',
                        tipoArmazenamento: 'Refrigerado'
                      },
                      datas: { manipulacao: new Date(), validadeOriginal: new Date(), validadeFinal: addDays(new Date(), 2) },
                      rastreabilidade: { idInterno: 'QUICK', responsavel: userName }
                    }} />
                 </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuickEtiqueta(null)}>Cancelar</Button>
            <EtiquetaPrinter 
              dados={{
                empresa: { razaoSocial: 'Unidade Produção', cnpj: '', enderecoResumido: '', enderecoCompleto: '' },
                produto: { 
                  nome: quickEtiqueta.item?.nome, 
                  lote: quickEtiqueta.type === 'INSUMO' ? 'SOBRA-INS' : (quickEtiqueta.loteOrOp?.codigo || 'SOBRA-PROD'),
                  peso: formatarQuantidade(quickEtiqueta.peso),
                  marcaForn: quickEtiqueta.type === 'INSUMO' ? 'SOBRA' : 'PRÓPRIA',
                  tipoArmazenamento: 'Refrigerado'
                },
                datas: { manipulacao: new Date(), validadeOriginal: new Date(), validadeFinal: addDays(new Date(), 2) },
                rastreabilidade: { idInterno: 'QUICK', responsavel: userName }
              }} 
            />
          </DialogActions>
        </Dialog>
      )}
      {/* Dialog de Reserva de Insumos da OP (Manual) */}
      <Dialog open={reservaOPDialogOpen} onClose={() => setReservaOPDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ClipboardList size={24} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight="bold">Reservar Insumos: {selectedOPForReserva?.titulo || selectedOPForReserva?.codigo}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingReserva ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Necessário</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Alocado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Estoque Atual</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requisicoesOP.map((req) => {
                    const falta = req.qtd_necessaria_g - req.qtd_separada_g;
                    const isOk = falta <= 0.1;
                    const stockLow = req.saldo_estoque_live < falta;
                    
                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">{req.ingredientes?.nome || req.ingredientes_grupos?.nome}</Typography>
                          {req.ingredientes_grupos && <Typography variant="caption" color="text.secondary">Grupo: {req.ingredientes_grupos.nome}</Typography>}
                        </TableCell>
                        <TableCell align="right">{formatarQuantidade(req.qtd_necessaria_g)}</TableCell>
                        <TableCell align="right" sx={{ color: isOk ? 'success.main' : 'warning.main', fontWeight: 'bold' }}>
                          {formatarQuantidade(req.qtd_separada_g)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: stockLow ? 'error.main' : 'text.primary' }}>
                          {formatarQuantidade(req.saldo_estoque_live)}
                        </TableCell>
                        <TableCell align="center">
                          {!isOk ? (
                            <Button size="small" variant="outlined" onClick={() => openAlocarLotesManual(req)}>Alocar</Button>
                          ) : (
                            <Chip icon={<Check size={14} />} label="Completo" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReservaOPDialogOpen(false)} variant="outlined">Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Alocação de Lotes (Manual) */}
      <Dialog open={!!alocacaoManualReq} onClose={() => setAlocacaoManualReq(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Package size={24} color={theme.palette.secondary.main} />
          Alocar Lotes: {alocacaoManualReq?.ingredientes?.nome || alocacaoManualReq?.ingredientes_grupos?.nome}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                 <Typography variant="caption" color="text.secondary">Falta Separar:</Typography>
                 <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {alocacaoManualReq ? formatarQuantidade(alocacaoManualReq.qtd_necessaria_g - alocacaoManualReq.qtd_separada_g) : '0'}
                 </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                 <Typography variant="caption" color="text.secondary">Soma Atual das Alocações:</Typography>
                 <Typography variant="h6" fontWeight="bold" color={lotesSugestao.reduce((acc, l) => acc + l.qtd_a_usar_g, 0) >= (alocacaoManualReq?.qtd_necessaria_g || 0) - (alocacaoManualReq?.qtd_separada_g || 0) ? 'success.main' : 'warning.dark'}>
                    {formatarQuantidade(lotesSugestao.reduce((acc, l) => acc + l.qtd_a_usar_g, 0))}
                 </Typography>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Lote / Validade</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Modo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Disponível</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Reservar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lotesSugestao.map((lote, index) => {
                  const factor = lote.unidadePeso === 'KG_L' ? 1000 : 1;
                  
                  return (
                  <TableRow key={lote.lote_id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{lote.codigo}</Typography>
                      <Typography variant="caption" color="text.secondary">Vence em: {lote.validade ? format(parseISO(lote.validade), 'dd/MM/yyyy') : 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <ToggleButtonGroup
                        value={lote.inputMode}
                        exclusive
                        size="small"
                        onChange={(e, val) => {
                          if (!val) return;
                          const newList = [...lotesSugestao];
                          newList[index].inputMode = val;
                          setLotesSugestao(newList);
                        }}
                      >
                        <ToggleButton value="PESO" sx={{ py: 0.2, px: 1, fontSize: '0.65rem' }}>Peso</ToggleButton>
                        <ToggleButton 
                          value="EMBALAGEM" 
                          disabled={!lote.peso_unitario_g}
                          sx={{ py: 0.2, px: 1, fontSize: '0.65rem' }}
                        >
                          Emb.
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell align="right">
                      {lote.inputMode === 'EMBALAGEM' ? (
                        <Typography variant="body2">{lote.disponivelEmbalagens} emb.</Typography>
                      ) : (
                        <Typography variant="body2">{formatarQuantidade(lote.qtd_disponivel_g)}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField 
                            size="small"
                            type="number"
                            value={lote.inputMode === 'EMBALAGEM' ? lote.qtd_embalagens_a_usar : lote.qtd_a_usar_original}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const newList = [...lotesSugestao];
                              if (lote.inputMode === 'EMBALAGEM') {
                                newList[index].qtd_embalagens_a_usar = val;
                                newList[index].qtd_a_usar_g = val * (lote.peso_unitario_g || 0);
                                // Sincroniza o peso original
                                const targetUnitFactor = lote.unidadePeso === 'KG_L' ? 1000 : 1;
                                newList[index].qtd_a_usar_original = Number((newList[index].qtd_a_usar_g / targetUnitFactor).toFixed(3));
                              } else {
                                newList[index].qtd_a_usar_original = val;
                                const currentFactor = lote.unidadePeso === 'KG_L' ? 1000 : 1;
                                newList[index].qtd_a_usar_g = val * currentFactor;
                                // Sincroniza embalagens se possível
                                if (lote.peso_unitario_g && lote.peso_unitario_g > 0) {
                                  newList[index].qtd_embalagens_a_usar = Math.floor(newList[index].qtd_a_usar_g / lote.peso_unitario_g);
                                }
                              }
                              setLotesSugestao(newList);
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button 
                                    size="small" 
                                    onClick={() => {
                                      const newList = [...lotesSugestao];
                                      // Buscar quanto ainda falta para a requisição inteira, 
                                      // mas limitado ao que tem disponível neste lote.
                                      const jaAlocadoG = lotesSugestao.reduce((sum, item, idx) => idx === index ? sum : sum + item.qtd_a_usar_g, 0);
                                      const faltaTotalG = (alocacaoManualReq?.qtd_necessaria_g || 0) - (alocacaoManualReq?.qtd_separada_g || 0);
                                      const aindaFaltaG = Math.max(0, faltaTotalG - jaAlocadoG);
                                      const podeAlocarG = Math.min(lote.qtd_disponivel_g, aindaFaltaG);
                                      
                                      newList[index].qtd_a_usar_g = podeAlocarG;
                                      
                                      const targetUnitFactor = lote.unidadePeso === 'KG_L' ? 1000 : 1;
                                      newList[index].qtd_a_usar_original = Number((podeAlocarG / targetUnitFactor).toFixed(3));
                                      
                                      if (lote.peso_unitario_g && lote.peso_unitario_g > 0) {
                                        newList[index].qtd_embalagens_a_usar = Math.floor(podeAlocarG / lote.peso_unitario_g);
                                      }
                                      setLotesSugestao(newList);
                                    }}
                                    sx={{ minWidth: 'auto', p: '2px 4px', fontSize: '0.65rem' }}
                                  >
                                    Máx
                                  </Button>
                                </InputAdornment>
                              )
                            }}
                            sx={{ width: 140 }}
                          />
                          {lote.inputMode === 'PESO' && (
                             <TextField
                                select
                                size="small"
                                value={lote.unidadePeso}
                                onChange={(e) => {
                                  const newUnit = e.target.value as 'G_ML' | 'KG_L';
                                  const newList = [...lotesSugestao];
                                  const currentG = lotesSugestao[index].qtd_a_usar_g;
                                  newList[index].unidadePeso = newUnit;
                                  newList[index].qtd_a_usar_original = Number((currentG / (newUnit === 'KG_L' ? 1000 : 1)).toFixed(3));
                                  setLotesSugestao(newList);
                                }}
                                sx={{ width: 80 }}
                             >
                               <MenuItem value="G_ML">g/ml</MenuItem>
                               <MenuItem value="KG_L">Kg/L</MenuItem>
                             </TextField>
                          )}
                        </Box>
                        {lote.inputMode === 'EMBALAGEM' && lote.peso_unitario_g > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            = {formatarQuantidade(lote.qtd_a_usar_g)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAlocacaoManualReq(null)} variant="outlined">Cancelar</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleConfirmarReservaManual}
            disabled={salvandoReserva || lotesSugestao.every(l => l.qtd_a_usar_g <= 0)}
            startIcon={salvandoReserva ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
          >
            Salvar Reserva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Smart Allocation */}
      <Dialog open={showSmartDraft} onClose={() => setShowSmartDraft(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Scan size={24} color={theme.palette.info.main} />
          Confirmar Alocação Sugerida
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
            A alocação inteligente identificou os seguintes lotes (FEFO) para sua OP:
          </Typography>
          <List dense={true}>
            {smartAllocationDraft?.map((d: any, i: number) => (
              <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.03), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">{d.ing_nome}</Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">+{formatarQuantidade(d.qtd_g)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Lote: {d.lote_codigo}</Typography>
                  <Typography variant="caption" color="text.secondary">Validade: {d.validade ? format(parseISO(d.validade), 'dd/MM/yyyy') : 'N/A'}</Typography>
                </Box>
              </Box>
            ))}
          </List>
          {(!smartAllocationDraft || smartAllocationDraft.length === 0) && (
            <Alert severity="warning">Não foram encontrados lotes disponíveis para os insumos faltantes desta OP.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowSmartDraft(false)} variant="outlined">Cancelar</Button>
          <Button 
            variant="contained" 
            color="info" 
            onClick={confirmSmartAllocation}
            disabled={salvandoReserva || !smartAllocationDraft || smartAllocationDraft.length === 0}
            startIcon={salvandoReserva ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={18} />}
          >
            Confirmar Alocação
          </Button>
        </DialogActions>
      </Dialog>
      {/* Novo Diálogo: Gerador de Etiqueta Autônomo */}
      <SetorLabelGenerator 
        open={labelSetorOpen}
        onClose={() => setLabelSetorOpen(false)}
        unidadeInfo={unidadeInfo}
        userName={userName}
        activeClientId={activeClientId}
        setor={setor}
      />
    </Container>
  );
}

// Sub-componente para o Gerador de Etiqueta do Setor
function SetorLabelGenerator({ open, onClose, unidadeInfo, userName, activeClientId, setor }: any) {
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Campos do Form
  const [peso, setPeso] = useState<string>('');
  const [unidade, setUnidade] = useState<string>('kg');
  const [conservacao, setConservacao] = useState<'AMBIENTE' | 'RESFRIADO' | 'CONGELADO'>('AMBIENTE');
  const [dataManipulacao, setDataManipulacao] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [validade, setValidade] = useState<string>(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [qtdEtiquetas, setQtdEtiquetas] = useState<number>(1);
  const [locais, setLocais] = useState<any[]>([]);
  const [localDestino, setLocalDestino] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [labelsProntas, setLabelsProntas] = useState<DadosEtiqueta[]>([]);

  // Carregar opções iniciais e locais ao abrir
  useEffect(() => {
    if (open) {
      fetchOptions('');
    }
  }, [open]);

  useEffect(() => {
    if (open && unidadeInfo?.id) {
      fetchDestinos();
    }
  }, [open, unidadeInfo?.id]);

  async function fetchDestinos() {
    try {
      // 1. Locais de Estoque (apenas categoria ALIMENTOS)
      const { data: locs } = await supabase
        .from('cliente_locais_estoque')
        .select('id, nome, categorias_permitidas')
        .eq('unidade_id', unidadeInfo?.id)
        .eq('ativo', true)
        .contains('categorias_permitidas', ['ALIMENTOS']);
      
      const combined = [
        ...(locs || []).map(l => ({ id: l.id, nome: `[ESTOQUE] ${l.nome}`, tipo: 'LOCAL' }))
      ];

      // 2. Adicionar o Setor Atual como primeira opção se existir
      if (setor?.id) {
        combined.unshift({ id: setor.id, nome: `[PERMANECER NO SETOR] ${setor.nome}`, tipo: 'SETOR' });
        // Set default dest to sector if not set
        if (!localDestino) setLocalDestino(setor.id);
      }

      setLocais(combined);
    } catch (err) {
      console.error('Erro ao buscar destinos:', err);
    }
  }

  // Atualizar validade sugerida ao mudar conservação
  useEffect(() => {
    if (!dataManipulacao) return;
    const baseDate = new Date(dataManipulacao);
    let daysToAdd = 3; // Padrão Portaria 2619 p/ resfriados
    if (conservacao === 'AMBIENTE') daysToAdd = 7;
    if (conservacao === 'CONGELADO') daysToAdd = 90;
    
    setValidade(format(addDays(baseDate, daysToAdd), 'yyyy-MM-dd'));
  }, [conservacao, dataManipulacao]);

  const fetchOptions = async (query: string) => {
    setLoading(true);
    try {
      // 1. Buscar Insumos
      let insQuery = supabase
        .from('ingredientes')
        .select('id, nome')
        .is('deleted_at', null)
        .order('nome', { ascending: true })
        .limit(20);

      if (query) {
        insQuery = insQuery.ilike('nome', `%${query}%`);
      }

      const { data: insumos } = await insQuery;

      // 2. Buscar Receitas (Preparações)
      let recQuery = supabase
        .from('receitas')
        .select('id, nome')
        .is('deleted_at', null)
        .order('nome', { ascending: true })
        .limit(20);

      if (query) {
        recQuery = recQuery.ilike('nome', `%${query}%`);
      }

      const { data: fichas } = await recQuery;

      const combined = [
        ...(insumos || []).map(i => ({ ...i, tipo: 'INSUMO' })),
        ...(fichas || []).map(f => ({ ...f, tipo: 'PREPARAÇÃO' }))
      ];
      setOptions(combined);
    } catch (err) {
      console.error('Erro ao buscar itens:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateBatchLabels = async () => {
    if (!selectedItem || !peso || !localDestino) {
      alert('Por favor, preencha o item, o peso e o local de destino.');
      return;
    }

    setSalvando(true);
    try {
      const internalSupplierId = '89894db9-1255-46ae-8efc-94e4d1eca737'; // "PRODUÇÃO PRÓPRIA"
      const labelsToPrint: DadosEtiqueta[] = [];
      const recordsToInsert = [];

      // Cálculo de fator de conversão para gramas/ml (base do sistema)
      const multiplier = (unidade.toLowerCase() === 'kg' || unidade.toLowerCase() === 'l') ? 1000 : 1;
      const amountG = Number(peso.replace(',', '.')) * multiplier;

      if (isNaN(amountG)) {
        alert('O peso informado é inválido.');
        setSalvando(false);
        return;
      }

      for (let i = 0; i < qtdEtiquetas; i++) {
        // Gerar ID Único de Lote
        const now = new Date();
        const loteCode = `LPM-${format(now, 'yyyyMMdd-HHmm')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const internalId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const label: DadosEtiqueta = {
          empresa: {
            razaoSocial: unidadeInfo?.razao_social || 'Unidade Produção',
            cnpj: unidadeInfo?.cnpj || '',
            enderecoResumido: unidadeInfo?.endereco || '',
            enderecoCompleto: unidadeInfo?.endereco || ''
          },
          produto: {
            nome: selectedItem.nome,
            lote: loteCode,
            marcaForn: 'PRODUÇÃO PRÓPRIA',
            peso: `${peso}${unidade.toLowerCase()}`,
            tipoArmazenamento: conservacao
          },
          datas: {
            manipulacao: new Date(dataManipulacao),
            validadeOriginal: new Date(dataManipulacao),
            validadeFinal: new Date(validade + 'T23:59:59')
          },
          rastreabilidade: {
            idInterno: internalId,
            responsavel: userName || 'OPERADOR',
            codigoRef: 'AUTONOMO'
          }
        };

        labelsToPrint.push(label);

        const destItem = locais.find(l => l.id === localDestino);

        recordsToInsert.push({
          cliente_id: activeClientId,
          unidade_id: unidadeInfo?.id,
          ingrediente_id: selectedItem.tipo === 'INSUMO' ? selectedItem.id : null,
          receita_id: selectedItem.tipo === 'PREPARAÇÃO' ? selectedItem.id : null,
          fornecedor_id: internalSupplierId,
          numero_lote_fabricante: loteCode,
          data_fabricacao: format(new Date(dataManipulacao), 'yyyy-MM-dd'),
          data_validade_rotulo: validade,
          quantidade_inicial_g_ml: amountG,
          quantidade_atual_g_ml: amountG,
          status: 'APROVADO' as "APROVADO" | "QUARENTENA" | "REJEITADO" | "VENCIDO" | "PREVISTO",
          local_estoque_id: destItem?.tipo === 'LOCAL' ? localDestino : null,
          observacoes: destItem?.tipo === 'SETOR' ? `Permanecer no setor: ${setor?.nome || 'Produção'}` : null,
          categoria_produto: selectedItem.tipo
        });
      }

      // 1. Inserir todos no banco via RPC ou insert normal (loop por segurança se lote for grande, mas aqui é pequeno)
      const { error: insErr } = await supabase.from('lotes_estoque').insert(recordsToInsert as any[]);
      if (insErr) throw insErr;

      setLabelsProntas(labelsToPrint);
      alert(`${qtdEtiquetas} etiqueta(s) registrada(s) no estoque. Clique em 'IMPRIMIR' para finalizar.`);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar etiquetas em lote.');
    } finally {
      setSalvando(false);
    }
  };

  const currentPreviewData: DadosEtiqueta | null = selectedItem ? {
    empresa: {
      razaoSocial: unidadeInfo?.razao_social || 'Unidade Produção',
      cnpj: unidadeInfo?.cnpj || '',
      enderecoResumido: unidadeInfo?.endereco || '',
      enderecoCompleto: unidadeInfo?.endereco || ''
    },
    produto: {
      nome: selectedItem.nome,
      lote: 'LPM-PREVIEW',
      marcaForn: 'PRODUÇÃO PRÓPRIA',
      peso: `${peso}${unidade.toLowerCase()}`,
      tipoArmazenamento: conservacao
    },
    datas: {
      manipulacao: new Date(dataManipulacao),
      validadeOriginal: new Date(dataManipulacao),
      validadeFinal: new Date(validade + 'T23:59:59')
    },
    rastreabilidade: {
      idInterno: 'PREVIEW',
      responsavel: userName || 'OPERADOR',
      codigoRef: 'AUTONOMO'
    }
  } : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tag size={24} /> Gerar Etiqueta de Autonomia (Manipulação/Sobra)
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Lado Esquerdo: Formulário */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              <Autocomplete
                open={searchOpen}
                onOpen={() => setSearchOpen(true)}
                onClose={() => setSearchOpen(false)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => `[${option.tipo}] ${option.nome}`}
                options={options}
                loading={loading}
                onChange={(_, val) => setSelectedItem(val)}
                onInputChange={(event, newInputValue) => {
                  fetchOptions(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar Insumo ou Preparação"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <ChefHat size={18} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <Fragment>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </Fragment>
                      ),
                    }}
                  />
                )}
              />

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">MODO DE CONSERVAÇÃO</Typography>
                <ToggleButtonGroup
                  value={conservacao}
                  exclusive
                  onChange={(_, val) => val && setConservacao(val)}
                  fullWidth
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  <ToggleButton value="AMBIENTE" sx={{ fontWeight: 'bold' }}>Ambiente</ToggleButton>
                  <ToggleButton value="RESFRIADO" sx={{ fontWeight: 'bold' }}>Resfriado</ToggleButton>
                  <ToggleButton value="CONGELADO" sx={{ fontWeight: 'bold' }}>Congelado</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">OPÇÕES DE ETIQUETAGEM</Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <TextField 
                      label="Quantidade de Etiquetas"
                      type="number"
                      fullWidth
                      value={qtdEtiquetas}
                      onChange={(e) => setQtdEtiquetas(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      select
                      label="Destino (Estoque ou Setor)"
                      fullWidth
                      value={localDestino}
                      onChange={(e) => setLocalDestino(e.target.value)}
                    >
                      {locais.map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.nome}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField 
                    label="Valor Peso/Qtd"
                    fullWidth
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ex: 500"
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    select
                    label="Unidade"
                    fullWidth
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                  >
                    <MenuItem value="g">Grama (g)</MenuItem>
                    <MenuItem value="kg">Quilo (kg)</MenuItem>
                    <MenuItem value="ml">Mililitro (ml)</MenuItem>
                    <MenuItem value="L">Litro (L)</MenuItem>
                    <MenuItem value="unid">Unidade</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    label="Data de Manipulação"
                    type="datetime-local"
                    fullWidth
                    value={dataManipulacao}
                    onChange={(e) => setDataManipulacao(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Validade Calculada"
                type="date"
                fullWidth
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Limitada pelo modo de conservação."
              />
            </Stack>
          </Grid>

          {/* Lado Direito: Preview */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="text.secondary">PRÉ-VISUALIZAÇÃO (PRIMEIRA ETIQUETA)</Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#000', 0.05), borderRadius: 2, display: 'flex', justifyContent: 'center' }}>
              {currentPreviewData ? (
                <EtiquetaPreview dados={currentPreviewData} />
              ) : (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
                  <Typography variant="body2" color="text.secondary italic">
                    Selecione um item para visualizar a etiqueta
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        {labelsProntas.length > 0 ? (
          <EtiquetaPrinter 
            dados={labelsProntas} 
            onPrintSuccess={onClose}
          />
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={salvando ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={generateBatchLabels}
            disabled={salvando || !selectedItem || !peso || !localDestino}
          >
            {salvando ? 'Processando...' : `Registrar Lotes (${qtdEtiquetas})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

