'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, TextField,
  Accordion, AccordionSummary, AccordionDetails, Alert, Grid
} from '@mui/material';
import { ShoppingCart, ArrowLeft, Loader2, AlertTriangle, FileText, ServerCrash, ChevronDown, ChevronRight } from 'lucide-react';
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (cat: string) => {
    setExpandedGroups(prev => ({ ...prev, [cat]: !prev[cat] }));
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
          {/* Barra de Resumo Minimalista (Auditável) */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            border: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            borderRadius: 1
          }}>
            <Box textAlign="center">
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>INSUMOS NO CICLO</Typography>
              <Typography variant="h6" fontWeight={800}>{resumo?.total_ingredientes ?? 0} <small style={{ fontWeight: 400, fontSize: '0.7rem' }}>itens</small></Typography>
            </Box>
            <Box sx={{ width: '1px', height: '30px', bgcolor: '#cbd5e1' }} />
            <Box textAlign="center">
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>ORÇAMENTO PREVISTO</Typography>
              <Typography variant="h6" fontWeight={800} color="primary.dark">
                R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box sx={{ width: '1px', height: '30px', bgcolor: '#cbd5e1' }} />
            <Box textAlign="center">
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>PESO BRUTO TOTAL</Typography>
              <Typography variant="h6" fontWeight={800} color="success.dark">
                {(resumo?.peso_total_bruto_kg ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} <small style={{ fontWeight: 400, fontSize: '0.7rem' }}>kg</small>
              </Typography>
            </Box>
          </Paper>

          {/* DETALHAMENTO EXECUTIVO ESTILO ERP (Inspirado em image-75) */}
          <Paper elevation={0} sx={{ border: '1px solid #d1d5db', borderRadius: 1, overflow: 'hidden', bgcolor: '#fff' }}>
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
                    <Typography color="text.secondary">O cardápio selecionado não possui itens para processamento.</Typography>
                  </Box>
                );
              }

              return (
                <Box>
                  <Box sx={{ p: 1.5, bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1 }}>DETALHAMENTO TÉCNICO DE INSUMOS</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Relatório Gerencial NutriDev GxP</Typography>
                  </Box>
                  
                <Box sx={{ position: 'relative' }}>
                  <Table size="small" sx={{ 
                    '& .MuiTableCell-root': { py: 0.8, borderRight: '1px solid #f3f4f6', fontSize: '0.75rem' },
                    '& .MuiTableCell-head': { 
                      bgcolor: '#334155', 
                      color: '#fff', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      borderBottom: '2px solid #0f172a'
                    }
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={40}></TableCell>
                        <TableCell width={300}>Descrição do Insumo</TableCell>
                        <TableCell align="right" width={100}>Nec. Bruta</TableCell>
                        <TableCell align="right" width={120}>Estoque/Buffer</TableCell>
                        <TableCell align="right" width={100}>Qtd. Compra</TableCell>
                        <TableCell align="right" width={110}>Vlr. Unitário</TableCell>
                        <TableCell align="right" width={120} sx={{ pr: 2 }}>Vlr. Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoriasOrdenadas.map(cat => {
                        const isExpanded = expandedGroups[cat] !== false; // Default expanded
                        return (
                        <React.Fragment key={cat}>
                          {/* Divisor de Grupo de Alto Contraste */}
                          <TableRow 
                            onClick={() => toggleGroup(cat)}
                            sx={{ 
                              bgcolor: '#f1f5f9', 
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#e2e8f0' },
                              borderTop: '2px solid #cbd5e1'
                            }}
                          >
                            <TableCell sx={{ pl: 1 }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </TableCell>
                            <TableCell colSpan={5} sx={{ fontWeight: 900, color: '#0f172a', py: 1.2 }}>
                              GRUPO: {cat.toUpperCase()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.dark', pr: 2 }}>
                              R$ {grouped[cat].totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>

                          {isExpanded && grouped[cat].items.map((c, idx) => (
                            <TableRow 
                              key={c.ingrediente_id} 
                              sx={{ 
                                bgcolor: idx % 2 === 0 ? '#fff' : '#f8fafc',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                '& td': { borderBottom: '1px solid #f1f5f9' }
                              }}
                            >
                               <TableCell></TableCell>
                               <TableCell sx={{ fontWeight: 600, pl: 2, color: '#334155' }}>{c.nome_ingrediente.toUpperCase()}</TableCell>
                               <TableCell align="right">{c.necessidade_bruta_kg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</TableCell>
                               <TableCell align="right">
                                  {c.estoque_minimo_kg > 0 ? (
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 700 }}>
                                      MÍN: {c.estoque_minimo_kg.toFixed(2)} kg
                                    </Typography>
                                  ) : '-'}
                               </TableCell>
                               <TableCell align="right">
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                                     {c.qtd_comprar_kg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                                  </Typography>
                               </TableCell>
                               <TableCell align="right" sx={{ color: '#64748b' }}>R$ {c.preco_ultima_compra?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</TableCell>
                               <TableCell align="right" sx={{ pr: 2 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>
                                    R$ {c.custo_estimado_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </Typography>
                               </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      )})}
                    </TableBody>
                  </Table>
                </Box>
                
                {/* Rodapé de Fechamento do Relatório */}
                <Box sx={{ p: 2, bgcolor: '#0f172a', color: '#fff', textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8, fontWeight: 700 }}>
                    TOTAL GERAL DO CICLO DE CARDÁPIO
                  </Typography>
                  <Typography variant="h5" fontWeight={900}>
                    R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            );
          })()}
        </Paper>
        </>
      )}
    </Box>
  );
}
