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
  Snackbar, Alert, Tabs, Tab, Divider
} from '@mui/material';
import {
  Search, Plus, Filter, Edit, Trash2,
  Settings
} from 'lucide-react';
import {
  CheckCircle,
  Engineering
} from '@mui/icons-material';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { format } from 'date-fns';
import PreCadastroFornecedorDialog from '@/components/PreCadastroFornecedorDialog';

export default function ServicosPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODOS');
  const [preCadastroOpen, setPreCadastroOpen] = useState(false);
  const [categoriasConfig, setCategoriasConfig] = useState<any[]>([]);

  // Categorias de Serviços dinâmicas
  const CATEGORIAS = ['TODOS', ...categoriasConfig.map(c => c.nome)];

  useEffect(() => {
    if (activeClientId) {
      fetchServicos();
      fetchCategorias();
    }
  }, [activeClientId]);

  const fetchCategorias = async () => {
    const { data } = await (supabase as any)
      .from('categorias_config')
      .select('nome')
      .eq('cliente_id', activeClientId)
      .eq('tipo', 'SERVICO')
      .is('deleted_at', null)
      .order('nome', { ascending: true });
    setCategoriasConfig(data || []);
  };

  const fetchServicos = async () => {
    const { data, error } = await (supabase as any)
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', activeClientId)
      .is('deleted_at', null)
      .order('razao_social', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
    } else {
      // Filtrar em JS para robustez
      const filtered = (data || []).filter((f: any) => f.tipo === 'SERVICO');
      setServicos(filtered);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedServico) return;
    try {
      setDeleting(true);
      const { error } = await (supabase as any)
        .from('fornecedores')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', selectedServico.id);

      if (error) throw error;

      setSnackbar({ open: true, message: 'Serviço excluído com sucesso!', severity: 'success' });
      fetchServicos();
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erro ao excluir serviço: ' + err.message, severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedServico(null);
    }
  };

  const filteredServicos = servicos.filter(f => {
    const matchBusca = f.razao_social?.toLowerCase().includes(busca.toLowerCase()) ||
                      f.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
                      f.cnpj?.includes(busca);
    
    const matchCategoria = categoriaFiltro === 'TODOS' || 
                          (f.categorias_compras && f.categorias_compras.includes(categoriaFiltro));
    
    return matchBusca && matchCategoria;
  });

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
      case 'APROVADO': return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'PENDENTE': return <WarningIcon sx={{ fontSize: 14 }} />;
      case 'REJEITADO': return <WarningIcon sx={{ fontSize: 14 }} />;
      default: return <HelpOutlineIcon sx={{ fontSize: 14 }} />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Engineering sx={{ fontSize: 32 }} />
            Prestadores de Serviços
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão de empresas de serviços e controle de documentação técnica.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Settings />}
            onClick={() => router.push('/config/categorias?tipo=SERVICO')}
            sx={{ fontWeight: 'bold' }}
          >
            Configurar Categorias
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Search />}
            onClick={() => setPreCadastroOpen(true)}
            sx={{ fontWeight: 'bold' }}
          >
            Pré-cadastro (CNPJ)
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Plus />}
            onClick={() => router.push('/fornecedores/novo?tipo=SERVICO')}
            sx={{ fontWeight: 'bold', boxShadow: 3 }}
          >
            Novo Prestador
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
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
        </Box>
        <Divider />
        <Tabs 
          value={categoriaFiltro} 
          onChange={(_, v) => setCategoriaFiltro(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, minHeight: 48 }}
        >
          {CATEGORIAS.map(cat => (
            <Tab 
              key={cat} 
              value={cat} 
              label={cat === 'TODOS' ? 'Todos' : cat} 
              sx={{ fontWeight: 'bold', fontSize: '0.75rem' }} 
            />
          ))}
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : filteredServicos.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Engineering sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Nenhum prestador encontrado.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Razão Social / Nome Fantasia</TableCell>
                  <TableCell>CNPJ</TableCell>
                  <TableCell>Status Homologação</TableCell>
                  <TableCell>Próxima Visita / Validade</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServicos.map((serv) => (
                  <TableRow key={serv.id} hover>
                    <TableCell>
                      <Typography fontWeight="bold" variant="body2">{serv.razao_social}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {serv.nome_fantasia && (
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, display: 'inline-block' }}>
                            {serv.nome_fantasia}
                          </Typography>
                        )}
                        {serv.categorias_compras?.map((cat: string) => (
                          <Chip 
                            key={cat} 
                            label={cat} 
                            size="small" 
                            variant="outlined" 
                            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 'bold' }} 
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{serv.cnpj || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={serv.status_homologacao || 'PENDENTE'}
                        size="small"
                        color={getStatusColor(serv.status_homologacao || 'PENDENTE')}
                        icon={getStatusIcon(serv.status_homologacao || 'PENDENTE')}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {serv.licenca_sanitaria_validade ? format(new Date(serv.licenca_sanitaria_validade), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Editar / Documentos">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => router.push(`/fornecedores/${serv.id}`)}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Excluir Prestador">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              setSelectedServico(serv);
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
            Tem certeza que deseja excluir o prestador <strong>{selectedServico?.razao_social}</strong>? 
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

      <PreCadastroFornecedorDialog
        open={preCadastroOpen}
        onClose={() => setPreCadastroOpen(false)}
        tipo="SERVICO"
        onSuccess={(novo) => {
          setServicos(prev => [novo, ...prev]);
          router.push(`/fornecedores/${novo.id}`);
        }}
        defaultModalidade={categoriaFiltro !== 'TODOS' ? categoriaFiltro : undefined}
      />
    </Container>
  );
}
