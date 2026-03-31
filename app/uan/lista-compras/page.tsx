'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, TextField,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ShoppingCart, ArrowLeft, Loader2, AlertTriangle, FileText } from 'lucide-react';

interface CompraItem {
  ingrediente_id: string;
  nome_insumo: string;
  necessidade_bruta_kg: number;
  estoque_atual_kg: number;
  estoque_minimo_kg: number;
  quantidade_comprar_kg: number;
  preco_ultima_compra: number;
  categoria: string;
  fornecedor_padrao?: string;
  lead_time_dias?: number;
}

export default function ListaComprasUANPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  
  const [loading, setLoading] = useState(false);
  const [cardapios, setCardapios] = useState<CardapioUAN[]>([]);
  const [cardapioSelecionado, setCardapioSelecionado] = useState<string>('');
  
  const [compras, setCompras] = useState<CompraItem[]>([]);
  const [custoTotal, setCustoTotal] = useState(0);

  // 1. Carrega os Cardápios Disponíveis
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

  // 2. Calcula a Necessidade quando um Cardápio é selecionado
  useEffect(() => {
    async function calcularCompras() {
      if (!cardapioSelecionado || !activeClientId) return;
      setLoading(true);
      
      try {
        // A. Dados do Cardápio
        const cardapio = cardapios.find(c => c.id === cardapioSelecionado);
        if (!cardapio) throw new Error("Cardápio inválido");

        // B. Buscar a Grade (Todas as fichas alocadas e suas quantidades contextuais)
        const { data: gradeData, error: errGrade } = await supabase
          .from('cardapio_dias_uan')
          .select('ficha_uan_id, data_consumo, tipo_refeicao, fator_multiplicador')
          .eq('cardapio_id', cardapioSelecionado);

        if (errGrade) throw errGrade;
        if (!gradeData || gradeData.length === 0) {
           setCompras([]);
           setCustoTotal(0);
           setLoading(false);
           return;
        }
        
        // C. Mapear Total de Porções Planetadas para cada Ficha Técnica no Ciclo
        // Chave: ficha_uan_id, Valor: soma das (comensais * fator)
        const totalPortionsPerFicha: Record<string, number> = {};
        
        gradeData.forEach(item => {
           const d = new Date(item.data_consumo + 'T12:00:00Z');
           const dayOfWeek = d.getDay().toString();
           const config = cardapio.config_excecoes_dias?.[item.data_consumo] || {};
           
           // Resolve o numero de comensais para esta refeição específica neste dia
           const comensaisRef = config.comensais?.[item.tipo_refeicao] ?? 
                              cardapio.comensais_modelo?.[dayOfWeek]?.[item.tipo_refeicao] ?? 
                              cardapio.comensais_estimados_dia;
           
           const porcoesItem = comensaisRef * (item.fator_multiplicador || 1);
           totalPortionsPerFicha[item.ficha_uan_id] = (totalPortionsPerFicha[item.ficha_uan_id] || 0) + porcoesItem;
        });

        const fichasIds = Object.keys(totalPortionsPerFicha);

        // D. Buscar a Composição dessas Fichas
        const { data: compData, error: compErr } = await supabase
          .from('composicao_fichas_uan')
          .select('ficha_uan_id, ingrediente_id, peso_bruto_g')
          .in('ficha_uan_id', fichasIds);

        if (compErr) throw compErr;

        // E. Buscar Detalhes dos Ingredientes (Estoque, Preço)
        const ingredIds = Array.from(new Set(compData?.map(c => c.ingrediente_id) || []));
        const { data: ingData, error: ingErr } = await supabase
          .from('ingredientes')
          .select('id, nome, preco_ultima_compra, estoque_minimo_kg, categoria_produto_id, cliente_categorias_produto(nome)')
          .in('id', ingredIds);

        if (ingErr) throw ingErr;

        // F. Consolidar Cálculos (Agrupar por Insumo)
        const mapCalculo: Record<string, CompraItem> = {};

        compData?.forEach((composicao: any) => {
           const porcoesTotaisFicha = totalPortionsPerFicha[composicao.ficha_uan_id] || 0;
           
           // Peso Bruto Total = Peso Bruto (g) da Ficha * Total de Porções no Ciclo
           const pbTotalG = composicao.peso_bruto_g * porcoesTotaisFicha;
           const pbTotalKg = pbTotalG / 1000;

           const ing = ingData?.find(i => i.id === composicao.ingrediente_id);
           
           if (!mapCalculo[composicao.ingrediente_id]) {
               mapCalculo[composicao.ingrediente_id] = {
                  ingrediente_id: composicao.ingrediente_id,
                  nome_insumo: ing?.nome || 'Desconhecido',
                  necessidade_bruta_kg: 0,
                  estoque_atual_kg: 0, 
                  estoque_minimo_kg: ing?.estoque_minimo_kg || 0,
                  preco_ultima_compra: ing?.preco_ultima_compra || 0,
                  quantidade_comprar_kg: 0,
                  categoria: (() => {
                    const catObj = ing?.cliente_categorias_produto;
                    if (Array.isArray(catObj)) return catObj[0]?.nome || 'Outros';
                    return (catObj as any)?.nome || 'Outros';
                  })()
               };
           }
           
           mapCalculo[composicao.ingrediente_id].necessidade_bruta_kg += pbTotalKg;
        });

        let total = 0;
        const listaFinal = Object.values(mapCalculo).map(item => {
           // Quantidade a Comprar = MAX(0, Necessidade - EstoqueAtual + EstoqueMinimo)
           item.quantidade_comprar_kg = Math.max(0, item.necessidade_bruta_kg - item.estoque_atual_kg + item.estoque_minimo_kg);
           total += item.quantidade_comprar_kg * item.preco_ultima_compra;
           return item;
        });

        listaFinal.sort((a,b) => (b.quantidade_comprar_kg * b.preco_ultima_compra) - (a.quantidade_comprar_kg * a.preco_ultima_compra));

        setCompras(listaFinal);
        setCustoTotal(total);

      } catch(e: any) {
        alert("Erro no cálculo: " + e.message);
      } finally {
        setLoading(false);
      }
    }
    calcularCompras();
  }, [cardapioSelecionado, cardapios, activeClientId]);

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold" flexGrow={1} display="flex" alignItems="center" gap={1}>
           <ShoppingCart /> Previsão de Compras (UAN)
        </Typography>
        <Button variant="outlined" startIcon={<FileText />}>Exportar PDF</Button>
      </Box>

      <Paper sx={{ mb: 4, p: 3 }}>
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
               {c.nome_ciclo} ({new Date(c.data_inicio).toLocaleDateString()} a {new Date(c.data_fim).toLocaleDateString()}) - {c.comensais_estimados_dia} Comensais
             </MenuItem>
           ))}
        </TextField>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><Loader2 className="animate-spin" /></Box>
      ) : cardapioSelecionado && (
        <>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Paper sx={{ p: 3, flex: 1, bgcolor: '#f0f9ff', borderLeft: '4px solid #0284c7' }}>
               <Typography variant="body2" color="text.secondary">Insumos Mapeados</Typography>
               <Typography variant="h4" color="primary.main">{compras.length}</Typography>
            </Paper>
            <Paper sx={{ p: 3, flex: 1, bgcolor: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
               <Typography variant="body2" color="text.secondary">Orçamento Estimado (Baseado na última compra)</Typography>
               <Typography variant="h4" color="error.main">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
            </Paper>
          </Box>

          {/* Grupos de Categorias */}
          {(() => {
            const grouped = compras.reduce((acc, item) => {
              const cat = item.categoria || 'Outros';
              if (!acc[cat]) acc[cat] = { items: [], totalCusto: 0 };
              acc[cat].items.push(item);
              acc[cat].totalCusto += item.quantidade_comprar_kg * (item.preco_ultima_compra || 0);
              return acc;
            }, {} as Record<string, { items: CompraItem[], totalCusto: number }>);

            const categoriasOrdenadas = Object.keys(grouped).sort((a,b) => {
               if (a === 'Outros') return 1;
               if (b === 'Outros') return -1;
               return a.localeCompare(b);
            });

            if (compras.length === 0) {
              return (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  O cardápio selecionado não possui fichas distribuídas na grade.
                </Paper>
              );
            }

            return categoriasOrdenadas.map(cat => (
              <Accordion key={cat} defaultExpanded sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <AccordionSummary expandIcon={<span>▼</span>} sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                     <Typography fontWeight="bold" color="primary.main">{cat} ({grouped[cat].items.length} itens)</Typography>
                     <Typography fontWeight="bold" color="error.main">Subtotal: R$ {grouped[cat].totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Typography>
                   </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell>Insumo</TableCell>
                          <TableCell align="right">Nec. Bruta</TableCell>
                          <TableCell align="right">Buffer</TableCell>
                          <TableCell align="right">Comprar</TableCell>
                          <TableCell align="right">Preço Base</TableCell>
                          <TableCell align="right">Custo Est.</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grouped[cat].items.map(c => (
                          <TableRow key={c.ingrediente_id} hover>
                             <TableCell sx={{ fontWeight: 'medium' }}>{c.nome_insumo}</TableCell>
                             <TableCell align="right">{c.necessidade_bruta_kg.toFixed(2)} kg</TableCell>
                             <TableCell align="right">
                                {c.estoque_minimo_kg > 0 ? (
                                  <Chip size="small" label={`${c.estoque_minimo_kg} kg`} color="warning" variant="outlined" />
                                ) : '-'}
                             </TableCell>
                             <TableCell align="right">
                                <Typography color="primary.main" fontWeight="bold">
                                   {c.quantidade_comprar_kg.toFixed(2)} kg
                                </Typography>
                             </TableCell>
                             <TableCell align="right">R$ {c.preco_ultima_compra?.toFixed(2) || '0.00'}</TableCell>
                             <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                R$ {(c.quantidade_comprar_kg * (c.preco_ultima_compra || 0)).toFixed(2)}
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ));
          })()}
        </>
      )}
    </Box>
  );
}
