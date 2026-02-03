'use client';

import React from 'react';
import { Paper, Typography, Box, Divider, Stack } from '@mui/material';
import { QrCode, Factory } from 'lucide-react';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

// Exportação Default é CRÍTICA aqui
export default function EtiquetaPreview({ dados }: { dados: DadosEtiqueta }) {
  if (!dados) return null;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 300, 
        minHeight: 180, 
        p: 2, 
        border: '1px solid #000', 
        borderRadius: 1, 
        bgcolor: '#fff',
        color: '#000',
        fontFamily: 'monospace'
      }}
    >
      {/* Cabeçalho */}
      <Typography variant="caption" display="block" align="center" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
        {dados.empresa.razaoSocial.substring(0, 30).toUpperCase()}
      </Typography>
      <Typography variant="caption" display="block" align="center" sx={{ fontSize: '0.6rem' }}>
        CNPJ: {dados.empresa.cnpj}
      </Typography>
      
      <Divider sx={{ my: 1, borderColor: '#000' }} />
      
      {/* Produto */}
      <Typography variant="subtitle1" fontWeight="900" align="center" sx={{ lineHeight: 1.1, mb: 1, textTransform: 'uppercase' }}>
        {dados.produto.nome}
      </Typography>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="caption" display="block" fontWeight="bold" sx={{ fontSize: '0.6rem' }}>FABRICAÇÃO</Typography>
          <Typography variant="body2" fontWeight="bold">{new Date(dados.datas.manipulacao).toLocaleDateString()}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" display="block" fontWeight="bold" sx={{ fontSize: '0.6rem' }}>VALIDADE</Typography>
          <Typography variant="body2" fontWeight="900" sx={{ fontSize: '1.1rem' }}>
            {new Date(dados.datas.validadeFinal).toLocaleDateString()}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
        <QrCode size={40} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" display="block" fontWeight="bold">LOTE: {dados.produto.lote}</Typography>
          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
             RESP: {dados.rastreabilidade.responsavel.split('@')[0].toUpperCase()}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}