import { supabase } from '@/lib/supabaseClient'
import ClientPortal from './ClientPortal'

export const revalidate = 0; // Disable cache for this route

export default async function PortalFornecedorPage({ params }: { params: { token: string } }) {
  const { token } = params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(token)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center border-t-4 border-red-500">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Inválido</h1>
          <p className="text-gray-600">O link de cotação fornecido é inválido ou está mal formatado.</p>
        </div>
      </div>
    )
  }

  // Call the secure RPC to fetch campaign data for this token
  const { data, error } = await supabase.rpc('obter_dados_portal_fornecedor', { p_token: token })

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center border-t-4 border-red-500">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar Cotação</h1>
          <p className="text-gray-600">
            {error?.message === 'Token inválido ou não encontrado.' 
              ? 'Este link não é mais válido ou foi removido pelo comprador.' 
              : 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.'}
          </p>
        </div>
      </div>
    )
  }

  // The RPC returns jsonb with: fornecedor_nome, status, itens_solicitados
  const { fornecedor_nome, status, itens_solicitados } = data as any

  if (status !== 'AGUARDANDO') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border-t-4 border-blue-500">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cotação Concluída</h1>
          <p className="text-gray-600">
            Esta cotação já foi respondida ou o prazo expirou. Obrigado pela participação!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="bg-white shadow-sm border-b px-4 py-4 md:px-6 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-primary">Portal do Fornecedor</h1>
          <p className="text-sm text-gray-500 truncate">{fornecedor_nome}</p>
        </header>

        <main className="p-4 md:p-6 pb-24">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Cotação de Preços</h2>
            <p className="text-sm text-gray-600">
              Por favor, informe os preços (por Kg ou Litro) para os itens abaixo. 
              Deixe em branco os itens que não possui em estoque.
            </p>
          </div>

          <ClientPortal token={token} initialItems={itens_solicitados} />
        </main>
      </div>
    </div>
  )
}
