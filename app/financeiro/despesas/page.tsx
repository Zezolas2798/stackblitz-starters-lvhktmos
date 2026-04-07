'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Alert, IconButton, Divider, List, ListItem, ListItemText, Stack, Tabs, Tab, InputAdornment
} from '@mui/material';
import { Wallet, Calendar, FileText, Settings, Trash2, RefreshCcw, Save, Filter, Pencil } from 'lucide-react';

interface FinConta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  comportamento_custo: 'FIXO' | 'VARIAVEL' | 'MISTO' | 'NAO_APLICAVEL';
  subtipo_usar: string;
  alocacao_custo: string;
}

interface Transacao {
  id: string;
  descricao: string;
  data_competencia: string;
  valor_total: number;
  origem_modulo?: string;
  created_at: string;
}

type LoteRow = {
  descricao: string;
  valor: string; // Valor Base (Manual)
  valor_adicional: string; // Multas e Taxas
  data_pagamento: string;
};

type LoteState = Record<string, LoteRow>;

export default function DespesasPage() {
  const { activeClientId, unidadeId } = useClient();
  const [activeTab, setActiveTab] = useState(0);
  
  const [despesasHistory, setDespesasHistory] = useState<Transacao[]>([]);
  const [contas, setContas] = useState<FinConta[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [openConfigModal, setOpenConfigModal] = useState(false);
  const [submittingLote, setSubmittingLote] = useState(false);
  
  // Competência Global da Planilha e Filtro Histórico (YYYY-MM)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [competenciaMes, setCompetenciaMes] = useState(currentMonthStr);
  const [historicoMes, setHistoricoMes] = useState(currentMonthStr);
  
  // Estado da Planilha de Lançamentos
  const [lote, setLote] = useState<LoteState>({});
  const [loteSuccess, setLoteSuccess] = useState('');
  const [loteError, setLoteError] = useState('');

  // Totais automatizados do mês (vindos do estoque/compras)
  const [automatedTotals, setAutomatedTotals] = useState<Record<string, number>>({});

  // Form Categoria Modal
  const [editandoCatId, setEditandoCatId] = useState<string | null>(null);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatComportamento, setNovaCatComportamento] = useState<'FIXO' | 'VARIAVEL'>('FIXO');
  const [novaCatSubtipo, setNovaCatSubtipo] = useState<string>('OUTRAS_DESPESAS');
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => {
    if (activeClientId && unidadeId) {
      loadContas();
    }
  }, [activeClientId, unidadeId]);

  useEffect(() => {
    if (activeClientId && unidadeId) {
      loadHistory();
    }
  }, [activeClientId, unidadeId, historicoMes]);

  useEffect(() => {
    if (activeClientId && unidadeId) {
      loadAutomatedTotals();
    }
  }, [activeClientId, unidadeId, competenciaMes]);

  async function loadContas() {
    setLoading(true);
    const { data: contasInfo, error: cErr } = await (supabase as any)
      .from('fin_contas')
      .select('id, codigo, nome, tipo, comportamento_custo, subtipo_usar, alocacao_custo')
      .eq('cliente_id', activeClientId)
      .eq('tipo', 'DESPESA')
      .eq('ativo', true)
      .order('codigo', { ascending: true });

    if (!cErr && contasInfo) {
      setContas(contasInfo as FinConta[]);
      initLoteState(contasInfo as FinConta[]);
    }
    setLoading(false);
  }
  
  function initLoteState(catList: FinConta[]) {
    const defaultDate = getEndOfMonth(competenciaMes);
    const initial: LoteState = {};
    catList.forEach(c => {
      initial[c.id] = { descricao: '', valor: '', valor_adicional: '', data_pagamento: defaultDate };
    });
    setLote(initial);
  }

  // Se o mês de competência mudar, atualizamos as datas de pagamento pro novo fim de mês
  useEffect(() => {
    if (Object.keys(lote).length > 0) {
      const defaultDate = getEndOfMonth(competenciaMes);
      setLote(prev => {
        const novo = { ...prev };
        Object.keys(novo).forEach(k => {
          if (!novo[k].valor && !novo[k].valor_adicional) { 
             novo[k].data_pagamento = defaultDate;
          }
        });
        return novo;
      });
    }
  }, [competenciaMes]);

  function getEndOfMonth(yyyyMM: string): string {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(Number(year), Number(month), 0); // último dia do mês
    // adjust for timezone offset
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
  }

  async function loadHistory() {
    if (!unidadeId) return;
    const [ano, mes] = historicoMes.split('-');
    const startOfMonth = `${ano}-${mes}-01`;
    const endOfMonth = getEndOfMonth(historicoMes);

    const { data: transacoes, error: tErr } = await (supabase as any)
      .from('fin_transacoes')
      .select('*')
      .eq('unidade_id', unidadeId)
      .in('origem_modulo', ['MANUAL', 'ESTOQUE'])
      .gte('data_competencia', startOfMonth)
      .lte('data_competencia', endOfMonth)
      .order('data_competencia', { ascending: false });

    if (!tErr && transacoes) setDespesasHistory(transacoes as Transacao[]);
  }

  async function loadAutomatedTotals() {
    if (!unidadeId) return;
    const [ano, mes] = competenciaMes.split('-');
    const startOfMonth = `${ano}-${mes}-01`;
    const endOfMonth = getEndOfMonth(competenciaMes);

    // Busca todos os lançamentos de débito em contas de despesa, originados pelo estoque, no mês selecionado
    const { data, error } = await (supabase as any)
      .from('fin_lancamentos')
      .select('conta_id, valor, fin_transacoes!inner(data_competencia, origem_modulo, unidade_id)')
      .eq('fin_transacoes.unidade_id', unidadeId)
      .eq('fin_transacoes.origem_modulo', 'ESTOQUE')
      .eq('tipo_lancamento', 'DEBITO')
      .gte('fin_transacoes.data_competencia', startOfMonth)
      .lte('fin_transacoes.data_competencia', endOfMonth);

    if (!error && data) {
      const totals: Record<string, number> = {};
      data.forEach((item: any) => {
        totals[item.conta_id] = (totals[item.conta_id] || 0) + Number(item.valor);
      });
      setAutomatedTotals(totals);
    }
  }

  const contasFixas = useMemo(() => contas.filter(c => c.comportamento_custo === 'FIXO'), [contas]);
  const contasVariaveis = useMemo(() => contas.filter(c => c.comportamento_custo === 'VARIAVEL'), [contas]);

  // --- LÓGICA DE CATEGORIAS (Modal) ---
  function handleEditCategory(conta: FinConta) {
    setEditandoCatId(conta.id);
    setNovaCatNome(conta.nome);
    setNovaCatComportamento(conta.comportamento_custo === 'FIXO' || conta.comportamento_custo === 'VARIAVEL' ? conta.comportamento_custo : 'FIXO');
    setNovaCatSubtipo(conta.subtipo_usar || 'OUTRAS_DESPESAS');
  }
  
  function handleCancelEdit() {
    setEditandoCatId(null);
    setNovaCatNome('');
    setNovaCatComportamento('FIXO');
    setNovaCatSubtipo('OUTRAS_DESPESAS');
  }

  async function handleSaveCategory() {
    if (!novaCatNome) return;
    setCatSubmitting(true);
    try {
      if (editandoCatId) {
        // UPDATE
        const { error } = await (supabase as any)
          .from('fin_contas')
          .update({
            nome: novaCatNome,
            comportamento_custo: novaCatComportamento,
            subtipo_usar: novaCatSubtipo
          })
          .eq('id', editandoCatId);
        if (error) throw error;
      } else {
        // INSERT
        const codigoSugerido = `5.${contas.filter(c => c.codigo.startsWith('5.')).length + 1}`;
        const { error } = await (supabase as any).from('fin_contas').insert({
          cliente_id: activeClientId,
          codigo: codigoSugerido,
          nome: novaCatNome,
          tipo: 'DESPESA',
          comportamento_custo: novaCatComportamento,
          subtipo_usar: novaCatSubtipo
        });
        if (error) throw error;
      }
      
      handleCancelEdit();
      loadContas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCatSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Deseja realmente remover esta categoria?')) return;
    const { error } = await (supabase as any).from('fin_contas').update({ ativo: false }).eq('id', id);
    if (!error) {
      if (editandoCatId === id) handleCancelEdit();
      loadContas();
    }
    else alert('Erro ao remover: Categoria pode estar em uso.');
  }

  async function handleSeedDefault() {
    setCatSubmitting(true);
    const defaultCategories = [
      { nome: 'Aluguel e Condomínio', comp: 'FIXO' },
      { nome: 'Folha de Pagamento', comp: 'FIXO' },
      { nome: 'Encargos e Impostos', comp: 'VARIAVEL' },
      { nome: 'Marketing e Propaganda', comp: 'VARIAVEL' },
      { nome: 'Energia, Água e Gás', comp: 'FIXO' },
      { nome: 'Manutenção e Reparos', comp: 'VARIAVEL' },
      { nome: 'Contabilidade e Software', comp: 'FIXO' },
    ];

    try {
      const payload = defaultCategories.map((cat, idx) => ({
        cliente_id: activeClientId,
        codigo: `5.${idx + 1}`,
        nome: cat.nome,
        tipo: 'DESPESA',
        comportamento_custo: cat.comp,
        subtipo_usar: 'OUTRAS_DESPESAS'
      }));

      const { error } = await (supabase as any).from('fin_contas').insert(payload);
      if (error) throw error;
      loadContas();
    } catch (err: any) {
      alert('Erro ao carregar plano: Verifique se as categorias já existem na série 5.x');
    } finally {
      setCatSubmitting(false);
    }
  }

  // --- LÓGICA DE SALVAMENTO EM LOTE ---
  const handleLoteChange = (contaId: string, field: keyof LoteRow, val: string) => {
    setLote(prev => ({
      ...prev,
      [contaId]: {
        ...prev[contaId],
        [field]: val
      }
    }));
  };

  async function handleSalvarLote() {
    setLoteSuccess('');
    setLoteError('');
    
    // Obter apenas as linhas preenchidas (com valor ou valor adicional)
    const contasIds = Object.keys(lote);
    const preenchidos = contasIds.filter(id => {
      const val = parseFloat(lote[id].valor);
      const valAdicional = parseFloat(lote[id].valor_adicional);
      return (!isNaN(val) && val > 0) || (!isNaN(valAdicional) && valAdicional > 0);
    });

    if (preenchidos.length === 0) {
      setLoteError('Nenhum valor preenchido para lançar.');
      return;
    }

    setSubmittingLote(true);

    try {
      const dataCompetenciaGeral = getEndOfMonth(competenciaMes) || new Date().toISOString().split('T')[0];
      let sucessoCount = 0;

      for (const contaId of preenchidos) {
        const row = lote[contaId];
        const valBase = parseFloat(row.valor) || 0;
        const valAdicional = parseFloat(row.valor_adicional) || 0;
        const valorTotalNum = valBase + valAdicional;
        
        const contaInfo = contas.find(c => c.id === contaId);
        
        let descFinal = row.descricao.trim();
        if (!descFinal) {
          descFinal = `${contaInfo?.nome || 'Despesa'} - ${competenciaMes}`;
        }
        if (valAdicional > 0) {
          descFinal += ` (+ Multas/Taxas)`;
        }

        // Verificar se já existe lançamento manual para esta conta nesta competência
        const { data: existingLanc, error: findError } = await (supabase as any)
          .from('fin_lancamentos')
          .select('id, transacao_id, fin_transacoes!inner(id, unidade_id, data_competencia, origem_modulo)')
          .eq('conta_id', contaId)
          .eq('fin_transacoes.unidade_id', unidadeId)
          .eq('fin_transacoes.data_competencia', dataCompetenciaGeral)
          .eq('fin_transacoes.origem_modulo', 'MANUAL')
          .maybeSingle();

        if (existingLanc) {
          // UPDATE existente
          const { error: transUpdError } = await (supabase as any)
            .from('fin_transacoes')
            .update({
              descricao: descFinal,
              data_pagamento: row.data_pagamento || dataCompetenciaGeral,
              valor_total: valorTotalNum
            })
            .eq('id', (existingLanc as any).transacao_id);

          if (transUpdError) throw transUpdError;

          const { error: lancUpdError } = await (supabase as any)
            .from('fin_lancamentos')
            .update({ valor: valorTotalNum })
            .eq('id', (existingLanc as any).id);

          if (lancUpdError) throw lancUpdError;
        } else {
          // INSERT novo
          const { data: transacao, error: transError } = await (supabase as any)
            .from('fin_transacoes')
            .insert({
              unidade_id: unidadeId,
              descricao: descFinal,
              data_competencia: dataCompetenciaGeral,
              data_pagamento: row.data_pagamento || dataCompetenciaGeral, 
              origem_modulo: 'MANUAL',
              valor_total: valorTotalNum
            })
            .select()
            .single();

          if (transError) throw transError;

          const { error: lancError } = await (supabase as any)
            .from('fin_lancamentos')
            .insert({
              transacao_id: (transacao as any).id,
              conta_id: contaId,
              tipo_lancamento: 'DEBITO',
              valor: valorTotalNum
            });

          if (lancError) throw lancError;
        }
        sucessoCount++;
      }

      setLoteSuccess(`${sucessoCount} despesa(s) lançada(s) com sucesso!`);
      initLoteState(contas);
      loadHistory();
      setTimeout(() => setLoteSuccess(''), 4000);

    } catch (err: any) {
      setLoteError(err.message || 'Erro ao processar lote.');
    } finally {
      setSubmittingLote(false);
    }
  }

  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // Renderizador de Tabela de Lote
  const renderLoteTable = (title: string, catList: FinConta[], color: 'primary' | 'warning') => {
    if (catList.length === 0) return null;
    return (
      <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: color === 'primary' ? 'primary.50' : 'warning.50', p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle1" fontWeight="bold" color={`${color}.main`}>
            {title}
          </Typography>
        </Box>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#fbfbfb' }}>
            <TableRow>
              <TableCell sx={{ width: '20%' }}><b>Categoria</b></TableCell>
              <TableCell sx={{ width: '15%' }} align="center"><b>Gasto Mês</b></TableCell>
              <TableCell sx={{ width: '20%' }}><b>Descrição (Opcional)</b></TableCell>
              <TableCell sx={{ width: '15%' }}><b>Multas e Taxas (R$)</b></TableCell>
              <TableCell sx={{ width: '15%' }}><b>Vencimento</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {catList.map(conta => {
              const rowData = lote[conta.id] || { descricao: '', valor: '', valor_adicional: '', data_pagamento: '' };
              const autoTotal = automatedTotals[conta.id] || 0;
              const hasAuto = autoTotal > 0;

              return (
                <TableRow key={conta.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{conta.nome}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {hasAuto ? (
                      <Chip 
                        label={formatoMoeda.format(autoTotal)} 
                        size="small" 
                        color="info" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                      />
                    ) : (
                      <TextField 
                        size="small" fullWidth placeholder="0,00" type="number" variant="standard"
                        value={rowData.valor} 
                        onChange={e => handleLoteChange(conta.id, 'valor', e.target.value)}
                        InputProps={{ 
                          disableUnderline: true, 
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          sx: { fontSize: '0.875rem', fontWeight: rowData.valor ? 'bold' : 'normal' }
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField 
                      size="small" fullWidth placeholder="Ex: Conta Mês X" variant="standard"
                      value={rowData.descricao} 
                      onChange={e => handleLoteChange(conta.id, 'descricao', e.target.value)}
                      InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField 
                      size="small" fullWidth placeholder="0,00" type="number" variant="standard"
                      value={rowData.valor_adicional} 
                      onChange={e => handleLoteChange(conta.id, 'valor_adicional', e.target.value)}
                      InputProps={{ 
                        disableUnderline: true, 
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        sx: { fontSize: '0.875rem', color: 'error.main' }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField 
                      size="small" fullWidth type="date" variant="standard"
                      value={rowData.data_pagamento} 
                      onChange={e => handleLoteChange(conta.id, 'data_pagamento', e.target.value)}
                      InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Wallet size={36} />
          Despesas Financeiras
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<Settings size={18} />} 
            onClick={() => setOpenConfigModal(true)}
            sx={{ borderRadius: 2 }}
          >
            Configurar Categorias
          </Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Lançamento em Lote" sx={{ fontWeight: 'bold' }} />
          <Tab label="Histórico de Despesas" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ABA 1: Lançamento */}
      {activeTab === 0 && (
        <Box>
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: '#f9fafb' }}>
             <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" fontWeight="bold">Competência</Typography>
                  <Typography variant="body2" color="text.secondary">Mês de referência dos gastos</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField 
                    type="month" 
                    fullWidth 
                    size="small"
                    value={competenciaMes}
                    onChange={e => setCompetenciaMes(e.target.value)}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
             </Grid>
          </Paper>

          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
          ) : contas.length === 0 ? (
             <Alert severity="warning" sx={{ borderRadius: 2 }}>
               Nenhuma categoria cadastrada. Clique em "Configurar Categorias" ou importe o plano padrão.
             </Alert>
          ) : (
            <Box>
              {loteError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{loteError}</Alert>}
              {loteSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{loteSuccess}</Alert>}

              {renderLoteTable('Custos Fixos (Gasto Mensal Recorrente)', contasFixas, 'primary')}
              {renderLoteTable('Custos Variáveis (Proporcional à Operação)', contasVariaveis, 'warning')}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<Save size={20} />}
                  onClick={handleSalvarLote}
                  disabled={submittingLote}
                  sx={{ borderRadius: 2, px: 4, py: 1.5 }}
                >
                  {submittingLote ? 'Salvando...' : 'Salvar Lançamentos'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ABA 2: Histórico */}
      {activeTab === 1 && (
        <Box>
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0', display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fbfbfb' }}>
            <Filter size={20} className="text-gray-500" />
            <Typography variant="body1" fontWeight="bold">Filtrar por Mês:</Typography>
            <TextField 
              type="month" 
              size="small"
              value={historicoMes}
              onChange={e => setHistoricoMes(e.target.value)}
              sx={{ bgcolor: 'white', ml: 2, minWidth: 200 }}
            />
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e1e4e8', borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell><b>Competência</b></TableCell>
                    <TableCell><b>Descrição / Categoria</b></TableCell>
                    <TableCell align="right"><b>Valor Total</b></TableCell>
                    <TableCell align="center"><b>Origem</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {despesasHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <Box sx={{ color: 'text.disabled', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <FileText size={48} />
                          <Typography>Nenhuma despesa lançada neste mês.</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesasHistory.map((d) => (
                      <TableRow key={d.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                            <Calendar size={16} />
                            {new Date(d.data_competencia).toLocaleDateString()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{d.descricao}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {d.origem_modulo === 'ESTOQUE' ? 'Compra de Insumo (Automático)' : 'Gasto Manual / Lote'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 700, fontSize: '1rem' }}>
                          - {formatoMoeda.format(d.valor_total)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={d.origem_modulo === 'ESTOQUE' ? 'Compra' : 'Lançamento'} 
                            size="small" 
                            variant="outlined" 
                            color={d.origem_modulo === 'ESTOQUE' ? 'info' : 'default'}
                            sx={{ borderRadius: 1.5, fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* MODAL: CONFIGURAÇÃO DE CATEGORIAS */}
      <Dialog open={openConfigModal} onClose={() => setOpenConfigModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings size={22} /> Personalizar Categorias de Custo
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Defina como suas despesas serão agrupadas no seu Painel de Lucratividade. 
            Custos **Fixos** são aqueles que existem mesmo sem venda. Custos **Variáveis** oscilam conforme a produção.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: editandoCatId ? '#fff9c4' : '#fcfcfc', borderRadius: 2, border: editandoCatId ? '1px solid #fbc02d' : '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              {editandoCatId ? 'Editando Categoria' : 'Adicionar Nova Categoria'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField 
                  label="Nome da Categoria" size="small" fullWidth 
                  value={novaCatNome} onChange={e => setNovaCatNome(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Comportamento</InputLabel>
                  <Select 
                    label="Comportamento"
                    value={novaCatComportamento} 
                    onChange={(e: any) => setNovaCatComportamento(e.target.value)}
                  >
                    <MenuItem value="FIXO">Custo Fixo</MenuItem>
                    <MenuItem value="VARIAVEL">Custo Variável</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mapeamento DRE (USAR)</InputLabel>
                  <Select 
                    label="Mapeamento DRE (USAR)"
                    value={novaCatSubtipo} 
                    onChange={(e: any) => setNovaCatSubtipo(e.target.value)}
                  >
                    <MenuItem value="CUSTOS_CONTROLAVEIS">Despesas Operacionais</MenuItem>
                    <MenuItem value="CUSTO_MAO_DE_OBRA">Mão de Obra</MenuItem>
                    <MenuItem value="CUSTO_OCUPACAO">Ocupação</MenuItem>
                    <MenuItem value="OUTRAS_DESPESAS">Outras Despesas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {editandoCatId && (
                    <Button variant="outlined" size="small" onClick={handleCancelEdit} sx={{ borderRadius: 2 }}>
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    variant="contained" size="medium" 
                    disabled={!novaCatNome || catSubmitting} onClick={handleSaveCategory}
                    sx={{ px: 4, borderRadius: 2 }}
                  >
                    {editandoCatId ? 'Salvar Alterações' : 'Criar Categoria'}
                  </Button>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Minhas Categorias ({contas.length})</Typography>
          <List dense sx={{ border: '1px solid #eee', borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
            {contas.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Você ainda não tem categorias personalizadas.</Typography>
                <Button 
                  startIcon={<RefreshCcw size={18} />} variant="outlined" 
                  onClick={handleSeedDefault} disabled={catSubmitting}
                >
                  Carregar Plano Padrão
                </Button>
              </Box>
            ) : (
              contas.map(conta => (
                <ListItem 
                  key={conta.id} divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" size="small" onClick={() => handleEditCategory(conta)}>
                        <Pencil size={18} />
                      </IconButton>
                      <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteCategory(conta.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText 
                    primary={conta.nome} 
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={conta.comportamento_custo} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                        <Chip 
                          label={
                            conta.subtipo_usar === 'CUSTOS_CONTROLAVEIS' ? 'Operacional' :
                            conta.subtipo_usar === 'CUSTO_MAO_DE_OBRA' ? 'Mão de Obra' :
                            conta.subtipo_usar === 'CUSTO_OCUPACAO' ? 'Ocupação' : 'Outros'
                          } 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: '0.65rem', height: 18 }} 
                        />
                      </Stack>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenConfigModal(false)} variant="contained">Concluído</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
