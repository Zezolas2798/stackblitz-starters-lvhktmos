// components/ScannerBarcodeDialog.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Alert,
  Stack,
  Divider,
  Paper,
  Chip,
  Grid
} from '@mui/material';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Search, 
  Barcode as BarcodeIcon, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { mapOFFToIngrediente, OFFProductResponse } from '@/lib/offApi';
import { fetchProductServer } from '@/lib/offActions';
import { Ingrediente } from '@/lib/types';

interface ScannerBarcodeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: Partial<Ingrediente>, raw: any) => void;
}

export default function ScannerBarcodeDialog({ open, onClose, onConfirm }: ScannerBarcodeDialogProps) {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<any | null>(null);
  const [mappedResult, setMappedResult] = useState<any | null>(null);
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qrcode-region";

  // Carregar lista de câmeras ao abrir
  useEffect(() => {
    if (open) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          // Seleciona a última câmera (geralmente a traseira em celulares) por padrão
          setSelectedCamera(devices[devices.length - 1].id);
        }
      }).catch(err => console.error("Erro ao listar câmeras", err));
    }
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [open]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setProductPreview(null);
      
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera ou você está em uma conexão não segura (HTTP).");
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr: any) {
        console.error("Erro de permissão:", permErr);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error("Acesso negado. Por favor, permita o acesso à câmera nas configurações do seu navegador.");
        }
        throw new Error("Não foi possível acessar a câmera. Verifique se ela está sendo usada por outro aplicativo.");
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 20,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.0
      };

      const cameraConfig = selectedCamera ? selectedCamera : { facingMode: "user" };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          setBarcode(decodedText);
          stopScanner();
          handleSearch(decodedText);
        },
        () => {} 
      );
    } catch (err: any) {
      console.error("Erro no scanner:", err);
      let msg = err.message || "Erro desconhecido ao acessar a câmera.";
      
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        msg = "O acesso à câmera requer HTTPS. No seu notebook, use 'http://localhost:3000' em vez de um endereço de IP.";
      }

      setError(msg);
      setIsScanning(false);
      if (scannerRef.current) {
        try { 
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear(); 
        } catch(e) {}
        scannerRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
  };

  const handleSearch = async (codeToSearch?: string) => {
    const code = codeToSearch || barcode;
    if (!code) return;

    setLoading(true);
    setError(null);
    setProductPreview(null);

    try {
      const result = await fetchProductServer(code);
      if (result.success && result.data && result.data.status === 1) {
        setProductPreview(result.data);
        setMappedResult(mapOFFToIngrediente(result.data));
      } else if (result.success && result.data && result.data.status === 0) {
        setError(`Produto não encontrado (Código: ${code}). Verifique se o código está correto ou cadastre manualmente.`);
      } else {
        // Erro detalhado retornado pelo servidor
        const techError = `${result.error || 'Erro desconhecido'} (${result.status || 'sem status'}).`;
        const techDetails = result.details || 'Tente novamente em instantes.';
        setError(`ERRO: ${techError} - ${techDetails}`);
      }
    } catch (err: any) {
      console.error("Erro na busca de produto:", err);
      setError("Erro inesperado ao falar com o servidor. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (mappedResult && productPreview) {
      onConfirm(mappedResult, productPreview);
      handleClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    setBarcode('');
    setError(null);
    setProductPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <BarcodeIcon size={24} />
           <Typography variant="h6" fontWeight="bold">Escanear Código de Barras</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><X size={20} /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Utilize a câmera para ler o código EAN da embalagem ou digite manualmente.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Código EAN ou UPC"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ex: 7891234567890"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeIcon size={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                 variant="contained" 
                 onClick={() => handleSearch()}
                 disabled={loading || !barcode}
                 startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search size={18} />}
              >
                Buscar
              </Button>
            </Box>
          </Box>

          <Divider>
            <Typography variant="caption" color="text.secondary">OU USE A CÂMERA</Typography>
          </Divider>

          <Box sx={{ width: '100%' }}>
            {!isScanning ? (
              <Box sx={{ width: '100%', position: 'relative', bgcolor: '#f5f5f5', borderRadius: 2, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={48} color="#bdbdbd" style={{ marginBottom: 16 }} />
                <Button 
                  variant="contained" 
                  startIcon={<Camera />} 
                  onClick={startScanner}
                  disabled={loading}
                >
                  Ativar Câmera
                </Button>
                
                {cameras.length > 1 && (
                   <TextField
                    select
                    label="Selecionar Câmera"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    size="small"
                    sx={{ mt: 2, width: '80%' }}
                    SelectProps={{ native: true }}
                    InputLabelProps={{ shrink: true }}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>{cam.label}</option>
                    ))}
                  </TextField>
                )}
              </Box>
            ) : (
                <Box sx={{ width: '100%', position: 'relative' }}>
                    <div id={scannerId} style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
                    <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                        <Button 
                            size="small" 
                            variant="contained" 
                            color="error" 
                            onClick={stopScanner}
                        >
                            Parar
                        </Button>
                    </Stack>
                </Box>
            )}
          </Box>

          <Box sx={{ p: 2, bgcolor: '#f1f8e9', borderRadius: 1, border: '1px solid #c5e1a5' }}>
            <Typography variant="caption" fontWeight="bold" display="flex" alignItems="center" gap={0.5} color="success.dark">
              <HelpCircle size={14} /> Dicas para Câmera:
            </Typography>
            <Typography variant="caption" component="ul" sx={{ pl: 2, mt: 0.5, mb: 0, color: 'text.secondary' }}>
              <li>Não aproxime demais (manter a 15-20cm).</li>
              <li>Garanta boa iluminação e evite reflexos.</li>
              <li>Mantenha o código de barras bem plano.</li>
            </Typography>
          </Box>

          {error && (
            <Stack spacing={1}>
              <Alert severity="warning" variant="outlined" icon={<AlertCircle size={20} />}>
                <Typography variant="body2">{error}</Typography>
              </Alert>
              <Box sx={{ p: 1.5, bgcolor: '#fffde7', borderRadius: 1, border: '1px solid #fff59d' }}>
                <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                  Como resolver:
                </Typography>
                <Typography variant="caption" display="block" component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Verifique se outros apps estão usando a câmera.</li>
                  <li>Clique no ícone de cadeado na URL e permita a Câmera.</li>
                </Typography>
              </Box>
            </Stack>
          )}

          {productPreview && mappedResult && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa', borderColor: '#dee2e6', borderRadius: 2 }}>
               <Stack spacing={2}>
                 <Box>
                    <Typography variant="overline" color="primary" fontWeight="bold">PRODUTO LOCALIZADO</Typography>
                    <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1.2, mt: 0.5 }}>
                      {productPreview.product.product_name_pt || productPreview.product.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Marca: {productPreview.product.brands || '-'}</Typography>
                 </Box>

                 <Divider />

                 <Box>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" gutterBottom>
                      LISTA DE INGREDIENTES (RÓTULO)
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      maxHeight: 100, 
                      overflowY: 'auto', 
                      p: 1, 
                      bgcolor: 'white', 
                      borderRadius: 1, 
                      border: '1px solid #eee',
                      fontSize: '0.75rem',
                      fontStyle: mappedResult.declaracao_ingredientes_fornecedor ? 'normal' : 'italic',
                      color: mappedResult.declaracao_ingredientes_fornecedor ? 'text.primary' : 'text.disabled'
                    }}>
                      {mappedResult.declaracao_ingredientes_fornecedor || 'Lista de ingredientes não disponível neste produto.'}
                    </Typography>
                 </Box>

                 <Box>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" gutterBottom>
                      ALÉRGENOS DETECTADOS
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {mappedResult._alergenos_detectados && mappedResult._alergenos_detectados.length > 0 ? (
                        mappedResult._alergenos_detectados.map((det: any, i: number) => (
                          <React.Fragment key={i}>
                            {det.contem && <Chip label={`Contém ${det.searchName}`} size="small" color="error" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}
                            {det.derivado && <Chip label={`Derivado de ${det.searchName}`} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}
                          </React.Fragment>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled">Nenhum alérgeno específico detectado automaticamente.</Typography>
                      )}
                      {mappedResult.contem_gluten && <Chip label="Contém Glúten" size="small" color="error" variant="filled" sx={{ fontSize: '0.65rem', height: 20 }} />}
                    </Stack>
                 </Box>

                 <Box>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" gutterBottom>
                      NUTRIÇÃO (PARA 100G / 100ML)
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Box sx={{ bgcolor: 'white', p: 0.5, borderRadius: 1, textAlign: 'center', border: '1px solid #eee' }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>Energia</Typography>
                          <Typography variant="body2" fontWeight="bold">{mappedResult.energia_kcal?.toFixed(0) || '0'} <small>kcal</small></Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ bgcolor: 'white', p: 0.5, borderRadius: 1, textAlign: 'center', border: '1px solid #eee' }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>Carbos</Typography>
                          <Typography variant="body2" fontWeight="bold">{mappedResult.carboidrato_g?.toFixed(1) || '0'} <small>g</small></Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ bgcolor: 'white', p: 0.5, borderRadius: 1, textAlign: 'center', border: '1px solid #eee' }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>Proteínas</Typography>
                          <Typography variant="body2" fontWeight="bold">{mappedResult.proteina_g?.toFixed(1) || '0'} <small>g</small></Typography>
                        </Box>
                      </Grid>
                    </Grid>
                 </Box>
               </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">Cancelar</Button>
        <Button 
            onClick={handleConfirm} 
            variant="contained" 
            disabled={!productPreview}
            sx={{ fontWeight: 'bold' }}
        >
            Confirmar e Preencher
        </Button>
      </DialogActions>
    </Dialog>
  );
}
