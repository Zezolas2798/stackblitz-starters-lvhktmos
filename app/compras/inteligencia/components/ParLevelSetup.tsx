"use client"

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { supabase } from '@/lib/supabaseClient'

interface LogisticsItem {
  id: string;
  nome: string;
  categoria: string;
  demandaMRP: number;  // Demanda futura via Cardápios / Produção (em Kg)
  adu: number;         // Fallback manual (em Kg/Dia)
  leadTime: number;    // Dias
  safetyStockPct: number; // Porcentagem de 0 a 100
  estoqueAtual: number; // Em g/ml
}

export default function ParLevelSetup() {
  const [items, setItems] = useState<LogisticsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('gerencial_compras_kraljic_base')
      .select('*')

    if (!error && data) {
      const formattedItems = data.map((row: any) => ({
        id: row.ingrediente_id,
        nome: row.ingrediente_nome,
        categoria: 'Insumo', 
        demandaMRP: row.demanda_programada_kg || 0,
        adu: row.uso_medio_diario || 0,
        leadTime: row.lead_time_considerado || 3,
        safetyStockPct: row.estoque_seguranca_perc || 20,
        estoqueAtual: row.estoque_atual || 0
      }))
      setItems(formattedItems)
    } else {
      console.error("Erro ao buscar dados logísticos:", error)
    }
    setLoading(false)
  }

  const handleUpdate = async (id: string, field: 'adu' | 'safetyStockPct', value: string) => {
    const numValue = parseFloat(value) || 0
    setItems(items.map(item => item.id === id ? { ...item, [field]: numValue } : item))

    const dbField = field === 'adu' ? 'uso_medio_diario' : 'estoque_seguranca_perc'
    await supabase.from('ingredientes').update({ [dbField]: numValue }).eq('id', id)
  }

  const calcularParLevel = (item: LogisticsItem) => {
    // LÓGICA DE PRIORIZAÇÃO DEMANDA (MRP > ADU Histórico)
    const isMRPAtivo = item.demandaMRP > 0
    const base = isMRPAtivo ? item.demandaMRP : (item.adu * item.leadTime)
    const safetyQty = base * (item.safetyStockPct / 100)
    return Math.ceil(base + safetyQty)
  }

  const getStatus = (estoqueAtual: number, parLevelKg: number) => {
    const parLevelG = parLevelKg * 1000
    if (parLevelKg === 0) return { label: "N/A", color: "default" } as const
    if (estoqueAtual === 0) return { label: "Ruptura", color: "error" } as const
    if (estoqueAtual <= parLevelG * 0.3) return { label: "Crítico", color: "error" } as const
    if (estoqueAtual <= parLevelG * 0.8) return { label: "Atenção", color: "warning" } as const
    if (estoqueAtual > parLevelG * 1.5) return { label: "Excesso", color: "info" } as const
    return { label: "Adequado", color: "success" } as const
  }

  const formatarQtd = (valorG: number) => {
    if (valorG >= 1000) return `${(valorG / 1000).toFixed(2)} Kg/L`
    return `${valorG.toFixed(0)} g/ml`
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Análise de Par Level (Integração MRP)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        O sistema extrai sua <strong>Demanda Programada (MRP)</strong> avaliando as saídas projetadas dos seus Cardápios e Produções para os dias do Lead Time do fornecedor.<br/>
        Caso o ingrediente não seja um item pilar do cardápio, a fórmula usa seu <strong>Consumo Avulso</strong> (Plano B) como fallback de segurança.
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell>Insumo</TableCell>
                <TableCell align="center">
                  <Tooltip title="Demanda exata exigida pelo seu Cardápio / Produção agendada!">
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px dashed' }}>
                      Demanda Prog. (MRP)
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Consumo Histórico de Fallback (ADU) para itens sem Ficha Técnica">
                    <Typography variant="caption" sx={{ borderBottom: '1px dashed', cursor: 'help' }}>
                      Padrão Avulso / Dia
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">Lead Time (Dias)</TableCell>
                <TableCell align="center">Segurança (%)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Par Level / Alvo</TableCell>
                <TableCell align="center">Estoque Atual</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const isMRPAtivo = item.demandaMRP > 0
                const parLevelKg = calcularParLevel(item)
                const status = getStatus(item.estoqueAtual, parLevelKg)

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{item.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.categoria}</Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={isMRPAtivo ? 'bold' : 'normal'} color={isMRPAtivo ? 'primary.main' : 'text.disabled'}>
                        {isMRPAtivo ? formatarQtd(item.demandaMRP * 1000) : 'Sem agendamento'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <TextField 
                          size="small" 
                          type="number"
                          disabled={isMRPAtivo}
                          value={item.adu} 
                          onChange={(e) => handleUpdate(item.id, 'adu', e.target.value)}
                          sx={{ width: 80, opacity: isMRPAtivo ? 0.5 : 1 }}
                          inputProps={{ step: "0.1", min: "0" }}
                        />
                        <Typography variant="caption" color="text.secondary">Kg/L</Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      <Tooltip title="Lead Time definido na ficha Global do(s) Fornecedor(es) deste item.">
                        <TextField 
                          size="small" 
                          type="number"
                          disabled
                          value={item.leadTime} 
                          sx={{ width: 80 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">d</InputAdornment>,
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <TextField 
                        size="small" 
                        type="number"
                        value={item.safetyStockPct} 
                        onChange={(e) => handleUpdate(item.id, 'safetyStockPct', e.target.value)}
                        sx={{ width: 80 }}
                        inputProps={{ step: "1", min: "0", max: "100" }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        {formatarQtd(parLevelKg * 1000)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body1">
                        {formatarQtd(item.estoqueAtual)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip 
                        label={status.label} 
                        color={status.color} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>

                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  )
}
