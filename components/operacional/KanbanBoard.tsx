'use client';

import React, { useState, DragEvent } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Chip, 
  Avatar, 
  IconButton, 
  Tooltip, 
  alpha, 
  useTheme 
} from '@mui/material';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Camera, 
  User 
} from 'lucide-react';
import { OperacaoTarefa, TarefaStatus } from '@/lib/types';
import { TarefaDetalhesDialog } from './TarefaDetalhesDialog';

const COLunas: { id: TarefaStatus; label: string; color: string }[] = [
  { id: 'A_FAZER', label: 'A Fazer', color: '#64748B' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#2563EB' },
  { id: 'REVISAO', label: 'Revisão', color: '#D97706' },
  { id: 'CONCLUIDA', label: 'Concluída', color: '#059669' },
];

interface KanbanProps {
  tarefas: OperacaoTarefa[];
  onMoveTask: (taskId: string, newStatus: TarefaStatus) => void;
  onAddTask: (status: TarefaStatus) => void;
  onUpdate?: () => void;
}

export function KanbanBoard({ tarefas, onMoveTask, onAddTask, onUpdate }: KanbanProps) {
  const theme = useTheme();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // === LÓGICA DE DRAG & DROP NATIVO ===
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno atraso para efeito visual
    setTimeout(() => {
      const el = e.target as HTMLDivElement;
      el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setDraggedTaskId(null);
    const el = e.target as HTMLDivElement;
    el.style.opacity = '1';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessário para permitir o Drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: TarefaStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    if (taskId && taskId !== '') {
      onMoveTask(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // =====================================

  const handleCloseDetails = () => {
    setSelectedTask(null);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        overflowX: 'auto', 
        pb: 2,
        minHeight: 'calc(100vh - 250px)',
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': { borderRadius: 8, bgcolor: '#cbd5e1' }
      }}>
        {COLunas.map((col) => (
          <Box 
            key={col.id} 
            sx={{ minWidth: 300, width: 300, flexShrink: 0 }}
            // A Coluna é a área de "Drop"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Header da Coluna */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {col.label}
                </Typography>
                <Chip 
                  label={tarefas.filter(t => t.status === col.id).length} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    bgcolor: alpha(col.color, 0.1), 
                    color: col.color 
                  }}
                />
              </Stack>
              <IconButton size="small" onClick={() => onAddTask(col.id)}>
                <Plus size={18} />
              </IconButton>
            </Box>

            {/* Lista de Cards (Área de Drag) */}
            <Stack 
              spacing={2} 
              sx={{ 
                minHeight: 200, // Altura mínima para facilitar o drop em colunas vazias
                transition: 'background-color 0.2s',
                borderRadius: 2,
                // Highlight visual quando arrastando algo por cima (opcional, simplificado aqui)
              }}
            >
              {tarefas
                .filter((t) => t.status === col.id)
                .map((tarefa) => (
                  <Paper
                    key={tarefa.id}
                    draggable // <--- Habilita arrastar
                    onDragStart={(e) => handleDragStart(e, tarefa.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedTask(tarefa.id)}
                    sx={{
                      p: 2,
                      cursor: 'grab',
                      transition: 'all 0.2s',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:active': { cursor: 'grabbing' },
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                        borderColor: 'primary.main'
                      },
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Chip 
                          label={tarefa.tipo} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: 20, 
                            textTransform: 'uppercase', 
                            fontWeight: 800,
                            border: '1px solid #E2E8F0'
                          }} 
                        />
                        {tarefa.prioridade === 'CRITICA' && (
                          <Tooltip title="Prioridade Crítica">
                            <AlertCircle size={16} color={theme.palette.error.main} />
                          </Tooltip>
                        )}
                        {tarefa.prioridade === 'ALTA' && (
                          <Tooltip title="Prioridade Alta">
                            <AlertCircle size={16} color={theme.palette.warning.main} />
                          </Tooltip>
                        )}
                      </Stack>

                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                        {tarefa.titulo}
                      </Typography>

                      <Stack direction="row" alignItems="center" spacing={2} sx={{ pt: 0.5 }}>
                        {tarefa.requer_evidencia_foto && (
                          <Tooltip title="Exige foto de evidência (GxP)">
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Camera size={14} color={theme.palette.text.secondary} />
                            </Stack>
                          </Tooltip>
                        )}
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {tarefa.responsavel ? (
                             <Tooltip title={tarefa.responsavel.full_name}>
                               <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
                                 {tarefa.responsavel.full_name?.charAt(0) || '?'}
                               </Avatar>
                             </Tooltip>
                          ) : (
                             <Tooltip title="Sem responsável">
                               <Avatar sx={{ width: 22, height: 22, bgcolor: 'grey.300' }}>
                                 <User size={12} color="#666" />
                               </Avatar>
                             </Tooltip>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {tarefa.responsavel?.full_name?.split(' ')[0] || 'Ninguém'}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {tarefa.subtarefas && tarefa.subtarefas.length > 0 && (
                             <Stack direction="row" alignItems="center" spacing={0.5}>
                               <CheckCircle2 size={14} color={theme.palette.text.secondary} />
                               <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                 {tarefa.subtarefas.filter((s: any) => s.concluida).length}/{tarefa.subtarefas.length}
                               </Typography>
                             </Stack>
                          )}

                          {tarefa.prazo_limite && (
                            <Typography variant="caption" sx={{ 
                              color: 'error.main', 
                              fontWeight: 600, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              bgcolor: alpha(theme.palette.error.main, 0.05),
                              px: 0.5,
                              borderRadius: 0.5
                            }}>
                              <Clock size={12} />
                              {new Date(tarefa.prazo_limite).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
            </Stack>
          </Box>
        ))}
      </Box>

      <TarefaDetalhesDialog 
        taskId={selectedTask} 
        open={!!selectedTask} 
        onClose={handleCloseDetails}
        onUpdate={onUpdate}
      />
    </>
  );
}


