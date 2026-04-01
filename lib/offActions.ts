'use server';

import { OFFProductResponse } from './offApi';

export type FetchProductResult = {
  success: boolean;
  data?: OFFProductResponse;
  error?: string;
  status?: number;
  details?: string;
};

/**
 * Busca um produto pelo código de barras no Open Food Facts (Diagnóstico Avançado)
 */
export async function fetchProductServer(barcode: string): Promise<FetchProductResult> {
  console.log(`[OFF API] Buscando: ${barcode}`);
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`, {
      headers: {
        'User-Agent': 'MinhaAppNutri - Browser/Web - Version 1.0 - (https://github.com/Zezolas2798/stackblitz-starters-lvhktmos)'
      },
      next: { revalidate: 3600 },
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `Erro HTTP ${response.status}: ${response.statusText}`,
        details: 'O servidor do Open Food Facts recusou a conexão ou está indisponível.'
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error(`[OFF API] Erro fatal:`, err);
    
    let errorMsg = 'Erro de Conexão';
    let details = err.message || 'Erro desconhecido';

    if (err.name === 'AbortError') {
      errorMsg = 'Tempo Esgotado (Timeout)';
      details = 'A API do Open Food Facts demorou demais para responder (mais de 8s).';
    } else if (err.message?.includes('fetch')) {
      errorMsg = 'Falha de DNS/Rede';
      details = 'Não foi possível resolver o endereço do servidor. Verifique a internet do servidor.';
    }

    return {
      success: false,
      error: errorMsg,
      details: details
    };
  }
}
