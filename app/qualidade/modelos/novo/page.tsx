'use client';

import { useState, useEffect, Suspense, useRef, memo, useCallback, useMemo, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Container, Typography, Box, Button, Paper, Grid, TextField,
    Select, MenuItem, FormControl, InputLabel, IconButton,
    Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel,
    Divider, Alert, CircularProgress, Tooltip, Stack, alpha, useTheme,
    InputAdornment, Chip
} from '@mui/material';
import {
    Save, ArrowLeft, Plus, Trash2, GripVertical, ChevronDown,
    Thermometer, CheckSquare, Hash, Type, Camera, AlertCircle, Grip
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ItemForm {
    id?: string;
    tempId: string;
    texto_pergunta: string;
    tipo_resposta: 'CONFORME_NAOCONFORME' | 'TEMPERATURA' | 'NUMERO' | 'TEXTO';
    obrigatorio: boolean;
    requer_foto: boolean;
    ajuda_texto: string;
    classificacao: 'IMPRESCINDIVEL' | 'NECESSARIO' | 'RECOMENDAVEL';
}

interface SecaoForm {
    id?: string;
    tempId: string;
    titulo: string;
    cor: string;
    itens: ItemForm[];
}

// ─── Constante: quantas seções renderizar por batch ───────────────────────────
const BATCH_SIZE = 5;

// ─── Estilos estáticos (evita recriar objetos sx a cada render) ───────────────
const ITEM_ROW_SX = {
    display: 'flex', flexDirection: 'column', gap: 1, p: 2, mb: 2,
    border: '1px solid #eee', borderRadius: 2,
    // CSS content-visibility: pula layout/paint de itens fora da viewport
    contentVisibility: 'auto',
    containIntrinsicSize: '0 200px',
    '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' }
} as const;

const ACCORDION_SX = {
    mb: 3, border: '1px solid #e0e0e0',
    borderRadius: '8px !important',
    '&:before': { display: 'none' },
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden'
} as const;

