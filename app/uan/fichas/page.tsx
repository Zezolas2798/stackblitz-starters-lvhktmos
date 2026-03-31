'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { FichaTecnicaUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, InputAdornment, TextField
} from '@mui/material';
import { Plus, Edit, Trash2, Search, ArrowLeft, Loader2 } from 'lucide-react';

export default function FichasUANPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [fichas, setFichas] = useState<FichaTecnicaUAN[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchFichas() {
      if (!activeClientId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('fichas_tecnicas_uan')
        .select('*')
        .eq('cliente_id', activeClientId)
        .order('nome');

      if (!error && data) {
        setFichas(data as unknown as FichaTecnicaUAN[]);
      }
      setLoading(false);
    }
    fetchFichas();
  }, [activeClientId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta Ficha Técnica (FTP)?')) return;
    const { error } = await supabase.from('fichas_tecnicas_uan').delete().eq('id', id);
    if (!error) {
      setFichas(prev => prev.filter(f => f.id !== id));
    } else {
      alert('Erro ao excluir: A ficha pode estar atrelada a um cardápio.');
    }
  };

  const filteredFichas = fichas.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan')}>Painel</Button>
        <Typography variant="h5" fontWeight="bold" flexGrow={1}>
          Fichas Técnicas (UAN)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => router.push('/uan/fichas/nova')}
        >
          Nova Ficha Técnica
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar preparação..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><Loader2 className="animate-spin" /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Nome da Preparação</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="center">Rendimento</TableCell>
                <TableCell align="center">Tempo (min)</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFichas.length > 0 ? (
                filteredFichas.map(ficha => (
                  <TableRow key={ficha.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{ficha.nome}</TableCell>
                    <TableCell>
                      <Chip label={ficha.categoria_uan} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{ficha.rendimento_porcoes} porções</Typography>
                      <Typography variant="caption" color="text.secondary">({ficha.peso_porcao_g}g cada)</Typography>
                    </TableCell>
                    <TableCell align="center">{ficha.tempo_preparo_min || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => router.push(`/uan/fichas/${ficha.id}`)}>
                        <Edit size={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(ficha.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    Nenhuma ficha encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
