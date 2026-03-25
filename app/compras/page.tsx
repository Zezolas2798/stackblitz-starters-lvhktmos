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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ShoppingCart, FileText, Package, ChevronDown, ChevronRight,
  Hash, Plus, Trash2, Save, Upload, CheckCircle, Clock, Edit2, XCircle,
  Droplets, Wrench, Box as BoxIcon, Shield, User, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';
import { Fornecedor } from '@/lib/types';
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';
import { processNFFile } from '@/lib/utils/nf-parser';

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
  precoTotal: string; // [NEW] Preço pago por toda essa quantidade
  descricaoNF?: string; // [NEW] Descrição original que veio da nota fiscal
  unidadeNF?: string; // [NEW] Unidade original da nota fiscal
}

export default function ComprasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState<RequisicaoFalta[]>([]);
  const [error, setError] = useState('');

  // --- NF UPLOAD STATE ---
  const [modalidade, setModalidade] = useState<'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS'>('ALIMENTOS');
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorNf, setFornecedorNf] = useState<Fornecedor | null>(null);
  const [numNf, setNumNf] = useState('');
  const [dataNf, setDataNf] = useState(''); 
  const [dataVencimentoNf, setDataVencimentoNf] = useState(''); 
  const [valorTotalNfLido, setValorTotalNfLido] = useState<number | null>(null); 

  useEffect(() => {
    // Evita erro de hidratação
    setDataNf(new Date().toISOString().split('T')[0]);
  }, []);
  const [nfItens, setNfItens] = useState<NfItem[]>([
    { tempId: '1', ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '' }
  ]);
  const [salvandoNf, setSalvandoNf] = useState(false);
  const [nfSucesso, setNfSucesso] = useState(false);
  const [historicoNfs, setHistoricoNfs] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string, nf?: string, fornecedor?: string, type: 'ITEM' | 'NF' } | null>(null);
  const [filtroMes, setFiltroMes] = useState(format(new Date(), 'yyyy-MM'));

  // --- QUICK INGREDIENTE DIALOG ---
  const [modalOpen, setModalOpen] = useState(false);
  const [termoBuscaIngrediente, setTermoBuscaIngrediente] = useState('');
  const [nfItemToLink, setNfItemToLink] = useState<string | null>(null);

  // --- OCR STATE ---
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

    const { data: matData } = await (supabase as any)
      .from('materiais')
      .select('id, nome, marca, tipo_material, preco_ultima_compra, custo_medio')
      .eq('cliente_id', activeClientId)
      .is('ativo', true)
      .order('nome');
    if (matData) setMateriais(matData);

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
      unidadePeso: 'KG', precoTotal: '', descricaoNF: '', unidadeNF: ''
    }]);
  };

  const handleRemoveNfItem = (tempId: string) => {
    setNfItens(nfItens.filter(i => i.tempId !== tempId));
  };

  const handleNfItemChange = (tempId: string, field: keyof NfItem, value: string) => {
    setNfItens(nfItens.map(i => {
      if (i.tempId !== tempId) return i;
      
      // Se mudar para UN, limpa o peso unitário e define como '1' internamente (via disabled no render)
      if (field === 'unidadePeso' && value === 'UN') {
        return { ...i, [field]: value, pesoUnitario: '1' };
      }
      return { ...i, [field]: value };
    }));
  };

  // Auto-fill marca when ingredient selected
  // Auto-fill marca when ingredient or material selected
  const handleIngredienteSelect = (tempId: string, itemId: string, overrideItem?: any) => {
    let marca = '';
    let pesoU = '';
    let unPeso = 'KG';

    if (modalidade === 'ALIMENTOS') {
      const ing = overrideItem || ingredientes.find(i => i.id === itemId);
      marca = ing?.fonte || '';
      pesoU = ing?.peso_unitario_g ? (ing.peso_unitario_g >= 1000 ? (ing.peso_unitario_g / 1000).toString() : ing.peso_unitario_g.toString()) : '';
      unPeso = (ing?.peso_unitario_g && ing.peso_unitario_g >= 1000) ? 'KG' : (ing?.peso_unitario_g ? 'G' : 'KG');
    } else {
      const mat = overrideItem || materiais.find(m => m.id === itemId);
      marca = mat?.marca || '';
      pesoU = '1';
      unPeso = (mat?.unidade_medida?.toUpperCase() === 'UN' || mat?.unidade_medida?.toUpperCase() === 'UNID') ? 'UN' : (mat?.unidade_medida || 'UN'); 
    }

    setNfItens(prev => prev.map(i => {
      if (i.tempId !== tempId) return i;
      return {
        ...i,
        ingrediente_id: itemId, // Em caso de material usaremos essa property para temporário e depois separamos
        marca,
        pesoUnitario: pesoU,
        unidadePeso: unPeso
      };
    }));
  };

  // Handle ingredient created via QuickIngredienteDialog
  const handleIngredienteCriado = (novoItem: any) => {
    if (modalidade === 'ALIMENTOS') {
      setIngredientes(prev => [novoItem, ...prev]);
    } else {
      setMateriais(prev => [novoItem, ...prev]);
    }
    
    // If we have a target NF item, auto-select the new ingredient
    if (nfItemToLink) {
      handleIngredienteSelect(nfItemToLink, novoItem.id, novoItem);
      setNfItemToLink(null);
    }
  };

  // Build grouped ingredient options: requisitions first, then all
  const ingredienteSugestoes = useMemo(() => {
    const sugestoes: { id: string; nome: string; fonte?: string; marca?: string; group: string }[] = [];

    if (modalidade === 'ALIMENTOS') {
      const reqIngIds = new Set<string>();

      // From requisitions (FALTA_ESTOQUE) — show ingredients that belong to the groups or specific
      requisicoes.forEach(req => {
        if (req.ingrediente_id && !reqIngIds.has(req.ingrediente_id)) {
          reqIngIds.add(req.ingrediente_id);
          sugestoes.push({
            id: req.ingrediente_id,
            nome: req.ingredientes?.nome || 'Desconhecido',
            group: '📋 Requisições'
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
            group: '📋 Requisições'
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
            group: '📦 Insumos Disponíveis'
          });
        }
      });
    } else {
      // Outras Modalidades
      const mapTipo: any = {
        'EMBALAGENS': 'EMBALAGEM',
        'LIMPEZA': 'LIMPEZA',
        'UTENSILIOS': 'UTENSILIO',
        'MANUTENCAO': 'MANUTENCAO',
        'EPI_EPC': 'EPI_EPC',
        'UNIFORMES': 'UNIFORME',
        'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
        'OUTROS': 'OUTROS'
      };
      const alvo = mapTipo[modalidade];
      materiais.filter(m => m.tipo_material === alvo).forEach(mat => {
        sugestoes.push({
          id: mat.id,
          nome: mat.nome,
          marca: mat.marca || '',
          group: '📦 Materiais Disponíveis'
        });
      });
    }

    return sugestoes;
  }, [ingredientes, materiais, requisicoes, modalidade]);

  // OCR / File upload handler
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsReadingOcr(true);
    
    try {
      const parsed = await processNFFile(file);
      
      if (!parsed) {
        alert('Não foi possível extrair dados deste arquivo.');
        return;
      }

      // 1. Tentar auto-selecionar o fornecedor pelo CNPJ ou Nome
      if (parsed.fornecedorCnpj || parsed.fornecedorNome) {
        const cleanCnpj = (c: string) => c.replace(/\D/g, '');
        const targetCnpj = parsed.fornecedorCnpj ? cleanCnpj(parsed.fornecedorCnpj) : '';

        const match = listaFornecedores.find(f => {
          const fCnpj = f.cnpj ? cleanCnpj(f.cnpj) : '';
          const cnpjMatch = targetCnpj && fCnpj === targetCnpj;
          const nomeMatch = parsed.fornecedorNome && f.razao_social && 
            f.razao_social.toLowerCase().includes(parsed.fornecedorNome.toLowerCase());
          return cnpjMatch || nomeMatch;
        });
        if (match) setFornecedorNf(match);
      }

      // 2. Preencher dados da nota e totais
      if (parsed.numero) setNumNf(parsed.numero);
      if (parsed.valorTotalNf) setValorTotalNfLido(parsed.valorTotalNf);
      
      if (parsed.dataEmissao && typeof parsed.dataEmissao === 'string') {
        const d = parsed.dataEmissao.split('T')[0];
        setDataNf(d);
      }
      if (parsed.dataVencimento && typeof parsed.dataVencimento === 'string') {
        const dv = parsed.dataVencimento.split('T')[0];
        setDataVencimentoNf(dv);
      }

      const novosItens: NfItem[] = parsed.itens.map(item => {
        // Usuário fará o mapeamento "De/Para"
        return {
          tempId: Math.random().toString(36).slice(2, 11),
          ingrediente_id: '', // Sempre manual
          marca: '',
          qtdEmbalagens: (item.quantidade || 0).toString(),
          pesoUnitario: '', // Aguarda preenchimento
          unidadePeso: 'KG',
          precoTotal: (item.valorTotal || 0).toString(),
          descricaoNF: item.descricao || 'Item sem descrição',
          unidadeNF: item.unidade || ''
        };
      });

      if (novosItens.length > 0) {
        setNfItens(prev => {
          // Mantém itens que já foram mapeados ou que possuem descrição
          const filtered = prev.filter(i => i.ingrediente_id !== '' || i.descricaoNF);
          return [...filtered, ...novosItens];
        });
      }

    } catch (err) {
      console.error('Erro no processamento do arquivo:', err);
      alert('Erro ao ler arquivo: Escolha um formato válido (XML, PDF ou Imagem).');
    } finally {
      setIsReadingOcr(false);
      e.target.value = '';
    }
  };

  const handleSalvarNf = async () => {
    if (!fornecedorNf) {
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
      alert('Preencha os dados dos itens (Produto, Qtd e Peso). Se a unidade for UN, o peso é ignorado.');
      return;
    }

    setSalvandoNf(true);
    setNfSucesso(false);
    try {
      let valorTotalNFCalculado = 0;

      for (const item of validItens) {
        const qtdEmb = parseFloat(item.qtdEmbalagens);
        const pesoEmb = parseFloat(item.pesoUnitario);
        const precoTot = parseFloat(item.precoTotal) || 0;
        valorTotalNFCalculado += precoTot;

        let qtdGml = qtdEmb * pesoEmb;
        // Se for UN, a quantidade total é apenas o número de embalagens (unidades)
        if (item.unidadePeso === 'UN') {
          qtdGml = qtdEmb;
        } else if (item.unidadePeso === 'KG' || item.unidadePeso === 'L') {
          qtdGml *= 1000;
        }

        const payload: any = {
          unidade_id: unidadeId,
          cliente_id: activeClientId,
          fornecedor_id: fornecedorNf.id,
          numero_lote_fabricante: `NF-${numNf || 'SN'}-${Date.now().toString().slice(-4)}`,
          nota_fiscal: numNf || null,
          data_fabricacao: dataNf,
          data_validade_rotulo: null,
          quantidade_inicial_g_ml: qtdGml,
          quantidade_atual_g_ml: qtdGml,
          status: 'PREVISTO',
          qtd_embalagens: qtdEmb,
          peso_unitario_embalagem: pesoEmb,
          unidade_peso_embalagem: item.unidadePeso,
          valor_unitario: precoTot / (qtdEmb || 1), // Financeiro
          valor_total: precoTot, // Financeiro
          data_vencimento_financeiro: dataVencimentoNf || null
        };

        if (modalidade === 'ALIMENTOS') {
          payload.ingrediente_id = item.ingrediente_id;
          payload.categoria_produto = null; // Será definido no recebimento ou pelo ingrediente
        } else {
          payload.material_id = item.ingrediente_id;
          // [UPDATED] Mapeamento completo de categorias para materiais
          const materialCatMap: Record<string, string> = {
            'EMBALAGENS': 'Embalagens',
            'LIMPEZA': 'Limpeza',
            'MANUTENCAO': 'Manutenção',
            'UTENSILIOS': 'Utensílios',
            'EPI_EPC': 'EPIs/EPCs',
            'UNIFORMES': 'Uniformes',
            'PRIMEIROS_SOCORROS': 'Primeiros Socorros'
          };
          payload.categoria_produto = materialCatMap[modalidade] || 'Outros';
        }

        // NOVO: Indica que o financeiro será processado por esta função (não pelo trigger)
        payload.financeiro_processado = true;

        const { error: insertErr } = await (supabase as any).from('lotes_estoque').insert(payload);
        if (insertErr) throw insertErr;
      }

      // --- GERAR DESPESA FINANCEIRA ---
      if (valorTotalNFCalculado > 0) {
        // Tentar buscar uma categoria padrão baseada na modalidade
        const { data: contasInfo } = await (supabase as any)
          .from('fin_contas')
          .select('id, nome, codigo')
          .eq('cliente_id', activeClientId)
          .eq('tipo', 'DESPESA')
          .eq('ativo', true);

        let contaAutoId = contasInfo?.[0]?.id; // Fallback
        
        // Mapeamento Direto por Nome (mais robusto que regex genérico se as categorias foram criadas agora)
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
        if (contaMatched) contaAutoId = contaMatched.id;

        const novaTransacao = await (supabase as any)
          .from('fin_transacoes')
          .insert({
            unidade_id: unidadeId,
            data_competencia: dataNf || new Date().toISOString().split('T')[0],
            data_vencimento: dataVencimentoNf || null,
            nota_fiscal: numNf || null,
            descricao: `Compra (${modalidade.charAt(0) + modalidade.slice(1).toLowerCase()}): ${fornecedorNf.nome_fantasia || fornecedorNf.razao_social} (NF ${numNf || 'S/N'})`,
            valor_total: valorTotalNFCalculado,
            origem_modulo: 'ESTOQUE', // Usando o padrão do enum
          })
          .select('id')
          .single();

        if (novaTransacao.data?.id && contaAutoId) {
          await (supabase as any).from('fin_lancamentos').insert({
            transacao_id: novaTransacao.data.id,
            conta_id: contaAutoId,
            tipo_lancamento: 'DEBITO',
            valor: valorTotalNFCalculado
          });
        }
      }

      setNfSucesso(true);
      setNfItens([
        { tempId: Date.now().toString(), ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '', descricaoNF: '', unidadeNF: '' }
      ]);
      setNumNf('');
      setDataVencimentoNf('');

    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar NF: ' + err.message);
    } finally {
      setSalvandoNf(false);
    }
  };

  const getReqItemName = (req: RequisicaoFalta) =>
    req.grupo_estoque_id ? req.ingredientes_grupos?.nome : req.ingredientes?.nome;

  const loadHistoricoNfs = useCallback(async () => {
    if (!unidadeId) return;
    setLoadingHistorico(true);
    try {
      // Cálculo robusto do fim do mês
      const [year, month] = filtroMes.split('-').map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const endOfMonthDate = new Date(nextMonthDate.getTime() - 1);
      const endOfMonth = format(endOfMonthDate, 'yyyy-MM-dd');

      const { data, error } = await (supabase as any)
        .from('lotes_estoque')
        .select('*, ingredientes(nome), materiais(nome), fornecedores(razao_social, nome_fantasia)')
        .eq('unidade_id', unidadeId)
        .is('deleted_at', null)
        .gte('data_fabricacao', `${filtroMes}-01`)
        .lte('data_fabricacao', endOfMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por Categoria e depois por Nota Fiscal
      const cats: any = {
        'ALIMENTOS': { id: 'ALIMENTOS', nome: 'Alimentos', icon: ShoppingCart, color: theme.palette.primary.main, nfs: {} },
        'EMBALAGENS': { id: 'EMBALAGENS', nome: 'Embalagens', icon: Package, color: theme.palette.secondary.main, nfs: {} },
        'LIMPEZA': { id: 'LIMPEZA', nome: 'Produtos de Limpeza', icon: Droplets, color: theme.palette.info.main, nfs: {} },
        'MANUTENCAO': { id: 'MANUTENCAO', nome: 'Manutenção', icon: Wrench, color: theme.palette.warning.main, nfs: {} },
        'UTENSILIOS': { id: 'UTENSILIOS', nome: 'Utensílios', icon: BoxIcon, color: theme.palette.success.main, nfs: {} },
        'EPI_EPC': { id: 'EPI_EPC', nome: 'EPIs/EPCs', icon: Shield, color: theme.palette.error.main, nfs: {} },
        'UNIFORMES': { id: 'UNIFORMES', nome: 'Uniformes', icon: User, color: theme.palette.primary.light, nfs: {} },
        'PRIMEIROS_SOCORROS': { id: 'PRIMEIROS_SOCORROS', nome: 'Primeiros Socorros', icon: Activity, color: theme.palette.error.light, nfs: {} },
        'OUTROS': { id: 'OUTROS', nome: 'Outros', icon: FileText, color: theme.palette.grey[500], nfs: {} }
      };

      (data || []).forEach((lote: any) => {
        // Determinar Categoria
        let catKey = 'ALIMENTOS';
        if (lote.material_id) {
          if (lote.categoria_produto === 'Embalagens') catKey = 'EMBALAGENS';
          else if (lote.categoria_produto === 'Limpeza') catKey = 'LIMPEZA';
          else if (lote.categoria_produto === 'Manutenção') catKey = 'MANUTENCAO';
          else if (lote.categoria_produto === 'Utensílios') catKey = 'UTENSILIOS';
          else if (lote.categoria_produto === 'EPIs/EPCs') catKey = 'EPI_EPC';
          else if (lote.categoria_produto === 'Uniformes') catKey = 'UNIFORMES';
          else if (lote.categoria_produto === 'Primeiros Socorros') catKey = 'PRIMEIROS_SOCORROS';
          else catKey = 'OUTROS';
        }

        const nfKey = lote.nota_fiscal || 'S/N';
        const groupKey = `${nfKey}-${lote.fornecedor_id}`;
        
        if (!cats[catKey].nfs[groupKey]) {
          cats[catKey].nfs[groupKey] = {
            nota_fiscal: nfKey,
            fornecedor: lote.fornecedores?.nome_fantasia || lote.fornecedores?.razao_social || 'Desconhecido',
            data_emissao: lote.data_fabricacao,
            itens: [],
            statusGeral: 'RECEBIDO' // Default
          };
        }
        cats[catKey].nfs[groupKey].itens.push(lote);
        if (lote.status === 'PREVISTO') {
          cats[catKey].nfs[groupKey].statusGeral = 'AGUARDANDO';
        }
      });

      // Converter nfs de objeto para array em cada categoria
      const finalResult = Object.values(cats).map((c: any) => ({
        ...c,
        nfs: Object.values(c.nfs)
      })).filter((c: any) => c.nfs.length > 0);

      setHistoricoNfs(finalResult);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  }, [unidadeId, filtroMes, theme]);

  useEffect(() => {
    if (tabValue === 3) loadHistoricoNfs();
  }, [tabValue, loadHistoricoNfs, filtroMes]);

  const handleDeleteLote = async (id: string) => {
    setLoadingHistorico(true);
    try {
      const { error } = await (supabase as any)
        .from('lotes_estoque')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setDeleteTarget(null);
      loadHistoricoNfs();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleDeleteNF = async (nf: string, fornecedor: string) => {
    setLoadingHistorico(true);
    try {
      // Buscar lotes desta NF e fornecedor
      const { data: lotes } = await (supabase as any)
        .from('lotes_estoque')
        .select('id, fornecedor_id, fornecedores(nome_fantasia, razao_social)')
        .eq('nota_fiscal', nf)
        .eq('unidade_id', unidadeId)
        .is('deleted_at', null);
      
      const idsToDelete = lotes?.filter((l: any) => {
        const nome = l.fornecedores?.nome_fantasia || l.fornecedores?.razao_social;
        return nome === fornecedor || nf === 'S/N';
      }).map((l: any) => l.id);
      
      if (idsToDelete && idsToDelete.length > 0) {
        const { error } = await (supabase as any)
          .from('lotes_estoque')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', idsToDelete);
        if (error) throw error;
        setDeleteTarget(null);
        loadHistoricoNfs();
      }
    } catch (err: any) {
      alert('Erro ao excluir NF: ' + err.message);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleEditItemSave = async () => {
    if (!editingItem) return;
    try {
      const { error } = await (supabase as any)
        .from('lotes_estoque')
        .update({
          nota_fiscal: editingItem.nota_fiscal,
          quantidade_inicial_g_ml: parseFloat(editingItem.quantidade_inicial_g_ml),
          quantidade_atual_g_ml: parseFloat(editingItem.quantidade_inicial_g_ml), // Sincroniza se ainda PREVISTO
          valor_total: parseFloat(editingItem.valor_total),
          valor_unitario: parseFloat(editingItem.valor_total) / (editingItem.qtd_embalagens || 1)
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      setEditingItem(null);
      loadHistoricoNfs();
    } catch (err: any) {
      alert('Erro ao salvar edição: ' + err.message);
    }
  };

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
        categoriaPrincipal={modalidade}
      />

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2 }}>
            <Tab icon={<Package size={18} />} iconPosition="start" label="Lista Consolidada" sx={{ fontWeight: 'bold', minHeight: 56 }} />
            <Tab icon={<Hash size={18} />} iconPosition="start" label="Agrupado por OP" sx={{ fontWeight: 'bold', minHeight: 56 }} />
            <Tab icon={<FileText size={18} />} iconPosition="start" label="Lançar Nota Fiscal" sx={{ fontWeight: 'bold', minHeight: 56 }} />
            <Tab icon={<Clock size={18} />} iconPosition="start" label="Histórico de Notas" sx={{ fontWeight: 'bold', minHeight: 56 }} />
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
                      {isReadingOcr ? 'Processando...' : 'Importar Nota (IA/XML)'}
                      <input type="file" hidden accept="image/*,.pdf,.xml" onChange={handleOcrUpload} />
                    </Button>
                  </Tooltip>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Modalidade da Compra"
                      value={modalidade}
                      onChange={e => {
                        setModalidade(e.target.value as any);
                        setNfItens([{ tempId: Date.now().toString(), ingrediente_id: '', marca: '', qtdEmbalagens: '', pesoUnitario: '', unidadePeso: 'KG', precoTotal: '' }]);
                      }}
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="ALIMENTOS">Alimentos (Insumos)</MenuItem>
                      <MenuItem value="EMBALAGENS">Embalagens</MenuItem>
                      <MenuItem value="LIMPEZA">Produtos de limpeza</MenuItem>
                      <MenuItem value="MANUTENCAO">Manutenção</MenuItem>
                      <MenuItem value="UTENSILIOS">Utensílios</MenuItem>
                      <MenuItem value="EPI_EPC">EPIs/EPCs</MenuItem>
                      <MenuItem value="UNIFORMES">Uniformes</MenuItem>
                      <MenuItem value="PRIMEIROS_SOCORROS">Primeiros Socorros</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={9}>
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
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Vencimento Contas a Pagar"
                      type="date"
                      fullWidth
                      color="warning"
                      InputLabelProps={{ shrink: true }}
                      value={dataVencimentoNf}
                      onChange={e => setDataVencimentoNf(e.target.value)}
                    />
                  </Grid>

                  {valorTotalNfLido !== null && (
                    <Grid item xs={12}>
                      <Alert 
                        severity="info" 
                        variant="outlined" 
                        sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          borderColor: alpha(theme.palette.info.main, 0.2),
                          '& .MuiAlert-message': { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Valor Total lido da Nota Fiscal: 
                        </Typography>
                        <Typography variant="h6" color="info.main" sx={{ fontWeight: '800' }}>
                          R$ {valorTotalNfLido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
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
                    {modalidade === 'ALIMENTOS' ? 'Adicionar Insumo' : 'Adicionar Material'}
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
                      const unidFinal = item.unidadePeso === 'G' ? 'Kg' : 
                                       (item.unidadePeso === 'ML' ? 'L' : 
                                       (item.unidadePeso === 'UN' ? 'Un.' : item.unidadePeso));
                                       
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
                              {item.descricaoNF && (
                                <Box sx={{ mb: 1.5, p: 1, px: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight="bold">Extraído da Nota Fiscal:</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="warning.dark">
                                    {item.descricaoNF} {item.unidadeNF ? `(${item.unidadeNF})` : ''}
                                  </Typography>
                                </Box>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                VINCULAR AO INSUMO DO SISTEMA *
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Autocomplete
                                  fullWidth
                                  size="small"
                                  options={ingredienteSugestoes}
                                  groupBy={(option) => option.group}
                                  getOptionLabel={(option) => {
                                    if (modalidade === 'ALIMENTOS') {
                                      return `${option.nome}${option.fonte ? ` (${option.fonte})` : ''}`;
                                    }
                                    return `${option.nome}${option.marca ? ` (${option.marca})` : ''}`;
                                  }}
                                  value={ingredienteSugestoes.find(s => s.id === item.ingrediente_id) || null}
                                  onChange={(_, newVal) => {
                                    if (newVal) handleIngredienteSelect(item.tempId, newVal.id);
                                  }}
                                  onInputChange={(_, val) => setTermoBuscaIngrediente(val)}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder={modalidade === 'ALIMENTOS' ? "Busque por nome ou marca..." : "Busque pelo nome do material..."}
                                    />
                                  )}
                                  noOptionsText={modalidade === 'ALIMENTOS' ? "Nenhum ingrediente encontrado" : "Nenhum material encontrado"}
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
                            <Grid item xs={6} md={2}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Qtd. Emb.</Typography>
                              <TextField
                                type="number" size="small" fullWidth
                                value={item.qtdEmbalagens}
                                onChange={e => handleNfItemChange(item.tempId, 'qtdEmbalagens', e.target.value)}
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                            <Grid item xs={6} md={2}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Peso Unit. {item.unidadePeso !== 'UN' ? '*' : ''}
                              </Typography>
                              <TextField
                                type="number" size="small" fullWidth
                                value={item.pesoUnitario}
                                onChange={e => handleNfItemChange(item.tempId, 'pesoUnitario', e.target.value)}
                                disabled={item.unidadePeso === 'UN'}
                                error={item.unidadePeso !== 'UN' && (!item.pesoUnitario || parseFloat(item.pesoUnitario) <= 0)}
                                inputProps={{ min: 0, step: "any" }}
                                placeholder={item.unidadePeso === 'UN' ? 'N/A' : '0.000'}
                              />
                            </Grid>
                            <Grid item xs={6} md={2}>
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
                                <MenuItem value="UN">Un.</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>Preço Total na NF (R$)</Typography>
                              <TextField
                                size="small" fullWidth
                                type="number"
                                color="success"
                                value={item.precoTotal}
                                onChange={e => handleNfItemChange(item.tempId, 'precoTotal', e.target.value)}
                                placeholder="0.00"
                              />
                            </Grid>
                            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { md: 'flex-end', xs: 'flex-start' } }}>
                              <Typography variant="caption" color="text.secondary">Total Volume</Typography>
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

          {/* ──────── TAB 3: HISTÓRICO DE NOTAS ──────── */}
          {tabValue === 3 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" fontWeight="bold">Filtrar por Mês:</Typography>
                <TextField
                  type="month"
                  size="small"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  sx={{ width: 200 }}
                />
              </Box>

              {loadingHistorico ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : historicoNfs.length === 0 ? (
                <Alert severity="info">Nenhuma nota fiscal encontrada no histórico.</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {historicoNfs.map((cat: any) => (
                    <Accordion key={cat.id} defaultExpanded sx={{ borderRadius: 2, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: alpha(cat.color, 0.2) }}>
                      <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(cat.color, 0.05), borderRadius: '8px 8px 0 0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <cat.icon size={22} color={cat.color} />
                          <Typography variant="h6" fontWeight="bold" sx={{ color: cat.color }}>{cat.nome}</Typography>
                          <Chip label={cat.nfs.length} size="small" sx={{ bgcolor: cat.color, color: 'white', fontWeight: 'bold' }} />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cat.nfs.map((nf: any, idx: number) => (
                          <Accordion key={idx} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <FileText size={18} color={theme.palette.primary.main} />
                                  <Typography fontWeight="bold">NF {nf.nota_fiscal}</Typography>
                                  <Typography variant="body2" color="text.secondary">| {nf.fornecedor}</Typography>
                                  <Typography variant="caption" sx={{ ml: 2, color: 'text.disabled' }}>
                                    {nf.data_emissao ? format(parseISO(nf.data_emissao), 'dd/MM/yyyy') : 'Sem data'}
                                  </Typography>
                                  <Chip 
                                    label={nf.statusGeral === 'AGUARDANDO' ? 'Aguardando Recebimento' : 'Recebido'} 
                                    size="small"
                                    color={nf.statusGeral === 'AGUARDANDO' ? 'warning' : 'success'}
                                    sx={{ ml: 2, height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                                  />
                                </Box>
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget({ nf: nf.nota_fiscal, fornecedor: nf.fornecedor, type: 'NF' });
                                  }}
                                >
                                  <Trash2 size={16} />
                                </IconButton>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtd Inicial</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor Total</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Venc. Financeiro</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                  {nf.itens.map((lote: any) => (
                                    <TableRow key={lote.id} hover>
                                      <TableCell>
                                        <Typography variant="subtitle2">{lote.ingredientes?.nome || lote.materiais?.nome || 'Desconhecido'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{lote.numero_lote_fabricante}</Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        {(lote.quantidade_inicial_g_ml / 1000).toLocaleString('pt-BR')} {lote.unidade_peso_embalagem === 'UNID' ? 'Un' : (lote.unidade_peso_embalagem === 'L' ? 'L' : 'Kg')}
                                      </TableCell>
                                      <TableCell align="right">R$ {lote.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                      <TableCell align="center">
                                        <Typography variant="caption" fontWeight="bold" color="warning.dark">
                                          {lote.data_vencimento_financeiro ? format(parseISO(lote.data_vencimento_financeiro), 'dd/MM/yyyy') : '-'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          label={lote.status === 'PREVISTO' ? 'Aguardando' : 'Recebido'} 
                                          size="small" 
                                          color={lote.status === 'PREVISTO' ? 'warning' : 'success'} 
                                          variant="outlined" 
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                          <IconButton size="small" onClick={() => setEditingItem(lote)}><Edit2 size={14} /></IconButton>
                                          <IconButton size="small" color="error" onClick={() => setDeleteTarget({ id: lote.id, type: 'ITEM' })}><Trash2 size={14} /></IconButton>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* MODAL DE EDIÇÃO */}
              <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 'bold' }}>Editar Item da Nota</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField 
                      label="Nº Nota Fiscal" 
                      value={editingItem?.nota_fiscal || ''} 
                      onChange={e => setEditingItem({...editingItem, nota_fiscal: e.target.value})}
                      fullWidth size="small"
                    />
                    <TextField 
                      label="Quantidade Total (g/ml/un)" 
                      type="number"
                      value={editingItem?.quantidade_inicial_g_ml || ''} 
                      onChange={e => setEditingItem({...editingItem, quantidade_inicial_g_ml: e.target.value})}
                      fullWidth size="small" helperText="1kg = 1000, 1un = 1"
                    />
                    <TextField 
                      label="Valor Total (R$)" 
                      type="number"
                      value={editingItem?.valor_total || ''} 
                      onChange={e => setEditingItem({...editingItem, valor_total: e.target.value})}
                      fullWidth size="small"
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setEditingItem(null)}>Cancelar</Button>
                  <Button variant="contained" onClick={handleEditItemSave}>Salvar Alterações</Button>
                </DialogActions>
              </Dialog>

              {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
              <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <XCircle size={24} /> Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                  <Typography>
                    {deleteTarget?.type === 'NF' 
                      ? `Tem certeza que deseja excluir TODOS os itens da Nota Fiscal ${deleteTarget.nf}? Esta ação não pode ser desfeita.`
                      : 'Tem certeza que deseja excluir este item da nota fiscal?'}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    disabled={loadingHistorico}
                    onClick={() => {
                      if (deleteTarget?.type === 'NF') {
                        handleDeleteNF(deleteTarget.nf!, deleteTarget.fornecedor!);
                      } else {
                        handleDeleteLote(deleteTarget?.id!);
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

        </Box>
      </Paper>
    </Container>
  );
}
