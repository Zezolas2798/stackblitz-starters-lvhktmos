'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Drawer, TextField, Stack, Alert, CircularProgress, MenuItem
} from '@mui/material';
import { Plus, CheckCircle, AlertCircle, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Instância do cliente Supabase para Leitura Frontend
// (Regra: Apenas leitura segura pelo RLS. Escrita vai via API própria)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Reutilizamos o schema Zod para validação rigorosa no frontend antes do POST
const ProdutoBombeiroSchema = z.object({
    nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    descricao: z.string().optional(),
    data_emissao: z.string().min(1, 'A data de emissão é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    data_validade: z.string().min(1, 'A data de validade é obrigatória')
        .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
    status_sivisa: z.enum(['Aprovado', 'Aguardando Vistoria', 'Exigência']),
});

type FormData = z.infer<typeof ProdutoBombeiroSchema>;

export default function CertificacoesPage() {
    const [certificacoes, setCertificacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(ProdutoBombeiroSchema),
        defaultValues: {
            nome: '',
            descricao: '',
            data_emissao: '',
            data_validade: '',
            status_sivisa: 'Aguardando Vistoria',
        }
    });

    const fetchCertificacoes = async () => {
        setLoading(true);
        // Graças ao RLS e ao soft delete que implementamos na etapa 1, isto é seguro
        const { data, error } = await supabase
            .from('produtos_bombeiros')
            .select('*')
            .is('deleted_at', null)
            .order('data_validade', { ascending: true }); // Prioriza os mais próximos de vencer

        if (!error && data) {
            setCertificacoes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCertificacoes();
    }, []);

    // KPIs Calculados (Opção 3 GxP)
    const stats = {
        total: certificacoes.length,
        vencidas: certificacoes.filter(c => new Date(c.data_validade) < new Date()).length,
        exigencias: certificacoes.filter(c => c.status_sivisa === 'Exigência').length,
        aprovadas: certificacoes.filter(c => c.status_sivisa === 'Aprovado' && new Date(c.data_validade) >= new Date()).length
    };

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        setApiError(null);
        try {
            // POST SEGURO VIA API EM VEZ DE ACESSAR DIRETO SUPABASE.INSERT()
            const res = await fetch('/api/produtos_bombeiros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.erro || 'Falha ao registrar certificação.');
            }

            setIsDrawerOpen(false);
            reset();
            fetchCertificacoes();
        } catch (err: any) {
            setApiError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'Aprovado': return <Chip size="small" icon={<CheckCircle size={14} />} label="Aprovado" color="success" />;
            case 'Aguardando Vistoria': return <Chip size="small" icon={<Clock size={14} />} label="Em Vistoria" color="warning" />;
            case 'Exigência': return <Chip size="small" icon={<AlertCircle size={14} />} label="Exigência" color="error" />;
            default: return <Chip size="small" label={status} />;
        }
    };

    const handleSoftDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover esta certificação? Ela será ocultada dos relatórios oficiais (Soft Delete).')) return;

        setLoading(true);
        const { error } = await supabase
            .from('produtos_bombeiros')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            alert('Falha ao remover licença: ' + error.message);
        } else {
            fetchCertificacoes();
        }
        setLoading(false);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    Certificações Bombeiros / SIVISA
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => { reset(); setApiError(null); setIsDrawerOpen(true); }}
                    sx={{ borderRadius: 2 }}
                >
                    Novo Registro
                </Button>
            </Box>

            {/* PAINEL KPI GxP (Opção 3) */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, flex: 1, borderLeft: 4, borderColor: 'text.secondary', bgcolor: 'action.hover' }} elevation={0}>
                    <Typography variant="body2" color="text.secondary" fontWeight="bold">Total de Registros</Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ mt: 1 }}>{stats.total}</Typography>
                </Paper>

                <Paper sx={{ p: 2, flex: 1, borderLeft: 4, borderColor: 'success.main', bgcolor: 'success.50' }} elevation={0}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold">Licenças Ativas / Aprovadas</Typography>
                    <Typography variant="h4" color="success.main" fontWeight="800" sx={{ mt: 1 }}>{stats.aprovadas}</Typography>
                </Paper>

                <Paper sx={{ p: 2, flex: 1, borderLeft: 4, borderColor: 'error.main', bgcolor: 'error.50' }} elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldAlert size={16} color="error" />
                        <Typography variant="body2" color="error.dark" fontWeight="bold">Vencidas ou Exigências CRÍTICAS</Typography>
                    </Box>
                    <Typography variant="h4" color="error.main" fontWeight="800" sx={{ mt: 1 }}>{stats.vencidas + stats.exigencias}</Typography>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell><b>Licença / Produto</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                                <TableCell><b>Emissão</b></TableCell>
                                <TableCell><b>Validade</b></TableCell>
                                <TableCell align="right"><b>Ações</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} thickness={5} />
                                    </TableCell>
                                </TableRow>
                            ) : certificacoes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        Nenhuma certificação registrada no sistema.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                certificacoes.map((cert) => (
                                    <TableRow key={cert.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500">{cert.nome}</Typography>
                                            <Typography variant="caption" color="text.secondary">{cert.descricao}</Typography>
                                        </TableCell>
                                        <TableCell>{getStatusChip(cert.status_sivisa)}</TableCell>
                                        <TableCell>{format(parseISO(cert.data_emissao), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            {new Date(cert.data_validade) < new Date() ? (
                                                <Chip
                                                    size="small"
                                                    label={`VENCIDO (${format(parseISO(cert.data_validade), 'dd/MM/yyyy')})`}
                                                    color="error"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            ) : (
                                                <Typography variant="body2" fontWeight="500">
                                                    {format(parseISO(cert.data_validade), 'dd/MM/yyyy')}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error" onClick={() => handleSoftDelete(cert.id)} title="Remover Licença">
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Drawer Segura para Inserção (React Hook Form) */}
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0 } }}
            >
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                    <Typography variant="h6" fontWeight="bold">Registrar Nova Licença</Typography>
                    <Typography variant="body2" color="text.secondary">Os dados informados serão validados por trilha de auditoria (GxP).</Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        {apiError && <Alert severity="error">{apiError}</Alert>}

                        <Controller
                            name="nome"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nome da Licença (ex: AVCB Galpão A)"
                                    fullWidth
                                    size="small"
                                    error={!!errors.nome}
                                    helperText={errors.nome?.message}
                                />
                            )}
                        />

                        <Controller
                            name="descricao"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Descrição Breve"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    error={!!errors.descricao}
                                    helperText={errors.descricao?.message}
                                />
                            )}
                        />

                        <Controller
                            name="data_emissao"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Data de Emissão Oficial"
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.data_emissao}
                                    helperText={errors.data_emissao?.message}
                                />
                            )}
                        />

                        <Controller
                            name="data_validade"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Data de Validade (Vencimento)"
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    error={!!errors.data_validade}
                                    helperText={errors.data_validade?.message}
                                />
                            )}
                        />

                        <Controller
                            name="status_sivisa"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Status Atual no Órgão"
                                    fullWidth
                                    size="small"
                                    error={!!errors.status_sivisa}
                                    helperText={errors.status_sivisa?.message}
                                >
                                    <MenuItem value="Aguardando Vistoria">Aguardando Vistoria</MenuItem>
                                    <MenuItem value="Aprovado">Aprovado</MenuItem>
                                    <MenuItem value="Exigência">Em Exigência</MenuItem>
                                </TextField>
                            )}
                        />

                        <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setIsDrawerOpen(false)}
                                disabled={submitting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                type="submit"
                                fullWidth
                                disabled={submitting}
                            >
                                {submitting ? 'Salvando...' : 'Registrar'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Drawer>
        </Box>
    );
}
