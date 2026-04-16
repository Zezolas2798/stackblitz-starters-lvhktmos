import React from 'react';
import { Box, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button, alpha, useTheme, Chip, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CalculateIcon from '@mui/icons-material/Calculate';
import LoadingButton from '@mui/lab/LoadingButton';
import NutritionalLabel, { LupaFrontalANVISA, GMOIcon } from '@/components/NutritionalLabel';
import { ResultadoCalculo } from '@/lib/types';

type TabelaLayout = 'VERTICAL' | 'VERTICAL_QUEBRADA' | 'HORIZONTAL' | 'HORIZONTAL_QUEBRADA' | 'LINEAR';
type LupaLayout = 'VERTICAL' | 'HORIZONTAL' | 'V1' | 'V2' | 'V3';

interface RotulagemTabProps {
  isHistorico: boolean;
  tabela: ResultadoCalculo | null;
  receitaExibida: any;
  calculating: boolean;
  handleCalculate: () => void;
  layoutTabela: TabelaLayout;
  setLayoutTabela: (v: TabelaLayout) => void;
  lupaLayout: LupaLayout;
  setLupaLayout: (v: LupaLayout) => void;
  tabelaRef: React.RefObject<HTMLDivElement>;
  handleDownloadJPEG: () => void;
  versaoSelecionadaId: string | null;
  dadosCliente?: {
    razao_social: string;
    cnpj: string;
    endereco: string;
    nacionalidade: string;
  } | null;
}

export default function RotulagemTab({
  isHistorico, tabela, receitaExibida, calculating, handleCalculate,
  layoutTabela, setLayoutTabela, lupaLayout, setLupaLayout,
  tabelaRef, handleDownloadJPEG, versaoSelecionadaId, dadosCliente
}: RotulagemTabProps) {
  const theme = useTheme();
  
  return (
      <Box>
        {isHistorico && <Chip label="Arquivo Morto" color="warning" variant="outlined" sx={{ mb: 2 }} />}

        {!tabela && !isHistorico && (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', border: '2px dashed #eee', borderRadius: 2 }}>
                <LoadingButton onClick={handleCalculate} loading={calculating} startIcon={<CalculateIcon />} variant="contained" size="large">
                    Gerar Rótulo Nutricional
                </LoadingButton>
            </Box>
        )}

        {tabela && (
          <Box>
            <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: alpha(theme.palette.primary.main, 0.02), '@media print': { display: 'none' } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Formato da Tabela</InputLabel>
                    <Select value={layoutTabela} label="Formato da Tabela" onChange={(e) => setLayoutTabela(e.target.value as TabelaLayout)}>
                      <MenuItem value="VERTICAL">Vertical</MenuItem>
                      <MenuItem value="VERTICAL_QUEBRADA">Vertical Quebrada</MenuItem>
                      <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                      <MenuItem value="HORIZONTAL_QUEBRADA">Horizontal Quebrada</MenuItem>
                      <MenuItem value="LINEAR">Linear</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Layout da Lupa</InputLabel>
                    <Select value={lupaLayout} label="Layout da Lupa" onChange={(e) => setLupaLayout(e.target.value as LupaLayout)}>
                       <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                      <MenuItem value="VERTICAL">Vertical</MenuItem>
                      <MenuItem value="V1">Misto V1</MenuItem>
                      <MenuItem value="V2">Misto V2</MenuItem>
                      <MenuItem value="V3">Misto V3</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Button fullWidth variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={handleDownloadJPEG}>
                        Baixar Rótulo
                    </Button>
                </Grid>
              </Grid>
            </Paper>

            <Box 
                sx={{ 
                    bgcolor: '#fff', p: 4, border: '1px solid #eee', borderRadius: 2, 
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    opacity: isHistorico ? 0.9 : 1,
                    position: 'relative',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }} 
                ref={tabelaRef}
            >
              {isHistorico && (
                  <Box sx={{ position: 'absolute', top: 20, right: 20, border: '2px solid red', color: 'red', p: 1, transform: 'rotate(15deg)', fontWeight: 'bold', fontSize: '1.5rem', opacity: 0.2, zIndex: 10 }}>
                      CÓPIA CONTROLADA
                  </Box>
              )}
              <Box sx={{ mb: 2, width: '100%', textAlign: 'left', px: 2 }}>
                  {receitaExibida.denominacao_venda && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000', fontSize: '10pt', mb: 1 }}>
                      {receitaExibida.denominacao_venda}
                    </Typography>
                  )}
              </Box>

              <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  {tabela.declaracoes?.alerta_gmo && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <GMOIcon width={50} />
                    </Box>
                  )}
                  <LupaFrontalANVISA lupas={tabela.lupas} areaPainelCm2={receitaExibida.area_painel_principal_cm2} layout={lupaLayout} />
              </Box>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <NutritionalLabel tabela={tabela} modelo={layoutTabela} />
                {receitaExibida.conteudo_liquido && (
                  <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000', fontSize: '10pt', mt: 2, width: '240px', textAlign: 'left' }}>
                    {receitaExibida.conteudo_liquido}
                  </Typography>
                )}

                {/* Bloco de Fabricante Automatizado */}
                {dadosCliente && (
                  <Box sx={{ width: '240px', mt: 2, textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#000', display: 'block', lineHeight: 1.1 }}>
                      {dadosCliente.nacionalidade === 'Brasil' ? 'Indústria Brasileira' : `Fabricado em ${dadosCliente.nacionalidade}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#000', display: 'block', mt: 1, lineHeight: 1.2, fontSize: '7pt' }}>
                      <strong>Fabricado por:</strong> {dadosCliente.razao_social}<br/>
                      <strong>CNPJ:</strong> {dadosCliente.cnpj}<br/>
                      {dadosCliente.endereco && <><strong>Endereço:</strong> {dadosCliente.endereco}</>}
                    </Typography>
                  </Box>
                )}

                {!dadosCliente && receitaExibida.fabricado_em && (
                  <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#000', fontSize: '10pt', mt: 1, width: '240px', textAlign: 'left' }}>
                    {receitaExibida.fabricado_em}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
  );
}
