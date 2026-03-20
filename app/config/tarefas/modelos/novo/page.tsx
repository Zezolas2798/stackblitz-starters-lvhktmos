'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Box, Typography, Button, Paper, TextField, Stack, 
  MenuItem, FormControlLabel, Switch, Breadcrumbs, 
  Link as MuiLink, CircularProgress, useTheme, alpha,
  FormControl, InputLabel, Select, Alert, Container
} from '@mui/material';
import { Save, ChevronLeft, Settings2, Camera, ListChecks, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { SubtarefasList } from '@/components/operacional/SubtarefasList';
import { TarefaPrioridade, TarefaTipo } from '@/lib/types';

// --- COMPONENTE DE CONTEÚDO (Lógica Principal) ---
// Este componente NÃO é exportado como default. Ele é interno.
function NovoModeloContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id'); // Pega ID da URL se for edição
  
  const theme = useTheme();
  const { activeClientId } = useClient();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Dados Auxiliares
  const [equipe, setEquipe] = useState<any[]>([]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'ROTINA' as TarefaTipo,
    prioridade: 'MEDIA' as TarefaPrioridade,
    frequencia: 'DIARIA', // DIARIA, SEMANAL, EVENTUAL
    requer_foto: false,
    responsavel_id: ''
  });

  const [subtarefas, setSubtarefas] = useState<{titulo: string, concluida: boolean, ordem: number}[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    if (activeClientId) {
      loadEquipe();
      if (editingId) loadModeloParaEditar(editingId);
    }
  }, [activeClientId, editingId]);

  const loadEquipe = React.useCallback(async () => {
    // Busca perfis vinculados à empresa
    const { data } = await (supabase as any).from('profiles')
      .select('id, full_name')
      .eq('company_id', activeClientId as string);
    
    if (data) setEquipe(data);
  }, [activeClientId]);

  const loadModeloParaEditar = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      // 1. Busca Modelo
      const { data: modelo, error } = await (supabase as any).from('config_modelos_demandas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (modelo) {
        setFormData({
          titulo: modelo.titulo_padrao,
          descricao: modelo.descricao_padrao || '',
          tipo: (modelo.tipo_padrao as TarefaTipo) || 'ROTINA',
          prioridade: (modelo.prioridade_padrao as TarefaPrioridade) || 'MEDIA',
          frequencia: modelo.frequencia || 'EVENTUAL',
          requer_foto: modelo.requer_evidencia_foto || false,
          responsavel_id: modelo.responsavel_padrao_id || ''
        });
      }

      // 2. Busca Subtarefas do Modelo
      const { data: subs } = await (supabase as any).from('config_modelo_subtarefas')
        .select('*')
        .eq('modelo_id', id)
        .order('ordem');
      
      if (subs) {
        setSubtarefas(subs.map((s: any) => ({ titulo: s.titulo, concluida: false, ordem: s.ordem ?? 0 })));
      }

    } catch (err: any) {
      console.error('Erro ao carregar modelo:', err);
      setError('Falha ao carregar dados para edição.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers
  const handleChecklistChange = (novosItens: any[]) => {
    setSubtarefas(novosItens);
  };

  const handleSave = async () => {
    if (!formData.titulo) return alert('O título é obrigatório.');
    if (!activeClientId) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. Salvar/Atualizar Modelo Pai
      const payload = {
        cliente_id: activeClientId,
        titulo_padrao: formData.titulo,
        descricao_padrao: formData.descricao,
        tipo_padrao: formData.tipo,
        prioridade_padrao: formData.prioridade,
        frequencia: formData.frequencia,
        requer_evidencia_foto: formData.requer_foto,
        responsavel_padrao_id: formData.responsavel_id || null
      };

      let modeloId = editingId;

      if (editingId) {
        const { error } = await (supabase as any).from('config_modelos_demandas')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from('config_modelos_demandas')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        modeloId = data.id;
      }

      // 2. Salvar Subtarefas (Estratégia: Deleta antigas e cria novas para simplificar ordem)
      if (modeloId) {
        // Limpa anteriores
        if (editingId) {
          await (supabase as any).from('config_modelo_subtarefas').delete().eq('modelo_id', modeloId);
        }

        // Insere novas
        if (subtarefas.length > 0) {
          const subsPayload = subtarefas.map((s, idx) => ({
             modelo_id: modeloId!, // Adicionado campo obrigatório modelo_id
             titulo: s.titulo,
             ordem: idx
          }));
          const { error: subError } = await (supabase as any).from('config_modelo_subtarefas').insert(subsPayload);
          if (subError) throw subError;
        }
      }

      // Sucesso
      router.push('/config/tarefas'); // Ajuste para a rota de listagem correta

    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar modelo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.back()} color="inherit">
          Voltar
        </Button>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'primary.main', letterSpacing: '-0.02em' }}>
            {editingId ? 'Editar Modelo de Tarefa' : 'Novo Modelo de Tarefa'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crie padronizações para Checklists, POPs e Rotinas da equipe.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        
        {/* COLUNA ESQUERDA: Configurações Gerais */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <Settings2 size={20} />
                <Typography variant="subtitle2" fontWeight="bold">Configurações Gerais</Typography>
              </Box>

              <TextField 
                label="Título da Tarefa" 
                fullWidth 
                required
                value={formData.titulo}
                onChange={e => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ex: Checklist de Abertura da Cozinha"
              />

              <TextField 
                label="Descrição / Instruções" 
                fullWidth 
                multiline 
                rows={3}
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descreva o que deve ser feito..."
              />

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select 
                    value={formData.tipo} 
                    label="Tipo"
                    onChange={e => setFormData({...formData, tipo: e.target.value as TarefaTipo})}
                  >
                    <MenuItem value="ROTINA">Rotina Diária</MenuItem>
                    <MenuItem value="CHECKLIST">Checklist</MenuItem>
                    <MenuItem value="POP">POP / Procedimento</MenuItem>
                    <MenuItem value="AVULSA">Tarefa Avulsa</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Prioridade</InputLabel>
                  <Select 
                    value={formData.prioridade} 
                    label="Prioridade"
                    onChange={e => setFormData({...formData, prioridade: e.target.value as TarefaPrioridade})}
                  >
                    <MenuItem value="BAIXA">Baixa</MenuItem>
                    <MenuItem value="MEDIA">Média</MenuItem>
                    <MenuItem value="ALTA">Alta</MenuItem>
                    <MenuItem value="CRITICA">Crítica</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={2}>
                 <FormControl fullWidth size="small">
                  <InputLabel>Frequência Sugerida</InputLabel>
                  <Select 
                    value={formData.frequencia} 
                    label="Frequência Sugerida"
                    onChange={e => setFormData({...formData, frequencia: e.target.value})}
                  >
                    <MenuItem value="DIARIA">Diária</MenuItem>
                    <MenuItem value="SEMANAL">Semanal</MenuItem>
                    <MenuItem value="MENSAL">Mensal</MenuItem>
                    <MenuItem value="EVENTUAL">Eventual</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Responsável Padrão</InputLabel>
                  <Select 
                    value={formData.responsavel_id} 
                    label="Responsável Padrão"
                    onChange={e => setFormData({...formData, responsavel_id: e.target.value})}
                  >
                    <MenuItem value="">-- Sem Responsável Padrão --</MenuItem>
                    {equipe.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.full_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.requer_foto} 
                      onChange={e => setFormData({...formData, requer_foto: e.target.checked})}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Camera size={18} />
                      <Typography variant="body2" fontWeight="bold">Exigir Foto de Evidência?</Typography>
                    </Box>
                  }
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                  Se marcado, o usuário não poderá concluir a tarefa sem anexar uma foto.
                </Typography>
              </Paper>

            </Stack>
          </Paper>
        </Box>

        {/* COLUNA DIREITA: Checklist */}
        <Box sx={{ flex: 1 }}>
           <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 2 }}>
                <ListChecks size={20} />
                <Typography variant="subtitle2" fontWeight="bold">Itens de Verificação (Subtarefas)</Typography>
              </Box>
              
              <SubtarefasList 
                items={subtarefas} 
                onChange={handleChecklistChange} 
                isEditable={true} 
              />
           </Paper>
        </Box>
      </Box>

      {/* FOOTER ACTION */}
      <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, zIndex: 10, bgcolor: 'background.paper', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
         <Button variant="outlined" onClick={() => router.back()}>Cancelar</Button>
         <Button 
            variant="contained" 
            size="large" 
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={submitting}
         >
           {submitting ? 'Salvando...' : 'Salvar Modelo'}
         </Button>
      </Paper>

    </Container>
  );
}

// --- COMPONENTE DA PÁGINA (EXPORT DEFAULT) ---
// Este componente é o "envelope" que satisfaz o Next.js
export default function NovoModeloPage() {
  return (
    <Suspense fallback={
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando editor...</Typography>
      </Box>
    }>
      <NovoModeloContent />
    </Suspense>
  );
}



