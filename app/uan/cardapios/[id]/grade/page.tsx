'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN, CardapioDiaUAN, FichaTecnicaUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
  Grid, FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import { ArrowLeft, Plus, Save, Trash2, CalendarDays, Loader2, RefreshCw, ChevronDown, Pencil } from 'lucide-react';

const DEFAULT_REFEICOES = ['Desjejum', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];
export default function GradeCardapioUANPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeClientId } = useClient();
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [cardapio, setCardapio] = useState<CardapioUAN | null>(null);
  const [fichas, setFichas] = useState<FichaTecnicaUAN[]>([]);
  const [grade, setGrade] = useState<Partial<CardapioDiaUAN>[]>([]);
  const [feriados, setFeriados] = useState<any[]>([]);

  // Estado do Modal de Adição (Multi-Seleção)
  const [modalOpen, setModalOpen] = useState(false);
  const [cellTarget, setCellTarget] = useState<{ data: string, refeicao: string } | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]); // IDs das fichas marcadas
  const [tempComensaisRefeicao, setTempComensaisRefeicao] = useState<number>(0);

  // Estado do Modal de Configuração do Dia
  const [diagConfigOpen, setDiagConfigOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<{ data: string } | null>(null);
  const [tempComensaisMap, setTempComensaisMap] = useState<Record<string, number>>({});
  const [tempHorariosMap, setTempHorariosMap] = useState<Record<string, { inicio: string, fim: string }>>({});
  const [tempFunciona, setTempFunciona] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      if (!activeClientId) return;
      setLoading(true);

      // 1. Busca Cardápio
      const { data: cData, error: cErr } = await supabase
        .from('cardapios_uan')
        .select('*')
        .eq('id', params.id)
        .single();

      if (cData) setCardapio(cData as unknown as CardapioUAN);

      // 2. Busca Fichas Disponíveis
      const { data: fData } = await supabase
        .from('fichas_tecnicas_uan')
        .select('*')
        .eq('cliente_id', activeClientId)
        .order('nome');
      
      if (fData) setFichas(fData as unknown as FichaTecnicaUAN[]);

      // 3. Busca Grade Atual
      const { data: gData } = await supabase
        .from('cardapio_dias_uan')
        .select('*, fichas_tecnicas_uan(nome, categoria_uan)')
        .eq('cardapio_id', params.id);
        
      if (gData) setGrade(gData as unknown as Partial<CardapioDiaUAN>[]);

      // 4. Busca Feriados do Ano
      if (cData?.data_inicio) {
        const year = cData.data_inicio.split('-')[0];
        try {
          const rH = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
          const dH = await rH.json();
          if (Array.isArray(dH)) setFeriados(dH);
        } catch (e) {}
      }

      setLoading(false);
    }
    fetchData();
  }, [activeClientId, params.id]);

  const handleOpenAdd = (dateStr: string, refeicao: string) => {
    const config = cardapio?.config_excecoes_dias?.[dateStr] || {};
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = d.getDay().toString();
    const comensais = config.comensais?.[refeicao] ?? cardapio?.comensais_modelo?.[dayOfWeek]?.[refeicao] ?? cardapio?.comensais_estimados_dia ?? 0;

    // Busca quais fichas já estão na grade para este dia/refeição
    const existentesId = grade
      .filter(g => g.data_consumo === dateStr && g.tipo_refeicao === refeicao)
      .map(g => g.ficha_uan_id!);

    setCellTarget({ data: dateStr, refeicao });
    setTempComensaisRefeicao(comensais);
    setSelecionados(existentesId); 
    setModalOpen(true);
  };

  const handleLocalAddMulti = () => {
    if (!cellTarget || !cardapio) return;
    
    // 1. Atualiza comensais da refeição na exceção do dia
    const currentExcecoes = { ...(cardapio.config_excecoes_dias || {}) };
    const diaExcecao = currentExcecoes[cellTarget.data] || { funciona: true, comensais: {}, horarios: {} };
    const novosComensais = { ...(diaExcecao.comensais || {}), [cellTarget.refeicao]: tempComensaisRefeicao };
    
    currentExcecoes[cellTarget.data] = { ...diaExcecao, comensais: novosComensais };
    setCardapio({ ...cardapio, config_excecoes_dias: currentExcecoes });

    // 2. Sincroniza fichas da grade (Substitui as atuais da célula pela nova seleção)
    setGrade(prev => {
      // Remove o que tinha antes nessa célula
      const semEstaCelula = prev.filter(g => !(g.data_consumo === cellTarget.data && g.tipo_refeicao === cellTarget.refeicao));
      
      // Cria os novos itens baseados na seleção
      const novosItens = selecionados.map(id => {
        const ficha = fichas.find(f => f.id === id);
        // Tenta manter o fator se o item já existia no estado anterior
        const anterior = prev.find(g => g.data_consumo === cellTarget.data && g.tipo_refeicao === cellTarget.refeicao && g.ficha_uan_id === id);
        
        return {
          id: anterior?.id || `temp_${Date.now()}_${id}`,
          cardapio_id: cardapio.id,
          ficha_uan_id: id,
          data_consumo: cellTarget.data,
          tipo_refeicao: cellTarget.refeicao,
          fator_multiplicador: anterior?.fator_multiplicador || 1,
          // @ts-ignore
          fichas_tecnicas_uan: { nome: ficha?.nome, categoria_uan: ficha?.categoria_uan }
        };
      });

      return [...semEstaCelula, ...novosItens];
    });

    setModalOpen(false);
  };

  const handleOpenConfigDia = (dateStr: string) => {
    const config = cardapio?.config_excecoes_dias?.[dateStr] || {};
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = d.getDay().toString();
    const refeicoes = cardapio?.refeicoes_oferecidas || [];

    const comensaisMap: Record<string, number> = {};
    const horariosMap: Record<string, { inicio: string, fim: string }> = {};

    refeicoes.forEach(ref => {
       comensaisMap[ref] = config.comensais?.[ref] ?? cardapio?.comensais_modelo?.[dayOfWeek]?.[ref] ?? cardapio?.comensais_estimados_dia ?? 0;
       horariosMap[ref] = config.horarios?.[ref] ?? cardapio?.horario_refeicoes?.[ref] ?? { inicio: '--:--', fim: '--:--' };
    });

    setConfigTarget({ data: dateStr });
    setTempComensaisMap(comensaisMap);
    setTempHorariosMap(horariosMap);
    setTempFunciona(config.funciona !== undefined ? config.funciona : true);
    setDiagConfigOpen(true);
  };

  const handleSaveConfigDia = async () => {
    if (!configTarget || !cardapio) return;
    
    const newExcecoes = { 
      ...(cardapio.config_excecoes_dias || {}),
      [configTarget.data]: {
        comensais: tempComensaisMap,
        horarios: tempHorariosMap,
        funciona: tempFunciona
      }
    };

    const { error } = await supabase
      .from('cardapios_uan')
      .update({ config_excecoes_dias: newExcecoes } as any)
      .eq('id', cardapio.id);

    if (!error) {
      setCardapio({ ...cardapio, config_excecoes_dias: newExcecoes });
      setDiagConfigOpen(false);
    } else {
      alert("Erro ao salvar configuração do dia.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Se for temporário, apenas remove do estado.
    if (itemId.startsWith('temp_')) {
      setGrade(prev => prev.filter(g => g.id !== itemId));
    } else {
      // Se já tá no DB, deleta lá e depois tira do estado
      const { error } = await supabase.from('cardapio_dias_uan').delete().eq('id', itemId);
      if (!error) {
        setGrade(prev => prev.filter(g => g.id !== itemId));
      } else {
        alert("Erro ao remover item");
      }
    }
  };

  const handleSalvarGrade = async () => {
    if (!cardapio) return;
    setSalvando(true);
    
    try {
      // 1. Salva alterações no objeto principal do cardápio (exceções de comensais)
      const { error: cErr } = await supabase
        .from('cardapios_uan')
        .update({ config_excecoes_dias: cardapio.config_excecoes_dias } as any)
        .eq('id', cardapio.id);

      if (cErr) throw new Error("Erro ao salvar configurações de comensais.");

      // 2. Filtra e salva novos itens da grade (temporários)
      const novosItens = grade.filter(g => g.id?.startsWith('temp_')).map(g => ({
        cardapio_id: g.cardapio_id!,
        ficha_uan_id: g.ficha_uan_id!,
        data_consumo: g.data_consumo!,
        tipo_refeicao: g.tipo_refeicao!,
        fator_multiplicador: g.fator_multiplicador
      }));

      if (novosItens.length > 0) {
        const { error: iErr } = await supabase.from('cardapio_dias_uan').insert(novosItens);
        if (iErr) throw new Error("Erro ao salvar itens da grade.");
      }

      // 3. Salva alterações em itens existentes (fator_multiplicador pode ter mudado)
      const itensExistentes = grade.filter(g => !g.id?.startsWith('temp_'));
      for (const item of itensExistentes) {
        if (!item.id) continue;
        await supabase.from('cardapio_dias_uan')
          .update({ fator_multiplicador: item.fator_multiplicador })
          .eq('id', item.id);
      }

      alert("Grade salva com sucesso!");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar a grade.");
    } finally {
      setSalvando(false);
    }
  };

  const parsePeriodo = () => {
    if (!cardapio) return [];
    const dates = [];
    const dt = new Date(cardapio.data_inicio + 'T12:00:00Z');
    const end = new Date(cardapio.data_fim + 'T12:00:00Z');
    
    while (dt <= end) {
      // Se não houver configuração de dias, assumir todos. Se houver, filtrar pelo dia da semana (0=Dom, 6=Sab)
      if (!cardapio.dias_funcionamento || cardapio.dias_funcionamento.length === 0 || cardapio.dias_funcionamento.includes(dt.getUTCDay())) {
        dates.push(dt.toISOString().split('T')[0]);
      }
      dt.setUTCDate(dt.getUTCDate() + 1);
    }
    return dates;
  };

  const dates = parsePeriodo();
  const refeicoesAtivas = cardapio?.refeicoes_oferecidas?.length ? cardapio.refeicoes_oferecidas : DEFAULT_REFEICOES;

  if (loading) return <Box p={4} display="flex" justifyContent="center"><Loader2 className="animate-spin" /></Box>;
  if (!cardapio) return <Box p={4}>Cardápio não encontrado.</Box>;

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan/cardapios')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold" flexGrow={1}>
          Grade de Cardápio: {cardapio.nome_ciclo}
        </Typography>
        <Button
          variant="contained"
          startIcon={salvando ? <Loader2 className="animate-spin" /> : <Save />}
          onClick={handleSalvarGrade}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 3, bgcolor: 'action.hover' }}>
         <Box>
            <Typography variant="caption" color="text.secondary" display="block">Período</Typography>
            <Typography variant="body1" fontWeight="bold">
              {new Date(cardapio.data_inicio).toLocaleDateString()} a {new Date(cardapio.data_fim).toLocaleDateString()}
            </Typography>
         </Box>
         <Box>
            <Typography variant="caption" color="text.secondary" display="block">Comensais (Diários)</Typography>
            <Typography variant="body1" fontWeight="bold">{cardapio.comensais_estimados_dia}</Typography>
         </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120, bgcolor: 'primary.light', color: 'primary.main', fontWeight: 'bold' }}>DATA</TableCell>
              {refeicoesAtivas.map(r => (
                <TableCell key={r} align="center" sx={{ minWidth: 200, bgcolor: 'action.hover', fontWeight: 'bold' }}>
                  {r}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dates.map(dateStr => {
              const d = new Date(dateStr + 'T12:00:00Z'); 
              const feriado = feriados.find(f => f.date === dateStr);
              const config = cardapio.config_excecoes_dias?.[dateStr] || {};
              const dayOfWeek = d.getDay().toString();
              const naoFunciona = config.funciona === false;
              
              // Total de comensais no dia (soma de todas as refeições)
              let totalComensais = 0;
              const refs = cardapio.refeicoes_oferecidas || [];
              refs.forEach(ref => {
                totalComensais += config.comensais?.[ref] ?? cardapio.comensais_modelo?.[dayOfWeek]?.[ref] ?? cardapio.comensais_estimados_dia;
              });

              return (
                <TableRow key={dateStr} hover sx={{ bgcolor: naoFunciona ? 'rgba(0,0,0,0.04)' : 'inherit' }}>
                  <TableCell onClick={() => handleOpenConfigDia(dateStr)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight="bold">{d.toLocaleDateString()}</Typography>
                      {feriado && <Chip label="Feriado" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                       {d.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </Typography>
                    {feriado && <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold' }}>{feriado.name}</Typography>}
                    
                    <Box mt={1} sx={{ bgcolor: 'primary.light', p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                      <Typography variant="caption" color="primary.main" fontWeight="bold">
                         {naoFunciona ? "FECHADO" : `${totalComensais} comensais (Total)`}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  {refeicoesAtivas.map(ref => {
                    const itens = grade.filter(g => g.data_consumo === dateStr && g.tipo_refeicao === ref);
                    const config = cardapio.config_excecoes_dias?.[dateStr] || {};
                    const dayOfWeek = d.getDay().toString();
                    const mealComensais = config.comensais?.[ref] ?? cardapio.comensais_modelo?.[dayOfWeek]?.[ref] ?? cardapio.comensais_estimados_dia;
                    const mealHorario = config.horarios?.[ref] ?? cardapio.horario_refeicoes?.[ref];

                    // Agrupamento por categoria
                    const grouped: Record<string, any[]> = {};
                    itens.forEach(item => {
                      const cat = (item as any).fichas_tecnicas_uan?.categoria_uan || "Outros";
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(item);
                    });

                    return (
                      <TableCell key={ref} sx={{ verticalAlign: 'top', minWidth: 220, borderLeft: '1px solid #eee' }}>
                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                             <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block' }}>
                               {mealComensais} pessoas
                             </Typography>
                             {mealHorario && (
                               <Typography variant="caption" color="text.secondary">
                                 {mealHorario.inicio} - {mealHorario.fim}
                               </Typography>
                             )}
                          </Box>
                          <IconButton size="small" color="primary" onClick={() => handleOpenAdd(dateStr, ref)} sx={{ mt: -0.5 }}>
                             <Pencil size={14} />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {Object.keys(grouped).sort().map(cat => (
                            <details key={cat} open style={{ width: '100%' }}>
                              <Box component="summary" sx={{ 
                                cursor: 'pointer', 
                                listStyle: 'none', 
                                '&::-webkit-details-marker': { display: 'none' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                py: 0.3,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                              }}>
                                <ChevronDown size={10} style={{ transform: 'rotate(-90deg)', transition: '0.2s' }} className="details-chevron" />
                                <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 9, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  {cat} ({grouped[cat].length})
                                </Typography>
                                <Divider sx={{ flexGrow: 1, ml: 1, opacity: 0.5 }} />
                              </Box>
                              
                              <Box sx={{ mt: 0.5, mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1.5 }}>
                                {grouped[cat].map(item => {
                                  const quota = Math.round(mealComensais * (item.fator_multiplicador || 1));
                                  return (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, borderRadius: 0.5, bgcolor: 'action.hover' }}>
                                      <Typography variant="caption" sx={{ flexGrow: 1, fontSize: 11 }}>
                                        {(item as any).fichas_tecnicas_uan?.nome}
                                      </Typography>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={quota}
                                        onChange={(e) => {
                                          const newQuota = Number(e.target.value) || 0;
                                          const newFator = mealComensais > 0 ? newQuota / mealComensais : 1;
                                          setGrade(prev => prev.map(g => g.id === item.id ? { ...g, fator_multiplicador: newFator } : g));
                                        }}
                                        sx={{ width: 45, '& .MuiInputBase-input': { fontSize: 10, p: 0.2, textAlign: 'center' } }}
                                      />
                                      <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id!)} sx={{ p: 0.2 }}>
                                        <Trash2 size={10} />
                                      </IconButton>
                                    </Box>
                                  );
                                })}
                              </Box>
                              <style>{`
                                details[open] .details-chevron { transform: rotate(0deg) !important; }
                              `}</style>
                            </details>
                          ))}
                          {itens.length === 0 && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 1 }}>
                               Vazio
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL ADICIONAR PREPARAÇÃO (MULTI-SELEÇÃO AGRUPADA COM ACCORDION) */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Planejar: {cellTarget?.refeicao} ({cellTarget?.data ? new Date(cellTarget.data + 'T12:00:00Z').toLocaleDateString() : ''})
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Edição Contextual de Comensais */}
          <Box sx={{ mb: 4, p: 2, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="primary.main" fontWeight="bold">Comensais previstos para esta refeição:</Typography>
            <TextField 
              size="small"
              type="number"
              value={tempComensaisRefeicao}
              onChange={e => setTempComensaisRefeicao(Number(e.target.value) || 0)}
              sx={{ width: 100, bgcolor: 'white' }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Selecionar Fichas Técnicas (FTP):</Typography>
          
          {Array.from(new Set(fichas.map(f => f.categoria_uan || "Outros"))).sort().map(cat => (
            <Accordion key={cat} variant="outlined" defaultExpanded={cat === 'Prato Principal'}>
              <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  {cat} ({fichas.filter(f => (f.categoria_uan || "Outros") === cat).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {fichas.filter(f => (f.categoria_uan || "Outros") === cat).map(f => (
                    <Grid item xs={12} sm={6} md={4} key={f.id}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={selecionados.includes(f.id)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.checked) setSelecionados(prev => [...prev, f.id]);
                              else setSelecionados(prev => prev.filter(id => id !== f.id));
                            }}
                          />
                        }
                        label={<Typography variant="body2">{f.nome}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleLocalAddMulti} 
            startIcon={<Plus />}
          >
            Confirmar e Adicionar ({selecionados.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL CONFIGURAÇÃO DO DIA */}
      <Dialog open={diagConfigOpen} onClose={() => setDiagConfigOpen(false)}>
        <DialogTitle>Configurar Dia: {configTarget?.data}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={tempFunciona} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempFunciona(e.target.checked)} 
                />
              }
              label="Cozinha funciona nesta data?"
            />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Comensais e Horários</Typography>
            <Grid container spacing={2}>
              {Object.keys(tempComensaisMap).map(ref => (
                <Grid item xs={12} key={ref}>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 100 }}>{ref}</Typography>
                      <TextField 
                        label="Comensais"
                        type="number"
                        size="small"
                        sx={{ width: 100 }}
                        value={tempComensaisMap[ref]}
                        onChange={e => {
                           const v = Number(e.target.value) || 0;
                           setTempComensaisMap(p => ({ ...p, [ref]: v }));
                        }}
                        disabled={!tempFunciona}
                      />
                      <TextField 
                        label="Início"
                        type="time"
                        size="small"
                        sx={{ width: 120 }}
                        value={tempHorariosMap[ref]?.inicio || ''}
                        onChange={e => setTempHorariosMap(p => ({ ...p, [ref]: { ...p[ref], inicio: e.target.value } }))}
                        disabled={!tempFunciona}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField 
                        label="Fim"
                        type="time"
                        size="small"
                        sx={{ width: 120 }}
                        value={tempHorariosMap[ref]?.fim || ''}
                        onChange={e => setTempHorariosMap(p => ({ ...p, [ref]: { ...p[ref], fim: e.target.value } }))}
                        disabled={!tempFunciona}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary" mt={1}>
               Total de comensais estimado: {Object.values(tempComensaisMap).reduce((a, b) => a + b, 0)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagConfigOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveConfigDia}>Salvar Configuração</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
