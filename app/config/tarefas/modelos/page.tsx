'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, 
  alpha, useTheme, Stack, CircularProgress 
} from '@mui/material';
import { Plus, Settings2, Trash2, Edit3, ClipboardList, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import Link from 'next/link';

export default function ModelosTarefasPage() {
  const theme = useTheme();
  const { activeClientId } = useClient();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeClientId) fetchModelos();
  }, [activeClientId]);

  async function fetchModelos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('config_modelos_demandas')
      .select('*, config_modelo_subtarefas(count)')
      .eq('cliente_id', activeClientId)
      .order('created_at', { ascending: false });

    if (!error && data) setModelos(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Deseja excluir este modelo de conformidade?')) {
      await supabase.from('config_modelos_demandas').delete().eq('id', id);
      fetchModelos();
    }
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'primary.main', letterSpacing: '-0.02em' }}>
            Modelos de Demandas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure padrões operacionais e POPs reutilizáveis para a unidade.
          </Typography>
        </Box>
        <Link href="/config/tarefas/modelos/novo" passHref style={{ textDecoration: 'none' }}>
          <Button variant="contained" startIcon={<Plus size={18} />}>
            Novo Modelo
          </Button>
        </Link>
      </Box>

      <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 8, textAlign: 'center' }}><CircularProgress /></Box>
        ) : modelos.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Settings2 size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary">Nenhum modelo configurado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crie modelos para agilizar o lançamento de tarefas recorrentes e garantir o Compliance.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>TÍTULO DO PADRÃO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>TIPO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>CHECKLIST</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>GxP</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelos.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{m.titulo_padrao}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                        {m.descricao_padrao || 'Sem descrição'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={m.tipo_padrao} size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ClipboardList size={14} color={theme.palette.text.secondary} />
                        <Typography variant="body2">{m.config_modelo_subtarefas[0]?.count || 0} itens</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {m.requer_evidencia_foto && (
                        <Chip 
                          icon={<Camera size={14} />} 
                          label="Foto Obrigatória" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" sx={{ mr: 1 }}><Edit3 size={18} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}