// components/NutritionalLabel.tsx
'use client';

import React from 'react';
import { Box, Typography, Stack, Tooltip } from '@mui/material';
import { ResultadoCalculo, LupasFrontais, DeclaracoesObrigatorias, InfoPorcao } from '@/lib/types';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SVG_TEMPLATES } from '@/lib/svg-templates';

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
// ANVISA Nutrient Order according to IN 75/2020
const NUTRIENT_ORDER = ['acucar', 'gordura', 'sodio'];

// Map labels to ANVISA standard line breaks
const LABEL_LINES: Record<string, string[]> = {
  acucar: ["AÇÚCAR", "ADICIONADO"],
  gordura: ["GORDURA", "SATURADA"],
  sodio: ["SÓDIO", ""]
};

// =====================================================================
// ANVISA Front-of-Pack (FOP) - Pure CSS Implementation (IN 75/2020)
// =====================================================================

/**
 * Geometric standards according to IN 75/2020:
 * Y = Height reference (Standard usually 4.8mm or 4.77mm)
 * Z = Width reference (Standard usually 1.2mm or 1.19mm)
 * Block Height = 3Y
 * Block Width = 8Y
 * Gaps = 2Z
 * Lupa Height = 1.7Y
 */
const Y = 4.8; // mm
const Z = 1.2; // mm

const mm = (val: number) => `${val}mm`;

type Alerta = { id: string; label: string; line1: string; line2: string };

const ALERTS_CONFIG: Record<string, Alerta> = {
  acucar: { id: 'acucar', label: 'AÇÚCAR', line1: 'AÇÚCAR', line2: 'ADICIONADO' },
  gordura: { id: 'gordura', label: 'GORDURA', line1: 'GORDURA', line2: 'SATURADA' },
  sodio: { id: 'sodio', label: 'SÓDIO', line1: 'SÓDIO', line2: '' },
};

function LupaIconCSS({ blocksSpanned = 1 }: { blocksSpanned?: number }) {
  // According to IN 75/2020:
  // Height of Lupa icon itself is 1.7Y (Circle)
  // But if it spans multiple blocks, the container height is (blocksSpanned * 3Y) + ((blocksSpanned - 1) * 2Z)
  const totalHeight = (blocksSpanned * 3 * Y) + ((blocksSpanned - 1) * 2 * Z);
  
  return (
    <Box sx={{ 
      width: mm(6 * Z), // Icon container width
      height: mm(totalHeight), 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      mr: mm(1.5 * Z),
      flexShrink: 0
    }}>
      {/* Search Circle (1.7Y) */}
      <Box sx={{
        width: mm(1.7 * Y),
        height: mm(1.7 * Y),
        border: `${mm(1.4 * Z)} solid black`,
        borderRadius: '50%',
        position: 'absolute',
        top: blocksSpanned === 1 ? mm(0.15 * Y) : '50%',
        transform: blocksSpanned === 1 ? 'none' : 'translateY(-60%)',
      }} />
      {/* Handle (1.2Z) */}
      <Box sx={{
        width: mm(1.2 * Z),
        height: mm(1.2 * Z),
        backgroundColor: 'black',
        position: 'absolute',
        top: blocksSpanned === 1 ? mm(2.3 * Y) : '55%',
        right: mm(0.1 * Z),
        transform: 'rotate(45deg)'
      }} />
    </Box>
  );
}

function NutrientBlock({ alerta }: { alerta: Alerta }) {
  return (
    <Box sx={{
      width: mm(8 * Y),
      height: mm(3 * Y),
      backgroundColor: 'black',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", "Arial", sans-serif',
      boxSizing: 'border-box',
      flexShrink: 0
    }}>
      <Typography sx={{ 
        fontSize: mm(0.6 * Y),
        fontWeight: 700, 
        lineHeight: 1,
        mb: mm(0.1 * Y),
        textTransform: 'uppercase'
      }}>
        ALTO EM
      </Typography>
      <Typography sx={{ 
        fontSize: mm(0.9 * Y),
        fontWeight: 900, 
        lineHeight: 0.9,
        textAlign: 'center',
        textTransform: 'uppercase'
      }}>
        {alerta.line1}<br/>{alerta.line2}
      </Typography>
    </Box>
  );
}

