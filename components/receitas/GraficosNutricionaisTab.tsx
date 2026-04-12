import React from 'react';
import { Box, Stack, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography, Tabs, Tab, Paper, useTheme, alpha, Alert, Divider } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { AlertTriangle } from 'lucide-react';
import LoadingButton from '@mui/lab/LoadingButton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { ResultadoCalculo } from '@/lib/types';

interface GraficosNutricionaisTabProps {
  isHistorico: boolean;
  tabela: ResultadoCalculo | null;
  abaSubGrafico: number;
  setAbaSubGrafico: (v: number) => void;
  receitaExibida: any;
  calculating: boolean;
  handleCalculate: () => void;
  composicaoDisplay: any[];
}

export default function GraficosNutricionaisTab({
  isHistorico, tabela, abaSubGrafico, setAbaSubGrafico,
  receitaExibida, calculating, handleCalculate, composicaoDisplay
}: GraficosNutricionaisTabProps) {
  const theme = useTheme();

  if (!tabela) {
      return (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', border: '2px dashed #eee', borderRadius: 2 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>Gere o rótulo nutricional primeiro para visualizar os gráficos.</Typography>
              {!isHistorico && (
                <LoadingButton onClick={handleCalculate} loading={calculating} startIcon={<CalculateIcon />} variant="contained" size="large" sx={{ mt: 2 }}>
                    Gerar Rótulo Nutricional
                </LoadingButton>
              )}
          </Box>
      );
  }

  const sourceData = abaSubGrafico === 0 ? tabela.por100g : tabela.porPorcao;
  const carbVal = parseFloat(sourceData?.carboidrato_g?.toString() || '0');
  const protVal = parseFloat(sourceData?.proteina_g?.toString() || '0');
  const lipVal = parseFloat(sourceData?.lipideos_g?.toString() || '0');
  
  const macroData = [
    { name: 'Carboidratos', value: carbVal, color: '#4FC3F7' },
    { name: 'Proteínas', value: protVal, color: '#81C784' },
    { name: 'Lipídeos', value: lipVal, color: '#FFB74D' },
  ].filter(d => d.value > 0);

  const NUTRIENT_LABELS: Record<string, string> = {
    energia_kcal: 'Energia',
    carboidrato_g: 'Carboidratos',
    acucar_total_g: 'Açúcares Totais',
    acucar_adicionado_g: 'Açúc. Adicionados',
    proteina_g: 'Proteínas',
    lipideos_g: 'Gorduras Totais',
    gordura_saturada_g: 'Gord. Saturadas',
    gordura_trans_g: 'Gord. Trans',
    fibra_alimentar_g: 'Fibra Alimentar',
    sodio_mg: 'Sódio',
  };
  
  const vdSource = abaSubGrafico === 0 ? (tabela.percentualVD100g || {}) : (tabela.percentualVD || {});
  const vdData = Object.entries(vdSource)
    .filter(([key]) => NUTRIENT_LABELS[key])
    .map(([key, val]) => ({
      nutriente: NUTRIENT_LABELS[key] || key,
      vd: parseFloat(val?.toString() || '0'),
    }))
    .filter(d => d.vd > 0)
    .sort((a, b) => b.vd - a.vd);


  const NOVA_LABELS: Record<number, string> = {
    1: 'In Natura / Min. Processado',
    2: 'Ingred. Culinário Processado',
    3: 'Alimento Processado',
    4: 'Ultraprocessado',
  };
  const NOVA_COLORS: Record<number, string> = {
    1: '#4CAF50',
    2: '#2196F3',
    3: '#FF9800',
    4: '#F44336',
  };

  const pesoTotal = composicaoDisplay.reduce((s, i) => s + (i.peso_liquido_g || 0), 0);
  const grupoMap: Record<number, number> = {};
  let pesoNaoClassificado = 0;

  composicaoDisplay.forEach(item => {
    const g = item.classificacao_nova;
    if (g && g >= 1 && g <= 4) {
      grupoMap[g] = (grupoMap[g] || 0) + (item.peso_liquido_g || 0);
    } else {
      pesoNaoClassificado += (item.peso_liquido_g || 0);
    }
  });

  const novaData = Object.entries(grupoMap).map(([g, peso]) => ({
    name: NOVA_LABELS[Number(g)],
    value: peso,
    pct: pesoTotal > 0 ? (peso / pesoTotal) * 100 : 0,
    color: NOVA_COLORS[Number(g)],
    grupo: Number(g),
  })).sort((a, b) => a.grupo - b.grupo);

  if (pesoNaoClassificado > 0) {
    novaData.push({
      name: 'Não classificado',
      value: pesoNaoClassificado,
      pct: pesoTotal > 0 ? (pesoNaoClassificado / pesoTotal) * 100 : 0,
      color: '#BDBDBD',
      grupo: 0,
    });
  }

  const pctUltra = grupoMap[4] ? ((grupoMap[4] / pesoTotal) * 100) : 0;


  return (
    <Stack spacing={4}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={abaSubGrafico} 
          onChange={(_, v) => setAbaSubGrafico(v)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Dados p/ 100g" />
          <Tab label={`Dados p/ Porção (${tabela.infoPorcao?.porcao_g_ml}${receitaExibida?.estado_alimento === 'liquido' ? 'ml' : 'g'})`} />
        </Tabs>
      </Box>

      {/* MACROS: TABELA + PIZZA */}
      <Typography variant="h6" fontWeight="bold" color="primary.main">
        Divisão de Macronutrientes ({abaSubGrafico === 0 ? '100g' : 'Porção'})
      </Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={7}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Macro</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Gramas</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Kcal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>% Kcal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>%VD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const totalKcal = carbVal * 4 + protVal * 4 + lipVal * 9;
                  const macroVdKeys: Record<string, string> = {
                    'Carboidratos': 'carboidrato_g',
                    'Proteínas': 'proteina_g',
                    'Lipídeos': 'lipideos_g',
                  };
                  return [
                    { nome: 'Carboidratos', g: carbVal, kcal: carbVal * 4, color: '#4FC3F7' },
                    { nome: 'Proteínas', g: protVal, kcal: protVal * 4, color: '#81C784' },
                    { nome: 'Lipídeos', g: lipVal, kcal: lipVal * 9, color: '#FFB74D' },
                  ].map(row => {
                    const vdKey = macroVdKeys[row.nome];
                    const vdVal = vdSource[vdKey];
                    return (
                      <TableRow key={row.nome}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.color }} />
                            {row.nome}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.g.toFixed(1)}g</TableCell>
                        <TableCell align="right">{row.kcal.toFixed(0)}</TableCell>
                        <TableCell align="right">{totalKcal > 0 ? ((row.kcal / totalKcal) * 100).toFixed(0) : 0}%</TableCell>
                        <TableCell align="right">{vdVal ? `${vdVal}%` : '-'}</TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart title="Macros">
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ percent }: any) => percent ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                  {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}g` : value} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      <Divider />

      {/* BARRAS: %VD */}
      <Typography variant="h6" fontWeight="bold" color="primary.main">Nutrientes vs. Valor Diário (%VD)</Typography>
      {vdData.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(300, vdData.length * 45)}>
          <BarChart data={vdData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, (max: number) => Math.max(max + 10, 100)]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="nutriente" width={130} tick={{ fontSize: 12 }} />
            <RechartsTooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
            <Bar dataKey="vd" name="% VD" radius={[0, 6, 6, 0]} barSize={20}>
              {vdData.map((entry, i) => (
                <Cell key={i} fill={entry.vd > 100 ? '#EF5350' : entry.vd > 50 ? '#FFA726' : '#66BB6A'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">Nenhum dado de %VD disponível.</Typography>
      )}

      {/* === CLASSIFICAÇÃO NOVA === */}
      {composicaoDisplay.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 4 }} />
            <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
              Classificação NOVA (Grau de Processamento)
            </Typography>

            {pctUltra > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }} icon={<AlertTriangle size={20} />}>
                <strong>{pctUltra.toFixed(1)}%</strong> do peso desta receita é composto por ingredientes <strong>ultraprocessados</strong> (Grupo 4 NOVA).
              </Alert>
            )}

            {novaData.length === 0 ? (
              <Alert severity="info">Nenhum ingrediente desta receita possui classificação NOVA cadastrada.</Alert>
            ) : (
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={5}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={novaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ pct }: any) => pct > 0 ? `${pct.toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {novaData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke={entry.grupo === 4 ? '#B71C1C' : undefined} strokeWidth={entry.grupo === 4 ? 2 : 0} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any, name: any) => [`${typeof value === 'number' ? value.toFixed(1) : value}g`, name]} />
                      <Legend verticalAlign="bottom" height={50} />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={7}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableCell sx={{ fontWeight: 700 }}>Grupo NOVA</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Peso (g)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>% Receita</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {novaData.map(row => (
                          <TableRow key={row.grupo} sx={row.grupo === 4 ? { bgcolor: alpha('#F44336', 0.05) } : {}}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                                <Typography variant="body2" fontWeight={row.grupo === 4 ? 700 : 400}>
                                  {row.grupo > 0 ? `G${row.grupo}` : ''} {row.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{row.value.toFixed(1)}g</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={row.grupo === 4 ? 800 : 400} color={row.grupo === 4 ? 'error.main' : 'text.primary'}>
                                {row.pct.toFixed(1)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </Box>
      )}
    </Stack>
  );
}