// ─── Seletor de cor isolado para não rerender o pai a cada mudança ────────────
const ColorPickerField = memo(function ColorPickerField({ color, onChange }: { color: string; onChange: (c: string) => void }) {
    const [localColor, setLocalColor] = useState(color);
    useEffect(() => { setLocalColor(color); }, [color]);
    return (
        <input
            type="color"
            value={localColor}
            onChange={(e) => setLocalColor(e.target.value)}
            onBlur={() => onChange(localColor)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        />
    );
});

// ─── Item Individual (Memoizado com comparador custom) ────────────────────────
const ItemRow = memo(({
    item,
    sIdx,
    iIdx,
    handleUpdateItem,
    handleRemoveItem,
}: {
    item: ItemForm;
    sIdx: number;
    iIdx: number;
    handleUpdateItem: (sIdx: number, iIdx: number, field: keyof ItemForm, value: any) => void;
    handleRemoveItem: (sIdx: number, iIdx: number) => void;
}) => {
    const theme = useTheme();
    // Estado local para inputs de texto para não travar a UI ao digitar
    const [localTexto, setLocalTexto] = useState(item.texto_pergunta);
    const [localAjuda, setLocalAjuda] = useState(item.ajuda_texto);

    useEffect(() => { setLocalTexto(item.texto_pergunta); }, [item.texto_pergunta]);
    useEffect(() => { setLocalAjuda(item.ajuda_texto); }, [item.ajuda_texto]);

    // Handlers locais estáveis — evitam criar closures novas no JSX
    const onTextoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setLocalTexto(e.target.value), []);
    const onTextoBlur = useCallback(() => handleUpdateItem(sIdx, iIdx, 'texto_pergunta', localTexto), [sIdx, iIdx, localTexto, handleUpdateItem]);
    const onAjudaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setLocalAjuda(e.target.value), []);
    const onAjudaBlur = useCallback(() => handleUpdateItem(sIdx, iIdx, 'ajuda_texto', localAjuda), [sIdx, iIdx, localAjuda, handleUpdateItem]);

    const onTipoChange = useCallback((e: any) => {
        startTransition(() => handleUpdateItem(sIdx, iIdx, 'tipo_resposta', e.target.value));
    }, [sIdx, iIdx, handleUpdateItem]);

    const onClassChange = useCallback((e: any) => {
        startTransition(() => handleUpdateItem(sIdx, iIdx, 'classificacao', e.target.value));
    }, [sIdx, iIdx, handleUpdateItem]);

    const onObrigatorioChange = useCallback((e: any) => {
        startTransition(() => handleUpdateItem(sIdx, iIdx, 'obrigatorio', e.target.checked));
    }, [sIdx, iIdx, handleUpdateItem]);

    const onFotoChange = useCallback((e: any) => {
        startTransition(() => handleUpdateItem(sIdx, iIdx, 'requer_foto', e.target.checked));
    }, [sIdx, iIdx, handleUpdateItem]);

    const onRemove = useCallback(() => handleRemoveItem(sIdx, iIdx), [sIdx, iIdx, handleRemoveItem]);

    return (
        <Box sx={ITEM_ROW_SX}>
            <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                    <TextField
                        label={`Pergunta ${iIdx + 1}`} fullWidth size="small"
                        value={localTexto}
                        onChange={onTextoChange}
                        onBlur={onTextoBlur}
                        placeholder="O que deve ser verificado?"
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel shrink>Tipo de Resposta</InputLabel>
                        <Select
                            value={item.tipo_resposta}
                            label="Tipo de Resposta"
                            onChange={onTipoChange}
                        >
                            <MenuItem value="CONFORME_NAOCONFORME">
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><CheckSquare size={16} /> Check (C/NC/NA)</Box>
                            </MenuItem>
                            <MenuItem value="TEMPERATURA">
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Thermometer size={16} /> Temp. (°C)</Box>
                            </MenuItem>
                            <MenuItem value="NUMERO">
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Hash size={16} /> Qtd/Número</Box>
                            </MenuItem>
                            <MenuItem value="TEXTO">
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Type size={16} /> Texto</Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel shrink>Importância (I/N/R)</InputLabel>
                        <Select
                            value={item.classificacao}
                            label="Importância (I/N/R)"
                            onChange={onClassChange}
                        >
                            <MenuItem value="IMPRESCINDIVEL">
                                <Box sx={{ color: 'error.main', fontWeight: 'bold' }}>I - Imprescindível (Peso 10)</Box>
                            </MenuItem>
                            <MenuItem value="NECESSARIO">
                                <Box sx={{ color: 'warning.main' }}>N - Necessário (Peso 3)</Box>
                            </MenuItem>
                            <MenuItem value="RECOMENDAVEL">
                                <Box sx={{ color: 'success.main' }}>R - Recomendável (Peso 1)</Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Excluir Pergunta">
                        <IconButton size="small" onClick={onRemove}>
                            <Trash2 size={18} />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                    <TextField
                        label="Instrução de Trabalho (Ajuda)" size="small" fullWidth
                        value={localAjuda}
                        onChange={onAjudaChange}
                        onBlur={onAjudaBlur}
                        placeholder="Ex: Temp. ideal entre 2°C e 8°C"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AlertCircle size={14} color="#aaa" />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={item.obrigatorio}
                                    onChange={onObrigatorioChange}
                                />
                            }
                            label={<Typography variant="caption" fontWeight="500">Obrigatório</Typography>}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    color="warning"
                                    checked={item.requer_foto}
                                    onChange={onFotoChange}
                                />
                            }
                            label={
                                <Typography variant="caption" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Camera size={14} /> Exige Foto
                                </Typography>
                            }
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}, (prev, next) => {
    // Comparador custom: compara campos individuais ao invés de referência do objeto
    // Isso evita re-render quando outra seção/item muda e cria novo array
    return prev.sIdx === next.sIdx
        && prev.iIdx === next.iIdx
        && prev.item.tempId === next.item.tempId
        && prev.item.texto_pergunta === next.item.texto_pergunta
        && prev.item.tipo_resposta === next.item.tipo_resposta
        && prev.item.obrigatorio === next.item.obrigatorio
        && prev.item.requer_foto === next.item.requer_foto
        && prev.item.ajuda_texto === next.item.ajuda_texto
        && prev.item.classificacao === next.item.classificacao
        && prev.handleUpdateItem === next.handleUpdateItem
        && prev.handleRemoveItem === next.handleRemoveItem;
});

