'use client';

import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';

export default function MetodologiasRelatorio() {
  return (
    <Box
      className="page-break"
      sx={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        padding: '20mm',
        boxSizing: 'border-box',
        fontFamily: '"Inter", sans-serif',
        color: '#0F172A',
      }}
    >
      <Typography variant="h4" fontWeight="900" sx={{ mb: 4, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        Metodologias e Bases Legais
      </Typography>

      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" fontWeight="700" color="#66c8c7" sx={{ mb: 1 }}>
            1. Fundamentação Legal
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify', lineHeight: 1.6, color: '#475569' }}>
            Este relatório foi elaborado em estrita conformidade com as normas vigentes da Agência Nacional de Vigilância Sanitária (ANVISA), especificamente a <strong>RDC nº 429/2020</strong> e a <strong>Instrução Normativa IN nº 75/2020</strong>, que estabelecem os requisitos para a rotulagem nutricional de alimentos embalados. Adicionalmente, segue as diretrizes da <strong>RDC nº 727/2022</strong> para rotulagem de alergênicos e declarações obrigatórias.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="700" color="#66c8c7" sx={{ mb: 1 }}>
            2. Metodologia de Cálculo
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify', lineHeight: 1.6, color: '#475569' }}>
            As informações nutricionais apresentadas foram obtidas através de <strong>método de cálculo teórico</strong> (análise indireta), baseado na composição centesimal dos ingredientes utilizados na formulação. Este método é validado pela legislação brasileira como alternativa à análise laboratorial, desde que utilize fontes de dados confiáveis e metodologias de cálculo precisas.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="700" color="#66c8c7" sx={{ mb: 1 }}>
            3. Fontes de Dados de Composição Alentar
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify', lineHeight: 1.6, color: '#475569' }}>
            Para garantir a precisão dos cálculos, os dados foram compilados a partir de tabelas de composição de alimentos de referência nacional e internacional:
          </Typography>
          <Typography component="div" variant="body2" sx={{ mt: 1, pl: 2, color: '#475569' }}>
            <ul>
              <li><strong>TBCA:</strong> Tabela Brasileira de Composição de Alimentos (USP/Brasil);</li>
              <li><strong>TACO:</strong> Tabela Brasileira de Composição de Alimentos (UNICAMP/Brasil);</li>
              <li><strong>USDA:</strong> United States Department of Agriculture (U.S. Department of Agriculture);</li>
              <li><strong>Fichas Técnicas:</strong> Dados específicos fornecidos pelos fabricantes de ingredientes industriais.</li>
            </ul>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="700" color="#66c8c7" sx={{ mb: 1 }}>
            4. Tratamento de Alergênicos
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify', lineHeight: 1.6, color: '#475569' }}>
            A declaração de alergênicos segue as regras de agrupamento e destaque (Negrito e Caixa Alta) conforme a <strong>RDC 727/2022</strong>. O sistema considera tanto a presença direta de ingredientes quanto os riscos de contaminação cruzada informados nos laudos dos fornecedores.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="700" color="#66c8c7" sx={{ mb: 1 }}>
            5. Arredondamentos e VDR
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'justify', lineHeight: 1.6, color: '#475569' }}>
            Os valores de nutrientes e percentuais de Valores Diários (%VD) foram arredondados conforme as regras estabelecidas no Anexo IV da IN 75/2020. O cálculo de %VD tem como base uma dieta de 2.000 kcal ou 8.400 kJ.
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm' }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          Documento gerado eletronicamente através da plataforma NutriDev Intelligence.
        </Typography>
      </Box>
    </Box>
  );
}
