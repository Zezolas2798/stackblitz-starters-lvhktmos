'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
  Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  MenuItem, IconButton, Alert, LinearProgress, Divider,
  useTheme, alpha, Stepper, Step, StepLabel, Tooltip
} from '@mui/material';
import {
  ClipboardCheck, QrCode, Camera, CheckCircle, XCircle, AlertTriangle,
  Play, StopCircle, Package, Search, Hash, RefreshCw, Save, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  onFinished?: () => void;
}

const STEPS = ['Configuração', 'Contagem', 'Resultado'];

export default function InventarioDialog({ open, onClose, onFinished }: Props) {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();

  // Wizard
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Config
  const [locais, setLocais] = useState<any[]>([]);
  const [selectedLocal, setSelectedLocal] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2: Counting
  const [inventarioId, setInventarioId] = useState<string | null>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [buscaItem, setBuscaItem] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  // Step 3: Results
  const [resultados, setResultados] = useState<{ ok: number; divergente: number; naoEncontrado: number }>({ ok: 0, divergente: 0, naoEncontrado: 0 });
  const [ajustando, setAjustando] = useState(false);

  // Load storage locations
  useEffect(() => {
    if (open && unidadeId) {
      loadLocais();
      // Reset state
      setActiveStep(0);
      setSelectedLocal('');
      setInventarioId(null);
      setItens([]);
      setScannerActive(false);
      setScanResult(null);
    }
  }, [open, unidadeId]);

  async function loadLocais() {
    const { data } = await (supabase as any)
      .from('estoque_locais')
      .select('id, nome')
      .eq('unidade_id', unidadeId)
      .eq('ativo', true)
      .order('nome');
    setLocais(data || []);
  }

  // Step 1 → Step 2: Create inventory session
  async function handleIniciarInventario() {
    if (!selectedLocal || !unidadeId || !activeClientId) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const userName = userData.user?.user_metadata?.full_name || userData.user?.email || 'Sistema';

      // 1. Create session
      const { data: inv, error: invErr } = await (supabase as any)
        .from('estoque_inventarios')
        .insert({
          unidade_id: unidadeId,
          cliente_id: activeClientId,
          local_estoque_id: selectedLocal,
          responsavel_id: userId,
          responsavel_nome: userName,
          status: 'ABERTO'
        })
        .select('id')
        .single();

      if (invErr) throw invErr;
      setInventarioId(inv.id);

      // 2. Load all lots in this location
      const { data: lotesData, error: lotesErr } = await (supabase as any)
        .from('estoque_lotes')
        .select('id, numero_lote_fabricante, quantidade_atual_g_ml, unidade_peso_embalagem, ingredientes(nome), materiais(nome)')
        .eq('unidade_id', unidadeId)
        .eq('local_estoque_id', selectedLocal)
        .gt('quantidade_atual_g_ml', 0)
        .neq('status', 'REJEITADO')
        .neq('status', 'PREVISTO')
        .is('deleted_at', null)
        .order('ingredientes(nome)', { ascending: true });

      if (lotesErr) throw lotesErr;

      const lotesComItem = (lotesData || []).map((lote: any) => ({
        lote_id: lote.id,
        lote_fabricante: lote.numero_lote_fabricante,
        nome: lote.ingredientes?.nome || lote.materiais?.nome || 'Desconhecido',
        qtd_esperada_g: Number(lote.quantidade_atual_g_ml),
        qtd_conferida_g: 0,
        conferido: false,
        metodo: 'MANUAL' as const,
        unidade: lote.unidade_peso_embalagem
      }));

      // 3. Insert items into DB
      if (lotesComItem.length > 0) {
        const payload = lotesComItem.map((item: any) => ({
          inventario_id: inv.id,
          lote_id: item.lote_id,
          qtd_esperada_g: item.qtd_esperada_g
        }));
        const { error: itensErr } = await (supabase as any)
          .from('estoque_inventario_itens')
          .insert(payload);
        if (itensErr) throw itensErr;
      }

      // Update session totals
      await (supabase as any)
        .from('estoque_inventarios')
        .update({ total_esperado: lotesComItem.length })
        .eq('id', inv.id);

      setItens(lotesComItem);
      setActiveStep(1);
    } catch (err: any) {
      console.error('Erro ao iniciar inventário:', err);
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Format quantity
  const fmtQtd = (g: number, un?: string) => {
    if (un === 'UN') return `${Math.round(g)} Un`;
    if (g >= 1000) return `${(g / 1000).toFixed(2)} Kg`;
    return `${g.toFixed(0)} g`;
  };

  // Mark item as checked (manual)
  function handleConferirManual(index: number, qtdConferida: number) {
    setItens(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, qtd_conferida_g: qtdConferida, conferido: true, metodo: 'MANUAL' };
    }));
  }

  // Mark item present (same qty)
  function handleMarcarPresente(index: number) {
    setItens(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, qtd_conferida_g: item.qtd_esperada_g, conferido: true, metodo: 'MANUAL' };
    }));
  }

  // QR Code scanning
  async function handleStartScanner() {
    setScannerActive(true);
    setScanResult(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Small delay to ensure the container is mounted
      await new Promise(r => setTimeout(r, 300));
      
      const scanner = new Html5Qrcode('qr-reader-inventory');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          handleQrScanned(decodedText);
          scanner.stop().catch(() => {});
          setScannerActive(false);
        },
        () => {} // ignore errors
      );
    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err);
      setScannerActive(false);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }

  function handleStopScanner() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    setScannerActive(false);
  }

  function handleQrScanned(text: string) {
    // Parse QR Format: ID:{uuid}|L:{lote}
    const idMatch = text.match(/ID:([a-f0-9-]+)/i);
    if (idMatch) {
      const loteUuid = idMatch[1];
      const idx = itens.findIndex(item => item.lote_id === loteUuid);
      if (idx >= 0) {
        handleMarcarPresente(idx);
        setScanResult(`✅ ${itens[idx].nome} — Lote ${itens[idx].lote_fabricante} conferido!`);
      } else {
        setScanResult(`⚠️ Lote ${loteUuid.substring(0, 8)}... não pertence a este local de estoque.`);
      }
    } else {
      // Try matching by lote number
      const idx = itens.findIndex(item =>
        item.lote_fabricante && text.includes(item.lote_fabricante)
      );
      if (idx >= 0) {
        handleMarcarPresente(idx);
        setScanResult(`✅ ${itens[idx].nome} — Lote ${itens[idx].lote_fabricante} conferido!`);
      } else {
        setScanResult(`❌ Código "${text.substring(0, 30)}" não reconhecido neste inventário.`);
      }
    }
  }

  // Manual QR input (for barcode scanners or manual entry)
  function handleManualQrInput(code: string) {
    if (!code.trim()) return;
    handleQrScanned(code.trim());
  }

  // Step 2 → Step 3: Finish counting
  async function handleFinalizarContagem() {
    if (!inventarioId) return;
    setLoading(true);

    try {
      const totalConferido = itens.filter(i => i.conferido).length;
      const naoEncontrado = itens.filter(i => !i.conferido).length;
      const divergentes = itens.filter(i => i.conferido && Math.abs(i.qtd_conferida_g - i.qtd_esperada_g) > 0.5).length;
      const ok = totalConferido - divergentes;

      // Update each item in DB
      for (const item of itens) {
        const divergencia = item.conferido ? (item.qtd_conferida_g - item.qtd_esperada_g) : -item.qtd_esperada_g;
        await (supabase as any)
          .from('estoque_inventario_itens')
          .update({
            qtd_conferida_g: item.qtd_conferida_g,
            conferido: item.conferido,
            metodo: item.metodo,
            divergencia_g: divergencia,
            conferido_em: item.conferido ? new Date().toISOString() : null
          })
          .eq('inventario_id', inventarioId)
          .eq('lote_id', item.lote_id);
      }

      // Update session
      await (supabase as any)
        .from('estoque_inventarios')
        .update({
          total_conferido: totalConferido,
          total_divergencias: divergentes + naoEncontrado,
          status: 'FINALIZADO',
          data_fim: new Date().toISOString()
        })
        .eq('id', inventarioId);

      setResultados({ ok, divergente: divergentes, naoEncontrado });
      setActiveStep(2);
    } catch (err: any) {
      console.error('Erro ao finalizar:', err);
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Apply stock adjustments
  async function handleAplicarAjustes() {
    if (!inventarioId) return;
    setAjustando(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      for (const item of itens) {
        if (!item.conferido) {
          // Item not found → could mean lost, but don't zero out automatically
          // Just log as "not found" in the inventory
          continue;
        }

        const diff = item.qtd_conferida_g - item.qtd_esperada_g;
        if (Math.abs(diff) < 0.5) continue; // No significant difference

        // Update the lot quantity
        await (supabase as any)
          .from('estoque_lotes')
          .update({ quantidade_atual_g_ml: item.qtd_conferida_g })
          .eq('id', item.lote_id);

        // Record a movement
        await (supabase as any)
          .from('estoque_movimentacoes')
          .insert({
            lote_id: item.lote_id,
            tipo_movimento: diff > 0 ? 'ENTRADA' : 'SAIDA',
            quantidade_movimentada: Math.abs(diff),
            quantidade_nova: item.qtd_conferida_g,
            data_movimento: new Date().toISOString(),
            justificativa: `Ajuste de Inventário #${inventarioId.substring(0, 8)} — Divergência: ${diff > 0 ? '+' : ''}${fmtQtd(diff, item.unidade)}`,
            responsavel_id: userId
          });

        // Mark adjustment as applied
        await (supabase as any)
          .from('estoque_inventario_itens')
          .update({ ajuste_aplicado: true })
          .eq('inventario_id', inventarioId)
          .eq('lote_id', item.lote_id);
      }

      alert('Ajustes aplicados com sucesso! O estoque foi atualizado.');
      if (onFinished) onFinished();
    } catch (err: any) {
      console.error('Erro ao aplicar ajustes:', err);
      alert('Erro: ' + err.message);
    } finally {
      setAjustando(false);
    }
  }

  const conferidos = itens.filter(i => i.conferido).length;
  const progresso = itens.length > 0 ? (conferidos / itens.length) * 100 : 0;

  const itensFiltrados = itens.filter(item => {
    if (!buscaItem) return true;
    const termo = buscaItem.toLowerCase();
    return item.nome.toLowerCase().includes(termo) ||
      (item.lote_fabricante || '').toLowerCase().includes(termo);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '70vh' } }}>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
        <ClipboardCheck size={22} />
        Inventário de Estoque
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Stepper */}
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map(label => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Box>

        {/* STEP 0: Configuration */}
        {activeStep === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Configurar Nova Sessão de Inventário
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Selecione o local de estoque onde será realizada a contagem física.
              O sistema carregará todos os lotes presentes nesse local para conferência.
            </Typography>

            <TextField
              select
              fullWidth
              label="Local de Estoque"
              value={selectedLocal}
              onChange={e => setSelectedLocal(e.target.value)}
              sx={{ mb: 3 }}
            >
              {locais.map(l => (
                <MenuItem key={l.id} value={l.id}>{l.nome}</MenuItem>
              ))}
            </TextField>

            {selectedLocal && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Ao iniciar, o sistema listará todos os lotes ativos neste local para conferência manual ou via QR Code.
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Play size={18} />}
              onClick={handleIniciarInventario}
              disabled={!selectedLocal || loading}
              size="large"
              fullWidth
              sx={{ mt: 1 }}
            >
              {loading ? 'Carregando Lotes...' : 'Iniciar Inventário'}
            </Button>
          </Box>
        )}

        {/* STEP 1: Counting */}
        {activeStep === 1 && (
          <Box sx={{ p: 0 }}>
            {/* Progress Bar */}
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Progresso: {conferidos} / {itens.length} itens conferidos
                </Typography>
                <Chip
                  label={`${progresso.toFixed(0)}%`}
                  size="small"
                  color={progresso === 100 ? 'success' : 'primary'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={progresso}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Scanner + Search Bar */}
            <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar produto ou digitar código do lote..."
                value={buscaItem}
                onChange={e => setBuscaItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && buscaItem) {
                    handleManualQrInput(buscaItem);
                  }
                }}
                InputProps={{
                  startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />
                }}
              />
              <Tooltip title={scannerActive ? 'Parar Câmera' : 'Abrir Câmera QR'}>
                <Button
                  variant={scannerActive ? 'contained' : 'outlined'}
                  color={scannerActive ? 'error' : 'primary'}
                  onClick={scannerActive ? handleStopScanner : handleStartScanner}
                  sx={{ minWidth: 48, px: 1 }}
                >
                  {scannerActive ? <StopCircle size={20} /> : <Camera size={20} />}
                </Button>
              </Tooltip>
            </Box>

            {/* QR Scanner Area */}
            {scannerActive && (
              <Box sx={{ p: 2, bgcolor: 'black', textAlign: 'center' }}>
                <div id="qr-reader-inventory" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} />
              </Box>
            )}

            {/* Scan Result */}
            {scanResult && (
              <Alert
                severity={scanResult.startsWith('✅') ? 'success' : scanResult.startsWith('⚠') ? 'warning' : 'error'}
                sx={{ mx: 2, mt: 1 }}
                onClose={() => setScanResult(null)}
              >
                {scanResult}
              </Alert>
            )}

            {/* Items Table */}
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: 40 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Esperado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Conferido</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 150 }} align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itensFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Package size={32} style={{ opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">Nenhum item encontrado neste local.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    itensFiltrados.map((item, idx) => {
                      const realIdx = itens.findIndex(i => i.lote_id === item.lote_id);
                      const hasDiff = item.conferido && Math.abs(item.qtd_conferida_g - item.qtd_esperada_g) > 0.5;
                      return (
                        <TableRow
                          key={item.lote_id}
                          sx={{
                            bgcolor: item.conferido
                              ? (hasDiff ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.06))
                              : 'transparent',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                          }}
                        >
                          <TableCell>
                            {item.conferido ? (
                              hasDiff
                                ? <AlertTriangle size={18} color={theme.palette.warning.main} />
                                : <CheckCircle size={18} color={theme.palette.success.main} />
                            ) : (
                              <XCircle size={18} color={theme.palette.grey[400]} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">{item.nome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Lote: {item.lote_fabricante || 'N/A'}
                              {item.metodo === 'QR_CODE' && item.conferido && (
                                <Chip label="QR" size="small" color="info" sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{fmtQtd(item.qtd_esperada_g, item.unidade)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.conferido ? (
                              <TextField
                                size="small"
                                type="number"
                                value={item.qtd_conferida_g}
                                onChange={e => handleConferirManual(realIdx, parseFloat(e.target.value) || 0)}
                                sx={{ width: 100 }}
                                InputProps={{
                                  sx: { fontSize: '0.85rem' },
                                  endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{item.unidade === 'UN' ? 'Un' : 'g'}</Typography>
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {!item.conferido ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleMarcarPresente(realIdx)}
                                startIcon={<CheckCircle size={14} />}
                                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                              >
                                Presente
                              </Button>
                            ) : (
                              <Chip
                                label="Conferido"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* STEP 2: Results */}
        {activeStep === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Resultado do Inventário
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Conferência finalizada em {format(new Date(), 'dd/MM/yyyy HH:mm')}.
            </Typography>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.08), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.3), borderRadius: 2 }}>
                <CheckCircle size={28} color={theme.palette.success.main} />
                <Typography variant="h4" fontWeight="bold" color="success.main">{resultados.ok}</Typography>
                <Typography variant="caption" color="text.secondary">Conforme</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.08), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.3), borderRadius: 2 }}>
                <AlertTriangle size={28} color={theme.palette.warning.main} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">{resultados.divergente}</Typography>
                <Typography variant="caption" color="text.secondary">Divergentes</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.08), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.3), borderRadius: 2 }}>
                <XCircle size={28} color={theme.palette.error.main} />
                <Typography variant="h4" fontWeight="bold" color="error.main">{resultados.naoEncontrado}</Typography>
                <Typography variant="caption" color="text.secondary">Não Encontrados</Typography>
              </Paper>
            </Box>

            {/* Divergence Details */}
            {(resultados.divergente > 0 || resultados.naoEncontrado > 0) && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Detalhamento de Divergências
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Esperado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Conferido</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Diferença</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens
                      .filter(i => !i.conferido || Math.abs(i.qtd_conferida_g - i.qtd_esperada_g) > 0.5)
                      .map(item => {
                        const diff = item.conferido ? (item.qtd_conferida_g - item.qtd_esperada_g) : -item.qtd_esperada_g;
                        return (
                          <TableRow key={item.lote_id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {!item.conferido
                                  ? <XCircle size={14} color={theme.palette.error.main} />
                                  : <AlertTriangle size={14} color={theme.palette.warning.main} />
                                }
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">{item.nome}</Typography>
                                  <Typography variant="caption" color="text.secondary">Lote: {item.lote_fabricante}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{fmtQtd(item.qtd_esperada_g, item.unidade)}</TableCell>
                            <TableCell align="right">
                              {item.conferido ? fmtQtd(item.qtd_conferida_g, item.unidade) : '—'}
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={diff < 0 ? 'error.main' : 'success.main'}
                              >
                                {diff >= 0 ? '+' : ''}{fmtQtd(diff, item.unidade)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>

                <Button
                  variant="contained"
                  color="warning"
                  startIcon={ajustando ? <CircularProgress size={18} color="inherit" /> : <RefreshCw size={18} />}
                  onClick={handleAplicarAjustes}
                  disabled={ajustando}
                  fullWidth
                  size="large"
                >
                  {ajustando ? 'Aplicando Ajustes...' : 'Aplicar Ajustes no Estoque'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Isso atualizará as quantidades no banco de dados e registrará movimentações de ajuste.
                </Typography>
              </>
            )}

            {resultados.divergente === 0 && resultados.naoEncontrado === 0 && (
              <Alert severity="success" sx={{ fontSize: '1rem' }}>
                🎉 Inventário 100% conforme! Todos os itens foram encontrados nas quantidades esperadas.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          {activeStep === 2 ? 'Fechar' : 'Cancelar'}
        </Button>

        {activeStep === 1 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={handleFinalizarContagem}
            disabled={loading}
          >
            {loading ? 'Finalizando...' : `Finalizar Contagem (${conferidos}/${itens.length})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

