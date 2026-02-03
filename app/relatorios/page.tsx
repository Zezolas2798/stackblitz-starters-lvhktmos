'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid,
  Avatar,
  useTheme,
  alpha,
  Link as MuiLink
} from '@mui/material';
import { 
  TrendingUp, 
  BookOpen, 
  ChevronRight, 
  PieChart,
  FileText
} from 'lucide-react';

export default function RelatoriosHubPage() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Central de Relatórios
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
          Acesse os indicadores de desempenho da equipe, fichas técnicas e documentos de conformidade sanitária.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        
        {/* CARD 1: DESEMPENHO (OPERACIONAL) */}
        <Grid item xs={12} md={6}>
          <MuiLink 
            component={Link} 
            href="/relatorios/desempenho" 
            underline="none"
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  borderColor: 'primary.main',
                  '& .icon-box': { bgcolor: 'primary.main', color: 'white' }
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Avatar className="icon-box" sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', transition: 'all 0.2s' }}>
                  <TrendingUp size={28} />
                </Avatar>
                <ChevronRight size={24} color={theme.palette.text.disabled} />
              </Box>
              
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                Desempenho & KPIs
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2, flexGrow: 1 }}>
                Analise a produtividade da equipe, taxas de conclusão de tarefas, pontualidade e ranking de colaboradores.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.100', color: 'text.secondary' }}><PieChart size={14} /></Avatar>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Métricas em Tempo Real
                </Typography>
              </Box>
            </Paper>
          </MuiLink>
        </Grid>

        {/* CARD 2: RECEITAS (TÉCNICO) */}
        <Grid item xs={12} md={6}>
          <MuiLink 
            component={Link} 
            href="/relatorios/receitas" 
            underline="none"
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  borderColor: 'secondary.main', // Slate
                  '& .icon-box': { bgcolor: 'secondary.main', color: 'white' }
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Avatar className="icon-box" sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', transition: 'all 0.2s' }}>
                  <BookOpen size={28} />
                </Avatar>
                <ChevronRight size={24} color={theme.palette.text.disabled} />
              </Box>
              
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                Livro de Receitas & Nutrição
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2, flexGrow: 1 }}>
                Gere fichas técnicas operacionais (cozinha) e tabelas nutricionais (rótulo) para impressão e auditoria.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.100', color: 'text.secondary' }}><FileText size={14} /></Avatar>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Exportação PDF
                </Typography>
              </Box>
            </Paper>
          </MuiLink>
        </Grid>

      </Grid>
    </Container>
  );
}