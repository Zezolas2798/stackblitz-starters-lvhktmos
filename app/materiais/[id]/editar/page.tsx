'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/lib/ClientContext';
import { supabase } from '@/lib/supabaseClient';
import { TipoMaterial } from '@/lib/types';
import CamposEspecificosMaterial from '@/components/CamposEspecificosMaterial';
import {
  getDefaultsForModalidade,
  validateEspecificacoes,
  MODALIDADE_LABELS,
} from '@/lib/schemas/materiais-modalidade';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Container,
  InputAdornment,
  FormControl,
  InputLabel,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { ArrowBack, Save, Lock } from '@mui/icons-material';

const UNIDADES_MEDIDA = ['un', 'pct', 'rl', 'kg', 'lt', 'cx'];

export default function EditarMaterialPage() {
  const router = useRouter();
  const { id } = useParams();
  const { activeClientId } = useClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [specsErrors, setSpecsErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nome: '',
    tipo_material: 'EMBALAGEM' as TipoMaterial,
    unidade_medida: 'un',
    custo_medio: 0,
    grupo_id: '',
    descricao_tecnica: '',
    material_base: '',
    dimensoes: '',
    capacidade: '',
    peso_unitario_g: 0,
    cor: '',
    sustentavel: false,
    apropriado_alimentos: false,
    especificacoes_adicionais: {} as Record<string, any>
  });

  // Handler para campos dinâmicos de especificação por modalidade
  const handleSpecChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      especificacoes_adicionais: {
        ...prev.especificacoes_adicionais,
        [field]: value
      }
    }));
    if (specsErrors[field]) {
      setSpecsErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchCategorias = useCallback(async (type: TipoMaterial) => {
    if (!activeClientId) return;
    
    const modalityMapping: Record<string, string> = {
      'EMBALAGEM': 'EMBALAGENS',
      'LIMPEZA': 'LIMPEZA',
      'UTENSILIO': 'UTENSILIOS',
      'MANUTENCAO': 'MANUTENCAO',
      'EPI_EPC': 'EPI_EPC',
      'UNIFORME': 'UNIFORMES',
      'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
      'OUTROS': 'OUTROS'
    };

    const modalidade = modalityMapping[type] || type;
    
    const { data, error } = await supabase
      .from('grupos_produto')
      .select('id, nome')
      .eq('cliente_id', activeClientId)
      .eq('modalidade', modalidade as any)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
    } else {
      setCategorias(data || []);
    }
  }, [activeClientId]);

  useEffect(() => {
    async function loadData() {
      if (!activeClientId || !id) return;
      
      const materialId = Array.isArray(id) ? id[0] : id;
      setLoading(true);
      try {
        const { data: material, error: mError } = await supabase
          .from('materiais')
          .select('*')
          .eq('id', materialId)
          .single();

        if (mError) throw mError;
        if (material) {
          const m = material as any;
          const tipoMat = (m.tipo_material as TipoMaterial) || 'EMBALAGEM';
          // Mesclar defaults com dados existentes do JSONB para garantir que campos novos tenham valor inicial
          const existingSpecs = m.especificacoes_adicionais || {};
          const defaults = getDefaultsForModalidade(tipoMat);
          const mergedSpecs = { ...defaults, ...existingSpecs };

          setFormData({
            nome: m.nome || '',
            tipo_material: tipoMat,
            unidade_medida: m.unidade_medida || 'un',
            custo_medio: m.custo_medio || 0,
            grupo_id: m.grupo_id || '',
            descricao_tecnica: m.descricao_tecnica || '',
            material_base: m.material_base || '',
            dimensoes: m.dimensoes || '',
            capacidade: m.capacidade || '',
            peso_unitario_g: m.peso_unitario_g || 0,
            cor: m.cor || '',
            sustentavel: m.sustentavel || false,
            apropriado_alimentos: m.apropriado_alimentos || false,
            especificacoes_adicionais: mergedSpecs
          });
          await fetchCategorias(tipoMat);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeClientId, id, fetchCategorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  // tipo_material é REMOVIDO do handleTipoChange — campo bloqueado na edição

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientId || !id) return;

    setSaving(true);
    setError(null);
    setSpecsErrors({});

    // ── Validação Zod das especificações por modalidade ──
    const validationResult = validateEspecificacoes(
      formData.tipo_material,
      formData.especificacoes_adicionais
    );

    if (!validationResult.success) {
      const errMap: Record<string, string> = {};
      validationResult.errors?.forEach((err: { path: string; message: string }) => {
        errMap[err.path] = err.message;
      });
      setSpecsErrors(errMap);
      setError(`Preencha os campos obrigatórios das especificações de ${MODALIDADE_LABELS[formData.tipo_material] || formData.tipo_material}.`);
      setSaving(false);
      return;
    }

    try {
      const materialId = Array.isArray(id) ? id[0] : id;
      const specs = formData.especificacoes_adicionais;
      const { error: updateError } = await supabase
        .from('materiais')
        .update({
          nome: formData.nome,
          // tipo_material NÃO é atualizado (read-only na edição)
          unidade_medida: formData.unidade_medida,
          custo_medio: Number(formData.custo_medio),
          grupo_id: formData.grupo_id || null,
          descricao_tecnica: formData.descricao_tecnica,
          // Sincronização de colunas planas
          material_base: specs.material_base || formData.material_base || null,
          dimensoes: specs.dimensoes || formData.dimensoes || null,
          capacidade: specs.capacidade || formData.capacidade || null,
          peso_unitario_g: Number(formData.peso_unitario_g) || null,
          cor: specs.cor || formData.cor || null,
          sustentavel: specs.sustentavel ?? formData.sustentavel ?? false,
          apropriado_alimentos: specs.apropriado_alimentos ?? formData.apropriado_alimentos ?? false,
          especificacoes_adicionais: validationResult.data as any
        })
        .eq('id', materialId);

      if (updateError) throw updateError;
      router.push('/materiais');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/materiais" passHref>
          <Button variant="outlined" startIcon={<ArrowBack />}>
            Voltar
          </Button>
        </Link>
        <Typography variant="h4" fontWeight="bold">
          Editar Material
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome do Material"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tipo de Material (Modalidade)"
                name="tipo_material"
                value={MODALIDADE_LABELS[formData.tipo_material] || formData.tipo_material}
                disabled
                InputProps={{
                  startAdornment: <Lock fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} />,
                }}
                helperText="A modalidade não pode ser alterada após o cadastro"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Categoria"
                name="grupo_id"
                value={formData.grupo_id}
                onChange={handleChange}
                disabled={categorias.length === 0}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Unidade"
                name="unidade_medida"
                value={formData.unidade_medida}
                onChange={handleChange}
                required
              >
                {UNIDADES_MEDIDA.map((un) => (
                  <MenuItem key={un} value={un}>
                    {un}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Custo Médio"
                name="custo_medio"
                value={formData.custo_medio}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>
                }}
                helperText="Custo de 1 unidade"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                Especificações Técnicas
              </Typography>
            </Grid>

            {/* ── Campos Dinâmicos por Modalidade (Validados por Zod) ── */}
            <Grid item xs={12}>
              <CamposEspecificosMaterial
                tipoMaterial={formData.tipo_material}
                specs={formData.especificacoes_adicionais}
                onChange={handleSpecChange}
                errors={specsErrors}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Informações Complementares (opcionais)
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição Técnica / Detalhada"
                name="descricao_tecnica"
                value={formData.descricao_tecnica}
                onChange={handleChange}
                placeholder="Descreva as características técnicas do item..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Material Base"
                name="material_base"
                value={formData.material_base}
                onChange={handleChange}
                placeholder="Ex: Polipropileno (PP), Papel Kraft, Vidro..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dimensões (LxAxP)"
                name="dimensoes"
                value={formData.dimensoes}
                onChange={handleChange}
                placeholder="Ex: 10x15x5 cm"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capacidade / Volume"
                name="capacidade"
                value={formData.capacidade}
                onChange={handleChange}
                placeholder="Ex: 500ml, 1.5kg"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Peso Unitário (g)"
                name="peso_unitario_g"
                value={formData.peso_unitario_g}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cor / Acabamento"
                name="cor"
                value={formData.cor}
                onChange={handleChange}
                placeholder="Ex: Transparente, Branco"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sustentavel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, sustentavel: e.target.checked }))}
                    color="success"
                  />
                }
                label="Item Sustentável / Reciclável"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.apropriado_alimentos}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, apropriado_alimentos: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Apropriado para Contato com Alimentos"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </form>
    </Container>
  );
}
