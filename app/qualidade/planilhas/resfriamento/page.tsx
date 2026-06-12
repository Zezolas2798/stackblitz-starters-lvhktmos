'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Box, Typography, Button, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, CircularProgress, Snackbar, Alert, Container, IconButton,
    Chip, useTheme, alpha, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { 
    ChevronLeft, Save, Plus, AlertCircle, ChefHat, ShoppingBag, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Alimento {
    id: string;
    nome: string;
    tipo: 'PRODUTO' | 'RECEITA';
    uniqueId: string;
}

interface ResfriamentoLog {
    id?: string;
    tempId?: string; // used for unsaved drafts
    data: string;
    hora_inicio: string;
    hora_fim: string;
    alimento_obj: Alimento | null;
    alimento_nome: string;
    produto_id: string | null;
    receita_id: string | null;
    temp_pos_preparo: string;
    temp_apos_2h: string;
    status: 'EM_ANDAMENTO' | 'CONCLUIDO';
    is_out: boolean;
    observacao: string;
}

export default function ResfriamentoPage() {
    const theme = useTheme();
    const router = useRouter();
    const { activeClientId, unidadeId: ctxUnidadeId } = useClient();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });
    
    const [dataFiltro, setDataFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [alimentos, setAlimentos] = useState<Alimento[]>([]);
    const [logs, setLogs] = useState<ResfriamentoLog[]>([]);

    const [planoAcaoModal, setPlanoAcaoModal] = useState<{ open: boolean, logIndex: number | null }>({ open: false, logIndex: null });
    const [planoAcaoDesc, setPlanoAcaoDesc] = useState('');

    const loadDados = useCallback(async () => {
        if (!activeClientId) return;
        setLoading(true);
        try {
            // Pegar Alimentos (Produtos/Ingredientes e Receitas)
            const produtosPromise = supabase
                .from('ingredientes')
                .select('id, nome')
                .eq('cliente_id', activeClientId)
                .is('deleted_at', null);

            const receitasPromise = supabase
                .from('receitas')
                .select('id, nome')
                .eq('cliente_id', activeClientId);

            const logsPromise = (supabase as any)
                .from('controle_resfriamento')
                .select('*')
                .eq('data', dataFiltro)
                .eq('unidade_id', ctxUnidadeId as string);

            const [produtosRes, receitasRes, logsRes] = await Promise.all([
                produtosPromise, receitasPromise, logsPromise
            ]);

            if (produtosRes.error) throw produtosRes.error;
            if (receitasRes.error) throw receitasRes.error;
            if (logsRes.error) throw logsRes.error;

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

            const loadedLogs = (logsRes.data || []).map((log: any) => ({
                id: log.id,
                data: log.data,
                hora_inicio: log.hora_inicio ? log.hora_inicio.substring(0, 5) : '',
                hora_fim: log.hora_fim ? log.hora_fim.substring(0, 5) : '',
                alimento_nome: log.alimento_nome || '',
                produto_id: log.produto_id,
                receita_id: log.receita_id,
                alimento_obj: log.produto_id ? unifiedAlimentos.find(a => a.id === log.produto_id && a.tipo === 'PRODUTO') || null :
                              log.receita_id ? unifiedAlimentos.find(a => a.id === log.receita_id && a.tipo === 'RECEITA') || null : null,
                temp_pos_preparo: log.temp_pos_preparo?.toString() || '',
                temp_apos_2h: log.temp_apos_2h?.toString() || '',
                status: log.status,
                is_out: log.is_out || false,
                observacao: log.observacao || ''
            }));

            setLogs(loadedLogs);
        } catch (err: any) {
            console.error('Erro no loadDados:', err);
            setMsg({ open: true, text: 'Erro ao carregar dados.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [activeClientId, ctxUnidadeId, dataFiltro]);

    useEffect(() => {
        loadDados();
    }, [loadDados]);

    const handleAddRow = () => {
        const now = format(new Date(), 'HH:mm');
        setLogs(prev => [
            ...prev,
            {
                tempId: Math.random().toString(36).substr(2, 9),
                data: dataFiltro,
                hora_inicio: now,
                hora_fim: '',
                alimento_obj: null,
                alimento_nome: '',
                produto_id: null,
                receita_id: null,
                temp_pos_preparo: '',
                temp_apos_2h: '',
                status: 'EM_ANDAMENTO',
                is_out: false,
                observacao: ''
            }
        ]);
    };

    const handleLogChange = (index: number, field: string, value: any) => {
        setLogs(prev => {
            const newLogs = [...prev];
            const log = { ...newLogs[index], [field]: value };

            if (field === 'alimento_obj') {
                const alim = value as Alimento | null;
                log.produto_id = alim?.tipo === 'PRODUTO' ? alim.id : null;
                log.receita_id = alim?.tipo === 'RECEITA' ? alim.id : null;
                log.alimento_nome = alim ? alim.nome : '';
            }

            // Validar is_out
            let isOut = false;
            if (log.temp_apos_2h) {
                const tf = parseFloat(log.temp_apos_2h);
                if (tf > 10) isOut = true;
            }

            // Exigir plano de ação imediato se acabou de preencher e deu erro
            if (field === 'temp_apos_2h' && value && parseFloat(value) > 10 && !newLogs[index].is_out) {
                setPlanoAcaoModal({ open: true, logIndex: index });
            }

            log.is_out = isOut;
            if (log.temp_apos_2h) log.status = 'CONCLUIDO';
            else log.status = 'EM_ANDAMENTO';

            newLogs[index] = log;
            return newLogs;
        });
    };

    const handleRemoveRow = async (index: number) => {
        const log = logs[index];
        if (log.id) {
            if (!confirm('Deseja realmente excluir este registro?')) return;
            try {
                await (supabase as any).from('controle_resfriamento').delete().eq('id', log.id);
            } catch (err) {
                setMsg({ open: true, text: 'Erro ao excluir.', type: 'error' });
                return;
            }
        }
        setLogs(prev => prev.filter((_, i) => i !== index));
    };

    const handleSavePlanoAcao = () => {
        if (planoAcaoModal.logIndex !== null) {
            const idx = planoAcaoModal.logIndex;
            setLogs(prev => {
                const newLogs = [...prev];
                newLogs[idx].observacao = (newLogs[idx].observacao ? newLogs[idx].observacao + ' | ' : '') + 'Plano de Ação: ' + planoAcaoDesc;
                return newLogs;
            });
        }
        setPlanoAcaoModal({ open: false, logIndex: null });
        setPlanoAcaoDesc('');
    };

    const handleSave = async () => {
        if (!activeClientId || !ctxUnidadeId) return;
        
        // Validar preenchimento
        const incompletos = logs.filter(l => !l.alimento_nome || !l.temp_pos_preparo || !l.hora_inicio);
        if (incompletos.length > 0) {
            setMsg({ open: true, text: 'Preencha ao menos alimento e temperatura inicial para todos os registros.', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const upsertData = logs.map(log => {
                return {
                    ...(log.id ? { id: log.id } : {}),
                    cliente_id: activeClientId,
                    unidade_id: ctxUnidadeId,
                    data: log.data,
                    hora_inicio: log.hora_inicio || null,
                    hora_fim: log.hora_fim || null,
                    alimento_nome: log.alimento_nome,
                    produto_id: log.produto_id,
                    receita_id: log.receita_id,
                    temp_pos_preparo: parseFloat(log.temp_pos_preparo),
                    temp_apos_2h: log.temp_apos_2h ? parseFloat(log.temp_apos_2h) : null,
                    status: log.status,
                    is_out: log.is_out,
                    observacao: log.observacao
                };
            });

            if (upsertData.length === 0) {
                setMsg({ open: true, text: 'Nenhuma linha para salvar.', type: 'success' });
                return;
            }

            const { error } = await (supabase as any).from('controle_resfriamento').upsert(upsertData);

            if (error) throw error;
            
            setMsg({ open: true, text: 'Registros salvos com sucesso!', type: 'success' });
            loadDados();
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setMsg({ open: true, text: 'Erro ao salvar registros.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                        <ChevronLeft size={20} />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
                            Processos de Resfriamento
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            QUALIDADE GxP • Controle de Resfriamento de Alimentos (60°C para 10°C)
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {!ctxUnidadeId && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
                    Selecione uma Unidade no topo para registrar novos processos de resfriamento ou ver o histórico da unidade.
                </Alert>
            )}

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.paper', overflow: 'hidden' }}>
                <Box sx={{ p: 4 }}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <TextField
                            type="date"
                            label="Data do Registro"
                            size="small"
                            value={dataFiltro}
                            onChange={(e) => setDataFiltro(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 200 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                variant="outlined" 
                                startIcon={<Plus size={18} />} 
                                onClick={handleAddRow}
                                sx={{ borderRadius: '10px' }}
                                disabled={!ctxUnidadeId}
                            >
                                Adicionar Linha
                            </Button>
                            <LoadingButton 
                                variant="contained" 
                                startIcon={<Save size={18} />} 
                                onClick={handleSave}
                                loading={saving}
                                sx={{ borderRadius: '10px', px: 4 }}
                                disabled={!ctxUnidadeId}
                            >
                                Salvar Planilha
                            </LoadingButton>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 1200 }}>
                            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', width: 250 }}>Alimento / Ficha Técnica</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hora Início</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp Inicial</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hora Fim</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp Após 2h</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Observação / Plano de Ação</TableCell>
                                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={32} />
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8, opacity: 0.6 }}>
                                            <AlertCircle size={40} style={{ marginBottom: 8 }} />
                                            <Typography variant="body2">Nenhum registro encontrado para esta data.</Typography>
                                            <Button size="small" onClick={handleAddRow} sx={{ mt: 1 }}>Iniciar Primeiro Registro</Button>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log, idx) => (
                                        <TableRow key={log.id || log.tempId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Autocomplete
                                                    size="small"
                                                    options={alimentos}
                                                    getOptionLabel={(option) => {
                                                        if (!option) return '';
                                                        return typeof option === 'string' ? option : (option.nome || '');
                                                    }}
                                                    value={log.alimento_obj}
                                                    onChange={(_, val) => handleLogChange(idx, 'alimento_obj', val)}
                                                    freeSolo
                                                    onInputChange={(_, newInputValue) => {
                                                        handleLogChange(idx, 'alimento_nome', newInputValue);
                                                    }}
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder="Nome do alimento..." variant="outlined" error={!log.alimento_nome} />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <Box component="li" {...props} sx={{ fontSize: '0.8rem' }}>
                                                            {option.tipo === 'RECEITA' ? <ChefHat size={14} style={{ marginRight: 8 }} /> : <ShoppingBag size={14} style={{ marginRight: 8 }} />}
                                                            {option.nome}
                                                        </Box>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField 
                                                    type="time" 
                                                    size="small" 
                                                    value={log.hora_inicio} 
                                                    onChange={(e) => handleLogChange(idx, 'hora_inicio', e.target.value)} 
                                                    error={!log.hora_inicio}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField 
                                                    type="number" 
                                                    size="small" 
                                                    value={log.temp_pos_preparo} 
                                                    onChange={(e) => handleLogChange(idx, 'temp_pos_preparo', e.target.value)}
                                                    InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                    sx={{ width: 90 }}
                                                    error={!log.temp_pos_preparo}
                                                />
                                                {log.temp_pos_preparo && parseFloat(log.temp_pos_preparo) < 60 && (
                                                    <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, lineHeight: 1 }}>Atenção: &lt; 60°C</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField 
                                                    type="time" 
                                                    size="small" 
                                                    value={log.hora_fim} 
                                                    onChange={(e) => handleLogChange(idx, 'hora_fim', e.target.value)} 
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField 
                                                    type="number" 
                                                    size="small" 
                                                    value={log.temp_apos_2h} 
                                                    onChange={(e) => handleLogChange(idx, 'temp_apos_2h', e.target.value)}
                                                    InputProps={{ endAdornment: <Typography variant="caption">°C</Typography> }}
                                                    sx={{ width: 90 }}
                                                />
                                                {log.is_out && (
                                                    <Typography variant="caption" color="error.main" fontWeight="bold" display="block" sx={{ mt: 0.5, lineHeight: 1 }}>Acima de 10°C!</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={log.status === 'CONCLUIDO' ? (log.is_out ? 'Desvio' : 'Concluído') : 'Em andamento'} 
                                                    color={log.status === 'CONCLUIDO' ? (log.is_out ? 'error' : 'success') : 'warning'} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField 
                                                    size="small" 
                                                    value={log.observacao} 
                                                    onChange={(e) => handleLogChange(idx, 'observacao', e.target.value)}
                                                    fullWidth
                                                    placeholder={log.is_out ? 'Descreva o Plano de Ação...' : 'Obs...'}
                                                    error={log.is_out && !log.observacao}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="error" onClick={() => handleRemoveRow(idx)}>
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>

            <Dialog open={planoAcaoModal.open} onClose={() => setPlanoAcaoModal({ open: false, logIndex: null })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertCircle size={20} /> Desvio Crítico Identificado!
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        A temperatura após 2 horas não atingiu o limite de segurança de 10°C. De acordo com a RDC 216, você deve registrar uma ação corretiva imediata.
                    </Typography>
                    <TextField
                        multiline
                        rows={3}
                        fullWidth
                        label="Plano de Ação / Disposição do Produto"
                        placeholder="Ex: Alimento foi descartado devido a risco sanitário."
                        value={planoAcaoDesc}
                        onChange={e => setPlanoAcaoDesc(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPlanoAcaoModal({ open: false, logIndex: null })}>Ignorar</Button>
                    <Button variant="contained" color="error" onClick={handleSavePlanoAcao} disabled={!planoAcaoDesc.trim()}>Registrar Ação</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={msg.open} autoHideDuration={4000} onClose={() => setMsg(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={msg.type} sx={{ borderRadius: '12px' }}>{msg.text}</Alert>
            </Snackbar>
        </Container>
    );
}
