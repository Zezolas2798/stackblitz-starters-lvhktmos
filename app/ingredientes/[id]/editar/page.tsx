'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box, Typography, Button, Paper, TextField,
    MenuItem, InputAdornment, Tabs, Tab, Divider, Alert,
    Autocomplete, Checkbox, FormControlLabel, Chip, Stack,
    Accordion, AccordionSummary, AccordionDetails,
    CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Save, ArrowLeft, Leaf, Activity, FileText, FlaskConical,
    AlertTriangle, ChevronDown, Barcode
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { Ingrediente, TipoIngrediente } from '@/lib/types';
import ScannerBarcodeDialog from '@/components/ScannerBarcodeDialog';

// ============================================================================
// TIPOS LOCAIS
// ============================================================================
interface AditivoMestre {
    id: number;
    ins: string;
    nome: string;
    funcao_principal: string | null;
    is_artificial?: boolean | null;
}

interface AnvisaAlergenico {
    id: number;
    nome: string;
}

type AlergenicoTag = {
    alergenico_id: number;
    nome: string;
    contem: boolean;
    contem_derivado: boolean;
};

// Componente de Input Nutricional Padronizado
const NutrientInput = ({ name, label, value, unit, onChange }: { name: keyof Ingrediente, label: string, value: any, unit: string, onChange: any }) => (
    <TextField
        label={label}
        type="number"
        value={value ?? ''}
        onChange={e => onChange(name, e.target.value)}
        size="small"
        fullWidth
        placeholder="-"
        InputLabelProps={{ shrink: true }}
        InputProps={{
            endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{unit}</Typography></InputAdornment>,
        }}
        sx={{ '& .MuiInputBase-root': { backgroundColor: '#fff' } }}
    />
);

