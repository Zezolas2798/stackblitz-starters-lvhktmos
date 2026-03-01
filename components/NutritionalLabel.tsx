// components/NutritionalLabel.tsx
'use client';

import React from 'react';
import { Box, Typography, Stack, Tooltip } from '@mui/material';
import { ResultadoCalculo, LupasFrontais, DeclaracoesObrigatorias, InfoPorcao } from '@/lib/types';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// =====================================================================
// PARTE 0: HELPERS VISUAIS (FORMATAR NÚMEROS E FRAÇÕES)
// =====================================================================

function formatarNumero(num: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 1 
  }).format(num);
}

function converterParaFracao(val: number): string {
  if (!val) return "";
  const inteiro = Math.floor(val);
  const decimal = val - inteiro;
  const isClose = (a: number, b: number) => Math.abs(a - b) < 0.01;

  let fracao = "";
  if (isClose(decimal, 0.25)) fracao = "1/4";
  else if (isClose(decimal, 0.5)) fracao = "1/2";
  else if (isClose(decimal, 0.75)) fracao = "3/4";
  else if (isClose(decimal, 0.33)) fracao = "1/3";
  else if (decimal > 0.05) return formatarNumero(val);

  if (inteiro === 0 && fracao) return fracao;
  if (inteiro > 0 && fracao) return `${inteiro} ${fracao}`;
  return inteiro.toString();
}

function formatarMedidaCaseira(info: InfoPorcao): string {
    const pesoFormatado = formatarNumero(info.porcao_g_ml);
    if (!info.medida_caseira_nome) return `${pesoFormatado}g`;
    const qtdNum = info.medida_caseira_quantidade || 1;
    const qtdTexto = converterParaFracao(qtdNum); 
    const nome = info.medida_caseira_nome;
    return `${pesoFormatado}g (${qtdTexto} ${nome})`;
}

// =====================================================================
// PARTE 1: GEOMETRIA DA LUPA (MALHA CONSTRUTIVA IN 75 - ANEXO XVIII)
// =====================================================================

// Conversão de unidades
const mmToPx = (mm: number) => mm * (96 / 25.4); // 96 DPI padrão web

// Definição da Malha baseada na Área do Painel Principal (APP)
// Fonte: Tabela do Anexo XVIII da IN 75
function getMalhaStyles(areaCm2: number | null | undefined) {
  const area = areaCm2 || 100; // Fallback seguro
  
  let h_min_mm: number; // Altura mínima da letra (Y)

  if (area < 50) h_min_mm = 1.5;
  else if (area < 100) h_min_mm = 2.0;
  else if (area < 150) h_min_mm = 2.5;
  else if (area < 350) h_min_mm = 3.0;
  else if (area < 500) h_min_mm = 3.5;
  else if (area < 2000) h_min_mm = 4.0;
  else h_min_mm = 5.0; // > 2000 cm2

  // Fator de escala para visualização em tela (opcional, para não ficar minúsculo em telas grandes)
  // Na impressão real, scaleFactor deve ser 1.
  const scaleFactor = 1.5; 
  
  const Y = mmToPx(h_min_mm) * scaleFactor; 
  
  // Z é a largura da letra "I". Na fonte Arial Narrow Bold, a razão largura/altura é aprox 0.26
  const Z = Y * 0.26; 

  return {
    Y, Z,
    h_min_mm,
    area_painel: area,
    // Dimensões dos Blocos (IN 75)
    blockHeight: 3 * Y,
    blockWidth: 8 * Y,
    borderWidth: 1 * Z,
    borderRadius: 0.5 * Y, // Aproximação visual (canto arredondado)
    gap: 2 * Z,            // Distância entre blocos
    paddingX: 2 * Z,       // Margem interna lateral
    
    // Tipografia
    fontFamily: '"Arial Narrow", "Helvetica Condensed", sans-serif',
    fontWeight: 700, // Bold
    fontSizeAltoEm: Y, // Altura da letra A = Y
    fontSizeNutriente: Y * 0.85, // Ajuste ótico para caber no bloco
    
    // Geometria da Lupa (Anexo XVIII)
    lupaDiameter: 1.7 * Y,
    lupaThickness: 1.4 * Z,
    handleLength: 1.3 * Y,
    handleThickness: 2.6 * Z,
    handleAngle: 30 * (Math.PI / 180), // 30 graus em radianos
    safeZone: 2 * Z // Margem de respiro
  };
}

