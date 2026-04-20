'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Box, Typography, Button, Paper, TextField, Grid, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox, Skeleton, MenuItem } from '@mui/material';
import { ArrowLeft, Save, CalendarDays, Loader2 } from 'lucide-react';
import { CardapioUAN } from '@/lib/types';

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

export default function EditarCardapioUANPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome_ciclo: '',
    mes_referencia: '',
    dias_funcionamento: [] as number[],
    refeicoes_oferecidas: [] as string[],
    comensais_estimados_dia: 100,
    setor_producao_id: '',
  });

  const [setores, setSetores] = useState<{ id: string, nome: string }[]>([]);

  useEffect(() => {
    async function fetchCardapio() {
      if (!params.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cardapios_uan')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !data) throw error;

        const cardapio = data as unknown as CardapioUAN;
        
        // Reconstrói mes_referencia a partir da data_inicio (YYYY-MM-DD -> YYYY-MM)
        const mesRef = cardapio.data_inicio.substring(0, 7);

        setForm({
          nome_ciclo: cardapio.nome_ciclo,
          mes_referencia: mesRef,
          dias_funcionamento: cardapio.dias_funcionamento || [],
          refeicoes_oferecidas: cardapio.refeicoes_oferecidas || [],
          comensais_estimados_dia: cardapio.comensais_estimados_dia || 0,
          setor_producao_id: cardapio.setor_producao_id || '',
        });
      } catch (e: any) {
        window.alert("Erro ao carregar cardápio: " + e.message);
        router.push('/uan/cardapios');
      } finally {
        setLoading(false);
      }
    }
    fetchCardapio();
  }, [params.id, router]);

  useEffect(() => {
    async function fetchSetores() {
      if (!activeClientId || !unidadeId) return;
      const { data } = await supabase
        .from('setores_producao')
        .select('id, nome')
        .eq('unidade_id', unidadeId)
        .eq('ativo', true)
        .order('nome');
      if (data) setSetores(data);
    }
    fetchSetores();
  }, [activeClientId]);

  const handleSalvar = async () => {
    if (!activeClientId) return window.alert('Selecione um cliente.');
    if (!form.nome_ciclo || !form.mes_referencia) {
      return window.alert('Preencha o nome do ciclo e o mês de referência.');
    }
    if (form.dias_funcionamento.length === 0 || form.refeicoes_oferecidas.length === 0) {
      return window.alert('Selecione pelo menos um dia de funcionamento e uma refeição.');
    }

    setSalvando(true);
    try {
      // Resolve data_inicio e data_fim baseado no mês de referência (YYYY-MM)
      const [anoStr, mesStr] = form.mes_referencia.split('-');
      const ano = Number(anoStr);
      const mes = Number(mesStr) - 1; // 0-11
      
      const dataInicio = new Date(ano, mes, 1);
      const dataFim = new Date(Date.UTC(ano, mes + 1, 0, 12, 0, 0));

      const payload = {
        nome_ciclo: form.nome_ciclo,
        comensais_estimados_dia: form.comensais_estimados_dia,
        dias_funcionamento: form.dias_funcionamento,
        refeicoes_oferecidas: form.refeicoes_oferecidas,
        data_inicio: dataInicio.toISOString().split('T')[0],
        data_fim: dataFim.toISOString().split('T')[0],
        setor_producao_id: form.setor_producao_id || null,
      };

      const { error } = await supabase
        .from('cardapios_uan')
        .update(payload)
        .eq('id', params.id);
        
      if (error) throw error;

      window.alert('Cardápio atualizado com sucesso!');
      router.push('/uan/cardapios');
    } catch (e: any) {
      console.error(e);
      window.alert('Erro ao atualizar: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Box p={4}>
         <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan/cardapios')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold">Editar Ciclo de Cardápio</Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center" gap={1}>
          <CalendarDays size={20} /> Parâmetros do Ciclo
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome do Ciclo"
              value={form.nome_ciclo}
              onChange={e => setForm({ ...form, nome_ciclo: (e.target as HTMLInputElement).value })}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="month"
              label="Mês de Referência"
              InputLabelProps={{ shrink: true }}
              value={form.mes_referencia}
              onChange={e => setForm({ ...form, mes_referencia: (e.target as HTMLInputElement).value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Comensais"
              value={form.comensais_estimados_dia}
              onChange={e => setForm({ ...form, comensais_estimados_dia: Number((e.target as HTMLInputElement).value) || 0 })}
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
              <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Dias da semana (Funcionamento)</FormLabel>
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
        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            size="large"
            startIcon={salvando ? <Loader2 className="animate-spin" /> : <Save />}
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
