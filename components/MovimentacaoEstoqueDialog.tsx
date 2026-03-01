import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Typography, Box, Alert,
    CircularProgress, ListSubheader
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';

interface Props {
    open: boolean;
    onClose: () => void;
    lote: any;
    onSuccess: () => void;
}

interface SetorProducao {
    id: string;
    nome: string;
}

export default function MovimentacaoEstoqueDialog({ open, onClose, lote, onSuccess }: Props) {
    const [tipo, setTipo] = useState('SAIDA');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');
    const [setores, setSetores] = useState<SetorProducao[]>([]);
    const [locais, setLocais] = useState<any[]>([]); // Adicionado estado para Locais de Estoque
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset states when modal opens
    useEffect(() => {
        if (open) {
            setTipo('SAIDA');
            setQuantidade('');
            setMotivo('');
            setError('');
            if (lote?.cliente_id) fetchSetores(lote.cliente_id);
            if (lote?.unidade_id) fetchLocais(lote.unidade_id);
        }
    }, [open, lote]);

    const fetchLocais = async (unidadeId: string) => {
        const { data } = await supabase
            .from('cliente_locais_estoque')
            .select('id, nome')
            .eq('unidade_id', unidadeId)
            .order('nome');

        if (data) setLocais(data);
    };

    const fetchSetores = async (clienteId: string) => {
        const { data } = await supabase
            .from('cliente_setores_producao')
            .select('id, nome')
            .eq('cliente_id', clienteId)
            .order('nome');

        if (data) setSetores(data);
    };

    if (!lote) return null;

    const handleSalvar = async () => {
        if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
            setError('Informe uma quantidade válida e maior que zero.');
            return;
        }

        if (!motivo.trim()) {
            setError('Informe o motivo da movimentação.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const qty = Number(quantidade);
            let novaQuantidade = lote.quantidade_atual;

            const isAjuste = tipo === 'AJUSTE';
            const isEntrada = tipo === 'ENTRADA';
            const isTransferencia = tipo.startsWith('TRANSFERENCIA_');
            const isSetor = tipo.startsWith('SETOR_');
            const isDescartado = tipo === 'DESCARTADO';

            // Se for entrada ou devolução
            if (isEntrada) {
                novaQuantidade += qty;
            }
            // Se for ajuste de inventário
            else if (isAjuste) {
                novaQuantidade = qty;
            }
            // Saídas para Setor, Transferência ou Descartes
            else {
                novaQuantidade -= qty;
            }

            // Transferências e Envios para Setor contam como "SAIDA" do lote atual 
            // no histórico, mas com descrições/destinos diferentes.
            const tipoHistorico = isEntrada || isAjuste ? tipo : 'SAIDA';

            if (novaQuantidade < 0) {
                setError('A quantidade final não pode ser menor que zero.');
                setLoading(false);
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            const user = userData.user;

            const nomeDestino = isSetor
                ? setores.find(s => `SETOR_${s.id}` === tipo)?.nome || ''
                : isTransferencia
                    ? locais.find(l => `TRANSFERENCIA_${l.id}` === tipo)?.nome || ''
                    : '';

            // 1. Atualizar o lote
            // Se for transferência total (nova quantidade = 0), apenas move o lote.
            // Se for transferência parcial, a abordagem ideal seria dividir o lote, mas por simplicidade
            // em interfaces simples costuma-se só descrever a saída para o outro local.
            // Para mantermos simples e seguro: Retiramos a QTY do lote atual. 
            // (Para criar um novo lote no destino exigiria mais lógica de fracionamento de lote).
            // NOTA: Para este MVP vamos apenas alterar o `local_armazenamento` do lote se ele não tiver sido esvaziado, 
            // mas o conceito de transferência parcial de lote sem dividí-lo pode causar inconsistências físicas.
            // Vamos adotar: Transferência = "Saída enviada para [Local]"

            const updatePayload: any = { quantidade_atual: novaQuantidade };

            // Se o usuário selecionou TRANSFERENCIA e está movendo TODO o lote restante,
            // podemos atualizar a localização do lote.
            if (isTransferencia && novaQuantidade === 0) {
                updatePayload.local_armazenamento = nomeDestino;
                // Na vida real: lote inteiro movido. Qtd = mesmo do que estava.
                // Revertendo a subtração para que a quantidade não vire 0
                updatePayload.quantidade_atual = lote.quantidade_atual;
            }

            const { error: erroLote } = await supabase
                .from('estoque_lotes')
                .update(updatePayload)
                .eq('id', lote.id);

            if (erroLote) throw erroLote;

            // 2. Registrar no histórico
            let justificativaFinal = motivo;

            if (isSetor) justificativaFinal = `Enviado para Produção: ${nomeDestino} ${motivo ? '- ' + motivo : ''}`;
            else if (isTransferencia) justificativaFinal = `Transferido para: ${nomeDestino} ${motivo ? '- ' + motivo : ''}`;
            else if (isDescartado) justificativaFinal = `DESCARTADO: ${motivo}`;

            const { error: erroHist } = await supabase
                .from('estoque_movimentacoes')
                .insert({
                    lote_id: lote.id,
                    tipo_movimento: isTransferencia && novaQuantidade === 0 ? 'TRANSFERENCIA' : tipoHistorico,
                    quantidade_movimentada: isAjuste ? (novaQuantidade - lote.quantidade_atual) : (isTransferencia && novaQuantidade === 0 ? lote.quantidade_atual : qty),
                    quantidade_nova: isTransferencia && novaQuantidade === 0 ? lote.quantidade_atual : novaQuantidade,
                    data_movimento: new Date().toISOString(),
                    justificativa: justificativaFinal,
                    responsavel_id: user?.id,
                    unidade_id: lote.unidade_id
                });

            if (erroHist) throw erroHist;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao registrar movimentação.');
        } finally {
            setLoading(false);
        }
    };

    const isAjuste = tipo === 'AJUSTE';

    return (
        <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                Movimentar Estoque
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Produto</Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {lote.ingredientes?.nome || 'Ingrediente'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Lote: {lote.codigo_lote_fornecedor || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                            Atual: {lote.quantidade_atual} {lote.unidade_medida}
                        </Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        select
                        label="Tipo de Movimentação/Destino"
                        fullWidth
                        size="small"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <MenuItem value="ENTRADA" sx={{ color: 'success.main', fontWeight: 'bold' }}>+ Entrada (Devolução / Adição)</MenuItem>
                        <MenuItem value="AJUSTE" sx={{ color: 'info.main', fontWeight: 'bold' }}>Ajuste de Inventário (Novo Total)</MenuItem>

                        {/* OPÇÕES DE SETORES/PRODUCÃO P/ SAÍDAS */}
                        {setores.length > 0 && <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '30px', fontWeight: 'bold', mt: 1 }}>--- ENVIAR PARA PREPARO ---</ListSubheader>}
                        {setores.map(setor => (
                            <MenuItem key={`setor_${setor.id}`} value={`SETOR_${setor.id}`}>
                                &nbsp;&nbsp;&nbsp;Saída para {setor.nome}
                            </MenuItem>
                        ))}

                        {/* OPÇÕES DE LOCAIS P/ TRANSFERÊNCIAS */}
                        {locais.length > 0 && <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '30px', fontWeight: 'bold', mt: 1 }}>--- TRANSFERIR PARA LOCAL ---</ListSubheader>}
                        {locais.filter(l => l.nome !== lote?.local_armazenamento).map(local => (
                            <MenuItem key={`local_${local.id}`} value={`TRANSFERENCIA_${local.id}`}>
                                &nbsp;&nbsp;&nbsp;Transferir para {local.nome}
                            </MenuItem>
                        ))}

                        {(setores.length === 0 && locais.length === 0) && <MenuItem value="SAIDA">- Saída (Geral)</MenuItem>}

                        <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '30px', fontWeight: 'bold', mt: 1 }}>--- PERDAS ---</ListSubheader>
                        <MenuItem value="DESCARTADO" sx={{ color: 'error.main', fontWeight: 'bold' }}>&nbsp;&nbsp;&nbsp;DESCARTADO (Vencimento/Avaria)</MenuItem>

                    </TextField>

                    <TextField
                        label={isAjuste ? "Nova Quantidade Total" : "Quantidade a Movimentar"}
                        type="number"
                        fullWidth
                        size="small"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        InputProps={{
                            endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{lote.unidade_medida}</Typography>
                        }}
                    />

                    <TextField
                        label="Motivo / Justificativa"
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder={
                            isAjuste ? "Ex: Contagem de inventário" :
                                tipo === 'DESCARTADO' ? "Qual o motivo do descarte da mercadoria?" :
                                    tipo === 'ENTRADA' ? "Qual a justificativa desta entrada manual?" :
                                        "Ex: Ordem de produção nº 10"
                        }
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSalvar}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {loading ? 'Salvando...' : 'Confirmar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
