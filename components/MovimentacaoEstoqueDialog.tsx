import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Typography, Box, Alert,
    CircularProgress, ListSubheader, ToggleButtonGroup, ToggleButton,
    Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemButton, ListItemText, ListItemIcon,
    InputAdornment, Chip
} from '@mui/material';
import { ChevronDown, MapPin, ChefHat, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';

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

export const formatarQuantidade = (qtdGml: number) => {
    if (!qtdGml && qtdGml !== 0) return '0 g/ml';
    if (qtdGml >= 1000) {
        return `${(qtdGml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg/L`;
    }
    return `${qtdGml.toLocaleString('pt-BR')} g/ml`;
};

export default function MovimentacaoEstoqueDialog({ open, onClose, lote, onSuccess }: Props) {
    const { activeClientId } = useClient();
    const [tipo, setTipo] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [modoMovimentacao, setModoMovimentacao] = useState<'PESO' | 'EMBALAGEM'>('PESO');
    const [unidadePeso, setUnidadePeso] = useState<'G_ML' | 'KG_L'>('G_ML');

    const [setores, setSetores] = useState<SetorProducao[]>([]);
    const [locais, setLocais] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const totalReservadoG = Number(lote?.total_reservado_g) || 0;
    const disponivelGml = Math.max(0, (lote?.quantidade_atual_g_ml || 0) - totalReservadoG);

    // Cálculo de embalagens disponíveis
    const fatorBaseEmb = (lote?.unidade_peso_embalagem === 'KG' || lote?.unidade_peso_embalagem === 'L') ? 1000 : 1;
    const pesoUmaEmbalagemGml = (lote?.peso_unitario_embalagem || 0) * fatorBaseEmb;
    const disponivelEmbalagens = pesoUmaEmbalagemGml > 0 ? Math.floor(disponivelGml / pesoUmaEmbalagemGml) : 0;

    useEffect(() => {
        if (open) {
            setTipo('');
            setQuantidade('');
            setError('');

            // Definir default unit check based on current size
            if (lote && lote.quantidade_atual_g_ml >= 1000) {
                setUnidadePeso('KG_L');
            } else {
                setUnidadePeso('G_ML');
            }

            if (lote?.peso_unitario_embalagem && lote?.qtd_embalagens) {
                setModoMovimentacao('EMBALAGEM'); // Suggest packaging if available
            } else {
                setModoMovimentacao('PESO');
            }

            if (activeClientId) fetchSetores(activeClientId);
            if (lote?.unidade_id) fetchLocais(lote?.unidade_id);
        }
    }, [open, lote, activeClientId]);

    const fetchLocais = async (unidadeId: string) => {
        const { data } = await (supabase as any).from('cliente_locais_estoque')
            .select('id, nome')
            .eq('unidade_id', unidadeId)
            .order('nome');
        if (data) setLocais(data);
    };

    const fetchSetores = async (clienteId: string) => {
        const { data } = await (supabase as any).from('cliente_setores_producao')
            .select('id, nome')
            .eq('cliente_id', clienteId)
            .order('nome');
        if (data) setSetores(data);
    };

    if (!lote) return null;

    const handleSalvar = async () => {
        if (!tipo) {
            setError('Selecione um local, setor ou descarte de destino.');
            return;
        }

        if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
            setError('Informe uma quantidade válida e maior que zero.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const inputVal = Number(quantidade);
            let qtdGmlParaAbater = 0;
            let embalagensParaAbater = 0;

            const totalReservadoG = Number(lote.total_reservado_g) || 0;
            const disponivelGml = lote.quantidade_atual_g_ml - totalReservadoG;

            if (modoMovimentacao === 'EMBALAGEM') {
                if (!lote.peso_unitario_embalagem || !lote.unidade_peso_embalagem) {
                    throw new Error('Este lote não possui peso de embalagem configurado para movimentar por embalagem.');
                }
                const fatorBase = (lote.unidade_peso_embalagem === 'KG' || lote.unidade_peso_embalagem === 'L') ? 1000 : 1;
                const pesoDeUmaEmbalagemEmGml = lote.peso_unitario_embalagem * fatorBase;

                qtdGmlParaAbater = inputVal * pesoDeUmaEmbalagemEmGml;
                embalagensParaAbater = inputVal;

                // Validação de número de embalagens físicas (considerando reservas por peso)
                if (inputVal > disponivelEmbalagens) {
                    throw new Error(`A quantidade informada (${inputVal}) é maior que o total de embalagens disponíveis (${disponivelEmbalagens}), considerando as reservas para produção.`);
                }
            } else {
                // Modo Peso
                qtdGmlParaAbater = unidadePeso === 'KG_L' ? inputVal * 1000 : inputVal;
            }

            // Validação de saldo considerando reservas
            if (qtdGmlParaAbater > (disponivelGml + 0.1)) { // 0.1 de tolerância para dizimas
                const msg = modoMovimentacao === 'EMBALAGEM' 
                    ? `Saldo insuficiente. Disponível para movimentar: ${disponivelEmbalagens} embalagens.`
                    : `Saldo insuficiente. Disponível para movimentar: ${formatarQuantidade(disponivelGml)}. O restante está reservado para produção.`;
                throw new Error(msg);
            }

            let novaQuantidadeGml = Math.max(0, lote.quantidade_atual_g_ml - qtdGmlParaAbater);
            let novaQtdEmbalagens = lote.qtd_embalagens !== null && lote.qtd_embalagens !== undefined ? Math.max(0, lote.qtd_embalagens - embalagensParaAbater) : null;

            const isTransferencia = tipo.startsWith('TRANSFERENCIA_');
            const isSetor = tipo.startsWith('SETOR_');
            const isDescartado = tipo === 'DESCARTADO';

            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;

            const nomeDestino = isSetor
                ? setores.find(s => `SETOR_${s.id}` === tipo)?.nome || ''
                : isTransferencia
                    ? locais.find(l => `TRANSFERENCIA_${l.id}` === tipo)?.nome || ''
                    : '';

            // 1. Atualizar o lote atual (sempre retira, pois a Transferência move virtualmente)
            const updatePayload: any = {
                quantidade_atual_g_ml: novaQuantidadeGml
            };
            if (novaQtdEmbalagens !== null && modoMovimentacao === 'EMBALAGEM') {
                updatePayload.qtd_embalagens = novaQtdEmbalagens;
            }

            const isTransferenciaTotal = isTransferencia && novaQuantidadeGml <= 0;
            const destinoLocalId = isTransferencia ? locais.find(l => `TRANSFERENCIA_${l.id}` === tipo)?.id : null;

            let mergedLot = false;

            if (isTransferencia && destinoLocalId) {
                // Tenta encontrar um lote identico no destino
                const { data: lotesSimilares, error: errBusca } = await (supabase as any).from('lotes_estoque')
                    .select('*')
                    .eq('unidade_id', lote.unidade_id)
                    .eq('ingrediente_id', lote.ingrediente_id)
                    .eq('fornecedor_id', lote.fornecedor_id)
                    .eq('numero_lote_fabricante', lote.numero_lote_fabricante)
                    .eq('data_validade_rotulo', lote.data_validade_rotulo)
                    .eq('local_estoque_id', destinoLocalId)
                    .limit(1);

                if (errBusca) throw errBusca;

                if (lotesSimilares && lotesSimilares.length > 0) {
                    mergedLot = true;
                    const loteExistente: any = lotesSimilares[0];

                    // Adiciona as quantidades ao lote existente no destino
                    const updateDestinoPayload: any = {
                        quantidade_atual_g_ml: loteExistente.quantidade_atual_g_ml + qtdGmlParaAbater
                    };

                    if (modoMovimentacao === 'EMBALAGEM' && loteExistente.qtd_embalagens !== null && loteExistente.qtd_embalagens !== undefined) {
                        updateDestinoPayload.qtd_embalagens = loteExistente.qtd_embalagens + embalagensParaAbater;
                    }

                    const { error: erroUpdateDestino } = await (supabase as any).from('lotes_estoque')
                        .update(updateDestinoPayload)
                        .eq('id', loteExistente.id);

                    if (erroUpdateDestino) throw erroUpdateDestino;

                    const updateOrigem: any = {
                        quantidade_atual_g_ml: novaQuantidadeGml
                    };

                    if (novaQtdEmbalagens !== null && modoMovimentacao === 'EMBALAGEM') {
                        updateOrigem.qtd_embalagens = novaQtdEmbalagens;
                    }
                    if (novaQuantidadeGml <= 0) {
                        updateOrigem.deleted_at = new Date().toISOString();
                    }

                    // Retira do lote de origem
                    const { error: erroLoteOrigem } = await (supabase as any).from('lotes_estoque')
                        .update(updateOrigem)
                        .eq('id', lote.id);

                    if (erroLoteOrigem) throw erroLoteOrigem;
                }
            }

            if (!mergedLot) {
                if (isTransferenciaTotal) {
                    // Transferência total (muda o endereço do lote atual)
                    updatePayload.local_estoque_id = destinoLocalId || null;
                    // Reverte zeramento pois o lote movido por inteiro ainda existe lá
                    updatePayload.quantidade_atual_g_ml = lote.quantidade_atual_g_ml;
                    if (novaQtdEmbalagens !== null) {
                        updatePayload.qtd_embalagens = lote.qtd_embalagens;
                    }

                    const { error: erroLote } = await (supabase as any).from('lotes_estoque')
                        .update(updatePayload)
                        .eq('id', lote.id);
                    if (erroLote) throw erroLote;

                } else {
                    // Não é transferência total, então primeiro atualizamos (subtraímos) do lote base
                    const { error: erroLote } = await (supabase as any).from('lotes_estoque')
                        .update(updatePayload)
                        .eq('id', lote.id);
                    if (erroLote) throw erroLote;

                    // Se for transferência PARCIAL, criamos um novo lote-filho no destino!
                    if (isTransferencia && destinoLocalId) {
                        const novoLotePayload = {
                            unidade_id: lote.unidade_id,
                            ingrediente_id: lote.ingrediente_id,
                            fornecedor_id: lote.fornecedor_id,
                            numero_lote_fabricante: lote.numero_lote_fabricante,
                            data_fabricacao: lote.data_fabricacao,
                            data_validade_interna: lote.data_validade_interna,
                            data_validade_rotulo: lote.data_validade_rotulo,
                            local_estoque_id: destinoLocalId,
                            quantidade_inicial_g_ml: qtdGmlParaAbater,
                            quantidade_atual_g_ml: qtdGmlParaAbater,
                            status: lote.status,
                            nota_fiscal: lote.nota_fiscal,
                            temperatura_recebimento: lote.temperatura_recebimento,
                            categoria_produto: lote.categoria_produto,
                            peso_unitario_embalagem: lote.peso_unitario_embalagem,
                            unidade_peso_embalagem: lote.unidade_peso_embalagem,
                            qtd_embalagens: modoMovimentacao === 'EMBALAGEM' ? embalagensParaAbater : null
                        };

                        const { error: errorNovoLote } = await (supabase as any).from('lotes_estoque')
                            .insert(novoLotePayload);

                        if (errorNovoLote) throw errorNovoLote;
                    }
                }
            }

            // 2. Registrar no histórico
            let justificativaFinal = '';
            let tipoHistorico = 'SAIDA';

            if (isSetor) justificativaFinal = `Enviado para Produção: ${nomeDestino}`;
            else if (isTransferencia) {
                justificativaFinal = `Transferido para: ${nomeDestino}`;
                if (novaQuantidadeGml <= 0) tipoHistorico = 'TRANSFERENCIA';
            }
            else if (isDescartado) justificativaFinal = `DESCARTADO`;

            // Resumo de movimentacao para salvar:
            if (modoMovimentacao === 'EMBALAGEM') {
                justificativaFinal += ` (${inputVal} embalagens movidas)`;
            } else {
                justificativaFinal += ` (${formatarQuantidade(qtdGmlParaAbater)} movidos)`;
            }

            const { error: erroHist } = await (supabase as any)
                .from('estoque_movimentacoes')
                .insert({
                    lote_id: lote.id,
                    tipo_movimento: tipoHistorico,
                    quantidade_movimentada: qtdGmlParaAbater,
                    quantidade_nova: isTransferenciaTotal ? lote.quantidade_atual_g_ml : novaQuantidadeGml,
                    data_movimento: new Date().toISOString(),
                    justificativa: justificativaFinal,
                    responsavel_id: user?.id
                });

            if (erroHist) throw erroHist;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('ERRO AO SALVAR MOVIMENTAÇÃO:', err);
            setError(err.message || 'Erro ao registrar movimentação.');
        } finally {
            setLoading(false);
        }
    };

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
                            Lote: {lote.numero_lote_fabricante || 'N/A'}
                        </Typography>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="primary.main" fontWeight="bold">
                                Total: {formatarQuantidade(lote.quantidade_atual_g_ml)}
                            </Typography>
                            {Number(lote.total_reservado_g) > 0 && (
                                <Typography variant="caption" color="warning.dark" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Reservado: {formatarQuantidade(lote.total_reservado_g)}
                                </Typography>
                            )}
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                                Disponível: {formatarQuantidade(disponivelGml)}
                            </Typography>
                            {modoMovimentacao === 'EMBALAGEM' && lote.peso_unitario_embalagem && (
                                <Chip 
                                    size="small" 
                                    label={`${disponivelEmbalagens} livr${disponivelEmbalagens === 1 ? 'e' : 'es'}`} 
                                    color="success" 
                                    variant="outlined" 
                                    sx={{ mt: 0.5, fontWeight: 'bold' }}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* TIPO DE DESTINO (Setor, Local, Descarte) */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Destino da Movimentação
                        </Typography>

                        <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MapPin size={18} />
                                    <Typography fontWeight="bold">Transferir para Outro Estoque</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <List disablePadding>
                                    {locais.filter(l => l.nome !== lote?.local_armazenamento).map(local => {
                                        const selected = tipo === `TRANSFERENCIA_${local.id}`;
                                        return (
                                            <ListItem disablePadding key={`local_${local.id}`}>
                                                <ListItemButton onClick={() => setTipo(`TRANSFERENCIA_${local.id}`)} selected={selected}>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        {selected ? <CheckCircle2 size={18} color="green" /> : <Box sx={{ width: 18 }} />}
                                                    </ListItemIcon>
                                                    <ListItemText primary={local.nome} />
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                    {locais.filter(l => l.nome !== lote?.local_armazenamento).length === 0 && (
                                        <ListItem><ListItemText primary="Nenhum outro local disponível" secondary="Cadastre novos locais nas configurações." /></ListItem>
                                    )}
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderTop: 'none', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ChefHat size={18} />
                                    <Typography fontWeight="bold">Enviar para Produção (Setores)</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <List disablePadding>
                                    {setores.map(setor => {
                                        const selected = tipo === `SETOR_${setor.id}`;
                                        return (
                                            <ListItem disablePadding key={`setor_${setor.id}`}>
                                                <ListItemButton onClick={() => setTipo(`SETOR_${setor.id}`)} selected={selected}>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        {selected ? <CheckCircle2 size={18} color="green" /> : <Box sx={{ width: 18 }} />}
                                                    </ListItemIcon>
                                                    <ListItemText primary={setor.nome} />
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                    {setores.length === 0 && (
                                        <ListItem><ListItemText primary="Nenhum setor de produção" secondary="Cadastre setores nas configurações." /></ListItem>
                                    )}
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderTop: 'none', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Trash2 size={18} color="red" />
                                    <Typography fontWeight="bold" color="error">Descarte / Perda</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <List disablePadding>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => setTipo('DESCARTADO')} selected={tipo === 'DESCARTADO'}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {tipo === 'DESCARTADO' ? <CheckCircle2 size={18} color="green" /> : <Box sx={{ width: 18 }} />}
                                            </ListItemIcon>
                                            <ListItemText primary="Registrar Descarte" secondary="Vencimento, avaria ou contaminação" />
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    {/* SELEÇÃO DO MODO (PESO OU EMBALAGEM) */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Como deseja movimentar?
                        </Typography>
                        <ToggleButtonGroup
                            value={modoMovimentacao}
                            exclusive
                            onChange={(e, value) => {
                                if (value) setModoMovimentacao(value);
                            }}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="PESO">Por Peso / Volume</ToggleButton>
                            <ToggleButton
                                value="EMBALAGEM"
                                disabled={!lote.peso_unitario_embalagem}
                            >
                                Por Embalagem
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {!lote.peso_unitario_embalagem && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                                A movimentação por embalagem não está disponível pois o peso da embalagem não foi cadastrado.
                            </Typography>
                        )}
                    </Box>

                    {/* INPUT DA QUANTIDADE E UNIDADE */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label={modoMovimentacao === 'EMBALAGEM' ? "Qtd de Embalagens" : "Quantidade a Movimentar"}
                            type="number"
                            fullWidth
                            size="small"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            helperText={modoMovimentacao === 'EMBALAGEM' 
                                ? `Máximo: ${disponivelEmbalagens} emb.` 
                                : `Máximo: ${unidadePeso === 'KG_L' ? (disponivelGml / 1000).toLocaleString('pt-BR') : disponivelGml.toLocaleString('pt-BR')} ${unidadePeso === 'KG_L' ? 'Kg/L' : 'g/ml'}`
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Button 
                                            size="small" 
                                            onClick={() => {
                                                if (modoMovimentacao === 'EMBALAGEM') {
                                                    setQuantidade(disponivelEmbalagens.toString());
                                                } else {
                                                    const val = unidadePeso === 'KG_L' ? disponivelGml / 1000 : disponivelGml;
                                                    setQuantidade(val.toString());
                                                }
                                            }}
                                            sx={{ minWidth: 'auto', p: '2px 4px' }}
                                        >
                                            Máx
                                        </Button>
                                    </InputAdornment>
                                )
                            }}
                        />
                        {modoMovimentacao === 'PESO' ? (
                            <TextField
                                select
                                size="small"
                                sx={{ width: 140 }}
                                value={unidadePeso}
                                onChange={(e) => setUnidadePeso(e.target.value as any)}
                            >
                                <MenuItem value="G_ML">g / ml</MenuItem>
                                <MenuItem value="KG_L">Kg / L</MenuItem>
                            </TextField>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', width: 120, justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">Unidades</Typography>
                            </Box>
                        )}
                    </Box>
                    {modoMovimentacao === 'EMBALAGEM' && lote.peso_unitario_embalagem && quantidade && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                            Isso Equivale a: {formatarQuantidade(Number(quantidade) * lote.peso_unitario_embalagem * (lote.unidade_peso_embalagem === 'KG' || lote.unidade_peso_embalagem === 'L' ? 1000 : 1))}
                        </Typography>
                    )}
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
                    disabled={loading || !tipo || !quantidade}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {loading ? 'Processando...' : 'Confirmar Movimentação'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}