export default function EditarIngredientePage() {
    const router = useRouter();
    const params = useParams();
    const ingredienteId = params.id as string;
    const { activeClientId, unidadeSelecionada } = useClient();
    const [loading, setLoading] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);
    const [openScanner, setOpenScanner] = useState(false);

    // Estados de Dados Mestres
    const [listaMestraAlergenicos, setListaMestraAlergenicos] = useState<AnvisaAlergenico[]>([]);
    const [listaAditivosMestre, setListaAditivosMestre] = useState<AditivoMestre[]>([]);
    const [opcoesFuncaoDinamicas, setOpcoesFuncaoDinamicas] = useState<string[]>([]);
    const [categoriasMestre, setCategoriasMestre] = useState<any[]>([]);
    const [categoriaValue, setCategoriaValue] = useState<any>(null);

    // Estados do Formulário (Inicializando TODOS os campos do tipo Ingrediente)
    const [formData, setFormData] = useState<Partial<Ingrediente>>({
        nome: '',
        fonte: '',
        tipo_ingrediente: 'SIMPLES',
        peso_unitario_g: null,
        contem_gluten: false,
        declaracao_ingredientes_fornecedor: '',
        funcao_aditivo: '',
        ins_code: '',
        is_transgenico: false,

        // Macronutrientes Obrigatórios
        energia_kcal: null, carboidrato_g: null, proteina_g: null, lipideos_g: null,
        gordura_saturada_g: null, gordura_trans_g: null, fibra_alimentar_g: null, sodio_mg: null,
        acucar_total_g: null, acucar_adicionado_g: null,

        // Frações de Carboidratos & Polióis
        lactose_g: null, galactose_g: null, amido_g: null,
        poliois_totais_g: null, eritritol_g: null, xilitol_g: null,
        sorbitol_g: null, manitol_g: null, maltitol_g: null,

        // Gorduras Detalhadas
        gordura_mono_g: null, gordura_poli_g: null, colesterol_mg: null,

        // Vitaminas Completas
        vitamina_a_mcg: null, vitamina_d_mcg: null, vitamina_e_mg: null, vitamina_k_mcg: null,
        vitamina_c_mg: null,
        vitamina_b1_mg: null, vitamina_b2_mg: null, vitamina_b3_mg: null,
        vitamina_b5_mg: null, vitamina_b6_mg: null, vitamina_b7_mcg: null,
        vitamina_b9_mcg: null, vitamina_b12_mcg: null,
        categoria_produto_id: null,

        // Minerais Completos
        calcio_mg: null, ferro_mg: null,
        magnesio_mg: null, fosforo_mg: null, potassio_mg: null, zinco_mg: null,
        cobre_mcg: null, selenio_mcg: null, iodo_mcg: null, manganes_mg: null,
        fluor_mg: null, cromo_mcg: null, molibdenio_mcg: null, cloreto_mg: null,
        grupo_estoque_id: null,
        classificacao_nova: null
    });

    const [alergenosSelecionados, setAlergenosSelecionados] = useState<AlergenicoTag[]>([]);
    const [todosGrupos, setTodosGrupos] = useState<{id: string, nome: string, categoria_id: string | null}[]>([]);
    const [opcoesGrupos, setOpcoesGrupos] = useState<{id: string, nome: string}[]>([]);

    // Carrega Ingrediente + Dados Mestres
    useEffect(() => {
        async function loadMastersAndData() {
            // 1. Mestres
            let alergMestre: AnvisaAlergenico[] = [];
            const { data: alergenicosData } = await supabase.from('anvisa_alergenicos').select('id, nome').order('nome');
            if (alergenicosData) {
                setListaMestraAlergenicos(alergenicosData);
                alergMestre = alergenicosData;
            }

            const { data: aditivosData } = await supabase.from('anvisa_aditivos').select('*').order('ins');
            if (aditivosData) setListaAditivosMestre(aditivosData);

            const { data: funcoesData } = await supabase.from('anvisa_funcoes_aditivos').select('nome').order('nome');
            if (funcoesData) setOpcoesFuncaoDinamicas(funcoesData.map((f: any) => f.nome));

            let categorias: any[] = [];
            if (activeClientId) {
                const { data: catData } = await supabase.from('cliente_categorias_produto').select('id, nome').eq('cliente_id', activeClientId).eq('modalidade', 'ALIMENTOS').order('nome');
                if (catData) {
                    setCategoriasMestre(catData);
                    categorias = catData;
                }
                
                const { data: grpData } = await (supabase as any).from('ingredientes_grupos').select('id, nome, categoria_id').eq('cliente_id', activeClientId).order('nome');
                if (grpData) setTodosGrupos(grpData);
            }

            // 2. Carrega Dados do Ingrediente
            if (ingredienteId) {
                const { data: ingData, error: ingError } = await supabase
                    .from('ingredientes')
                    .select('*')
                    .eq('id', ingredienteId)
                    .single();

                if (ingData) {
                    const ing = ingData as any;
                    setFormData({
                        ...ing,
                        tipo_ingrediente: ing.tipo_ingrediente as TipoIngrediente,
                        contem_gluten: !!ing.contem_gluten,
                        is_transgenico: !!ing.is_transgenico,
                        categoria_produto_id: ing.categoria_produto_id || null
                    } as Partial<Ingrediente>);

                    if (ing.categoria_produto_id) {
                        const cat = categorias.find(c => c.id === ing.categoria_produto_id);
                        if (cat) setCategoriaValue(cat);
                    }

                    // Carrega os alergenicos persistidos
                    const { data: linkData } = await supabase
                        .from('ingrediente_alergenicos')
                        .select('*')
                        .eq('ingrediente_id', ingredienteId);

                    if (linkData && linkData.length > 0) {
                        const tempAl: AlergenicoTag[] = linkData.map(l => {
                            const alergName = alergMestre.find(m => m.id === l.anvisa_alergenico_id)?.nome || 'Alergênico Desconhecido';
                            return {
                                alergenico_id: l.anvisa_alergenico_id,
                                nome: alergName,
                                contem: true, // No longer in table, assuming true if linked
                                contem_derivado: false // No longer in table
                            };
                        });
                        setAlergenosSelecionados(tempAl);
                    }
                } else if (ingError) {
                    console.error('Erro ao buscar ingrediente', ingError);
                }
            }
        }

        // So chama dps de montar no client
        if (activeClientId) loadMastersAndData();
    }, [ingredienteId, activeClientId]);

    // Filtrar grupos quando a categoria muda
    useEffect(() => {
        if (categoriaValue?.id) {
            // Filtragem estrita: apenas grupos vinculados a esta categoria
            const filtrados = todosGrupos.filter(g => g.categoria_id === categoriaValue.id);
            setOpcoesGrupos(filtrados);
        } else {
            setOpcoesGrupos([]);
        }
    }, [categoriaValue, todosGrupos]);

    const handleChange = (field: keyof Ingrediente, value: any) => {
        let finalValue = value;
        if (typeof value === 'string' && value === '') {
            finalValue = null;
        } else if (
            field !== 'nome' && field !== 'fonte' && field !== 'tipo_ingrediente' &&
            field !== 'funcao_aditivo' && field !== 'ins_code' && field !== 'declaracao_ingredientes_fornecedor' &&
            field !== 'classificacao_nova' && field !== 'categoria_produto_id' && field !== 'grupo_estoque_id'
        ) {
            const num = Number(value);
            if (!isNaN(num)) finalValue = num;
        }
        setFormData(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleSelectAditivoMestre = (aditivo: AditivoMestre | null) => {
        if (aditivo) {
            const funcoesRaw = aditivo.funcao_principal || '';
            const funcoesPossiveis = funcoesRaw.split('/').map(f => f.trim()).filter(f => f.length > 0);
            if (funcoesPossiveis.length > 0) {
                setOpcoesFuncaoDinamicas(funcoesPossiveis);
                if (funcoesPossiveis.length === 1) {
                    setFormData(prev => ({ ...prev, nome: aditivo.nome, ins_code: aditivo.ins, funcao_aditivo: funcoesPossiveis[0], fonte: 'Tabela INS ANVISA' }));
                } else {
                    setFormData(prev => ({ ...prev, nome: aditivo.nome, ins_code: aditivo.ins, funcao_aditivo: '', fonte: 'Tabela INS ANVISA' }));
                }
            } else {
                setFormData(prev => ({ ...prev, nome: aditivo.nome, ins_code: aditivo.ins, fonte: 'Tabela INS ANVISA' }));
            }

            // A detecção de corantes agora é automatizada na Edge Function via ins_code
        }
    };

    const handleAddAlergeno = (alergeno: AnvisaAlergenico | null) => {
        if (!alergeno || alergenosSelecionados.find(a => a.alergenico_id === alergeno.id)) return;
        setAlergenosSelecionados(prev => [...prev, { alergenico_id: alergeno.id, nome: alergeno.nome, contem: true, contem_derivado: false }]);
    };

    const handleRemoveAlergeno = (id: number) => {
        setAlergenosSelecionados(prev => prev.filter(a => a.alergenico_id !== id));
    };

    const handleAlergenoChange = (id: number, field: 'contem' | 'contem_derivado') => {
        setAlergenosSelecionados(prev => prev.map(tag => tag.alergenico_id === id ? { ...tag, [field]: !tag[field] } : tag));
    };

    const handleSalvar = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeClientId) return alert('Selecione uma unidade/cliente no menu lateral!');
        if (!formData.nome) return alert('O nome do ingrediente é obrigatório');

        setLoading(true);
        try {
            const idsAlergenicos = alergenosSelecionados.map(a => a.alergenico_id);

            const payload: any = {
                ...formData,
                especie_transgenica: formData.is_transgenico ? formData.especie_transgenica : null,
                alergenicos_ids: idsAlergenicos,
                updated_at: new Date().toISOString()
            };

            // Garantir que categoria_produto_id esteja correto se categoriaValue foi selecionado
            if (categoriaValue?.id) {
                payload.categoria_produto_id = categoriaValue.id;
            }

            // Remover campos que não devem ser enviados ou que são objetos
            delete payload.cliente_id;
            delete payload.created_at;
            delete payload.created_by;
            delete payload.id;
            delete payload.cliente;

            const { error } = await supabase.from('ingredientes').update(payload).eq('id', ingredienteId);
            if (error) throw error;

            // Update Alergenicos (Deleta os existentes e recriar os passados)
            await supabase.from('ingrediente_alergenicos').delete().eq('ingrediente_id', ingredienteId);
            if (alergenosSelecionados.length > 0) {
                const links: any[] = alergenosSelecionados.map(a => ({ 
                    ingrediente_id: ingredienteId, 
                    anvisa_alergenico_id: a.alergenico_id, 
                    nivel_contato: a.contem ? 'DIRETO' : (a.contem_derivado ? 'DIRETO' : 'TRACOS_CRUZADOS')
                }));
                await supabase.from('ingrediente_alergenicos').insert(links);
            }

            alert(`Ingrediente "${formData.nome}" editado com sucesso!`);
            
            // Pequeno delay para garantir que o alert seja visto antes do redirecionamento
            setTimeout(() => {
                router.push('/ingredientes');
            }, 100);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar: ' + (err.message || 'Verifique os logs do console'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmScan = (mappedData: any, raw: any) => {
        const { _alergenos_detectados, ...cleanMappedData } = mappedData;

        setFormData(prev => ({
            ...prev,
            ...cleanMappedData,
            tipo_ingrediente: 'COMPOSTO'
        }));

        // Mapear alérgenos inteligentes do mappedData
        if (_alergenos_detectados && _alergenos_detectados.length > 0) {
            const novosAlergenos: AlergenicoTag[] = [];
            
            _alergenos_detectados.forEach((detected: any) => {
                const match = listaMestraAlergenicos.find(a => 
                    a.nome.toLowerCase().includes(detected.searchName.toLowerCase())
                );
                
                if (match && !alergenosSelecionados.find(s => s.alergenico_id === match.id)) {
                    novosAlergenos.push({
                        alergenico_id: match.id,
                        nome: match.nome,
                        contem: !!detected.contem,
                        contem_derivado: !!detected.derivado
                    });
                } else if (match) {
                    // Atualiza se já existir (mesclando os flags)
                    setAlergenosSelecionados(prev => prev.map(a => 
                        a.alergenico_id === match.id 
                            ? { ...a, contem: a.contem || detected.contem, contem_derivado: a.contem_derivado || detected.derivado }
                            : a
                    ));
                }
            });

            if (novosAlergenos.length > 0) {
                setAlergenosSelecionados(prev => [...prev, ...novosAlergenos]);
            }
        }

        // Verificar Glúten (OFF API)
        if (raw.product?.allergens_tags?.some((t: string) => t.includes('wheat') || t.includes('gluten') || t.includes('rye') || t.includes('barley'))) {
            setFormData(prev => ({ ...prev, contem_gluten: true }));
        }

        setTabIndex(1);
    };

    if (!activeClientId && !loading) {
        return (
            <Box p={4}>
                <Alert severity="warning">Selecione uma unidade no menu lateral para acessar o ingrediente.</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ mr: 2 }}>Voltar</Button>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Editar Ingrediente</Typography>
                    <Typography variant="caption" color="text.secondary">{unidadeSelecionada?.cliente?.nome_fantasia} • Cadastro Técnico</Typography>
                </Box>
            </Box>

            <Paper sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab icon={<FileText size={20} />} label="Dados Gerais & Segurança" iconPosition="start" />
                    <Tab icon={<Activity size={20} />} label="Tabela Nutricional Completa" iconPosition="start" />
                </Tabs>

                <Box component="form" noValidate onSubmit={handleSalvar} sx={{ p: 4 }}>
                    {/* === ABA 1: DADOS GERAIS === */}
                    {tabIndex === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField select label="Tipo de Classificação" fullWidth value={formData.tipo_ingrediente || 'SIMPLES'} onChange={e => handleChange('tipo_ingrediente', e.target.value)}>
                                    <MenuItem value="SIMPLES"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Leaf size={16} /> Ingrediente Simples</Box></MenuItem>
                                    <MenuItem value="COMPOSTO"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Activity size={16} /> Produto Industrializado</Box></MenuItem>
                                    <MenuItem value="ADITIVO"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><FlaskConical size={16} /> Aditivo Alimentar</Box></MenuItem>
                                </TextField>
                            </Grid>

                            {formData.tipo_ingrediente === 'ADITIVO' ? (
                                <Grid item xs={12} md={8}>
                                    <Autocomplete
                                        options={listaAditivosMestre}
                                        getOptionLabel={(option) => `INS ${option.ins} - ${option.nome}`}
                                        onChange={(_, val) => handleSelectAditivoMestre(val)}
                                        renderInput={(params) => <TextField {...params} label="Buscar Aditivo (INS)" placeholder="Digite código ou nome..." />}
                                    />
                                </Grid>
                            ) : (
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField label="Nome do Ingrediente *" fullWidth value={formData.nome || ''} onChange={e => handleChange('nome', e.target.value)} placeholder="Ex: Farinha de Trigo Especial" />
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => setOpenScanner(true)}
                                            sx={{ minWidth: 'fit-content', px: 2 }}
                                            startIcon={<Barcode size={20} />}
                                        >
                                            Escanear
                                        </Button>
                                    </Box>
                                </Grid>
                            )}

                            {formData.tipo_ingrediente === 'ADITIVO' && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <Autocomplete
                                            freeSolo options={opcoesFuncaoDinamicas} value={formData.funcao_aditivo || ''} onChange={(_, val) => handleChange('funcao_aditivo', val)}
                                            renderInput={(params) => <TextField {...params} label="Função Tecnológica" />}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField label="Código INS" fullWidth value={formData.ins_code || ''} onChange={e => handleChange('ins_code', e.target.value)} />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} md={4}>
                                <TextField label="Marca / Fonte" fullWidth value={formData.fonte || ''} onChange={e => handleChange('fonte', e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    options={categoriasMestre}
                                    value={categoriaValue}
                                    onChange={(_, val) => {
                                        setCategoriaValue(val);
                                        handleChange('grupo_estoque_id', null);
                                    }}
                                    getOptionLabel={(option) => option.nome || ''}
                                    renderInput={(params) => <TextField {...params} label="Categoria de Produto" placeholder="Ex: Grãos, Proteínas, Temperos..." />}
                                    noOptionsText="Nenhuma categoria de Alimentos encontrada"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField label="Peso Médio Unitário (g)" type="number" fullWidth value={formData.peso_unitario_g ?? ''} onChange={e => handleChange('peso_unitario_g', e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }} />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Autocomplete
                                    freeSolo
                                    options={opcoesGrupos}
                                    getOptionLabel={(option: any) => typeof option === 'string' ? option : option.nome}
                                    value={opcoesGrupos.find(g => g.id === formData.grupo_estoque_id) || null}
                                    onChange={async (_, newValue) => {
                                        if (typeof newValue === 'string') {
                                            // Handle free text (new group)
                                            if (!activeClientId) return;
                                            if (!categoriaValue?.id) {
                                                alert('Por favor, selecione uma Categoria primeiro para vincular este novo Grupo.');
                                                return;
                                            }
                                            try {
                                                setLoading(true);
                                                const { data, error } = await (supabase as any).from('ingredientes_grupos')
                                                    .insert([{
                                                        cliente_id: activeClientId,
                                                        categoria_id: categoriaValue.id,
                                                        nome: newValue
                                                    }])
                                                    .select().single();
                                                if (error) throw error;
                                                setTodosGrupos(prev => [...prev, data]);
                                                handleChange('grupo_estoque_id', data.id);
                                            } catch (err: any) {
                                                console.error('Erro ao criar grupo:', err);
                                                alert('Erro ao criar grupo de estoque.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        } else if (newValue && newValue.id) {
                                            handleChange('grupo_estoque_id', newValue.id);
                                        } else {
                                            handleChange('grupo_estoque_id', null);
                                        }
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Grupo de Estoque (Para Agrupar Marcas)" placeholder="Ex: Farinha de Trigo" helperText="Opcional. Agrupa produtos que compartilham o mesmo estoque." />}
                                    noOptionsText={categoriaValue ? "Nenhuma subcategoria encontrada para esta categoria" : "Selecione uma categoria primeiro"}
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Classificação NOVA"
                                    fullWidth
                                    value={formData.classificacao_nova ?? ''}
                                    onChange={e => handleChange('classificacao_nova', e.target.value === '' ? null : Number(e.target.value))}
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

                            {formData.tipo_ingrediente === 'COMPOSTO' && (
                                <Grid item xs={12}>
                                    <TextField label="Lista de Ingredientes (Rótulo)" multiline rows={3} fullWidth value={formData.declaracao_ingredientes_fornecedor || ''} onChange={e => handleChange('declaracao_ingredientes_fornecedor', e.target.value)} placeholder="Copie aqui a lista de ingredientes da embalagem..." />
                                </Grid>
                            )}

                            <Grid item xs={12}><Divider /></Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="error" fontWeight="bold" sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <AlertTriangle size={18} /> CONTROLE DE ALERGÊNICOS & ADITIVOS CRÍTICOS
                                </Typography>
                                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                                    <FormControlLabel control={<Checkbox checked={!!formData.contem_gluten} onChange={e => handleChange('contem_gluten', e.target.checked)} color="error" />} label="CONTÉM GLÚTEN" />
                                    <FormControlLabel control={<Checkbox checked={!!formData.is_transgenico} onChange={e => handleChange('is_transgenico', e.target.checked)} color="error" />} label="ALIMENTO TRANSGÊNICO" />
                                    {formData.is_transgenico && (
                                        <TextField
                                            size="small"
                                            label="Espécie Transgênica (ex: Soja, Milho)"
                                            value={formData.especie_transgenica || ''}
                                            onChange={(e) => handleChange('especie_transgenica', e.target.value)}
                                            fullWidth
                                            sx={{ mt: 1 }}
                                            helperText="A legislação exige informar a espécie doadora do gene."
                                        />
                                    )}
                                </Stack>
                                <Autocomplete
                                    options={listaMestraAlergenicos.filter(a => !alergenosSelecionados.find(s => s.alergenico_id === a.id))}
                                    getOptionLabel={(o) => o.nome} onChange={(_, val) => handleAddAlergeno(val)}
                                    renderInput={(params) => <TextField {...params} label="Adicionar Alergênico Presente..." placeholder="Ex: Leite, Soja, Nozes" />}
                                    sx={{ mb: 2 }}
                                />
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {alergenosSelecionados.map(tag => (
                                        <Paper key={tag.alergenico_id} sx={{ p: 1, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={tag.nome} color="error" size="small" />
                                            <FormControlLabel control={<Checkbox size="small" checked={tag.contem} onChange={() => handleAlergenoChange(tag.alergenico_id, 'contem')} />} label={<Typography variant="caption">Contém</Typography>} />
                                            <FormControlLabel control={<Checkbox size="small" checked={tag.contem_derivado} onChange={() => handleAlergenoChange(tag.alergenico_id, 'contem_derivado')} />} label={<Typography variant="caption">Derivado</Typography>} />
                                            <ChevronDown size={14} style={{ transform: 'rotate(270deg)', cursor: 'pointer' }} onClick={() => handleRemoveAlergeno(tag.alergenico_id)} />
                                        </Paper>
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    )}

                    {/* === ABA 2: NUTRICIONAL === */}
                    {tabIndex === 1 && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>Preencha com base em <strong>100g</strong> ou <strong>100ml</strong> do produto.</Alert>

                            {/* MACRONUTRIENTES */}
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: 'primary.main' }}>PRINCIPAIS (Obrigatórios RDC 429)</Typography>
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                <Grid item xs={6} md={3}><NutrientInput name="energia_kcal" label="Valor Energético" unit="kcal" value={formData.energia_kcal} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="carboidrato_g" label="Carboidratos Totais" unit="g" value={formData.carboidrato_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="acucar_total_g" label="Açúcares Totais" unit="g" value={formData.acucar_total_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="acucar_adicionado_g" label="Aç. Adicionados" unit="g" value={formData.acucar_adicionado_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="proteina_g" label="Proteínas" unit="g" value={formData.proteina_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="lipideos_g" label="Gorduras Totais" unit="g" value={formData.lipideos_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="gordura_saturada_g" label="Gord. Saturadas" unit="g" value={formData.gordura_saturada_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="gordura_trans_g" label="Gord. Trans" unit="g" value={formData.gordura_trans_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="fibra_alimentar_g" label="Fibra Alimentar" unit="g" value={formData.fibra_alimentar_g} onChange={handleChange} /></Grid>
                                <Grid item xs={6} md={3}><NutrientInput name="sodio_mg" label="Sódio" unit="mg" value={formData.sodio_mg} onChange={handleChange} /></Grid>
                            </Grid>

                            {/* ACCORDION: Detalhamento Carboidratos */}
                            <Accordion variant="outlined">
                                <AccordionSummary expandIcon={<ChevronDown />}>
                                    <Typography fontWeight="bold">Frações de Carboidratos & Polióis</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}><NutrientInput name="lactose_g" label="Lactose" unit="g" value={formData.lactose_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="galactose_g" label="Galactose" unit="g" value={formData.galactose_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="amido_g" label="Amido" unit="g" value={formData.amido_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="poliois_totais_g" label="Polióis Totais" unit="g" value={formData.poliois_totais_g} onChange={handleChange} /></Grid>

                                        {/* Polióis Individuais */}
                                        <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption">Polióis Específicos</Typography></Divider></Grid>
                                        <Grid item xs={6} md={2}><NutrientInput name="eritritol_g" label="Eritritol" unit="g" value={formData.eritritol_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={2}><NutrientInput name="xilitol_g" label="Xilitol" unit="g" value={formData.xilitol_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={2}><NutrientInput name="sorbitol_g" label="Sorbitol" unit="g" value={formData.sorbitol_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={2}><NutrientInput name="maltitol_g" label="Maltitol" unit="g" value={formData.maltitol_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={2}><NutrientInput name="manitol_g" label="Manitol" unit="g" value={formData.manitol_g} onChange={handleChange} /></Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* ACCORDION: Gorduras */}
                            <Accordion variant="outlined">
                                <AccordionSummary expandIcon={<ChevronDown />}>
                                    <Typography fontWeight="bold">Perfil Lipídico & Colesterol</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}><NutrientInput name="gordura_mono_g" label="Gord. Monoinsaturada" unit="g" value={formData.gordura_mono_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={4}><NutrientInput name="gordura_poli_g" label="Gord. Polinsaturada" unit="g" value={formData.gordura_poli_g} onChange={handleChange} /></Grid>
                                        <Grid item xs={4}><NutrientInput name="colesterol_mg" label="Colesterol" unit="mg" value={formData.colesterol_mg} onChange={handleChange} /></Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* ACCORDION: Vitaminas */}
                            <Accordion variant="outlined">
                                <AccordionSummary expandIcon={<ChevronDown />}>
                                    <Typography fontWeight="bold">Vitaminas</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_a_mcg" label="Vitamina A" unit="mcg" value={formData.vitamina_a_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_d_mcg" label="Vitamina D" unit="mcg" value={formData.vitamina_d_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_e_mg" label="Vitamina E" unit="mg" value={formData.vitamina_e_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_k_mcg" label="Vitamina K" unit="mcg" value={formData.vitamina_k_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_c_mg" label="Vitamina C" unit="mg" value={formData.vitamina_c_mg} onChange={handleChange} /></Grid>

                                        <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption">Complexo B</Typography></Divider></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b1_mg" label="Vit. B1 (Tiamina)" unit="mg" value={formData.vitamina_b1_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b2_mg" label="Vit. B2 (Riboflavina)" unit="mg" value={formData.vitamina_b2_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b3_mg" label="Vit. B3 (Niacina)" unit="mg" value={formData.vitamina_b3_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b5_mg" label="Vit. B5 (Pantotênico)" unit="mg" value={formData.vitamina_b5_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b6_mg" label="Vit. B6 (Piridoxina)" unit="mg" value={formData.vitamina_b6_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b7_mcg" label="Vit. B7 (Biotina)" unit="mcg" value={formData.vitamina_b7_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b9_mcg" label="Vit. B9 (Folato)" unit="mcg" value={formData.vitamina_b9_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="vitamina_b12_mcg" label="Vit. B12 (Cobalamina)" unit="mcg" value={formData.vitamina_b12_mcg} onChange={handleChange} /></Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* ACCORDION: Minerais */}
                            <Accordion variant="outlined">
                                <AccordionSummary expandIcon={<ChevronDown />}>
                                    <Typography fontWeight="bold">Minerais</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}><NutrientInput name="calcio_mg" label="Cálcio" unit="mg" value={formData.calcio_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="ferro_mg" label="Ferro" unit="mg" value={formData.ferro_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="potassio_mg" label="Potássio" unit="mg" value={formData.potassio_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="zinco_mg" label="Zinco" unit="mg" value={formData.zinco_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="fosforo_mg" label="Fósforo" unit="mg" value={formData.fosforo_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="magnesio_mg" label="Magnésio" unit="mg" value={formData.magnesio_mg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="cobre_mcg" label="Cobre" unit="mcg" value={formData.cobre_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="iodo_mcg" label="Iodo" unit="mcg" value={formData.iodo_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="selenio_mcg" label="Selênio" unit="mcg" value={formData.selenio_mcg} onChange={handleChange} /></Grid>
                                        <Grid item xs={6} md={3}><NutrientInput name="manganes_mg" label="Manganês" unit="mg" value={formData.manganes_mg} onChange={handleChange} /></Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}

                    <Divider sx={{ my: 4 }} />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        disabled={loading}
                        sx={{ fontWeight: 'bold', height: 48, boxShadow: 3 }}
                    >
                        {loading ? 'Salvando...' : 'Salvar Edição do Ingrediente'}
                    </Button>
                </Box>
            </Paper>

            <ScannerBarcodeDialog
                open={openScanner}
                onClose={() => setOpenScanner(false)}
                onConfirm={handleConfirmScan}
            />
        </Box>
    );
}