import { AnvisaFopLabel, AnvisaAlerta, AnvisaLayout } from './AnvisaFopLabel';

export function LupaFrontalANVISA({ lupas, layout = 'VERTICAL', areaPainelCm2 }: { lupas: LupasFrontais, layout?: string, areaPainelCm2?: number | null }) {
  const alertas: AnvisaAlerta[] = [];
  if (lupas?.alto_em_acucar_adicionado) alertas.push('AÇÚCAR ADICIONADO');
  if (lupas?.alto_em_gordura_saturada) alertas.push('GORDURA SATURADA');
  if (lupas?.alto_em_sodio) alertas.push('SÓDIO');

  if (alertas.length === 0) return null;

  // Map incoming layout string to AnvisaLayout type
  let safeLayout: AnvisaLayout = 'VERTICAL';
  if (['HORIZONTAL', 'V1', 'V2', 'V3', 'VERTICAL'].includes(layout)) {
    safeLayout = layout as AnvisaLayout;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, overflow: 'visible' }}>
      <Tooltip title={`FOP ANVISA (Arquitetura Sênior) - Layout: ${layout}`}>
        <Box sx={{ 
          // Scale it down for the UI since 22mm/7mm is very large
          transformOrigin: 'top center',
          zoom: 0.5 
        }}>
          <AnvisaFopLabel 
            alertas={alertas} 
            layout={safeLayout}
          />
        </Box>
      </Tooltip>
    </Box>
  );
}

// =====================================================================
// PARTE 2: TABELAS NUTRICIONAIS (ANVISA RDC 429/2020)
// =====================================================================

const font = '"Arial", sans-serif';
const borderThick = '3px solid black'; 
const borderMedium = '1px solid black';
const borderThin = '0.25px solid black';
const fontSizeTitle = '10px';
const fontSizeLabel = '8px';
const fontSizeFooter = '6px';
const bullet = ' ● '; 

const getIndent = (level: number) => {
  if (level === 1) return '4.5px';
  if (level === 2) return '9px';
  return '0';
};


const ALL_NUTRIENTS_REGISTRY = [
  { key: 'energia_kcal', label: 'Valor energético', unidade: 'kcal', recuo: 0, mandatory: true },
  { key: 'carboidrato_g', label: 'Carboidratos', unidade: 'g', recuo: 0, mandatory: true },
  { key: 'acucar_total_g', label: 'Açúcares totais', unidade: 'g', recuo: 1, mandatory: true },
  { key: 'acucar_adicionado_g', label: 'Açúcares adicionados', unidade: 'g', recuo: 2, mandatory: true },
  { key: 'lactose_g', label: 'Lactose', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'galactose_g', label: 'Galactose', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'poliois_totais_g', label: 'Polióis totais', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'sorbitol_g', label: 'Sorbitol', unidade: 'g', recuo: 2, mandatory: false },
  { key: 'manitol_g', label: 'Manitol', unidade: 'g', recuo: 2, mandatory: false },
  { key: 'xilitol_g', label: 'Xilitol', unidade: 'g', recuo: 2, mandatory: false },
  { key: 'maltitol_g', label: 'Maltitol', unidade: 'g', recuo: 2, mandatory: false },
  { key: 'eritritol_g', label: 'Eritritol', unidade: 'g', recuo: 2, mandatory: false },
  { key: 'amido_g', label: 'Amido', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'proteina_g', label: 'Proteínas', unidade: 'g', recuo: 0, mandatory: true },
  { key: 'lipideos_g', label: 'Gorduras totais', unidade: 'g', recuo: 0, mandatory: true },
  { key: 'gordura_saturada_g', label: 'Gorduras saturadas', unidade: 'g', recuo: 1, mandatory: true },
  { key: 'gordura_trans_g', label: 'Gorduras trans', unidade: 'g', recuo: 1, mandatory: true },
  { key: 'gordura_mono_g', label: 'Gorduras monoinsaturadas', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'gordura_poli_g', label: 'Gorduras poli-insaturadas', unidade: 'g', recuo: 1, mandatory: false },
  { key: 'colesterol_mg', label: 'Colesterol', unidade: 'mg', recuo: 1, mandatory: false },
  { key: 'fibra_alimentar_g', label: 'Fibra alimentar', unidade: 'g', recuo: 0, mandatory: true },
  { key: 'sodio_mg', label: 'Sódio', unidade: 'mg', recuo: 0, mandatory: true },
];

