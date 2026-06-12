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
 * Parser determinístico para XML de Nota Fiscal Eletrônica (NF-e) Brasileira
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
    const dataVencimento = getValue("dup > vVenc");

    const detNodes = xmlDoc.querySelectorAll("det");
    const itens: ParsedNFItem[] = Array.from(detNodes).map(det => {
      const prod = det.querySelector("prod");
      const infAdProd = det.querySelector("infAdProd")?.textContent || "";
      
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
 * Parser para PDF Digital, Imagens ou Planilhas usando IA (Gemini API)
 */
export async function parseWithAI(file: File): Promise<ParsedNF | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-document', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro na API de IA');
    }

    const data: ParsedNF = await response.json();
    
    // Normalizar datas caso a IA tenha falhado
    if (data.dataEmissao) data.dataEmissao = fmtDate(data.dataEmissao);
    if (data.dataVencimento) data.dataVencimento = fmtDate(data.dataVencimento);
    if (data.itens) {
      data.itens.forEach(it => {
        if (it.validade) it.validade = fmtDate(it.validade);
      });
    }

    return data;
  } catch (err) {
    console.error("Erro no parseWithAI:", err);
    return null;
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

    // Se for XML padrão (estruturado), usa o parser nativo que é 100% preciso, rápido e grátis.
    if (extension === 'xml') {
      const text = await file.text();
      return parseXmlNF(text);
    } 
    // Se for PDF, Imagem, Planilha ou Documento, delega para a IA.
    else if (['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xls', 'xlsx', 'csv'].includes(extension || '')) {
      return parseWithAI(file);
    }
    
    return null;
  } catch (err) {
    console.error("Erro no processNFFile:", err);
    return null;
  }
}
