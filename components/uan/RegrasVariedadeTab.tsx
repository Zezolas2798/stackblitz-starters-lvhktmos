'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { CardapioRegraVariedade, TipoRegraVariedade } from '@/lib/types';
import {
  Box, Typography, Button, Paper, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Switch, FormControlLabel, InputAdornment, CircularProgress,
  Divider, Accordion, AccordionSummary, AccordionDetails, Checkbox, Slider
} from '@mui/material';
import { PlusCircle, Edit3, Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Settings2, ChevronDown, RefreshCw, Plus, Layers, Target } from 'lucide-react';
import { COLORS_AQPC, METHODS_AQPC, TEXTURES_AQPC } from '@/lib/uan-constants';

const PROTEIN_GROUP_IDS = [
  '891ea919-fac8-48d0-b985-26cc6b46d049', // Aves
  '050d1d7b-c2e6-4abd-98c5-17ab8c6240cb', // Carnes Suínas
  '3ba507e2-2515-4b90-934e-35ceda97fc09', // Carnes Bovinas
  '88055c58-06d7-414c-964b-993561feecdf', // Pescados e Frutos do Mar
  '67820f74-908b-42fd-8a7a-397386c0f4e0', // Ovos
  'b4267b71-8662-456b-955b-df2c1891b355', // Embutidos, Frios e Curados
  '45a6c299-59d5-455c-b26b-df592720d573'  // Outras Carnes/Exóticas
];

const UAN_COLORS = [
  { id: 'Branco', label: 'Branco', color: '#ffffff' },
  { id: 'Verde', label: 'Verde', color: '#2e7d32' },
  { id: 'Amarelo', label: 'Amarelo', color: '#fbc02d' },
  { id: 'Laranja', label: 'Laranja', color: '#ef6c00' },
  { id: 'Vermelho', label: 'Vermelho', color: '#d32f2f' },
  { id: 'Rosa', label: 'Rosa', color: '#f06292' },
  { id: 'Roxo', label: 'Roxo', color: '#7b1fa2' },
  { id: 'Marrom', label: 'Marrom', color: '#8B4513' },
  { id: 'Bege', label: 'Bege', color: '#f5f5dc' },
  { id: 'Preto', label: 'Preto', color: '#212121' },
  { id: 'Misto', label: 'Colorido (Misto)', color: 'linear-gradient(45deg, #f44336, #4caf50, #2196f3)' }
];


const PROTEIN_FAMILIES = [
  { id: '3ba507e2-2515-4b90-934e-35ceda97fc09', label: 'Carnes Bovinas' },
  { id: '891ea919-fac8-48d0-b985-26cc6b46d049', label: 'Aves' },
  { id: '050d1d7b-c2e6-4abd-98c5-17ab8c6240cb', label: 'Carnes Suínas' },
  { id: '88055c58-06d7-414c-964b-993561feecdf', label: 'Pescados/Frutos do Mar' },
  { id: '67820f74-908b-42fd-8a7a-397386c0f4e0', label: 'Ovos' },
  { id: '45a6c299-59d5-455c-b26b-df592720d573', label: 'Outras Carnes/Exóticas' }
];

const getColorIcon = (color: string) => {
  const c = UAN_COLORS.find(u => u.id === color);
  return c?.color || '#eee';
};

