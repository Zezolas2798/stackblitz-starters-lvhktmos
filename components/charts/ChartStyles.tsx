'use client';

import React from 'react';
import { useTheme, alpha } from '@mui/material';

/**
 * Componente que injeta definições globais de SVG (gradientes)
 * para serem usados pelos gráficos do Recharts.
 * 
 * Design: Flat, limpo, profissional — sem efeitos 3D.
 * Ref: _knowledge/financeiro/Design de Dashboards Financeiros para Restaurantes.md
 */
export const ChartDefinitions = () => {
    const theme = useTheme();
    
    return (
        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
                {/* Gradiente Primário (Sutil) */}
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.7} />
                </linearGradient>

                {/* Gradiente de Sucesso (Conforme) */}
                <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.75} />
                </linearGradient>

                {/* Gradiente de Erro (Não Conforme) */}
                <linearGradient id="gradientError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.75} />
                </linearGradient>

                {/* Gradiente de Alerta (Warning) */}
                <linearGradient id="gradientWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.75} />
                </linearGradient>

                {/* === GRADIENTES DO DONUT CHART (Paleta Profissional) === */}
                <linearGradient id="gradientDonutConforme" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2E865F" />
                    <stop offset="100%" stopColor="#34A06B" />
                </linearGradient>

                <linearGradient id="gradientDonutNaoConforme" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#D35400" />
                    <stop offset="100%" stopColor="#E67E22" />
                </linearGradient>

                {/* Gradiente de preenchimento para AreaChart */}
                <linearGradient id="gradientAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
                </linearGradient>
            </defs>
        </svg>
    );
};

/**
 * Forma customizada para Barra Moderna — Flat com cantos arredondados no topo.
 * Sem efeitos 3D, sem sombras, sem contornos pretos.
 * Ref: "Elimine efeitos 3D, sombras, degradês excessivos" — §7 Don'ts
 */
export const ModernBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    if (!height || height <= 0) return null;

    const radius = Math.min(6, width / 2); // Raio proporcional, max 6px

    return (
        <g>
            <path
                d={`
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                `}
                fill={fill}
            />
        </g>
    );
};

/**
 * @deprecated Use ModernBar em vez disso. Mantido temporariamente para compatibilidade.
 */
export const PremiumBar = ModernBar;

/**
 * Helper para converter cores em IDs de gradiente
 */
export const getGradientUrl = (color: string) => {
    if (color === '#10b981' || color.toLowerCase() === 'success') return 'url(#gradientSuccess)';
    if (color === '#ef4444' || color.toLowerCase() === 'error') return 'url(#gradientError)';
    if (color.toLowerCase() === 'warning') return 'url(#gradientWarning)';
    return 'url(#gradientPrimary)';
};

/**
 * Paleta profissional para o Donut Chart de conformidade.
 * Baseada na paleta semântica acessível do documento de design.
 */
export const DONUT_COLORS = {
    conforme: '#2E865F',      // Verde Petróleo/Sálvia
    naoConforme: '#D35400',   // Laranja Queimado
    na: '#95A5A6',            // Cinza Frio (Contexto)
};
