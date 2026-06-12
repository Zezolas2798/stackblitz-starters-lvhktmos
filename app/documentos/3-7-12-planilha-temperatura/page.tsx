'use client';

import { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { calcularFaixaEquipamento, FaixaCalculada, classificarCongelado, avaliarAfericao } from '@/lib/temperatura/calcularFaixaEquipamento';
import {
    Box, Typography, Button, Paper, TextField, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Snackbar, Alert, Container, IconButton,
    Divider, useTheme, alpha, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
    ChevronLeft, Printer, Search, AlertCircle, Calendar, Thermometer, CheckCircle, FileSignature
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceArea, ResponsiveContainer
} from 'recharts';
import SignatureCanvas from 'react-signature-canvas';
import './PrintStyles.css';

interface Afericao {
    id: string;
    data: string;
    periodo: string;
    hora_afericao: string;
    temp_equipamento: number | null;
    temp_alimento: number | null;
    status?: string;
    alimento_nome?: string;
}

interface Props {
    isEmbedded?: boolean;
}

export default function RelatorioTemperaturaPage({ isEmbedded = false }: Props = {}) {
    const theme = useTheme();
    const router = useRouter();
    const { activeClientId, unidadeId: ctxUnidadeId, activeClientName, unidadeSelecionada } = useClient();

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });

    // Filtros
    const [dataInicio, setDataInicio] = useState(format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'));
    const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [equipamentoId, setEquipamentoId] = useState<string>('');
    const [equipamentosOptions, setEquipamentosOptions] = useState<any[]>([]);

    // Dados do Relatório
    const [dadosAfericao, setDadosAfericao] = useState<Afericao[]>([]);
    const [equipSelecionado, setEquipSelecionado] = useState<any>(null);
    const [faixaEquipamento, setFaixaEquipamento] = useState<FaixaCalculada | null>(null);

    // Assinatura do RT
    const [openAssinatura, setOpenAssinatura] = useState(false);
    const [assinaturaData, setAssinaturaData] = useState<{ id?: string; nome: string; cargo: string; crn: string; image: string | null }>({
        nome: '', cargo: 'Nutricionista RT', crn: '', image: null
    });
    const [colaboradoresOptions, setColaboradoresOptions] = useState<any[]>([]);
    const [realPlanosDeAcao, setRealPlanosDeAcao] = useState<any[]>([]);
    const sigCanvas = useRef<any>(null);

    // 1. Carregar lista de equipamentos e colaboradores
    useEffect(() => {
        if (!ctxUnidadeId) return;
        const fetchData = async () => {
            const { data: equips } = await supabase
                .from('equipamentos_config')
                .select('id, nome, tipo_equipamento, temp_ideal_min, temp_ideal_max')
                .eq('unidade_id', ctxUnidadeId)
                .eq('grupo', 'Temperaturas')
                .not('parent_id', 'is', null)
                .order('nome');
            if (equips) setEquipamentosOptions(equips);

            // 1. Fetch memberships for this unit to get user IDs and roles
            const { data: mems, error: memsErr } = await supabase
                .from('app_user_memberships')
                .select(`
                    usuario_id,
                    role_id,
                    app_roles ( nome )
                `)
                .eq('unidade_id', ctxUnidadeId)
                .eq('ativo', true);

            if (mems && mems.length > 0) {
                const userIds = mems.map(m => m.usuario_id);

                // 2. Fetch profiles for these users
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, registro_profissional')
                    .in('id', userIds);

                if (profilesData) {
                    const options = profilesData.map(prof => {
                        // Find matching membership for this profile to get role
                        const mem = mems.find(m => m.usuario_id === prof.id);
                        const role = mem?.app_roles ? (Array.isArray(mem.app_roles) ? mem.app_roles[0] : mem.app_roles) : null;
                        
                        return {
                            id: prof.id,
                            nome_completo: prof.full_name || 'Usuário Sem Nome',
                            funcao: role?.nome || '',
                            crn: prof.registro_profissional || ''
                        };
                    });
                    
                    options.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
                    setColaboradoresOptions(options);
                }
            }
        };
        fetchData();
    }, [ctxUnidadeId]);

    // 2. Buscar Dados e Faixa Ideal
    const handleGerarRelatorio = useCallback(async () => {
        if (!activeClientId || !ctxUnidadeId || !equipamentoId) {
            setMsg({ open: true, text: 'Selecione o equipamento e o período.', type: 'error' });
            return;
        }
        
        if (differenceInDays(parseISO(dataFim), parseISO(dataInicio)) > 31) {
            setMsg({ open: true, text: 'O período máximo permitido é de 31 dias.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // A. Pega os dados do equipamento
            const equip = equipamentosOptions.find(e => e.id === equipamentoId);
            setEquipSelecionado(equip);

            // B. Calcula a faixa ideal básica (sem levar em conta o alimento específico ainda)
            // Aqui buscamos a faixa geral do equipamento para desenhar o gráfico de fundo.
            const faixa = await calcularFaixaEquipamento(supabase as any, equipamentoId, null, null);
            setFaixaEquipamento(faixa);

            // C. Buscar as aferições na tabela controle_temperatura
            const { data: logs, error } = await supabase
                .from('controle_temperatura')
                .select(`
                    id, data, periodo, hora_afericao, temp_equipamento, temp_alimento, status,
                    produto_id, receita_id
                `)
                .eq('equipamento_id', equipamentoId)
                .gte('data', dataInicio)
                .lte('data', dataFim)
                .order('data', { ascending: true })
                .order('periodo', { ascending: true }); // Nota: MANHA/TARDE ordenam alfabeticamente correto M->T.

            if (error) throw error;

            // Busca os nomes dos alimentos vinculados (resolução em lote para resolver a lentidão)
            const produtoIds = (logs || []).map(l => l.produto_id).filter((id, index, self) => id && self.indexOf(id) === index) as string[];
            const receitaIds = (logs || []).map(l => l.receita_id).filter((id, index, self) => id && self.indexOf(id) === index) as string[];

            const nomesMap = new Map<string, string>();

            if (produtoIds.length > 0) {
                const { data: produtos } = await supabase.from('ingredientes').select('id, nome').in('id', produtoIds);
                produtos?.forEach(p => nomesMap.set(p.id, p.nome));
            }
            if (receitaIds.length > 0) {
                const { data: receitas } = await supabase.from('receitas').select('id, nome').in('id', receitaIds);
                receitas?.forEach(r => nomesMap.set(r.id, r.nome));
            }

            const resolvedLogs = (logs || []).map((log) => {
                let alimento_nome = '';
                if (log.produto_id) alimento_nome = nomesMap.get(log.produto_id) || '';
                else if (log.receita_id) alimento_nome = nomesMap.get(log.receita_id) || '';
                
                return {
                    ...log,
                    alimento_nome
                };
            });

            setDadosAfericao(resolvedLogs as Afericao[]);

            // D. Buscar Planos de Ação reais
            const { data: planosRes } = await supabase
                .from('qual_planos_acao')
                .select('*, rt:criado_por(full_name)')
                .eq('cliente_id', activeClientId)
                .eq('unidade_id', ctxUnidadeId)
                .eq('origem_modulo', 'PLANILHA_TEMPERATURA')
                .eq('origem_id', equipamentoId);
                
            setRealPlanosDeAcao(planosRes || []);

        } catch (err) {
            console.error('Erro ao gerar relatório', err);
            setMsg({ open: true, text: 'Erro ao gerar relatório.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [activeClientId, ctxUnidadeId, equipamentoId, dataInicio, dataFim, equipamentosOptions]);


    // 3. Processamento para o Gráfico (Eixo X linear cronológico)
    const chartData = useMemo(() => {
        return dadosAfericao.map(d => ({
            name: `${format(parseISO(d.data), 'dd/MM')} - ${d.periodo === 'MANHA' ? 'M' : d.periodo === 'TARDE' ? 'T' : d.periodo}`,
            fullDate: d.data,
            periodo: d.periodo,
            tempEquip: d.temp_equipamento !== null && d.temp_equipamento !== undefined ? Number(Number(d.temp_equipamento).toFixed(1)) : null,
            tempAlim: d.temp_alimento !== null && d.temp_alimento !== undefined ? Number(Number(d.temp_alimento).toFixed(1)) : null,
            hora: d.hora_afericao
        }));
    }, [dadosAfericao]);

    // Função auxiliar para classificar temperatura individual na tabela
    const avaliarTemperatura = useCallback((temp: number | null | undefined) => {
        return avaliarAfericao(temp, faixaEquipamento, equipSelecionado?.temp_ideal_min, equipSelecionado?.temp_ideal_max);
    }, [faixaEquipamento, equipSelecionado, theme]);

    // 4. Processamento para a Tabela (Agrupado por Data e separado dinamicamente por Turno/Período)
    const { periodosExistentes, tableData } = useMemo(() => {
        const periodosSet = new Set<string>();
        dadosAfericao.forEach(d => {
            if (d.periodo) periodosSet.add(d.periodo);
        });

        // Ordem preferencial dos turnos padrão
        const orderMap: Record<string, number> = {
            'MANHA': 1, '1': 1, '1º TURNO': 1,
            'TARDE': 2, '2': 2, '2º TURNO': 2,
            'NOITE': 3, '3': 3, '3º TURNO': 3
        };
        const periodos = Array.from(periodosSet).sort((a, b) => {
            const ordA = orderMap[a.toUpperCase()] ?? 99;
            const ordB = orderMap[b.toUpperCase()] ?? 99;
            if (ordA !== ordB) return ordA - ordB;
            return a.localeCompare(b);
        });

        const finalPeriodos = periodos.length > 0 ? periodos : ['MANHA', 'TARDE'];

        const agrupadoporDia: Record<string, { data: string; turnos: Record<string, Afericao> }> = {};
        
        dadosAfericao.forEach(d => {
            if (!agrupadoporDia[d.data]) {
                agrupadoporDia[d.data] = { data: d.data, turnos: {} };
            }
            if (d.periodo) {
                agrupadoporDia[d.data].turnos[d.periodo] = d;
            }
        });

        const sortedRows = Object.values(agrupadoporDia).sort((a, b) => a.data.localeCompare(b.data));

        return { periodosExistentes: finalPeriodos, tableData: sortedRows };
    }, [dadosAfericao]);

    // 5. Planos de Ação (Banco de Dados) e Total NCs
    const { planosDeAcao, totalNCs } = useMemo(() => {
        let ncsCount = 0;

        dadosAfericao.forEach(d => {
            const teOut = avaliarTemperatura(d.temp_equipamento);
            const taOut = avaliarTemperatura(d.temp_alimento);
            if ((teOut && !teOut.isValid) || (taOut && !taOut.isValid)) {
                if (d.status !== 'DESLIGADO' && d.status !== 'VAZIO') {
                    ncsCount++;
                }
            }
        });

        // Filtrar planos que tenham interseção com as datas atuais
        // Simplificado: mostrar os planos retornados para o equipamento selecionado
        const planos = realPlanosDeAcao.map(p => ({
            id: p.id,
            periodoAfetado: p.periodo_referencia,
            causa: p.causa_raiz,
            solucao: p.acao_corretiva,
            insight: p.insights,
            rt_responsavel: p.rt?.full_name || 'Responsável'
        }));

        return { planosDeAcao: planos, totalNCs: ncsCount };
    }, [dadosAfericao, avaliarTemperatura, realPlanosDeAcao]);

    const handlePrint = () => {
        const oldTitle = document.title;
        if (dadosAfericao.length > 0 && equipSelecionado) {
            const di = dataInicio ? format(parseISO(dataInicio), 'dd-MM-yyyy') : '';
            const df = dataFim ? format(parseISO(dataFim), 'dd-MM-yyyy') : '';
            const equipName = equipSelecionado.nome.replace(/[^a-zA-Z0-9\u00C0-\u00FF]+/g, '_');
            document.title = `Planilha_Temperatura_${equipName}_${di}_a_${df}`;
        }
        window.print();
        setTimeout(() => {
            document.title = oldTitle;
        }, 1000);
    };

    let rawMin = equipSelecionado?.temp_ideal_min;
    let rawMax = equipSelecionado?.temp_ideal_max;
    if (faixaEquipamento) {
        rawMin = faixaEquipamento.min;
        rawMax = faixaEquipamento.max;
    }
    
    // Converte para Number para garantir que o Recharts consiga renderizar (evitar strings do banco)
    const displayMin = (rawMin !== null && rawMin !== undefined && rawMin !== '') ? Number(rawMin) : undefined;
    const displayMax = (rawMax !== null && rawMax !== undefined && rawMax !== '') ? Number(rawMax) : undefined;

    // Efeito para personalizar o nome do arquivo PDF na hora da impressão
    useEffect(() => {
        if (dadosAfericao.length > 0 && equipSelecionado) {
            const di = dataInicio ? format(parseISO(dataInicio), 'dd-MM-yyyy') : '';
            const df = dataFim ? format(parseISO(dataFim), 'dd-MM-yyyy') : '';
            const equipName = equipSelecionado.nome.replace(/[^a-zA-Z0-9\u00C0-\u00FF]+/g, '_');
            document.title = `Planilha_Temperatura_${equipName}_${di}_a_${df}`;
        } else {
            document.title = 'Planilha de Temperaturas - Documentos';
        }
        
        // Cleanup ao desmontar
        return () => {
            document.title = 'StyleSeed App';
        };
    }, [dadosAfericao, equipSelecionado, dataInicio, dataFim]);

    return (
        <Container maxWidth="lg" className="print-container" sx={{ mt: 4, mb: 8 }}>
            
            {/* CABEÇALHO (Visível apenas na tela, não na impressão de filtros) */}
            {!isEmbedded && (
                <Box className="no-print" sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                            <ChevronLeft size={20} />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
                                Central de Documentos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                3.7.12 Planilha de Temperatura dos Equipamentos
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* PAINEL DE FILTROS */}
            <Paper className="no-print" elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        select
                        label="Selecione o Equipamento"
                        value={equipamentoId}
                        onChange={(e) => setEquipamentoId(e.target.value)}
                        size="small"
                        sx={{ minWidth: 250 }}
                    >
                        {equipamentosOptions.map((eq) => (
                            <MenuItem key={eq.id} value={eq.id}>{eq.nome}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        type="date"
                        label="Data Inicial"
                        size="small"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                        type="date"
                        label="Data Final"
                        size="small"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <LoadingButton 
                        variant="contained" 
                        loading={loading}
                        onClick={handleGerarRelatorio}
                        startIcon={<Search size={18} />}
                        sx={{ borderRadius: '10px' }}
                    >
                        Gerar Relatório
                    </LoadingButton>

                    <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setOpenAssinatura(true)}
                            disabled={dadosAfericao.length === 0}
                            startIcon={<FileSignature size={18} />}
                            sx={{ borderRadius: '10px', color: 'primary.main', borderColor: 'primary.main' }}
                        >
                            Assinar Relatório
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handlePrint}
                            disabled={dadosAfericao.length === 0 || !assinaturaData.image}
                            startIcon={<Printer size={18} />}
                            sx={{ borderRadius: '10px' }}
                        >
                            Imprimir A4
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* ÁREA DO RELATÓRIO IMPRESSO */}
            {equipSelecionado && (
                <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'white' }}>
                    <Box className="print-container">
                    {/* Header do Relatório Impresso */}
                    <Box sx={{ mb: 6, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Controle de Temperatura de Equipamentos
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                            <Typography variant="body1"><b>Empresa:</b> {activeClientName || 'N/A'}</Typography>
                            <Typography variant="body1"><b>Unidade:</b> {unidadeSelecionada?.nome_unidade || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, color: 'text.secondary', fontWeight: 500 }}>
                            <Typography variant="body1"><b>Equipamento:</b> {equipSelecionado.nome}</Typography>
                            <Typography variant="body1"><b>Período:</b> {format(parseISO(dataInicio), 'dd/MM/yy')} a {format(parseISO(dataFim), 'dd/MM/yy')}</Typography>
                        </Box>
                    </Box>

                    {/* Gráficos Lineares */}
                    {chartData.length > 0 ? (
                        <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box sx={{ height: 280 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Temperatura do Equipamento</Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis 
                                            tick={{ fontSize: 12 }} 
                                            domain={[
                                                (dataMin: number) => {
                                                    if (faixaEquipamento?.tipo_regra === 'CONGELADO') return Math.min(dataMin, -20);
                                                    const minVal = displayMin !== undefined ? Math.min(dataMin, displayMin) : dataMin;
                                                    return Math.floor(minVal - 2);
                                                },
                                                (dataMax: number) => {
                                                    if (faixaEquipamento?.tipo_regra === 'CONGELADO') return Math.max(dataMax, 2);
                                                    const maxVal = displayMax !== undefined ? Math.max(dataMax, displayMax) : dataMax;
                                                    return Math.ceil(maxVal + 2);
                                                }
                                            ]} 
                                        />
                                        <RechartsTooltip />
                                        <Legend />
                                        
                                        {/* ÁREAS DE REFERÊNCIA (Background Bands) */}
                                        {faixaEquipamento?.tipo_regra === 'CONGELADO' ? (
                                            <>
                                                <ReferenceArea y1={-100} y2={-18} fill="#2196f3" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Excelente', fill: '#1565c0', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-18} y2={-11} fill="#4caf50" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Bom', fill: '#2e7d32', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-11} y2={-6} fill="#ffeb3b" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Regular', fill: '#f57f17', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-6} y2={-1} fill="#ff9800" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Atenção', fill: '#e65100', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-1} y2={100} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Crítico', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                            </>
                                        ) : (
                                            <>
                                                {/* Resfriados / Quentes */}
                                                {(displayMin !== undefined) && (
                                                    <ReferenceArea y1={-200} y2={displayMin} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                )}
                                                
                                                <ReferenceArea 
                                                    y1={displayMin ?? -200} 
                                                    y2={displayMax ?? 200} 
                                                    fill="#4caf50" fillOpacity={0.15} 
                                                    label={{ position: 'insideTopLeft', value: 'Adequado', fill: '#2e7d32', fontSize: 11, fontWeight: 'bold' }} 
                                                    ifOverflow="hidden"
                                                />
                                                
                                                {(displayMax !== undefined) && (
                                                    <ReferenceArea y1={displayMax} y2={200} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                )}
                                            </>
                                        )}

                                        <Line type="monotone" name="Temp. Equipamento (°C)" dataKey="tempEquip" stroke={theme.palette.primary.main} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                            
                            <Box sx={{ height: 280 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Temperatura dos Alimentos</Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis 
                                            tick={{ fontSize: 12 }} 
                                            domain={[
                                                (dataMin: number) => {
                                                    if (faixaEquipamento?.tipo_regra === 'CONGELADO') return Math.min(dataMin, -20);
                                                    const minVal = displayMin !== undefined ? Math.min(dataMin, displayMin) : dataMin;
                                                    return Math.floor(minVal - 2);
                                                },
                                                (dataMax: number) => {
                                                    if (faixaEquipamento?.tipo_regra === 'CONGELADO') return Math.max(dataMax, 2);
                                                    const maxVal = displayMax !== undefined ? Math.max(dataMax, displayMax) : dataMax;
                                                    return Math.ceil(maxVal + 2);
                                                }
                                            ]} 
                                        />
                                        <RechartsTooltip />
                                        <Legend />
                                        
                                        {/* ÁREAS DE REFERÊNCIA (Background Bands) */}
                                        {faixaEquipamento?.tipo_regra === 'CONGELADO' ? (
                                            <>
                                                <ReferenceArea y1={-30} y2={-18} fill="#2196f3" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Excelente', fill: '#1565c0', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-18} y2={-11} fill="#4caf50" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Bom', fill: '#2e7d32', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-11} y2={-6} fill="#ffeb3b" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Regular', fill: '#f57f17', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-6} y2={-1} fill="#ff9800" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Atenção', fill: '#e65100', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                <ReferenceArea y1={-1} y2={10} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Crítico', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                            </>
                                        ) : (
                                            <>
                                                {/* Resfriados / Quentes */}
                                                {(displayMin !== undefined) && (
                                                    <ReferenceArea y1={-50} y2={displayMin} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                )}
                                                
                                                <ReferenceArea 
                                                    y1={displayMin ?? -50} 
                                                    y2={displayMax ?? 150} 
                                                    fill="#4caf50" fillOpacity={0.15} 
                                                    label={{ position: 'insideTopLeft', value: 'Adequado', fill: '#2e7d32', fontSize: 11, fontWeight: 'bold' }} 
                                                    ifOverflow="hidden"
                                                />
                                                
                                                {(displayMax !== undefined) && (
                                                    <ReferenceArea y1={displayMax} y2={150} fill="#f44336" fillOpacity={0.15} label={{ position: 'insideTopLeft', value: 'Inadequado', fill: '#c62828', fontSize: 11, fontWeight: 'bold' }} ifOverflow="hidden" />
                                                )}
                                            </>
                                        )}

                                        <Line type="monotone" name="Temp. Alimento (°C)" dataKey="tempAlim" stroke={theme.palette.secondary.main} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 2, mb: 4 }}>
                            <Typography color="text.secondary">Nenhuma aferição de temperatura encontrada neste período.</Typography>
                        </Box>
                    )}

                    {/* Tabela de Dados */}
                    {tableData.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Registros Diários</Typography>
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                        <TableRow>
                                            <TableCell rowSpan={2} sx={{ fontWeight: 'bold', borderRight: '1px solid', borderColor: 'divider', px: 1, py: 0.5, fontSize: '0.75rem' }}>Data</TableCell>
                                            {periodosExistentes.map((p, idx) => (
                                                <TableCell 
                                                    key={p} 
                                                    colSpan={4} 
                                                    align="center" 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        borderRight: idx < periodosExistentes.length - 1 ? '1px solid' : 'none', 
                                                        borderColor: 'divider',
                                                        px: 1,
                                                        py: 0.5,
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {periodosExistentes.length > 3 
                                                        ? `${idx + 1}ª Aferição` 
                                                        : (p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : p === 'NOITE' ? 'Noite' : p)
                                                    }
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        <TableRow>
                                            {periodosExistentes.map((p, idx) => (
                                                <Fragment key={p}>
                                                    <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, px: 0.5, py: 0.5 }}>Hora</TableCell>
                                                    <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, px: 0.5, py: 0.5 }}>T. Equip.</TableCell>
                                                    <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, px: 0.5, py: 0.5 }}>T. Alim.</TableCell>
                                                    <TableCell 
                                                        align="center" 
                                                        sx={{ 
                                                            fontSize: '0.7rem', 
                                                            fontWeight: 600, 
                                                            px: 0.5,
                                                            py: 0.5,
                                                            borderRight: idx < periodosExistentes.length - 1 ? '1px solid' : 'none', 
                                                            borderColor: 'divider' 
                                                        }}
                                                    >
                                                        Status
                                                    </TableCell>
                                                </Fragment>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tableData.map((row) => {
                                            const avaliar = (log?: Afericao) => {
                                                if (!log) return { text: '-', isConforme: true };
                                                if (log.status === 'DESLIGADO') return { text: 'Desl.', isConforme: true };
                                                if (log.status === 'VAZIO') return { text: 'Vazio', isConforme: true };
                                                const te = avaliarTemperatura(log.temp_equipamento);
                                                const ta = avaliarTemperatura(log.temp_alimento);
                                                const isValid = (te?.isValid ?? true) && (ta?.isValid ?? true);
                                                return { text: isValid ? 'C' : 'NC', isConforme: isValid, te, ta };
                                            };

                                            return (
                                                <TableRow key={row.data}>
                                                    <TableCell sx={{ borderRight: '1px solid', borderColor: 'divider', fontWeight: 500, px: 1, py: 0.5, fontSize: '0.75rem' }}>
                                                        {format(parseISO(row.data), 'dd/MM/yy')}
                                                    </TableCell>
                                                    
                                                    {periodosExistentes.map((p, idx) => {
                                                        const log = row.turnos[p];
                                                        const m = avaliar(log);
                                                        return (
                                                            <Fragment key={p}>
                                                                <TableCell align="center" sx={{ px: 0.5, py: 0.5, fontSize: '0.72rem' }}>{log?.hora_afericao?.substring(0, 5) || '-'}</TableCell>
                                                                <TableCell align="center" sx={{ px: 0.5, py: 0.5, fontSize: '0.72rem' }}>
                                                                    {log?.temp_equipamento !== null && log?.temp_equipamento !== undefined ? `${Number(log.temp_equipamento).toFixed(1)}°C` : '-'}
                                                                    {log?.temp_equipamento !== null && log?.temp_equipamento !== undefined && m.te?.text && !['Adequado', 'Excelente', 'Bom'].includes(m.te.text) && (
                                                                        <Typography variant="caption" display="block" color="error.main" sx={{ fontSize: '0.62rem', fontWeight: 600 }}>{m.te?.text}</Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="center" sx={{ px: 0.5, py: 0.5, fontSize: '0.72rem' }}>
                                                                    {log?.temp_alimento !== null && log?.temp_alimento !== undefined ? `${Number(log.temp_alimento).toFixed(1)}°C` : '-'}
                                                                    {log?.alimento_nome && (
                                                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.60rem', fontStyle: 'italic', lineHeight: 1.0, mt: 0.1 }}>
                                                                            {log.alimento_nome}
                                                                        </Typography>
                                                                    )}
                                                                    {log?.temp_alimento !== null && log?.temp_alimento !== undefined && m.ta?.text && !['Adequado', 'Excelente', 'Bom'].includes(m.ta.text) && (
                                                                        <Typography variant="caption" display="block" color="error.main" sx={{ fontSize: '0.62rem', fontWeight: 600 }}>{m.ta?.text}</Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell 
                                                                    align="center" 
                                                                    sx={{ 
                                                                        px: 0.5,
                                                                        py: 0.5,
                                                                        borderRight: idx < periodosExistentes.length - 1 ? '1px solid' : 'none', 
                                                                        borderColor: 'divider' 
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" fontWeight="bold" color={m.isConforme ? 'success.main' : 'error.main'} sx={{ fontSize: '0.68rem' }}>
                                                                        {m.text}
                                                                    </Typography>
                                                                </TableCell>
                                                            </Fragment>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontSize: '0.62rem', fontWeight: 500 }}>
                                * Legenda - Status: C (Conforme) | NC (Não Conforme) | Desl. (Equipamento Desligado) | Vazio (Equipamento Vazio)
                            </Typography>
                        </Box>
                    )}

                    {/* Seção de Planos de Ação (Aparece se houver NCs ou Planos criados) */}
                    {planosDeAcao.length > 0 && (
                        <Box sx={{ mb: 6, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <AlertCircle size={24} />
                                <Typography variant="h6" fontWeight="bold">
                                    Análise de Desvios e Planos de Ação (Central de Controle)
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Foram identificados <b>{totalNCs}</b> desvios (NC) de temperatura neste período. Abaixo estão as ações corretivas unificadas estabelecidas pelo responsável:
                            </Typography>
                            
                            {planosDeAcao.map(plano => (
                                <Paper key={plano.id} elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                        <Box>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block">PERÍODO AFETADO</Typography>
                                            <Typography variant="body2" sx={{ mb: 2 }}>{plano.periodoAfetado}</Typography>
                                            
                                            <Typography variant="caption" fontWeight="bold" color="error.main" display="block">PROBLEMA / CAUSA</Typography>
                                            <Typography variant="body2">{plano.causa}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight="bold" color="success.main" display="block">AÇÃO CORRETIVA (SOLUÇÃO)</Typography>
                                            <Typography variant="body2" sx={{ mb: 2 }}>{plano.solucao}</Typography>

                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block">INSIGHTS DO RT</Typography>
                                            <Typography variant="body2">{plano.insight}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {/* ASSINATURA REALIZADA (Para tela e impressão) */}
                    {assinaturaData.image && (
                        <Box sx={{ mt: 8, pt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{ textAlign: 'center', width: '60%', maxWidth: '400px' }}>
                                <img src={assinaturaData.image} alt="Assinatura" style={{ maxHeight: '100px', display: 'block', margin: '0 auto' }} />
                                <Box sx={{ borderTop: '1px solid black', pt: 1, mt: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">{assinaturaData.nome || 'Responsável Técnico'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{assinaturaData.cargo} {assinaturaData.crn ? `- ${assinaturaData.crn}` : ''}</Typography>
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.disabled' }}>
                                        Assinado digitalmente em {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    </Box>
                </Paper>
            )}

            {/* MODAL DE ASSINATURA */}
            <Dialog open={openAssinatura} onClose={() => setOpenAssinatura(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Assinatura Digital do Relatório</DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        A assinatura é registrada eletronicamente garantindo a rastreabilidade e integridade documental perante a fiscalização.
                    </Alert>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField 
                            select
                            label="Selecione o Responsável" 
                            size="small" 
                            value={assinaturaData.id || ''}
                            onChange={e => {
                                const colab = colaboradoresOptions.find(c => c.id === e.target.value);
                                if (colab) {
                                    setAssinaturaData({...assinaturaData, id: colab.id, nome: colab.nome_completo, cargo: colab.funcao || 'Nutricionista RT', crn: colab.crn || ''});
                                }
                            }}
                            fullWidth
                        >
                            {colaboradoresOptions.length > 0 ? (
                                colaboradoresOptions.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.nome_completo} {c.funcao ? `(${c.funcao})` : ''}</MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">Nenhum colaborador encontrado</MenuItem>
                            )}
                        </TextField>
                        <TextField 
                            label="CRN ou Certificado (Auto)" 
                            size="small" 
                            value={assinaturaData.crn}
                            onChange={e => setAssinaturaData({...assinaturaData, crn: e.target.value})}
                            fullWidth
                            disabled
                        />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Desenhe sua assinatura abaixo:</Typography>
                        <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), display: 'flex', justifyContent: 'center' }}>
                            <SignatureCanvas 
                                ref={sigCanvas}
                                penColor="black"
                                canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }}
                            />
                        </Box>
                        <Button size="small" onClick={() => sigCanvas.current?.clear()} sx={{ mt: 1 }}>Limpar Assinatura</Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setOpenAssinatura(false)} color="inherit">Cancelar</Button>
                    <Button 
                        variant="contained" 
                        onClick={() => {
                            if (sigCanvas.current?.isEmpty()) {
                                setMsg({ open: true, text: 'Desenhe a assinatura antes de salvar.', type: 'error' });
                                return;
                            }
                            const dataURL = sigCanvas.current?.getCanvas().toDataURL('image/png');
                            setAssinaturaData({ ...assinaturaData, image: dataURL });
                            setOpenAssinatura(false);
                            setMsg({ open: true, text: 'Assinatura registrada com sucesso.', type: 'success' });
                        }}
                    >
                        Salvar e Aplicar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={msg.open} 
                autoHideDuration={4000} 
                onClose={() => setMsg(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={msg.type} sx={{ borderRadius: '12px' }}>{msg.text}</Alert>
            </Snackbar>

        </Container>
    );
}
