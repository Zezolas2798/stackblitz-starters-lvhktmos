'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Stack, Alert, Snackbar, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Plus, Settings, LayoutGrid, FileText, ChevronRight, ChevronDown,
  Trash2, Edit, Save, X, FolderSearch
} from 'lucide-react';
import { Category } from '@mui/icons-material';

const MODALIDADES_COMPRAS = [
  'ALIMENTOS', 'EMBALAGENS', 'LIMPEZA', 'MANUTENCAO', 'UTENSILIOS', 'EPI_EPC', 'UNIFORMES', 'PRIMEIROS_SOCORROS'
];

export default function ConfigCategoriasPage() {
  const { activeClientId } = useClient();

  return (
    <Suspense fallback={<Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>}>
      <ConfigCategoriasContent activeClientId={activeClientId} />
    </Suspense>
  );
}

function ConfigCategoriasContent({ activeClientId }: { activeClientId: string | null }) {
  const searchParams = useSearchParams();
  const initialTipo = searchParams.get('tipo');

  const [loading, setLoading] = useState(true);
  const [tipoAbas, setTipoAbas] = useState(initialTipo === 'SERVICO' ? 1 : 0);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [pastasGed, setPastasGed] = useState<any[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [nomeCat, setNomeCat] = useState('');
  const [docsList, setDocsList] = useState<{nome: string, ged_pasta_id: string | null}[]>([]);
  const [newDoc, setNewDoc] = useState('');
  const [newDocPastaId, setNewDocPastaId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const currentTipo = tipoAbas === 0 ? 'FORNECEDOR' : 'SERVICO';

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [folderSearch, setFolderSearch] = useState('');

  const formatFoldersHierarchically = (folders: any[], parentId: string | null = null, indent = '', currentPath = ''): any[] => {
    const list: any[] = [];
    const children = folders.filter(f => f.parent_id === parentId);
    
    children.sort((a, b) => a.nome.localeCompare(b.nome, undefined, { numeric: true, sensitivity: 'base' }));

    for (const folder of children) {
      const isCollapsed = collapsedIds.has(folder.id);
      const hasChildren = folders.some(f => f.parent_id === folder.id);
      const fullPath = currentPath ? `${currentPath} > ${folder.nome}` : folder.nome;
      
      list.push({ 
        ...folder, 
        displayName: `${indent}${hasChildren ? (isCollapsed ? '▶ ' : '▼ ') : '  '}${folder.nome}`,
        fullPath,
        hasChildren,
        isCollapsed
      });

      if (!isCollapsed) {
        const descendants = formatFoldersHierarchically(folders, folder.id, `${indent}\u00A0\u00A0\u00A0\u00A0`, fullPath);
        list.push(...descendants);
      }
    }
    return list;
  };

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita fechar o Select
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemoveDoc = (docNome: string) => {
    setDocsList(docsList.filter((d) => d.nome !== docNome));
  };

  const handleUpdateDocPasta = (docNome: string, pastaId: string) => {
    setDocsList(docsList.map(d => d.nome === docNome ? { ...d, ged_pasta_id: pastaId || null } : d));
  };

  const fetchPastasGed = async () => {
    const { data } = await (supabase as any)
      .from('documentos_pastas')
      .select('id, nome, parent_id')
      .is('deleted_at', null);
    
    if (data) {
      const formatted = formatFoldersHierarchically(data);
      setPastasGed(formatted);
    }
  };

  useEffect(() => {
    if (activeClientId) {
      fetchCategorias();
      fetchPastasGed();
    }
  }, [activeClientId, currentTipo]);

  const fetchCategorias = async () => {
    if (!activeClientId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('categorias_config')
        .select('*')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null) // Keep this filter to only show non-deleted categories
        .order('nome');

      if (error) throw error;

      // Auto-seed para Fornecedores se estiver vazio ou incompleto
      if (currentTipo === 'FORNECEDOR' && data) {
        const existingNames = data.map((c: any) => c.nome);
        const missing = MODALIDADES_COMPRAS.filter(m => !existingNames.includes(m));

        if (missing.length > 0) {
          console.log('Seeding missing supplier categories:', missing);
          const toInsert = missing.map(m => ({
            cliente_id: activeClientId,
            tipo: 'FORNECEDOR',
            nome: m,
            documentos_obrigatorios: []
          }));

          const { error: insertError } = await (supabase as any)
            .from('categorias_config')
            .insert(toInsert);

          if (insertError) {
            console.error('Error seeding categories:', insertError);
            alert('Erro ao inicializar categorias padrão. Verifique sua conexão ou permissões.');
          } else {
            // Recarrega após o seed
            const { data: newData, error: fetchAgainError } = await (supabase as any)
              .from('categorias_config')
              .select('*')
              .eq('cliente_id', activeClientId)
              .is('deleted_at', null) // Keep this filter for re-fetch
              .order('nome');

            if (!fetchAgainError) {
              // Filter by currentTipo after fetching all
              setCategorias((newData as any[])?.filter((cat: any) => cat.tipo === currentTipo) || []);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Filter by currentTipo after fetching all
      setCategorias((data as any[])?.filter((cat: any) => cat.tipo === currentTipo) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Erro ao carregar categorias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cat: any = null) => {
    if (cat) {
      setEditingCat(cat);
      setNomeCat(cat.nome);
      setDocsList(cat.documentos_obrigatorios || []);
    } else {
      setEditingCat(null);
      setNomeCat('');
      setDocsList([]);
    }
    setDialogOpen(true);
  };

  const handleAddDoc = () => {
    if (!newDoc.trim()) {
      alert('Informe o nome do documento.'); return;
    }
    if (!newDocPastaId) {
      alert('Selecione uma pasta de destino para este documento.'); return;
    }
    if (docsList.some(d => d.nome === newDoc.trim())) {
      alert('Este documento já foi adicionado.'); return;
    }
    setDocsList([...docsList, { nome: newDoc.trim(), ged_pasta_id: newDocPastaId }]);
    setNewDoc('');
    setNewDocPastaId('');
  };

  const handleSubmit = async () => {
    if (!nomeCat.trim() || !activeClientId) return;
    
    // Validar se todos os documentos têm pasta
    const docsSemPasta = docsList.filter(d => !d.ged_pasta_id);
    if (docsSemPasta.length > 0) {
      alert(`Os seguintes documentos estão sem pasta definida: ${docsSemPasta.map(d => d.nome).join(', ')}. A seleção da pasta é obrigatória.`);
      return;
    }

    setSaving(true);

    const payload = {
      cliente_id: activeClientId,
      tipo: currentTipo,
      nome: nomeCat,
      documentos_obrigatorios: docsList
    };

    try {
      const { error } = await (supabase as any)
        .from('categorias_config')
        .upsert(editingCat?.id ? { ...payload, id: editingCat.id } : payload);

      if (error) throw error;
      setSnackbar({ open: true, message: 'Categoria salva com sucesso!', severity: 'success' });
      setDialogOpen(false);
      fetchCategorias();
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Erro ao salvar: ' + err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    try {
      const { error } = await (supabase as any)
        .from('categorias_config')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      fetchCategorias();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Category sx={{ fontSize: 32 }} />
            Configuração de Categorias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie quais documentos são obrigatórios para cada tipo de fornecedor ou serviço.
          </Typography>
        </Box>
        {tipoAbas === 1 && (
          <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenDialog()}>
            Nova Categoria
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tipoAbas} onChange={(_, v) => setTipoAbas(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Categorias de Fornecedores" />
          <Tab label="Categorias de Serviços" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Nome da Categoria</TableCell>
                  <TableCell>Documentos Exigidos</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categorias.map((cat) => (
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{cat.nome}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {cat.documentos_obrigatorios?.map((doc: any, idx: number) => (
                          <Chip key={idx} label={doc.nome || doc} size="small" variant="outlined" />
                        ))}
                        {(!cat.documentos_obrigatorios || cat.documentos_obrigatorios.length === 0) && (
                          <Typography variant="caption" color="text.secondary">Nenhum documento configurado</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(cat)}>
                        <Edit size={18} />
                      </IconButton>
                      {tipoAbas === 1 && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {categorias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      Nenhuma categoria cadastrada para este tipo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Diálogo de Categoria ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCat?.id ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Nome da Categoria"
              fullWidth
              value={nomeCat}
              onChange={(e) => setNomeCat(e.target.value)}
              placeholder="Ex: ALIMENTOS, CONTROLE DE PRAGAS..."
              autoFocus={tipoAbas === 1}
              disabled={tipoAbas === 0 && !!editingCat?.id}
              helperText={tipoAbas === 0 ? "O nome das categorias de fornecedores é fixo conforme o módulo de compras." : ""}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Documentos Obrigatórios</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Nome do documento"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Pasta Destino do Doc</InputLabel>
                    <Select
                      value={newDocPastaId}
                      label="Pasta Destino do Doc"
                      onChange={(e) => setNewDocPastaId(e.target.value)}
                      MenuProps={{ autoFocus: false, PaperProps: { sx: { maxHeight: 400 } } }}
                    >
                      <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                        <TextField 
                          size="small" fullWidth placeholder="Pesquisar pasta..." 
                          value={folderSearch} onChange={e => setFolderSearch(e.target.value)}
                          onKeyDown={e => e.stopPropagation()}
                        />
                      </Box>
                        <MenuItem value="" disabled><em>Selecione uma Pasta (Obrigatório)</em></MenuItem>
                      {pastasGed
                        .filter(p => !folderSearch || p.nome.toLowerCase().includes(folderSearch.toLowerCase()))
                        .map(p => (
                        <MenuItem 
                          key={p.id} 
                          value={p.id} 
                          sx={{ 
                            fontFamily: 'monospace', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5
                          }}
                        >
                        <Tooltip title={p.fullPath} placement="left">
                          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                            <pre style={{ margin: 0, pointerEvents: 'none' }}>{p.displayName}</pre>
                          </Box>
                        </Tooltip>
                          {p.hasChildren && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleCollapse(e, p.id);
                              }} 
                              onMouseDown={(e) => e.stopPropagation()}
                              sx={{ ml: 1, p: 0.5, zIndex: 2 }}
                            >
                              {p.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} 
                            </IconButton>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="outlined" onClick={handleAddDoc}>Adicionar</Button>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell>Documento</TableCell>
                        <TableCell>Pasta no GED</TableCell>
                        <TableCell align="right">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {docsList.map((doc, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{doc.nome}</TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={doc.ged_pasta_id || ''}
                              onChange={(e) => handleUpdateDocPasta(doc.nome, e.target.value)}
                              sx={{ fontSize: '0.8rem', minWidth: 150 }}
                              displayEmpty
                              MenuProps={{ autoFocus: false, PaperProps: { sx: { maxHeight: 400 } } }}
                            >
                              <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                                <TextField 
                                  size="small" fullWidth placeholder="Pesquisar pasta..." 
                                  value={folderSearch} onChange={e => setFolderSearch(e.target.value)}
                                  onKeyDown={e => e.stopPropagation()}
                                />
                              </Box>
                                <MenuItem value="" disabled><em>Selecione a Pasta</em></MenuItem>
                              {pastasGed
                                .filter(p => !folderSearch || p.nome.toLowerCase().includes(folderSearch.toLowerCase()))
                                .map(p => (
                                <MenuItem 
                                  key={p.id} 
                                  value={p.id} 
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.8rem', 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    py: 0.5
                                  }}
                                >
                                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                                    <pre style={{ margin: 0, pointerEvents: 'none' }}>{p.displayName}</pre>
                                  </Box>
                                  {p.hasChildren && (
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        toggleCollapse(e, p.id);
                                      }} 
                                      onMouseDown={(e) => e.stopPropagation()}
                                      sx={{ ml: 1, p: 0.5, zIndex: 2 }}
                                    >
                                      {p.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} 
                                    </IconButton>
                                  )}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveDoc(doc.nome)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {docsList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                            Nenhum documento adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving || !nomeCat.trim()}>
            {saving ? 'Salvando...' : 'Salvar Categoria'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
