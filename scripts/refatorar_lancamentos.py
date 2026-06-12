import re

with open('app/compras/lancamentos/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Interface NfItem
new_interface = """interface NfItem {
  tempId: string;
  ingrediente_id: string;
  marca: string;
  qtdEmbalagens: string;
  pesoUnitario: string;
  unidadePeso: string;
  precoTotal: string; 
  descricaoNF?: string; 
  unidadeNF?: string; 
  loteFabricante?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  caEpi?: string;
}"""
content = re.sub(r'interface NfItem \{[\s\S]*?\n\}', new_interface, content)

# 3. Add buscandoInsumos and Debounce effect, update loadDados
old_load_dados = """  const loadDados = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    try {
      // Sugestões combinadas baseadas na modalidade
      if (modalidade === 'ALIMENTOS') {
        const { data } = await (supabase as any)
          .from('ingredientes')
          .select('id, nome, fonte, peso_unitario_g')
          .eq('cliente_id', activeClientId)
          .is('deleted_at', null)
          .order('nome');
        if (data) setIngredienteSugestoes(data.map((i: any) => ({ ...i, group: '📦 Insumos Disponíveis' })));
      } else {
        const { data } = await (supabase as any)
          .from('materiais')
          .select('id, nome, marca, tipo_material')
          .eq('cliente_id', activeClientId)
          .is('ativo', true)
          .order('nome');
        
        // Mapear tipos de materiais para grupos visuais
        const typesMap: Record<string, string> = {
          'EMBALAGEM': '📦 Embalagens',
          'LIMPEZA': '🧹 Limpeza',
          'MANUTENCAO': '🔧 Manutenção',
          'UTENSILIO': '🍴 Utensílios',
          'EPI_EPC': '🛡️ EPIs/EPCs',
          'UNIFORME': '👕 Uniformes',
          'PRIMEIROS_SOCORROS': '🚑 Primeiros Socorros'
        };
        
        if (data) {
          setIngredienteSugestoes(data.map((m: any) => ({ 
            ...m, 
            group: typesMap[m.tipo_material] || '📂 Outros Materiais' 
          })));
        }
      }

      const { data: fornData } = await (supabase as any)
        .from('fornecedores')
        .select('*')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null)
        .order('razao_social');
      if (fornData) setListaFornecedores(fornData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClientId, modalidade]);"""

new_load_dados = """  const [buscandoInsumos, setBuscandoInsumos] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!termoBuscaIngrediente || termoBuscaIngrediente.length < 2) {
        setIngredienteSugestoes([]);
        return;
      }
      
      setBuscandoInsumos(true);
      try {
        if (modalidade === 'ALIMENTOS') {
          const { data } = await (supabase as any)
            .from('ingredientes')
            .select('id, nome, fonte, peso_unitario_g')
            .eq('cliente_id', activeClientId)
            .ilike('nome', `%${termoBuscaIngrediente}%`)
            .limit(20);
          if (data) setIngredienteSugestoes(data.map((i: any) => ({ ...i, group: '📦 Insumos Encontrados' })));
        } else {
          const typeMap: Record<string, string> = {
            'EMBALAGENS': 'EMBALAGEM',
            'LIMPEZA': 'LIMPEZA',
            'MANUTENCAO': 'MANUTENCAO',
            'UTENSILIOS': 'UTENSILIO',
            'EPI_EPC': 'EPI_EPC',
            'UNIFORMES': 'UNIFORME',
            'PRIMEIROS_SOCORROS': 'PRIMEIROS_SOCORROS'
          };
          const materialType = typeMap[modalidade] || 'OUTROS';
          
          const { data } = await (supabase as any)
            .from('materiais')
            .select('id, nome, marca, tipo_material')
            .eq('cliente_id', activeClientId)
            .eq('tipo_material', materialType)
            .is('ativo', true)
            .ilike('nome', `%${termoBuscaIngrediente}%`)
            .limit(20);
            
          const visualMap: Record<string, string> = {
            'EMBALAGEM': '📦 Embalagens',
            'LIMPEZA': '🧹 Limpeza',
            'MANUTENCAO': '🔧 Manutenção',
            'UTENSILIO': '🍴 Utensílios',
            'EPI_EPC': '🛡️ EPIs/EPCs',
            'UNIFORME': '👕 Uniformes',
            'PRIMEIROS_SOCORROS': '🚑 Primeiros Socorros'
          };
          
          if (data) {
            setIngredienteSugestoes(data.map((m: any) => ({ 
              ...m, 
              group: visualMap[m.tipo_material] || '📂 Materiais Encontrados' 
            })));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBuscandoInsumos(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [termoBuscaIngrediente, activeClientId, modalidade]);

  const loadDados = useCallback(async () => {
    if (!activeClientId) return;
    setLoading(true);
    try {
      const { data: fornData } = await (supabase as any)
        .from('fornecedores')
        .select('*')
        .eq('cliente_id', activeClientId)
        .is('deleted_at', null)
        .order('razao_social');
      if (fornData) setListaFornecedores(fornData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [activeClientId]);"""

content = content.replace(old_load_dados, new_load_dados)

# 4. Update handleSalvarNf payload
old_payload = """          numero_lote_fabricante: `NF-${numNf || 'SN'}-${Date.now().toString().slice(-4)}`,
          nota_fiscal: numNf || null,
          data_fabricacao: dataNf,
          quantidade_inicial_g_ml: qtdGml,
          quantidade_atual_g_ml: qtdGml,
          status: 'PREVISTO',
          qtd_embalagens: qtdEmb,
          peso_unitario_embalagem: pesoEmb,
          unidade_peso_embalagem: item.unidadePeso,
          valor_unitario: precoTot / (qtdEmb || 1),
          valor_total: precoTot,
          data_vencimento_financeiro: dataVencimentoNf || null,"""

new_payload = """          numero_lote_fabricante: item.loteFabricante || null,
          nota_fiscal: numNf || null,
          data_fabricacao: item.dataFabricacao || null,
          data_validade: item.dataValidade || null,
          quantidade_inicial_g_ml: qtdGml,
          quantidade_atual_g_ml: qtdGml,
          status: 'PREVISTO',
          qtd_embalagens: qtdEmb,
          peso_unitario_embalagem: pesoEmb,
          unidade_peso_embalagem: item.unidadePeso,
          valor_unitario: precoTot / (qtdEmb || 1),
          valor_total: precoTot,
          data_vencimento_financeiro: dataVencimentoNf || null,"""

content = content.replace(old_payload, new_payload)

# 5. UI Updates inside map
old_autocomplete = """                              <Autocomplete 
                                fullWidth 
                                size="small" 
                                options={ingredienteSugestoes} 
                                groupBy={o => o.group} 
                                getOptionLabel={o => `${o.nome}${o.fonte ? ` (${o.fonte})` : (o.marca ? ` (${o.marca})` : '')}`} 
                                value={ingredienteSugestoes.find(s => s.id === item.ingrediente_id) || null} 
                                onChange={(_, nv) => nv && handleIngredienteSelect(item.tempId, nv.id, nv)} 
                                onInputChange={(_, v) => setTermoBuscaIngrediente(v)}
                                renderInput={p => <TextField {...p} placeholder="Busque por nome ou marca..." sx={{ bgcolor: 'white' }} />} 
                              />"""

new_autocomplete = """                              <Autocomplete 
                                fullWidth 
                                size="small" 
                                options={ingredienteSugestoes} 
                                loading={buscandoInsumos}
                                groupBy={o => o.group} 
                                getOptionLabel={o => `${o.nome}${o.fonte ? ` (${o.fonte})` : (o.marca ? ` (${o.marca})` : '')}`} 
                                filterOptions={(x) => x} 
                                value={ingredienteSugestoes.find(s => s.id === item.ingrediente_id) || null} 
                                onChange={(_, nv) => nv && handleIngredienteSelect(item.tempId, nv.id, nv)} 
                                onInputChange={(_, v) => setTermoBuscaIngrediente(v)}
                                renderInput={p => (
                                  <TextField 
                                    {...p} 
                                    placeholder="Digite pelo menos 2 letras para buscar..." 
                                    sx={{ bgcolor: 'white' }} 
                                    InputProps={{
                                      ...p.InputProps,
                                      endAdornment: (
                                        <>
                                          {buscandoInsumos ? <CircularProgress color="inherit" size={20} /> : null}
                                          {p.InputProps.endAdornment}
                                        </>
                                      ),
                                    }}
                                  />
                                )} 
                              />"""
content = content.replace(old_autocomplete, new_autocomplete)

old_volume = """                          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                             <Typography variant="caption" color="text.secondary">Volume Total</Typography>
                             <Typography variant="h6" fontWeight="900" color="primary.main">
                               {totalVolume > 0 ? `${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unidExibicao}` : '-'}
                             </Typography>
                          </Grid>
                        </Grid>
                      </Paper>"""

new_volume = """                          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                             <Typography variant="caption" color="text.secondary">Volume Total</Typography>
                             <Typography variant="h6" fontWeight="900" color="primary.main">
                               {totalVolume > 0 ? `${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unidExibicao}` : '-'}
                             </Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                              <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ px: 0, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 1 } }}>
                                <Typography variant="body2" color="primary.main" fontWeight="bold">
                                  + Informações Específicas (Opcional)
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField size="small" fullWidth label="Lote do Fabricante" value={item.loteFabricante || ''} onChange={e => handleNfItemChange(item.tempId, 'loteFabricante', e.target.value)} sx={{ bgcolor: 'white' }} />
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <TextField size="small" fullWidth type="date" label="Data de Fabricação" InputLabelProps={{ shrink: true }} value={item.dataFabricacao || ''} onChange={e => handleNfItemChange(item.tempId, 'dataFabricacao', e.target.value)} sx={{ bgcolor: 'white' }} />
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <TextField size="small" fullWidth type="date" label="Data de Validade" InputLabelProps={{ shrink: true }} value={item.dataValidade || ''} onChange={e => handleNfItemChange(item.tempId, 'dataValidade', e.target.value)} sx={{ bgcolor: 'white' }} />
                                  </Grid>
                                  {modalidade === 'EPI_EPC' && (
                                    <Grid item xs={12} md={4}>
                                      <TextField size="small" fullWidth label="Número do C.A." value={item.caEpi || ''} onChange={e => handleNfItemChange(item.tempId, 'caEpi', e.target.value)} sx={{ bgcolor: 'white' }} />
                                    </Grid>
                                  )}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          </Grid>
                        </Grid>
                      </Paper>"""

content = content.replace(old_volume, new_volume)

with open('app/compras/lancamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Script concluído com sucesso!")
