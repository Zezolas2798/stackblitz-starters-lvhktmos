'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface SolicitacaoItem {
  id: string // ingrediente_id
  nome: string
  unidade: string
  quantidade_prevista: number
  marca_preferencial?: string
}

export default function ClientPortal({ 
  token, 
  initialItems 
}: { 
  token: string
  initialItems: SolicitacaoItem[] 
}) {
  const router = useRouter()
  const [precos, setPrecos] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handlePriceChange = (id: string, value: string) => {
    // Apenas permite números e ponto/vírgula
    if (/^[\d.,]*$/.test(value)) {
      setPrecos(prev => ({ ...prev, [id]: value }))
    }
  }

  const handleSubmit = async () => {
    setErrorMsg('')
    setIsSubmitting(true)

    // Prepara os dados para o formato que a RPC espera
    const precosSubmissao: any[] = []

    for (const item of initialItems) {
      const rawVal = precos[item.id]
      if (rawVal && rawVal.trim() !== '') {
        // Converte string pt-BR para numérico
        const numVal = parseFloat(rawVal.replace(/\./g, '').replace(',', '.'))
        if (!isNaN(numVal) && numVal > 0) {
          precosSubmissao.push({
            ingrediente_id: item.id,
            preco_por_kg_l: numVal
          })
        }
      }
    }

    if (precosSubmissao.length === 0) {
      setErrorMsg('Por favor, informe o preço de pelo menos um item.')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.rpc('processar_resposta_cotacao', {
        p_token: token,
        p_precos: precosSubmissao
      })

      if (error) {
        console.error('Erro ao enviar cotação:', error)
        setErrorMsg('Ocorreu um erro ao enviar a cotação. Tente novamente.')
        setIsSubmitting(false)
      } else {
        // Sucesso! Atualiza a página para mostrar a tela de "Concluída"
        router.refresh()
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
      setErrorMsg('Erro inesperado de conexão.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {initialItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.nome}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                  Und: {item.unidade}
                </span>
                {item.marca_preferencial && (
                  <span className="text-primary/80">Marca ref: {item.marca_preferencial}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Qtd est.: {item.quantidade_prevista} {item.unidade}
              </p>
            </div>
            
            <div className="w-full md:w-48 shrink-0">
              <label className="block text-xs text-gray-500 mb-1 font-medium">Preço (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precos[item.id] || ''}
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border shadow-sm transition-colors"
                  placeholder="0,00"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:relative md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar Cotação'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
