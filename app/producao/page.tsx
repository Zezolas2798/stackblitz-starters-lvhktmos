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

// Definindo a interface localmente para garantir tipagem mesmo se o types.ts não tiver atualizado
interface OrdemProducaoListagem {
  id: string;
  codigo_lote_produto: string;
  data_producao: string;
  data_validade: string;
  quantidade_produzida: number;
  unidade_medida: string;
  status: string;
  receitas: {
    nome: string;
  };
}

export default function ProducaoListPage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  const [ordens, setOrdens] = useState<OrdemProducaoListagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeClientId) {
      loadProducao();
    }
  }, [activeClientId]);

  async function loadProducao() {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('ordens_producao')
        .select(`
          id,
          codigo_lote_produto,
          data_producao,
          data_validade,
          quantidade_produzida,
          unidade_medida,
          status,
          receitas ( nome )
        `)
        .eq('cliente_id', activeClientId)
        .order('data_producao', { ascending: false }); // Mais recentes primeiro

      if (error) throw error;

      setOrdens(data as unknown as OrdemProducaoListagem[]);
    } catch (err: any) {
      console.error('Erro ao carregar produção:', err);
      setError('Não foi possível carregar o histórico de produção.');
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para status visual da validade
  const getStatusValidade = (dataValidade: string) => {
    const hoje = new Date();
    const dataVal = parseISO(dataValidade);
    const diasRestantes = differenceInCalendarDays(dataVal, hoje);
    const vencido = diasRestantes < 0;

    if (vencido) {
      return (
        <Chip 
            label={`Vencido há ${Math.abs(diasRestantes)} dias`} 
            size="small" 
            sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontWeight: 'bold', border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }} 
        />
      );
    }
    if (diasRestantes <= 3) {
        return (
            <Chip 
                label={`Vence em ${diasRestantes} dias`} 
                size="small" 
                sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', fontWeight: 'bold', border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }} 
            />
        );
    }
    return (
        <Chip 
            label="Válido" 
            size="small" 
            sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 'bold', border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }} 
        />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* Cabeçalho da Página */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Histórico de Produção
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registro de lotes produzidos e rastreabilidade (RDC 216).
          </Typography>
        </Box>
        
        <Link href="/producao/nova" passHref style={{ textDecoration: 'none' }}>
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
              Clique em "Nova Produção" para registrar seu primeiro lote e baixar o estoque automaticamente.
            </Typography>
            <Link href="/producao/nova" passHref style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<Plus size={18} />}>Registrar Primeiro Lote</Button>
            </Link>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>DATA / HORA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>LOTE (RASTREABILIDADE)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>PRODUTO FINAL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>QUANTIDADE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>VALIDADE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordens.map((ordem) => (
                  <TableRow key={ordem.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Clock size={16} />
                        <Typography variant="body2">{format(parseISO(ordem.data_producao), 'dd/MM/yyyy HH:mm')}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ordem.codigo_lote_produto} 
                        size="small" 
                        sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold', 
                            bgcolor: 'grey.100', 
                            color: 'text.primary',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChefHat size={18} color={theme.palette.primary.main} />
                          <Typography fontWeight={600} color="text.primary">
                            {ordem.receitas?.nome || <span style={{ color: 'red', fontStyle: 'italic' }}>Receita Excluída</span>}
                          </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                          {ordem.quantidade_produzida} <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 400 }}>{ordem.unidade_medida}</span>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{format(parseISO(ordem.data_validade), 'dd/MM/yyyy')}</Typography>
                        {getStatusValidade(ordem.data_validade)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalhes (Em breve)">
                        <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                          <Eye size={20} />
                        </IconButton>
                      </Tooltip>
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