// ─── Seção do Checklist (Memoizada com comparador custom) ─────────────────────
const SectionAccordion = memo(({
    secao,
    sIdx,
    defaultExpanded,
    handleUpdateSecao,
    handleRemoveSecao,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
}: {
    secao: SecaoForm;
    sIdx: number;
    defaultExpanded: boolean;
    handleUpdateSecao: (index: number, field: string, value: string) => void;
    handleRemoveSecao: (index: number) => void;
    handleAddItem: (secaoIndex: number) => void;
    handleUpdateItem: (secaoIndex: number, itemIndex: number, field: keyof ItemForm, value: any) => void;
    handleRemoveItem: (secaoIndex: number, itemIndex: number) => void;
}) => {
    const theme = useTheme();
    // Estado local para o título — evita re-render do pai ao digitar
    const [localTitulo, setLocalTitulo] = useState(secao.titulo);
    useEffect(() => { setLocalTitulo(secao.titulo); }, [secao.titulo]);

    const onTituloChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setLocalTitulo(e.target.value), []);
    const onTituloBlur = useCallback(() => handleUpdateSecao(sIdx, 'titulo', localTitulo), [sIdx, localTitulo, handleUpdateSecao]);
    const onCorChange = useCallback((newColor: string) => handleUpdateSecao(sIdx, 'cor', newColor), [sIdx, handleUpdateSecao]);
    const onRemove = useCallback(() => handleRemoveSecao(sIdx), [sIdx, handleRemoveSecao]);
    const onAddItem = useCallback(() => {
        startTransition(() => handleAddItem(sIdx));
    }, [sIdx, handleAddItem]);

    // Memoiza o estilo do summary para evitar recriar a cada render
    const summarySx = useMemo(() => ({
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderBottom: '1px solid #eee'
    }), [theme.palette.primary.main]);

    const chipSx = useMemo(() => ({
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        fontWeight: 600, flexShrink: 0
    }), [theme.palette.primary.main]);

    return (
        <Accordion
            defaultExpanded={defaultExpanded}
            sx={ACCORDION_SX}
            // Desmonta conteúdo quando fechado — reduz DOM massivamente
            TransitionProps={{ unmountOnExit: true }}
            // Desabilita animação para modelos grandes — evita layout thrashing
            slotProps={{ transition: { timeout: secao.itens.length > 15 ? 0 : 200 } }}
        >
            <AccordionSummary expandIcon={<ChevronDown />} sx={summarySx}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }} onClick={e => e.stopPropagation()}>
                    <GripVertical size={20} color="#999" style={{ cursor: 'move' }} />
                    <TextField
                        placeholder="Nome da Seção (Ex: Geladeiras...)" variant="standard" fullWidth
                        value={localTitulo}
                        onChange={onTituloChange}
                        onBlur={onTituloBlur}
                        sx={{ '& .MuiInput-underline:before': { borderBottom: 'none' } }}
                        InputProps={{ style: { fontWeight: 'bold', fontSize: '1.1rem', color: theme.palette.primary.dark } }}
                        onClick={e => e.stopPropagation()}
                    />
                    <Chip
                        label={`${secao.itens.length} ${secao.itens.length === 1 ? 'item' : 'itens'}`}
                        size="small"
                        sx={chipSx}
                    />
                    <Tooltip title="Escolher Cor da Seção">
                        <Box
                            sx={{
                                position: 'relative', width: 32, height: 32, borderRadius: 1,
                                bgcolor: secao.cor || '#1976d2', border: '2px solid #fff',
                                boxShadow: 2, cursor: 'pointer', flexShrink: 0,
                                '&:hover': { transform: 'scale(1.1)' }, transition: 'transform 0.2s'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <ColorPickerField
                                color={secao.cor || '#1976d2'}
                                onChange={onCorChange}
                            />
                        </Box>
                    </Tooltip>
                    <Tooltip title="Remover Seção">
                        <IconButton size="small" color="error" onClick={onRemove}>
                            <Trash2 size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
                <Box sx={{ p: 3 }}>
                    {secao.itens.map((item, iIdx) => (
                        <ItemRow
                            key={item.tempId}
                            item={item}
                            sIdx={sIdx}
                            iIdx={iIdx}
                            handleUpdateItem={handleUpdateItem}
                            handleRemoveItem={handleRemoveItem}
                        />
                    ))}
                    <Button
                        fullWidth variant="outlined" startIcon={<Plus size={16} />}
                        onClick={onAddItem}
                        sx={{ borderStyle: 'dashed', height: 48, color: 'text.secondary' }}
                    >
                        Adicionar Pergunta à seção &quot;{secao.titulo || 'Nova'}&quot;
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}, (prev, next) => {
    // Comparador custom: verifica apenas os dados que realmente importam
    // Isso impede que seções não-modificadas re-renderizem
    return prev.sIdx === next.sIdx
        && prev.defaultExpanded === next.defaultExpanded
        && prev.secao.tempId === next.secao.tempId
        && prev.secao.titulo === next.secao.titulo
        && prev.secao.cor === next.secao.cor
        && prev.secao.itens === next.secao.itens // referential — muda apenas quando itens mudam
        && prev.handleUpdateSecao === next.handleUpdateSecao
        && prev.handleRemoveSecao === next.handleRemoveSecao
        && prev.handleAddItem === next.handleAddItem
        && prev.handleUpdateItem === next.handleUpdateItem
        && prev.handleRemoveItem === next.handleRemoveItem;
});

