'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Paper, Grid, TextField, 
  CircularProgress, Alert, Card, CardContent,
  Stack, ToggleButton, ToggleButtonGroup, IconButton, Avatar
} from '@mui/material';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, 
  Camera, MessageSquare, FileText, X, Plus, Image as ImageIcon
} from 'lucide-react';

interface RespostaState {
  id?: string;
  item_id: string;
  valor: string;
  comentario: string;
  fotos_urls: string[]; // AGORA É UM ARRAY
  nao_se_aplica: boolean;
}

export default function ExecucaoChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const { activeClientId } = useClient();

  const [auditoria, setAuditoria] = useState<any>(null);
  const [secoes, setSecoes] = useState<any[]>([]);
  const [respostas, setRespostas] = useState<Record<string, RespostaState>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingInfo, setUploadingInfo] = useState<string | null>(null); // Mostra qual item está fazendo upload

  useEffect(() => {
    if (auditId && activeClientId) {
      loadDadosAuditoria();
    }
  }, [auditId, activeClientId]);

  const loadDadosAuditoria = async () => {
    setLoading(true);
    try {
        // 1. Auditoria
        const { data: auditData, error: auditErr } = await supabase
            .from('checklist_auditorias')
            .select(`*, checklist_modelos (titulo, descricao)`)
            .eq('id', auditId)
            .single();
        if (auditErr) throw auditErr;
        setAuditoria(auditData);

        // 2. Modelo (Perguntas)
        const { data: secoesData, error: secoesErr } = await supabase
            .from('checklist_secoes')
            .select(`*, checklist_itens (*)`)
            .eq('modelo_id', auditData.modelo_id)
            .order('ordem');
        if (secoesErr) throw secoesErr;
        
        const secoesOrdenadas = secoesData.map((s: any) => ({
            ...s,
            checklist_itens: (s.checklist_itens || []).sort((a: any, b: any) => a.ordem - b.ordem)
        }));
        setSecoes(secoesOrdenadas);

        // 3. Respostas Existentes
        const { data: respData } = await supabase
            .from('checklist_respostas')
            .select('*')
            .eq('auditoria_id', auditId);

        const mapaRespostas: Record<string, RespostaState> = {};
        if (respData) {
            respData.forEach((r: any) => {
                // Compatibilidade com legado (se tiver foto_url antiga, converte para array)
                let fotos = r.fotos_urls || [];
                if (!fotos.length && r.foto_url) fotos = [r.foto_url];

                mapaRespostas[r.item_id] = {
                    id: r.id,
                    item_id: r.item_id,
                    valor: r.resposta_valor,
                    comentario: r.comentario || '',
                    fotos_urls: fotos,
                    nao_se_aplica: r.nao_se_aplica
                };
            });
        }
        setRespostas(mapaRespostas);

    } catch (err: any) {
        console.error(err);
        alert('Erro ao carregar: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRespostaChange = (itemId: string, campo: keyof RespostaState, valor: any) => {
    setRespostas(prev => {
        const atual = prev[itemId] || { item_id: itemId, valor: '', comentario: '', fotos_urls: [], nao_se_aplica: false };
        
        if (campo === 'valor') {
             if (valor === 'NA') return { ...prev, [itemId]: { ...atual, valor: 'NA', nao_se_aplica: true } };
             return { ...prev, [itemId]: { ...atual, valor: valor, nao_se_aplica: false } };
        }

        return { ...prev, [itemId]: { ...atual, [campo]: valor } };
    });
  };

  // --- UPLOAD DE FOTOS (MÚLTIPLAS) ---
  const handleFileUpload = async (itemId: string, files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      setUploadingInfo(itemId);
      try {
          const novasUrls: string[] = [];

          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const fileExt = file.name.split('.').pop();
              const fileName = `${auditId}/${itemId}/${Date.now()}-${i}.${fileExt}`;
              
              // Upload para o Bucket 'checklist-evidencias'
              const { error: uploadError } = await supabase.storage
                  .from('checklist-evidencias')
                  .upload(fileName, file);

              if (uploadError) throw uploadError;

              // Get Public URL
              const { data: { publicUrl } } = supabase.storage
                  .from('checklist-evidencias')
                  .getPublicUrl(fileName);
              
              novasUrls.push(publicUrl);
          }

          // Atualiza Estado Local (Append)
          setRespostas(prev => {
              const atual = prev[itemId] || { item_id: itemId, valor: '', comentario: '', fotos_urls: [], nao_se_aplica: false };
              return { 
                  ...prev, 
                  [itemId]: { 
                      ...atual, 
                      fotos_urls: [...(atual.fotos_urls || []), ...novasUrls] 
                  } 
              };
          });

      } catch (error: any) {
          alert('Erro ao enviar foto: ' + error.message);
      } finally {
          setUploadingInfo(null);
      }
  };

  const removeFoto = (itemId: string, urlToRemove: string) => {
      if (!confirm('Remover esta foto?')) return;
      setRespostas(prev => {
          const atual = prev[itemId];
          if (!atual) return prev;
          return {
              ...prev,
              [itemId]: {
                  ...atual,
                  fotos_urls: atual.fotos_urls.filter(url => url !== urlToRemove)
              }
          };
      });
  };

  // 3. Salvamento (Upsert Manual com Limpeza)
  const saveAll = async (finalizar = false) => {
    setSaving(true);
    try {
        // PREPARAÇÃO LIMPA DO PAYLOAD
        const payload = Object.values(respostas).map(r => {
            // Cria o objeto base
            const item: any = {
                auditoria_id: auditId,
                item_id: r.item_id,
                resposta_valor: r.valor,
                comentario: r.comentario,
                fotos_urls: r.fotos_urls || [],
                nao_se_aplica: r.nao_se_aplica
            };

            // SÓ adiciona o ID se ele realmente existir (evita enviar null/undefined)
            if (r.id) {
                item.id = r.id;
            }

            return item;
        });

        if (payload.length > 0) {
            // Upsert: Atualiza se tiver ID, Cria se não tiver
            const { error } = await supabase.from('checklist_respostas').upsert(payload);
            if (error) throw error;
        }

        if (finalizar) {
            // Verifica obrigatórios
            let pendencias = 0;
            secoes.forEach(s => s.checklist_itens.forEach((i: any) => {
                const resp = respostas[i.id];
                // Verifica se respondeu (valor preenchido OU marcado como N.A.)
                if (i.obrigatorio && (!resp || (!resp.valor && !resp.nao_se_aplica))) {
                    pendencias++;
                }
                // Validação de foto obrigatória
                if (i.requer_foto && (!resp || !resp.fotos_urls || resp.fotos_urls.length === 0)) {
                    alert(`O item "${i.texto_pergunta}" exige pelo menos uma foto.`);
                    throw new Error('Fotos pendentes.');
                }
            }));

            if (pendencias > 0) {
                alert(`Existem ${pendencias} itens obrigatórios não respondidos. Preencha tudo antes de finalizar.`);
                setSaving(false);
                return;
            }

            await supabase.from('checklist_auditorias').update({
                status: 'CONCLUIDO',
                data_fim: new Date().toISOString()
            }).eq('id', auditId);
            
            alert('Auditoria finalizada com sucesso!');
            router.push('/qualidade'); 
        } else {
            // Recarrega para pegar os IDs que acabaram de ser gerados pelo banco
            await loadDadosAuditoria(); 
        }

    } catch (err: any) {
        if (err.message !== 'Fotos pendentes.') alert('Erro ao salvar: ' + err.message);
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      
      {/* HEADER FIXO - COM BOTÃO VOLTAR */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, position: 'sticky', top: 10, zIndex: 100, borderLeft: '6px solid #1976d2', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* LADO ESQUERDO: VOLTAR + TÍTULO */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()} size="small" sx={{ border: '1px solid #ddd' }}>
                    <ArrowLeft size={20} />
                </IconButton>

                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, lineHeight: 1.2 }}>
                        {auditoria?.titulo || auditoria?.checklist_modelos?.titulo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(auditoria.data_inicio).toLocaleDateString()} • {auditoria.status}
                    </Typography>
                </Box>
            </Box>

            {/* LADO DIREITO: AÇÕES */}
            <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={() => saveAll(false)} disabled={saving}>
                    {saving ? '...' : 'Salvar'}
                </Button>
                <Button variant="contained" size="small" color="success" onClick={() => saveAll(true)} disabled={saving}>
                    Finalizar
                </Button>
            </Stack>
        </Box>
      </Paper>

      {/* LISTA DE ITENS */}
      {secoes.map((secao) => (
        <Box key={secao.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, px: 1, borderLeft: '4px solid #ddd', fontWeight: 'bold', color: 'text.secondary' }}>
                {secao.titulo}
            </Typography>

            {secao.checklist_itens.map((item: any) => {
                const resp = respostas[item.id] || { valor: '', fotos_urls: [] };
                const isNC = resp.valor === 'NAO_CONFORME';

                return (
                    <Card key={item.id} sx={{ mb: 2, border: isNC ? '1px solid #ef5350' : '1px solid #eee', transition: '0.3s' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography fontWeight="600" sx={{ fontSize: '1rem' }}>
                                    {item.texto_pergunta} {item.obrigatorio && <span style={{color:'red'}}>*</span>}
                                </Typography>
                                {item.requer_foto && <Camera size={16} className="text-orange-500" />}
                            </Box>
                            
                            {item.ajuda_texto && (
                                <Alert severity="info" icon={false} sx={{ py: 0, mb: 2, fontSize: '0.85rem' }}>💡 {item.ajuda_texto}</Alert>
                            )}

                            {/* INPUTS DE RESPOSTA */}
                            <Box sx={{ mt: 2 }}>
                                {item.tipo_resposta === 'CONFORME_NAOCONFORME' && (
                                    <ToggleButtonGroup
                                        color="primary"
                                        value={resp.valor}
                                        exclusive
                                        onChange={(_, val) => val && handleRespostaChange(item.id, 'valor', val)}
                                        fullWidth size="small"
                                    >
                                        <ToggleButton value="CONFORME" sx={{ '&.Mui-selected': { bgcolor: '#e8f5e9', color: 'green' } }}>
                                            <CheckCircle size={18} style={{marginRight:6}} /> C
                                        </ToggleButton>
                                        <ToggleButton value="NAO_CONFORME" sx={{ '&.Mui-selected': { bgcolor: '#ffebee', color: 'red' } }}>
                                            <XCircle size={18} style={{marginRight:6}} /> N/C
                                        </ToggleButton>
                                        <ToggleButton value="NA">
                                            <MinusCircle size={18} style={{marginRight:6}} /> N.A.
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                )}

                                {(item.tipo_resposta === 'TEMPERATURA' || item.tipo_resposta === 'NUMERO') && (
                                    <Stack direction="row" spacing={1}>
                                        <TextField 
                                            type="number" size="small" fullWidth
                                            placeholder={item.tipo_resposta === 'TEMPERATURA' ? '°C' : 'Valor'}
                                            value={resp.valor === 'NA' ? '' : resp.valor}
                                            onChange={e => handleRespostaChange(item.id, 'valor', e.target.value)}
                                            disabled={resp.valor === 'NA'}
                                        />
                                        <ToggleButtonGroup value={resp.valor === 'NA' ? 'NA' : ''} exclusive onChange={(_, v) => v ? handleRespostaChange(item.id, 'valor', 'NA') : handleRespostaChange(item.id, 'valor', '')}>
                                            <ToggleButton value="NA" size="small">N.A.</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Stack>
                                )}

                                {item.tipo_resposta === 'TEXTO' && (
                                    <TextField fullWidth multiline rows={2} size="small" placeholder="Resposta..." value={resp.valor} onChange={e => handleRespostaChange(item.id, 'valor', e.target.value)} />
                                )}
                            </Box>

                            {/* ÁREA DE FOTOS (MÚLTIPLAS) */}
                            {resp.fotos_urls && resp.fotos_urls.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                    {resp.fotos_urls.map((url: string, idx: number) => (
                                        <Box key={idx} sx={{ position: 'relative', width: 60, height: 60 }}>
                                            <Avatar src={url} variant="rounded" sx={{ width: 60, height: 60, border: '1px solid #ddd' }} />
                                            <IconButton 
                                                size="small" 
                                                onClick={() => removeFoto(item.id, url)}
                                                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', border: '1px solid #ccc', p: 0.5, '&:hover': { bgcolor: '#ffebee' } }}
                                            >
                                                <X size={12} color="red" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* AÇÕES DE RODAPÉ DO ITEM */}
                            <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee', display: 'flex', gap: 1, alignItems: 'center' }}>
                                {/* Botão de Upload Invisível */}
                                <input
                                    accept="image/*"
                                    id={`icon-button-file-${item.id}`}
                                    type="file"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(item.id, e.target.files)}
                                />
                                <label htmlFor={`icon-button-file-${item.id}`}>
                                    <Button 
                                        component="span" 
                                        size="small" 
                                        startIcon={uploadingInfo === item.id ? <CircularProgress size={16}/> : <Camera size={16}/>}
                                        disabled={!!uploadingInfo}
                                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                                    >
                                        {resp.fotos_urls?.length ? 'Add Mais' : 'Foto'}
                                    </Button>
                                </label>

                                <Button 
                                    size="small" 
                                    startIcon={<MessageSquare size={16}/>} 
                                    color="inherit" 
                                    sx={{ textTransform: 'none', color: 'text.secondary' }}
                                    onClick={() => {
                                        const obs = prompt('Observação:', resp.comentario);
                                        if (obs !== null) handleRespostaChange(item.id, 'comentario', obs);
                                    }}
                                >
                                    Obs
                                </Button>
                            </Box>
                            
                            {resp.comentario && (
                                <Alert severity="info" icon={<FileText size={14}/>} sx={{ mt: 1, py: 0, fontSize: '0.8rem' }}>
                                    {resp.comentario}
                                </Alert>
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