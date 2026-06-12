'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Container, Typography, Box, Grid, Card, CardContent,
    CircularProgress, Alert, Stack, IconButton, Button,
    TextField, MenuItem, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    ToggleButton, ToggleButtonGroup, Autocomplete
} from '@mui/material';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function PlanilhasConfiguracaoPage() {
    const router = useRouter();
    const { activeClientId, unidadeId } = useClient();

    const [modelos, setModelos] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estado do formulário
    const [selectedModelo, setSelectedModelo] = useState('');
    const [frequenciaTipo, setFrequenciaTipo] = useState('DIARIA');
    const [responsavelId, setResponsavelId] = useState('');
    const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
    const [itensMonitorados, setItensMonitorados] = useState<string[]>([]);

    // Preencher campos automaticamente ao selecionar modelo
    useEffect(() => {
        if (selectedModelo) {
            const existing = configs.find(c => c.modelo_id === selectedModelo);
            if (existing) {
                setFrequenciaTipo(existing.frequencia_tipo || 'DIARIA');
                setResponsavelId(existing.responsavel_id || '');
                if (existing.frequencia_tipo === 'DIARIA' && existing.frequencia_config?.dias_semana) {
                    setDiasSemana(existing.frequencia_config.dias_semana);
                } else {
                    setDiasSemana([1, 2, 3, 4, 5]);
                }
                setItensMonitorados(existing.itens_monitorados || []);
            } else {
                setFrequenciaTipo('DIARIA');
                setResponsavelId('');
                setDiasSemana([1, 2, 3, 4, 5]);
                setItensMonitorados([]);
            }
        }
    }, [selectedModelo, configs]);

    const handleDiasSemanaChange = (event: React.MouseEvent<HTMLElement>, newDias: number[]) => {
        setDiasSemana(newDias);
    };

    const frequenciaOpcoes = [
        { value: 'DIARIA', label: 'Diária' },
        { value: 'SEMANAL', label: 'Semanal' },
        { value: 'QUINZENAL', label: 'Quinzenal' },
        { value: 'MENSAL', label: 'Mensal' },
        { value: 'BIMESTRAL', label: 'Bimestral' },
        { value: 'TRIMESTRAL', label: 'Trimestral' },
        { value: 'SEMESTRAL', label: 'Semestral' },
        { value: 'ANUAL', label: 'Anual' },
        { value: 'BIENAL', label: 'Bienal' },
        { value: 'DEMANDA', label: 'Sob Demanda' },
    ];

    useEffect(() => {
        if (activeClientId && unidadeId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [activeClientId, unidadeId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Buscar Modelos
            let queryModelos = (supabase as any).from('qual_planilha_modelos')
                .select('id, titulo')
                .eq('ativo', true)
                .is('deleted_at', null);

            if (activeClientId) {
                queryModelos = queryModelos.or(`cliente_id.eq.${activeClientId},cliente_id.is.null`);
            } else {
                queryModelos = queryModelos.is('cliente_id', null);
            }

            const { data: modData, error: modErr } = await queryModelos;
            if (modErr) throw modErr;
            setModelos(modData || []);

            // 2. Buscar Configs Atuais da Unidade
            const { data: confData, error: confErr } = await (supabase as any).from('qual_planilha_configuracoes')
                .select(`
                    id,
                    modelo_id,
                    unidade_id,
                    frequencia_tipo,
                    frequencia_config,
                    itens_monitorados,
                    responsavel_id,
                    ativo,
                    qual_planilha_modelos(titulo),
                    profiles(full_name)
                `)
                .eq('unidade_id', unidadeId)
                .eq('ativo', true);
            if (confErr) throw confErr;
            setConfigs(confData || []);

            // 3. Buscar Perfis para Responsável (idealmente usuários da unidade)
            // Por enquanto buscamos todos ou ajustamos baseado no RLS
            const { data: perfData, error: perfErr } = await (supabase as any).from('profiles')
                .select('id, full_name');
            if (perfErr) throw perfErr;
            setPerfis(perfData || []);

        } catch (err: any) {
            console.error('Erro ao buscar dados:', err);
            setError(err.message || 'Falha ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedModelo) {
            setError('Selecione um modelo de planilha.');
            return;
        }
        if (!unidadeId) {
            setError('Selecione uma unidade no topo da página.');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                modelo_id: selectedModelo,
                unidade_id: unidadeId,
                frequencia_tipo: frequenciaTipo,
                frequencia_config: frequenciaTipo === 'DIARIA' ? { dias_semana: diasSemana } : null,
                itens_monitorados: itensMonitorados,
                responsavel_id: responsavelId || null,
                ativo: true
            };

            // Buscar se já existe alguma configuração para esse modelo/unidade (mesmo inativa)
            const { data: existingAll, error: searchErr } = await (supabase as any).from('qual_planilha_configuracoes')
                .select('id')
                .eq('modelo_id', selectedModelo)
                .eq('unidade_id', unidadeId);
            
            if (searchErr) throw searchErr;

            if (existingAll && existingAll.length > 0) {
                // Atualizar o primeiro e remover os excedentes (para corrigir duplicidades antigas)
                const [first, ...rest] = existingAll;
                
                const { error: updateErr } = await (supabase as any).from('qual_planilha_configuracoes')
                    .update(payload)
                    .eq('id', first.id);
                if (updateErr) throw updateErr;

                if (rest.length > 0) {
                    await (supabase as any).from('qual_planilha_configuracoes')
                        .delete()
                        .in('id', rest.map((r: any) => r.id));
                }
            } else {
                // Insere nova
                const { error: insertErr } = await (supabase as any).from('qual_planilha_configuracoes')
                    .insert(payload);
                if (insertErr) throw insertErr;
            }

            setSuccess('Configuração salva com sucesso!');
            // Reset form
            setSelectedModelo('');
            setFrequenciaTipo('DIARIA');
            setResponsavelId('');
            setItensMonitorados([]);
            
            fetchData();
        } catch (err: any) {
            console.error('Erro ao salvar config:', err);
            setError(err.message || 'Erro ao salvar configuração.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfig = async (id: string) => {
        if (!confirm('Deseja remover esta configuração? A planilha não aparecerá mais como pendente para esta unidade.')) return;
        
        try {
            const { error: delErr } = await (supabase as any).from('qual_planilha_configuracoes')
                .update({ ativo: false })
                .eq('id', id);
            
            if (delErr) throw delErr;
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Erro ao remover configuração.');
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
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
                    Configuração de Planilhas
                </Typography>
            </Box>

            {!unidadeId ? (
                <Alert severity="warning">Por favor, selecione uma unidade no seletor global para configurar suas planilhas.</Alert>
            ) : (
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Nova Configuração</Typography>
                                
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                                <Stack spacing={3} mt={2}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Modelo de Planilha"
                                        value={selectedModelo}
                                        onChange={(e) => setSelectedModelo(e.target.value)}
                                    >
                                        <MenuItem value="">Selecione...</MenuItem>
                                        {modelos.map(m => (
                                            <MenuItem key={m.id} value={m.id}>{m.titulo}</MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        select
                                        fullWidth
                                        label="Frequência"
                                        value={frequenciaTipo}
                                        onChange={(e) => setFrequenciaTipo(e.target.value)}
                                    >
                                        {frequenciaOpcoes.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>

                                    {frequenciaTipo === 'DIARIA' && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Dias da Semana
                                            </Typography>
                                            <ToggleButtonGroup
                                                value={diasSemana}
                                                onChange={handleDiasSemanaChange}
                                                aria-label="dias da semana"
                                                fullWidth
                                            >
                                                <ToggleButton value={0} aria-label="Domingo">D</ToggleButton>
                                                <ToggleButton value={1} aria-label="Segunda">S</ToggleButton>
                                                <ToggleButton value={2} aria-label="Terça">T</ToggleButton>
                                                <ToggleButton value={3} aria-label="Quarta">Q</ToggleButton>
                                                <ToggleButton value={4} aria-label="Quinta">Q</ToggleButton>
                                                <ToggleButton value={5} aria-label="Sexta">S</ToggleButton>
                                                <ToggleButton value={6} aria-label="Sábado">S</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Box>
                                    )}

                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={[]}
                                        value={itensMonitorados}
                                        onChange={(event, newValue) => {
                                            setItensMonitorados(newValue);
                                        }}
                                        renderTags={(value: readonly string[], getTagProps) =>
                                            value.map((option: string, index: number) => {
                                                const { key, ...tagProps } = getTagProps({ index });
                                                return (
                                                    <Chip variant="outlined" label={option} key={key} {...tagProps} />
                                                );
                                            })
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Itens Monitorados (Equipamentos/Setores)"
                                                placeholder="Adicione um item e aperte Enter"
                                                helperText="Opcional. Se preenchido, o prazo será contado individualmente para cada item listado aqui."
                                            />
                                        )}
                                    />

                                    <TextField
                                        select
                                        fullWidth
                                        label="Responsável (Opcional)"
                                        value={responsavelId}
                                        onChange={(e) => setResponsavelId(e.target.value)}
                                    >
                                        <MenuItem value="">Nenhum específico</MenuItem>
                                        {perfis.map(p => (
                                            <MenuItem key={p.id} value={p.id}>{p.full_name || 'Usuário ' + p.id.substring(0,5)}</MenuItem>
                                        ))}
                                    </TextField>

                                    <Button 
                                        variant="contained" 
                                        startIcon={<Save size={18} />}
                                        onClick={handleSaveConfig}
                                        disabled={saving}
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>Planilhas Configuradas na Unidade</Typography>
                        <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Planilha</TableCell>
                                            <TableCell>Frequência</TableCell>
                                            <TableCell>Responsável</TableCell>
                                            <TableCell align="right">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {configs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">Nenhuma configuração encontrada.</TableCell>
                                            </TableRow>
                                        ) : (
                                            configs.map((conf) => (
                                                <TableRow key={conf.id}>
                                                    <TableCell sx={{ fontWeight: 500 }}>{conf.qual_planilha_modelos?.titulo}</TableCell>
                                                    <TableCell>
                                                        <Chip size="small" label={conf.frequencia_tipo} color="primary" variant="outlined" />
                                                        {conf.itens_monitorados && conf.itens_monitorados.length > 0 && (
                                                            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                                                {conf.itens_monitorados.length} itens monitorados
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{conf.profiles?.full_name || '-'}</TableCell>
                                                    <TableCell align="right">
                                                        <Button 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDeleteConfig(conf.id)}
                                                        >
                                                            Remover
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
}