const TIPOS_REGRA: { value: TipoRegraVariedade, label: string, helper: string, hasAlvo?: boolean, hasLimite?: boolean, hasJanela?: boolean, hasSimilaridade?: boolean, unidade?: string }[] = [
  { value: 'MAX_SEMANAL_FAMILIA', label: 'Máx. por Semana (Família Proteica)', helper: 'Ex: Frango no máximo 2 vezes a cada 7 dias.', hasAlvo: true, hasLimite: true, hasJanela: true, unidade: 'vezes' },
  { value: 'DISTANCIA_MINIMA_DIAS', label: 'Distância Mínima (Dias)', helper: 'Ex: Pratos exatos devem ter pelo menos 5 dias de distância.', hasJanela: true, unidade: 'dias' },
  { value: 'MAX_REFEICAO_COR', label: 'Máximo por Refeição (Cor)', helper: 'Previne monotonia visual no prato.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_COR', label: 'Máximo Diário (Cor)', helper: 'Ex: Máximo de 2 preparações "Marrom" por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_TEXTURA', label: 'Máximo Diário (Textura)', helper: 'Ex: Máximo de 2 preparações "Crocante" por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_DIARIO_METODO_COCCAO', label: 'Máximo Diário (Método de Cocção)', helper: 'Ex: Máximo de 1 fritura de imersão por dia.', hasLimite: true, hasAlvo: true, unidade: 'preparações' },
  { value: 'MAX_REFEICAO_ENXOFRE', label: 'Máximo por Refeição (Enxofre)', helper: 'Previne desconforto gástrico (flatulência) no turno.', hasLimite: true, unidade: 'itens' },
  { value: 'MAX_DIARIO_ENXOFRE', label: 'Máximo Diário (Enxofre)', helper: 'Balanceia a digestibilidade ao longo do dia.', hasLimite: true, unidade: 'itens' },
  { value: 'INCOMPATIBILIDADE_DIARIA', label: 'Incompatibilidade Diária', helper: 'Evita repetição da mesma família proteica na mesma refeição.', hasAlvo: true },
  { value: 'SIMILARIDADE_ENTRE_DIAS', label: 'Similaridade entre Dias Consecutivos', helper: 'Limite do índice de similaridade (0 a 1.0).', hasSimilaridade: true },
  { value: 'CUSTO_MAX_REFEICAO', label: 'Teto de Custo por Refeição', helper: 'Custo médio alvo (CPC) máximo permitido por comensal.', hasLimite: true, unidade: 'R$' },
  { value: 'CUSTO_MAX_DIARIO', label: 'Teto de Custo Diário', helper: 'Custo médio alvo diário máximo permitido por comensal.', hasLimite: true, unidade: 'R$' }
];