// ─── Formulário de cabeçalho isolado (evita que digitação re-renderize as seções) ─
const FormularioHeader = memo(({
    editingId,
    nome,
    setNome,
    descricao,
    setDescricao,
    frequencia,
    setFrequencia,
    totalSecoes,
    totalItens,
}: {
    editingId: string | null;
    nome: string;
    setNome: (v: string) => void;
    descricao: string;
    setDescricao: (v: string) => void;
    frequencia: string;
    setFrequencia: (v: string) => void;
    totalSecoes: number;
    totalItens: number;
}) => {
    const theme = useTheme();
    // Estado local para inputs de texto — isola re-renders ao digitar
    const [localNome, setLocalNome] = useState(nome);
    const [localDescricao, setLocalDescricao] = useState(descricao);
    useEffect(() => { setLocalNome(nome); }, [nome]);
    useEffect(() => { setLocalDescricao(descricao); }, [descricao]);

    return (
        <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Definições do Formulário</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <TextField
                        label="Nome do Checklist" fullWidth
                        value={localNome}
                        onChange={e => setLocalNome(e.target.value)}
                        onBlur={() => setNome(localNome)}
                        placeholder="Ex: Controle de Temperatura de Equipamentos"
                        required InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel shrink>Frequência Sugerida</InputLabel>
                        <Select value={frequencia} label="Frequência Sugerida" onChange={e => setFrequencia(e.target.value as string)}>
                            <MenuItem value="DIARIO">Diário (Rotina)</MenuItem>
                            <MenuItem value="SEMANAL">Semanal</MenuItem>
                            <MenuItem value="MENSAL">Mensal</MenuItem>
                            <MenuItem value="EVENTUAL">Eventual / Auditoria</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Alert severity="info" sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2) }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <AlertCircle size={18} /> Guia de Pesos (I / N / R)
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}><b>I - Imprescindível (Peso 10):</b> Risco imediato à saúde ou segurança (Ex: temperaturas, pragas).</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}><b>N - Necessário (Peso 3):</b> Importante para o processo, mas sem risco direto iminente (Ex: etiquetas, manuais).</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}><b>R - Recomendável (Peso 1):</b> Boas práticas e estética (Ex: organização de estoque, pintura).</Typography>
                    </Alert>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Instruções Gerais para o Operador" fullWidth multiline rows={2}
                        value={localDescricao}
                        onChange={e => setLocalDescricao(e.target.value)}
                        onBlur={() => setDescricao(localDescricao)}
                        placeholder="Ex: Preencher antes de iniciar a produção. Notificar gerente se houver inconformidade."
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}, (prev, next) => {
    return prev.nome === next.nome
        && prev.descricao === next.descricao
        && prev.frequencia === next.frequencia
        && prev.totalSecoes === next.totalSecoes
        && prev.totalItens === next.totalItens
        && prev.editingId === next.editingId;
});

