'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Box, Typography, Button, Paper, TextField,
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
    Alert, CircularProgress, Snackbar, Container, InputAdornment,
    Divider, useTheme, alpha, ListItemIcon, MenuItem, Checkbox, 
    FormControl, InputLabel, Select, Chip, OutlinedInput,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Plus,
    Trash2,
    Edit,
    MapPin,
    Tag,
    ArrowLeft,
    Settings,
    PackageSearch,
    Factory,
    ChevronDown,
    ChevronRight,
    Building2,
    Layers
} from 'lucide-react';

export default function ConfiguracaoEstoquePage() {
    const router = useRouter();
    const theme = useTheme();

    const { activeClientId, unidadeId: ctxUnidadeId } = useClient();
    const [unidades, setUnidades] = useState<any[]>([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);

    const CATEGORIAS_COMPRAS = [
        { id: 'ALIMENTOS', nome: 'Alimentos (Insumos)', color: theme.palette.primary.main },
        { id: 'EMBALAGENS', nome: 'Embalagens', color: theme.palette.warning.main },
        { id: 'LIMPEZA', nome: 'Produtos de limpeza', color: theme.palette.success.main },
        { id: 'MANUTENCAO', nome: 'Manutenção', color: theme.palette.error.main },
        { id: 'UTENSILIOS', nome: 'Utensílios', color: theme.palette.info.main },
        { id: 'EPI_EPC', nome: 'EPIs/EPCs', color: '#7c4dff' },
        { id: 'UNIFORMES', nome: 'Uniformes', color: '#ff4081' },
        { id: 'PRIMEIROS_SOCORROS', nome: 'Primeiros Socorros', color: '#fbc02d' }
    ];

    const [loading, setLoading] = useState(false);
    const [locais, setLocais] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [gruposIngredientes, setGruposIngredientes] = useState<any[]>([]);
    const [setores, setSetores] = useState<any[]>([]);
    const [equipamentos, setEquipamentos] = useState<any[]>([]);

    // Inputs
    const [novoLocal, setNovoLocal] = useState('');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [novoSetor, setNovoSetor] = useState('');
    const [novoGrupoEquip, setNovoGrupoEquip] = useState('');
    const [novaCategoriaEquip, setNovaCategoriaEquip] = useState('');
    const [novaSubCategoriaEquip, setNovaSubCategoriaEquip] = useState('');
    const [grupoEquipParaAdicionar, setGrupoEquipParaAdicionar] = useState('');
    const [categoriaPaiId, setCategoriaPaiId] = useState<string | null>(null);
    const [expandedCategorias, setExpandedCategorias] = useState<string[]>([]);
    const [novaSubCategoriaIngrediente, setNovaSubCategoriaIngrediente] = useState('');
    const [categoriaPaiSubIngrediente, setCategoriaPaiSubIngrediente] = useState<string | null>(null);
    const [modalidadeParaNovaCategoria, setModalidadeParaNovaCategoria] = useState<string | null>(null);
    const [expandedModalityIds, setExpandedModalityIds] = useState<string[]>([]);

    // Feedback visual
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });

    // Edição
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editEquipDialogOpen, setEditEquipDialogOpen] = useState(false);
    const [equipamentoParaEditar, setEquipamentoParaEditar] = useState<any>(null);
    const [localParaEditar, setLocalParaEditar] = useState<any>(null);
    const [editNome, setEditNome] = useState('');
    const [editCategorias, setEditCategorias] = useState<string[]>([]);
    const [editEquipamentoConfigId, setEditEquipamentoConfigId] = useState<string | null>(null);
    const [originalEquipId, setOriginalEquipId] = useState<string | null>(null);

    // Estado para campos de equipamento
    const [editEquipFrequencia, setEditEquipFrequencia] = useState(2);
    const [editEquipTempMin, setEditEquipTempMin] = useState<string>('');
    const [editEquipTempMax, setEditEquipTempMax] = useState<string>('');
    const [editEquipHorarios, setEditEquipHorarios] = useState<string[]>([]);
    
    // Quick Add Equipamento
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [qaGrupo, setQaGrupo] = useState('Temperaturas');
    const [qaCategoria, setQaCategoria] = useState('');
    const [qaSub, setQaSub] = useState('');
    const [qaCategoriaPaiId, setQaCategoriaPaiId] = useState<string | null>(null);

    const loadDados = useCallback(async () => {
        if (!activeClientId || !ctxUnidadeId) return;
        setLoading(true);
        try {
            const [localesRes, catRes, setoresRes, equipRes, gruposRes] = await Promise.all([
                (supabase as any).from('cliente_locais_estoque').select('*').eq('unidade_id', ctxUnidadeId).order('nome'),
                (supabase as any).from('cliente_categorias_produto').select('*').eq('cliente_id', activeClientId).order('nome'),
                (supabase as any).from('cliente_setores_producao').select('*').eq('cliente_id', activeClientId).order('nome'),
                (supabase as any).from('cliente_equipamentos_config').select('*').eq('cliente_id', activeClientId).order('grupo, nome'),
                (supabase as any).from('ingredientes_grupos').select('*').eq('cliente_id', activeClientId).order('nome')
            ]);

            setLocais(localesRes.data || []);
            setCategorias(catRes.data || []);
            setGruposIngredientes(gruposRes.data || []);
            setSetores(setoresRes.data || []);
            setEquipamentos(equipRes.data || []);
        } catch (err: any) {
            console.error(err);
            setMsg({ open: true, text: 'Erro ao carregar dados.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [activeClientId, ctxUnidadeId]);

    useEffect(() => {
        loadDados();
    }, [loadDados]);

    // --- FUNÇÕES DE LOCAIS ---
    const handleAddLocal = async () => {
        if (!novoLocal.trim() || !ctxUnidadeId) return;
        try {
            const { error } = await (supabase as any).from('cliente_locais_estoque')
                .insert({
                    unidade_id: ctxUnidadeId,
                    cliente_id: activeClientId,
                    nome: novoLocal.trim(),
                    ativo: true,
                    categorias_permitidas: categoriasSelecionadas,
                    equipamento_config_id: null
                });
            if (error) throw error;
            setMsg({ open: true, text: 'Local adicionado!', type: 'success' });
            setNovoLocal('');
            setCategoriasSelecionadas([]);
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar: ' + err.message, type: 'error' });
        }
    };

    const handleRemoveLocal = async (id: string) => {
        if (!confirm('Deseja excluir este local?')) return;
        try {
            const { error } = await (supabase as any).from('cliente_locais_estoque').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
        }
    };

    const handleOpenEdit = (local: any) => {
        setLocalParaEditar(local);
        setEditNome(local.nome);
        setEditCategorias(local.categorias_permitidas || []);
        setEditEquipamentoConfigId(local.equipamento_config_id || null);
        setOriginalEquipId(local.equipamento_config_id || null);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editNome.trim()) return;
        try {
            const { error } = await (supabase as any)
                .from('cliente_locais_estoque')
                .update({ 
                    nome: editNome.trim(), 
                    categorias_permitidas: editCategorias,
                    equipamento_config_id: editEquipamentoConfigId
                })
                .eq('id', localParaEditar.id);
            if (error) throw error;
            setMsg({ open: true, text: 'Local atualizado!', type: 'success' });
            setEditDialogOpen(false);
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao atualizar.', type: 'error' });
        }
    };

    // --- FUNÇÕES DE CATEGORIAS ---
    const handleAddCategoria = async (modality: string) => {
        if (!novaCategoria.trim() || !activeClientId) return;
        try {
            const { error } = await (supabase as any).from('cliente_categorias_produto')
                .insert({ 
                    cliente_id: activeClientId, 
                    nome: novaCategoria.trim(),
                    modalidade: modality 
                });
            if (error) throw error;
            setMsg({ open: true, text: 'Categoria adicionada!', type: 'success' });
            setNovaCategoria('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar.', type: 'error' });
        }
    };

    const handleRemoveCategoria = async (id: string) => {
        if (!confirm('Deseja excluir esta categoria?')) return;
        try {
            const { error } = await (supabase as any).from('cliente_categorias_produto').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
        }
    };

    const handleAddSubCategoriaIngrediente = async (categoriaId: string) => {
        if (!novaSubCategoriaIngrediente.trim() || !activeClientId) return;
        try {
            const { error } = await (supabase as any).from('ingredientes_grupos')
                .insert({ 
                    cliente_id: activeClientId, 
                    categoria_id: categoriaId,
                    nome: novaSubCategoriaIngrediente.trim() 
                });
            if (error) throw error;
            setMsg({ open: true, text: 'Subcategoria adicionada!', type: 'success' });
            setNovaSubCategoriaIngrediente('');
            setCategoriaPaiSubIngrediente(null);
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar.', type: 'error' });
        }
    };

    const handleRemoveSubCategoriaIngrediente = async (id: string) => {
        if (!confirm('Deseja excluir esta subcategoria?')) return;
        try {
            const { error } = await (supabase as any).from('ingredientes_grupos').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
        }
    };

    // --- FUNÇÕES DE SETORES ---
    const handleAddSetor = async () => {
        if (!novoSetor.trim() || !activeClientId) return;
        try {
            const { error } = await (supabase as any).from('cliente_setores_producao')
                .insert({ cliente_id: activeClientId, nome: novoSetor.trim() });
            if (error) throw error;
            setMsg({ open: true, text: 'Setor adicionado!', type: 'success' });
            setNovoSetor('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar.', type: 'error' });
        }
    };

    const handleRemoveSetor = async (id: string) => {
        if (!confirm('Deseja excluir este setor?')) return;
        try {
            const { error } = await (supabase as any).from('cliente_setores_producao').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
        }
    };

    // --- FUNÇÕES DE EQUIPAMENTOS ---
    const handleAddEquipamento = async (grupoNome?: string, parentId?: string) => {
        const grupo = grupoNome || novoGrupoEquip.trim();
        const nome = parentId ? novaSubCategoriaEquip.trim() : (grupoEquipParaAdicionar === grupo ? novaCategoriaEquip.trim() : novaCategoriaEquip.trim());
        
        const finalNome = parentId ? novaSubCategoriaEquip.trim() : novaCategoriaEquip.trim();

        if (!grupo || !finalNome || !activeClientId) return;
        
        try {
            const { error } = await (supabase as any).from('cliente_equipamentos_config')
                .insert({ 
                    cliente_id: activeClientId, 
                    grupo, 
                    nome: finalNome,
                    parent_id: parentId || null
                });
            if (error) throw error;
            setMsg({ open: true, text: 'Configuração adicionada!', type: 'success' });
            setNovaCategoriaEquip('');
            setNovaSubCategoriaEquip('');
            setNovoGrupoEquip('');
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao salvar.', type: 'error' });
        }
    };

    const toggleExpandCategoria = (id: string) => {
        setExpandedCategorias((prev: string[]) => 
            prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
        );
    };
    
    const toggleModality = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setExpandedModalityIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleRemoveEquipamento = async (id: string) => {
        if (!confirm('Deseja excluir este item?')) return;
        try {
            const { error } = await (supabase as any).from('cliente_equipamentos_config').delete().eq('id', id);
            if (error) throw error;
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
        }
    };

    const handleOpenEditEquipamento = (equip: any) => {
        setEquipamentoParaEditar(equip);
        setEditNome(equip.nome);
        setEditEquipFrequencia(equip.frequencia_diaria || 2);
        setEditEquipTempMin(equip.temp_ideal_min?.toString() || '');
        setEditEquipTempMax(equip.temp_ideal_max?.toString() || '');
        setEditEquipHorarios(equip.horarios_afericao || []);
        setEditEquipDialogOpen(true);
    };

    const handleSaveEquipamentoEdit = async () => {
        if (!editNome.trim() || !equipamentoParaEditar) return;
        try {
            const { error } = await (supabase as any)
                .from('cliente_equipamentos_config')
                .update({ 
                    nome: editNome.trim(),
                    frequencia_diaria: editEquipFrequencia,
                    temp_ideal_min: editEquipTempMin === '' ? null : parseFloat(editEquipTempMin),
                    temp_ideal_max: editEquipTempMax === '' ? null : parseFloat(editEquipTempMax),
                    horarios_afericao: editEquipHorarios
                })
                .eq('id', equipamentoParaEditar.id);

            if (error) throw error;
            setMsg({ open: true, text: 'Equipamento atualizado!', type: 'success' });
            setEditEquipDialogOpen(false);
            loadDados();
        } catch (err: any) {
            setMsg({ open: true, text: 'Erro ao atualizar: ' + err.message, type: 'error' });
        }
    };

    const handleQuickAddEquip = async () => {
        if (!qaGrupo || !qaCategoria || !activeClientId) return;
        setLoading(true);
        try {
            // 1. Garantir que a categoria pai existe
            let paiId = qaCategoriaPaiId;
            if (!paiId) {
                const { data: catExistente } = await (supabase as any)
                    .from('cliente_equipamentos_config')
                    .select('id')
                    .eq('cliente_id', activeClientId)
                    .eq('grupo', qaGrupo)
                    .eq('nome', qaCategoria)
                    .is('parent_id', null)
                    .single();
                
                if (catExistente) {
                    paiId = catExistente.id;
                } else {
                    const { data: novaCat, error: errCat } = await (supabase as any)
                        .from('cliente_equipamentos_config')
                        .insert({ cliente_id: activeClientId, grupo: qaGrupo, nome: qaCategoria })
                        .select()
                        .single();
                    if (errCat) throw errCat;
                    paiId = novaCat.id;
                }
            }

            // 2. Inserir a sub-categoria se houver nome
            if (qaSub.trim()) {
                const { data: novaSub, error: errSub } = await (supabase as any)
                    .from('cliente_equipamentos_config')
                    .insert({ 
                        cliente_id: activeClientId, 
                        grupo: qaGrupo, 
                        nome: qaSub.trim(),
                        parent_id: paiId
                    })
                    .select()
                    .single();
                if (errSub) throw errSub;
                setEditEquipamentoConfigId(novaSub.id);
            } else {
                setEditEquipamentoConfigId(paiId);
            }

            setMsg({ open: true, text: 'Equipamento criado e vinculado!', type: 'success' });
            setQuickAddOpen(false);
            setQaCategoria('');
            setQaSub('');
            await loadDados();
        } catch (err: any) {
            console.error(err);
            setMsg({ open: true, text: 'Erro ao criar equipamento.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            
            {/* HEADER SIMPLIFICADO */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                    <ArrowLeft size={20} />
                </IconButton>
                <Box>
                    <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
                        Configurações da Unidade
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie estoques, categorias e setores desta unidade operacional
                    </Typography>
                </Box>
            </Box>

            {/* SEÇÕES EM ACCORDIONS VERTICAIS */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                
                {/* 1. LOCAIS DE ESTOQUE */}
                <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px !important', overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                <MapPin size={22} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">Locais de Armazenamento</Typography>
                                <Typography variant="caption" color="text.secondary">Câmaras, geladeiras, prateleiras e estoques físicos</Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        {/* ADICIONAR LOCAL */}
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <TextField size="small" fullWidth placeholder="Nome (Ex: Geladeira 01)" value={novoLocal} onChange={e => setNovoLocal(e.target.value)} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Categorias Permitidas</InputLabel>
                                        <Select
                                            multiple
                                            value={categoriasSelecionadas}
                                            onChange={(e) => {
                                                const val = typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]);
                                                const filteredVal = val.filter(v => v !== '');
                                                
                                                // Lógica de "Selecionar Tudo"
                                                const lastSelected = filteredVal.length > categoriasSelecionadas.length 
                                                    ? filteredVal.find(v => !categoriasSelecionadas.includes(v))
                                                    : categoriasSelecionadas.find(v => !filteredVal.includes(v));
                                                
                                                const modality = CATEGORIAS_COMPRAS.find(m => m.id === lastSelected);
                                                if (modality) {
                                                    const childrenIds = categorias.filter(c => c.modalidade === modality.id || (modality.id === 'ALIMENTOS' && !c.modalidade)).map(c => c.id);
                                                    if (filteredVal.includes(modality.id)) {
                                                        // Adicionando tudo
                                                        setCategoriasSelecionadas(Array.from(new Set([...filteredVal, ...childrenIds])));
                                                    } else {
                                                        // Removendo tudo
                                                        setCategoriasSelecionadas(filteredVal.filter(v => !childrenIds.includes(v)));
                                                    }
                                                } else {
                                                    setCategoriasSelecionadas(filteredVal);
                                                }
                                            }}
                                            input={<OutlinedInput label="Categorias Permitidas" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((val) => (
                                                        <Chip 
                                                            key={val} 
                                                            label={CATEGORIAS_COMPRAS.find(c => c.id === val)?.nome || categorias.find(c => c.id === val)?.nome || val} 
                                                            size="small" 
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {CATEGORIAS_COMPRAS.map((mod) => [
                                                <MenuItem 
                                                    key={`header-add-${mod.id}`} 
                                                    value=""
                                                    onClick={(e) => toggleModality(mod.id, e)}
                                                    sx={{ 
                                                        px: 2, py: 1, 
                                                        bgcolor: alpha(mod.color, 0.05), 
                                                        borderBottom: '1px solid', 
                                                        borderColor: alpha(mod.color, 0.1),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        '&:hover': { bgcolor: alpha(mod.color, 0.1) },
                                                        // Precisamos forçar o MenuItem a agir como header e não fechar
                                                        minHeight: 'auto',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight="900" sx={{ color: mod.color, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                                                        {mod.nome}
                                                    </Typography>
                                                    {expandedModalityIds.includes(mod.id) ? <ChevronDown size={14} color={mod.color} /> : <ChevronRight size={14} color={mod.color} />}
                                                </MenuItem>,
                                                expandedModalityIds.includes(mod.id) && (
                                                    <MenuItem key={mod.id} value={mod.id} sx={{ fontWeight: 'bold', color: mod.color, pl: 3 }}>
                                                        <Checkbox checked={categoriasSelecionadas.includes(mod.id)} />
                                                        <ListItemText primary={`Selecionar Tudo de ${mod.nome}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                                                    </MenuItem>
                                                ),
                                                ...((expandedModalityIds.includes(mod.id)) 
                                                    ? categorias.filter(c => c.modalidade === mod.id || (mod.id === 'ALIMENTOS' && !c.modalidade)).map(cat => (
                                                        <MenuItem key={cat.id} value={cat.id} sx={{ pl: 6 }}>
                                                            <Checkbox checked={categoriasSelecionadas.includes(cat.id)} />
                                                            <ListItemText primary={cat.nome} primaryTypographyProps={{ variant: 'body2' }} />
                                                        </MenuItem>
                                                    ))
                                                    : []
                                                )
                                            ])}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <Button fullWidth variant="contained" onClick={handleAddLocal} disabled={!novoLocal.trim()} sx={{ height: 40 }}>
                                        Adicionar
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>

                        <List sx={{ p: 0 }}>
                            {loading ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                            ) : locais.length === 0 ? (
                                <Box sx={{ p: 6, textAlign: 'center', opacity: 0.5 }}>
                                    <Typography variant="body2">Nenhum local cadastrado para esta unidade.</Typography>
                                </Box>
                            ) : (
                                locais.map((local) => (
                                    <ListItem key={local.id} divider sx={{ py: 2, px: 3 }}>
                                        <ListItemIcon sx={{ minWidth: 44 }}>
                                            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                                <MapPin size={18} />
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={local.nome}
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" display="block">
                                                        {local.categorias_permitidas?.length > 0 
                                                            ? local.categorias_permitidas.map((id: string) => 
                                                                CATEGORIAS_COMPRAS.find(c => c.id === id)?.nome || 
                                                                categorias.find(c => c.id === id)?.nome || 
                                                                id
                                                            ).join(' • ') 
                                                            : 'Acesso Global'}
                                                    </Typography>
                                                    {local.equipamento_config_id && (
                                                        <Chip 
                                                            size="small" 
                                                            icon={<Settings size={12} />} 
                                                            label={`Monitorado: ${equipamentos.find(e => e.id === local.equipamento_config_id)?.nome || 'Equipamento'}`} 
                                                            sx={{ height: 20, fontSize: '0.65rem', mt: 0.5, color: 'info.main', borderColor: alpha(theme.palette.info.main, 0.3) }}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            primaryTypographyProps={{ fontWeight: 700 }}
                                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton onClick={() => handleOpenEdit(local)} size="small" sx={{ mr: 1, color: 'primary.main' }}><Edit size={16} /></IconButton>
                                            <IconButton onClick={() => handleRemoveLocal(local.id)} size="small" sx={{ color: 'error.light' }}><Trash2 size={16} /></IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </AccordionDetails>
                </Accordion>

                {/* 2. CATEGORIAS DE PRODUTO */}
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px !important', overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(theme.palette.success.main, 0.03), py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'success.main' }}>
                                <Tag size={22} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">Categorias de Insumos</Typography>
                                <Typography variant="caption" color="text.secondary">Organize produtos por modalidade de compra e uso</Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {CATEGORIAS_COMPRAS.map((mod) => (
                                <Grid item xs={12} md={6} lg={4} key={mod.id}>
                                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ p: 1.5, bgcolor: alpha(mod.color, 0.05), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: mod.color }} />
                                                <Typography variant="body2" fontWeight="700">{mod.nome}</Typography>
                                            </Box>
                                            <Chip label={categorias.filter(c => c.modalidade === mod.id || (mod.id === 'ALIMENTOS' && !c.modalidade)).length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                        </Box>
                                        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                                            <TextField 
                                                size="small" 
                                                fullWidth 
                                                placeholder={mod.id === 'ALIMENTOS' ? "Novo Grupo (Ex: Farinhas...)" : "Adicionar..."} 
                                                value={modalidadeParaNovaCategoria === mod.id ? novaCategoria : ''} 
                                                onChange={e => { setModalidadeParaNovaCategoria(mod.id); setNovaCategoria(e.target.value); }}
                                                onKeyDown={e => e.key === 'Enter' && handleAddCategoria(mod.id)}
                                            />
                                            <Button variant="contained" size="small" onClick={() => handleAddCategoria(mod.id)} sx={{ minWidth: 36, bgcolor: mod.color, '&:hover': { bgcolor: mod.color, opacity: 0.9 } }}>
                                                <Plus size={16} />
                                            </Button>
                                        </Box>
                                        <List dense sx={{ maxHeight: mod.id === 'ALIMENTOS' ? 400 : 200, overflow: 'auto' }}>
                                            {categorias.filter(c => c.modalidade === mod.id || (mod.id === 'ALIMENTOS' && !c.modalidade)).map(cat => (
                                                <Box key={cat.id}>
                                                    <ListItem sx={{ py: 0.5 }}>
                                                        {mod.id === 'ALIMENTOS' && (
                                                            <IconButton size="small" onClick={() => toggleExpandCategoria(cat.id)} sx={{ mr: 1, p: 0.5 }}>
                                                                {expandedCategorias.includes(cat.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            </IconButton>
                                                        )}
                                                        <ListItemText 
                                                            primary={cat.nome} 
                                                            primaryTypographyProps={{ variant: 'caption', fontWeight: 600, color: mod.id === 'ALIMENTOS' ? 'primary.main' : 'text.primary' }} 
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton size="small" onClick={() => handleRemoveCategoria(cat.id)}><Trash2 size={12} /></IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                    
                                                    {mod.id === 'ALIMENTOS' && expandedCategorias.includes(cat.id) && (
                                                        <Box sx={{ pl: 4, pr: 1, pb: 1 }}>
                                                            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                                <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>Subcategorias (Nível 3)</Typography>
                                                                <List dense>
                                                                    {gruposIngredientes.filter(g => g.categoria_id === cat.id).map(grp => (
                                                                        <ListItem key={grp.id} sx={{ py: 0, px: 1 }}>
                                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                                            </ListItemIcon>
                                                                            <ListItemText primary={grp.nome} primaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }} />
                                                                            <ListItemSecondaryAction>
                                                                                <IconButton size="small" onClick={() => handleRemoveSubCategoriaIngrediente(grp.id)}><Trash2 size={10} /></IconButton>
                                                                            </ListItemSecondaryAction>
                                                                        </ListItem>
                                                                    ))}
                                                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                                        <TextField 
                                                                            size="small" 
                                                                            fullWidth 
                                                                            placeholder="Nova Subcategoria..." 
                                                                            value={categoriaPaiSubIngrediente === cat.id ? novaSubCategoriaIngrediente : ''}
                                                                            onChange={e => { setCategoriaPaiSubIngrediente(cat.id); setNovaSubCategoriaIngrediente(e.target.value); }}
                                                                            onKeyDown={e => e.key === 'Enter' && handleAddSubCategoriaIngrediente(cat.id)}
                                                                            inputProps={{ style: { fontSize: '0.7rem', padding: '4px 8px' } }}
                                                                        />
                                                                        <Button variant="contained" size="small" onClick={() => handleAddSubCategoriaIngrediente(cat.id)} sx={{ minWidth: 28, height: 28 }}>
                                                                            <Plus size={14} />
                                                                        </Button>
                                                                    </Box>
                                                                </List>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                            {categorias.filter(c => c.modalidade === mod.id || (mod.id === 'ALIMENTOS' && !c.modalidade)).length === 0 && (
                                                <Typography variant="caption" color="text.disabled" sx={{ p: 2, display: 'block', textAlign: 'center' }}>Vazio</Typography>
                                            )}
                                        </List>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* 3. SETORES DE OPERAÇÃO */}
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px !important', overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.03), py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(theme.palette.warning.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'warning.main' }}>
                                <Factory size={22} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">Setores de Operação</Typography>
                                <Typography variant="caption" color="text.secondary">Defina as origens/destinos internos das saídas de estoque</Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <TextField fullWidth size="small" placeholder="Novo Setor (Ex: Cozinha, Salão, Delivery...)" value={novoSetor} onChange={e => setNovoSetor(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSetor()} />
                            <Button variant="contained" color="warning" onClick={handleAddSetor} disabled={!novoSetor.trim()}>Adicionar</Button>
                        </Box>
                        <Grid container spacing={1}>
                            {setores.map(s => (
                                <Grid item key={s.id}>
                                    <Chip 
                                        label={s.nome} 
                                        onDelete={() => handleRemoveSetor(s.id)} 
                                        sx={{ 
                                            fontWeight: 600, 
                                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                                            color: 'warning.dark',
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.warning.main, 0.2)
                                        }} 
                                    />
                                </Grid>
                            ))}
                            {setores.length === 0 && (
                                <Box sx={{ p: 2, width: '100%', textAlign: 'center', opacity: 0.5 }}>
                                    <Typography variant="body2">Nenhum setor cadastrado.</Typography>
                                </Box>
                            )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* 4. EQUIPAMENTOS (TEMPERATURAS & REGULAGEM) */}
                <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px !important', overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(theme.palette.info.main, 0.03), py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha(theme.palette.info.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'info.main' }}>
                                <Settings size={22} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">Equipamentos</Typography>
                                <Typography variant="caption" color="text.secondary">Gerencie grupos e categorias de equipamentos (Temperaturas, Regulagem, etc)</Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        {/* CRIAR NOVO GRUPO */}
                        <Box sx={{ mb: 4, p: 2, bgcolor: alpha(theme.palette.info.main, 0.02), borderRadius: 3, border: '1px dashed', borderColor: 'info.light' }}>
                            <Typography variant="caption" fontWeight="bold" color="info.main" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>Criar Novo Grupo de Equipamento</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField fullWidth size="small" placeholder="Nome do Grupo (Ex: Temperaturas, Motores...)" value={novoGrupoEquip} onChange={e => setNovoGrupoEquip(e.target.value)} />
                                <TextField fullWidth size="small" placeholder="Primeira Categoria (Ex: Refrigerados, RPM...)" value={novaCategoriaEquip} onChange={e => setNovaCategoriaEquip(e.target.value)} />
                                <Button variant="contained" color="info" onClick={() => handleAddEquipamento()} disabled={!novoGrupoEquip.trim() || !novaCategoriaEquip.trim()}>Adicionar</Button>
                            </Box>
                        </Box>

                        <Grid container spacing={2}>
                            {/* GRUPOS EXISTENTES */}
                            {Array.from(new Set(equipamentos.map(e => e.grupo))).map(grupo => (
                                <Grid item xs={12} md={6} key={grupo}>
                                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.05), borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" fontWeight="700">{grupo}</Typography>
                                            <Chip label={equipamentos.filter(e => e.grupo === grupo).length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                        </Box>
                                        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                                            <TextField 
                                                size="small" 
                                                fullWidth 
                                                placeholder="Nova Categoria..." 
                                                value={grupoEquipParaAdicionar === grupo ? novaCategoriaEquip : ''} 
                                                onChange={e => { setGrupoEquipParaAdicionar(grupo); setNovaCategoriaEquip(e.target.value); }}
                                                onKeyDown={e => e.key === 'Enter' && handleAddEquipamento(grupo)}
                                            />
                                            <Button variant="contained" size="small" onClick={() => handleAddEquipamento(grupo)} sx={{ minWidth: 36, bgcolor: 'info.main' }}>
                                                <Plus size={16} />
                                            </Button>
                                        </Box>
                                        <List dense>
                                            {equipamentos.filter(e => e.grupo === grupo && !e.parent_id).map(cat => (
                                                <Box key={cat.id}>
                                                    <ListItem sx={{ py: 0.5, borderLeft: '3px solid', borderColor: alpha(theme.palette.info.main, 0.2), mb: 0.5 }}>
                                                        <IconButton size="small" onClick={() => toggleExpandCategoria(cat.id)} sx={{ mr: 1, p: 0.5 }}>
                                                            {expandedCategorias.includes(cat.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </IconButton>
                                                        <ListItemText 
                                                            primary={cat.nome} 
                                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} 
                                                        />
                                                        <ListItemSecondaryAction>
                                                            <IconButton size="small" onClick={() => handleOpenEditEquipamento(cat)} sx={{ mr: 1, color: 'primary.main' }}><Edit size={12} /></IconButton>
                                                            <IconButton size="small" onClick={() => handleRemoveEquipamento(cat.id)}><Trash2 size={12} /></IconButton>
                                                        </ListItemSecondaryAction>
                                                    </ListItem>
                                                    
                                                    {expandedCategorias.includes(cat.id) && (
                                                        <Box sx={{ pl: 4, mb: 1, mt: 0.5 }}>
                                                            <List dense sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                                                                {equipamentos.filter(e => e.parent_id === cat.id).map(sub => (
                                                                    <ListItem key={sub.id} sx={{ py: 0.2 }}>
                                                                        <ListItemIcon sx={{ minWidth: 20 }}>
                                                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'info.main' }} />
                                                                        </ListItemIcon>
                                                                        <ListItemText 
                                                                            primary={sub.nome} 
                                                                            primaryTypographyProps={{ variant: 'caption', fontWeight: 600, color: 'info.dark' }} 
                                                                        />
                                                                        <ListItemSecondaryAction>
                                                                            <IconButton size="small" onClick={() => handleOpenEditEquipamento(sub)} sx={{ mr: 1, color: 'primary.main' }}><Edit size={10} /></IconButton>
                                                                            <IconButton size="small" onClick={() => handleRemoveEquipamento(sub.id)}><Trash2 size={10} /></IconButton>
                                                                        </ListItemSecondaryAction>
                                                                    </ListItem>
                                                                ))}
                                                                <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
                                                                    <TextField 
                                                                        size="small" 
                                                                        fullWidth 
                                                                        placeholder="Nova Sub-categoria..." 
                                                                        value={categoriaPaiId === cat.id ? novaSubCategoriaEquip : ''}
                                                                        onChange={e => { setCategoriaPaiId(cat.id); setNovaSubCategoriaEquip(e.target.value); }}
                                                                        onKeyDown={e => e.key === 'Enter' && handleAddEquipamento(grupo, cat.id)}
                                                                        sx={{ 
                                                                            '& .MuiOutlinedInput-root': { bgcolor: 'white' }
                                                                        }}
                                                                        inputProps={{ style: { fontSize: '0.75rem' } }}
                                                                    />
                                                                    <Button variant="contained" size="small" color="info" onClick={() => handleAddEquipamento(grupo, cat.id)} sx={{ minWidth: 32, p: 0.5 }}>
                                                                        <Plus size={14} />
                                                                    </Button>
                                                                </Box>
                                                            </List>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </List>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>

            </Box>

            {/* DIALOG DE EDIÇÃO DE LOCAL */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Editar Local</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField label="Nome do Local" fullWidth size="small" value={editNome} onChange={(e) => setEditNome(e.target.value)} autoFocus />
                        <FormControl fullWidth size="small">
                            <InputLabel>Categorias Permitidas</InputLabel>
                            <Select 
                                multiple 
                                value={editCategorias} 
                                onChange={(e) => {
                                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]);
                                    const filteredVal = val.filter(v => v !== '');
                                    
                                    // Lógica de "Selecionar Tudo"
                                    const lastSelected = filteredVal.length > editCategorias.length 
                                        ? filteredVal.find(v => !editCategorias.includes(v))
                                        : editCategorias.find(v => !filteredVal.includes(v));
                                    
                                    const modality = CATEGORIAS_COMPRAS.find(m => m.id === lastSelected);
                                    if (modality) {
                                        const childrenIds = categorias.filter(c => c.modalidade === modality.id || (modality.id === 'ALIMENTOS' && !c.modalidade)).map(c => c.id);
                                        if (filteredVal.includes(modality.id)) {
                                            // Adicionando tudo
                                            setEditCategorias(Array.from(new Set([...filteredVal, ...childrenIds])));
                                        } else {
                                            // Removendo tudo
                                            setEditCategorias(filteredVal.filter(v => !childrenIds.includes(v)));
                                        }
                                    } else {
                                        setEditCategorias(filteredVal);
                                    }
                                }} 
                                input={<OutlinedInput label="Categorias Permitidas" />} 
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((val) => (
                                            <Chip 
                                                key={val} 
                                                label={CATEGORIAS_COMPRAS.find(c => c.id === val)?.nome || categorias.find(c => c.id === val)?.nome || val} 
                                                size="small" 
                                            />
                                        ))}
                                    </Box>
                                )}
                            >
                                {CATEGORIAS_COMPRAS.map((mod) => [
                                    <MenuItem 
                                        key={`header-${mod.id}`} 
                                        value=""
                                        onClick={(e) => toggleModality(mod.id, e)}
                                        sx={{ 
                                            px: 2, py: 1, 
                                            bgcolor: alpha(mod.color, 0.05), 
                                            borderBottom: '1px solid', 
                                            borderColor: alpha(mod.color, 0.1),
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            '&:hover': { bgcolor: alpha(mod.color, 0.1) },
                                            minHeight: 'auto',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight="900" sx={{ color: mod.color, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                                            {mod.nome}
                                        </Typography>
                                        {expandedModalityIds.includes(mod.id) ? <ChevronDown size={14} color={mod.color} /> : <ChevronRight size={14} color={mod.color} />}
                                    </MenuItem>,
                                    expandedModalityIds.includes(mod.id) && (
                                        <MenuItem key={mod.id} value={mod.id} sx={{ fontWeight: 'bold', color: mod.color, pl: 3 }}>
                                            <Checkbox checked={editCategorias.includes(mod.id)} />
                                            <ListItemText primary={`Selecionar Tudo de ${mod.nome}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                                        </MenuItem>
                                    ),
                                    ...((expandedModalityIds.includes(mod.id)) 
                                        ? categorias.filter(c => c.modalidade === mod.id || (mod.id === 'ALIMENTOS' && !c.modalidade)).map(cat => (
                                            <MenuItem key={cat.id} value={cat.id} sx={{ pl: 6 }}>
                                                <Checkbox checked={editCategorias.includes(cat.id)} />
                                                <ListItemText primary={cat.nome} primaryTypographyProps={{ variant: 'body2' }} />
                                            </MenuItem>
                                        ))
                                        : []
                                    )
                                ])}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <InputLabel shrink sx={{ position: 'relative', transform: 'none', ml: 0 }}>Vincular a Equipamento (Temperatura)</InputLabel>
                                <Button size="small" variant="text" startIcon={<Plus size={14} />} onClick={() => setQuickAddOpen(true)} sx={{ height: 24, fontSize: '0.65rem' }}>
                                    Cadastrar Novo
                                </Button>
                            </Box>
                            <Select 
                                value={editEquipamentoConfigId || ''} 
                                onChange={(e) => {
                                    const newVal = e.target.value || null;
                                    if (originalEquipId && newVal !== originalEquipId) {
                                        if (!confirm('Este local já possui um equipamento vinculado. Deseja realmente substituir pelo novo equipamento selecionado?')) {
                                            return;
                                        }
                                    }
                                    setEditEquipamentoConfigId(newVal);
                                }} 
                                input={<OutlinedInput />}
                                displayEmpty
                            >
                                <MenuItem value=""><em>Nenhum</em></MenuItem>
                                {equipamentos
                                    .filter(e => e.grupo === 'Temperaturas' && !e.parent_id)
                                    .map((cat) => [
                                        <MenuItem key={cat.id} value={cat.id} sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                                            {cat.nome} (Categoria)
                                        </MenuItem>,
                                        ...equipamentos
                                            .filter(sub => sub.parent_id === cat.id)
                                            .map(sub => (
                                                <MenuItem key={sub.id} value={sub.id} sx={{ pl: 4 }}>
                                                    {sub.nome}
                                                </MenuItem>
                                            ))
                                    ])}
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                                Caso não encontre a opção, use o botão "Cadastrar Novo".
                            </Typography>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Salvar Alterações</Button>
                </DialogActions>
            </Dialog>

            {/* QUICK ADD EQUIPAMENTO */}
            <Dialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Cadastrar Novo Equipamento</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">Crie uma nova categoria de temperatura para vincular a este local.</Typography>
                        
                        <FormControl fullWidth size="small">
                            <InputLabel>Grupo</InputLabel>
                            <Select value={qaGrupo} label="Grupo" onChange={e => setQaGrupo(e.target.value)}>
                                {Array.from(new Set(equipamentos.map(e => e.grupo))).map(g => (
                                    <MenuItem key={g} value={g}>{g}</MenuItem>
                                ))}
                                <MenuItem value="Temperaturas">Temperaturas</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Categoria (Pai)</InputLabel>
                            <Select 
                                value={qaCategoriaPaiId || ''} 
                                label="Categoria (Pai)" 
                                onChange={e => {
                                    const val = e.target.value;
                                    setQaCategoriaPaiId(val || null);
                                    if (val) {
                                        const cat = equipamentos.find(eq => eq.id === val);
                                        if (cat) setQaCategoria(cat.nome);
                                    }
                                }}
                            >
                                <MenuItem value=""><em>Criar Nova...</em></MenuItem>
                                {equipamentos.filter(e => e.grupo === qaGrupo && !e.parent_id).map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {!qaCategoriaPaiId && (
                            <TextField 
                                label="Nome da Nova Categoria" 
                                fullWidth 
                                size="small" 
                                placeholder="Ex: Refrigerados, Congelados..."
                                value={qaCategoria} 
                                onChange={e => setQaCategoria(e.target.value)} 
                            />
                        )}

                        <TextField 
                            label="Nome da Sub-categoria (Opcional)" 
                            fullWidth 
                            size="small" 
                            placeholder="Ex: Geladeira 01, Câmara 05..."
                            value={qaSub} 
                            onChange={e => setQaSub(e.target.value)} 
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setQuickAddOpen(false)} color="inherit">Cancelar</Button>
                    <Button 
                        onClick={handleQuickAddEquip} 
                        variant="contained" 
                        color="info" 
                        disabled={!qaGrupo || (!qaCategoriaPaiId && !qaCategoria.trim())}
                    >
                        Criar e Vincular
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOG DE EDIÇÃO DE EQUIPAMENTO */}
            <Dialog open={editEquipDialogOpen} onClose={() => setEditEquipDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Configurar Equipamento</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField 
                            label="Nome do Equipamento" 
                            fullWidth 
                            size="small" 
                            value={editNome} 
                            onChange={(e) => setEditNome(e.target.value)} 
                        />
                        
                        <Divider>
                            <Chip label="Monitoramento" size="small" variant="outlined" />
                        </Divider>

                        <TextField 
                            label="Frequência Diária (Vezes)" 
                            type="number"
                            fullWidth 
                            size="small" 
                            value={editEquipFrequencia} 
                            onChange={(e) => {
                                const newFreq = Math.max(0, parseInt(e.target.value) || 0);
                                setEditEquipFrequencia(newFreq);
                                // Ajustar array de horários
                                setEditEquipHorarios(prev => {
                                    const next = [...prev];
                                    if (newFreq > next.length) {
                                        for (let i = next.length; i < newFreq; i++) next.push('');
                                    } else {
                                        return next.slice(0, newFreq);
                                    }
                                    return next;
                                });
                            }}
                            helperText="Quantas vezes ao dia será aferida a temperatura"
                        />

                        {editEquipFrequencia > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1 }}>
                                <Typography variant="caption" fontWeight="bold" color="info.main">Horários Sugeridos</Typography>
                                <Grid container spacing={1}>
                                    {editEquipHorarios.map((horario, idx) => (
                                        <Grid item xs={6} key={idx}>
                                            <TextField 
                                                label={`Aferição ${idx + 1}`}
                                                type="time"
                                                fullWidth
                                                size="small"
                                                value={horario}
                                                onChange={(e) => {
                                                    const next = [...editEquipHorarios];
                                                    next[idx] = e.target.value;
                                                    setEditEquipHorarios(next);
                                                }}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField 
                                label="Temp. Ideal Mín." 
                                type="number"
                                fullWidth 
                                size="small" 
                                value={editEquipTempMin} 
                                onChange={(e) => setEditEquipTempMin(e.target.value)}
                                InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                            />
                            <TextField 
                                label="Temp. Ideal Máx." 
                                type="number"
                                fullWidth 
                                size="small" 
                                value={editEquipTempMax} 
                                onChange={(e) => setEditEquipTempMax(e.target.value)}
                                InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Esses valores serão usados para validar os registros na produção.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setEditEquipDialogOpen(false)} color="inherit">Cancelar</Button>
                    <Button onClick={handleSaveEquipamentoEdit} variant="contained" color="primary">Salvar Alterações</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={msg.open} autoHideDuration={4000} onClose={() => setMsg({ ...msg, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={msg.type} variant="filled" onClose={() => setMsg({ ...msg, open: false })}>{msg.text}</Alert>
            </Snackbar>
        </Container>
    );
}
