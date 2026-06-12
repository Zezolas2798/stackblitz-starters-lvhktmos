import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as xlsx from 'xlsx';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface CotacaoItemParsed {
  descricao_original: string;
  marca: string;
  unidade: string;
  quantidade_embalagem: number;
  peso_liquido_kg: number;
  preco_unitario: number;
  preco_por_kg: number;
  sugestao_subgrupo: string;
}

export interface CotacaoParsed {
  fornecedor_nome: string;
  fornecedor_cnpj: string | null;
  data_cotacao: string;
  itens: CotacaoItemParsed[];
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'A chave da API GEMINI_API_KEY não está configurada no servidor.' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Limite: 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Identificar tipo de arquivo
    const fileName = file.name || '';
    const fileType = file.type || '';
    const isSpreadsheet = 
      fileName.endsWith('.xlsx') || 
      fileName.endsWith('.xls') || 
      fileName.endsWith('.csv') ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileType === 'text/csv';

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const promptText = `Você é um assistente de extração de dados especializado em cotações de fornecedores do food service e da indústria alimentícia.

Analise os dados fornecidos. Eles pertencem a uma COTAÇÃO DE PREÇOS enviada por um fornecedor.

Sua tarefa é extrair as informações e retornar EXATAMENTE no formato JSON abaixo:

{
  "fornecedor_nome": "string (nome do fornecedor, distribuidora ou empresa que enviou a cotação)",
  "fornecedor_cnpj": "string (apenas números) ou null se não houver",
  "data_cotacao": "string (formato YYYY-MM-DD) ou null",
  "itens": [
    {
      "descricao_original": "string (descrição EXATA como aparece no documento, incluindo marca e tamanho)",
      "marca": "string (nome da marca extraída da descrição, ex: 'Dona Benta', 'Nestlé'. Se não identificar, usar '')",
      "unidade": "string (unidade de venda: KG, UN, PCT, CX, FD, SC, LT, GL, etc.)",
      "quantidade_embalagem": number (quantas unidades vêm na embalagem de venda. Ex: CX com 12 = 12, PCT avulso = 1),
      "peso_liquido_kg": number (peso líquido EM QUILOGRAMAS de cada unidade individual. Ex: pacote de 500g = 0.5, saco 25kg = 25, litro = 1. Se for vendido por KG direto, usar 1.0. Se não conseguir determinar, usar 1.0),
      "preco_unitario": number (preço da unidade de venda como aparece no documento),
      "preco_por_kg": number (preço normalizado por quilograma. Calcule: preco_unitario / (quantidade_embalagem * peso_liquido_kg). Se já for vendido por KG, é o próprio preco_unitario),
      "sugestao_subgrupo": "string (nome genérico do tipo de produto, sem marca. Ex: 'Farinha de Trigo', 'Açúcar Refinado', 'Óleo de Soja', 'Detergente Neutro')"
    }
  ]
}

REGRAS CRÍTICAS:
1. Retorne APENAS o objeto JSON.
2. Valores monetários e numéricos devem ser NUMBERS, não strings. Ex: 5.90 não "5,90".
3. Se o documento usa vírgula como separador decimal (padrão brasileiro), converta para ponto. Ex: "5,90" → 5.90.
4. Para LÍQUIDOS (leite, óleo, vinagre, etc.), considere 1 litro = 1 kg para a normalização.
5. O campo "sugestao_subgrupo" deve ser o nome GENÉRICO do produto, sem marca e sem tamanho. Agrupe variantes (ex: "Farinha de Trigo Especial" e "Farinha de Trigo Comum" ambas sugerem "Farinha de Trigo").
6. Se um item tem unidade KG e não especifica embalagem, quantidade_embalagem = 1 e peso_liquido_kg = 1.
7. Extraia TODOS os itens do documento, não pule nenhum.`;

    let responseText = '';

    if (isSpreadsheet) {
      // Processar planilha usando xlsx
      let csvContent = '';
      try {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = xlsx.utils.sheet_to_csv(sheet);
          if (csv.trim().length > 0) {
            csvContent += `--- ABA: ${sheetName} ---\n${csv}\n\n`;
          }
        }
      } catch (xlsxErr: any) {
        console.error('Erro ao ler planilha com xlsx:', xlsxErr);
        return NextResponse.json(
          { error: 'Não foi possível ler a estrutura da planilha. Verifique se o arquivo não está corrompido.' },
          { status: 400 }
        );
      }

      if (!csvContent.trim()) {
        return NextResponse.json(
          { error: 'A planilha enviada parece estar vazia.' },
          { status: 400 }
        );
      }

      const promptWithCsv = `${promptText}\n\nTEXTO DA COTAÇÃO EXTRAÍDO DA PLANILHA:\n${csvContent}`;
      const result = await model.generateContent(promptWithCsv);
      responseText = result.response.text();
    } else {
      // Processar PDF/Imagem via inlineData
      const base64Data = buffer.toString('base64');
      const filePart = {
        inlineData: {
          data: base64Data,
          mimeType: fileType || 'application/pdf',
        },
      };

      const result = await model.generateContent([promptText, filePart]);
      responseText = result.response.text();
    }

    // Limpar caso o LLM insira markdown (mesmo com JSON mode, às vezes acontece)
    const cleanedText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData: CotacaoParsed = JSON.parse(cleanedText);

    // Sanitização dos dados extraídos
    if (parsedData.itens) {
      parsedData.itens = parsedData.itens.map((item) => ({
        descricao_original: String(item.descricao_original || '').slice(0, 500),
        marca: String(item.marca || '').slice(0, 200),
        unidade: String(item.unidade || 'UN').slice(0, 10),
        quantidade_embalagem: Math.max(0.001, Number(item.quantidade_embalagem) || 1),
        peso_liquido_kg: Math.max(0.001, Number(item.peso_liquido_kg) || 1),
        preco_unitario: Math.max(0, Number(item.preco_unitario) || 0),
        preco_por_kg: Math.max(0, Number(item.preco_por_kg) || 0),
        sugestao_subgrupo: String(item.sugestao_subgrupo || '').slice(0, 200),
      }));

      // Recalcular preco_por_kg para garantir consistência
      parsedData.itens = parsedData.itens.map((item) => {
        const pesoTotal = item.quantidade_embalagem * item.peso_liquido_kg;
        const precoCalculado = pesoTotal > 0 ? item.preco_unitario / pesoTotal : 0;
        return {
          ...item,
          preco_por_kg: Number(precoCalculado.toFixed(4)),
        };
      });
    }

    // Sanitizar fornecedor
    parsedData.fornecedor_nome = String(parsedData.fornecedor_nome || 'Fornecedor Não Identificado').slice(0, 300);
    parsedData.fornecedor_cnpj = parsedData.fornecedor_cnpj
      ? String(parsedData.fornecedor_cnpj).replace(/\D/g, '').slice(0, 14)
      : null;

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Erro na API parse-cotacao:', error);
    return NextResponse.json(
      {
        error: 'Falha ao processar o arquivo de cotação com Inteligência Artificial.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

