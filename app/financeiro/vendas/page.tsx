'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Grid, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tabs, Tab, Switch, FormControlLabel, IconButton, Collapse, Divider, useTheme, alpha, Chip } from '@mui/material';
import { UploadCloud, CheckCircle, Save, Calendar, Star, HelpCircle, TrendingUp, AlertCircle, Monitor, Truck, Settings as SettingsIcon, Clock } from 'lucide-react';
import { Assessment, MenuBook, KeyboardArrowDown, KeyboardArrowUp, History as HistoryIcon } from '@mui/icons-material';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, 
  ResponsiveContainer, ReferenceLine, Cell, Label, LabelList, ReferenceArea 
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { analyzeMenuEngineering, MenuItemAnalyzed, MenuItemEngineering, MenuEngineeringResults } from '@/lib/financeiro/engenhariaCardapio';
import { Tooltip as MuiTooltip } from '@mui/material';
import ModalPDV from '@/components/financeiro/ModalPDV';
import ModalDeliveryConfig from '@/components/financeiro/ModalDeliveryConfig';
import PainelDelivery from '@/components/financeiro/PainelDelivery';

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">{data.name}</Typography>
        <Typography variant="caption" display="block">Mix: {data.x.toFixed(1)}%</Typography>
        <Typography variant="caption" display="block">Margem: R$ {data.y.toFixed(2)}</Typography>
        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 'bold' }}>
          {data.classification}
        </Typography>
      </Paper>
    );
  }
  return null;
};

const BCGChart = ({ result }: { result: MenuEngineeringResults }) => {
  const theme = useTheme();
  
  const data = result.items.map(item => ({
    x: item.mixPercent,
    y: item.margin,
    name: item.name,
    classification: item.classification
  }));

  // Determinar limites para as áreas de fundo
  const maxX = Math.max(...data.map(d => d.x), result.popularityCutoff * 2, 20);
  const maxY = Math.max(...data.map(d => d.y), result.averageMargin * 2, 10);
  const minX = 0;
  const minY = 0;

  const getColor = (c: string) => {
    switch (c) {
      case 'ESTRELA': return theme.palette.success.main;
      case 'CAVALO_DE_BATALHA': return theme.palette.info.main;
      case 'QUEBRA_CABECA': return theme.palette.warning.main;
      default: return theme.palette.error.main;
    }
  };

  return (
    <Box sx={{ width: '100%', height: 450, mb: 4, position: 'relative', bgcolor: 'background.paper', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            domain={[0, maxX]}
            hide
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            domain={[0, maxY]}
            hide
          />
          <ZAxis type="number" range={[150, 300]} />
          
          {/* QUADRANTES COM CORES SUAVES */}
          <ReferenceArea x1={result.popularityCutoff} x2={maxX} y1={result.averageMargin} y2={maxY} fill={alpha(theme.palette.success.main, 0.05)} />
          <ReferenceArea x1={0} x2={result.popularityCutoff} y1={result.averageMargin} y2={maxY} fill={alpha(theme.palette.warning.main, 0.05)} />
          <ReferenceArea x1={0} x2={result.popularityCutoff} y1={0} y2={result.averageMargin} fill={alpha(theme.palette.error.main, 0.05)} />
          <ReferenceArea x1={result.popularityCutoff} x2={maxX} y1={0} y2={result.averageMargin} fill={alpha(theme.palette.info.main, 0.05)} />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Thresholds */}
          <ReferenceLine x={result.popularityCutoff} stroke={theme.palette.divider} strokeWidth={2} strokeDasharray="5 5">
            <Label value="Popularidade Média" position="top" fill="text.secondary" fontSize={10} fontWeight="bold" />
          </ReferenceLine>
          <ReferenceLine y={result.averageMargin} stroke={theme.palette.divider} strokeWidth={2} strokeDasharray="5 5">
            <Label value="Margem Média" position="right" fill="text.secondary" fontSize={10} fontWeight="bold" />
          </ReferenceLine>

          <Scatter name="Produtos" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.classification)} stroke="#fff" strokeWidth={2} />
            ))}
            <LabelList 
                dataKey="name" 
                position="top" 
                style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    fill: theme.palette.text.primary,
                    textShadow: '0px 0px 4px rgba(255,255,255,0.8), -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' 
                }} 
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* WATERMARKS / LABELS DOS QUADRANTES (ABSOLUTE) */}
      {/* Top Right: Estrela */}
      <Box sx={{ 
          position: 'absolute', top: '25%', right: '25%', transform: 'translate(50%, -50%)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.1, pointerEvents: 'none',
          color: theme.palette.success.main 
      }}>
          <Star size={64} />
          <Typography variant="h4" fontWeight="900">ESTRELA</Typography>
      </Box>

      {/* Top Left: Quebra-Cabeça */}
      <Box sx={{ 
          position: 'absolute', top: '25%', left: '25%', transform: 'translate(-50%, -50%)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.1, pointerEvents: 'none',
          color: theme.palette.warning.main 
      }}>
          <HelpCircle size={64} />
          <Typography variant="h4" fontWeight="900">QUEBRA-CABEÇA</Typography>
      </Box>

      {/* Bottom Right: Burro de Carga */}
      <Box sx={{ 
          position: 'absolute', bottom: '25%', right: '25%', transform: 'translate(50%, 50%)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.1, pointerEvents: 'none',
          color: theme.palette.info.main 
      }}>
          <TrendingUp size={64} />
          <Typography variant="h4" fontWeight="900">BURRO DE CARGA</Typography>
      </Box>

      {/* Bottom Left: Cão */}
      <Box sx={{ 
          position: 'absolute', bottom: '25%', left: '25%', transform: 'translate(-50%, 50%)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.1, pointerEvents: 'none',
          color: theme.palette.error.main 
      }}>
          <AlertCircle size={64} />
          <Typography variant="h4" fontWeight="900">CÃO</Typography>
      </Box>
      
      {/* Legendas dos Eixos Manuais */}
      <Box sx={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)' }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold">POPULARIDADE (MIX %)</Typography>
      </Box>
      <Box sx={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold">LUCRATIVIDADE (MARGEM R$)</Typography>
      </Box>
    </Box>
  );
};

