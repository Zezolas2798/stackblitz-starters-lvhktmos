'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioUAN, CardapioDiaUAN, FichaTecnicaUAN } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
  Divider, Grid, FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Tooltip, Badge
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowLeft, Plus, Save, Trash2, CalendarDays, Loader2, RefreshCw, ChevronDown, Pencil, Settings, Tag, X, ShieldAlert, AlertTriangle, Wand2 } from 'lucide-react';
import { validateMenuGrid, ValidationAlert, FichaValidationData } from '@/lib/uan-validator';
import { CardapioRegraVariedade, PerfilCardapio, PerfilCardapioSlot } from '@/lib/types';
const DEFAULT_REFEICOES = ['Desjejum', 'Colação', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];
import { MEAL_CATEGORY_GROUPS, REFEICAO_TO_GROUP } from '@/lib/uan-constants';
export default function GradeCardapioUANPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { activeClientId, unidadeId } = useClient();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  
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

  // Estado para o Calendário
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({}); // 'YYYY-MM-DD_Refeicao' -> boolean
  const [isGenerating, setIsGenerating] = useState(false);

  // LINTER & AQPC State
  const [regras, setRegras] = useState<CardapioRegraVariedade[]>([]);
  const [perfisMap, setPerfisMap] = useState<Record<string, PerfilCardapio & { slots?: PerfilCardapioSlot[] }>>({});
  const [perfisRefeicao, setPerfisRefeicao] = useState<Record<string, string>>({}); // { Ref: PerfilId }
  const [fichasMap, setFichasMap] = useState<Record<string, FichaValidationData>>({});
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!activeClientId) return;
    setLoading(true);

    // 1. Busca Cardápio
    const { data: cData, error: cErr } = await supabase
      .from('cardapios_uan')
      .select('*')
      .eq('id', params.id)
      .single();

    if (cData) setCardapio(cData as unknown as CardapioUAN);

    // 2. Busca Fichas Disponíveis (com composição para cálculo de custo)
    const { data: fData } = await supabase
      .from('fichas_tecnicas_uan')
      .select('*, composicao_fichas_uan(peso_bruto_g, ingrediente:ingredientes(preco_ultima_compra))')
      .eq('cliente_id', activeClientId)
      .order('nome');
    
    if (fData) {
      setFichas(fData as unknown as FichaTecnicaUAN[]);
      
      const fMap: Record<string, FichaValidationData> = {};
      fData.forEach((f: any) => {
        let custo = 0;
        if (f.composicao_fichas_uan && Array.isArray(f.composicao_fichas_uan)) {
          f.composicao_fichas_uan.forEach((comp: any) => {
            const pbKg = comp.peso_bruto_g / 1000;
            const precoKg = comp.ingrediente?.preco_ultima_compra || 0;
            custo += (pbKg * precoKg);
          });
        }
        
        const rendimento = f.rendimento_porcoes || 1;
        const custoPorca = custo / rendimento;
        
        fMap[f.id] = { ...f, custo_por_porcao: custoPorca } as FichaValidationData;
      });
      setFichasMap(fMap);
    }

    // 3. Busca Grade Atual
    const { data: gData } = await supabase
      .from('cardapio_dias_uan')
      .select('*, fichas_tecnicas_uan(nome, categoria_uan)')
      .eq('cardapio_id', params.id);
      
    if (gData) setGrade(gData as unknown as Partial<CardapioDiaUAN>[]);

    // X1. Busca Regras de Variedade
    const { data: rData } = await supabase.from('cardapio_regras_variedade' as any).select('*').eq('cliente_id', activeClientId).eq('ativo', true);
    if (rData) setRegras(rData as any);

    // X2. Busca Perfis e Mapeamentos
    const { data: pMapData } = await supabase.from('cardapio_perfis_refeicao' as any).select('*').eq('cardapio_id', params.id);
    if (pMapData) {
      const pr: Record<string, string> = {};
      pMapData.forEach((pm: any) => { pr[pm.refeicao] = pm.perfil_id; });
      setPerfisRefeicao(pr);
      
      if (pMapData.length > 0) {
        const perfisIds = Array.from(new Set(pMapData.map((d: any) => d.perfil_id)));
        const { data: profiles } = await supabase.from('perfis_cardapio' as any).select('*, slots:perfil_cardapio_slots(*)').in('id', perfisIds);
        if (profiles) {
          const map: Record<string, any> = {};
          profiles.forEach((p: any) => map[p.id] = p);
          setPerfisMap(map);
        }
      }
    }

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
  };

  useEffect(() => {
    fetchData();
  }, [activeClientId, params.id]);

  // ENGINE DO LINTER (REATIVO)
  useEffect(() => {
    if (!cardapio || grade.length === 0 || !activeClientId) {
      setValidationAlerts([]);
      return;
    }
    const diasRange = calendarDays.filter(Boolean) as string[];
    const alerts = validateMenuGrid(grade, perfisRefeicao, perfisMap, regras, fichasMap, diasRange);
    setValidationAlerts(alerts);
  }, [grade, regras, perfisRefeicao, perfisMap, fichasMap, cardapio]);

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

  const handleClearMeal = (dateStr: string, refeicao: string) => {
    setGrade(prev => prev.filter(g => !(g.data_consumo === dateStr && g.tipo_refeicao === refeicao)));
  };

  const handleGenerateAutomagic = async () => {
    if(!activeClientId) return;
    setIsGenerating(true);
    
    // Preparar Payload Limpo
    const diasRange = calendarDays.filter(Boolean) as string[];
    
    const plainFichas = Object.values(fichasMap).map(f => ({
       id: f.id,
       nome: f.nome,
       categoria_uan: f.categoria_uan,
       cor_predominante: f.cor_predominante,
       textura_principal: f.textura_principal,
       metodo_coccao: f.metodo_coccao,
       rico_em_enxofre: f.rico_em_enxofre,
       custo_por_porcao: f.custo_por_porcao
    }));

    try {
      const { data, error } = await supabase.functions.invoke('uan-csp-generator', {
        body: {
          diasAtivos: diasRange,
          perfisRefeicao: perfisRefeicao,
          perfisMap: perfisMap,
          regras: regras,
          fichas: plainFichas
        }
      });

      if (error || !data) {
        throw new Error(data?.error || error?.message || 'Erro Desconhecido.');
      }

      if (data.gradeOutput) {
        setGrade(data.gradeOutput);
        alert('Cardápio Gerado Automaticamente com Sucesso! Analise os Linter Alerts para refinamento fino.');
      }

    } catch (e: any) {
      alert(`Falha na Geração Automática: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
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
    
    const hardAlerts = validationAlerts.filter(a => a.severity === 'HARD');
    if (hardAlerts.length > 0) {
       alert(`Não é possível salvar. Existem ${hardAlerts.length} violações de severidade HARD (Ex: Custo Estourado, Regras Rígidas ou Faltam Slots Obrigatórios). Por favor, corrija os alertas em vermelho primeiro.`);
       setAlertsDialogOpen(true);
       return;
    }

    setSalvando(true);
    
    try {
      // 0. Deduplicação Global: Garante que não existam fichas duplicadas no mesmo (dia, refeição)
      const sanitizedGrade = grade.reduce((acc, curr) => {
        const key = `${curr.data_consumo}_${curr.tipo_refeicao}_${curr.ficha_uan_id}`;
        const existingIdx = acc.findIndex(i => `${i.data_consumo}_${i.tipo_refeicao}_${i.ficha_uan_id}` === key);
        if (existingIdx === -1) {
          acc.push(curr);
        } else if (curr.id && !acc[existingIdx].id) {
          acc[existingIdx] = curr;
        }
        return acc;
      }, [] as Partial<CardapioDiaUAN>[]);

      // 1. Salva alterações no objeto principal do cardápio (exceções de comensais)
      const { error: cErr } = await supabase
        .from('cardapios_uan')
        .update({ config_excecoes_dias: cardapio.config_excecoes_dias } as any)
        .eq('id', cardapio.id);

      if (cErr) throw new Error("Erro ao salvar configurações de comensais.");

      // 2. Prepara payload unificado para UPSERT (Insert + Update em lote)
      const payload = sanitizedGrade.map(g => ({
        cardapio_id: cardapio.id,
        ficha_uan_id: g.ficha_uan_id!,
        data_consumo: g.data_consumo!,
        tipo_refeicao: g.tipo_refeicao!,
        fator_multiplicador: g.fator_multiplicador || 1
      }));

      if (payload.length > 0) {
        const { error: upsertErr } = await supabase
          .from('cardapio_dias_uan')
          .upsert(payload, { 
            onConflict: 'cardapio_id,data_consumo,tipo_refeicao,ficha_uan_id' 
          });

        if (upsertErr) throw upsertErr;
      }

      // 3. Verifica itens deletados (se o usuário removeu algo da grade na UI)
      // Nota: Atualmente a UI só parece permitir deletar itens que não foram salvos ainda,
      // mas se houver uma lista de IDs deletados, eles deveriam ser processados separadamente.
      // Como a UI original não parece rastrear 'deletions' explicitamente para o banco no momento do save,
      // manteremos o comportamento atual de apenas persistir o que está na grade.

      await fetchData(); // Recarrega os dados do banco para garantir que temos os IDs reais e dados frescos
      alert("Grade salva com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar grade:", err);
      alert(err.message || "Erro ao salvar a grade.");
    } finally {
      setSalvando(false);
    }
  };

  const handleSyncWithProduction = async () => {
    if (!cardapio || !activeClientId) return;
    
    // 1. Validar se a grade foi salva (não deve haver IDs temp_)
    const hasTemp = grade.some(g => g.id?.toString().startsWith('temp_'));
    if (hasTemp) {
      const confirmSave = confirm("Existem alterações não salvas. Deseja salvar antes de sincronizar?");
      if (confirmSave) {
        await handleSalvarGrade();
      } else {
        return;
      }
    }

    setSincronizando(true);
    try {
      // 2. Agrupar grade por Data e Refeição
      const groups = grade.reduce((acc, item) => {
        const key = `${item.data_consumo}_${item.tipo_refeicao}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, typeof grade>);

      let ordensProcessadas = 0;
      let itensSincronizados = 0;

      for (const [key, items] of Object.entries(groups)) {
        const [dateStr, mealStr] = key.split('_');
        
        // A. Verificar se a cozinha funciona e obter comensais
        const config = cardapio.config_excecoes_dias?.[dateStr] || {};
        const d = new Date(dateStr + 'T12:00:00Z');
        const dayOfWeek = d.getDay().toString();
        const isOff = config.funciona !== undefined ? !config.funciona : !cardapio.dias_funcionamento?.includes(d.getDay());
        
        if (isOff) continue;

        const comensais = config.comensais?.[mealStr] ?? cardapio.comensais_modelo?.[dayOfWeek]?.[mealStr] ?? cardapio.comensais_estimados_dia ?? 0;
        if (comensais <= 0) continue;

        // B. Buscar Ordem existente para este Cardápio/Data/Refeição
        const { data: existingOrdem } = await supabase
          .from('producao_ordens')
          .select('id, status, codigo')
          .eq('cardapio_id', cardapio.id)
          .eq('data_prevista', dateStr)
          .eq('refeicao_slug', mealStr)
          .single();

        // Se existir e não estiver PLANEJADA, pulamos (não sobrescrever produção em andamento)
        if (existingOrdem && existingOrdem.status !== 'PLANEJADA') {
          console.log(`Pulando sincronização para ${dateStr} ${mealStr} - Status: ${existingOrdem.status}`);
          continue;
        }

        // C. Upsert Ordem de Produção
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const targetUnidadeId = cardapio.unidade_id || unidadeId; // Prioritizar unidade do cardápio, fallback para a selecionada
        const generatedCodigo = `UAN-${dateStr.replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

        if (!targetUnidadeId) {
          throw new Error("Nenhuma unidade selecionada ou vinculada ao cardápio.");
        }

        const { data: orderData, error: orderErr } = await supabase
          .from('producao_ordens')
          .upsert({
            id: existingOrdem?.id,
            unidade_id: targetUnidadeId,
            cardapio_id: cardapio.id,
            codigo: existingOrdem?.codigo || generatedCodigo,
            data_prevista: dateStr,
            refeicao_slug: mealStr,
            status: 'PLANEJADA',
            titulo: `Sincronizado do cardápio: ${cardapio.nome_ciclo}`,
            created_by: userId
          } as any)
          .select()
          .single();

        if (orderErr) throw orderErr;
        const ordemId = orderData.id;

        // D. Sincronizar Itens da Ordem
        // Deletamos itens antigos da ordem para reinserir os atuais do cardápio
        await supabase.from('producao_ordens_itens').delete().eq('ordem_id', ordemId);

        const itemsPayload = items.map(it => ({
          ordem_id: ordemId,
          ficha_uan_id: it.ficha_uan_id,
          quantidade_planejada: Math.round(comensais * (it.fator_multiplicador || 1)),
          setor_producao_id: cardapio.setor_producao_id // Usar o setor padrão configurado no cardápio
        }));

        const { error: itemsErr } = await supabase.from('producao_ordens_itens').insert(itemsPayload as any);
        if (itemsErr) throw itemsErr;

        // E. Gerar Requisição (RPC)
        const { error: rpcErr } = await supabase.rpc('gerar_requisicao_producao', { p_ordem_id: ordemId });
        if (rpcErr) console.warn(`Erro ao gerar requisição para ordem ${ordemId}:`, rpcErr);

        ordensProcessadas++;
        itensSincronizados += items.length;
      }

      alert(`Sincronização concluída!\n${ordensProcessadas} Ordens de Produção atualizadas/criadas.\n${itensSincronizados} Pratos vinculados.`);
    } catch (err: any) {
      console.error("Erro na sincronização:", err);
      alert("Erro ao sincronizar com produção: " + err.message);
    } finally {
      setSincronizando(false);
    }
  };

  const getCalendarDays = () => {
    if (!cardapio) return [];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0-6
    
    const calendar = [];
    
    // Dias vazios no início
    for (let i = 0; i < firstDayWeekday; i++) {
      calendar.push(null);
    }
    
    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d, 12, 0, 0);
      calendar.push(date.toISOString().split('T')[0]);
    }
    
    return calendar;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const refeicoesAtivas = cardapio?.refeicoes_oferecidas?.length ? cardapio.refeicoes_oferecidas : DEFAULT_REFEICOES;

  const handleOpenMealDialog = (date: string, meal: string) => {
    setActiveDay(date);
    setActiveMeal(meal);
    
    // Sincroniza comensais temporários se necessário
    const config = cardapio?.config_excecoes_dias?.[date] || {};
    const d = new Date(date + 'T12:00:00Z');
    const dayOfWeek = d.getDay().toString();
    const comensais = config.comensais?.[meal] ?? cardapio?.comensais_modelo?.[dayOfWeek]?.[meal] ?? cardapio?.comensais_estimados_dia ?? 0;
    setTempComensaisRefeicao(comensais);
    
    setMealDialogOpen(true);
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><Loader2 className="animate-spin" /></Box>;
  if (!cardapio) return <Box p={4}>Cardápio não encontrado.</Box>;

  return (
    <Box p={4}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push('/uan/cardapios')}>Voltar</Button>
        <Typography variant="h5" fontWeight="bold" flexGrow={1}>
          Grade de Cardápio: {cardapio.nome_ciclo}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={sincronizando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            onClick={handleSyncWithProduction}
            disabled={sincronizando || salvando}
            color="secondary"
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar com Produção'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
            onClick={handleGenerateAutomagic}
            disabled={salvando || sincronizando || isGenerating}
            sx={{
               background: isGenerating ? 'grey' : 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
               boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            }}
          >
            {isGenerating ? 'Calculando CSP...' : 'Gerar Auto (Beta)'}
          </Button>

          <Badge badgeContent={validationAlerts.length} color={validationAlerts.some(a => a.severity === 'HARD') ? 'error' : 'warning'}>
            <Button
              variant={validationAlerts.length > 0 ? "contained" : "outlined"}
              color={validationAlerts.some(a => a.severity === 'HARD') ? 'error' : 'warning'}
              startIcon={validationAlerts.some(a => a.severity === 'HARD') ? <ShieldAlert /> : <AlertTriangle />}
              onClick={() => setAlertsDialogOpen(true)}
              sx={{ ml: 2, mr: 2 }}
            >
              Linter AQPC
            </Button>
          </Badge>

          <Button 
            variant="contained" 
            startIcon={salvando ? <Loader2 className="animate-spin" /> : <Save />}
            onClick={handleSalvarGrade}
            disabled={salvando || sincronizando || isGenerating}
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box display="flex" gap={3}>
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
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center', fontWeight: 'bold', textTransform: 'capitalize' }}>
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </Typography>
          <IconButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
          </IconButton>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {weekDays.map(day => (
          <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
            {day.toUpperCase()}
          </Box>
        ))}
        
        {calendarDays.map((dateStr, idx) => {
          if (!dateStr) return <Paper key={`empty-${idx}`} sx={{ minHeight: 120, bgcolor: 'action.hover', opacity: 0.5, border: '1px dashed #ccc' }} />;
          
          const d = new Date(dateStr + 'T12:00:00Z');
          const dayNum = d.getDate();
          const dayOfWeek = d.getDay(); // 0-6 (Dom-Sáb)
          const feriado = feriados.find(f => f.date === dateStr);
          const config = cardapio.config_excecoes_dias?.[dateStr] || {};
          
          // Considera OFF se não estiver nos dias_funcionamento e não houver exceção forçando ON
          const isNormallyOff = !cardapio.dias_funcionamento?.includes(dayOfWeek);
          const isOff = config.funciona !== undefined ? !config.funciona : isNormallyOff;
          
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          
          return (
            <Paper 
              key={dateStr} 
              sx={{ 
                minHeight: 150, 
                display: 'flex', 
                flexDirection: 'column',
                border: isToday ? '2px solid primary.main' : '1px solid #eee',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
              }}
            >
              <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isOff ? 'action.disabledBackground' : 'transparent' }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: isOff ? 'text.disabled' : 'inherit' }}>
                    {dayNum}
                  </Typography>
                  {feriado && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.6rem', 
                        color: 'error.main', 
                        fontWeight: 'bold',
                        bgcolor: 'error.light',
                        px: 0.5,
                        borderRadius: 0.5,
                        opacity: 0.8,
                        maxWidth: 100,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {feriado.name}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" onClick={() => handleOpenConfigDia(dateStr)}>
                  <Settings size={12} />
                </IconButton>
              </Box>

              <Box sx={{ p: 0.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {!isOff ? (
                  refeicoesAtivas.filter(ref => {
                    // Só mostra se tiver comensais configurados para este dia (modelo ou exceção)
                    const c = config.comensais?.[ref] ?? cardapio.comensais_modelo?.[dayOfWeek.toString()]?.[ref] ?? 0;
                    // Se houver itens na grade, deve mostrar mesmo que comensais seja 0 (para permitir remoção/ajuste)
                    const hasItems = grade.some(g => g.data_consumo === dateStr && g.tipo_refeicao === ref);
                    return c > 0 || hasItems;
                  }).map(ref => {
                    // ---------------- CARD DE REFEIÇÃO (INNER) ----------------
                    const mealItems = grade.filter(g => g.data_consumo === dateStr && g.tipo_refeicao === ref);
                    const hasItems = mealItems.length > 0;
                    const expKey = `${dateStr}_${ref}`;
                    const isExpanded = expandedMeals[expKey];
                    
                    const mealAlerts = validationAlerts.filter(a => a.data_consumo === dateStr && (a.tipo_refeicao === ref || !a.tipo_refeicao));
                    const hasError = mealAlerts.some(a => a.severity === 'HARD');
                    const hasWarning = !hasError && mealAlerts.some(a => a.severity === 'SOFT');

                    // Agrupa por categoria (Deduplicando nomes na visualização também)
                    const grouped = mealItems.reduce((acc, curr) => {
                      const cat = (curr as any).fichas_tecnicas_uan?.categoria_uan || 'Outros';
                      const name = (curr as any).fichas_tecnicas_uan?.nome || 'Sem nome';
                      if (!acc[cat]) acc[cat] = new Set();
                      acc[cat].add(name);
                      return acc;
                    }, {} as Record<string, Set<string>>);

                    return (
                      <Box 
                        key={ref}
                        sx={{ 
                          p: 0.75, 
                          borderRadius: 1, 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          transition: 'all 0.2s',
                          bgcolor: hasItems ? alpha(theme.palette.primary.main, 0.03) : 'action.hover',
                          border: '2px solid',
                          borderColor: hasError ? 'error.main' : hasWarning ? 'warning.main' : hasItems ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          position: 'relative',
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderColor: hasError ? 'error.light' : hasWarning ? 'warning.light' : alpha(theme.palette.primary.main, 0.2),
                            '& .action-btns': { opacity: 1 }
                          }
                        }}
                      >
                        <Box 
                          display="flex" 
                          justifyContent="space-between" 
                          alignItems="center"
                          onClick={() => hasItems && setExpandedMeals(prev => ({ ...prev, [expKey]: !isExpanded }))}
                          sx={{ cursor: hasItems ? 'pointer' : 'default' }}
                        >
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {hasItems && (
                              <ChevronDown 
                                size={12} 
                                style={{ 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s',
                                  color: theme.palette.primary.main
                                }} 
                              />
                            )}
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: hasItems ? 'primary.main' : 'text.secondary', textTransform: 'uppercase' }}>
                              {ref}
                            </Typography>
                            {!isExpanded && hasItems && (
                              <Chip label={mealItems.length} size="small" sx={{ height: 14, fontSize: '0.55rem', ml: 0.5, bgcolor: 'primary.light', color: 'white' }} />
                            )}
                          </Box>
                          
                          <Box className="action-btns" sx={{ opacity: isExpanded ? 1 : 0.3, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMealDialog(dateStr, ref);
                              }}
                              sx={{ p: 0.2, color: 'primary.main' }}
                            >
                              <Pencil size={10} />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {isExpanded && hasItems && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.2, borderTop: '1px dashed #eee', pt: 1 }}>
                            {Object.entries(grouped).map(([cat, namesSet]) => (
                              <Box key={cat}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: 'text.secondary', lineHeight: 1 }}>
                                  {cat}:
                                </Typography>
                                {Array.from(namesSet).map((name, i) => (
                                  <Typography key={i} sx={{ fontSize: '0.6rem', color: 'text.primary', pl: 0.5, lineHeight: 1.1 }}>
                                    • {name}
                                  </Typography>
                                ))}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="caption" color="text.disabled" fontWeight="bold">FECHADO</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* MODAL EDITAR REFEIÇÃO (POR CATEGORIZAÇÃO) */}
      <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Box>
            <Typography variant="h6">{activeMeal}</Typography>
            <Typography variant="caption">{activeDay ? new Date(activeDay + 'T12:00:00Z').toLocaleDateString() : ''}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setMealDialogOpen(false)} sx={{ color: 'white' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Comensais:</Typography>
            <TextField 
              size="small"
              type="number"
              value={tempComensaisRefeicao}
              onChange={e => setTempComensaisRefeicao(Number(e.target.value) || 0)}
              sx={{ width: 100, bgcolor: 'white' }}
            />
          </Box>

          <Box display="flex" flexDirection="column" gap={3}>
            {(() => {
              const groupKey = REFEICAO_TO_GROUP[activeMeal!] || 'ALMOCO_JANTAR';
              const categoriesToShow = [...(MEAL_CATEGORY_GROUPS[groupKey] || [])];
              
              const existingItemCategories = Array.from(new Set(
                grade
                  .filter(g => g.data_consumo === activeDay && g.tipo_refeicao === activeMeal)
                  .map(g => (g as any).fichas_tecnicas_uan?.categoria_uan)
                  .filter(Boolean)
              ));
              
              existingItemCategories.forEach(cat => {
                if (!categoriesToShow.includes(cat)) categoriesToShow.push(cat);
              });

              return categoriesToShow.map(cat => {
                const categoryItems = grade.filter(g => g.data_consumo === activeDay && g.tipo_refeicao === activeMeal && (g as any).fichas_tecnicas_uan?.categoria_uan === cat);
                const filteredOptions = fichas.filter(f => 
                  (f.categoria_uan || "Sem Categoria") === cat &&
                  (!f.refeicoes || f.refeicoes.length === 0 || f.refeicoes.includes(activeMeal!))
                );

                return (
                  <Box key={cat}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                        {cat}
                      </Typography>
                    </Box>
                    <Autocomplete
                      multiple
                      options={filteredOptions}
                      getOptionLabel={(option) => option.nome}
                      value={filteredOptions.filter(o => categoryItems.some(item => item.ficha_uan_id === o.id))}
                      onChange={(_, newValues) => {
                        setGrade(prev => {
                          const newValIds = newValues.map(v => v.id);
                          let next = prev.filter(g => !(g.data_consumo === activeDay && g.tipo_refeicao === activeMeal && (g as any).fichas_tecnicas_uan?.categoria_uan === cat));
                          next = next.filter(g => !(g.data_consumo === activeDay && g.tipo_refeicao === activeMeal && newValIds.includes(g.ficha_uan_id!)));
                          const newItems = newValues.map(val => {
                            const existing = categoryItems.find(item => item.ficha_uan_id === val.id);
                            return {
                              id: existing?.id || `temp_${Date.now()}_${val.id}`,
                              cardapio_id: cardapio.id,
                              ficha_uan_id: val.id,
                              data_consumo: activeDay!,
                              tipo_refeicao: activeMeal!,
                              fator_multiplicador: existing?.fator_multiplicador || 1,
                              fichas_tecnicas_uan: { nome: val.nome, categoria_uan: val.categoria_uan }
                            };
                          });
                          return [...next, ...newItems];
                        });
                      }}
                      renderInput={(params) => <TextField {...params} size="small" placeholder="Selecione as opções..." />}
                      renderTags={(value: FichaTecnicaUAN[], getTagProps) =>
                        value.map((option: FichaTecnicaUAN, index: number) => (
                          <Chip label={option.nome} size="small" {...getTagProps({ index })} key={option.id} />
                        ))
                      }
                    />
                  </Box>
                );
              });
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Button variant="contained" fullWidth onClick={() => {
            // Salva os comensais da refeição na exceção
            const currentExcecoes = { ...(cardapio.config_excecoes_dias || {}) };
            const diaExcecao = currentExcecoes[activeDay!] || { funciona: true, comensais: {}, horarios: {} };
            const novosComensais = { ...(diaExcecao.comensais || {}), [activeMeal!]: tempComensaisRefeicao };
            currentExcecoes[activeDay!] = { ...diaExcecao, comensais: novosComensais };
            setCardapio({ ...cardapio, config_excecoes_dias: currentExcecoes });
            
            setMealDialogOpen(false);
          }}>
            Concluir Edição
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
      {/* ALERTS DIALOG (LINTER) */}
      <Dialog open={alertsDialogOpen} onClose={() => setAlertsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldAlert color="red" /> Linter AQPC & Nutricional ({validationAlerts.length} Alertas)
        </DialogTitle>
        <DialogContent dividers>
          {validationAlerts.length === 0 ? (
            <Typography>Tudo perfeito! Nenhuma regra violada até o momento.</Typography>
          ) : (
            <Grid container spacing={2}>
              {validationAlerts.map((a, i) => (
                <Grid item xs={12} key={i}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: a.severity === 'HARD' ? 'error.main' : 'warning.main', bgcolor: a.severity === 'HARD' ? alpha('#f44336', 0.05) : alpha('#ff9800', 0.05) }}>
                    <Typography variant="subtitle2" color={a.severity === 'HARD' ? 'error' : 'warning.dark'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {a.severity === 'HARD' ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                      [ {a.data_consumo.split('-').reverse().join('/')} {a.tipo_refeicao ? `- ${a.tipo_refeicao}` : ''} ] - Regra: {a.ruleType.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {a.message}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertsDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
