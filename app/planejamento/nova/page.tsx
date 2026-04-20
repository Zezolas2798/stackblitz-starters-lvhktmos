'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, IconButton, Container,
  useTheme, alpha
} from '@mui/material';
import { Save, Plus, Trash2, Calendar, Settings, ChefHat } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, addDays } from 'date-fns';

interface Receita {
  id: string;
  nome: string;
}

interface SetorProducao {
  id: string;
  nome: string;
}

interface OrdemItem {
  tempId: string;
  receita_id: string;
  quantidade_planejada: number;
  setor_producao_id: string;
}

export default function NovaOrdemProducaoPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const router = useRouter();

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [titulo, setTitulo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [setores, setSetores] = useState<SetorProducao[]>([]);
  const [itens, setItens] = useState<OrdemItem[]>([
    { tempId: '1', receita_id: '', quantidade_planejada: 1, setor_producao_id: '' }
  ]);

  const [salvando, setSalvando] = useState(false);
  const [erroGlobal, setErroGlobal] = useState('');

  useEffect(() => {
    if (activeClientId) {
      loadReceitas();
      loadSetores();
      setCodigo(`OP-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`);
      setDataPrevista(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    }
  }, [activeClientId]);

  async function loadReceitas() {
    if (!activeClientId) return;
    const { data } = await (supabase as any).from('receitas')
      .select('id, nome')
      .eq('cliente_id', activeClientId)
      .order('nome');
      
    if (data) setReceitas(data);
  }

  async function loadSetores() {
    if (!activeClientId) return;
    const { data } = await (supabase as any).from('setores_producao')
      .select('id, nome')
      .eq('unidade_id', unidadeId)
      .eq('ativo', true)
      .order('nome');
    if (data) setSetores(data);
  }

  const handleAddItem = () => {
    setItens([...itens, { tempId: Date.now().toString(), receita_id: '', quantidade_planejada: 1, setor_producao_id: '' }]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItens(itens.filter(i => i.tempId !== tempId));
  };

  const handleItemChange = (tempId: string, field: keyof OrdemItem, value: any) => {
    setItens(itens.map(i => i.tempId === tempId ? { ...i, [field]: value } : i));
  };

  async function handleFinalizar() {
    setSalvando(true);
    setErroGlobal('');

    if (!codigo.trim()) {
      setErroGlobal('O código da ordem é obrigatório.');
      setSalvando(false);
      return;
    }

    const validItens = itens.filter(i => i.receita_id && i.quantidade_planejada > 0);
    if (validItens.length === 0) {
      setErroGlobal('Adicione pelo menos uma receita com quantidade válida.');
      setSalvando(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;

      const { data: novaOrdem, error: insertOrdemErr } = await (supabase as any).from('producao_ordens')
        .insert({
          unidade_id: unidadeId as string,
          codigo: codigo,
          titulo: titulo || null,
          data_prevista: dataPrevista || null,
          status: 'PLANEJADA',
          created_by: userId
        })
        .select('id')
        .single();

      if (insertOrdemErr) throw insertOrdemErr;
      const ordemId = novaOrdem.id;

      const itensPayload = validItens.map(i => ({
        ordem_id: ordemId,
        receita_id: i.receita_id,
        quantidade_planejada: i.quantidade_planejada,
        setor_producao_id: i.setor_producao_id || null
      }));

      const { error: insertItensErr } = await (supabase as any).from('producao_ordens_itens')
        .insert(itensPayload);

      if (insertItensErr) throw insertItensErr;

      const { error: rpcErr } = await (supabase as any).rpc('gerar_requisicao_producao', {
        p_ordem_id: ordemId
      });

      if (rpcErr) throw rpcErr;

      // Redireciona para os detalhes da nova ordem (ou lista se não houver tela pronta ainda)
      router.push(`/planejamento/${ordemId}`);
    } catch (err: any) {
      console.error(err);
      setErroGlobal(`Erro ao gerar ordem: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Nova Ordem de Produção
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie uma ordem mult-produtos para gerar uma requisição única de estoque.
        </Typography>
      </Box>

      {erroGlobal && (
        <Alert severity="error" sx={{ mb: 3 }}>{erroGlobal}</Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(8px)' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <Settings size={20} /> Detalhes Gerais
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Código da OP" 
                  fullWidth 
                  value={codigo} 
                  onChange={e => setCodigo(e.target.value)} 
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Título / Referência (Opcional)" 
                  fullWidth 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)} 
                  placeholder="Ex: Produção Semanal"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Data Prevista" 
                  type="date" 
                  fullWidth 
                  InputLabelProps={{ shrink: true }} 
                  value={dataPrevista} 
                  onChange={e => setDataPrevista(e.target.value)} 
                  InputProps={{
                    startAdornment: <Calendar size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(8px)' }}>
            <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                 <ChefHat size={20} /> Produtos a Produzir
               </Typography>
               <Button variant="outlined" startIcon={<Plus size={16} />} onClick={handleAddItem} size="small">
                 Adicionar Produto
               </Button>
            </Box>

            <Box sx={{ p: 3 }}>
              {itens.length === 0 ? (
                <Alert severity="info">Adicione receitas para compor a ordem de produção.</Alert>
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Receita / Produto Final</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} width={200}>Setor de Produção</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} width={180}>Qtde. Planejada</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} width={80} align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itens.map((item, idx) => (
                        <TableRow key={item.tempId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={item.receita_id}
                              onChange={(e) => handleItemChange(item.tempId, 'receita_id', e.target.value)}
                              SelectProps={{ displayEmpty: true }}
                              placeholder="Selecione uma receita..."
                            >
                              {receitas.map(r => (
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
                              onChange={(e) => handleItemChange(item.tempId, 'setor_producao_id', e.target.value)}
                              SelectProps={{ displayEmpty: true }}
                            >
                              <MenuItem value=""><em>Nenhum</em></MenuItem>
                              {setores.map(s => (
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
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleItemChange(item.tempId, 'quantidade_planejada', val > 0 ? val : 1);
                              }}
                              inputProps={{ min: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => handleRemoveItem(item.tempId)}
                              disabled={itens.length === 1}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: { md: 280, xs: 0 },
          right: 0,
          p: 2,
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Button variant="outlined" size="large" onClick={() => router.back()}>Cancelar</Button>
        <Button
          variant="contained"
          size="large"
          startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <Save />}
          disabled={salvando || itens.length === 0 || itens.every(i => !i.receita_id)}
          onClick={handleFinalizar}
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          {salvando ? 'Gerando...' : 'Gerar Ordem e Requisições'}
        </Button>
      </Paper>
    </Container>
  );
}