const VITAMIN_MINERAL_MAP: Record<string, { label: string, unidade: string }> = {
  'vitamina_a_mcg': { label: 'Vitamina A', unidade: 'mcg' },
  'vitamina_d_mcg': { label: 'Vitamina D', unidade: 'mcg' },
  'vitamina_e_mg': { label: 'Vitamina E', unidade: 'mg' },
  'vitamina_k_mcg': { label: 'Vitamina K', unidade: 'mcg' },
  'vitamina_c_mg': { label: 'Vitamina C', unidade: 'mg' },
  'vitamina_b1_mg': { label: 'Vitamina B1', unidade: 'mg' },
  'vitamina_b2_mg': { label: 'Vitamina B2', unidade: 'mg' },
  'vitamina_b3_mg': { label: 'Vitamina B3', unidade: 'mg' },
  'vitamina_b5_mg': { label: 'Vitamina B5', unidade: 'mg' },
  'vitamina_b6_mg': { label: 'Vitamina B6', unidade: 'mg' },
  'vitamina_b7_mcg': { label: 'Vitamina B7', unidade: 'mcg' },
  'vitamina_b9_mcg': { label: 'Vitamina B9', unidade: 'mcg' },
  'vitamina_b12_mcg': { label: 'Vitamina B12', unidade: 'mcg' },
  'calcio_mg': { label: 'Cálcio', unidade: 'mg' },
  'cloreto_mg': { label: 'Cloreto', unidade: 'mg' },
  'cobre_mcg': { label: 'Cobre', unidade: 'mcg' },
  'cromo_mcg': { label: 'Cromo', unidade: 'mcg' },
  'ferro_mg': { label: 'Ferro', unidade: 'mg' },
  'fluor_mg': { label: 'Flúor', unidade: 'mg' },
  'fosforo_mg': { label: 'Fósforo', unidade: 'mg' },
  'iodo_mcg': { label: 'Iodo', unidade: 'mcg' },
  'magnesio_mg': { label: 'Magnésio', unidade: 'mg' },
  'manganes_mg': { label: 'Manganês', unidade: 'mg' },
  'molibdenio_mcg': { label: 'Molibdênio', unidade: 'mcg' },
  'potassio_mg': { label: 'Potássio', unidade: 'mg' },
  'selenio_mcg': { label: 'Selênio', unidade: 'mcg' },
  'zinco_mg': { label: 'Zinco', unidade: 'mg' },
};

const getAllNutrientes = (tabela: ResultadoCalculo) => {
  const condsorted = (tabela.nutrientesCondicionais || []).sort();
  const list = ALL_NUTRIENTS_REGISTRY.filter(n => {
    if (n.mandatory) return true;
    if (tabela.nutrientesCondicionais?.includes(n.key)) return true;
    // Fallback: se tiver valor significativo (ex: vindo de ingrediente sem CLAIM mas o usuário quer mostrar)
    const val = parseFloat(tabela.por100g[n.key] || '0');
    return val > 0;
  });

  // Adicionar Vitaminas e Minerais ao final
  const vits = condsorted
    .filter(k => VITAMIN_MINERAL_MAP[k])
    .map(k => ({
      key: k,
      label: VITAMIN_MINERAL_MAP[k].label,
      unidade: VITAMIN_MINERAL_MAP[k].unidade,
      recuo: 0,
      mandatory: false
    }));

  return [...list, ...vits];
};


