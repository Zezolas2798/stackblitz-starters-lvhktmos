'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Container, Tabs, Tab, Chip, useTheme, alpha, TextField, Button,
  Grid, Autocomplete, IconButton, MenuItem, Collapse, Divider, Tooltip, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ShoppingCart, Package, ChevronDown, ChevronRight, Hash, Save, Info,
  Calculator, ListChecks, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';

interface RequisicaoFalta {
  id: string;
  ordem_id: string;
  ingrediente_id: string | null;
  grupo_estoque_id: string | null;
  qtd_necessaria_g: number;
  qtd_separada_g: number;
  status: string;
  status_compras: string;
  created_at: string;
  ingredientes: { id: string; nome: string; estoque_minimo_kg: number | null } | null;
  ingredientes_grupos: { id: string; nome: string } | null;
  producao_ordens: { id: string; codigo: string; titulo: string | null; data_prevista: string | null; margem_erro_compras: number } | null;
}

interface UanCompraItem {
  cardapio_id: string;
  ingrediente_id: string;
  nome_insumo: string;
  necessidade_bruta_kg: number;
  estoque_atual_kg: number;
  estoque_minimo_kg: number;
  margem_individual: number;
  quantidade_comprar_kg: number;
  quantidade_ja_comprada_kg: number;
  status_compras: string;
}