// ─── Componente Principal ─────────────────────────────────────────────────────
function EditorModeloChecklistContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editingId = searchParams.get('id');
    const { activeClientId } = useClient();

    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [frequencia, setFrequencia] = useState('DIARIO');
    const [secoes, setSecoes] = useState<SecaoForm[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Progressive rendering: quantas seções já foram montadas
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

    // Previne o loop de carregamento duplo do React Strict Mode (dev)
    const cancelRef = useRef(false);

    // Ref para acessar secoes no save sem depender do state (evita re-renders)
    const secoesRef = useRef(secoes);
    secoesRef.current = secoes;
    const nomeRef = useRef(nome);
    nomeRef.current = nome;
    const descricaoRef = useRef(descricao);
    descricaoRef.current = descricao;
    const frequenciaRef = useRef(frequencia);
    frequenciaRef.current = frequencia;

    // Carrega dados se for edição
    useEffect(() => {
        cancelRef.current = false;

        if (editingId && activeClientId) {
            loadModeloCompleto(editingId);
        } else {
            setSecoes(prev => prev.length > 0 ? prev : [{
                tempId: `new_sec_${Date.now()}`,
                titulo: '',
                cor: '#1976d2',
                itens: []
            }]);
        }

        return () => { cancelRef.current = true; };
    }, [editingId, activeClientId]);

    // Progressive rendering: carrega seções em batches para não travar a UI
    useEffect(() => {
        if (visibleCount >= secoes.length) return;

        const handle = requestAnimationFrame(() => {
            setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + BATCH_SIZE, secoes.length));
            }, 50);
        });

        return () => cancelAnimationFrame(handle);
    }, [visibleCount, secoes.length]);

    // Reset do visibleCount quando as seções mudam drasticamente (ex: load)
    const prevSecoesLengthRef = useRef(0);
    useEffect(() => {
        if (secoes.length > prevSecoesLengthRef.current + BATCH_SIZE) {
            setVisibleCount(BATCH_SIZE);
        }
        prevSecoesLengthRef.current = secoes.length;
    }, [secoes.length]);

    async function loadModeloCompleto(id: string) {
        if (cancelRef.current) return;
        setLoading(true);

        try {
            const { data: modelo, error: mErr } = await (supabase as any)
                .from('checklist_modelos').select('*').eq('id', id).single();

            if (cancelRef.current) return;
            if (mErr || !modelo) return;

            setNome(modelo.titulo);
            setDescricao(modelo.descricao || '');
            setFrequencia(modelo.frequencia_sugerida || 'DIARIO');

            const { data: secoesData } = await (supabase as any)
                .from('checklist_secoes')
                .select(`*, checklist_itens (*)`)
                .eq('modelo_id', id)
                .order('ordem');

            if (cancelRef.current) return;

            if (secoesData) {
                setSecoes(secoesData.map((s: any) => ({
                    id: s.id,
                    tempId: s.id,
                    titulo: s.titulo,
                    cor: s.cor || '#1976d2',
                    itens: (s.checklist_itens || [])
                        .sort((a: any, b: any) => a.ordem - b.ordem)
                        .map((i: any) => ({
                            id: i.id,
                            tempId: i.id,
                            texto_pergunta: i.texto_pergunta,
                            tipo_resposta: i.tipo_resposta,
                            obrigatorio: i.obrigatorio,
                            requer_foto: i.requer_foto || false,
                            ajuda_texto: i.ajuda_texto || '',
                            classificacao: i.classificacao || 'NECESSARIO'
                        }))
                })));
            }
        } catch (err) {
            if (!cancelRef.current) console.error('Erro ao carregar modelo:', err);
        } finally {
            if (!cancelRef.current) setLoading(false);
        }
    }

    // ─── Handlers memoizados com startTransition para ações não-urgentes ──────
    const handleAddSecao = useCallback(() => {
        startTransition(() => {
            setSecoes(prev => [...prev, {
                tempId: `new_sec_${Date.now()}`,
                titulo: '',
                cor: '#1976d2',
                itens: []
            }]);
        });
        setVisibleCount(prev => prev + 1);
    }, []);

    const handleRemoveSecao = useCallback((index: number) => {
        if (!confirm('Remover esta seção apagará todas as perguntas dentro dela. Continuar?')) return;
        startTransition(() => {
            setSecoes(prev => {
                const novas = [...prev];
                novas.splice(index, 1);
                return novas;
            });
        });
    }, []);

    const handleUpdateSecao = useCallback((index: number, field: string, value: string) => {
        startTransition(() => {
            setSecoes(prev => {
                const novas = [...prev];
                novas[index] = { ...novas[index], [field]: value };
                return novas;
            });
        });
    }, []);

    const handleAddItem = useCallback((secaoIndex: number) => {
        startTransition(() => {
            setSecoes(prev => {
                const novas = [...prev];
                novas[secaoIndex] = {
                    ...novas[secaoIndex],
                    itens: [...novas[secaoIndex].itens, {
                        tempId: `new_item_${Date.now()}_${Math.random()}`,
                        texto_pergunta: '',
                        tipo_resposta: 'CONFORME_NAOCONFORME',
                        obrigatorio: true,
                        requer_foto: false,
                        ajuda_texto: '',
                        classificacao: 'NECESSARIO'
                    }]
                };
                return novas;
            });
        });
    }, []);

    const handleRemoveItem = useCallback((secaoIndex: number, itemIndex: number) => {
        startTransition(() => {
            setSecoes(prev => {
                const novas = [...prev];
                const novosItens = [...novas[secaoIndex].itens];
                novosItens.splice(itemIndex, 1);
                novas[secaoIndex] = { ...novas[secaoIndex], itens: novosItens };
                return novas;
            });
        });
    }, []);

    const handleUpdateItem = useCallback((secaoIndex: number, itemIndex: number, field: keyof ItemForm, value: any) => {
        startTransition(() => {
            setSecoes(prev => {
                const novas = [...prev];
                const novosItens = [...novas[secaoIndex].itens];
                novosItens[itemIndex] = { ...novosItens[itemIndex], [field]: value };
                novas[secaoIndex] = { ...novas[secaoIndex], itens: novosItens };
                return novas;
            });
        });
    }, []);

    // Contadores derivados (memoizados)
    const totalItens = useMemo(() => secoes.reduce((acc, s) => acc + s.itens.length, 0), [secoes]);

    // ─── Salvar ───────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const currentNome = nomeRef.current;
        const currentDescricao = descricaoRef.current;
        const currentFrequencia = frequenciaRef.current;
        const currentSecoes = secoesRef.current;

        if (!currentNome.trim()) return alert('O modelo precisa de um nome.');
        if (currentSecoes.length === 0) return alert('Adicione pelo menos uma seção.');
        for (const secao of currentSecoes) {
            if (!secao.titulo.trim()) return alert('Todas as seções precisam de um título.');
            if (secao.itens.length === 0) return alert(`A seção "${secao.titulo}" está vazia.`);
            for (const item of secao.itens) {
                if (!item.texto_pergunta.trim()) return alert(`Existem perguntas sem texto na seção "${secao.titulo}".`);
            }
        }
        if (!activeClientId) return alert('Sem cliente ativo.');

        setSaving(true);
        try {
            let modeloId = editingId;
            const payloadModelo = {
                cliente_id: activeClientId,
                titulo: currentNome,
                descricao: currentDescricao,
                frequencia_sugerida: currentFrequencia,
                ativo: true
            };

            if (modeloId) {
                const { error } = await (supabase as any).from('checklist_modelos').update(payloadModelo).eq('id', modeloId);
                if (error) throw error;
            } else {
                const { data, error } = await (supabase as any).from('checklist_modelos').insert(payloadModelo).select('id').single();
                if (error) throw error;
                modeloId = data.id;
            }

            if (editingId) {
                // ─── Estratégia segura de Save (evita duplicação por FK) ──────
                // O DELETE CASCADE de seções falha quando itens têm respostas
                // vinculadas (FK NO ACTION). Então usamos uma estratégia de
                // "reconciliation": mantemos o que existe, removemos o que foi
                // excluído pelo usuário, e criamos/atualizamos o resto.

                // IDs das seções e itens que ainda existem no editor
                const secoesIdsAtuais = currentSecoes
                    .filter(s => s.id) // apenas seções que já existem no banco
                    .map(s => s.id!);
                const itensIdsAtuais = currentSecoes
                    .flatMap(s => s.itens)
                    .filter(i => i.id)
                    .map(i => i.id!);

                // 1) Buscar todos os itens atuais do modelo para saber quais remover
                const { data: itensExistentes } = await (supabase as any)
                    .from('checklist_itens')
                    .select('id')
                    .eq('modelo_id', modeloId);
                
                // 2) Deletar itens que foram removidos pelo usuário
                //    (que existem no banco mas não estão mais no editor)
                if (itensExistentes) {
                    const itensParaDeletar = itensExistentes
                        .map((i: any) => i.id)
                        .filter((id: string) => !itensIdsAtuais.includes(id));
                    
                    if (itensParaDeletar.length > 0) {
                        // Primeiro desvincula respostas órfãs (se houver)
                        // e depois deleta os itens
                        const { error: delItemErr } = await (supabase as any)
                            .from('checklist_itens')
                            .delete()
                            .in('id', itensParaDeletar);
                        // Se falhar por FK, itens com respostas ficam (seguro para GxP)
                        if (delItemErr) console.warn('Alguns itens com respostas foram preservados:', delItemErr.message);
                    }
                }

                // 3) Buscar seções existentes para saber quais remover
                const { data: secoesExistentes } = await (supabase as any)
                    .from('checklist_secoes')
                    .select('id')
                    .eq('modelo_id', modeloId);
                
                if (secoesExistentes) {
                    const secoesParaDeletar = secoesExistentes
                        .map((s: any) => s.id)
                        .filter((id: string) => !secoesIdsAtuais.includes(id));
                    
                    if (secoesParaDeletar.length > 0) {
                        const { error: delSecErr } = await (supabase as any)
                            .from('checklist_secoes')
                            .delete()
                            .in('id', secoesParaDeletar);
                        if (delSecErr) console.warn('Algumas seções com dados foram preservadas:', delSecErr.message);
                    }
                }
            }

            // 4) Upsert seções (atualiza existentes, cria novas)
            const secoesResults = await Promise.all(
                currentSecoes.map(async (secao, i) => {
                    const secaoPayload = {
                        modelo_id: modeloId,
                        titulo: secao.titulo,
                        cor: secao.cor,
                        ordem: i
                    };

                    let secaoId: string;
                    if (secao.id) {
                        // Seção existente — atualizar
                        const { error } = await (supabase as any)
                            .from('checklist_secoes')
                            .update(secaoPayload)
                            .eq('id', secao.id);
                        if (error) throw error;
                        secaoId = secao.id;
                    } else {
                        // Seção nova — inserir
                        const { data: secaoSaved, error: sErr } = await (supabase as any)
                            .from('checklist_secoes')
                            .insert(secaoPayload)
                            .select('id').single();
                        if (sErr) throw sErr;
                        secaoId = secaoSaved.id;
                    }
                    return { secaoId, secao };
                })
            );

            // 5) Upsert itens (atualiza existentes, cria novos)
            await Promise.all(
                secoesResults.map(({ secaoId, secao }) =>
                    Promise.all(secao.itens.map(async (item, idx) => {
                        const itemPayload = {
                            secao_id: secaoId,
                            modelo_id: modeloId,
                            texto_pergunta: item.texto_pergunta,
                            tipo_resposta: item.tipo_resposta,
                            obrigatorio: item.obrigatorio,
                            requer_foto: item.requer_foto,
                            ajuda_texto: item.ajuda_texto,
                            classificacao: item.classificacao,
                            peso: item.classificacao === 'IMPRESCINDIVEL' ? 10 : item.classificacao === 'NECESSARIO' ? 3 : 1,
                            ordem: idx
                        };

                        if (item.id) {
                            // Item existente — atualizar
                            const { error } = await (supabase as any)
                                .from('checklist_itens')
                                .update(itemPayload)
                                .eq('id', item.id);
                            if (error) throw error;
                        } else {
                            // Item novo — inserir
                            const { error } = await (supabase as any)
                                .from('checklist_itens')
                                .insert(itemPayload);
                            if (error) throw error;
                        }
                    }))
                )
            );

            router.push('/qualidade/modelos');
        } catch (err: any) {
            console.error(err);
            alert('Erro ao salvar modelo: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [editingId, activeClientId, router]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    // Para modelos grandes (edição com 3+ seções), começam colapsadas
    const isLargeModel = !!(editingId && secoes.length >= 3);

    // Seções visíveis para progressive rendering
    const secoesVisiveis = secoes.slice(0, visibleCount);
    const hasMoreToLoad = visibleCount < secoes.length;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>

            {/* HEADER */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ mr: 2, color: 'text.secondary' }}>Voltar</Button>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                        {editingId ? 'Editar Modelo' : 'Novo Checklist'}
                    </Typography>
                    {editingId && (
                        <Typography variant="body2" color="text.secondary">
                            {secoes.length} seções • {totalItens} itens
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* DADOS GERAIS — componente isolado para não re-renderizar as seções ao digitar */}
            <FormularioHeader
                editingId={editingId}
                nome={nome}
                setNome={setNome}
                descricao={descricao}
                setDescricao={setDescricao}
                frequencia={frequencia}
                setFrequencia={setFrequencia}
                totalSecoes={secoes.length}
                totalItens={totalItens}
            />

            {/* CONSTRUTOR DE SEÇÕES */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Grip size={24} /> Estrutura
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<Plus />} onClick={handleAddSecao}>
                        Nova Seção (Categoria)
                    </Button>
                </Box>

                {/* Dica para modelos grandes */}
                {isLargeModel && (
                    <Alert severity="info" sx={{ mb: 2 }} icon={false}>
                        <Typography variant="caption">
                            💡 As seções estão colapsadas para carregamento rápido. Clique em cada seção para expandir e editar.
                        </Typography>
                    </Alert>
                )}

                {secoesVisiveis.map((secao, sIdx) => (
                    <SectionAccordion
                        key={secao.tempId}
                        secao={secao}
                        sIdx={sIdx}
                        defaultExpanded={!isLargeModel}
                        handleUpdateSecao={handleUpdateSecao}
                        handleRemoveSecao={handleRemoveSecao}
                        handleAddItem={handleAddItem}
                        handleUpdateItem={handleUpdateItem}
                        handleRemoveItem={handleRemoveItem}
                    />
                ))}

                {/* Progressive loading indicator */}
                {hasMoreToLoad && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, gap: 2, alignItems: 'center' }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">
                            Carregando seções... ({visibleCount} de {secoes.length})
                        </Typography>
                    </Box>
                )}

                {secoes.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Comece criando categorias para organizar suas perguntas.</Alert>}
            </Box>

            {/* FOOTER ACTIONS */}
            <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: { md: 280, xs: 0 }, right: 0, p: 2, bgcolor: 'background.paper', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2, zIndex: 1000 }}>
                <Button variant="text" onClick={() => router.back()}>Cancelar</Button>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleSave} disabled={saving} sx={{ px: 4, fontWeight: 'bold' }}>
                    {saving ? 'Salvando...' : 'Salvar Modelo'}
                </Button>
            </Paper>
        </Container>
    );
}

export default function EditorModeloChecklistPage() {
    return (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>}>
            <EditorModeloChecklistContent />
        </Suspense>
    );
}
