'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Paper, Tabs, Tab,
  Grid, TextField, Autocomplete, Button, Card,
  CardContent, alpha, useTheme, Divider, MenuItem,
  Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { 
  Search, Package, Calendar, User, 
  Trash2, Edit, Save, Plus, MoveHorizontal, Truck, ScanLine, Tag, MapPin, History, 
  Layers, ChevronRight, QrCode
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import { format, addDays, parseISO } from 'date-fns';
import { formatarQuantidade } from '@/components/MovimentacaoEstoqueDialog';
import EtiquetaPrinter from '@/components/etiquetas/EtiquetaPrinter';
import EtiquetaPreview from '@/components/etiquetas/EtiquetaPreview';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

export default function EtiquetasPage() {
  const theme = useTheme();
  const { activeClientId, unidadeId } = useClient();
  
  const [activeTab, setActiveTab] = useState(0); // 0: Insumos/Sobras, 1: Preparações/Produtos
  const [loading, setLoading] = useState(false);
  const [unidadeInfo, setUnidadeInfo] = useState<any>(null);
  const [userName, setUserName] = useState('');

  // --- BUSCA GERAL ---
  const [itens, setItens] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // --- DETALHES DO LOTE (Insumos) ---
  const [lotes, setLotes] = useState<any[]>([]);
  const [selectedLote, setSelectedLote] = useState<any>(null);

  // --- DETALHES DA OP ---
  const [ops, setOps] = useState<any[]>([]);
  const [selectedOP, setSelectedOP] = useState<any>(null);
  const [selectedOPForSobra, setSelectedOPForSobra] = useState<any>(null);
  const [allActiveOps, setAllActiveOps] = useState<any[]>([]);

  // --- DESTINO ---
  const [destinoTipo, setDestinoTipo] = useState<'LOCAL' | 'SETOR'>('LOCAL');
  const [locais, setLocais] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [selectedDestinoId, setSelectedDestinoId] = useState<string>('');

  // --- FORMULÁRIO ---
  const [pesoGml, setPesoGml] = useState<number>(0);
  const [numEtiquetas, setNumEtiquetas] = useState<number>(1);
  const [validade, setValidade] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (unidadeId) {
      loadUnidadeInfo();
      loadUserName();
      loadDestinos();
      loadAllActiveOps();
    }
  }, [unidadeId]);

  async function loadAllActiveOps() {
    if (!unidadeId) return;
    const { data } = await (supabase as any)
      .from('producao_ordens')
      .select('*')
      .eq('unidade_id', unidadeId)
      .in('status', ['PENDENTE', 'EM_PREPARO', 'PLANEJADA', 'EM_PRODUCAO'])
      .order('created_at', { ascending: false });
    setAllActiveOps(data || []);
  }

  async function loadDestinos() {
    // Busca locais de estoque
    const { data: locaisData } = await (supabase as any)
      .from('cliente_locais_estoque')
      .select('id, nome')
      .eq('unidade_id', unidadeId)
      .eq('ativo', true);
    setLocais(locaisData || []);

    // Busca setores de produção
    const { data: setoresData } = await (supabase as any)
      .from('cliente_setores_producao')
      .select('id, nome')
      .eq('cliente_id', activeClientId)
      .eq('ativo', true);
    setSetores(setoresData || []);
  }

  async function loadUnidadeInfo() {
    const { data } = await (supabase as any).from('cliente_unidades').select('*').eq('id', unidadeId).single();
    if (data) setUnidadeInfo(data);
  }

  useEffect(() => {
    if (activeClientId) {
      // Carrega itens iniciais ao abrir a página ou trocar de aba
      searchItems('');
    }
  }, [activeClientId, activeTab]);

  async function loadUserName() {
    const { data } = await supabase.auth.getUser();
    setUserName(data.user?.user_metadata?.full_name || data.user?.email || 'Operador');
  }

  // --- BUSCA DE ITENS (INGRED/RECEITA) ---
  const searchItems = async (val: string) => {
    // Se houver OP selecionada na aba de sobras, usamos a busca filtrada por consumo
    if (activeTab === 0 && selectedOPForSobra) {
      loadItemsFromOP(selectedOPForSobra.id);
      return;
    }

    setSearchLoading(true);
    try {
      if (activeTab === 0) {
        // Busca ingredientes geral
        let query = (supabase as any)
          .from('ingredientes')
          .select('id, nome')
          .is('deleted_at', null)
          .or(`cliente_id.eq.${activeClientId},cliente_id.is.null`)
          .order('nome')
          .limit(20);
        
        if (val) {
          query = query.ilike('nome', `%${val}%`);
        }

        const { data } = await query;
        setItens(data || []);
      } else {
        // Busca receitas geral
        let query = (supabase as any)
          .from('receitas')
          .select('id, nome, rendimento_total_g')
          .eq('cliente_id', activeClientId)
          .order('nome')
          .limit(20);

        if (val) {
          query = query.ilike('nome', `%${val}%`);
        }

        const { data } = await query;
        setItens(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // --- CARREGA LOTES (SE ITEM SELECIONADO) ---
  useEffect(() => {
    if (activeTab === 0 && selectedItem && unidadeId) {
      loadLotes(selectedItem.id);
    } else if (activeTab === 1 && selectedItem && unidadeId) {
      loadOps(selectedItem.id);
    }
  }, [selectedItem, activeTab, unidadeId, selectedOPForSobra]);

  async function loadItemsFromOP(opId: string) {
    setSearchLoading(true);
    try {
      // Busca ingredientes consumidos na OP via producao_consumos
      const { data } = await (supabase as any)
        .from('producao_consumos')
        .select(`
          quantidade_utilizada,
          lotes_estoque (
            id,
            ingredientes ( id, nome, grupo_estoque_id )
          )
        `)
        .eq('producao_id', opId);

      if (data) {
        const uniqueItems: any[] = [];
        const seenIds = new Set();
        data.forEach((c: any) => {
          const ing = c.lotes_estoque?.ingredientes;
          if (ing && !seenIds.has(ing.id)) {
            seenIds.add(ing.id);
            uniqueItems.push(ing);
          }
        });
        setItens(uniqueItems);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadLotes(ingredienteId: string) {
    // Se houver OP selecionada na aba de sobras, filtramos lotes usados nela
    if (activeTab === 0 && selectedOPForSobra) {
      const { data } = await (supabase as any)
        .from('producao_consumos')
        .select(`
          estoque_lote_id,
          lotes_estoque (
            *,
            fornecedores(razao_social)
          )
        `)
        .eq('producao_id', selectedOPForSobra.id);
      
      const filteredLotes = data
        ?.filter((c: any) => c.lotes_estoque?.ingrediente_id === ingredienteId)
        .map((c: any) => c.lotes_estoque) || [];
        
      setLotes(filteredLotes);
      if (filteredLotes.length > 0) setSelectedLote(filteredLotes[0]);
      else setSelectedLote(null);
      return;
    }

    const { data } = await (supabase as any)
      .from('lotes_estoque')
      .select('*, fornecedores(razao_social)')
      .eq('ingrediente_id', ingredienteId)
      .eq('unidade_id', unidadeId)
      .gt('quantidade_atual_g_ml', 0)
      .is('deleted_at', null)
      .order('data_validade_rotulo', { ascending: true });
    
    setLotes(data || []);
    if (data && data.length > 0) {
      setSelectedLote(data[0]);
    } else {
      setSelectedLote(null);
    }
  }

  async function loadOps(receitaId: string) {
    const { data } = await (supabase as any)
      .from('producao_ordens')
      .select('*')
      .eq('receita_id', receitaId)
      .eq('unidade_id', unidadeId)
      .in('status', ['PLANEJADA', 'EM_PRODUCAO', 'EM_PREPARO'])
      .order('created_at', { ascending: false });
    setOps(data || []);
  }

  // Preenche validade padrão ao trocar lote/item
  useEffect(() => {
    if (activeTab === 0 && selectedLote) {
      setValidade(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
      setPesoGml(selectedLote.quantidade_atual_g_ml);
    } else if (activeTab === 1 && selectedItem) {
      setValidade(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
      setPesoGml(selectedItem.rendimento_total_g || 0);
    }
  }, [selectedLote, selectedItem, activeTab]);

  // --- GERAÇÃO DE DADOS DA ETIQUETA ---
  const dadosEtiqueta = useMemo<DadosEtiqueta | null>(() => {
    if (!selectedItem) return null;
    
    const pesoUnitario = pesoGml / (numEtiquetas || 1);
    
    return {
      empresa: {
        razaoSocial: unidadeInfo?.nome_unidade || 'NutriDev Manager',
        cnpj: unidadeInfo?.cnpj_completo || '',
        enderecoResumido: activeTab === 0 ? 'Sobra de Insumo' : 'Produção Interna',
        enderecoCompleto: unidadeInfo?.endereco_completo || ''
      },
      produto: {
        nome: selectedItem.nome,
        lote: activeTab === 0 
          ? (selectedLote?.numero_lote_fabricante || 'EXT-INV') 
          : (selectedOP?.codigo || `INT-${new Date().getTime().toString().slice(-6)}`),
        marcaForn: activeTab === 0 ? (selectedLote?.fornecedores?.razao_social || 'N/A') : 'PRÓPRIA',
        peso: formatarQuantidade(pesoUnitario),
        tipoArmazenamento: activeTab === 0 ? 'Refrigerado / Secos' : 'Pronto para Consumo'
      },
      datas: {
        manipulacao: new Date(),
        validadeOriginal: activeTab === 0 ? new Date(selectedLote?.data_validade_rotulo || new Date()) : new Date(),
        validadeFinal: new Date(validade + 'T23:59:59')
      },
      rastreabilidade: {
        idInterno: activeTab === 0 ? (selectedLote?.id || 'NEW') : (selectedOP?.id || 'NEW'),
        responsavel: userName,
        codigoRef: activeTab === 1 && selectedOP ? selectedOP.codigo : (selectedOPForSobra?.codigo),
        destino: selectedDestinoId ? (destinoTipo === 'LOCAL' ? locais.find(l => l.id === selectedDestinoId)?.nome : setores.find(s => s.id === selectedDestinoId)?.nome) : undefined
      }
    };
  }, [selectedItem, selectedLote, selectedOP, selectedOPForSobra, pesoGml, numEtiquetas, validade, activeTab, unidadeInfo, userName, selectedDestinoId, destinoTipo, locais, setores]);

  // --- AÇÃO PRINCIPAL: INTEGRAR E IMPRIMIR ---
  async function handleIntegrarEtiqueta() {
    if (!selectedItem || pesoGml <= 0) return;
    setLoading(true);

    try {
      if (activeTab === 0 && selectedLote) {
        const destinoNome = destinoTipo === 'LOCAL' 
          ? locais.find(l => l.id === selectedDestinoId)?.nome 
          : setores.find(s => s.id === selectedDestinoId)?.nome;

        const { error: movErr } = await (supabase as any).from('estoque_movimentacoes').insert({
          lote_id: selectedLote.id,
          tipo_movimento: 'SAIDA',
          quantidade_movimentada: pesoGml,
          justificativa: `ETIQUETA DE SOBRA - Destino: ${destinoTipo} (${destinoNome || 'N/A'})${selectedOPForSobra ? ` | OP: ${selectedOPForSobra.codigo}` : ''}`,
          responsavel_id: (await supabase.auth.getUser()).data.user?.id
        });
        
        if (movErr) throw movErr;
        
        const novaQtd = Math.max(0, selectedLote.quantidade_atual_g_ml - pesoGml);
        await (supabase as any).from('lotes_estoque').update({ 
          quantidade_atual_g_ml: novaQtd,
        }).eq('id', selectedLote.id);
      }

      alert('Integração com estoque realizada com sucesso! Preparando impressão...');
    } catch (err: any) {
      console.error(err);
      alert('Erro na integração: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
            Gestão de Etiquetas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Criação de identificação para sobras e produtos internos com rastreabilidade total.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<History size={18} />}
          onClick={() => window.location.href = '/estoque'}
        >
          Histórico de Estoque
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, v) => { setActiveTab(v); setSelectedItem(null); setSelectedLote(null); setSelectedOPForSobra(null); searchItems(''); }}
              variant="fullWidth"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab icon={<Package size={18} />} iconPosition="start" label="Sobras de Insumos" />
              <Tab icon={<Layers size={18} />} iconPosition="start" label="Preparações / Produtos" />
            </Tabs>

            <Box sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Search size={16} /> 1. {activeTab === 0 ? 'Contexto de Produção (Opcional)' : 'Selecione o Produto'}
                  </Typography>

                  {activeTab === 0 ? (
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        select
                        fullWidth
                        label="Ordem de Produção (OP) - OPCIONAL"
                        value={selectedOPForSobra?.id || 'none'}
                        onChange={(e) => {
                          const opId = e.target.value;
                          if (opId === 'none') {
                            setSelectedOPForSobra(null);
                            setSelectedItem(null);
                            searchItems('');
                          } else {
                            const op = allActiveOps.find(o => o.id === opId);
                            setSelectedOPForSobra(op);
                            setSelectedItem(null);
                            loadItemsFromOP(opId);
                          }
                        }}
                        helperText="Selecione a OP para filtrar insumos usados nela"
                      >
                        <MenuItem value="none"><em>Nenhuma (Busca Geral)</em></MenuItem>
                        {allActiveOps.map(o => (
                          <MenuItem key={o.id} value={o.id}>
                            OP: {o.codigo} | {o.titulo || 'Produção'}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ) : null}

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Search size={16} /> {activeTab === 0 ? '2. Selecione o Insumo / Sobra' : '1. Selecione o Produto'}
                  </Typography>
                  <Autocomplete
                    fullWidth
                    options={itens}
                    value={selectedItem}
                    getOptionLabel={(option) => typeof option === 'string' ? option : (option.nome || '')}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    loading={searchLoading}
                    noOptionsText="Nenhum item encontrado"
                    onInputChange={(e, val) => { if (!selectedOPForSobra) searchItems(val); }}
                    onChange={(e, val) => setSelectedItem(val)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        placeholder={activeTab === 0 ? "Ex: Frango, Arroz..." : "Ex: Bolo de Cenoura..."}
                        variant="outlined"
                        onClick={() => { if (itens.length === 0) searchItems(''); }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {activeTab === 0 && selectedItem && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tag size={16} /> {selectedOPForSobra ? '3. Lote Utilizado na Produção' : '2. Origem (Lote em Estoque)'}
                    </Typography>
                    {lotes.length > 0 ? (
                      <TextField
                        select
                        fullWidth
                        value={selectedLote?.id || ''}
                        onChange={(e) => setSelectedLote(lotes.find(l => l.id === e.target.value))}
                      >
                        {lotes.map(l => (
                          <MenuItem key={l.id} value={l.id}>
                            Lote: {l.numero_lote_fabricante} | Forn: {l.fornecedores?.razao_social?.substring(0, 15)} | Saldo: {formatarQuantidade(l.quantidade_atual_g_ml)}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Alert severity="warning">Não há lotes desse ingrediente em estoque nesta unidade.</Alert>
                    )}
                  </Grid>
                )}

                {activeTab === 1 && selectedItem && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tag size={16} /> 2. Ordem de Produção Relacionada
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={selectedOP?.id || 'none'}
                      onChange={(e) => setSelectedOP(e.target.value === 'none' ? null : ops.find(o => o.id === e.target.value))}
                    >
                      <MenuItem value="none">Nenhuma (Produção Avulsa)</MenuItem>
                      {ops.map(o => (
                        <MenuItem key={o.id} value={o.id}>
                          OP: {o.codigo} | Data: {format(parseISO(o.created_at), 'dd/MM/yyyy')}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                {selectedItem && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapPin size={16} /> {activeTab === 0 ? '4. Destino' : '3. Destino'} (Onde será armazenado/usado)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          select
                          fullWidth
                          label="Tipo"
                          value={destinoTipo}
                          onChange={(e) => {
                            setDestinoTipo(e.target.value as any);
                            setSelectedDestinoId('');
                          }}
                        >
                          <MenuItem value="LOCAL">Local de Estoque</MenuItem>
                          <MenuItem value="SETOR">Setor de Produção</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          select
                          fullWidth
                          label={destinoTipo === 'LOCAL' ? "Selecione o Local" : "Selecione o Setor"}
                          value={selectedDestinoId}
                          onChange={(e) => setSelectedDestinoId(e.target.value)}
                        >
                          <MenuItem value=""><em>Selecione o destino...</em></MenuItem>
                          {(destinoTipo === 'LOCAL' ? locais : setores).map(d => (
                            <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Peso Total (g/ml)
                  </Typography>
                  <TextField 
                    fullWidth 
                    type="number"
                    value={pesoGml || ''}
                    onChange={(e) => setPesoGml(Number(e.target.value))}
                    InputProps={{ endAdornment: <InputAdornment position="end">g/ml</InputAdornment> }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Quantidade de Etiquetas
                  </Typography>
                  <TextField 
                    fullWidth 
                    type="number"
                    value={numEtiquetas || ''}
                    onChange={(e) => setNumEtiquetas(Number(e.target.value))}
                    helperText={numEtiquetas > 1 ? `Cada etiqueta terá ${formatarQuantidade(pesoGml / numEtiquetas)}` : 'Imprime uma única etiqueta'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={16} /> Data de Validade
                  </Typography>
                  <TextField 
                    fullWidth 
                    type="date"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                   <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                      <Typography variant="caption" color="info.main" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                        <User size={12} /> RESPONSÁVEL
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">{userName}</Typography>
                   </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  disabled={loading || !selectedItem || pesoGml <= 0}
                  onClick={handleIntegrarEtiqueta}
                  sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}
                >
                  {loading ? 'Processando...' : 'INTEGRAR AO ESTOQUE E IMPRIMIR'}
                </Button>
                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                  Ao clicar, o sistema registrará a movimentação de estoque necessária.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: 100 }}>
             <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ mb: 2, display: 'block' }}>
               PRÉVIA DA ETIQUETA (60mm x 60mm)
             </Typography>
             
             {dadosEtiqueta ? (
               <Card elevation={0} sx={{ border: '2px dashed', borderColor: 'primary.main', borderRadius: 4, bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <EtiquetaPreview dados={dadosEtiqueta} />
                    
                    <Box sx={{ mt: 4, width: '100%' }}>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Verifique se todos os dados de validade e rastreabilidade estão de acordo com a RDC 216.
                      </Alert>
                      
                      <EtiquetaPrinter 
                        dados={dadosEtiqueta} 
                        quantidadeCopias={numEtiquetas}
                        disabled={loading || pesoGml <= 0}
                      />
                    </Box>
                  </CardContent>
               </Card>
             ) : (
               <Paper 
                variant="outlined" 
                sx={{ 
                  p: 8, 
                  textAlign: 'center', 
                  borderRadius: 4, 
                  bgcolor: alpha(theme.palette.divider, 0.1),
                  borderStyle: 'dashed'
                }}
               >
                  <Tag size={48} color={theme.palette.text.secondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                 <Typography color="text.secondary">Selecione um item para visualizar a etiqueta</Typography>
               </Paper>
             )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
