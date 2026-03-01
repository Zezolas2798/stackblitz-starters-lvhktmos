'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Container, Typography, Box, Button, Paper, Grid, CircularProgress, 
  Alert, Chip, Divider, Avatar, Card, CardContent
} from '@mui/material';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, 
  Printer, Calendar, User, FileText, Camera
} from 'lucide-react';

export default function RelatorioAuditoriaPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [auditoria, setAuditoria] = useState<any>(null);
  const [secoes, setSecoes] = useState<any[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auditId) loadRelatorio();
  }, [auditId]);

  const loadRelatorio = async () => {
    setLoading(true);
    try {
        // 1. Dados da Auditoria
        const { data: auditData, error: auditErr } = await supabase
            .from('checklist_auditorias')
            .select(`*, checklist_modelos (titulo, descricao)`)
            .eq('id', auditId)
            .single();
        if (auditErr) throw auditErr;
        setAuditoria(auditData);

        // 2. Estrutura (Perguntas)
        const { data: secoesData, error: secoesErr } = await supabase
            .from('checklist_secoes')
            .select(`*, checklist_itens (*)`)
            .eq('modelo_id', auditData.modelo_id)
            .order('ordem');
        if (secoesErr) throw secoesErr;

        // Ordenação
        const secoesOrdenadas = secoesData.map((s: any) => ({
            ...s,
            checklist_itens: (s.checklist_itens || []).sort((a: any, b: any) => a.ordem - b.ordem)
        }));
        setSecoes(secoesOrdenadas);

        // 3. Respostas
        const { data: respData } = await supabase
            .from('checklist_respostas')
            .select('*')
            .eq('auditoria_id', auditId);
        
        const mapa: Record<string, any> = {};
        if (respData) {
            respData.forEach((r: any) => mapa[r.item_id] = r);
        }
        setRespostas(mapa);

    } catch (err: any) {
        alert('Erro ao carregar relatório: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const renderValorResposta = (item: any, resp: any) => {
      if (!resp) return <Typography color="text.disabled" variant="body2">Não respondido</Typography>;
      if (resp.nao_se_aplica) return <Chip icon={<MinusCircle size={14}/>} label="N.A." size="small" variant="outlined" />;

      if (item.tipo_resposta === 'CONFORME_NAOCONFORME') {
          if (resp.resposta_valor === 'CONFORME') return <Chip icon={<CheckCircle size={14}/>} label="Conforme" color="success" size="small" />;
          if (resp.resposta_valor === 'NAO_CONFORME') return <Chip icon={<XCircle size={14}/>} label="Não Conforme" color="error" size="small" />;
      }
      
      if (item.tipo_resposta === 'TEMPERATURA') {
          return <Typography fontWeight="bold">{resp.resposta_valor}°C</Typography>;
      }

      return <Typography fontWeight="bold">{resp.resposta_valor}</Typography>;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!auditoria) return <Alert severity="error">Relatório não encontrado.</Alert>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      
      {/* HEADER DE NAVEGAÇÃO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ color: 'text.secondary' }}>Voltar</Button>
        <Button variant="outlined" startIcon={<Printer />} onClick={() => window.print()}>Imprimir</Button>
      </Box>

      {/* CAPA DO RELATÓRIO */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid #ddd', borderRadius: 2 }}>
          <Box sx={{ borderBottom: '1px solid #eee', pb: 2, mb: 3 }}>
              <Typography variant="h4" fontWeight="800" gutterBottom>
                  {auditoria.titulo || auditoria.checklist_modelos?.titulo}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                  Relatório de Auditoria de Qualidade
              </Typography>
          </Box>

          <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Calendar size={18} className="text-gray-500"/>
                      <Typography variant="caption" fontWeight="bold">DATA INÍCIO</Typography>
                  </Box>
                  <Typography>{new Date(auditoria.data_inicio).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Calendar size={18} className="text-gray-500"/>
                      <Typography variant="caption" fontWeight="bold">DATA FIM</Typography>
                  </Box>
                  <Typography>{auditoria.data_fim ? new Date(auditoria.data_fim).toLocaleString() : '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <User size={18} className="text-gray-500"/>
                      <Typography variant="caption" fontWeight="bold">RESPONSÁVEL TÉCNICO</Typography>
                  </Box>
                  <Typography>ID: {auditoria.responsavel_id || 'Sistema'}</Typography>
              </Grid>
          </Grid>
      </Paper>

      {/* CONTEÚDO */}
      {secoes.map((secao) => (
        <Box key={secao.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, px: 1, borderLeft: '4px solid #333', fontWeight: 'bold', color: '#333' }}>
                {secao.titulo}
            </Typography>

            {secao.checklist_itens.map((item: any) => {
                const resp = respostas[item.id];
                const isNC = resp?.resposta_valor === 'NAO_CONFORME';

                return (
                    <Card key={item.id} variant="outlined" sx={{ mb: 1.5, bgcolor: isNC ? 'error.main' : 'background.paper', borderColor: isNC ? '#feb2b2' : '#e0e0e0' }}>
                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Grid container alignItems="flex-start" spacing={2}>
                                {/* PERGUNTA */}
                                <Grid item xs={12} md={7}>
                                    <Typography fontWeight="600">{item.texto_pergunta}</Typography>
                                    {item.ajuda_texto && <Typography variant="caption" color="text.secondary">Ref: {item.ajuda_texto}</Typography>}
                                </Grid>
                                
                                {/* RESPOSTA */}
                                <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                                    {renderValorResposta(item, resp)}
                                </Grid>
                            </Grid>

                            {/* DETALHES (OBS E FOTOS) */}
                            {(resp?.comentario || (resp?.fotos_urls && resp.fotos_urls.length > 0)) && (
                                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
                                    {resp.comentario && (
                                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            <FileText size={16} className="text-blue-500" style={{ marginTop: 3 }}/>
                                            <Typography variant="body2" color="text.secondary">Obs: {resp.comentario}</Typography>
                                        </Box>
                                    )}
                                    
                                    {resp.fotos_urls && resp.fotos_urls.length > 0 && (
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                            {resp.fotos_urls.map((url: string, idx: number) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                    <Avatar 
                                                        src={url} 
                                                        variant="rounded" 
                                                        sx={{ width: 50, height: 50, border: '1px solid #ddd', cursor: 'zoom-in' }} 
                                                    />
                                                </a>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
      ))}

    </Container>
  );
}