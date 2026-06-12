'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowBack, Save } from '@mui/icons-material';

const UNIDADES_MEDIDA = ['un', 'pct', 'rl', 'kg', 'lt', 'cx'];

export default function NovoMaterialPage() {
  const router = useRouter();
  const { unidadeSelecionada } = useClient();
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);
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
    especificacoes_adicionais: getDefaultsForModalidade('EMBALAGEM') as Record<string, any>
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
    // Limpar erro do campo ao editar
    if (specsErrors[field]) {
      setSpecsErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchCategorias = useCallback(async (type: TipoMaterial) => {
    if (!unidadeSelecionada?.cliente_id) {
      setCategorias([]);
      return;
    }
    if (!type) {
      setCategorias([]);
      return;
    }

    // Mapping from TipoMaterial to modalidade in grupos_produto
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

    const targetModality = modalityMapping[type] || type;

    try {
      const { data, error } = await supabase
        .from('grupos_produto')
        .select('id, nome, modalidade')
        .eq('cliente_id', unidadeSelecionada.cliente_id)
        .eq('modalidade', targetModality as any)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        setCategorias([]);
      } else {
        setCategorias(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setCategorias([]);
    }
  }, [unidadeSelecionada?.cliente_id]);

  useEffect(() => {
    fetchCategorias(formData.tipo_material);
  }, [fetchCategorias, formData.tipo_material]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadeSelecionada?.cliente_id) return;
    setErrorObj(null);
    setSpecsErrors({});
    setLoading(true);

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
      setErrorObj(`Preencha os campos obrigatórios das especificações de ${MODALIDADE_LABELS[formData.tipo_material] || formData.tipo_material}.`);
      setLoading(false);
      return;
    }

    try {
      // ── Sincronizar colunas legadas a partir das especificações Zod ──
      const specs = formData.especificacoes_adicionais;
      const { error } = await (supabase as any).from('materiais').insert([
        {
          cliente_id: unidadeSelecionada.cliente_id,
          nome: formData.nome,
          tipo_material: formData.tipo_material,
          unidade_medida: formData.unidade_medida,
          custo_medio: Number(formData.custo_medio),
          preco_ultima_compra: Number(formData.custo_medio),
          grupo_id: formData.grupo_id || null,
          descricao_tecnica: formData.descricao_tecnica,
          // Sincronização de colunas planas com dados das especificações
          material_base: specs.material_base || formData.material_base || null,
          dimensoes: specs.dimensoes || formData.dimensoes || null,
          capacidade: specs.capacidade || formData.capacidade || null,
          peso_unitario_g: Number(formData.peso_unitario_g) || null,
          cor: specs.cor || formData.cor || null,
          sustentavel: specs.sustentavel ?? formData.sustentavel ?? false,
          apropriado_alimentos: specs.apropriado_alimentos ?? formData.apropriado_alimentos ?? false,
          especificacoes_adicionais: validationResult.data
        }
      ]);

      if (error) throw error;
      
      router.push('/materiais');
    } catch (err: any) {
      console.error('Erro ao salvar material:', err);
      setErrorObj(err.message || 'Erro inesperado ao salvar');
      setLoading(false);
    }
  };

  if (!unidadeSelecionada) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" variant="outlined">
          Por favor, selecione uma unidade no menu lateral.
        </Alert>
      </Container>
    );
  }

  // Filtragem das subcategorias conforme a modalidade
  // No final fetch already filtered, but we can double check or just use categorias
  const filteredCategorias = categorias;

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/materiais" passHref>
          <Button startIcon={<ArrowBack />} color="inherit">
            Voltar
          </Button>
        </Link>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Novo Material / Embalagem
        </Typography>
      </Box>

      {errorObj && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorObj}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Nome do Material"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Pote Plástico 500ml"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Tipo de Material (Modalidade)"
                name="tipo_material"
                value={formData.tipo_material}
                onChange={(e) => {
                    const newType = e.target.value as TipoMaterial;
                    setFormData(prev => ({
                      ...prev,
                      tipo_material: newType,
                      grupo_id: '',
                      especificacoes_adicionais: getDefaultsForModalidade(newType)
                    }));
                    setSpecsErrors({});
                }}
              >
                <MenuItem value="EMBALAGEM">Embalagem</MenuItem>
                <MenuItem value="UTENSILIO">Utensílio</MenuItem>
                <MenuItem value="LIMPEZA">Limpeza</MenuItem>
                <MenuItem value="MANUTENCAO">Manutenção</MenuItem>
                <MenuItem value="EPI_EPC">EPIs/EPCs</MenuItem>
                <MenuItem value="UNIFORME">Uniformes</MenuItem>
                <MenuItem value="PRIMEIROS_SOCORROS">Primeiros Socorros</MenuItem>
                <MenuItem value="OUTROS">Outros</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Subcategoria"
                name="grupo_id"
                value={formData.grupo_id}
                onChange={handleChange}
                helperText={filteredCategorias.length === 0 ? "Nenhuma subcategoria cadastrada para esta modalidade" : "Opcional"}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {filteredCategorias.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Unidade de Medida"
                name="unidade_medida"
                value={formData.unidade_medida}
                onChange={handleChange}
                helperText="Como este produto é mensurado na hora do uso"
              >
                {UNIDADES_MEDIDA.map(un => (
                  <MenuItem key={un} value={un}>{un.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Custo Unitário Base (R$)"
                name="custo_medio"
                value={formData.custo_medio}
                onChange={handleChange}
                inputProps={{ step: "0.01", min: "0" }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>
                }}
                helperText="Custo de 1 unidade (ex: 1 pote)"
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  size="large"
                >
                  Salvar Material
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
