'use client';

import React from 'react';
import { useClient } from '@/lib/ClientContext';
import { useThemeContext } from '@/lib/ThemeContext';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Avatar, Stack } from '@mui/material';
import { Menu as MenuIcon, Notifications, Person, LightMode, DarkMode } from '@mui/icons-material';

export function AppHeader() {
  const { toggleMobileSidebar, toggleDesktopSidebar, unidadeSelecionada } = useClient();
  const { mode, toggleTheme } = useThemeContext();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        {/* Ícone Menu (Mobile) */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={toggleMobileSidebar}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Ícone Menu (Desktop) */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={toggleDesktopSidebar}
          sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* LOGO DO SISTEMA NO HEADER */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <img
            src={mode === 'dark' ? "/logo-cortex.svg" : "/logo-cortex-light.svg"}
            alt="Córtex Food Solution"
            style={{ height: '36px', objectFit: 'contain' }}
          />
        </Box>

        {/* Breadcrumb da Unidade */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1.2 }}>
            NutriDev Manager
          </Typography>
          {unidadeSelecionada ? (
            <Typography variant="caption" color="text.secondary">
              {unidadeSelecionada.cliente?.nome_fantasia} • {unidadeSelecionada.nome_unidade}
            </Typography>
          ) : (
            <Typography variant="caption" color="error">
              Nenhuma unidade selecionada
            </Typography>
          )}
        </Box>

        {/* Área do Usuário */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="inherit" onClick={toggleTheme} aria-label="Alternar tema">
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24, mx: 1 }} />

          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight="bold">Qualidade</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Admin</Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <Person fontSize="small" />
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}


