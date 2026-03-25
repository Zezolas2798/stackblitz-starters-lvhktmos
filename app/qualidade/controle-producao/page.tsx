'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Box, Typography, Button, Paper, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Select, FormControl, InputLabel,
    CircularProgress, Snackbar, Alert, Container, IconButton,
    Chip, Divider, useTheme, alpha, Tooltip, Autocomplete
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { 
    Thermometer, 
    Droplet, 
    ClipboardCheck, 
    ChevronLeft, 
    Save, 
    AlertCircle,
    Power,
    Inbox,
    RefreshCw,
    Search,
    ChefHat,
    ShoppingBag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alimento {
    id: string;
    nome: string;
    tipo: 'PRODUTO' | 'RECEITA';
    uniqueId: string; // "PRODUTO-id" or "RECEITA-id"
}

export default function ControleProducaoPage() {
    const theme = useTheme();
    const router = useRouter();
    const { activeClientId, unidadeId: ctxUnidadeId } = useClient();

    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });
    
    const [dataFiltro, setDataFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [equipamentosMonitorados, setEquipamentosMonitorados] = useState<any[]>([]);
    const [alimentos, setAlimentos] = useState<Alimento[]>([]);
    const [logsTemp, setLogsTemp] = useState<Record<string, any>>({}); // Key: equipId-periodo

    const SESSION_KEY = `temp_logs_producao_${activeClientId}_${ctxUnidadeId}_${dataFiltro}`;

    const loadDados = useCallback(async () => {
        if (!activeClientId) return;
        setLoading(true);
        try {
            // 1. Pegar TODOS os equipamentos do grupo Temperaturas do cliente
            const equipsPromise = (supabase as any)
                .from('cliente_equipamentos_config')
                .select(`
                    id, 
                    nome, 
                    grupo,
                    parent_id,
                    parent:cliente_equipamentos_config!parent_id(id, nome),
                    locais:cliente_locais_estoque(id, nome)
                `)
                .eq('cliente_id', activeClientId)
                .eq('grupo', 'Temperaturas')
                .not('parent_id', 'is', null);

            // 2. Pegar Alimentos (Produtos/Ingredientes e Receitas)
            const produtosPromise = (supabase as any)
                .from('ingredientes')
                .select('id, nome')
                .eq('cliente_id', activeClientId)
                .is('deleted_at', null);

            const receitasPromise = (supabase as any)
                .from('receitas')
                .select('id, nome')
                .eq('cliente_id', activeClientId);

            // 3. Pegar registros já existentes no Banco para a data
            const logsPromise = (supabase as any)
                .from('cliente_controle_temperatura')
                .select('*')
                .eq('data', dataFiltro)
                .eq('unidade_id', ctxUnidadeId);

            const [equipsRes, produtosRes, receitasRes, logsRes] = await Promise.all([
                equipsPromise, produtosPromise, receitasPromise, logsPromise
            ]);

            if (equipsRes.error) throw equipsRes.error;
            if (produtosRes.error) throw produtosRes.error;
            if (receitasRes.error) throw receitasRes.error;
            if (logsRes.error) throw logsRes.error;

            setEquipamentosMonitorados(equipsRes.data || []);

            // Consolidar alimentos
            const unifiedAlimentos: Alimento[] = [
                ...(produtosRes.data || []).map((p: any) => ({
                    id: p.id,
                    nome: p.nome,
                    tipo: 'PRODUTO' as const,
                    uniqueId: `PRODUTO-${p.id}`
                })),
                ...(receitasRes.data || []).map((r: any) => ({
                    id: r.id,
                    nome: r.nome,
                    tipo: 'RECEITA' as const,
                    uniqueId: `RECEITA-${r.id}`
                }))
            ].sort((a, b) => a.nome.localeCompare(b.nome));
            
            setAlimentos(unifiedAlimentos);

            // 4. Montar log consolidado (Banco + SessionStorage)
            const newLogs: Record<string, any> = {};
            (logsRes.data || []).forEach((log: any) => {
                newLogs[`${log.equipamento_id}-${log.periodo}`] = log;
            });

            // 5. Verificar se há dados temporários não salvos no sessionStorage
            const sessionData = sessionStorage.getItem(SESSION_KEY);
            if (sessionData) {
                const tempLogs = JSON.parse(sessionData);
                Object.keys(tempLogs).forEach(key => {
                    newLogs[key] = {
                        ...(newLogs[key] || {}),
                        ...tempLogs[key]
                    };
                });
            }

            setLogsTemp(newLogs);

        } catch (err: any) {
            console.error('Erro no loadDados:', err);
            setMsg({ open: true, text: 'Erro ao carregar dados do dia.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [activeClientId, ctxUnidadeId, dataFiltro, SESSION_KEY]);

    useEffect(() => {
        loadDados();
    }, [loadDados]);

    const handleLogChange = (equipId: string, periodo: 'MANHA' | 'TARDE', field: string, value: any) => {
        const key = `${equipId}-${periodo}`;
        const now = format(new Date(), 'HH:mm:ss');
        
        setLogsTemp(prev => {
            const currentLog = prev[key] || { 
                equipamento_id: equipId, 
                periodo, 
                data: dataFiltro, 
                status: 'LIGADO',
                unidade_id: ctxUnidadeId,
                cliente_id: activeClientId
            };
            
            let newLog = {
                ...currentLog,
                [field]: value,
                hora_afericao: currentLog.hora_afericao || now
            };

            // Lógica especial para troca de alimento
            if (field === 'alimento_obj') {
                const alim = value as Alimento | null;
                newLog.produto_id = alim?.tipo === 'PRODUTO' ? alim.id : null;
                newLog.receita_id = alim?.tipo === 'RECEITA' ? alim.id : null;
            }

            const nextState = { ...prev, [key]: newLog };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
            return nextState;
        });
    };

    const handleSave = async () => {
        if (!activeClientId || !ctxUnidadeId) return;
        setSaving(true);
        try {
            const upsertData = Object.values(logsTemp).map(log => {
                const { alimento_obj, ...cleanLog } = log; // Remover campo temporário da UI
                return {
                    ...cleanLog,
                    cliente_id: activeClientId,
                    unidade_id: log.unidade_id || ctxUnidadeId,
                    data: dataFiltro
                };
            });

            if (upsertData.length === 0) {
                setMsg({ open: true, text: 'Nenhuma alteração para salvar.', type: 'success' });
                return;
            }

            const { error } = await (supabase as any)
                .from('cliente_controle_temperatura')
                .upsert(upsertData, { onConflict: 'equipamento_id, data, periodo' });

            if (error) throw error;
            
            sessionStorage.removeItem(SESSION_KEY);
            setMsg({ open: true, text: 'Registros salvos com sucesso!', type: 'success' });
            loadDados();
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setMsg({ open: true, text: 'Erro ao salvar registros.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const renderTabContent = (value: number) => {
        switch (value) {
            case 0:
                return (
                    <Box sx={{ mt: 3 }}>
                        {/* FILTROS E AÇÕES */}
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <TextField
                                type="date"
                                label="Data do Monitoramento"
                                size="small"
                                value={dataFiltro}
                                onChange={(e) => setDataFiltro(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 200 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<RefreshCw size={18} />} 
                                    onClick={() => {
                                        if (confirm('Deseja realmente limpar o rascunho atual?')) {
                                            sessionStorage.removeItem(SESSION_KEY);
                                            loadDados();
                                        }
                                    }}
                                    sx={{ borderRadius: '10px' }}
                                >
                                    Limpar Rascunho
                                </Button>
                                <LoadingButton 
                                    variant="contained" 
                                    startIcon={<Save size={18} />} 
                                    onClick={handleSave}
                                    loading={saving}
                                    sx={{ borderRadius: '10px', px: 4 }}
                                >
                                    Salvar Tudo
                                </LoadingButton>
                            </Box>
                        </Box>

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 1100 }}>
                                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Equipamento / Categoria</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', borderLeft: '1px solid', borderColor: 'divider' }}>Período</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Horário</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>Alimento Aferido</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp. Equip.</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp. Alim.</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                <CircularProgress size={32} />
                                            </TableCell>
                                        </TableRow>
                                    ) : equipamentosMonitorados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8, opacity: 0.6 }}>
                                                <AlertCircle size={40} style={{ marginBottom: 8 }} />
                                                <Typography variant="body2">Nenhum equipamento do grupo 'Temperaturas' encontrado.</Typography>
                                                <Button size="small" onClick={() => router.push('/config/estoque')} sx={{ mt: 1 }}>Configurar Equipamentos</Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        equipamentosMonitorados.map((equip) => {
                                            const rowKeyPrefix = `${equip.id}`;
                                            const manhaLog = logsTemp[`${rowKeyPrefix}-MANHA`] || {};
                                            const tardeLog = logsTemp[`${rowKeyPrefix}-TARDE`] || {};

                                            // Helper para encontrar o alimento no log
                                            const getAlimento = (log: any) => {
                                                if (log.alimento_obj) return log.alimento_obj;
                                                if (log.produto_id) return alimentos.find(a => a.id === log.produto_id && a.tipo === 'PRODUTO');
                                                if (log.receita_id) return alimentos.find(a => a.id === log.receita_id && a.tipo === 'RECEITA');
                                                return null;
                                            };

                                            return [
                                                // LINHA MANHÃ
                                                <TableRow key={`${equip.id}-manha`}>
                                                    <TableCell rowSpan={2} sx={{ fontWeight: 600, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{equip.nome}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {equip.parent?.nome} {equip.locais?.length > 0 && `• ${equip.locais[0].nome}`}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                                                        <Chip label="MANHÃ" size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, height: 20 }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Select
                                                            size="small"
                                                            value={manhaLog.status || 'LIGADO'}
                                                            onChange={(e) => handleLogChange(equip.id, 'MANHA', 'status', e.target.value)}
                                                            sx={{ fontSize: '0.8rem', minWidth: 100 }}
                                                        >
                                                            <MenuItem value="LIGADO">A Ativo</MenuItem>
                                                            <MenuItem value="DESLIGADO">D Desligado</MenuItem>
                                                            <MenuItem value="VAZIO">V Vazio</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                            {manhaLog.hora_afericao?.substring(0, 5) || '--:--'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Autocomplete
                                                            size="small"
                                                            disabled={manhaLog.status === 'DESLIGADO' || manhaLog.status === 'VAZIO'}
                                                            options={alimentos}
                                                            getOptionLabel={(option) => option.nome}
                                                            value={getAlimento(manhaLog)}
                                                            onChange={(_, val) => handleLogChange(equip.id, 'MANHA', 'alimento_obj', val)}
                                                            renderInput={(params) => (
                                                                <TextField {...params} placeholder="Selecione o alimento..." variant="outlined" />
                                                            )}
                                                            renderOption={(props, option) => (
                                                                <Box component="li" {...props} sx={{ fontSize: '0.8rem' }}>
                                                                    {option.tipo === 'RECEITA' ? <ChefHat size={14} style={{ marginRight: 8 }} /> : <ShoppingBag size={14} style={{ marginRight: 8 }} />}
                                                                    {option.nome}
                                                                </Box>
                                                            )}
                                                            sx={{ minWidth: 220 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={manhaLog.status === 'DESLIGADO'}
                                                            value={manhaLog.temp_equipamento ?? ''}
                                                            onChange={(e) => handleLogChange(equip.id, 'MANHA', 'temp_equipamento', e.target.value)}
                                                            InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                            sx={{ width: 85 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={manhaLog.status === 'DESLIGADO' || manhaLog.status === 'VAZIO'}
                                                            value={manhaLog.temp_alimento ?? ''}
                                                            onChange={(e) => handleLogChange(equip.id, 'MANHA', 'temp_alimento', e.target.value)}
                                                            InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                            sx={{ width: 85 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {manhaLog.id ? (
                                                            <Chip label="Salvo" color="success" size="small" variant="filled" sx={{ height: 20, fontSize: '0.66rem' }} />
                                                        ) : manhaLog.hora_afericao ? (
                                                            <Chip label="Pend." color="warning" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.66rem' }} />
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>,
                                                // LINHA TARDE
                                                <TableRow key={`${equip.id}-tarde`} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                                    <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                                                        <Chip label="TARDE" size="small" sx={{ fontSize: '0.6rem', fontWeight: 800, height: 20 }} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Select
                                                            size="small"
                                                            value={tardeLog.status || 'LIGADO'}
                                                            onChange={(e) => handleLogChange(equip.id, 'TARDE', 'status', e.target.value)}
                                                            sx={{ fontSize: '0.8rem', minWidth: 100 }}
                                                        >
                                                            <MenuItem value="LIGADO">A Ativo</MenuItem>
                                                            <MenuItem value="DESLIGADO">D Desligado</MenuItem>
                                                            <MenuItem value="VAZIO">V Vazio</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                            {tardeLog.hora_afericao?.substring(0, 5) || '--:--'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Autocomplete
                                                            size="small"
                                                            disabled={tardeLog.status === 'DESLIGADO' || tardeLog.status === 'VAZIO'}
                                                            options={alimentos}
                                                            getOptionLabel={(option) => option.nome}
                                                            value={getAlimento(tardeLog)}
                                                            onChange={(_, val) => handleLogChange(equip.id, 'TARDE', 'alimento_obj', val)}
                                                            renderInput={(params) => (
                                                                <TextField {...params} placeholder="Selecione o alimento..." variant="outlined" />
                                                            )}
                                                            renderOption={(props, option) => (
                                                                <Box component="li" {...props} sx={{ fontSize: '0.8rem' }}>
                                                                    {option.tipo === 'RECEITA' ? <ChefHat size={14} style={{ marginRight: 8 }} /> : <ShoppingBag size={14} style={{ marginRight: 8 }} />}
                                                                    {option.nome}
                                                                </Box>
                                                            )}
                                                            sx={{ minWidth: 220 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={tardeLog.status === 'DESLIGADO'}
                                                            value={tardeLog.temp_equipamento ?? ''}
                                                            onChange={(e) => handleLogChange(equip.id, 'TARDE', 'temp_equipamento', e.target.value)}
                                                            InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                            sx={{ width: 85 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            disabled={tardeLog.status === 'DESLIGADO' || tardeLog.status === 'VAZIO'}
                                                            value={tardeLog.temp_alimento ?? ''}
                                                            onChange={(e) => handleLogChange(equip.id, 'TARDE', 'temp_alimento', e.target.value)}
                                                            InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                            sx={{ width: 85 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {tardeLog.id ? (
                                                            <Chip label="Salvo" color="success" size="small" variant="filled" sx={{ height: 20, fontSize: '0.66rem' }} />
                                                        ) : tardeLog.hora_afericao ? (
                                                            <Chip label="Pend." color="warning" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.66rem' }} />
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>
                                            ];
                                        }).flat()
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 8, textAlign: 'center', opacity: 0.5 }}>
                        <ClipboardCheck size={64} style={{ marginBottom: 16 }} />
                        <Typography variant="h6">Coleta de Amostras</Typography>
                        <Typography variant="body2">Em breve: Módulo para registro e controle de amostras de alimentos.</Typography>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 8, textAlign: 'center', opacity: 0.5 }}>
                        <Droplet size={64} style={{ marginBottom: 16 }} />
                        <Typography variant="h6">Controle de Óleo</Typography>
                        <Typography variant="body2">Em breve: Registro de trocas e qualidade do óleo de fritura.</Typography>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            
            {/* CABEÇALHO */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                        <ChevronLeft size={20} />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
                            Controle Produção
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            QUALIDADE GxP • Monitoramento e registros técnicos
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* TABS */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.paper', overflow: 'hidden' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(_, v) => setTabValue(v)} 
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Tab 
                        icon={<Thermometer size={20} />} 
                        label="Temperaturas" 
                        sx={{ py: 2, fontWeight: 700, fontSize: '0.75rem' }} 
                    />
                    <Tab 
                        icon={<ClipboardCheck size={20} />} 
                        label="Coleta de Amostras" 
                        sx={{ py: 2, fontWeight: 700, fontSize: '0.75rem' }} 
                    />
                    <Tab 
                        icon={<Droplet size={20} />} 
                        label="Controle de Óleo" 
                        sx={{ py: 2, fontWeight: 700, fontSize: '0.75rem' }} 
                    />
                </Tabs>
                <Box sx={{ p: 4 }}>
                    {renderTabContent(tabValue)}
                </Box>
            </Paper>

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
