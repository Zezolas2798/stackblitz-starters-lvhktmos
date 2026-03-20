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
  
  const fmtCompleto = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return format(dateObj, 'dd/MM/yyyy - HH:mm:ss');
  };

  // QR Code (API Pública para preview)
  const qrContent = `ID:${dados.rastreabilidade.idInterno}|L:${dados.produto.lote}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrContent)}`;

  return (
    <Paper 
      elevation={4}
      sx={{
        width: '320px', 
        minHeight: '320px',
        p: 2,
        bgcolor: '#fff',
        color: '#000',
        fontFamily: '"Inter", sans-serif', 
        border: '1px solid #ddd',
        mx: 'auto',
        borderRadius: 1
      }}
    >
      {/* 1. NOME PRODUTO */}
      <Typography variant="h6" fontWeight="900" sx={{ fontSize: '1.2rem', lineHeight: 1.1, mb: 1.5, textTransform: 'uppercase' }}>
        {dados.produto.nome}
      </Typography>

      {/* 2. STATUS E PESO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" fontWeight="800" sx={{ fontSize: '0.75rem' }}>
            {dados.produto.tipoArmazenamento.toUpperCase()}
          </Typography>
          <Typography variant="body2" fontWeight="900" sx={{ fontSize: '0.85rem' }}>
            {dados.produto.peso}
          </Typography>
      </Box>
      
      <Divider sx={{ my: 1, bgcolor: '#000' }} />

      {/* 3. DADOS TÉCNICOS EM LISTA */}
      <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', mb: 0.3 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ width: '100px', fontSize: '0.65rem' }}>VAL. ORIGINAL:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{fmt(dados.datas.validadeOriginal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 0.3 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ width: '100px', fontSize: '0.65rem' }}>MANIPULAÇÃO:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{fmtCompleto(dados.datas.manipulacao)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 0.3 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ width: '100px', fontSize: '0.65rem' }}>VALIDADE:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{fmtCompleto(dados.datas.validadeFinal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 0.3 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ width: '100px', fontSize: '0.65rem' }}>MARCA / FORN:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{(dados.produto.marcaForn || 'PRÓPRIO').toUpperCase()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 0.3 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ width: '100px', fontSize: '0.65rem' }}>SIF:</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{dados.produto.sif || 'N/A'}</Typography>
          </Box>
      </Box>

      <Divider sx={{ my: 1, bgcolor: '#000' }} />

      {/* 4. RODAPÉ (RESP + EMPRESA + QR) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ pr: 1, flex: 1 }}>
              <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                  <span style={{ fontWeight: 'bold' }}>RESP.:</span> {dados.rastreabilidade.responsavel.toUpperCase()}
              </Typography>
              
              <Typography variant="caption" fontWeight="bold" display="block" sx={{ fontSize: '0.6rem', lineHeight: 1.1 }}>
                  {dados.empresa.razaoSocial.toUpperCase()}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontSize: '0.55rem', mt: 0.2 }}>
                  CNPJ: {dados.empresa.cnpj}  CEP: {dados.empresa.cep || '00000-000'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontSize: '0.55rem', overflowWrap: 'break-word', maxWidth: '180px' }}>
                  {dados.empresa.enderecoCompleto || dados.empresa.enderecoResumido}
              </Typography>

              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', mt: 1 }}>
                  #{dados.rastreabilidade.codigoRef || dados.rastreabilidade.idInterno.substring(0, 8).toUpperCase()}
              </Typography>
          </Box>

          <Box sx={{ minWidth: '70px', pt: 0.5 }}>
              <img src={qrUrl} alt="QR" style={{ width: '65px', height: '65px' }} />
          </Box>
      </Box>
    </Paper>
  );
}


