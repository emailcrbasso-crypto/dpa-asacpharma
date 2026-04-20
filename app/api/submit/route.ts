import { NextRequest, NextResponse } from 'next/server'
import { formSchema } from '@/lib/schemas'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validated = formSchema.parse(body)

    const record = {
      perfil_lideranca: validated.perfil_lideranca === 'sim',
      localizacao_principal: validated.localizacao_principal,
      nota_respeito_profissionalismo: validated.nota_respeito_profissionalismo,
      justificativa_nota: validated.justificativa_nota,
      frequencia_linguagem_inadequada: validated.frequencia_linguagem_inadequada,
      nivel_envolvimento: validated.nivel_envolvimento,
      percepcao_diversidade: validated.percepcao_diversidade,
      autonomia_liderancas: validated.autonomia_liderancas,
      clareza_compliance: validated.clareza_compliance,
      relato_blindado: validated.relato_blindado,
      tema_sugerido: validated.tema_sugerido,
      origem_formulario: 'dpa_asacpharma_v1',
      status: 'enviado',
    }

    const { error } = await supabaseAdmin
      .from('dpa_respostas')
      .insert(record)

    if (error) {
      console.error('[DPA] Supabase insert error:', error)
      return NextResponse.json(
        { message: 'Erro ao salvar as respostas. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Respostas enviadas com sucesso.' },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos.', errors: err.flatten().fieldErrors },
        { status: 422 }
      )
    }

    console.error('[DPA] Unexpected error:', err)
    return NextResponse.json(
      { message: 'Erro interno. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}
