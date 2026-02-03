'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress,
  Container
} from '@mui/material';
import { 
  TrendingUp, 
  Warning, 
  CheckCircle, 
  Inventory 
} from '@mui/icons-material';

export default function DashboardPage() {
  const router = useRouter();
  const { unidadeSelecionada, loading: loadingContext } = useClient();
  const [checkingAuth, setCheckingAuth] = useState(true);

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
  if (checkingAuth || loadingContext) {
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

        {/* Área de Gráficos / Detalhes (Placeholder) */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderStyle: 'dashed', borderWidth: 2, borderColor: 'divider' }}>
            <Typography color="text.secondary">
              Gráficos de desempenho e auditoria aparecerão aqui.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}