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

import { ClientProvider } from '@/lib/ClientContext';
import { ThemeContextProvider, useThemeContext } from '@/lib/ThemeContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { getTheme } from '@/lib/theme';

const DRAWER_WIDTH = 280;

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeContext();
  const theme = useMemo(() => getTheme(mode), [mode]);
  const pathname = usePathname(); // Pega a rota atual
  const isLoginPage = pathname === '/login'; // Verifica se é a tela de login

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

          {/* Menu Lateral */}
          <AppSidebar width={DRAWER_WIDTH} />

          {/* Área Principal */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default'
            }}
          >
            <AppHeader />

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
        <ThemeContextProvider>
          <ClientProvider>
            <ThemeApplier>{children}</ThemeApplier>
          </ClientProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}