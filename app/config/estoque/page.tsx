'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Box, Typography, Button, Paper, TextField,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
    Alert, CircularProgress, Snackbar, Container, InputAdornment,
    Divider, useTheme, alpha, ListItemIcon
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Plus,
    Trash2,
    MapPin,
    Tag,
    ArrowLeft,
    Settings,
    PackageSearch,
    Factory
} from 'lucide-react';

export default function ConfiguracaoEstoquePage() {
    const router = useRouter();
    const theme = useTheme();

    // CORREÇÃO 1: Pegamos o ID da Unidade Específica, não só do Cliente
    const { activeClientId, unidadeId } = useClient();

    const [loading, setLoading] = useState(false);
    const [locais, setLocais] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [setores, setSetores] = useState<any[]>([]);

    // Inputs
    const [novoLocal, setNovoLocal] = useState('');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [novoSetor, setNovoSetor] = useState('');

    // Feedback visual
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });

    useEffect(() => {
        // Só carrega se tiver Unidade selecionada (para Locais) e Cliente (para Categorias)
        if (unidadeId && activeClientId) {
            loadDados();
        }
    }, [unidadeId, activeClientId]);

    const loadDados = async () => {
        setLoading(true);
        try {
            // CORREÇÃO 2: Buscamos Locais da UNIDADE e Categorias do CLIENTE
            const [locaisRes, catRes, setoresRes] = await Promise.all([
                supabase
                    .from('cliente_locais_estoque')
                    .select('*')
                    .eq('unidade_id', unidadeId) // Filtro por Unidade Física
                    .order('nome'),

                supabase
                    .from('cliente_categorias_produto')
                    .select('*')
                    .eq('cliente_id', activeClientId) // Filtro por Empresa (Categorias globais)
                    .order('nome'),

                supabase
                    .from('cliente_setores_producao')
                    .select('*')
                    .eq('cliente_id', activeClientId)
                    .order('nome')
            ]);

            if (locaisRes.data) setLocais(locaisRes.data);
            if (catRes.data) setCategorias(catRes.data);
            if (setoresRes.data) setSetores(setoresRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- FUNÇÕES DE LOCAIS (VINCULADOS À UNIDADE) ---
    const handleAddLocal = async () => {
        if (!novoLocal.trim()) return;

        if (!unidadeId) {
            setMsg({ open: true, text: 'Erro: Nenhuma unidade selecionada.', type: 'error' });
            return;
        }

        try {
            // CORREÇÃO 3: Insert enviando unidade_id (Satisfaz a constraint NOT NULL)
            const { error } = await supabase
                .from('cliente_locais_estoque')
                .insert({
                    unidade_id: unidadeId, // O vínculo físico correto
                    nome: novoLocal.trim(),
                    // Se sua tabela tiver cliente_id também, pode enviar, mas unidade_id é o mandatório
                    // cliente_id: activeClientId 
                });

            if (error) throw error;

            setMsg({ open: true, text: 'Local adicionado à unidade!', type: 'success' });
            setNovoLocal('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar: ' + err.message, type: 'error' });
        }
    };

    const handleRemoveLocal = async (id: string) => {
        if (!confirm('Deseja excluir este local?')) return;
        try {
            const { error } = await supabase.from('cliente_locais_estoque').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir: ' + err.message, type: 'error' });
        }
    };

    // --- FUNÇÕES DE CATEGORIAS (VINCULADAS AO CLIENTE/EMPRESA) ---
    const handleAddCategoria = async () => {
        if (!novaCategoria.trim()) return;

        if (!activeClientId) {
            setMsg({ open: true, text: 'Erro: Nenhum cliente selecionado.', type: 'error' });
            return;
        }

        try {
            // Categorias continuam globais para a empresa
            const { error } = await supabase
                .from('cliente_categorias_produto')
                .insert({ cliente_id: activeClientId, nome: novaCategoria.trim() });

            if (error) throw error;

            setMsg({ open: true, text: 'Categoria adicionada com sucesso!', type: 'success' });
            setNovaCategoria('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar: ' + err.message, type: 'error' });
        }
    };

    const handleRemoveCategoria = async (id: string) => {
        if (!confirm('Deseja excluir esta categoria?')) return;
        try {
            const { error } = await supabase.from('cliente_categorias_produto').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir: ' + err.message, type: 'error' });
        }
    };

    // --- FUNÇÕES DE SETORES (VINCULADOS AO CLIENTE/EMPRESA) ---
    const handleAddSetor = async () => {
        if (!novoSetor.trim()) return;

        if (!activeClientId) {
            setMsg({ open: true, text: 'Erro: Nenhum cliente selecionado.', type: 'error' });
            return;
        }

        try {
            const { error } = await supabase
                .from('cliente_setores_producao')
                .insert({ cliente_id: activeClientId, nome: novoSetor.trim() });

            if (error) throw error;

            setMsg({ open: true, text: 'Setor de produção adicionado com sucesso!', type: 'success' });
            setNovoSetor('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar: ' + err.message, type: 'error' });
        }
    };

    const handleRemoveSetor = async (id: string) => {
        if (!confirm('Deseja excluir este setor de produção?')) return;
        try {
            const { error } = await supabase.from('cliente_setores_producao').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir: ' + err.message, type: 'error' });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>

            {/* HEADER */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="outlined" startIcon={<ArrowLeft />} onClick={() => router.back()} color="inherit">
                        Voltar
                    </Button>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                            Parâmetros de Estoque
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Defina locais físicos (Unidade) e categorias de produtos (Geral).
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {!unidadeId && (
                <Alert severity="warning" sx={{ mb: 4 }}>
                    Selecione uma unidade no menu superior para configurar seus locais físicos.
                </Alert>
            )}

            <Grid container spacing={4}>

                {/* COLUNA 1: SETORES DE PRODUÇÃO (NOVO) */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header do Card */}
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: 'warning.dark' }}>
                                <Factory size={24} />
                                <Typography variant="h6" fontWeight="bold">Setores de Produção</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Destinos para onde os ingredientes vão ao sair do estoque.
                            </Typography>
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Ex: Confeitaria, Cozinha Fria..."
                                    value={novoSetor}
                                    onChange={e => setNovoSetor(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSetor()}
                                    disabled={!activeClientId}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Settings size={16} opacity={0.5} /></InputAdornment>
                                    }}
                                />
                                <Button variant="contained" color="warning" onClick={handleAddSetor} disabled={!novoSetor.trim() || !activeClientId} sx={{ minWidth: 50, px: 0 }}>
                                    <Plus />
                                </Button>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Lista */}
                        <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 400, bgcolor: 'background.default' }}>
                            {loading ? (
                                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} color="warning" /></Box>
                            ) : setores.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">Nenhum setor da produção cadastrado.</Typography>
                                </Box>
                            ) : (
                                setores.map((setor) => (
                                    <ListItem
                                        key={setor.id}
                                        divider
                                        sx={{ '&:hover': { bgcolor: 'background.paper' } }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, color: 'warning.light' }}>
                                            <Factory size={18} />
                                        </ListItemIcon>
                                        <ListItemText primary={setor.nome} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }} />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" onClick={() => handleRemoveSetor(setor.id)} size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* COLUNA 2: LOCAIS DE ARMAZENAMENTO (AZUL) */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header do Card */}
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: 'primary.main' }}>
                                <MapPin size={24} />
                                <Typography variant="h6" fontWeight="bold">Locais Físicos</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Lugares onde os insumos são guardados NA UNIDADE ATUAL (Ex: Estoque Seco, Câmara Fria).
                            </Typography>
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Novo Local..."
                                    value={novoLocal}
                                    onChange={e => setNovoLocal(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocal()}
                                    disabled={!unidadeId}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Settings size={16} opacity={0.5} /></InputAdornment>
                                    }}
                                />
                                <Button variant="contained" onClick={handleAddLocal} disabled={!novoLocal.trim() || !unidadeId} sx={{ minWidth: 50, px: 0 }}>
                                    <Plus />
                                </Button>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Lista */}
                        <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 400, bgcolor: 'background.default' }}>
                            {loading ? (
                                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
                            ) : locais.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">Nenhum local cadastrado nesta unidade.</Typography>
                                </Box>
                            ) : (
                                locais.map((local) => (
                                    <ListItem
                                        key={local.id}
                                        divider
                                        sx={{ '&:hover': { bgcolor: 'background.paper' } }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, color: 'primary.light' }}>
                                            <MapPin size={18} />
                                        </ListItemIcon>
                                        <ListItemText primary={local.nome} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }} />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" onClick={() => handleRemoveLocal(local.id)} size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

                {/* COLUNA 3: CATEGORIAS DE PRODUTO (VERDE/TEAL) */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header do Card */}
                        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: 'success.dark' }}>
                                <Tag size={24} />
                                <Typography variant="h6" fontWeight="bold">Categorias de Produto</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Agrupamento lógico para relatórios (Padrão da Empresa).
                            </Typography>
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Nova Categoria..."
                                    value={novaCategoria}
                                    onChange={e => setNovaCategoria(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategoria()}
                                    disabled={!activeClientId}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><PackageSearch size={16} opacity={0.5} /></InputAdornment>
                                    }}
                                />
                                <Button variant="contained" color="success" onClick={handleAddCategoria} disabled={!novaCategoria.trim() || !activeClientId} sx={{ minWidth: 50, px: 0 }}>
                                    <Plus />
                                </Button>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Lista */}
                        <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 400, bgcolor: 'background.default' }}>
                            {loading ? (
                                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} color="success" /></Box>
                            ) : categorias.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">Nenhuma categoria cadastrada.</Typography>
                                </Box>
                            ) : (
                                categorias.map((cat) => (
                                    <ListItem
                                        key={cat.id}
                                        divider
                                        sx={{ '&:hover': { bgcolor: 'background.paper' } }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36, color: 'success.light' }}>
                                            <Tag size={18} />
                                        </ListItemIcon>
                                        <ListItemText primary={cat.nome} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }} />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" onClick={() => handleRemoveCategoria(cat.id)} size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>

            </Grid>

            {/* Notificações */}
            <Snackbar
                open={msg.open}
                autoHideDuration={4000}
                onClose={() => setMsg({ ...msg, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={msg.type} variant="filled" onClose={() => setMsg({ ...msg, open: false })}>
                    {msg.text}
                </Alert>
            </Snackbar>
        </Container>
    );
}