'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Divider, Chip, IconButton, Tooltip, Container,
  useTheme, alpha
} from '@mui/material';
import { Save, AlertTriangle, Info, Calendar, Edit2, ChefHat, ArrowRight, PackageCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, addDays, parseISO } from 'date-fns';

// Tipagem
interface InsumoCalculado {
  ingrediente_id: string;
  nome_ingrediente: string;
  qtd_necessaria_g: number;
  unidade_estoque: string;
  lotes_sugeridos: LoteSugestao[];
  status: 'OK' | 'SALDO_INSUFICIENTE' | 'ERRO_DADOS';
}

interface LoteSugestao {
  lote_id: string;
  codigo: string;
  validade: string;
  qtd_disponivel_g: number;
  qtd_a_usar_g: number;
  qtd_a_usar_original: number; // Valor editável pelo usuário (na unidade original)
  selecionado: boolean;
}

export default function NovaProducaoPage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  const router = useRouter();

  // Estados
  const [receitas, setReceitas] = useState<any[]>([]);
  const [selectedReceitaId, setSelectedReceitaId] = useState('');
  const [qtdProducao, setQtdProducao] = useState<number>(1);
  const [unidadeProducao, setUnidadeProducao] = useState('UN');
  const [dataValidade, setDataValidade] = useState('');
  const [loteFinalCodigo, setLoteFinalCodigo] = useState('');

  // Estados de processamento
  const [insumos, setInsumos] = useState<InsumoCalculado[]>([]);
  const [calculando, setCalculando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroGlobal, setErroGlobal] = useState('');

  useEffect(() => {
    if (activeClientId) loadReceitas();
  }, [activeClientId]);

  // Fator de Conversão (Kg -> 1000g)
  function getFatorConversao(unidade: string): number {
    const u = unidade?.toLowerCase().trim() || 'g';
    if (['kg', 'l', 'litro', 'litros'].includes(u)) return 1000;
    if (u === 'mg') return 0.001;
    return 1;
  }

  // Formatador Preciso
  function formatarInteligente(qtdGramas: number, unidadeOriginal: string) {
    const u = unidadeOriginal?.toLowerCase().trim() || 'g';
    if (['un', 'unid', 'cx', 'pc'].includes(u)) return `${qtdGramas.toLocaleString('pt-BR')} ${unidadeOriginal}`;

    const isLiquido = ['l', 'ml', 'litro', 'litros'].includes(u);

    // Se unidade base é Kg/L, mostra sempre em Kg/L com 3 casas
    if (getFatorConversao(u) === 1000) {
      const val = qtdGramas / 1000;
      const suffix = isLiquido ? 'L' : 'Kg';
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${suffix}`;
    } else {
      const suffix = isLiquido ? 'ml' : 'g';
      return `${qtdGramas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${suffix}`;
    }
  }

  async function loadReceitas() {
    if (!activeClientId) return;
    const { data } = await supabase
      .from('receitas')
      .select('id, nome, rendimento_total_g, peso_embalagem_g')
      .eq('cliente_id', activeClientId);
    if (data) setReceitas(data);
  }

  const handleSelectReceita = (id: string) => {
    setSelectedReceitaId(id);
    const rec = receitas.find(r => r.id === id);
    if (rec) {
      const codigoSugerido = `L${format(new Date(), 'yyMMdd')}-${Math.floor(Math.random() * 1000)}`;
      setLoteFinalCodigo(codigoSugerido);

      const validadeSugerida = format(addDays(new Date(), 5), 'yyyy-MM-dd');
      setDataValidade(validadeSugerida);

      setUnidadeProducao('UN');
      calcularInsumos(id, qtdProducao);
    }
  };

  async function calcularInsumos(receitaId: string, quantidade: number) {
    setCalculando(true);
    setErroGlobal('');
    setInsumos([]);

    try {
      // 1. Composição
      const { data: composicao } = await supabase
        .from('composicao_receitas')
        .select('item_id, peso_liquido_g, item_type')
        .eq('receita_id', receitaId);

      if (!composicao || composicao.length === 0) { setCalculando(false); return; }

      // 2. Ingredientes
      const idsIngredientes = composicao
        .filter(c => !c.item_type || c.item_type === 'ingrediente')
        .map(c => c.item_id);

      if (idsIngredientes.length === 0) { setCalculando(false); return; }

      const { data: ingredientesData } = await supabase
        .from('ingredientes')
        .select('id, nome, peso_unitario_g') // Busca dados básicos
        .in('id', idsIngredientes);

      const mapaIngredientes = new Map();
      ingredientesData?.forEach(ing => mapaIngredientes.set(ing.id, ing));

      const novosInsumos: InsumoCalculado[] = [];

      // 3. Cruzamento e FEFO
      for (const item of composicao) {
        if (item.item_type && item.item_type !== 'ingrediente') continue;

        const dadosIngrediente = mapaIngredientes.get(item.item_id);
        const nomeFinal = dadosIngrediente ? dadosIngrediente.nome : `[ERRO] ID ${item.item_id}...`;

        // Lógica simplificada de unidade (pode ser refinada se tiver unidade no banco)
        // Se for por unidade (ex: Ovo), usa UN, senão KG como padrão de estoque
        const unidadeEstoque = 'KG';
        const fator = getFatorConversao(unidadeEstoque);

        // Necessidade total em GRAMAS (ex: 45g * 10un = 450g)
        const qtdNecessariaGramas = (item.peso_liquido_g || 0) * quantidade;

        // Buscar Lotes Ordenados por Validade (FEFO)
        const { data: lotes } = await supabase
          .from('lotes_estoque')
          .select('id, numero_lote_fabricante, data_validade_interna, quantidade_atual_g_ml')
          .eq('ingrediente_id', item.item_id)
          .gt('quantidade_atual_g_ml', 0)
          .gte('data_validade_interna', new Date().toISOString())
          .order('data_validade_interna', { ascending: true });

        const lotesSugeridos: LoteSugestao[] = [];
        let faltaParaCompletarGramas = qtdNecessariaGramas;

        if (lotes) {
          for (const lote of lotes) {
            // Estoque atual convertido para gramas (ex: 1.05 Kg * 1000 = 1050g)
            const estoqueEmGramas = Number(lote.quantidade_atual_g_ml);

            // Quanto usar deste lote (o mínimo entre o que tem e o que falta)
            let usarDesteLoteGramas = 0;
            if (faltaParaCompletarGramas > 0) {
              usarDesteLoteGramas = Math.min(estoqueEmGramas, faltaParaCompletarGramas);
            }

            // Valor original para exibir no campo editável
            const usarDesteLoteOriginal = usarDesteLoteGramas / fator;

            lotesSugeridos.push({
              lote_id: lote.id,
              codigo: lote.numero_lote_fabricante,
              validade: lote.data_validade_interna,
              qtd_disponivel_g: estoqueEmGramas,
              qtd_a_usar_g: usarDesteLoteGramas,
              qtd_a_usar_original: usarDesteLoteOriginal, // Campo que vai no input
              selecionado: usarDesteLoteGramas > 0
            });

            // Reduz o que falta
            faltaParaCompletarGramas = Math.max(0, faltaParaCompletarGramas - usarDesteLoteGramas);
          }
        }

        let statusFinal: 'OK' | 'SALDO_INSUFICIENTE' | 'ERRO_DADOS' = 'OK';
        if (!dadosIngrediente) statusFinal = 'ERRO_DADOS';
        // Margem de erro de float (0.1g)
        else if (faltaParaCompletarGramas > 0.1) statusFinal = 'SALDO_INSUFICIENTE';

        novosInsumos.push({
          ingrediente_id: item.item_id,
          nome_ingrediente: nomeFinal,
          qtd_necessaria_g: qtdNecessariaGramas,
          unidade_estoque: unidadeEstoque,
          lotes_sugeridos: lotesSugeridos,
          status: statusFinal
        });
      }

      setInsumos(novosInsumos);

    } catch (err: any) {
      console.error(err);
      setErroGlobal(err.message);
    } finally {
      setCalculando(false);
    }
  }

  // --- FUNÇÃO DE EDIÇÃO MANUAL ---
  const handleQuantidadeChange = (insumoIndex: number, loteIndex: number, novoValorStr: string) => {
    // Permite digitar "0,450" trocando virgula por ponto
    const valLimpo = novoValorStr.replace(',', '.');
    const novoValorOriginal = parseFloat(valLimpo);

    if (isNaN(novoValorOriginal) && valLimpo !== '') return;

    const novosInsumos = [...insumos];
    const insumo = novosInsumos[insumoIndex];
    const lote = insumo.lotes_sugeridos[loteIndex];
    const fator = getFatorConversao(insumo.unidade_estoque);

    // Atualiza os valores do lote
    const valFinal = isNaN(novoValorOriginal) ? 0 : novoValorOriginal;
    lote.qtd_a_usar_original = valFinal;
    lote.qtd_a_usar_g = valFinal * fator;
    lote.selecionado = valFinal > 0;

    // Recalcula o status do insumo (Se a soma bate com a necessidade)
    const totalAlocadoG = insumo.lotes_sugeridos.reduce((acc, l) => acc + l.qtd_a_usar_g, 0);
    const diferenca = insumo.qtd_necessaria_g - totalAlocadoG;

    // Margem de tolerância pequena
    if (diferenca > 0.5) {
      insumo.status = 'SALDO_INSUFICIENTE';
    } else {
      insumo.status = 'OK';
    }

    setInsumos(novosInsumos);
  };

  async function handleFinalizar() {
    setSalvando(true);

    if (insumos.some(i => i.status === 'ERRO_DADOS')) {
      setErroGlobal('Corrija os erros de dados antes de salvar.');
      setSalvando(false);
      return;
    }

    const insumosPayload = insumos.flatMap(i =>
      i.lotes_sugeridos
        .filter(l => l.qtd_a_usar_original > 0)
        .map(l => ({
          lote_id: l.lote_id,
          qtd_utilizada: l.qtd_a_usar_original,
          unidade_medida: i.unidade_estoque
        }))
    );

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.rpc('registrar_producao', {
        p_cliente_id: activeClientId as string,
        p_receita_id: selectedReceitaId,
        p_qtd_produzida: qtdProducao,
        p_data_validade: dataValidade,
        p_lote_codigo: loteFinalCodigo,
        // CORREÇÃO CRÍTICA: Enviar null se não houver usuário logado (evita erro de assinatura da função)
        p_responsavel_id: (userData.user?.id || null) as any,
        p_insumos: insumosPayload
      });

      if (error) throw error;

      router.push('/producao');
    } catch (err: any) {
      setErroGlobal(`Erro ao registrar: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 12 }}>

      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Nova Ordem de Produção
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Planejamento de produção e baixa automática de estoque (FEFO).
        </Typography>
      </Box>

      {erroGlobal && (
        <Alert severity="error" sx={{ mb: 3 }}>{erroGlobal}</Alert>
      )}

      <Grid container spacing={4}>

        {/* LADO ESQUERDO: CONFIGURAÇÃO DA OP */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              position: { md: 'sticky' },
              top: 20,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <ChefHat size={20} /> Produto Final
            </Typography>

            <TextField
              select
              label="Selecione a Receita"
              fullWidth
              value={selectedReceitaId}
              onChange={(e) => handleSelectReceita(e.target.value)}
              sx={{ mb: 3 }}
            >
              {receitas.map(r => <MenuItem key={r.id} value={r.id}>{r.nome}</MenuItem>)}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Qtd. a Produzir"
                  type="number"
                  fullWidth
                  value={qtdProducao}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setQtdProducao(val);
                    if (selectedReceitaId) calcularInsumos(selectedReceitaId, val);
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Unidade" disabled value={unidadeProducao} fullWidth />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <PackageCheck size={18} /> Rastreabilidade do Lote
            </Typography>

            <TextField label="Lote Gerado" fullWidth value={loteFinalCodigo} onChange={e => setLoteFinalCodigo(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Data de Validade" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dataValidade} onChange={e => setDataValidade(e.target.value)} />
          </Paper>
        </Grid>

        {/* LADO DIREITO: LISTA DE INSUMOS */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {!selectedReceitaId ? (
              <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}>
                <Info size={48} className="text-gray-300 mx-auto mb-2" />
                <Typography color="text.secondary">Selecione uma receita à esquerda para calcular os insumos.</Typography>
              </Paper>
            ) : insumos.length === 0 ? (
              <Alert severity="warning">Esta receita não possui ingredientes cadastrados na composição.</Alert>
            ) : (
              insumos.map((insumo, insumoIdx) => (
                <Paper
                  key={insumoIdx}
                  elevation={0}
                  sx={{
                    p: 0,
                    border: '1px solid',
                    borderColor: insumo.status === 'OK' ? 'divider' : 'error.main',
                    borderRadius: 2,
                    bgcolor: insumo.status === 'OK' ? 'background.paper' : '#FFF5F5',
                    overflow: 'hidden'
                  }}
                >
                  {/* Cabeçalho do Insumo */}
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: insumo.status === 'OK' ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.error.main, 0.1) }}>
                    <Typography fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: insumo.status === 'OK' ? 'text.primary' : 'error.main' }}>
                      {insumo.nome_ingrediente}
                      {insumo.status === 'SALDO_INSUFICIENTE' && <Chip label="Estoque Insuficiente" color="error" size="small" />}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" display="block" color="text.secondary">Necessário</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatarInteligente(insumo.qtd_necessaria_g, insumo.unidade_estoque)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tabela de Lotes */}
                  {insumo.lotes_sugeridos.length > 0 ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>LOTE / VALIDADE</TableCell>
                          <TableCell align="right">DISPONÍVEL</TableCell>
                          <TableCell align="right" sx={{ width: 150, color: 'primary.main', fontWeight: 'bold' }}>BAIXAR ({insumo.unidade_estoque})</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {insumo.lotes_sugeridos.map((lote, loteIdx) => (
                          <TableRow key={lote.lote_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{lote.codigo}</Typography>
                              <Typography variant="caption" color="text.secondary">Vence: {format(parseISO(lote.validade), 'dd/MM/yy')}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              {formatarInteligente(lote.qtd_disponivel_g, insumo.unidade_estoque)}
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={lote.qtd_a_usar_original}
                                onChange={(e) => handleQuantidadeChange(insumoIdx, loteIdx, e.target.value)}
                                inputProps={{
                                  step: "0.001",
                                  style: { textAlign: 'right', fontWeight: 'bold', color: lote.qtd_a_usar_original > 0 ? '#1976d2' : '#999' }
                                }}
                                sx={{ maxWidth: 100 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
                      <AlertTriangle size={24} style={{ marginBottom: 8, margin: '0 auto', display: 'block' }} />
                      <Typography variant="body2" fontWeight="bold">Nenhum lote disponível em estoque.</Typography>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Grid>
      </Grid>

      {/* BARRA DE AÇÃO FLUTUANTE */}
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
          disabled={salvando || insumos.length === 0 || insumos.some(i => i.status !== 'OK') || !dataValidade}
          onClick={handleFinalizar}
          sx={{ px: 4, fontWeight: 'bold' }}
        >
          {salvando ? 'Processando...' : 'Confirmar Produção'}
        </Button>
      </Paper>
    </Container>
  );
}