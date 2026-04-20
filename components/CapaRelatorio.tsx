'use client';

import React from 'react';
import { Box, Typography, Stack, useTheme, Grid } from '@mui/material';
import Image from 'next/image';

interface CapaRelatorioProps {
  clientName: string;
  reportType: 'LIVRO' | 'CATALOGO';
  date?: string;
  logoUrl?: string | null;
  showComplianceInfo?: boolean;
  ultimaRevisao?: string;
  responsavelTecnico?: {
    nome: string;
    registro: string;
  };
}

export default function CapaRelatorio({
  clientName,
  reportType,
  date = new Date().toLocaleDateString('pt-BR'),
  logoUrl,
  showComplianceInfo = true,
  ultimaRevisao,
  responsavelTecnico
}: CapaRelatorioProps) {
  const theme = useTheme();

  return (
    <Box
      className="page-break"
      sx={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20mm',
        boxSizing: 'border-box',
        fontFamily: '"Inter", sans-serif',
        color: '#0F172A',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorativo */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          backgroundColor: '#66c8c7',
          opacity: 0.05,
          borderRadius: '50%',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-5%',
          left: '-5%',
          width: '300px',
          height: '300px',
          backgroundColor: '#66c8c7',
          opacity: 0.03,
          borderRadius: '50%',
          zIndex: 0
        }}
      />

      {/* Cabeçalho do Cliente */}
      <Stack spacing={2} alignItems="center" sx={{ zIndex: 1, mb: 6, mt: -8 }}>
        <Box
          sx={{
            width: '140px',
            height: '140px',
            border: '1px solid #E2E8F0',
            borderRadius: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
            backgroundColor: '#F8FAFC',
            overflow: 'hidden',
            padding: logoUrl ? 1.5 : 0,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          {logoUrl ? (
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={logoUrl}
                alt={clientName}
                fill
                style={{ objectFit: 'contain' }}
              />
            </Box>
          ) : (
            <Typography variant="h2" fontWeight="900" color="#CBD5E1">
              {clientName.substring(0, 1).toUpperCase()}
            </Typography>
          )}
        </Box>
        <Typography variant="subtitle1" sx={{ letterSpacing: 3, fontWeight: 700, color: '#64748B' }}>
          {clientName.toUpperCase()}
        </Typography>
      </Stack>

      {/* Título Principal */}
      <Box sx={{ textAlign: 'center', zIndex: 1, maxWidth: '85%', mt: 4 }}>
        <Typography
          variant="h2"
          fontWeight="900"
          sx={{
            lineHeight: 1.1,
            mb: 1.5,
            letterSpacing: '-0.03em',
            fontSize: '3.8rem',
            color: '#0F172A'
          }}
        >
          {reportType === 'LIVRO' ? 'Manual de Produção e Livro de Receitas' : 'Catálogo Nutricional'}
        </Typography>
        <Box sx={{ width: '60px', height: '4px', backgroundColor: '#66c8c7', margin: '24px auto', borderRadius: 2 }} />

        {showComplianceInfo && reportType !== 'LIVRO' && (
          <Typography variant="h5" color="text.secondary" fontWeight="500" sx={{ lineHeight: 1.4 }}>
            Documentação Técnica em Conformidade com<br />
            <strong>RDC 429/2020</strong>, <strong>IN 75/2020</strong> e <strong>RDC 727/2022</strong>
          </Typography>
        )}
      </Box>

      {/* Rodapé da Capa Centro-alinhado e Profissional */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20mm',
          width: 'calc(100% - 40mm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: '1px solid #F1F5F9',
          pt: 3,
          zIndex: 1
        }}
      >
        <Grid container spacing={4} justifyContent="center" sx={{ mb: 4, width: '100%' }}>
          {responsavelTecnico && (
            <Grid item xs={12} sm={5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 700, mb: 0.5, letterSpacing: 1.5 }}>
                RESPONSÁVEL TÉCNICO
              </Typography>
              <Typography variant="body1" fontWeight="800" color="#0F172A">
                {responsavelTecnico.nome}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {responsavelTecnico.registro}
              </Typography>
            </Grid>
          )}

          {ultimaRevisao && (
            <Grid item xs={12} sm={5} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontWeight: 700, mb: 0.5, letterSpacing: 1.5 }}>
                ÚLTIMA REVISÃO
              </Typography>
              <Typography variant="body1" fontWeight="800" color="#0F172A">
                {ultimaRevisao}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {date}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Image src="/logo-cortex.svg" alt="NutriDev Logo" width={120} height={36} style={{ opacity: 0.8, marginBottom: '8px' }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500, letterSpacing: 1 }}>
            Cortex Intelligence Platform • Software for Life Sciences
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
