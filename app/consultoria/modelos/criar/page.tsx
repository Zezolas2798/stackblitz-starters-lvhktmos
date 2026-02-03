'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Button, Paper, TextField, 
  MenuItem, IconButton, Divider, Switch, FormControlLabel,
  Snackbar, Alert, Container, Tooltip, Chip, useTheme, alpha
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Plus, Trash2, GripVertical, Save, ArrowLeft, 
  Image as ImageIcon, ListChecks, Type, Hash, Thermometer 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';

// Tipos locais para o estado do formulário
type NovoItem = {
  texto_pergunta: string;
  tipo_resposta: 'CONFORME_NAOCONFORME' | 'TEXTO' | 'NUMERO' | 'TEMPERATURA' | 'FOTO';
  obrigatorio: boolean;
  requer_foto: boolean;
};

type NovaSecao = {
  titulo: string;
  itens: NovoItem[];
};

export default function CriarModeloPage() {
  const theme = useTheme();
  const router = useRouter();
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(false);
  
  // Dados do Modelo
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [frequencia, setFrequencia] = useState('DIARIO');
  
  // Dados das Seções e Itens
  const [secoes, setSecoes] = useState<NovaSecao[]>([
    { titulo: 'Seção 1', itens: [] } 
  ]);

  // Funções de Manipulação
  const addSecao = () => {
    setSecoes([...secoes, { titulo: `Nova Seção ${secoes.length + 1}`, itens: [] }]);
  };

  const removeSecao = (idx: number) => {
    const novas = [...secoes];
    novas.splice(idx, 1);
    setSecoes(novas);
  };

  const updateSecaoTitulo = (idx: number, titulo: string) => {
    const novas = [...secoes];
    novas[idx].titulo = titulo;
    setSecoes(novas);
  };

  const addItem = (secaoIdx: number) => {
    const novas = [...secoes];
    novas[secaoIdx].itens.push({
      texto_pergunta: '',
      tipo_resposta: 'CONFORME_NAOCONFORME',
      obrigatorio: true,
      requer_foto: false
    });
    setSecoes(novas);
  };

  const removeItem = (secaoIdx: number, itemIdx: number) => {
    const novas = [...secoes];
    novas[secaoIdx].itens.splice(itemIdx, 1);
    setSecoes(novas);
  };

  const updateItem = (secaoIdx: number, itemIdx: number, field: keyof NovoItem, value: any) => {
    const novas = [...secoes];
    novas[secaoIdx].itens[itemIdx] = { ...novas[secaoIdx].itens[itemIdx], [field]: value };
    setSecoes(novas);
  };

  const salvarModelo = async () => {
    if (!nome) return alert('Dê um nome ao modelo.');
    if (!activeClientId) return alert('Selecione um cliente no topo.');

    setLoading(true);
    try {
      // 1. Criar Modelo
      const { data: modeloData, error: modError } = await supabase
        .from('checklist_modelos')
        .insert({
          cliente_id: activeClientId,
          nome,
          descricao,
          frequencia_sugerida: frequencia,
          ativo: true,
          versao: 1
        })
        .select()
        .single();

      if (modError) throw modError;
      const modeloId = modeloData.id;

      // 2. Loop Seções
      for (let i = 0; i < secoes.length; i++) {
        const secao = secoes[i];
        const { data: secaoData, error: secError } = await supabase
          .from('checklist_secoes')
          .insert({ modelo_id: modeloId, titulo: secao.titulo, ordem: i })
          .select()
          .single();

        if (secError) throw secError;
        const secaoId = secaoData.id;

        // 3. Loop Itens
        if (secao.itens.length > 0) {
          const itensParaInserir = secao.itens.map((item, itemIdx) => ({
            secao_id: secaoId,
            texto_pergunta: item.texto_pergunta,
            tipo_resposta: item.tipo_resposta,
            obrigatorio: item.obrigatorio,
            requer_foto: item.requer_foto,
            ordem: itemIdx
          }));

          const { error: itemError } = await supabase.from('checklist_itens').insert(itensParaInserir);
          if (itemError) throw itemError;
        }
      }

      router.push('/consultoria/modelos');
      
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper para ícone do tipo de resposta
  const getIconForType = (type: string) => {
      switch(type) {
          case 'CONFORME_NAOCONFORME': return <ListChecks size={16} />;
          case 'TEXTO': return <Type size={16} />;
          case 'NUMERO': return <Hash size={16} />;
          case 'TEMPERATURA': return <Thermometer size={16} />;
          case 'FOTO': return <ImageIcon size={16} />;
          default: return <ListChecks size={16} />;
      }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowLeft />} onClick={() => router.back()} color="inherit">Voltar</Button>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
                Construtor de Checklist
            </Typography>
        </Box>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<Save />} 
          onClick={salvarModelo}
          disabled={loading}
          sx={{ px: 4 }}
        >
          {loading ? 'Salvando...' : 'Salvar Modelo'}
        </Button>
      </Box>

      {!activeClientId && (
        <Alert severity="warning" sx={{ mb: 4 }}>
            Você precisa selecionar um cliente ativo para criar um modelo personalizado.
        </Alert>
      )}

      <Grid container spacing={4}>
        
        {/* LADO ESQUERDO: CONFIGURAÇÕES GERAIS */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={2} 
            sx={{ 
                p: 3, 
                position: { md: 'sticky' }, 
                top: 20, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListChecks size={20} /> Metadados do Checklist
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField 
                label="Nome do Checklist" 
                fullWidth 
                variant="outlined"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Auditoria Diária de Boas Práticas"
                helperText="Nome que aparecerá para o operador."
                required
              />
              
              <TextField 
                label="Descrição / Objetivo" 
                fullWidth 
                multiline 
                rows={3}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o objetivo desta auditoria..."
              />
              
              <TextField 
                select 
                label="Frequência Sugerida" 
                fullWidth
                value={frequencia}
                onChange={e => setFrequencia(e.target.value)}
              >
                <MenuItem value="DIARIO">Diário (Todo dia)</MenuItem>
                <MenuItem value="SEMANAL">Semanal</MenuItem>
                <MenuItem value="MENSAL">Mensal</MenuItem>
                <MenuItem value="SOB_DEMANDA">Sob Demanda (Esporádico)</MenuItem>
              </TextField>

              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  <strong>Dica:</strong> Divida o checklist em seções lógicas (Ex: Recebimento, Armazenamento, Higiene) para facilitar a aplicação.
              </Alert>
            </Box>
          </Paper>
        </Grid>

        {/* LADO DIREITO: CONSTRUTOR VISUAL */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {secoes.map((secao, sIdx) => (
              <Paper 
                key={sIdx} 
                elevation={1}
                sx={{ 
                    p: 0, 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    overflow: 'hidden'
                }}
              >
                {/* Cabeçalho da Seção */}
                <Box sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05), 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                }}>
                  <Tooltip title="Arraste para reordenar (Em breve)">
                    <GripVertical className="text-gray-400 cursor-grab" size={20} />
                  </Tooltip>
                  
                  <TextField 
                    value={secao.titulo}
                    onChange={e => updateSecaoTitulo(sIdx, e.target.value)}
                    variant="standard"
                    placeholder="Título da Seção (ex: Higiene Pessoal)"
                    fullWidth
                    InputProps={{ disableUnderline: true, style: { fontSize: '1.1rem', fontWeight: 700, color: theme.palette.primary.main } }}
                  />
                  
                  <Tooltip title="Excluir Seção Inteira">
                    <IconButton color="error" onClick={() => removeSecao(sIdx)} size="small">
                        <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Lista de Itens */}
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {secao.itens.map((item, iIdx) => (
                    <Paper 
                        key={iIdx} 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            display: 'flex', 
                            gap: 2, 
                            alignItems: 'start', 
                            bgcolor: 'background.paper',
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: 1 }
                        }}
                    >
                      <Typography variant="caption" sx={{ mt: 1.5, color: 'text.secondary', fontWeight: 'bold', minWidth: 20 }}>
                        {iIdx + 1}.
                      </Typography>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        {/* Linha 1: Pergunta */}
                        <TextField 
                          fullWidth 
                          size="small" 
                          placeholder="Digite a pergunta ou critério de avaliação..." 
                          value={item.texto_pergunta}
                          onChange={e => updateItem(sIdx, iIdx, 'texto_pergunta', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        
                        {/* Linha 2: Configurações */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <TextField 
                            select 
                            size="small" 
                            value={item.tipo_resposta}
                            onChange={e => updateItem(sIdx, iIdx, 'tipo_resposta', e.target.value)}
                            sx={{ minWidth: 180 }}
                            InputProps={{
                                startAdornment: <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>{getIconForType(item.tipo_resposta)}</Box>
                            }}
                          >
                            <MenuItem value="CONFORME_NAOCONFORME">Conforme / Não C.</MenuItem>
                            <MenuItem value="TEXTO">Texto Livre</MenuItem>
                            <MenuItem value="NUMERO">Número</MenuItem>
                            <MenuItem value="TEMPERATURA">Temperatura (°C)</MenuItem>
                            <MenuItem value="FOTO">Apenas Foto</MenuItem>
                          </TextField>

                          <Divider orientation="vertical" flexItem />

                          <FormControlLabel 
                            control={
                              <Switch 
                                size="small" 
                                checked={item.requer_foto} 
                                onChange={e => updateItem(sIdx, iIdx, 'requer_foto', e.target.checked)}
                              />
                            } 
                            label={
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', color: item.requer_foto ? 'primary.main' : 'text.secondary' }}>
                                    <ImageIcon size={16}/> 
                                    <Typography variant="caption" fontWeight="bold">Exigir Foto</Typography>
                                </Box>
                            } 
                          />
                          
                          <FormControlLabel 
                            control={
                              <Switch 
                                size="small" 
                                color="warning"
                                checked={item.obrigatorio} 
                                onChange={e => updateItem(sIdx, iIdx, 'obrigatorio', e.target.checked)}
                              />
                            } 
                            label={<Typography variant="caption" fontWeight="bold" color={item.obrigatorio ? 'warning.dark' : 'text.secondary'}>Obrigatório</Typography>} 
                          />
                        </Box>
                      </Box>

                      <IconButton size="small" color="default" onClick={() => removeItem(sIdx, iIdx)} sx={{ mt: 1 }}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Paper>
                  ))}

                  {secao.itens.length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2, fontStyle: 'italic' }}>
                          Esta seção ainda não tem perguntas.
                      </Typography>
                  )}

                  {/* AQUI ESTAVA O ERRO: variant="soft" alterado para variant="outlined" */}
                  <Button 
                    startIcon={<Plus size={16} />} 
                    variant="outlined" 
                    fullWidth
                    sx={{ mt: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                    onClick={() => addItem(sIdx)}
                  >
                    Adicionar Pergunta à Seção
                  </Button>
                </Box>
              </Paper>
            ))}

            <Button 
              variant="outlined" 
              startIcon={<Plus size={20} />} 
              fullWidth 
              size="large"
              sx={{ borderStyle: 'dashed', borderWidth: 2, py: 2, color: 'text.secondary' }}
              onClick={addSecao}
            >
              Adicionar Nova Seção
            </Button>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}