'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, TextField,
  Accordion, AccordionSummary, AccordionDetails, Alert, Grid
} from '@mui/material';
import { ShoppingCart, ArrowLeft, Loader2, AlertTriangle, FileText, ServerCrash } from 'lucide-react';
import { formatLocalDate } from '@/lib/utils/dateUtils';

interface ItemListaCompra {
  ingrediente_id: string;
  nome_ingrediente: string;
  grupo_id: string | null;
  nome_grupo: string | null;
  necessidade_bruta_g: number;
  necessidade_bruta_kg: number;
  estoque_atual_kg: number;
  estoque_minimo_kg: number;
  qtd_comprar_kg: number;
  preco_ultima_compra: number;
  custo_estimado_total: number;
}

interface ResumoCompras {
  total_ingredientes: number;
  custo_total_estimado: number;
  peso_total_bruto_kg: number;
  dias_no_ciclo: number;
  total_porcoes_ciclo: number;
}

export default function ListaComprasUANPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  
  const [loading, setLoading] = useState(false);
  const [cardapios, setCardapios] = useState<CardapioUAN[]>([]);
  const [cardapioSelecionado, setCardapioSelecionado] = useState<string>('');
  
  const [compras, setCompras] = useState<ItemListaCompra[]>([]);
  const [resumo, setResumo] = useState<ResumoCompras | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // 1. Carrega os Cardápios Disponíveis (permanece client-side — é apenas um SELECT simples)
  useEffect(() => {
    async function fetchCardapios() {
      if (!activeClientId) return;
      const { data } = await supabase
        .from('cardapios_uan')
        .select('*')
        .eq('cliente_id', activeClientId)
        .order('data_inicio', { ascending: false });
      if (data) setCardapios(data as unknown as CardapioUAN[]);
    }
    fetchCardapios();
  }, [activeClientId]);

  // 2. Calcula a Necessidade via Edge Function
  useEffect(() => {
    async function calcularCompras() {
      if (!cardapioSelecionado || !activeClientId) return;
      setLoading(true);
      setErro(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('calcular-cardapio-uan', {
          body: { cardapio_id: cardapioSelecionado },
        });

        if (error) throw new Error(error.message || 'Erro na Edge Function');
        if (data?.error) throw new Error(data.error);

        setCompras(data.itens || []);
        setResumo(data.resumo || null);

      } catch (e: any) {
        console.error('Erro ao calcular compras:', e);
        setErro(e.message || 'Erro desconhecido ao processar a lista de compras.');
        setCompras([]);
        setResumo(null);
      } finally {
        setLoading(false);
      }
    }
    calcularCompras();
  }, [cardapioSelecionado, activeClientId]);

  const handleExportarPDF = () => {
    window.print();
  };

  const custoTotal = resumo?.custo_total_estimado ?? 0;

  return (
    <Box p={4} sx={{ 
      '@media print': { 
        p: 0,
        '& .no-print': { display: 'none' },
        '& .Paper-root': { boxShadow: 'none', border: '1px solid #eee' }
      } 
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }} className="no-print">
        <Typography variant="h5" fontWeight="bold" flexGrow={1} display="flex" alignItems="center" gap={1}>
           <ShoppingCart /> Previsão de Compras (UAN)
        </Typography>
        <Button variant="contained" startIcon={<FileText />} onClick={handleExportarPDF}>Exportar PDF</Button>
      </Box>

      {/* Cabeçalho de Impressão (Auditável) */}
      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 4, borderBottom: '2px solid #333', pb: 2 } }}>
        <Typography variant="h4" fontWeight="bold">Relatório de Previsão de Compras - UAN</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Data de Emissão: {new Date().toLocaleDateString('pt-BR')} | Unidade: Filial - Shopping
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, p: 3 }} className="no-print">
        <Typography variant="subtitle2" color="text.secondary" mb={2}>SELECIONE O CICLO DE CARDÁPIO APROVADO</Typography>
        <TextField
          select
          fullWidth
          label="Cardápio"
          value={cardapioSelecionado}
          onChange={e => setCardapioSelecionado(e.target.value)}
        >
           {cardapios.map(c => (
             <MenuItem key={c.id} value={c.id}>
               {c.nome_ciclo} ({formatLocalDate(c.data_inicio)} a {formatLocalDate(c.data_fim)}) - {c.comensais_estimados_dia} Comensais
             </MenuItem>
           ))}
        </TextField>
      </Paper>

      {/* Erro da Edge Function */}
      {erro && (
        <Alert severity="error" icon={<ServerCrash size={20} />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">Erro no cálculo</Typography>
          <Typography variant="body2">{erro}</Typography>
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><Loader2 className="animate-spin" /></Box>
      ) : cardapioSelecionado && !erro && (
        <>
          {/* KPI Cards - Executive Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, boxShadow: '0 4px 20px rgba(25, 118, 210, 0.2)' }}>
                 <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 'bold', letterSpacing: 1 }}>Insumos Mapeados</Typography>
                 <Typography variant="h3" fontWeight="bold">{resumo?.total_ingredientes ?? 0}</Typography>
                 <Typography variant="body2" sx={{ opacity: 0.8 }}>Total de itens distintos no ciclo</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                 <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Orçamento Estimado</Typography>
                 <Typography variant="h3" fontWeight="bold" color="error.main">
                   R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">Baseado no preço da última compra</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                 <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Peso Logístico Total</Typography>
                 <Typography variant="h3" fontWeight="bold" color="success.main">
                   {(resumo?.peso_total_bruto_kg ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} <small style={{ fontSize: '0.5em' }}>kg</small>
                 </Typography>
                 <Typography variant="body2" color="text.secondary">Volume bruto para transporte/armazenagem</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* DETALHAMENTO EXECUTIVO POR CATEGORIA */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
            {(() => {
              const grouped = compras.reduce((acc, item) => {
                const cat = item.nome_grupo || 'Outros';
                if (!acc[cat]) acc[cat] = { items: [], totalCusto: 0 };
                acc[cat].items.push(item);
                acc[cat].totalCusto += item.custo_estimado_total;
                return acc;
              }, {} as Record<string, { items: ItemListaCompra[], totalCusto: number }>);

              const categoriasOrdenadas = Object.keys(grouped).sort((a,b) => {
                 if (a === 'Outros') return 1;
                 if (b === 'Outros') return -1;
                 return a.localeCompare(b);
              });

              if (compras.length === 0) {
                return (
                  <Box p={8} textAlign="center">
                    <Typography color="text.secondary">O cardápio selecionado não possui preparações planejadas para o período.</Typography>
                  </Box>
                );
              }

              return (
                <Box>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">DETALHAMENTO POR GRUPO DE INSUMOS</Typography>
                    <Typography variant="caption" color="text.secondary">Valores em Reais (R$) e Quilogramas (kg)</Typography>
                  </Box>
                  
                  {categoriasOrdenadas.map(cat => (
                    <Box key={cat} sx={{ mb: 4 }}>
                      <Box sx={{ px: 3, py: 1.5, bgcolor: 'rgba(25, 118, 210, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: 'primary.dark' }}>
                          {cat}
                        </Typography>
                        <Chip 
                          label={`Subtotal: R$ ${grouped[cat].totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold', bgcolor: 'white' }}
                        />
                      </Box>
                      
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', pl: 4 }}>Item / Insumo</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nec. Bruta</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Estoque/Buffer</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Qtd. Compra</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Preço Unit.</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', pr: 3 }}>Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grouped[cat].items.map(c => (
                            <TableRow key={c.ingrediente_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                               <TableCell sx={{ pl: 4, py: 1.5 }}>
                                 <Typography variant="body2" fontWeight={500}>{c.nome_ingrediente}</Typography>
                               </TableCell>
                               <TableCell align="right">{c.necessidade_bruta_kg.toFixed(2)} kg</TableCell>
                               <TableCell align="right">
                                  {c.estoque_minimo_kg > 0 ? (
                                    <Typography variant="caption" sx={{ color: 'warning.dark' }}>Min: {c.estoque_minimo_kg} kg</Typography>
                                  ) : '-'}
                               </TableCell>
                               <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                                     {c.qtd_comprar_kg.toFixed(2)} kg
                                  </Typography>
                               </TableCell>
                               <TableCell align="right" sx={{ color: 'text.secondary' }}>R$ {c.preco_ultima_compra?.toFixed(2) || '0.00'}</TableCell>
                               <TableCell align="right" sx={{ pr: 3 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    R$ {c.custo_estimado_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </Typography>
                               </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
                </Box>
              );
            })()}
          </Paper>
        </>
      )}
    </Box>
  );
}
