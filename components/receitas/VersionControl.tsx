import React from 'react';
import { Paper, Box, Typography, Divider, Grid, TextField, MenuItem, Chip, alpha, useTheme } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { ReceitaVersao } from '@/lib/types';

interface VersionControlProps {
  receitaAtual: any;
  historicoVersoes: ReceitaVersao[];
  versaoSelecionadaId: string | null;
  handleSelecionarVersao: (v: string) => void;
  versaoDetalhes: ReceitaVersao | null | undefined;
}

export default function VersionControl({
  receitaAtual,
  historicoVersoes,
  versaoSelecionadaId,
  handleSelecionarVersao,
  versaoDetalhes
}: VersionControlProps) {
  const theme = useTheme();

  return (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold" color="primary.main">Controle de Versão</Typography>
            </Box>
            
            <Grid container spacing={3} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                    <TextField
                        select
                        fullWidth
                        size="medium"
                        label="Versão em Visualização"
                        value={versaoSelecionadaId || 'ATUAL'}
                        onChange={(e) => handleSelecionarVersao(e.target.value)}
                    >
                        <MenuItem value="ATUAL">
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="bold">Versão Atual (Trabalho)</Typography>
                                {receitaAtual.status === 'RASCUNHO' && <Chip label="Rascunho" size="small" />}
                            </Box>
                        </MenuItem>
                        
                        {historicoVersoes.length > 0 && <Divider />}
                        
                        {historicoVersoes.map((v) => (
                            <MenuItem key={v.id} value={v.id}>
                                <Typography variant="body1">Versão {v.versao} - {new Date(v.data_aprovacao).toLocaleDateString()}</Typography>
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {versaoDetalhes && (
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`, borderRadius: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.dark">
                                DETALHES DO SNAPSHOT:
                            </Typography>
                            <Typography variant="body2" display="block"><b>Data:</b> {new Date(versaoDetalhes.data_aprovacao).toLocaleString()}</Typography>
                            <Typography variant="body2" display="block"><b>Motivo:</b> {versaoDetalhes.motivo_alteracao}</Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Paper>
  );
}
