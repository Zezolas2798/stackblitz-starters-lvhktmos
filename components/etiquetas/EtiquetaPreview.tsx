import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';
import { format } from 'date-fns';

interface EtiquetaPreviewProps {
  dados: DadosEtiqueta;
}

export default function EtiquetaPreview({ dados }: EtiquetaPreviewProps) {
  const fmt = (d?: Date | string) => {
    if (!d) return "--/--";
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return format(dateObj, 'dd/MM/yyyy');
  };
  
  const fmtHora = (d: Date) => format(d, 'HH:mm');

  // QR Code (API Pública para preview)
  const qrContent = `ID:${dados.rastreabilidade.idInterno}|L:${dados.produto.lote}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}`;

  return (
    <Paper 
      elevation={4}
      sx={{
        width: '300px',  // Representação visual na tela (proporção 1:1)
        height: '300px', // Quadrado 60mm x 60mm
        p: 1.5,
        bgcolor: '#fff',
        color: '#000',
        fontFamily: '"Courier New", Courier, monospace', 
        border: '1px solid #ddd',
        position: 'relative',
        mx: 'auto',
        overflow: 'hidden'
      }}
    >
      {/* MOLDURA IMPRESSORA */}
      <Box sx={{ border: '2px solid #000', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* 1. EMPRESA */}
        <Box sx={{ p: 1, borderBottom: '1px solid #000' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.75rem', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dados.empresa.razaoSocial}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                CNPJ: {dados.empresa.cnpj}
            </Typography>
        </Box>

        {/* 2. PRODUTO */}
        <Box sx={{ px: 1, py: 0.5, flexGrow: 1 }}>
            <Typography variant="body1" fontWeight="900" sx={{ fontSize: '1rem', lineHeight: 1.1, mb: 0.5, textTransform: 'uppercase' }}>
                {dados.produto.nome.substring(0, 35)}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>L: {dados.produto.lote}</Typography>
                <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>Q: {dados.produto.peso}</Typography>
            </Box>
            <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                {dados.produto.tipoArmazenamento}
            </Typography>
        </Box>

        <Divider sx={{ bgcolor: '#000' }} />

        {/* 3. DATAS & RASTREIO */}
        <Box sx={{ px: 1, py: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Manip:</Typography>
                <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>{fmt(dados.datas.manipulacao)} {fmtHora(dados.datas.manipulacao)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Val. Orig:</Typography>
                <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>{fmt(dados.datas.validadeOriginal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Resp:</Typography>
                <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>{dados.rastreabilidade.responsavel.substring(0,10)}</Typography>
            </Box>
        </Box>

        {/* 4. RODAPÉ (VALIDADE + QR) */}
        <Box sx={{ display: 'flex', height: '80px', borderTop: '1px solid #000' }}>
            {/* Bloco Preto Invertido */}
            <Box sx={{ bgcolor: '#000', color: '#fff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', pl: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>VALIDADE</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>SANITÁRIA</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.4rem', lineHeight: 1.1 }}>
                    {fmt(dados.datas.validadeFinal).substring(0,5)}
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                    {fmt(dados.datas.validadeFinal).substring(6)}
                </Typography>
            </Box>
            
            {/* QR Code */}
            <Box sx={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #000' }}>
                 <img src={qrUrl} alt="QR" style={{ width: '70px', height: '70px' }} />
            </Box>
        </Box>

      </Box>
    </Paper>
  );
}