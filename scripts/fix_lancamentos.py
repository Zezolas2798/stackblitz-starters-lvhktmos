import re

with open('app/compras/lancamentos/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix search effect
old_effect = """  useEffect(() => {
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
  }, [termoBuscaIngrediente, activeClientId, modalidade]);"""

new_effect = """  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setBuscandoInsumos(true);
      try {
        if (modalidade === 'ALIMENTOS') {
          let query = (supabase as any)
            .from('ingredientes')
            .select('id, nome, fonte, peso_unitario_g')
            .eq('cliente_id', activeClientId)
            .is('deleted_at', null)
            .limit(20);
            
          if (termoBuscaIngrediente) {
            query = query.ilike('nome', `%${termoBuscaIngrediente}%`);
          }
            
          const { data } = await query;
          if (data) setIngredienteSugestoes(data.map((i: any) => ({ ...i, group: '📦 Insumos Disponíveis' })));
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
          
          let query = (supabase as any)
            .from('materiais')
            .select('id, nome, marca, tipo_material')
            .eq('cliente_id', activeClientId)
            .eq('tipo_material', materialType)
            .is('ativo', true)
            .limit(20);
            
          if (termoBuscaIngrediente) {
            query = query.ilike('nome', `%${termoBuscaIngrediente}%`);
          }
            
          const { data } = await query;
            
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
              group: visualMap[m.tipo_material] || '📂 Materiais Disponíveis' 
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
  }, [termoBuscaIngrediente, activeClientId, modalidade]);"""

content = content.replace(old_effect, new_effect)

# Fix Autocomplete placeholder
old_autocomplete_text = 'placeholder="Digite pelo menos 2 letras para buscar..."'
new_autocomplete_text = 'placeholder="Busque por nome ou marca..."'
content = content.replace(old_autocomplete_text, new_autocomplete_text)

# We want to change the visual information depending on modalidade
# For ALIMENTOS, EMBALAGENS, LIMPEZA, etc.
# I will use conditional rendering in the AccordionDetails
old_accordion = """                              <AccordionDetails sx={{ px: 0, pt: 0 }}>
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
                              </AccordionDetails>"""

new_accordion = """                              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <TextField size="small" fullWidth label="Lote do Fabricante" value={item.loteFabricante || ''} onChange={e => handleNfItemChange(item.tempId, 'loteFabricante', e.target.value)} sx={{ bgcolor: 'white' }} />
                                  </Grid>
                                  
                                  {['ALIMENTOS', 'EMBALAGENS', 'PRIMEIROS_SOCORROS'].includes(modalidade) && (
                                    <>
                                      <Grid item xs={12} md={4}>
                                        <TextField size="small" fullWidth type="date" label="Data de Fabricação" InputLabelProps={{ shrink: true }} value={item.dataFabricacao || ''} onChange={e => handleNfItemChange(item.tempId, 'dataFabricacao', e.target.value)} sx={{ bgcolor: 'white' }} />
                                      </Grid>
                                      <Grid item xs={12} md={4}>
                                        <TextField size="small" fullWidth type="date" label="Data de Validade" InputLabelProps={{ shrink: true }} value={item.dataValidade || ''} onChange={e => handleNfItemChange(item.tempId, 'dataValidade', e.target.value)} sx={{ bgcolor: 'white' }} />
                                      </Grid>
                                    </>
                                  )}
                                  
                                  {modalidade === 'EPI_EPC' && (
                                    <Grid item xs={12} md={4}>
                                      <TextField size="small" fullWidth label="Número do C.A. (EPI)" value={item.caEpi || ''} onChange={e => handleNfItemChange(item.tempId, 'caEpi', e.target.value)} sx={{ bgcolor: 'white' }} />
                                    </Grid>
                                  )}
                                </Grid>
                              </AccordionDetails>"""

content = content.replace(old_accordion, new_accordion)

with open('app/compras/lancamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates applied.")
