'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  Chip, LinearProgress, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  CircularProgress, Alert, Container, useTheme, alpha,
  Divider, Tooltip, List, ListItemButton, Breadcrumbs,
  Link, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab
} from '@mui/material';
import { format, addDays, parseISO } from 'date-fns';
import { Layers, ChevronRight, Play, CheckCircle, ChefHat, Info, History, Trash2, Tag, Printer, Save, MapPin, Calendar, User, ArrowLeft, ClipboardList, Clock, Package, ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    if (unidadeId && setorId) {
      fetchData();
    }
  }, [unidadeId, setorId]);

  async function fetchData() {
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
          receitas ( nome, modo_preparo, rendimento_total_g ),
          producao_ordens ( id, codigo, titulo, status, data_prevista )
        `)
        .in('producao_ordens.status', ['PLANEJADA', 'SEPARADA', 'EM_PRODUCAO'])
        .eq('producao_ordens.unidade_id', unidadeId);

      if (setorId === 'unassigned') {
        query = query.is('setor_producao_id', null);
      } else {
        query = query.eq('setor_producao_id', setorId);
      }

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
    } catch (err: any) {
      console.error(err);
      // setError('Erro ao carregar dados do setor.'); // Assuming setError is defined elsewhere or removed
    } finally {
      setLoading(false);
    }
  }

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

      // 4. Calcular o fator de escala
      // Se a receita tem rendimento de 1000g e a OP pede 1000g, o fator é 1.
      // Se rendimento_total_g for 0 ou nulo, usamos 1 como base.
      const yieldBase = item.receitas.rendimento_total_g || 1;
      const factor = item.quantidade_planejada / yieldBase;

      // 5. Montar a lista de insumos específicos
      const computedReqs = (comp || []).map(c => {
        const itemIdStr = c.item_id?.toString();
        const reqMatch = reqs?.find(r => r.ingrediente_id?.toString() === itemIdStr || r.grupo_estoque_id?.toString() === itemIdStr);
        
        return {
          id: c.id,
          ingrediente_id: c.item_id,
          nome: nameMap.get(itemIdStr) || 'Insumo',
          qtd_necessaria_g: (c.peso_liquido_g || 0) * factor,
          qtd_separada_g: reqMatch ? (reqMatch.qtd_separada_g * ((c.peso_liquido_g * factor) / (reqMatch.qtd_necessaria_g || 1))) : 0 
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

      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History size={22} color={theme.palette.primary.main} />
                      <Typography variant="h6" fontWeight="bold">OP: {ordem.codigo}</Typography>
                    </Box>
                    <Chip 
                      label={ordem.titulo || 'Sem título'} 
                      size="small" 
                      sx={{ fontWeight: 'bold', bgcolor: 'white', border: '1px solid', borderColor: 'divider' }} 
                    />
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} /> Previsão: {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : '-'}
                      </Typography>
                      <Button 
                        size="small" 
                        variant="soft" 
                        color="secondary"
                        startIcon={<Layers size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSobrasOP(ordem);
                        }}
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Sobras/Perdas
                      </Button>
                      <Chip 
                        label={ordem.status} 
                        size="small" 
                        color={ordem.status === 'EM_PRODUCAO' ? 'info' : 'default'} 
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
                        return (
                          <TableRow key={req.id}>
                            <TableCell>{req.nome}</TableCell>
                            <TableCell align="right">
                              {req.qtd_necessaria_g >= 1000 
                                ? `${(req.qtd_necessaria_g / 1000).toFixed(2)}kg` 
                                : `${req.qtd_necessaria_g.toFixed(0)}g`}
                            </TableCell>
                            <TableCell align="right" sx={{ color: falta > 0.1 ? 'warning.main' : 'success.main', fontWeight: 'bold' }}>
                              {req.qtd_separada_g >= 1000 
                                ? `${(req.qtd_separada_g / 1000).toFixed(2)}kg` 
                                : `${req.qtd_separada_g.toFixed(0)}g`}
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
    </Container>
  );
}
