'use client';

import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Snackbar,
  Checkbox, Chip, IconButton
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { TrendingUp, CheckCircle, Send, Plus, Trash2 } from 'lucide-react';

export default function PlanejamentoComprasPage() {
  const { activeClientId, unidadeId } = useClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  
  // Seleção de itens para a cesta de cotação
  const [selectedItens, setSelectedItens] = useState<Set<string>>(new Set());
  const [campanhasGeradas, setCampanhasGeradas] = useState<any[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, msg: string, type: 'success'|'error'}>({open: false, msg: '', type: 'success'});

  useEffect(() => {
    if (activeClientId && unidadeId) {
      loadData();
    }
  }, [activeClientId, unidadeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carrega ingredientes (Simulando uma visão de Necessidade de Estoque/Requisições)
      const { data: resIngredientes } = await supabase
        .from('ingredientes')
        .select('id, nome, subgrupo_id, grupo_id, unidade_medida')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null);
      
      const { data: resFornecedores } = await supabase
        .from('fornecedores')
        .select('id, razao_social, telefone, grupos_fornecidos, itens_fornecidos, categorias_compras')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null);

      setIngredientes(resIngredientes || []);
      setFornecedores(resFornecedores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedItens);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItens(newSet);
  };

  const handleGerarCampanhas = async () => {
    if (selectedItens.size === 0) {
      setSnackbar({ open: true, msg: 'Selecione pelo menos um item para cotar.', type: 'error' });
      return;
    }
    setSaving(true);
    
    try {
      // 1. Obter os itens selecionados completos
      const itensSelecionadosObj = ingredientes.filter(i => selectedItens.has(i.id)).map(i => ({
        id: i.id,
        nome: i.nome,
        unidade: i.unidade_medida || 'Kg',
        quantidade_prevista: 10 // Simulação de qtd de ressuprimento
      }));

      // 2. Criar a Campanha Pai
      const { data: campanha, error: errCampanha } = await supabase
        .from('compras_campanhas')
        .insert({
          cliente_id: activeClientId,
          unidade_id: unidadeId,
          itens_cesta: itensSelecionadosObj,
          status: 'ENVIADA'
        })
        .select('id')
        .single();

      if (errCampanha) throw errCampanha;

      // 3. Segmentar por fornecedor
      const fornecedoresCampanha = [];
      
      for (const forn of fornecedores) {
        // Lógica simplificada de match: Se o fornecedor atende algum grupo ou item específico.
        // Em produção, aplicaria o mesmo filtro do quadro comparativo.
        // Aqui assumimos que ele recebe os itens que tem match ou todos se for geral.
        
        const isGeral = !forn.grupos_fornecidos?.length && !forn.itens_fornecidos?.length;
        
        const itensParaOFornecedor = itensSelecionadosObj.filter(item => {
          if (isGeral) return true;
          const matchItem = forn.itens_fornecidos?.includes(item.id);
          const ingredienteOriginal = ingredientes.find(i => i.id === item.id);
          const matchGrupo = ingredienteOriginal?.grupo_id && forn.grupos_fornecidos?.includes(ingredienteOriginal.grupo_id);
          const matchSubgrupo = ingredienteOriginal?.subgrupo_id && forn.grupos_fornecidos?.includes(ingredienteOriginal.subgrupo_id);
          
          return matchItem || matchGrupo || matchSubgrupo;
        });

        if (itensParaOFornecedor.length > 0) {
          fornecedoresCampanha.push({
            campanha_id: campanha.id,
            fornecedor_id: forn.id,
            itens_solicitados: itensParaOFornecedor,
            status: 'AGUARDANDO'
            // O token_acesso é gerado no banco de dados automaticamente pelo DEFAULT gen_random_uuid()
          });
        }
      }

      if (fornecedoresCampanha.length === 0) {
         setSnackbar({ open: true, msg: 'Nenhum fornecedor compatível com os itens.', type: 'error' });
         setSaving(false);
         return;
      }

      // 4. Inserir Campanhas Filhas e retornar os tokens gerados
      const { data: criadas, error: errFornecedores } = await supabase
        .from('compras_campanha_fornecedor')
        .insert(fornecedoresCampanha)
        .select('id, token_acesso, status, fornecedor:fornecedores(razao_social, telefone)');

      if (errFornecedores) throw errFornecedores;

      setCampanhasGeradas(criadas || []);
      setDialogOpen(true);
      setSnackbar({ open: true, msg: 'Campanhas geradas com sucesso!', type: 'success' });
      setSelectedItens(new Set()); // Limpa seleção

    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, msg: 'Erro ao gerar campanhas.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = (telefone: string, token: string) => {
    if (!telefone) {
      alert('Fornecedor sem telefone cadastrado.');
      return;
    }
    // Remove caracteres especiais
    const foneLimpo = telefone.replace(/\D/g, '');
    const urlPortal = `${window.location.origin}/portal-fornecedor/${token}`;
    const texto = `Olá! Temos uma nova solicitação de cotação para você. Por favor, acesse o nosso portal e informe seus preços: ${urlPortal}`;
    
    window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrendingUp size={32} /> Planejamento de Cotações (Portal)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione os itens com necessidade de ressuprimento e dispare links automáticos para os fornecedores.
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<Send />} 
            onClick={handleGerarCampanhas}
            disabled={selectedItens.size === 0 || saving}
          >
            {saving ? 'Gerando Links...' : `Gerar Campanhas (${selectedItens.size} itens)`}
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={selectedItens.size === ingredientes.length && ingredientes.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedItens(new Set(ingredientes.map(i => i.id)));
                      else setSelectedItens(new Set());
                    }}
                  />
                </TableCell>
                <TableCell>Insumo / Ingrediente</TableCell>
                <TableCell>Unidade</TableCell>
                <TableCell>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredientes.map((item) => (
                <TableRow key={item.id} hover selected={selectedItens.has(item.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedItens.has(item.id)} onChange={() => handleToggleSelect(item.id)} />
                  </TableCell>
                  <TableCell><Typography fontWeight="bold">{item.nome}</Typography></TableCell>
                  <TableCell><Chip size="small" label={item.unidade_medida || 'Kg'} variant="outlined" /></TableCell>
                  <TableCell>
                    {!selectedItens.has(item.id) ? (
                      <Button size="small" startIcon={<Plus size={14}/>} onClick={() => handleToggleSelect(item.id)}>Incluir</Button>
                    ) : (
                      <Button size="small" color="error" startIcon={<Trash2 size={14}/>} onClick={() => handleToggleSelect(item.id)}>Remover</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {ingredientes.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>Nenhum ingrediente disponível.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal de Sucesso com os Links */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Cotações Geradas!</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Foram gerados links de cotação segmentados para os fornecedores compatíveis com os itens selecionados. 
            Você pode disparar as mensagens no WhatsApp agora mesmo.
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campanhasGeradas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{c.fornecedor?.razao_social}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.fornecedor?.telefone || 'Sem telefone'}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" label="Aguardando" color="warning" /></TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success" 
                        startIcon={<Send size={14}/>}
                        onClick={() => openWhatsApp(c.fornecedor?.telefone, c.token_acesso)}
                        disabled={!c.fornecedor?.telefone}
                      >
                        Enviar WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Fechar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.type} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
