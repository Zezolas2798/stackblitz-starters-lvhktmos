'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Box, Typography, Paper, Container, Chip, Avatar, useTheme, alpha, Button 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import { 
  ClipboardCheck, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  TrendingUp,
  AlertTriangle,
  History,
  Thermometer,
  Database,
  BarChart3,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { useState, useEffect } from 'react';

export default function ConsultoriaHubPage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  const [incompletosCount, setIncompletosCount] = useState<number | null>(null);
  const [loadingKpi, setLoadingKpi] = useState(true);

  useEffect(() => {
    async function fetchKpis() {
      if (!activeClientId) return;
      try {
        const { count, error } = await supabase
          .from('ingredientes')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', activeClientId)
          .is('deleted_at', null)
          .or('energia_kcal.is.null,contem_gluten.is.null');
        
        if (!error) setIncompletosCount(count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingKpi(false);
      }
    }
    fetchKpis();
  }, [activeClientId]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER HERO */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Central de Consultoria
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
          Inteligência em Segurança dos Alimentos. Monitore o desempenho das unidades, gerencie a curadoria de dados e garanta a conformidade técnica.
        </Typography>
      </Box>

      {/* DASHBOARD RÁPIDO */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: 'info.light', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                 <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}><Database size={18} /></Avatar>
                 <Typography variant="subtitle2" fontWeight="bold" color="info.dark">Curadoria de Insumos</Typography>
              </Box>
              <Typography variant="h3" fontWeight="800" color="text.primary">
                {loadingKpi ? '...' : incompletosCount ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Insumos com cadastro incompleto</Typography>
           </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: 'error.light', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                 <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}><AlertTriangle size={18} /></Avatar>
                 <Typography variant="subtitle2" fontWeight="bold" color="error.dark">Desvios de Temperatura</Typography>
              </Box>
              <Typography variant="h3" fontWeight="800" color="text.primary">2</Typography>
              <Typography variant="caption" color="text.secondary">Equipamentos fora da faixa (hoje)</Typography>
           </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldCheck className="text-blue-600" /> Ferramentas de Análise e Gestão
      </Typography>

      <Grid container spacing={4}>
        
        {/* CARD 1: CURADORIA DE INSUMOS */}
        <Grid item xs={12} md={4}>
          <Link href="/ingredientes?filter=incomplete" passHref style={{ textDecoration: 'none' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 4, transition: 'all 0.3s ease', cursor: 'pointer',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)', borderColor: 'primary.main', '& .icon-box': { bgcolor: 'primary.main', color: 'white' } }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Avatar className="icon-box" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48, transition: '0.3s' }}>
                  <Database size={24} />
                </Avatar>
                <ChevronRight size={20} color={theme.palette.text.disabled} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Curadoria de Insumos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                Analise e complete o cadastro técnico dos seus ingredientes para garantir cálculos nutricionais precisos.
              </Typography>
              <Chip label="Qualidade de Dados" size="small" color="primary" variant="outlined" sx={{ borderRadius: 1 }} />
            </Paper>
          </Link>
        </Grid>

        {/* CARD 2: ANÁLISE DE TEMPERATURAS */}
        <Grid item xs={12} md={4}>
          <Link href="/consultoria/temperaturas" passHref style={{ textDecoration: 'none' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 4, transition: 'all 0.3s ease', cursor: 'pointer',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)', borderColor: 'error.main', '& .icon-box': { bgcolor: 'error.main', color: 'white' } }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Avatar className="icon-box" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 48, height: 48, transition: '0.3s' }}>
                  <Thermometer size={24} />
                </Avatar>
                <ChevronRight size={20} color={theme.palette.text.disabled} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Análise de Temperaturas</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                Dashboard técnico para monitoramento de desvios térmicos em equipamentos e processos de cocção.
              </Typography>
              <Chip label="Segurança Alimentar" size="small" color="error" variant="outlined" sx={{ borderRadius: 1 }} />
            </Paper>
          </Link>
        </Grid>

        {/* CARD 3: RELATÓRIOS DE CHECKLIST */}
        <Grid item xs={12} md={4}>
          <Link href="/consultoria/analise-checklist" passHref style={{ textDecoration: 'none' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 4, transition: 'all 0.3s ease', cursor: 'pointer',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)', borderColor: 'info.main', '& .icon-box': { bgcolor: 'info.main', color: 'white' } }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Avatar className="icon-box" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 48, height: 48, transition: '0.3s' }}>
                  <BarChart3 size={24} />
                </Avatar>
                <ChevronRight size={20} color={theme.palette.text.disabled} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Relatórios de Checklist</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                Análise comparativa de desempenho entre modelos de auditoria e evolução temporal de conformidades.
              </Typography>
              <Chip label="Business Intelligence" size="small" color="info" variant="outlined" sx={{ borderRadius: 1 }} />
            </Paper>
          </Link>
        </Grid>

      </Grid>

      {/* OUTRAS FERRAMENTAS */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase' }}>
          Configurações Técnicas
        </Typography>
        <Grid container spacing={2}>
           <Grid item xs={12} md={3}>
              <Link href="/consultoria/modelos" passHref style={{ textDecoration: 'none' }}>
                <Button fullWidth variant="outlined" startIcon={<History size={16}/>} sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                  Modelos de Auditoria
                </Button>
              </Link>
           </Grid>
        </Grid>
      </Box>

    </Container>
  );
}


