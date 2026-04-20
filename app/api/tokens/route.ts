import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { z } from 'zod'

function checkSecret(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  return secret === process.env.TOKENS_API_SECRET
}

// GET — lista tokens (usado pelo n8n)
// ?secret=xxx            → todos
// ?secret=xxx&usado=false → apenas pendentes
// ?secret=xxx&usado=true  → apenas respondidos
export async function GET(request: NextRequest) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const usado = request.nextUrl.searchParams.get('usado')

  let query = supabaseAdmin.from('dpa_tokens').select('*').order('nome')
  if (usado === 'true') query = query.eq('usado', true)
  if (usado === 'false') query = query.eq('usado', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://dpa-asacpharma.vercel.app'

  return NextResponse.json(
    data?.map((t) => ({
      id: t.id,
      nome: t.nome,
      email: t.email,
      token: t.token,
      link: `${appUrl}/?token=${t.token}`,
      usado: t.usado,
      usado_em: t.usado_em ?? null,
      created_at: t.created_at,
    }))
  )
}

// POST — cria tokens em lote
// Body: [{ "nome": "João Silva", "email": "joao@..." }, ...]
const bulkSchema = z.array(
  z.object({
    nome: z.string().min(1),
    email: z.string().email(),
  })
)

export async function POST(request: NextRequest) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let parsed: z.infer<typeof bulkSchema>
  try {
    parsed = bulkSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 422 })
  }

  const { data, error } = await supabaseAdmin
    .from('dpa_tokens')
    .insert(parsed.map((p) => ({ nome: p.nome, email: p.email })))
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://dpa-asacpharma.vercel.app'

  return NextResponse.json(
    data?.map((t) => ({
      nome: t.nome,
      email: t.email,
      token: t.token,
      link: `${appUrl}/?token=${t.token}`,
    })),
    { status: 201 }
  )
}
