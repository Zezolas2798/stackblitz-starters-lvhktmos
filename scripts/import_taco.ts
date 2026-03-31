import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

const FILE_PATH = path.join(process.cwd(), '_knowledge', 'Banco da Dados TBCA', 'TACO.json');
const BATCH_SIZE = 50;

function parseValue(val: any): number | null {
  if (val === undefined || val === null || val === 'NA' || val === '*' || val === 'tr' || val === '-' || val === 'Tr' || val === '') {
    return 0;
  }
  if (typeof val === 'number') return val;
  const num = parseFloat(val.toString().replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

async function runImport() {
  console.log('--- Iniciando Importação TACO ---');
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Arquivo não encontrado:', FILE_PATH);
    return;
  }

  const rawData = fs.readFileSync(FILE_PATH, 'utf8');
  const tacoData = JSON.parse(rawData);

  console.log(`Total de itens encontrados: ${tacoData.length}`);

  let totalProcessed = 0;
  let batch: any[] = [];

  for (const item of tacoData) {
    const carbTotal = parseValue(item.carbohydrate_g) || 0;
    const fiber = parseValue(item.fiber_g) || 0;
    const carbDisponivel = Math.max(0, carbTotal - fiber);

    const record = {
      codigo_externo: `TACO-${item.id}`,
      nome: item.description,
      categoria: item.category,
      fonte: 'TACO',
      energia_kcal: parseValue(item.energy_kcal),
      proteina_g: parseValue(item.protein_g),
      lipideos_g: parseValue(item.lipid_g),
      carboidrato_g: carbTotal,
      carboidrato_disponivel_g: carbDisponivel,
      fibra_alimentar_g: fiber,
      calcio_mg: parseValue(item.calcium_mg),
      magnesio_mg: parseValue(item.magnesium_mg),
      ferro_mg: parseValue(item.iron_mg),
      sodio_mg: parseValue(item.sodium_mg),
      potassio_mg: parseValue(item.potassium_mg),
      zinco_mg: parseValue(item.zinc_mg),
      vitamina_c_mg: parseValue(item.vitaminC_mg),
      colesterol_mg: parseValue(item.cholesterol_mg),
      gordura_saturada_g: parseValue(item.saturated_g),
      gordura_monoinsaturada_g: parseValue(item.monounsaturated_g),
      gordura_poliinsaturada_g: parseValue(item.polyunsaturated_g),
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
  }

  // Lote final
  if (batch.length > 0) {
    const { error } = await supabase
      .from('referencias_nutricionais')
      .upsert(batch, { onConflict: 'codigo_externo' });
    
    if (error) {
      console.error('Erro no último lote:', error.message);
    } else {
      totalProcessed += batch.length;
      console.log(`Concluído! Total: ${totalProcessed}`);
    }
  }
}

runImport().catch(err => {
  console.error('Erro fatal na importação:', err);
});
