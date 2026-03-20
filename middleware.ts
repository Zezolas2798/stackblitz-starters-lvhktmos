import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de proteção de rotas.
 *
 * Rotas públicas (acessíveis sem login): /login e assets.
 * A verificação de sessão no servidor requer @supabase/ssr (createServerClient)
 * para ler os cookies de autenticação. Enquanto isso não for configurado,
 * a proteção de "usuário não autenticado" continua feita no client
 * (ex.: redirect em app/page.tsx e ClientContext).
 *
 * Quando @supabase/ssr estiver em uso, adicione aqui:
 * - createServerClient com cookies
 * - getSession() e redirect para /login se não houver sessão em rotas não públicas
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Não executar em: _next, api, static, favicon, etc.
     * Ajuste o matcher conforme necessário quando implementar auth no server.
     */
    '/((?!_next|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

