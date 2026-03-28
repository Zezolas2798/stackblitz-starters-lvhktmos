'use client';

import './globals.css';
import { usePathname } from 'next/navigation'; // <--- Importante para checar a rota
import React, { useMemo } from 'react';

// Fontes
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import { ClientProvider, useClient } from '@/lib/ClientContext';
import { ThemeContextProvider, useThemeContext } from '@/lib/ThemeContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import StyledComponentsRegistry from '@/lib/registry';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import { getTheme } from '@/lib/theme';

const DRAWER_WIDTH = 280;

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeContext();
  const theme = useMemo(() => getTheme(mode), [mode]);
  const pathname = usePathname(); // Pega a rota atual
  const isLoginPage = pathname === '/login'; // Verifica se é a tela de login

  const { desktopOpen } = useClient();
  const currentDrawerWidth = desktopOpen ? DRAWER_WIDTH : 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* LÓGICA DE LAYOUT CONDICIONAL */}
      {isLoginPage ? (
        // === LAYOUT DE LOGIN (Limpo e Centralizado) ===
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default', // Usar o novo tema
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </Box>
      ) : (
        // === LAYOUT DO SISTEMA (Com Sidebar e Header) ===
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

          {/* Cabeçalho Fixo Full-Width */}
          <AppHeader />

          {/* Menu Lateral */}
          <AppSidebar width={DRAWER_WIDTH} />

          {/* Área Principal */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default'
            }}
          >
            {/* Espaçador para o Cabeçalho Fixo */}
            <Toolbar />

            {/* Conteúdo */}
            <Box component="div" sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
              {children}
            </Box>
          </Box>
        </Box>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>NutriDev Manager GxP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <StyledComponentsRegistry>
          <ThemeContextProvider>
            <ClientProvider>
              <ThemeApplier>{children}</ThemeApplier>
            </ClientProvider>
          </ThemeContextProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}


