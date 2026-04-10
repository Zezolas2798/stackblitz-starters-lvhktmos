'use client';

import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Button, 
  Divider,
  useTheme,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import {
  Groups,
  Store,
  AdminPanelSettings,
  TrendingUp,
  ArrowForward,
  Info,
  Layers,
  Business,
  Settings,
  Shield,
  History,
  NotificationsActive
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartDefinitions, getGradientUrl } from '@/components/charts/ChartStyles';
import Link from 'next/link';

// Mock data para o Dashboard Global
const clientEngagementData = [
  { name: 'Jan', active: 45, new: 5 },
  { name: 'Fev', active: 52, new: 8 },
  { name: 'Mar', active: 61, new: 12 },
  { name: 'Abr', active: 68, new: 7 },
  { name: 'Mai', active: 85, new: 18 },
  { name: 'Jun', active: 102, new: 24 },
];

const moduleDistribution = [
  { name: 'Financeiro', value: 85, color: '#4caf50' },
  { name: 'Estoque', value: 70, color: '#2196f3' },
  { name: 'Qualidade', value: 95, color: '#f44336' },
  { name: 'Compras', value: 40, color: '#ff9800' },
];

export function SystemDashboard() {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <ChartDefinitions />
      {/* HEADER DA CENTRAL */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Central de Controle
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
            Governança Global do Ecossistema NutriDev
          </Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<History />}>Logs de Auditoria</Button>
            <Button variant="contained" startIcon={<Settings />} color="primary">Configurações</Button>
          </Stack>
        </Box>
      </Box>

      {/* MÉTRICAS DE TOPO */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total de Clientes', value: '1,248', icon: <Business />, color: theme.palette.primary.main, trend: '+12% este mês' },
          { title: 'Unidades Ativas', value: '3,892', icon: <Store />, color: theme.palette.secondary.main, trend: '+5.4% de adesão' },
          { title: 'Usuários Sistema', value: '18,402', icon: <Groups />, color: '#673ab7', trend: '98.2% ativos' },
          { title: 'Status do Core', value: 'Saudável', icon: <Shield />, color: '#4caf50', trend: 'Uptime 99.99%' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              borderRadius: 4, 
              border: `1px solid ${theme.palette.divider}`,
              backgroundImage: `linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0))`,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, borderRadius: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Chip size="small" label={stat.trend} sx={{ bgcolor: `${stat.color}10`, color: stat.color, fontWeight: 'bold' }} />
                </Stack>
                <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* GRÁFICO DE CRESCIMENTO */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 4, height: 450 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Expansão do Ecossistema</Typography>
                <Typography variant="caption" color="text.secondary">Variação de clientes ativos e novos entrantes</Typography>
              </Box>
              <Button size="small">Ver Detalhes</Button>
            </Stack>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={clientEngagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#gradientPrimary)" 
                  name="Clientes Ativos"
                  filter="url(#shadowDepth)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* DISTRIBUIÇÃO DE MÓDULOS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: 450, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Adoção de Módulos</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 4 }}>Taxa de ativação por funcionalidade</Typography>
            
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                  <Pie
                    data={moduleDistribution}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {moduleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getGradientUrl(entry.color)} filter="url(#shadowDepth)" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Stack spacing={1} sx={{ mt: 2 }}>
              {moduleDistribution.map((mod, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: mod.color }} />
                    <Typography variant="body2">{mod.name}</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight="bold">{mod.value}%</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* AÇÕES RÁPIDAS */}
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, mb: 3 }}>Acesso Rápido</Typography>
          <Grid container spacing={2}>
            {[
              { title: 'Gestão de Clientes', desc: 'Configurar novos parceiros e módulos', icon: <Business />, href: '/admin/sistema', color: '#1976d2' },
              { title: 'Segurança & ACL', desc: 'Gerenciar permissões e grupos globais', icon: <AdminPanelSettings />, href: '#', color: '#9c27b0' },
              { title: 'Notificações Globais', desc: 'Enviar alertas para todos os usuários', icon: <NotificationsActive />, href: '#', color: '#ed6c02' },
              { title: 'Relatórios de Sistema', desc: 'Exportar métricas de uso e faturamento', icon: <Layers />, href: '#', color: '#2e7d32' },
            ].map((action, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Link href={action.href} style={{ textDecoration: 'none' }}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    cursor: 'pointer',
                    bgcolor: `${action.color}05`,
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: action.color,
                      bgcolor: `${action.color}10`,
                      transform: 'scale(1.02)'
                    }
                  }}>
                    <Avatar sx={{ bgcolor: action.color, color: '#fff' }}>{action.icon}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{action.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{action.desc}</Typography>
                    </Box>
                  </Paper>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
