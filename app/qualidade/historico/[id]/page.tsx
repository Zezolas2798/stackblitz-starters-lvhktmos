'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Container, Typography, Box, Button, Paper, Grid, 
  CircularProgress, Alert, Chip, Divider, IconButton,
  useTheme, alpha
} from '@mui/material';
import { 
  ArrowLeft, Calendar, User, CheckCircle2, XCircle, 
  AlertTriangle, Camera, MessageSquare 
} from 'lucide-react';

export default function DetalheChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const theme = useTheme();

  const [checklist, setChecklist] = useState<any>(null);
  const [respostasAgrupadas, setRespostasAgrupadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadDetails();
  }, [id]);

  async function loadDetails() {
    setLoading(true);
    
    // 1. Buscar Execução e Modelo
    const { data: exec, error } = await supabase
      .from('checklist_execucoes')
      .select(`
        *,
        checklist_modelos (nome, descricao)
      `)
      .eq('id', id)
      .single();

    if (error || !exec) {
        setLoading(false);
        return;
    }

    setChecklist(exec);

    // 2. Buscar Respostas, Itens e Seções
    // Precisamos fazer uma query complexa ou joins manuais.
    // Estratégia: Buscar respostas com itens e seções aninhados
    const { data: respostas } = await supabase
      .from('checklist_respostas')
      .select(`
        *,
        checklist_itens (
            texto_pergunta,
            tipo_resposta,
            checklist_secoes (id, titulo, ordem)
        )
      `)
      .eq('execucao_id', id);

    if (respostas) {
        // Agrupar por Seção
        const grupos: Record<string, any> = {};
        
        respostas.forEach((r: any) => {
            const secaoId = r.checklist_itens?.checklist_secoes?.id || 'geral';
            const secaoTitulo = r.checklist_itens?.checklist_secoes?.titulo || 'Geral';
            const secaoOrdem = r.checklist_itens?.checklist_secoes?.ordem || 0;

            if (!grupos[secaoId]) {
                grupos[secaoId] = {
                    id: secaoId,
                    titulo: secaoTitulo,
                    ordem: secaoOrdem,
                    itens: []
                };
            }
            grupos[secaoId].itens.push(r);
        });

        // Converter para array e ordenar
        const arrayGrupos = Object.values(grupos).sort((a: any, b: any) => a.ordem - b.ordem);
        setRespostasAgrupadas(arrayGrupos);
    }
    setLoading(false);
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!checklist) return <Container><Alert severity="error">Checklist não encontrado.</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ mr: 2 }}>Voltar</Button>
        <Box>
            <Typography variant="h5" fontWeight="800">Detalhes do Registro</Typography>
            <Typography variant="caption" color="text.secondary">ID: {checklist.id}</Typography>
        </Box>
      </Box>

      {/* CARTÃO DE RESUMO */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" color="text.secondary">MODELO APLICADO</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">{checklist.checklist_modelos?.nome}</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
                <Typography variant="subtitle2" color="text.secondary">DATA</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} />
                    <Typography fontWeight="500">{new Date(checklist.data_fim).toLocaleDateString()}</Typography>
                </Box>
            </Grid>
            <Grid item xs={6} md={2}>
                <Typography variant="subtitle2" color="text.secondary">HORA</Typography>
                <Typography fontWeight="500">{new Date(checklist.data_fim).toLocaleTimeString()}</Typography>
            </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <User size={18} className="text-gray-500" />
            <Typography variant="body2">Responsável Técnico (ID): <strong>{checklist.responsavel_id || 'Sistema'}</strong></Typography>
        </Box>
      </Paper>

      {/* LISTA DE RESPOSTAS */}
      <Box>
        {respostasAgrupadas.map((secao) => (
            <Box key={secao.id} sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                    {secao.titulo}
                </Typography>

                {secao.itens.map((resp: any) => (
                    <Paper 
                        key={resp.id} 
                        elevation={0} 
                        sx={{ 
                            p: 2, mb: 2, 
                            border: '1px solid', 
                            borderColor: resp.conforme === false ? 'error.light' : 'divider',
                            bgcolor: resp.conforme === false ? '#fff5f5' : 'white',
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight="600" gutterBottom>{resp.checklist_itens?.texto_pergunta}</Typography>
                                
                                {/* EXIBIÇÃO DA RESPOSTA */}
                                <Box sx={{ mt: 1 }}>
                                    {resp.checklist_itens?.tipo_resposta === 'CONFORME_NAOCONFORME' ? (
                                        resp.conforme ? (
                                            <Chip icon={<CheckCircle2 size={14}/>} label="CONFORME" color="success" size="small" variant="outlined" />
                                        ) : (
                                            <Chip icon={<XCircle size={14}/>} label="NÃO CONFORME" color="error" size="small" variant="filled" />
                                        )
                                    ) : (
                                        <Typography variant="body1" sx={{ bgcolor: '#f0f0f0', p: 1, borderRadius: 1, display: 'inline-block' }}>
                                            {resp.valor_resposta} 
                                            {resp.checklist_itens?.tipo_resposta === 'TEMPERATURA' && ' °C'}
                                        </Typography>
                                    )}
                                </Box>

                                {/* OBSERVAÇÃO */}
                                {resp.observacao && (
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start', color: 'text.secondary' }}>
                                        <MessageSquare size={16} style={{ marginTop: 3 }} />
                                        <Typography variant="body2" fontStyle="italic">"{resp.observacao}"</Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* FOTO EVIDÊNCIA */}
                            {resp.foto_url && (
                                <Box sx={{ ml: 2 }}>
                                    <a href={resp.foto_url} target="_blank" rel="noopener noreferrer">
                                        <Box 
                                            component="img" 
                                            src={resp.foto_url} 
                                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '1px solid #ddd', cursor: 'zoom-in' }} 
                                        />
                                    </a>
                                    <Typography variant="caption" display="block" align="center" sx={{ mt: 0.5 }}>Evidência</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>
        ))}
      </Box>

    </Container>
  );
}