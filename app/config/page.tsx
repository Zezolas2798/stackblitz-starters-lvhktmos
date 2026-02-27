// app/config/page.tsx
'use client';

import Link from 'next/link';
import { 
  Box, Typography, Paper, Button, Divider, Container, 
  Chip, Avatar, useTheme, alpha 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import { 
  MapPin, 
  Tag, 
  Settings, 
  ChevronRight, 
  Users, 
  Store,
  Package,
  ShieldCheck,
  Truck
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
          Central de parâmetros técnicos. Defina aqui as regras de negócio que governam a qualidade e a logística da sua operação.
        </Typography>
      </Box>

      {/* SEÇÃO 1: OPERAÇÃO & LOGÍSTICA */}
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

      {/* SEÇÃO 2: ADMINISTRAÇÃO & ACESSOS */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 3, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <ShieldCheck size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Administrativo e Segurança
        </Typography>

        <Grid container spacing={3}>
          {/* Link para Clientes (Atalho) */}
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
                  <Chip label="Atalho" size="small" variant="outlined" sx={{ height: 24 }} />
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

          {/* Placeholder: Usuários */}
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
                opacity: 0.8
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.400' }}>
                  <Users size={24} />
                </Avatar>
                <Chip label="Em Breve" size="small" sx={{ bgcolor: 'grey.100', color: 'text.secondary', height: 24, fontWeight: 600 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.disabled', mb: 1 }}>
                Equipe e Permissões
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Controle de acesso granular (Nutricionista, Estoquista, Gerente) e auditoria de usuários.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}