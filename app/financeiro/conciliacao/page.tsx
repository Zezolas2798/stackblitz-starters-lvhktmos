'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Grid, TextField, Button, Divider } from '@mui/material';
import { calculateCashLeakage } from '@/lib/financeiro/valuation';
import { Wallet, Info } from 'lucide-react';

export default function ConciliacaoFinanceiraPage() {
  const [revenue, setRevenue] = useState<number>(10000);
  const [mdrRate, setMdrRate] = useState<number>(2.5); // 2.5% MDR average
  const [anticipationRate, setAnticipationRate] = useState<number>(3.5); // 3.5% ao mês
  const [daysAnticipated, setDaysAnticipated] = useState<number>(25);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const leakage = calculateCashLeakage(revenue, mdrRate, anticipationRate, daysAnticipated);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
          Conciliação e Vazamento de Caixa
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Simulador de Antecipação de Recebíveis e perdas por MDR (Taxa de Cartão).
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Calculadora de Recebíveis D+N
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField 
                            label="Faturamento Mês em Cartão Crédito (R$)"
                            type="number" fullWidth 
                            value={revenue}
                            onChange={(e) => setRevenue(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField 
                            label="Taxa MDR Adquirente (%)"
                            type="number" fullWidth 
                            value={mdrRate}
                            onChange={(e) => setMdrRate(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField 
                            label="Taxa Antecipação Mensal (%)"
                            type="number" fullWidth 
                            value={anticipationRate}
                            onChange={(e) => setAnticipationRate(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            label="Dias Antecipados (Ex: Recebe em D+2 ao invés de D+30 = 28 dias)"
                            type="number" fullWidth 
                            value={daysAnticipated}
                            onChange={(e) => setDaysAnticipated(Number(e.target.value))}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
             <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#f8fafc', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                    <Wallet size={24} />
                    <Typography variant="h6" fontWeight="bold">
                        Margem Líquida Real
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Venda Bruta:</Typography>
                    <Typography variant="body1" fontWeight="bold">{formatCurrency(revenue)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, color: 'error.main' }}>
                    <Typography variant="body1">Custo Adquirente (MDR):</Typography>
                    <Typography variant="body1" fontWeight="bold">- {formatCurrency(leakage.mdrCost)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, color: 'error.main' }}>
                    <Typography variant="body1">Custo Financeiro Antecipação:</Typography>
                    <Typography variant="body1" fontWeight="bold">- {formatCurrency(leakage.anticipationCost)}</Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">Caixa Líquido "Na Conta"</Typography>
                        <Typography variant="caption" color="text.secondary">O que realmente paga as contas</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="900" color="success.main">
                        {formatCurrency(leakage.netRevenue)}
                    </Typography>
                </Box>

                <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(255,165,0,0.1)', borderRadius: 1, display: 'flex', gap: 1 }}>
                    <Info size={20} color="#ff9800" />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-block' }}>
                        A antecipação de recebíveis no restaurante frequentemente destrói o Lucro Operacional (GOP). Cuidado com o modo "Antecipação Automática".
                    </Typography>
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
