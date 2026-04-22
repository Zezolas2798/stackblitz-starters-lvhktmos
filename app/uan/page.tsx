'use client';

import { Box, Typography, Grid, Paper, CardActionArea } from '@mui/material';
import { ChefHat, CalendarDays, ShoppingBasket, Calculator, Layers, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UANMenuModule() {
  const router = useRouter();

  const MENU_ITEMS = [
    {
      title: 'Fichas Técnicas (UAN)',
      description: 'Gestão de Fichas de Preparação (FTP), rendimento bruto vs limpo e custos operacionais reais.',
      icon: <ChefHat size={40} color="#1976d2" />,
      path: '/uan/fichas'
    },
    {
      title: 'Planejamento Mensal',
      description: 'Criação de Cardápios cíclicos para as Unidades, determinando o que será servido dia a dia.',
      icon: <CalendarDays size={40} color="#388e3c" />,
      path: '/uan/cardapios'
    },
    {
      title: 'Logística & Compras',
      description: 'Verificação do orçamento consolidado, previsibilidade de compras via curva ABC e Lead Time.',
      icon: <ShoppingBasket size={40} color="#f57c00" />,
      path: '/uan/lista-compras'
    },
    {
      title: 'Relatórios de Custos',
      description: 'Análise aprofundada de custos per capita, custo total e variação dos preços de insumos.',
      icon: <Calculator size={40} color="#9c27b0" />,
      path: '#' // Futuro
    }
  ];

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" mb={1} color="primary">
        Gestão de Alimentação (UAN)
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Módulo exclusivo para dimensionamento operacional, logística e elaboração de cardápios corporativos.
      </Typography>

      <Grid container spacing={3}>
        {MENU_ITEMS.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={3} sx={{ borderRadius: 2, height: '100%', overflow: 'hidden' }}>
              <CardActionArea 
                onClick={() => router.push(item.path)}
                sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box mb={2}>
                  {item.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardActionArea>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