// Dados fictícios simulando o que viria do PDV
const mockPosData = [
  { id: '1', name: 'Hambúrguer Clássico', price: 35.0, cost: 12.0, quantitySold: 450 },
  { id: '2', name: 'Batata Frita', price: 15.0, cost: 3.5, quantitySold: 700 },
  { id: '3', name: 'Refrigerante L', price: 8.0, cost: 2.0, quantitySold: 800 },
  { id: '4', name: 'Sobremesa Especial', price: 25.0, cost: 10.0, quantitySold: 50 },
];

export default function VendasPDVPage() {
  const { activeClientId } = useClient();
  const [activeTab, setActiveTab] = useState(0);
  const [analyzedItems, setAnalyzedItems] = useState<MenuItemAnalyzed[]>([]);
  const [analysisResult, setAnalysisResult] = useState<MenuEngineeringResults | null>(null);
  const [realReceitas, setRealReceitas] = useState<any[]>([]);
  const [loadingReceitas, setLoadingReceitas] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modais de Integração
  const [openPdvModal, setOpenPdvModal] = useState(false);
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);
  const [deliveryKey, setDeliveryKey] = useState(0); // Force re-render after config changes

  // Estados para Lançamento de Vendas
  const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7) + '-01'); // YYYY-MM-01
  const [vendasLote, setVendasLote] = useState<Record<string, { qtd: string; preco: string }>>({});
  const [vendasMesAnterior, setVendasMesAnterior] = useState<Record<string, { qtd: number; preco: number }>>({});
  const [analiseAnterior, setAnaliseAnterior] = useState<MenuItemAnalyzed[]>([]);

  // Buscar Receitas Reais
  const loadReceitas = useCallback(async () => {
    if (!activeClientId) return;
    setLoadingReceitas(true);
    try {
      const { data, error } = await supabase
        .from('receitas')
        .select(`
          id, 
          nome, 
          is_menu_item,
          rendimento_total_g,
          peso_embalagem_g,
          tipo_receita:tipos_receita(nome),
          composicao_receitas (
            peso_bruto_g,
            item_id,
            item_type
          )
        `)
        .eq('cliente_id', activeClientId)
        .order('nome');
      
      if (error) throw error;

      // Buscar todos os ingredientes do cliente para cruzar preços
      const { data: ingredientsData, error: ingError } = await supabase
        .from('ingredientes')
        .select('id, nome, preco_ultima_compra, peso_unitario_g')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null);

      if (ingError) throw ingError;

      // Buscar todos os materiais do cliente para cruzar preços
      const { data: materiaisData, error: matError } = await supabase
        .from('materiais')
        .select('id, nome, preco_ultima_compra, unidade_medida')
        .eq('cliente_id', activeClientId);

      if (matError) throw matError;

      // Mapa de ingredientes para busca rápida
      const ingMap = (ingredientsData || []).reduce((acc: any, curr: any) => {
        acc[curr.id] = curr;
        return acc;
      }, {});

      const matMap = (materiaisData || []).reduce((acc: any, curr: any) => {
        acc[curr.id] = curr;
        return acc;
      }, {});

      // Calcular custo total de cada receita
      const processed = (data as any[] || []).map(r => {
        let batchCost = 0;
        
        // Enriquecer itens da composição com dados do ingrediente
        r.composicao_receitas = (r.composicao_receitas || []).map((item: any) => {
          if (item.item_type === 'ingrediente') {
            const ing = ingMap[item.item_id];
            if (ing) {
              const preco = Number(ing.preco_ultima_compra) || 0;
              const pesoBase = Number(ing.peso_unitario_g) || 1000;
              const pesoUsado = Number(item.peso_bruto_g) || 0;
              const subtotal = (pesoUsado / pesoBase) * preco;
              
              if (preco > 0 && pesoBase > 0) {
                batchCost += subtotal;
              }

              return { 
                ...item, 
                ingrediente_nome: ing.nome,
                preco_base: preco, 
                peso_base: pesoBase,
                subtotal 
              };
            }
          } else if (item.item_type === 'material') {
            const mat = matMap[item.item_id];
            if (mat) {
              const preco = Number(mat.preco_ultima_compra) || 0;
              const pesoUsado = Number(item.peso_bruto_g) || 0;
              const subtotal = pesoUsado * preco; // Materials are unit-based
              
              if (preco > 0 && pesoUsado > 0) {
                batchCost += subtotal;
              }

              return { 
                ...item, 
                ingrediente_nome: mat.nome,
                preco_base: preco, 
                peso_base: 1, 
                unidade: mat.unidade_medida || 'un',
                subtotal 
              };
            }
          }
          return item;
        });

        // Custo Unitário = (Custo Total / Rendimento) * Peso Porção
        const rendimento = Number(r.rendimento_total_g) || 1000;
        const porcao = Number(r.peso_embalagem_g) || 100;
        const unitCost = (batchCost / rendimento) * porcao;

        return { ...r, custo_teorico: unitCost, batchCost };
      });

      setRealReceitas(processed);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
    } finally {
      setLoadingReceitas(false);
    }
  }, [activeClientId]);

  // Carregar dados de vendas já salvos para a competência
  const loadSalesData = useCallback(async () => {
    if (!activeClientId || !competencia) return;
    try {
      const { data, error } = await supabase
        .from('fin_vendas_mensais')
        .select('*')
        .eq('cliente_id', activeClientId)
        .eq('mes_ano', competencia);
      
      if (error) throw error;

      const map: Record<string, { qtd: string; preco: string }> = {};
      data?.forEach(v => {
        map[v.receita_id] = { 
          qtd: v.quantidade_vendida.toString(), 
          preco: v.preco_venda.toString() 
        };
      });
      setVendasLote(map);

      // --- BUSCAR MÊS ANTERIOR PARA COMPARATIVOS ---
      const dateAnterior = new Date(competencia + 'T12:00:00');
      dateAnterior.setMonth(dateAnterior.getMonth() - 1);
      const compAnterior = dateAnterior.toISOString().substring(0, 7) + '-01';

      const { data: dataAnt, error: errAnt } = await supabase
        .from('fin_vendas_mensais')
        .select('*')
        .eq('cliente_id', activeClientId)
        .eq('mes_ano', compAnterior);
      
      if (!errAnt && dataAnt) {
        const mapAnt: Record<string, { qtd: number; preco: number }> = {};
        dataAnt.forEach(v => {
          mapAnt[v.receita_id] = { 
            qtd: v.quantidade_vendida, 
            preco: v.preco_venda 
          };
        });
        setVendasMesAnterior(mapAnt);

        // Gerar análise rápida do mês anterior para comparação de classificação/mix
        const itemsToAnalyzeAnt: MenuItemEngineering[] = realReceitas
          .filter(r => mapAnt[r.id])
          .map(r => ({
            id: r.id,
            name: r.nome,
            price: mapAnt[r.id].preco,
            cost: r.custo_teorico || 0, // Usamos custo teórico atual como proxy se não houver histórico
            quantitySold: mapAnt[r.id].qtd
          }));
        
        if (itemsToAnalyzeAnt.length > 0) {
          const resAnt = analyzeMenuEngineering(itemsToAnalyzeAnt);
          setAnaliseAnterior(resAnt.items);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de vendas:', err);
    }
  }, [activeClientId, competencia]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    loadReceitas();
    loadSalesData();
  }, [loadReceitas, loadSalesData]);

  const handleLoteChange = (receitaId: string, field: 'qtd' | 'preco', value: string) => {
    setVendasLote(prev => ({
      ...prev,
      [receitaId]: {
        ...prev[receitaId] || { qtd: '', preco: '' },
        [field]: value
      }
    }));
  };

  const handleSaveSales = async () => {
    if (!activeClientId || !competencia) return;
    setIsSaving(true);
    try {
      // Preparar payloads
      const payloads = Object.entries(vendasLote)
        .filter(([_, data]) => data.qtd !== '' && data.preco !== '')
        .map(([receitaId, data]) => ({
          cliente_id: (activeClientId as string),
          receita_id: receitaId,
          mes_ano: competencia,
          quantidade_vendida: parseFloat(data.qtd) || 0,
          preco_venda: parseFloat(data.preco) || 0
        }));

      if (payloads.length === 0) {
        alert('Nenhum dado completo para salvar.');
        return;
      }

      const { error } = await supabase
        .from('fin_vendas_mensais')
        .upsert(payloads, { onConflict: 'cliente_id, receita_id, mes_ano' });

      if (error) throw error;
      
      const mesFormatado = new Date(competencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      alert(`Vendas de ${mesFormatado} salvas com sucesso!`);
      
      // Sincroniza dados e se estiver na aba de análise, recalcula
      await loadSalesData();
      if (activeTab === 1) handleAnalyzeRealData();
    } catch (err: any) {
      alert('Erro ao salvar vendas: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeRealData = () => {
    setIsUploading(true);
    
    // Filtra apenas itens com vendas registradas e que são itens de menu
    const itemsToAnalyze: MenuItemEngineering[] = realReceitas
      .filter(r => r.is_menu_item && vendasLote[r.id] && parseFloat(vendasLote[r.id].qtd) > 0)
      .map(r => ({
        id: r.id,
        name: r.nome,
        price: parseFloat(vendasLote[r.id].preco) || 0,
        cost: r.custo_teorico || 0,
        quantitySold: parseFloat(vendasLote[r.id].qtd) || 0
      }));

    if (itemsToAnalyze.length === 0) {
      alert('Lance as vendas primeiro para gerar a análise.');
      setAnalyzedItems([]);
      setAnalysisResult(null);
      setIsUploading(false);
      return;
    }

    setTimeout(() => {
      const results = analyzeMenuEngineering(itemsToAnalyze);
      setAnalyzedItems(results.items);
      setAnalysisResult(results);
      setIsUploading(false);
    }, 1000);
  };

  const handleToggleMenuItem = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('receitas')
        // @ts-ignore - Coluna recém-adicionada via migração, tipos ainda não gerados
        .update({ is_menu_item: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualiza estado local
      setRealReceitas(prev => prev.map((r: any) => r.id === id ? { ...r, is_menu_item: !currentStatus } : r));
    } catch (err) {
      console.error('Erro ao atualizar status do cardápio:', err);
      alert('Erro ao salvar alteração no banco.');
    }
  };

  const handleIntegratePOS = () => {
    setIsUploading(true);
    // Simula tempo de rede e processamento da matriz BCG
    setTimeout(() => {
      const results = analyzeMenuEngineering(mockPosData);
      setAnalyzedItems(results.items);
      setIsUploading(false);
    }, 1500);
  };

  const renderVariation = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return "N/A (Novo item)";
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}% vs mês anterior`;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Vendas e Engenharia (Matriz BCG)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Relatório de performance, margens e classificação Kasavana & Smith.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
             <Chip 
               icon={<Clock size={14} />} 
               label="Custos: Sincronizados (Tempo Real)" 
               size="small" 
               color="success" 
               variant="outlined" 
               sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
             />
          </Box>
          <TextField
            label="Mês de Referência"
            type="month"
            size="small"
            value={competencia.substring(0, 7)}
            onChange={(e) => setCompetencia(e.target.value + '-01')}
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <Calendar size={18} style={{ marginRight: 8 }} /> }}
          />
          {activeTab === 0 && (
            <>
              <Button 
                variant="outlined" size="small"
                startIcon={<Monitor size={16} />} 
                onClick={() => setOpenPdvModal(true)}
                sx={{ borderRadius: 2 }}
              >
                Conectar PDV
              </Button>
              <Button 
                variant="outlined" size="small"
                startIcon={<Truck size={16} />} 
                onClick={() => setOpenDeliveryModal(true)}
                color="secondary"
                sx={{ borderRadius: 2 }}
              >
                Configurar Plataformas
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Save size={18} />} 
                onClick={handleSaveSales}
                disabled={isSaving}
                color="primary"
              >
                {isSaving ? 'Salvando...' : 'Salvar Lançamentos'}
              </Button>
            </>
          )}
          {activeTab === 1 && (
            <Button 
              variant="contained" 
              startIcon={<Assessment sx={{ fontSize: 18 }} />} 
              onClick={handleAnalyzeRealData}
              disabled={isUploading}
              color="success"
            >
              {isUploading ? 'Analisando...' : 'Atualizar Análise Real'}
            </Button>
          )}
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Lançamento de Vendas" />
        <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Análise BCG / Kasavana" />
        <Tab icon={<MenuBook sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Configuração do Cardápio" />
      </Tabs>

      {/* ABA 0: LANÇAMENTO MANUAL */}
      {activeTab === 0 && (
        <>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">Lançamento de Quantidades e Preços Praticados</Typography>
            <Typography variant="body2" color="text.secondary">
              Insira as quantidades vendidas e os preços médios do período para as receitas ativas no cardápio.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1, border: '1px solid', borderColor: 'primary.light' }}>
               <Calendar size={18} color="#1565c0" />
               <Typography variant="subtitle2" color="primary.dark" fontWeight="bold">
                  Editando lançamentos para: {new Date(competencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
               </Typography>
            </Box>
          </Box>
          
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>Produto / Receita</TableCell>
                <TableCell align="center">Custo Teórico (CMV)</TableCell>
                <TableCell align="center" sx={{ width: 180 }}>Quantidade Vendida</TableCell>
                <TableCell align="center" sx={{ width: 180 }}>Preço de Venda (R$)</TableCell>
                <TableCell align="right">Margem Unit. Estimada</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {realReceitas.filter(r => r.is_menu_item).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum item configurado como "Item de Venda". Vá na aba **Configuração** para ativar seus produtos.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                realReceitas.filter(r => r.is_menu_item).map(r => {
                  const values = vendasLote[r.id] || { qtd: '', preco: '' };
                  const precoNum = parseFloat(values.preco) || 0;
                  const margem = precoNum > 0 ? precoNum - (r.custo_teorico || 0) : 0;
                  
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{r.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.tipo_receita?.nome}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                           R$ {r.custo_teorico?.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <TextField 
                          size="small" type="number" placeholder="0"
                          value={values.qtd}
                          onChange={(e) => handleLoteChange(r.id, 'qtd', e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField 
                          size="small" type="number" placeholder="0,00"
                          value={values.preco}
                          onChange={(e) => handleLoteChange(r.id, 'preco', e.target.value)}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={margem > 0 ? 'success.main' : 'text.disabled'} fontWeight="bold">
                           {margem > 0 ? `R$ ${margem.toFixed(2)}` : '--'}
                        </Typography>
                        {precoNum > 0 && (
                          <Typography variant="caption" display="block">
                            Markup: {(precoNum / (r.custo_teorico || 1)).toFixed(2)}x
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* SEÇÃO 2: PLATAFORMAS DE DELIVERY */}
        <Box sx={{ mt: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Truck size={22} />
                Plataformas de Delivery
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vendas por canal online — iFood, Rappi, Uber Eats, etc. Dados via API ou lançamento manual.
              </Typography>
            </Box>
          </Box>
          <PainelDelivery key={deliveryKey} competencia={competencia} />
        </Box>
      </>
      )}

      {/* ABA 1: MATRIZ BCG */}
      {activeTab === 1 && (
        <Box>
           <Box sx={{ mb: 3, p: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.main">
                <b>Dica:</b> A classificação baseia-se na média de popularidade e na margem de contribuição (Kasavana & Smith). Clique em "Atualizar Análise Real" após salvar os lançamentos.
              </Typography>
           </Box>

      {analysisResult ? (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1, color: 'success.main' }}>
             <CheckCircle size={20} />
             <Typography variant="h6" fontWeight="bold" color="text.primary">
                Resultado da Engenharia de Cardápio ({competencia.substring(0, 7)})
             </Typography>
          </Box>
          
          {/* GRÁFICO BCG */}
          <BCGChart result={analysisResult} />

          <Divider sx={{ mb: 4 }} />
          
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item do Cardápio</TableCell>
                <TableCell align="right">Preço (R$)</TableCell>
                <TableCell align="right">CMV Teórico (R$)</TableCell>
                <TableCell align="right">CMV (%)</TableCell>
                <TableCell align="right">Margem Unitária</TableCell>
                <TableCell align="right">Vendidos</TableCell>
                <TableCell align="right">Mix Vendas (%)</TableCell>
                <TableCell align="center">Classificação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyzedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><b>{item.name}</b></TableCell>
                  <TableCell align="right">R$ {item.price.toFixed(2)}</TableCell>
                  
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    <MuiTooltip title={renderVariation(item.cost, analiseAnterior.find(a => a.id === item.id)?.cost)} arrow>
                      <span>R$ {item.cost.toFixed(2)}</span>
                    </MuiTooltip>
                  </TableCell>
                  
                  <TableCell align="right">
                    <MuiTooltip title={renderVariation(item.cost / item.price, (analiseAnterior.find(a => a.id === item.id)?.cost || 0) / (analiseAnterior.find(a => a.id === item.id)?.price || 1))} arrow>
                      <span>{((item.cost / item.price) * 100).toFixed(1)}%</span>
                    </MuiTooltip>
                  </TableCell>
                  
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <MuiTooltip title={renderVariation(item.margin, analiseAnterior.find(a => a.id === item.id)?.margin)} arrow>
                      <span>R$ {item.margin.toFixed(2)}</span>
                    </MuiTooltip>
                  </TableCell>
                  
                  <TableCell align="right">{item.quantitySold}</TableCell>
                  
                  <TableCell align="right">
                    <MuiTooltip title={renderVariation(item.mixPercent, analiseAnterior.find(a => a.id === item.id)?.mixPercent)} arrow>
                      <span>{item.mixPercent.toFixed(1)}%</span>
                    </MuiTooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        sx={{ 
                            px: 1.5, py: 0.5, borderRadius: 1,
                            backgroundColor: 
                                item.classification === 'ESTRELA' ? 'success.light' :
                                item.classification === 'CAVALO_DE_BATALHA' ? 'info.light' :
                                item.classification === 'QUEBRA_CABECA' ? 'warning.light' : 
                                'error.light',
                            color: 'white'
                        }}
                    >
                        {item.classification === 'ESTRELA' ? 'ESTRELA' :
                         item.classification === 'CAVALO_DE_BATALHA' ? 'BURRO DE CARGA' :
                         item.classification === 'QUEBRA_CABECA' ? 'QUEBRA-CABEÇA' : 
                         'CÃO'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 10, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
            <Typography variant="body1" color="text.secondary">
                Nenhum dado analisado para este mês. Lance as vendas na primeira aba e clique em "Atualizar Análise Real".
            </Typography>
        </Paper>
      )}
      </Box>
      )}

      {/* ABA 2: CONFIGURAÇÃO DE CARDÁPIO */}
      {activeTab === 2 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ mb: 3 }}>
             <Typography variant="h6" fontWeight="bold" color="text.primary">
                Atribuição de Receitas ao Cardápio Vendável
             </Typography>
             <Typography variant="body2" color="text.secondary">
                Selecione quais Fichas Técnicas são produtos finais vendidos aos clientes. Apenas itens ativados aqui aparecerão para lançamento de vendas.
             </Typography>
          </Box>
          
          <Table size="small">
            <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: 50 }} />
                <TableCell>Ficha Técnica / Insumo</TableCell>
                <TableCell align="right">Custo Teórico (R$)</TableCell>
                <TableCell align="right">Preço Base (Mês)</TableCell>
                <TableCell align="center">Item de Venda?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingReceitas ? (
                <TableRow><TableCell colSpan={4} align="center">Carregando Receitas...</TableCell></TableRow>
              ) : realReceitas.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">Nenhuma receita encontrada no sistema.</TableCell></TableRow>
              ) : (
                // Agrupar receitas por tipo
                Object.entries(
                  realReceitas.reduce((acc: any, receita: any) => {
                    const grupo = receita.tipo_receita?.nome || 'Outros / Sem Categoria';
                    if (!acc[grupo]) acc[grupo] = [];
                    acc[grupo].push(receita);
                    return acc;
                  }, {})
                ).map(([grupo, itens]: [string, any]) => (
                  <React.Fragment key={grupo}>
                    <TableRow sx={{ bgcolor: 'action.selected' }}>
                      <TableCell colSpan={4} sx={{ fontWeight: 'bold', py: 1 }}>
                        {grupo.toUpperCase()}
                      </TableCell>
                    </TableRow>
                    {itens.map((receita: any) => (
                      <React.Fragment key={receita.id}>
                        <TableRow hover>
                          <TableCell sx={{ width: 50 }}>
                            <IconButton size="small" onClick={() => toggleRow(receita.id)}>
                              {expandedRows.includes(receita.id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                            </IconButton>
                          </TableCell>
                          <TableCell><b>{receita.nome}</b></TableCell>
                          <TableCell align="right">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="body2" color="primary.main" fontWeight="bold">
                                  {receita.custo_teorico > 0 
                                    ? `R$ ${receita.custo_teorico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'R$ 0,00'}
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                  Sincronizado
                                </Typography>
                              </Box>
                          </TableCell>
                          <TableCell align="right">
                            <MuiTooltip 
                              title={
                                <Box sx={{ p: 0.5 }}>
                                  <Typography variant="caption" display="block">
                                    Variação: {renderVariation(parseFloat(vendasLote[receita.id]?.preco || "0"), vendasMesAnterior[receita.id]?.preco)}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Custo Médio: R$ {receita.custo_teorico?.toFixed(2)}
                                  </Typography>
                                </Box>
                              } 
                              arrow
                            >
                              <Typography variant="body2" sx={{ cursor: 'help', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                                R$ {parseFloat(vendasLote[receita.id]?.preco || "0").toFixed(2)}
                              </Typography>
                            </MuiTooltip>
                          </TableCell>
                          <TableCell align="center">
                            <FormControlLabel
                                control={
                                  <Switch 
                                      checked={!!receita.is_menu_item} 
                                      color="success" 
                                      onChange={() => handleToggleMenuItem(receita.id, !!receita.is_menu_item)}
                                  />
                                }
                                label={receita.is_menu_item ? "Ativo" : "Off"}
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* LINHA DE DETALHAMENTO */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                            <Collapse in={expandedRows.includes(receita.id)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom component="div" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  Detalhamento de Insumos (Baseado em Preços Pagos)
                                  <Chip label="Última Compra" size="small" variant="outlined" color="info" sx={{ height: 18, fontSize: '0.6rem' }} />
                                </Typography>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Insumo</TableCell>
                                      <TableCell align="right">Peso Bruto</TableCell>
                                      <TableCell align="right">Preço Base (R$)</TableCell>
                                      <TableCell align="right">Subtotal (R$)</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {receita.composicao_receitas?.map((item: any, idx: number) => {
                                      const baseLabel = item.item_type === 'material' ? item.unidade : (item.peso_base === 1000 ? 'kg' : `${item.peso_base}g`);
                                      const qtdLabel = item.item_type === 'material' ? `${item.peso_bruto_g}${item.unidade}` : `${item.peso_bruto_g}g`;
                                      return (
                                        <TableRow key={idx}>
                                          <TableCell>{item.ingrediente_nome || 'Item Desconhecido'}</TableCell>
                                          <TableCell align="right">{qtdLabel}</TableCell>
                                          <TableCell align="right">R$ {item.preco_base?.toFixed(2)} / {baseLabel}</TableCell>
                                          <TableCell align="right">R$ {item.subtotal?.toFixed(2)}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                    <TableRow>
                                      <TableCell colSpan={3} align="right"><b>Total da Produção (Batch):</b></TableCell>
                                      <TableCell align="right"><b>R$ {receita.batchCost?.toFixed(2)}</b></TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* MODAIS */}
      <ModalPDV open={openPdvModal} onClose={() => setOpenPdvModal(false)} />
      <ModalDeliveryConfig 
        open={openDeliveryModal} 
        onClose={() => setOpenDeliveryModal(false)} 
        onSaved={() => setDeliveryKey(k => k + 1)}
      />
    </Container>
  );
}
