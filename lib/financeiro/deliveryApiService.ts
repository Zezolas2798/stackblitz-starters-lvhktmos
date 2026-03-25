/**
 * Delivery Platform API Service
 * Provides normalized interfaces for fetching financial data from delivery platforms.
 * Supports: iFood, Rappi, Uber Eats, AnotaAí, 99Food
 * 
 * NOTE: API calls require homologated credentials from each platform.
 * The system falls back to manual entry when credentials are not configured.
 */

// --- Interfaces ---

export interface DeliveryFinancialSummary {
  receita_bruta: number;
  taxa_plataforma: number;
  repasse_liquido: number;
  pedidos_total: number;
  ticket_medio: number;
}

export interface DeliveryIntegration {
  id: string;
  cliente_id: string;
  unidade_id?: string;
  plataforma: 'IFOOD' | 'RAPPI' | 'UBER_EATS' | 'ANOTAAI' | '99FOOD' | 'OUTRO';
  nome_exibicao: string;
  client_id?: string;
  client_secret_encrypted?: string;
  merchant_id?: string;
  webhook_url?: string;
  taxa_mdr: number;
  ativo: boolean;
}

export interface PdvIntegration {
  id: string;
  cliente_id: string;
  unidade_id?: string;
  nome: string;
  tipo_pdv: 'TOTVS' | 'STONE' | 'CIELO' | 'LINX' | 'OUTRO';
  api_endpoint?: string;
  api_key_encrypted?: string;
  ativo: boolean;
}

export type PlataformaType = DeliveryIntegration['plataforma'];
export type PdvType = PdvIntegration['tipo_pdv'];

// --- Platform Metadata ---

export const PLATAFORMA_META: Record<PlataformaType, {
  label: string;
  color: string;
  logo: string; // emoji fallback
  docsUrl: string;
}> = {
  IFOOD: {
    label: 'iFood',
    color: '#EA1D2C',
    logo: '🍔',
    docsUrl: 'https://developer.ifood.com.br',
  },
  RAPPI: {
    label: 'Rappi',
    color: '#FF441F',
    logo: '🛵',
    docsUrl: 'https://dev-portal.rappi.com',
  },
  UBER_EATS: {
    label: 'Uber Eats',
    color: '#06C167',
    logo: '🥗',
    docsUrl: 'https://developer.uber.com/docs/eats',
  },
  ANOTAAI: {
    label: 'Anota AI',
    color: '#6C63FF',
    logo: '📝',
    docsUrl: 'https://anotaai.com/integracao',
  },
  '99FOOD': {
    label: '99Food',
    color: '#FFCB05',
    logo: '🚗',
    docsUrl: 'https://99app.com/food',
  },
  OUTRO: {
    label: 'Outro',
    color: '#607D8B',
    logo: '📦',
    docsUrl: '',
  },
};

export const PDV_META: Record<PdvType, { label: string; color: string }> = {
  TOTVS: { label: 'TOTVS / Bematech', color: '#0066CC' },
  STONE: { label: 'Stone', color: '#00A868' },
  CIELO: { label: 'Cielo', color: '#0033CC' },
  LINX: { label: 'Linx / Degust', color: '#FF6600' },
  OUTRO: { label: 'Outro', color: '#607D8B' },
};

// --- API Functions (Stubs — require real platform credentials) ---

/**
 * Authenticate with iFood Merchant API
 * Requires homologated clientId + clientSecret from portal.ifood.com.br
 */
export async function authenticateIfood(clientId: string, clientSecret: string): Promise<{ token: string; expiresIn: number } | null> {
  try {
    // iFood OAuth2 Token endpoint
    const response = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grantType: 'client_credentials',
        clientId,
        clientSecret,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { token: data.accessToken, expiresIn: data.expiresIn };
  } catch {
    return null;
  }
}

/**
 * Fetch iFood financial summary for a given period
 */
export async function fetchIfoodFinancials(
  token: string,
  merchantId: string,
  mesAno: string // YYYY-MM
): Promise<DeliveryFinancialSummary | null> {
  try {
    // iFood Financial API endpoint (varies by version)
    const [year, month] = mesAno.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

    const response = await fetch(
      `https://merchant-api.ifood.com.br/financial/v1.0/merchants/${merchantId}/financialStatements?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Normalize to our interface (field names vary per API version)
    return {
      receita_bruta: data.totalSales || 0,
      taxa_plataforma: data.totalCommission || 0,
      repasse_liquido: data.totalNetAmount || 0,
      pedidos_total: data.totalOrders || 0,
      ticket_medio: data.totalOrders > 0 ? (data.totalSales || 0) / data.totalOrders : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Test connection to any platform by attempting authentication
 */
export async function testPlatformConnection(
  plataforma: PlataformaType,
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; message: string }> {
  switch (plataforma) {
    case 'IFOOD': {
      const result = await authenticateIfood(clientId, clientSecret);
      return result
        ? { success: true, message: 'Conexão com iFood estabelecida com sucesso!' }
        : { success: false, message: 'Falha na autenticação. Verifique suas credenciais no Portal iFood Developer.' };
    }
    case 'RAPPI':
      return { success: false, message: 'API Rappi Financial: Programa de acesso limitado. Solicite convite em dev-portal.rappi.com.' };
    case 'UBER_EATS':
      return { success: false, message: 'API Uber Eats: Solicite acesso em developer.uber.com/docs/eats.' };
    default:
      return { success: false, message: `Integração via API para ${PLATAFORMA_META[plataforma].label} ainda não suportada. Use o lançamento manual.` };
  }
}
