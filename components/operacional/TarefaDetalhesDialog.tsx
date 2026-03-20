'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dialog, DialogContent, Typography, Box, IconButton, 
  Stack, Chip, Avatar, Button, TextField, Divider, Paper, alpha,
  CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel, Tooltip
} from '@mui/material';
import { 
  X, Calendar, Camera, MessageSquare, Send, 
  CheckCircle2, AlertTriangle, Check 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SubtarefasList } from './SubtarefasList';
import { useClient } from '@/lib/ClientContext';
import { TarefaStatus } from '@/lib/types';

// Configuração visual dos status
const STATUS_OPTIONS: { value: TarefaStatus, label: string, color: string }[] = [
  { value: 'A_FAZER', label: 'A Fazer', color: '#64748B' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#2563EB' },
  { value: 'REVISAO', label: 'Revisão', color: '#D97706' },
  { value: 'CONCLUIDA', label: 'Concluída', color: '#059669' },
];

export function TarefaDetalhesDialog({ taskId, open, onClose, onUpdate }: any) {
  const { activeClientId } = useClient();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadTaskDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Busca Tarefa + Responsável
      const { data: dataTask, error: errTask } = await (supabase as any).from('operacao_tarefas')
        .select(`*, responsavel:responsavel_id(full_name)`)
        .eq('id', taskId)
        .single();
      
      if (errTask) throw new Error(`Erro ao carregar tarefa: ${errTask.message}`);
      
      // 2. Busca Subtarefas
      const { data: dataSubs } = await (supabase as any).from('operacao_subtarefas')
        .select('*')
        .eq('tarefa_id', taskId)
        .order('ordem', { ascending: true });

      const fullTask = { ...dataTask, subtarefas: dataSubs || [] };
      setTask(fullTask);

      // 3. Busca Comentários
      const { data: comments } = await (supabase as any).from('operacao_comentarios')
        .select('*, user:usuario_id(full_name)')
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: true });
      
      setComentarios(comments || []);

    } catch (err: any) {
      console.error('Falha crítica no modal:', err);
      setError(err.message || 'Não foi possível abrir a demanda.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      loadTaskDetails();
    } else {
      setTask(null);
      setLoading(true);
      setError('');
    }
  }, [taskId, open, loadTaskDetails]);

  // === MUDANÇA MANUAL DE STATUS (Seletor) ===
  const handleManualStatusChange = async (newStatus: TarefaStatus) => {
    setTask({ ...task, status: newStatus }); // Otimista

    const { error } = await (supabase as any).from('operacao_tarefas')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      alert('Erro ao mudar status');
      loadTaskDetails();
    } else {
      if (onUpdate) onUpdate();
    }
  };

  // === LÓGICA AUTOMÁTICA DE STATUS BASEADA NO CHECKLIST ===
  const handleChecklistChange = async (novosItens: any[]) => {
    // 1. Calcular estatísticas
    const total = novosItens.length;
    const concluidos = novosItens.filter(i => i.concluida).length;
    
    // 2. Determinar Novo Status Automático
    let novoStatus: TarefaStatus = task.status; // Mantém o atual por padrão

    // Só aplica automação se não estiver já CONCLUIDA (para não reabrir sem querer)
    if (task.status !== 'CONCLUIDA') {
      if (concluidos === 0) {
        novoStatus = 'A_FAZER';
      } else if (concluidos > 0 && concluidos < total) {
        novoStatus = 'EM_ANDAMENTO';
      } else if (concluidos === total && total > 0) {
        novoStatus = 'REVISAO';
      }
    }

    // 3. Atualização Otimista Visual
    setTask({ ...task, subtarefas: novosItens, status: novoStatus });
    
    // 4. Persistência no Banco (Checklist + Status da Tarefa)
    try {
      // A. Salva cada item do checklist modificado
      for (const item of novosItens) {
        if (item.id) {
           await (supabase as any).from('operacao_subtarefas')
             .update({ concluida: item.concluida })
             .eq('id', item.id);
        }
      }

      // B. Atualiza o Status da Tarefa Pai se mudou
      if (novoStatus !== task.status) {
        await (supabase as any).from('operacao_tarefas')
          .update({ status: novoStatus })
          .eq('id', taskId);
        
        // Avisa o Kanban para atualizar a coluna
        if (onUpdate) onUpdate(); 
      }
    } catch (err) {
      console.error('Erro na automação de status:', err);
    }
  };

  // === BOTÃO FINALIZAR (REVISÃO -> CONCLUÍDA) ===
  const handleConcluirTask = async () => {
    // Validação GxP: Exige foto se configurado
    if (task.requer_evidencia_foto) {
        // Lógica de verificação de foto aqui (implementaremos upload real depois)
        // Por enquanto, apenas um alerta simulado se fosse real
        // alert("Lembrete: Esta tarefa exige evidência fotográfica."); 
    }

    const novoStatus = 'CONCLUIDA';
    setTask({ ...task, status: novoStatus });

    await (supabase as any).from('operacao_tarefas')
      .update({ 
        status: novoStatus,
        concluida_em: new Date().toISOString() // Marca timestamp de conclusão
      })
      .eq('id', taskId);

    if (onUpdate) onUpdate();
    onClose(); // Fecha o modal ao concluir
  };

  // Envio de Comentários
  const handleSendComment = async () => {
    if (!novoComentario.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any).from('operacao_comentarios').insert([{
      tarefa_id: taskId, texto: novoComentario, usuario_id: user.id
    }]);

    if (!error) {
      setNovoComentario('');
      const { data } = await (supabase as any).from('operacao_comentarios')
        .select('*, user:usuario_id(full_name)')
        .eq('tarefa_id', taskId)
        .order('created_at', { ascending: true });
      if (data) setComentarios(data);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      {loading ? (
        <Box sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">Carregando...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="outlined" onClick={onClose}>Fechar</Button>
        </Box>
      ) : task ? (
        <>
          {/* HEADER */}
          <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', bgcolor: '#fff', alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 1.5 }} alignItems="center">
                
                {/* Seletor de Status (Manual) */}
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="status-label">Status Atual</InputLabel>
                  <Select
                    labelId="status-label"
                    value={task.status}
                    label="Status Atual"
                    onChange={(e) => handleManualStatusChange(e.target.value as TarefaStatus)}
                    sx={{ 
                      fontWeight: 'bold', 
                      color: STATUS_OPTIONS.find(s => s.value === task.status)?.color,
                      '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 }
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color }} />
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Chip label={task.prioridade} size="small" color={task.prioridade === 'CRITICA' ? 'error' : 'default'} />
                <Chip label={task.tipo} size="small" variant="outlined" />
              </Stack>
              <Typography variant="h5" fontWeight="bold">{task.titulo}</Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {/* BOTÃO CONCLUIR (Aparece em Revisão ou Em Andamento) */}
              {(task.status === 'REVISAO' || task.status === 'EM_ANDAMENTO') && (
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleConcluirTask}
                  startIcon={<Check size={18} />}
                  sx={{ fontWeight: 'bold' }}
                >
                  Concluir
                </Button>
              )}
              <IconButton onClick={onClose}><X /></IconButton>
            </Stack>
          </Box>

          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '60vh' }}>
            
            {/* ESQUERDA: DETALHES & CHECKLIST */}
            <Box sx={{ flex: 2, p: 3, overflowY: 'auto', borderRight: { md: '1px solid #eee' } }}>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                {task.descricao || 'Sem descrição técnica.'}
              </Typography>

              <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">RESPONSÁVEL</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.7rem' }}>
                      {task.responsavel?.full_name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2" fontWeight="500">
                      {task.responsavel?.full_name || 'Não atribuído'}
                    </Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">PRAZO</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Calendar size={16} />
                    <Typography variant="body2" fontWeight="500">
                      {task.prazo_limite ? new Date(task.prazo_limite).toLocaleDateString() : 'Sem prazo'}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Checklist Automático */}
              <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Progresso Automático</Typography>
                  {task.status === 'REVISAO' && (
                    <Chip 
                      icon={<CheckCircle2 size={14} />} 
                      label="Pronto para Revisão" 
                      color="warning" 
                      size="small" 
                    />
                  )}
                </Stack>
                <SubtarefasList 
                  items={task.subtarefas || []} 
                  onChange={handleChecklistChange} 
                  isEditable={task.status !== 'CONCLUIDA'} // Trava checklist se já concluiu
                />
              </Box>

              {task.requer_evidencia_foto && (
                <Paper sx={{ p: 2, bgcolor: alpha('#059669', 0.05), border: '1px dashed', borderColor: 'success.main', textAlign: 'center' }}>
                   <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                      <Camera size={20} color="#059669" />
                      <Typography variant="subtitle2" fontWeight="bold" color="success.main">Evidência Obrigatória</Typography>
                   </Stack>
                   <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                     Tire uma foto do resultado final para concluir a tarefa.
                   </Typography>
                   <Button variant="outlined" color="success" size="small">
                     Anexar Foto
                   </Button>
                </Paper>
              )}
            </Box>

            {/* DIREITA: CHAT / COMENTÁRIOS */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F8FAFC' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MessageSquare size={16} />
                  <Typography variant="subtitle2" fontWeight="bold">Atividades</Typography>
                </Stack>
              </Box>
              
              <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                {comentarios.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
                    Nenhum comentário ainda.
                  </Typography>
                ) : (
                  comentarios.map((c: any) => (
                    <Box key={c.id} sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight="bold">
                          {c.user?.full_name?.split(' ')[0] || 'Usuário'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Typography>
                      </Stack>
                      <Paper sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{c.texto}</Typography>
                      </Paper>
                    </Box>
                  ))
                )}
                <div ref={chatEndRef} />
              </Box>

              <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={1}>
                  <TextField 
                    fullWidth size="small" placeholder="Comentar..." 
                    value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                    disabled={task.status === 'CONCLUIDA'}
                  />
                  <IconButton color="primary" onClick={handleSendComment} disabled={!novoComentario.trim()}>
                    <Send size={18} />
                  </IconButton>
                </Stack>
              </Box>
            </Box>

          </DialogContent>
        </>
      ) : null}
    </Dialog>
  );
}


