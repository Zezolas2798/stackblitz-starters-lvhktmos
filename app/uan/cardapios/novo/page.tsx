'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Grid, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox, MenuItem } from '@mui/material';
import { ArrowLeft, Save, CalendarDays } from 'lucide-react';

const DIAS_SEMANA = [
  { id: 1, label: 'Segunda', cur: 'Seg' },
  { id: 2, label: 'Terça', cur: 'Ter' },
  { id: 3, label: 'Quarta', cur: 'Qua' },
  { id: 4, label: 'Quinta', cur: 'Qui' },
  { id: 5, label: 'Sexta', cur: 'Sex' },
  { id: 6, label: 'Sábado', cur: 'Sáb' },
  { id: 0, label: 'Domingo', cur: 'Dom' }
];

const REFEICOES = ['Desjejum', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];

export default function NovoCardapioUANPage() {
  const router = useRouter();
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome_ciclo: '',
    mes_referencia: '',
    dias_funcionamento: [1, 2, 3, 4, 5] as number[],
    refeicoes_oferecidas: ['Almoço'] as string[],
    comensais_estimados_dia: 100, 
    comensais_modelo: {
      "1": { "Almoço": 100 }, "2": { "Almoço": 100 }, "3": { "Almoço": 100 },
      "4": { "Almoço": 100 }, "5": { "Almoço": 100 }, "6": { "Almoço": 0 }, "0": { "Almoço": 0 }
    } as Record<string, Record<string, number>>,
    setor_producao_id: '',
  });

  const [setores, setSetores] = useState<{ id: string, nome: string }[]>([]);

  const [horarios, setHorarios] = useState<Record<string, { inicio: string, fim: string }>>({
    'Desjejum': { inicio: '07:00', fim: '08:30' },
    'Almoço': { inicio: '11:00', fim: '13:30' },
    'Lanche da Tarde': { inicio: '15:30', fim: '16:30' },
    'Jantar': { inicio: '18:00', fim: '20:00' },
    'Ceia': { inicio: '21:30', fim: '22:30' }
  });

  const [perfisDisponiveis, setPerfisDisponiveis] = useState<{ id: string, nome: string, refeicao_grupo: string }[]>([]);
  const [perfisSelecionados, setPerfisSelecionados] = useState<Record<string, string>>({});

  // Sincroniza comensais_modelo quando refeicoes_oferecidas mudar
  useEffect(() => {
    setForm(prev => {
      const newModelo = { ...prev.comensais_modelo };
      Object.keys(newModelo).forEach(dia => {
        prev.refeicoes_oferecidas.forEach(ref => {
          if (newModelo[dia][ref] === undefined) {
             newModelo[dia][ref] = 100; // Default
          }
        });
      });
      return { ...prev, comensais_modelo: newModelo };
    });

    const defaults: Record<string, { inicio: string, fim: string }> = {
      'Desjejum': { inicio: '07:00', fim: '08:30' },
      'Almoço': { inicio: '11:00', fim: '13:30' },
      'Lanche da Tarde': { inicio: '15:30', fim: '16:30' },
      'Jantar': { inicio: '18:00', fim: '20:00' },
      'Ceia': { inicio: '21:30', fim: '22:30' }
    };
    
    const novosHorarios = { ...horarios };
    form.refeicoes_oferecidas.forEach(r => {
      if (!novosHorarios[r]) novosHorarios[r] = defaults[r] || { inicio: '12:00', fim: '13:00' };
    });
    setHorarios(novosHorarios);
  }, [form.refeicoes_oferecidas]);

  useEffect(() => {
    async function fetchData() {
      if (!activeClientId || !unidadeId) return;
      const { data: dataSetores } = await supabase
        .from('setores_producao')
        .select('id, nome')
        .eq('unidade_id', unidadeId)
        .eq('ativo', true)
        .order('nome');
      if (dataSetores) setSetores(dataSetores);

      const { data: dataPerfis } = await supabase
        .from('perfis_cardapio')
        .select('id, nome, refeicao_grupo')
        .eq('cliente_id', activeClientId)
        .eq('ativo', true);
      if (dataPerfis) setPerfisDisponiveis(dataPerfis);
    }
    fetchData();
  }, [activeClientId]);

  const [feriados, setFeriados] = useState<any[]>([]);

  const handleSalvar = async () => {
    if (!activeClientId) return window.alert('Selecione um cliente.');
    if (!form.nome_ciclo || !form.mes_referencia) {
      return window.alert('Preencha o nome do ciclo e o mês de referência.');
    }
    if (form.dias_funcionamento.length === 0 || form.refeicoes_oferecidas.length === 0) {
      return window.alert('Selecione pelo menos um dia de funcionamento e uma refeição.');
    }

    setLoading(true);
    try {
      const [anoStr, mesStr] = form.mes_referencia.split('-');
      const ano = Number(anoStr);
      const mes = Number(mesStr) - 1;
      
      const dataInicio = new Date(Date.UTC(ano, mes, 1, 12, 0, 0));
      const dataFim = new Date(Date.UTC(ano, mes + 1, 0, 12, 0, 0));

      const payload = {
        cliente_id: activeClientId,
        unidade_id: unidadeId,
        status: 'Em Planejamento',
        nome_ciclo: form.nome_ciclo,
        comensais_estimados_dia: form.comensais_estimados_dia,
        comensais_modelo: form.comensais_modelo,
        horario_refeicoes: horarios,
        dias_funcionamento: form.dias_funcionamento,
        refeicoes_oferecidas: form.refeicoes_oferecidas,
        data_inicio: dataInicio.toISOString().split('T')[0],
        data_fim: dataFim.toISOString().split('T')[0],
        setor_producao_id: form.setor_producao_id || null,
      };

      const { data, error } = await supabase
        .from('cardapios_uan')
        .insert([payload])
        .select()
        .single();
        
      if (error || !data) throw error;

      // Inserir relacionamentos de perfil por refeição
      const perfisPayload = form.refeicoes_oferecidas.map(ref => {
        const pId = perfisSelecionados[ref];
        if (!pId) return null;
        return {
          cardapio_id: data.id,
          refeicao: ref,
          perfil_id: pId
        };
      }).filter(Boolean);

      if (perfisPayload.length > 0) {
        const { error: errPerfis } = await supabase.from('cardapio_perfis_refeicao').insert(perfisPayload as any);
        if (errPerfis) {
           console.error('Erro ao vincular perfis:', errPerfis);
           window.alert('Aviso: O ciclo foi criado, mas houve um erro ao vincular os perfis de cardápio.');
        }
      }

      window.alert('Cardápio criado com sucesso! Agora configure a grade.');
      router.push(`/uan/cardapios/${data.id}/grade`);
    } catch (e: any) {
      console.error(e);
      window.alert('Erro ao criar cardápio: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan/cardapios')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold">Novo Período/Ciclo de Cardápio</Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center" gap={1}>
          <CalendarDays size={20} /> Parâmetros do Ciclo
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome do Ciclo (Ex: Maio 2026 - Lote 2)"
              value={form.nome_ciclo}
              onChange={e => setForm({ ...form, nome_ciclo: (e.target as HTMLInputElement).value })}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mês de Referência"
              type="month"
              value={form.mes_referencia}
              onChange={e => setForm({ ...form, mes_referencia: (e.target as HTMLInputElement).value })}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Setor de Produção Padrão"
              value={form.setor_producao_id}
              onChange={e => setForm({ ...form, setor_producao_id: (e.target as HTMLInputElement).value })}
              helperText="Defina qual setor receberá as produções deste cardápio"
            >
              <MenuItem value=""><em>Nenhum (Vincular individualmente na OP)</em></MenuItem>
              {setores.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.nome}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Dias da semana (Funcionamento padrão)</FormLabel>
              <FormGroup row>
                 {DIAS_SEMANA.map(dia => (
                   <FormControlLabel
                     key={dia.id}
                     control={
                       <Checkbox 
                         checked={form.dias_funcionamento.includes(dia.id)} 
                         onChange={(e) => {
                           if ((e.target as HTMLInputElement).checked) setForm(p => ({...p, dias_funcionamento: [...p.dias_funcionamento, dia.id]}));
                           else setForm(p => ({...p, dias_funcionamento: p.dias_funcionamento.filter(d => d !== dia.id)}));
                         }}
                       />
                     }
                     label={dia.label}
                   />
                 ))}
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Refeições Oferecidas Diariamente</FormLabel>
              <FormGroup row>
                 {REFEICOES.map(ref => (
                   <FormControlLabel
                     key={ref}
                     control={
                       <Checkbox 
                         checked={form.refeicoes_oferecidas.includes(ref)} 
                         onChange={(e) => {
                           if ((e.target as HTMLInputElement).checked) setForm(p => ({...p, refeicoes_oferecidas: [...p.refeicoes_oferecidas, ref]}));
                           else setForm(p => ({...p, refeicoes_oferecidas: p.refeicoes_oferecidas.filter(r => r !== ref)}));
                         }}
                       />
                     }
                     label={ref}
                   />
                 ))}
              </FormGroup>
            </FormControl>
          </Grid>

          {form.refeicoes_oferecidas.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Atribuir Perfis de Cardápio por Refeição
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Selecione qual template estrutural será usado para montar cada refeição neste ciclo.
              </Typography>
              <Grid container spacing={2}>
                {form.refeicoes_oferecidas.map(ref => {
                  // Opcional: Se quiser filtrar por grupo (ALMOCO_JANTAR vs CAFE_LANCHES), poderia fazer aqui.
                  // Para simplificar, vou permitir selecionar qualquer perfil, ou você pode importar a constante REFEICAO_TO_GROUP.
                  const isAmPm = ref === 'Almoço' || ref === 'Jantar' || ref === 'Ceia'; // simplistic check
                  return (
                    <Grid item xs={12} sm={6} md={4} key={ref}>
                      <TextField
                        select fullWidth size="small"
                        label={`Perfil - ${ref}`}
                        value={perfisSelecionados[ref] || ''}
                        onChange={(e) => setPerfisSelecionados(p => ({ ...p, [ref]: (e.target as HTMLInputElement).value }))}
                      >
                        <MenuItem value=""><em>Sem Perfil / Flexível</em></MenuItem>
                        {perfisDisponiveis.map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )
                })}
              </Grid>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Meta de Comensais por Refeição e Dia
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Dia</TableCell>
                    {form.refeicoes_oferecidas.map(ref => (
                      <TableCell key={ref} align="center" sx={{ fontWeight: 'bold' }}>{ref}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DIAS_SEMANA.filter(d => form.dias_funcionamento.includes(d.id)).map(dia => (
                    <TableRow key={dia.id}>
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{dia.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{dia.cur}</Typography>
                      </TableCell>
                      {form.refeicoes_oferecidas.map(ref => (
                        <TableCell key={ref} align="center">
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: 80 }}
                            value={form.comensais_modelo[dia.id.toString()]?.[ref] || 0}
                            onChange={e => {
                              const val = Number((e.target as HTMLInputElement).value) || 0;
                              setForm(prev => ({
                                ...prev,
                                comensais_modelo: {
                                  ...prev.comensais_modelo,
                                  [dia.id.toString()]: {
                                    ...(prev.comensais_modelo[dia.id.toString()] || {}),
                                    [ref]: val
                                  }
                                }
                              }));
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={2}>Horários de Funcionamento</Typography>
            <Grid container spacing={2}>
              {form.refeicoes_oferecidas.map(ref => (
                <Grid item xs={12} sm={6} md={4} key={ref}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1.5 }}>{ref}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField 
                        label="Início"
                        type="time"
                        size="small"
                        fullWidth
                        value={horarios[ref]?.inicio || ''}
                        onChange={e => setHorarios(p => ({ ...p, [ref]: { ...p[ref], inicio: (e.target as HTMLInputElement).value } }))}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField 
                        label="Fim"
                        type="time"
                        size="small"
                        fullWidth
                        value={horarios[ref]?.fim || ''}
                        onChange={e => setHorarios(p => ({ ...p, [ref]: { ...p[ref], fim: (e.target as HTMLInputElement).value } }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>


        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSalvar}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar e Ver Grade'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
