import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Idealmente usar a Service Role Key se disponível, mas Anon funciona se o RLS permitir.
const supabase = createClient(supabaseUrl, supabaseKey);

const FILE_PATH = path.join(process.cwd(), '_knowledge', 'Banco da Dados TBCA', 'TBCA - JSON_DATA.csv');
const BATCH_SIZE = 100;

function parseValue(val: string): number | null {
  if (!val || val === 'NA' || val === '*' || val === 'tr' || val === '-') return 0;
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

async function runImport() {
  console.log('--- Iniciando Importação TBCA ---');
  
  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch: any[] = [];
  let totalProcessed = 0;

  for await (const line of rl) {
    try {
      // O CSV do usuário tem aspas duplas escapadas: "{""codigo"": ...}"
      // Removemos as aspas das extremidades e des-escapamos as internas
      let cleanLine = line.trim();
      if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
        cleanLine = cleanLine.substring(1, cleanLine.length - 1);
      }
      cleanLine = cleanLine.replace(/""/g, '"');

      if (!cleanLine) continue;

      const data = JSON.parse(cleanLine);
      const nutrients = data.nutrientes || [];

      const getNut = (name: string, unit?: string) => {
        const n = nutrients.find((item: any) => 
          item.Componente.toLowerCase().includes(name.toLowerCase()) && 
          (!unit || item.Unidades === unit)
        );
        return n ? parseValue(n['Valor por 100g']) : 0;
      };

      const record = {
        codigo_externo: data.codigo,
        nome: data.descricao,
        categoria: data.classe,
        fonte: 'TBCA',
        energia_kcal: getNut('Energia', 'kcal'),
        proteina_g: getNut('Proteína'),
        lipideos_g: getNut('Lipídios'),
        carboidrato_g: getNut('Carboidrato total'),
        carboidrato_disponivel_g: getNut('Carboidrato disponível'),
        fibra_alimentar_g: getNut('Fibra alimentar'),
        calcio_mg: getNut('Cálcio'),
        magnesio_mg: getNut('Magnésio'),
        ferro_mg: getNut('Ferro'),
        sodio_mg: getNut('Sódio'),
        potassio_mg: getNut('Potássio'),
        zinco_mg: getNut('Zinco'),
        vitamina_c_mg: getNut('Vitamina C'),
        colesterol_mg: getNut('Colesterol'),
        gordura_saturada_g: getNut('Ácidos graxos saturados'),
        gordura_monoinsaturada_g: getNut('Ácidos graxos monoinsaturados'),
        gordura_poliinsaturada_g: getNut('Ácidos graxos poliinsaturados'),
      };

      batch.push(record);

      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase
          .from('referencias_nutricionais')
          .upsert(batch, { onConflict: 'codigo_externo' });

        if (error) {
          console.error('Erro no lote:', error.message);
        } else {
          totalProcessed += batch.length;
          console.log(`Processados: ${totalProcessed}...`);
        }
        batch = [];
      }
    } catch (err) {
      console.error('Erro ao processar linha:', err);
    }
  }

  // Lote final
  if (batch.length > 0) {
    const { error } = await supabase
      .from('referencias_nutricionais')
      .upsert(batch, { onConflict: 'codigo_externo' });
    
    if (error) console.error('Erro no último lote:', error.message);
    else {
      totalProcessed += batch.length;
      console.log(`Concluído! Total: ${totalProcessed}`);
    }
  }
}

runImport();
