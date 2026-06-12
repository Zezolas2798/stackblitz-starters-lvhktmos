'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Container, Typography, Box, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    CircularProgress, Alert, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControlLabel, Switch, MenuItem, Autocomplete, Checkbox, Divider, Chip, Avatar, ListSubheader, Select
} from '@mui/material';
import { ArrowLeft, Plus, Eye, Download, Trash2, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLocalDate } from '@/lib/utils/dateUtils';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview';

export default function PlanilhaDetalhePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { activeClientId, unidadeId } = useClient();
    const modeloId = params.id;

    const [modelo, setModelo] = useState<any>(null);
    const [colunas, setColunas] = useState<any[]>([]);
    const [registros, setRegistros] = useState<any[]>([]);
    const [configuracao, setConfiguracao] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openNovaPlanilha, setOpenNovaPlanilha] = useState(false);
    const [respostas, setRespostas] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    // Novas features state
    const [userSignature, setUserSignature] = useState<string | null>(null);
    const [saveSignature, setSaveSignature] = useState(false);
    const [anexosGerais, setAnexosGerais] = useState<any[]>([]);
    const [textSuggestions, setTextSuggestions] = useState<Record<string, string[]>>({});
    const [selectedItemMonitorado, setSelectedItemMonitorado] = useState<string>('');
    const [colaboradoresOptions, setColaboradoresOptions] = useState<any[]>([]);
    const [equipamentosOptions, setEquipamentosOptions] = useState<any[]>([]);
    const [setoresOptions, setSetoresOptions] = useState<any[]>([]);
    const [fornecedoresOptions, setFornecedoresOptions] = useState<any[]>([]);
    const [lotesAtivos, setLotesAtivos] = useState<any[]>([]);
    const [materiaisLimpezaGrouped, setMateriaisLimpezaGrouped] = useState<any[]>([]);
    const [epiGrouped, setEpiGrouped] = useState<any[]>([]);
    const [uniformeGrouped, setUniformeGrouped] = useState<any[]>([]);
    const [produtoSearchResults, setProdutoSearchResults] = useState<Record<string, any[]>>({});
    const [produtoSearchLoading, setProdutoSearchLoading] = useState<Record<string, boolean>>({});
    const sigCanvasRef = useRef<Record<string, any>>({});

    const [openEtiquetaModal, setOpenEtiquetaModal] = useState(false);
    const [dadosEtiquetaAtual, setDadosEtiquetaAtual] = useState<any[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    useEffect(() => {
        if (modeloId) {
            fetchModeloERegistros();
        }
    }, [modeloId, activeClientId, unidadeId]);

    const fetchModeloERegistros = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch User Profile para a Assinatura
            const { data: userAuth } = await supabase.auth.getUser();
            const { data: perfil } = await (supabase as any).from('profiles').select('id, assinatura_url').eq('id', userAuth.user?.id).single();
            if (perfil) setUserSignature(perfil.assinatura_url);

            // 1. Fetch Modelo
            const { data: modData, error: modErr } = await (supabase as any).from('qual_planilha_modelos')
                .select('*')
                .eq('id', modeloId)
                .single();
            if (modErr) throw modErr;
            setModelo(modData);

            // 2. Fetch Colunas
            const { data: colData, error: colErr } = await (supabase as any).from('qual_planilha_colunas')
                .select('*')
                .eq('modelo_id', modeloId)
                .order('ordem', { ascending: true });
            if (colErr) throw colErr;
            setColunas(colData || []);

            if (colData && colData.some((c: any) => c.tipo === 'COLABORADOR')) {
                const { data: colabs } = await (supabase as any).from('profiles')
                    .select('id, full_name, role')
                    .order('full_name');
                setColaboradoresOptions(colabs || []);
            }

            if (colData && colData.some((c: any) => c.tipo === 'EQUIPAMENTO' || c.tipo === 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA')) {
                let eqQuery = (supabase as any).from('equipamentos_config')
                    .select('id, nome, parent_id, grupo, status')
                    .not('parent_id', 'is', null)
                    .eq('ativo', true)
                    .order('nome');
                
                if (unidadeId) {
                    eqQuery = eqQuery.eq('unidade_id', unidadeId);
                }
                
                const { data: eqs } = await eqQuery;
                setEquipamentosOptions(eqs || []);
            }

            if (colData && colData.some((c: any) => c.tipo === 'LOCAL_SETOR' || c.tipo.startsWith('TABELA_DINAMICA_'))) {
                let setQuery = (supabase as any).from('setores_producao')
                    .select('id, nome, tipo')
                    .order('tipo')
                    .order('nome');
                
                if (unidadeId) {
                    setQuery = setQuery.eq('unidade_id', unidadeId);
                }
                
                const { data: sets } = await setQuery;
                setSetoresOptions(sets || []);
            }

            if (colData && colData.some((c: any) => c.tipo === 'FORNECEDOR')) {
                const { data: forns } = await (supabase as any).from('fornecedores')
                    .select('id, razao_social, nome_fantasia')
                    .eq('cliente_id', activeClientId)
                    .order('nome_fantasia');
                setFornecedoresOptions(forns || []);
            }

            if (colData && colData.some((c: any) => c.tipo === 'SELETOR_LOTE_AMOSTRA')) {
                const { data: lotesData } = await supabase
                    .from('estoque_lotes')
                    .select(`
                        id, numero_lote_fabricante, data_fabricacao, data_validade_rotulo,
                        ingrediente_id, ingredientes(nome),
                        fornecedor_id, fornecedores(razao_social, nome_fantasia)
                    `)
                    .eq('status', 'APROVADO')
                    .gt('quantidade_atual_g_ml', 0);
                
                // Formatar dados para facilitar
                const formattedLotes = (lotesData || []).map((l: any) => ({
                    id: l.id,
                    numero_lote: l.numero_lote_fabricante,
                    data_fabricacao: l.data_fabricacao,
                    data_validade: l.data_validade_rotulo,
                    alimento_id: l.ingrediente_id,
                    alimento_nome: l.ingredientes?.nome || 'Desconhecido',
                    fornecedor_id: l.fornecedor_id,
                    fornecedor_nome: l.fornecedores?.nome_fantasia || l.fornecedores?.razao_social || 'Desconhecido'
                }));
                setLotesAtivos(formattedLotes);
            }

            if (colData && colData.some((c: any) => c.tipo === 'PRODUTO_LIMPEZA')) {
                const [gruposRes, materiaisRes] = await Promise.all([
                    (supabase as any).from('grupos_produto')
                        .select('id, nome')
                        .eq('modalidade', 'LIMPEZA')
                        .order('nome'),
                    (supabase as any).from('materiais')
                        .select('id, nome, marca, grupo_id')
                        .eq('tipo_material', 'LIMPEZA')
                        .eq('ativo', true)
                        .eq('cliente_id', activeClientId)
                        .order('nome'),
                ]);
                const grupos = gruposRes.data || [];
                const mats = materiaisRes.data || [];
                
                // Build grouped structure
                const grouped: any[] = [];
                for (const g of grupos) {
                    const items = mats.filter((m: any) => m.grupo_id === g.id);
                    if (items.length > 0) {
                        grouped.push({ type: 'header', label: g.nome });
                        items.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                    }
                }
                // Itens sem grupo
                const semGrupo = mats.filter((m: any) => !m.grupo_id || !grupos.find((g: any) => g.id === m.grupo_id));
                if (semGrupo.length > 0) {
                    grouped.push({ type: 'header', label: 'Outros' });
                    semGrupo.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                }
                setMateriaisLimpezaGrouped(grouped);
            }

            if (colData && colData.some((c: any) => c.tipo === 'MATERIAL_EPI')) {
                const [gruposRes, materiaisRes] = await Promise.all([
                    (supabase as any).from('grupos_produto').select('id, nome').eq('modalidade', 'EPI_EPC').order('nome'),
                    (supabase as any).from('materiais').select('id, nome, marca, grupo_id').eq('tipo_material', 'EPI_EPC').eq('ativo', true).eq('cliente_id', activeClientId).order('nome'),
                ]);
                const grupos = gruposRes.data || [];
                const mats = materiaisRes.data || [];
                const grouped: any[] = [];
                for (const g of grupos) {
                    const items = mats.filter((m: any) => m.grupo_id === g.id);
                    if (items.length > 0) {
                        grouped.push({ type: 'header', label: g.nome });
                        items.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                    }
                }
                const semGrupo = mats.filter((m: any) => !m.grupo_id || !grupos.find((g: any) => g.id === m.grupo_id));
                if (semGrupo.length > 0) {
                    grouped.push({ type: 'header', label: 'Outros' });
                    semGrupo.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                }
                setEpiGrouped(grouped);
            }

            if (colData && colData.some((c: any) => c.tipo === 'MATERIAL_UNIFORME')) {
                const [gruposRes, materiaisRes] = await Promise.all([
                    (supabase as any).from('grupos_produto').select('id, nome').in('modalidade', ['UNIFORME', 'UNIFORMES']).order('nome'),
                    (supabase as any).from('materiais').select('id, nome, marca, grupo_id').in('tipo_material', ['UNIFORME', 'UNIFORMES']).eq('ativo', true).eq('cliente_id', activeClientId).order('nome'),
                ]);
                const grupos = gruposRes.data || [];
                const mats = materiaisRes.data || [];
                const grouped: any[] = [];
                for (const g of grupos) {
                    const items = mats.filter((m: any) => m.grupo_id === g.id);
                    if (items.length > 0) {
                        grouped.push({ type: 'header', label: g.nome });
                        items.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                    }
                }
                const semGrupo = mats.filter((m: any) => !m.grupo_id || !grupos.find((g: any) => g.id === m.grupo_id));
                if (semGrupo.length > 0) {
                    grouped.push({ type: 'header', label: 'Outros' });
                    semGrupo.forEach((m: any) => grouped.push({ type: 'item', id: m.id, nome: m.nome, marca: m.marca }));
                }
                setUniformeGrouped(grouped);
            }

            // 3. Fetch Registros
            let reqQuery = (supabase as any).from('qual_planilha_registros')
                .select(`
                    *,
                    profiles (full_name)
                `)
                .eq('modelo_id', modeloId)
                .order('data_referencia', { ascending: false });

            if (unidadeId) {
                reqQuery = reqQuery.eq('unidade_id', unidadeId);
            }

            const { data: regData, error: regErr } = await reqQuery;
            if (regErr) throw regErr;
            setRegistros(regData || []);

            // Processar respostas anteriores para o Autocomplete
            const suggestions: Record<string, Set<string>> = {};
            (regData || []).forEach((reg: any) => {
                (reg.respostas || []).forEach((resp: any) => {
                    if (resp.valor && typeof resp.valor === 'string' && resp.valor.trim() !== '') {
                        if (!suggestions[resp.coluna_id]) suggestions[resp.coluna_id] = new Set();
                        suggestions[resp.coluna_id].add(resp.valor);
                    }
                });
            });
            const suggestionsArray: Record<string, string[]> = {};
            Object.keys(suggestions).forEach(k => {
                suggestionsArray[k] = Array.from(suggestions[k]);
            });
            setTextSuggestions(suggestionsArray);

            // 4. Fetch Configuracao (para os itens_monitorados)
            if (unidadeId) {
                const { data: configData } = await (supabase as any).from('qual_planilha_configuracoes')
                    .select('itens_monitorados')
                    .eq('modelo_id', modeloId)
                    .eq('unidade_id', unidadeId)
                    .eq('ativo', true)
                    .single();
                setConfiguracao(configData || null);
            }

        } catch (err: any) {
            console.error('Erro ao buscar dados da planilha:', err);
            setError(err.message || 'Falha ao carregar detalhes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && colunas.length > 0 && searchParams.get('new') === 'true' && !openNovaPlanilha && !submitting) {
            const preSelectedItem = searchParams.get('item');
            if (preSelectedItem) setSelectedItemMonitorado(preSelectedItem);
            handleOpenForm();
        }
    }, [loading, colunas, searchParams]);

    const handleOpenForm = () => {
        const initial: Record<string, any> = {};
        colunas.forEach(c => {
            if (c.tipo === 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA') {
                const equipamentosTemp = equipamentosOptions.filter((eq: any) => eq.grupo === 'Temperaturas' || eq.grupo === 'Temperatura');
                initial[c.id] = equipamentosTemp.map((eq: any) => ({
                    id: crypto.randomUUID(),
                    equipamento_id: eq.id,
                    equipamento_nome: eq.nome,
                    temp_equipamento: '',
                    alimento_id: '',
                    alimento_nome: '',
                    temp_alimento: '',
                    status: 'Adequado',
                    obs: ''
                }));
            } else if (c.tipo === 'TABELA_DINAMICA_AMBIENTE') {
                const setoresTemp = setoresOptions.filter((s: any) => s.tipo !== 'Externa');
                initial[c.id] = setoresTemp.map((s: any) => ({
                    id: crypto.randomUUID(),
                    setor_id: s.id,
                    setor_nome: s.nome,
                    temp_ambiente: '',
                    status: 'Adequado',
                    obs: ''
                }));
            } else {
                initial[c.id] = c.tipo === 'BOOLEAN' ? false : '';
            }
        });
        setRespostas(initial);
        setAnexosGerais([]);
        setSaveSignature(false);
        if (!searchParams.get('item')) {
            setSelectedItemMonitorado('');
        }
        setOpenNovaPlanilha(true);
    };

    const handleFileUpload = (e: any, onBase64: (b64: string, name: string) => void) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            onBase64(reader.result as string, file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleFormSubmit = async () => {
        if (configuracao?.itens_monitorados?.length > 0 && !selectedItemMonitorado) {
            alert('Selecione o Item Monitorado.');
            return;
        }

        setSubmitting(true);
        try {
            const respostasArray = colunas.map(c => ({
                coluna_id: c.id,
                titulo: c.titulo,
                valor: respostas[c.id]
            }));

            const { data: userAuth } = await supabase.auth.getUser();
            const { data: perfil } = await (supabase as any).from('profiles').select('id').eq('id', userAuth.user?.id).single();

            // Salvar assinatura se marcado
            if (saveSignature) {
                const sigField = colunas.find(c => c.tipo === 'SIGNATURE');
                if (sigField && respostas[sigField.id] && perfil) {
                    await (supabase as any).from('profiles').update({ assinatura_url: respostas[sigField.id] }).eq('id', perfil.id);
                    setUserSignature(respostas[sigField.id]);
                }
            }

            const payload = {
                modelo_id: modeloId,
                unidade_id: unidadeId,
                preenchido_por: perfil?.id,
                data_referencia: new Date().toISOString(),
                data_referencia_local: format(new Date(), 'dd/MM/yyyy HH:mm'),
                status: 'CONCLUIDO',
                item_monitorado: selectedItemMonitorado || null,
                respostas: respostasArray,
                anexos_gerais: anexosGerais
            };

            const { data: insertedData, error } = await (supabase as any).from('qual_planilha_registros').insert(payload).select();
            if (error) throw error;

            // Retro-compatibilidade com gráficos legados
            const unificadaCol = colunas.find(c => c.tipo === 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA');
            if (unificadaCol && respostas[unificadaCol.id]) {
                const linhasToSync = respostas[unificadaCol.id].filter((l: any) => l.temp_equipamento || l.temp_alimento);
                if (linhasToSync.length > 0) {
                    const horaAtual = new Date().getHours();
                    const periodo = horaAtual < 12 ? 'Manhã' : (horaAtual < 18 ? 'Tarde' : 'Noite');
                    const legacyPayloads = linhasToSync.map((l: any) => ({
                        cliente_id: activeClientId,
                        unidade_id: unidadeId,
                        data: new Date().toISOString().split('T')[0],
                        hora_afericao: format(new Date(), 'HH:mm'),
                        periodo: periodo,
                        equipamento_id: l.equipamento_id,
                        temp_equipamento: l.temp_equipamento ? parseFloat(l.temp_equipamento) : null,
                        alimento: l.alimento_nome || null,
                        temp_alimento: l.temp_alimento ? parseFloat(l.temp_alimento) : null,
                        status: l.status || 'Conforme',
                        responsavel_id: perfil?.id,
                        obs: l.obs || null
                    }));
                    await (supabase as any).from('controle_temperatura').insert(legacyPayloads);
                }
            }

            setOpenNovaPlanilha(false);
            fetchModeloERegistros();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao salvar registro.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrintAmostras = (linhasAlvo: any[]) => {
        const tempoCol = colunas.find(c => c.titulo.includes('Tempo'));
        const responsavelCol = colunas.find(c => c.tipo === 'COLABORADOR');
        const tempo = tempoCol && respostas[tempoCol.id] ? parseInt(respostas[tempoCol.id]) : 72;
        const responsavel = responsavelCol && respostas[responsavelCol.id] ? respostas[responsavelCol.id] : 'Não informado';

        const arrayDados = linhasAlvo.map(linha => ({
            empresa: { razaoSocial: 'Unidade de Alimentação', cnpj: '', enderecoResumido: 'Contra-prova', enderecoCompleto: '' },
            produto: { nome: linha.alimento || 'Sem Nome', lote: 'N/A', marcaForn: 'PRÓPRIA', peso: linha.qtd ? linha.qtd + 'g' : '-', tipoArmazenamento: 'Congelado/Resfriado' },
            datas: { manipulacao: new Date(), validadeOriginal: new Date(), validadeFinal: new Date(Date.now() + tempo * 60 * 60 * 1000) },
            rastreabilidade: { idInterno: 'AMOSTRA', responsavel: responsavel, codigoRef: 'AMOSTRA' }
        }));
        
        if (arrayDados.length > 0) {
            setDadosEtiquetaAtual(arrayDados);
            setPreviewIndex(0);
            setOpenEtiquetaModal(true);
        }
    };

    const renderCampo = (col: any) => {
        switch (col.tipo) {
            case 'TEXT':
                return (
                    <Autocomplete
                        freeSolo
                        options={textSuggestions[col.id] || []}
                        value={respostas[col.id] || ''}
                        onInputChange={(event, newInputValue) => {
                            setRespostas({ ...respostas, [col.id]: newInputValue });
                        }}
                        onChange={(event, newValue) => {
                            setRespostas({ ...respostas, [col.id]: newValue });
                        }}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label={col.titulo} 
                                margin="normal" 
                                fullWidth 
                                required={col.obrigatorio} 
                            />
                        )}
                    />
                );
            case 'ACTION_PLAN':
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    />
                );
            case 'NUMBER':
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label={col.titulo}
                        type="number"
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    />
                );
            case 'CALCULATED':
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={`${col.titulo} (Avaliação)`}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        <MenuItem value="Conforme">Conforme</MenuItem>
                        <MenuItem value="Não Conforme">Não Conforme</MenuItem>
                        <MenuItem value="Abaixo do Limite">Abaixo do Limite</MenuItem>
                        <MenuItem value="Acima do Limite">Acima do Limite</MenuItem>
                    </TextField>
                );
            case 'BOOLEAN':
                return (
                    <FormControlLabel
                        sx={{ display: 'block', mt: 2 }}
                        control={
                            <Switch
                                checked={!!respostas[col.id]}
                                onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.checked })}
                            />
                        }
                        label={col.titulo}
                    />
                );
            case 'DATE':
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label={col.titulo}
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    />
                );
            case 'SELECT':
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {(col.opcoes || []).map((opt: string) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            case 'COLABORADOR':
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {colaboradoresOptions.map((c: any) => (
                            <MenuItem key={c.id} value={c.full_name}>
                                {c.full_name || `Usuário ${c.id.substring(0,5)}`} {c.role ? `(${c.role})` : ''}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            case 'EQUIPAMENTO':
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {equipamentosOptions.map((e: any) => (
                            <MenuItem key={e.id} value={e.nome}>
                                {e.nome}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            case 'LOCAL_SETOR': {
                const TIPOS_SETOR_LABELS: Record<string, string> = {
                    PRODUCAO: 'Produção', LIMPEZA: 'Limpeza', RECEBIMENTO: 'Recebimento',
                    ESTOQUE: 'Estoque', LIXO: 'Dep. Lixo', TRANSITO: 'Trânsito',
                    BANHEIROS: 'Banheiros', VESTIARIOS: 'Vestiários', REFEITORIO: 'Refeitório',
                    ADMINISTRATIVO: 'Administrativo'
                };
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {setoresOptions.map((s: any) => (
                            <MenuItem key={s.id} value={s.nome}>
                                <Chip label={TIPOS_SETOR_LABELS[s.tipo] || s.tipo} size="small" sx={{ mr: 1, fontSize: '0.65rem', height: 20 }} />
                                {s.nome}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            }
            case 'PRODUTO_GERAL': {
                const colId = col.id;
                const searchProduto = async (query: string) => {
                    if (query.length < 2) {
                        setProdutoSearchResults(prev => ({ ...prev, [colId]: [] }));
                        return;
                    }
                    setProdutoSearchLoading(prev => ({ ...prev, [colId]: true }));
                    try {
                        const [ingRes, recRes, fichaRes] = await Promise.all([
                            (supabase as any).from('ingredientes')
                                .select('id, nome')
                                .eq('cliente_id', activeClientId)
                                .ilike('nome', `%${query}%`)
                                .limit(10),
                            (supabase as any).from('receitas')
                                .select('id, nome')
                                .eq('cliente_id', activeClientId)
                                .ilike('nome', `%${query}%`)
                                .limit(10),
                            (supabase as any).from('fichas_tecnicas_uan')
                                .select('id, nome')
                                .eq('cliente_id', activeClientId)
                                .ilike('nome', `%${query}%`)
                                .limit(10),
                        ]);
                        const results = [
                            ...(ingRes.data || []).map((i: any) => ({ label: i.nome, source: 'Ingrediente' })),
                            ...(recRes.data || []).map((r: any) => ({ label: r.nome, source: 'Receita' })),
                            ...(fichaRes.data || []).map((f: any) => ({ label: f.nome, source: 'Ficha Técnica' })),
                        ];
                        setProdutoSearchResults(prev => ({ ...prev, [colId]: results }));
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setProdutoSearchLoading(prev => ({ ...prev, [colId]: false }));
                    }
                };
                return (
                    <Autocomplete
                        freeSolo
                        options={produtoSearchResults[colId] || []}
                        getOptionLabel={(option: any) => typeof option === 'string' ? option : option.label}
                        renderOption={(props, option: any) => (
                            <li {...props} key={`${option.source}-${option.label}`}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip label={option.source} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                    <Typography variant="body2">{option.label}</Typography>
                                </Box>
                            </li>
                        )}
                        inputValue={respostas[col.id] || ''}
                        onInputChange={(_, val) => {
                            setRespostas({ ...respostas, [col.id]: val });
                            searchProduto(val);
                        }}
                        onChange={(_, val) => {
                            if (val && typeof val !== 'string') {
                                setRespostas({ ...respostas, [col.id]: val.label });
                            }
                        }}
                        loading={produtoSearchLoading[colId] || false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                margin="normal"
                                label={col.titulo}
                                required={col.obrigatorio}
                                placeholder="Digite para buscar..."
                            />
                        )}
                    />
                );
            }
            case 'SELETOR_LOTE_AMOSTRA': {
                const currState = respostas[col.id] || {};
                const alimentoId = currState.alimento_id || '';
                const fornecedorId = currState.fornecedor_id || '';
                const loteId = currState.lote_id || '';

                // Extrair alimentos unicos
                const alimentosUnicos = Array.from(new Set(lotesAtivos.map(l => l.alimento_id)))
                    .map(id => lotesAtivos.find(l => l.alimento_id === id))
                    .filter(Boolean);

                // Fornecedores para o alimento escolhido
                const fornecedoresFiltrados = alimentoId 
                    ? Array.from(new Set(lotesAtivos.filter(l => l.alimento_id === alimentoId).map(l => l.fornecedor_id)))
                        .map(id => lotesAtivos.find(l => l.fornecedor_id === id))
                        .filter(Boolean)
                    : [];

                // Lotes para alimento + fornecedor
                const lotesFiltrados = lotesAtivos.filter(l => l.alimento_id === alimentoId && l.fornecedor_id === fornecedorId);

                const dataFab = currState.data_fabricacao ? new Date(currState.data_fabricacao).toLocaleDateString('pt-BR') : '';
                const dataVal = currState.data_validade ? new Date(currState.data_validade).toLocaleDateString('pt-BR') : '';

                return (
                    <Box key={col.id} sx={{ mt: 3, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            {col.titulo} {col.obrigatorio && '*'}
                        </Typography>

                        <TextField
                            fullWidth
                            select
                            margin="normal"
                            label="Matéria-prima / Ingrediente"
                            required={col.obrigatorio}
                            value={alimentoId}
                            onChange={(e) => {
                                const newAlimento = e.target.value;
                                const al = lotesAtivos.find(l => l.alimento_id === newAlimento);
                                setRespostas({
                                    ...respostas, 
                                    [col.id]: {
                                        alimento_id: newAlimento,
                                        alimento_nome: al?.alimento_nome,
                                        fornecedor_id: '',
                                        fornecedor_nome: '',
                                        lote_id: '',
                                        numero_lote: '',
                                        data_fabricacao: '',
                                        data_validade: ''
                                    }
                                });
                            }}
                        >
                            {alimentosUnicos.map((a: any) => (
                                <MenuItem key={a.alimento_id} value={a.alimento_id}>{a.alimento_nome}</MenuItem>
                            ))}
                            {alimentosUnicos.length === 0 && <MenuItem disabled>Nenhum lote ativo encontrado</MenuItem>}
                        </TextField>

                        <TextField
                            fullWidth
                            select
                            margin="normal"
                            label="Fornecedor"
                            required={col.obrigatorio}
                            value={fornecedorId}
                            disabled={!alimentoId}
                            onChange={(e) => {
                                const newFornecedor = e.target.value;
                                const f = lotesAtivos.find(l => l.fornecedor_id === newFornecedor);
                                setRespostas({
                                    ...respostas, 
                                    [col.id]: {
                                        ...currState,
                                        fornecedor_id: newFornecedor,
                                        fornecedor_nome: f?.fornecedor_nome,
                                        lote_id: '',
                                        numero_lote: '',
                                        data_fabricacao: '',
                                        data_validade: ''
                                    }
                                });
                            }}
                        >
                            {fornecedoresFiltrados.map((f: any) => (
                                <MenuItem key={f.fornecedor_id} value={f.fornecedor_id}>{f.fornecedor_nome}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            select
                            margin="normal"
                            label="Lote Disponível"
                            required={col.obrigatorio}
                            value={loteId}
                            disabled={!fornecedorId}
                            onChange={(e) => {
                                const newLote = e.target.value;
                                const l = lotesAtivos.find(l => l.id === newLote);
                                setRespostas({
                                    ...respostas, 
                                    [col.id]: {
                                        ...currState,
                                        lote_id: newLote,
                                        numero_lote: l?.numero_lote,
                                        data_fabricacao: l?.data_fabricacao,
                                        data_validade: l?.data_validade
                                    }
                                });
                            }}
                        >
                            {lotesFiltrados.map((l: any) => (
                                <MenuItem key={l.id} value={l.id}>{l.numero_lote}</MenuItem>
                            ))}
                        </TextField>

                        {loteId && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    label="Data de Fabricação"
                                    value={dataFab || 'N/A'}
                                    disabled
                                />
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    label="Data de Validade"
                                    value={dataVal || 'N/A'}
                                    disabled
                                />
                            </Box>
                        )}
                    </Box>
                );
            }
            case 'PRODUTO_LIMPEZA': {
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {materiaisLimpezaGrouped.map((item: any, idx: number) => {
                            if (item.type === 'header') {
                                return <ListSubheader key={`hdr-${idx}`} sx={{ fontWeight: 700, color: 'success.main', bgcolor: 'transparent' }}>{item.label}</ListSubheader>;
                            }
                            const display = item.marca ? `${item.nome} (${item.marca})` : item.nome;
                            return <MenuItem key={item.id} value={display} sx={{ pl: 4 }}>{display}</MenuItem>;
                        })}
                        {materiaisLimpezaGrouped.length === 0 && (
                            <MenuItem disabled>Nenhum produto de limpeza cadastrado</MenuItem>
                        )}
                    </TextField>
                );
            }
            case 'MATERIAL_EPI': {
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {epiGrouped.map((item: any, idx: number) => {
                            if (item.type === 'header') {
                                return <ListSubheader key={`hdr-${idx}`} sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'transparent' }}>{item.label}</ListSubheader>;
                            }
                            const display = item.marca ? `${item.nome} (${item.marca})` : item.nome;
                            return <MenuItem key={item.id} value={display} sx={{ pl: 4 }}>{display}</MenuItem>;
                        })}
                        {epiGrouped.length === 0 && (
                            <MenuItem disabled>Nenhum EPI cadastrado</MenuItem>
                        )}
                    </TextField>
                );
            }
            case 'MATERIAL_UNIFORME': {
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {uniformeGrouped.map((item: any, idx: number) => {
                            if (item.type === 'header') {
                                return <ListSubheader key={`hdr-${idx}`} sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'transparent' }}>{item.label}</ListSubheader>;
                            }
                            const display = item.marca ? `${item.nome} (${item.marca})` : item.nome;
                            return <MenuItem key={item.id} value={display} sx={{ pl: 4 }}>{display}</MenuItem>;
                        })}
                        {uniformeGrouped.length === 0 && (
                            <MenuItem disabled>Nenhum uniforme cadastrado</MenuItem>
                        )}
                    </TextField>
                );
            }
            case 'DATETIME':
                return (
                    <TextField
                        fullWidth
                        type="datetime-local"
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                );
            case 'DATE':
                return (
                    <TextField
                        fullWidth
                        type="date"
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                );
            case 'FORNECEDOR':
                return (
                    <TextField
                        fullWidth
                        select
                        margin="normal"
                        label={col.titulo}
                        required={col.obrigatorio}
                        value={respostas[col.id] || ''}
                        onChange={(e) => setRespostas({ ...respostas, [col.id]: e.target.value })}
                    >
                        {fornecedoresOptions.map((f: any) => (
                            <MenuItem key={f.id} value={f.nome_fantasia || f.razao_social}>
                                {f.nome_fantasia || f.razao_social}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            case 'MULTI_SELECT': {
                let options: string[] = [];
                if (Array.isArray(col.opcoes)) {
                    options = col.opcoes;
                } else if (typeof col.opcoes === 'string') {
                    try {
                        options = JSON.parse(col.opcoes);
                    } catch(e) {
                        options = col.opcoes.split(',').map((s: string) => s.trim());
                    }
                }
                const currentVal = respostas[col.id] || { values: [], outro: '' };
                const selectedValues = currentVal.values || [];
                const hasOutro = selectedValues.includes('Outro');

                return (
                    <Box key={col.id} sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            select
                            margin="normal"
                            label={col.titulo}
                            required={col.obrigatorio}
                            value={selectedValues}
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected: any) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value: string) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )
                            }}
                            onChange={(e) => {
                                const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                setRespostas({ ...respostas, [col.id]: { ...currentVal, values: val as string[] } });
                            }}
                        >
                            {options.map((opt: string) => (
                                <MenuItem key={opt} value={opt}>
                                    {opt}
                                </MenuItem>
                            ))}
                        </TextField>

                        {hasOutro && (
                            <TextField
                                fullWidth
                                margin="dense"
                                label="Especifique o Outro"
                                required
                                value={currentVal.outro || ''}
                                onChange={(e) => setRespostas({ ...respostas, [col.id]: { ...currentVal, outro: e.target.value } })}
                            />
                        )}
                    </Box>
                );
            }
            case 'TABELA_DINAMICA_ISCAS': {
                const iscas = respostas[col.id] || [];
                
                const handleAddIsca = () => {
                    setRespostas({
                        ...respostas,
                        [col.id]: [...iscas, { setor: '', tipo_isca: '', quantidade: 1 }]
                    });
                };

                const handleRemoveIsca = (idx: number) => {
                    const nova = [...iscas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const handleChangeIsca = (idx: number, field: string, val: any) => {
                    const nova = [...iscas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const iscasOptions = [
                    'Porta-Isca Granulado',
                    'Porta-Isca Bloco Parafinado',
                    'Armadilha Adesiva',
                    'Armadilha Luminosa',
                    'Gel Baraticida',
                    'Gel Formicida',
                    'Outro'
                ];

                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {iscas.map((isca: any, idx: number) => (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Local / Setor"
                                    size="small"
                                    value={isca.setor}
                                    onChange={(e) => handleChangeIsca(idx, 'setor', e.target.value)}
                                >
                                    {setoresOptions.map((s: any) => (
                                        <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    fullWidth
                                    label="Tipo de Isca / Armadilha"
                                    size="small"
                                    value={isca.tipo_isca}
                                    onChange={(e) => handleChangeIsca(idx, 'tipo_isca', e.target.value)}
                                >
                                    {iscasOptions.map((opt) => (
                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    type="number"
                                    label="Qtd"
                                    size="small"
                                    value={isca.quantidade}
                                    sx={{ width: { xs: '100%', md: '100px' } }}
                                    onChange={(e) => handleChangeIsca(idx, 'quantidade', parseInt(e.target.value) || 0)}
                                />
                                <IconButton color="error" onClick={() => handleRemoveIsca(idx)}>
                                    <Trash2 size={20} />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={16} />} onClick={handleAddIsca} size="small">
                            Adicionar Aplicação
                        </Button>
                    </Box>
                );
            }
            case 'TABELA_DINAMICA_DIARIO_PRAGAS': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { setor: '', encontrou: 'Não', quais_pragas: [], acoes: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const pragasOptions = ['Barata', 'Escorpião', 'Formiga', 'Mosca', 'Rato', 'Outro'];
                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                                    <TextField select fullWidth label="Setor / Área" size="small" value={linha.setor} onChange={(e) => handleChange(idx, 'setor', e.target.value)}>
                                        {setoresOptions.map((s: any) => <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>)}
                                    </TextField>
                                    <TextField select label="Viu Pragas?" size="small" value={linha.encontrou} sx={{ width: { xs: '100%', md: '200px' } }} onChange={(e) => handleChange(idx, 'encontrou', e.target.value)}>
                                        <MenuItem value="Não">Não</MenuItem>
                                        <MenuItem value="Sim">Sim</MenuItem>
                                    </TextField>
                                    <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                                </Stack>
                                {linha.encontrou === 'Sim' && (
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                                        <TextField select fullWidth label="Quais pragas?" size="small" value={linha.quais_pragas || []}
                                            SelectProps={{ multiple: true, renderValue: (sel: any) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{sel.map((v: string) => <Chip key={v} label={v} size="small" />)}</Box> }}
                                            onChange={(e) => handleChange(idx, 'quais_pragas', e.target.value)}>
                                            {pragasOptions.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                        </TextField>
                                        <TextField fullWidth label="Ações Corretivas" size="small" value={linha.acoes || ''} onChange={(e) => handleChange(idx, 'acoes', e.target.value)} />
                                    </Stack>
                                )}
                            </Box>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Setor</Button>
                    </Box>
                );
            }
            case 'TABELA_DINAMICA_RALOS': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { setor: '', limpeza: 'Conforme', tampas: 'Sim', pragas: 'Não', acoes: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                                    <TextField select fullWidth label="Setor / Local" size="small" value={linha.setor} onChange={(e) => handleChange(idx, 'setor', e.target.value)}>
                                        {setoresOptions.map((s: any) => <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>)}
                                    </TextField>
                                    <TextField select label="Limpeza" size="small" value={linha.limpeza} sx={{ width: { xs: '100%', md: '200px' } }} onChange={(e) => handleChange(idx, 'limpeza', e.target.value)}>
                                        <MenuItem value="Conforme">Conforme</MenuItem>
                                        <MenuItem value="Não Conforme">Não Conforme</MenuItem>
                                    </TextField>
                                    <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                                </Stack>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                                    <TextField select label="Tampas Íntegras?" size="small" value={linha.tampas} sx={{ width: { xs: '100%', md: '200px' } }} onChange={(e) => handleChange(idx, 'tampas', e.target.value)}>
                                        <MenuItem value="Sim">Sim</MenuItem>
                                        <MenuItem value="Não">Não</MenuItem>
                                    </TextField>
                                    <TextField select label="Pragas?" size="small" value={linha.pragas} sx={{ width: { xs: '100%', md: '200px' } }} onChange={(e) => handleChange(idx, 'pragas', e.target.value)}>
                                        <MenuItem value="Não">Não</MenuItem>
                                        <MenuItem value="Sim">Sim</MenuItem>
                                    </TextField>
                                    <TextField fullWidth label="Ações/Obs" size="small" value={linha.acoes || ''} onChange={(e) => handleChange(idx, 'acoes', e.target.value)} />
                                </Stack>
                            </Box>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Ralo/Setor</Button>
                    </Box>
                );
            }
            case 'TABELA_DINAMICA_ARMADILHAS': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { local: '', praga: 'Nenhuma', qtd: 0, obs: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const pragasOptions = ['Nenhuma', 'Barata', 'Escorpião', 'Formiga', 'Mosca', 'Rato', 'Pássaro/Pombo', 'Outro'];
                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                                <TextField select fullWidth label="Local da Armadilha" size="small" value={linha.local} onChange={(e) => handleChange(idx, 'local', e.target.value)}>
                                    {setoresOptions.map((s: any) => <MenuItem key={s.id} value={s.nome}>{s.nome}</MenuItem>)}
                                </TextField>
                                <TextField select fullWidth label="Praga" size="small" value={linha.praga} onChange={(e) => handleChange(idx, 'praga', e.target.value)}>
                                    {pragasOptions.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                </TextField>
                                <TextField type="number" label="Qtd" size="small" value={linha.qtd} sx={{ width: { xs: '100%', md: '100px' } }} onChange={(e) => handleChange(idx, 'qtd', parseInt(e.target.value) || 0)} />
                                <TextField fullWidth label="Observações" size="small" value={linha.obs} onChange={(e) => handleChange(idx, 'obs', e.target.value)} />
                                <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                            </Stack>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Armadilha</Button>
                    </Box>
                );
            }

            case 'TABELA_DINAMICA_AMOSTRAS': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { alimento: '', temperatura: '', qtd: '', condicao: 'Adequada', obs: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const searchProdutoForLine = async (query: string, idx: number) => {
                    const key = `${col.id}-${idx}`;
                    if (query.length < 2) {
                        setProdutoSearchResults(prev => ({ ...prev, [key]: [] }));
                        return;
                    }
                    setProdutoSearchLoading(prev => ({ ...prev, [key]: true }));
                    try {
                        const [recRes, fichaRes] = await Promise.all([
                            (supabase as any).from('receitas')
                                .select('id, nome')
                                .eq('cliente_id', activeClientId)
                                .ilike('nome', `%${query}%`)
                                .limit(10),
                            (supabase as any).from('fichas_tecnicas_uan')
                                .select('id, nome')
                                .eq('cliente_id', activeClientId)
                                .ilike('nome', `%${query}%`)
                                .limit(10),
                        ]);
                        const results = [
                            ...(recRes.data || []).map((r: any) => ({ label: r.nome, source: 'Receita' })),
                            ...(fichaRes.data || []).map((f: any) => ({ label: f.nome, source: 'Ficha Técnica UAN' })),
                        ];
                        setProdutoSearchResults(prev => ({ ...prev, [key]: results }));
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setProdutoSearchLoading(prev => ({ ...prev, [key]: false }));
                    }
                };

                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
                                        options={produtoSearchResults[`${col.id}-${idx}`] || []}
                                        getOptionLabel={(option: any) => typeof option === 'string' ? option : option.label}
                                        renderOption={(props, option: any) => (
                                            <li {...props} key={`${option.source}-${option.label}`}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    <Chip label={option.source} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                    <Typography variant="body2">{option.label}</Typography>
                                                </Box>
                                            </li>
                                        )}
                                        inputValue={linha.alimento || ''}
                                        onInputChange={(_, val) => {
                                            handleChange(idx, 'alimento', val);
                                            searchProdutoForLine(val, idx);
                                        }}
                                        onChange={(_, val) => {
                                            if (val && typeof val !== 'string') {
                                                handleChange(idx, 'alimento', val.label);
                                            }
                                        }}
                                        loading={produtoSearchLoading[`${col.id}-${idx}`] || false}
                                        renderInput={(params) => <TextField {...params} label="Alimento / Preparação" size="small" placeholder="Busque receita ou ficha UAN..." />}
                                    />
                                    <TextField type="number" label="Temp. (°C)" size="small" value={linha.temperatura} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'temperatura', e.target.value)} />
                                    <TextField type="number" label="Qtd (g)" size="small" value={linha.qtd} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'qtd', e.target.value)} />
                                    <TextField select label="Condição" size="small" value={linha.condicao} sx={{ width: { xs: '100%', md: '150px' } }} onChange={(e) => handleChange(idx, 'condicao', e.target.value)}>
                                        <MenuItem value="Adequada">Adequada</MenuItem>
                                        <MenuItem value="Inadequada">Inadequada</MenuItem>
                                    </TextField>
                                    <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                                </Stack>
                                <TextField fullWidth label="Observações" size="small" value={linha.obs} onChange={(e) => handleChange(idx, 'obs', e.target.value)} />
                                {linha.alimento && (
                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button size="small" variant="text" startIcon={<Printer size={16} />} onClick={() => handlePrintAmostras([linha])}>
                                            Gerar Etiqueta
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        ))}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Amostra</Button>
                            {linhas.length > 0 && (
                                <Button variant="contained" color="primary" startIcon={<Printer size={18} />} onClick={() => handlePrintAmostras(linhas)}>
                                    Gerar Todas as Etiquetas
                                </Button>
                            )}
                        </Box>
                    </Box>
                );
            }

            case 'TABELA_DINAMICA_DESPERDICIOS': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { alimento: '', total_produzido: '', sobra_limpa: '', sobra_suja: '', refeicoes: '', obs: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const searchProdutoForLine = async (query: string, idx: number) => {
                    const key = `${col.id}-${idx}`;
                    if (query.length < 2) {
                        setProdutoSearchResults(prev => ({ ...prev, [key]: [] }));
                        return;
                    }
                    setProdutoSearchLoading(prev => ({ ...prev, [key]: true }));
                    try {
                        const [recRes, fichaRes] = await Promise.all([
                            (supabase as any).from('receitas').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                            (supabase as any).from('fichas_tecnicas_uan').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                        ]);
                        const results = [
                            ...(recRes.data || []).map((r: any) => ({ label: r.nome, source: 'Receita' })),
                            ...(fichaRes.data || []).map((f: any) => ({ label: f.nome, source: 'Ficha Técnica UAN' })),
                        ];
                        setProdutoSearchResults(prev => ({ ...prev, [key]: results }));
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setProdutoSearchLoading(prev => ({ ...prev, [key]: false }));
                    }
                };

                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
                                        options={produtoSearchResults[`${col.id}-${idx}`] || []}
                                        getOptionLabel={(option: any) => typeof option === 'string' ? option : option.label}
                                        renderOption={(props, option: any) => (
                                            <li {...props} key={`${option.source}-${option.label}`}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    <Chip label={option.source} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                    <Typography variant="body2">{option.label}</Typography>
                                                </Box>
                                            </li>
                                        )}
                                        inputValue={linha.alimento || ''}
                                        onInputChange={(_, val) => {
                                            handleChange(idx, 'alimento', val);
                                            searchProdutoForLine(val, idx);
                                        }}
                                        onChange={(_, val) => {
                                            if (val && typeof val !== 'string') {
                                                handleChange(idx, 'alimento', val.label);
                                            }
                                        }}
                                        loading={produtoSearchLoading[`${col.id}-${idx}`] || false}
                                        renderInput={(params) => <TextField {...params} label="Alimento / Preparação" size="small" placeholder="Busque receita ou ficha UAN..." />}
                                    />
                                    <TextField type="number" label="Produzido (Kg)" size="small" value={linha.total_produzido} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'total_produzido', e.target.value)} />
                                    <TextField type="number" label="S. Limpa (Kg)" size="small" value={linha.sobra_limpa} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'sobra_limpa', e.target.value)} />
                                    <TextField type="number" label="S. Suja (Kg)" size="small" value={linha.sobra_suja} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'sobra_suja', e.target.value)} />
                                    <TextField type="number" label="Nº Refeições" size="small" value={linha.refeicoes} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'refeicoes', e.target.value)} />
                                    <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                                </Stack>
                                <TextField fullWidth label="Observações" size="small" value={linha.obs} onChange={(e) => handleChange(idx, 'obs', e.target.value)} />
                            </Box>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Desperdício</Button>
                    </Box>
                );
            }

            case 'TABELA_DINAMICA_PORCIONAMENTO': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { alimento: '', porcoes: '', qtd: '', obs: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const searchProdutoForLine = async (query: string, idx: number) => {
                    const key = `${col.id}-${idx}`;
                    if (query.length < 2) {
                        setProdutoSearchResults(prev => ({ ...prev, [key]: [] }));
                        return;
                    }
                    setProdutoSearchLoading(prev => ({ ...prev, [key]: true }));
                    try {
                        const [recRes, fichaRes] = await Promise.all([
                            (supabase as any).from('receitas').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                            (supabase as any).from('fichas_tecnicas_uan').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                        ]);
                        const results = [
                            ...(recRes.data || []).map((r: any) => ({ label: r.nome, source: 'Receita' })),
                            ...(fichaRes.data || []).map((f: any) => ({ label: f.nome, source: 'Ficha Técnica UAN' })),
                        ];
                        setProdutoSearchResults(prev => ({ ...prev, [key]: results }));
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setProdutoSearchLoading(prev => ({ ...prev, [key]: false }));
                    }
                };

                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} key={idx} sx={{ mb: 2, alignItems: 'center' }}>
                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    options={produtoSearchResults[`${col.id}-${idx}`] || []}
                                    getOptionLabel={(option: any) => typeof option === 'string' ? option : option.label}
                                    renderOption={(props, option: any) => (
                                        <li {...props} key={`${option.source}-${option.label}`}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                <Chip label={option.source} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                <Typography variant="body2">{option.label}</Typography>
                                            </Box>
                                        </li>
                                    )}
                                    inputValue={linha.alimento || ''}
                                    onInputChange={(_, val) => {
                                        handleChange(idx, 'alimento', val);
                                        searchProdutoForLine(val, idx);
                                    }}
                                    onChange={(_, val) => {
                                        if (val && typeof val !== 'string') {
                                            handleChange(idx, 'alimento', val.label);
                                        }
                                    }}
                                    loading={produtoSearchLoading[`${col.id}-${idx}`] || false}
                                    renderInput={(params) => <TextField {...params} label="Alimento / Preparação" size="small" placeholder="Busque receita ou ficha UAN..." />}
                                />
                                <TextField type="number" label="Porções Preparadas" size="small" value={linha.porcoes} sx={{ width: { xs: '100%', md: '180px' } }} onChange={(e) => handleChange(idx, 'porcoes', e.target.value)} />
                                <TextField type="number" label="Qtd Utilizada (g)" size="small" value={linha.qtd} sx={{ width: { xs: '100%', md: '150px' } }} onChange={(e) => handleChange(idx, 'qtd', e.target.value)} />
                                <TextField fullWidth label="Observações" size="small" value={linha.obs} onChange={(e) => handleChange(idx, 'obs', e.target.value)} />
                                <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                            </Stack>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Porcionamento</Button>
                    </Box>
                );
            }

            case 'TABELA_DINAMICA_QUALIDADE': {
                const linhas = respostas[col.id] || [];
                const handleAdd = () => {
                    setRespostas({ ...respostas, [col.id]: [...linhas, { alimento: '', aparencia: 'Conforme', sabor: 'Conforme', temperatura: '', obs: '' }] });
                };
                const handleRemove = (idx: number) => {
                    const nova = [...linhas];
                    nova.splice(idx, 1);
                    setRespostas({ ...respostas, [col.id]: nova });
                };
                const handleChange = (idx: number, field: string, val: any) => {
                    const nova = [...linhas];
                    nova[idx] = { ...nova[idx], [field]: val };
                    setRespostas({ ...respostas, [col.id]: nova });
                };

                const searchProdutoForLine = async (query: string, idx: number) => {
                    const key = `${col.id}-${idx}`;
                    if (query.length < 2) {
                        setProdutoSearchResults(prev => ({ ...prev, [key]: [] }));
                        return;
                    }
                    setProdutoSearchLoading(prev => ({ ...prev, [key]: true }));
                    try {
                        const [recRes, fichaRes] = await Promise.all([
                            (supabase as any).from('receitas').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                            (supabase as any).from('fichas_tecnicas_uan').select('id, nome').eq('cliente_id', activeClientId).ilike('nome', `%${query}%`).limit(10),
                        ]);
                        const results = [
                            ...(recRes.data || []).map((r: any) => ({ label: r.nome, source: 'Receita' })),
                            ...(fichaRes.data || []).map((f: any) => ({ label: f.nome, source: 'Ficha Técnica UAN' })),
                        ];
                        setProdutoSearchResults(prev => ({ ...prev, [key]: results }));
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setProdutoSearchLoading(prev => ({ ...prev, [key]: false }));
                    }
                };

                return (
                    <Box key={col.id} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>{col.titulo}</Typography>
                        {linhas.map((linha: any, idx: number) => (
                            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
                                        options={produtoSearchResults[`${col.id}-${idx}`] || []}
                                        getOptionLabel={(option: any) => typeof option === 'string' ? option : option.label}
                                        renderOption={(props, option: any) => (
                                            <li {...props} key={`${option.source}-${option.label}`}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    <Chip label={option.source} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                    <Typography variant="body2">{option.label}</Typography>
                                                </Box>
                                            </li>
                                        )}
                                        inputValue={linha.alimento || ''}
                                        onInputChange={(_, val) => {
                                            handleChange(idx, 'alimento', val);
                                            searchProdutoForLine(val, idx);
                                        }}
                                        onChange={(_, val) => {
                                            if (val && typeof val !== 'string') {
                                                handleChange(idx, 'alimento', val.label);
                                            }
                                        }}
                                        loading={produtoSearchLoading[`${col.id}-${idx}`] || false}
                                        renderInput={(params) => <TextField {...params} label="Alimento / Preparação" size="small" placeholder="Busque receita ou ficha UAN..." />}
                                    />
                                    <TextField select label="Aparência" size="small" value={linha.aparencia} sx={{ width: { xs: '100%', md: '150px' } }} onChange={(e) => handleChange(idx, 'aparencia', e.target.value)}>
                                        <MenuItem value="Conforme">Conforme</MenuItem>
                                        <MenuItem value="Não Conforme">Não Conforme</MenuItem>
                                    </TextField>
                                    <TextField select label="Sabor" size="small" value={linha.sabor} sx={{ width: { xs: '100%', md: '150px' } }} onChange={(e) => handleChange(idx, 'sabor', e.target.value)}>
                                        <MenuItem value="Conforme">Conforme</MenuItem>
                                        <MenuItem value="Não Conforme">Não Conforme</MenuItem>
                                    </TextField>
                                    <TextField type="number" label="Temp. (°C)" size="small" value={linha.temperatura} sx={{ width: { xs: '100%', md: '120px' } }} onChange={(e) => handleChange(idx, 'temperatura', e.target.value)} />
                                    <IconButton color="error" onClick={() => handleRemove(idx)}><Trash2 size={20} /></IconButton>
                                </Stack>
                                <TextField fullWidth label="Observações" size="small" value={linha.obs} onChange={(e) => handleChange(idx, 'obs', e.target.value)} />
                            </Box>
                        ))}
                        <Button variant="outlined" startIcon={<Plus size={18} />} onClick={handleAdd}>Adicionar Avaliação</Button>
                    </Box>
                );
            }

            case 'FILE':
            case 'PHOTO':
                return (
                    <Box mt={2} mb={1}>
                        <Typography variant="body2" color="text.secondary">{col.titulo} (Upload de Arquivo/Foto)</Typography>
                        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                            Selecionar Arquivo
                            <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, (b64) => setRespostas({...respostas, [col.id]: b64}))} />
                        </Button>
                        {respostas[col.id] && (
                            <Box mt={1}>
                                {respostas[col.id].startsWith('data:image') ? (
                                    <img src={respostas[col.id]} alt="Upload" style={{ maxHeight: 150, borderRadius: 8, border: '1px solid #ddd' }} />
                                ) : (
                                    <Typography variant="body2" color="primary">📄 Arquivo anexado</Typography>
                                )}
                                <Button size="small" color="error" onClick={() => setRespostas({...respostas, [col.id]: ''})} sx={{ display: 'block', mt: 1 }}>Remover</Button>
                            </Box>
                        )}
                    </Box>
                );
            case 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA':
            case 'TABELA_DINAMICA_AMBIENTE':
            case 'TABELA_DINAMICA_RESFRIAMENTO':
                const isTempUnificada = col.tipo === 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA';
                const isAmbiente = col.tipo === 'TABELA_DINAMICA_AMBIENTE';
                const isResfriamento = col.tipo === 'TABELA_DINAMICA_RESFRIAMENTO';
                const linhasTemp = respostas[col.id] || [];

                return (
                    <Box mt={3} mb={2}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {col.titulo} {col.obrigatorio && <span style={{ color: 'red' }}>*</span>}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        {isTempUnificada && (
                                            <>
                                                <TableCell>Equipamento</TableCell>
                                                <TableCell>Temp. Equipamento (°C)</TableCell>
                                                <TableCell>Alimento / Produto</TableCell>
                                                <TableCell>Temp. Alimento (°C)</TableCell>
                                                <TableCell>Situação da Amostra</TableCell>
                                            </>
                                        )}
                                        {isAmbiente && (
                                            <>
                                                <TableCell>Setor / Área</TableCell>
                                                <TableCell>Temperatura (°C)</TableCell>
                                                <TableCell>Situação</TableCell>
                                            </>
                                        )}
                                        {isResfriamento && (
                                            <>
                                                <TableCell>Alimento</TableCell>
                                                <TableCell>Temp. Inicial (°C)</TableCell>
                                                <TableCell>Hora Início</TableCell>
                                                <TableCell>Temp. Final (°C)</TableCell>
                                                <TableCell>Hora Fim</TableCell>
                                            </>
                                        )}
                                        <TableCell>Observações / Ação Corretiva</TableCell>
                                        {(isResfriamento || (!isTempUnificada && !isAmbiente)) && <TableCell align="center">Ações</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {linhasTemp.map((linha: any, index: number) => (
                                        <TableRow key={linha.id || index}>
                                            {isTempUnificada && (
                                                <>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Typography variant="body2">{linha.equipamento_nome}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            fullWidth
                                                            value={linha.temp_equipamento}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].temp_equipamento = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            value={linha.alimento_nome}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].alimento_nome = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            fullWidth
                                                            value={linha.temp_alimento}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].temp_alimento = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <Select
                                                            size="small"
                                                            fullWidth
                                                            value={linha.status || 'Adequado'}
                                                            onChange={(e: any) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].status = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        >
                                                            <MenuItem value="Adequado">Adequado</MenuItem>
                                                            <MenuItem value="Inadequado">Inadequado</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                </>
                                            )}
                                            {isAmbiente && (
                                                <>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <Typography variant="body2">{linha.setor_nome}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            fullWidth
                                                            value={linha.temp_ambiente}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].temp_ambiente = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <Select
                                                            size="small"
                                                            fullWidth
                                                            value={linha.status || 'Adequado'}
                                                            onChange={(e: any) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].status = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        >
                                                            <MenuItem value="Adequado">Adequado</MenuItem>
                                                            <MenuItem value="Inadequado">Inadequado</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                </>
                                            )}
                                            {isResfriamento && (
                                                <>
                                                    <TableCell sx={{ minWidth: 200 }}>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            value={linha.alimento_nome}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].alimento_nome = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            fullWidth
                                                            value={linha.temp_inicial}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].temp_inicial = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="time"
                                                            fullWidth
                                                            value={linha.hora_inicial}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].hora_inicial = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            fullWidth
                                                            value={linha.temp_final}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].temp_final = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 150 }}>
                                                        <TextField
                                                            size="small"
                                                            type="time"
                                                            fullWidth
                                                            value={linha.hora_final}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const novasLinhas = [...linhasTemp];
                                                                novasLinhas[index].hora_final = val;
                                                                setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                            }}
                                                        />
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell sx={{ minWidth: 200 }}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={linha.obs || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const novasLinhas = [...linhasTemp];
                                                        novasLinhas[index].obs = val;
                                                        setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                    }}
                                                    placeholder="Observação"
                                                />
                                            </TableCell>
                                            {(isResfriamento || (!isTempUnificada && !isAmbiente)) && (
                                                <TableCell align="center">
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => {
                                                            const novasLinhas = linhasTemp.filter((_: any, i: number) => i !== index);
                                                            setRespostas({ ...respostas, [col.id]: novasLinhas });
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {(isResfriamento || (!isTempUnificada && !isAmbiente)) && (
                            <Button
                                startIcon={<Plus size={18} />}
                                sx={{ mt: 1 }}
                                onClick={() => {
                                    const novaLinha: any = { id: crypto.randomUUID() };
                                    if (isResfriamento) {
                                        novaLinha.alimento_nome = '';
                                        novaLinha.temp_inicial = '';
                                        novaLinha.hora_inicial = '';
                                        novaLinha.temp_final = '';
                                        novaLinha.hora_final = '';
                                        novaLinha.obs = '';
                                    }
                                    setRespostas({ ...respostas, [col.id]: [...linhasTemp, novaLinha] });
                                }}
                            >
                                Adicionar Linha
                            </Button>
                        )}
                    </Box>
                );
            case 'SIGNATURE':
                return (
                    <Box mt={3} mb={2} border={1} borderColor="grey.300" borderRadius={2} p={2} bgcolor="#fafafa">
                        <Typography variant="subtitle2" color="primary" mb={1}>{col.titulo} (Assinatura Digital)</Typography>
                        
                        {respostas[col.id] ? (
                            <Box>
                                <img src={respostas[col.id]} alt="Assinatura" style={{ maxHeight: 100, border: '1px solid #eee', background: '#fff', borderRadius: 4 }} />
                                <Button size="small" onClick={() => setRespostas({...respostas, [col.id]: ''})} sx={{ display: 'block', mt: 1 }}>Refazer / Limpar</Button>
                            </Box>
                        ) : (
                            <Box>
                                <SignatureCanvas 
                                    ref={(ref) => { sigCanvasRef.current[col.id] = ref }} 
                                    canvasProps={{ style: { border: '1px dashed #ccc', width: '100%', height: 150, background: '#fff', borderRadius: 4 } }}
                                />
                                <Stack direction="row" spacing={2} mt={1}>
                                    <Button size="small" variant="contained" onClick={() => {
                                        if (sigCanvasRef.current[col.id] && !sigCanvasRef.current[col.id].isEmpty()) {
                                            try {
                                                const b64 = sigCanvasRef.current[col.id].toDataURL('image/png');
                                                setRespostas({...respostas, [col.id]: b64});
                                            } catch (err: any) {
                                                console.error("Erro na assinatura:", err);
                                                alert("Erro ao salvar assinatura. Tente novamente.");
                                            }
                                        }
                                    }}>Confirmar Assinatura</Button>
                                    <Button size="small" color="error" onClick={() => {
                                        if (sigCanvasRef.current[col.id]) {
                                            sigCanvasRef.current[col.id].clear();
                                        }
                                    }}>Limpar Quadro</Button>
                                </Stack>
                            </Box>
                        )}

                        {!respostas[col.id] && userSignature && (
                            <Button size="small" color="secondary" variant="outlined" onClick={() => setRespostas({...respostas, [col.id]: userSignature})} sx={{ mt: 2 }}>
                                Usar minha assinatura salva
                            </Button>
                        )}

                        {respostas[col.id] && respostas[col.id] !== userSignature && (
                            <FormControlLabel
                                control={<Checkbox checked={saveSignature} onChange={(e) => setSaveSignature(e.target.checked)} />}
                                label="Salvar como minha assinatura padrão para o futuro"
                                sx={{ mt: 1, display: 'block' }}
                            />
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!modelo) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="error">Planilha não encontrada.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <IconButton onClick={() => router.push('/qualidade/controle-producao')} size="small">
                    <ArrowLeft size={20} />
                </IconButton>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                    {modelo.titulo}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {!unidadeId && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Selecione uma Unidade no topo para registrar novas planilhas ou ver o histórico da unidade.
                </Alert>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Histórico de Preenchimento</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<Plus size={18} />}
                    onClick={handleOpenForm}
                    disabled={!unidadeId}
                >
                    Novo Registro
                </Button>
            </Stack>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Data Referência</TableCell>
                                <TableCell>Item Monitorado</TableCell>
                                <TableCell>Preenchido Por</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {registros.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Nenhum registro encontrado.</TableCell>
                                </TableRow>
                            ) : (
                                registros.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>{reg.data_referencia_local || formatLocalDate(reg.data_referencia)}</TableCell>
                                        <TableCell>{reg.item_monitorado || '-'}</TableCell>
                                        <TableCell>{reg.profiles?.full_name || 'Desconhecido'}</TableCell>
                                        <TableCell>{reg.status}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="primary">
                                                <Eye size={18} />
                                            </IconButton>
                                            <IconButton size="small" color="info">
                                                <Download size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Modal de Nova Planilha */}
            <Dialog open={openNovaPlanilha} onClose={() => setOpenNovaPlanilha(false)} maxWidth="md" fullWidth>
                <DialogTitle>Preencher Planilha: {modelo.titulo}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {configuracao?.itens_monitorados && configuracao.itens_monitorados.length > 0 && (
                            <Box mb={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Item Monitorado"
                                    required
                                    value={selectedItemMonitorado}
                                    onChange={(e) => setSelectedItemMonitorado(e.target.value)}
                                >
                                    {configuracao.itens_monitorados.map((item: string) => (
                                        <MenuItem key={item} value={item}>{item}</MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        )}
                        {colunas.map((col) => (
                            <Box key={col.id}>
                                {renderCampo(col)}
                            </Box>
                        ))}
                    </Stack>

                    <Divider sx={{ my: 4 }} />
                    <Box bgcolor="#f8fafc" p={3} borderRadius={2} border="1px solid #e2e8f0">
                        <Typography variant="subtitle1" fontWeight={600}>Anexos e Comprovantes Gerais</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Adicione fotos, notas ou outros documentos comprobatórios desta avaliação.
                        </Typography>
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={anexosGerais.length > 0 ? 2 : 0}>
                            {anexosGerais.map((anexo, i) => (
                                <Chip 
                                    key={i} 
                                    label={anexo.name} 
                                    onDelete={() => setAnexosGerais(anexosGerais.filter((_, idx) => idx !== i))} 
                                    avatar={anexo.data.startsWith('data:image') ? <Avatar src={anexo.data} /> : undefined}
                                    sx={{ m: 0.5 }}
                                />
                            ))}
                        </Stack>

                        <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                            Adicionar Anexo
                            <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                                handleFileUpload(e, (b64, name) => setAnexosGerais([...anexosGerais, { name, data: b64 }]))
                            }} />
                        </Button>
                    </Box>

                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenNovaPlanilha(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleFormSubmit} disabled={submitting}>
                        {submitting ? 'Salvando...' : 'Salvar Registro'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Etiqueta */}
            <Dialog open={openEtiquetaModal} onClose={() => setOpenEtiquetaModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Imprimir Etiquetas
                    {dadosEtiquetaAtual.length > 1 && ` (${previewIndex + 1} de ${dadosEtiquetaAtual.length})`}
                </DialogTitle>
                <DialogContent>
                    {dadosEtiquetaAtual.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                {dadosEtiquetaAtual.length > 1 && (
                                    <IconButton 
                                        onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                                        disabled={previewIndex === 0}
                                    >
                                        <ChevronLeft />
                                    </IconButton>
                                )}
                                <Box sx={{ flexShrink: 0, overflow: 'hidden' }}>
                                    <EtiquetaPreview dados={dadosEtiquetaAtual[previewIndex]} />
                                </Box>
                                {dadosEtiquetaAtual.length > 1 && (
                                    <IconButton 
                                        onClick={() => setPreviewIndex(p => Math.min(dadosEtiquetaAtual.length - 1, p + 1))}
                                        disabled={previewIndex === dadosEtiquetaAtual.length - 1}
                                    >
                                        <ChevronRight />
                                    </IconButton>
                                )}
                            </Box>
                            
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <EtiquetaPrinter 
                                    dados={dadosEtiquetaAtual} 
                                    onPrintSuccess={() => setOpenEtiquetaModal(false)} 
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEtiquetaModal(false)}>Cancelar / Fechar</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}
