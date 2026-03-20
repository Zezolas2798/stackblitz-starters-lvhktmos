'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Tooltip, CircularProgress, InputAdornment, TextField,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, Alert
} from '@mui/material';
import { Plus, Edit, Search, CheckCircle, AlertTriangle, HelpCircle, Truck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function FornecedoresPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (activeClientId) {
      fetchFornecedores();
    }
  }, [activeClientId]);

  const fetchFornecedores = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', activeClientId)
      .is('deleted_at', null)
      .order('razao_social', { ascending: true });

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } else {
      setFornecedores(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedFornecedor) return;
    try {
      setDeleting(true);
      const { error } = await (supabase as any)
        .from('fornecedores')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', selectedFornecedor.id);

      if (error) throw error;

      setSnackbar({ open: true, message: 'Fornecedor excluído com sucesso!', severity: 'success' });
      fetchFornecedores();
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao excluir fornecedor: ' + err.message, severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedFornecedor(null);
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.razao_social?.toLowerCase().includes(busca.toLowerCase()) ||
    f.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
    f.cnpj?.includes(busca)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO': return 'success';
      case 'PENDENTE': return 'warning';
      case 'REJEITADO': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle size={14} />;
      case 'PENDENTE': return <AlertTriangle size={14} />;
      case 'REJEITADO': return <AlertTriangle size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Truck size={32} />
            Fornecedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão de fornecedores e controle de homologação.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Plus />}
            onClick={() => router.push('/fornecedores/novo')}
            sx={{ fontWeight: 'bold', boxShadow: 3 }}
          >
            Novo Fornecedor
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
          }}
        />
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : filteredFornecedores.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Truck size={48} color="#ccc" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary">Nenhum fornecedor encontrado.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Razão Social / Nome Fantasia</TableCell>
                  <TableCell>CNPJ</TableCell>
                  <TableCell>Status Homologação</TableCell>
                  <TableCell>Val. Licença Sanitária</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFornecedores.map((forn) => (
                  <TableRow key={forn.id} hover>
                    <TableCell>
                      <Typography fontWeight="bold" variant="body2">{forn.razao_social}</Typography>
                      {forn.nome_fantasia && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {forn.nome_fantasia}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{forn.cnpj || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={forn.status_homologacao || 'PENDENTE'}
                        size="small"
                        color={getStatusColor(forn.status_homologacao || 'PENDENTE')}
                        icon={getStatusIcon(forn.status_homologacao || 'PENDENTE')}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {forn.licenca_sanitaria_validade ? format(new Date(forn.licenca_sanitaria_validade), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Editar / Homologação">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => router.push(`/fornecedores/${forn.id}`)}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir Fornecedor">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              setSelectedFornecedor(forn);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Diálogo de Exclusão ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o fornecedor <strong>{selectedFornecedor?.razao_social}</strong>? 
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained" 
            autoFocus
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Sim, Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar de feedback ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