// Ícone da Lupa Vetorial (SVG Path exato)
const LupaIconSVG = ({ s }: { s: ReturnType<typeof getMalhaStyles> }) => {
  const R = s.lupaDiameter / 2; // Raio externo
  const thickness = s.lupaThickness;
  const r = R - (thickness / 2); // Raio do traço (centerline)
  
  // Cabo da lupa (Handle)
  const handleW = s.handleThickness;
  const handleL = s.handleLength;
  
  // Cálculos trigonométricos para o cabo a 30 graus
  // O cabo sai do quadrante inferior direito
  const cx = R; 
  const cy = R;
  
  // O tamanho total do SVG precisa acomodar o círculo + o cabo inclinado
  // Projeção do cabo
  const handleProjX = handleL * Math.sin(s.handleAngle);
  const handleProjY = handleL * Math.cos(s.handleAngle);
  
  const totalW = (2 * R) + handleProjX;
  const totalH = (2 * R) + handleProjY;

  return (
    <svg width={totalW * 1.2} height={totalH * 1.2} viewBox={`0 0 ${totalW * 1.2} ${totalH * 1.2}`} style={{ overflow: 'visible' }}>
      {/* 1. O Aro da Lupa */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill="none" 
        stroke="black" 
        strokeWidth={thickness} 
      />
      
      {/* 2. O Cabo da Lupa (Rotacionado 30 graus em relação à vertical, ou -60 do eixo X padrão) */}
      {/* A norma diz 30 graus da vertical. Vamos usar transform para facilitar */}
      <g transform={`translate(${cx}, ${cy}) rotate(-60)`}>
         {/* O cabo começa na borda do círculo (R) e vai até R + handleL */}
         <rect 
            x={R} 
            y={-handleW / 2} 
            width={handleL} 
            height={handleW} 
            rx={handleW / 2} // Bordas arredondadas do cabo
            fill="black" 
         />
      </g>
    </svg>
  );
};

const BlocoAltoEm = ({ s }: { s: ReturnType<typeof getMalhaStyles> }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
    position: 'relative', height: s.blockHeight, width: s.blockWidth,
    bgcolor: 'background.paper', color: 'text.primary', border: `${s.borderWidth}px solid black`,
    boxSizing: 'border-box', 
    pl: `calc(${s.lupaDiameter}px + ${s.paddingX}px)`, // Espaço reservado para a lupa
    overflow: 'visible'
  }}>
    {/* Lupa Posicionada Absolutamente à Esquerda */}
    <Box sx={{ position: 'absolute', left: s.paddingX, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
      <LupaIconSVG s={s} />
    </Box>
    <Typography sx={{ 
        fontFamily: s.fontFamily, 
        fontWeight: s.fontWeight, 
        fontSize: s.fontSizeAltoEm, 
        lineHeight: 1, 
        letterSpacing: '-0.02em' // Arial Narrow é bem "apertada"
    }}>
      ALTO EM
    </Typography>
  </Box>
);

const BlocoNutriente = ({ label, s, style }: { label: string, s: ReturnType<typeof getMalhaStyles>, style?: React.CSSProperties }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    height: s.blockHeight, width: s.blockWidth, bgcolor: 'text.primary', color: 'white',
    border: `${s.borderWidth}px solid black`, boxSizing: 'border-box', ...style
  }}>
    <Typography sx={{ 
        fontFamily: s.fontFamily, 
        fontWeight: s.fontWeight, 
        fontSize: s.fontSizeNutriente, 
        lineHeight: 1.1, 
        whiteSpace: 'pre-line' 
    }}>
      {label}
    </Typography>
  </Box>
);

