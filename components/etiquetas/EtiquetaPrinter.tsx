'use client';

import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Printer } from 'lucide-react';
import { generateZPL, DadosEtiqueta } from '@/lib/iot/zplGenerator';

// --- AQUI ESTÁ A CORREÇÃO: export default ---
export default function EtiquetaPrinter({ dados }: { dados: DadosEtiqueta }) {
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      if (!navigator.usb) {
        throw new Error('Navegador sem suporte a WebUSB (Use Chrome/Edge).');
      }

      // Conecta, gera ZPL e imprime...
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const zplCode = generateZPL(dados);
      const encoder = new TextEncoder();
      const data = encoder.encode(zplCode);
      await device.transferOut(1, data);

      setStatus({ msg: 'Enviado para impressora!', type: 'success' });
    } catch (err: any) {
      console.error('Print Error:', err);
      setStatus({ msg: `Erro: ${err.message}`, type: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <Button 
        variant="contained" 
        size="large"
        startIcon={printing ? <CircularProgress size={20} color="inherit"/> : <Printer />}
        onClick={handlePrint}
        disabled={printing}
        fullWidth
        sx={{ fontWeight: 'bold', py: 1.5, mb: 1 }}
      >
        {printing ? 'Enviando...' : 'IMPRIMIR ETIQUETA TÉRMICA'}
      </Button>

      <Snackbar 
        open={!!status} 
        autoHideDuration={4000} 
        onClose={() => setStatus(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={status?.type || 'info'} onClose={() => setStatus(null)}>{status?.msg}</Alert>
      </Snackbar>
    </>
  );
}