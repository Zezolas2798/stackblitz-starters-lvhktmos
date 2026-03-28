'use client';

import React, { useState, useEffect, Suspense, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Container,
  Grid, List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Collapse, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tooltip, Breadcrumbs, Link, Skeleton, FormControlLabel, Checkbox, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Folder, InsertDriveFile, Warning, CheckCircle,
  UploadFile, CreateNewFolder, MoreVert, ExpandLess, ExpandMore,
  Add, Edit, Delete, ArrowBack, NavigateNext, Download, Link as LinkIcon, DriveFileMove, Visibility, CloudUpload
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, isBefore, addMonths, addYears } from 'date-fns';

interface Categoria {
  id: string;
  nome: string;
}

interface Pasta {
  id: string;
  categoria_id: string;
  parent_id: string | null;
  nome: string;
}

interface Arquivo {
  id: string;
  nome_arquivo: string;
  data_emissao: string | null;
  data_validade: string | null;
  url_storage: string | null;
  frequencia_verificacao?: string | null;
}

export default function GEDPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 5, textAlign: 'center' }}><Skeleton variant="rectangular" height={400} /></Box>}>
      <GEDContent />
    </Suspense>
  );
}

function GEDContent() {
  const searchParams = useSearchParams();
  const pastaIdParam = searchParams.get('pastaId') || searchParams.get('folderId');

  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [arquivosAtuais, setArquivosAtuais] = useState<Arquivo[]>([]);

  // ESTADOS DE NAVEGAÇÃO DRIVE
  const [activeCategoriaId, setActiveCategoriaId] = useState<string | null>(null);
  const [activePastaId, setActivePastaId] = useState<string | null>(null);
  const [docsObrigatorios, setDocsObrigatorios] = useState<string[]>([]);

  // SANFONA SIDEBAR
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // ESTADOS DO CRUD PASTAS
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeNodeForMenu, setActiveNodeForMenu] = useState<{ id: string, type: 'categoria' | 'pasta', catId: string } | null>(null);

  // ESTADOS DO CRUD ARQUIVOS
  const [fileMenuAnchorEl, setFileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFileForMenu, setActiveFileForMenu] = useState<Arquivo | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create_cat' | 'create_folder' | 'edit_cat' | 'edit_folder' | 'edit_file'>('create_folder');
  const [targetPastaId, setTargetPastaId] = useState<string | null>(null);
  const [targetCatId, setTargetCatId] = useState<string | null>(null);
  const [targetFileId, setTargetFileId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // ESTADOS DE EDIÇÃO DE ARQUIVO
  const [editFileOpen, setEditFileOpen] = useState(false);
  const [editDocNome, setEditDocNome] = useState('');
  const [editDocEmissao, setEditDocEmissao] = useState('');
  const [editDocValidade, setEditDocValidade] = useState('');

  // ESTADOS DO MOVER
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [nodeToMove, setNodeToMove] = useState<{ id: string, type: 'categoria' | 'pasta' | 'arquivo', nome: string } | null>(null);
  const [moveTargetCategoriaId, setMoveTargetCategoriaId] = useState<string | null>(null);
  const [moveTargetPastaId, setMoveTargetPastaId] = useState<string | null>(null);

  // ESTADOS DO UPLOAD
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docNome, setDocNome] = useState('');
  const [docEmissao, setDocEmissao] = useState('');
  const [docValidade, setDocValidade] = useState('');
  const [docIndeterminado, setDocIndeterminado] = useState(false);
  const [docFrequencia, setDocFrequencia] = useState('Anual');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // NAVEGAÇÃO PRINCIPAL (BREADCRUMBS)
  const getBreadcrumbs = () => {
    let breadcrumbs: any[] = [];
    if (activeCategoriaId) {
      const cat = categorias.find(c => c.id === activeCategoriaId);
      if (cat) breadcrumbs.push({ name: cat.nome, id: cat.id, type: 'categoria' });
    }

    if (activePastaId) {
      let current = pastas.find(p => p.id === activePastaId);
      const pastaPath = [];
      while (current) {
        pastaPath.unshift({ name: current.nome, id: current.id, type: 'pasta', catId: current.categoria_id });
        current = pastas.find(p => p.id === current?.parent_id);
      }
      breadcrumbs = [...breadcrumbs, ...pastaPath];
    }
    return breadcrumbs;
  };

  const handleNavigateBreadcrumb = (node: any) => {
    if (node.type === 'categoria') {
      setActiveCategoriaId(node.id);
      setActivePastaId(null);
    } else {
      setActiveCategoriaId(node.catId);
      setActivePastaId(node.id);
    }
  };

  const handleBack = () => {
    if (activePastaId) {
      const current = pastas.find(p => p.id === activePastaId);
      if (current && current.parent_id) {
        setActivePastaId(current.parent_id);
      } else {
        setActivePastaId(null);
      }
    } else if (activeCategoriaId) {
      setActiveCategoriaId(null);
    }
  };

  // GRID VISUAL (QUADRADOS)
  const getFoldersToShow = () => {
    // Se estivermos dentro de uma pasta, mostramos apenas as subpastas desta pasta
    if (activePastaId) {
      return pastas.filter(p => p.parent_id === activePastaId).map(p => ({ ...p, type: 'pasta', categoria_id: p.categoria_id }));
    }
    // Se estivermos em uma categoria (sem pasta selecionada ainda), mostramos as pastas raiz dessa categoria
    if (activeCategoriaId) {
      return pastas.filter(p => p.categoria_id === activeCategoriaId && p.parent_id === null).map(p => ({ ...p, type: 'pasta', categoria_id: p.categoria_id }));
    }
    // Se estivermos na raiz absoluta do GED, mostramos apenas as categorias
    return categorias.map(c => ({ id: c.id, nome: c.nome, type: 'categoria' }));
  };

  const handleGridFolderClick = (node: any) => {
    if (node.type === 'categoria') {
      setActiveCategoriaId(node.id);
      setActivePastaId(null);
    } else {
      setActiveCategoriaId(node.categoria_id);
      setActivePastaId(node.id);
    }
  };


  // RENDERIZAÇÃO SIDEBAR
  const renderPastasSidebar = (categoriaId: string, parentId: string | null = null, level: number = 0) => {
    const pastasFilhas = pastas.filter(p => p.categoria_id === categoriaId && p.parent_id === parentId);
    if (pastasFilhas.length === 0) return null;

    return (
      <List component="div" disablePadding>
        {pastasFilhas.map(pasta => {
          const hasChildren = pastas.some(p => p.parent_id === pasta.id);
          const isExpanded = expandedFolders[pasta.id];
          return (
            <Box key={pasta.id}>
              <ListItemButton
                selected={activePastaId === pasta.id}
                onClick={() => {
                  setActiveCategoriaId(categoriaId);
                  setActivePastaId(pasta.id);
                  if (hasChildren) toggleFolder(pasta.id);
                }}
                sx={{ pl: 4 + (level * 3), pr: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 35 }}>
                  <Folder fontSize="small" color={activePastaId === pasta.id ? "primary" : "inherit"} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Tooltip title={pasta.nome} placement="top-start" enterDelay={500}>
                      <Typography variant="body2" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2
                      }}>
                        {pasta.nome}
                      </Typography>
                    </Tooltip>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNodeForMenu({ id: pasta.id, type: 'pasta', catId: categoriaId });
                    setMenuAnchorEl(e.currentTarget);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
                {hasChildren ? (isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />) : null}
              </ListItemButton>
              {hasChildren && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  {renderPastasSidebar(categoriaId, pasta.id, level + 1)}
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    );
  };

  useEffect(() => {
    if (activeClientId) {
      fetchEstruturaRaiz();
    }
  }, [activeClientId]);

  useEffect(() => {
    if (activePastaId) {
      fetchArquivos(activePastaId);
      // Se a pasta tiver uma categoria, buscar os documentos obrigatórios dela
      if (activeCategoriaId) {
        fetchDocsObrigatorios(activeCategoriaId);
      }
    } else if (activeCategoriaId) {
      // Se selecionou apenas a categoria, buscar TODOS os arquivos de todas as pastas dela
      fetchArquivosDaCategoria(activeCategoriaId);
      fetchDocsObrigatorios(activeCategoriaId);
    } else {
      setArquivosAtuais([]);
      setDocsObrigatorios([]);
    }
  }, [activePastaId, activeCategoriaId]);

  async function fetchEstruturaRaiz() {
    setLoading(true);
    try {
      const { data: catData } = await (supabase as any).from('documentos_categorias')
        .select('*')
        .eq('cliente_id', activeClientId)
        .order('nome', { ascending: true });
      
      setCategorias(catData || []);

      const { data: pastaData } = await (supabase as any).from('documentos_pastas')
        .select('*')
        .is('deleted_at', null)
        .order('nome', { ascending: true });
      
      setPastas(pastaData || []);

      // Se temos um ID de pasta na URL, navega até ele
      if (pastaIdParam && pastaData) {
        const target = pastaData.find((p: any) => p.id === pastaIdParam);
        if (target) {
          setActiveCategoriaId(target.categoria_id);
          setActivePastaId(target.id);
          fetchArquivos(target.id);
          
          // Expandir pais na sidebar
          let current = target;
          const toExpand: Record<string, boolean> = { [target.id]: true };
          while (current && current.parent_id) {
            toExpand[current.parent_id] = true;
            current = pastaData.find((p: any) => p.id === current.parent_id);
          }
          setExpandedFolders(prev => ({ ...prev, ...toExpand }));
          if (target.categoria_id) {
            setExpandedCategories(prev => ({ ...prev, [target.categoria_id]: true }));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching GED structure:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocsObrigatorios(catId: string) {
    const { data } = await (supabase as any)
      .from('categorias_config')
      .select('documentos_obrigatorios')
      .eq('id', catId) // Aqui usamos o id da documentos_categorias se for o mesmo que categorias_config.id
      // Nota: No nosso sistema, categorias_config.id refere-se à configuração. 
      // Precisamos garantir que estamos buscando pelo ID correto.
      // Se activeCategoriaId for o ID de documentos_categorias, precisamos buscar em categorias_config vinculando pelo nome ou outro campo se necessário.
      // Mas wait, categorias_config TEM a coluna nome. 
      // Vamos buscar pelo nome da categoria ativa para maior robustez se os IDs divergirem.
      .is('deleted_at', null);
    
    // Se não encontrou pelo ID padrão, tenta pelo nome
    if (!data || data.length === 0) {
      const cat = categorias.find(c => c.id === catId);
      if (cat) {
        const { data: dataByName } = await (supabase as any)
          .from('categorias_config')
          .select('documentos_obrigatorios')
          .eq('nome', cat.nome)
          .eq('cliente_id', activeClientId)
          .is('deleted_at', null);
        
        if (dataByName) {
          const todos = dataByName.flatMap((d: any) => 
            (d.documentos_obrigatorios || []).map((doc: any) => typeof doc === 'string' ? doc : doc.nome)
          );
          setDocsObrigatorios(Array.from(new Set(todos)));
          return;
        }
      }
    }

    if (data) {
      const todos = data.flatMap((d: any) => 
        (d.documentos_obrigatorios || []).map((doc: any) => typeof doc === 'string' ? doc : doc.nome)
      );
      setDocsObrigatorios(Array.from(new Set(todos)));
    }
  }

  async function fetchArquivos(pastaId: string) {
    const { data } = await (supabase as any).from('documentos_arquivos')
      .select('*')
      .eq('pasta_id', pastaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (data) setArquivosAtuais(data);
  }

  async function fetchArquivosDaCategoria(catId: string) {
    setLoading(true);
    try {
      // 1. Pegar todas as pastas desta categoria
      const { data: catPastas } = await (supabase as any)
        .from('documentos_pastas')
        .select('id')
        .eq('categoria_id', catId);
        
      if (!catPastas || catPastas.length === 0) {
        setArquivosAtuais([]);
        return;
      }
      
      const ids = catPastas.map((p: any) => p.id);
      
      // 2. Buscar arquivos em qualquer uma dessas pastas
      const { data } = await (supabase as any)
        .from('documentos_arquivos')
        .select('*')
        .in('pasta_id', ids)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      if (data) setArquivosAtuais(data);
    } catch (err) {
      console.error("Erro ao buscar arquivos da categoria:", err);
    } finally {
      setLoading(false);
    }
  }

  const checkVencido = (validade: string | null) => {
    if (!validade) return false;
    return isBefore(new Date(validade), new Date());
  };

  // === FUNÇÕES DE API (UPLOAD DE ARQUIVOS) ===
  const handleOpenUploadDialog = () => {
    setFileToUpload(null);
    setDocNome('');
    setDocEmissao('');
    setDocValidade('');
    setDocIndeterminado(false);
    setDocFrequencia('Anual');
    setUploadDialogOpen(true);
  };

  const executeUpload = async () => {
    if (!fileToUpload || !activePastaId) return;

    try {
      setIsUploading(true);

      // 1. Gera nome único pro bucket
      const fileExt = fileToUpload.name.split('.').pop();
      const fileNameUnico = `${activeClientId}/${activePastaId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 2. Sobe fisicamente no Bucket S3 (Supabase Storage)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('ged_documentos')
        .upload(fileNameUnico, fileToUpload);

      if (uploadError) throw uploadError;

      const finalNome = docNome || fileToUpload.name;

      if (activeFileForMenu && !activeFileForMenu.url_storage) {
        // ATUALIZAR PLACEHOLDER
        const { error: updateError } = await (supabase as any).from('documentos_arquivos').update({
          nome_arquivo: finalNome,
          data_emissao: editDocEmissao || docEmissao || null,
          data_validade: docIndeterminado ? null : (editDocValidade || docValidade || null),
          frequencia_verificacao: docIndeterminado ? docFrequencia : null,
          url_storage: uploadData!.path,
          created_at: new Date().toISOString()
        }).eq('id', activeFileForMenu.id);

        if (updateError) {
          await supabase.storage.from('ged_documentos').remove([uploadData.path]);
          throw updateError;
        }
      } else {
        // INSERIR NOVO
        const { error: insertError } = await (supabase as any).from('documentos_arquivos').insert({
          pasta_id: activePastaId,
          nome_arquivo: finalNome,
          data_emissao: docEmissao || null,
          data_validade: docIndeterminado ? null : (docValidade || null),
          frequencia_verificacao: docIndeterminado ? docFrequencia : null,
          url_storage: uploadData!.path
        });

        if (insertError) {
          await supabase.storage.from('ged_documentos').remove([uploadData.path]);
          throw insertError;
        }
      }

      setUploadDialogOpen(false);
      fetchArquivos(activePastaId);
      setActiveFileForMenu(null);
    } catch (err: any) {
      console.error('Falha crítica no Upload:', err);
      alert('Erro ao enviar documento. ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDialog = (mode: 'create_cat' | 'create_folder' | 'edit_cat' | 'edit_folder' | 'edit_file', catId: string | null = null, parentId: string | null = null, defaultName: string = '', fileId: string | null = null) => {
    setDialogMode(mode);
    setTargetCatId(catId);
    setTargetPastaId(parentId);
    setTargetFileId(fileId);
    setInputValue(defaultName);
    setDialogOpen(true);
    setMenuAnchorEl(null);
    setFileMenuAnchorEl(null);
  };

  const handleSaveNode = async () => {
    if (!inputValue.trim()) return;

    if (dialogMode === 'create_cat') {
      await (supabase as any).from('documentos_categorias' as any).insert({ cliente_id: activeClientId, nome: inputValue });
    } else if (dialogMode === 'edit_cat') {
      await (supabase as any).from('documentos_categorias' as any).update({ nome: inputValue }).eq('id', targetCatId);
    } else if (dialogMode === 'create_folder') {
      const { error } = await (supabase as any).from('documentos_pastas').insert({
        nome: inputValue,
        categoria_id: targetCatId,
        parent_id: targetPastaId
      });
    } else if (dialogMode === 'edit_folder') {
      await (supabase as any).from('documentos_pastas' as any).update({ nome: inputValue }).eq('id', targetPastaId);
    } else if (dialogMode === 'edit_file') {
      await (supabase as any).from('documentos_arquivos' as any).update({ nome_arquivo: inputValue }).eq('id', targetFileId);
    }

    setDialogOpen(false);
    fetchEstruturaRaiz();
    if (activePastaId) fetchArquivos(activePastaId);
  };

  const handleOpenMoveDialog = (node: { id: string, type: 'categoria' | 'pasta' | 'arquivo', nome: string }) => {
    setNodeToMove(node);
    setMoveTargetCategoriaId(null);
    setMoveTargetPastaId(null);
    setMoveDialogOpen(true);
    setMenuAnchorEl(null);
    setFileMenuAnchorEl(null);
  };

  const handleSaveMove = async () => {
    if (!nodeToMove) return;

    if (nodeToMove.type === 'pasta') {
      if (!moveTargetCategoriaId) {
        alert('Selecione uma categoria de destino.'); return;
      }
      if (nodeToMove.id === moveTargetPastaId) {
        alert('Não é possível mover uma pasta para dentro de si mesma.'); return;
      }
      await (supabase as any).from('documentos_pastas' as any).update({ categoria_id: moveTargetCategoriaId, parent_id: moveTargetPastaId }).eq('id', nodeToMove.id);
    } else if (nodeToMove.type === 'arquivo') {
      if (!moveTargetPastaId) {
        alert('Selecione uma pasta de destino válida para o arquivo.'); return;
      }
      await (supabase as any).from('documentos_arquivos' as any).update({ pasta_id: moveTargetPastaId }).eq('id', nodeToMove.id);
    }

    setMoveDialogOpen(false);
    setNodeToMove(null);
    fetchEstruturaRaiz();
    if (activePastaId) fetchArquivos(activePastaId);
  };

  const handleOpenEditFile = (file: Arquivo) => {
    setTargetFileId(file.id);
    setEditDocNome(file.nome_arquivo);
    setEditDocEmissao(file.data_emissao ? new Date(file.data_emissao).toISOString().split('T')[0] : '');
    setEditDocValidade(file.data_validade ? new Date(file.data_validade).toISOString().split('T')[0] : '');
    setDocIndeterminado(!file.data_validade && !!file.frequencia_verificacao);
    setDocFrequencia(file.frequencia_verificacao || 'Anual');
    setEditFileOpen(true);
    setFileMenuAnchorEl(null);
  };

  const handleSaveEditFile = async () => {
    if (!editDocNome.trim() || !targetFileId) return;

    try {
      const { error } = await (supabase as any).from('documentos_arquivos' as any).update({
        nome_arquivo: editDocNome,
        data_emissao: editDocEmissao || null,
        data_validade: docIndeterminado ? null : (editDocValidade || null),
        frequencia_verificacao: docIndeterminado ? docFrequencia : null
      }).eq('id', targetFileId);

      if (error) throw error;

      setEditFileOpen(false);
      if (activePastaId) fetchArquivos(activePastaId);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as edições do documento.');
    }
  };

  const handleDeleteNode = async () => {
    if (!activeNodeForMenu) return;
    const confirm = window.confirm("Tem certeza? Esta ação removerá a pasta e todo o seu conteúdo interno.");
    if (!confirm) return;

    if (activeNodeForMenu.type === 'categoria') {
      await (supabase as any).from('documentos_categorias' as any).delete().eq('id', activeNodeForMenu.id);
    } else {
      await (supabase as any).from('documentos_pastas' as any).delete().eq('id', activeNodeForMenu.id);
    }

    setMenuAnchorEl(null);
    setActiveNodeForMenu(null);

    // Se a pasta apagada for a ativa, recuar
    if (activePastaId === activeNodeForMenu.id || activeCategoriaId === activeNodeForMenu.id) {
      handleBack();
    }

    fetchEstruturaRaiz();
  };

  // === FUNÇÕES DE API (AÇÕES DE ARQUIVOS INTERNOS) ===
  const handleDownloadFile = async () => {
    if (!activeFileForMenu?.url_storage) return;

    try {
      const { data, error } = await supabase.storage
        .from('ged_documentos')
        .download(activeFileForMenu.url_storage);

      if (error) throw error;

      // Cria um link temporário para forçar o download no Browser
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', activeFileForMenu.nome_arquivo);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Erro ao Baixar o Documento.');
    } finally {
      setFileMenuAnchorEl(null);
      setActiveFileForMenu(null);
    }
  };

  const handleViewFile = async () => {
    if (!activeFileForMenu?.url_storage) return;

    try {
      const { data } = supabase.storage
        .from('ged_documentos')
        .getPublicUrl(activeFileForMenu.url_storage);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao abrir o documento.');
    } finally {
      setFileMenuAnchorEl(null);
      setActiveFileForMenu(null);
    }
  };

  const handleCopyLinkFile = async () => {
    if (!activeFileForMenu?.url_storage) return;

    try {
      // Pega URL pública assinada ou estática do Bucket
      const { data } = supabase.storage
        .from('ged_documentos')
        .getPublicUrl(activeFileForMenu.url_storage);

      if (data?.publicUrl) {
        await navigator.clipboard.writeText(data.publicUrl);
        alert('Link Público do Documento copiado para a Área de Transferência!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao copiar URL.');
    } finally {
      setFileMenuAnchorEl(null);
      setActiveFileForMenu(null);
    }
  };

  const handleSoftDeleteFile = async () => {
    if (!activeFileForMenu) return;

    const confirm = window.confirm(`Deseja mesmo Arquivar (Deletar) o documento "${activeFileForMenu.nome_arquivo}"? Ele deixará de aparecer no GED Oficial.`);
    if (!confirm) {
      setFileMenuAnchorEl(null);
      return;
    }

    try {
      // Soft Delete: Insere Data Atual no deleted_at (Mantém rastro visual no BD de auditoria GxP)
      const { error } = await (supabase as any).from('documentos_arquivos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', activeFileForMenu.id);

      if (error) throw error;

      if (activePastaId) {
        fetchArquivos(activePastaId);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir documento.');
    } finally {
      setFileMenuAnchorEl(null);
      setActiveFileForMenu(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Folder sx={{ fontSize: 32 }} /> Central de Documentos (GED)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Botão Dinâmico: Cria Categoria se na raiz, Cria Pasta se dentro */}
          {!activeCategoriaId ? (
            <Button variant="outlined" startIcon={<CreateNewFolder />} onClick={() => handleOpenDialog('create_cat')}>Nova Categoria Base</Button>
          ) : (
            <Button variant="outlined" startIcon={<CreateNewFolder />} onClick={() => handleOpenDialog('create_folder', activeCategoriaId, activePastaId)}>Nova Pasta Aqui</Button>
          )}
          <Button
            variant="contained"
            startIcon={<UploadFile />}
            // Bloqueia upload se a ActivePastaId for Nula OU se estivermos apenas numa Categoria Base
            disabled={!activePastaId || !pastas.find(p => p.id === activePastaId)}
            onClick={handleOpenUploadDialog}
          >
            Anexar Arquivo
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* MAIN: QUADRADO PRINCIPAL GOOGLE DRIVE */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', minHeight: '600px', p: 3, display: 'flex', flexDirection: 'column' }}>

            {/* CABEÇALHO DO DRIVE: BREADCRUMBS */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <Tooltip title="Sair / Subir de Nível">
                <span>
                  <IconButton onClick={handleBack} disabled={!activeCategoriaId && !activePastaId}>
                    <ArrowBack />
                  </IconButton>
                </span>
              </Tooltip>

              <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ ml: 1 }}>
                <Link
                  component="button"
                  variant="h6"
                  underline="hover"
                  color={!activeCategoriaId && !activePastaId ? "text.primary" : "inherit"}
                  onClick={() => { setActiveCategoriaId(null); setActivePastaId(null); }}
                  sx={{ fontWeight: '500' }}
                >
                  Meu Drive GED
                </Link>
                {getBreadcrumbs().map((b, i) => {
                  const isLast = i === getBreadcrumbs().length - 1;
                  if (isLast) {
                    return (
                      <Typography key={b.id} variant="h6" color="text.primary" fontWeight="bold">
                        {b.name}
                      </Typography>
                    );
                  }
                  return (
                    <Link
                      component="button"
                      variant="h6"
                      key={b.id}
                      underline="hover"
                      color="inherit"
                      onClick={() => handleNavigateBreadcrumb(b)}
                    >
                      {b.name}
                    </Link>
                  );
                })}
              </Breadcrumbs>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* SEÇÃO 1: PASTAS (QUADRADOS) */}
            {getFoldersToShow().length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ display: 'block', mb: 2 }}>
                  Pastas
                </Typography>
                <Grid container spacing={2}>
                  {getFoldersToShow().map(f => (
                    <Grid item xs={12} sm={6} md={4} key={f.id}>
                      <Paper
                        variant="outlined"
                        onClick={() => handleGridFolderClick(f)}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          cursor: 'pointer',
                          bgcolor: 'grey.50',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'grey.100', borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 }
                        }}
                      >
                        <Folder color="primary" />
                        <Tooltip title={f.nome} placement="top">
                          <Typography variant="body2" fontWeight="500" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {f.nome}
                          </Typography>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNodeForMenu({ id: f.id, type: f.type as 'categoria' | 'pasta', catId: f.type === 'categoria' ? f.id : (f as any).categoria_id });
                            setMenuAnchorEl(e.currentTarget);
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* EMPTY STATE */}
            {!activeCategoriaId && !activePastaId && getFoldersToShow().length === 0 && (
              <Box textAlign="center" py={10} color="text.secondary" flex={1} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                <Folder sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                <Typography variant="h6">Seu Drive está vazio.</Typography>
                <Typography variant="body2">Crie uma nova Categoria para começar.</Typography>
              </Box>
            )}

            {activeCategoriaId && !activePastaId && getFoldersToShow().length === 0 && (
              <Box textAlign="center" py={10} color="text.secondary" flex={1} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                <Folder sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                <Typography variant="h6">Categoria vazia.</Typography>
                <Typography variant="body2">Clique em &quot;Nova Pasta Aqui&quot; acima para organizar seus documentos.</Typography>
              </Box>
            )}

            {/* SEÇÃO 2: CHECKLIST (ITENS PARA ANEXAR) */}
            {activePastaId && docsObrigatorios.length > 0 && (
              <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadFile fontSize="small" color="primary" /> Checklist de Documentos Obrigatórios
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {docsObrigatorios.map((doc) => {
                    const anexado = arquivosAtuais.some(a => 
                      a.nome_arquivo.toLowerCase().includes(doc.toLowerCase()) || 
                      doc.toLowerCase().includes(a.nome_arquivo.toLowerCase())
                    );
                    return (
                      <Chip
                        key={doc}
                        label={doc}
                        size="small"
                        color={anexado ? 'success' : 'warning'}
                        variant={anexado ? 'filled' : 'outlined'}
                        icon={anexado ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                        onClick={() => {
                          if (!anexado) {
                            setDocNome(doc);
                            handleOpenUploadDialog();
                          }
                        }}
                        sx={{ fontWeight: 'bold', cursor: anexado ? 'default' : 'pointer' }}
                      />
                    );
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Clique em um item pendente para anexar rapidamente.
                </Typography>
              </Box>
            )}

            {/* SEÇÃO 3: ARQUIVOS (TABELA) - ATIVA QUANDO UMA CATEGORIA OU PASTA ESTÁ SELECIONADA */}
            {(activePastaId || activeCategoriaId) && (
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ display: 'block', mb: 2 }}>
                  {activePastaId ? 'Arquivos nesta Pasta' : 'Todos os Arquivos desta Categoria'}
                </Typography>
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell>Nome do Arquivo</TableCell>
                        <TableCell>Validade</TableCell>
                        <TableCell>Status Regulatória</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {arquivosAtuais.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhum documento encontrado nesta pasta.</TableCell></TableRow>
                      )}
                      {(() => {
                        // Agrupar e Renderizar por Empresa (Prefixos [Empresa])
                        const groups: Record<string, Arquivo[]> = {};
                        arquivosAtuais.forEach(arq => {
                          const match = arq.nome_arquivo.match(/^\[(.*?)\]/);
                          const group = match ? match[1] : 'Arquivos Gerais';
                          if (!groups[group]) groups[group] = [];
                          groups[group].push(arq);
                        });

                        return Object.entries(groups).map(([groupName, files]) => (
                          <Fragment key={groupName}>
                            {Object.keys(groups).length > 1 && (
                              <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell colSpan={4} sx={{ py: 1, px: 2, fontWeight: 'bold', fontSize: '0.75rem', color: 'text.secondary' }}>
                                  🏢 {groupName.toUpperCase()}
                                </TableCell>
                              </TableRow>
                            )}
                            {files.map((arq) => {
                              let vencido = false;
                              let dataLimite: Date | null = null;

                              if (arq.data_validade) {
                                vencido = isBefore(new Date(arq.data_validade), new Date());
                              } else if (arq.data_emissao && arq.frequencia_verificacao) {
                                const emissao = new Date(arq.data_emissao);
                                if (arq.frequencia_verificacao === 'Mensal') dataLimite = addMonths(emissao, 1);
                                else if (arq.frequencia_verificacao === 'Trimestral') dataLimite = addMonths(emissao, 3);
                                else if (arq.frequencia_verificacao === 'Semestral') dataLimite = addMonths(emissao, 6);
                                else if (arq.frequencia_verificacao === 'Anual') dataLimite = addYears(emissao, 1);
                                else if (arq.frequencia_verificacao === 'Bienal') dataLimite = addYears(emissao, 2);
                                
                                if (dataLimite) {
                                  vencido = isBefore(dataLimite, new Date());
                                }
                              }

                              return (
                                <TableRow key={arq.id} hover>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <InsertDriveFile color={arq.url_storage ? "primary" : "disabled"} fontSize="small" />
                                      <Typography fontWeight={arq.url_storage ? "500" : "400"} variant="body2" sx={{ color: arq.url_storage ? 'text.primary' : 'text.secondary' }}>
                                        {arq.nome_arquivo}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {arq.data_validade 
                                      ? format(new Date(arq.data_validade), 'dd/MM/yyyy') 
                                      : (arq.frequencia_verificacao ? `Periódico: ${arq.frequencia_verificacao}` : '-')}
                                  </TableCell>
                                  <TableCell>
                                    {!arq.url_storage ? (
                                      <Chip
                                        label="Pendente"
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                        icon={<CloudUpload sx={{ fontSize: '14px' }} />}
                                        onClick={() => { setDocNome(arq.nome_arquivo); setActiveFileForMenu(arq); setUploadDialogOpen(true); }}
                                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'warning.50' } }}
                                      />
                                    ) : (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Chip
                                          label={vencido ? 'Vencido' : 'Vigente'}
                                          color={vencido ? 'error' : 'success'}
                                          size="small"
                                          icon={vencido ? <Warning fontSize="small" /> : <CheckCircle fontSize="small" />}
                                        />
                                        {arq.frequencia_verificacao && (
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                            Verificação Periódica
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        setActiveFileForMenu(arq);
                                        setFileMenuAnchorEl(e.currentTarget);
                                      }}
                                    >
                                      <MoreVert />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </Fragment>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>

      {/* MENUS DE CONTEXTO */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (!activeNodeForMenu) return;
          handleOpenDialog('create_folder', activeNodeForMenu.catId, activeNodeForMenu.type === 'pasta' ? activeNodeForMenu.id : null);
        }}>
          <ListItemIcon><Add fontSize="small" /></ListItemIcon> Nova Sub-pasta
        </MenuItem>

        <MenuItem onClick={() => {
          if (!activeNodeForMenu) return;
          const isCat = activeNodeForMenu.type === 'categoria';
          const nodeName = isCat
            ? categorias.find(c => c.id === activeNodeForMenu.id)?.nome
            : pastas.find(p => p.id === activeNodeForMenu.id)?.nome;

          handleOpenDialog(isCat ? 'edit_cat' : 'edit_folder', isCat ? activeNodeForMenu.id : null, isCat ? null : activeNodeForMenu.id, nodeName || '');
        }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Renomear
        </MenuItem>

        {activeNodeForMenu?.type === 'pasta' && (
          <MenuItem onClick={() => {
            if (!activeNodeForMenu) return;
            const nodeName = pastas.find(p => p.id === activeNodeForMenu.id)?.nome || '';
            handleOpenMoveDialog({ id: activeNodeForMenu.id, type: 'pasta', nome: nodeName });
          }}>
            <ListItemIcon><DriveFileMove fontSize="small" /></ListItemIcon> Mover Pasta
          </MenuItem>
        )}

        <Divider />
        <MenuItem onClick={handleDeleteNode} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon> Excluir Toda a Pasta
        </MenuItem>
      </Menu>

      {/* MENU DE AÇÕES DOS ARQUIVOS */}
      <Menu
        anchorEl={fileMenuAnchorEl}
        open={Boolean(fileMenuAnchorEl)}
        onClose={() => setFileMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (!activeFileForMenu) return;
          handleOpenEditFile(activeFileForMenu);
        }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon> Editar Detalhes
        </MenuItem>

        <MenuItem onClick={() => {
          if (!activeFileForMenu) return;
          handleOpenMoveDialog({ id: activeFileForMenu.id, type: 'arquivo', nome: activeFileForMenu.nome_arquivo });
        }}>
          <ListItemIcon><DriveFileMove fontSize="small" /></ListItemIcon> Mover Arquivo
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleViewFile}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadFile}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>Baixar Arquivo</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyLinkFile}>
          <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon> Copiar Link Seguro
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleSoftDeleteFile} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon> Arquivar (Soft Delete)
        </MenuItem>
      </Menu>

      {/* DIALOG DE CRUD */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode.includes('create') ? 'Criar Novo Diretório' : dialogMode === 'edit_file' ? 'Renomear Arquivo' : 'Renomear Diretório'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Pasta ou Categoria"
            type="text"
            fullWidth
            variant="outlined"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveNode} variant="contained" disabled={!inputValue.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE EDIÇÃO DE ARQUIVO */}
      <Dialog open={editFileOpen} onClose={() => setEditFileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Detalhes do Documento</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3} py={1}>
            <TextField
              label="Nome de Apresentação (Visível no Drive)"
              placeholder="Ex: Alvará de Funcionamento 2026"
              fullWidth
              variant="outlined"
              value={editDocNome}
              onChange={(e) => setEditDocNome(e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Data de Emissão (Opcional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editDocEmissao}
                onChange={(e) => setEditDocEmissao(e.target.value)}
              />
              <TextField
                label="Data de Validade (Alerta GxP)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editDocValidade}
                onChange={(e) => setEditDocValidade(e.target.value)}
                disabled={docIndeterminado}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={docIndeterminado} 
                    onChange={(e) => setDocIndeterminado(e.target.checked)} 
                  />
                }
                label="Validade Indeterminada"
              />
              {docIndeterminado && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Frequência de Verificação</InputLabel>
                  <Select
                    value={docFrequencia}
                    label="Frequência de Verificação"
                    onChange={(e) => setDocFrequencia(e.target.value)}
                  >
                    <MenuItem value="Mensal">Mensal</MenuItem>
                    <MenuItem value="Trimestral">Trimestral (3 meses)</MenuItem>
                    <MenuItem value="Semestral">Semestral (6 meses)</MenuItem>
                    <MenuItem value="Anual">Anual (1 ano)</MenuItem>
                    <MenuItem value="Bienal">Bienal (2 anos)</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditFileOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEditFile} variant="contained" disabled={!editDocNome.trim()}>Salvar Edições</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE MOVER */}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Mover &quot;{nodeToMove?.nome}&quot;
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3} py={1}>
            <TextField
              select
              label="Categoria de Destino"
              value={moveTargetCategoriaId || ''}
              onChange={(e) => {
                setMoveTargetCategoriaId(e.target.value);
                setMoveTargetPastaId(null);
              }}
              fullWidth
            >
              {categorias.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
              ))}
            </TextField>

            {moveTargetCategoriaId && (
              <TextField
                select
                label={nodeToMove?.type === 'arquivo' ? "Pasta de Destino" : "Pasta Pai de Destino (Opcional)"}
                value={moveTargetPastaId || ''}
                onChange={(e) => setMoveTargetPastaId(e.target.value)}
                fullWidth
                helperText={nodeToMove?.type === 'pasta' ? "Deixe em branco para mover para a raiz desta Categoria." : ""}
              >
                {nodeToMove?.type === 'pasta' && (
                  <MenuItem value=""><em>Raiz da Categoria</em></MenuItem>
                )}
                {pastas.filter(p => p.categoria_id === moveTargetCategoriaId && p.id !== nodeToMove?.id).map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveMove} variant="contained" color="primary" disabled={!moveTargetCategoriaId}>Confirmar Movimentação</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE UPLOAD GxP */}
      <Dialog open={uploadDialogOpen} onClose={() => !isUploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadFile color="primary" /> Enviar Novo Documento
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Input Físico de Arquivo */}
            <Button
              variant="outlined"
              component="label"
              size="large"
              fullWidth
              sx={{ py: 4, borderStyle: 'dashed', borderWidth: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              <UploadFile fontSize="large" color="action" />
              <Typography variant="body1">
                {fileToUpload ? fileToUpload.name : "Clique aqui para selecionar seu Arquivo (PDF, Imagem, Docx)"}
              </Typography>
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFileToUpload(e.target.files[0]);
                    // Auto-preenche o nome do doc com o arquivo original se estiver vazio
                    if (!docNome) setDocNome(e.target.files[0].name);
                  }
                }}
              />
            </Button>

            {/* Seletor de Documento Obrigatório (Ajuda o usuário) */}
            {docsObrigatorios.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Vincular a Documento Obrigatório</InputLabel>
                <Select
                  value={docsObrigatorios.includes(docNome) ? docNome : ""}
                  label="Vincular a Documento Obrigatório"
                  onChange={(e) => setDocNome(e.target.value as string)}
                  disabled={isUploading}
                >
                  <MenuItem value=""><em>Nenhum / Nome Personalizado</em></MenuItem>
                  {docsObrigatorios.map((doc) => (
                    <MenuItem key={doc} value={doc}>{doc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Nome do Arquivo (Exibição)"
              placeholder="Ex: Alvará de Funcionamento 2026"
              fullWidth
              variant="outlined"
              value={docNome}
              onChange={(e) => setDocNome(e.target.value)}
              disabled={isUploading}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Data de Emissão (Opcional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={docEmissao}
                onChange={(e) => setDocEmissao(e.target.value)}
                disabled={isUploading}
              />
              <TextField
                label="Data de Validade (Alerta GxP)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={docValidade}
                onChange={(e) => setDocValidade(e.target.value)}
                disabled={isUploading || docIndeterminado}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={docIndeterminado} 
                    onChange={(e) => setDocIndeterminado(e.target.checked)} 
                    disabled={isUploading}
                  />
                }
                label="Validade Indeterminada"
              />
              {docIndeterminado && (
                <FormControl size="small" sx={{ minWidth: 200 }} disabled={isUploading}>
                  <InputLabel>Frequência de Verificação</InputLabel>
                  <Select
                    value={docFrequencia}
                    label="Frequência de Verificação"
                    onChange={(e) => setDocFrequencia(e.target.value)}
                  >
                    <MenuItem value="Mensal">Mensal</MenuItem>
                    <MenuItem value="Trimestral">Trimestral (3 meses)</MenuItem>
                    <MenuItem value="Semestral">Semestral (6 meses)</MenuItem>
                    <MenuItem value="Anual">Anual (1 ano)</MenuItem>
                    <MenuItem value="Bienal">Bienal (2 anos)</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
          <Button
            onClick={executeUpload}
            variant="contained"
            color="primary"
            disabled={!fileToUpload || isUploading}
            startIcon={isUploading ? <Skeleton variant="circular" width={20} height={20} /> : <UploadFile />}
          >
            {isUploading ? 'Enviando...' : 'Realizar Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container >
  );
}


