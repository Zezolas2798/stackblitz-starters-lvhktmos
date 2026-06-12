import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API GEMINI_API_KEY não está configurada no servidor.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const mimeType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Inicializar o modelo Gemini
    // O modelo gemini-2.5-flash suporta texto, imagens, planilhas e pdf
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Você é um assistente de extração de dados especializado no food service. Analise o documento em anexo (Nota Fiscal, Cotação ou Recibo).
Sua tarefa é extrair as seguintes informações e retornar EXATAMENTE no formato JSON abaixo, sem formatar como código ou adicionar texto extra.
O JSON deve obedecer à seguinte estrutura:
{
  "numero": "string",
  "dataEmissao": "string (formato YYYY-MM-DD)",
  "fornecedorCnpj": "string (apenas números, se existir)",
  "fornecedorNome": "string",
  "valorTotalNf": numero,
  "dataVencimento": "string (formato YYYY-MM-DD) ou null se não houver",
  "itens": [
    {
      "codigoProduto": "string",
      "descricao": "string",
      "unidade": "string (ex: KG, UN, CX, L)",
      "quantidade": numero,
      "valorUnitario": numero,
      "valorTotal": numero,
      "lote": "string (se houver)",
      "validade": "string (formato YYYY-MM-DD, se houver)"
    }
  ]
}

REGRAS:
1. Retorne APENAS o objeto JSON. Não inclua blocos markdown (como \`\`\`json).
2. Se uma informação não estiver presente (como cnpj ou vencimento), coloque null.
3. Quantidades e valores monetários devem ser números (float ou int), não strings. Ex: 15.50 em vez de "15,50".
4. Tente mapear unidades de medida comumente usadas (KG, UN, CX, LT).`;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Limpar o texto caso o LLM insira marcações markdown por acidente
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Erro na API parse-document:', error);
    return NextResponse.json({ error: 'Falha ao processar o arquivo com Inteligência Artificial.', details: error.message }, { status: 500 });
  }
}
