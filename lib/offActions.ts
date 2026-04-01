'use server';

import { OFFProductResponse } from './offApi';

/**
 * Busca um produto pelo código de barras no Open Food Facts (Executado no Servidor para evitar CORS)
 */
export async function fetchProductServer(barcode: string): Promise<OFFProductResponse> {
  console.log(`[OFF API] Buscando produto: ${barcode}`);
  
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'MinhaAppNutri - WebApp - 1.0'
      },
      next: { revalidate: 3600 } // Cache opcional de 1 hora
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error(`[OFF API] Erro na busca server-side:`, err);
    throw new Error('Falha ao conectar com o serviço de produtos (Open Food Facts)');
  }
}
