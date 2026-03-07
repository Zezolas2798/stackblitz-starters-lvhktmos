'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Container, Typography, Box, Button,
  List, ListItem, ListItemText, CircularProgress, Alert, IconButton,
  TextField, InputAdornment, Chip, Accordion, AccordionSummary, AccordionDetails,
  Paper, useTheme, alpha, ListItemButton
} from '@mui/material';
import Link from 'next/link';
import {
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChefHat,
  BookOpen,
  Plus,
  Eye // Ícone para visualizar
} from 'lucide-react';

import { useClient } from '@/lib/ClientContext';

interface ReceitaLista {
  id: string;
  nome: string;
  tipos_receita?: { nome: string } | null;
}

export default function ListarReceitasPage() {
  const theme = useTheme();
  const [receitas, setReceitas] = useState<ReceitaLista[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { activeClientId } = useClient();

  async function fetchReceitas(clienteId: string) {
    setLoading(true);
    setError(null);
    setReceitas([]);

    const { data, error } = await supabase
      .from('receitas')
      .select('id, nome, tipos_receita(nome)')
      .eq('cliente_id', clienteId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar receitas:', error);
      setError('Falha ao buscar as receitas.');
    } else {
      setReceitas(data as unknown as ReceitaLista[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (activeClientId) {
      fetchReceitas(activeClientId);
    } else {
      setReceitas([]);
      setError(null);
      setLoading(false);
    }
  }, [activeClientId]);

  async function handleDelete(id: string, nome: string) {
    if (window.confirm(`Tem certeza que deseja inativar a receita "${nome}"?`)) {
      setLoading(true);
      try {
        // Pega Token Seguro da sessão Supabase para passar à API RLS
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/receitas', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ id })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.erro || errData.dbDetalhes || 'Falha na exclusão.');
        }

        if (activeClientId) fetchReceitas(activeClientId);

      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  const receitasAgrupadas = useMemo(() => {
    const filtradas = receitas.filter(r =>
      r.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grupos: Record<string, ReceitaLista[]> = {};

    filtradas.forEach(receita => {
      const catNome = receita.tipos_receita?.nome || 'Sem Categoria';
      if (!grupos[catNome]) grupos[catNome] = [];
      grupos[catNome].push(receita);
    });

    return Object.keys(grupos).sort().reduce((obj, key) => {
      obj[key] = grupos[key];
      return obj;
    }, {} as Record<string, ReceitaLista[]>);

  }, [receitas, searchTerm]);

  const renderContent = () => {
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

    if (!activeClientId) {
      return <Alert severity="warning" sx={{ mt: 2 }}>Por favor, selecione uma unidade no menu lateral.</Alert>;
    }

    if (receitas.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: '1px dashed', borderColor: 'primary.main' }}>
          <ChefHat size={48} className="text-gray-400 mx-auto mb-2" />
          <Typography variant="h6" color="text.secondary">Nenhuma receita cadastrada.</Typography>
          <Link href="/receitas/criar" passHref>
            <Button variant="contained" startIcon={<Plus size={18} />} sx={{ mt: 2 }}>Criar Primeira Receita</Button>
          </Link>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(receitasAgrupadas).map(([categoria, itens]) => (
          <Accordion key={categoria} defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <BookOpen size={18} color={theme.palette.text.secondary} />
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{categoria}</Typography>
                <Chip label={itens.length} size="small" sx={{ height: 20, fontSize: '0.7rem', ml: 'auto', mr: 1, fontWeight: 600 }} />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {itens.map((receita, index) => (
                  <ListItem
                    key={receita.id}
                    divider={index < itens.length - 1}
                    disablePadding
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Link href={`/receitas/criar?id=${receita.id}`} passHref>
                          <IconButton edge="end" size="small" sx={{ color: 'primary.main' }}><Edit size={16} /></IconButton>
                        </Link>
                        <IconButton edge="end" onClick={() => handleDelete(receita.id, receita.nome)} size="small" sx={{ color: 'error.main' }}><Trash2 size={16} /></IconButton>
                      </Box>
                    }
                  >
                    {/* AQUI ESTÁ A CORREÇÃO: Link para /receitas/[id] */}
                    <ListItemButton
                      component={Link}
                      href={`/receitas/${receita.id}`}
                      sx={{ pl: 3, pr: 10, py: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChefHat size={16} className="text-gray-400" />
                            {receita.nome}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">Minhas Receitas</Typography>
        <Link href="/receitas/criar" passHref>
          <Button variant="contained" size="large" disabled={!activeClientId} startIcon={<Plus size={20} />}>Nova Receita</Button>
        </Link>
      </Box>
      <Paper elevation={0} sx={{ p: 2, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Buscar receita..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="gray" /></InputAdornment> }}
        />
      </Paper>
      {renderContent()}
    </Container>
  );
}