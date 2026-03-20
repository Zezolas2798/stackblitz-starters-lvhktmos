'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, TextField, Button, CircularProgress, Paper,
  Autocomplete, IconButton, Alert, Grid, List, ListItem, ListItemText,
  Select, MenuItem, FormControl, InputLabel, Chip, InputAdornment, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Divider,
  useTheme, alpha
} from '@mui/material';

// Ícones Modernos
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Save,
  ChefHat,
  Scale,
  AlertTriangle,
  FlaskConical,
  Settings,
  PlusCircle,
  Image as ImageIcon,
  ScrollText,
  Users,
  Search
} from 'lucide-react';

import { AnvisaCategoria, AnvisaAlergenico, AnvisaGrupoPopulacional, TipoReceita } from '@/lib/types';

// --- HELPER: Ordenação de Grupos Romanos (I, II, III...) ---
function getOrdemGrupo(nomeGrupo: string): number {
  if (!nomeGrupo) return 99;
  const match = nomeGrupo.match(/Grupo\s([IVX]+)/i);
  const romano = match ? match[1].toUpperCase() : "";
  const ordem = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const index = ordem.indexOf(romano);
  return index === -1 ? 99 : index;
}

// --- Interfaces LOCAIS ---
interface ItemDeBusca {
  id: string;
  nome: string;
  tipo: 'ingrediente' | 'receita' | 'aditivo_mestre';
  grupo: string;
  fonte?: string | null;
  aditivoData?: { ins: string; funcao: string | null; };
}

interface ItemComposicao {
  item_id: string;
  item_type: 'ingrediente' | 'receita';
  nome: string;
  peso_bruto_g: number;
  peso_liquido_g: number;
  unidade: string;
  peso_bruto_display: number | '';
  peso_liquido_display: number | '';
  fonte?: string | null;
  is_aditivo?: boolean;
  ins_code?: string | null;
}

interface AditivoMestre {
  id: number;
  ins: string;
  nome: string;
  funcao_principal: string | null;
}

function CriarEditarReceitaComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const { activeClientId, unidadeSelecionada } = useClient();
  const theme = useTheme();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [itensDeBusca, setItensDeBusca] = useState<ItemDeBusca[]>([]);
  const [anvisaCategorias, setAnvisaCategorias] = useState<AnvisaCategoria[]>([]);
  const [medidasCaseirasMasterList, setMedidasCaseirasMasterList] = useState<string[]>([]);
  const [listaMestraAlergenicos, setListaMestraAlergenicos] = useState<AnvisaAlergenico[]>([]);
  const [gruposPopulacionais, setGruposPopulacionais] = useState<AnvisaGrupoPopulacional[]>([]);
  const [listaAditivosMestre, setListaAditivosMestre] = useState<AditivoMestre[]>([]);

  const [tiposReceita, setTiposReceita] = useState<TipoReceita[]>([]);
  const [selectedTipoReceita, setSelectedTipoReceita] = useState<TipoReceita | null>(null);
  const [openManageTypes, setOpenManageTypes] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState('');

  const [mapaAlergenicosIngredientes, setMapaAlergenicosIngredientes] = useState<Record<string, number[]>>({});

  // Form Receita
  const [nomeReceita, setNomeReceita] = useState('');
  const [descricao, setDescricao] = useState('');
  const [rendimentoTotal, setRendimentoTotal] = useState<number | ''>('');
  const [unidadeRendimento, setUnidadeRendimento] = useState('g');
  const [pesoEmbalagem, setPesoEmbalagem] = useState<number | ''>('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoUrlAtual, setFotoUrlAtual] = useState<string | null>(null);

  // CATEGORIA EM DOIS PASSOS
  const [selectedGrupoAnvisa, setSelectedGrupoAnvisa] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AnvisaCategoria | null>(null);
  const [selectedGrupoPop, setSelectedGrupoPop] = useState<AnvisaGrupoPopulacional | null>(null);

  const [porcaoFinal, setPorcaoFinal] = useState<number | ''>('');
  const [estadoAlimento, setEstadoAlimento] = useState<'solido' | 'liquido'>('solido');
  const [medidaCaseiraNome, setMedidaCaseiraNome] = useState<string | null>(null);
  const [medidaCaseiraPesoG, setMedidaCaseiraPesoG] = useState<number | ''>('');
  const [riscosContaminacao, setRiscosContaminacao] = useState<AnvisaAlergenico[]>([]);
  const [areaPainelCm2, setAreaPainelCm2] = useState<number | ''>('');

  // Composição
  const [composicao, setComposicao] = useState<ItemComposicao[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<ItemDeBusca | null>(null);

  // ESTADOS DE ITEM
  const [funcoesAditivoDisponiveis, setFuncoesAditivoDisponiveis] = useState<string[]>([]);
  const [funcaoAditivoSelecionada, setFuncaoAditivoSelecionada] = useState<string>('');
  const [pesoBruto, setPesoBruto] = useState<number | ''>('');
  const [pesoLiquido, setPesoLiquido] = useState<number | ''>('');
  const [unidadeIngrediente, setUnidadeIngrediente] = useState('g');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // --- GRUPOS DE ALIMENTOS ---
  const gruposAnvisaUnicos = useMemo(() => {
    if (anvisaCategorias.length === 0) return [];
    const grupos = new Set(anvisaCategorias.map(c => c.grupo_anvisa));
    return Array.from(grupos).sort((a, b) => getOrdemGrupo(a) - getOrdemGrupo(b));
  }, [anvisaCategorias]);

  const categoriasFiltradasPorGrupo = useMemo(() => {
    if (!selectedGrupoAnvisa) return [];
    return anvisaCategorias.filter(c => c.grupo_anvisa === selectedGrupoAnvisa);
  }, [anvisaCategorias, selectedGrupoAnvisa]);


  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // NOTA: Adicionei 'alergenicos_ids' na query de ingredientes para suportar o novo formato
      const [ingPromise, recPromise, catPromise, medPromise, alergenicosPromise, ingAlergLinkPromise, gruposPopPromise, tiposRecPromise, aditivosMestrePromise] = await Promise.all([
        (supabase as any).from('ingredientes').select('id, nome, fonte, ins_code, tipo_ingrediente, funcao_aditivo, alergenicos_ids').or(`cliente_id.eq.${activeClientId},cliente_id.is.null`).order('nome'),
        (supabase as any).from('receitas').select('id, nome').eq('cliente_id', activeClientId!).neq('id', editingId || '00000000-0000-0000-0000-000000000000').order('nome'),
        (supabase as any).from('anvisa_categorias').select('*').order('nome_produto'),
        (supabase as any).from('anvisa_medidas_caseiras').select('nome').order('nome'),
        (supabase as any).from('anvisa_alergenicos').select('id, nome').order('nome'),
        (supabase as any).from('ingrediente_alergenicos').select('ingrediente_id, alergenico_id, contem, contem_derivado'),
        (supabase as any).from('anvisa_grupos_populacionais').select('*').order('id'),
        (supabase as any).from('tipos_receita').select('*').eq('cliente_id', activeClientId!).order('nome'),
        (supabase as any).from('anvisa_aditivos').select('*').order('ins')
      ]);

      if (ingPromise.error) throw ingPromise.error;

      // === LÓGICA DE ALÉRGENOS HÍBRIDA (ANTIGO + NOVO) ===
      const mapa: Record<string, number[]> = {};

      // 1. Processar dados da tabela antiga (Relacionamento)
      if (ingAlergLinkPromise.data) {
        ingAlergLinkPromise.data.forEach((link: any) => {
          if (link.contem || link.contem_derivado) {
            if (!mapa[link.ingrediente_id]) mapa[link.ingrediente_id] = [];
            if (!mapa[link.ingrediente_id].includes(link.alergenico_id)) {
              mapa[link.ingrediente_id].push(link.alergenico_id);
            }
          }
        });
      }

      // 2. Processar dados da nova coluna (Array no ingrediente)
      const ingredientesRaw = ingPromise.data || [];
      ingredientesRaw.forEach((ing: any) => {
        if (ing.alergenicos_ids && Array.isArray(ing.alergenicos_ids)) {
          if (!mapa[ing.id]) mapa[ing.id] = [];
          ing.alergenicos_ids.forEach((alergId: number) => {
            if (!mapa[ing.id].includes(alergId)) {
              mapa[ing.id].push(alergId);
            }
          });
        }
      });

      setMapaAlergenicosIngredientes(mapa);
      // =======================================================

      const ingredientesFormatados: ItemDeBusca[] = ingredientesRaw
        .filter((ing: any) => ing.tipo_ingrediente !== 'ADITIVO')
        .map((ing: any) => ({
          id: ing.id,
          nome: ing.nome,
          tipo: 'ingrediente',
          grupo: 'Meus Ingredientes',
          fonte: ing.fonte
        }));

      const receitasFormatadas: ItemDeBusca[] = (recPromise.data || []).map((rec: any) => ({
        id: rec.id, nome: rec.nome, tipo: 'receita', grupo: 'Minhas Receitas (Sub-receitas)', fonte: 'Própria'
      }));

      const aditivosList = aditivosMestrePromise.data || [];
      setListaAditivosMestre(aditivosList as AditivoMestre[]);

      const aditivosFormatados: ItemDeBusca[] = aditivosList
        .map((ad: any) => ({
          id: `NEW_ADITIVO_${ad.id}`,
          nome: `${ad.nome} (INS ${ad.ins})`,
          tipo: 'aditivo_mestre',
          grupo: 'Aditivos (Catálogo Oficial)',
          fonte: 'ANVISA',
          aditivoData: { ins: ad.ins, funcao: ad.funcao_principal }
        }));

      setItensDeBusca([...ingredientesFormatados, ...receitasFormatadas, ...aditivosFormatados]);
      setAnvisaCategorias(catPromise.data as AnvisaCategoria[]);
      setMedidasCaseirasMasterList(medPromise.data?.map((m: { nome: string }) => m.nome) || []);
      setListaMestraAlergenicos((alergenicosPromise.data || []) as AnvisaAlergenico[]);
      setGruposPopulacionais((gruposPopPromise.data || []) as AnvisaGrupoPopulacional[]);
      setTiposReceita((tiposRecPromise.data || []) as TipoReceita[]);

      const grupoGeral = (gruposPopPromise.data || []).find((g: any) => g.id === 'GERAL');
      setSelectedGrupoPop(grupoGeral || null);

      if (editingId) {
        const { data: recData, error: recError } = await (supabase as any)
          .from('receitas')
          .select('*, anvisa_categorias(*), composicao_receitas(*), risco_contaminacao_cruzada_ids')
          .eq('id', editingId)
          .eq('cliente_id', activeClientId!)
          .single();

        if (recError || !recData) { setError('Receita não encontrada.'); router.push('/receitas'); return; }

        setNomeReceita(recData.nome);
        setDescricao(recData.modo_preparo || '');
        setRendimentoTotal(recData.rendimento_total_g || '');
        setUnidadeRendimento(recData.rendimento_total_g % 1000 === 0 && recData.rendimento_total_g > 0 ? 'Kg' : 'g');
        setPesoEmbalagem(recData.peso_embalagem_g || '');
        setFotoUrlAtual(recData.foto_url || null);
        setEstadoAlimento((recData.estado_alimento as "solido" | "liquido") || 'solido');
        setMedidaCaseiraNome(recData.medida_caseira_nome || null);
        setMedidaCaseiraPesoG(recData.medida_caseira_peso_g || '');
        setAreaPainelCm2(recData.area_painel_principal_cm2 || '');

        if (recData.anvisa_categorias) {
          const cat = recData.anvisa_categorias as AnvisaCategoria;
          setSelectedGrupoAnvisa(cat.grupo_anvisa);
          setSelectedCategory(cat);
        }

        if (recData.grupo_populacional_id) {
          const grp = (gruposPopPromise.data || []).find((g: any) => g.id === recData.grupo_populacional_id);
          if (grp) setSelectedGrupoPop(grp as AnvisaGrupoPopulacional);
        }
        if (recData.tipo_receita_id) {
          const tipo = (tiposRecPromise.data || []).find((t: any) => t.id === recData.tipo_receita_id);
          if (tipo) setSelectedTipoReceita(tipo as TipoReceita);
        }
        if (recData.risco_contaminacao_cruzada_ids && Array.isArray(recData.risco_contaminacao_cruzada_ids)) {
          const riscosSalvos = (alergenicosPromise.data || []).filter((a: any) => (recData.risco_contaminacao_cruzada_ids as number[]).includes(a.id));
          setRiscosContaminacao(riscosSalvos);
        }

        if (recData.composicao_receitas) {
          const composicaoFormatada: ItemComposicao[] = recData.composicao_receitas.map((item: any) => {
            let itemInfo = [...ingredientesFormatados, ...receitasFormatadas, ...aditivosFormatados].find(i => i.id === item.item_id);
            let isAditivo = false;
            let insCode = null;

            if (!itemInfo && item.item_type === 'ingrediente') {
              const ingRaw = ingredientesRaw.find((i: any) => i.id === item.item_id);
              if (ingRaw) {
                itemInfo = {
                  id: ingRaw.id,
                  nome: ingRaw.nome,
                  tipo: 'ingrediente',
                  grupo: 'Aditivo Cadastrado',
                  fonte: ingRaw.fonte,
                  aditivoData: {
                    ins: ingRaw.ins_code as string,
                    funcao: ingRaw.funcao_aditivo as string
                  }
                };
                isAditivo = ingRaw.tipo_ingrediente === 'ADITIVO';
                insCode = ingRaw.ins_code;
              }
            }

            return {
              item_id: item.item_id,
              item_type: item.item_type,
              nome: itemInfo?.nome || 'Item Desconhecido',
              peso_bruto_g: item.peso_bruto_g,
              peso_liquido_g: item.peso_liquido_g,
              unidade: 'g',
              peso_bruto_display: item.peso_bruto_g,
              peso_liquido_display: item.peso_liquido_g,
              fonte: itemInfo?.fonte,
              is_aditivo: isAditivo,
              ins_code: insCode
            }
          }
          );
          setComposicao(composicaoFormatada);
        }
      }
    } catch (err: any) {
      setError('Falha ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeClientId, editingId, router]);

  useEffect(() => {
    if (activeClientId) {
      carregarDados();
    }
  }, [carregarDados, activeClientId]);

  useEffect(() => {
    if (selectedCategory) {
      const porcaoReferencia = selectedCategory.porcao_referencia_g_ml;
      const pesoEmbalagemNum = typeof pesoEmbalagem === 'number' ? pesoEmbalagem : 0;

      // Cálculo de Porção (RDC 429) - SEM interferir na Medida Caseira
      if (pesoEmbalagemNum > 0 && pesoEmbalagemNum <= (2 * porcaoReferencia)) {
        setPorcaoFinal(pesoEmbalagemNum);
      } else {
        setPorcaoFinal(porcaoReferencia);
      }
    } else {
      setPorcaoFinal('');
    }
  }, [pesoEmbalagem, selectedCategory]);

  // Handlers
  const handleAddTipoReceita = async () => {
    if (!novoTipoNome.trim()) return;
    const { data, error } = await (supabase as any).from('tipos_receita').insert({
      nome: novoTipoNome,
      cliente_id: activeClientId!
    }).select().single();
    if (error) {
      console.error(error);
      alert('Erro ao criar tipo: ' + error.message);
      return;
    }
    setTiposReceita([...tiposReceita, data as TipoReceita]);
    setNovoTipoNome('');
  };

  const handleDeleteTipoReceita = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    const { error } = await (supabase as any).from('tipos_receita').delete().eq('id', id);
    if (error) { alert('Erro ao excluir'); return; }
    setTiposReceita(tiposReceita.filter(t => t.id !== id));
    if (selectedTipoReceita?.id === id) setSelectedTipoReceita(null);
  };

  useEffect(() => {
    if (selectedCategory) {
      const porcaoReferencia = selectedCategory.porcao_referencia_g_ml;
      const pesoEmbalagemNum = typeof pesoEmbalagem === 'number' ? pesoEmbalagem : 0;

      // Cálculo de Porção (RDC 429) - SEM interferir na Medida Caseira
      if (pesoEmbalagemNum > 0 && pesoEmbalagemNum <= (2 * porcaoReferencia)) {
        setPorcaoFinal(pesoEmbalagemNum);
      } else {
        setPorcaoFinal(porcaoReferencia);
      }
    } else {
      setPorcaoFinal('');
    }
  }, [pesoEmbalagem, selectedCategory]);

  const alergenicosPresentesIds = useMemo(() => {
    const ids = new Set<number>();
    composicao.forEach(item => {
      if (item.item_type === 'ingrediente') {
        const alerg = mapaAlergenicosIngredientes[item.item_id];
        if (alerg) alerg.forEach(id => ids.add(id));
      }
    });
    return ids;
  }, [composicao, mapaAlergenicosIngredientes]);

  const opcoesRiscoDisponiveis = useMemo(() => {
    return listaMestraAlergenicos.filter(a => !alergenicosPresentesIds.has(a.id));
  }, [listaMestraAlergenicos, alergenicosPresentesIds]);

  useEffect(() => {
    setRiscosContaminacao(prev => prev.filter(r => !alergenicosPresentesIds.has(r.id)));
  }, [alergenicosPresentesIds]);

  const medidasCaseirasFiltradas = useMemo(() => {
    if (!selectedCategory) return [];

    const sugestao = selectedCategory.medida_caseira_sugerida || '';
    const sugestaoLower = sugestao.toLowerCase();

    const palavrasChave = sugestaoLower
      .split(/[\s,./;]+/)
      .map(p => p.trim())
      .filter(p => p.length > 2);

    let filtered = medidasCaseirasMasterList.filter((medidaNome) => {
      const mLower = medidaNome.toLowerCase();
      return palavrasChave.some(chave => mLower.includes(chave));
    });

    const uniqueFiltered = Array.from(new Set(filtered));
    if (medidaCaseiraNome && medidasCaseirasMasterList.includes(medidaCaseiraNome) && !uniqueFiltered.includes(medidaCaseiraNome)) {
      uniqueFiltered.push(medidaCaseiraNome);
    }
    return uniqueFiltered.sort();
  }, [selectedCategory, medidasCaseirasMasterList, medidaCaseiraNome]);

  const handleGrupoAnvisaChange = (e: any) => {
    setSelectedGrupoAnvisa(e.target.value);
    setSelectedCategory(null);
    setMedidaCaseiraNome(null);
    setMedidaCaseiraPesoG('');
  };

  const handleCategoryChange = (_: any, newValue: AnvisaCategoria | null) => {
    setSelectedCategory(newValue);
    setMedidaCaseiraNome(null);
    setMedidaCaseiraPesoG('');
  };

  // === HANDLER DE ADICIONAR/ATUALIZAR ITEM ===
  async function handleAddItemOrUpdateItem() {
    if (!itemSelecionado || !pesoLiquido || !pesoBruto || pesoLiquido <= 0 || pesoBruto <= 0) {
      alert('Preencha o item e pesos corretamente.');
      return;
    }

    const ehAditivoMestre = itemSelecionado.tipo === 'aditivo_mestre';
    const ehAditivoEdicao = editingItemIndex !== null && composicao[editingItemIndex].is_aditivo;

    if ((ehAditivoMestre || ehAditivoEdicao) && funcoesAditivoDisponiveis.length > 1 && !funcaoAditivoSelecionada) {
      alert('Por favor, selecione qual função este aditivo exerce nesta receita.');
      return;
    }

    let realItemId = itemSelecionado.id;
    let realItemType: 'ingrediente' | 'receita';
    const funcaoFinal = funcaoAditivoSelecionada || funcoesAditivoDisponiveis[0] || 'Aditivo';

    if (ehAditivoMestre && itemSelecionado.aditivoData) {
      try {
        const { data: existing } = await (supabase as any).from('ingredientes')
          .select('id')
          .eq('cliente_id', activeClientId!)
          .eq('ins_code', itemSelecionado.aditivoData.ins)
          .eq('funcao_aditivo', funcaoFinal)
          .maybeSingle();

        if (existing) {
          realItemId = existing.id;
          realItemType = 'ingrediente';
        } else {
          const { data: novo, error } = await (supabase as any).from('ingredientes').insert({
            cliente_id: activeClientId,
            nome: itemSelecionado.nome,
            tipo_ingrediente: 'ADITIVO',
            ins_code: itemSelecionado.aditivoData.ins,
            funcao_aditivo: funcaoFinal,
            fonte: 'Auto-Cadastro'
          }).select().single();
          if (error) throw error;
          realItemId = novo.id;
          realItemType = 'ingrediente';
        }
      } catch (err: any) {
        alert('Erro ao processar aditivo: ' + err.message);
        return;
      }
    }
    else if (ehAditivoEdicao) {
      const ingredienteId = composicao[editingItemIndex!].item_id;
      const { error } = await (supabase as any).from('ingredientes')
        .update({ funcao_aditivo: funcaoFinal })
        .eq('id', ingredienteId);
      if (error) { alert('Erro ao atualizar função: ' + error.message); return; }
      realItemId = ingredienteId;
      realItemType = 'ingrediente';
    } else {
      realItemType = itemSelecionado.tipo as 'ingrediente' | 'receita';
    }

    let valorBruto = typeof pesoBruto === 'number' ? pesoBruto : 0;
    if (unidadeIngrediente === 'Kg') valorBruto *= 1000;
    let valorLiquido = typeof pesoLiquido === 'number' ? pesoLiquido : 0;
    if (unidadeIngrediente === 'Kg') valorLiquido *= 1000;

    const itemAtualizado: ItemComposicao = {
      item_id: realItemId,
      item_type: realItemType,
      nome: itemSelecionado.nome,
      peso_bruto_g: valorBruto,
      peso_liquido_g: valorLiquido,
      unidade: unidadeIngrediente,
      peso_bruto_display: pesoBruto,
      peso_liquido_display: pesoLiquido,
      fonte: itemSelecionado.fonte,
      is_aditivo: ehAditivoMestre || ehAditivoEdicao,
      ins_code: itemSelecionado.aditivoData?.ins || composicao[editingItemIndex!]?.ins_code
    };

    if (editingItemIndex !== null) {
      const novaComposicao = [...composicao];
      novaComposicao[editingItemIndex] = itemAtualizado;
      setComposicao(novaComposicao);
    } else {
      setComposicao([...composicao, itemAtualizado]);
    }
    resetIngredientForm();
  }

  function handleStartEditItem(index: number) {
    const item = composicao[index];
    setEditingItemIndex(index);
    let itemInfo = itensDeBusca.find(i => i.id === item.item_id);

    if (!itemInfo) {
      if (item.is_aditivo && item.ins_code) {
        const master = listaAditivosMestre.find(m => m.ins === item.ins_code);
        const funcs = master?.funcao_principal ? master.funcao_principal.split('/').map(f => f.trim()) : [];
        itemInfo = {
          id: item.item_id,
          nome: item.nome,
          tipo: 'ingrediente',
          grupo: 'Aditivo em Edição',
          fonte: item.fonte,
          aditivoData: { ins: item.ins_code, funcao: master?.funcao_principal || null }
        };
        if (funcs.length > 0) {
          setFuncoesAditivoDisponiveis(funcs);
          (supabase as any).from('ingredientes').select('funcao_aditivo').eq('id', item.item_id).single()
            .then(({ data }: any) => { if (data) setFuncaoAditivoSelecionada(data.funcao_aditivo || ''); });
        }
      } else {
        const tipoCompativel = (item.item_type === 'ingrediente' || item.item_type === 'receita') ? item.item_type : 'ingrediente';
        itemInfo = { id: item.item_id, nome: item.nome, tipo: tipoCompativel, grupo: 'Item', fonte: item.fonte };
      }
    }
    setItemSelecionado(itemInfo || null);
    setPesoBruto(item.peso_bruto_display);
    setPesoLiquido(item.peso_liquido_display);
    setUnidadeIngrediente(item.unidade);
  }

  function handleDeleteItem(index: number) {
    setComposicao(composicao.filter((_, i) => i !== index));
  }

  function resetIngredientForm() {
    setEditingItemIndex(null);
    setItemSelecionado(null);
    setPesoBruto('');
    setPesoLiquido('');
    setUnidadeIngrediente('g');
    setFuncoesAditivoDisponiveis([]);
    setFuncaoAditivoSelecionada('');
  }

  async function handleSalvarReceita(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClientId) return alert('Nenhum cliente ativo.');
    const pesoMedidaNum = parseFloat(String(medidaCaseiraPesoG));
    if (!nomeReceita || !rendimentoTotal || !pesoEmbalagem || !porcaoFinal || porcaoFinal <= 0 || !selectedCategory || !medidaCaseiraNome || isNaN(pesoMedidaNum) || pesoMedidaNum <= 0) {
      return alert('Preencha todos os campos obrigatórios.');
    }
    setIsSubmitting(true);
    let novaFotoUrl = fotoUrlAtual;
    if (fotoFile) {
      // Nota: Certifique-se que o bucket 'fotos_receitas' exista no Supabase Storage
      const cleanFileName = fotoFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const nomeArquivo = `${activeClientId}/${Date.now()}-${cleanFileName}`;
      const { data, error } = await supabase.storage.from('fotos_receitas').upload(nomeArquivo, fotoFile);
      if (error) {
        console.warn('Erro upload foto, salvando sem foto nova: ' + error.message);
      } else {
        const { data: urlData } = supabase.storage.from('fotos_receitas').getPublicUrl(data.path);
        novaFotoUrl = urlData.publicUrl;
      }
    }
    let rendimentoFinal = typeof rendimentoTotal === 'number' ? rendimentoTotal : 0;
    if (unidadeRendimento === 'Kg') rendimentoFinal *= 1000;

    const dadosReceita = {
      nome: nomeReceita,
      modo_preparo: descricao,
      rendimento_total_g: rendimentoFinal,
      peso_embalagem_g: pesoEmbalagem,
      foto_url: novaFotoUrl,
      cliente_id: activeClientId,
      porcao_final_g_ml: porcaoFinal,
      estado_alimento: estadoAlimento,
      anvisa_categoria_id: selectedCategory ? selectedCategory.id : null,
      grupo_populacional_id: selectedGrupoPop ? selectedGrupoPop.id : 'GERAL',
      tipo_receita_id: selectedTipoReceita ? selectedTipoReceita.id : null,
      medida_caseira_nome: medidaCaseiraNome,
      medida_caseira_peso_g: pesoMedidaNum,
      risco_contaminacao_cruzada_ids: riscosContaminacao.map(a => a.id),
      area_painel_principal_cm2: areaPainelCm2 || null,
    };
    const itensParaSalvar = composicao.map((item) => ({
      item_id: item.item_id, item_type: item.item_type, peso_bruto_g: item.peso_bruto_g, peso_liquido_g: item.peso_liquido_g
    }));
    try {
      if (editingId) {
        const { error: recError } = await (supabase as any).from('receitas').update(dadosReceita).eq('id', editingId);
        if (recError) throw recError;
        await (supabase as any).from('composicao_receitas').delete().eq('receita_id', editingId);
        const { error: compError } = await (supabase as any).from('composicao_receitas').insert(itensParaSalvar.map((item) => ({ ...item, receita_id: editingId })));
        if (compError) throw compError;
        alert('Receita atualizada!');
      } else {
        const { data: novaReceita, error: recError } = await (supabase as any).from('receitas').insert(dadosReceita).select('id').single();
        if (recError || !novaReceita) throw recError;
        const { error: compError } = await (supabase as any).from('composicao_receitas').insert(itensParaSalvar.map((item) => ({ ...item, receita_id: novaReceita.id })));
        if (compError) throw compError;
        alert('Receita salva!');
        router.push('/receitas');
        return;
      }
      router.push('/receitas');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  if (!activeClientId) return <Container><Alert severity="warning" sx={{ mt: 2 }}>Selecione um Cliente.</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/receitas')} sx={{ mr: 2, color: 'text.secondary' }}>Voltar</Button>
        <Typography variant="h4" component="h1" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
          {editingId ? 'Editando Ficha Técnica' : 'Nova Ficha Técnica'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSalvarReceita} noValidate>

        <Grid container spacing={3}>

          {/* COLUNA ESQUERDA: ENGENHARIA CULINÁRIA */}
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                <ChefHat size={20} /> Identificação e Preparo
              </Typography>
              <Stack spacing={3}>
                <TextField label="Nome da Receita" fullWidth value={nomeReceita} onChange={(e) => setNomeReceita(e.target.value)} required placeholder="Ex: Bolo de Chocolate s/ Glúten" />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Autocomplete
                    options={tiposReceita}
                    getOptionLabel={(option) => option.nome}
                    value={selectedTipoReceita}
                    onChange={(_, newValue) => setSelectedTipoReceita(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <TextField {...params} label="Categoria Interna (Ex: Sobremesas)" placeholder="Selecione ou crie..." />}
                    fullWidth
                  />
                  <Tooltip title="Gerenciar Categorias">
                    <IconButton onClick={() => setOpenManageTypes(true)} sx={{ bgcolor: 'action.hover' }}><Settings size={18} /></IconButton>
                  </Tooltip>
                </Box>

                <TextField label="Modo de Preparo" multiline rows={6} fullWidth value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o passo a passo..." />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Button component="label" variant="outlined" startIcon={<ImageIcon />}>
                    {fotoFile ? 'Alterar Foto' : 'Adicionar Foto'}
                    <input type="file" hidden accept="image/*" onChange={(e) => setFotoFile(e.target.files ? e.target.files[0] : null)} />
                  </Button>
                  {(fotoFile || fotoUrlAtual) && (
                    <Box component="img" src={fotoFile ? URL.createObjectURL(fotoFile) : fotoUrlAtual!} alt="Preview" sx={{ height: 60, borderRadius: 1, border: '1px solid #ddd' }} />
                  )}
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 700 }}>
                <Scale size={20} /> Composição (Ingredientes)
              </Typography>

              <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 2, mb: 3, border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}` }}>
                <Typography variant="subtitle2" gutterBottom color="primary.dark" fontWeight="bold">{editingItemIndex !== null ? 'EDITANDO ITEM' : 'ADICIONAR ITEM'}</Typography>

                <Autocomplete
                  options={itensDeBusca.sort((a, b) => -a.grupo.localeCompare(b.grupo))}
                  groupBy={(option) => option.grupo}
                  getOptionLabel={(option) => option.nome}
                  value={itemSelecionado}
                  onChange={(_, newValue) => {
                    setItemSelecionado(newValue);
                    setFuncoesAditivoDisponiveis([]);
                    setFuncaoAditivoSelecionada('');
                    if (newValue?.tipo === 'aditivo_mestre' && newValue.aditivoData?.funcao) {
                      const funcs = newValue.aditivoData.funcao.split('/').map(f => f.trim());
                      if (funcs.length > 1) { setFuncoesAditivoDisponiveis(funcs); } else { setFuncoesAditivoDisponiveis([funcs[0]]); setFuncaoAditivoSelecionada(funcs[0]); }
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Buscar Ingrediente" size="small" sx={{ bgcolor: 'background.paper' }} InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2">{option.nome}</Typography>
                        {option.tipo === 'aditivo_mestre' && <Chip label="Aditivo ANVISA" size="small" color="secondary" sx={{ height: 16, fontSize: '0.6rem' }} />}
                      </Box>
                    </li>
                  )}
                  sx={{ mb: 2 }}
                />

                {(funcoesAditivoDisponiveis.length > 1) && (
                  <FormControl fullWidth size="small" sx={{ mb: 2, bgcolor: '#fffbe6' }}>
                    <InputLabel>Função Tecnológica</InputLabel>
                    <Select value={funcaoAditivoSelecionada} label="Função Tecnológica" onChange={(e) => setFuncaoAditivoSelecionada(e.target.value)}>
                      {funcoesAditivoDisponiveis.map(f => (<MenuItem key={f} value={f}>{f}</MenuItem>))}
                    </Select>
                  </FormControl>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField label="Peso Bruto" type="number" value={pesoBruto} onChange={(e) => setPesoBruto(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth size="small" sx={{ bgcolor: 'background.paper' }} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField label="Peso Líquido" type="number" value={pesoLiquido} onChange={(e) => setPesoLiquido(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth size="small" sx={{ bgcolor: 'background.paper' }} />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper' }}>
                      <InputLabel>Unidade</InputLabel>
                      <Select value={unidadeIngrediente} label="Unidade" onChange={(e) => setUnidadeIngrediente(e.target.value)}>
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="Kg">Kg</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Button variant="contained" onClick={handleAddItemOrUpdateItem} sx={{ mt: 2 }} fullWidth startIcon={<PlusCircle />}>
                  {editingItemIndex !== null ? 'Atualizar Item' : 'Adicionar à Receita'}
                </Button>
                {editingItemIndex !== null && <Button onClick={resetIngredientForm} fullWidth sx={{ mt: 1 }}>Cancelar</Button>}
              </Box>

              <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                {composicao.map((item, index) => (
                  <ListItem key={index} divider secondaryAction={
                    <>
                      <IconButton size="small" onClick={() => handleStartEditItem(index)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteItem(index)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </>
                  }>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="600">{item.nome}</Typography>
                          {item.is_aditivo && <Chip icon={<FlaskConical size={10} />} label="Aditivo" size="small" color="secondary" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          PB: {item.peso_bruto_display}g | PL: {item.peso_liquido_display}g
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* COLUNA DIREITA: COMPLIANCE E ROTULAGEM */}
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 700 }}>
                <ScrollText size={20} /> Parâmetros
              </Typography>
              <Stack spacing={2.5}>

                <FormControl fullWidth>
                  <InputLabel>Grupo de Alimentos</InputLabel>
                  <Select value={selectedGrupoAnvisa || ''} label="Grupo de Alimentos" onChange={handleGrupoAnvisaChange}>
                    {gruposAnvisaUnicos.map(g => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                  </Select>
                </FormControl>

                <Autocomplete
                  options={categoriasFiltradasPorGrupo}
                  getOptionLabel={(option) => option.nome_produto}
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  disabled={!selectedGrupoAnvisa}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Categoria Específica" required placeholder="Selecione o produto..." />}
                />

                <Autocomplete
                  options={gruposPopulacionais}
                  getOptionLabel={(option) => option.nome}
                  value={selectedGrupoPop}
                  onChange={(_, newValue) => setSelectedGrupoPop(newValue)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Grupo Populacional (IN 75)" required InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><Users size={16} /></InputAdornment> }} />}
                />

                <Divider />
                <Typography variant="subtitle2" fontWeight="bold">Rendimento & Porcionamento</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Rendimento Total" type="number" value={rendimentoTotal} onChange={(e) => setRendimentoTotal(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth InputProps={{ endAdornment: <InputAdornment position="end">{unidadeRendimento}</InputAdornment> }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Peso Embalagem" type="number" value={pesoEmbalagem} onChange={(e) => setPesoEmbalagem(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth helperText="Peso Líquido Final" InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Porção Declarada" value={porcaoFinal} disabled fullWidth InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }} helperText="Calculado" />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Estado Físico</InputLabel>
                      <Select value={estadoAlimento} label="Estado Físico" onChange={(e) => setEstadoAlimento(e.target.value as any)}>
                        <MenuItem value="solido">Sólido</MenuItem>
                        <MenuItem value="liquido">Líquido</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Autocomplete
                  freeSolo
                  id="medida_caseira_nome"
                  options={medidasCaseirasFiltradas}
                  value={medidaCaseiraNome}
                  onInputChange={(_, newVal) => setMedidaCaseiraNome(newVal)}
                  onChange={(_, newVal) => setMedidaCaseiraNome(newVal)}
                  disabled={!selectedCategory}
                  renderInput={(params) => <TextField {...params} label="Medida Caseira" required helperText="Conforme sugestão da categoria" />}
                />

                <TextField label="Peso da Medida Caseira" type="number" value={medidaCaseiraPesoG} onChange={(e) => setMedidaCaseiraPesoG(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }} />

                <TextField label="Área do Painel Principal" type="number" value={areaPainelCm2} onChange={(e) => setAreaPainelCm2(e.target.value === '' ? '' : parseFloat(e.target.value))} fullWidth helperText="Essencial para o tamanho das Lupas Frontais" InputProps={{ endAdornment: <InputAdornment position="end">cm²</InputAdornment> }} />
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff5f5', borderColor: '#feb2b2' }}>
              <Typography variant="subtitle2" gutterBottom color="error.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={18} /> Risco de Contaminação Cruzada
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Selecione os alérgenos que <strong>não fazem parte da receita</strong>, mas que são manipulados na mesma área.
              </Typography>

              <Autocomplete
                multiple
                disableCloseOnSelect
                options={opcoesRiscoDisponiveis.length > 0 ? [{ id: -1, nome: "✅ SELECIONAR TODOS OS RISCOS" }, ...opcoesRiscoDisponiveis] : []}
                getOptionLabel={(option) => option.nome}
                value={riscosContaminacao}
                onChange={(_, newValue) => {
                  if (newValue.some(item => item.id === -1)) setRiscosContaminacao(opcoesRiscoDisponiveis);
                  else setRiscosContaminacao(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) => value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={option.id} variant="outlined" label={option.nome} color="error" size="small" {...tagProps} />;
                })}
                renderInput={(params) => <TextField {...params} label="Selecione os riscos..." placeholder="Ex: Trigo, Leite" sx={{ bgcolor: 'background.paper' }} />}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* STICKY FOOTER ACTION BAR */}
        <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: { md: 280, xs: 0 }, right: 0, p: 2, bgcolor: 'background.paper', borderTop: '1px solid #e0e0e0', zIndex: 1100, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
          <Button variant="text" color="inherit" onClick={() => router.push('/receitas')}>Cancelar</Button>
          <Button type="submit" variant="contained" size="large" sx={{ px: 4, py: 1.5, fontSize: '1rem' }} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Save />} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </Button>
        </Paper>

        {error && <Alert severity="error" sx={{ mt: 3, mb: 10 }}>{error}</Alert>}
      </Box>

      {/* DIALOG DE CATEGORIAS */}
      <Dialog open={openManageTypes} onClose={() => setOpenManageTypes(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gerenciar Categorias Internas</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, mt: 1 }}>
            <TextField label="Nova Categoria" size="small" fullWidth value={novoTipoNome} onChange={(e) => setNovoTipoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTipoReceita()} />
            <Button variant="contained" onClick={handleAddTipoReceita}>Adicionar</Button>
          </Box>
          <List dense sx={{ border: '1px solid #eee', borderRadius: 1 }}>
            {tiposReceita.map(tipo => (
              <ListItem key={tipo.id} divider secondaryAction={<IconButton edge="end" onClick={() => handleDeleteTipoReceita(tipo.id)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={tipo.nome} />
              </ListItem>
            ))}
            {tiposReceita.length === 0 && <ListItem><ListItemText primary="Nenhuma categoria cadastrada." /></ListItem>}
          </List>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenManageTypes(false)}>Fechar</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function CriarReceitaPageWrapper() {
  return <Suspense fallback={<CircularProgress />}><CriarEditarReceitaComponent /></Suspense>;
}


