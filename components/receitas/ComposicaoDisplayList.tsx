import React from 'react';
import { Paper, Typography, Divider, List, ListItem, ListItemText, Box, Chip, Tooltip, alpha, useTheme } from '@mui/material';
import { Scale } from 'lucide-react';
import VerifiedIcon from '@mui/icons-material/Verified';

interface ComposicaoDisplayItem {
  id: string | number;
  peso_liquido_g: number;
  fator_correcao: number;
  indice_coccao: number;
  tipo: 'ingrediente' | 'receita' | 'material';
  nome: string;
  preco_ultima_compra?: number;
  peso_unitario_g?: number | null; // Para materiais ou ingredientes por grama pre-calculado
  unidade_medida?: string; // Para materiais
  tipo_ingrediente?: string; // Para identificar aditivos
  funcao_aditivo?: string | null;
  referencia_info?: {
    nome: string;
    fonte: string;
  } | null;
  classificacao_nova?: number | null;
}

interface ComposicaoDisplayListProps {
  composicaoDisplay: ComposicaoDisplayItem[];
  isHistorico: boolean;
  formatoMoeda: Intl.NumberFormat;
}

export default function ComposicaoDisplayList({ composicaoDisplay, isHistorico, formatoMoeda }: ComposicaoDisplayListProps) {
  const theme = useTheme();

  return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
                <Scale size={24} /> Composição {isHistorico && '(Snapshot)'}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense disablePadding>
                {composicaoDisplay.map(item => (
                    <ListItem key={item.id} divider sx={{ px: 1 }}>
                        <ListItemText
                            primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                    {item.tipo_ingrediente === 'ADITIVO' && (
                                        <Chip label={item.funcao_aditivo || 'Aditivo'} size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                                    )}
                                    {item.referencia_info && (
                                        <Tooltip title={`Referência: ${item.referencia_info.nome} (${item.referencia_info.fonte})`}>
                                          <Chip 
                                            label={`${item.referencia_info.nome} (${item.referencia_info.fonte})`} 
                                            size="small" 
                                            color="info" 
                                            variant="outlined" 
                                            icon={<VerifiedIcon style={{ fontSize: '0.8rem' }} />}
                                            sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.info.main, 0.1) }} 
                                          />
                                        </Tooltip>
                                    )}
                                </Box>
                            }
                            secondary={
                                item.tipo === 'ingrediente' && item.preco_ultima_compra ? (
                                    <Typography variant="caption" color="text.secondary">
                                        Custo Base: {formatoMoeda.format(item.preco_ultima_compra)} por {item.peso_unitario_g || 1000}g
                                    </Typography>
                                ) : null
                            }
                        />
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight={600} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                                    {item.peso_liquido_g}{item.tipo === 'material' ? item.unidade_medida : 'g'}
                                </Typography>
                                {item.tipo !== 'material' && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        FC: {item.fator_correcao.toFixed(2)} | IC: {item.indice_coccao.toFixed(2)}
                                    </Typography>
                                )}
                                {/* Custo Insumo */}
                                {item.tipo === 'ingrediente' && item.preco_ultima_compra && item.peso_unitario_g ? (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatoMoeda.format((item.peso_liquido_g / item.peso_unitario_g) * item.preco_ultima_compra)}
                                    </Typography>
                                ) : null}
                                {/* Custo Material */}
                                {item.tipo === 'material' && item.preco_ultima_compra ? (
                                    <Typography variant="caption" color="text.secondary">
                                        {formatoMoeda.format(item.peso_liquido_g * item.preco_ultima_compra)}
                                    </Typography>
                                ) : null}
                            </Box>
                    </ListItem>
                ))}
            </List>
        </Paper>
  );
}
