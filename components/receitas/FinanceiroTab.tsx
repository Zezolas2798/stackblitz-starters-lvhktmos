import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Grid, TextField, Button, Alert, Chip, Divider, CardMedia
} from '@mui/material';
import { 
  TrendingUp, AlertCircle, CheckCircle, HelpCircle, Save, Image as ImageIcon 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function FinanceiroTab({ 
  receitaExibida, 
  composicaoDisplay, 
  custoTotalUltimo, 
  isHistorico,
  onSavePreco
}: {
  receitaExibida: any;
  composicaoDisplay: any[];
  custoTotalUltimo: number;
  isHistorico: boolean;
  onSavePreco: (novoPreco: number) => Promise<void>;
}) {
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (receitaExibida?.preco_venda) {
      setPrecoVenda(receitaExibida.preco_venda.toString());
    } else {
      setPrecoVenda('');
    }
  }, [receitaExibida]);

  // Cálculos de Custo
  const rendimentoTotal = Number(receitaExibida?.rendimento_total_g) || 1000;
  const porcaoFinal = Number(receitaExibida?.peso_embalagem_g) || Number(receitaExibida?.porcao_final_g_ml) || 100;
  
  // Custo por porção = (Custo Total / Rendimento Total) * Tamanho da Porção
  const custoPorcao = (custoTotalUltimo / rendimentoTotal) * porcaoFinal;

  // Preço Sugerido (Alvo de CMV 35%)
  const alvoCmv = 0.35;
  const precoSugerido = custoPorcao > 0 ? custoPorcao / alvoCmv : 0;

  // CMV Atual (%)
  const precoVendaNum = parseFloat(precoVenda) || 0;
  const cmvAtual = precoVendaNum > 0 ? (custoPorcao / precoVendaNum) * 100 : 0;

  // Status do CMV
  const getCmvStatus = (cmv: number) => {
    if (cmv === 0) return { label: 'Indefinido', color: 'default', icon: <HelpCircle size={18} /> };
    if (cmv <= 30) return { label: 'Excelente', color: 'success', icon: <CheckCircle size={18} /> };
    if (cmv <= 35) return { label: 'Adequado', color: 'info', icon: <TrendingUp size={18} /> };
    if (cmv <= 40) return { label: 'Atenção (Alto)', color: 'warning', icon: <AlertCircle size={18} /> };
    return { label: 'Crítico', color: 'error', icon: <AlertCircle size={18} /> };
  };

  const status = getCmvStatus(cmvAtual);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePreco(parseFloat(precoVenda) || 0);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={4}>
        {/* Lado Esquerdo: Resumo Financeiro e Ações */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={24} /> Controle de Preço e CMV
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Foto do Produto */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
               {receitaExibida?.foto_url ? (
                   <Box sx={{ 
                     width: 200, height: 200, borderRadius: 2, overflow: 'hidden', 
                     border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                   }}>
                      <CardMedia
                          component="img"
                          image={receitaExibida.foto_url}
                          alt={receitaExibida.nome}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                   </Box>
               ) : (
                   <Box sx={{ 
                       width: 200, height: 200, borderRadius: 2, bgcolor: '#f5f5f5', 
                       display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                       color: 'text.secondary', border: '1px dashed #ccc'
                   }}>
                       <ImageIcon size={32} />
                       <Typography variant="caption" sx={{ mt: 1 }}>Sem foto</Typography>
                   </Box>
               )}
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Custo da Receita</Typography>
                        <Typography variant="h6" fontWeight="bold">R$ {custoTotalUltimo.toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">Rend: {rendimentoTotal}g</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Custo da Porção</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                            R$ {custoPorcao.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Porção: {porcaoFinal}g</Typography>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Preço de Venda Sugerido (Alvo: 35% CMV)
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mb: 2 }}>
                    R$ {precoSugerido.toFixed(2)}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Preço de Venda Definido
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField 
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="0.00"
                        value={precoVenda}
                        onChange={(e) => setPrecoVenda(e.target.value)}
                        disabled={isHistorico}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>R$</Typography>
                        }}
                    />
                    {!isHistorico && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<Save size={18} />}
                            onClick={handleSave}
                            disabled={isSaving || !precoVenda}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    )}
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box>
                <Typography variant="subtitle2" gutterBottom>Indicador de Margem (CMV)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid', borderColor: `${status.color}.light`, bgcolor: `${status.color}.lighter`, borderRadius: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color={`${status.color}.main`}>
                            {cmvAtual.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Custo de Mercadoria Vendida
                        </Typography>
                    </Box>
                    <Chip 
                        icon={status.icon} 
                        label={status.label} 
                        color={status.color as any}
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>
            </Box>

          </Paper>
        </Grid>

        {/* Lado Direito: Detalhamento de Custos */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Detalhamento de Insumos e Embalagens
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Custos baseados no último valor de compra registrado no sistema.
            </Typography>

            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>Insumo / Material</TableCell>
                        <TableCell align="right">Qtd Usada</TableCell>
                        <TableCell align="right">Preço Base (R$)</TableCell>
                        <TableCell align="right">Subtotal (R$)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {composicaoDisplay.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                <Typography color="text.secondary">Nenhuma composição cadastrada.</Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        composicaoDisplay.map((item, idx) => {
                            // Cálculo do subtotal específico para exibição na tabela
                            let subtotal = 0;
                            let baseLabel = '';
                            let qtdLabel = '';
                            
                            if (item.tipo === 'ingrediente') {
                                const pesoUnitario = item.peso_unitario_g || 1000;
                                subtotal = (item.peso_liquido_g / pesoUnitario) * (item.preco_ultima_compra || 0);
                                baseLabel = pesoUnitario === 1000 ? 'kg' : `${pesoUnitario}g`;
                                qtdLabel = `${item.peso_liquido_g}g`;
                            } else if (item.tipo === 'material') {
                                subtotal = item.peso_liquido_g * (item.preco_ultima_compra || 0);
                                baseLabel = item.unidade_medida || 'un';
                                qtdLabel = `${item.peso_liquido_g}${baseLabel}`;
                            } else {
                                // Receita aninhada (ainda não suporta preço recursivo automático aqui, ou considera 0)
                                subtotal = 0;
                                qtdLabel = `${item.peso_liquido_g}g`;
                                baseLabel = 'g';
                            }

                            return (
                                <TableRow key={item.id + idx}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={item.tipo === 'material' ? 'bold' : 'normal'}>
                                            {item.nome}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                            {item.tipo === 'material' ? 'Embalagem/Material' : 'Ingrediente'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{qtdLabel}</TableCell>
                                    <TableCell align="right">
                                        R$ {(item.preco_ultima_compra || 0).toFixed(2)} / {baseLabel}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        R$ {subtotal.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                    <TableRow>
                        <TableCell colSpan={3} align="right">
                            <Typography fontWeight="bold">Total da Produção (Receita Inteira):</Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography fontWeight="bold" color="primary.main">
                                R$ {custoTotalUltimo.toFixed(2)}
                            </Typography>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
