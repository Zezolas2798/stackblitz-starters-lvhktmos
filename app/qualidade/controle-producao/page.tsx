'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Container, Typography, Box, Grid, Card, CardContent, CardActionArea, CardActions,
    CircularProgress, Alert, Chip, Stack, Button, Divider, Tabs, Tab
} from '@mui/material';
import { Droplet, Thermometer, Wind, Zap, ClipboardList, Settings, Clock, CheckCircle, Calendar } from 'lucide-react';
import { startOfDay, addDays, addMonths, addYears, isBefore, format, differenceInDays } from 'date-fns';

// Mapper to convert string icon names to actual lucide components
const IconMap: Record<string, any> = {
    Droplet: Droplet,
    Thermometer: Thermometer,
    Wind: Wind,
    Zap: Zap,
    ClipboardList: ClipboardList
};

export default function ControleProducaoPage() {
    const router = useRouter();
    const { activeClientId, unidadeId } = useClient();

    const [modelos, setModelos] = useState<any[]>([]);
    const [pendentes, setPendentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');

    useEffect(() => {
        fetchPlanilhas();
    }, [activeClientId, unidadeId]);

    const fetchPlanilhas = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // 1. Buscar os modelos
            let queryModelos = (supabase as any).from('qual_planilha_modelos')
                .select('*')
                .eq('ativo', true)
                .is('deleted_at', null)
                .order('categoria', { ascending: true })
                .order('titulo', { ascending: true });

            if (activeClientId) {
                queryModelos = queryModelos.or(`cliente_id.eq.${activeClientId},cliente_id.is.null`);
            } else {
                queryModelos = queryModelos.is('cliente_id', null);
            }

            const { data: modelosData, error: modelosErr } = await queryModelos;
            if (modelosErr) throw modelosErr;

            setModelos(modelosData || []);
            
            const firstCategory = modelosData && modelosData.length > 0 ? modelosData[0].categoria : '';
            if (firstCategory && categoriaFiltro === 'Todas') {
                setCategoriaFiltro(firstCategory);
            }

            // 2. Se houver unidadeId, checar pendências
            if (unidadeId && modelosData) {
                // Buscar configs da unidade
                const { data: configData, error: configErr } = await (supabase as any).from('qual_planilha_configuracoes')
                    .select('*')
                    .eq('unidade_id', unidadeId)
                    .eq('ativo', true);
                
                if (configErr) throw configErr;

                // Buscar os últimos registros de cada modelo desta unidade
                const { data: registrosData, error: registrosErr } = await (supabase as any).from('qual_planilha_registros')
                    .select('modelo_id, item_monitorado, data_referencia')
                    .eq('unidade_id', unidadeId)
                    .order('data_referencia', { ascending: false });

                if (registrosErr) throw registrosErr;

                // Mapear o último registro por modelo E por item
                const ultimosRegistros = (registrosData || []).reduce((acc: any, reg: any) => {
                    const key = `${reg.modelo_id}_${reg.item_monitorado || 'default'}`;
                    if (!acc[key]) {
                        acc[key] = new Date(reg.data_referencia);
                    }
                    return acc;
                }, {});

                const pendentesList: any[] = [];
                const seenModels = new Set();
                const hoje = startOfDay(new Date());
                
                (configData || []).forEach((config: any) => {
                    if (config.frequencia_tipo === 'DEMANDA') return;
                    // Evitar duplicatas caso existam configs antigas erradas
                    if (seenModels.has(config.modelo_id)) return;
                    seenModels.add(config.modelo_id);

                    const modelo = modelosData.find((m: any) => m.id === config.modelo_id);
                    if (!modelo) return;

                    // Se tiver itens_monitorados configurados, avaliamos individualmente
                    let itemsToEvaluate: string[] = ['default'];
                    if (config.itens_monitorados && config.itens_monitorados.length > 0) {
                        itemsToEvaluate = config.itens_monitorados;
                    }

                    itemsToEvaluate.forEach((itemName) => {
                        const regKey = `${config.modelo_id}_${itemName}`;
                        const ultimoReg = ultimosRegistros[regKey];
                        let isPendente = true;
                        let proximaData: Date | null = null;

                        if (config.frequencia_tipo === 'DIARIA') {
                            const diasSemana = config.frequencia_config?.dias_semana;
                            if (diasSemana && Array.isArray(diasSemana)) {
                                if (!diasSemana.includes(new Date().getDay())) {
                                    isPendente = false;
                                }
                            }
                            
                            if (ultimoReg && isPendente) {
                                const ultimoRegStart = startOfDay(ultimoReg);
                                if (ultimoRegStart.getTime() === hoje.getTime()) {
                                    isPendente = false;
                                }
                            }
                            if (isPendente) {
                                proximaData = hoje;
                            }
                        } else {
                            if (ultimoReg) {
                                const ultimoRegStart = startOfDay(ultimoReg);
                                let proxima = ultimoRegStart;
                                switch (config.frequencia_tipo) {
                                    case 'SEMANAL':
                                        proxima = addDays(ultimoRegStart, 7);
                                        break;
                                    case 'QUINZENAL':
                                        proxima = addDays(ultimoRegStart, 15);
                                        break;
                                    case 'MENSAL':
                                        proxima = addMonths(ultimoRegStart, 1);
                                        break;
                                    case 'BIMESTRAL':
                                        proxima = addMonths(ultimoRegStart, 2);
                                        break;
                                    case 'TRIMESTRAL':
                                        proxima = addMonths(ultimoRegStart, 3);
                                        break;
                                    case 'SEMESTRAL':
                                        proxima = addMonths(ultimoRegStart, 6);
                                        break;
                                    case 'ANUAL':
                                        proxima = addYears(ultimoRegStart, 1);
                                        break;
                                    case 'BIENAL':
                                        proxima = addYears(ultimoRegStart, 2);
                                        break;
                                }
                                proximaData = proxima;
                                
                                const diasParaVencer = differenceInDays(proxima, hoje);

                                if (diasParaVencer <= 0) {
                                    isPendente = true; // Atrasado ou vence hoje
                                } else {
                                    // Verificar antecedência para mostrar aviso
                                    if (['MENSAL', 'BIMESTRAL'].includes(config.frequencia_tipo)) {
                                        isPendente = diasParaVencer <= 15;
                                    } else if (['TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'BIENAL'].includes(config.frequencia_tipo)) {
                                        isPendente = diasParaVencer <= 30;
                                    } else {
                                        isPendente = false;
                                    }
                                }
                            } else {
                                // Se não tem último registro e não é diário, está pendente hoje.
                                proximaData = hoje;
                            }
                        }

                        if (isPendente) {
                            const diasVencer = proximaData ? differenceInDays(proximaData, hoje) : 0;
                            const isAviso = diasVencer > 0;
                            
                            pendentesList.push({ 
                                ...modelo, 
                                id: itemName === 'default' ? modelo.id : `${modelo.id}_${itemName}`,
                                modelo_id_original: modelo.id,
                                item_monitorado_name: itemName === 'default' ? null : itemName,
                                frequencia_tipo: config.frequencia_tipo,
                                data_proxima: proximaData ? format(proximaData, 'dd/MM/yyyy') : null,
                                dias_para_vencer: diasVencer,
                                is_aviso: isAviso
                            });
                        }
                    });
                });

                setPendentes(pendentesList);
            } else {
                setPendentes([]);
            }

        } catch (err: any) {
            console.error('Erro ao buscar modelos de planilhas:', err);
            setError(err.message || 'Falha ao carregar planilhas.');
        } finally {
            setLoading(false);
        }
    };

    // Agrupar modelos por categoria
    const groupedModelos = modelos.reduce((acc, curr) => {
        if (!acc[curr.categoria]) acc[curr.categoria] = [];
        acc[curr.categoria].push(curr);
        return acc;
    }, {} as Record<string, any[]>);

    const categoriasDisponiveis = Object.keys(groupedModelos).sort();

    const renderCard = (modelo: any, isPendente: boolean = false) => {
        const IconComponent = modelo.icone && IconMap[modelo.icone] ? IconMap[modelo.icone] : ClipboardList;

        let targetRoute = `/qualidade/planilhas/${modelo.modelo_id_original || modelo.id}${isPendente ? '?new=true' : ''}`;
        if (modelo.item_monitorado_name) {
            targetRoute += `${isPendente ? '&' : '?'}item=${encodeURIComponent(modelo.item_monitorado_name)}`;
        }

        // Interceptar planilhas com módulo customizado
        const tituloMin = modelo.titulo?.toLowerCase() || '';
        if (tituloMin.includes('temperatura')) {
            targetRoute = `/qualidade/planilhas/temperatura`;
        } else if (tituloMin.includes('amostras')) {
            targetRoute = `/qualidade/planilhas/amostras`;
        }

        return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={modelo.id + (isPendente ? '_pend' : '')}>
                <Card 
                    elevation={0} 
                    sx={{ 
                        border: '1px solid', 
                        borderColor: isPendente ? 'warning.main' : 'divider',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 2,
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    <CardActionArea 
                        onClick={() => router.push(targetRoute)}
                        sx={{ flexGrow: 1, p: 1.5 }}
                    >
                        <CardContent sx={{ p: 0 }}>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <Box sx={{ 
                                    p: 1, 
                                    bgcolor: isPendente ? 'warning.50' : 'primary.50', 
                                    borderRadius: 1.5,
                                    color: isPendente ? 'warning.main' : 'primary.main',
                                    display: 'flex'
                                }}>
                                    <IconComponent size={20} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                        {modelo.titulo}
                                    </Typography>
                                    {modelo.item_monitorado_name && (
                                        <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                                            Item: {modelo.item_monitorado_name}
                                        </Typography>
                                    )}
                                    {modelo.descricao && (
                                        <Typography variant="caption" color="text.secondary" sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: 1.3
                                        }}>
                                            {modelo.descricao}
                                        </Typography>
                                    )}
                                    {isPendente && (
                                        <Box sx={{ mt: 1 }}>
                                            <Chip 
                                                size="small" 
                                                icon={<Clock size={14} />} 
                                                label={modelo.is_aviso ? `Aviso (${modelo.frequencia_tipo})` : `Pendente (${modelo.frequencia_tipo})`} 
                                                color={modelo.is_aviso ? "info" : "warning"} 
                                                sx={{ mb: 0.5 }}
                                            />
                                            {modelo.data_proxima && (
                                                <Typography variant="caption" color={modelo.is_aviso ? "info.main" : "warning.main"} display="block">
                                                    <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> 
                                                    {modelo.is_aviso 
                                                        ? `Vence em ${modelo.data_proxima} (${modelo.dias_para_vencer} dias)` 
                                                        : (modelo.dias_para_vencer === 0 ? `Vence Hoje` : `Atrasado desde: ${modelo.data_proxima}`)
                                                    }
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        </CardContent>
                    </CardActionArea>
                    <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            fullWidth
                            sx={{ py: 0.5, fontSize: '0.75rem' }}
                            onClick={() => router.push(targetRoute)}
                        >
                            Preencher Agora
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
                        Controle Produção
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        QUALIDADE GxP • Monitoramento e registros técnicos
                    </Typography>
                </Box>
                {activeClientId && (
                    <Button 
                        variant="outlined" 
                        startIcon={<Settings size={18} />}
                        onClick={() => router.push('/qualidade/planilhas/configuracao')}
                    >
                        Configurar Frequência
                    </Button>
                )}
            </Box>
            
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2 }}>
                Selecione uma categoria e uma planilha para registrar e monitorar indicadores de qualidade.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!unidadeId && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Selecione uma Unidade no topo para visualizar as planilhas pendentes.
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Seção de Pendentes Agrupada */}
                    {unidadeId && pendentes.length > 0 && (
                        <Box sx={{ mb: 5 }}>
                            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'warning.main' }}>
                                <Clock size={24} /> Pendentes para Preenchimento
                            </Typography>
                            
                            {Object.entries(
                                pendentes.reduce((acc: any, curr: any) => {
                                    if (!acc[curr.categoria]) acc[curr.categoria] = [];
                                    acc[curr.categoria].push(curr);
                                    return acc;
                                }, {} as Record<string, any[]>)
                            ).map(([categoria, listaPendentes]: [string, any]) => (
                                <Box key={'pend_' + categoria} sx={{ mb: 4, pl: 2, borderLeft: '3px solid', borderColor: 'warning.light' }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                                        {categoria}
                                    </Typography>
                                    <Grid container spacing={3}>
                                        {listaPendentes.map((p: any) => renderCard(p, true))}
                                    </Grid>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {unidadeId && pendentes.length === 0 && (
                        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 5 }}>
                            Não há planilhas configuradas pendentes para esta unidade no momento.
                        </Alert>
                    )}

                    <Divider sx={{ mb: 5 }} />

                    {/* Todas as Planilhas */}
                    <Box mb={4}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                            Todas as Planilhas
                        </Typography>
                        {categoriasDisponiveis.length > 0 && (
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                                <Tabs 
                                    value={categoriaFiltro} 
                                    onChange={(e, newValue) => setCategoriaFiltro(newValue)} 
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    indicatorColor="primary"
                                    textColor="primary"
                                >
                                    {categoriasDisponiveis.map(cat => (
                                        <Tab key={cat} label={cat} value={cat} sx={{ fontWeight: 600 }} />
                                    ))}
                                </Tabs>
                            </Box>
                        )}
                    </Box>

                    {Object.keys(groupedModelos).length === 0 ? (
                        <Alert severity="info">Nenhum modelo de planilha configurado globalmente ou para este cliente.</Alert>
                    ) : (
                        Object.entries(groupedModelos)
                            .filter(([categoria]) => categoria === categoriaFiltro)
                            .map(([categoria, listaModelos]) => (
                                <Box key={categoria} sx={{ mb: 4 }}>
                                    <Grid container spacing={2}>
                                        {(listaModelos as any[]).map((modelo: any) => renderCard(modelo, false))}
                                    </Grid>
                                </Box>
                        ))
                    )}
                </>
            )}
        </Container>
    );
}