// === COMPONENTE PRINCIPAL DA LUPA ===
export function LupaFrontalANVISA({ lupas, areaPainelCm2, layout = 'VERTICAL' }: { lupas: LupasFrontais, areaPainelCm2: number | null | undefined, layout?: 'VERTICAL' | 'HORIZONTAL' | 'COMPACTO' }) {
  const s = getMalhaStyles(areaPainelCm2);
  
  const alertasAtivos = [
    { id: 'acucar', show: lupas?.alto_em_acucar_adicionado, label: 'AÇÚCAR\nADICIONADO' },
    { id: 'gordura', show: lupas?.alto_em_gordura_saturada, label: 'GORDURA\nSATURADA' },
    { id: 'sodio', show: lupas?.alto_em_sodio, label: 'SÓDIO' },
  ].filter(a => a.show);

  if (alertasAtivos.length === 0) return null;

  // Renderização Condicional do Layout
  let content = null;

  if (layout === 'VERTICAL' || layout === 'COMPACTO') {
    content = (
      <Box sx={{ width: s.blockWidth, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ '& > div': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 0 } }}>
          <BlocoAltoEm s={s} />
        </Box>
        {alertasAtivos.map((alerta, idx) => {
            const isLast = idx === alertasAtivos.length - 1;
            return (
                <Box key={alerta.id} sx={{ '& > div': { borderTop: '1px solid white' } }}>
                    <BlocoNutriente 
                        label={alerta.label} 
                        s={s} 
                        style={{ 
                            borderBottomLeftRadius: isLast ? s.borderRadius : 0, 
                            borderBottomRightRadius: isLast ? s.borderRadius : 0, 
                            borderBottom: isLast ? undefined : 0 
                        }} 
                    />
                </Box>
            );
        })}
      </Box>
    );
  } else if (layout === 'HORIZONTAL') {
    content = (
      <Stack direction="row" spacing={s.gap / 4} alignItems="flex-start">
        <BlocoAltoEm s={s} /> {/* No horizontal, o Alto Em tem cantos arredondados completos */}
        {alertasAtivos.map(alerta => (
          <BlocoNutriente key={alerta.id} label={alerta.label} s={s} style={{ borderRadius: s.borderRadius }} />
        ))}
      </Stack>
    );
  }

  // Wrapper com Informações Técnicas (Tooltip)
  return (
    <Box>
        <Tooltip title={
            <Box sx={{ p: 1 }}>
                <Typography variant="caption" display="block">📏 <strong>Dimensões Técnicas (IN 75)</strong></Typography>
                <Typography variant="caption" display="block">Área Painel: {s.area_painel} cm²</Typography>
                <Typography variant="caption" display="block">Altura Mínima (Y): {s.h_min_mm} mm</Typography>
                <Typography variant="caption" display="block">Status: Em Conformidade</Typography>
            </Box>
        } arrow placement="top">
            <Box sx={{ 
                cursor: 'help', 
                display: 'inline-flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                p: 1, 
                border: '1px dashed #ccc', 
                borderRadius: 2 
            }}>
                {content}
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1, opacity: 0.6 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                        Malha IN 75 (Y={s.h_min_mm}mm)
                    </Typography>
                </Stack>
            </Box>
        </Tooltip>
    </Box>
  );
}

// =====================================================================
// PARTE 2: TABELAS NUTRICIONAIS (MANTIDAS DA VERSÃO ANTERIOR)
// =====================================================================

const font = "Arial, Helvetica, sans-serif";
const borderThick = '2pt solid black'; 
const borderThin = '1pt solid black'; 

