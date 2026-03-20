import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Grid, Paper,
  alpha, useTheme
} from '@mui/material';
import { Package, Printer, Tags, Eye } from 'lucide-react';
import { formatarQuantidade } from '../MovimentacaoEstoqueDialog';
import EtiquetaPrinter from './EtiquetaPrinter';
import EtiquetaPreview from './EtiquetaPreview';
import { DadosEtiqueta } from '@/lib/iot/zplGenerator';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Lote original de onde a mercadoria saiu */
  lote: any;
  /** Quantidade g/ml total movimentada/alocada */
  quantidadeMovimentadaGml: number;
  /** Contexto opcional (ex: "OP 010" ou "Setor Cozinha") para aparecer na etiqueta */
  contextoDestino?: string;
  userName?: string;
  unidadeInfo?: any;
}

export default function MovimentoEtiquetaDialog({
  open, onClose, lote, quantidadeMovimentadaGml, contextoDestino, userName, unidadeInfo
}: Props) {
  const theme = useTheme();

  // Se = 'embalagem', o sistema sugere N etiquetas automáticas com base na conversão.
  // Se = 'peso', o sistema sugere 1 etiqueta com o total, mas o usuário pode digitar quantas etiquetas quer.
  const [modoCalculo, setModoCalculo] = useState<'embalagem' | 'peso'>('peso');
  const [numEtiquetas, setNumEtiquetas] = useState<number>(1);
  const [pesoPorEtiquetaGml, setPesoPorEtiquetaGml] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!open || !lote || quantidadeMovimentadaGml <= 0) return;

    // Lógica para detecção automática de modo Embalagem ou Peso
    const pesoEmb = lote.peso_unitario_embalagem || 0;
    const unidEmb = lote.unidade_peso_embalagem || 'g';
    
    // Função helper para conversão (simplificada, adaptada do resto do sistema)
    let fatorEmb = 1;
    if (unidEmb.toLowerCase() === 'kg' || unidEmb.toLowerCase() === 'l') fatorEmb = 1000;
    const pesoTotalEmbGml = pesoEmb * fatorEmb;

    if (pesoTotalEmbGml > 0) {
      // Verifica se a quantidade movimentada é um múltiplo aproximado do peso da embalagem
      // Usamos um threshold pequeno (ex: 5g) para arredondamento flutuante
      const divisor = quantidadeMovimentadaGml / pesoTotalEmbGml;
      const diferenca = Math.abs(divisor - Math.round(divisor));
      
      if (diferenca < 0.05) {
        // É embalagem! Sugere o número de embalagens exatas
        setModoCalculo('embalagem');
        setNumEtiquetas(Math.round(divisor) || 1);
        setPesoPorEtiquetaGml(pesoTotalEmbGml);
        return;
      }
    }

    // Se não for múltiplo exato de embalagem ou não tiver controle de embalagem cadastrado:
    setModoCalculo('peso');
    setNumEtiquetas(1);
    setPesoPorEtiquetaGml(quantidadeMovimentadaGml);

  }, [open, lote, quantidadeMovimentadaGml]);

  // Recalcula o peso por etiqueta se o usuário mudar a quantidade de etiquetas no modo peso manually.
  useEffect(() => {
    if (modoCalculo === 'peso') {
      if (numEtiquetas > 0) {
        setPesoPorEtiquetaGml(quantidadeMovimentadaGml / numEtiquetas);
      } else {
        setPesoPorEtiquetaGml(0);
      }
    }
  }, [numEtiquetas, quantidadeMovimentadaGml, modoCalculo]);


  // ---- GERAÇÃO DOS DADOS DA ETIQUETA ----
  const dadosEtiqueta = useMemo<DadosEtiqueta | null>(() => {
    if (!lote) return null;

    // Calcular validade (Simplificada) -> Usa a interna se tiver ou a do rótulo
    const validade = lote.data_validade_interna || lote.data_validade_rotulo || new Date().toISOString();
    
    return {
      empresa: {
        razaoSocial: unidadeInfo?.nome_unidade || lote.fornecedores?.razao_social?.substring(0, 30) || 'Estoque Interno',
        cnpj: unidadeInfo?.cnpj_completo || lote.fornecedores?.cnpj || '',
        enderecoResumido: contextoDestino ? `Destino: ${contextoDestino}` : 'Movimentação Interna',
        enderecoCompleto: unidadeInfo?.endereco_completo || ''
      },
      produto: {
        nome: lote.ingredientes?.nome || lote.nome_ingrediente || 'Insumo',
        lote: lote.numero_lote_fabricante || `INT-${lote.id?.substring(0, 4)}`,
        marcaForn: lote.fornecedores?.razao_social || lote.fornecedores?.nome_fantasia || 'PRÓPRIO',
        sif: lote.registro_sif,
        peso: formatarQuantidade(pesoPorEtiquetaGml),
        tipoArmazenamento: lote.estado_produto ? `${lote.estado_produto} / ${lote.temperatura_recebimento ? lote.temperatura_recebimento + '°C' : 'T.A.'}` : (lote.temperatura_recebimento ? `${lote.temperatura_recebimento}°C` : 'Ambiente')
      },
      datas: {
        manipulacao: new Date(),
        validadeOriginal: new Date(lote.data_validade_rotulo || validade),
        validadeFinal: new Date(validade)
      },
      rastreabilidade: {
        idInterno: lote.id,
        responsavel: userName || 'Sistema',
        codigoRef: lote.nota_fiscal ? `#NF${lote.nota_fiscal.substring(0, 6)}` : undefined
      }
    };
  }, [lote, pesoPorEtiquetaGml, contextoDestino, userName, unidadeInfo]);


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tags size={22} color={theme.palette.primary.main} />
            Deseja Imprimir Etiquetas?
        </Box>
        <Button 
          size="small" 
          startIcon={<Eye size={16} />} 
          onClick={() => setShowPreview(!showPreview)}
          variant={showPreview ? "contained" : "outlined"}
        >
          {showPreview ? "Esconder Prévia" : "Ver Prévia"}
        </Button>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          A movimentação de <strong>{formatarQuantidade(quantidadeMovimentadaGml)}</strong> do lote <strong>{lote?.numero_lote_fabricante}</strong> foi concluída. Identifique os itens movimentados com etiquetas atualizadas.
        </Typography>

        {showPreview && dadosEtiqueta && (
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <EtiquetaPreview dados={dadosEtiqueta} />
            </Box>
        )}

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderRadius: 2
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade de Etiquetas"
                type="number"
                size="medium"
                fullWidth
                value={numEtiquetas || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setNumEtiquetas(isNaN(val) ? 0 : val);
                  if (modoCalculo === 'embalagem') setModoCalculo('peso'); // Se ele mudar manualmente vira fracionado
                }}
                inputProps={{ min: 1 }}
                helperText={modoCalculo === 'embalagem' ? "Sugestão p/ embalagens padronizadas" : "O peso total será dividido entre as etiquetas."}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
               <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                 <Typography variant="caption" color="text.secondary" display="block">Peso em cada Etiqueta</Typography>
                 <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatarQuantidade(pesoPorEtiquetaGml)}
                 </Typography>
               </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Resumo da Etiqueta:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Produto</Typography>
                    <Typography variant="body2" fontWeight="bold">{lote?.ingredientes?.nome}</Typography>
                </Box>
                {contextoDestino && (
                  <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Destino</Typography>
                      <Typography variant="body2" fontWeight="bold">{contextoDestino}</Typography>
                  </Box>
                )}
            </Box>
          </Box>
        </Paper>

      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Não Imprimir (Concluir)
        </Button>
        <Box>
           {dadosEtiqueta && numEtiquetas > 0 && (
             <EtiquetaPrinter 
               dados={dadosEtiqueta} 
               disabled={false} 
               // The original component might not accept quantidadeCopias as prop directly unless we modify it!
               // Let's modify EtiquetaPrinter to accept quantidadeCopias, or pass it via dados if needed.
               // We'll update EtiquetaPrinter in the next step to accept `quantidadeCopias={numEtiquetas}`
               quantidadeCopias={numEtiquetas}
               onPrintSuccess={onClose} // Let's also add an auto-close after print!
             />
           )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
