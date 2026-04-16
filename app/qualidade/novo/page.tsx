'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Grid, CircularProgress, Alert, 
  Card, CardActionArea, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, DialogContentText
} from '@mui/material';
import { ArrowLeft, Calendar, FileCheck, PlayCircle } from 'lucide-react';
import { getAuditTitleDate, getNowISO } from '@/lib/utils/dateUtils';

export default function NovaAuditoriaPage() {
  const router = useRouter();
  const { activeClientId, unidadeId } = useClient();
  
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal de Início
  const [modalOpen, setModalOpen] = useState(false);
  const [modeloSelecionado, setModeloSelecionado] = useState<any>(null);
  const [nomeAuditoria, setNomeAuditoria] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (activeClientId) {
      fetchModelosDisponiveis();
    }
  }, [activeClientId]);

  const fetchModelosDisponiveis = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('checklist_modelos')
      .select('*')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true)
      .order('titulo');
      
    if (data) setModelos(data);
    setLoading(false);
  };

  // 1. Ao clicar no card, abre o modal e sugere um nome
  const handleCardClick = (modelo: any) => {
    setModeloSelecionado(modelo);
    // Sugestão: "Nome do Modelo - DD/MM/AAAA" (Local)
    const sugestao = `${modelo.titulo} - ${getAuditTitleDate()}`;
    setNomeAuditoria(sugestao);
    setModalOpen(true);
  };

  // 2. Confirmação e Criação no Banco
  const handleConfirmarInicio = async () => {
    if (!modeloSelecionado || !unidadeId) {
      alert('Unidade não identificada. Selecione uma unidade no menu superior.');
      return;
    }
    setCriando(true);
    
    try {
        const user = (await supabase.auth.getUser()).data.user;

        const { data, error } = await (supabase as any).from('checklist_execucoes').insert({
            cliente_id: activeClientId,
            unidade_id: unidadeId,
            modelo_id: modeloSelecionado.id,
            titulo: nomeAuditoria, // Salva o nome personalizado
            status: 'EM_ANDAMENTO',
            responsavel_id: user?.id,
            data_inicio: getNowISO()
        }).select().single();

        if (error) throw error;

        // Redireciona para a execução
        router.push(`/qualidade/execucao/${data.id}`);

    } catch (err: any) {
        alert('Erro ao iniciar: ' + err.message);
        setCriando(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ mr: 2, color: 'text.secondary' }}>Voltar</Button>
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>Nova Auditoria</Typography>
            <Typography variant="body2" color="text.secondary">Selecione um modelo para começar.</Typography>
        </Box>
      </Box>

      {modelos.length === 0 ? (
          <Alert severity="warning">Nenhum modelo ativo encontrado.</Alert>
      ) : (
          <Grid container spacing={3}>
              {modelos.map((modelo) => (
                  <Grid item xs={12} md={6} key={modelo.id}>
                      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, '&:hover': { borderColor: 'primary.main', boxShadow: 3 } }}>
                          <CardActionArea 
                            onClick={() => handleCardClick(modelo)}
                            sx={{ p: 2 }}
                          >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                  <FileCheck size={32} className="text-blue-600" />
                                  <Box>
                                      <Typography variant="h6" fontWeight="bold">
                                          {modelo.titulo}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                                          <Calendar size={14} className="text-gray-500" />
                                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                                              {modelo.frequencia_sugerida}
                                          </Typography>
                                      </Box>
                                      {modelo.descricao && (
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                              {modelo.descricao}
                                          </Typography>
                                      )}
                                  </Box>
                              </Box>
                          </CardActionArea>
                      </Card>
                  </Grid>
              ))}
          </Grid>
      )}

      {/* MODAL DE CONFIRMAÇÃO DO NOME */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Iniciar Nova Auditoria</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
                Defina um nome para identificar esta auditoria (ex: &quot;Jantar Evento X&quot; ou &quot;Rotina Manhã&quot;).
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                label="Nome da Auditoria"
                fullWidth
                variant="outlined"
                value={nomeAuditoria}
                onChange={(e) => setNomeAuditoria(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancelar</Button>
            <Button 
                onClick={handleConfirmarInicio} 
                variant="contained" 
                color="primary"
                disabled={criando || !nomeAuditoria.trim()}
                startIcon={criando ? <CircularProgress size={20} color="inherit"/> : <PlayCircle size={20} />}
            >
                {criando ? 'Criando...' : 'Começar Agora'}
            </Button>
          </DialogActions>
      </Dialog>

    </Container>
  );
}


