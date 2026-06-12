'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save, X, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import CamposEspecificosMaterial from './CamposEspecificosMaterial';
import {
  TIPO_MATERIAL_MAP, MODALIDADE_LABELS,
  getDefaultsForModalidade, validateEspecificacoes
} from '@/lib/schemas/materiais-modalidade';

interface QuickMaterialDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (novoItem: any) => void;
  nomeSugerido?: string;
  categoriaPrincipal: 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS' | 'OUTROS';
}

export default function QuickMaterialDialog({ 
  open, 
  onClose, 
  onSuccess, 
  nomeSugerido,
  categoriaPrincipal
}: QuickMaterialDialogProps) {
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(false);

  // Estado do Formulário — campos comuns
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');

  // Estado das especificações por modalidade
  const tipoMaterial = TIPO_MATERIAL_MAP[categoriaPrincipal] || 'OUTROS';
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setNome(nomeSugerido || '');
      setMarca('');
      setSpecs(getDefaultsForModalidade(tipoMaterial));
      setValidationErrors({});
    }
  }, [open, nomeSugerido, tipoMaterial]);

  const handleSpecChange = (field: string, value: any) => {
    setSpecs(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSalvar = async () => {
    if (!activeClientId || !nome) return alert('Nome é obrigatório.');

    // Validar especificações com Zod
    // Limpar strings vazias e converter para tipos corretos antes de validar
    const cleanedSpecs = Object.fromEntries(
      Object.entries(specs).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );

    const validation = validateEspecificacoes(tipoMaterial, cleanedSpecs);
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors!.forEach(err => {
        errorMap[err.path] = err.message;
      });
      setValidationErrors(errorMap);
      return;
    }

    setLoading(true);
    try {
      const { data: material, error: errMat } = await (supabase as any).from('materiais').insert({
        cliente_id: activeClientId,
        nome,
        marca,
        tipo_material: tipoMaterial,
        especificacoes_adicionais: validation.data,
        ativo: true,
        unidade_medida: 'UNID'
      }).select().single();

      if (errMat) throw errMat;

      onSuccess(material);
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const label = MODALIDADE_LABELS[tipoMaterial] || categoriaPrincipal;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tag className="text-blue-600" />
          <Typography variant="h6" fontWeight="bold">
            Cadastro de {label}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><X /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Campos comuns */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={8}>
            <TextField label="Nome do Material *" fullWidth value={nome} onChange={e => setNome(e.target.value)} placeholder={`Ex: ${tipoMaterial === 'LIMPEZA' ? 'Detergente Neutro' : tipoMaterial === 'EPI_EPC' ? 'Luva Nitrílica' : 'Nome do item'}`} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Marca" fullWidth value={marca} onChange={e => setMarca(e.target.value)} />
          </Grid>
        </Grid>

        {/* Campos específicos por modalidade */}
        <CamposEspecificosMaterial
          tipoMaterial={tipoMaterial}
          specs={specs}
          onChange={handleSpecChange}
          errors={validationErrors}
        />

        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Preencha os campos obrigatórios marcados com * antes de salvar.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleSalvar} disabled={loading} startIcon={<Save />}>Salvar e Usar</Button>
      </DialogActions>
    </Dialog>
  );
}