const getAllNutrientes = (tabela: ResultadoCalculo) => {
  const { porPorcao, percentualVD } = tabela;
  const n = [
      { key: 'energia_kcal', label: 'Valor energético (kcal)', unidade: '', recuo: 0 },
      { key: 'carboidrato_g', label: 'Carboidratos', unidade: 'g', recuo: 0 },
      { key: 'acucar_total_g', label: 'Açúcares totais', unidade: 'g', recuo: 1 },
      { key: 'acucar_adicionado_g', label: 'Açúcares adicionados', unidade: 'g', recuo: 2 },
      { key: 'proteina_g', label: 'Proteínas', unidade: 'g', recuo: 0 },
      { key: 'lipideos_g', label: 'Gorduras totais', unidade: 'g', recuo: 0 },
      { key: 'gordura_saturada_g', label: 'Gorduras saturadas', unidade: 'g', recuo: 1 },
      { key: 'gordura_trans_g', label: 'Gorduras trans', unidade: 'g', recuo: 1 },
      { key: 'fibra_alimentar_g', label: 'Fibra alimentar', unidade: 'g', recuo: 0 },
      { key: 'sodio_mg', label: 'Sódio', unidade: 'mg', recuo: 0 },
  ];
  return n;
};

// 1. VERTICAL PADRÃO
export const TabelaVertical = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);
  const porcaoCabecalho = formatarNumero(tabela.infoPorcao.porcao_g_ml);

  return (
    <div ref={ref} style={{ border: borderThick, background: 'var(--mui-palette-background-paper)', width: 'fit-content', padding: '4px', fontFamily: font, color: 'text.primary' }}>
      <div style={{ fontSize: '10pt', fontWeight: 'bold', borderBottom: 'none' }}>INFORMAÇÃO NUTRICIONAL</div>
      <div style={{ fontSize: '10pt', marginBottom: '4px' }}>
        Porções por embalagem: {tabela.infoPorcao.total_porcoes_embalagem} <br />
        Porção: {medida}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: borderThick }}>
        <thead>
          <tr style={{ borderBottom: borderThick }}>
            <th style={{ textAlign: 'left', width: '150px', fontSize: '10pt', padding: '2px', borderRight: borderThin }}> </th>
            <th style={{ width: '50px', fontSize: '10pt', borderRight: borderThin, padding: '2px' }}>100 g</th>
            <th style={{ width: '50px', fontSize: '10pt', borderRight: borderThin, padding: '2px' }}>{porcaoCabecalho} g</th>
            <th style={{ width: '40px', fontSize: '10pt', padding: '2px' }}>%VD*</th>
          </tr>
        </thead>
        <tbody>
          {nutrientes.map((n) => (
            <tr key={n.key} style={{ borderBottom: borderThin }}>
              <td style={{ fontSize: '10pt', padding: '2px', paddingLeft: `${4 + n.recuo * 8}px`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                {n.label} {n.unidade ? `(${n.unidade})` : ''}
              </td>
              <td style={{ fontSize: '10pt', textAlign: 'center', borderRight: borderThin, padding: '2px' }}>{tabela.por100g[n.key] ?? '0'}</td>
              <td style={{ fontSize: '10pt', textAlign: 'center', borderRight: borderThin, padding: '2px' }}>{tabela.porPorcao[n.key] ?? '0'}</td>
              <td style={{ fontSize: '10pt', textAlign: 'center', padding: '2px' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '8pt', marginTop: '2px' }}>*Percentual de valores diários fornecidos pela porção.</div>
    </div>
  );
});
TabelaVertical.displayName = 'TabelaVertical';

// 2. VERTICAL QUEBRADA
export const TabelaVerticalQuebrada = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const splitIndex = Math.ceil(nutrientes.length / 2);
  const col1 = nutrientes.slice(0, splitIndex);
  const col2 = nutrientes.slice(splitIndex);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);

  return (
    <div ref={ref} style={{ border: borderThick, background: 'var(--mui-palette-background-paper)', width: '100%', padding: '4px', fontFamily: font, color: 'text.primary' }}>
      <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>INFORMAÇÃO NUTRICIONAL</div>
      <div style={{ fontSize: '10pt', marginBottom: '4px' }}>
        Porções por embalagem: {tabela.infoPorcao.total_porcoes_embalagem} • Porção: {medida}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: borderThick }}>
        <thead>
          <tr style={{ borderBottom: borderThick }}>
            <th style={{ width: '30%', textAlign: 'left', fontSize: '9pt', borderRight: borderThin, padding: '2px' }}> </th>
            <th style={{ width: '10%', fontSize: '9pt', borderRight: borderThin, padding: '2px' }}>100g</th>
            <th style={{ width: '5%', fontSize: '9pt', borderRight: borderThick, padding: '2px' }}>%VD*</th>
            <th style={{ width: '30%', textAlign: 'left', fontSize: '9pt', borderRight: borderThin, padding: '2px' }}> </th>
            <th style={{ width: '10%', fontSize: '9pt', borderRight: borderThin, padding: '2px' }}>100g</th>
            <th style={{ width: '5%', fontSize: '9pt', padding: '2px' }}>%VD*</th>
          </tr>
        </thead>
        <tbody>
          {col1.map((n1, i) => {
            const n2 = col2[i];
            return (
              <tr key={n1.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: '9pt', paddingLeft: `${4 + n1.recuo * 6}px`, borderRight: borderThin, whiteSpace: 'nowrap' }}>{n1.label} {n1.unidade}</td>
                <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n1.key] ?? '0'}</td>
                <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThick }}>{tabela.percentualVD[n1.key] ? `${tabela.percentualVD[n1.key]}%` : '0%'}</td>
                <td style={{ fontSize: '9pt', paddingLeft: n2 ? `${4 + n2.recuo * 6}px` : '0', borderRight: borderThin, whiteSpace: 'nowrap' }}>{n2 ? `${n2.label} ${n2.unidade}` : ''}</td>
                <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThin }}>{n2 ? (tabela.por100g[n2.key] ?? '0') : ''}</td>
                <td style={{ fontSize: '9pt', textAlign: 'center' }}>{n2 ? (tabela.percentualVD[n2.key] ? `${tabela.percentualVD[n2.key]}%` : '0%') : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontSize: '8pt', marginTop: '2px' }}>*Percentual de valores diários fornecidos pela porção.</div>
    </div>
  );
});
TabelaVerticalQuebrada.displayName = 'TabelaVerticalQuebrada';

