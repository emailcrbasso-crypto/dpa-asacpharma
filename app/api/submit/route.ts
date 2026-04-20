import { NextRequest, NextResponse } from 'next/server'
import { formSchema } from '@/lib/schemas'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = formSchema.parse(body)

    // Validar token no servidor (defesa extra contra bypass do frontend)
    if (validated.token_convite) {
      const { data: tokenData } = await supabaseAdmin
        .from('dpa_tokens')
        .select('id, usado')
        .eq('token', validated.token_convite)
        .maybeSingle()

      if (!tokenData) {
        return NextResponse.json({ message: 'Token inválido.' }, { status: 422 })
      }
      if (tokenData.usado) {
        return NextResponse.json(
          { message: 'Este link já foi utilizado.' },
          { status: 422 }
        )
      }
    }

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
      token_convite: validated.token_convite ?? null,
      origem_formulario: 'dpa_asacpharma_v1',
      status: 'enviado',
    }

    const { error: insertError } = await supabaseAdmin
      .from('dpa_respostas')
      .insert(record)

    if (insertError) {
      console.error('[DPA] Supabase insert error:', insertError)
      return NextResponse.json(
        { message: 'Erro ao salvar as respostas. Tente novamente.' },
        { status: 500 }
      )
    }

    // Marcar token como usado (atomicamente: só atualiza se ainda não foi usado)
    if (validated.token_convite) {
      const { data: updated } = await supabaseAdmin
        .from('dpa_tokens')
        .update({ usado: true, usado_em: new Date().toISOString() })
        .eq('token', validated.token_convite)
        .eq('usado', false)
        .select('id')

      if (!updated || updated.length === 0) {
        // Resposta já foi registrada, mas token foi usado em paralelo — não é erro crítico
        console.warn('[DPA] Token já estava marcado como usado:', validated.token_convite)
      }
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
