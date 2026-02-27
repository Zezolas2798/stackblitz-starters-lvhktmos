'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { 
  Container, Typography, Box, Button, Paper, Grid, TextField, 
  Select, MenuItem, FormControl, InputLabel, IconButton, 
  Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel,
  Divider, Alert, CircularProgress, Tooltip, Stack, alpha, useTheme,
  InputAdornment
} from '@mui/material';
import { 
  Save, ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, 
  Thermometer, CheckSquare, Hash, Type, Camera, AlertCircle, Grip
} from 'lucide-react';

// Tipos Locais para o Formulário
interface ItemForm {
  id?: string;
  tempId: string;
  texto_pergunta: string;
  tipo_resposta: 'CONFORME_NAOCONFORME' | 'TEMPERATURA' | 'NUMERO' | 'TEXTO';
  obrigatorio: boolean;
  requer_foto: boolean;
  ajuda_texto: string;
}

interface SecaoForm {
  id?: string;
  tempId: string;
  titulo: string;
  itens: ItemForm[];
}

export default function EditorModeloChecklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const { activeClientId } = useClient();
  const theme = useTheme();

  // Estados do Modelo
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [frequencia, setFrequencia] = useState('DIARIO');
  const [secoes, setSecoes] = useState<SecaoForm[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar dados se for edição
  useEffect(() => {
    if (editingId && activeClientId) {
      loadModeloCompleto(editingId);
    } else {
        // Se for novo, inicia com uma seção vazia
        handleAddSecao();
    }
  }, [editingId, activeClientId]);

  async function loadModeloCompleto(id: string) {
    setLoading(true);
    
    // 1. Carrega Modelo
    const { data: modelo } = await supabase.from('checklist_modelos').select('*').eq('id', id).single();
    if (!modelo) { setLoading(false); return; }

    setNome(modelo.titulo);
    setDescricao(modelo.descricao || '');
    setFrequencia(modelo.frequencia_sugerida || 'DIARIO');

    // 2. Carrega Seções e Itens
    const { data: secoesData } = await supabase
        .from('checklist_secoes')
        .select(`
            *,
            checklist_itens (*)
        `)
        .eq('modelo_id', id)
        .order('ordem');

    if (secoesData) {
        const secoesFormatadas = secoesData.map((s: any) => ({
            id: s.id,
            tempId: s.id,
            titulo: s.titulo,
            itens: (s.checklist_itens || [])
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((i: any) => ({
                    id: i.id,
                    tempId: i.id,
                    texto_pergunta: i.texto_pergunta,
                    tipo_resposta: i.tipo_resposta,
                    obrigatorio: i.obrigatorio,
                    requer_foto: i.requer_foto || false,
                    ajuda_texto: i.ajuda_texto || ''
                }))
        }));
        setSecoes(secoesFormatadas);
    }
    setLoading(false);
  }

  // --- MANIPULAÇÃO DE SEÇÕES ---
  const handleAddSecao = () => {
    setSecoes([...secoes, { 
        tempId: `new_sec_${Date.now()}`, 
        titulo: '', 
        itens: [] 
    }]);
  };

  const handleRemoveSecao = (index: number) => {
    if (!confirm('Remover esta seção apagará todas as perguntas dentro dela. Continuar?')) return;
    const novas = [...secoes];
    novas.splice(index, 1);
    setSecoes(novas);
  };

  const handleUpdateSecao = (index: number, field: string, value: string) => {
    const novas = [...secoes];
    novas[index] = { ...novas[index], [field]: value };
    setSecoes(novas);
  };

  // --- MANIPULAÇÃO DE ITENS (PERGUNTAS) ---
  const handleAddItem = (secaoIndex: number) => {
    const novas = [...secoes];
    novas[secaoIndex].itens.push({
        tempId: `new_item_${Date.now()}_${Math.random()}`,
        texto_pergunta: '',
        tipo_resposta: 'CONFORME_NAOCONFORME',
        obrigatorio: true,
        requer_foto: false,
        ajuda_texto: ''
    });
    setSecoes(novas);
  };

  const handleRemoveItem = (secaoIndex: number, itemIndex: number) => {
    const novas = [...secoes];
    novas[secaoIndex].itens.splice(itemIndex, 1);
    setSecoes(novas);
  };

  const handleUpdateItem = (secaoIndex: number, itemIndex: number, field: keyof ItemForm, value: any) => {
    const novas = [...secoes];
    novas[secaoIndex].itens[itemIndex] = { 
        ...novas[secaoIndex].itens[itemIndex], 
        [field]: value 
    };
    setSecoes(novas);
  };

  // --- SALVAR TUDO ---
  const handleSave = async () => {
    if (!nome.trim()) return alert('O modelo precisa de um nome.');
    if (secoes.length === 0) return alert('Adicione pelo menos uma seção.');
    
    for (const secao of secoes) {
        if (!secao.titulo.trim()) return alert('Todas as seções precisam de um título.');
        if (secao.itens.length === 0) return alert(`A seção "${secao.titulo}" está vazia.`);
        for (const item of secao.itens) {
            if (!item.texto_pergunta.trim()) return alert(`Existem perguntas sem texto na seção "${secao.titulo}".`);
        }
    }

    if (!activeClientId) return alert('Sem cliente ativo.');

    setSaving(true);
    try {
        let modeloId = editingId;

        // 1. Salvar Modelo Pai
        const payloadModelo = {
            cliente_id: activeClientId,
            titulo: nome,
            descricao,
            frequencia_sugerida: frequencia,
            ativo: true
        };

        if (modeloId) {
            const { error } = await supabase.from('checklist_modelos').update(payloadModelo).eq('id', modeloId);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('checklist_modelos').insert(payloadModelo).select('id').single();
            if (error) throw error;
            modeloId = data.id;
        }

        // 2. Limpar estrutura antiga (Simples e eficaz para edição)
        if (editingId) {
            await supabase.from('checklist_secoes').delete().eq('modelo_id', modeloId);
        }

        // 3. Inserir Nova Estrutura
        for (let i = 0; i < secoes.length; i++) {
            const secao = secoes[i];
            
            const { data: secaoSaved, error: sErr } = await supabase.from('checklist_secoes').insert({
                modelo_id: modeloId,
                titulo: secao.titulo,
                ordem: i
            }).select('id').single();

            if (sErr) throw sErr;

            if (secao.itens.length > 0) {
                const itensPayload = secao.itens.map((item, idx) => ({
                    secao_id: secaoSaved.id,
                    modelo_id: modeloId, // Mantemos redundância para facilitar queries se necessário
                    texto_pergunta: item.texto_pergunta,
                    tipo_resposta: item.tipo_resposta,
                    obrigatorio: item.obrigatorio,
                    requer_foto: item.requer_foto,
                    ajuda_texto: item.ajuda_texto,
                    ordem: idx
                }));
                const { error: iErr } = await supabase.from('checklist_itens').insert(itensPayload);
                if (iErr) throw iErr;
            }
        }

        router.push('/qualidade/modelos');

    } catch (err: any) {
        console.error(err);
        alert('Erro ao salvar modelo: ' + err.message);
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 12 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ mr: 2, color: 'text.secondary' }}>Voltar</Button>
        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
          {editingId ? 'Editar Modelo' : 'Novo Checklist'}
        </Typography>
      </Box>

      {/* DADOS GERAIS */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary.main">Definições do Formulário</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <TextField 
                    label="Nome do Checklist" fullWidth 
                    value={nome} onChange={e => setNome(e.target.value)} 
                    placeholder="Ex: Controle de Temperatura de Equipamentos" required InputLabelProps={{ shrink: true }}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                    <InputLabel shrink>Frequência Sugerida</InputLabel>
                    <Select value={frequencia} label="Frequência Sugerida" onChange={e => setFrequencia(e.target.value)}>
                        <MenuItem value="DIARIO">Diário (Rotina)</MenuItem>
                        <MenuItem value="SEMANAL">Semanal</MenuItem>
                        <MenuItem value="MENSAL">Mensal</MenuItem>
                        <MenuItem value="EVENTUAL">Eventual / Auditoria</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField 
                    label="Instruções Gerais para o Operador" fullWidth multiline rows={2} 
                    value={descricao} onChange={e => setDescricao(e.target.value)} 
                    placeholder="Ex: Preencher antes de iniciar a produção. Notificar gerente se houver inconformidade." InputLabelProps={{ shrink: true }}
                />
            </Grid>
        </Grid>
      </Paper>

      {/* CONSTRUTOR DE SEÇÕES */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Grip size={24} /> Estrutura
            </Typography>
            <Button variant="contained" color="primary" startIcon={<Plus />} onClick={handleAddSecao}>
                Nova Seção (Categoria)
            </Button>
        </Box>

        {secoes.map((secao, sIdx) => (
            <Accordion key={secao.tempId} defaultExpanded sx={{ mb: 3, border: '1px solid #e0e0e0', borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ChevronDown />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }} onClick={e => e.stopPropagation()}>
                        <GripVertical size={20} color="#999" style={{ cursor: 'move' }} />
                        <TextField 
                            placeholder="Nome da Seção (Ex: Geladeiras...)" variant="standard" fullWidth 
                            value={secao.titulo} onChange={e => handleUpdateSecao(sIdx, 'titulo', e.target.value)}
                            sx={{ '& .MuiInput-underline:before': { borderBottom: 'none' } }}
                            InputProps={{ style: { fontWeight: 'bold', fontSize: '1.1rem', color: theme.palette.primary.dark } }}
                            onClick={e => e.stopPropagation()} 
                        />
                        <Tooltip title="Remover Seção"><IconButton size="small" color="error" onClick={() => handleRemoveSecao(sIdx)}><Trash2 size={18} /></IconButton></Tooltip>
                    </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ p: 0, bgcolor: '#fff' }}>
                    <Box sx={{ p: 3 }}>
                        {secao.itens.map((item, iIdx) => (
                            <Box key={item.tempId} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, mb: 2, border: '1px solid #eee', borderRadius: 2, '&:hover': { borderColor: theme.palette.primary.light, bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid item xs={12} md={7}>
                                        <TextField 
                                            label={`Pergunta ${iIdx + 1}`} fullWidth size="small" 
                                            value={item.texto_pergunta} onChange={e => handleUpdateItem(sIdx, iIdx, 'texto_pergunta', e.target.value)}
                                            placeholder="O que deve ser verificado?" InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel shrink>Tipo de Resposta</InputLabel>
                                            <Select value={item.tipo_resposta} label="Tipo de Resposta" onChange={e => handleUpdateItem(sIdx, iIdx, 'tipo_resposta', e.target.value)}>
                                                {/* OPÇÃO ATUALIZADA COM N.A. */}
                                                <MenuItem value="CONFORME_NAOCONFORME"><Box sx={{display:'flex', gap:1, alignItems:'center'}}><CheckSquare size={16} className="text-green-600"/> Conforme / Não Conforme / N.A.</Box></MenuItem>
                                                <MenuItem value="TEMPERATURA"><Box sx={{display:'flex', gap:1, alignItems:'center'}}><Thermometer size={16} className="text-blue-600"/> Temperatura (°C)</Box></MenuItem>
                                                <MenuItem value="NUMERO"><Box sx={{display:'flex', gap:1, alignItems:'center'}}><Hash size={16} className="text-orange-600"/> Numérico (Qtd/Peso)</Box></MenuItem>
                                                <MenuItem value="TEXTO"><Box sx={{display:'flex', gap:1, alignItems:'center'}}><Type size={16} className="text-gray-600"/> Texto Livre</Box></MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Tooltip title="Excluir Pergunta"><IconButton size="small" onClick={() => handleRemoveItem(sIdx, iIdx)}><Trash2 size={18} /></IconButton></Tooltip>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={6}>
                                        <TextField 
                                            label="Instrução de Trabalho (Ajuda)" size="small" fullWidth 
                                            value={item.ajuda_texto} onChange={e => handleUpdateItem(sIdx, iIdx, 'ajuda_texto', e.target.value)}
                                            placeholder="Ex: Temp. ideal entre 2°C e 8°C"
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><AlertCircle size={14} color="#aaa" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                            <FormControlLabel control={<Switch size="small" checked={item.obrigatorio} onChange={e => handleUpdateItem(sIdx, iIdx, 'obrigatorio', e.target.checked)} />} label={<Typography variant="caption" fontWeight="500">Obrigatório</Typography>} />
                                            <FormControlLabel control={<Switch size="small" color="warning" checked={item.requer_foto} onChange={e => handleUpdateItem(sIdx, iIdx, 'requer_foto', e.target.checked)} />} label={<Typography variant="caption" fontWeight="500" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Camera size={14}/> Exige Foto</Typography>} />
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        <Button fullWidth variant="outlined" startIcon={<Plus size={16} />} onClick={() => handleAddItem(sIdx)} sx={{ borderStyle: 'dashed', height: 48, color: 'text.secondary' }}>Adicionar Pergunta à seção "{secao.titulo || 'Nova'}"</Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        ))}
        {secoes.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Comece criando categorias para organizar suas perguntas.</Alert>}
      </Box>

      {/* FOOTER ACTIONS */}
      <Paper elevation={4} sx={{ position: 'fixed', bottom: 0, left: { md: 280, xs: 0 }, right: 0, p: 2, bgcolor: 'background.paper', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2, zIndex: 1000 }}>
         <Button variant="text" onClick={() => router.back()}>Cancelar</Button>
         <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <Save />} onClick={handleSave} disabled={saving} sx={{ px: 4, fontWeight: 'bold' }}>{saving ? 'Salvando...' : 'Salvar Modelo'}</Button>
      </Paper>
    </Container>
  );
}