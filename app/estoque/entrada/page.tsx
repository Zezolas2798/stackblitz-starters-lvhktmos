'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Box, Typography, Button, Paper, TextField,
  MenuItem, Autocomplete, InputAdornment,
  FormControl, InputLabel, Select, Tooltip, Container,
  useTheme, alpha, Alert, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Tabs, Tab
} from '@mui/material';
import {
  Save, Thermometer, Scale, FileText, MapPin, Plus, History, PackageCheck, CheckCircle, ChevronLeft, Copy,
  Package, Archive, Box as BoxIcon, Shield, User, Activity, Droplets, Wrench
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Fornecedor } from '@/lib/types';
import QuickIngredienteDialog from '@/components/QuickIngredienteDialog';

// --- NOVOS IMPORTS (FASE 2 e 3 DO MASTERPLAN) ---
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview';
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
  const [materiais, setMateriais] = useState<any[]>([]); // Novo: Materiais
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<any[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<any[]>([]);
  
  const [categoriaPrincipal, setCategoriaPrincipal] = useState<'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS'>('ALIMENTOS');

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

  // Função p/ Teste do fluxo da interface
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

  // -- ESTADOS DE PREVISÕES (TAB 2) --
  const [previsoes, setPrevisoes] = useState<any[]>([]);
  const [loadingPreviso, setLoadingPreviso] = useState(false);
  const [nfSelecionada, setNfSelecionada] = useState<string | null>(null);

  // Estados para edição física dos itens da NF durante a conferência
  const [itensConferencia, setItensConferencia] = useState<any[]>([]);

  const previsoesAgrupadas = useMemo(() => {
    const grupos: { [key: string]: any } = {};
    previsoes.forEach(lote => {
      const nf = lote.nota_fiscal || 'Sem NF';
      if (!grupos[nf]) {
        grupos[nf] = {
          nota_fiscal: nf,
          fornecedor: lote.fornecedores?.razao_social || 'Desconhecido',
          data_criacao: lote.created_at,
          itens: []
        };
      }
      grupos[nf].itens.push(lote);
    });
    return Object.values(grupos);
  }, [previsoes]);

  // Helper para filtrar locais em todos os fluxos
  const getFilteredLocais = (categoriaId?: string) => {
    return locaisDisponiveis.filter(loc => {
      if (!loc.categorias_permitidas || loc.categorias_permitidas.length === 0) return true;
      if (loc.categorias_permitidas.includes(categoriaPrincipal)) return true;
      if (categoriaId && loc.categorias_permitidas.includes(categoriaId)) return true;
      
      // Compatibilidade manual (Legado)
      const targetCat = categoriasDisponiveis.find(c => c.nome === (categoria || (ingredienteSelecionado?.nome)));
      if (targetCat && loc.categorias_permitidas.includes(targetCat.id)) return true;
      
      return false;
    });
  };

  useEffect(() => {
    if (activeTab === 2 && clienteId && unidadeId) {
      loadPrevisoes();
    }
  }, [activeTab, clienteId, unidadeId, categoriaPrincipal]); // Adicionado categoriaPrincipal

  async function loadPrevisoes() {
    setLoadingPreviso(true);
    
    // Filtragem por categoria nas previsões
    let query = (supabase as any)
      .from('lotes_estoque')
      .select('*, ingredientes(nome, categoria_produto_id), materiais(nome, tipo_material, categoria_id), fornecedores(razao_social)')
      .eq('unidade_id', unidadeId!)
      .eq('status', 'PREVISTO')
      .is('deleted_at', null);

    if (categoriaPrincipal === 'ALIMENTOS') {
      query = query.not('ingrediente_id', 'is', null);
    } else {
      const tipoMaterialMap: Record<string, string> = {
        'EMBALAGENS': 'EMBALAGEM',
        'LIMPEZA': 'LIMPEZA',
        'MANUTENCAO': 'MANUTENCAO',
        'UTENSILIOS': 'UTENSILIO',
        'EPI_EPC': 'EPI_EPC',
        'UNIFORMES': 'UNIFORME',
        'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS'
      };
      query = query.not('material_id', 'is', null)
                   .eq('materiais.tipo_material', tipoMaterialMap[categoriaPrincipal]);
    }

    const { data: lotesData } = await query.order('created_at', { ascending: false });

    if (lotesData) {
      // Filtro manual para garantir que o material_id bate com o tipo_material desejado se a query do supabase não for profunda o suficiente
      const finalData = lotesData.filter((lote: any) => {
        if (categoriaPrincipal === 'ALIMENTOS') return !!lote.ingrediente_id;
        const tipoEsperado = ({
          'EMBALAGENS': 'EMBALAGEM',
          'LIMPEZA': 'LIMPEZA',
          'MANUTENCAO': 'MANUTENCAO',
          'UTENSILIOS': 'UTENSILIO',
          'EPI_EPC': 'EPI_EPC',
          'UNIFORMES': 'UNIFORME',
          'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS'
        } as any)[categoriaPrincipal];
        return lote.materiais?.tipo_material === tipoEsperado;
      });
      setPrevisoes(finalData);
    }
    setLoadingPreviso(false);
  }

  const openConferenciaNf = (nf: string) => {
    const itensNf = previsoes.filter(p => (p.nota_fiscal || 'Sem NF') === nf);
    // Inicializa o estado de conferência com os dados que já temos, permitindo edição
    setItensConferencia(itensNf.map(item => {
       const catId = item.ingredientes?.categoria_produto_id || item.materiais?.categoria_id;
       const permitidos = getFilteredLocais(catId);
       const hasSpecificLocal = permitidos.length === 1;
 
       return {
         ...item,
         loteEdit: item.numero_lote_fabricante || '',
         tempEdit: '',
         sifEdit: item.registro_sif || '',
         validadeEdit: item.data_validade_rotulo || '',
         localEdit: hasSpecificLocal ? permitidos[0].id : (item.local_estoque_id || ''),
         estadoProdutoEdit: item.estado_produto || 'CONFORME',
         qtdPacotesEdit: item.qtd_embalagens?.toString() || '',
         pesoPacoteEdit: item.peso_unitario_embalagem?.toString() || '',
         unidadePesoEdit: item.unidade_peso_embalagem || 'KG'
       };
    }));
    setNfSelecionada(nf);
  };

  const duplicarItemConferencia = (index: number) => {
    const itemOriginal = itensConferencia[index];
    const novoClone = {
      ...itemOriginal,
      id: `clone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      loteEdit: '',
      qtdPacotesEdit: '',
    };
    const novosItens = [...itensConferencia];
    novosItens.splice(index + 1, 0, novoClone);
    setItensConferencia(novosItens);
  };

  const confirmarItemConferencia = async (index: number) => {
    const item = itensConferencia[index];
    if (!item.localEdit) {
      alert('Selecione o local de destino para este item.');
      return;
    }

    setLoadingPreviso(true);
    try {
      let novaQtdInicial = item.quantidade_inicial_g_ml;
      if (item.qtdPacotesEdit) {
        const qtdEmb = parseFloat(item.qtdPacotesEdit);
        const pesoEmb = item.unidadePesoEdit === 'UN' ? 1 : parseFloat(item.pesoPacoteEdit || '0');
        novaQtdInicial = qtdEmb * pesoEmb;
        if (item.unidadePesoEdit === 'KG' || item.unidadePesoEdit === 'L') {
          novaQtdInicial *= 1000;
        }
      }

      if (item.id.toString().startsWith('clone-')) {
        // INSERÇÃO (Clone)
        const { error } = await (supabase as any).from('lotes_estoque').insert({
          unidade_id: item.unidade_id,
          ingrediente_id: item.ingrediente_id || null,
          material_id: item.material_id || null,
          fornecedor_id: item.fornecedor_id,
          numero_lote_fabricante: item.loteEdit || `INT-${Date.now()}`,
          nota_fiscal: item.nota_fiscal,
          data_fabricacao: item.data_fabricacao,
          data_validade_rotulo: item.validadeEdit,
          quantidade_inicial_g_ml: novaQtdInicial,
          quantidade_atual_g_ml: novaQtdInicial,
          status: 'APROVADO',
          registro_sif: item.sifEdit,
          local_estoque_id: item.localEdit,
          temperatura_recebimento: item.tempEdit ? parseFloat(item.tempEdit) : null,
          estado_produto: item.estadoProdutoEdit,
          qtd_embalagens: item.qtdPacotesEdit ? parseFloat(item.qtdPacotesEdit) : null,
          peso_unitario_embalagem: item.peso_unitario_embalagem,
          unidade_peso_embalagem: item.unidade_peso_embalagem
        });
        if (error) throw error;
      } else {
        // ATUALIZAÇÃO (Original)
        const { error } = await (supabase as any).from('lotes_estoque').update({
          status: 'APROVADO',
          numero_lote_fabricante: item.loteEdit,
          registro_sif: item.sifEdit,
          data_validade_rotulo: item.validadeEdit,
          local_estoque_id: item.localEdit,
          quantidade_inicial_g_ml: novaQtdInicial,
          quantidade_atual_g_ml: novaQtdInicial,
          temperatura_recebimento: item.tempEdit ? parseFloat(item.tempEdit) : null,
          estado_produto: item.estadoProdutoEdit,
          qtd_embalagens: item.qtdPacotesEdit ? parseFloat(item.qtdPacotesEdit) : null,
          peso_unitario_embalagem: item.pesoPacoteEdit ? parseFloat(item.pesoPacoteEdit) : null,
          unidade_peso_embalagem: item.unidadePesoEdit
        }).eq('id', item.id);
        if (error) throw error;
      }

      // Remove o item da lista local de conferência
      const novosItens = [...itensConferencia];
      novosItens.splice(index, 1);
      setItensConferencia(novosItens);

      // Se não houver mais itens, volta para a lista de NFs
      if (novosItens.length === 0) {
        setNfSelecionada(null);
        await loadPrevisoes();
      }
    } catch (err: any) {
      alert('Erro ao confirmar item: ' + err.message);
    } finally {
      setLoadingPreviso(false);
    }
  };

  const confirmarTodosDaNf = async () => {
    if (itensConferencia.some(item => !item.localEdit)) {
      alert('Todos os itens precisam de um destino definido (Local Destino).');
      return;
    }

    setLoadingPreviso(true);
    try {
      for (const item of itensConferencia) {
        let novaQtdInicial = item.quantidade_inicial_g_ml;
        if (item.qtdPacotesEdit) {
          const qtdEmb = parseFloat(item.qtdPacotesEdit);
          const pesoEmb = item.unidadePesoEdit === 'UN' ? 1 : parseFloat(item.pesoPacoteEdit || '0');
          novaQtdInicial = qtdEmb * pesoEmb;
          if (item.unidadePesoEdit === 'KG' || item.unidadePesoEdit === 'L') {
            novaQtdInicial *= 1000;
          }
        }

        if (item.id.toString().startsWith('clone-')) {
          // INSERÇÃO (Clone)
          const { error } = await (supabase as any).from('lotes_estoque').insert({
            unidade_id: item.unidade_id,
            ingrediente_id: item.ingrediente_id || null,
            material_id: item.material_id || null,
            fornecedor_id: item.fornecedor_id,
            numero_lote_fabricante: item.loteEdit || `INT-${Date.now()}`,
            nota_fiscal: item.nota_fiscal,
            data_fabricacao: item.data_fabricacao,
            data_validade_rotulo: item.validadeEdit,
            quantidade_inicial_g_ml: novaQtdInicial,
            quantidade_atual_g_ml: novaQtdInicial,
            status: 'APROVADO',
            registro_sif: item.sifEdit,
            local_estoque_id: item.localEdit,
            temperatura_recebimento: item.tempEdit ? parseFloat(item.tempEdit) : null,
            estado_produto: item.estadoProdutoEdit,
            qtd_embalagens: item.qtdPacotesEdit ? parseFloat(item.qtdPacotesEdit) : null,
            peso_unitario_embalagem: item.pesoPacoteEdit ? parseFloat(item.pesoPacoteEdit) : null,
            unidade_peso_embalagem: item.unidadePesoEdit
          });
          if (error) throw error;
        } else {
          // ATUALIZAÇÃO (Original)
          const { error } = await (supabase as any).from('lotes_estoque').update({
            status: 'APROVADO',
            numero_lote_fabricante: item.loteEdit,
            registro_sif: item.sifEdit,
            data_validade_rotulo: item.validadeEdit,
            local_estoque_id: item.localEdit,
            quantidade_inicial_g_ml: novaQtdInicial,
            quantidade_atual_g_ml: novaQtdInicial,
            temperatura_recebimento: item.tempEdit ? parseFloat(item.tempEdit) : null,
            estado_produto: item.estadoProdutoEdit,
            qtd_embalagens: item.qtdPacotesEdit ? parseFloat(item.qtdPacotesEdit) : null,
            peso_unitario_embalagem: item.pesoPacoteEdit ? parseFloat(item.pesoPacoteEdit) : null,
            unidade_peso_embalagem: item.unidadePesoEdit
          }).eq('id', item.id);
          if (error) throw error;
        }
      }

      setItensConferencia([]);
      setNfSelecionada(null);
      await loadPrevisoes();
      alert('Todos os itens da Nota Fiscal foram recebidos com sucesso!');
    } catch (err: any) {
      alert('Erro ao confirmar NF em lote: ' + err.message);
    } finally {
      setLoadingPreviso(false);
    }
  };


  // -- AUTO SELEÇÃO DE LOCAL (Tab 0) --
  useEffect(() => {
    if (activeTab === 0 && ingredienteSelecionado) {
      const catId = categoriaPrincipal === 'ALIMENTOS' 
        ? ingredienteSelecionado.categoria_produto_id 
        : ingredienteSelecionado.categoria_id;
      
      const permitidos = getFilteredLocais(catId);
      if (permitidos.length === 1) {
        setLocal(permitidos[0].id);
      } else if (local && !permitidos.some(l => l.id === local)) {
        // Reset se o local atual não for mais permitido após trocar o ingrediente
        setLocal('');
      } else if (!local && permitidos.length > 1) {
        // Se houver múltiplas opções e nada selecionado, mantém vazio
        setLocal('');
      }
    }
  }, [ingredienteSelecionado, locaisDisponiveis, categoriaPrincipal, activeTab]);

  // -- AUTO SELEÇÃO DE LOCAL (Tab 1) --
  useEffect(() => {
    if (activeTab === 1 && ocrItems.length > 0) {
      let mudou = false;
      const novosOcr = ocrItems.map(item => {
        if (!item.local && (item.ingrediente_id || item.material_id)) {
          let catId;
          if (item.ingrediente_id) {
            catId = ingredientes.find(ing => ing.id === item.ingrediente_id)?.categoria_produto_id;
          } else {
            catId = materiais.find(mat => mat.id === item.material_id)?.categoria_id;
          }
          const permitidos = getFilteredLocais(catId);
          if (permitidos.length === 1) {
            mudou = true;
            return { ...item, local: permitidos[0].id };
          }
        }
        return item;
      });
      if (mudou) setOcrItems(novosOcr);
    }
  }, [ocrItems, ingredientes, materiais, locaisDisponiveis, categoriaPrincipal, activeTab]);

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

    const { data: ingData } = await (supabase as any)
      .from('ingredientes')
      .select('id, nome, fonte, peso_unitario_g, categoria_produto_id')
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('nome');
    if (ingData) setIngredientes(ingData);

    const { data: matData } = await (supabase as any)
      .from('materiais')
      .select('id, nome, tipo_material, categoria_id')
      .eq('cliente_id', clienteId)
      .order('nome');
    if (matData) setMateriais(matData);

    const { data: locaisData } = await (supabase as any)
      .from('cliente_locais_estoque')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('nome');
    if (locaisData) setLocaisDisponiveis(locaisData);

    const { data: catData } = await (supabase as any)
      .from('cliente_categorias_produto')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('nome');
    if (catData) setCategoriasDisponiveis(catData);

    const { data: fornData } = await (supabase as any)
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('razao_social');
    if (fornData) setListaFornecedores(fornData as any[]);
  }

  // Itens filtrados para o Autocomplete de busca
  const itensBuscaFiltrados = useMemo(() => {
    if (categoriaPrincipal === 'ALIMENTOS') return ingredientes;
    
    const tipoMaterialMap: Record<string, string> = {
      'EMBALAGENS': 'EMBALAGEM',
      'LIMPEZA': 'LIMPEZA',
      'MANUTENCAO': 'MANUTENCAO',
      'UTENSILIOS': 'UTENSILIO',
      'EPI_EPC': 'EPI_EPC',
      'UNIFORMES': 'UNIFORME',
      'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS'
    };
    
    return materiais.filter(m => m.tipo_material === tipoMaterialMap[categoriaPrincipal]);
  }, [categoriaPrincipal, ingredientes, materiais]);

  const handleIngredienteCriado = (novoItem: any, categoriaSugerida?: string) => {
    if (categoriaPrincipal === 'ALIMENTOS') {
      setIngredientes(prev => [{ ...novoItem, pre_cadastro: true }, ...prev]);
    } else {
      setMateriais(prev => [{ ...novoItem, pre_cadastro: true }, ...prev]);
    }

    if (activeTab === 0) {
      setIngredienteSelecionado(novoItem);
      if (novoItem.fonte) setMarca(novoItem.fonte);
      if (categoriaSugerida && categoriaPrincipal === 'ALIMENTOS') {
        const existe = categoriasDisponiveis.some(c => c.nome === categoriaSugerida);
        if (!existe) {
          setCategoriasDisponiveis(prev => [...prev, { id: 'temp_' + Date.now(), nome: categoriaSugerida }]);
        }
        setCategoria(categoriaSugerida);
      }
    } else if (ocrItemToLink !== null) {
      if (categoriaPrincipal === 'ALIMENTOS') {
        setOcrItems(prev => prev.map(i => i.id === ocrItemToLink ? { ...i, ingrediente_id: novoItem.id } : i));
      } else {
        setOcrItems(prev => prev.map(i => i.id === ocrItemToLink ? { ...i, material_id: novoItem.id } : i));
      }
      setOcrItemToLink(null);
    }
  };

  const calcularTotalEstoque = () => {
    const qtd = Number(qtdPacotes);
    const peso = unidadePeso === 'UN' ? 1 : Number(pesoPacote);
    if (!qtd || (unidadePeso !== 'UN' && !peso)) return { valor: 0, unidade: 'KG' };
    let total = qtd * peso;
    let unidadeFinal = unidadePeso;
    if (unidadePeso === 'G') { total /= 1000; unidadeFinal = 'KG'; }
    else if (unidadePeso === 'ML') { total /= 1000; unidadeFinal = 'L'; }
    else if (unidadePeso === 'UN') { unidadeFinal = 'Un.'; }
    return { valor: parseFloat(total.toFixed(3)), unidade: unidadeFinal };
  };
  const estoqueCalculado = calcularTotalEstoque();

  const handleSalvar = async (comoPrevisto: boolean = false) => {
    if (!clienteId || !unidadeId || !ingredienteSelecionado || !validade || !qtdPacotes || (unidadePeso !== 'UN' && !pesoPacote)) {
      alert('Preencha os campos obrigatórios (*).');
      return;
    }

    if (!fornecedorSelecionado) {
      alert('Atenção: Selecione um Fornecedor Homologado para garantir a rastreabilidade.');
      return;
    }

    if (!comoPrevisto && !local) {
      alert('Para recebimento físico imediato, preencha o Destino (Local).');
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
      const statusFinal = comoPrevisto ? 'PREVISTO' : (estadoProduto === 'AVARIADO' ? 'REJEITADO' : (diasRestantes < 0 ? 'VENCIDO' : 'QUARENTENA'));

      let qtdReal = estoqueCalculado.valor;
      if (estoqueCalculado.unidade === 'KG' || estoqueCalculado.unidade === 'L') {
        qtdReal = estoqueCalculado.valor * 1000;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          unidade_id: unidadeId,
          ingrediente_id: categoriaPrincipal === 'ALIMENTOS' ? ingredienteSelecionado.id : null,
          material_id: categoriaPrincipal !== 'ALIMENTOS' ? ingredienteSelecionado.id : null,
          fornecedor_id: fornecedorSelecionado.id,
          numero_lote_fabricante: (!codigoLote || codigoLote.trim() === '') ? null : codigoLote,
          nota_fiscal: notaFiscal || null,
          data_fabricacao: dataRecebimento ? new Date(dataRecebimento).toISOString() : null,
          data_validade_rotulo: validade || null,
          data_validade_interna: validadeCalculada.dataValidadeFinal.toISOString(),
          quantidade_inicial_g_ml: qtdReal,
          status: statusFinal,
          registro_sif: registroSif || null,
          local_estoque_id: local || null,
          categoria_produto: categoria || null,
          qtd_embalagens: qtdPacotes ? Number(qtdPacotes) : null,
          peso_unitario_embalagem: pesoPacote ? Number(pesoPacote) : null,
          unidade_peso_embalagem: unidadePeso || null,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Zod Validation Error Details:", errorData.detalhes);
        const msgDb = Array.isArray(errorData.detalhes) 
          ? ` - Campos inválidos: ${errorData.detalhes.map((d: any) => d.path.join('.') + ' (' + d.message + ')').join(', ')}`
          : (errorData.detalhes?.message ? ` - Detalhes do Banco: ${errorData.detalhes.message}` : '');
        throw new Error((errorData.erro || 'Falha ao processar entrada de lote') + msgDb);
      }

      const lote = await res.json();

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

  const handleSalvarBatch = async (comoPrevisto: boolean = false) => {
    if (!fornecedorSelecionado) {
      alert('Selecione o Fornecedor Homologado.');
      return;
    }

    if (ocrItems.length === 0) return;

    if (!comoPrevisto) {
      if (ocrItems.some(i => !i.lido)) {
        alert('Para entrada física, todas as caixas precisam ser conferidas e aprovadas.');
        return;
      }
      if (ocrItems.some(i => !i.local)) {
        alert('Para entrada física, todas as caixas precisam de um Destino (Local) definido.');
        return;
      }
    } else {
      if (ocrItems.some(i => !i.ingrediente_id)) {
        alert('Para salvar a previsão, certifique-se de que todos os itens foram vinculados a um Produto do Sistema.');
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      for (const item of ocrItems) {

        let qtdReal = item.qtd * (item.unid === 'UN' ? 1 : (item.peso || 0));
        if (item.unid === 'KG' || item.unid === 'L') {
          qtdReal = qtdReal * 1000;
        }

        const res = await fetch('/api/estoque/entrada', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session ? `Bearer ${session.access_token}` : ''
          },
          body: JSON.stringify({
            unidade_id: unidadeId,
            ingrediente_id: categoriaPrincipal === 'ALIMENTOS' ? item.ingrediente_id : null,
            material_id: categoriaPrincipal !== 'ALIMENTOS' ? item.material_id : null,
            fornecedor_id: fornecedorSelecionado.id,
            numero_lote_fabricante: item.lote,
            nota_fiscal: notaFiscal || null,
            data_fabricacao: dataRecebimento ? new Date(dataRecebimento).toISOString() : null,
            data_validade_rotulo: item.validade || null,
            data_validade_interna: item.validade ? new Date(item.validade).toISOString() : null, // Simplificação
            quantidade_inicial_g_ml: qtdReal,
            status: comoPrevisto ? 'PREVISTO' : 'QUARENTENA',
            registro_sif: item.sif?.trim() ? item.sif.trim() : null,
            local_estoque_id: item.local?.trim()?.length > 10 ? item.local.trim() : null,
            categoria_produto: null, // Pode ser inferido ou adicionado no futuro OCR
            qtd_embalagens: item.qtd ? parseFloat(item.qtd) : null,
            peso_unitario_embalagem: item.peso ? parseFloat(item.peso) : null,
            unidade_peso_embalagem: item.unid || null,
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const detailMsg = errData?.detalhes ? JSON.stringify(errData.detalhes) : (errData?.erro || 'Erro desconhecido');
          throw new Error('Falha ao processar item: ' + item.nomeExtracao + ' | Detalhes Zod: ' + detailMsg);
        }
      }

      alert(comoPrevisto ? 'Nota Fiscal salva como Previsão de Recebimento com sucesso!' : 'Lotes físicos registrados com sucesso!');

      setOcrItems([]);
      setNotaFiscal('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setPrintModalOpen(false);
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
        categoriaPrincipal={categoriaPrincipal}
      />

      {/* TABS DE CATEGORIA PRINCIPAL (IGUAL AO ESTOQUE) */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={categoriaPrincipal}
          onChange={(e, v) => {
            setCategoriaPrincipal(v);
            setIngredienteSelecionado(null);
            setCategoria('');
            setMarca('');
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' },
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', minHeight: 60 }
          }}
        >
          <Tab value="ALIMENTOS" label="Alimentos" icon={<PackageCheck size={20} />} iconPosition="start" />
          <Tab value="EMBALAGENS" label="Embalagens" icon={<Package size={20} />} iconPosition="start" />
          <Tab value="LIMPEZA" label="Limpeza" icon={<Droplets size={20} />} iconPosition="start" />
          <Tab value="MANUTENCAO" label="Manutenção" icon={<Wrench size={20} />} iconPosition="start" />
          <Tab value="UTENSILIOS" label="Utensílios" icon={<BoxIcon size={20} />} iconPosition="start" />
          <Tab value="EPI_EPC" label="EPIs/EPCs" icon={<Shield size={20} />} iconPosition="start" />
          <Tab value="UNIFORMES" label="Uniformes" icon={<User size={20} />} iconPosition="start" />
          <Tab value="PRIMEIROS_SOCORROS" label="P. Socorros" icon={<Activity size={20} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* ABAS DE SELEÇÃO: ENTRADA MANUAL VS INTELIGENTE */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Entrada Unitária (Convencional)" icon={<PackageCheck size={18} />} iconPosition="start" />
          <Tab label="Recebimento em Lote (Inteligência Artificial)" icon={<FileText size={18} />} iconPosition="start" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Aguardando Desembarque
                {previsoes.length > 0 && (
                  <Chip
                    label={previsoes.length}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                    title={`Existem ${previsoes.length} lotes aguardando recebimento nesta categoria.`}
                  />
                )}
              </Box>
            }
            icon={<MapPin size={18} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && (
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
                  options={itensBuscaFiltrados}
                  getOptionLabel={(option) => {
                    if (categoriaPrincipal === 'ALIMENTOS') {
                      return `${option.nome} ${option.fonte ? `(${option.fonte})` : ''}`;
                    }
                    return option.nome;
                  }}
                  value={ingredienteSelecionado}
                  onChange={(_, newValue) => setIngredienteSelecionado(newValue)}
                  onInputChange={(_, newInputValue) => setTermoBuscaIngrediente(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params} 
                      label={categoriaPrincipal === 'ALIMENTOS' ? "Ingrediente (Sistema) *" : "Material (Sistema) *"} 
                      placeholder="Digite para buscar..."
                      helperText={itensBuscaFiltrados.length === 0 ? `Nenhum ${categoriaPrincipal.toLowerCase()} cadastrado.` : "A marca será sugerida automaticamente."}
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
                    <Select 
                      value={categoria} 
                      label="Categoria de Armazenamento" 
                      onChange={e => setCategoria(e.target.value)}
                    >
                      <MenuItem value=""><em>Nenhuma</em></MenuItem>
                      {categoriasDisponiveis
                        .filter(cat => cat.modalidade === categoriaPrincipal || (!cat.modalidade && categoriaPrincipal === 'ALIMENTOS'))
                        .map((cat) => (
                          <MenuItem key={cat.id} value={cat.nome}>{cat.nome}</MenuItem>
                        ))
                      }
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
                  <TextField 
                    label={`Peso Unitário ${unidadePeso !== 'UN' ? '*' : ''}`} 
                    size="small" 
                    type="number" 
                    fullWidth 
                    value={unidadePeso === 'UN' ? '' : pesoPacote} 
                    onChange={e => setPesoPacote(e.target.value)} 
                    disabled={unidadePeso === 'UN'}
                    error={unidadePeso !== 'UN' && (!pesoPacote || parseFloat(pesoPacote) <= 0)}
                    sx={{ bgcolor: 'background.paper' }} 
                    placeholder={unidadePeso === 'UN' ? 'N/A' : 'Ex: 2'} 
                  />
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
                      {getFilteredLocais(
                        categoriaPrincipal === 'ALIMENTOS' 
                          ? ingredienteSelecionado?.categoria_produto_id 
                          : ingredienteSelecionado?.categoria_id
                      ).map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <MapPin size={16} /> {loc.nome}
                          </Box>
                        </MenuItem>
                      ))}
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

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={() => handleSalvar(true)}
                disabled={loading}
                sx={{ height: 50, fontWeight: 'bold' }}
              >
                Salvar como Recebimento Previsto
              </Button>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={() => handleSalvar(false)}
                disabled={loading}
                sx={{ height: 56, fontWeight: 'bold', boxShadow: 3 }}
              >
                {loading ? 'Registrando...' : 'Confirmar Entrada Física'}
              </Button>
            </Box>

          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
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
                        <Grid item xs={12} md={3}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">Lido da NFe:</Typography>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap title={item.nomeExtracao}>{item.nomeExtracao}</Typography>
                          <Typography variant="body2" color="text.secondary">Lote: <b>{item.lote}</b> • Val: <b>{new Date(item.validade).toLocaleDateString('pt-BR')}</b></Typography>
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            {item.qtd} cx ({item.peso}{item.unid}) {item.sif ? <Chip size="small" label={item.sif} sx={{ height: 18, ml: 1, fontSize: '0.6rem', bgcolor: 'primary.light', color: 'primary.dark' }} /> : <Chip size="small" label="SIF Ausente" color="warning" sx={{ height: 18, ml: 1, fontSize: '0.6rem' }} />}
                          </Typography>
                        </Grid>

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

                        <Grid item xs={12} md={2}>
                          <Typography variant="caption" color={item.local ? "text.secondary" : "error.main"} fontWeight="bold">2. Local de Guarda *</Typography>
                          <Select
                            size="small" fullWidth displayEmpty
                            value={item.local || ''}
                            onChange={e => setOcrItems(prev => prev.map(i => i.id === item.id ? { ...i, local: e.target.value } : i))}
                            error={!item.local}
                            disabled={item.lido}
                            sx={{ bgcolor: 'white' }}
                          >
                            <MenuItem value="" disabled>Local...</MenuItem>
                            {getFilteredLocais(
                              item.ingrediente_id 
                                ? ingredientes.find(ing => ing.id === item.ingrediente_id)?.categoria_produto_id
                                : materiais.find(mat => mat.id === item.material_id)?.categoria_id
                            ).map(loc => (
                              <MenuItem key={loc.id} value={loc.id}>{loc.nome}</MenuItem>
                            ))}
                          </Select>
                        </Grid>

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
                  variant="outlined"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={ocrItems.some(i => !i.ingrediente_id) || !fornecedorSelecionado || loading}
                  sx={{ px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                  onClick={() => handleSalvarBatch(true)}
                >
                  {loading ? 'Salvando...' : 'Salvar NF como Previsão'}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={ocrItems.some(i => !i.lido) || !fornecedorSelecionado || loading}
                  sx={{ px: 4, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                  onClick={() => handleSalvarBatch(false)}
                >
                  {loading ? 'Gravando Lotes...' : 'Processar Recebimento Físico'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {loadingPreviso ? (
            <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
          ) : previsoes.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <PackageCheck size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <Typography variant="h6" color="text.secondary">Nenhuma carga prevista</Typography>
              <Typography variant="body2" color="text.secondary">Os recebimentos agendados aparecerão aqui.</Typography>
            </Box>
          ) : !nfSelecionada ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, px: 2, pt: 1, fontWeight: 'bold' }}>
                Notas Fiscais Aguardando Desembarque
              </Typography>
              <Grid container spacing={2}>
                {previsoesAgrupadas.map((grupo) => (
                  <Grid item xs={12} key={grupo.nota_fiscal}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileText size={20} color={theme.palette.primary.main} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Nota Fiscal: {grupo.nota_fiscal}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Fornecedor: {grupo.fornecedor}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cadastrado em: {format(new Date(grupo.data_criacao), "dd/MM/yyyy 'às' HH:mm")} • {grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'} a receber
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<PackageCheck size={18} />}
                        onClick={() => openConferenciaNf(grupo.nota_fiscal)}
                      >
                        Conferir Itens
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    startIcon={<ChevronLeft size={18} />}
                    onClick={() => setNfSelecionada(null)}
                    sx={{ mb: 1 }}
                  >
                    Voltar para lista de Notas
                  </Button>
                  <Typography variant="h5" fontWeight="bold">
                    Conferência Física: NF {nfSelecionada}
                  </Typography>
                </Box>
                <Chip label={`${itensConferencia.length} itens restantes`} color="primary" />
              </Box>

              <Grid container spacing={3}>
                {itensConferencia.map((item, index) => (
                  <Grid item xs={12} key={item.id}>
                    <Paper elevation={0} sx={{ p: 3, borderLeft: '6px solid', borderLeftColor: 'primary.main', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">
                        {item.ingredientes?.nome}
                      </Typography>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Lote Fornecedor *"
                            size="small"
                            fullWidth
                            value={item.loteEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].loteEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            label="Temp. (°C)"
                            size="small"
                            type="number"
                            fullWidth
                            value={item.tempEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].tempEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            label="S.I.F / S.I.M"
                            size="small"
                            fullWidth
                            value={item.sifEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].sifEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            label="Validade *"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={item.validadeEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].validadeEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Local Destino *</InputLabel>
                            <Select
                              value={item.localEdit}
                              label="Local Destino *"
                              onChange={(e) => {
                                const v = [...itensConferencia];
                                v[index].localEdit = e.target.value;
                                setItensConferencia(v);
                              }}
                            >
                               {getFilteredLocais(
                                 item.ingredientes?.categoria_produto_id || item.materiais?.categoria_id
                               ).map(loc => (
                                 <MenuItem key={loc.id} value={loc.id}>{loc.nome}</MenuItem>
                               ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Qtd. Embalagens" size="small" type="number" fullWidth
                            value={item.qtdPacotesEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].qtdPacotesEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label={`Peso Unitário ${item.unidadePesoEdit !== 'UN' ? '*' : ''}`} 
                            size="small" type="number" fullWidth
                            value={item.unidadePesoEdit === 'UN' ? '' : item.pesoPacoteEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].pesoPacoteEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                            disabled={item.unidadePesoEdit === 'UN'}
                            error={item.unidadePesoEdit !== 'UN' && (!item.pesoPacoteEdit || parseFloat(item.pesoPacoteEdit) <= 0)}
                            placeholder={item.unidadePesoEdit === 'UN' ? 'N/A' : '0.000'}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            select label="Unidade" size="small" fullWidth
                            value={item.unidadePesoEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].unidadePesoEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          >
                            <MenuItem value="KG">KG</MenuItem><MenuItem value="G">G</MenuItem><MenuItem value="L">L</MenuItem><MenuItem value="ML">ML</MenuItem><MenuItem value="UN">UN</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            select label="Avaliação Visual" size="small" fullWidth
                            value={item.estadoProdutoEdit}
                            onChange={(e) => {
                              const v = [...itensConferencia];
                              v[index].estadoProdutoEdit = e.target.value;
                              setItensConferencia(v);
                            }}
                          >
                            <MenuItem value="CONFORME">✅ Conforme (Aprovado)</MenuItem>
                            <MenuItem value="EMBALAGEM_DANIFICADA">⚠️ Emb. Danificada</MenuItem>
                            <MenuItem value="AVARIADO">🚫 Avariado (Rejeitado)</MenuItem>
                          </TextField>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Copy size={16} />}
                          onClick={() => duplicarItemConferencia(index)}
                        >
                          Duplicar Insumo (Dividir Lote)
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle size={18} />}
                          onClick={() => confirmarItemConferencia(index)}
                        >
                          Confirmar Recebimento Deste Item
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {itensConferencia.length > 1 && (
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Revise todos os {itensConferencia.length} itens acima antes de confirmar.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={loadingPreviso ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                    onClick={confirmarTodosDaNf}
                    disabled={loadingPreviso}
                  >
                    Confirmar Todos os Itens da NF
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

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


