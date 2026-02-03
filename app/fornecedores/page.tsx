'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Container,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Grid, Tooltip
} from '@mui/material';
import { 
  Plus, Edit, Trash2, Truck, AlertTriangle, CheckCircle, XCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Fornecedor, StatusHomologacao } from '@/lib/types';

export default function FornecedoresPage() {
  const router = useRouter();
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  
  // Estado do Modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Campos do Formulário
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    licenca_sanitaria_numero: '',
    licenca_sanitaria_validade: '',
    status_homologacao: 'PENDENTE' as StatusHomologacao,
    contato_qualidade_nome: '',
    contato_qualidade_email: ''
  });
  
  // --- FUNÇÃO AUXILIAR DE MÁSCARA ---
  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto entre o segundo e o terceiro dígitos
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto entre o quinto e o sexto dígitos
      .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca uma barra entre o oitavo e o nono dígitos
      .replace(/(\d{4})(\d)/, '$1-$2') // Coloca um hífen depois do bloco de quatro dígitos
      .substring(0, 18); // Limita ao tamanho máximo do CNPJ formatado
  };

  useEffect(() => {
    if (activeClientId) fetchFornecedores();
  }, [activeClientId]);

  async function fetchFornecedores() {
    setLoading(true);
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('cliente_id', activeClientId)
      .order('razao_social');
    
    if (data) setFornecedores(data as Fornecedor[]);
    setLoading(false);
  }

  const handleOpen = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingId(fornecedor.id);
      setFormData({
        razao_social: fornecedor.razao_social,
        nome_fantasia: fornecedor.nome_fantasia || '',
        cnpj: fornecedor.cnpj,
        licenca_sanitaria_numero: fornecedor.licenca_sanitaria_numero || '',
        licenca_sanitaria_validade: fornecedor.licenca_sanitaria_validade || '',
        status_homologacao: fornecedor.status_homologacao,
        contato_qualidade_nome: fornecedor.contato_qualidade_nome || '',
        contato_qualidade_email: fornecedor.contato_qualidade_email || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        razao_social: '', nome_fantasia: '', cnpj: '', 
        licenca_sanitaria_numero: '', licenca_sanitaria_validade: '',
        status_homologacao: 'PENDENTE', contato_qualidade_nome: '', contato_qualidade_email: ''
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.razao_social || !formData.cnpj) {
      alert("Razão Social e CNPJ são obrigatórios.");
      return;
    }

    try {
      // Converte string vazia para NULL nas datas
const payload = { 
  ...formData, 
  cliente_id: activeClientId,
  licenca_sanitaria_validade: formData.licenca_sanitaria_validade || null 
};

      if (editingId) {
        await supabase.from('fornecedores').update(payload).eq('id', editingId);
      } else {
        await supabase.from('fornecedores').insert(payload);
      }

      setOpen(false);
      fetchFornecedores();
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este fornecedor?")) return;
    await supabase.from('fornecedores').delete().eq('id', id);
    fetchFornecedores();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APROVADO': return 'success';
      case 'PENDENTE': return 'warning';
      case 'REJEITADO': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Truck size={32} /> Gestão de Fornecedores
        </Typography>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpen()}>
          Novo Fornecedor
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Razão Social / Fantasia</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Licença Sanitária</TableCell>
                <TableCell>Status Qualidade</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fornecedores.length === 0 && (
                 <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Nenhum fornecedor cadastrado.</TableCell></TableRow>
              )}
              {fornecedores.map((forn) => (
                <TableRow key={forn.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold">{forn.razao_social}</Typography>
                    <Typography variant="caption" color="text.secondary">{forn.nome_fantasia}</Typography>
                  </TableCell>
                  <TableCell>{forn.cnpj}</TableCell>
                  <TableCell>
                    {forn.licenca_sanitaria_numero ? (
                       <Box>
                         <Typography variant="body2">{forn.licenca_sanitaria_numero}</Typography>
                         <Typography variant="caption" color={new Date(forn.licenca_sanitaria_validade!) < new Date() ? 'error.main' : 'text.secondary'}>
                           Val: {new Date(forn.licenca_sanitaria_validade!).toLocaleDateString()}
                         </Typography>
                       </Box>
                    ) : (
                      <Typography variant="caption" color="error">Não informado</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={forn.status_homologacao} 
                      color={getStatusColor(forn.status_homologacao) as any} 
                      size="small" 
                      icon={forn.status_homologacao === 'APROVADO' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(forn)}><Edit size={18} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(forn.id)}><Trash2 size={18} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DIALOG DE CADASTRO */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField label="Razão Social *" fullWidth value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="CNPJ *" fullWidth value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})} inputProps={{ maxLength: 18 }} // Impede digitar mais que o necessário
  placeholder="00.000.000/0000-00"/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Nome Fantasia" fullWidth value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
               <TextField 
                  select 
                  label="Status de Homologação (Qualidade)" 
                  fullWidth 
                  value={formData.status_homologacao} 
                  onChange={e => setFormData({...formData, status_homologacao: e.target.value as any})}
                  helperText="Apenas fornecedores APROVADOS deveriam fornecer insumos críticos."
               >
                 <MenuItem value="PENDENTE">🟡 Pendente (Em análise)</MenuItem>
                 <MenuItem value="APROVADO">🟢 Aprovado (Documentação OK)</MenuItem>
                 <MenuItem value="REJEITADO">🔴 Rejeitado (Não conforme)</MenuItem>
                 <MenuItem value="SUSPENSO">⛔ Suspenso (Problemas recorrentes)</MenuItem>
               </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>Licenciamento Sanitário (Portaria 2619/11)</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Nº Licença Sanitária / CMVS" fullWidth value={formData.licenca_sanitaria_numero} onChange={e => setFormData({...formData, licenca_sanitaria_numero: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField type="date" label="Validade da Licença" fullWidth InputLabelProps={{ shrink: true }} value={formData.licenca_sanitaria_validade} onChange={e => setFormData({...formData, licenca_sanitaria_validade: e.target.value})} />
            </Grid>

            <Grid item xs={12}>
               <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Contato da Qualidade</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Nome do Contato" fullWidth value={formData.contato_qualidade_nome} onChange={e => setFormData({...formData, contato_qualidade_nome: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email" fullWidth value={formData.contato_qualidade_email} onChange={e => setFormData({...formData, contato_qualidade_email: e.target.value})} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}