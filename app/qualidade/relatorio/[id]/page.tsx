'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Container, Typography, Box, Button, Paper, Grid, CircularProgress, 
  Alert, Chip, Divider, Avatar, Card, CardContent, ToggleButton, ToggleButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, alpha, Stack
} from '@mui/material';
import { 
  ArrowLeft, CheckCircle, XCircle, MinusCircle, 
  Printer, Calendar, User, FileText, Camera, LayoutList, FileSpreadsheet, BarChart3, ChevronRight, Info
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, ReferenceArea, ReferenceLine 
} from 'recharts';
import { ChartDefinitions, PremiumBar, getGradientUrl } from '@/components/charts/ChartStyles';

type ViewMode = 'PADRAO' | 'EXECUTIVO' | 'ANALITICO';

// Componente para labels do Recharts (SVG) - Inclinação Simples
function CustomXAxisTick(props: any) {
    const { x, y, payload } = props;
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={14}
                dx={-4}
                textAnchor="end"
                fill="#444"
                transform="rotate(-45)"
                style={{ fontSize: 11, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}
            >
                {payload.value}
            </text>
        </g>
    );
}

export default function RelatorioAuditoriaPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const auditId = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>('PADRAO');
  const [auditoria, setAuditoria] = useState<any>(null);
  const [secoes, setSecoes] = useState<any[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [unidade, setUnidade] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auditId) loadRelatorio();
  }, [auditId]);

  const loadRelatorio = async () => {
    setLoading(true);
    try {
        // 1. Dados da Auditoria com join de perfis
        const { data: auditData, error: auditErr } = await supabase
            .from('checklist_execucoes')
            .select(`
                *, 
                checklist_modelos (titulo, descricao),
                profiles:responsavel_id (full_name)
            `)
            .eq('id', auditId)
            .single();
        if (auditErr) throw auditErr;

        // Map profile name to auditor_nome
        if ((auditData as any).profiles) {
            (auditData as any).auditor_nome = (auditData as any).profiles.full_name;
        }
        setAuditoria(auditData);

        // 3. Respostas
        const { data: respData } = await supabase
            .from('checklist_respostas')
            .select('*')
            .eq('auditoria_id', auditId);
        
        const mapa: Record<string, any> = {};
        if (respData) {
            respData.forEach((r: any) => mapa[r.item_id] = r);
        }
        setRespostas(mapa);

        // 2. Estrutura (Perguntas) - COM DEDUPLICAÇÃO VIA FRONTEND
        const { data: secoesRaw, error: secoesErr } = await supabase
            .from('checklist_secoes')
            .select(`*, checklist_itens (*)`)
            .eq('modelo_id', auditData.modelo_id)
            .order('ordem');
        if (secoesErr) throw secoesErr;

        // Lógica de Agrupamento por Título de Seção e Texto de Pergunta
        const secoesMapeadas: Record<string, any> = {};

        secoesRaw.forEach((s: any) => {
            if (!secoesMapeadas[s.titulo]) {
                secoesMapeadas[s.titulo] = {
                    ...s,
                    checklist_itens: []
                };
            }

            const secaoExistente = secoesMapeadas[s.titulo];
            const itensMapeados: Record<string, any> = {};

            // Indexa itens já existentes na seção pelo texto da pergunta
            secaoExistente.checklist_itens.forEach((i: any) => {
                itensMapeados[i.texto_pergunta] = i;
            });

            (s.checklist_itens || []).forEach((item: any) => {
                if (!itensMapeados[item.texto_pergunta]) {
                    // Novo item (ou primeira ocorrência do texto)
                    const novoItem = { ...item, ids_originais: [item.id] };
                    secaoExistente.checklist_itens.push(novoItem);
                    itensMapeados[item.texto_pergunta] = novoItem;
                } else {
                    // Duplicata encontrada: anexa o ID original para busca de resposta posterior
                    itensMapeados[item.texto_pergunta].ids_originais.push(item.id);
                }
            });
        });

        // Converte o mapa de volta para array e ordena itens internamente
        const secoesFinais = Object.values(secoesMapeadas).map((s: any) => ({
            ...s,
            checklist_itens: s.checklist_itens.sort((a: any, b: any) => a.ordem - b.ordem)
        })).sort((a: any, b: any) => a.ordem - b.ordem);

        setSecoes(secoesFinais);

        // 4. Dados da Unidade (Responsável Técnico)
        if (auditData.unidade_id) {
            const { data: unitData } = await supabase
                .from('cliente_unidades')
                .select('*')
                .eq('id', auditData.unidade_id)
                .single();
            if (unitData) setUnidade(unitData);
        }

    } catch (err: any) {
        console.error('Erro ao carregar relatório:', err);
    } finally {
        setLoading(false);
    }
  };

  // --- Lógica de Dados para Gráficos ---
  const stats = useMemo(() => {
      let conform = 0;
      let nonConform = 0;
      let na = 0;
      const sectionStats: any[] = [];

      secoes.forEach(s => {
          let sConform = 0;
          let sTotal = 0;
          s.checklist_itens.forEach((item: any) => {
              // Busca resposta em qualquer um dos IDs originais vinculados a este texto
              const resp = item.ids_originais?.map((id: string) => respostas[id]).find((r: any) => r !== undefined);
              
              if (!resp) {
                  // Só é considerado não respondido se nenhum dos IDs tiver resposta
                  if (item.obrigatorio) {
                      nonConform++;
                      sTotal++;
                  }
                  return;
              }

              if (resp.nao_se_aplica) {
                  na++;
                  return;
              }

              if (resp.resposta_valor === 'CONFORME') {
                  conform++;
                  sConform++;
              } else if (resp.resposta_valor === 'NAO_CONFORME') {
                  nonConform++;
              }
              sTotal++;
          });
          if (sTotal > 0) {
              sectionStats.push({
                  name: s.titulo,
                  compliance: Math.round((sConform / sTotal) * 100),
                  color: s.cor || theme.palette.primary.main
              });
          }
      });

      // Ordenar por conformidade decrescente conforme solicitado
      sectionStats.sort((a, b) => b.compliance - a.compliance);

      const total = conform + nonConform;
      const pct = total > 0 ? Math.round((conform / total) * 100) : 0;

      return {
          overall: [
              { name: 'Conforme', value: conform, color: '#10b981' },
              { name: 'Não Conforme', value: nonConform, color: '#ef4444' }
          ],
          sections: sectionStats,
          pct,
          conform,
          nonConform,
          na
      };
  }, [secoes, respostas]);

  const nonConformItems = useMemo(() => {
      const ncs: any[] = [];
      secoes.forEach(s => {
          s.checklist_itens.forEach((item: any) => {
              const resp = item.ids_originais?.map((id: string) => respostas[id]).find((r: any) => r !== undefined);
              // Inclui itens explicitamente marcados como NC OU itens obrigatórios sem resposta em nenhum dos IDs
              if (resp?.resposta_valor === 'NAO_CONFORME' || (item.obrigatorio && !resp)) {
                  ncs.push({ ...item, resp: resp || { comentario: 'ITEM OBRIGATÓRIO NÃO RESPONDIDO' }, secao: s.titulo });
              }
          });
      });
      return ncs;
  }, [secoes, respostas]);

  // --- COMPONENTES DE VISUALIZAÇÃO ---

  const renderValorResposta = (item: any, resp: any) => {
      if (!resp) {
          return (
              <Chip 
                  icon={<Info size={14} />} 
                  label="Não respondido" 
                  color={item.obrigatorio ? "error" : "default"} 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontStyle: item.obrigatorio ? 'normal' : 'italic', fontWeight: item.obrigatorio ? 'bold' : 'normal' }}
              />
          );
      }
      if (resp.nao_se_aplica) return <Chip icon={<MinusCircle size={14}/>} label="N.A." size="small" variant="outlined" />;

      if (item.tipo_resposta === 'CONFORME_NAOCONFORME') {
          if (resp.resposta_valor === 'CONFORME') return <Chip icon={<CheckCircle size={14}/>} label="Conforme" color="success" size="small" />;
          if (resp.resposta_valor === 'NAO_CONFORME') return <Chip icon={<XCircle size={14}/>} label="Não Conforme" color="error" size="small" />;
      }
      
      if (item.tipo_resposta === 'TEMPERATURA') {
          return <Typography fontWeight="bold">{resp.resposta_valor}°C</Typography>;
      }

      return <Typography fontWeight="bold">{resp.resposta_valor}</Typography>;
  };

  // 1. VISUALIZAÇÃO PADRÃO (Cards Detalhados)
  const StandardView = () => (
      <Box mt={2}>
          {secoes.map((secao) => (
            <Box key={secao.id} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, px: 1, borderLeft: `4px solid ${theme.palette.primary.main}`, fontWeight: 'bold' }}>
                    {secao.titulo}
                </Typography>
                {secao.checklist_itens.map((item: any) => {
                    const resp = item.ids_originais?.map((id: string) => respostas[id]).find((r: any) => r !== undefined);
                    const isNC = resp?.resposta_valor === 'NAO_CONFORME';
                    return (
                        <Card key={item.id} variant="outlined" sx={{ mb: 1.5, borderLeft: isNC ? '4px solid #ef4444' : '1px solid #ddd' }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                <Grid container alignItems="flex-start" spacing={2}>
                                    <Grid item xs={12} md={7}>
                                        <Typography fontWeight="600">{item.texto_pergunta}</Typography>
                                        {item.ajuda_texto && <Typography variant="caption" color="text.secondary">Ref: {item.ajuda_texto}</Typography>}
                                    </Grid>
                                    <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                                        {renderValorResposta(item, resp)}
                                    </Grid>
                                </Grid>
                                {(resp?.comentario || (resp?.fotos_urls && resp.fotos_urls.length > 0)) && (
                                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
                                        {resp.comentario && <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}><FileText size={14}/> {resp.comentario}</Typography>}
                                        {resp.fotos_urls && resp.fotos_urls.length > 0 && (
                                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                                {resp.fotos_urls.map((url: string, idx: number) => (
                                                    <Avatar key={idx} src={url} variant="rounded" sx={{ width: 50, height: 50, border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}/>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
          ))}
      </Box>
  );

  // 2. VISUALIZAÇÃO EXECUTIVA (Tabela Formal)
  const ExecutiveView = () => (
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mt: 2 }}>
          <TableContainer>
              <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item da Inspeção</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="center">Avaliação</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Observações</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="center">Mídia</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {secoes.map(secao => [
                          <TableRow key={`h-${secao.id}`} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell colSpan={4} sx={{ fontWeight: '800', color: 'primary.main', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                  {secao.titulo}
                              </TableCell>
                          </TableRow>,
                          ...secao.checklist_itens.map((item: any) => {
                              const resp = item.ids_originais?.map((id: string) => respostas[id]).find((r: any) => r !== undefined);
                              return (
                                  <TableRow key={item.id} hover>
                                      <TableCell sx={{ maxWidth: 300 }}>{item.texto_pergunta}</TableCell>
                                      <TableCell align="center">{renderValorResposta(item, resp)}</TableCell>
                                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{resp?.comentario || '-'}</TableCell>
                                      <TableCell align="center">
                                          {resp?.fotos_urls?.length > 0 ? (
                                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                                  {resp.fotos_urls.map((url: string, i: number) => (
                                                      <Avatar 
                                                          key={i} 
                                                          src={url} 
                                                          variant="rounded" 
                                                          sx={{ width: 64, height: 64, border: '1px solid #ddd', cursor: 'pointer' }}
                                                          onClick={() => window.open(url, '_blank')}
                                                      />
                                                  ))}
                                              </Stack>
                                          ) : '-'}
                                      </TableCell>
                                  </TableRow>
                              );
                          })
                      ])}
                  </TableBody>
              </Table>
          </TableContainer>
          {/* Removido o box de assinaturas daqui para usar o SignatureSection global no final */}
      </Paper>
  );

  // 4. SEÇÃO DE ASSINATURAS (Global)
  const SignatureSection = () => (
      <Box sx={{ mt: 6, mb: 4, pt: 4, borderTop: '2px solid #eee', '@media print': { mt: 4, pt: 2 } }}>
          <Typography variant="h6" fontWeight="800" sx={{ mb: 4, color: 'text.secondary', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Validação e Encerramento
          </Typography>
          <Grid container spacing={6}>
              <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ minHeight: 60, borderBottom: '1px solid #000', mb: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          {(auditoria as any)?.assinatura_auditor_url && (
                              <img src={(auditoria as any).assinatura_auditor_url} alt="Assinatura" style={{ maxHeight: 60, maxWidth: '100%' }} />
                          )}
                      </Box>
                      <Typography variant="body2" fontWeight="bold">Assinatura do Auditor</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(auditoria as any)?.auditor_nome || 'Auditor não identificado'}
                      </Typography>
                  </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ minHeight: 60, borderBottom: '1px solid #000', mb: 1 }} />
                      <Typography variant="body2" fontWeight="bold">Responsável pela Unidade</Typography>
                      <Typography variant="caption" color="text.secondary">Carimbo e Assinatura</Typography>
                  </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ minHeight: 60, borderBottom: '1px solid #000', mb: 1 }} />
                      <Typography variant="body2" fontWeight="bold">Responsável Técnico / Qualidade</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {unidade?.responsavel_tecnico_nome || 'NOME DO RESPONSÁVEL'}
                      </Typography>
                      {unidade?.responsavel_tecnico_registro && (
                          <Typography variant="caption" fontWeight="bold" color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), px: 1, borderRadius: 1 }}>
                              REGISTRO: {unidade.responsavel_tecnico_registro}
                          </Typography>
                      )}
                  </Box>
              </Grid>
          </Grid>
          
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">
                Este relatório foi gerado eletronicamente e é válido como documento oficial de inspeção GxP.
                <br />
                ID da Auditoria: {auditId} • Data: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
      </Box>
  );

  // 3. VISUALIZAÇÃO ANALÍTICA (Gráficos)
  const AnalyticView = () => (
    <Box mt={2}>
        <Stack spacing={3} mb={4}>
            {/* Resumo Geral (Donut Chart) */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="800" gutterBottom align="center">CONFORMIDADE GERAL</Typography>
                
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ height: 220, position: 'relative' }}>
                            <ChartDefinitions />
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats.overall} 
                                        outerRadius={90} 
                                        paddingAngle={0} 
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                    >
                                        {stats.overall.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getGradientUrl(entry.color)} filter="url(#shadowDepth)" />
                                        ))}
                                    </Pie>
                                    <ChartTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Box sx={{ textAlign: 'left', pl: { md: 4 } }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h2" fontWeight="900" color="primary" sx={{ lineHeight: 1 }}>
                                    {stats.pct}%
                                </Typography>
                                <Typography variant="h6" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                                    CONFORME
                                </Typography>
                            </Box>
                            
                            <Stack direction="column" spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight="900" color="#10b981" sx={{ lineHeight: 1 }}>{stats.conform}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">ITENS CONFORMES</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight="900" color="#ef4444" sx={{ lineHeight: 1 }}>{stats.nonConform}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight="bold">NÃO CONFORMES</Typography>
                                    </Box>
                                </Box>
                                {stats.na > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                        <Box>
                                            <Typography variant="h6" fontWeight="900" color="text.disabled" sx={{ lineHeight: 1 }}>{stats.na}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight="bold">NÃO SE APLICA</Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Conformidade por Seção (Bar Chart) */}
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                <Typography variant="h6" fontWeight="800" sx={{ mb: 4 }}>CONFORMIDADE POR CATEGORIA (%)</Typography>
                <Box sx={{ height: 600, mt: 1 }}>
                    <ChartDefinitions />
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.sections} margin={{ top: 40, right: 40, left: 20, bottom: 180 }}>
                            {/* Faixas de Fundo (Performance Bands - Sincronizado com Central de Consultoria) */}
                            <ReferenceArea y1={90} y2={100} fill="rgba(37, 99, 235, 0.08)" stroke="none" />
                            <ReferenceArea y1={75} y2={90} fill="rgba(22, 163, 74, 0.08)" stroke="none" />
                            <ReferenceArea y1={60} y2={75} fill="rgba(234, 179, 8, 0.08)" stroke="none" />
                            <ReferenceArea y1={0} y2={60} fill="rgba(239, 68, 68, 0.08)" stroke="none" />

                            {/* Linhas de Limite Tracejadas (Serão sobrepostas pelas barras) */}
                            <ReferenceLine y={90} stroke="#1d4ed8" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '90%', position: 'right', fill: '#1d4ed8', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={75} stroke="#15803d" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '75%', position: 'right', fill: '#15803d', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={60} stroke="#a16207" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '60%', position: 'right', fill: '#a16207', fontSize: 10, fontWeight: 'bold' }} />

                            <XAxis 
                                dataKey="name" 
                                interval={0}
                                tick={<CustomXAxisTick />}
                                height={100}
                            />
                            <YAxis 
                                domain={[0, 100]}
                                tickFormatter={(val) => `${val}%`}
                                tick={{ fontSize: 12, fontWeight: 'bold' }}
                            />
                            <ChartTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} />
                            
                            {/* A Bar deve vir por ÚLTIMO para sobrepor as linhas e áreas */}
                            <Bar 
                                dataKey="compliance" 
                                shape={<PremiumBar />}
                                barSize={40}
                                label={{ 
                                    position: 'top', 
                                    formatter: (val: any) => `${val}%`,
                                    fontSize: 12,
                                    fontWeight: '900',
                                    fill: theme.palette.text.primary
                                }}
                            >
                                {stats.sections.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </Stack>

        {/* LISTA DE NÃO CONFORMIDADES (O QUE PRECISA SER CORRIGIDO) */}
        <Typography variant="h6" fontWeight="800" sx={{ mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <XCircle /> Registro de Não Conformidades (Plano de Ação)
        </Typography>
        
        {nonConformItems.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>Nenhuma não conformidade detectada nesta auditoria. Ótimo trabalho!</Alert>
        ) : (
            <Grid container spacing={2}>
                {nonConformItems.map((nc, idx) => (
                    <Grid item xs={12} key={idx}>
                        <Paper variant="outlined" sx={{ p: 2, borderLeft: '6px solid #ef4444', borderRadius: 2 }}>
                            <Typography variant="caption" color="error.main" fontWeight="800">{nc.secao.toUpperCase()}</Typography>
                            <Typography variant="body1" fontWeight="600" mt={0.5}>{nc.texto_pergunta}</Typography>
                            
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    "{nc.resp.comentario || 'Sem observações adicionais.'}"
                                </Typography>
                            </Box>

                            {nc.resp.fotos_urls?.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                    {nc.resp.fotos_urls.map((url: string, i: number) => (
                                        <Avatar key={i} src={url} variant="rounded" sx={{ width: 80, height: 80, border: '1px solid #ddd', boxShadow: 1 }} />
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        )}
    </Box>
  );

  // --- RENDER PRINCIPAL ---

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!auditoria) return <Alert severity="error">Relatório não encontrado.</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
      
      {/* HEADER DE NAVEGAÇÃO E SELETOR DE VISTA */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2, '@media print': { display: 'none' } }}>
        <Box>
            <Button startIcon={<ArrowLeft />} onClick={() => router.back()} sx={{ color: 'text.secondary', mb: 1 }}>Voltar</Button>
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>Relatório de Auditoria</Typography>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
                sx={{ bgcolor: 'background.paper', border: '1px solid #ddd' }}
            >
                <ToggleButton value="PADRAO" sx={{ px: 2, fontWeight: 'bold' }}>
                    <LayoutList size={18} style={{ marginRight: 8 }}/> Detalhado
                </ToggleButton>
                <ToggleButton value="EXECUTIVO" sx={{ px: 2, fontWeight: 'bold' }}>
                    <FileSpreadsheet size={18} style={{ marginRight: 8 }}/> Executivo
                </ToggleButton>
                <ToggleButton value="ANALITICO" sx={{ px: 2, fontWeight: 'bold' }}>
                    <BarChart3 size={18} style={{ marginRight: 8 }}/> Painel GxP
                </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<Printer />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>Imprimir</Button>
        </Stack>
      </Box>

      {/* CABEÇALHO/CAPA DO RELATÓRIO (Visível em todos exceto gráfico as vezes) */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid #ddd', borderRadius: 4, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" fontWeight="900" gutterBottom color="primary.main">
                    {auditoria.titulo || auditoria.checklist_modelos?.titulo}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                    Certificado de Inspeção Técnica • {auditoria.status}
                </Typography>
              </Box>
              <Chip 
                  label={`${stats.pct}% Conformidade`} 
                  color={stats.pct > 90 ? "success" : stats.pct > 70 ? "warning" : "error"} 
                  sx={{ fontWeight: 'bold', px: 1 }}
              />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                      <Typography variant="caption" fontWeight="bold" color="text.disabled">REALIZADO EM</Typography>
                      <Typography variant="body2" fontWeight="700">{new Date(auditoria.data_inicio).toLocaleDateString()}</Typography>
                  </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                      <Typography variant="caption" fontWeight="bold" color="text.disabled">HORÁRIO</Typography>
                      <Typography variant="body2" fontWeight="700">
                        {new Date(auditoria.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                        {auditoria.data_fim ? ` - ${new Date(auditoria.data_fim).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </Typography>
                  </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                      <Typography variant="caption" fontWeight="bold" color="text.disabled">AUDITOR</Typography>
                      <Typography variant="body2" fontWeight="700">{(auditoria as any)?.auditor_nome || 'Auditor não identificado'}</Typography>
                  </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                      <Typography variant="caption" fontWeight="bold" color="text.disabled">STATUS GxP</Typography>
                      <Chip 
                        label={auditoria.status === 'CONCLUIDO' ? 'VÁLIDO' : 'EM PROCESSAMENTO'} 
                        size="small" 
                        color={auditoria.status === 'CONCLUIDO' ? 'success' : 'warning'} 
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 900 }}
                      />
                  </Stack>
              </Grid>
          </Grid>
      </Paper>

      {/* CONTEÚDO DINÂMICO BASEADO NO MODO DE VISTA */}
      {viewMode === 'PADRAO' && <StandardView />}
      {viewMode === 'EXECUTIVO' && <ExecutiveView />}
      {viewMode === 'ANALITICO' && <AnalyticView />}

      <SignatureSection />

    </Container>
  );
}