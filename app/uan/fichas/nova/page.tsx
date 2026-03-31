'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { FichaTecnicaUAN, ComposicaoFichaUAN, Ingrediente, CategoriaUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, TextField, MenuItem,
  Grid, Divider, Autocomplete, IconButton, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Save, ArrowLeft, Trash2, PlusCircle, Calculator, ActivitySquare } from 'lucide-react';

const CATEGORIAS_UAN: CategoriaUAN[] = [
  'Prato Principal', 'Guarnição', 'Salada', 'Proteína',
  'Sobremesa', 'Sopa', 'Desjejum', 'Lanche', 'Bebida'
];

// Componentes Auxiliares para Tabela
const TableInput = ({ value, onChange, step = 1 }: { value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: number }) => (
  <TextField
    size="small"
    type="number"
    value={value}
    onChange={onChange}
    variant="standard"
    inputProps={{ step, style: { textAlign: 'center' } }}
    fullWidth
  />
);

const AutocompleteTextField = (props: any) => (
  <TextField
    {...props}
    size="small"
    variant="standard"
    FormHelperTextProps={{ sx: { m: 0, fontSize: '10px', color: 'orange' } }}
  />
);

export default function NovaFichaUANPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(false);
  const [ingredientesDB, setIngredientesDB] = useState<Ingrediente[]>([]);
  const [referenciasDB, setReferenciasDB] = useState<any[]>([]);

  // Modal de Analise
  const [modalOpen, setModalOpen] = useState(false);

  // Estado da Ficha
  const [ficha, setFicha] = useState<Partial<FichaTecnicaUAN>>({
    nome: '',
    categoria_uan: 'Prato Principal',
    rendimento_porcoes: 10,
    peso_porcao_g: 150,
    modo_preparo: '',
    tempo_preparo_min: 30
  });

  // Linhas da Composição
  const [linhas, setLinhas] = useState<(Partial<ComposicaoFichaUAN> & { ui_ingrediente?: Ingrediente | null, ui_referencia?: any | null })[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!activeClientId) return;
      
      // Consultas individuais para evitar "Deep Instantiation" no Promise.all
      const ingRes = await supabase.from('ingredientes').select('id, nome, preco_ultima_compra, tipo_ingrediente').eq('cliente_id', activeClientId).order('nome');
      const refRes = await (supabase.from('referencias_nutricionais' as any) as any).select('*').order('nome');

      if (ingRes.data) setIngredientesDB(ingRes.data as Ingrediente[]);
      if (refRes.data) setReferenciasDB(refRes.data);
    }
    loadData();
  }, [activeClientId]);

  // Handler para Linhas de Composição
  // Handler para Linhas de Composição (REFATORADO: Suporte a Multi-Updates e Functional State)
  const updateLinha = (idx: number, updates: any) => {
    setLinhas(prev => {
      const list = [...prev];
      const currentLine = { ...list[idx], ...updates };

      // Auto Calc: Fator de Correção e Peso Final
      const pb = Number(currentLine.peso_bruto_g || 0);
      const pl = Number(currentLine.peso_liquido_g || 0);
      const ic = Number(currentLine.indice_coccao || 1);

      if (pb > 0 && pl > 0) {
        currentLine.fator_correcao = Number((pb / pl).toFixed(4));
        if (!currentLine.indice_coccao) currentLine.indice_coccao = 1.0;
      }
      
      list[idx] = currentLine;
      return list;
    });
  };

  const calcCustoTotal = () => {
    let custo = 0;
    linhas.forEach(l => {
      const pesoKg = (Number(l.peso_bruto_g) || 0) / 1000;
      const preco = l.ui_ingrediente?.preco_ultima_compra || 0;
      custo += (pesoKg * preco);
    });
    return custo;
  };

  const handleSalvar = async () => {
    if (!activeClientId) return alert("Selecione um cliente.");
    if (!ficha.nome) return alert("Informe o nome da preparação.");
    if (linhas.length === 0) return alert("Adicione pelo menos um ingrediente.");

    // Função auxiliar para verificar se um campo está tecnicamente vazio
    const isEmpty = (v: any) => v === undefined || v === null || String(v).trim() === "";

    // 1. Filtrar linhas "fantasmas" (criadas por engano ou limpas pelo usuário)
    const linhasParaSalvar = linhas.filter(l => 
      !isEmpty(l.ingrediente_id) || !isEmpty(l.peso_bruto_g) || !isEmpty(l.peso_liquido_g) || !isEmpty(l.referencia_id)
    );

    if (linhasParaSalvar.length === 0) {
      return alert("Adicione pelo menos um ingrediente completo na tabela.");
    }

    // 2. Validar se os itens que restaram estão completos
    const temLinhaIncompleta = linhasParaSalvar.some(l => 
      isEmpty(l.ingrediente_id) || isEmpty(l.peso_bruto_g) || isEmpty(l.peso_liquido_g)
    );

    if (temLinhaIncompleta) {
      return alert("Existem linhas incompletas. Preencha os pesos e o insumo ou remova a linha clicando na lixeira.");
    }

    setLoading(true);
    try {
      // 1. Criar Master
      const payloadFicha = {
        nome: ficha.nome!,
        categoria_uan: ficha.categoria_uan!,
        rendimento_porcoes: Number(ficha.rendimento_porcoes || 1),
        peso_porcao_g: Number(ficha.peso_porcao_g || 0),
        modo_preparo: ficha.modo_preparo || '',
        tempo_preparo_min: Number(ficha.tempo_preparo_min || 0),
        cliente_id: activeClientId
      };

      const { data: resFicha, error: errFicha } = await supabase
        .from('fichas_tecnicas_uan')
        .insert([payloadFicha as any])
        .select()
        .single();

      if (errFicha || !resFicha) throw errFicha;

      // 2. Criar Filhas
      const payloadLinhas = linhasParaSalvar.map(l => ({
        ficha_uan_id: resFicha.id,
        ingrediente_id: l.ingrediente_id!,
        referencia_id: l.referencia_id || null,
        peso_bruto_g: Number(l.peso_bruto_g),
        peso_liquido_g: Number(l.peso_liquido_g),
        fator_correcao: Number(l.fator_correcao || 1),
        indice_coccao: Number(l.indice_coccao || 1)
      }));

      const { error: errL } = await supabase.from('composicao_fichas_uan').insert(payloadLinhas as any);
      if (errL) throw errL;

      alert("Ficha Técnica criada com sucesso!");
      router.push('/uan/fichas');
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => setLinhas(prev => [...prev, { fator_correcao: 1, indice_coccao: 1 }]);
  const removeLine = (idx: number) => setLinhas(prev => prev.filter((_, i) => i !== idx));

  const custoPrato = calcCustoTotal();
  const custoPorcao = ficha.rendimento_porcoes ? (custoPrato / Number(ficha.rendimento_porcoes)) : 0;

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan/fichas')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold">Nova Ficha Técnica (FTP)</Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center" gap={1}>
          <Calculator size={20} /> Dimensionamento da Preparação
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Nome da Preparação"
              value={ficha.nome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFicha({ ...ficha, nome: e.target.value })}
              placeholder="Ex: Arroz à Grega"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Categoria" value={ficha.categoria_uan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFicha({ ...ficha, categoria_uan: e.target.value as CategoriaUAN })}>
              {CATEGORIAS_UAN.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth type="number" label="Tempo Prep (min)" value={ficha.tempo_preparo_min} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFicha({ ...ficha, tempo_preparo_min: Number(e.target.value) })} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Rendimento (Qtd Porções)" value={ficha.rendimento_porcoes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFicha({ ...ficha, rendimento_porcoes: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Peso da Porção (g)" value={ficha.peso_porcao_g} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFicha({ ...ficha, peso_porcao_g: Number(e.target.value) })} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Box Dinâmico de Custo */}
            <Box p={2} sx={{ bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Custo Previsto da Receita</Typography>
                <Typography variant="h6" color="error">R$ {custoPrato.toFixed(2)}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Custo por Porção (Per Capita)</Typography>
                <Typography variant="h6" color="primary">R$ {custoPorcao.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="h6" fontWeight="bold">Composição (Ingredientes e Índices)</Typography>
            <Button variant="outlined" size="small" startIcon={<ActivitySquare size={16} />} color="secondary" onClick={() => setModalOpen(true)}>
              Análise Nutricional (TACO/TBCA)
            </Button>
          </Box>
          <Button variant="contained" size="small" startIcon={<PlusCircle />} onClick={addLine}>Add Insumo</Button>
        </Box>

        <Box sx={{ overflowX: 'auto', mx: -1 }}>
          <Table size="small" sx={{ minWidth: 1200 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ minWidth: 250 }}>Insumo (Base de Compras)</TableCell>
                <TableCell sx={{ minWidth: 250 }}>Base Científica (TACO/TBCA)</TableCell>
                <TableCell width={90} align="center">P.Bruto (g)</TableCell>
                <TableCell width={90} align="center">P.Líquido (g)</TableCell>
                <TableCell width={60} align="center">FC</TableCell>
                <TableCell width={80} align="center">IC</TableCell>
                <TableCell width={100} align="center" sx={{ bgcolor: 'rgba(0,0,0,0.02)', fontWeight: 'bold' }}>Peso Final (g)</TableCell>
                <TableCell align="right" width={110}>Preço (PB)</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linhas.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Autocomplete
                      options={ingredientesDB}
                      getOptionLabel={o => `${o.nome}`}
                      value={row.ui_ingrediente || null}
                      onChange={(_, val) => {
                        updateLinha(index, { 
                          ingrediente_id: val?.id, 
                          ui_ingrediente: val 
                        });
                      }}
                      renderInput={p => (
                        <AutocompleteTextField {...p} placeholder="Selecionar insumo..." />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      options={referenciasDB}
                      getOptionLabel={o => `${o.nome} (${o.fonte})`}
                      value={row.ui_referencia || null}
                      onChange={(_, val) => {
                        updateLinha(index, { 
                          referencia_id: val?.id, 
                          ui_referencia: val 
                        });
                      }}
                      renderInput={p => (
                        <AutocompleteTextField 
                           {...p} 
                           placeholder="Referência..." 
                           helperText={!row.ui_referencia ? "Pendente" : ""}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput 
                      value={row.peso_bruto_g || ''} 
                      onChange={e => updateLinha(index, { peso_bruto_g: e.target.value })} 
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput 
                      value={row.peso_liquido_g || ''} 
                      onChange={e => updateLinha(index, { peso_liquido_g: e.target.value })} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      {row.fator_correcao ? Number(row.fator_correcao).toFixed(2) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TableInput 
                      value={row.indice_coccao || 1} 
                      onChange={e => updateLinha(index, { indice_coccao: e.target.value })} 
                      step={0.1}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Typography variant="body2" fontWeight="bold" color="secondary.main">
                      {((Number(row.peso_liquido_g) || 0) * (Number(row.indice_coccao) || 1)).toFixed(0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      R$ {(((Number(row.peso_bruto_g) || 0) / 1000) * (row.ui_ingrediente?.preco_ultima_compra || 0)).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => removeLine(index)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" mb={2}>Modo de Preparo</Typography>
        <TextField
          fullWidth multiline rows={4}
          placeholder="Descreva o passo a passo da cozinha (Higienização, Cocção, Armazenamento...)"
          value={ficha.modo_preparo || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFicha({ ...ficha, modo_preparo: e.target.value })}
        />

        <Box mt={4}>
          <Button variant="contained" size="large" fullWidth onClick={handleSalvar} disabled={loading} startIcon={<Save />}>
            {loading ? 'Salvando...' : 'Salvar Ficha Técnica UAN'}
          </Button>
        </Box>
      </Paper>

      {/* MODAL ANÁLISE NUTRICIONAL CLINICA */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Análise Nutricional (Critérios Clínicos TACO/TBCA)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Cálculo baseado apenas em ingredientes vinculados a Tabela Científica na linha da ficha.
            Considera-se o Rendimento Final: (Peso Líquido × Índice de Cocção).
          </Typography>

          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nutriente</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Porção ({ficha.peso_porcao_g || 0}g)</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Receita Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                let totais = { energia: 0, proteina: 0, carbo_total: 0, carbo_disp: 0, lipideos: 0, fibra: 0, calcio: 0, sodio: 0 };
                linhas.forEach(l => {
                  const ref = l.ui_referencia;
                  if (ref && l.peso_liquido_g) {
                    // Cálculo UAN: Peso Final = Peso Líquido * IC
                    const pesoFinal = Number(l.peso_liquido_g) * (Number(l.indice_coccao) || 1);
                    const fracao = pesoFinal / 100;

                    totais.energia += (ref.energia_kcal || 0) * fracao;
                    totais.proteina += (ref.proteina_g || 0) * fracao;
                    totais.carbo_total += (ref.carboidrato_g || 0) * fracao;
                    totais.carbo_disp += (ref.carboidrato_disponivel_g || 0) * fracao;
                    totais.lipideos += (ref.lipideos_g || 0) * fracao;
                    totais.fibra += (ref.fibra_alimentar_g || 0) * fracao;
                    totais.calcio += (ref.calcio_mg || 0) * fracao;
                    totais.sodio += (ref.sodio_mg || 0) * fracao;
                  }
                });

                const proporcaoPorcao = Math.max(ficha.rendimento_porcoes || 1, 1);

                return (
                  <>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Energia (kcal)</TableCell><TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{(totais.energia / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.energia.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Carboidratos Totais (g)</TableCell><TableCell align="right">{(totais.carbo_total / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.carbo_total.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)' }}><TableCell sx={{ fontWeight: 600, pl: 4 }}>└ Carboidratos Disponíveis (g)</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>{(totais.carbo_disp / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.carbo_disp.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Proteínas (g)</TableCell><TableCell align="right">{(totais.proteina / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.proteina.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Gorduras Totais (g)</TableCell><TableCell align="right">{(totais.lipideos / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.lipideos.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Fibras (g)</TableCell><TableCell align="right">{(totais.fibra / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.fibra.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Cálcio (mg)</TableCell><TableCell align="right">{(totais.calcio / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.calcio.toFixed(1)}</TableCell></TableRow>
                    <TableRow hover><TableCell sx={{ fontWeight: 500 }}>Sódio (mg)</TableCell><TableCell align="right" sx={{ color: 'error.main' }}>{(totais.sodio / proporcaoPorcao).toFixed(1)}</TableCell><TableCell align="right">{totais.sodio.toFixed(1)}</TableCell></TableRow>
                  </>
                );
              })()}
            </TableBody>
          </Table>

          {!linhas.every(l => l.ui_referencia) && (
            <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
              ⚠️ Atenção: Alguns ingredientes não possuem "Base Científica" selecionada nesta ficha e não entraram no cálculo clínico.
            </Typography>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
