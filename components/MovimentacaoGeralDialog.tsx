import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Typography, Box, CircularProgress,
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    InputAdornment, IconButton, Chip
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { Search, QrCode, ArrowRight } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    clienteId: string | null;
    onLoteSelected: (lote: any) => void;
}

export default function MovimentacaoGeralDialog({ open, onClose, clienteId, onLoteSelected }: Props) {
    const [busca, setBusca] = useState('');
    const [lotes, setLotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Reset e busca inicial
    useEffect(() => {
        if (open && clienteId) {
            setBusca('');
            fetchLotes('');
        }
    }, [open, clienteId]);

    // Debounce para a busca
    useEffect(() => {
        if (!open || !clienteId) return;
        const timeout = setTimeout(() => {
            fetchLotes(busca);
        }, 400);
        return () => clearTimeout(timeout);
    }, [busca, open, clienteId]);

    const fetchLotes = async (termo: string) => {
        if (!clienteId) return;
        setLoading(true);

        // Busca os lotes ativos do cliente
        let query = supabase
            .from('lotes_estoque')
            .select('*, ingredientes(nome)')
            .eq('unidade_id', clienteId) // Assumindo clienteId = unidadeId para esse escopo no MVP
            .neq('status', 'VENCIDO');

        // Se houver termo, busca por ingrediente, lote ou marca
        // Como a relação com ingredientes(nome) não permite ilike fácil pela API REST,
        // buscamos primeiro e filtramos no front se necessário, OU o termo aqui bate com lote e marca.
        // Para simplificar e garantir busca full text, traremos e filtraremos localmente se o termo for curto,
        // ou usamos a busca de texto se configurada.
        const { data } = await query.order('data_validade_interna', { ascending: true });

        if (data) {
            if (!termo) {
                setLotes(data.slice(0, 10)); // Mostrar os 10 primeiros se não houver busca
            } else {
                const lowerTerm = termo.toLowerCase();
                const filtered = data.filter(lote =>
                    (lote.ingredientes?.nome || '').toLowerCase().includes(lowerTerm) ||
                    (lote.numero_lote_fabricante || '').toLowerCase().includes(lowerTerm)
                );
                setLotes(filtered.slice(0, 15));
            }
        }

        setLoading(false);
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
                                            <Chip label={`${lote.quantidade_atual_g_ml} g/ml`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Lote: {lote.numero_lote_fabricante || 'N/A'} | Local: {lote.local_armazenamento || 'Geral'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Validade: {new Date(lote.data_validade_interna).toLocaleDateString()}
                                            </Typography>
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
        </Dialog>
    );
}
