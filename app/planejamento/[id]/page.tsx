'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Chip, IconButton, Container,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, useTheme, alpha
} from '@mui/material';
import { ArrowLeft, ChefHat, Package, CheckCircle, AlertTriangle, Save, Edit2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';

interface OrdemProducao {
  id: string;
  codigo: string;
  titulo: string | null;
  status: string;
  data_prevista: string | null;
  created_at: string | null;
}

interface OrdemItem {
  id: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  receita_id: string;
  setor_producao_id: string | null;
  receitas: { nome: string };
  cliente_setores_producao?: { id: string; nome: string } | null;
}

interface Requisicao {
  id: string;
  ingrediente_id: string | null;
  grupo_estoque_id: string | null;
  qtd_necessaria_g: number;
  qtd_separada_g: number;
  status: string;
  ingredientes: {
    nome: string;
  } | null;
  ingredientes_grupos: {
    nome: string;
  } | null;
}


interface ReceitaOpt {
  id: string;
  nome: string;
}

interface EditItemInput {
  tempId: string;
  receita_id: string;
  quantidade_planejada: number;
  setor_producao_id: string;
}

export default function DetalhesOrdemPage({ params }: { params: { id: string } }) {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [ordem, setOrdem] = useState<OrdemProducao | null>(null);
  const [itens, setItens] = useState<OrdemItem[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [error, setError] = useState('');

  // Edit Order Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDataPrevista, setEditDataPrevista] = useState('');
  const [editStatus, setEditStatus] = useState('PENDENTE');
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Edit Products Dialog State
  const [editProductsDialogOpen, setEditProductsDialogOpen] = useState(false);
  const [editItens, setEditItens] = useState<EditItemInput[]>([]);
  const [salvandoProducts, setSalvandoProducts] = useState(false);
  const [receitasOpts, setReceitasOpts] = useState<ReceitaOpt[]>([]);
  const [setoresOpts, setSetoresOpts] = useState<{ id: string; nome: string }[]>([]);


  async function loadOrdem() {
    if (!unidadeId) return;
    setLoading(true);
    setError('');

    try {
      const { data: ordemData, error: ordemErr } = await (supabase as any)
        .from('producao_ordens')
        .select('*')
        .eq('id', params.id)
        .eq('unidade_id', unidadeId as string)
        .single();

      if (ordemErr) throw ordemErr;
      setOrdem(ordemData);

      const { data: itensData, error: itensErr } = await (supabase as any)
        .from('producao_ordens_itens')
        .select(`
          id,
          quantidade_planejada,
          quantidade_produzida,
          receita_id,
          setor_producao_id,
          receitas ( nome ),
          cliente_setores_producao ( id, nome )
        `)
        .eq('ordem_id', params.id);
        
      if (itensErr) throw itensErr;
      setItens(itensData as any);

      const { data: reqData, error: reqErr } = await (supabase as any)
        .from('producao_requisicoes')
        .select(`
          id,
          ingrediente_id,
          grupo_estoque_id,
          qtd_necessaria_g,
          qtd_separada_g,
          status,
          ingredientes ( nome ),
          ingredientes_grupos ( nome )
        `)
        .eq('ordem_id', params.id)
        .order('id');

      if (reqErr) throw reqErr;
      setRequisicoes(reqData as any);

    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar os detalhes da ordem.');
    } finally {
      setLoading(false);
    }
  }

  async function loadReceitasOpts() {
    if (!activeClientId) return;
    const { data } = await (supabase as any)
      .from('receitas')
      .select('id, nome')
      .eq('cliente_id', activeClientId)
      .order('nome');
    if (data) setReceitasOpts(data);
  }

  async function loadSetoresOpts() {
    if (!activeClientId) return;
    const { data } = await supabase
      .from('cliente_setores_producao')
      .select('id, nome')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true)
      .order('nome');
    if (data) setSetoresOpts(data);
  }

  useEffect(() => {
    if (unidadeId && params.id) {
      loadOrdem();
    }
  }, [unidadeId, params.id]);

  useEffect(() => {
    if (activeClientId) {
      loadReceitasOpts();
      loadSetoresOpts();
    }
  }, [activeClientId]);



  function getFatorConversao(unidade: string): number {
    const u = unidade?.toLowerCase().trim() || 'g';
    if (['kg', 'l', 'litro', 'litros'].includes(u)) return 1000;
    if (u === 'mg') return 0.001;
    return 1;
  }



  /** Estorna todo o material vinculado a uma ordem: devolve ao estoque o consumido e apaga reservas. */
  async function estornarMaterialOrdem(ordemId: string) {
    try {
      // 1. Obter todas as reservas vinculadas às requisições desta ordem
      const { data: reqs } = await (supabase as any)
        .from('producao_requisicoes')
        .select('id')
        .eq('ordem_id', ordemId);
      
      const idsRequisicoes = (reqs as any[])?.map(r => r.id) || [];
      if (idsRequisicoes.length === 0) return;

      const { data: reservas } = await (supabase as any)
        .from('producao_reservas_estoque')
        .select(`
          id, 
          status, 
          quantidade_reservada_g, 
          estoque_lote_id,
          lotes_estoque ( id, quantidade_atual_g_ml, numero_lote_fabricante )
        `)
        .in('requisicao_id', idsRequisicoes);

      if (!reservas || reservas.length === 0) return;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;

      for (const res of (reservas as any[])) {
        if (res.status === 'CONSUMIDO' && res.lotes_estoque) {
          // Devolver ao estoque
          const novaQtdGml = res.lotes_estoque.quantidade_atual_g_ml + res.quantidade_reservada_g;
          
          await (supabase as any).from('lotes_estoque')
            .update({ quantidade_atual_g_ml: novaQtdGml })
            .eq('id', res.estoque_lote_id);

          // Registrar histórico de estorno
          await (supabase as any).from('estoque_movimentacoes')
            .insert({
              lote_id: res.estoque_lote_id,
              tipo_movimento: 'ENTRADA',
              quantidade_movimentada: res.quantidade_reservada_g,
              quantidade_nova: novaQtdGml,
              data_movimento: new Date().toISOString(),
              justificativa: `Estorno - Ajuste/Cancelamento OP ${ordem?.codigo || 'N/A'}`,
              responsavel_id: userId
            });
        }
      }

      // 2. Apagar as reservas (o CASCADE no banco ou delete manual)
      const { error: delErr } = await (supabase as any)
        .from('producao_reservas_estoque')
        .delete()
        .in('requisicao_id', idsRequisicoes);
      
      if (delErr) throw delErr;

      // 3. Resetar status das requisições
      await (supabase as any)
        .from('producao_requisicoes')
        .update({ qtd_separada_g: 0, status: 'PENDENTE' })
        .in('id', idsRequisicoes);

    } catch (err) {
      console.error('Erro ao estornar material:', err);
      throw err;
    }
  }

  async function handleCancelarOrdem() {
    if (!ordem || !confirm('Tem certeza que deseja cancelar esta ordem? Todas as reservas de estoque serão liberadas e as requisições removidas.')) return;
    
    setLoading(true);
    try {
      // 1. Estornar material (devolver estoque consumido e limpar reservas)
      await estornarMaterialOrdem(ordem.id);

      // 2. Deletar as requisições (comportamento atual mantido após estorno)
      const { error: reqDelErr } = await (supabase as any)
        .from('producao_requisicoes')
        .delete()
        .eq('ordem_id', ordem.id);
      
      if (reqDelErr) throw reqDelErr;

      // 4. Atualizar o status da ordem
      const { error: statusErr } = await (supabase as any)
        .from('producao_ordens')
        .update({ status: 'CANCELADA' })
        .eq('id', ordem.id);
      
      if (statusErr) throw statusErr;

      alert('Ordem cancelada com sucesso. O estoque foi liberado.');
      await loadOrdem();
    } catch (err: any) {
      console.error('Erro ao cancelar ordem:', err);
      alert('Erro ao cancelar ordem: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusChip = (status: string) => {
    if (status === 'PENDENTE' || status === 'PLANEJADA') return <Chip label="Pendente" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 'bold' }} />;
    if (status === 'EM_PREPARO' || status === 'EM_PRODUCAO') return <Chip label="Em Preparo" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', fontWeight: 'bold' }} />;
    if (status === 'FINALIZADA' || status === 'CONCLUIDA') return <Chip label="Finalizada" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 'bold' }} />;
    if (status === 'CANCELADA') return <Chip label="Cancelada" size="small" color="error" sx={{ fontWeight: 'bold' }} />;
    return <Chip label={status} size="small" />;
  };

  const handleOpenEdit = () => {
    if (ordem) {
      setEditTitulo(ordem.titulo || '');
      setEditDataPrevista(ordem.data_prevista ? ordem.data_prevista.substring(0, 10) : '');
      setEditStatus(ordem.status || 'PENDENTE');
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!ordem) return;
    setSalvandoEdit(true);
    try {
      const { error: ordErr } = await (supabase as any).from('producao_ordens').update({
        titulo: editTitulo,
        data_prevista: editDataPrevista,
        status: editStatus
      }).eq('id', params.id);

      if (ordErr) throw ordErr;
      setEditDialogOpen(false);
      await loadOrdem();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar ordem: ' + err.message);
    } finally {
      setSalvandoEdit(false);
    }
  };

  const handleOpenEditProducts = () => {
    const currentItens = itens.map(i => ({
      tempId: Math.random().toString(),
      receita_id: i.receita_id,
      quantidade_planejada: i.quantidade_planejada,
      setor_producao_id: i.setor_producao_id || ''
    }));
    if (currentItens.length === 0) {
      currentItens.push({ tempId: Math.random().toString(), receita_id: '', quantidade_planejada: 1, setor_producao_id: '' });
    }
    setEditItens(currentItens);
    setEditProductsDialogOpen(true);
  };

  const handleAddEditItem = () => {
    setEditItens([...editItens, { tempId: Math.random().toString(), receita_id: '', quantidade_planejada: 1, setor_producao_id: '' }]);
  };

  const handleRemoveEditItem = (tempId: string) => {
    setEditItens(editItens.filter(i => i.tempId !== tempId));
  };

  const handleEditItemChange = (tempId: string, field: keyof EditItemInput, value: any) => {
    setEditItens(editItens.map(i => i.tempId === tempId ? { ...i, [field]: value } : i));
  };

  const handleSaveEditProducts = async () => {
    if (!ordem) return;
    setSalvandoProducts(true);
    
    const validItens = editItens.filter(i => i.receita_id && i.quantidade_planejada > 0);
    if (validItens.length === 0) {
      alert('Adicione pelo menos uma receita com quantidade válida.');
      setSalvandoProducts(false);
      return;
    }

    try {
      // 1. Estornar e limpar material atual antes de recalcular
      await estornarMaterialOrdem(ordem.id);

      // 2. Apagar Itens Antigos
      const { error: delErr } = await (supabase as any).from('producao_ordens_itens').delete().eq('ordem_id', params.id);
      if (delErr) throw delErr;

      // 2. Inserir Novos Itens (com setor de produção por produto)
      const itensPayload = validItens.map(i => ({
        ordem_id: ordem.id,
        receita_id: i.receita_id,
        quantidade_planejada: i.quantidade_planejada,
        setor_producao_id: i.setor_producao_id || null
      }));
      const { error: insErr } = await (supabase as any)
        .from('producao_ordens_itens')
        .insert(itensPayload);
      if (insErr) throw insErr;

      // 3. Recalcular material
      const { error: rpcErr } = await (supabase as any).rpc('gerar_requisicao_producao', {
        p_ordem_id: ordem.id
      });
      if (rpcErr) throw rpcErr;

      setEditProductsDialogOpen(false);
      await loadOrdem();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar produtos: ' + err.message);
    } finally {
      setSalvandoProducts(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Carregando ordem de produção...</Typography>
      </Container>
    );
  }

  if (!ordem || error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Ordem não encontrada.'}</Alert>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => router.push('/planejamento')} sx={{ mt: 2 }}>
          Voltar para Lista
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>
      
      {/* HEADER DA ORDEM */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 4, gap: 2 }}>
        <IconButton onClick={() => router.push('/planejamento')} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
              {ordem.titulo || 'Ordem de Produção'}
            </Typography>
            {getStatusChip(ordem.status)}
            <IconButton onClick={handleOpenEdit} size="small" color="primary" sx={{ ml: 1 }}>
              <Edit2 size={18} />
            </IconButton>
            {(ordem.status !== 'CANCELADA' && ordem.status !== 'FINALIZADA' && ordem.status !== 'CONCLUIDA') && (
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                startIcon={<Trash2 size={16} />} 
                onClick={handleCancelarOrdem}
                sx={{ ml: 'auto' }}
              >
                Cancelar Ordem
              </Button>
            )}
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', gap: 3 }}>
            <span><strong style={{ color: '#333' }}>Código:</strong> {ordem.codigo}</span>
            <span><strong style={{ color: '#333' }}>Previsão:</strong> {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : '-'}</span>
          </Typography>
        </Box>
      </Box>

      {/* TABS E CONTEÚDO */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          {/* Seção 1: Receitas na Ordem */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChefHat size={20} color={theme.palette.primary.main} />
                Produtos Finais (Receitas)
              </Typography>
              {(ordem.status === 'PENDENTE' || ordem.status === 'PLANEJADA' || ordem.status === 'EM_PREPARO') && (
                <Button size="small" variant="outlined" startIcon={<Edit2 size={16} />} onClick={handleOpenEditProducts}>
                  Editar Produtos
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Receita</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Setor de Produção</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtde. Planejada</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtde. Produzida</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {item.receitas?.nome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.cliente_setores_producao?.nome || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {item.quantidade_planejada} un
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" color="text.secondary">
                          {item.quantidade_produzida} un
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {item.quantidade_produzida >= item.quantidade_planejada ? (
                          <Chip icon={<CheckCircle size={16} />} label="Concluído" color="success" size="small" />
                        ) : (
                          <Chip label="Pendente" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Seção 2: Insumos Necessários (Simples) */}
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Package size={20} color={theme.palette.primary.main} />
              Insumos Necessários (Estimativa)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Esta lista é apenas para referência de produção. A separação física e alocação de lotes deve ser realizada na aba <strong>Estoque {'>'} Reservas</strong>.
            </Typography>
            
            {requisicoes.length === 0 ? (
              <Alert severity="info" variant="outlined">Nenhum insumo necessário para estas receitas.</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Insumo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantidade Total</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Status no Estoque</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requisicoes.map((req) => (
                      <TableRow key={req.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {req.grupo_estoque_id ? req.ingredientes_grupos?.nome : req.ingredientes?.nome}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={req.grupo_estoque_id ? 'Grupo' : 'Específico'} 
                            size="small" 
                            variant="outlined"
                            color={req.grupo_estoque_id ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {(req.qtd_necessaria_g / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 3})} Kg
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {req.status === 'SEPARADO' ? (
                            <Chip label="Alocado" color="success" size="small" variant="outlined" />
                          ) : req.status === 'FALTA_ESTOQUE' ? (
                            <Chip label="Aguardando" color="error" size="small" variant="outlined" />
                          ) : (
                            <Chip label="Pendente" color="warning" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Paper>



      {/* DIALOG DE EDITAR OP */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit2 size={20} />
          Editar Ordem de Produção
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField 
                label="Título / Referência"
                fullWidth size="small"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Ex: Produção Semanal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Data Prevista"
                type="date"
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                value={editDataPrevista}
                onChange={(e) => setEditDataPrevista(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Status da Ordem"
                select
                fullWidth size="small"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="PENDENTE">Pendente</MenuItem>
                <MenuItem value="EM_PREPARO">Em Preparo</MenuItem>
                <MenuItem value="FINALIZADA">Finalizada</MenuItem>
                <MenuItem value="CANCELADA">Cancelada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
               <Alert severity="info" sx={{ mt: 1 }}>
                 Nota: Para alterar as quantidades ou adicionar novos produtos, clique no botão &quot;Editar Produtos&quot; na aba de Produtos Finais.
               </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            startIcon={salvandoEdit ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            disabled={salvandoEdit}
            onClick={handleSaveEdit}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE EDITAR PRODUTOS */}
      <Dialog open={editProductsDialogOpen} onClose={() => setEditProductsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChefHat size={20} />
          Editar Lista de Produtos
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Alert severity="warning">
              Atenção: Modificar a lista de produtos irá **recalcular inteiramente** a aba de Requisições de Estoque. Se houveram alocações físicas em andamento, verifique o estoque após salvar.
            </Alert>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableRow>
                  <TableCell>Receita / Produto Final</TableCell>
                  <TableCell width="28%">Setor de Produção</TableCell>
                  <TableCell width="18%">Quantidade Planejada</TableCell>
                  <TableCell width="10%" align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editItens.map((item, index) => (
                  <TableRow key={item.tempId}>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={item.receita_id}
                        onChange={(e) => handleEditItemChange(item.tempId, 'receita_id', e.target.value)}
                      >
                        <MenuItem value=""><em>Selecione uma receita...</em></MenuItem>
                        {receitasOpts.map(r => (
                          <MenuItem key={r.id} value={r.id}>{r.nome}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={item.setor_producao_id || ''}
                        onChange={(e) => handleEditItemChange(item.tempId, 'setor_producao_id', e.target.value)}
                                SelectProps={{ displayEmpty: true }}
                  >
                        <MenuItem value=""><em>Nenhum</em></MenuItem>
                        {setoresOpts.map(s => (
                          <MenuItem key={s.id} value={s.id}>{s.nome}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={item.quantidade_planejada}
                        onChange={(e) => handleEditItemChange(item.tempId, 'quantidade_planejada', Number(e.target.value))}
                        inputProps={{ step: "0.001", min: "0.001" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={() => handleRemoveEditItem(item.tempId)}
                        disabled={editItens.length === 1}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <Button startIcon={<Plus size={16} />} onClick={handleAddEditItem}>
              Adicionar Novo Produto
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditProductsDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            startIcon={salvandoProducts ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            disabled={salvandoProducts || editItens.length === 0}
            onClick={handleSaveEditProducts}
          >
            Atualizar e Recalcular Requisições
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
