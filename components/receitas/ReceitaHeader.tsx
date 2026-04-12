import React from 'react';
import { Box, Typography, Button, Tooltip, Chip, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import RestoreIcon from '@mui/icons-material/Restore';
import LockIcon from '@mui/icons-material/Lock';
import { FileCheck, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReceitaVersao } from '@/lib/types';

interface ReceitaHeaderProps {
  receitaAtual: any;
  receitaExibida: any;
  temAlteracoesPendentes: boolean;
  isHistorico: boolean;
  custoTotalUltimo: number;
  formatoMoeda: Intl.NumberFormat;
  historicoVersoes: ReceitaVersao[];
  setModalAprovacaoOpen: (v: boolean) => void;
  handleSelecionarVersao: (v: string) => void;
}

export default function ReceitaHeader({
  receitaAtual, receitaExibida, temAlteracoesPendentes, isHistorico,
  custoTotalUltimo, formatoMoeda, historicoVersoes, setModalAprovacaoOpen, handleSelecionarVersao
}: ReceitaHeaderProps) {
  const router = useRouter();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/receitas')} sx={{ mb: 1 }}>
                Voltar para Lista
            </Button>
            <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {receitaExibida.nome}
                {isHistorico && <Chip label="Snapshot (Legado)" color="warning" size="small" />}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                Rendimento: {receitaExibida.rendimento_total_g}g | Custo Total Ult.: {formatoMoeda.format(custoTotalUltimo)}
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
            {!isHistorico && (
                <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir</Button>
                    
                    {/* BOTÃO INTELIGENTE COM LÓGICA DE BLOQUEIO */}
                    <Tooltip title={!temAlteracoesPendentes ? "Nenhuma alteração detectada desde a última aprovação." : "Aprovar nova versão para auditoria."}>
                      <span>
                        <Button 
                            variant="contained" 
                            color="success" 
                            startIcon={<FileCheck size={20} />} 
                            onClick={() => setModalAprovacaoOpen(true)}
                            disabled={!temAlteracoesPendentes} 
                            sx={{ boxShadow: 2 }}
                        >
                            Aprovar Versão
                        </Button>
                      </span>
                    </Tooltip>

                    <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => router.push(`/receitas/criar?id=${receitaAtual.id}`)}>
                        Editar
                    </Button>
                </>
            )}
            {isHistorico && (
                <Button variant="contained" color="inherit" startIcon={<RestoreIcon />} onClick={() => handleSelecionarVersao('ATUAL')}>
                    Voltar para Versão Atual
                </Button>
            )}
        </Box>
      </Box>
      
      {isHistorico && (
          <Alert severity="warning" variant="filled" sx={{ mb: 3, alignItems: 'center' }} icon={<LockIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">MODO DE AUDITORIA: VISUALIZANDO SNAPSHOT</Typography>
              Versão congelada em {new Date(receitaExibida.data_aprovacao).toLocaleDateString()}.
          </Alert>
      )}

      {!isHistorico && !temAlteracoesPendentes && historicoVersoes.length > 0 && (
          <Alert severity="success" variant="outlined" sx={{ mb: 3 }} icon={<CheckCircle size={20} />}>
              <b>Tudo em dia!</b> Esta receita está idêntica à última versão aprovada (v{historicoVersoes[0].versao}). Nenhuma ação de conformidade é necessária.
          </Alert>
      )}
    </>
  );
}
