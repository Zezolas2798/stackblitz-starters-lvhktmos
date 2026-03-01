'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Button, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, CircularProgress, MenuItem, TextField,
  InputAdornment, Container, useTheme, alpha
} from '@mui/material';

import Grid from '@mui/material/Grid';

import {
  Plus, Package, History, ArrowRightLeft, MapPin, Search, Filter, Tag, ScanLine
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import MovimentacaoEstoqueDialog from '@/components/MovimentacaoEstoqueDialog';
import MovimentacaoGeralDialog from '@/components/MovimentacaoGeralDialog';

const STATUS_VALIDADE_OPTIONS = [
  { value: 'VENCIDO', label: '🔴 Vencidos (< 0 dias)' },
  { value: 'CRITICO', label: '🟠 Quase Vencendo (0 a 30 dias)' },
  { value: 'ALERTA', label: '🟡 Perto do Vencimento (31 a 89 dias)' },
  { value: 'OK', label: '🟢 Longe do Vencimento (90+ dias)' },
];

export default function EstoquePage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTROS ---
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroValidade, setFiltroValidade] = useState('');

  // --- DROPDOWNS ---
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([]);

  // --- MOVIMENTAÇÃO ---
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null);
  const [buscaGeralOpen, setBuscaGeralOpen] = useState(false);

  const handleOpenMovimentacao = (lote: any) => {
    setLoteSelecionado(lote);
    setMovimentacaoOpen(true);
  };

  const handleLoteSelecionadoDaBusca = (lote: any) => {
    setBuscaGeralOpen(false);
    handleOpenMovimentacao(lote);
  };

  useEffect(() => {
    if (activeClientId) {
      loadEstoque();
    }
  }, [activeClientId]);

  async function loadEstoque() {
    setLoading(true);

    const { data: lotesData, error } = await supabase
      .from('estoque_lotes')
      .select('*, ingredientes(nome)')
      .eq('cliente_id', activeClientId)
      .neq('status_lote', 'ESGOTADO')
      .order('data_validade_atual', { ascending: true });

    if (lotesData) {
      setLotes(lotesData);

      const locaisUnicos = Array.from(new Set(lotesData.map(l => l.local_armazenamento).filter(Boolean)));
      const categoriasUnicas = Array.from(new Set(lotesData.map(l => l.categoria_produto).filter(Boolean)));

      setLocaisDisponiveis(locaisUnicos as string[]);
      setCategoriasDisponiveis(categoriasUnicas as string[]);
    }
    setLoading(false);
  }

  const calcularStatusValidade = (dataValidade: string) => {
    if (!dataValidade) return 'OK';
    const diasRestantes = differenceInCalendarDays(parseISO(dataValidade), new Date());
    if (diasRestantes < 0) return 'VENCIDO';
    if (diasRestantes <= 30) return 'CRITICO';
    if (diasRestantes <= 89) return 'ALERTA';
    return 'OK';
  };

  const lotesFiltrados = lotes.filter(lote => {
    const termo = filtroBusca.toLowerCase();
    const matchBusca =
      (lote.ingredientes?.nome || '').toLowerCase().includes(termo) ||
      (lote.marca || '').toLowerCase().includes(termo) ||
      (lote.codigo_lote_fornecedor || '').toLowerCase().includes(termo);

    const matchLocal = filtroLocal ? lote.local_armazenamento === filtroLocal : true;
    const matchCategoria = filtroCategoria ? lote.categoria_produto === filtroCategoria : true;

    let matchValidade = true;
    if (filtroValidade) {
      const statusCalculado = calcularStatusValidade(lote.data_validade_atual);
      matchValidade = statusCalculado === filtroValidade;
    }

    return matchBusca && matchLocal && matchCategoria && matchValidade;
  });

  const renderChipValidade = (dataValidade: string) => {
    const status = calcularStatusValidade(dataValidade);
    const dias = differenceInCalendarDays(parseISO(dataValidade), new Date());

    let color: 'default' | 'error' | 'warning' | 'success' = 'success';
    let label = `${dias} dias`;
    let bgcolor = alpha(theme.palette.success.main, 0.1);
    let textColor = theme.palette.success.dark;

    switch (status) {
      case 'VENCIDO':
        color = 'error';
        label = `Vencido há ${Math.abs(dias)} dias`;
        bgcolor = alpha(theme.palette.error.main, 0.1);
        textColor = theme.palette.error.dark;
        break;
      case 'CRITICO':
        color = 'error';
        label = `Vence em ${dias} dias`;
        bgcolor = alpha(theme.palette.error.main, 0.1);
        textColor = theme.palette.error.dark;
        break;
      case 'ALERTA':
        color = 'warning';
        label = `Vence em ${dias} dias`;
        bgcolor = alpha(theme.palette.warning.main, 0.1);
        textColor = theme.palette.warning.dark;
        break;
      case 'OK':
        color = 'success';
        label = `Vence em ${dias} dias`;
        break;
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 'bold',
          bgcolor: bgcolor,
          color: textColor,
          border: '1px solid',
          borderColor: alpha(textColor, 0.3)
        }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Estoque Atual (FEFO)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão inteligente de validade e rastreabilidade de lotes.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<History size={18} />} color="inherit">
            Histórico
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ScanLine size={20} />}
            sx={{ fontWeight: 'bold' }}
            onClick={() => setBuscaGeralOpen(true)}
          >
            Movimentar Insumo
          </Button>
          <Link href="/estoque/entrada" passHref style={{ textDecoration: 'none' }}>
            <Button variant="contained" startIcon={<Plus size={20} />} sx={{ fontWeight: 'bold', px: 3 }}>
              Nova Entrada
            </Button>
          </Link>
        </Box>
      </Box>

      {/* BARRA DE FILTROS AVANÇADA */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
          <Filter size={18} />
          <Typography variant="subtitle2" fontWeight="bold">Filtros Avançados</Typography>
        </Box>

        <Grid container spacing={2}>
          {/* 1. Busca Texto */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              placeholder="Buscar Produto, Marca ou Lote..."
              value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
            />
          </Grid>

          {/* 2. Filtro Local */}
          <Grid item xs={12} md={2}>
            <TextField
              select fullWidth size="small" label="Local"
              value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }} // <--- CORREÇÃO AQUI
            >
              <MenuItem value="">Todos os Locais</MenuItem>
              {locaisDisponiveis.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
            </TextField>
          </Grid>

          {/* 3. Filtro Categoria */}
          <Grid item xs={12} md={3}>
            <TextField
              select fullWidth size="small" label="Categoria"
              value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }} // <--- CORREÇÃO AQUI
            >
              <MenuItem value="">Todas as Categorias</MenuItem>
              {categoriasDisponiveis.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
          </Grid>

          {/* 4. Filtro Validade */}
          <Grid item xs={12} md={3}>
            <TextField
              select fullWidth size="small" label="Situação Validade"
              value={filtroValidade} onChange={e => setFiltroValidade(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }} // <--- CORREÇÃO AQUI
            >
              <MenuItem value="">Todas as Situações</MenuItem>
              {STATUS_VALIDADE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Resultados */}
      <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
        ) : lotesFiltrados.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Package size={64} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
            <Typography variant="h6" color="text.secondary">Nenhum item encontrado</Typography>
            <Typography variant="body2" color="text.secondary">Tente ajustar os filtros de busca.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>PRODUTO / DETALHES</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>LOCALIZAÇÃO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>LOTE & VALIDADE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>QUANTIDADE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lotesFiltrados.map((lote) => {
                  return (
                    <TableRow key={lote.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
                            {lote.ingredientes?.nome || 'Ingrediente Desconhecido'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {lote.marca && <Chip label={lote.marca} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'grey.100' }} />}
                            {lote.categoria_produto && <Chip icon={<Tag size={10} />} label={lote.categoria_produto} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <MapPin size={16} />
                          <Typography variant="body2" fontWeight={500}>{lote.local_armazenamento || 'Geral'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            Lote: {lote.codigo_lote_fornecedor}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {lote.data_validade_atual ? format(parseISO(lote.data_validade_atual), 'dd/MM/yyyy') : '-'}
                            </Typography>
                            {renderChipValidade(lote.data_validade_atual)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
                          {lote.quantidade_atual} <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{lote.unidade_medida}</span>
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Movimentar / Ajustar">
                          <IconButton size="small" color="primary" onClick={() => handleOpenMovimentacao(lote)}>
                            <ArrowRightLeft size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <MovimentacaoEstoqueDialog
        open={movimentacaoOpen}
        onClose={() => setMovimentacaoOpen(false)}
        lote={loteSelecionado}
        onSuccess={loadEstoque}
      />
      <MovimentacaoGeralDialog
        open={buscaGeralOpen}
        onClose={() => setBuscaGeralOpen(false)}
        clienteId={activeClientId}
        onLoteSelected={handleLoteSelecionadoDaBusca}
      />

    </Container>
  );
}