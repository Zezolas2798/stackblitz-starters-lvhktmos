'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Paper, Grid, TextField, 
  CircularProgress, Alert, Card, CardContent,
  Stack, ToggleButton, ToggleButtonGroup, IconButton, Avatar, Chip,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, 
  Camera, MessageSquare, FileText, X, Plus, Image as ImageIcon,
  Eraser, Save, Lock, Unlock, ChevronDown
} from 'lucide-react';
import { useRef } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { formatLocalDate, getNowISO } from '@/lib/utils/dateUtils';

interface RespostaState {
  id?: string;
  item_id: string;
  valor: string;
  comentario: string;
  fotos_urls: string[]; // AGORA É UM ARRAY
  nao_se_aplica: boolean;
}

export default function ExecucaoChecklistPage() {
  const theme = useTheme();
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;
  const { activeClientId } = useClient();

  const [auditoria, setAuditoria] = useState<any>(null);
  const [secoes, setSecoes] = useState<any[]>([]);
  const [respostas, setRespostas] = useState<Record<string, RespostaState>>({});
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
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

        // 2. Modelo (Perguntas) - COM DEDUPLICAÇÃO VIA FRONTEND
        const { data: secoesRaw, error: secoesErr } = await supabase
            .from('checklist_secoes')
            .select(`*, checklist_itens (*)`)
            .eq('modelo_id', auditData.modelo_id)
            .order('ordem');
        if (secoesErr) throw secoesErr;
        
        // Lógica de Agrupamento
        const secoesMapeadas: Record<string, any> = {};

        secoesRaw.forEach((s: any) => {
            if (!secoesMapeadas[s.titulo]) {
                secoesMapeadas[s.titulo] = { ...s, checklist_itens: [] };
            }

            const secaoExistente = secoesMapeadas[s.titulo];
            const itensMapeados: Record<string, any> = {};

            // Indexa itens já existentes na seção pelo texto da pergunta
            secaoExistente.checklist_itens.forEach((i: any) => {
                itensMapeados[i.texto_pergunta] = i;
            });

            (s.checklist_itens || []).forEach((item: any) => {
                if (!itensMapeados[item.texto_pergunta]) {
                    const novoItem = { ...item, ids_originais: [item.id] };
                    secaoExistente.checklist_itens.push(novoItem);
                    itensMapeados[item.texto_pergunta] = novoItem;
                } else {
                    itensMapeados[item.texto_pergunta].ids_originais.push(item.id);
                }
            });
        });

        const secoesFinais = Object.values(secoesMapeadas).map((s: any) => ({
            ...s,
            checklist_itens: s.checklist_itens.sort((a: any, b: any) => a.ordem - b.ordem)
        })).sort((a: any, b: any) => a.ordem - b.ordem);

        setSecoes(secoesFinais);

        // 3. Respostas Existentes
        const { data: respData } = await supabase
            .from('checklist_respostas')
            .select('*')
            .eq('auditoria_id', auditId);

        const mapaRespostas: Record<string, RespostaState> = {};
        
        // Inicializa o mapa para todos os itens VIRTUAIS
        secoesFinais.forEach((s: any) => {
            s.checklist_itens?.forEach((i: any) => {
                mapaRespostas[i.id] = {
                    item_id: i.id,
                    valor: '',
                    comentario: '',
                    fotos_urls: [],
                    nao_se_aplica: false
                };
            });
        });

        // Carrega respostas reais. Se houver duplicatas no banco, a última (mais recente) prevalece no estado visual.
        if (respData) {
            respData.forEach((r: any) => {
                // Encontra qual item virtual representa este item_id
                const itemVirtual = secoesFinais.flatMap(s => s.checklist_itens).find(i => i.ids_originais.includes(r.item_id));
                
                if (itemVirtual) {
                    let fotos = r.fotos_urls || [];
                    if (!fotos.length && r.foto_url) fotos = [r.foto_url];

                    mapaRespostas[itemVirtual.id] = {
                        id: r.id, // Guardamos o ID da resposta real
                        item_id: itemVirtual.id,
                        valor: r.resposta_valor || '',
                        comentario: r.comentario || '',
                        fotos_urls: fotos,
                        nao_se_aplica: r.nao_se_aplica || false
                    };
                }
            });
        }
        setRespostas(mapaRespostas);

        setAssinaturaUrl((auditData as any).assinatura_auditor_url || null);

        // 4. Perfil do Usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(profile);
        }

    } catch (err: any) {
        console.error(err);
        alert('Erro ao carregar: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isReadOnly = auditoria?.status === 'CONCLUIDO' && !isAdmin;

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
        // Sincronizamos a resposta do item virtual para TODOS os IDs originais duplicados
        const payload: any[] = [];
        
        secoes.forEach(s => {
            s.checklist_itens.forEach((itemVirtual: any) => {
                const r = respostas[itemVirtual.id];
                if (!r) return;

                itemVirtual.ids_originais.forEach((originalId: string) => {
                    payload.push({
                        auditoria_id: auditId,
                        item_id: originalId,
                        resposta_valor: r.valor,
                        conforme: r.valor === 'CONFORME',
                        comentario: r.comentario,
                        fotos_urls: r.fotos_urls || [],
                        nao_se_aplica: r.nao_se_aplica
                    });
                });
            });
        });

        if (payload.length > 0) {
            // Nota: Como estamos fazendo upsert sem o ID da resposta (checklist_respostas.id),
            // o banco usará a constraint UNIQUE (auditoria_id, item_id) que aplicamos anteriormente
            // para atualizar ou inserir corretamente.
            const { error } = await supabase.from('checklist_respostas').upsert(payload, {
                onConflict: 'auditoria_id, item_id'
            });
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
                alert(`Existem ${pendencias} itens obrigatórios não respondidos. Por favor, revise todas as seções antes de finalizar.`);
                setSaving(false);
                return;
            }

            if (finalizar && !assinaturaUrl) {
                alert('A assinatura do auditor é obrigatória para finalizar a auditoria.');
                setSaving(false);
                return;
            }

            await supabase.from('checklist_auditorias').update({
                status: finalizar ? 'CONCLUIDO' : auditoria.status,
                data_fim: finalizar ? getNowISO() : auditoria.data_fim,
                assinatura_auditor_url: assinaturaUrl
            }).eq('id', auditId);
            
            alert('Auditoria finalizada com sucesso!');
            router.push('/qualidade'); 
        } else {
            // Recarrega para pegar os IDs que acabaram de ser gerados pelo banco
            await loadDadosAuditoria(); 
        }

    } catch (err: any) {
        if (err.message !== 'Fotos pendentes.') alert('Erro ao salvar: ' + err.message);
    }
  };

  // --- COMPONENTE DE ASSINATURA ---
  const SignaturePad = ({ onSave, onClear, currentUrl }: { onSave: (url: string) => void, onClear: () => void, currentUrl?: string | null }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: any) => {
        if (isReadOnly) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath(); // Reset path
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || isReadOnly) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            onClear();
        }
    };

    const save = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], 'signature.png', { type: 'image/png' });
            const fileName = `signatures/${auditId}/${Date.now()}.png`;
            
            setSaving(true);
            const { error: uploadError } = await supabase.storage.from('checklist-evidencias').upload(fileName, file);
            if (uploadError) {
                alert('Erro ao salvar assinatura: ' + uploadError.message);
                setSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('checklist-evidencias').getPublicUrl(fileName);
            onSave(publicUrl);
            setSaving(false);
            alert('Assinatura capturada com sucesso!');
        });
    };

    return (
        <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 2, bgcolor: isReadOnly ? 'grey.100' : 'white', position: 'relative' }}>
            {currentUrl && !isDrawing ? (
                <Box sx={{ textAlign: 'center' }}>
                    <img src={currentUrl} alt="Assinatura" style={{ maxWidth: '100%', maxHeight: 150 }} />
                    {!isReadOnly && (
                        <Button size="small" startIcon={<Eraser size={16}/>} onClick={clear} sx={{ mt: 1 }}>Limpar Assinatura</Button>
                    )}
                </Box>
            ) : (
                <Box>
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        style={{ width: '100%', height: 200, cursor: isReadOnly ? 'not-allowed' : 'crosshair', touchAction: 'none' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    {!isReadOnly && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<Eraser size={16}/>} onClick={clear}>Limpar</Button>
                            <Button size="small" variant="contained" startIcon={<Save size={16}/>} onClick={save}>Confirmar Assinatura</Button>
                        </Stack>
                    )}
                </Box>
            )}
            {isReadOnly && (
                <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <Lock size={14} /> <Typography variant="caption">Bloqueado</Typography>
                </Box>
            )}
        </Box>
    );
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
                        {formatLocalDate(auditoria.data_inicio)} • {auditoria.status}
                    </Typography>
                </Box>
            </Box>

            {/* LADO DIREITO: AÇÕES */}
            <Stack direction="row" spacing={1}>
                {isReadOnly ? (
                    <Chip icon={<Lock size={14}/>} label="Auditoria Finalizada" color="info" variant="outlined" />
                ) : (
                    <>
                        <Button variant="outlined" size="small" onClick={() => saveAll(false)} disabled={saving}>
                            {saving ? '...' : 'Salvar'}
                        </Button>
                        <Button variant="contained" size="small" color="success" onClick={() => saveAll(true)} disabled={saving}>
                            Finalizar
                        </Button>
                    </>
                )}
            </Stack>
        </Box>
      </Paper>

      {/* LISTA DE ITENS POR SEÇÃO (ACCORDIONS) */}
      <Stack spacing={2}>
        {secoes.map((secao) => {
          const totalItems = secao.checklist_itens?.length || 0;
          const answeredItems = secao.checklist_itens?.filter((item: any) => {
            const r = respostas[item.id];
            return r && (r.valor || r.nao_se_aplica);
          }).length || 0;
          const isCompleted = totalItems > 0 && answeredItems === totalItems;

          return (
            <Accordion 
              key={secao.id} 
              TransitionProps={{ timeout: 300 }}
              sx={{ 
                borderRadius: '12px !important', 
                overflow: 'hidden',
                border: '1px solid #eee',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary 
                expandIcon={<ChevronDown size={20} />}
                sx={{ 
                  bgcolor: isCompleted ? alpha(theme.palette.success.main, 0.04) : 'white',
                  borderBottom: '1px solid #f0f0f0',
                  px: 2,
                  '& .MuiAccordionSummary-content': { alignItems: 'center', justifyContent: 'space-between' }
                }}
              >
                <Typography fontWeight="bold" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                   <Box sx={{ width: 4, height: 20, bgcolor: isCompleted ? 'success.main' : 'primary.main', borderRadius: 1 }} />
                   {secao.titulo}
                </Typography>
                
                <Chip 
                  label={`${answeredItems} / ${totalItems}`} 
                  size="small" 
                  color={isCompleted ? "success" : "default"}
                  variant={isCompleted ? "filled" : "outlined"}
                  sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                />
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, bgcolor: '#fafafa' }}>
                {secao.checklist_itens.map((item: any) => {
                    const resp = respostas[item.id] || { valor: '', fotos_urls: [] };
                    const isNC = resp.valor === 'NAO_CONFORME';

                    return (
                        <Card key={item.id} sx={{ mb: 2, border: isNC ? '1px solid #ef5350' : '1px solid #eee', transition: '0.3s' }}>
                            <CardContent sx={{ p: '16px !important' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography fontWeight="600" sx={{ fontSize: '0.95rem', color: '#333' }}>
                                        {item.texto_pergunta} {item.obrigatorio && <span style={{color:'red'}}>*</span>}
                                    </Typography>
                                    {item.requer_foto && <Camera size={16} color={theme.palette.warning.main} />}
                                </Box>
                                
                                {item.ajuda_texto && (
                                    <Alert severity="info" icon={false} sx={{ py: 0, mb: 2, fontSize: '0.8rem', border: 'none', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                                       💡 {item.ajuda_texto}
                                    </Alert>
                                )}

                                {/* INPUTS DE RESPOSTA */}
                                <Box sx={{ mt: 2 }}>
                                    {item.tipo_resposta === 'CONFORME_NAOCONFORME' && (
                                        <ToggleButtonGroup
                                            color="primary"
                                            value={resp.valor}
                                            exclusive
                                            onChange={(_, val) => val !== null && handleRespostaChange(item.id, 'valor', val)}
                                            fullWidth size="small"
                                            sx={{ height: 40 }}
                                        >
                                            <ToggleButton value="CONFORME" sx={{ '&.Mui-selected': { bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 'bold' } }}>
                                                <CheckCircle size={18} style={{marginRight:6}} /> C
                                            </ToggleButton>
                                            <ToggleButton value="NAO_CONFORME" sx={{ '&.Mui-selected': { bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, fontWeight: 'bold' } }}>
                                                <XCircle size={18} style={{marginRight:6}} /> N/C
                                            </ToggleButton>
                                            <ToggleButton value="NA" sx={{ '&.Mui-selected': { bgcolor: '#f5f5f5', fontWeight: 'bold' } }}>
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
                                                sx={{ bgcolor: 'white' }}
                                            />
                                            <ToggleButtonGroup value={resp.valor === 'NA' ? 'NA' : ''} exclusive onChange={(_, v) => handleRespostaChange(item.id, 'valor', v === 'NA' ? 'NA' : '')}>
                                                <ToggleButton value="NA" size="small" sx={{ px: 2 }}>N.A.</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Stack>
                                    )}

                                    {item.tipo_resposta === 'TEXTO' && (
                                        <TextField 
                                           fullWidth multiline rows={2} size="small" 
                                           placeholder="Descreva aqui sua observação..." 
                                           value={resp.valor} 
                                           onChange={e => handleRespostaChange(item.id, 'valor', e.target.value)}
                                           sx={{ bgcolor: 'white' }}
                                        />
                                    )}
                                </Box>

                                {/* ÁREA DE FOTOS */}
                                {resp.fotos_urls && resp.fotos_urls.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                        {resp.fotos_urls.map((url: string, idx: number) => (
                                            <Box key={idx} sx={{ position: 'relative', width: 64, height: 64 }}>
                                                <Avatar src={url} variant="rounded" sx={{ width: 64, height: 64, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => removeFoto(item.id, url)}
                                                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', p: 0.2, '&:hover': { bgcolor: 'error.dark' }, width: 20, height: 20 }}
                                                >
                                                    <X size={14} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {/* AÇÕES DE RODAPÉ DO ITEM */}
                                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee', display: 'flex', gap: 2, alignItems: 'center' }}>
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
                                            disabled={!!uploadingInfo || isReadOnly}
                                            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 'bold' }}
                                        >
                                            {resp.fotos_urls?.length ? 'Adicionar Fotos' : 'Anexar Foto'}
                                        </Button>
                                    </label>

                                    <Button 
                                        size="small" 
                                        startIcon={<MessageSquare size={16}/>} 
                                        color="inherit" 
                                        sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 'bold' }}
                                        onClick={() => {
                                            if (isReadOnly) return;
                                            const obs = prompt('Inserir observação para este item:', resp.comentario);
                                            if (obs !== null) handleRespostaChange(item.id, 'comentario', obs);
                                        }}
                                    >
                                        Observação
                                    </Button>
                                </Box>
                                
                                {resp.comentario && (
                                    <Alert 
                                        severity="warning" 
                                        icon={<FileText size={16}/>} 
                                        sx={{ mt: 1.5, py: 0.5, fontSize: '0.85rem', borderRadius: 2, borderLeft: '4px solid orange' }}
                                    >
                                        <Typography variant="caption" fontWeight="bold" display="block">Obs:</Typography>
                                        {resp.comentario}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {/* SEÇÃO DE ASSINATURA NO FINAL */}
      <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText size={18} /> Assinatura do Auditor (Obrigatória para Finalizar)
          </Typography>
          <SignaturePad 
            currentUrl={assinaturaUrl} 
            onSave={(url) => setAssinaturaUrl(url)} 
            onClear={() => setAssinaturaUrl(null)}
          />
      </Box>

    </Container>
  );
}