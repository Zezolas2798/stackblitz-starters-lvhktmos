'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  Chip, LinearProgress, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  CircularProgress, Alert, Container, useTheme, alpha,
  Divider, Tooltip, List, ListItemButton
} from '@mui/material';
import { 
  ChefHat, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  ClipboardList,
  Layers,
  Trash2,
  Save,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO } from 'date-fns';

interface Setor {
  id: string;
  nome: string;
}

interface ItemProducao {
  id: string;
  receita_id: string;
  ordem_id: string;
  setor_producao_id: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  receitas: {
    nome: string;
  };
  producao_ordens: {
    codigo: string;
    titulo: string | null;
    status: string;
  };
}

interface RequisicaoItem {
  id: string;
  ingrediente_id: string;
  grupo_estoque_id: string | null;
  qtd_necessaria_g: number;
  qtd_separada_g: number;
  ingredientes: {
    nome: string;
  } | null;
  ingredientes_grupos: {
    nome: string;
  } | null;
}

export default function ProducaoDashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [itensPorSetor, setItensPorSetor] = useState<Record<string, ItemProducao[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (unidadeId) {
      fetchData();
    }
  }, [unidadeId]);

  async function fetchData() {
    if (!unidadeId || !activeClientId) return;
    setLoading(true);
    setError('');
    try {
      const { data: setoresData, error: setoresErr } = await supabase
        .from('cliente_setores_producao')
        .select('id, nome')
        .eq('cliente_id', activeClientId)
        .eq('ativo', true)
        .order('nome');

      if (setoresErr) throw setoresErr;
      setSetores(setoresData || []);

      const { data: itensData, error: itensErr } = await supabase
        .from('producao_ordens_itens')
        .select(`
          id,
          receita_id,
          ordem_id,
          setor_producao_id,
          quantidade_planejada,
          quantidade_produzida,
          receitas ( nome ),
          producao_ordens ( id, codigo, titulo, status )
        `)
        .in('producao_ordens.status', ['PLANEJADA', 'SEPARADA', 'EM_PRODUCAO'])
        .eq('producao_ordens.unidade_id', unidadeId);

      if (itensErr) throw itensErr;

      const validItens = (itensData as any[]).filter(i => i.producao_ordens);

      const agroupped: Record<string, ItemProducao[]> = {};
      validItens.forEach(item => {
        const setorId = item.setor_producao_id || 'unassigned';
        if (!agroupped[setorId]) agroupped[setorId] = [];
        agroupped[setorId].push(item);
      });

      setItensPorSetor(agroupped);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados de produção.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
          Controle de Produção Executiva
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selecione um setor para iniciar ou acompanhar a produção.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {setores.map((setor) => {
          const itens = itensPorSetor[setor.id] || [];
          const totalPlanejado = itens.reduce((acc, i) => acc + i.quantidade_planejada, 0);
          const totalProduzido = itens.reduce((acc, i) => acc + i.quantidade_produzida, 0);
          const completion = totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 : 0;
          const itensConcluidos = itens.filter(i => i.quantidade_produzida >= i.quantidade_planejada).length;

          return (
            <Grid item xs={12} md={6} lg={4} key={setor.id}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 4, 
                  transition: 'all 0.2s',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 24px ' + alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-4px)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => router.push(`/producao/setor/${setor.id}`)}
              >
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <ChefHat size={28} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">{setor.nome}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock size={12} /> Atualizado agora
                    </Typography>
                  </Box>
                </Box>
                
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'baseline' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">PRODUÇÃO GERAL</Typography>
                      <Typography variant="h6" fontWeight="800" color="primary.main">{Math.round(completion)}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={completion} 
                      sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.divider, 0.5) }} 
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1) }}>
                        <Typography variant="caption" color="success.main" fontWeight="bold">CONCLUÍDOS</Typography>
                        <Typography variant="h5" fontWeight="800">{itensConcluidos}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.1) }}>
                        <Typography variant="caption" color="warning.main" fontWeight="bold">PENDENTES</Typography>
                        <Typography variant="h5" fontWeight="800">{itens.length - itensConcluidos}</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Button 
                    variant="contained" 
                    fullWidth 
                    endIcon={<ArrowRight size={18} />}
                    sx={{ mt: 3, borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                  >
                    ACESSAR SETOR
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        
        {itensPorSetor['unassigned']?.length > 0 && (
          <Grid item xs={12} md={6} lg={4}>
            <Card 
              elevation={0} 
              sx={{ 
                border: '1px dashed', 
                borderColor: 'warning.main', 
                borderRadius: 4, 
                bgcolor: alpha(theme.palette.warning.main, 0.02),
                '&:hover': { cursor: 'pointer', bgcolor: alpha(theme.palette.warning.main, 0.05) }
              }}
              onClick={() => router.push(`/producao/setor/unassigned`)}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Layers size={48} color={theme.palette.warning.main} style={{ marginBottom: 16 }} />
                <Typography variant="h6" fontWeight="bold">Sem Setor Definido</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Existem {itensPorSetor['unassigned'].length} itens sem setor atribuído.
                </Typography>
                <Button variant="outlined" color="warning" fullWidth>Ver Itens Pendentes</Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
