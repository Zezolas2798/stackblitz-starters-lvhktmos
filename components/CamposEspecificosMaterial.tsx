'use client';

import {
  TextField, MenuItem, FormControlLabel, Checkbox, Typography, Box,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ChevronDown } from 'lucide-react';

interface CamposProps {
  specs: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

// ─── EMBALAGEM ──────────────────────────────────────────────────────────────────

function CamposEmbalagem({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados da Embalagem (RDC 843/2024)</Typography></Grid>
      <Grid item xs={6}>
        <TextField select label="Material Base *" fullWidth value={specs.material_base || ''} onChange={e => onChange('material_base', e.target.value)} error={!!errors.material_base} helperText={errors.material_base}>
          {['PP','PE','PET','VIDRO','ALUMINIO','PAPEL','ISOPOR','OUTRO'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}>
        <TextField label="Capacidade *" fullWidth value={specs.capacidade || ''} onChange={e => onChange('capacidade', e.target.value)} placeholder="Ex: 500ml" error={!!errors.capacidade} helperText={errors.capacidade} />
      </Grid>
      <Grid item xs={6}>
        <TextField label="Temp. Máxima Uso (°C) *" type="number" fullWidth value={specs.temperatura_max_uso ?? ''} onChange={e => onChange('temperatura_max_uso', e.target.value ? Number(e.target.value) : '')} error={!!errors.temperatura_max_uso} helperText={errors.temperatura_max_uso} />
      </Grid>
      <Grid item xs={6}>
        <TextField label="Certificado Contato Alimentos *" fullWidth value={specs.certificado_contato_alimentos || ''} onChange={e => onChange('certificado_contato_alimentos', e.target.value)} error={!!errors.certificado_contato_alimentos} helperText={errors.certificado_contato_alimentos} />
      </Grid>
      <Grid item xs={6}>
        <FormControlLabel control={<Checkbox checked={!!specs.apropriado_alimentos} onChange={e => onChange('apropriado_alimentos', e.target.checked)} />} label="Apropriado para Alimentos" />
      </Grid>
      <Grid item xs={6}>
        <FormControlLabel control={<Checkbox checked={!!specs.sustentavel} onChange={e => onChange('sustentavel', e.target.checked)} />} label="Sustentável" />
      </Grid>
      <Grid item xs={6}>
        <FormControlLabel control={<Checkbox checked={!!specs.reciclavel} onChange={e => onChange('reciclavel', e.target.checked)} />} label="Reciclável" />
      </Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo Fechamento" fullWidth value={specs.tipo_fechamento || ''} onChange={e => onChange('tipo_fechamento', e.target.value)}>
          <MenuItem value="">Nenhum</MenuItem>
          {['TAMPA_ROSCA','SELO','PRESS_CLIP','ENCAIXE','SEM_FECHAMENTO','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Dimensões" fullWidth value={specs.dimensoes || ''} onChange={e => onChange('dimensoes', e.target.value)} placeholder="LxAxP" /></Grid>
      <Grid item xs={6}><TextField label="Cor" fullWidth value={specs.cor || ''} onChange={e => onChange('cor', e.target.value)} /></Grid>
    </>
  );
}

// ─── LIMPEZA ────────────────────────────────────────────────────────────────────

function CamposLimpeza({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados do Saneante (FDS — NBR 14725:2023)</Typography></Grid>
      <Grid item xs={6}><TextField label="Princípio Ativo *" fullWidth value={specs.principio_ativo || ''} onChange={e => onChange('principio_ativo', e.target.value)} error={!!errors.principio_ativo} helperText={errors.principio_ativo} /></Grid>
      <Grid item xs={6}><TextField label="Concentração *" fullWidth value={specs.concentracao_principio_ativo || ''} onChange={e => onChange('concentracao_principio_ativo', e.target.value)} placeholder="Ex: 0,5%" error={!!errors.concentracao_principio_ativo} helperText={errors.concentracao_principio_ativo} /></Grid>
      <Grid item xs={6}><TextField label="Diluição Recomendada *" fullWidth value={specs.diluicao_recomendada || ''} onChange={e => onChange('diluicao_recomendada', e.target.value)} placeholder="Ex: 1:200" error={!!errors.diluicao_recomendada} helperText={errors.diluicao_recomendada} /></Grid>
      <Grid item xs={6}><TextField label="Tempo de Contato (min) *" type="number" fullWidth value={specs.tempo_contato_min ?? ''} onChange={e => onChange('tempo_contato_min', e.target.value ? Number(e.target.value) : '')} error={!!errors.tempo_contato_min} helperText={errors.tempo_contato_min} /></Grid>
      <Grid item xs={6}><TextField label="Registro ANVISA/MS *" fullWidth value={specs.registro_anvisa_ms || ''} onChange={e => onChange('registro_anvisa_ms', e.target.value)} error={!!errors.registro_anvisa_ms} helperText={errors.registro_anvisa_ms} /></Grid>
      <Grid item xs={6}>
        <TextField select label="Classe Risco GHS *" fullWidth value={specs.classe_risco_ghs || ''} onChange={e => onChange('classe_risco_ghs', e.target.value)} error={!!errors.classe_risco_ghs} helperText={errors.classe_risco_ghs}>
          {['CORROSIVO','IRRITANTE','TOXICO','INFLAMAVEL','OXIDANTE','GAS_PRESSURIZADO','RISCO_SAUDE','RISCO_AMBIENTAL','NAO_CLASSIFICADO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.fds_disponivel} onChange={e => onChange('fds_disponivel', e.target.checked)} />} label="FDS Disponível" /></Grid>
      {specs.fds_disponivel && <Grid item xs={6}><TextField label="URL da FDS" fullWidth value={specs.fds_url || ''} onChange={e => onChange('fds_url', e.target.value)} placeholder="https://..." /></Grid>}
      <Grid item xs={6}><TextField label="pH" type="number" fullWidth value={specs.pH ?? ''} onChange={e => onChange('pH', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={12}><TextField label="Incompatibilidades *" fullWidth multiline rows={2} value={specs.incompatibilidades || ''} onChange={e => onChange('incompatibilidades', e.target.value)} placeholder="Ex: Não misturar com cloro" error={!!errors.incompatibilidades} helperText={errors.incompatibilidades} /></Grid>
      <Grid item xs={12}><TextField label="Superfícies Compatíveis" fullWidth value={(specs.superficies_compativeis || []).join(', ')} onChange={e => onChange('superficies_compativeis', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} helperText="Separar por vírgula: inox, polímero, piso" /></Grid>
    </>
  );
}

// ─── EPI / EPC ──────────────────────────────────────────────────────────────────

function CamposEPI({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados do EPI (NR-6)</Typography></Grid>
      <Grid item xs={6}><TextField label="Número do CA *" fullWidth value={specs.numero_ca || ''} onChange={e => onChange('numero_ca', e.target.value)} error={!!errors.numero_ca} helperText={errors.numero_ca} /></Grid>
      <Grid item xs={6}><TextField label="Validade do CA *" type="date" fullWidth value={specs.validade_ca || ''} onChange={e => onChange('validade_ca', e.target.value)} InputLabelProps={{ shrink: true }} error={!!errors.validade_ca} helperText={errors.validade_ca} /></Grid>
      <Grid item xs={6}><TextField label="Fabricante/Importador *" fullWidth value={specs.fabricante_importador || ''} onChange={e => onChange('fabricante_importador', e.target.value)} error={!!errors.fabricante_importador} helperText={errors.fabricante_importador} /></Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo de EPI *" fullWidth value={specs.tipo_epi || ''} onChange={e => onChange('tipo_epi', e.target.value)} error={!!errors.tipo_epi} helperText={errors.tipo_epi}>
          {['LUVA','BOTA','AVENTAL','OCULOS','PROTETOR_AURICULAR','TOUCA','MASCARA','PROTETOR_FACIAL','MANGOTE','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Tamanho *" fullWidth value={specs.tamanho || ''} onChange={e => onChange('tamanho', e.target.value)} placeholder="P / M / G / GG" error={!!errors.tamanho} helperText={errors.tamanho} /></Grid>
      <Grid item xs={6}><TextField label="Composição do Material" fullWidth value={specs.material_composicao || ''} onChange={e => onChange('material_composicao', e.target.value)} placeholder="Ex: Nitrílica" /></Grid>
      <Grid item xs={6}><TextField label="Lote de Fabricação" fullWidth value={specs.lote_fabricacao || ''} onChange={e => onChange('lote_fabricacao', e.target.value)} /></Grid>
      <Grid item xs={6}><TextField label="Vida Útil (dias)" type="number" fullWidth value={specs.vida_util_dias ?? ''} onChange={e => onChange('vida_util_dias', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.controle_individual} onChange={e => onChange('controle_individual', e.target.checked)} />} label="Controle Individual (ficha)" /></Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.descartavel} onChange={e => onChange('descartavel', e.target.checked)} />} label="Descartável" /></Grid>
      <Grid item xs={12}><TextField label="NRs Aplicáveis" fullWidth value={(specs.nr_aplicavel || []).join(', ')} onChange={e => onChange('nr_aplicavel', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} helperText="Separar por vírgula: NR-6, NR-9" /></Grid>
    </>
  );
}

// ─── UNIFORME ───────────────────────────────────────────────────────────────────

function CamposUniforme({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados do Uniforme (RDC 216/2004)</Typography></Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo de Peça *" fullWidth value={specs.tipo_peca || ''} onChange={e => onChange('tipo_peca', e.target.value)} error={!!errors.tipo_peca} helperText={errors.tipo_peca}>
          {['DOLMA','CALCA','AVENTAL','TOUCA','SAPATO','LUVA_TERMICA','CAMISETA','BERMUDA','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Tamanho *" fullWidth value={specs.tamanho || ''} onChange={e => onChange('tamanho', e.target.value)} placeholder="P / M / G / GG / XG" error={!!errors.tamanho} helperText={errors.tamanho} /></Grid>
      <Grid item xs={6}><TextField label="Cor *" fullWidth value={specs.cor || ''} onChange={e => onChange('cor', e.target.value)} placeholder="Branco (recomendado)" error={!!errors.cor} helperText={errors.cor} /></Grid>
      <Grid item xs={6}><TextField label="Composição do Tecido" fullWidth value={specs.tecido_composicao || ''} onChange={e => onChange('tecido_composicao', e.target.value)} placeholder="Ex: 65% Poliéster / 35% Algodão" /></Grid>
      <Grid item xs={6}><TextField label="Gramatura (g/m²)" type="number" fullWidth value={specs.gramatura_gm2 ?? ''} onChange={e => onChange('gramatura_gm2', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={6}>
        <TextField select label="Lavabilidade" fullWidth value={specs.lavabilidade || ''} onChange={e => onChange('lavabilidade', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {['MAQUINA_INDUSTRIAL','MAQUINA_DOMESTICA','MANUAL'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Temp. Máx. Lavagem (°C)" type="number" fullWidth value={specs.temperatura_lavagem_max ?? ''} onChange={e => onChange('temperatura_lavagem_max', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={6}><TextField label="Vida Útil (lavagens)" type="number" fullWidth value={specs.vida_util_lavagens ?? ''} onChange={e => onChange('vida_util_lavagens', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={4}><FormControlLabel control={<Checkbox checked={!!specs.impermeavel} onChange={e => onChange('impermeavel', e.target.checked)} />} label="Impermeável *" /></Grid>
      <Grid item xs={4}><FormControlLabel control={<Checkbox checked={!!specs.antiderrapante} onChange={e => onChange('antiderrapante', e.target.checked)} />} label="Antiderrapante" /></Grid>
      <Grid item xs={4}><TextField label="CA (se EPI)" fullWidth value={specs.numero_ca || ''} onChange={e => onChange('numero_ca', e.target.value)} size="small" /></Grid>
    </>
  );
}

// ─── UTENSÍLIO ──────────────────────────────────────────────────────────────────

function CamposUtensilio({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados do Utensílio (RDC 854/2024)</Typography></Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo de Utensílio *" fullWidth value={specs.tipo_utensilio || ''} onChange={e => onChange('tipo_utensilio', e.target.value)} error={!!errors.tipo_utensilio} helperText={errors.tipo_utensilio}>
          {['TABUA_CORTE','FACA','PANELA','GN','FORMA','ESPATULA','CONCHA','COLHER','BANDEJA','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}>
        <TextField select label="Material Base *" fullWidth value={specs.material_base || ''} onChange={e => onChange('material_base', e.target.value)} error={!!errors.material_base} helperText={errors.material_base}>
          {['INOX_304','INOX_316','POLIETILENO','POLIPROPILENO','SILICONE','MADEIRA','VIDRO','ALUMINIO','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}>
        <TextField select label="Cor Segregação *" fullWidth value={specs.cor_segregacao || ''} onChange={e => onChange('cor_segregacao', e.target.value)} error={!!errors.cor_segregacao} helperText={errors.cor_segregacao || 'Para contaminação cruzada'}>
          {['VERMELHO','AZUL','VERDE','AMARELO','BRANCO','MARROM','NA'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Termoresistência Máx. (°C)" type="number" fullWidth value={specs.termoresistencia_max_c ?? ''} onChange={e => onChange('termoresistencia_max_c', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.apropriado_alimentos} onChange={e => onChange('apropriado_alimentos', e.target.checked)} />} label="Apropriado para Alimentos *" /></Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.autoclavavel} onChange={e => onChange('autoclavavel', e.target.checked)} />} label="Autoclavável" /></Grid>
      <Grid item xs={6}><TextField label="Vida Útil Estimada" fullWidth value={specs.vida_util_estimada || ''} onChange={e => onChange('vida_util_estimada', e.target.value)} placeholder="Ex: 12 meses" /></Grid>
      <Grid item xs={6}><TextField label="Critério de Descarte" fullWidth value={specs.criterio_descarte || ''} onChange={e => onChange('criterio_descarte', e.target.value)} placeholder="Ex: Ranhuras visíveis" /></Grid>
      <Grid item xs={12}><TextField label="Dimensões" fullWidth value={specs.dimensoes || ''} onChange={e => onChange('dimensoes', e.target.value)} placeholder="LxAxP" /></Grid>
    </>
  );
}

// ─── MANUTENÇÃO ─────────────────────────────────────────────────────────────────

function CamposManutencao({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados de Manutenção</Typography></Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo de Item *" fullWidth value={specs.tipo_item || ''} onChange={e => onChange('tipo_item', e.target.value)} error={!!errors.tipo_item} helperText={errors.tipo_item}>
          {['PECA_REPOSICAO','FERRAMENTA','CONSUMIVEL','LUBRIFICANTE','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Modelo / Nº Série" fullWidth value={specs.modelo_numero_serie || ''} onChange={e => onChange('modelo_numero_serie', e.target.value)} /></Grid>
      <Grid item xs={12}><TextField label="Equipamento(s) Compatível(is) *" fullWidth value={(specs.equipamento_compativel || []).join(', ')} onChange={e => onChange('equipamento_compativel', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} helperText="Separar por vírgula" error={!!errors.equipamento_compativel} /></Grid>
      <Grid item xs={12}><TextField label="Especificação Técnica" fullWidth multiline rows={2} value={specs.especificacao_tecnica || ''} onChange={e => onChange('especificacao_tecnica', e.target.value)} /></Grid>
      <Grid item xs={6}>
        <TextField select label="Criticidade" fullWidth value={specs.criticidade || ''} onChange={e => onChange('criticidade', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {['ALTA','MEDIA','BAIXA'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Frequência de Troca" fullWidth value={specs.frequencia_troca || ''} onChange={e => onChange('frequencia_troca', e.target.value)} placeholder="Ex: A cada 3 meses" /></Grid>
      <Grid item xs={6}><FormControlLabel control={<Checkbox checked={!!specs.grau_alimentar} onChange={e => onChange('grau_alimentar', e.target.checked)} />} label="Grau Alimentar (NSF H1)" /></Grid>
    </>
  );
}

// ─── PRIMEIROS SOCORROS ─────────────────────────────────────────────────────────

function CamposPrimeirosSocorros({ specs, onChange, errors }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Dados de Primeiros Socorros (NR-7)</Typography></Grid>
      <Grid item xs={6}>
        <TextField select label="Tipo de Item *" fullWidth value={specs.tipo_item || ''} onChange={e => onChange('tipo_item', e.target.value)} error={!!errors.tipo_item} helperText={errors.tipo_item}>
          {['CURATIVO','ANTISSEPTICO','INSTRUMENTO','MEDICAMENTO_TOPICO','DESCARTAVEL','OUTRO'].map(v => <MenuItem key={v} value={v}>{v.replace(/_/g,' ')}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={6}><TextField label="Registro ANVISA/MS" fullWidth value={specs.registro_anvisa_ms || ''} onChange={e => onChange('registro_anvisa_ms', e.target.value)} /></Grid>
      <Grid item xs={6}><TextField label="Princípio Ativo" fullWidth value={specs.principio_ativo || ''} onChange={e => onChange('principio_ativo', e.target.value)} placeholder="Ex: Clorexidina 0,5%" /></Grid>
      <Grid item xs={6}><TextField label="Qtd. Mínima no Kit" type="number" fullWidth value={specs.quantidade_minima_kit ?? ''} onChange={e => onChange('quantidade_minima_kit', e.target.value ? Number(e.target.value) : '')} /></Grid>
      <Grid item xs={6}>
        <TextField select label="Frequência de Verificação" fullWidth value={specs.frequencia_verificacao || ''} onChange={e => onChange('frequencia_verificacao', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {['MENSAL','TRIMESTRAL','SEMESTRAL'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={3}><FormControlLabel control={<Checkbox checked={!!specs.esteril} onChange={e => onChange('esteril', e.target.checked)} />} label="Estéril" /></Grid>
      <Grid item xs={3}><FormControlLabel control={<Checkbox checked={!!specs.descartavel} onChange={e => onChange('descartavel', e.target.checked)} />} label="Descartável *" /></Grid>
    </>
  );
}

// ─── OUTROS ─────────────────────────────────────────────────────────────────────

function CamposOutros({ specs, onChange }: CamposProps) {
  return (
    <>
      <Grid item xs={12}><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Informações Adicionais</Typography></Grid>
      <Grid item xs={12}><TextField label="Descrição" fullWidth multiline rows={2} value={specs.descricao || ''} onChange={e => onChange('descricao', e.target.value)} /></Grid>
      <Grid item xs={12}><TextField label="Observações" fullWidth multiline rows={2} value={specs.observacoes || ''} onChange={e => onChange('observacoes', e.target.value)} /></Grid>
    </>
  );
}

// ─── DISPATCHER ─────────────────────────────────────────────────────────────────

interface CamposEspecificosMaterialProps {
  tipoMaterial: string;
  specs: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export default function CamposEspecificosMaterial({ tipoMaterial, specs, onChange, errors }: CamposEspecificosMaterialProps) {
  const componentMap: Record<string, React.ComponentType<CamposProps>> = {
    EMBALAGEM: CamposEmbalagem,
    LIMPEZA: CamposLimpeza,
    EPI_EPC: CamposEPI,
    UNIFORME: CamposUniforme,
    UTENSILIO: CamposUtensilio,
    MANUTENCAO: CamposManutencao,
    PRIMEIROS_SOCORROS: CamposPrimeirosSocorros,
    OUTROS: CamposOutros,
  };

  const Component = componentMap[tipoMaterial] || CamposOutros;

  return (
    <Accordion defaultExpanded sx={{ mt: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">Especificações da Modalidade</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Component specs={specs} onChange={onChange} errors={errors} />
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