export default function ComprasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState<RequisicaoFalta[]>([]);
  const [selectedOpItems, setSelectedOpItems] = useState<string[]>([]);
  const [selectedUanItems, setSelectedUanItems] = useState<string[]>([]);
  
  // --- UAN STATE ---
  const [cardapios, setCardapios] = useState<any[]>([]);
  const [selectedCardapioIds, setSelectedCardapioIds] = useState<string[]>([]);
  const [uanItems, setUanItems] = useState<UanCompraItem[]>([]);
  const [uanGlobalMargins, setUanGlobalMargins] = useState<Record<string, number>>({});
  const [uanMarginMode, setUanMarginMode] = useState<'global' | 'detailed'>('global');
  const [loadingUan, setLoadingUan] = useState(false);

  // --- ESTOQUE FÍSICO STATE ---
  const [estoqueFisicoTotais, setEstoqueFisicoTotais] = useState<Record<string, number>>({});

  // --- REQUISICOES HANDLERS ---
  const loadRequisicoes = useCallback(async () => {
    if (!unidadeId) return;
    setLoading(true);
    try {
      const { data, error: err } = await (supabase as any)
        .from('producao_requisicoes')
        .select(`
          id, ordem_id, ingrediente_id, grupo_estoque_id, qtd_necessaria_g, qtd_separada_g, status, status_compras, created_at,
          ingredientes ( id, nome, estoque_minimo_kg ),
          ingredientes_grupos ( id, nome ),
          producao_ordens!inner ( id, codigo, titulo, data_prevista, unidade_id, margem_erro_compras, status )
        `)
        .eq('producao_ordens.unidade_id', unidadeId)
        .eq('status_compras', 'PENDENTE')
        .not('producao_ordens.status', 'in', '("CONCLUIDA", "CANCELADA")')
        .in('status', ['PENDENTE', 'FALTA_ESTOQUE'])
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRequisicoes((data as any) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [unidadeId]);

  // --- UAN HANDLERS ---
  const loadUanCardapios = useCallback(async () => {
    if (!activeClientId) return;
    const { data } = await (supabase as any).from('cardapios_uan').select('*').eq('cliente_id', activeClientId).order('data_inicio', { ascending: false });
    if (data) setCardapios(data);
  }, [activeClientId]);

  const loadUanDetails = useCallback(async () => {
    if (!activeClientId || cardapios.length === 0) return;
    setLoadingUan(true);
    try {
      const targetIds = selectedCardapioIds.length > 0 ? selectedCardapioIds : cardapios.map(c => c.id);
      
      const marginRes = await (supabase as any).from('cardapios_uan').select('id, margem_erro_compras_global').in('id', targetIds);
      const globalMargins: Record<string, number> = {};
      marginRes.data?.forEach((m: any) => globalMargins[m.id] = m.margem_erro_compras_global || 0);
      setUanGlobalMargins(globalMargins);

      const { data: marginConfigs } = await (supabase as any).from('uan_cardapio_insumos_config').select('*').in('cardapio_id', targetIds);
      const detailedMarginMap = new Map<string, number>(); // key: cardapioId|ingId
      marginConfigs?.forEach((m: any) => detailedMarginMap.set(`${m.cardapio_id}|${m.ingrediente_id}`, m.margem_erro));

      const { data: gradeData } = await (supabase as any).from('cardapio_dias_uan').select('cardapio_id, ficha_uan_id, data_consumo, tipo_refeicao, fator_multiplicador').in('cardapio_id', targetIds);
      if (!gradeData?.length) { setUanItems([]); return; }

      const totalPortionsPerFicha: Record<string, Record<string, number>> = {}; // cardapioId -> fichaId -> count
      gradeData.forEach((item: any) => {
        const cardapio = cardapios.find(c => c.id === item.cardapio_id);
        if (!cardapio) return;
        const config = cardapio.config_excecoes_dias?.[item.data_consumo] || {};
        const d = new Date(item.data_consumo + 'T12:00:00Z');
        const dayOfWeek = d.getDay().toString();
        const comensaisRef = config.comensais?.[item.tipo_refeicao] ?? cardapio.comensais_modelo?.[dayOfWeek]?.[item.tipo_refeicao] ?? cardapio.comensais_estimados_dia;
        
        if (!totalPortionsPerFicha[item.cardapio_id]) totalPortionsPerFicha[item.cardapio_id] = {};
        totalPortionsPerFicha[item.cardapio_id][item.ficha_uan_id] = (totalPortionsPerFicha[item.cardapio_id][item.ficha_uan_id] || 0) + (comensaisRef * (item.fator_multiplicador || 1));
      });

      const allFichaIds = Array.from(new Set(gradeData.map((g: any) => g.ficha_uan_id)));
      const { data: compData } = await (supabase as any).from('composicao_fichas_uan').select('ficha_uan_id, ingrediente_id, peso_bruto_g').in('ficha_uan_id', allFichaIds);
      
      const ingIds = Array.from(new Set(compData?.map((c: any) => c.ingrediente_id) || []));
      const { data: ingData } = await (supabase as any).from('ingredientes').select('id, nome, estoque_minimo_kg').in('id', ingIds);

      const { data: uanMonitoring } = await (supabase as any).from('uan_compras_monitoramento').select('*').in('cardapio_id', targetIds);
      const monitMap = new Map<string, any>(); // key: cardapioId|ingId
      uanMonitoring?.forEach((m: any) => monitMap.set(`${m.cardapio_id}|${m.ingrediente_id}`, m));

      const finalItems: UanCompraItem[] = [];
      targetIds.forEach(cid => {
        const portions = totalPortionsPerFicha[cid];
        if (!portions) return;

        const cycleItemsMap: Record<string, UanCompraItem> = {};
        compData?.forEach((comp: any) => {
          if (!portions[comp.ficha_uan_id]) return;
          
          const ing = ingData?.find((i: any) => i.id === comp.ingrediente_id);
          const monitKey = `${cid}|${comp.ingrediente_id}`;
          const monit = monitMap.get(monitKey);
          const necKg = (comp.peso_bruto_g * (portions[comp.ficha_uan_id] || 0)) / 1000;

          if (!cycleItemsMap[comp.ingrediente_id]) {
            cycleItemsMap[comp.ingrediente_id] = {
              cardapio_id: cid,
              ingrediente_id: comp.ingrediente_id,
              nome_insumo: ing?.nome || 'Insumo',
              necessidade_bruta_kg: 0,
              estoque_atual_kg: 0,
              estoque_minimo_kg: 0,
              margem_individual: detailedMarginMap.get(monitKey) || 0,
              quantidade_comprar_kg: 0,
              quantidade_ja_comprada_kg: monit?.quantidade_comprada || 0,
              status_compras: monit?.status_compras || 'PENDENTE'
            };
          }
          cycleItemsMap[comp.ingrediente_id].necessidade_bruta_kg += necKg;
        });

        Object.values(cycleItemsMap).forEach(it => {
          const margin = uanMarginMode === 'global' ? (globalMargins[cid] || 0) : it.margem_individual;
          const totalNec = it.necessidade_bruta_kg * (1 + margin / 100);
          it.quantidade_comprar_kg = Math.max(0, totalNec - it.quantidade_ja_comprada_kg);
          if (it.status_compras === 'PENDENTE') finalItems.push(it);
        });
      });

      setUanItems(finalItems);
    } finally { setLoadingUan(false); }
  }, [selectedCardapioIds, cardapios, activeClientId, uanMarginMode]);

  useEffect(() => { loadRequisicoes(); loadUanCardapios(); }, [loadRequisicoes, loadUanCardapios]);
  useEffect(() => { loadUanDetails(); }, [selectedCardapioIds, uanMarginMode, loadUanDetails]);

  const loadEstoqueFisico = useCallback(async () => {
    if (!unidadeId) return;
    try {
      const { data } = await (supabase as any)
        .from('lotes_estoque')
        .select('ingrediente_id, qtd_atual_g')
        .eq('unidade_id', unidadeId)
        .gt('qtd_atual_g', 0);
      
      const balances: Record<string, number> = {};
      data?.forEach((l: any) => {
        if (l.ingrediente_id) {
           balances[l.ingrediente_id] = (balances[l.ingrediente_id] || 0) + l.qtd_atual_g;
        }
      });
      setEstoqueFisicoTotais(balances);
    } catch(err) {
      console.error(err);
    }
  }, [unidadeId]);

  useEffect(() => { loadEstoqueFisico(); }, [loadEstoqueFisico]);

  // --- MARGIN UPDATE HANDLERS ---
  const updateOpMargin = async (ordemId: string, margin: number) => {
    setRequisicoes(prev => prev.map(r => r.ordem_id === ordemId ? { ...r, producao_ordens: { ...r.producao_ordens!, margem_erro_compras: margin } } : r));
    await (supabase as any).from('producao_ordens').update({ margem_erro_compras: margin }).eq('id', ordemId);
  };

  const updateUanGlobalMargin = async (cardapioId: string, val: number) => {
    setUanGlobalMargins(prev => ({ ...prev, [cardapioId]: val }));
    await (supabase as any).from('cardapios_uan').update({ margem_erro_compras_global: val }).eq('id', cardapioId);
  };

  const updateUanItemMargin = async (cardapioId: string, ingId: string, margin: number) => {
    setUanItems(prev => prev.map(it => (it.cardapio_id === cardapioId && it.ingrediente_id === ingId) ? { ...it, margem_individual: margin } : it));
    await (supabase as any).from('uan_cardapio_insumos_config').upsert({ cardapio_id: cardapioId, ingrediente_id: ingId, margem_erro: margin }, { onConflict: 'cardapio_id,ingrediente_id' });
  };

  const handleMarkAsPurchased = async () => {
    if (selectedOpItems.length > 0) {
      await (supabase as any).from('producao_requisicoes').update({ status_compras: 'COMPRADO', comprado_em: new Date().toISOString() }).in('id', selectedOpItems);
    }

    if (selectedUanItems.length > 0) {
      const updates = selectedUanItems.map(compositeKey => {
        const [cid, iid] = compositeKey.split('|');
        const item = uanItems.find(it => it.cardapio_id === cid && it.ingrediente_id === iid);
        const margin = uanMarginMode === 'global' ? (uanGlobalMargins[cid] || 0) : (item?.margem_individual || 0);
        return {
          cardapio_id: cid,
          ingrediente_id: iid,
          quantidade_comprada: item ? (item.necessidade_bruta_kg * (1 + margin / 100)) : 0,
          status_compras: 'COMPRADO',
          updated_at: new Date().toISOString()
        };
      });
      await (supabase as any).from('uan_compras_monitoramento').upsert(updates, { onConflict: 'cardapio_id,ingrediente_id' });
    }

    setSelectedOpItems([]);
    setSelectedUanItems([]);
    await loadRequisicoes();
    await loadUanDetails();
  };

  // --- CONSOLIDATED LOGIC ---
  const consolidatedView = useMemo(() => {
    const map: Record<string, { nome: string, totalOp: number, totalUan: number, demandaTotal: number, estoqueMinimo: number, estoqueFisico: number, sugestaoCompra: number, isGrupo: boolean }> = {};

    // Group OP
    requisicoes.forEach(req => {
      const key = req.ingrediente_id || req.grupo_estoque_id || '';
      if (!key) return;
      const margin = req.producao_ordens?.margem_erro_compras || 0;
      const faltaG = (req.qtd_necessaria_g - req.qtd_separada_g) * (1 + margin / 100);
      const estMinKg = req.ingredientes?.estoque_minimo_kg || 0;
      
      if (!map[key]) map[key] = { 
        nome: (req.ingredientes?.nome || req.ingredientes_grupos?.nome || ''), 
        totalOp: 0, totalUan: 0, demandaTotal: 0, 
        estoqueMinimo: estMinKg, 
        estoqueFisico: (estoqueFisicoTotais[key] || 0) / 1000, 
        sugestaoCompra: 0, 
        isGrupo: !!req.grupo_estoque_id 
      };
      map[key].totalOp += faltaG / 1000;
    });

    // Group UAN
    uanItems.forEach(it => {
      const key = it.ingrediente_id;
      if (!map[key]) {
        map[key] = { 
          nome: it.nome_insumo, 
          totalOp: 0, totalUan: 0, demandaTotal: 0, 
          estoqueMinimo: it.estoque_minimo_kg || 0,
          estoqueFisico: (estoqueFisicoTotais[key] || 0) / 1000,
          sugestaoCompra: 0, 
          isGrupo: false 
        };
      }
      map[key].totalUan += it.quantidade_comprar_kg;
    });

    return Object.values(map).map(it => {
      it.demandaTotal = it.totalOp + it.totalUan;
      // Lógica de Par Level: Sugestão = Demanda + Mínimo (Buffer) - Físico Atual
      // Só sugerimos a compra se a matemática indicar um gap ou se o físico for inferior ao mínimo/buffer exigido.
      const suggested = (it.demandaTotal + it.estoqueMinimo) - it.estoqueFisico;
      it.sugestaoCompra = Math.max(0, suggested);
      return it;
    }).filter(it => it.sugestaoCompra > 0 || it.demandaTotal > 0)
      .sort((a,b) => a.nome.localeCompare(b.nome));
  }, [requisicoes, uanItems, estoqueFisicoTotais]);

  const groupedByOP = useMemo(() => {
    const map: Record<string, any> = {};
    requisicoes.forEach(req => {
      const oid = req.ordem_id;
      if (!map[oid]) map[oid] = { ...req.producao_ordens, itens: [] };
      map[oid].itens.push(req);
    });
    return Object.values(map);
  }, [requisicoes]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calculator size={28} /> Planejamento de Compras
        </Typography>
        <Typography variant="body1" color="text.secondary">Geração de necessidades consolidadas com margem de segurança.</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ px: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Tab icon={<Hash size={18} />} iconPosition="start" label={`Requisições OP (${requisicoes.length})`} sx={{ fontWeight: 'bold' }} />
          <Tab icon={<ShoppingCart size={18} />} iconPosition="start" label={`Requisições UAN (${uanItems.length})`} sx={{ fontWeight: 'bold' }} />
          <Tab icon={<Layers size={18} />} iconPosition="start" label="Lista Consolidada" sx={{ fontWeight: 'bold' }} />
        </Tabs>

        {(selectedOpItems.length > 0 || selectedUanItems.length > 0) && (
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {selectedOpItems.length + selectedUanItems.length} itens selecionados
            </Typography>
            <Button variant="contained" color="success" size="small" onClick={handleMarkAsPurchased} startIcon={<Save size={16} />}>
              Marcar como Comprado
            </Button>
          </Box>
        )}

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              {loading ? <CircularProgress /> : groupedByOP.length === 0 ? <Alert severity="info">Sem requisições pendentes.</Alert> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {groupedByOP.map(op => (
                    <Paper key={op.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                           <Box>
                              <Typography variant="subtitle1" fontWeight="bold" color="primary">{op.titulo}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                 <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>#{op.codigo}</Typography>
                                 {op.data_prevista && (
                                   <>
                                     <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                                     <Typography variant="caption" color="text.secondary">
                                       Previsto para: <strong>{format(parseISO(op.data_prevista), 'dd/MM/yyyy')}</strong>
                                     </Typography>
                                   </>
                                 )}
                              </Box>
                           </Box>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Typography variant="caption" fontWeight="bold">Margem (%):</Typography>
                             <TextField type="number" size="small" sx={{ width: 80 }} value={op.margem_erro_compras} onChange={e => updateOpMargin(op.id, parseFloat(e.target.value) || 0)} />
                           </Box>
                        </Box>
                       <Table size="small">
                          <TableHead><TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Insumo</TableCell>
                            <TableCell align="right">Falta Original</TableCell>
                            <TableCell align="right">C/ Margem</TableCell>
                          </TableRow></TableHead>
                          <TableBody>{op.itens.map((req: any) => {
                            const original = (req.qtd_necessaria_g - req.qtd_separada_g) / 1000;
                            const comMargem = original * (1 + (op.margem_erro_compras || 0) / 100);
                            const isSelected = selectedOpItems.includes(req.id);
                            return (
                              <TableRow key={req.id} selected={isSelected}>
                                <TableCell padding="checkbox">
                                  <Switch size="small" checked={isSelected} onChange={e => {
                                    if (e.target.checked) setSelectedOpItems(prev => [...prev, req.id]);
                                    else setSelectedOpItems(prev => prev.filter(id => id !== req.id));
                                  }} />
                                </TableCell>
                                <TableCell>{req.ingredientes?.nome || req.ingredientes_grupos?.nome}</TableCell>
                                <TableCell align="right">{original.toFixed(3)} kg</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{comMargem.toFixed(3)} kg</TableCell>
                              </TableRow>
                            )
                          })}</TableBody>
                       </Table>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
               <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                 <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        multiple
                        options={cardapios}
                        getOptionLabel={(o) => `${o.nome_ciclo} (${format(parseISO(o.data_inicio), 'dd/MM/yyyy')})`}
                        value={cardapios.filter(c => selectedCardapioIds.includes(c.id))}
                        onChange={(_, val) => setSelectedCardapioIds(val.map(v => v.id))}
                        renderInput={(params) => <TextField {...params} label="Filtrar Cardápios Específicos" placeholder="Todos por padrão" />}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel control={<Switch checked={uanMarginMode === 'detailed'} onChange={e => setUanMarginMode(e.target.checked ? 'detailed' : 'global')} />} label="Margem Detalhada por Insumo" />
                    </Grid>
                 </Grid>
               </Paper>

               {loadingUan ? <CircularProgress /> : (
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                   {cardapios
                    .filter(c => selectedCardapioIds.length === 0 || selectedCardapioIds.includes(c.id))
                    .map(c => {
                      const items = uanItems.filter(it => it.cardapio_id === c.id);
                      if (items.length === 0) return null;
                      return (
                        <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle1" fontWeight="bold" color="primary">{c.nome_ciclo} - {format(parseISO(c.data_inicio), 'dd/MM/yyyy')}</Typography>
                              {uanMarginMode === 'global' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" fontWeight="bold">Margem Global (%):</Typography>
                                  <TextField type="number" size="small" sx={{ width: 80 }} value={uanGlobalMargins[c.id] || 0} onChange={e => updateUanGlobalMargin(c.id, parseFloat(e.target.value) || 0)} />
                                </Box>
                              )}
                           </Box>
                           <Table size="small">
                              <TableHead sx={{ bgcolor: 'action.hover' }}>
                                 <TableRow>
                                   <TableCell padding="checkbox" />
                                   <TableCell>Insumo</TableCell>
                                   <TableCell align="right">Nec. Líquida (kg)</TableCell>
                                   {uanMarginMode === 'detailed' && <TableCell align="right">Margem (%)</TableCell>}
                                   <TableCell align="right">A Comprar (Total)</TableCell>
                                 </TableRow>
                              </TableHead>
                              <TableBody>{items.map(it => {
                                const compositeKey = `${it.cardapio_id}|${it.ingrediente_id}`;
                                const isSelected = selectedUanItems.includes(compositeKey);
                                return (
                                 <TableRow key={compositeKey} selected={isSelected}>
                                    <TableCell padding="checkbox">
                                      <Switch size="small" checked={isSelected} onChange={e => {
                                        if (e.target.checked) setSelectedUanItems(prev => [...prev, compositeKey]);
                                        else setSelectedUanItems(prev => prev.filter(k => k !== compositeKey));
                                      }} />
                                    </TableCell>
                                    <TableCell>{it.nome_insumo}</TableCell>
                                    <TableCell align="right">{it.necessidade_bruta_kg.toFixed(3)}</TableCell>
                                    {uanMarginMode === 'detailed' && (
                                      <TableCell align="right">
                                        <TextField type="number" size="small" sx={{ width: 80 }} value={it.margem_individual} onChange={e => updateUanItemMargin(it.cardapio_id, it.ingrediente_id, parseFloat(e.target.value) || 0)} />
                                      </TableCell>
                                    )}
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{it.quantidade_comprar_kg.toFixed(3)} kg</TableCell>
                                 </TableRow>
                                );
                              })}</TableBody>
                           </Table>
                        </Paper>
                      );
                    })}
                 </Box>
               )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
               <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><ListChecks size={20} /> Total Consolidado das Necessidades</Typography>
               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>* Apenas itens marcados como PENDENTE em ambas as fontes.</Typography>
               <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table>
                     <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Insumo / Material</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Demanda (kg)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stk. Mín.(kg)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stk. Atual(kg)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sugestão (kg)</TableCell>
                        </TableRow>
                     </TableHead>
                     <TableBody>{consolidatedView.map((it, idx) => (
                        <TableRow key={idx} hover>
                           <TableCell>
                             <Typography fontWeight="bold">{it.nome}</Typography>
                             {it.isGrupo && <Chip label="Grupo" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />}
                           </TableCell>
                           <TableCell align="right">
                             <Tooltip title={`OP: ${it.totalOp.toFixed(2)} | UAN: ${it.totalUan.toFixed(2)}`}>
                               <span>{it.demandaTotal.toFixed(3)}</span>
                             </Tooltip>
                           </TableCell>
                           <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>{it.estoqueMinimo.toFixed(3)}</TableCell>
                           <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>{it.estoqueFisico.toFixed(3)}</TableCell>
                           <TableCell align="right">
                              <Typography color="error.main" fontWeight="800" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'error.50', px: 1, py: 0.5, borderRadius: 1 }}>
                                {it.sugestaoCompra.toFixed(3)} kg
                              </Typography>
                           </TableCell>
                        </TableRow>
                     ))}</TableBody>
                  </Table>
               </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