export const TabelaVertical = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);
  const porcaoCabecalho = formatarNumero(tabela.infoPorcao.porcao_g_ml);

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '240px', padding: '0', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ padding: '8px 4px', borderBottom: borderThin, textAlign: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', letterSpacing: '0.02em', textTransform: 'uppercase' }}>INFORMAÇÃO NUTRICIONAL</div>
      </div>
      <div style={{ fontSize: fontSizeLabel, padding: '4px 6px', borderBottom: borderThick, lineHeight: '1.2' }}>
        Porções por embalagem: {tabela.infoPorcao.total_porcoes_embalagem} <br />
        Porção: {medida}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: borderMedium }}>
            <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', borderRight: borderThin }}></th>
            <th style={{ width: '45px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
            <th style={{ width: '50px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
            <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
          </tr>
        </thead>
        <tbody>
          {nutrientes.map((n) => (
            <tr key={n.key} style={{ borderBottom: borderThin }}>
              <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                {n.label} {n.unidade ? `(${n.unidade})` : ''}
              </td>
              <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin, padding: '2px 4px' }}>{tabela.por100g[n.key] ?? '0'}</td>
              <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin, padding: '2px 4px' }}>{tabela.porPorcao[n.key] ?? '0'}</td>
              <td style={{ fontSize: fontSizeLabel, textAlign: 'center', padding: '2px 4px' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: fontSizeFooter, padding: '4px 6px', borderTop: borderThin, lineHeight: '1.1' }}>
        *Percentual de valores diários fornecidos pela porção.
        {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
      </div>
    </div>
  );
});
TabelaVertical.displayName = 'TabelaVertical';


export const TabelaVerticalQuebrada = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const splitIndex = Math.ceil(nutrientes.length / 2);
  const col1 = nutrientes.slice(0, splitIndex);
  const col2 = nutrientes.slice(splitIndex);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);
  const porcaoCabecalho = formatarNumero(tabela.infoPorcao.porcao_g_ml);

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '450px', padding: '0', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ padding: '8px 4px', borderBottom: borderThin, textAlign: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', letterSpacing: '0.02em', textTransform: 'uppercase' }}>INFORMAÇÃO NUTRICIONAL</div>
      </div>
      <div style={{ fontSize: fontSizeLabel, padding: '4px 6px', borderBottom: borderThick, lineHeight: '1.2' }}>
        Porções por embalagem: {tabela.infoPorcao.total_porcoes_embalagem} {bullet} Porção: {medida}
      </div>
      <div style={{ display: 'flex' }}>
        <table style={{ width: '50%', borderCollapse: 'collapse', borderRight: borderMedium }}>
          <thead>
            <tr style={{ borderBottom: borderMedium }}>
              <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', borderRight: borderThin }}></th>
              <th style={{ width: '35px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
              <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
              <th style={{ width: '30px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {col1.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                  {n.label} ({n.unidade})
                </td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: '50%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: borderMedium }}>
              <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', borderRight: borderThin }}></th>
              <th style={{ width: '35px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
              <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
              <th style={{ width: '30px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {col2.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                  {n.label} ({n.unidade})
                </td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain symmetry if needed */}
            {Array.from({ length: Math.max(0, col1.length - col2.length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: borderThin }}><td colSpan={4}>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: fontSizeFooter, padding: '4px 6px', borderTop: borderThin, lineHeight: '1.1' }}>
        *Percentual de valores diários fornecidos pela porção.
        {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
      </div>
    </div>
  );
});
TabelaVerticalQuebrada.displayName = 'TabelaVerticalQuebrada';


export const TabelaHorizontal = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(tabela.infoPorcao);
  const porcaoCabecalho = formatarNumero(tabela.infoPorcao.porcao_g_ml);

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '450px', display: 'flex', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ width: '40%', padding: '6px', borderRight: borderThick, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', marginBottom: '8px', lineHeight: '1', textAlign: 'left', textTransform: 'uppercase' }}>
          INFORMAÇÃO<br/>NUTRICIONAL
        </div>
        <div style={{ fontSize: fontSizeLabel, lineHeight: '1.2' }}>Porções por emb.: {tabela.infoPorcao.total_porcoes_embalagem}</div>
        <div style={{ fontSize: fontSizeLabel, lineHeight: '1.2' }}>Porção: {medida}</div>
      </div>
      <div style={{ width: '60%', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: borderMedium }}>
              <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px' }}></th>
              <th style={{ width: '45px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
              <th style={{ width: '50px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
              <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {nutrientes.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                  {n.label} {n.unidade ? `(${n.unidade})` : ''}
                </td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
          <div style={{ fontSize: fontSizeFooter, padding: '4px 6px', borderTop: borderThin, lineHeight: '1.1', borderLeft: borderMedium }}>
            *Percentual de valores diários fornecidos pela porção.
            {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
          </div>
        </div>
      </div>
  );
});
TabelaHorizontal.displayName = 'TabelaHorizontal';


export const TabelaHorizontalQuebrada = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const { infoPorcao } = tabela;
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(infoPorcao);
  const porcaoCabecalho = formatarNumero(infoPorcao.porcao_g_ml);
  const splitIndex = Math.ceil(nutrientes.length / 2);
  const col1 = nutrientes.slice(0, splitIndex);
  const col2 = nutrientes.slice(splitIndex);

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '650px', display: 'flex', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ width: '25%', padding: '6px', borderRight: borderThick, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', marginBottom: '8px', lineHeight: '1', textAlign: 'left', textTransform: 'uppercase' }}>
          INFORMAÇÃO<br/>NUTRICIONAL
        </div>
        <div style={{ fontSize: fontSizeLabel, lineHeight: '1.2' }}>Porções por emb.: {infoPorcao.total_porcoes_embalagem}</div>
        <div style={{ fontSize: fontSizeLabel, lineHeight: '1.2' }}>Porção: {medida}</div>
      </div>
      <div style={{ width: '75%', display: 'flex' }}>
        <table style={{ width: '50%', borderCollapse: 'collapse', borderRight: borderMedium }}>
          <thead>
            <tr style={{ borderBottom: borderMedium }}>
              <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', borderRight: borderThin }}></th>
              <th style={{ width: '35px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
              <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
              <th style={{ width: '30px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {col1.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                  {n.label} ({n.unidade})
                </td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{ width: '50%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: borderMedium }}>
              <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', borderRight: borderThin }}></th>
              <th style={{ width: '35px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>100 g</th>
              <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px', textAlign: 'center' }}>{porcaoCabecalho} g</th>
              <th style={{ width: '30px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {col2.map((n) => (
              <tr key={n.key} style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                  {n.label} ({n.unidade})
                </td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.por100g[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{tabela.porPorcao[n.key] ?? '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{tabela.percentualVD[n.key] ? `${tabela.percentualVD[n.key]}%` : '0%'}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, col1.length - col2.length) }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: borderThin }}><td colSpan={4}>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: fontSizeFooter, padding: '4px 6px', borderTop: borderThin, lineHeight: '1.1' }}>
        *Percentual de valores diários fornecidos pela porção.
        {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
      </div>
    </div>
  );
});
TabelaHorizontalQuebrada.displayName = 'TabelaHorizontalQuebrada';



export const TabelaAgregada = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo, extras?: ResultadoCalculo[] }>(({ tabela, extras = [] }, ref) => {
  const todosProdutos = [tabela, ...extras];
  const nutrientes = getAllNutrientes(tabela);

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: 'fit-content', padding: '0', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ display: 'flex', borderBottom: borderMedium }}>
        <div style={{ padding: '8px 4px', borderRight: borderThick, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', flexShrink: 0 }}>
          <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>INFORMAÇÃO NUTRICIONAL</div>
        </div>
        {todosProdutos.map((p, idx) => (
          <div key={idx} style={{ padding: '4px 6px', flex: 1, borderRight: idx < todosProdutos.length - 1 ? borderThin : 'none', minWidth: '100px' }}>
            <div style={{ fontSize: fontSizeLabel, fontWeight: 'bold', borderBottom: borderThin, marginBottom: '2px' }}>Produto {idx + 1}</div>
            <div style={{ fontSize: '7px', lineHeight: '1' }}>Porções por emb.: {p.infoPorcao.total_porcoes_embalagem}</div>
            <div style={{ fontSize: '7px', lineHeight: '1' }}>Porção: {formatarNumero(p.infoPorcao.porcao_g_ml)}g ({p.infoPorcao.medida_caseira_nome})</div>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: borderMedium }}>
            <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, padding: '2px 4px' }}></th>
            {todosProdutos.map((_, idx) => (
              <React.Fragment key={idx}>
                <th style={{ fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: borderThin, textAlign: 'center', width: '40px' }}>100 g</th>
                <th style={{ fontSize: fontSizeLabel, fontWeight: 'bold', borderRight: idx < todosProdutos.length - 1 ? borderThin : 'none', textAlign: 'center', width: '35px' }}>%VD*</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {nutrientes.map((n) => (
            <tr key={n.key} style={{ borderBottom: borderThin }}>
              <td style={{ fontSize: fontSizeLabel, padding: '2px 4px', paddingLeft: `calc(4px + ${getIndent(n.recuo)})`, borderRight: borderThin, whiteSpace: 'nowrap' }}>
                {n.label} ({n.unidade})
              </td>
              {todosProdutos.map((p, idx) => (
                <React.Fragment key={idx}>
                  <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: borderThin }}>{p.por100g[n.key] ?? '0'}</td>
                  <td style={{ fontSize: fontSizeLabel, textAlign: 'center', borderRight: idx < todosProdutos.length - 1 ? borderThin : 'none' }}>{p.percentualVD[n.key] ? `${p.percentualVD[n.key]}%` : '0%'}</td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: fontSizeFooter, padding: '4px 6px', borderTop: borderThin, lineHeight: '1.1' }}>
        *Percentual de valores diários fornecidos pela porção.
        {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
      </div>
    </div>
  );
});
TabelaAgregada.displayName = 'TabelaAgregada';

export const TabelaIsenta = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const { declaracoes, infoPorcao, por100g, porPorcao } = tabela;
  const isAlcohol = declaracoes.tipoIsencao === 'ALCOOL';
  const fontSizeLabel = '8.5px';
  const fontSizeTitle = '14px';

  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '450px', padding: '0', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ padding: '8px 4px', borderBottom: borderThin, textAlign: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', letterSpacing: '0.02em', textTransform: 'uppercase' }}>INFORMAÇÃO NUTRICIONAL</div>
      </div>
      
      {isAlcohol ? (
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 'bold', mb: 1, textTransform: 'uppercase' }}>
            Bebida Alcoólica - Isenta de Tabela Completa
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: borderMedium }}>
                <th style={{ textAlign: 'left', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px' }}>CONSTITUINTE</th>
                <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>100 g</th>
                <th style={{ width: '40px', fontSize: fontSizeLabel, fontWeight: 'bold', padding: '2px 4px', textAlign: 'center' }}>Porção</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: borderThin }}>
                <td style={{ fontSize: fontSizeLabel, padding: '4px 6px' }}>Valor energético (kcal)</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{por100g['energia_kcal'] || '0'}</td>
                <td style={{ fontSize: fontSizeLabel, textAlign: 'center' }}>{porPorcao['energia_kcal'] || '0'}</td>
              </tr>
            </tbody>
          </table>
          <Typography sx={{ fontSize: '8px', mt: 2, fontStyle: 'italic', borderTop: borderThin, pt: 1 }}>
            * Isento de declaração dos demais nutrientes conforme Anexo I da IN 75/2020.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>ALIMENTO ISENTO</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Este produto está dispensado da declaração de tabela nutricional.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Conforme IN 75/2020 - Anexo I: {declaracoes.tipoIsencao || 'Categoria Isenta'}
          </Typography>
        </Box>
      )}

      {declaracoes.instrucoes_preparo && (
        <div style={{ fontSize: '8px', padding: '6px', borderTop: borderThick, backgroundColor: '#f9f9f9', lineHeight: '1.2' }}>
          <strong>Instruções de Preparo:</strong> {declaracoes.instrucoes_preparo}
        </div>
      )}
    </div>
  );
});
TabelaIsenta.displayName = 'TabelaIsenta';

export const TabelaLinear = React.forwardRef<HTMLDivElement, { tabela: ResultadoCalculo }>(({ tabela }, ref) => {
  const { infoPorcao, por100g, porPorcao, percentualVD } = tabela;
  const nutrientes = getAllNutrientes(tabela);
  const medida = formatarMedidaCaseira(infoPorcao);
  const porcaoFmt = formatarNumero(infoPorcao.porcao_g_ml);

  const formatItem = (n: any) => {
    const v100 = por100g[n.key] ?? '0';
    const vPorc = porPorcao[n.key] ?? '0';
    const vd = percentualVD[n.key] ? `${percentualVD[n.key]}%` : '0%';
    const label = n.label;
    const un = n.unidade;
    
    let prefix = "";
    if (n.key === 'acucar_total_g') prefix = " dos quais ";
    if (n.key === 'acucar_adicionado_g') prefix = " ";
    if (n.key === 'gordura_saturada_g' || n.key === 'gordura_trans_g') prefix = " ";

    return (
      <span key={n.key}>
        {prefix}{label} {v100} {un} (<strong>{vPorc} {un}, {vd}</strong>)
      </span>
    );
  };
  
  return (
    <div ref={ref} style={{ border: borderThin, background: '#fff', width: '500px', fontFamily: font, color: '#231f20', boxSizing: 'border-box', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'black', color: 'white', padding: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: fontSizeTitle, fontWeight: 'bold', textTransform: 'uppercase' }}>INFORMAÇÃO NUTRICIONAL</div>
      </div>
      <div style={{ padding: '6px', fontSize: fontSizeLabel, lineHeight: '1.4', textAlign: 'justify' }}>
        <strong>Porções por embalagem:</strong> {infoPorcao.total_porcoes_embalagem} {bullet} <strong>Porção:</strong> {medida}.
        <br />
        <strong>Por 100 g ({porcaoFmt} g, %VD*):</strong>
        {' '}
        {nutrientes.map((n, idx) => {
           const isSubItem = n.recuo > 0;
           return (
            <React.Fragment key={n.key}>
              {idx > 0 && !isSubItem && bullet}
              {idx > 0 && isSubItem && ", "}
              {formatItem(n)}
            </React.Fragment>
           );
        })}
        <br />
        <div style={{ fontSize: fontSizeFooter, marginTop: '4px' }}>
          *Percentual de valores diários fornecidos pela porção.
          {tabela.declaracoes.is_preparo && tabela.declaracoes.nota_preparo && <div style={{ marginTop: '2px' }}>{tabela.declaracoes.nota_preparo}</div>}
        </div>
      </div>
    </div>
  );
});
TabelaLinear.displayName = 'TabelaLinear';



export function GMOIcon({ width = 18 }: { width?: number }) {
  const height = width * (100 / 100);
  return (
    <Box 
      component="span"
      sx={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mr: 0.8,
        verticalAlign: 'middle',
        lineHeight: 0,
        flexShrink: 0
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Triângulo Equilátero - Proporção Real */}
        <path d="M50 5 L95 83 H5 L50 5 Z" fill="#FEE000" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
        {/* Letra T - Proporção Frutiger Bold (Oficial) */}
        <path d="M35 32 h30 v12 h-8 v30 h-14 v-30 h-8 z" fill="black"/>
      </svg>
    </Box>
  );
}

export default function NutritionalLabel({ tabela, modelo = 'VERTICAL', extras = [], showDeclarations = true }: { tabela: ResultadoCalculo, modelo?: 'VERTICAL' | 'VERTICAL_QUEBRADA' | 'HORIZONTAL' | 'HORIZONTAL_QUEBRADA' | 'LINEAR' | 'AGREGADA', extras?: ResultadoCalculo[], showDeclarations?: boolean }) {
  if (tabela.declaracoes.isIsento) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
        <TabelaIsenta tabela={tabela} />
        {showDeclarations && (
          <Box sx={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
            <RenderBlocoDeclaracoes declaracoes={tabela.declaracoes} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
      {modelo === 'VERTICAL' && <TabelaVertical tabela={tabela} />}
      {modelo === 'VERTICAL_QUEBRADA' && <TabelaVerticalQuebrada tabela={tabela} />}
      {modelo === 'HORIZONTAL' && <TabelaHorizontal tabela={tabela} />}
      {modelo === 'HORIZONTAL_QUEBRADA' && <TabelaHorizontalQuebrada tabela={tabela} />}
      {modelo === 'LINEAR' && <TabelaLinear tabela={tabela} />}
      {modelo === 'AGREGADA' && <TabelaAgregada tabela={tabela} extras={extras} />}
      
      {showDeclarations && (
        <Box sx={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
          <RenderBlocoDeclaracoes declaracoes={tabela.declaracoes} />
        </Box>
      )}
    </Box>
  );
}

export function RenderBlocoDeclaracoes({ declaracoes }: { declaracoes: DeclaracoesObrigatorias }) {
  const { 
    lista_ingredientes, 
    contem_gluten, 
    contem_lactose, 
    alergenicos, 
    modo_conservacao,
    colorido_artificialmente,
    colorido_carmim,
    alerta_gmo,
    alerta_laxativo,
    alerta_gluten,
    alerta_lactose,
    alertas_especificos,
    nota_preparo,
    instrucoes_preparo,
    is_preparo,
    fabricado_em,
    conteudo_liquido,
    denominacao_venda
  } = declaracoes;

  let ingredientesTexto = lista_ingredientes || '';
  if (ingredientesTexto) {
    ingredientesTexto = ingredientesTexto.replace(/^ingredientes:?\s*/i, '').toLowerCase();
    if (ingredientesTexto.length > 0) {
      ingredientesTexto = ingredientesTexto.charAt(0).toUpperCase() + ingredientesTexto.slice(1);
    }
  }

  let alergenicosTexto = (alergenicos || '').trim();
  if (alergenicosTexto) {
    // Garante que o ponto final exista
    if (!alergenicosTexto.endsWith('.')) alergenicosTexto += '.';
  }

  return (
    <Box sx={{ mt: 2, p: '4pt', border: borderMedium, fontFamily: font, bgcolor: 'background.paper', width: '100%', boxSizing: 'border-box' }}>
      {denominacao_venda && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', mb: '4pt', color: '#000', lineHeight: 1.2, borderBottom: '1px solid #eee', pb: '2pt' }}>
          <strong>DENOMINAÇÃO DE VENDA:</strong> {denominacao_venda}
        </Typography>
      )}
      <Typography sx={{ fontSize: fontSizeLabel, mb: '2pt', color: '#000', lineHeight: 1.2 }}>
        <strong>Ingredientes:</strong> {ingredientesTexto}
      </Typography>

      {alergenicosTexto && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', mb: '2pt', color: '#000', lineHeight: 1.1 }}>
          {alergenicosTexto}
        </Typography>
      )}

      {(alerta_lactose || contem_lactose) && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', lineHeight: 1.1 }}>
          {alerta_lactose || "CONTÉM LACTOSE."}
        </Typography>
      )}

      <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', lineHeight: 1.1 }}>
          {alerta_gluten || (contem_gluten ? "CONTÉM GLÚTEN." : "NÃO CONTÉM GLÚTEN.")}
      </Typography>

      {declaracoes.alerta_gmo && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', mt: '2pt', lineHeight: 1.1 }}>
          {declaracoes.alerta_gmo}
        </Typography>
      )}



      {alertas_especificos && alertas_especificos.length > 0 && alertas_especificos.map((txt: string, i: number) => (
        <Typography key={i} sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', mt: '2pt', lineHeight: 1.1 }}>
          {txt}
        </Typography>
      ))}

      {colorido_artificialmente && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', mt: '2pt', lineHeight: 1.1 }}>
          COLORIDO ARTIFICIALMENTE.
        </Typography>
      )}

      {colorido_carmim && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', mt: '2pt', lineHeight: 1.1 }}>
          CONTÉM CORANTE CARMIM DE COCHONILHA.
        </Typography>
      )}

      {alerta_laxativo && (
        <Typography sx={{ fontSize: fontSizeLabel, fontWeight: 900, textTransform: 'uppercase', color: '#000', mt: '2pt', lineHeight: 1.1 }}>
          {alerta_laxativo}.
        </Typography>
      )}


      {is_preparo && instrucoes_preparo && (
        <Typography sx={{ fontSize: fontSizeLabel, color: '#000', mt: '4pt', lineHeight: 1.1, fontStyle: 'italic' }}>
          <strong>Preparo:</strong> {instrucoes_preparo}
        </Typography>
      )}

      {modo_conservacao && (
        <Typography sx={{ fontSize: fontSizeLabel, color: '#000', mt: '4pt', lineHeight: 1.1 }}>
          <strong>Modo de conservação:</strong> {modo_conservacao}
        </Typography>
      )}
      
      {fabricado_em && (
        <Typography sx={{ fontSize: fontSizeLabel, color: '#000', mt: '4pt', lineHeight: 1.1 }}>
          <strong>{fabricado_em}</strong>
        </Typography>
      )}

      {conteudo_liquido && (
        <Typography sx={{ fontSize: fontSizeLabel, color: '#000', mt: '4pt', lineHeight: 1.1 }}>
          <strong>PESO LÍQUIDO:</strong> {conteudo_liquido}
        </Typography>
      )}

    </Box>
  );
}
