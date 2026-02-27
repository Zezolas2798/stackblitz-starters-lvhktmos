'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, MenuItem, Stack, FormControlLabel, Switch, 
  Typography, Box, IconButton, alpha, Divider, CircularProgress,
  Paper, Avatar
} from '@mui/material';
import { X, ClipboardList, Camera, CheckSquare, User } from 'lucide-react'; // Adicionado User
import { TarefaStatus, TarefaPrioridade, TarefaTipo } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { SubtarefasList } from './SubtarefasList';

interface SubtarefaItem {
  titulo: string;
  concluida: boolean;
}

interface TarefaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStatus?: TarefaStatus;
}

export function TarefaDialog({ open, onClose, onSuccess, initialStatus = 'A_FAZER' }: TarefaDialogProps) {
  const { activeClientId, unidadeSelecionada } = useClient();
  const [loading, setLoading] = useState(false);
  const [modelos, setModelos] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]); // Estado para lista de usuários
  const [loadingModelos, setLoadingModelos] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: initialStatus,
    prioridade: 'MEDIA' as TarefaPrioridade,
    tipo: 'AVULSA' as TarefaTipo,
    requer_evidencia_foto: false,
    prazo_limite: '',
    responsavel_id: '',
    notificar_usuarios: [] as string[]
  });

  const [subtarefas, setSubtarefas] = useState<SubtarefaItem[]>([]);

  // Carregar Dados Iniciais (Modelos e Equipe)
  useEffect(() => {
    if (open && activeClientId) {
      fetchDadosIniciais();
    }
  }, [open, activeClientId]);

  async function fetchDadosIniciais() {
    setLoadingModelos(true);
    try {
      // 1. Buscar Modelos
      const { data: dataModelos } = await supabase
        .from('config_modelos_demandas')
        .select('*, config_modelo_subtarefas(*)')
        .eq('cliente_id', activeClientId);
      
      if (dataModelos) setModelos(dataModelos);

      // 2. Buscar Equipe (Usuários vinculados ao Cliente/Empresa)
      // Nota: Ajuste 'company_id' se sua tabela profiles usar outro nome de coluna para o cliente
      const { data: dataEquipe } = await supabase
        .from('profiles') 
        .select('id, full_name, email')
        .eq('company_id', activeClientId);

      if (dataEquipe) setEquipe(dataEquipe);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoadingModelos(false);
    }
  }

  const aplicarModelo = (modeloId: string) => {
    const mod = modelos.find(m => m.id === modeloId);
    if (mod) {
      setFormData(prev => ({
        ...prev,
        titulo: mod.titulo_padrao,
        descricao: mod.descricao_padrao || '',
        tipo: mod.tipo_padrao,
        prioridade: mod.prioridade_padrao,
        requer_evidencia_foto: mod.requer_evidencia_foto,
        responsavel_id: mod.responsavel_padrao_id || '',
        notificar_usuarios: mod.notificar_usuarios_ids || []
      }));
      
      if (mod.config_modelo_subtarefas) {
        setSubtarefas(mod.config_modelo_subtarefas.map((s: any) => ({
          titulo: s.titulo,
          concluida: false
        })));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.titulo || !activeClientId || !unidadeSelecionada) return;
    setLoading(true);

    try {
      const { data: tarefaCriada, error: erroTarefa } = await supabase
        .from('operacao_tarefas')
        .insert([{
          ...formData,
          cliente_id: activeClientId,
          unidade_id: unidadeSelecionada.id,
          prazo_limite: formData.prazo_limite || null,
          responsavel_id: formData.responsavel_id || null // Garante envio correto
        }])
        .select()
        .single();

      if (erroTarefa) throw erroTarefa;

      if (subtarefas.length > 0 && tarefaCriada) {
        const itens = subtarefas
          .filter(s => s.titulo.trim() !== '')
          .map((s, index) => ({
            tarefa_id: tarefaCriada.id,
            titulo: s.titulo,
            concluida: false,
            ordem: index
          }));

        await supabase.from('operacao_subtarefas').insert(itens);
      }

      onSuccess();
      onClose();
      // Resetar form...
      setFormData({
        titulo: '', descricao: '', status: initialStatus,
        prioridade: 'MEDIA', tipo: 'AVULSA', requer_evidencia_foto: false,
        prazo_limite: '', responsavel_id: '', notificar_usuarios: []
      });
      setSubtarefas([]);
    } catch (error) {
      console.error('Erro ao salvar demanda:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ p: 1, bgcolor: alpha('#2563EB', 0.1), borderRadius: 1, display: 'flex' }}>
            <ClipboardList size={20} color="#2563EB" />
          </Box>
          <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
            Nova Demanda
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><X size={20} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#F8FAFC' }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          <TextField
            select
            label="Carregar Modelo Pré-definido"
            fullWidth
            size="small"
            onChange={(e) => aplicarModelo(e.target.value)}
            disabled={loadingModelos}
          >
            {modelos.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.titulo_padrao}</MenuItem>
            ))}
            {modelos.length === 0 && <MenuItem disabled>Nenhum modelo cadastrado</MenuItem>}
          </TextField>

          <Divider />

          <TextField
            label="Título da Demanda"
            fullWidth
            required
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
          />

          <TextField
            label="Instruções Técnicas"
            fullWidth
            multiline
            rows={2}
            value={formData.descricao}
            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select label="Tipo" fullWidth size="small"
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value as TarefaTipo})}
            >
              <MenuItem value="POP">Procedimento (POP)</MenuItem>
              <MenuItem value="LIMPEZA">Higiene/Limpeza</MenuItem>
              <MenuItem value="PRODUCAO">Produção</MenuItem>
              <MenuItem value="AVULSA">Avulsa/Recado</MenuItem>
            </TextField>

            <TextField
              select label="Prioridade" fullWidth size="small"
              value={formData.prioridade}
              onChange={(e) => setFormData({...formData, prioridade: e.target.value as TarefaPrioridade})}
            >
              <MenuItem value="BAIXA">Baixa</MenuItem>
              <MenuItem value="MEDIA">Média</MenuItem>
              <MenuItem value="ALTA">Alta</MenuItem>
              <MenuItem value="CRITICA">⚠️ Crítica</MenuItem>
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
             {/* CAMPO DE PRAZO */}
            <TextField
              label="Prazo Limite"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formData.prazo_limite}
              onChange={(e) => setFormData({...formData, prazo_limite: e.target.value})}
            />

            {/* CAMPO DE RESPONSÁVEL (CORREÇÃO) */}
            <TextField
              select
              label="Responsável"
              fullWidth
              size="small"
              value={formData.responsavel_id}
              onChange={(e) => setFormData({...formData, responsavel_id: e.target.value})}
              InputProps={{
                startAdornment: <User size={16} style={{ marginRight: 8, opacity: 0.5 }} />
              }}
            >
              <MenuItem value="">-- Em aberto --</MenuItem>
              {equipe.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>{user.full_name?.charAt(0)}</Avatar>
                    <Typography variant="body2">{user.full_name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CheckSquare size={18} color="#475569" />
              <Typography variant="subtitle2" fontWeight="bold">Checklist</Typography>
            </Stack>
            <SubtarefasList items={subtarefas} onChange={setSubtarefas} isEditable={true} />
          </Paper>

          <Box sx={{ p: 2, bgcolor: alpha('#059669', 0.05), borderRadius: 2, border: '1px dashed', borderColor: '#059669' }}>
            <FormControlLabel
              control={
                <Switch 
                  color="success" 
                  checked={formData.requer_evidencia_foto}
                  onChange={(e) => setFormData({...formData, requer_evidencia_foto: e.target.checked})}
                />
              }
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Camera size={18} />
                  <Typography variant="body2" fontWeight="bold">Exigir Evidência Fotográfica</Typography>
                </Stack>
              }
            />
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.titulo}
          startIcon={loading ? <CircularProgress size={20}/> : null}
        >
          Criar Demanda
        </Button>
      </DialogActions>
    </Dialog>
  );
}