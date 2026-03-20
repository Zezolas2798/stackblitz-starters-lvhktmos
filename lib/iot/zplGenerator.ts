import { format } from 'date-fns';

export interface DadosEtiqueta {
  empresa: {
    razaoSocial: string;
    cnpj: string;
    cep?: string;
    enderecoCompleto?: string;
    enderecoResumido: string;
  };
  produto: {
    nome: string;
    lote: string;
    marcaForn?: string;
    sif?: string;
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
    codigoRef?: string;
  }
}

/**
 * GERA O CÓDIGO ZPL PARA ETIQUETA QUADRADA 60mm x 60mm
 * Densidade: 203dpi (8 dots/mm) -> Canvas aprox. 480x480 dots
 */
export function gerarZPL(dados: DadosEtiqueta, quantidadeCopias: number = 1): string {
  const fmt = (d?: Date | string) => {
    if (!d) return "N/A";
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return format(dateObj, 'dd/MM/yyyy');
  };
  
  const fmtCompleto = (d: Date) => format(d, 'dd/MM/yyyy - HH:mm:ss');

  // QR Code Compacto
  const qrContent = `ID:${dados.rastreabilidade.idInterno}|L:${dados.produto.lote}`;

  return `
^XA
^PW480
^LL480
^PON

// --- MOLDURA ---
^FO10,10^GB460,460,3^FS

// --- 1. PRODUTO (DESTAQUE TOPO) ---
^FO25,30^A0N,35,35^FB430,1,0,L,0^FD${dados.produto.nome.toUpperCase()}^FS

// --- 2. STATUS E PESO ---
^FO25,75^A0N,22,22^FD${dados.produto.tipoArmazenamento.toUpperCase()}^FS
^FO380,75^A0N,22,22^FB80,1,0,R,0^FD${dados.produto.peso}^FS
^FO25,105^GB430,1,1^FS

// --- 3. DATAS (DADOS DE RASTREIO) ---
^FO25,120^A0N,18,18^FDVAL. ORIGINAL:^FS
^FO180,120^A0N,18,18^FB280,1,0,R,0^FD${fmt(dados.datas.validadeOriginal)}^FS

^FO25,145^A0N,18,18^FDMANIPULACAO:^FS
^FO180,145^A0N,18,18^FB280,1,0,R,0^FD${fmtCompleto(dados.datas.manipulacao)}^FS

^FO25,170^A0N,18,18^FDVALIDADE:^FS
^FO180,170^A0N,18,18^FB280,1,0,R,0^FD${fmtCompleto(dados.datas.validadeFinal)}^FS

^FO25,195^A0N,18,18^FDMARCA / FORN:^FS
^FO180,195^A0N,18,18^FB280,1,0,R,0^FD${(dados.produto.marcaForn || 'PROPRIO').toUpperCase()}^FS

^FO25,220^A0N,18,18^FDSIF:^FS
^FO180,220^A0N,18,18^FB280,1,0,R,0^FD${dados.produto.sif || 'N/A'}^FS

^FO25,250^GB430,1,1^FS

// --- 4. RESPONSAVEL E EMPRESA ---
^FO25,270^A0N,20,20^FDRESP.: ^FS
^FO90,270^A0N,20,20^FD${dados.rastreabilidade.responsavel.toUpperCase()}^FS

^FO25,295^A0N,16,16^FD${dados.empresa.razaoSocial.toUpperCase()}^FS
^FO25,315^A0N,14,14^FDCNPJ: ${dados.empresa.cnpj}  CEP: ${dados.empresa.cep || ''}^FS
^FO25,335^A0N,14,14^FB430,2,0,L,0^FD${(dados.empresa.enderecoCompleto || dados.empresa.enderecoResumido).toUpperCase()}^FS

^FO25,375^A0N,22,22^FD#${dados.rastreabilidade.codigoRef || dados.rastreabilidade.idInterno.substring(0, 8).toUpperCase()}^FS

// --- 5. QR CODE ---
^FO340,350^BQN,2,4^FDQA,${qrContent}^FS

^PQ${quantidadeCopias}
^XZ
  `;
}


