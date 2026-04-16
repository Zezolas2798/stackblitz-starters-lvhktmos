
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFunction() {
  const receita_id = '70227902-2c1d-447f-b7bc-443fd1e30731' // Barra de Chocolate com brigadeiro
  
  console.log(`Testing function for recipe ID: ${receita_id}`)
  
  // NOTE: This will fail if not authenticated, unless the function allows anon calls.
  // The function seems to require an Authorization header (line 802).
  // I'll try to get a session or just see if it errors with "Não autorizado".
  
  const { data, error } = await supabase.functions.invoke('calcular-nutrientes', {
    body: { receita_id }
  })
  
  if (error) {
    console.error('Error invoking function:', error)
  } else {
    console.log('Result:', JSON.stringify(data, null, 2))
    if (data.declaracoes) {
        console.log('Allergens string:', data.declaracoes.alergenicos)
    }
  }
}

testFunction()
