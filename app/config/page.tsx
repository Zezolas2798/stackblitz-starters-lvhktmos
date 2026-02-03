'use client';

import Link from 'next/link';
import { 
  Box, Typography, Paper, Container, 
  Chip, Avatar, useTheme, alpha 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import { 
  ChevronRight, 
  Users, 
  Store,
  Package,
  ShieldCheck,
  Truck,
  ClipboardList,
  ListChecks,
  Lock
} from 'lucide-react';

export default function ConfigPage() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Configurações do Sistema
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
          Central de parâmetros técnicos. Defina aqui as regras de negócio, padrões de qualidade e acessos da sua operação.
        </Typography>
      </Box>

      {/* SEÇÃO 1: QUALIDADE & PROCESSOS (GxP) - NOVO */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 3, color: 'success.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <ClipboardList size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Qualidade e Processos (GxP)
        </Typography>
        
        <Grid container spacing={3}>
          {/* Card: Modelos de Demandas */}
          <Grid item xs={12} md={6} lg={4}>
            <Link href="/config/tarefas/modelos" passHref style={{ textDecoration: 'none' }}>
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
                    borderColor: 'success.main',
                    '& .icon-box': { bgcolor: 'success.main', color: 'white' }
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar className="icon-box" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', transition: 'all 0.2s' }}>
                    <ListChecks size={24} />
                  </Avatar>
                  <ChevronRight size={20} color={theme.palette.text.disabled} />
                </Box>
                
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                  Modelos de Demandas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Crie padrões para POPs, Limpeza e Produção. Defina checklists e responsáveis automáticos.
                </Typography>
              </Paper>
            </Link>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4, borderColor: 'divider', opacity: 0.6 }} />

      {/* SEÇÃO 2: OPERAÇÃO & LOGÍSTICA */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 3, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Truck size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Logística e Estoque
        </Typography>
        
        <Grid container spacing={3}>
          {/* Card: Configuração de Estoque */}
          <Grid item xs={12} md={6} lg={4}>
            <Link href="/config/estoque" passHref style={{ textDecoration: 'none' }}>
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
                    '& .icon-box': { bgcolor: 'primary.main', color: 'white' }
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar className="icon-box" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', transition: 'all 0.2s' }}>
                    <Package size={24} />
                  </Avatar>
                  <ChevronRight size={20} color={theme.palette.text.disabled} />
                </Box>
                
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                  Locais & Categorias
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Defina a estrutura física (Câmaras, Estoques) e a árvore de categorias dos insumos.
                </Typography>
              </Paper>
            </Link>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 4, borderColor: 'divider', opacity: 0.6 }} />

      {/* SEÇÃO 3: ADMINISTRAÇÃO & ACESSOS */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 3, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <ShieldCheck size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Administrativo e Segurança
        </Typography>

        <Grid container spacing={3}>
          {/* Link para Clientes */}
          <Grid item xs={12} md={6} lg={4}>
            <Link href="/clientes" passHref style={{ textDecoration: 'none' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    borderColor: 'text.primary',
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'text.primary' }}>
                    <Store size={24} />
                  </Avatar>
                  <Chip label="Corporativo" size="small" variant="outlined" sx={{ height: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                  Unidades / Filiais
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gerencie os endereços e dados fiscais de cada unidade de produção.
                </Typography>
              </Paper>
            </Link>
          </Grid>

          {/* ATUALIZADO: Link para Cargos (RBAC) */}
          <Grid item xs={12} md={6} lg={4}>
            <Link href="/config/cargos" passHref style={{ textDecoration: 'none' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                    <Lock size={24} />
                  </Avatar>
                  <Chip label="Segurança" size="small" color="info" variant="outlined" sx={{ height: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                  Cargos e Permissões
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure o controle de acesso (RBAC) e defina quem pode ver ou editar cada módulo.
                </Typography>
              </Paper>
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

// Helper componente Divider se não existir importado (mas já importamos do MUI)
function Divider({ sx, ...props }: any) {
  return <Box component="hr" sx={{ border: 'none', borderBottom: '1px solid', ...sx }} {...props} />;
}