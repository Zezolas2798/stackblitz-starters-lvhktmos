// lib/iot/zplGenerator.ts

// Interface compartilhada que garante que todos os arquivos falem a mesma língua
export interface DadosEtiqueta {
  empresa: {
    razaoSocial: string;
    cnpj: string;
    enderecoResumido?: string;
  };
  produto: {
    nome: string;
    lote: string;
    peso?: string;
    tipoArmazenamento?: string;
  };
  datas: {
    manipulacao: Date | string;
    validadeOriginal?: Date | string;
    validadeFinal: Date | string;
  };
  rastreabilidade: {
    idInterno: string;
    responsavel: string;
  };
}

/**
 * Gera código ZPL para impressoras térmicas (Zebra, Elgin, etc)
 * Configurado para etiquetas 60mm x 40mm (padrão cozinha)
 */
export function generateZPL(data: DadosEtiqueta): string {
  // Helpers de formatação
  const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('pt-BR');
  
  // Sanitização (Remove acentos pois algumas impressoras antigas não suportam UTF-8 direto)
  const clean = (str: string) => str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .substring(0, 30); // Limite de segurança

  const empresa = clean(data.empresa.razaoSocial);
  const prod = clean(data.produto.nome);
  const lote = clean(data.produto.lote);
  const resp = clean(data.rastreabilidade.responsavel.split('@')[0]);
  const fab = fmtDate(data.datas.manipulacao);
  const val = fmtDate(data.datas.validadeFinal);

  return `
^XA
^PW480
^LL320
^CI28

^FX --- CABEÇALHO ---
^FO20,20^A0N,22,22^FD${empresa}^FS
^FO20,45^A0N,18,18^FDCNPJ: ${data.empresa.cnpj}^FS
^FO20,65^GB440,1,3^FS

^FX --- PRODUTO ---
^FO20,80^A0N,30,30^FD${prod}^FS
^FO20,115^A0N,22,22^FDLOTE: ${lote}^FS
^FO250,115^A0N,22,22^FD${data.produto.tipoArmazenamento || ''}^FS

^FX --- DATAS ---
^FO20,150^A0N,22,22^FDFAB: ${fab}^FS
^FO20,180^A0N,25,25^FDVAL: ${val}^FS

^FX --- RODAPÉ E BARRAS ---
^FO20,220^BY2,2,50^BCN,50,N,N,N,A^FD${lote}^FS
^FO250,180^A0N,18,18^FDRESP: ${resp}^FS
^FO250,280^A0N,18,18^FDID: ${data.rastreabilidade.idInterno.substring(0,8)}^FS

^XZ
  `;
}