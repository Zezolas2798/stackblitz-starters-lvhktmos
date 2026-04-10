'use client';

import React from 'react';
import { useTheme, alpha, lighten, darken } from '@mui/material';

/**
 * Componente que injeta definições globais de SVG (gradientes e filtros)
 * para serem usados pelos gráficos do Recharts.
 */
export const ChartDefinitions = () => {
    const theme = useTheme();
    
    return (
        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
                {/* Gradiente Primário (Efeito Premium) */}
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.primary.main} />
                    <stop offset="100%" stopColor={theme.palette.primary.dark} />
                </linearGradient>

                {/* Gradiente de Sucesso (Conforme) */}
                <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Gradiente de Erro (Não Conforme) */}
                <linearGradient id="gradientError" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>

                {/* Gradiente de Alerta (Warning) */}
                <linearGradient id="gradientWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Filtro de Sombra (Depth) */}
                <filter id="shadowDepth" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                    <feOffset in="blur" dx="3" dy="3" result="offsetBlur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
};

/**
 * Forma customizada para a Barra que simula um efeito isometrico 3D Real
 */
export const PremiumBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    if (!height || height <= 0) return null;

    // Extrair cor base para as faces 3D
    let baseColor = fill;
    if (typeof fill === 'string' && fill.startsWith('url')) {
        const id = fill.match(/#(.+)\)/)?.[1];
        if (id === 'gradientSuccess') baseColor = '#10b981';
        else if (id === 'gradientError') baseColor = '#ef4444';
        else if (id === 'gradientWarning') baseColor = '#f59e0b';
        else baseColor = '#3b82f6'; // Primary fallback
    }
    
    const depth = 10; // Profundidade ligeiramente maior para destaque
    
    // Cores das faces baseadas na iluminação (Top clara, Side escura)
    const topColor = lighten(baseColor, 0.2);
    const sideColor = darken(baseColor, 0.25);
    const strokeColor = '#000000'; // Contorno preto como na imagem

    return (
        <g>
            {/* Sombra de projeção suave */}
            <path 
                d={`M ${x + depth},${y + height} 
                   L ${x + width + depth},${y + height} 
                   L ${x + width + depth},${y - depth} 
                   L ${x + width},${y} 
                   L ${x + width},${y + height} 
                   Z`} 
                fill="rgba(0,0,0,0.08)"
            />

            {/* Face Superior (Top) */}
            <path 
                d={`M ${x},${y} 
                   L ${x + depth},${y - depth} 
                   L ${x + width + depth},${y - depth} 
                   L ${x + width},${y} 
                   Z`} 
                fill={topColor} 
                stroke={strokeColor}
                strokeWidth={0.8}
            />

            {/* Face Lateral (Side) */}
            <path 
                d={`M ${x + width},${y} 
                   L ${x + width + depth},${y - depth} 
                   L ${x + width + depth},${y + height - depth} 
                   L ${x + width},${y + height} 
                   Z`} 
                fill={sideColor} 
                stroke={strokeColor}
                strokeWidth={0.8}
            />

            {/* Face Frontal (Front) */}
            <path 
                d={`M ${x},${y} 
                   L ${x + width},${y} 
                   L ${x + width},${y + height} 
                   L ${x},${y + height} 
                   Z`} 
                fill={fill} 
                stroke={strokeColor}
                strokeWidth={0.8}
            />
        </g>
    );
};

/**
 * Helper para converter cores Hex do MUI em IDs de gradiente
 */
export const getGradientUrl = (color: string) => {
    if (color === '#10b981' || color.toLowerCase() === 'success') return 'url(#gradientSuccess)';
    if (color === '#ef4444' || color.toLowerCase() === 'error') return 'url(#gradientError)';
    if (color.toLowerCase() === 'warning') return 'url(#gradientWarning)';
    return 'url(#gradientPrimary)';
};
