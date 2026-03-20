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
  Link, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  ChefHat, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ArrowLeft,
  ClipboardList,
  Layers,
  Trash2,
  Save,
  Clock,
  Package,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';

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
  const [error, setError] = useState('');

  // Estados do Dialog de Execução
  const [selectedItem, setSelectedItem] = useState<ItemProducao | null>(null);
  const [requisicoes, setRequisicoes] = useState<RequisicaoItem[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [qtdProduzida, setQtdProduzida] = useState<number>(0);
  const [sobra, setSobra] = useState<number>(0);
  const [resto, setResto] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (unidadeId && setorId) {
      fetchData();
    }
  }, [unidadeId, setorId]);

  async function fetchData() {
    setLoading(true);
    setError('');
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
      setError('Erro ao carregar dados do setor.');
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

      if (sobra > 0) {
        await supabase.from('producao_perdas').insert({
          unidade_id: unidadeId,
          item_ordem_id: selectedItem.id,
          quantidade_perdida: sobra,
          tipo_perda: 'SOBRA',
          motivo_perda: 'Sobra de produção aproveitável'
        });
      }
      if (resto > 0) {
        await supabase.from('producao_perdas').insert({
          unidade_id: unidadeId,
          item_ordem_id: selectedItem.id,
          quantidade_perdida: resto,
          tipo_perda: 'RESTO',
          motivo_perda: 'Resto de produção não aproveitável'
        });
      }
      
      setSelectedItem(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produção.');
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
          <ArrowLeft size={20} />
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {Object.keys(itensPorOrdem).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Package size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
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
                  expandIcon={<ChevronDown size={20} />}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ClipboardList size={22} color={theme.palette.primary.main} />
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

      {/* Dialog de Execução (Reutilizado do componente anterior) */}
      <Dialog open={!!selectedItem} onClose={() => !salvando && setSelectedItem(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Play size={24} color={theme.palette.success.main} />
          Execução: {selectedItem?.receitas?.nome}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClipboardList size={20} /> Insumos do Item
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
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 3 }}>Apontamento</Typography>
                <TextField 
                  label="Quantidade Produzida"
                  type="number"
                  fullWidth
                  value={qtdProduzida}
                  onChange={(e) => setQtdProduzida(Number(e.target.value))}
                  sx={{ mb: 3 }}
                  helperText="Quantidade adicionada ao total já produzido."
                />
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Trash2 size={16} /> Desperdício
                </Typography>
                <TextField 
                  label="Sobra (Aproveitável)"
                  type="number"
                  fullWidth size="small"
                  value={sobra}
                  onChange={(e) => setSobra(Number(e.target.value))}
                  sx={{ mb: 2 }}
                />
                <TextField 
                  label="Resto (Descartado)"
                  type="number"
                  fullWidth size="small"
                  value={resto}
                  onChange={(e) => setResto(Number(e.target.value))}
                />
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
    </Container>
  );
}
