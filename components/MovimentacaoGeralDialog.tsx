import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, CircularProgress,
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    InputAdornment, IconButton, Chip
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { Search, QrCode, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';
import { formatarQuantidade } from './MovimentacaoEstoqueDialog';
import MovimentoEtiquetaDialog from '@/components/etiquetas/MovimentoEtiquetaDialog';

interface Props {
    open: boolean;
    onClose: () => void;
    clienteId: string | null;
    onLoteSelected: (lote: any) => void;
    onSuccess?: () => void;
}



export default function MovimentacaoGeralDialog({ open, onClose, clienteId, onLoteSelected, onSuccess }: Props) {
    const [busca, setBusca] = useState('');
    const [lotes, setLotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [etiquetaModalData, setEtiquetaModalData] = useState<{
        open: boolean;
        lote: any;
        qtdMovedGml: number;
        opContext?: string;
    }>({ open: false, lote: null, qtdMovedGml: 0 });

    const [unidadeInfo, setUnidadeInfo] = useState<any>(null);



    const fetchLotes = useCallback(async (termo: string) => {
        if (!clienteId) return;
        setLoading(true);

        // Busca os lotes ativos do cliente com suas reservas
        const { data, error } = await ((supabase as any).from('lotes_estoque')
            .select(`
                *,
                ingredientes(nome),
                fornecedores(razao_social, nome_fantasia, cnpj),
                producao_reservas_estoque(
                    id,
                    quantidade_reservada_g,
                    status,
                    producao_requisicoes(
                        producao_ordens(
                            id,
                            codigo,
                            producao_ordens_itens(
                                cliente_setores_producao(nome)
                            )
                        )
                    )
                )
            `)
            .eq('unidade_id', clienteId)
            .neq('status', 'REJEITADO')
            .neq('status', 'PREVISTO')
            .is('deleted_at', null)
            .order('data_validade_rotulo', { ascending: true }) as any);

        if (error) {
            console.error('Erro ao buscar lotes:', error);
            setLoading(false);
            return;
        }

        if (data) {
            if (!termo) {
                setLotes(data.slice(0, 10)); // Mostrar os 10 primeiros se não houver busca
            } else {
                const lowerTerm = termo.toLowerCase();
                const filtered = (data as any[]).filter(lote =>
                    (lote.ingredientes?.nome || '').toLowerCase().includes(lowerTerm) ||
                    (lote.numero_lote_fabricante || '').toLowerCase().includes(lowerTerm)
                );
                setLotes(filtered.slice(0, 15));
            }
        }

        setLoading(false);
    }, [clienteId]);

    // Reset e busca inicial
    useEffect(() => {
        if (open && clienteId) {
            setBusca('');
            fetchLotes('');
            loadUnidadeInfo();
        }
    }, [open, clienteId, fetchLotes]);

    const loadUnidadeInfo = async () => {
        if (!clienteId) return;
        const { data } = await (supabase as any)
            .from('cliente_unidades')
            .select('*')
            .eq('id', clienteId)
            .single();
        if (data) setUnidadeInfo(data);
    };

    // Debounce para a busca
    useEffect(() => {
        if (!open || !clienteId) return;
        const timeout = setTimeout(() => {
            fetchLotes(busca);
        }, 400);
        return () => clearTimeout(timeout);
    }, [busca, open, clienteId, fetchLotes]);

    const handleConfirmarEntrega = async (lote: any, reserva: any) => {
        if (!window.confirm(`Confirmar a entrega de ${formatarQuantidade(reserva.quantidade_reservada_g)} para a OP ${reserva.producao_requisicoes?.producao_ordens?.codigo}?`)) return;

        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;

            // 1. Baixar o estoque do lote
            const novaQtdGml = Math.max(0, lote.quantidade_atual_g_ml - reserva.quantidade_reservada_g);
            
            // Se o lote tiver controle de embalagem, precisamos abater proporcionalmente ou o usuário decide?
            // Para simplificar a automação conforme pedido: se for reserva exata de embalagem, abate. 
            // Se não, o sistema abate apenas o peso.
            let updatePayload: any = { quantidade_atual_g_ml: novaQtdGml };

            const { error: errLote } = await (supabase as any).from('lotes_estoque')
                .update(updatePayload)
                .eq('id', lote.id);
            if (errLote) throw errLote;

            // 2. Atualizar status da reserva
            const { error: errRes } = await (supabase as any).from('producao_reservas_estoque')
                .update({ status: 'CONSUMIDO' })
                .eq('id', reserva.id);
            if (errRes) throw errRes;

            // 3. Registrar movimentação
            const opCodigo = reserva.producao_requisicoes?.producao_ordens?.codigo || 'N/A';
            const { error: errHist } = await (supabase as any).from('estoque_movimentacoes')
                .insert({
                    lote_id: lote.id,
                    tipo_movimento: 'SAIDA',
                    quantidade_movimentada: reserva.quantidade_reservada_g,
                    quantidade_nova: novaQtdGml,
                    data_movimento: new Date().toISOString(),
                    justificativa: `Alocação Automática - OP ${opCodigo}`,
                    responsavel_id: user?.id
                });
            if (errHist) throw errHist;

            if (onSuccess) onSuccess();
            fetchLotes(busca);

            // Chama modal de etiqueta no lugar do alert
            setEtiquetaModalData({
                open: true,
                lote,
                qtdMovedGml: reserva.quantidade_reservada_g,
                opContext: `OP ${opCodigo}`
            });
            
        } catch (err: any) {
            console.error('Erro na alocação automática:', err);
            alert('Erro ao processar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSimularLeitorQR = () => {
        // Aqui no futuro entrará a integração com o leitor de QR Code / Câmera
        alert("Funcionalidade de Câmera/QR Code será ativada no App Mobile ou Tablet. Por enquanto, digite o código do lote ou nome do produto.");
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                Localizar Insumo para Movimentar
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>

                {/* Barra de Busca + Leitor */}
                <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar por Nome, Marca ou Lote..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            autoFocus
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search size={18} opacity={0.5} /></InputAdornment>,
                                endAdornment: loading ? <CircularProgress size={16} /> : null
                            }}
                            sx={{ bgcolor: 'background.paper' }}
                        />
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleSimularLeitorQR}
                            sx={{ minWidth: 48, px: 0 }}
                        >
                            <QrCode size={20} />
                        </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Dica: Digite o nome do produto ou use o leitor de código de barras/QR da etiqueta.
                    </Typography>
                </Box>

                {/* Lista de Resultados */}
                <List sx={{ minHeight: 300, maxHeight: 400, overflowY: 'auto', p: 0 }}>
                    {lotes.length === 0 && !loading ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Nenhum lote encontrado em estoque.</Typography>
                        </Box>
                    ) : (
                        lotes.map(lote => (
                            <ListItem
                                key={lote.id}
                                button
                                divider
                                onClick={() => onLoteSelected(lote)}
                                sx={{ py: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {lote.ingredientes?.nome}
                                            </Typography>
                                            <Chip label={formatarQuantidade(lote.quantidade_atual_g_ml)} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Lote: {lote.numero_lote_fabricante || 'N/A'} | Local: {lote.local_armazenamento || 'Geral'}
                                            </Typography>
                                            
                                            {/* Exibição de Reservas Ativas */}
                                            {lote.producao_reservas_estoque?.filter((r: any) => r.status === 'RESERVADO').length > 0 && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1, border: '1px dashed', borderColor: 'warning.main' }}>
                                                    <Typography variant="caption" fontWeight="bold" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                        <Truck size={12} /> RESERVAS ATIVAS:
                                                    </Typography>
                                                    {lote.producao_reservas_estoque.filter((r: any) => r.status === 'RESERVADO').map((res: any) => {
                                                        const op = res.producao_requisicoes?.producao_ordens;
                                                        const setores = op?.producao_ordens_itens?.map((i: any) => i.cliente_setores_producao?.nome).filter(Boolean);
                                                        const setoresUnicos = Array.from(new Set(setores)).join(', ');
                                                        
                                                        return (
                                                            <Box key={res.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                <Typography variant="caption" color="text.primary">
                                                                    OP: <strong>{op?.codigo}</strong> | {setoresUnicos ? `Setor: ${setoresUnicos}` : 'Geral'} | <strong>{formatarQuantidade(res.quantidade_reservada_g)}</strong>
                                                                </Typography>
                                                                <Button 
                                                                    size="small" 
                                                                    variant="contained" 
                                                                    color="warning"
                                                                    onClick={(e) => { e.stopPropagation(); handleConfirmarEntrega(lote, res); }}
                                                                    sx={{ fontSize: '0.65rem', py: 0, px: 1, height: 22 }}
                                                                    startIcon={<CheckCircle2 size={12} />}
                                                                >
                                                                    Entregar
                                                                </Button>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                                <ArrowRight size={18} color="gray" style={{ opacity: 0.5 }} />
                            </ListItem>
                        ))
                    )}
                </List>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
            </DialogActions>
            
            <MovimentoEtiquetaDialog
                open={etiquetaModalData.open}
                onClose={() => setEtiquetaModalData({ ...etiquetaModalData, open: false })}
                lote={etiquetaModalData.lote}
                quantidadeMovimentadaGml={etiquetaModalData.qtdMovedGml}
                contextoDestino={etiquetaModalData.opContext}
                unidadeInfo={unidadeInfo}
            />
        </Dialog>
    );
}



