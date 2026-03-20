'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Chip, 
  IconButton,
  CircularProgress,
  Container,
  Avatar,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Plus, 
  FileText, 
  MoreVertical, 
  Calendar, 
  CheckCircle2,
  Clock,
  ListChecks,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ChecklistModelo } from '@/lib/types';

export default function ModelosPage() {
  const theme = useTheme();
  // Estado definido como 'modelos'
  const [modelos, setModelos] = useState<ChecklistModelo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelos();
  }, []);

  async function loadModelos() {
    setLoading(true);
    const { data, error } = await (supabase as any).from('checklist_modelos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setModelos(data);
    setLoading(false);
  }

  // Helper para cor da frequência
  const getFreqColor = (freq: string) => {
      switch(freq) {
          case 'DIARIO': return theme.palette.error.main;
          case 'SEMANAL': return theme.palette.primary.main;
          case 'MENSAL': return theme.palette.warning.main;
          default: return theme.palette.text.secondary;
      }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Modelos de Checklist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Padronize as auditorias e controles de qualidade (BPF/POPs).
          </Typography>
        </Box>
        <Link href="/consultoria/modelos/criar" passHref style={{ textDecoration: 'none' }}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<Plus size={20} />}
            sx={{ px: 3 }}
          >
            Novo Modelo
          </Button>
        </Link>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && modelos.length === 0 && (
        <Paper 
            sx={{ 
                p: 8, 
                textAlign: 'center', 
                border: '2px dashed', 
                borderColor: 'divider',
                bgcolor: 'background.default',
                borderRadius: 4
            }}
        >
          <Box sx={{ mb: 3, color: 'text.disabled' }}><ListChecks size={64} strokeWidth={1} /></Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum modelo cadastrado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Crie seu primeiro checklist (ex: &quot;Recebimento de Mercadorias&quot; ou &quot;Higiene Pessoal&quot;) para começar a aplicar auditorias.
          </Typography>
          <Link href="/consultoria/modelos/criar" passHref style={{ textDecoration: 'none' }}>
            <Button variant="outlined" size="large" startIcon={<Plus size={18}/>}>Criar Primeiro Checklist</Button>
          </Link>
        </Paper>
      )}

      {/* Grid de Modelos */}
      <Grid container spacing={3}>
        {modelos.map((modelo) => (
          <Grid item xs={12} md={6} lg={4} key={modelo.id}>
            <Paper 
                elevation={0}
                sx={{ 
                    p: 0, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                        borderColor: 'primary.light'
                    }
                }}
            >
              <IconButton size="small" sx={{ position: 'absolute', top: 12, right: 12 }}>
                <MoreVertical size={18} />
              </IconButton>
              
              <Box sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                        sx={{ 
                            bgcolor: alpha(getFreqColor(modelo.frequencia_sugerida || ''), 0.1), 
                            color: getFreqColor(modelo.frequencia_sugerida || ''),
                            width: 48, height: 48
                        }}
                    >
                        <FileText size={24} />
                    </Avatar>
                    <Box>
                        <Chip 
                          label={modelo.ativo ? 'Ativo' : 'Inativo'} 
                          size="small" 
                          color={modelo.ativo ? 'success' : 'default'} 
                          variant={modelo.ativo ? 'filled' : 'outlined'}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', mb: 0.5 }} 
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {modelo.titulo}
                        </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {modelo.descricao || 'Sem descrição definida.'}
                  </Typography>
              </Box>

              <Divider />

              <Box sx={{ p: 2, bgcolor: 'background.default', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={16} color={theme.palette.text.secondary} />
                  <Typography variant="caption" fontWeight="bold" color="text.primary">
                    {modelo.frequencia_sugerida || 'Livre'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle2 size={16} color={theme.palette.text.secondary} />
                  <Typography variant="caption" color="text.secondary">
                    Versão {modelo.versao || 1}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}


