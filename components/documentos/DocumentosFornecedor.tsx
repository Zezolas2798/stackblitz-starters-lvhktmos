'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, isBefore } from 'date-fns';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Tooltip, Menu, MenuItem
} from '@mui/material';
import {
  FileText, AlertTriangle, CheckCircle, Upload,
  MoreVertical, Download, Trash2, Edit
} from 'lucide-react';

interface Arquivo {
  id: string;
  nome_arquivo: string;
  data_emissao: string | null;
  data_validade: string | null;
  url_storage: string | null;
  pasta_id: string;
  entidade_id?: string | null;
}

interface CategoriaConfig {
  nome: string;
  ged_pasta_id?: string;
  documentos_obrigatorios: any[];
}

interface Props {
  pastaId: string;
  categoriasSelecionadas: string[];
  razaoSocial?: string;
  entidadeId?: string;
}

export default function DocumentosFornecedor({ pastaId, categoriasSelecionadas, razaoSocial, entidadeId }: Props) {
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(true);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [docsObrigatorios, setDocsObrigatorios] = useState<string[]>([]);
  const [categoriasConfig, setCategoriasConfig] = useState<CategoriaConfig[]>([]);
  
  // Estados de Upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docNome, setDocNome] = useState('');
  const [docEmissao, setDocEmissao] = useState('');
  const [docValidade, setDocValidade] = useState('');

  // Estados de Menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFile, setActiveFile] = useState<Arquivo | null>(null);

  // Estados de Edição
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (pastaId) {
      fetchArquivos();
    }
  }, [pastaId, categoriasConfig]);

  useEffect(() => {
    if (categoriasSelecionadas && categoriasSelecionadas.length > 0) {
      fetchDocsObrigatorios();
    } else {
      setDocsObrigatorios([]);
    }
  }, [categoriasSelecionadas]);

  const fetchDocsObrigatorios = async () => {
    const { data } = await (supabase as any)
      .from('categorias_config')
      .select('nome, ged_pasta_id, documentos_obrigatorios')
      .in('nome', categoriasSelecionadas)
      .eq('cliente_id', activeClientId)
      .is('deleted_at', null);
    
    if (data) {
      setCategoriasConfig(data);
      const todos = data.flatMap((d: any) => 
        (d.documentos_obrigatorios || []).map((doc: any) => typeof doc === 'string' ? doc : doc.nome)
      );
      setDocsObrigatorios(Array.from(new Set(todos)));
    }
  };

  const fetchArquivos = async () => {
    setLoading(true);
    // 1. Coleta todas as pastas onde o documento pode estar
    const idsDePasta = new Set<string>();
    if (pastaId) idsDePasta.add(pastaId);
    
    categoriasConfig.forEach(c => {
      // Adiciona pasta da categoria
      if (c.ged_pasta_id) idsDePasta.add(c.ged_pasta_id);
      
      // Adiciona pastas específicas de cada documento configurado
      if (c.documentos_obrigatorios && Array.isArray(c.documentos_obrigatorios)) {
        c.documentos_obrigatorios.forEach((doc: any) => {
          if (typeof doc === 'object' && doc.ged_pasta_id) {
            idsDePasta.add(doc.ged_pasta_id);
          }
        });
      }
    });

    let query = (supabase as any)
      .from('documentos_arquivos')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (entidadeId) {
      // Se temos entidadeId, buscamos pelo ID DIRETO ou pela pasta (fallback legados)
      query = query.or(`entidade_id.eq.${entidadeId},pasta_id.in.(${Array.from(idsDePasta).map(id => `"${id}"`).join(',')})`);
    } else {
      query = query.in('pasta_id', Array.from(idsDePasta));
    }

    const { data, error } = await query;

    if (!error && data) {
      // Filtrar por prefixo da empresa apenas para registros que NÃO tem entidadeId
      // ou se razaoSocial for fornecido (mantendo compatibilidade com legados sem ID)
      if (razaoSocial) {
        const prefix = `[${razaoSocial}]`.toLowerCase();
        setArquivos(data.filter((a: any) => 
          a.entidade_id === entidadeId || 
          a.nome_arquivo.toLowerCase().startsWith(prefix) ||
          a.nome_arquivo.toLowerCase().includes(prefix)
        ));
      } else {
        setArquivos(data);
      }
    }
    setLoading(false);
  };

  const checkVencido = (validade: string | null) => {
    if (!validade) return false;
    return isBefore(new Date(validade), new Date());
  };

  // UPLOAD
  const handleOpenUpload = () => {
    setFileToUpload(null);
    setDocNome('');
    setDocEmissao('');
    setDocValidade('');
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!fileToUpload || !pastaId) return;

    try {
      setIsUploading(true);
      const fileExt = fileToUpload.name.split('.').pop();
      const fileNameUnico = `${activeClientId}/${pastaId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('ged_documentos')
        .upload(fileNameUnico, fileToUpload);

      if (uploadError) throw uploadError;

      const finalNome = razaoSocial 
        ? (docNome.startsWith(`[${razaoSocial}]`) ? docNome : `[${razaoSocial}] ${docNome}`)
        : docNome || fileToUpload.name;

      if (activeFile && !activeFile.url_storage) {
        // ATUALIZAR PLACEHOLDER EXISTENTE
        const { error: updateError } = await (supabase as any).from('documentos_arquivos').update({
          nome_arquivo: finalNome,
          data_emissao: docEmissao || null,
          data_validade: docValidade || null,
          url_storage: uploadData!.path,
          created_at: new Date().toISOString()
        }).eq('id', activeFile.id);

        if (updateError) {
          await supabase.storage.from('ged_documentos').remove([uploadData.path]);
          throw updateError;
        }
      } else {
        // INSERIR NOVO REGISTRO
        const { error: insertError } = await (supabase as any)
          .from('documentos_arquivos')
          .insert({
            pasta_id: pastaId,
            entidade_id: entidadeId || null,
            nome_arquivo: finalNome,
            data_emissao: docEmissao || null,
            data_validade: docValidade || null,
            url_storage: uploadData!.path
          });

        if (insertError) {
          await supabase.storage.from('ged_documentos').remove([uploadData!.path]);
          throw insertError;
        }
      }

      setUploadDialogOpen(false);
      fetchArquivos();
      setActiveFile(null); // Limpa seleção após upload
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar documento: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ACTIONS
  const handleDownload = async () => {
    if (!activeFile?.url_storage) return;
    try {
      const { data, error } = await supabase.storage
        .from('ged_documentos')
        .download(activeFile.url_storage);

      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', activeFile.nome_arquivo);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar documento.');
    } finally {
      setMenuAnchorEl(null);
    }
  };

  const handleDelete = async () => {
    if (!activeFile) return;
    if (!window.confirm(`Deseja mesmo excluir o documento "${activeFile.nome_arquivo}"?`)) {
      setMenuAnchorEl(null);
      return;
    }

    try {
      await (supabase as any).from('documentos_arquivos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', activeFile.id);
      fetchArquivos();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir documento.');
    } finally {
      setMenuAnchorEl(null);
    }
  };

  const handleOpenEdit = () => {
    if (activeFile) {
      setDocNome(activeFile.nome_arquivo);
      setDocEmissao(activeFile.data_emissao ? new Date(activeFile.data_emissao).toISOString().split('T')[0] : '');
      setDocValidade(activeFile.data_validade ? new Date(activeFile.data_validade).toISOString().split('T')[0] : '');
      setEditDialogOpen(true);
      setMenuAnchorEl(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!activeFile || !docNome.trim()) return;
    try {
      await (supabase as any).from('documentos_arquivos').update({
        nome_arquivo: docNome,
        data_emissao: docEmissao || null,
        data_validade: docValidade || null
      }).eq('id', activeFile.id);
      
      setEditDialogOpen(false);
      fetchArquivos();
    } catch (err) {
      console.error(err);
      alert('Erro ao editar.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Documentos Anexos</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={() => window.open(`/documentos?folderId=${pastaId}`, '_blank')}
          >
            Ver no GED
          </Button>
          <Button variant="contained" startIcon={<Upload size={18} />} onClick={handleOpenUpload}>
            Anexar Documento
          </Button>
        </Box>
      </Box>

      {docsObrigatorios.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={16} color="#ed6c02" />
            Checklist de Documentos Exigidos por Categoria
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {docsObrigatorios.map((doc) => {
              const searchDoc = razaoSocial ? `[${razaoSocial}] ${doc}`.toLowerCase() : doc.toLowerCase();
              const anexado = arquivos.some(a => 
                (a.entidade_id === entidadeId && a.nome_arquivo.toLowerCase().includes(doc.toLowerCase())) ||
                a.nome_arquivo.toLowerCase().includes(searchDoc) || 
                (razaoSocial && a.nome_arquivo.toLowerCase().includes(doc.toLowerCase()))
              );

              const handleChipClick = () => {
                const placeholder = arquivos.find(a => 
                  !a.url_storage && (
                    (a.entidade_id === entidadeId && a.nome_arquivo.toLowerCase().includes(doc.toLowerCase())) ||
                    a.nome_arquivo.toLowerCase().includes(searchDoc) || 
                    (razaoSocial && a.nome_arquivo.toLowerCase().includes(doc.toLowerCase()))
                  )
                );
                
                setDocNome(doc);
                if (placeholder) {
                  setActiveFile(placeholder);
                } else {
                  setActiveFile(null);
                }
                setUploadDialogOpen(true);
              };

              return (
                <Chip
                  key={doc}
                  label={doc}
                  size="small"
                  color={anexado ? 'success' : 'warning'}
                  variant={anexado ? 'filled' : 'outlined'}
                  icon={anexado ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  onClick={handleChipClick}
                  sx={{ 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 } 
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell>Nome do Arquivo</TableCell>
              <TableCell>Data Emissão</TableCell>
              <TableCell>Validade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : arquivos.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Nenhum documento anexado.</TableCell></TableRow>
            ) : (
              arquivos.map((arq) => {
                const vencido = checkVencido(arq.data_validade);
                return (
                  <TableRow key={arq.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={16} color={arq.url_storage ? "primary.main" : "gray"} />
                        <Typography variant="body2" fontWeight={arq.url_storage ? "600" : "400"} color={arq.url_storage ? "text.primary" : "text.secondary"}>
                          {arq.nome_arquivo}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{arq.data_emissao ? format(new Date(arq.data_emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{arq.data_validade ? format(new Date(arq.data_validade), 'dd/MM/yyyy') : 'Sem Vencimento'}</TableCell>
                    <TableCell>
                      {!arq.url_storage ? (
                        <Chip 
                          label="Anexar" 
                          size="small" 
                          color="warning" 
                          variant="filled" 
                          onClick={() => {
                            setActiveFile(arq);
                            setDocNome(arq.nome_arquivo);
                            setUploadDialogOpen(true);
                          }}
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                          icon={<Upload size={14} />}
                        />
                      ) : (
                        <Chip
                          label={vencido ? 'Vencido' : 'Vigente'}
                          color={vencido ? 'error' : 'success'}
                          size="small"
                          icon={vencido ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { setActiveFile(arq); setMenuAnchorEl(e.currentTarget); }}>
                        <MoreVertical size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Meus de Ação do Arquivo */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
        {activeFile?.url_storage ? (
          <MenuItem onClick={handleDownload}><Download size={16} className="mr-2" /> Baixar</MenuItem>
        ) : (
          <MenuItem onClick={() => { setUploadDialogOpen(true); setMenuAnchorEl(null); }}><Upload size={16} className="mr-2" /> Anexar Arquivo</MenuItem>
        )}
        <MenuItem onClick={handleOpenEdit}><Edit size={16} className="mr-2" /> Editar Dados</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><Trash2 size={16} className="mr-2" /> Excluir</MenuItem>
      </Menu>

      {/* Modal de Upload */}
      <Dialog open={uploadDialogOpen} onClose={() => !isUploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anexar Novo Documento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button variant="outlined" component="label" fullWidth sx={{ py: 3, borderStyle: 'dashed' }}>
              {fileToUpload ? fileToUpload.name : 'Clique para selecionar o PDF/Imagem'}
              <input type="file" hidden onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} />
            </Button>
            <TextField label="Nome/Título do Documento *" size="small" fullWidth value={docNome} onChange={e => setDocNome(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Data de Emissão (Opcional)" type="date" size="small" fullWidth value={docEmissao} onChange={e => setDocEmissao(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Data de Validade (Controlada)" type="date" size="small" fullWidth value={docValidade} onChange={e => setDocValidade(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
          <Button onClick={handleUpload} variant="contained" disabled={!fileToUpload || !docNome.trim() || isUploading}>
            {isUploading ? <CircularProgress size={24} /> : 'Enviar Documento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Documento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome/Título do Documento *" size="small" fullWidth value={docNome} onChange={e => setDocNome(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Data de Emissão (Opcional)" type="date" size="small" fullWidth value={docEmissao} onChange={e => setDocEmissao(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Data de Validade (Controlada)" type="date" size="small" fullWidth value={docValidade} onChange={e => setDocValidade(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={!docNome.trim()}>Salvar Alterações</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
