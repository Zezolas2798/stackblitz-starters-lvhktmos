"use client"

import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Tooltip, Chip, Grid, Divider, useTheme, CircularProgress } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import { supabase } from '@/lib/supabaseClient'

interface KraljicItem {
  id: string;
  nome: string;
  riscoAbastecimento: number;
  impactoFinanceiro: number;
  quadrante: string;
}

export default function KraljicMatrix() {
  const theme = useTheme()
  const [items, setItems] = useState<KraljicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('gerencial_compras_kraljic_base').select('*')
    if (data && !error) {
      // Define teto de gasto para normalizar o eixo Y (Impacto Financeiro 0-100)
      const spends = data.map((d: any) => (d.custo_referencia || 0) * (d.uso_medio_diario || 0) * 30)
      const maxSpend = Math.max(...spends, 1)

      const formatted = data.map((row: any) => {
        const monthlySpend = (row.custo_referencia || 0) * (row.uso_medio_diario || 0) * 30
        const impactoFinanceiro = Math.round((monthlySpend / maxSpend) * 100)
        
        // Risco Base 100%. Cai 25% pra cada fornecedor homologado. Sobe 1.5% pra cada dia de Lead Time.
        let riscoAbastecimento = 100 - ((row.fornecedores_ativos || 0) * 25) + ((row.lead_time_considerado || 3) * 1.5)
        riscoAbastecimento = Math.min(100, Math.max(5, Math.round(riscoAbastecimento)))

        // Definir Quadrante
        let quadrante = "Rotineiro"
        if (impactoFinanceiro >= 50 && riscoAbastecimento >= 50) quadrante = "Estrategico"
        else if (impactoFinanceiro >= 50 && riscoAbastecimento < 50) quadrante = "Alavancagem"
        else if (impactoFinanceiro < 50 && riscoAbastecimento >= 50) quadrante = "Gargalo"

        return {
          id: row.ingrediente_id,
          nome: row.ingrediente_nome,
          riscoAbastecimento,
          impactoFinanceiro,
          quadrante
        }
      })
      setItems(formatted)
    }
    setLoading(false)
  }

  // Cores de fundo e identificação dos quadrantes
  const quadrantsDef = {
    Estrategico: { title: "Estratégicos", color: theme.palette.error.light, desc: "Parcerias de longo prazo, alto impacto, alto risco." },
    Gargalo: { title: "Gargalo", color: theme.palette.warning.light, desc: "Mitigar risco, diversificar fornecedores, acumular estoques." },
    Alavancagem: { title: "Alavancagem", color: theme.palette.info.light, desc: "Leilão reverso, pressão de preço, alto impacto, baixo risco." },
    Rotineiro: { title: "Não Críticos / Rotineiros", color: theme.palette.success.light, desc: "Automatizar, consolidar, minimizar tempo." },
  }

  const handlePointClick = (quadrante: string) => {
    setSelectedQuadrant(selectedQuadrant === quadrante ? null : quadrante)
  }

  const filteredItems = selectedQuadrant ? items.filter(i => i.quadrante === selectedQuadrant) : items

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        Matriz de Kraljic
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Representação gráfica do portfólio de compras. Eixo Y representa o Impacto Financeiro (CMV/Importância) e o Eixo X representa o Risco de Fornecimento (Dificuldade Logística/Escassez).
      </Typography>

      <Grid container spacing={4}>
        {/* Esquerda: A Matriz Visual */}
        <Grid item xs={12} md={7}>
          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            aspectRatio: '1/1',
            maxWidth: 600,
            borderLeft: `2px solid ${theme.palette.divider}`,
            borderBottom: `2px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 1
          }}>
            {/* Eixos Textuais */}
            <Typography variant="caption" sx={{ position: 'absolute', top: -20, left: 0, fontWeight: 'bold' }}>
              Alto Impacto Financeiro
            </Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: -25, right: 0, fontWeight: 'bold' }}>
              Alto Risco Abastecimento
            </Typography>

            {/* Divisões Centrais (Cruz) */}
            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: `1px dashed ${theme.palette.divider}` }} />
            <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: `1px dashed ${theme.palette.divider}` }} />

            {/* Labels de Quadrante no Fundo */}
            <Typography variant="caption" sx={{ position: 'absolute', top: '20%', left: '20%', color: 'text.disabled', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>ALAVANCAGEM</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', top: '20%', right: '20%', color: 'text.disabled', transform: 'translate(50%, -50%)', fontWeight: 'bold' }}>ESTRATÉGICOS</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: '20%', left: '20%', color: 'text.disabled', transform: 'translate(-50%, 50%)', fontWeight: 'bold' }}>ROTINEIROS</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', bottom: '20%', right: '20%', color: 'text.disabled', transform: 'translate(50%, 50%)', fontWeight: 'bold' }}>GARGALO</Typography>

            {/* Plot dos Itens */}
            {items.map((item) => (
              <Tooltip key={item.id} title={`${item.nome} (Impacto: ${item.impactoFinanceiro}, Risco: ${item.riscoAbastecimento})`} arrow>
                <Box
                  onClick={() => handlePointClick(item.quadrante)}
                  sx={{
                    position: 'absolute',
                    left: `${item.riscoAbastecimento}%`,
                    bottom: `${item.impactoFinanceiro}%`,
                    width: selectedQuadrant === item.quadrante || !selectedQuadrant ? 16 : 10,
                    height: selectedQuadrant === item.quadrante || !selectedQuadrant ? 16 : 10,
                    borderRadius: '50%',
                    bgcolor: (theme) => quadrantsDef[item.quadrante as keyof typeof quadrantsDef].color,
                    transform: 'translate(-50%, 50%)',
                    cursor: 'pointer',
                    boxShadow: 2,
                    zIndex: selectedQuadrant === item.quadrante ? 10 : 1,
                    transition: 'all 0.2s',
                    opacity: selectedQuadrant && selectedQuadrant !== item.quadrante ? 0.3 : 1
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Grid>

        {/* Direita: Dados Detalhados */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedQuadrant ? quadrantsDef[selectedQuadrant as keyof typeof quadrantsDef].title : "Todos os Insumos"}
            </Typography>
            {selectedQuadrant && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {quadrantsDef[selectedQuadrant as keyof typeof quadrantsDef].desc}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filteredItems.map(item => (
                <Chip 
                  key={item.id} 
                  label={item.nome} 
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: quadrantsDef[item.quadrante as keyof typeof quadrantsDef].color,
                    backgroundColor: `${quadrantsDef[item.quadrante as keyof typeof quadrantsDef].color}1A` // 1A is ~10% opacity hex
                  }}
                />
              ))}
            </Box>

            {filteredItems.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <WarningIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography>Nenhum item alocado neste quadrante.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
