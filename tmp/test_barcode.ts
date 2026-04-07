// /tmp/test_barcode.ts
const BARCODE_TEST = '7891164028220';
const OFF_URL = `https://br.openfoodfacts.org/api/v0/product/${BARCODE_TEST}.json`;

async function test() {
  console.log(`Buscando produto: ${BARCODE_TEST}...`);
  try {
    const response = await fetch(OFF_URL, {
      headers: { 'User-Agent': 'MinhaAppNutri/1.0 (Windows)' }
    });
    const data = await response.json();
    
    if (data.status === 1) {
      const p = data.product;
      console.log('--- DADOS COMPLETOS PARA ANÁLISE ---');
      console.log('Nome:', p.product_name_pt || p.product_name);
      console.log('Marca:', p.brands);
      console.log('Ingredientes (BR):', p.ingredients_text_pt);
      console.log('Ingredientes (Texto):', p.ingredients_text);
      console.log('Allergens Tags:', p.allergens_tags);
      console.log('Allergens from Ingredients:', p.allergens_from_ingredients);
      console.log('Nutrition Data Per:', p.nutrition_data_per);
      console.log('Serving Quantity:', p.serving_quantity);
      console.log('Nutriments:', JSON.stringify(p.nutriments, null, 2));
    } else {
      console.log('Produto não encontrado.');
    }
  } catch (err) {
    console.error('Erro na requisição:', err);
  }
}

test();
