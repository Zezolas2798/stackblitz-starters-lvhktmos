'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Stack,
  Alert,
  IconButton
} from '@mui/material';
import { KanbanBoard } from '@/components/operacional/KanbanBoard';
import { TarefaDialog } from '@/components/operacional/TarefaDialog';
import { Plus, RefreshCcw } from 'lucide-react';
import { useClient } from '@/lib/ClientContext';
import { OperacaoTarefa, TarefaStatus } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

export default function TarefasPage() {
  const { activeClientId } = useClient();
  const [tarefas, setTarefas] = useState<OperacaoTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Controle do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [statusInicial, setStatusInicial] = useState<TarefaStatus>('A_FAZER');

  useEffect(() => {
    if (activeClientId) {
      fetchTarefas();
    }
  }, [activeClientId]);

  async function fetchTarefas() {
    setLoading(true);
    setError('');
    try {
      // CORREÇÃO CRÍTICA AQUI:
      // Mudamos 'responsavel:usuario_id' para 'responsavel:responsavel_id'
      const { data, error } = await (supabase as any).from('operacao_tarefas')
        .select(`
          *,
          responsavel:responsavel_id ( full_name, email ),
          subtarefas:operacao_subtarefas (*)
        `)
        .eq('cliente_id', activeClientId)
        .order('created_at', { ascending: false }); 
      
      if (error) throw error;
      
      if (data) {
        setTarefas(data as unknown as OperacaoTarefa[]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      // Mensagem mais detalhada para ajudar no debug se persistir
      setError(`Falha ao carregar: ${err.message || 'Verifique sua conexão.'}`);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (status: TarefaStatus = 'A_FAZER') => {
    setStatusInicial(status);
    setModalOpen(true);
  };

  const handleMoveTask = async (taskId: string, newStatus: TarefaStatus) => {
    // Atualização Otimista
    setTarefas(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    const { error } = await (supabase as any).from('operacao_tarefas')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao mover tarefa:', error);
      fetchTarefas(); // Reverte em caso de erro
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
            Operacional & Tarefas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão visual de demandas, POPs e rotinas da unidade.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
           <IconButton onClick={fetchTarefas} title="Recarregar Lista">
             <RefreshCcw size={20} />
           </IconButton>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => handleOpenModal()}>
            Nova Demanda
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && tarefas.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <KanbanBoard 
          tarefas={tarefas} 
          onMoveTask={handleMoveTask} 
          onAddTask={handleOpenModal}
          onUpdate={fetchTarefas} 
        />
      )}

      <TarefaDialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => fetchTarefas()}
        initialStatus={statusInicial}
      />
    </Box>
  );
}


