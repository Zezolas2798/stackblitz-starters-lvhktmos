'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  CircularProgress, Alert, Snackbar, InputAdornment, Chip, Tooltip,
  Switch, FormControlLabel, Tabs, Tab, useTheme, alpha, Divider,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, LinearProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Search, Plus, Trash2, Edit, AlertCircle, TrendingUp, Anchor, AlertTriangle, CheckCircle, Grid as GridIcon, List as ListIcon, HelpCircle, ChevronDown, FolderOpen, Layers, Upload, FileText, Sparkles, RotateCcw } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { parseCotacaoFile, fuzzyMatchIngrediente, matchFornecedor, calcularPrecoPorKg, type CotacaoParsed, type CotacaoItemParsed } from '@/lib/utils/cotacao-parser';

export default function OrcamentosPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [macroTab, setMacroTab] = useState('ALIMENTOS');
  
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [gruposInsumos, setGruposInsumos] = useState<any[]>([]);
  const [categoriasMacro, setCategoriasMacro] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modificações locais (Planilha)
  const [modifications, setModifications] = useState<Record<string, number>>({});
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, msg: string, type: 'success'|'error'}>({open: false, msg: '', type: 'success'});

  // === UPLOAD DE COTAÇÃO ===
  const [uploadStep, setUploadStep] = useState(0); // 0=upload, 1=revisão, 2=concluído
  const [uploadParsing, setUploadParsing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [cotacaoParsed, setCotacaoParsed] = useState<CotacaoParsed | null>(null);
  const [uploadFornecedorId, setUploadFornecedorId] = useState('');
  const [uploadItensRevisados, setUploadItensRevisados] = useState<Array<{
    descricao_original: string;
    marca: string;
    unidade: string;
    quantidade_embalagem: number;
    peso_liquido_kg: number;
    preco_unitario: number;
    preco_por_kg: number;
    ingrediente_id: string;
    sugestoes: Array<{ ingrediente_id: string; ingrediente_nome: string; score: number }>;
    incluir: boolean;
  }>>([]);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadSavedCount, setUploadSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulário
  const [form, setForm] = useState({
    id: '',
    fornecedor_id: '',
    ingrediente_id: '',
    data_orcamento: new Date().toISOString().split('T')[0],
    is_embalagem: false,
    unidades_por_embalagem: 1,
    peso_volume_por_unidade: 1,
    preco_embalagem: 0,
    preco_por_kg_l: 0
  });

  useEffect(() => {
    if (activeClientId && unidadeId) {
      loadData();
    }
  }, [activeClientId, unidadeId]);

  const loadData = async () => {
    setLoading(true);
    setModifications({}); // Limpa modificações ao recarregar
    try {
      const [resOrcamentos, resFornecedores, resIngredientes, resGruposGlobal, resGruposClient, resCatsGlobal, resCatsClient] = await Promise.all([
        (supabase as any).from('compras_orcamentos').select(`
          *,
          fornecedor:fornecedores(id, razao_social, lead_time_dias),
          ingrediente:ingredientes(id, nome, subgrupo_id)
        `).eq('unidade_id', unidadeId).order('data_orcamento', { ascending: false }),
        
        (supabase as any).from('fornecedores').select('id, razao_social, lead_time_dias, grupos_fornecidos, itens_fornecidos, categorias_compras').eq('cliente_id', activeClientId).is('deleted_at', null),
        
        (supabase as any).from('ingredientes').select('id, nome, subgrupo_id, grupo_id').eq('cliente_id', activeClientId).is('deleted_at', null),
        
        (supabase as any).from('subgrupos_produto').select('id, nome, categoria_id').is('cliente_id', null),
        (supabase as any).from('subgrupos_produto').select('id, nome, categoria_id').eq('cliente_id', activeClientId),
        
        (supabase as any).from('grupos_produto').select('id, nome, modalidade').is('cliente_id', null),
        (supabase as any).from('grupos_produto').select('id, nome, modalidade').eq('cliente_id', activeClientId)
      ]);

      setOrcamentos(resOrcamentos.data || []);
      setFornecedores(resFornecedores.data || []);
      setIngredientes(resIngredientes.data || []);
      setGruposInsumos([...(resGruposGlobal.data || []), ...(resGruposClient.data || [])]);
      setCategoriasMacro([...(resCatsGlobal.data || []), ...(resCatsClient.data || [])]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const modalidadesUnicas = useMemo(() => {
    const mods = new Set(categoriasMacro.map(c => c.modalidade));
    return Array.from(mods).sort();
  }, [categoriasMacro]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        cliente_id: activeClientId,
        unidade_id: unidadeId,
        fornecedor_id: form.fornecedor_id,
        ingrediente_id: form.ingrediente_id,
        data_orcamento: form.data_orcamento,
        is_embalagem: form.is_embalagem,
        unidades_por_embalagem: form.is_embalagem ? form.unidades_por_embalagem : null,
        peso_volume_por_unidade: form.is_embalagem ? form.peso_volume_por_unidade : null,
        preco_embalagem: form.is_embalagem ? form.preco_embalagem : null,
        preco_por_kg_l: form.preco_por_kg_l
      };

      if (form.id) {
        await (supabase as any).from('compras_orcamentos').update(payload).eq('id', form.id);
      } else {
        await (supabase as any).from('compras_orcamentos').insert(payload);
      }
      
      setSnackbar({ open: true, msg: 'Orçamento salvo!', type: 'success' });
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, msg: 'Erro ao salvar', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatch = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const itemsToSave = Object.entries(modifications).map(([key, price]) => {
        const [ingId, fornId] = key.split('|');
        return {
          cliente_id: activeClientId,
          unidade_id: unidadeId,
          fornecedor_id: fornId,
          ingrediente_id: ingId,
          data_orcamento: today,
          preco_por_kg_l: price,
          is_embalagem: false
        };
      });

      if (itemsToSave.length > 0) {
        // Usar upsert ou insert múltiplo
        const { error } = await (supabase as any).from('compras_orcamentos').insert(itemsToSave);
        if (error) throw error;
        setSnackbar({ open: true, msg: `${itemsToSave.length} orçamentos salvos com sucesso!`, type: 'success' });
        loadData();
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, msg: 'Erro no salvamento em lote', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este orçamento?')) return;
    await (supabase as any).from('compras_orcamentos').delete().eq('id', id);
    loadData();
  };

  const openForm = (editItem?: any) => {
    if (editItem) {
      setForm({ ...editItem });
    } else {
      setForm({
        id: '',
        fornecedor_id: '',
        ingrediente_id: '',
        data_orcamento: new Date().toISOString().split('T')[0],
        is_embalagem: false,
        unidades_por_embalagem: 1,
        peso_volume_por_unidade: 1,
        preco_embalagem: 0,
        preco_por_kg_l: 0
      });
    }
    setDialogOpen(true);
  };

  // === UPLOAD COTAÇÃO HANDLERS ===
  const handleUploadFile = async (file: File) => {
    setUploadError('');
    setUploadParsing(true);

    try {
      const result = await parseCotacaoFile(file);

      if (!result || !result.itens || result.itens.length === 0) {
        setUploadError('Não foi possível extrair dados do arquivo. Verifique se é uma cotação válida.');
        setUploadParsing(false);
        return;
      }

      setCotacaoParsed(result);

      // Auto-match fornecedor
      const fornMatch = matchFornecedor(
        result.fornecedor_nome,
        result.fornecedor_cnpj,
        fornecedores.map(f => ({ id: f.id, razao_social: f.razao_social, cnpj: f.cnpj }))
      );
      setUploadFornecedorId(fornMatch?.id || '');

      // Preparar itens com fuzzy matching
      const subgruposParaMatch = gruposInsumos.map((s: any) => ({ id: s.id, nome: s.nome }));
      const ingredientesParaMatch = ingredientes.map((i: any) => ({ id: i.id, nome: i.nome, subgrupo_id: i.subgrupo_id || '' }));

      const itensRevisados = result.itens.map(item => {
        const matches = fuzzyMatchIngrediente(
          item.descricao_original,
          item.sugestao_subgrupo,
          ingredientesParaMatch,
          subgruposParaMatch,
          5
        );

        return {
          descricao_original: item.descricao_original,
          marca: item.marca,
          unidade: item.unidade,
          quantidade_embalagem: item.quantidade_embalagem,
          peso_liquido_kg: item.peso_liquido_kg,
          preco_unitario: item.preco_unitario,
          preco_por_kg: item.preco_por_kg,
          ingrediente_id: matches.length > 0 && matches[0].score > 0.35 ? matches[0].ingrediente_id : '',
          sugestoes: matches.map(m => ({
            ingrediente_id: m.ingrediente_id,
            ingrediente_nome: m.ingrediente_nome,
            score: m.score
          })),
          incluir: true
        };
      });

      setUploadItensRevisados(itensRevisados);
      setUploadStep(1);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setUploadError(err.message || 'Erro inesperado ao processar o arquivo.');
    } finally {
      setUploadParsing(false);
    }
  };

  const handleSaveCotacaoUpload = async () => {
    setUploadSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const itensParaSalvar = uploadItensRevisados
        .filter(item => item.incluir && item.ingrediente_id)
        .map(item => ({
          cliente_id: activeClientId,
          unidade_id: unidadeId,
          fornecedor_id: uploadFornecedorId,
          ingrediente_id: item.ingrediente_id,
          data_orcamento: cotacaoParsed?.data_cotacao || today,
          preco_por_kg_l: item.preco_por_kg,
          is_embalagem: item.peso_liquido_kg !== 1 || item.quantidade_embalagem !== 1,
          unidades_por_embalagem: item.quantidade_embalagem,
          peso_volume_por_unidade: item.peso_liquido_kg,
          preco_embalagem: item.preco_unitario,
          peso_embalagem_kg: item.peso_liquido_kg * item.quantidade_embalagem,
          marca_cotada: item.marca || null,
          descricao_fornecedor: item.descricao_original || null
        }));

      if (itensParaSalvar.length === 0) {
        setSnackbar({ open: true, msg: 'Nenhum item válido para salvar.', type: 'error' });
        setUploadSaving(false);
        return;
      }

      const { error } = await (supabase as any).from('compras_orcamentos').insert(itensParaSalvar);
      if (error) throw error;

      setUploadSavedCount(itensParaSalvar.length);
      setUploadStep(2);
      setSnackbar({ open: true, msg: `${itensParaSalvar.length} orçamentos importados!`, type: 'success' });
    } catch (err: any) {
      console.error('Erro ao salvar cotação:', err);
      setSnackbar({ open: true, msg: 'Erro ao salvar cotação: ' + (err.message || ''), type: 'error' });
    } finally {
      setUploadSaving(false);
    }
  };

  // Conversão Implícita para Embalagem
  useEffect(() => {
    if (form.is_embalagem && form.preco_embalagem > 0 && form.unidades_por_embalagem > 0 && form.peso_volume_por_unidade > 0) {
      const totalVolume = form.unidades_por_embalagem * form.peso_volume_por_unidade;
      const custoKg = form.preco_embalagem / totalVolume;
      setForm((p: any) => ({ ...p, preco_por_kg_l: Number(custoKg.toFixed(2)) }));
    }
  }, [form.is_embalagem, form.preco_embalagem, form.unidades_por_embalagem, form.peso_volume_por_unidade]);

  // Kraljic & Status Logic
  const analisarRisco = (orcamento: any) => {
    const isDefasado = differenceInDays(new Date(), parseISO(orcamento.data_orcamento)) > 7;
    const fornecedoresDesteItem = orcamentos.filter(o => o.ingrediente_id === orcamento.ingrediente_id).length;
    const escassez = fornecedoresDesteItem <= 1 ? 'ALTA' : 'BAIXA';
    const leadTime = orcamento.fornecedor?.lead_time_dias || 0;
    const leadTimeAlto = leadTime > 3;

    let matriz = 'ROTINEIRO';
    if (escassez === 'ALTA' && leadTimeAlto) matriz = 'GARGALO';
    if (escassez === 'BAIXA' && !leadTimeAlto) matriz = 'ALAVANCAGEM';
    if (escassez === 'ALTA' && !leadTimeAlto) matriz = 'ESTRATEGICO';

    return { isDefasado, matriz };
  };

  const getKraljicChip = (matriz: string) => {
    switch (matriz) {
      case 'GARGALO': return <Chip size="small" icon={<AlertTriangle size={14} />} label="Gargalo" color="error" variant="outlined" />;
      case 'ALAVANCAGEM': return <Chip size="small" icon={<TrendingUp size={14} />} label="Alavancagem" color="success" variant="outlined" />;
      case 'ESTRATEGICO': return <Chip size="small" icon={<Anchor size={14} />} label="Estratégico" color="primary" variant="outlined" />;
      default: return <Chip size="small" icon={<CheckCircle size={14} />} label="Rotineiro" color="default" variant="outlined" />;
    }
  };

  // --- LÓGICA DO QUADRO COMPARATIVO (PLANILHA) ---
  const quadroComparativo = useMemo(() => {
    // 1. Mapear categorias para suas modalidades
    const catMap: Record<string, string> = {};
    categoriasMacro.forEach(c => { catMap[c.id] = c.modalidade; });

    // 2. Filtrar INSUMOS que pertencem a esta modalidade
    const itensFiltrados = ingredientes.filter((i: any) => {
      // Prioridade 1: Categoria do Insumo
      const modInsumo = i.grupo_id ? catMap[i.grupo_id] : null;
      if (modInsumo === macroTab) return true;

      // Prioridade 2: Categoria do Grupo (se insumo não tem categoria direta)
      if (!modInsumo) {
        const grupo = gruposInsumos.find((g: any) => g.id === i.subgrupo_id);
        const modGrupo = grupo?.categoria_id ? catMap[grupo.categoria_id] : null;
        if (modGrupo === macroTab) return true;
      }

      // Fallback DIVERSOS: apenas se não tem nenhuma categoria (direta ou pai)
      if (macroTab === 'DIVERSOS') {
        const hasCategory = i.grupo_id || gruposInsumos.find((g: any) => g.id === i.subgrupo_id)?.categoria_id;
        return !hasCategory;
      }

      return false;
    }).filter(i => {
      if (!searchQuery) return true;
      return i.nome.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // 3. Agrupar os itens filtrados por Categoria Comercial (Nível 1)
    const categoryIds = Array.from(new Set(itensFiltrados.map(i => {
      if (i.grupo_id) return i.grupo_id;
      const g = gruposInsumos.find((gi: any) => gi.id === i.subgrupo_id);
      return g?.categoria_id || 'UNKNOWN';
    })));

    const resultado = categoryIds.map(catId => {
      const category = categoriasMacro.find(c => c.id === catId) || { id: catId, nome: 'Diversos / Outros' };
      
      const itensDestaCat = itensFiltrados.filter(i => {
        if (i.grupo_id === catId) return true;
        const g = gruposInsumos.find((gi: any) => gi.id === i.subgrupo_id);
        return g?.categoria_id === catId;
      });

      // 4. Dentro da categoria, agrupar por Subgrupo / Grupo de Estoque (Nível 2)
      const stockGroupIds = Array.from(new Set(itensDestaCat.map(i => i.subgrupo_id || `orphan-${i.id}`)));
      
      const subGroups = stockGroupIds.map(sgId => {
        const isOrphan = sgId.startsWith('orphan-');
        const orphanItemId = isOrphan ? sgId.split('orphan-')[1] : null;
        const itemOrfao = isOrphan ? itensDestaCat.find(i => i.id === orphanItemId) : null;
        
        const grupo = gruposInsumos.find(g => g.id === sgId) || {
          id: sgId,
          nome: isOrphan ? (itemOrfao?.nome || 'ITEM') : 'GERAL'
        };

        const itensDesteSubgrupo = isOrphan ? [itemOrfao] : itensDestaCat.filter(i => i.subgrupo_id === sgId);

        // 5. Fornecedores que atendem este Subgrupo
        const fornecedoresDoSubgrupo = fornecedores.filter((f: any) => {
          const atendeMacro = f.categorias_compras?.includes(macroTab);
          if (!atendeMacro) return false;

          const gruposFornecidosNestaModalidade = (f.grupos_fornecidos || []).filter((gid: string) => {
            const cat = categoriasMacro.find(c => c.id === gid);
            return cat?.modalidade === macroTab;
          });

          const itensFornecidosNestaModalidade = (f.itens_fornecidos || []).filter((iid: string) => {
            const it = ingredientes.find(ing => ing.id === iid);
            const itMod = it?.grupo_id ? catMap[it.grupo_id] : null;
            return itMod === macroTab;
          });

          const temFiltroGranularNestaModalidade = gruposFornecidosNestaModalidade.length > 0 || itensFornecidosNestaModalidade.length > 0;

          if (temFiltroGranularNestaModalidade) {
            const atendeCategoriaDoGrupo = !isOrphan && f.grupos_fornecidos?.includes(catId);
            const atendeCategoriaDoItem = itensDesteSubgrupo.some((it: any) => 
               it?.grupo_id && f.grupos_fornecidos?.includes(it.grupo_id)
            );
            const atendeItensEspecificos = itensDesteSubgrupo.some((it: any) => f.itens_fornecidos?.includes(it?.id));
            return atendeCategoriaDoGrupo || atendeCategoriaDoItem || atendeItensEspecificos;
          }
          return true; // Atacadista
        });

        // 6. Preços e Melhores Preços do Subgrupo
        const mapaPrecos: Record<string, any> = {};
        const melhoresPrecos: Record<string, number> = {};

        orcamentos.forEach((orc: any) => {
          if (itensDesteSubgrupo.some(it => it && it.id === orc.ingrediente_id)) {
            const key = `${orc.ingrediente_id}|${orc.fornecedor_id}`;
            if (!mapaPrecos[key]) mapaPrecos[key] = orc;
          }
        });

        itensDesteSubgrupo.forEach((it: any) => {
          if (!it) return;
          const precosItem = Object.values(mapaPrecos).filter((p: any) => p.ingrediente_id === it.id);
          if (precosItem.length > 0) {
            melhoresPrecos[it.id] = Math.min(...precosItem.map((p: any) => p.preco_por_kg_l));
          }
        });

        return {
          grupo,
          itens: itensDesteSubgrupo.filter(Boolean),
          fornecedores: fornecedoresDoSubgrupo,
          precos: mapaPrecos,
          melhoresPrecos
        };
      });

      return {
        id: catId,
        category,
        subGroups
      };
    });

    return resultado;
  }, [macroTab, ingredientes, gruposInsumos, fornecedores, orcamentos, categoriasMacro, searchQuery]);

  const modalidadesAbas = useMemo(() => {
    const mods = modalidadesUnicas.length > 0 ? modalidadesUnicas : ['ALIMENTOS'];
    return [...mods, 'DIVERSOS'];
  }, [modalidadesUnicas]);

  const hasModifications = Object.keys(modifications).length > 0;

  if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* Header com Ações Globais */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrendingUp size={32} /> Planilha de Orçamentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão integrada de preços em massa e análise setorial.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {hasModifications && (
            <>
               <Button onClick={() => setModifications({})} color="inherit">Descartar</Button>
               <Button variant="contained" color="success" onClick={handleSaveBatch} disabled={saving} startIcon={<CheckCircle />}>
                 {saving ? 'Gravando...' : `Salvar ${Object.keys(modifications).length} Alterações`}
               </Button>
            </>
          )}
          {!hasModifications && (
            <Button variant="contained" size="large" startIcon={<Plus />} onClick={() => openForm()}>
              Novo Orçamento Manual
            </Button>
          )}
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}
        >
          <Tab icon={<ListIcon size={18} />} iconPosition="start" label="Lista de Cotações" />
          <Tab icon={<GridIcon size={18} />} iconPosition="start" label="Quadro Comparativo" />
          <Tab icon={<Upload size={18} />} iconPosition="start" label="Upload de Cotação" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell>Ingrediente</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Preço Base (R$/Kg/L)</TableCell>
                    <TableCell>Vigência</TableCell>
                    <TableCell>Matriz de Risco</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orcamentos.map((orc) => {
                    const { isDefasado, matriz } = analisarRisco(orc);
                    return (
                      <TableRow key={orc.id} hover>
                        <TableCell><Typography fontWeight="bold">{orc.ingrediente?.nome}</Typography></TableCell>
                        <TableCell>{orc.fornecedor?.razao_social}</TableCell>
                        <TableCell>R$ {orc.preco_por_kg_l?.toFixed(2)}</TableCell>
                        <TableCell>
                          {isDefasado ? (
                            <Tooltip title="Mais de 7 dias.">
                              <Chip size="small" color="warning" icon={<AlertCircle size={14}/>} label="Defasado" />
                            </Tooltip>
                          ) : (
                            <Chip size="small" color="success" label="Vigente" />
                          )}
                        </TableCell>
                        <TableCell>{getKraljicChip(matriz)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openForm(orc)}><Edit size={16} /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(orc.id)}><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {orcamentos.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Nenhum orçamento registrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* SUB-TABS POR MODALIDADE */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Tabs 
                  value={macroTab} 
                  onChange={(_, v) => setMacroTab(v)} 
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    minHeight: 40,
                    '& .MuiTab-root': { py: 1, minHeight: 40, fontSize: '0.8rem', fontWeight: 600 }
                  }}
                >
                  {modalidadesAbas.map(mod => (
                    <Tab key={mod} label={mod.replace('_', ' ')} value={mod} />
                  ))}
                </Tabs>
                <TextField 
                  size="small" 
                  placeholder="Buscar insumo..." 
                  sx={{ minWidth: 250 }}
                  InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </Box>
              
              <Divider />

              {quadroComparativo.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <HelpCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <Typography color="text.secondary">Nenhum item encontrado nesta modalidade/busca.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {quadroComparativo.map((catGroup) => (
                    <Accordion 
                      key={catGroup.id} 
                      defaultExpanded={quadroComparativo.length === 1 || searchQuery.length > 0}
                      elevation={0}
                      sx={{ 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: '8px !important',
                        mb: 1,
                        '&:before': { display: 'none' },
                        overflow: 'hidden'
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ChevronDown size={20} />}
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 }
                        }}
                      >
                        <FolderOpen size={20} color={theme.palette.primary.main} />
                        <Typography variant="subtitle1" fontWeight="800" sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {catGroup.category.nome}
                        </Typography>
                        <Chip 
                          label={`${catGroup.subGroups.length} Subgrupos`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ ml: 'auto', fontWeight: 'bold', border: 'none', bgcolor: 'white' }} 
                        />
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#fafafa' }}>
                        {catGroup.subGroups.map((sub) => (
                          <Accordion 
                            key={sub.grupo.id} 
                            defaultExpanded={catGroup.subGroups.length === 1 || searchQuery.length > 0}
                            elevation={0}
                            variant="outlined"
                            sx={{ 
                              borderRadius: '6px !important',
                              '&:before': { display: 'none' }
                            }}
                          >
                            <AccordionSummary 
                              expandIcon={<ChevronDown size={18} />}
                              sx={{ 
                                minHeight: 48,
                                '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 }
                              }}
                            >
                              <Layers size={18} color={theme.palette.text.secondary} />
                              <Typography variant="body1" fontWeight="700" color="text.primary">
                                {sub.grupo.nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ({sub.itens.length} itens)
                              </Typography>
                            </AccordionSummary>
                            
                            <AccordionDetails sx={{ p: 0 }}>
                              <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 600 }}>
                                  <TableHead sx={{ bgcolor: 'white' }}>
                                    <TableRow>
                                      <TableCell sx={{ minWidth: 200, fontWeight: 'bold', borderRight: '1px solid #eee' }}>Insumos</TableCell>
                                      {sub.fornecedores.map((f: any) => (
                                        <TableCell key={f.id} align="center" sx={{ fontWeight: 'bold', minWidth: 140, borderRight: '1px solid #eee' }}>
                                          <Typography variant="caption" fontWeight="bold" sx={{ display: 'block' }}>{f.razao_social}</Typography>
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody sx={{ bgcolor: 'white' }}>
                                    {sub.itens.map((item: any) => (
                                      <TableRow key={item.id} hover>
                                        <TableCell sx={{ borderRight: '1px solid #eee', py: 1 }}>
                                          <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                        </TableCell>
                                        {sub.fornecedores.map((f: any) => {
                                          const key = `${item.id}|${f.id}`;
                                          const orc = sub.precos[key];
                                          const localVal = modifications[key];
                                          const displayVal = localVal !== undefined ? localVal : (orc?.preco_por_kg_l || '');
                                          
                                          const treatsAsModified = localVal !== undefined;
                                          const isMelhor = orc && orc.preco_por_kg_l === sub.melhoresPrecos[item.id] && !treatsAsModified;
                                          const defasado = orc && !treatsAsModified && differenceInDays(new Date(), parseISO(orc.data_orcamento)) > 7;

                                          return (
                                            <TableCell key={f.id} align="center" sx={{ p: 0.5, borderRight: '1px solid #f5f5f5' }}>
                                              <Box sx={{ position: 'relative' }}>
                                                <TextField
                                                  type="number"
                                                  variant="standard"
                                                  size="small"
                                                  value={displayVal}
                                                  placeholder="---"
                                                  onChange={(e) => {
                                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                    setModifications(prev => {
                                                      const next = { ...prev };
                                                      if (val === undefined) delete next[key];
                                                      else next[key] = val;
                                                      return next;
                                                    });
                                                  }}
                                                  sx={{ 
                                                    width: '100%',
                                                    '& .MuiInputBase-input': { 
                                                      textAlign: 'center', 
                                                      fontSize: '0.85rem',
                                                      fontWeight: treatsAsModified ? 'bold' : 'normal',
                                                      color: treatsAsModified ? 'primary.main' : 'inherit',
                                                      p: 1,
                                                      borderRadius: 1,
                                                      bgcolor: treatsAsModified ? alpha(theme.palette.primary.main, 0.05) : (isMelhor ? alpha(theme.palette.success.main, 0.05) : 'transparent'),
                                                      border: treatsAsModified ? `1px solid ${theme.palette.primary.main}` : (isMelhor ? `1px solid ${alpha(theme.palette.success.main, 0.3)}` : '1px solid transparent'),
                                                    },
                                                    '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' }
                                                  }}
                                                />
                                                {defasado && <Tooltip title="Preço antigo (!)"><AlertCircle size={10} style={{ position: 'absolute', top: -2, right: -2, color: theme.palette.warning.main }} /></Tooltip>}
                                              </Box>
                                            </TableCell>
                                          );
                                        })}
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
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Stepper */}
              <Stepper activeStep={uploadStep} alternativeLabel>
                <Step><StepLabel>Upload do Arquivo</StepLabel></Step>
                <Step><StepLabel>Revisão IA</StepLabel></Step>
                <Step><StepLabel>Confirmação</StepLabel></Step>
              </Stepper>

              {/* ETAPA 0: Upload */}
              {uploadStep === 0 && (
                <Box>
                  {uploadError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>{uploadError}</Alert>
                  )}
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 6, textAlign: 'center', cursor: 'pointer',
                      border: '2px dashed', borderColor: 'divider',
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const f = e.dataTransfer.files[0];
                      if (f) handleUploadFile(f);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadFile(f);
                      }}
                    />
                    {uploadParsing ? (
                      <Box>
                        <CircularProgress size={48} sx={{ mb: 2 }} />
                        <Typography variant="h6" color="primary">Analisando documento com IA...</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Extraindo fornecedor, itens, marcas e preços.</Typography>
                        <LinearProgress sx={{ mt: 3, mx: 'auto', maxWidth: 300 }} />
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ mx: 'auto', mb: 2, width: 72, height: 72, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={36} color={theme.palette.primary.main} />
                        </Box>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>Arraste o arquivo de cotação aqui</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>ou clique para selecionar</Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {['PDF', 'Excel', 'CSV', 'Imagem'].map(t => (
                            <Chip key={t} label={t} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ETAPA 1: Revisão IA */}
              {uploadStep === 1 && cotacaoParsed && (
                <Box>
                  {/* Fornecedor */}
                  <Paper variant="outlined" sx={{ p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Sparkles size={20} color={theme.palette.primary.main} />
                    <Typography variant="body2" fontWeight="bold">Fornecedor detectado:</Typography>
                    <Chip label={cotacaoParsed.fornecedor_nome} color="primary" variant="outlined" />
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <TextField
                        select size="small" fullWidth
                        label="Confirmar/Corrigir Fornecedor"
                        value={uploadFornecedorId}
                        onChange={(e) => setUploadFornecedorId(e.target.value)}
                      >
                        {fornecedores.map(f => <MenuItem key={f.id} value={f.id}>{f.razao_social}</MenuItem>)}
                      </TextField>
                    </Box>
                  </Paper>

                  {/* Tabela de Itens */}
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ width: 40 }}>
                            <Tooltip title="Incluir/excluir item"><CheckCircle size={16} /></Tooltip>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Descrição do Fornecedor</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Marca</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Peso (Kg)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 110 }}>Preço Unit.</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', width: 110, bgcolor: alpha(theme.palette.success.main, 0.08) }}>R$/Kg</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>Ingrediente Vinculado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadItensRevisados.map((item, idx) => (
                          <TableRow key={idx} hover sx={{ opacity: item.incluir ? 1 : 0.4 }}>
                            <TableCell padding="checkbox">
                              <Switch
                                size="small"
                                checked={item.incluir}
                                onChange={(e) => {
                                  const next = [...uploadItensRevisados];
                                  next[idx] = { ...next[idx], incluir: e.target.checked };
                                  setUploadItensRevisados(next);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{item.descricao_original}</Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small" variant="standard" value={item.marca}
                                onChange={(e) => {
                                  const next = [...uploadItensRevisados];
                                  next[idx] = { ...next[idx], marca: e.target.value };
                                  setUploadItensRevisados(next);
                                }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small" variant="standard" type="number"
                                value={item.peso_liquido_kg}
                                onChange={(e) => {
                                  const peso = Number(e.target.value) || 0.001;
                                  const novoPrecoPorKg = calcularPrecoPorKg(item.preco_unitario, peso, item.quantidade_embalagem);
                                  const next = [...uploadItensRevisados];
                                  next[idx] = { ...next[idx], peso_liquido_kg: peso, preco_por_kg: novoPrecoPorKg };
                                  setUploadItensRevisados(next);
                                }}
                                sx={{ width: 80, '& .MuiInputBase-input': { fontSize: '0.85rem', textAlign: 'center' } }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small" variant="standard" type="number"
                                value={item.preco_unitario}
                                onChange={(e) => {
                                  const preco = Number(e.target.value) || 0;
                                  const novoPrecoPorKg = calcularPrecoPorKg(preco, item.peso_liquido_kg, item.quantidade_embalagem);
                                  const next = [...uploadItensRevisados];
                                  next[idx] = { ...next[idx], preco_unitario: preco, preco_por_kg: novoPrecoPorKg };
                                  setUploadItensRevisados(next);
                                }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="caption">R$</Typography></InputAdornment> }}
                                sx={{ width: 100, '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
                              <Typography variant="body2" fontWeight="bold" color="success.dark">
                                R$ {item.preco_por_kg.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                select size="small" fullWidth
                                value={item.ingrediente_id}
                                onChange={(e) => {
                                  const next = [...uploadItensRevisados];
                                  next[idx] = { ...next[idx], ingrediente_id: e.target.value };
                                  setUploadItensRevisados(next);
                                }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                              >
                                {item.sugestoes.length > 0 && (
                                  <MenuItem disabled sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>--- Sugestões da IA ---</MenuItem>
                                )}
                                {item.sugestoes.map(s => (
                                  <MenuItem key={s.ingrediente_id} value={s.ingrediente_id}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                      <span>{s.ingrediente_nome}</span>
                                      <Chip label={`${(s.score * 100).toFixed(0)}%`} size="small" color={s.score > 0.5 ? 'success' : 'default'} sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                    </Box>
                                  </MenuItem>
                                ))}
                                {item.sugestoes.length > 0 && (
                                  <MenuItem disabled sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>--- Todos ---</MenuItem>
                                )}
                                {ingredientes
                                  .filter(i => !item.sugestoes.some(s => s.ingrediente_id === i.id))
                                  .map(i => <MenuItem key={i.id} value={i.id}>{i.nome}</MenuItem>)
                                }
                              </TextField>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
                    <Button startIcon={<RotateCcw size={16} />} onClick={() => { setUploadStep(0); setCotacaoParsed(null); }} color="inherit">
                      Novo Upload
                    </Button>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {uploadItensRevisados.filter(i => i.incluir && i.ingrediente_id).length} de {uploadItensRevisados.length} itens vinculados
                      </Typography>
                      <Button
                        variant="contained" size="large"
                        startIcon={uploadSaving ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
                        onClick={handleSaveCotacaoUpload}
                        disabled={uploadSaving || !uploadFornecedorId || uploadItensRevisados.filter(i => i.incluir && i.ingrediente_id).length === 0}
                      >
                        {uploadSaving ? 'Salvando...' : 'Confirmar e Salvar Cotação'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ETAPA 2: Concluído */}
              {uploadStep === 2 && (
                <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
                  <Box sx={{ mx: 'auto', mb: 2, width: 64, height: 64, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={32} color={theme.palette.success.main} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>Cotação Importada!</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {uploadSavedCount} orçamentos foram salvos com sucesso na planilha.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="outlined" startIcon={<Upload size={16} />} onClick={() => { setUploadStep(0); setCotacaoParsed(null); setUploadSavedCount(0); }}>
                      Importar Outra Cotação
                    </Button>
                    <Button variant="contained" onClick={() => { setTabValue(1); loadData(); }}>
                      Ver no Quadro Comparativo
                    </Button>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* MODAL FORMULARIO */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{form.id ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            <TextField 
              select 
              label="Ingrediente / Insumo" 
              fullWidth 
              value={form.ingrediente_id} 
              onChange={(e) => setForm({...form, ingrediente_id: e.target.value})}
            >
              {ingredientes.map(i => <MenuItem key={i.id} value={i.id}>{i.nome}</MenuItem>)}
            </TextField>

            <TextField select label="Fornecedor" fullWidth value={form.fornecedor_id} onChange={(e) => setForm({...form, fornecedor_id: e.target.value})}>
              {fornecedores.map(f => <MenuItem key={f.id} value={f.id}>{f.razao_social}</MenuItem>)}
            </TextField>

            <TextField type="date" label="Data Base do Orçamento" fullWidth value={form.data_orcamento} onChange={(e) => setForm({...form, data_orcamento: e.target.value})} InputLabelProps={{ shrink: true }} />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <FormControlLabel 
                control={<Switch checked={form.is_embalagem} onChange={e => setForm({...form, is_embalagem: e.target.checked})} />} 
                label="Cotação por Embalagem Fechada (Fardo/Caixa)" 
              />

              {form.is_embalagem ? (
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">O padrão WMS exige conversão para preço por Unidade de Medida (Kg ou Litro).</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField type="number" label="Unidades no Vol." size="small" value={form.unidades_por_embalagem} onChange={e => setForm({...form, unidades_por_embalagem: Number(e.target.value)})} />
                      <TextField type="number" label="Peso Liq. Unit (Kg/L)" size="small" value={form.peso_volume_por_unidade} onChange={e => setForm({...form, peso_volume_por_unidade: Number(e.target.value)})} />
                    </Box>
                    <TextField 
                      type="number" 
                      label="Preço Total do Volume" 
                      InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment>}} 
                      fullWidth 
                      value={form.preco_embalagem} 
                      onChange={e => setForm({...form, preco_embalagem: Number(e.target.value)})} 
                    />
                    <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
                       <Typography variant="body2" fontWeight="bold" color="success.dark">Custo Equivalente: R$ {form.preco_por_kg_l?.toFixed(2)} / Kg-L</Typography>
                    </Box>
                 </Box>
              ) : (
                  <TextField 
                    type="number" 
                    label="Preço Padrão (R$ por Kg ou Litro)" 
                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment>}} 
                    fullWidth 
                    value={form.preco_por_kg_l} 
                    onChange={e => setForm({...form, preco_por_kg_l: Number(e.target.value)})} 
                  />
              )}
            </Paper>

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.ingrediente_id || !form.fornecedor_id}>
            {saving ? 'Processando...' : 'Confirmar Orçamento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