// 3. HORIZONTAL
export const TabelaHorizontal = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);
  const porcaoCabecalho = formatarNumero(tabela.infoPorcao.porcao_g_ml);

  return (
    <div ref={ref} style={{ border: borderThick, background: 'var(--mui-palette-background-paper)', width: '100%', display: 'flex', fontFamily: font, color: 'text.primary' }}>
      <div style={{ width: '30%', padding: '6px', borderRight: borderThick, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
         <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '4px' }}>INFORMAÇÃO NUTRICIONAL</div>
         <div style={{ fontSize: '10pt' }}>Porções por embalagem: {tabela.infoPorcao.total_porcoes_embalagem}</div>
         <div style={{ fontSize: '10pt' }}>Porção: {medida}</div>
      </div>
      <div style={{ width: '70%', padding: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: borderThick }}>
              <th style={{ textAlign: 'left', fontSize: '10pt', borderRight: borderThin, padding: '2px' }}> </th>
              <th style={{ fontSize: '10pt', borderRight: borderThin, padding: '2px' }}>100 g</th>
              <th style={{ fontSize: '10pt', borderRight: borderThin, padding: '2px' }}>{porcaoCabecalho} g</th>
              <th style={{ fontSize: '10pt', padding: '2px' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {nutrientes.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: '10pt', paddingLeft: `${4 + n.recuo * 8}px`, borderRight: borderThin, whiteSpace: 'nowrap' }}>{n.label} {n.unidade}</td>
                <td style={{ fontSize: '10pt', textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: '10pt', textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: '10pt', textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: '8pt', marginTop: '2px' }}>*Percentual de valores diários fornecidos pela porção.</div>
      </div>
    </div>
  );
});
TabelaHorizontal.displayName = 'TabelaHorizontal';

