'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Container, Tabs, Tab, Chip, useTheme, alpha, TextField, Button,
  Grid, Autocomplete, IconButton, MenuItem, Collapse, Divider, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, Stack, InputAdornment
} from '@mui/material';
import {
  ShoppingCart, FileText, Package, ChevronDown, ChevronRight, Plus, Trash2, Upload,
  CheckCircle, Clock, Edit2, Droplets, Wrench, Box as BoxIcon, Shield, User, Activity,
  Save, XCircle, Filter, Calendar, Hash, RefreshCcw, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Fornecedor } from '@/lib/types';
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';
import QuickMaterialDialog from '@/components/QuickMaterialDialog';
import PreCadastroFornecedorDialog from '@/components/PreCadastroFornecedorDialog';
import { processNFFile } from '@/lib/utils/nf-parser';

interface NfItem {
  tempId: string;
  ingrediente_id: string;
  marca: string;
  qtdEmbalagens: string;
  pesoUnitario: string;
  unidadePeso: string;
  precoTotal: string; 
  descricaoNF?: string; 
  unidadeNF?: string; 
  loteFabricante?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  caEpi?: string;
}

export default function LancamentoNotasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // --- NF UPLOAD STATE ---
  const [modalidade, setModalidade] = useState<'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS'>('ALIMENTOS');
  const [ingredienteSugestoes, setIngredienteSugestoes] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorNf, setFornecedorNf] = useState<Fornecedor | null>(null);
  const [numNf, setNumNf] = useState('');
  const [dataNf, setDataNf] = useState(new Date().toISOString().split('T')[0]); 
  const [dataVencimentoNf, setDataVencimentoNf] = useState(''); 
  const [valorTotalNfLido, setValorTotalNfLido] = useState<number | null>(null); 
  const [preCadastroOpen, setPreCadastroOpen] = useState(false);
  const [nfItens, setNfItens] = useState<NfItem[]>([
    { tempId: '1', ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '' }
  ]);
  const [salvandoNf, setSalvandoNf] = useState(false);
  const [nfSucesso, setNfSucesso] = useState(false);
  const [isReadingOcr, setIsReadingOcr] = useState(false);

  // --- HISTORICO STATE ---
  const [historicoNfs, setHistoricoNfs] = useState<any[]>([]);
  const [filtroMes, setFiltroMes] = useState(format(new Date(), 'yyyy-MM'));
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string, nf?: string, fornecedor?: string, type: 'ITEM' | 'NF' } | null>(null);

  // --- DIALOGS ---
  const [modalOpen, setModalOpen] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [nfItemToLink, setNfItemToLink] = useState<string | null>(null);

  const [buscandoInsumos, setBuscandoInsumos] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setBuscandoInsumos(true);
      try {
        if (modalidade === 'ALIMENTOS') {
          let query = (supabase as any)
            .from('ingredientes')
            .select('id, nome, marca, peso_unitario_g')
            .eq('cliente_id', activeClientId)
            .is('deleted_at', null)
            .limit(20);
            
          if (termoBuscaIngrediente) {
            query = query.ilike('nome', `%${termoBuscaIngrediente}%`);
          }
            
          const { data } = await query;
          if (data) setIngredienteSugestoes(data.map((i: any) => ({ ...i, group: '📦 Insumos Disponíveis' })));
        } else {
          const typeMap: Record<string, string> = {
            'EMBALAGENS': 'EMBALAGEM',
            'LIMPEZA': 'LIMPEZA',
            'MANUTENCAO': 'MANUTENCAO',
            'UTENSILIOS': 'UTENSILIO',
            'EPI_EPC': 'EPI_EPC',
            'UNIFORMES': 'UNIFORME',
            'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS'
          };
          const materialType = typeMap[modalidade] || 'OUTROS';
          
          let query = (supabase as any)
            .from('materiais')
            .select('id, nome, marca, tipo_material')
            .eq('cliente_id', activeClientId)
            .eq('tipo_material', materialType)
            .is('ativo', true)
            .limit(20);
            
          if (termoBuscaIngrediente) {
            query = query.ilike('nome', `%${termoBuscaIngrediente}%`);
          }
            
          const { data } = await query;
            
          const visualMap: Record<string, string> = {
            'EMBALAGEM': '📦 Embalagens',
            'LIMPEZA': '🧹 Limpeza',
            'MANUTENCAO': '🔧 Manutenção',
            'UTENSILIO': '🍴 Utensílios',
            'EPI_EPC': '🛡️ EPIs/EPCs',
            'UNIFORME': '👕 Uniformes',
            'PRIMEIROS_SOCORROS': '🚑 Primeiros Socorros'
          };
          
          if (data) {
            setIngredienteSugestoes(data.map((m: any) => ({ 
              ...m, 
              group: visualMap[m.tipo_material] || '📂 Materiais Disponíveis' 
            })));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBuscandoInsumos(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [termoBuscaIngrediente, activeClientId, modalidade]);

  const loadDados = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    try {
      const { data: fornData } = await (supabase as any)
        .from('fornecedores')
        .select('*')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null)
        .order('razao_social');
      if (fornData) setListaFornecedores(fornData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClientId]);

  useEffect(() => {
    loadDados();
  }, [loadDados]);

  const loadHistoricoNfs = useCallback(async () => {
    if (!unidadeId) return;
    setLoadingHistorico(true);
    try {
      const [year, month] = filtroMes.split('-').map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const endOfMonthDate = new Date(nextMonthDate.getTime() - 1);
      const endOfMonth = format(endOfMonthDate, 'yyyy-MM-dd');

      const { data, error } = await (supabase as any)
        .from('estoque_lotes')
        .select('*, ingredientes(nome), materiais(nome), fornecedores(razao_social, nome_fantasia)')
        .eq('unidade_id', unidadeId)
        .is('deleted_at', null)
        .gte('data_fabricacao', `${filtroMes}-01`)
        .lte('data_fabricacao', endOfMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cats: any = {
        'ALIMENTOS': { id: 'ALIMENTOS', nome: 'Alimentos', icon: ShoppingCart, color: theme.palette.primary.main, nfs: {} },
        'EMBALAGENS': { id: 'EMBALAGENS', nome: 'Embalagens', icon: Package, color: theme.palette.secondary.main, nfs: {} },
        'LIMPEZA': { id: 'LIMPEZA', nome: 'Limpeza', icon: Droplets, color: theme.palette.info.main, nfs: {} },
        'MANUTENCAO': { id: 'MANUTENCAO', nome: 'Manutenção', icon: Wrench, color: theme.palette.warning.main, nfs: {} },
        'UTENSILIOS': { id: 'UTENSILIOS', nome: 'Utensílios', icon: BoxIcon, color: theme.palette.success.main, nfs: {} },
        'EPI_EPC': { id: 'EPI_EPC', nome: 'EPIs/EPCs', icon: Shield, color: theme.palette.error.main, nfs: {} },
        'UNIFORMES': { id: 'UNIFORMES', nome: 'Uniformes', icon: User, color: theme.palette.primary.light, nfs: {} },
        'PRIMEIROS_SOCORROS': { id: 'PRIMEIROS_SOCORROS', nome: 'Primeiros Socorros', icon: Activity, color: theme.palette.error.light, nfs: {} },
        'OUTROS': { id: 'OUTROS', nome: 'Outros', icon: FileText, color: theme.palette.grey[500], nfs: {} }
      };

      (data || []).forEach((lote: any) => {
        let catKey = lote.ingrediente_id ? 'ALIMENTOS' : 'OUTROS';
        if (lote.material_id) {
          const catMap: any = { 
            'Embalagens': 'EMBALAGENS', 
            'Limpeza': 'LIMPEZA', 
            'Manutenção': 'MANUTENCAO', 
            'Utensílios': 'UTENSILIOS', 
            'EPIs/EPCs': 'EPI_EPC', 
            'Uniformes': 'UNIFORMES', 
            'Primeiros Socorros': 'PRIMEIROS_SOCORROS' 
          };
          catKey = catMap[lote.categoria_produto] || 'OUTROS';
        }

        const nfKey = lote.nota_fiscal || 'S/N';
        const groupKey = `${nfKey}-${lote.fornecedor_id}`;
        if (!cats[catKey].nfs[groupKey]) {
          cats[catKey].nfs[groupKey] = {
            nota_fiscal: nfKey,
            fornecedor: lote.fornecedores?.nome_fantasia || lote.fornecedores?.razao_social || 'Desconhecido',
            fornecedor_id: lote.fornecedor_id,
            data_emissao: lote.data_fabricacao,
            itens: [],
            statusGeral: 'RECEBIDO'
          };
        }
        cats[catKey].nfs[groupKey].itens.push(lote);
        if (lote.status === 'PREVISTO') cats[catKey].nfs[groupKey].statusGeral = 'AGUARDANDO';
      });

      setHistoricoNfs(Object.values(cats).map((c: any) => ({ 
        ...c, 
        nfs: Object.values(c.nfs) 
      })).filter(c => c.nfs.length > 0));

    } catch (err) { 
      console.error('Erro ao carregar histórico:', err); 
    } finally { 
      setLoadingHistorico(false); 
    }
  }, [unidadeId, filtroMes, theme]);

  useEffect(() => {
    if (tabValue === 1) loadHistoricoNfs();
  }, [tabValue, loadHistoricoNfs]);

  // Handlers
  const handleAddNfItem = () => setNfItens([...nfItens, { 
    tempId: Math.random().toString(36).slice(2, 11), 
    ingrediente_id: '', 
    marca: '', 
    qtdEmbalagens: '', 
    pesoUnitario: '', 
    unidadePeso: 'KG', 
    precoTotal: '' 
  }]);
  
  const handleRemoveNfItem = (id: string) => setNfItens(nfItens.filter(i => i.tempId !== id));
  
  const handleNfItemChange = (id: string, field: keyof NfItem, value: string) => {
    setNfItens(prev => prev.map(i => {
      if (i.tempId !== id) return i;
      
      // Se mudar para UN, limpa o peso unitário e define como '1'
      if (field === 'unidadePeso' && value === 'UN') {
        return { ...i, [field]: value, pesoUnitario: '1' };
      }
      return { ...i, [field]: value };
    }));
  };

  const handleIngredienteSelect = (tempId: string, itemId: string, overrideItem?: any) => {
    const item = overrideItem || ingredienteSugestoes.find(s => s.id === itemId);
    let marca = '', pesoU = '', unPeso = 'KG';
    
    if (modalidade === 'ALIMENTOS') {
      marca = item?.marca || '';
      pesoU = item?.peso_unitario_g ? (item.peso_unitario_g >= 1000 ? (item.peso_unitario_g / 1000).toString() : item.peso_unitario_g.toString()) : '';
      unPeso = (item?.peso_unitario_g && item.peso_unitario_g >= 1000) ? 'KG' : (item?.peso_unitario_g ? 'G' : 'KG');
    } else {
      marca = item?.marca || ''; 
      pesoU = '1'; 
      unPeso = 'UN';
    }
    
    setNfItens(prev => prev.map(i => i.tempId === tempId ? { 
      ...i, 
      ingrediente_id: itemId, 
      marca, 
      pesoUnitario: pesoU, 
      unidadePeso: unPeso 
    } : i));
  };

  const handleSalvarNf = async () => {
    if (!fornecedorNf || !unidadeId) {
      alert('Selecione o fornecedor.');
      return;
    }

    const validItens = nfItens.filter(i => {
      const hasBasicInfo = i.ingrediente_id && i.qtdEmbalagens;
      const isUnidade = i.unidadePeso === 'UN';
      const hasPeso = isUnidade || (i.pesoUnitario && parseFloat(i.pesoUnitario) > 0);
      return hasBasicInfo && hasPeso;
    });

    if (validItens.length === 0) {
      alert('Adicione pelo menos um item válido com quantidade e peso.');
      return;
    }

    setSalvandoNf(true);
    setNfSucesso(false);
    
    try {
      let valorTotalNFCalculado = 0;

      for (const item of validItens) {
        const qtdEmb = parseFloat(item.qtdEmbalagens);
        const pesoEmb = parseFloat(item.pesoUnitario) || 0;
        const precoTot = parseFloat(item.precoTotal) || 0;
        valorTotalNFCalculado += precoTot;

        let qtdGml = (item.unidadePeso === 'UN') ? qtdEmb : (qtdEmb * pesoEmb);
        if (['KG', 'L'].includes(item.unidadePeso)) {
          qtdGml *= 1000;
        }

        const payload: any = {
          unidade_id: unidadeId,
          cliente_id: activeClientId,
          fornecedor_id: fornecedorNf.id,
          numero_lote_fabricante: item.loteFabricante || null,
          nota_fiscal: numNf || null,
          data_fabricacao: item.dataFabricacao || null,
          data_validade: item.dataValidade || null,
          quantidade_inicial_g_ml: qtdGml,
          quantidade_atual_g_ml: qtdGml,
          status: 'PREVISTO',
          qtd_embalagens: qtdEmb,
          peso_unitario_embalagem: pesoEmb,
          unidade_peso_embalagem: item.unidadePeso,
          valor_unitario: precoTot / (qtdEmb || 1),
          valor_total: precoTot,
          data_vencimento_financeiro: dataVencimentoNf || null,
          financeiro_processado: true // Indica que o financeiro será tratado aqui
        };

        if (modalidade === 'ALIMENTOS') {
          payload.ingrediente_id = item.ingrediente_id;
        } else {
          payload.material_id = item.ingrediente_id;
          const materialCatMap: Record<string, string> = {
            'EMBALAGENS': 'Embalagens',
            'LIMPEZA': 'Limpeza',
            'MANUTENCAO': 'Manutenção',
            'UTENSILIOS': 'Utensílios',
            'EPI_EPC': 'EPIs e Segurança',
            'UNIFORMES': 'Uniformes',
            'PRIMEIROS_SOCORROS': 'Primeiros Socorros'
          };
          payload.categoria_produto = materialCatMap[modalidade] || 'Outros';
        }

        const { error: insertErr } = await (supabase as any).from('estoque_lotes').insert(payload);
        if (insertErr) throw insertErr;
      }

      // --- GERAR DESPESA FINANCEIRA ---
      if (valorTotalNFCalculado > 0) {
        const { data: contasInfo } = await (supabase as any)
          .from('fin_contas')
          .select('id, nome, codigo')
          .eq('cliente_id', activeClientId)
          .eq('tipo', 'DESPESA')
          .eq('ativo', true);

        const mapping: Record<string, string> = {
          'ALIMENTOS': 'Compras de Alimentos',
          'EMBALAGENS': 'Material de Embalagem',
          'LIMPEZA': 'Produtos de Limpeza',
          'MANUTENCAO': 'Manutenção e Reparos',
          'UTENSILIOS': 'Utensílios e Ferramentas',
          'EPI_EPC': 'Equipamentos de Proteção',
          'UNIFORMES': 'Uniformes e Vestuário',
          'PRIMEIROS_SOCORROS': 'Material de Primeiros Socorros'
        };

        const targetName = mapping[modalidade];
        const contaMatched = contasInfo?.find((c: any) => c.nome === targetName);
        const contaAutoId = contaMatched?.id || contasInfo?.[0]?.id;

        const { data: novaTransacao, error: transError } = await (supabase as any)
          .from('fin_transacoes')
          .insert({
            unidade_id: unidadeId,
            data_competencia: dataNf || new Date().toISOString().split('T')[0],
            data_vencimento: dataVencimentoNf || null,
            nota_fiscal: numNf || null,
            descricao: `Compra (${modalidade.charAt(0) + modalidade.slice(1).toLowerCase()}): ${fornecedorNf.nome_fantasia || fornecedorNf.razao_social} (NF ${numNf || 'S/N'})`,
            valor_total: valorTotalNFCalculado,
            origem_modulo: 'ESTOQUE',
          })
          .select('id')
          .single();

        if (transError) throw transError;

        if (novaTransacao && contaAutoId) {
          const { error: lancError } = await (supabase as any).from('fin_lancamentos').insert({
            transacao_id: novaTransacao.id,
            conta_id: contaAutoId,
            tipo_lancamento: 'DEBITO',
            valor: valorTotalNFCalculado
          });
          if (lancError) throw lancError;
        }
      }

      setNfSucesso(true); 
      setNfItens([{ tempId: Date.now().toString(), ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '' }]); 
      setNumNf('');
      setDataVencimentoNf('');
    } catch (e: any) { 
      console.error(e);
      alert('Erro ao salvar NF: ' + e.message); 
    } finally { 
      setSalvandoNf(false); 
    }
  };

  const handleOcrUpload = async (e: any) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    
    setIsReadingOcr(true);
    try {
      const parsed = await processNFFile(file);
      if (parsed) {
        if (parsed.fornecedorCnpj || parsed.fornecedorNome) {
          const cleanCnpj = (c: string) => c.replace(/\D/g, '');
          const targetCnpj = parsed.fornecedorCnpj ? cleanCnpj(parsed.fornecedorCnpj) : '';
          
          const match = listaFornecedores.find(f => {
            const fCnpj = f.cnpj ? cleanCnpj(f.cnpj) : '';
            return (targetCnpj && fCnpj === targetCnpj) || 
                   (parsed.fornecedorNome && f.razao_social?.toLowerCase().includes(parsed.fornecedorNome.toLowerCase()));
          });
          if (match) setFornecedorNf(match);
        }

        if (parsed.numero) setNumNf(parsed.numero);
        if (parsed.valorTotalNf) setValorTotalNfLido(parsed.valorTotalNf);
        if (parsed.dataEmissao) setDataNf(parsed.dataEmissao.split('T')[0]);
        if (parsed.dataVencimento) setDataVencimentoNf(parsed.dataVencimento.split('T')[0]);
        
        const novosItens: NfItem[] = parsed.itens.map(it => ({
           tempId: Math.random().toString(36).slice(2, 11),
           ingrediente_id: '', 
           marca: '', 
           qtdEmbalagens: it.quantidade?.toString() || '1',
           pesoUnitario: '', 
           unidadePeso: 'KG', 
           precoTotal: it.valorTotal?.toString() || '0',
           descricaoNF: it.descricao, 
           unidadeNF: it.unidade
        }));

        if (novosItens.length > 0) {
          setNfItens(prev => {
            const filtered = prev.filter(i => i.ingrediente_id !== '' || i.descricaoNF);
            return [...filtered, ...novosItens];
          });
        }
      }
    } catch (err) {
      console.error('Erro no OCR:', err);
      alert('Erro ao ler arquivo. Verifique se é um XML, PDF ou Imagem válida.');
    } finally { 
      setIsReadingOcr(false); 
      e.target.value = '';
    }
  };

  const handleDeleteNF = async (nf: string, fornName: string) => {
    setLoadingHistorico(true);
    try {
      const fornId = historicoNfs.flatMap(c => c.nfs).find(n => n.nota_fiscal === nf && n.fornecedor === fornName)?.fornecedor_id;
      if (!fornId) return;
      
      const { error } = await (supabase as any)
        .from('estoque_lotes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('nota_fiscal', nf)
        .eq('fornecedor_id', fornId)
        .eq('unidade_id', unidadeId);
        
      if (!error) { 
        setDeleteTarget(null); 
        loadHistoricoNfs(); 
      }
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleDeleteLote = async (id: string) => {
    setLoadingHistorico(true);
    try {
      const { error } = await (supabase as any).from('estoque_lotes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) { setDeleteTarget(null); loadHistoricoNfs(); }
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleEditItemSave = async () => {
    if (!editingItem) return;
    try {
      const { error } = await (supabase as any).from('estoque_lotes').update({
         nota_fiscal: editingItem.nota_fiscal,
         quantidade_inicial_g_ml: parseFloat(editingItem.quantidade_inicial_g_ml),
         quantidade_atual_g_ml: parseFloat(editingItem.quantidade_inicial_g_ml),
         valor_total: parseFloat(editingItem.valor_total),
         valor_unitario: parseFloat(editingItem.valor_total) / (editingItem.qtd_embalagens || 1)
      }).eq('id', editingItem.id);
      
      if (!error) { 
        setEditingItem(null); 
        loadHistoricoNfs(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <ShoppingCart size={32} /> Lançamento de Notas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Importe notas fiscais, vincule ao seu cadastro e sincronize automaticamente com estoque e financeiro.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: theme.shadows[1] }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2 }}>
            <Tab icon={<FileText size={18} />} iconPosition="start" label="Lançar Nota Fiscal" sx={{ fontWeight: 'bold', minHeight: 60 }} />
            <Tab icon={<Clock size={18} />} iconPosition="start" label="Histórico de Lançamentos" sx={{ fontWeight: 'bold', minHeight: 60 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* ──────── ABA 0: LANÇAMENTO ──────── */}
          {tabValue === 0 && (
            <Box>
              {nfSucesso && (
                <Alert severity="success" icon={<CheckCircle size={20} />} sx={{ mb: 4, borderRadius: 2 }} onClose={() => setNfSucesso(false)}>
                  Nota Fiscal lançada com sucesso! Os itens entraram como <strong>Recebimento Previsto</strong> e 
                  a despesa foi registrada no seu Contas a Pagar.
                </Alert>
              )}

              <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: '#f9fafb' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 800 }}>
                    <FileText size={22} /> Cabeçalho da Nota
                  </Typography>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={isReadingOcr ? <CircularProgress size={16} /> : <Upload size={18} />} 
                    disabled={isReadingOcr} 
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {isReadingOcr ? 'Lendo Arquivo (IA)...' : 'Importar (XML/PDF/Excel)'}
                    <input type="file" hidden accept="image/*,.pdf,.xml,.xls,.xlsx,.csv" onChange={handleOcrUpload} />
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      select fullWidth label="Modalidade de Compra" 
                      value={modalidade} 
                      onChange={e => { 
                        setModalidade(e.target.value as any); 
                        setNfItens([{ tempId: Date.now().toString(), ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '' }]); 
                      }}
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="ALIMENTOS">Alimentos (Cozinha)</MenuItem>
                      <MenuItem value="EMBALAGENS">Embalagens / Descartáveis</MenuItem>
                      <MenuItem value="LIMPEZA">Produtos de Limpeza</MenuItem>
                      <MenuItem value="MANUTENCAO">Manutenção / Reparos</MenuItem>
                      <MenuItem value="UTENSILIOS">Utensílios de Cozinha</MenuItem>
                      <MenuItem value="EPI_EPC">EPIs e Segurança</MenuItem>
                      <MenuItem value="UNIFORMES">Uniformes</MenuItem>
                      <MenuItem value="PRIMEIROS_SOCORROS">Primeiros Socorros</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={9} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Autocomplete 
                      fullWidth 
                      options={listaFornecedores} 
                      getOptionLabel={(o) => o.nome_fantasia || o.razao_social || 'Sem Nome'} 
                      value={fornecedorNf} 
                      onChange={(_, n) => setFornecedorNf(n)} 
                      renderInput={(p) => <TextField {...p} label="Fornecedor *" placeholder="Selecione ou busque o fornecedor..." sx={{ bgcolor: 'white' }} />} 
                    />
                    <Tooltip title="Cadastrar Novo Fornecedor">
                      <IconButton color="primary" onClick={() => setPreCadastroOpen(true)} sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', height: 48, width: 48, borderRadius: 2 }}>
                        <Plus size={24} />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Nº Nota Fiscal" fullWidth value={numNf} onChange={e => setNumNf(e.target.value)} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Data de Emissão" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dataNf} onChange={e => setDataNf(e.target.value)} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Data de Vencimento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dataVencimentoNf} onChange={e => setDataVencimentoNf(e.target.value)} color="warning" sx={{ bgcolor: 'white' }} />
                  </Grid>

                  {valorTotalNfLido !== null && (
                    <Grid item xs={12}>
                      <Alert severity="info" variant="outlined" sx={{ bgcolor: 'info.50', borderColor: 'info.200' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">Valor Total lido da Nota Fiscal:</Typography>
                          <Typography variant="h6" fontWeight="900" color="info.main">{formatoMoeda.format(valorTotalNfLido)}</Typography>
                        </Box>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Package size={22} /> Itens da Nota <Chip label={nfItens.length} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                  </Typography>
                  <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleAddNfItem} sx={{ borderRadius: 2 }}>Adicionar Item</Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {nfItens.map((item, index) => {
                    const qtd = parseFloat(item.qtdEmbalagens) || 0;
                    const peso = parseFloat(item.pesoUnitario) || 0;
                    let totalVolume = (item.unidadePeso === 'UN') ? qtd : (qtd * peso);
                    const unidExibicao = item.unidadePeso === 'G' ? 'Kg' : (item.unidadePeso === 'ML' ? 'L' : (item.unidadePeso === 'UN' ? 'Un.' : item.unidadePeso));
                    
                    if (item.unidadePeso === 'G' || item.unidadePeso === 'ML') totalVolume /= 1000;

                    return (
                      <Paper 
                        key={item.tempId} 
                        variant="outlined" 
                        sx={{ 
                          p: 3, 
                          borderRadius: 3, 
                          position: 'relative',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                        }}
                      >
                        <IconButton color="error" size="small" onClick={() => handleRemoveNfItem(item.tempId)} sx={{ position: 'absolute', top: 12, right: 12 }}>
                          <Trash2 size={20} />
                        </IconButton>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            {item.descricaoNF && (
                              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.100' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">Extraído da NF:</Typography>
                                <Typography variant="body2" fontWeight="800" color="warning.dark">{item.descricaoNF} {item.unidadeNF ? `(${item.unidadeNF})` : ''}</Typography>
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>VINCULAR AO CADASTRO DO SISTEMA *</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Autocomplete 
                                fullWidth 
                                size="small" 
                                options={ingredienteSugestoes} 
                                loading={buscandoInsumos}
                                groupBy={o => o.group} 
                                getOptionLabel={o => `${o.nome}${o.marca ? ` (${o.marca})` : ''}`} 
                                filterOptions={(x) => x} 
                                value={ingredienteSugestoes.find(s => s.id === item.ingrediente_id) || null} 
                                onChange={(_, nv) => nv && handleIngredienteSelect(item.tempId, nv.id, nv)} 
                                onInputChange={(_, v) => setTermoBuscaIngrediente(v)}
                                renderInput={p => (
                                  <TextField 
                                    {...p} 
                                    placeholder="Busque por nome ou marca..." 
                                    sx={{ bgcolor: 'white' }} 
                                    InputProps={{
                                      ...p.InputProps,
                                      endAdornment: (
                                        <>
                                          {buscandoInsumos ? <CircularProgress color="inherit" size={20} /> : null}
                                          {p.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                  />
                                )} 
                              />
                              <Tooltip title="Cadastrar Novo Item">
                                <IconButton color="primary" onClick={() => { setNfItemToLink(item.tempId); setModalOpen(true); }} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                  <Plus size={20} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold', color: 'text.secondary' }}>MARCA (OPCIONAL)</Typography>
                            <TextField size="small" fullWidth value={item.marca} onChange={e => handleNfItemChange(item.tempId, 'marca', e.target.value)} placeholder="Marca do fabricante" sx={{ bgcolor: 'white' }} />
                          </Grid>
                          
                          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                          <Grid item xs={6} md={2}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Qtd. Emb.</Typography>
                            <TextField type="number" size="small" fullWidth value={item.qtdEmbalagens} onChange={e => handleNfItemChange(item.tempId, 'qtdEmbalagens', e.target.value)} sx={{ bgcolor: 'white' }} />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Peso Unit.</Typography>
                            <TextField type="number" size="small" fullWidth value={item.pesoUnitario} onChange={e => handleNfItemChange(item.tempId, 'pesoUnitario', e.target.value)} disabled={item.unidadePeso === 'UN'} sx={{ bgcolor: 'white' }} />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Unid.</Typography>
                            <TextField select size="small" fullWidth value={item.unidadePeso} onChange={e => handleNfItemChange(item.tempId, 'unidadePeso', e.target.value)} sx={{ bgcolor: 'white' }}>
                              <MenuItem value="KG">Kg</MenuItem>
                              <MenuItem value="G">g</MenuItem>
                              <MenuItem value="L">L</MenuItem>
                              <MenuItem value="ML">ml</MenuItem>
                              <MenuItem value="UN">Un.</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold', color: 'success.main' }}>Preço Total (R$)</Typography>
                            <TextField type="number" size="small" fullWidth value={item.precoTotal} onChange={e => handleNfItemChange(item.tempId, 'precoTotal', e.target.value)} color="success" sx={{ bgcolor: 'white' }} />
                          </Grid>
                          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                             <Typography variant="caption" color="text.secondary">Volume Total</Typography>
                             <Typography variant="h6" fontWeight="900" color="primary.main">
                               {totalVolume > 0 ? `${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unidExibicao}` : '-'}
                             </Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                              <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 1 } }}>
                                <Typography variant="body2" color="primary.main" fontWeight="bold">
                                  + Informações Específicas (Opcional)
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField size="small" fullWidth label="Lote do Fabricante" value={item.loteFabricante || ''} onChange={e => handleNfItemChange(item.tempId, 'loteFabricante', e.target.value)} sx={{ bgcolor: 'white' }} />
                                  </Grid>
                                  
                                  {['ALIMENTOS', 'EMBALAGENS', 'PRIMEIROS_SOCORROS', 'LIMPEZA'].includes(modalidade) && (
                                    <>
                                      <Grid item xs={12} md={4}>
                                        <TextField size="small" fullWidth type="date" label="Data de Fabricação" InputLabelProps={{ shrink: true }} value={item.dataFabricacao || ''} onChange={e => handleNfItemChange(item.tempId, 'dataFabricacao', e.target.value)} sx={{ bgcolor: 'white' }} />
                                      </Grid>
                                      <Grid item xs={12} md={4}>
                                        <TextField size="small" fullWidth type="date" label="Data de Validade" InputLabelProps={{ shrink: true }} value={item.dataValidade || ''} onChange={e => handleNfItemChange(item.tempId, 'dataValidade', e.target.value)} sx={{ bgcolor: 'white' }} />
                                      </Grid>
                                    </>
                                  )}
                                  
                                  {modalidade === 'EPI_EPC' && (
                                    <Grid item xs={12} md={4}>
                                      <TextField size="small" fullWidth label="Número do C.A. (EPI)" value={item.caEpi || ''} onChange={e => handleNfItemChange(item.tempId, 'caEpi', e.target.value)} sx={{ bgcolor: 'white' }} />
                                    </Grid>
                                  )}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          </Grid>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="large" 
                  onClick={handleSalvarNf} 
                  disabled={salvandoNf} 
                  startIcon={salvandoNf ? <CircularProgress size={20} color="inherit" /> : <Save size={24} />}
                  sx={{ px: 6, py: 2, borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', boxShadow: 3 }}
                >
                  {salvandoNf ? 'Processando Lançamento...' : 'Finalizar Lançamento'}
                </Button>
              </Box>
            </Box>
          )}

          {/* ──────── ABA 1: HISTÓRICO ──────── */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', p: 2, bgcolor: '#fbfbfb', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Filter size={20} color={theme.palette.text.secondary} />
                  <Typography variant="body1" fontWeight="bold">Histórico por Período:</Typography>
                  <TextField type="month" size="small" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} sx={{ bgcolor: 'white' }} />
                </Box>
                <Button startIcon={<RefreshCcw size={18} />} onClick={loadHistoricoNfs} size="small">Atualizar</Button>
              </Box>

              {loadingHistorico ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
              ) : historicoNfs.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                  <Calendar size={64} style={{ marginBottom: 16 }} />
                  <Typography variant="h6">Nenhuma nota encontrada em {filtroMes}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {historicoNfs.map((cat: any) => (
                    <Accordion key={cat.id} defaultExpanded sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(cat.color, 0.2), overflow: 'hidden', boxShadow: 'none' }}>
                      <AccordionSummary expandIcon={<ChevronDown color={cat.color} />} sx={{ bgcolor: alpha(cat.color, 0.05) }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <cat.icon size={22} color={cat.color} />
                          <Typography variant="h6" fontWeight="bold" sx={{ color: cat.color }}>{cat.nome}</Typography>
                          <Chip label={cat.nfs.length} size="small" sx={{ bgcolor: cat.color, color: 'white', fontWeight: 'bold' }} />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 2, bgcolor: '#fafafa' }}>
                        {cat.nfs.map((nf: any, idx: number) => (
                          <Accordion key={idx} variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                            <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ bgcolor: 'white' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <FileText size={20} color={theme.palette.primary.main} />
                                  <Typography fontWeight="800">NF {nf.nota_fiscal}</Typography>
                                  <Typography variant="body2" color="text.secondary">| {nf.fornecedor}</Typography>
                                  <Chip 
                                    label={nf.statusGeral === 'AGUARDANDO' ? 'Recebimento Pendente' : 'Check-in Realizado'} 
                                    size="small" 
                                    color={nf.statusGeral === 'AGUARDANDO' ? 'warning' : 'success'} 
                                    sx={{ ml: 2, fontWeight: 'bold', height: 22, fontSize: '0.7rem' }} 
                                  />
                                </Box>
                                <IconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ nf: nf.nota_fiscal, fornecedor: nf.fornecedor, type: 'NF' }); }}>
                                  <Trash2 size={18} />
                                </IconButton>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Item do Sistema</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtd Lançada</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor Total</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Lote Interno</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {nf.itens.map((lote: any) => (
                                      <TableRow key={lote.id} hover>
                                        <TableCell>
                                          <Typography variant="subtitle2" fontWeight="bold">{lote.ingredientes?.nome || lote.materiais?.nome || 'Desconhecido'}</Typography>
                                          {lote.marca && <Typography variant="caption" color="text.secondary">Marca: {lote.marca}</Typography>}
                                        </TableCell>
                                        <TableCell align="right">
                                          {lote.qtd_embalagens} {lote.unidade_peso_embalagem} {lote.unidade_peso_embalagem !== 'UN' ? `x ${lote.peso_unitario_embalagem}` : ''}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formatoMoeda.format(lote.valor_total || 0)}</TableCell>
                                        <TableCell align="center"><Chip label={lote.numero_lote_fabricante} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} /></TableCell>
                                        <TableCell align="right">
                                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => setEditingItem(lote)}><Edit2 size={16} /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteTarget({ id: lote.id, type: 'ITEM' })}><Trash2 size={16} /></IconButton>
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* Modais de Exclusão e Edição */}
              <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <Trash2 size={24} /> Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                  <Typography>
                    {deleteTarget?.type === 'NF' 
                      ? `Deseja realmente excluir a Nota Fiscal ${deleteTarget.nf} do fornecedor ${deleteTarget.fornecedor}? Todos os itens associados serão removidos do estoque.`
                      : 'Deseja realmente excluir este item do lançamento?'}
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setDeleteTarget(null)} variant="outlined">Cancelar</Button>
                  <Button 
                    onClick={() => deleteTarget?.type === 'NF' ? handleDeleteNF(deleteTarget.nf!, deleteTarget.fornecedor!) : handleDeleteLote(deleteTarget?.id!)} 
                    variant="contained" 
                    color="error"
                  >
                    Excluir Permanentemente
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Item Lançado</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Nota Fiscal" fullWidth size="small" value={editingItem?.nota_fiscal || ''} onChange={e => setEditingItem({...editingItem, nota_fiscal: e.target.value})} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Qtd Total (g/ml)" type="number" fullWidth size="small" value={editingItem?.quantidade_inicial_g_ml || 0} onChange={e => setEditingItem({...editingItem, quantidade_inicial_g_ml: e.target.value})} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Valor Total (R$)" type="number" fullWidth size="small" value={editingItem?.valor_total || 0} onChange={e => setEditingItem({...editingItem, valor_total: e.target.value})} />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button onClick={() => setEditingItem(null)}>Cancelar</Button>
                  <Button onClick={handleEditItemSave} variant="contained" startIcon={<Save size={18} />}>Salvar Alterações</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialogs de Apoio */}
      {modalidade === 'ALIMENTOS' ? (
        <QuickIngredienteDialog 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          nomeSugerido={termoBuscaIngrediente} 
          onSuccess={(id, item) => {
            if (nfItemToLink) handleIngredienteSelect(nfItemToLink, id, item);
            setModalOpen(false);
            loadDados();
          }} 
        />
      ) : (
        <QuickMaterialDialog 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          nomeSugerido={termoBuscaIngrediente} 
          categoriaPrincipal={modalidade}
          onSuccess={(item) => {
            if (nfItemToLink) handleIngredienteSelect(nfItemToLink, item.id, item);
            setModalOpen(false);
            loadDados();
          }} 
        />
      )}

      <PreCadastroFornecedorDialog 
        open={preCadastroOpen} 
        onClose={() => setPreCadastroOpen(false)} 
        onSuccess={(f) => {
          setPreCadastroOpen(false);
          loadDados().then(() => setFornecedorNf(f));
        }}
      />
    </Container>
  );
}

