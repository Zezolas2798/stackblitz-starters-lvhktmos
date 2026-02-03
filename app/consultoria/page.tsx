'use client';

import Link from 'next/link';
import { 
  Box, Typography, Paper, Container, Chip, Avatar, useTheme, alpha 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import { 
  ClipboardCheck, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function ConsultoriaHubPage() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER HERO */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Consultoria & Qualidade
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
          Gestão de Segurança dos Alimentos. Gerencie modelos de auditoria, monitore não conformidades e garanta a aplicação das Boas Práticas (BPF/RDC).
        </Typography>
      </Box>

      {/* DASHBOARD RÁPIDO (PLACEHOLDER DE KPI) */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: 'success.light', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                 <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}><TrendingUp size={18} /></Avatar>
                 <Typography variant="subtitle2" fontWeight="bold" color="success.dark">Conformidade Geral</Typography>
              </Box>
              <Typography variant="h3" fontWeight="800" color="text.primary">94%</Typography>
              <Typography variant="caption" color="text.secondary">Média das últimas 30 auditorias</Typography>
           </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: 'warning.light', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                 <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}><AlertTriangle size={18} /></Avatar>
                 <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">Planos de Ação</Typography>
              </Box>
              <Typography variant="h3" fontWeight="800" color="text.primary">3</Typography>
              <Typography variant="caption" color="text.secondary">Pendências em aberto</Typography>
           </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldCheck className="text-blue-600" /> Ferramentas de Gestão
      </Typography>

      <Grid container spacing={3}>
        
        {/* CARD: BIBLIOTECA DE CHECKLISTS */}
        <Grid item xs={12} md={6} lg={4}>
          <Link href="/consultoria/modelos" passHref style={{ textDecoration: 'none' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  borderColor: 'primary.main',
                  '& .icon-avatar': { bgcolor: 'primary.main', color: 'white' }
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Avatar className="icon-avatar" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', transition: 'all 0.2s' }}>
                  <ClipboardCheck size={24} />
                </Avatar>
                <ChevronRight size={20} color={theme.palette.text.disabled} />
              </Box>
              
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                Meus Checklists
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                Crie e personalize modelos de avaliação (Recebimento, Higiene, Temperatura) para suas unidades.
              </Typography>
              <Chip label="Configuração" size="small" variant="outlined" sx={{ borderRadius: 1 }} />
            </Paper>
          </Link>
        </Grid>

        {/* CARD: NOVA AUDITORIA (Atalho Operacional) */}
        <Grid item xs={12} md={6} lg={4}>
          <Link href="/operacao/auditorias" passHref style={{ textDecoration: 'none' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  borderColor: 'secondary.main',
                  '& .icon-avatar': { bgcolor: 'secondary.main', color: 'white' }
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Avatar className="icon-avatar" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', transition: 'all 0.2s' }}>
                  <ShieldCheck size={24} />
                </Avatar>
                <ChevronRight size={20} color={theme.palette.text.disabled} />
              </Box>
              
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                Realizar Auditoria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                Inicie uma nova inspeção em campo utilizando os modelos cadastrados.
              </Typography>
              <Chip label="Operação" size="small" color="secondary" variant="outlined" sx={{ borderRadius: 1 }} />
            </Paper>
          </Link>
        </Grid>

        {/* CARD: RELATÓRIOS (Placeholder) */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              height: '100%',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              opacity: 0.7
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.400' }}>
                <FileText size={24} />
              </Avatar>
              <Chip label="Em Breve" size="small" sx={{ bgcolor: 'grey.100', color: 'text.secondary', fontWeight: 600 }} />
            </Box>
            
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.disabled', mb: 1 }}>
              Relatórios de Qualidade
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Análise de tendência de conformidades e geração de relatórios fotográficos automáticos.
            </Typography>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}