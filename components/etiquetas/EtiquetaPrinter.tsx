'use client';

import { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Printer, XCircle } from 'lucide-react';
import { gerarZPL, DadosEtiqueta } from '@/lib/iot/zplGenerator';

// Declaração global para WebUSB
declare global {
  interface Navigator {
    usb: any;
  }
}

interface EtiquetaPrinterProps {
  dados: DadosEtiqueta | DadosEtiqueta[];
  disabled?: boolean;
  quantidadeCopias?: number;
  onPrintSuccess?: () => void;
  label?: string;
}

export default function EtiquetaPrinter({ dados, disabled, quantidadeCopias = 1, onPrintSuccess, label }: EtiquetaPrinterProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{tipo: 'success'|'error', text: string} | null>(null);

  const handlePrint = async () => {
    setLoading(true);
    setMsg(null);

    try {
      if (!navigator.usb) {
        throw new Error('Navegador incompatível com impressão USB direta (Use Chrome/Edge).');
      }

      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const encoder = new TextEncoder();
      const labelsArray = Array.isArray(dados) ? dados : [dados];

      for (const item of labelsArray) {
        const zplCode = gerarZPL(item, quantidadeCopias);
        const dataBuffer = encoder.encode(zplCode);

        let impresso = false;
        for (const endpoint of [1, 2, 3]) {
          try {
            await device.transferOut(endpoint, dataBuffer);
            impresso = true;
            break; 
          } catch (e) {
            console.log(`Endpoint ${endpoint} falhou, tentando próximo...`);
          }
        }
        if (!impresso) throw new Error('Falha ao comunicar com os endpoints da impressora.');
      }

      await device.close();
      setMsg({ tipo: 'success', text: `${labelsArray.length} etiqueta(s) enviada(s) com sucesso!` });
      if (onPrintSuccess) onPrintSuccess();

    } catch (err: any) {
      console.error(err);
      setMsg({ tipo: 'error', text: err.message || 'Erro de impressão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary" // Cor de destaque para Ação Física
        size="large"
        startIcon={loading ? null : <Printer />}
        onClick={handlePrint}
        disabled={disabled || loading}
        sx={{ fontWeight: 'bold', py: 1.5 }}
      >
        {loading ? 'Imprimindo...' : 'IMPRIMIR ETIQUETA'}
      </Button>

      <Snackbar open={!!msg} autoHideDuration={6000} onClose={() => setMsg(null)}>
        <Alert severity={msg?.tipo} onClose={() => setMsg(null)}>
          {msg?.text}
        </Alert>
      </Snackbar>
    </>
  );
}


