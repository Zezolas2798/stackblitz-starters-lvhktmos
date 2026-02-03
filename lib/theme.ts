'use client';
import { createTheme, alpha } from '@mui/material/styles';

// --- CONCEITO NUTRITHEME: "Slate & Emerald" ---
// Slate (Cinza Azulado): Transmite solidez, limpeza e tecnologia.
// Emerald (Verde Esmeralda): Usado para conformidade (Aprovado, Conforme).
// Royal Blue: Ações principais do sistema.

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Royal Blue moderno (Foco e Ação)
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#475569', // Slate 600 (Neutro forte para textos secundários)
      light: '#94A3B8',
      dark: '#1E293B',
      contrastText: '#FFFFFF',
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
      default: '#F1F5F9', // Slate 100 (Fundo suave, reduz cansaço visual)
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900 (Preto suave, melhor leitura)
      secondary: '#64748B', // Slate 500
    },
    divider: '#E2E8F0', // Slate 200
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em', color: '#0F172A' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', color: '#0F172A' },
    h3: { fontWeight: 600, letterSpacing: '-0.025em', color: '#0F172A' },
    h4: { fontWeight: 600, letterSpacing: '-0.025em', color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
    subtitle1: { fontWeight: 500, color: '#475569' },
    subtitle2: { fontWeight: 600, color: '#475569' },
    button: {
      textTransform: 'none', // Remove caixa alta forçada (mais amigável)
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12, // Bordas mais suaves (Modern UI)
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F1F5F9',
          // Scrollbar personalizada (fina e elegante)
          scrollbarColor: '#94a3b8 #f1f5f9',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#cbd5e1',
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
          border: '1px solid #E2E8F0',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)', // Sombra sutil "Apple-like"
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
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)', // Micro-interação tátil
          },
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)', // Degradê sutil
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
            backgroundColor: alpha('#2563EB', 0.10),
            color: '#2563EB',
            borderLeft: '4px solid #2563EB', // Indicador visual claro de "Onde estou"
            '&:hover': {
              backgroundColor: alpha('#2563EB', 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: '#2563EB',
            },
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
          borderBottom: '1px solid #E2E8F0',
          boxShadow: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Efeito Glassmorphism
          backdropFilter: 'blur(8px)',
        }
      }
    }
  },
});

export default theme;