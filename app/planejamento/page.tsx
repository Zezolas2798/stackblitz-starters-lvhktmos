'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  CircularProgress, Alert, Container, useTheme, alpha 
} from '@mui/material';
import { Factory, Plus, Eye, Calendar, PackageCheck, AlertCircle, ChefHat, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, parseISO, isAfter, differenceInCalendarDays } from 'date-fns';

interface producao_ordens_itens {
  quantidade_planejada: number;
  receitas: {
    nome: string;
  };
}

interface OrdemProducaoListagem {
  id: string;
  codigo: string;
  titulo: string | null;
  data_prevista: string | null;
  status: string;
  created_at: string;
  producao_ordens_itens: producao_ordens_itens[];
}

export default function PlanejamentoListPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  const [ordens, setOrdens] = useState<OrdemProducaoListagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (unidadeId) {
      loadProducao();
    }
  }, [unidadeId]);

  async function loadProducao() {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await (supabase as any).from('producao_ordens')
        .select(`
          id,
          codigo,
          titulo,
          data_prevista,
          status,
          created_at,
          producao_ordens_itens (
            quantidade_planejada,
            receitas ( nome )
          )
        `)
        .eq('unidade_id', unidadeId)
        .neq('status', 'CANCELADA')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrdens(data as unknown as OrdemProducaoListagem[]);
    } catch (err: any) {
      console.error('Erro ao carregar ordens:', err);
      setError('Não foi possível carregar as ordens de produção.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'PLANEJADA':
        return <Chip label="Planejada" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 'bold' }} />;
      case 'SEPARADA':
        return <Chip label="Separada" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', fontWeight: 'bold' }} />;
      case 'EM_PRODUCAO':
        return <Chip label="Em Produção" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', fontWeight: 'bold' }} />;
      case 'CONCLUIDA':
        return <Chip label="Concluída" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 'bold' }} />;
      case 'CANCELADA':
        return <Chip label="Cancelada" size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontWeight: 'bold' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Planejamento de Produção
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie ordens de produção, requisições e rastreabilidade (RDC 216).
          </Typography>
        </Box>
        
        <Link href="/planejamento/nova" passHref style={{ textDecoration: 'none' }}>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<Plus size={20} />}
            sx={{ px: 3, fontWeight: 'bold' }}
          >
            Nova Produção
          </Button>
        </Link>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Tabela de Registros */}
      <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Carregando registros...</Typography>
          </Box>
        ) : ordens.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <PackageCheck size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary">Nenhuma produção registrada.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Clique em &quot;Nova Produção&quot; para registrar seu primeiro lote e baixar o estoque automaticamente.
            </Typography>
            <Link href="/planejamento/nova" passHref style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<Plus size={18} />}>Registrar Primeiro Lote</Button>
            </Link>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>DATA DE CRIAÇÃO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>ORDEM</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>MÚLTIPLOS ITENS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>VOL. PLANEJADO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>PREVISÃO</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordens.map((ordem) => (
                  <TableRow key={ordem.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Clock size={16} />
                        <Typography variant="body2">{format(parseISO(ordem.created_at), 'dd/MM/yyyy HH:mm')}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {ordem.titulo || ordem.codigo}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {ordem.codigo}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {ordem.producao_ordens_itens?.slice(0, 2).map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChefHat size={14} color={theme.palette.primary.main} />
                            <Typography variant="body2" color="text.primary">
                              {item.receitas?.nome}
                            </Typography>
                          </Box>
                        ))}
                        {ordem.producao_ordens_itens?.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            + {ordem.producao_ordens_itens.length - 2} outros itens...
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {ordem.producao_ordens_itens?.reduce((acc, item) => acc + Number(item.quantidade_planejada), 0)} un/kg
                      </Typography>
                    </TableCell>
                    <TableCell>
                        {getStatusChip(ordem.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {ordem.data_prevista ? format(parseISO(ordem.data_prevista), 'dd/MM/yyyy') : '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Link href={`/planejamento/${ordem.id}`} passHref>
                        <Tooltip title="Ver Detalhes">
                          <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                            <Eye size={20} />
                          </IconButton>
                        </Tooltip>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
