'use client';
import { createTheme, alpha } from '@mui/material/styles';

// --- CONCEITO NUTRITHEME: "Zelus Brand" ---
// Zelus Coral (#FE615E): Ação principal, logo e destaque.
// Dark Mode: Fundo #080808, cards #121212, textos #fefefe e secundários #c8c8c9.
// Light Mode (Default): Fundo #faf9f5, cards #FFFFFF, textos escuros para leitura limpa.

export const getTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#FE615E', // Zelus Coral
        light: '#ff8a88',
        dark: '#c42b29',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#c8c8c9' : '#334155',
        light: isDark ? '#fefefe' : '#64748b',
        dark: isDark ? '#a0a0a0' : '#1e293b',
        contrastText: isDark ? '#080808' : '#FFFFFF',
      },
      success: {
        main: '#059669', // Emerald 600 (Conformidade Sanitária)
        light: '#34D399',
        dark: '#065F46',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#D97706', // Amber 600 (Alertas de Vencimento)
        light: '#FBBF24',
        dark: '#B45309',
      },
      error: {
        main: '#DC2626', // Red 600 (Crítico/Bloqueado/Não Conforme)
        light: '#F87171',
        dark: '#991B1B',
      },
      background: {
        default: isDark ? '#080808' : '#faf9f5', // Fundo principal
        paper: isDark ? '#121212' : '#FFFFFF',   // Fundo de cards/menus
      },
      text: {
        primary: isDark ? '#fefefe' : '#0F172A',
        secondary: isDark ? '#c8c8c9' : '#64748B',
      },
      divider: isDark ? 'rgba(200, 200, 201, 0.1)' : '#E2E8F0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 600, letterSpacing: '-0.025em' },
      h4: { fontWeight: 600, letterSpacing: '-0.025em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#080808' : '#faf9f5',
            scrollbarColor: isDark ? '#475569 #080808' : '#94a3b8 #faf9f5',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: isDark ? '#334155' : '#cbd5e1',
              minHeight: 24,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(200, 200, 201, 0.1)' : '#E2E8F0'}`,
            boxShadow: isDark
              ? '0px 4px 20px rgba(0, 0, 0, 0.5)'
              : '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
          },
          rounded: { borderRadius: 12 }
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            padding: '8px 20px',
            '&:hover': {
              boxShadow: isDark ? '0px 4px 10px rgba(254, 97, 94, 0.15)' : '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          },
          containedPrimary: {
            background: isDark
              ? 'linear-gradient(135deg, #FE615E 0%, #ff8a88 100%)'
              : 'linear-gradient(135deg, #FE615E 0%, #c42b29 100%)',
            color: '#FFFFFF', // Texto claro no botão primário
          }
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 12px',
            padding: '10px 16px',
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha('#FE615E', 0.25) : alpha('#FE615E', 0.15),
              color: isDark ? '#ffffff' : '#080808',
              borderLeft: `4px solid ${isDark ? '#ff8a88' : '#FE615E'}`, // Darker border in light mode for contrast
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: isDark ? alpha('#FE615E', 0.35) : alpha('#FE615E', 0.25),
              },
              '& .MuiListItemIcon-root': {
                color: isDark ? '#ffffff' : '#080808',
              },
              // Forçamos a cor do texto para o ListItemText quando está selecionado
              '& .MuiTypography-root': {
                color: isDark ? '#ffffff' : '#080808',
                fontWeight: 700,
              }
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? 'rgba(200, 200, 201, 0.1)' : '#E2E8F0'}`,
            boxShadow: 'none',
            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
          }
        }
      }
    },
  });
};



