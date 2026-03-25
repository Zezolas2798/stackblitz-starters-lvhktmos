import Tesseract from 'tesseract.js';

export interface ParsedNFItem {
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  lote?: string;
  validade?: string;
  codigoProduto?: string;
}

export interface ParsedNF {
  numero: string;
  dataEmissao: string;
  fornecedorCnpj?: string;
  fornecedorNome?: string;
  valorTotalNf: number;
  dataVencimento?: string;
  itens: ParsedNFItem[];
}

/**
 * Parser para XML de Nota Fiscal Eletrônica (NF-e) Brasileira
 */
export async function parseXmlNF(xmlText: string): Promise<ParsedNF> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const getValue = (selector: string, parent: Element | Document = xmlDoc) => {
      const el = parent.querySelector(selector);
      return el ? (el.textContent || "").trim() : "";
    };

    const numero = getValue("nNF");
    const dataEmissao = getValue("dhEmi") || getValue("dEmi") || new Date().toISOString();
    const fornecedorCnpj = getValue("emit > CNPJ");
    const fornecedorNome = getValue("emit > xNome");
    const valorTotalNf = parseFloat(getValue("vNF") || "0") || 0;
    const dataVencimento = getValue("dup > vVenc"); // Tenta pegar vencimento da primeira duplicata

    const detNodes = xmlDoc.querySelectorAll("det");
    const itens: ParsedNFItem[] = Array.from(detNodes).map(det => {
      const prod = det.querySelector("prod");
      const infAdProd = det.querySelector("infAdProd")?.textContent || "";
      
      // Tenta extrair lote e validade de informações adicionais
      const loteMatch = infAdProd.match(/Lote:\s*([^\s|]+)/i);
      const valMatch = infAdProd.match(/Validade:\s*([^\s|]+)/i);

      return {
        codigoProduto: prod?.querySelector("cProd")?.textContent || "",
        descricao: prod?.querySelector("xProd")?.textContent || "Item sem descrição",
        unidade: prod?.querySelector("uCom")?.textContent || "UN",
        quantidade: parseFloat(prod?.querySelector("qCom")?.textContent || "0") || 0,
        valorUnitario: parseFloat(prod?.querySelector("vUnCom")?.textContent || "0") || 0,
        valorTotal: parseFloat(prod?.querySelector("vProd")?.textContent || "0") || 0,
        lote: loteMatch ? loteMatch[1] : undefined,
        validade: valMatch ? fmtDate(valMatch[1]) : undefined,
      };
    });

    return { numero, dataEmissao, fornecedorCnpj, fornecedorNome, valorTotalNf, dataVencimento, itens };
  } catch (err) {
    console.error("Erro no parseXmlNF:", err);
    throw new Error("Falha ao processar o XML da Nota Fiscal.");
  }
}

/**
 * Parser para PDF Digital (Extração via PDF.js)
 */
export async function parsePdfNF(file: File): Promise<ParsedNF | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Configura worker vindo do CDN compatível com a versão instalada
    const version = (pdfjs as any).version || '3.4.120';
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }

    const nNfMatch = fullText.match(/N[ºo].?\s*Nota\s*Fiscal:\s*(\d+)/i) || fullText.match(/N[ºo].?\s*(\d{3}[\d.]+)/);
    const vNfMatch = fullText.match(/VALOR\s*TOTAL\s*D[A|O].?\s*NOTA\D+([\d,.]+)/i);
    
    return {
      numero: nNfMatch ? nNfMatch[1] : `PDF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      dataEmissao: new Date().toISOString().split('T')[0],
      valorTotalNf: vNfMatch ? parseFloat(vNfMatch[1].replace('.','').replace(',','.')) || 0 : 0,
      itens: [] 
    };
  } catch (err) {
    console.error("Erro no parsePdfNF:", err);
    return null;
  }
}

/**
 * Parser para Imagem/Foto (OCR via Tesseract.js)
 */
export async function parseImageNF(file: File): Promise<ParsedNF> {
  try {
    const result = await Tesseract.recognize(file, 'por');
    const text = result.data.text;
    const nNfMatch = text.match(/N[ºo].?\s*(\d+)/);
    
    return {
      numero: nNfMatch ? nNfMatch[1] : "Foto-Leitura",
      dataEmissao: new Date().toISOString().split('T')[0],
      valorTotalNf: 0,
      itens: [
        { descricao: "Item detectado via Foto (IA)", unidade: "UN", quantidade: 1, valorUnitario: 0, valorTotal: 0 }
      ]
    };
  } catch (err) {
    console.error("Erro no parseImageNF:", err);
    return {
      numero: "Erro-OCR",
      dataEmissao: new Date().toISOString().split('T')[0],
      valorTotalNf: 0,
      itens: []
    };
  }
}

// Helpers
function fmtDate(d: string): string {
  if (!d) return "";
  const parts = d.split(/[/.-]/);
  if (parts.length === 3) {
    // DD/MM/YYYY -> YYYY-MM-DD
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return d;
}

export async function processNFFile(file: File): Promise<ParsedNF | null> {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'xml') {
      const text = await file.text();
      return parseXmlNF(text);
    } else if (extension === 'pdf') {
      return parsePdfNF(file);
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return parseImageNF(file);
    }
    return null;
  } catch (err) {
    console.error("Erro no processNFFile:", err);
    return null;
  }
}
