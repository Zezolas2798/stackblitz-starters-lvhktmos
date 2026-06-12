'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
    Box, Typography, Button, Paper, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Snackbar, Alert, Container, IconButton,
    Divider, useTheme, alpha, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    ChevronLeft, Printer, AlertCircle, FileSignature
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import '../3-7-12-planilha-temperatura/PrintStyles.css';

interface ResfriamentoLog {
    id: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    alimento_nome: string;
    temp_pos_preparo: number;
    temp_apos_2h: number;
    status: string;
    is_out: boolean;
    observacao: string;
}

export default function RelatorioResfriamentoPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const theme = useTheme();
    const router = useRouter();
    const { activeClientId, unidadeId: ctxUnidadeId, activeClientName, unidadeSelecionada } = useClient();

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ open: false, text: '', type: 'success' as 'success' | 'error' });

    const [dataInicio, setDataInicio] = useState(format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'));
    const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [logs, setLogs] = useState<ResfriamentoLog[]>([]);

    const [assinaturaData, setAssinaturaData] = useState<{ image: string | null, nome: string, cargo: string, data: string }>({
        image: null,
        nome: '',
        cargo: 'Responsável Técnico',
        data: format(new Date(), 'yyyy-MM-dd')
    });
    const [openAssinatura, setOpenAssinatura] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);

    const loadDados = useCallback(async () => {
        if (!activeClientId || !ctxUnidadeId) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('controle_resfriamento')
                .select('*')
                .eq('cliente_id', activeClientId)
                .eq('unidade_id', ctxUnidadeId)
                .gte('data', dataInicio)
                .lte('data', dataFim)
                .order('data', { ascending: true })
                .order('hora_inicio', { ascending: true });

            if (error) throw error;
            setLogs((data as any[]) || []);
        } catch (err: any) {
            console.error(err);
            setMsg({ open: true, text: 'Erro ao carregar relatório.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [activeClientId, ctxUnidadeId, dataInicio, dataFim]);

    useEffect(() => {
        loadDados();
    }, [loadDados]);

    useEffect(() => {
        const di = dataInicio ? format(parseISO(dataInicio), 'dd-MM-yyyy') : '';
        const df = dataFim ? format(parseISO(dataFim), 'dd-MM-yyyy') : '';
        document.title = `Controle_Resfriamento_${di}_a_${df}`;
        return () => {
            document.title = 'StyleSeed App';
        };
    }, [dataInicio, dataFim]);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Controle_Resfriamento_${format(new Date(), 'yyyyMMdd')}`;
        window.print();
        setTimeout(() => { document.title = originalTitle; }, 1000);
    };

    const handleSaveAssinatura = () => {
        if (sigCanvas.current?.isEmpty()) {
            setMsg({ open: true, text: 'Por favor, assine antes de salvar.', type: 'error' });
            return;
        }
        
        let dataURL = null;
        try {
            dataURL = sigCanvas.current?.getCanvas().toDataURL('image/png');
        } catch (err) {
            console.error(err);
            setMsg({ open: true, text: 'Erro ao processar assinatura.', type: 'error' });
            return;
        }
        
        setAssinaturaData({ ...assinaturaData, image: dataURL || null });
        setOpenAssinatura(false);
        setMsg({ open: true, text: 'Assinatura registrada com sucesso.', type: 'success' });
    };

    const renderPrintHeader = () => (
        <Box className="print-header" sx={{ display: 'none', mb: 4, borderBottom: '2px solid #000', pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">3.7.13 PLANILHA DE CONTROLE</Typography>
                    <Typography variant="h6">Temperatura do Alimento Durante o Resfriamento</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">Doc: INF-POP-03-7-13</Typography>
                    <Typography variant="body2">Revisão: 01</Typography>
                    <Typography variant="body2">Página: 1/1</Typography>
                </Box>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, bgcolor: '#f5f5f5', p: 1.5, border: '1px solid #ddd' }}>
                <Box>
                    <Typography variant="body2"><strong>Empresa:</strong> {activeClientName}</Typography>
                    <Typography variant="body2"><strong>Unidade:</strong> {unidadeSelecionada?.nome_unidade || 'Matriz'}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2"><strong>Mês/Ano:</strong> {format(parseISO(dataInicio), 'MM/yyyy')} a {format(parseISO(dataFim), 'MM/yyyy')}</Typography>
                    <Typography variant="body2"><strong>Legislação:</strong> RDC 216 (Resfriamento 60°C para 10°C em até 2h)</Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }} className="print-container">
            {renderPrintHeader()}

            {!isEmbedded && (
                <Box className="hide-on-print" sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5) }}>
                            <ChevronLeft size={20} />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ color: 'primary.main' }}>
                                Relatório de Resfriamento
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Documento 3.7.13 • Redução de 60°C para 10°C
                            </Typography>
                        </Box>
                    </Box>
                    <Button 
                        variant="contained" 
                        startIcon={<Printer size={18} />} 
                        onClick={handlePrint}
                        sx={{ borderRadius: '10px' }}
                    >
                        Imprimir / PDF
                    </Button>
                </Box>
            )}

            {isEmbedded && (
                <Box className="hide-on-print" sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                        variant="contained" 
                        startIcon={<Printer size={18} />} 
                        onClick={handlePrint}
                        sx={{ borderRadius: '10px' }}
                    >
                        Imprimir / PDF
                    </Button>
                </Box>
            )}

            <Paper elevation={0} className="hide-on-print" sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        type="date"
                        label="Data Início"
                        size="small"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        type="date"
                        label="Data Fim"
                        size="small"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="contained" onClick={loadDados} disabled={loading}>Filtrar</Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', overflow: 'hidden', p: 3 }} className="print-no-border">
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                ) : logs.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 2 }}>
                        <AlertCircle size={40} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <Typography color="text.secondary">Nenhum registro de resfriamento encontrado no período.</Typography>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Registros de Resfriamento</Typography>
                        <TableContainer>
                            <Table size="small" className="print-table">
                                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Alimento / Ficha Técnica</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hora Início</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp Inicial</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hora Fim</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Temp Após 2h</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Observações / Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(parseISO(log.data), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{log.alimento_nome}</TableCell>
                                            <TableCell align="center">{log.hora_inicio?.substring(0, 5)}</TableCell>
                                            <TableCell align="center">{log.temp_pos_preparo ? `${log.temp_pos_preparo}°C` : '-'}</TableCell>
                                            <TableCell align="center">{log.hora_fim?.substring(0, 5) || '-'}</TableCell>
                                            <TableCell align="center">
                                                <Typography component="span" sx={{ color: log.is_out ? 'error.main' : 'inherit', fontWeight: log.is_out ? 'bold' : 'normal' }}>
                                                    {log.temp_apos_2h ? `${log.temp_apos_2h}°C` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {log.status === 'CONCLUIDO' ? (
                                                    log.is_out ? 'Desvio' : 'Conforme'
                                                ) : 'Em Andamento'}
                                            </TableCell>
                                            <TableCell>{log.observacao || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Bloco de Assinaturas (Impressão e Digital) */}
                        <Box className="print-break-inside-avoid" sx={{ mt: 6, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: '#fafafa' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">Assinaturas e Validação</Typography>
                                <Button 
                                    startIcon={<FileSignature size={18} />} 
                                    variant="outlined" 
                                    onClick={() => setOpenAssinatura(true)}
                                    className="hide-on-print"
                                    size="small"
                                >
                                    Assinar Digitalmente
                                </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 6, justifyContent: 'space-around', mt: 4 }}>
                                <Box sx={{ textAlign: 'center', width: '40%' }}>
                                    {assinaturaData.image ? (
                                        <Box component="img" src={assinaturaData.image} sx={{ height: 60, objectFit: 'contain', mb: 1 }} />
                                    ) : (
                                        <Box sx={{ height: 60, borderBottom: '1px solid #000', mb: 1 }} />
                                    )}
                                    {!assinaturaData.image && <Box sx={{ borderTop: '1px solid #000', mt: -1 }} />}
                                    <Typography variant="body2" fontWeight="bold">{assinaturaData.nome || 'Assinatura do Monitor'}</Typography>
                                    <Typography variant="caption" color="text.secondary">Monitor de Qualidade</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', width: '40%' }}>
                                    {assinaturaData.image ? (
                                        <Box component="img" src={assinaturaData.image} sx={{ height: 60, objectFit: 'contain', mb: 1 }} />
                                    ) : (
                                        <Box sx={{ height: 60, borderBottom: '1px solid #000', mb: 1 }} />
                                    )}
                                    {!assinaturaData.image && <Box sx={{ borderTop: '1px solid #000', mt: -1 }} />}
                                    <Typography variant="body2" fontWeight="bold">{assinaturaData.nome || 'Assinatura do RT'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{assinaturaData.cargo}</Typography>
                                    {assinaturaData.image && <Typography variant="caption" display="block">Data: {format(parseISO(assinaturaData.data), 'dd/MM/yyyy')}</Typography>}
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
            </Paper>

            <Dialog open={openAssinatura} onClose={() => setOpenAssinatura(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assinatura Digital</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField 
                            label="Nome Completo" 
                            size="small" 
                            fullWidth 
                            value={assinaturaData.nome} 
                            onChange={e => setAssinaturaData({...assinaturaData, nome: e.target.value})} 
                        />
                        <TextField 
                            label="Cargo" 
                            size="small" 
                            fullWidth 
                            value={assinaturaData.cargo} 
                            onChange={e => setAssinaturaData({...assinaturaData, cargo: e.target.value})} 
                        />
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 1, mt: 2 }}>
                            <SignatureCanvas 
                                ref={sigCanvas}
                                penColor="black"
                                canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} 
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={() => sigCanvas.current?.clear()}>Limpar Desenho</Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssinatura(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveAssinatura}>Salvar Assinatura</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={msg.open} autoHideDuration={4000} onClose={() => setMsg(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={msg.type}>{msg.text}</Alert>
            </Snackbar>
        </Container>
    );
}
