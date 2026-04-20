'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Tabs, Tab, InputAdornment, MenuItem,
  FormControlLabel, Checkbox, Autocomplete, Chip, Alert, IconButton, Typography,
  createFilterOptions, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Save, X, Activity, FileText, AlertTriangle, Leaf, Tag, Plus, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';

// Configuração do filtro para permitir a opção "Adicionar"
const filter = createFilterOptions<any>();

interface QuickIngredienteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (novoItem: any, categoriaSugerida?: string) => void;
  nomeSugerido?: string;
  categoriaPrincipal?: 'ALIMENTOS' | 'EMBALAGENS' | 'LIMPEZA' | 'MANUTENCAO' | 'UTENSILIOS' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS';
}

export default function QuickIngredienteDialog({ 
  open, 
  onClose, 
  onSuccess, 
  nomeSugerido,
  categoriaPrincipal = 'ALIMENTOS'
}: QuickIngredienteDialogProps) {
  const { activeClientId } = useClient();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Dados Mestres
  const [alergenicosMestre, setAlergenicosMestre] = useState<any[]>([]);
  const [categoriasMestre, setCategoriasMestre] = useState<any[]>([]);

  // Estado do Formulário
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [categoriaValue, setCategoriaValue] = useState<any>(null);
  const [listaIngredientes, setListaIngredientes] = useState('');

  // Controles
  const [alergenicosSelecionados, setAlergenicosSelecionados] = useState<any[]>([]);
  const [contemGluten, setContemGluten] = useState(false);
  const [contemLactose, setContemLactose] = useState(false);
  const [classificacaoNova, setClassificacaoNova] = useState<number | null>(null);

  // ESTADO NUTRICIONAL EXPANDIDO (IN 75 Completa)
  const [nutrientes, setNutrientes] = useState({
    // Obrigatórios
    energia_kcal: '', carboidrato_g: '', acucar_total_g: '', acucar_adicionado_g: '',
    proteina_g: '', lipideos_g: '', gordura_saturada_g: '', gordura_trans_g: '',
    fibra_alimentar_g: '', sodio_mg: '',

    // Frações de Gorduras & Colesterol
    gordura_mono_g: '', gordura_poli_g: '', colesterol_mg: '',

    // Frações de Carboidratos
    lactose_g: '', galactose_g: '', amido_g: '',
    poliois_totais_g: '', eritritol_g: '', xilitol_g: '', sorbitol_g: '',
    manitol_g: '', maltitol_g: '',

    // Vitaminas
    vitamina_a_mcg: '', vitamina_d_mcg: '', vitamina_e_mg: '', vitamina_k_mcg: '',
    vitamina_c_mg: '', vitamina_b1_mg: '', vitamina_b2_mg: '', vitamina_b3_mg: '',
    vitamina_b5_mg: '', vitamina_b6_mg: '', vitamina_b7_mcg: '', vitamina_b9_mcg: '',
    vitamina_b12_mcg: '',

    // Minerais
    calcio_mg: '', ferro_mg: '', zinco_mg: '', fosforo_mg: '', potassio_mg: '',
    magnesio_mg: '', manganes_mg: '', cobre_mcg: '', selenio_mcg: '',
    molibdenio_mcg: '', iodo_mcg: '', fluor_mg: '', cromo_mcg: '', cloreto_mg: ''
  });

  const loadDadosAuxiliares = useCallback(async () => {
    const { data: alergData } = await (supabase as any).from('anvisa_alergenicos').select('*').order('nome');
    if (alergData) setAlergenicosMestre(alergData);

    const { data: catData } = await (supabase as any).from('grupos_produto')
      .select('id, nome')
      .eq('cliente_id', activeClientId!)
      .order('nome');
    if (catData) setCategoriasMestre(catData);
  }, [activeClientId]);

  useEffect(() => {
    if (open && activeClientId) {
      setNome(nomeSugerido || '');
      loadDadosAuxiliares();
    }
  }, [open, nomeSugerido, activeClientId, loadDadosAuxiliares]);

  const handleChangeNutriente = (field: string, value: string) => {
    setNutrientes(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!activeClientId || !nome) return alert('Nome é obrigatório.');

    setLoading(true);
    try {
      if (categoriaPrincipal !== 'ALIMENTOS') {
        const tipoMaterialMap = {
          'EMBALAGENS': 'EMBALAGEM',
          'LIMPEZA': 'LIMPEZA',
          'MANUTENCAO': 'MANUTENCAO',
          'UTENSILIOS': 'UTENSILIO',
          'EPI_EPC': 'EPI_EPC',
          'UNIFORMES': 'UNIFORME',
          'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS',
          'OUTROS': 'OUTROS'
        };

        const { data: material, error: errMat } = await (supabase as any).from('materiais').insert({
          cliente_id: activeClientId,
          nome,
          marca,
          tipo_material: (tipoMaterialMap as any)[categoriaPrincipal] || 'OUTROS',
          ativo: true,
          unidade_medida: 'UNID' // Padrão para pré-cadastro de material
        }).select().single();

        if (errMat) throw errMat;

        onSuccess(material);
        resetForm();
        onClose();
        return;
      }

      // 1. Categoria (Apenas para Alimentos)
      let nomeCategoriaFinal = '';
      let categoriaParams: any = null;
      let idCategoriaFinal: string | null = null;

      if (categoriaValue) {
        if (typeof categoriaValue === 'object' && !categoriaValue.inputValue) {
          nomeCategoriaFinal = categoriaValue.nome;
          idCategoriaFinal = categoriaValue.id || null;
        }
        else if (typeof categoriaValue === 'object' && categoriaValue.inputValue) nomeCategoriaFinal = categoriaValue.inputValue;
        else if (typeof categoriaValue === 'string') nomeCategoriaFinal = categoriaValue;

        if (nomeCategoriaFinal) {
          const categoriaExistente = categoriasMestre.find(c => c.nome.toLowerCase() === nomeCategoriaFinal.toLowerCase());
          if (!categoriaExistente) {
            const { data: catNova, error } = await (supabase as any).from('grupos_produto').insert({ cliente_id: activeClientId, nome: nomeCategoriaFinal }).select('id').single();
            if (!error && catNova) idCategoriaFinal = catNova.id;
          } else {
            idCategoriaFinal = categoriaExistente.id;
          }
        }
      }

      // 2. Prepara Objeto de Inserção (Parse de strings vazias para null)
      const parseNum = (val: string) => val === '' ? null : Number(val);

      const payloadIngrediente = {
        cliente_id: activeClientId,
        nome,
        fonte: marca,
        tipo_ingrediente: 'COMPOSTO',
        declaracao_ingredientes_fornecedor: listaIngredientes,
        contem_gluten: contemGluten,
        grupo_id: idCategoriaFinal,
        classificacao_nova: classificacaoNova,
        // contem_lactose: contemLactose, // Campo calculado ou explícito dependendo do schema

        // Mapeamento Completo
        ...Object.keys(nutrientes).reduce((acc: any, key) => {
          acc[key] = parseNum((nutrientes as any)[key]);
          return acc;
        }, {})
      };

      const { data: ing, error: errIng } = await (supabase as any).from('ingredientes').insert(payloadIngrediente).select().single();

      if (errIng) throw errIng;

      // 3. Alergênicos
      if (alergenicosSelecionados.length > 0) {
        const links: any[] = alergenicosSelecionados.map(a => ({ ingrediente_id: ing.id, alergenico_id: a.id, contem: true, contem_derivado: false }));
        await (supabase as any).from('ingrediente_alergenicos').insert(links);
      }

      onSuccess(ing, nomeCategoriaFinal);
      resetForm();
      onClose();

    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome(''); setMarca(''); setCategoriaValue(null); setListaIngredientes('');
    setNutrientes({
      energia_kcal: '', carboidrato_g: '', acucar_total_g: '', acucar_adicionado_g: '',
      proteina_g: '', lipideos_g: '', gordura_saturada_g: '', gordura_trans_g: '',
      fibra_alimentar_g: '', sodio_mg: '',
      gordura_mono_g: '', gordura_poli_g: '', colesterol_mg: '',
      lactose_g: '', galactose_g: '', amido_g: '',
      poliois_totais_g: '', eritritol_g: '', xilitol_g: '', sorbitol_g: '', manitol_g: '', maltitol_g: '',
      vitamina_a_mcg: '', vitamina_d_mcg: '', vitamina_e_mg: '', vitamina_k_mcg: '',
      vitamina_c_mg: '', vitamina_b1_mg: '', vitamina_b2_mg: '', vitamina_b3_mg: '',
      vitamina_b5_mg: '', vitamina_b6_mg: '', vitamina_b7_mcg: '', vitamina_b9_mcg: '', vitamina_b12_mcg: '',
      calcio_mg: '', ferro_mg: '', zinco_mg: '', fosforo_mg: '', potassio_mg: '',
      magnesio_mg: '', manganes_mg: '', cobre_mcg: '', selenio_mcg: '',
      molibdenio_mcg: '', iodo_mcg: '', fluor_mg: '', cromo_mcg: '', cloreto_mg: ''
    });
    setAlergenicosSelecionados([]); setContemGluten(false); setContemLactose(false); setTabIndex(0);
    setClassificacaoNova(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tag className="text-blue-600" />
          <Typography variant="h6" fontWeight="bold">
            {categoriaPrincipal === 'ALIMENTOS' ? 'Cadastro Mestre de Ingrediente' : `Cadastro de ${categoriaPrincipal.charAt(0) + categoriaPrincipal.slice(1).toLowerCase()}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><X /></IconButton>
      </DialogTitle>

      {categoriaPrincipal === 'ALIMENTOS' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" indicatorColor="primary">
            <Tab icon={<Leaf size={18} />} label="Identificação" />
            <Tab icon={<Activity size={18} />} label="Nutricional (Completo)" />
            <Tab icon={<AlertTriangle size={18} />} label="Alergênicos" />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ pt: 3 }}>

        {/* ABA 1: Identificação */}
        {tabIndex === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField label="Nome do Produto *" fullWidth value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Biscoito Maria" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Marca / Fonte" fullWidth value={marca} onChange={e => setMarca(e.target.value)} />
            </Grid>

            {categoriaPrincipal === 'ALIMENTOS' && (
              <>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    value={categoriaValue}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') setCategoriaValue({ nome: newValue });
                      else if (newValue && newValue.inputValue) setCategoriaValue({ nome: newValue.inputValue, inputValue: newValue.inputValue });
                      else setCategoriaValue(newValue);
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      if (params.inputValue !== '' && !options.some((o) => params.inputValue.toLowerCase() === o.nome.toLowerCase())) {
                        filtered.push({ inputValue: params.inputValue, nome: `Adicionar "${params.inputValue}"` });
                      }
                      return filtered;
                    }}
                    selectOnFocus clearOnBlur handleHomeEndKeys freeSolo
                    options={categoriasMestre}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.inputValue || option.nome}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <li key={key} {...otherProps}>
                          {option.nome.startsWith('Adicionar "') ? (
                            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                              <Plus size={16} /> {option.nome}
                            </Box>
                          ) : option.nome}
                        </li>
                      );
                    }}
                    renderInput={(params) => <TextField {...params} label="Categoria" placeholder="Selecione ou crie..." />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Classificação NOVA"
                    fullWidth
                    value={classificacaoNova ?? ''}
                    onChange={e => setClassificacaoNova(e.target.value === '' ? null : Number(e.target.value))}
                    helperText="Grau de processamento (USP/Nupens)"
                  >
                    <MenuItem value=""><em>Não classificado</em></MenuItem>
                    <MenuItem value={1}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                        G1 — In Natura / Minimamente Processado
                      </Box>
                    </MenuItem>
                    <MenuItem value={2}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196F3' }} />
                        G2 — Ingrediente Culinário Processado
                      </Box>
                    </MenuItem>
                    <MenuItem value={3}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF9800' }} />
                        G3 — Alimento Processado
                      </Box>
                    </MenuItem>
                    <MenuItem value={4}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F44336' }} />
                        G4 — Ultraprocessado
                      </Box>
                    </MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Lista de Ingredientes (Rótulo)" multiline rows={6} fullWidth value={listaIngredientes} onChange={e => setListaIngredientes(e.target.value)} />
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* ABA 2: Nutricional Completo */}
        {tabIndex === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>Insira os valores por <b>100g</b> ou <b>100ml</b> (Conforme rótulo ou tabela TACO).</Alert>

            {/* 1. OBRIGATÓRIOS (RDC 429) */}
            <Typography variant="subtitle2" sx={{ mb: 2, mt: 1, fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid #eee', pb: 1 }}>
              DECLARAÇÃO OBRIGATÓRIA (RDC 429)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}><NutrientInput label="Valor Energético" value={nutrientes.energia_kcal} onChange={(v: string) => handleChangeNutriente('energia_kcal', v)} unit="kcal" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Carboidratos" value={nutrientes.carboidrato_g} onChange={(v: string) => handleChangeNutriente('carboidrato_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Açúcares Totais" value={nutrientes.acucar_total_g} onChange={(v: string) => handleChangeNutriente('acucar_total_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Aç. Adicionados" value={nutrientes.acucar_adicionado_g} onChange={(v: string) => handleChangeNutriente('acucar_adicionado_g', v)} unit="g" /></Grid>

              <Grid item xs={6} md={3}><NutrientInput label="Proteínas" value={nutrientes.proteina_g} onChange={(v: string) => handleChangeNutriente('proteina_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Gorduras Totais" value={nutrientes.lipideos_g} onChange={(v: string) => handleChangeNutriente('lipideos_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Gord. Saturadas" value={nutrientes.gordura_saturada_g} onChange={(v: string) => handleChangeNutriente('gordura_saturada_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={3}><NutrientInput label="Gord. Trans" value={nutrientes.gordura_trans_g} onChange={(v: string) => handleChangeNutriente('gordura_trans_g', v)} unit="g" /></Grid>

              <Grid item xs={6} md={6}><NutrientInput label="Fibra Alimentar" value={nutrientes.fibra_alimentar_g} onChange={(v: string) => handleChangeNutriente('fibra_alimentar_g', v)} unit="g" /></Grid>
              <Grid item xs={6} md={6}><NutrientInput label="Sódio" value={nutrientes.sodio_mg} onChange={(v: string) => handleChangeNutriente('sodio_mg', v)} unit="mg" /></Grid>
            </Grid>

            {/* 2. CARBOIDRATOS DETALHADOS (Lactose, Polióis, etc) */}
            <Accordion variant="outlined" sx={{ mt: 3 }}>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight="bold" color="text.secondary">Detalhamento de Carboidratos (Lactose, Polióis, Amido)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><NutrientInput label="Lactose" value={nutrientes.lactose_g} onChange={(v: string) => handleChangeNutriente('lactose_g', v)} unit="g" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Galactose" value={nutrientes.galactose_g} onChange={(v: string) => handleChangeNutriente('galactose_g', v)} unit="g" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Amido" value={nutrientes.amido_g} onChange={(v: string) => handleChangeNutriente('amido_g', v)} unit="g" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Polióis Totais" value={nutrientes.poliois_totais_g} onChange={(v: string) => handleChangeNutriente('poliois_totais_g', v)} unit="g" /></Grid>
                  {/* Específicos */}
                  <Grid item xs={4} md={2}><NutrientInput label="Eritritol" value={nutrientes.eritritol_g} onChange={(v: string) => handleChangeNutriente('eritritol_g', v)} unit="g" /></Grid>
                  <Grid item xs={4} md={2}><NutrientInput label="Xilitol" value={nutrientes.xilitol_g} onChange={(v: string) => handleChangeNutriente('xilitol_g', v)} unit="g" /></Grid>
                  <Grid item xs={4} md={2}><NutrientInput label="Sorbitol" value={nutrientes.sorbitol_g} onChange={(v: string) => handleChangeNutriente('sorbitol_g', v)} unit="g" /></Grid>
                  <Grid item xs={4} md={2}><NutrientInput label="Manitol" value={nutrientes.manitol_g} onChange={(v: string) => handleChangeNutriente('manitol_g', v)} unit="g" /></Grid>
                  <Grid item xs={4} md={2}><NutrientInput label="Maltitol" value={nutrientes.maltitol_g} onChange={(v: string) => handleChangeNutriente('maltitol_g', v)} unit="g" /></Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 3. GORDURAS DETALHADAS */}
            <Accordion variant="outlined" sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight="bold" color="text.secondary">Detalhamento de Gorduras & Colesterol</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}><NutrientInput label="Gord. Monoinsaturadas" value={nutrientes.gordura_mono_g} onChange={(v: string) => handleChangeNutriente('gordura_mono_g', v)} unit="g" /></Grid>
                  <Grid item xs={6} md={4}><NutrientInput label="Gord. Poli-insaturadas" value={nutrientes.gordura_poli_g} onChange={(v: string) => handleChangeNutriente('gordura_poli_g', v)} unit="g" /></Grid>
                  <Grid item xs={6} md={4}><NutrientInput label="Colesterol" value={nutrientes.colesterol_mg} onChange={(v: string) => handleChangeNutriente('colesterol_mg', v)} unit="mg" /></Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 4. VITAMINAS */}
            <Accordion variant="outlined" sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight="bold" color="text.secondary">Vitaminas</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><NutrientInput label="Vitamina A" value={nutrientes.vitamina_a_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_a_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Vitamina D" value={nutrientes.vitamina_d_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_d_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Vitamina E" value={nutrientes.vitamina_e_mg} onChange={(v: string) => handleChangeNutriente('vitamina_e_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Vitamina K" value={nutrientes.vitamina_k_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_k_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Vitamina C" value={nutrientes.vitamina_c_mg} onChange={(v: string) => handleChangeNutriente('vitamina_c_mg', v)} unit="mg" /></Grid>
                  {/* Complexo B */}
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B1" value={nutrientes.vitamina_b1_mg} onChange={(v: string) => handleChangeNutriente('vitamina_b1_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B2" value={nutrientes.vitamina_b2_mg} onChange={(v: string) => handleChangeNutriente('vitamina_b2_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B3" value={nutrientes.vitamina_b3_mg} onChange={(v: string) => handleChangeNutriente('vitamina_b3_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B5" value={nutrientes.vitamina_b5_mg} onChange={(v: string) => handleChangeNutriente('vitamina_b5_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B6" value={nutrientes.vitamina_b6_mg} onChange={(v: string) => handleChangeNutriente('vitamina_b6_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B7 (Biotina)" value={nutrientes.vitamina_b7_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_b7_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B9 (Ác. Fólico)" value={nutrientes.vitamina_b9_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_b9_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={2}><NutrientInput label="Vit B12" value={nutrientes.vitamina_b12_mcg} onChange={(v: string) => handleChangeNutriente('vitamina_b12_mcg', v)} unit="mcg" /></Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 5. MINERAIS */}
            <Accordion variant="outlined" sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ChevronDown />}>
                <Typography fontWeight="bold" color="text.secondary">Minerais</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><NutrientInput label="Cálcio" value={nutrientes.calcio_mg} onChange={(v: string) => handleChangeNutriente('calcio_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Ferro" value={nutrientes.ferro_mg} onChange={(v: string) => handleChangeNutriente('ferro_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Zinco" value={nutrientes.zinco_mg} onChange={(v: string) => handleChangeNutriente('zinco_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Fósforo" value={nutrientes.fosforo_mg} onChange={(v: string) => handleChangeNutriente('fosforo_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Potássio" value={nutrientes.potassio_mg} onChange={(v: string) => handleChangeNutriente('potassio_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Magnésio" value={nutrientes.magnesio_mg} onChange={(v: string) => handleChangeNutriente('magnesio_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Manganês" value={nutrientes.manganes_mg} onChange={(v: string) => handleChangeNutriente('manganes_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Cobre" value={nutrientes.cobre_mcg} onChange={(v: string) => handleChangeNutriente('cobre_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Selênio" value={nutrientes.selenio_mcg} onChange={(v: string) => handleChangeNutriente('selenio_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Molibdênio" value={nutrientes.molibdenio_mcg} onChange={(v: string) => handleChangeNutriente('molibdenio_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Iodo" value={nutrientes.iodo_mcg} onChange={(v: string) => handleChangeNutriente('iodo_mcg', v)} unit="mcg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Flúor" value={nutrientes.fluor_mg} onChange={(v: string) => handleChangeNutriente('fluor_mg', v)} unit="mg" /></Grid>
                  <Grid item xs={6} md={3}><NutrientInput label="Cromo" value={nutrientes.cromo_mcg} onChange={(v: string) => handleChangeNutriente('cromo_mcg', v)} unit="mcg" /></Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* ABA 3: Alergênicos (Mantida) */}
        {tabIndex === 2 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <FormControlLabel control={<Checkbox checked={contemGluten} onChange={e => setContemGluten(e.target.checked)} color="error" />} label={<Typography sx={{ fontWeight: 'bold', color: 'error.main' }}>CONTÉM GLÚTEN</Typography>} />
              <FormControlLabel control={<Checkbox checked={contemLactose} onChange={e => setContemLactose(e.target.checked)} color="warning" />} label={<Typography sx={{ fontWeight: 'bold', color: 'warning.main' }}>CONTÉM LACTOSE</Typography>} />
            </Box>
            <Autocomplete multiple options={alergenicosMestre} getOptionLabel={(option) => option.nome} value={alergenicosSelecionados} onChange={(_, newVal) => setAlergenicosSelecionados(newVal)} renderInput={(params) => <TextField {...params} label="Alergênicos" />} renderTags={(value, getTagProps) => value.map((option, index) => { const { key, ...tagProps } = getTagProps({ index }); return (<Chip variant="outlined" label={option.nome} color="warning" key={key} {...tagProps} />); })} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleSalvar} disabled={loading} startIcon={<Save />}>Salvar e Usar</Button>
      </DialogActions>
    </Dialog>
  );
}

function NutrientInput({ label, value, unit, onChange }: any) {
  return <TextField label={label} value={value} onChange={e => onChange(e.target.value)} type="number" fullWidth size="small" InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }} />;
}


