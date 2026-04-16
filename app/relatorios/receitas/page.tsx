'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useClient } from '@/lib/ClientContext';
import {
  Container, Typography, Box, Button, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, Paper, Divider, LinearProgress,
  Grid, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  ListItemButton, Alert, CircularProgress, TextField, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, useTheme, alpha, TableContainer, MenuItem
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
import NextImage from 'next/image';
import { getTheme } from '@/lib/theme';
import { ThemeProvider } from '@mui/material/styles';
import { format } from 'date-fns';
import CapaRelatorio from '@/components/CapaRelatorio';
import MetodologiasRelatorio from '@/components/MetodologiasRelatorio';
import NutritionalLabel, { LupaFrontalANVISA, RenderBlocoDeclaracoes, GMOIcon } from '@/components/NutritionalLabel';
import { ResultadoCalculo } from '@/lib/types';
import { ptBR } from 'date-fns/locale';

// --- TIPOS ---
interface ItemComposicaoCompleto {
  nome: string;
  peso_liquido_g: number;
  unidade: string;
  fonte?: string | null;
  peso_unitario_g?: number | null;
  alergenicosNames?: string[];
}

interface ReceitaRelatorio {
  id: string;
  nome: string;
  rendimento_total_g: number;
  peso_embalagem_g: number;
  modo_preparo: string;
  modo_conservacao?: string | null;
  foto_url?: string | null;
  tipos_receita?: { nome: string } | null;
  denominacao_venda?: string | null;
  tabelaCalculada?: ResultadoCalculo;
  ingredientesDetalhados?: ItemComposicaoCompleto[];
  updated_at?: string | null;
}

export default function RelatoriosPage() {
  const theme = useTheme();
  const lightTheme = useMemo(() => getTheme('light'), []);
  const { activeClientId, activeClientName, activeClientLogo } = useClient();
  const [receitas, setReceitas] = useState<ReceitaRelatorio[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modoImpressao, setModoImpressao] = useState<'FICHA' | 'NUTRICIONAL' | null>(null);
  const [layoutTabela, setLayoutTabela] = useState<any>('VERTICAL');
  const [layoutLupa, setLayoutLupa] = useState<any>('HORIZONTAL');

  const [searchTerm, setSearchTerm] = useState('');
  const [unidadeInfo, setUnidadeInfo] = useState<any>(null);

  // Carrega lista inicial
  useEffect(() => {
    if (activeClientId) {
      setLoading(true);
      
      // Carrega receitas
      (supabase as any).from('receitas')
        .select('id, nome, rendimento_total_g, peso_embalagem_g, modo_preparo, modo_conservacao, foto_url, denominacao_venda, updated_at, tipos_receita(nome)')
        .eq('cliente_id', activeClientId)
        .order('nome')
        .then(({ data }: any) => {
          if (data) setReceitas(data as any[]);
          setLoading(false);
        });

      // Carrega informações da unidade (RT, CNPJ, Endereço)
      (supabase as any).from('cliente_unidades')
        .select('*')
        .eq('cliente_id', activeClientId)
        .limit(1)
        .single()
        .then(({ data }: any) => {
          if (data) setUnidadeInfo(data);
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

      if (modo === 'FICHA') {
        const { data: comps } = await (supabase as any).from('composicao_receitas')
          .select('item_id, item_type, peso_liquido_g')
          .eq('receita_id', id);

        if (comps && comps.length > 0) {
          const idsIng = comps.filter((c: any) => c.item_type === 'ingrediente').map((c: any) => c.item_id);
          const idsRec = comps.filter((c: any) => c.item_type === 'receita').map((c: any) => c.item_id);

          const [resIng, resRec] = await Promise.all([
            idsIng.length > 0 ? (supabase as any).from('ingredientes').select('id, nome, fonte, peso_unitario_g').in('id', idsIng).is('deleted_at', null) : { data: [] },
            idsRec.length > 0 ? (supabase as any).from('receitas').select('id, nome, peso_embalagem_g').in('id', idsRec) : { data: [] }
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

          receitasAtualizadas[index].ingredientesDetalhados = comps.map((c: any) => ({
            nome: nomeMap.get(c.item_id) || 'Item desconhecido',
            peso_liquido_g: c.peso_liquido_g,
            unidade: 'g',
            fonte: fonteMap.get(c.item_id),
            peso_unitario_g: pesoUnitarioMap.get(c.item_id)
          }));
        }
      }

      // Diagnóstico: Forçar recálculo para garantir dados frescos
      const forceRefresh = true;
      if (!receitasAtualizadas[index].tabelaCalculada || forceRefresh) {
        try {
          console.log(`[DIAGNÓSTICO] Invocando Edge Function para receita: ${id}`);
          const { data } = await supabase.functions.invoke('calcular-nutrientes', { body: { receita_id: id } });
          console.log(`[DIAGNÓSTICO] Resposta da Edge Function:`, data);
          if (data && !data.error) {
            const result = data as ResultadoCalculo;
            if (receitasAtualizadas[index].modo_conservacao) {
              result.declaracoes.modo_conservacao = receitasAtualizadas[index].modo_conservacao;
            }
            receitasAtualizadas[index].tabelaCalculada = result;
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
        <Box 
          className="print-root" 
          sx={{ 
            bgcolor: '#F1F5F9', 
            minHeight: '100vh', 
            py: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            '@media print': {
              bgcolor: '#FFFFFF',
              py: 0
            }
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
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
                  page-break-inside: avoid !important;
                  break-inside: avoid-page !important;
                  min-height: 297mm; 
                  padding: 10mm 15mm; 
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  position: relative;
              }
              .preview-page {
                  page-break-inside: avoid !important;
                  break-inside: avoid-page !important;
              }
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
                padding-bottom: 40mm;
                margin-bottom: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                box-sizing: border-box;
            }
          `}} />

          {/* CONTROLES */}
          <Paper className="no-print" elevation={8} sx={{ position: 'fixed', bottom: 30, zIndex: 9999, px: 3, py: 2, borderRadius: 10, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'background.paper', border: '1px solid #ddd' }}>
            <Typography fontWeight="bold" sx={{ mr: 2 }}>{itensParaImprimir.length} receitas geradas</Typography>
            
            <TextField
              select
              size="small"
              label="Layout Tabela"
              value={layoutTabela}
              onChange={(e) => setLayoutTabela(e.target.value)}
              sx={{ width: 140 }}
            >
              <MenuItem value="VERTICAL">Vertical</MenuItem>
              <MenuItem value="VERTICAL_QUEBRADA">Vert. Quebrada</MenuItem>
              <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
              <MenuItem value="HORIZONTAL_QUEBRADA">Horiz. Quebrada</MenuItem>
              <MenuItem value="LINEAR">Linear</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Layout Lupa"
              value={layoutLupa}
              onChange={(e) => setLayoutLupa(e.target.value)}
              sx={{ width: 140 }}
            >
              <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
              <MenuItem value="VERTICAL">Vertical</MenuItem>
              <MenuItem value="MISTO">Misto</MenuItem>
            </TextField>

            <Button variant="contained" onClick={() => window.print()} startIcon={<Printer />}>IMPRIMIR / PDF</Button>
            <Button variant="outlined" color="inherit" onClick={() => setModoImpressao(null)}>FECHAR</Button>
          </Paper>

          <div className="print-container">
            {/* CAPA DO DOCUMENTO */}
            <CapaRelatorio 
              clientName={activeClientName || 'Cliente'} 
              reportType={modoImpressao === 'FICHA' ? 'LIVRO' : 'CATALOGO'} 
              logoUrl={activeClientLogo}
              showComplianceInfo={modoImpressao === 'NUTRICIONAL'}
              ultimaRevisao={(() => {
                if (itensParaImprimir.length === 0) return undefined;
                const dates = itensParaImprimir.map(r => new Date(r.updated_at || Date.now()));
                const latest = new Date(Math.max(...dates.map(d => d.getTime())));
                return format(latest, "dd/MM/yyyy");
              })()}
              responsavelTecnico={{
                nome: "Admin",
                registro: "CRN: Selecionar Responsável"
              }}
            />

            {/* PÁGINA DE METODOLOGIAS (APENAS CATALOGO) */}
            {modoImpressao === 'NUTRICIONAL' && <MetodologiasRelatorio />}

            {itensParaImprimir.map((receita, index) => (
              <div key={receita.id} className="preview-page page-break">
                
                {/* CABEÇALHO INTEGRADO */}
                <Box sx={{ borderBottom: '1px solid #eee', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#66c8c7', fontWeight: 900, letterSpacing: 1.2 }}>
                    {modoImpressao === 'FICHA' ? 'MANUAL DE PRODUÇÃO' : 'CATÁLOGO NUTRICIONAL'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    REF: {receita.id.substring(0,8).toUpperCase()}
                  </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  {modoImpressao === 'FICHA' ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" fontWeight="900" color="#0F172A" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                          {receita.nome}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Typography variant="subtitle1" color="#66c8c7" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                            {receita.tipos_receita?.nome || 'Receita'}
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, borderColor: '#66c8c7', height: '14px', alignSelf: 'center' }} />
                          <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                            Preparo Profissional
                          </Typography>
                        </Stack>
                      </Box>

                      {/* HERO SECTION: FOTO E DADOS TÉCNICOS */}
                      <Box sx={{ mb: 4 }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: '350px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#f1f5f9',
                            mb: 2,
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                        >
                          <NextImage
                            src={receita.foto_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop'}
                            alt={receita.nome}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </Box>

                        {/* BARRA DE DADOS TÉCNICOS RENOMEADA */}
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            bgcolor: '#F8FAFC', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '16px',
                            display: 'flex',
                            justifyContent: 'space-around',
                            textAlign: 'center'
                          }}
                        >
                          <Box>
                            <Typography variant="caption" fontWeight="bold" color="#64748B" sx={{ display: 'block' }}>PESO TOTAL DA RECEITA</Typography>
                            <Typography variant="h6" fontWeight="800">
                              {receita.rendimento_total_g >= 1000 ? `${(receita.rendimento_total_g / 1000).toFixed(2)} kg` : `${receita.rendimento_total_g} g`}
                            </Typography>
                          </Box>
                          <Divider orientation="vertical" flexItem />
                          <Box>
                            <Typography variant="caption" fontWeight="bold" color="#64748B" sx={{ display: 'block' }}>PESO UNITÁRIO</Typography>
                            <Typography variant="h6" fontWeight="800">
                              {receita.peso_embalagem_g >= 1000 ? `${(receita.peso_embalagem_g / 1000).toFixed(2)} kg` : `${receita.peso_embalagem_g} g`}
                            </Typography>
                          </Box>
                          <Divider orientation="vertical" flexItem />
                          <Box>
                            <Typography variant="caption" fontWeight="bold" color="#64748B" sx={{ display: 'block' }}>RENDIMENTO</Typography>
                            <Typography variant="h6" fontWeight="800" color="#66c8c7">
                              {(() => {
                                const rend = receita.rendimento_total_g / (receita.peso_embalagem_g || 1);
                                if (Math.abs(rend - 1) <= 0.05) return "1 unidade";
                                if (rend > 1.05) {
                                  const roundedRend = Math.round(rend);
                                  return `${roundedRend} Unidades`;
                                }
                                if (Math.abs(rend - 0.5) <= 0.05) return "1/2 unidade";
                                if (Math.abs(rend - 0.25) <= 0.05) return "1/4 unidade";
                                if (Math.abs(rend - 0.75) <= 0.05) return "3/4 unidade";
                                return `${rend.toFixed(1)} unidade`;
                              })()}
                            </Typography>
                          </Box>
                        </Paper>
                      </Box>

                      {/* SEÇÃO VERTICAL: INGREDIENTES EM TÓPICOS */}
                      <Box sx={{ mb: 4 }}>
                        <Box sx={{ borderBottom: '2px solid #66c8c7', mb: 2, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: 1 }}>INGREDIENTES</Typography>
                          <Typography variant="caption" color="text.secondary">Quantidades por Unidade de Fabricação</Typography>
                        </Box>
                        
                        <List disablePadding>
                          {receita.ingredientesDetalhados?.map((ing, i) => {
                            const peso = ing.peso_liquido_g;
                            const formattedWeight = peso >= 1000 ? `${(peso / 1000).toFixed(2)} kg` : `${peso} g`;
                            
                            // Lógica de Unidades (Dual Unit)
                            let unitInfo = "";
                            if (ing.peso_unitario_g && ing.peso_unitario_g > 0) {
                              const units = (peso / ing.peso_unitario_g).toFixed(1).replace('.0', '');
                              unitInfo = `(${units} UN)`;
                            }

                            return (
                              <ListItem key={i} disableGutters sx={{ py: 0.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', bgcolor: '#66c8c7', mr: 2, flexShrink: 0, boxShadow: '0 0 0 2px rgba(102, 200, 199, 0.2)' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, color: '#1e293b' }}>
                                  {ing.nome.charAt(0).toUpperCase() + ing.nome.slice(1).toLowerCase()}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                    {formattedWeight}
                                  </Typography>
                                  {unitInfo && (
                                    <Typography variant="caption" sx={{ color: '#66c8c7', fontWeight: 'bold' }}>
                                      {unitInfo}
                                    </Typography>
                                  )}
                                </Stack>
                              </ListItem>
                            );
                          })}
                        </List>

                        {/* ALÉRGENOS CONSOLIDADOS (PROVENIENTES DO CÁLCULO) */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px' }}>
                          <Typography variant="caption" fontWeight="bold" color="#B45309" sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}>ALERTA DE SEGURANÇA ALIMENTAR</Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#92400E', textTransform: 'uppercase' }}>
                              {(() => {
                                const fullString = receita.tabelaCalculada?.declaracoes.alergenicos || '';
                                console.log(`[DIAGNÓSTICO] String bruta de alérgenos na receita ${receita.nome}: "${fullString}"`);
                                if (!fullString || fullString.trim() === '') return 'NÃO CONTÉM ALÉRGENOS DIRETOS.';

                                if (fullString.includes('NÃO CONTÉM')) return 'NÃO CONTÉM ALÉRGENOS DIRETOS.';

                                // Extrair apenas a parte do "CONTÉM"
                                // O formato da Edge Function é "ALÉRGICOS: CONTÉM X E Y E PODE CONTER Z."
                                const contemMatch = fullString.match(/CONTÉM (.*?)(?= E PODE CONTER| PODE CONTER|$|\.|\!)/i);
                                
                                if (contemMatch && contemMatch[1]) {
                                  return `CONTÉM ${contemMatch[1].trim()}${contemMatch[1].endsWith('.') ? '' : '.'}`;
                                }
                                
                                // Fallback se não encontrar o padrão mas a string existir e não for "NÃO CONTÉM"
                                const cleanString = fullString.replace(/ALÉRGICOS:/i, '').trim();
                                if (cleanString.startsWith('CONTÉM')) {
                                   return cleanString.split(/ E PODE CONTER| PODE CONTER/i)[0].trim();
                                }

                                return cleanString.toUpperCase();
                              })()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* SEÇÃO VERTICAL: MODO DE PREPARO */}
                      <Box sx={{ mb: 4, pageBreakInside: 'avoid' }}>
                        <Box sx={{ borderBottom: '2px solid #66c8c7', mb: 2, pb: 0.5 }}>
                          <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: 1 }}>MODO DE PREPARO</Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: 1.8, 
                            textAlign: 'justify',
                            color: '#334155',
                            fontFamily: 'serif',
                            fontSize: '1rem'
                          }}
                        >
                          {receita.modo_preparo || 'Instruções não detalhadas.'}
                        </Typography>

                        {receita.modo_conservacao && (
                          <Box sx={{ mt: 3, p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>CONSERVAÇÃO & ARMAZENAMENTO</Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#475569' }}>{receita.modo_conservacao}</Typography>
                          </Box>
                        )}
                      </Box>

                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: '-40px', 
                          right: '-20px', 
                          opacity: 0.08, 
                          zIndex: -1,
                          width: '200px',
                          height: '200px'
                        }}
                      >
                        <NextImage src="/logo-cortex.svg" alt="" width={200} height={200} />
                      </Box>
                    </Box>
                  ) : (
                    /* ========================================================== */
                    /* NOVO LAYOUT VERTICALIZADO (CATÁLOGO NUTRICIONAL)          */
                    /* ========================================================== */
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      
                      {/* TÍTULO E DENOMINAÇÃO */}
                      <Box sx={{ textAlign: 'center', mb: 2, width: '100%' }}>
                        <Typography variant="h4" fontWeight="900" color="#0F172A" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                          {receita.nome}
                        </Typography>
                        <Typography variant="subtitle2" color="#66c8c7" sx={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
                          {receita.denominacao_venda || 'Denominação de Venda não cadastrada'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Última Revisão: <strong>{receita.updated_at ? format(new Date(receita.updated_at), "dd/MM/yyyy") : 'N/A'}</strong>
                        </Typography>
                      </Box>

                      {/* FOTO DO PRODUTO CENTRALIZADA (ABAIXO DA REVISÃO) */}
                      <Box
                        sx={{
                          width: '100%',
                          height: '180px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#f1f5f9',
                          mb: 2,
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        <NextImage
                          src={receita.foto_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop'}
                          alt={receita.nome}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>

                      <Divider sx={{ width: '100%', mb: 4 }} />

                      {/* INFORMAÇÕES DE FABRICAÇÃO */}
                      {unidadeInfo && (
                        <Box sx={{ width: '100%', mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                          <Typography variant="caption" fontWeight="900" color="#64748B" sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}>INFORMAÇÕES DE FABRICAÇÃO</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">FABRICADO POR</Typography>
                              <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.75rem' }}>{activeClientName}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>CNPJ: {unidadeInfo.cnpj_completo || 'Não informado'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">ENDEREÇO</Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>{unidadeInfo.endereco_completo || 'Não informado'}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* CONTEÚDO TÉCNICO VERTICAL */}
                      <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
                        
                        {/* LUPAS FOP E ÍCONES (EM CIMA DA TABELA) */}
                        {receita.tabelaCalculada && (
                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                            <LupaFrontalANVISA lupas={receita.tabelaCalculada.lupas} layout={layoutLupa} />
                            
                            {/* ÍCONE DE TRANSGÊNICO (T) SE APLICÁVEL */}
                            {receita.tabelaCalculada.declaracoes.alerta_gmo && (
                              <Box sx={{ textAlign: 'center', ml: 1 }}>
                                <GMOIcon width={36} />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '8px', 
                                    fontWeight: 900, 
                                    display: 'block', 
                                    mt: 0.5,
                                    lineHeight: 1,
                                    color: '#000'
                                  }}
                                >
                                  TRANSGÊNICO
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* TABELA NUTRICIONAL */}
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              border: '1px solid #E2E8F0', 
                              borderRadius: '12px',
                              backgroundColor: '#fff',
                              width: 'fit-content'
                            }}
                          >
                            {receita.tabelaCalculada ? (
                              <NutritionalLabel tabela={receita.tabelaCalculada} modelo={layoutTabela} />
                            ) : (
                              <Typography color="error" fontWeight="bold">Erro: Cálculo Nutricional não disponível.</Typography>
                            )}
                          </Paper>
                        </Box>
                      </Stack>

                      {/* RODAPÉ DA PÁGINA DO ITEM (SIMPLIFICADO) */}
                      <Box sx={{ mt: 6, textAlign: 'center', opacity: 0.5 }}>
                        <Typography variant="caption">
                          ID Técnico: {receita.id.toUpperCase()} • Software Intelligence Platform
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* RODAPÉ INTEGRADO */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NextImage src="/logo-cortex.svg" alt="" width={80} height={24} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>SOFTWARE PLATFORM</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {activeClientName} • Pág. {index + 1}
                  </Typography>
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