// 4. HORIZONTAL QUEBRADA
export const TabelaHorizontalQuebrada = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const half = Math.ceil(nutrientes.length / 2);
  const col1 = nutrientes.slice(0, half);
  const col2 = nutrientes.slice(half);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);

  return (
    <div ref={ref} style={{ border: borderThick, background: 'var(--mui-palette-background-paper)', width: '100%', display: 'flex', fontFamily: font, color: 'text.primary' }}>
       <div style={{ width: '20%', padding: '6px', borderRight: borderThick, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
         <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>INFORMAÇÃO NUTRICIONAL</div>
         <div style={{ fontSize: '9pt' }}>Porções: {tabela.infoPorcao.total_porcoes_embalagem}</div>
         <div style={{ fontSize: '9pt' }}>Porção: {medida}</div>
      </div>
      <div style={{ width: '80%', padding: '4px' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: borderThick }}>
                 <th style={{ textAlign: 'left', fontSize: '9pt', borderRight: borderThin }}> </th>
                 <th style={{ fontSize: '9pt', borderRight: borderThin }}>100g</th>
                 <th style={{ fontSize: '9pt', borderRight: borderThick }}>%VD*</th>
                 <th style={{ textAlign: 'left', fontSize: '9pt', borderRight: borderThin, paddingLeft: '4px' }}> </th>
                 <th style={{ fontSize: '9pt', borderRight: borderThin }}>100g</th>
                 <th style={{ fontSize: '9pt' }}>%VD*</th>
              </tr>
            </thead>
            <tbody>
              {col1.map((n1, i) => {
                const n2 = col2[i];
                return (
                  <tr key={n1.key} style={{ borderBottom: borderThin }}>
                    <td style={{ fontSize: '9pt', paddingLeft: `${4 + n1.recuo * 6}px`, borderRight: borderThin, whiteSpace: 'nowrap' }}>{n1.label} {n1.unidade}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n1.key] ?? '0'}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThick }}>{tabela.percentualVD[n1.key] ? `${tabela.percentualVD[n1.key]}%` : '0%'}</td>
                    <td style={{ fontSize: '9pt', paddingLeft: n2 ? `${4 + n2.recuo * 6}px` : '0', borderRight: borderThin, whiteSpace: 'nowrap' }}>{n2 ? `${n2.label} ${n2.unidade}` : ''}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'center', borderRight: borderThin }}>{n2 ? (tabela.por100g[n2.key] ?? '0') : ''}</td>
                    <td style={{ fontSize: '9pt', textAlign: 'center' }}>{n2 ? (tabela.percentualVD[n2.key] ? `${tabela.percentualVD[n2.key]}%` : '0%') : ''}</td>
                  </tr>
                );
              })}
            </tbody>
         </table>
         <div style={{ fontSize: '8pt', marginTop: '2px' }}>*Percentual de valores diários fornecidos pela porção.</div>
      </div>
    </div>
  );
});
TabelaHorizontalQuebrada.displayName = 'TabelaHorizontalQuebrada';

