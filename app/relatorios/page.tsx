'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, Paper, Divider, LinearProgress,
  Grid, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  ListItemButton, Alert, CircularProgress, TextField, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, useTheme, alpha, TableContainer
} from '@mui/material';
import {
  Printer,
  BookOpen,
  FileText,
  Download,
  Search,
  ChevronDown,
  FolderOpen
} from 'lucide-react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '@/lib/theme';

import { TabelaVertical, LupaFrontalANVISA, RenderBlocoDeclaracoes } from '@/components/NutritionalLabel';
import { ResultadoCalculo } from '@/lib/types';

// --- TIPOS ---
interface ItemComposicaoCompleto {
  nome: string;
  peso_liquido_g: number;
  unidade: string;
  fonte?: string | null;
  peso_unitario_g?: number | null;
}

interface ReceitaRelatorio {
  id: string;
  nome: string;
  rendimento_total_g: number;
  modo_preparo: string;
  foto_url?: string | null;
  tipos_receita?: { nome: string } | null;
  tabelaCalculada?: ResultadoCalculo;
  ingredientesDetalhados?: ItemComposicaoCompleto[];
}

export default function RelatoriosPage() {
  const theme = useTheme();
  const lightTheme = useMemo(() => getTheme('light'), []);
  const { activeClientId, activeClientName } = useClient();
  const [receitas, setReceitas] = useState<ReceitaRelatorio[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modoImpressao, setModoImpressao] = useState<'FICHA' | 'NUTRICIONAL' | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Carrega lista inicial
  useEffect(() => {
    if (activeClientId) {
      setLoading(true);
      supabase.from('receitas')
        .select('id, nome, rendimento_total_g, modo_preparo, foto_url, tipos_receita(nome)')
        .eq('cliente_id', activeClientId)
        .order('nome')
        .then(({ data }) => {
          if (data) setReceitas(data as any[]);
          setLoading(false);
        });
    }
  }, [activeClientId]);

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === receitas.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(receitas.map(r => r.id)));
  };

  const handleSelectCategory = (itensCategoria: ReceitaRelatorio[]) => {
    const idsCategoria = itensCategoria.map(r => r.id);
    const todosSelecionados = idsCategoria.every(id => selectedIds.has(id));

    const newSet = new Set(selectedIds);
    if (todosSelecionados) {
      idsCategoria.forEach(id => newSet.delete(id));
    } else {
      idsCategoria.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const receitasAgrupadas = useMemo(() => {
    const filtradas = receitas.filter(r =>
      r.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const grupos: Record<string, ReceitaRelatorio[]> = {};
    filtradas.forEach(r => {
      const cat = r.tipos_receita?.nome || 'Sem Categoria';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(r);
    });
    return Object.keys(grupos).sort().reduce((obj, key) => {
      obj[key] = grupos[key];
      return obj;
    }, {} as Record<string, ReceitaRelatorio[]>);
  }, [receitas, searchTerm]);

  // --- PREPARAÇÃO DE DADOS ---
  const prepararImpressao = async (modo: 'FICHA' | 'NUTRICIONAL') => {
    if (selectedIds.size === 0) return alert('Selecione pelo menos uma receita.');

    setGenerating(true);
    setModoImpressao(modo);
    const ids = Array.from(selectedIds);
    let completed = 0;
    const receitasAtualizadas = [...receitas];

    for (const id of ids) {
      const index = receitasAtualizadas.findIndex(r => r.id === id);
      if (index === -1) continue;

      if (modo === 'FICHA' && !receitasAtualizadas[index].ingredientesDetalhados) {
        const { data: comps } = await supabase
          .from('composicao_receitas')
          .select('item_id, item_type, peso_liquido_g')
          .eq('receita_id', id);

        if (comps && comps.length > 0) {
          const idsIng = comps.filter(c => c.item_type === 'ingrediente').map(c => c.item_id);
          const idsRec = comps.filter(c => c.item_type === 'receita').map(c => c.item_id);

          const [resIng, resRec] = await Promise.all([
            idsIng.length > 0 ? supabase.from('ingredientes').select('id, nome, fonte, peso_unitario_g').in('id', idsIng) : { data: [] },
            idsRec.length > 0 ? supabase.from('receitas').select('id, nome').in('id', idsRec) : { data: [] }
          ]);

          const nomeMap = new Map();
          const fonteMap = new Map();
          const pesoUnitarioMap = new Map();

          resIng.data?.forEach((i: any) => {
            nomeMap.set(i.id, i.nome);
            fonteMap.set(i.id, i.fonte);
            pesoUnitarioMap.set(i.id, i.peso_unitario_g);
          });

          resRec.data?.forEach((r: any) => {
            nomeMap.set(r.id, r.nome);
            fonteMap.set(r.id, "Sub-receita");
          });

          receitasAtualizadas[index].ingredientesDetalhados = comps.map(c => ({
            nome: nomeMap.get(c.item_id) || 'Item desconhecido',
            peso_liquido_g: c.peso_liquido_g,
            unidade: 'g',
            fonte: fonteMap.get(c.item_id),
            peso_unitario_g: pesoUnitarioMap.get(c.item_id)
          }));
        }
      }

      if (modo === 'NUTRICIONAL' && !receitasAtualizadas[index].tabelaCalculada) {
        try {
          const { data } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: id } });
          if (data && !data.error) {
            receitasAtualizadas[index].tabelaCalculada = data as ResultadoCalculo;
          }
        } catch (e) {
          console.error(`Erro ao calcular receita ${id}`, e);
        }
      }

      completed++;
      setProgress((completed / ids.length) * 100);
    }

    setReceitas(receitasAtualizadas);
    setGenerating(false);
  };

  // ==========================================
  // MODO IMPRESSÃO (CSS HARDCORE)
  // ==========================================
  if (modoImpressao) {
    const itensParaImprimir = receitas.filter(r => selectedIds.has(r.id));

    return (
      <ThemeProvider theme={lightTheme}>
        <Box className="print-root" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          <style jsx global>{`
          @media print {
            @page { margin: 0; size: A4 portrait; }
            body, html { margin: 0; padding: 0; background-color: white !important; }
            
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            
            .print-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
            }

            .page-break {
                page-break-after: always;
                break-after: page;
                min-height: 297mm; 
                padding: 15mm; 
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }

            /* AQUI: Força a tabela a não quebrar */
            .tabela-nutricional-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }

            .no-print { display: none !important; }
            
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }

          .preview-page {
              width: 210mm;
              min-height: 297mm;
              background: white;
              padding: 15mm;
              margin-bottom: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              box-sizing: border-box;
          }
        `}</style>

          {/* CONTROLES */}
          <Paper className="no-print" elevation={8} sx={{ position: 'fixed', bottom: 30, zIndex: 9999, px: 3, py: 2, borderRadius: 10, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography fontWeight="bold" sx={{ mr: 2 }}>{itensParaImprimir.length} receitas geradas</Typography>
            <Button variant="contained" onClick={() => window.print()} startIcon={<Printer />}>IMPRIMIR / PDF</Button>
            <Button variant="outlined" color="inherit" onClick={() => setModoImpressao(null)}>FECHAR</Button>
          </Paper>

          {/* CONTAINER DE IMPRESSÃO */}
          <div className="print-container">
            {itensParaImprimir.map((receita, index) => (
              <div key={receita.id} className="preview-page page-break">

                {/* CABEÇALHO */}
                <Box sx={{ borderBottom: '2px solid #000', pb: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Box>
                    <Typography variant="caption" sx={{ letterSpacing: 2, fontWeight: 'bold', color: '#666' }}>
                      {activeClientName?.toUpperCase() || 'EMPRESA'} • {modoImpressao === 'FICHA' ? 'PRODUÇÃO' : 'ROTULAGEM'}
                    </Typography>
                    <Typography variant="h4" fontWeight="900" sx={{ lineHeight: 1, mt: 1 }}>
                      {receita.nome}
                    </Typography>
                    {receita.tipos_receita && (
                      <Chip label={receita.tipos_receita.nome} size="small" variant="outlined" sx={{ mt: 1, borderRadius: 1, fontWeight: 'bold' }} />
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">Rendimento: {receita.rendimento_total_g}g</Typography>
                    <Typography variant="caption" color="text.secondary">REF: {receita.id.slice(0, 6).toUpperCase()}</Typography>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }}>

                  {modoImpressao === 'FICHA' ? (
                    <Stack spacing={4}>
                      {/* TABELA DE INGREDIENTES */}
                      <Box sx={{ border: '1px solid #000' }}>
                        <Box sx={{ borderBottom: '1px solid #000', p: 1 }}>
                          <Typography variant="caption" fontWeight="bold" align="center" display="block" color="text.primary">COMPOSIÇÃO & INGREDIENTES</Typography>
                        </Box>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #000' }}>Item</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '1px solid #000', width: '120px' }}>Peso Líq. (g)</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: '1px solid #000', width: '120px' }}>Uso Sugerido</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {receita.ingredientesDetalhados?.map((ing, idx) => {
                                let unidadesText = '-';
                                if (ing.peso_unitario_g && ing.peso_unitario_g > 0) {
                                  const qtd = ing.peso_liquido_g / ing.peso_unitario_g;
                                  unidadesText = Math.abs(qtd - Math.round(qtd)) < 0.05 ? `${Math.round(qtd)} un` : `~${qtd.toFixed(1)} un`;
                                }
                                return (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ borderBottom: '1px solid #eee' }}>
                                      <Typography variant="body2" fontWeight={500}>{ing.nome}</Typography>
                                      {ing.fonte && <Typography component="span" sx={{ display: 'block', fontSize: '0.6rem', color: '#666' }}>[{ing.fonte}]</Typography>}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>{ing.peso_liquido_g}</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.85rem', borderBottom: '1px solid #eee' }}>{unidadesText}</TableCell>
                                  </TableRow>
                                );
                              })}
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>TOTAL FINAL</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>{receita.rendimento_total_g}</TableCell>
                                <TableCell sx={{ borderBottom: 'none' }} />
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>

                      {/* MODO DE PREPARO */}
                      <Box sx={{ border: '1px solid #000' }}>
                        <Box sx={{ borderBottom: '1px solid #000', p: 1 }}>
                          <Typography variant="caption" fontWeight="bold" align="center" display="block" color="text.primary">INSTRUÇÕES DE PREPARO</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                          <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'justify', color: 'text.primary' }}>
                            {receita.modo_preparo || 'Sem instruções cadastradas.'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                  ) : (
                    // ===============================================
                    // MODO NUTRICIONAL (LAYOUT EM DUAS COLUNAS)
                    // ===============================================
                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>

                      {/* COLUNA ESQUERDA: TABELA NUTRICIONAL (PRIORIDADE TOTAL) */}
                      <Box
                        className="tabela-nutricional-container"
                        sx={{
                          flex: '0 0 auto', // Não cresce nem diminui, ocupa o tamanho exato da tabela
                          minWidth: '320px' // Largura mínima segura
                        }}
                      >
                        {receita.tabelaCalculada ? (
                          <TabelaVertical tabela={receita.tabelaCalculada} />
                        ) : (
                          <Typography color="error">Cálculo pendente.</Typography>
                        )}
                      </Box>

                      {/* COLUNA DIREITA: CONTEXTO E ALERGENICOS */}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {receita.tabelaCalculada ? (
                          <>
                            {/* PAINEL FRONTAL */}
                            <Box sx={{ border: '1px solid #000', p: 2, position: 'relative' }}>
                              <Typography variant="caption" sx={{ position: 'absolute', top: 0, left: 0, borderRight: '1px solid #000', borderBottom: '1px solid #000', px: 1, py: 0.2, fontWeight: 'bold', fontSize: '0.6rem', color: 'text.primary' }}>
                                PAINEL FRONTAL (RDC 429)
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, mt: 1 }}>
                                {/* Layout Horizontal para economizar altura */}
                                <LupaFrontalANVISA lupas={receita.tabelaCalculada.lupas} areaPainelCm2={null} layout="HORIZONTAL" />
                              </Box>
                            </Box>

                            {/* DIZERES LEGAIS */}
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ borderBottom: '2px solid black' }}>
                                DIZERES LEGAIS (RDC 727)
                              </Typography>
                              <Box sx={{ border: '1px solid #000', p: 2 }}>
                                <RenderBlocoDeclaracoes declaracoes={receita.tabelaCalculada.declaracoes} />
                              </Box>
                            </Box>

                            {/* ALEGAÇÕES (INC) */}
                            {receita.tabelaCalculada.alegacoes.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ borderBottom: '1px solid green', color: 'green' }}>
                                  INC (Informação Nutricional Complementar)
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {receita.tabelaCalculada.alegacoes.map(a => (
                                    <Chip key={a} label={a} size="small" variant="outlined" sx={{ fontWeight: 'bold', color: 'green', borderColor: 'green' }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </>
                        ) : null}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* RODAPÉ */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Documento gerado pelo sistema NutriDev</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date().toLocaleDateString()} • Pág. {index + 1}</Typography>
                </Box>

              </div>
            ))}
          </div>
        </Box>
      </ThemeProvider>
    );
  }

  // ==========================================
  // MODO TELA
  // ==========================================
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Printer size={32} className="text-primary" />
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
            Central de Relatórios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Geração de documentos técnicos e legais.
          </Typography>
        </Box>
      </Box>

      {!activeClientId ? <Alert severity="warning">Selecione um Cliente Ativo.</Alert> : (
        <>
          <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined" size="large" onClick={() => prepararImpressao('FICHA')} disabled={generating || selectedIds.size === 0} fullWidth
                  sx={{ height: '100px', display: 'flex', flexDirection: 'column', gap: 1, border: '2px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
                >
                  <BookOpen size={28} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">LIVRO DE RECEITAS</Typography>
                    <Typography variant="caption" color="text.secondary">Fichas Técnicas para Produção</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined" size="large" onClick={() => prepararImpressao('NUTRICIONAL')} disabled={generating || selectedIds.size === 0} fullWidth
                  sx={{ height: '100px', display: 'flex', flexDirection: 'column', gap: 1, border: '2px solid', borderColor: 'divider', '&:hover': { borderColor: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.05) } }}
                >
                  <FileText size={28} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">CATÁLOGO NUTRICIONAL</Typography>
                    <Typography variant="caption" color="text.secondary">Tabelas e Rótulos (Vetor)</Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>
            {generating && <Box sx={{ mt: 4 }}><Typography variant="caption" fontWeight="bold">PROCESSANDO DADOS... {Math.round(progress)}%</Typography><LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} /></Box>}
          </Paper>

          <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TextField
              fullWidth size="small" placeholder="Buscar receita para imprimir..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color="gray" /></InputAdornment> }} sx={{ bgcolor: 'background.default' }}
            />
          </Paper>

          <Paper variant="outlined" sx={{ bgcolor: 'background.paper', overflow: 'hidden', borderRadius: 2 }}>
            <List dense sx={{ py: 0 }}>
              <ListItem disablePadding sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider', py: 1 }}>
                <ListItemButton onClick={handleSelectAll}>
                  <ListItemIcon><Checkbox edge="start" checked={receitas.length > 0 && selectedIds.size === receitas.length} indeterminate={selectedIds.size > 0 && selectedIds.size < receitas.length} tabIndex={-1} /></ListItemIcon>
                  <ListItemText primary={<Typography fontWeight="bold" color="primary.dark">SELECIONAR TODAS ({receitas.length})</Typography>} />
                </ListItemButton>
              </ListItem>
            </List>

            {loading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
              <Box>
                {Object.entries(receitasAgrupadas).map(([categoria, itens]) => {
                  const todosCatSelecionados = itens.every(r => selectedIds.has(r.id));
                  const algumCatSelecionado = itens.some(r => selectedIds.has(r.id));

                  return (
                    <Accordion key={categoria} defaultExpanded elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 }, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                          <Checkbox edge="start" checked={todosCatSelecionados} indeterminate={!todosCatSelecionados && algumCatSelecionado} onChange={() => handleSelectCategory(itens)} sx={{ mr: 2 }} />
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <FolderOpen size={18} color={theme.palette.text.secondary} />
                            <Typography fontWeight="bold" color="text.primary">{categoria}</Typography>
                            <Chip label={itens.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                          </Stack>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <List dense disablePadding>
                          {itens.map(r => (
                            <ListItem key={r.id} disablePadding divider sx={{ pl: 9 }}>
                              <ListItemButton onClick={() => handleToggleSelect(r.id)} selected={selectedIds.has(r.id)}>
                                <ListItemIcon><Checkbox edge="start" checked={selectedIds.has(r.id)} tabIndex={-1} /></ListItemIcon>
                                <ListItemText primary={<Typography fontWeight="500">{r.nome}</Typography>} secondary={`Rendimento: ${r.rendimento_total_g}g`} />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Box>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
}