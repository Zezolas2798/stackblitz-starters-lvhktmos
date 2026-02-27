import { format } from 'date-fns';

export interface DadosEtiqueta {
  empresa: {
    razaoSocial: string;
    cnpj: string;
    enderecoResumido: string;
  };
  produto: {
    nome: string;
    lote: string;
    peso: string;
    tipoArmazenamento: string;
  };
  datas: {
    fabricacao?: Date | string;
    manipulacao: Date;
    validadeOriginal: Date;
    validadeFinal: Date;
  };
  rastreabilidade: {
    idInterno: string;
    responsavel: string;
  }
}

/**
 * GERA O CÓDIGO ZPL PARA ETIQUETA QUADRADA 60mm x 60mm
 * Densidade: 203dpi (8 dots/mm) -> Canvas aprox. 480x480 dots
 */
export function gerarZPL(dados: DadosEtiqueta): string {
  const fmt = (d?: Date | string) => {
    if (!d) return "N/A";
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return format(dateObj, 'dd/MM/yyyy');
  };
  
  const fmtHora = (d: Date) => format(d, 'HH:mm');

  // QR Code Compacto
  const qrContent = `ID:${dados.rastreabilidade.idInterno}|L:${dados.produto.lote}`;

  return `
^XA
^PW480
^LL480
^PON

// --- MOLDURA ---
^FO10,10^GB460,460,3^FS

// --- 1. CABEÇALHO (EMPRESA) ---
^FO20,25^A0N,22,22^FD${dados.empresa.razaoSocial.substring(0, 28)}^FS
^FO20,50^A0N,18,18^FDCNPJ: ${dados.empresa.cnpj}^FS
^FO10,75^GB460,1,1^FS

// --- 2. PRODUTO (EM DESTAQUE) ---
// ^FB = Field Block (Quebra de linha automática: largura 440, max 2 linhas)
^FO20,85^A0N,30,30^FB440,2,0,L,0^FD${dados.produto.nome}^FS

// --- 3. DETALHES TÉCNICOS ---
^FO20,155^A0N,20,20^FDLOTE: ${dados.produto.lote}^FS
^FO240,155^A0N,20,20^FQTD: ${dados.produto.peso}^FS
^FO20,180^A0N,20,20^FDARMAZ: ${dados.produto.tipoArmazenamento.substring(0,18)}^FS
^FO10,210^GB460,1,1^FS

// --- 4. DATAS (CRONOLOGIA) ---
^FO20,220^A0N,18,18^FDMANIPULACAO:^FS
^FO160,220^A0N,20,20^FD${fmt(dados.datas.manipulacao)} ${fmtHora(dados.datas.manipulacao)}^FS

^FO20,245^A0N,18,18^FDVAL. ORIGINAL:^FS
^FO160,245^A0N,20,20^FD${fmt(dados.datas.validadeOriginal)}^FS

^FO20,270^A0N,18,18^FDRESPONSAVEL:^FS
^FO160,270^A0N,20,20^FD${dados.rastreabilidade.responsavel.substring(0, 12)}^FS

// --- 5. RODAPÉ: VALIDADE FINAL & QR CODE ---
// Caixa Preta para Validade (Destaque Visual)
^FO10,330^GB300,140,140^FS 
^FO25,345^A0N,25,25^FR^FDVALIDADE^FS
^FO25,375^A0N,20,20^FR^FDSANITARIA:^FS
^FO20,410^A0N,42,42^FR^FD${fmt(dados.datas.validadeFinal)}^FS

// QR Code no canto inferior direito
^FO330,340^BQN,2,4^FDQA,${qrContent}^FS

^XZ
  `;
}