export default function RegrasVariedadeTab() {
  const { activeClientId } = useClient();
  const [regras, setRegras] = useState<CardapioRegraVariedade[]>([]);
  const [proteinGroups, setProteinGroups] = useState<{ id: string, nome: string }[]>([]);
  const [allGroups, setAllGroups] = useState<{ id: string; nome: string }[]>([]);
  const [subgroups, setSubgroups] = useState<{ id: string; nome: string; grupo_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Enxofre Settings
  const [isEnxofreDialogOpen, setIsEnxofreDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    
    // 1. Busca Grupos de Proteína
    const { data: gData } = await supabase
      .from('grupos_produto')
      .select('id, nome')
      .in('id', PROTEIN_GROUP_IDS);
    
    if (gData) setProteinGroups(gData);

    // 2. Busca Todos os Grupos e Subgrupos para Mapeamento de Enxofre
    const { data: allG } = await supabase.from('grupos_produto').select('id, nome').order('nome');
    const { data: allS } = await supabase.from('subgrupos_produto').select('id, nome, grupo_id').order('nome');
    if (allG) setAllGroups(allG);
    if (allS) setSubgroups(allS);

    // 3. Busca Regras Existentes
    const { data: rData, error: rErr } = await supabase
      .from('cardapio_regras_variedade')
      .select('*')
      .eq('cliente_id', activeClientId);

    if (rData) setRegras(rData as any);
    if (rErr) console.error('Erro ao carregar regras:', rErr);
    
    setLoading(false);
  }, [activeClientId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Função centralizada para UPSERT de regras da grade (Proteínas e Grupos)
  const handleUpdateGridRule = async (groupId: string, field: string, value: any) => {
    if (!activeClientId) return;

    // As proteínas gerenciam dois tipos de regra simultaneamente para melhor UX
    const ruleTypes = ['MAX_SEMANAL_FAMILIA', 'DISTANCIA_MINIMA_FAMILIA'];
    
    const operations = ruleTypes.map(async (t) => {
      const existing = regras.find(r => r.tipo_regra === t && r.parametro_alvo === groupId);
      
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: groupId,
        ativo: field === 'ativo' ? value : (existing?.ativo ?? true),
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        valor_limite: (field === 'valor_limite' && t === 'MAX_SEMANAL_FAMILIA') ? value : (existing?.valor_limite ?? 3),
        dias_janela: (field === 'dias_janela' && t === 'DISTANCIA_MINIMA_FAMILIA') ? value : (existing?.dias_janela ?? 2),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra da grade:", e);
    }
  };

  const handleUpdateColorRule = async (colorId: string, field: string, value: any) => {
    if (!activeClientId) return;

    const syncFields = ['ativo', 'severidade'];
    const types: ('MAX_REFEICAO_COR' | 'MAX_DIARIO_COR')[] = ['MAX_REFEICAO_COR', 'MAX_DIARIO_COR'];

    const operations = types.map(async (t) => {
      const existing = (regras || []).find(r => r.parametro_alvo === colorId && r.tipo_regra === t);
      
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: colorId,
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        ativo: field === 'ativo' ? value : (existing?.ativo ?? (syncFields.includes(field) ? false : true)),
        valor_limite: (field === 'valor_limite_ref' && t === 'MAX_REFEICAO_COR') || (field === 'valor_limite_day' && t === 'MAX_DIARIO_COR')
          ? value 
          : (existing?.valor_limite ?? (t === 'MAX_REFEICAO_COR' ? 2 : 3)),
        updated_at: new Date().toISOString()
      };

      if (field === 'ativo') payload.ativo = value;

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra de cor:", e);
    }
  };

  const handleUpdateSulphurMapping = async (subgrupoId: string, value: boolean) => {
    if (!activeClientId) return;
    const existingRule = regras.find(r => r.parametro_alvo === subgrupoId && r.tipo_regra === 'MAP_SUBGRUPO_ENXOFRE');

    try {
      if (value) {
        if (!existingRule) {
          await supabase.from('cardapio_regras_variedade').insert({
            cliente_id: activeClientId,
            tipo_regra: 'MAP_SUBGRUPO_ENXOFRE',
            parametro_alvo: subgrupoId,
            ativo: true,
            severidade: 'HARD'
          });
        }
      } else if (existingRule) {
        await supabase.from('cardapio_regras_variedade').delete().eq('id', existingRule.id);
      }
      loadData();
    } catch (e) {
      console.error("Erro ao mapear enxofre:", e);
    }
  };

  const handleUpdateEnxofreBimodalRule = async (type: 'MAX_REFEICAO_ENXOFRE' | 'MAX_DIARIO_ENXOFRE', field: string, value: any) => {
    if (!activeClientId) return;

    const syncFields = ['ativo', 'severidade'];
    const types: ('MAX_REFEICAO_ENXOFRE' | 'MAX_DIARIO_ENXOFRE')[] = syncFields.includes(field) 
      ? ['MAX_REFEICAO_ENXOFRE', 'MAX_DIARIO_ENXOFRE'] 
      : [type];

    const operations = types.map(async (t) => {
      const existing = (regras || []).find(r => r.tipo_regra === t);
      const otherType = t === 'MAX_REFEICAO_ENXOFRE' ? 'MAX_DIARIO_ENXOFRE' : 'MAX_REFEICAO_ENXOFRE';
      const otherRule = (regras || []).find(r => r.tipo_regra === otherType);

      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: 'GLOBAL_ENXOFRE',
        severidade: field === 'severidade' ? value : (existing?.severidade || otherRule?.severidade || 'SOFT'),
        ativo: field === 'ativo' ? value : (existing?.ativo ?? (syncFields.includes(field) ? false : true)),
        valor_limite: (field === 'valor_limite' && t === type) ? value : (existing?.valor_limite ?? (t === 'MAX_REFEICAO_ENXOFRE' ? 1 : 2)),
        updated_at: new Date().toISOString()
      };

      if (field === 'ativo') payload.ativo = value;

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra de enxofre:", e);
    }
  };

  const handleUpdateThreshold = async (value: number) => {
    if (!activeClientId) return;
    const existing = regras.find(r => r.tipo_regra === 'LIMIAR_PREVALENCIA_ENXOFRE');
    try {
      const payload = {
        cliente_id: activeClientId,
        tipo_regra: 'LIMIAR_PREVALENCIA_ENXOFRE',
        valor_limite: value,
        parametro_alvo: 'GLOBAL_ENXOFRE',
        ativo: true,
        severidade: 'SOFT',
        updated_at: new Date().toISOString()
      };
      if (existing) {
        await supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('cardapio_regras_variedade').insert(payload);
      }
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar limiar:", e);
    }
  };
  
  const handleUpdateSimilarityRule = async (field: string, value: any) => {
    if (!activeClientId) return;
    const existing = regras.find(r => r.tipo_regra === 'SIMILARIDADE_ENTRE_DIAS');
    try {
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: 'SIMILARIDADE_ENTRE_DIAS',
        parametro_alvo: 'GLOBAL_SIMILARIDADE',
        ativo: field === 'ativo' ? value : (existing?.ativo ?? true),
        limiar_similaridade: field === 'limiar_similaridade' ? value : (existing?.limiar_similaridade ?? 50),
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        updated_at: new Date().toISOString()
      };
      if (existing) {
        await supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('cardapio_regras_variedade').insert(payload);
      }
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar similaridade:", e);
    }
  };

  const handleUpdateMethodRule = async (method: string, type: string, field: string, value: any) => {
    if (!activeClientId) return;
    
    // Lista de tipos de regra para este método
    const ruleTypes = ['MAX_REFEICAO_METODO_COCCAO', 'MAX_DIARIO_METODO_COCCAO', 'MAX_SEMANAL_METODO_COCCAO'];
    
    const operations = ruleTypes.map(async (t) => {
      const existing = regras.find(r => r.tipo_regra === t && r.parametro_alvo === method);
      
      // Sincronizar severidade e ativo entre as 3 regras do mesmo método
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: method,
        ativo: field === 'ativo' ? value : (existing?.ativo ?? true),
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        valor_limite: (field === 'valor_limite' && t === type) ? value : (existing?.valor_limite ?? (t === 'MAX_REFEICAO_METODO_COCCAO' ? 1 : (t === 'MAX_DIARIO_METODO_COCCAO' ? 2 : 3))),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra de método:", e);
    }
  };

  const handleUpdateTextureRule = async (texture: string, type: string, field: string, value: any) => {
    if (!activeClientId) return;
    
    const ruleTypes = ['MAX_REFEICAO_TEXTURA', 'MAX_DIARIO_TEXTURA'];
    
    const operations = ruleTypes.map(async (t) => {
      const existing = regras.find(r => r.tipo_regra === t && r.parametro_alvo === texture);
      
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: texture,
        ativo: field === 'ativo' ? value : (existing?.ativo ?? true),
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        valor_limite: (field === 'valor_limite' && t === type) ? value : (existing?.valor_limite ?? (t === 'MAX_REFEICAO_TEXTURA' ? 1 : 2)),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra de textura:", e);
    }
  };

  const handleUpdateProteinRule = async (familyId: string, type: string, field: string, value: any) => {
    if (!activeClientId) return;
    
    // As proteínas usam Max Semanal e Distância Mínima
    const ruleTypes = ['MAX_SEMANAL_FAMILIA', 'DISTANCIA_MINIMA_FAMILIA'];
    
    const operations = ruleTypes.map(async (t) => {
      const existing = regras.find(r => r.tipo_regra === t && r.parametro_alvo === familyId);
      
      const payload: any = {
        cliente_id: activeClientId,
        tipo_regra: t,
        parametro_alvo: familyId,
        ativo: field === 'ativo' ? value : (existing?.ativo ?? true),
        severidade: field === 'severidade' ? value : (existing?.severidade || 'SOFT'),
        valor_limite: (field === 'valor_limite' && t === 'MAX_SEMANAL_FAMILIA') ? value : (existing?.valor_limite ?? 3),
        dias_janela: (field === 'dias_janela' && t === 'DISTANCIA_MINIMA_FAMILIA') ? value : (existing?.dias_janela ?? 2),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        return supabase.from('cardapio_regras_variedade').update(payload).eq('id', existing.id);
      } else {
        return supabase.from('cardapio_regras_variedade').insert(payload);
      }
    });

    try {
      await Promise.all(operations);
      loadData();
    } catch (e) {
      console.error("Erro ao atualizar regra de proteína:", e);
    }
  };


  if (loading && proteinGroups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Settings2 size={20} color="#1976d2" />
          <Typography variant="h6" fontWeight="bold">Parâmetros por Família Proteica</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Defina os limites de frequência e intervalo para cada grupo de proteínas principal.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell width={80}>Ativo</TableCell>
                <TableCell>Grupo / Família</TableCell>
                <TableCell align="center">Frequência Máxima (Semana)</TableCell>
                <TableCell align="center">Intervalo Mínimo (Dias)</TableCell>
                <TableCell width={150}>Severidade</TableCell>
                <TableCell width={100} align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proteinGroups.map(group => {
                const rFreq = regras.find(r => r.parametro_alvo === group.id && r.tipo_regra === 'MAX_SEMANAL_FAMILIA');
                const rDist = regras.find(r => r.parametro_alvo === group.id && r.tipo_regra === 'DISTANCIA_MINIMA_FAMILIA');
                const isAtivo = rFreq?.ativo ?? false;

                return (
                  <TableRow key={group.id} hover sx={{ opacity: isAtivo ? 1 : 0.6 }}>
                    <TableCell>
                      <Switch 
                        size="small" 
                        checked={isAtivo} 
                        onChange={(e) => handleUpdateGridRule(group.id, 'ativo', e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{group.nome}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 80 }}
                        disabled={!isAtivo}
                        value={rFreq?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateGridRule(group.id, 'valor_limite', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                        InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">x</Typography> }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 80 }}
                        disabled={!isAtivo}
                        value={rDist?.dias_janela ?? ''}
                        onChange={(e) => handleUpdateGridRule(group.id, 'dias_janela', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                        InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">dias</Typography> }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth
                        disabled={!isAtivo}
                        value={rFreq?.severidade || 'SOFT'}
                        onChange={(e) => handleUpdateGridRule(group.id, 'severidade', e.target.value)}
                      >
                        <MenuItem value="SOFT">Aviso (SOFT)</MenuItem>
                        <MenuItem value="HARD">Bloqueio (HARD)</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                       {isAtivo ? <CheckCircle2 size={18} color="#2e7d32" /> : <Box sx={{ width: 18, height: 18, border: '1px dashed #ccc', borderRadius: '50%' }} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Target size={20} color="#e53935" />
          <Typography variant="h6" fontWeight="bold">Harmonização Cromática (Cores)</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Gerencie o contraste visual. Evite pratos de cor única e repetições cansativas no dia.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#ffebee' }}>
              <TableRow>
                <TableCell width={80}>Ativo</TableCell>
                <TableCell>Cor Predominante</TableCell>
                <TableCell align="center">Max/Refeição</TableCell>
                <TableCell align="center">Max/Dia</TableCell>
                <TableCell width={150}>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {UAN_COLORS.map(colorObj => {
                const c = colorObj.id;
                const rRef = (regras || []).find(r => r.parametro_alvo === c && r.tipo_regra === 'MAX_REFEICAO_COR');
                const rDay = (regras || []).find(r => r.parametro_alvo === c && r.tipo_regra === 'MAX_DIARIO_COR');
                const isAtivo = rRef?.ativo ?? false;

                return (
                  <TableRow key={c} hover sx={{ opacity: isAtivo ? 1 : 0.6 }}>
                    <TableCell>
                      <Switch 
                        size="small" checked={isAtivo} 
                        onChange={(e) => handleUpdateColorRule(c, 'ativo', e.target.checked)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ 
                          width: 16, height: 16, borderRadius: '50%', 
                          background: getColorIcon(c), border: '1px solid #ddd' 
                        }} />
                        <Typography variant="body2" fontWeight="bold">{c}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }}
                        disabled={!isAtivo}
                        value={rRef?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateColorRule(c, 'valor_limite_ref', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }}
                        disabled={!isAtivo}
                        value={rDay?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateColorRule(c, 'valor_limite_day', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth
                        disabled={!isAtivo}
                        value={rRef?.severidade || 'SOFT'}
                        onChange={(e) => handleUpdateColorRule(c, 'severidade', e.target.value)}
                      >
                        <MenuItem value="SOFT">Aviso (SOFT)</MenuItem>
                        <MenuItem value="HARD">Bloqueio (HARD)</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ShieldAlert size={20} color="#7b1fa2" />
            <Typography variant="h6" fontWeight="bold">Digestibilidade e Flatulência (Enxofre)</Typography>
          </Box>
          <IconButton onClick={() => setIsEnxofreDialogOpen(true)} size="small">
            <Settings2 size={20} />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Controle bimodal de itens flatulentos. O sistema detecta automaticamente se a preparação é rica em enxofre baseado na composição.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f3e5f5' }}>
              <TableRow>
                <TableCell width={80}>Ativo</TableCell>
                <TableCell>Regra de Monitoramento</TableCell>
                <TableCell align="center">Max/Refeição (Extra)</TableCell>
                <TableCell align="center">Max/Dia (Total)</TableCell>
                <TableCell width={150}>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const ruleMeal = (regras || []).find(r => r.tipo_regra === 'MAX_REFEICAO_ENXOFRE');
                const ruleDay = (regras || []).find(r => r.tipo_regra === 'MAX_DIARIO_ENXOFRE');
                const isAtivo = ruleMeal?.ativo ?? false;

                return (
                  <TableRow hover sx={{ opacity: isAtivo ? 1 : 0.6 }}>
                    <TableCell>
                      <Switch 
                        size="small" checked={isAtivo} 
                        onChange={(e) => handleUpdateEnxofreBimodalRule('MAX_REFEICAO_ENXOFRE', 'ativo', e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">Limite Global de Flatulência</Typography>
                      <Typography variant="caption" color="text.secondary">Exclui o arroz/feijão do Prato Base</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }} disabled={!isAtivo}
                        value={ruleMeal?.valor_limite ?? ''} placeholder="1"
                        onChange={(e) => handleUpdateEnxofreBimodalRule('MAX_REFEICAO_ENXOFRE', 'valor_limite', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }} disabled={!isAtivo}
                        value={ruleDay?.valor_limite ?? ''} placeholder="2"
                        onChange={(e) => handleUpdateEnxofreBimodalRule('MAX_DIARIO_ENXOFRE', 'valor_limite', Number(e.target.value))}
                        inputProps={{ style: { textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth disabled={!isAtivo}
                        value={ruleMeal?.severidade || 'SOFT'}
                        onChange={(e) => handleUpdateEnxofreBimodalRule('MAX_REFEICAO_ENXOFRE', 'severidade', e.target.value)}
                      >
                        <MenuItem value="SOFT">Aviso (SOFT)</MenuItem>
                        <MenuItem value="HARD">Bloqueio (HARD)</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                );
              })()}
            </TableBody>
          </Table>
        </Paper>

        <Dialog 
          open={isEnxofreDialogOpen} 
          onClose={() => setIsEnxofreDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Settings2 size={20} />
              Configurações de Enxofre e Flatulência
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">1. Limiar de Relevância</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Define o percentual mínimo de ingredientes flatulentos no peso total da receita para disparar o alerta.
              </Typography>
              {(() => {
                const thresholdRule = regras.find(r => r.tipo_regra === 'LIMIAR_PREVALENCIA_ENXOFRE');
                return (
                  <FormControlLabel
                    control={
                      <TextField 
                        type="number" size="small" sx={{ width: 100, ml: 2 }}
                        placeholder="5"
                        value={thresholdRule?.valor_limite ?? 5}
                        onChange={(e) => handleUpdateThreshold(Number(e.target.value))}
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      />
                    }
                    label="Limiar de Ativação:"
                    labelPlacement="start"
                  />
                );
              })()}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">2. Mapeamento de Taxonomia</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Selecione os subgrupos que devem ser detectados como flatulentos pelo algoritmo.
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                {allGroups.map(group => {
                  const groupSubgroups = subgroups.filter(s => s.grupo_id === group.id);
                  if (groupSubgroups.length === 0) return null;

                  return (
                    <Accordion key={group.id} disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, border: '1px solid #eee', mb: 0.5 }}>
                      <AccordionSummary expandIcon={<ChevronDown size={14} />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 1 } }}>
                        <Typography variant="body2" fontWeight={500}>{group.nome}</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ py: 0 }}>
                        <Box display="flex" flexDirection="column">
                          {groupSubgroups.map(sub => {
                            const isMapped = regras.some(r => r.parametro_alvo === sub.id && r.tipo_regra === 'MAP_SUBGRUPO_ENXOFRE');
                            return (
                              <FormControlLabel
                                key={sub.id}
                                control={
                                  <Checkbox 
                                    size="small" checked={isMapped} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSulphurMapping(sub.id, e.target.checked)}
                                  />
                                }
                                label={<Typography variant="caption">{sub.nome}</Typography>}
                              />
                            );
                          })}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEnxofreDialogOpen(false)} variant="contained" size="small">Concluir</Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CheckCircle2 size={20} color="#689f38" />
          <Typography variant="h6" fontWeight="bold">Monitoramento por Técnica de Cocção</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Defina o teto de frequência para cada método de preparo. Evita sobrecarga de equipamentos e garante diversidade técnica.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f8e9' }}>
              <TableRow>
                <TableCell width={80}>Ativo</TableCell>
                <TableCell>Método de Cocção</TableCell>
                <TableCell align="center">Max/Refeição</TableCell>
                <TableCell align="center">Max/Dia</TableCell>
                <TableCell align="center">Max/Semana (Dias)</TableCell>
                <TableCell width={150}>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {METHODS_AQPC.map(m => {
                const rMeal = regras.find(r => r.parametro_alvo === m.id && r.tipo_regra === 'MAX_REFEICAO_METODO_COCCAO');
                const rDay = regras.find(r => r.parametro_alvo === m.id && r.tipo_regra === 'MAX_DIARIO_METODO_COCCAO');
                const rWeek = regras.find(r => r.parametro_alvo === m.id && r.tipo_regra === 'MAX_SEMANAL_METODO_COCCAO');
                const isAtivo = rMeal?.ativo ?? false;

                return (
                  <TableRow key={m.id} hover sx={{ opacity: isAtivo ? 1 : 0.6 }}>
                    <TableCell>
                      <Switch 
                        size="small" checked={isAtivo} 
                        onChange={(e) => handleUpdateMethodRule(m.id, '', 'ativo', e.target.checked)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{m.label}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }} disabled={!isAtivo}
                        value={rMeal?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateMethodRule(m.id, 'MAX_REFEICAO_METODO_COCCAO', 'valor_limite', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }} disabled={!isAtivo}
                        value={rDay?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateMethodRule(m.id, 'MAX_DIARIO_METODO_COCCAO', 'valor_limite', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 60 }} disabled={!isAtivo}
                        value={rWeek?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateMethodRule(m.id, 'MAX_SEMANAL_METODO_COCCAO', 'valor_limite', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth disabled={!isAtivo}
                        value={rMeal?.severidade || 'SOFT'}
                        onChange={(e) => handleUpdateMethodRule(m.id, '', 'severidade', e.target.value)}
                      >
                        <MenuItem value="SOFT">SOFT (Aviso)</MenuItem>
                        <MenuItem value="HARD">HARD (Bloqueio)</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Layers size={20} color="#f57c00" />
          <Typography variant="h6" fontWeight="bold">Balanceamento de Texturas (AQPC)</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Controle a harmonia sensorial. Evite excesso de preparações pastosas ou crocantes no mesmo prato.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#fff3e0' }}>
              <TableRow>
                <TableCell width={80}>Ativo</TableCell>
                <TableCell>Tipo de Textura</TableCell>
                <TableCell align="center">Max/Refeição</TableCell>
                <TableCell align="center">Max/Dia</TableCell>
                <TableCell width={150}>Severidade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TEXTURES_AQPC.map(t => {
                const rMeal = regras.find(r => r.parametro_alvo === t.id && r.tipo_regra === 'MAX_REFEICAO_TEXTURA');
                const rDay = regras.find(r => r.parametro_alvo === t.id && r.tipo_regra === 'MAX_DIARIO_TEXTURA');
                const isAtivo = rMeal?.ativo ?? false;

                return (
                  <TableRow key={t.id} hover sx={{ opacity: isAtivo ? 1 : 0.6 }}>
                    <TableCell>
                      <Switch 
                        size="small" checked={isAtivo} 
                        onChange={(e) => handleUpdateTextureRule(t.id, '', 'ativo', e.target.checked)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{t.label}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 80 }} disabled={!isAtivo}
                        value={rMeal?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateTextureRule(t.id, 'MAX_REFEICAO_TEXTURA', 'valor_limite', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        type="number" size="small" sx={{ width: 80 }} disabled={!isAtivo}
                        value={rDay?.valor_limite ?? ''}
                        onChange={(e) => handleUpdateTextureRule(t.id, 'MAX_DIARIO_TEXTURA', 'valor_limite', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth disabled={!isAtivo}
                        value={rMeal?.severidade || 'SOFT'}
                        onChange={(e) => handleUpdateTextureRule(t.id, '', 'severidade', e.target.value)}
                      >
                        <MenuItem value="SOFT">SOFT (Aviso)</MenuItem>
                        <MenuItem value="HARD">HARD (Bloqueio)</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* SEÇÃO: INEDITISMO E SIMILARIDADE */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <RefreshCw size={20} color="#00796b" />
          <Typography variant="h6" fontWeight="bold">Ineditismo e Frequência Global</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Utiliza o <strong>Índice de Jaccard</strong> para garantir que o perfil sensorial (Cores, Texturas, Métodos e Ingredientes) não se repita excessivamente entre dias consecutivos.
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, bgcolor: '#f0f4f8' }}>
          {(() => {
            const rule = (regras || []).find(r => r.tipo_regra === 'SIMILARIDADE_ENTRE_DIAS');
            const isAtivo = rule?.ativo ?? false;
            
            return (
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Status do Motor</Typography>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={isAtivo} 
                          onChange={(e) => handleUpdateSimilarityRule('ativo', e.target.checked)}
                        />
                      }
                      label={isAtivo ? "Monitoramento Ativo" : "Monitoramento Desativado"}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Teto de Similaridade: {rule?.limiar_similaridade || 50}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Quanto menor o teto, mais diferente o cardápio de amanhã será de hoje.
                    </Typography>
                    <Slider
                      size="small"
                      disabled={!isAtivo}
                      value={rule?.limiar_similaridade || 50}
                      onChange={(_: any, v: number | number[]) => handleUpdateSimilarityRule('limiar_similaridade', v as number)}
                      valueLabelDisplay="auto"
                      step={5}
                      min={10}
                      max={90}
                      sx={{ color: '#00796b' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Severidade do Alerta</Typography>
                    <TextField
                      select size="small" fullWidth disabled={!isAtivo}
                      value={rule?.severidade || 'SOFT'}
                      onChange={(e) => handleUpdateSimilarityRule('severidade', e.target.value)}
                    >
                      <MenuItem value="SOFT">Aviso (Informativo)</MenuItem>
                      <MenuItem value="HARD">Bloqueio (Restritivo)</MenuItem>
                    </TextField>
                  </Box>
                </Grid>
              </Grid>
            );
          })()}
        </Paper>
      </Box>

    </Box>
  );
}
