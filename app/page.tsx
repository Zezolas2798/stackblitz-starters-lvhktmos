'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { usePermission } from '@/hooks/usePermission';
import { SystemDashboard } from '@/components/SystemDashboard';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Inventory
} from '@mui/icons-material';

const financeiroData = [
  { name: 'Jan', receitas: 4000, despesas: 2400 },
  { name: 'Fev', receitas: 3000, despesas: 1398 },
  { name: 'Mar', receitas: 2000, despesas: 1800 },
  { name: 'Abr', receitas: 2780, despesas: 3908 },
  { name: 'Mai', receitas: 1890, despesas: 4800 },
  { name: 'Jun', receitas: 2390, despesas: 3800 },
];

const qualidadeData = [
  { name: 'Lote A', conformidade: 98, desvios: 2 },
  { name: 'Lote B', conformidade: 95, desvios: 5 },
  { name: 'Lote C', conformidade: 99, desvios: 1 },
  { name: 'Lote D', conformidade: 92, desvios: 8 },
];

const estoqueData = [
  { name: 'Matéria Prima', qtde: 400 },
  { name: 'Embalagem', qtde: 300 },
  { name: 'Produto Final', qtde: 200 },
  { name: 'Consumíveis', qtde: 150 },
];

const desempenhoData = [
  { name: 'Cozinha', desempenho: 85 },
  { name: 'Limpeza', desempenho: 92 },
  { name: 'Expedição', desempenho: 78 },
  { name: 'Produção', desempenho: 88 },
  { name: 'Qualidade', desempenho: 95 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { unidadeSelecionada, loading: loadingContext, isSystemMode } = useClient();
  const { role, loading: loadingPerms } = usePermission();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // 1. GUARDIÃO DA ROTA (Auth Guard)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Se não tem sessão, manda pro login
          router.replace('/login');
        } else {
          // Se tem sessão, libera a tela
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error('Erro de sessão:', error);
        router.replace('/login');
      }
    };

    checkSession();
  }, [router]);

  // Enquanto verifica a senha ou carrega o contexto, mostra Loading
  if (checkingAuth || loadingContext || loadingPerms) {
    return (
      <Box
        sx={{
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Autenticando acesso...
        </Typography>
      </Box>
    );
  }

  // Se for SUPER ADMIN em modo sistema (sem unidade selecionada), mostra a Central de Controle
  if (isSystemMode && role === 'super_admin') {
    return <SystemDashboard />;
  }

  // Se chegou aqui, o usuário está logado.
  // Agora validamos se ele selecionou uma unidade.
  if (!unidadeSelecionada) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4, bgcolor: '#FFF4E5', border: '1px solid #FFCC80' }}>
          <Warning color="warning" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Bem-vindo ao NutriDev GxP
          </Typography>
          <Typography variant="body1">
            Para acessar o Dashboard, por favor <strong>selecione uma unidade</strong> no menu lateral ou no topo da tela.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // === DASHBOARD REAL (Conteúdo Protegido) ===
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          Visão Geral
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumo operacional da unidade: <strong>{unidadeSelecionada.nome_unidade}</strong>
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Card 1: Status Geral */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.main', borderRadius: 2 }}>
              <CheckCircle fontSize="large" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                CONFORMIDADE GxP
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                98.5%
              </Typography>
              <Typography variant="caption" color="success.main">
                +2.4% vs mês anterior
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 2: Produção */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2 }}>
              <TrendingUp fontSize="large" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                PRODUÇÃO HOJE
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                12 Lotes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                4 em andamento
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 3: Estoque */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ p: 1.5, bgcolor: 'warning.light', color: 'warning.main', borderRadius: 2 }}>
              <Inventory fontSize="large" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                ITENS CRÍTICOS
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                3 Itens
              </Typography>
              <Typography variant="caption" color="error.main">
                Reposição necessária
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Área de Gráficos / Detalhes (Tabs) */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', mb: 4, mt: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                aria-label="dashboard tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Financeiro" />
                <Tab label="Qualidade" />
                <Tab label="Estoque" />
                <Tab label="Desempenho" />
              </Tabs>
            </Box>

            {/* Aba Financeiro */}
            {activeTab === 0 && (
              <Box sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">Receitas vs Despesas</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financeiroData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" stroke="#4caf50" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="despesas" stroke="#f44336" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Aba Qualidade */}
            {activeTab === 1 && (
              <Box sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">Índice de Conformidade por Lote</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualidadeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="conformidade" fill="#2196f3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="desvios" fill="#ff9800" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Aba Estoque */}
            {activeTab === 2 && (
              <Box sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">Níveis de Estoque</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estoqueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="qtde" fill="#673ab7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Aba Desempenho */}
            {activeTab === 3 && (
              <Box sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" gutterBottom color="text.secondary">Desempenho por Equipe (%)</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={desempenhoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="desempenho" fill="#009688" radius={[0, 4, 4, 0]} name="Desempenho Geral" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


