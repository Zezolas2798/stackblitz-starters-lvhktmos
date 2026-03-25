import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export interface BulletGraphProps {
  title: string;
  subtitle?: string;
  actual: number;
  target: number;
  ranges: [number, number, number]; // [good, satisfactory, bad] or vice-versa
  format?: 'currency' | 'percent' | 'number';
  inverseColors?: boolean; // true = smaller is better (e.g. costs). false = larger is better (e.g. revenue)
}

export default function BulletGraph({
  title,
  subtitle,
  actual,
  target,
  ranges,
  format = 'number',
  inverseColors = false
}: BulletGraphProps) {
  const theme = useTheme();

  const maxRange = Math.max(...ranges, actual, target);

  const formatValue = (val: number) => {
    if (format === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    if (format === 'percent') return `${val.toFixed(1)}%`;
    return val.toString();
  };

  // Cores semânticas suaves para não poluir o painel (Regra Gestalt)
  const colors = inverseColors
    ? ['#e0e0e0', '#f5b7b1', '#e74c3c'] // Menor é melhor (cinza, vermelho claro, vermelho escuro)
    : ['#e0e0e0', '#aed6f1', '#3498db']; // Maior é melhor (cinza, azul claro, azul escuro)

  const toPct = (val: number) => `${(val / maxRange) * 100}%`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Typography variant="subtitle2" fontWeight="bold">
          {formatValue(actual)}
        </Typography>
      </Box>

      {/* Graph Track */}
      <Box sx={{ position: 'relative', height: '24px', width: '100%', mt: 1 }}>
        {/* Ranges (Background Bars) */}
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: toPct(ranges[2]), backgroundColor: colors[2], opacity: 0.15
          }}
        />
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: toPct(ranges[1]), backgroundColor: colors[1], opacity: 0.25
          }}
        />
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: toPct(ranges[0]), backgroundColor: colors[0]
          }}
        />

        {/* Target Marker */}
        <Box
          sx={{
            position: 'absolute', top: '-4px', bottom: '-4px', left: toPct(target),
            width: '4px', backgroundColor: theme.palette.text.primary, zIndex: 2
          }}
        />

        {/* Actual Value Bar */}
        <Box
          sx={{
            position: 'absolute', top: '6px', height: '12px', left: 0,
            width: toPct(actual), backgroundColor: theme.palette.text.primary, zIndex: 1
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Meta: {formatValue(target)}
        </Typography>
      </Box>
    </Box>
  );
}