// 5. LINEAR
export const TabelaLinear = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
    const { infoPorcao, por100g, porPorcao, percentualVD } = tabela;
    const nutrientes = getAllNutrientes(tabela);
    const medida = formatarMedidaCaseira(tabela.infoPorcao);
    const porcaoFmt = formatarNumero(tabela.infoPorcao.porcao_g_ml);
    
    const itensTexto = nutrientes.map(n => {
      const v100 = por100g[n.key] ?? '0';
      const vPorc = porPorcao[n.key] ?? '0';
      const vd = percentualVD[n.key] ? `${percentualVD[n.key]}%` : '0%';
      const label = n.key === 'energia_kcal' ? 'Valor energético' : n.label;
      const un = n.unidade;
      return `${label} ${v100}${un} (${vPorc}${un}, ${vd})`;
    });

    return (
      <div ref={ref} style={{ padding: '6px', border: borderThick, fontFamily: font, background: 'var(--mui-palette-background-paper)', color: 'text.primary' }}>
        <div style={{ fontSize: '9pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>INFORMAÇÃO NUTRICIONAL:</div>
        <div style={{ fontSize: '9pt', lineHeight: 1.4, textAlign: 'justify' }}>
           Porções por embalagem: {infoPorcao.total_porcoes_embalagem}. Porção: {medida}.
           {' '}
           Por 100 g ({porcaoFmt} g, %VD*): {itensTexto.join('; ')}.
           {' '}
           *Percentual de valores diários fornecidos pela porção.
        </div>
      </div>
    );
});
TabelaLinear.displayName = 'TabelaLinear';

export function RenderBlocoDeclaracoes({ declaracoes }: { declaracoes: DeclaracoesObrigatorias }) {
  const { lista_ingredientes, contem_gluten, contem_lactose, alergenicos } = declaracoes;
  
  let ingredientesTexto = lista_ingredientes || '...';
  ingredientesTexto = ingredientesTexto.replace(/^ingredientes:?\s*/i, '').toLowerCase();
  if (ingredientesTexto.length > 0) ingredientesTexto = ingredientesTexto.charAt(0).toUpperCase() + ingredientesTexto.slice(1);

  let alergenicosTexto = alergenicos || '';
  if (alergenicosTexto && /[^.]\s+PODE CONTER/.test(alergenicosTexto)) {
     alergenicosTexto = alergenicosTexto.replace(/([^.])\s+PODE CONTER/, "$1. PODE CONTER");
  }

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px dashed #999', fontFamily: font, bgcolor: 'background.paper' }}>
      <Typography sx={{ fontSize: '10pt', mb: 1, color: '#000', lineHeight: 1.4 }}>
        <strong>Ingredientes:</strong> {ingredientesTexto}
      </Typography>
      {alergenicosTexto && (
        <Typography sx={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', mb: 1, color: '#000' }}>
            {alergenicosTexto}
        </Typography>
      )}
      <Typography sx={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
        {contem_gluten ? "CONTÉM GLÚTEN." : "NÃO CONTÉM GLÚTEN."} {contem_lactose ? "CONTÉM LACTOSE." : ""}
      </Typography>
    </Box>
  );
}

// === COMPONENTE PADRÃO (TODOS OS MODELOS) ===
export default function NutritionalLabel({ tabela, modelo = 'VERTICAL' }: { tabela: ResultadoCalculo, modelo?: 'VERTICAL' | 'VERTICAL_QUEBRADA' | 'HORIZONTAL' | 'HORIZONTAL_QUEBRADA' | 'LINEAR' }) {
    return (
        <Box>
            {modelo === 'VERTICAL' && <TabelaVertical tabela={tabela} />}
            {modelo === 'VERTICAL_QUEBRADA' && <TabelaVerticalQuebrada tabela={tabela} />}
            {modelo === 'HORIZONTAL' && <TabelaHorizontal tabela={tabela} />}
            {modelo === 'HORIZONTAL_QUEBRADA' && <TabelaHorizontalQuebrada tabela={tabela} />}
            {modelo === 'LINEAR' && <TabelaLinear tabela={tabela} />}
            
            <RenderBlocoDeclaracoes declaracoes={tabela.declaracoes} />
        </Box>
    );
}