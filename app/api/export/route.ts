import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const L_LOCALIZACAO: Record<string, string> = {
  escritorio_paulista: 'Escritório (Paulista)',
  laboratorio: 'Laboratório',
  producao: 'Produção',
}
const L_FREQUENCIA: Record<string, string> = {
  nunca: 'Nunca',
  raramente: 'Raramente',
  frequentemente: 'Frequentemente',
  sempre: 'Sempre',
}
const L_ENVOLVIMENTO: Record<string, string> = {
  ocorreu_comigo: 'Ocorreu comigo',
  presenciei_colegas: 'Presenciei em colegas',
  ocorreu_comigo_e_presenciei: 'Ocorreu comigo + presenciei',
  nao_se_aplica: 'Não se aplica',
}
const L_PERCEPCAO: Record<string, string> = {
  sim_totalmente: 'Sim, totalmente',
  maioria_das_vezes: 'Na maioria das vezes',
  condutas_inadequadas_ou_discriminatorias: 'Condutas inadequadas/discriminatórias',
}
const L_AUTONOMIA: Record<string, string> = {
  autonomas: 'Lideranças autônomas',
  resolvem_parte_e_recorrem_rh: 'Resolvem parte, recorrem ao RH',
  quase_tudo_depende_rh: 'Quase tudo depende do RH',
}
const L_CLAREZA: Record<string, string> = {
  total_clareza: 'Tenho total clareza',
  algumas_duvidas: 'Tenho algumas dúvidas',
  nao_esta_clara: 'Não está clara',
}

function label<T extends Record<string, string>>(map: T, val: unknown): string {
  return map[String(val ?? '')] ?? String(val ?? '')
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toRow(row: Record<string, unknown>): string[] {
  return [
    row.created_at ? new Date(row.created_at as string).toLocaleString('pt-BR') : '',
    row.perfil_lideranca === true ? 'Sim' : row.perfil_lideranca === false ? 'Não' : '',
    label(L_LOCALIZACAO, row.localizacao_principal),
    String(row.nota_respeito_profissionalismo ?? ''),
    String(row.justificativa_nota ?? ''),
    label(L_FREQUENCIA, row.frequencia_linguagem_inadequada),
    label(L_ENVOLVIMENTO, row.nivel_envolvimento),
    label(L_PERCEPCAO, row.percepcao_diversidade),
    label(L_AUTONOMIA, row.autonomia_liderancas),
    label(L_CLAREZA, row.clareza_compliance),
    String(row.relato_blindado ?? ''),
    String(row.tema_sugerido ?? ''),
  ]
}

export async function GET(req: NextRequest) {
  // Auth check
  const cookieStore = cookies()
  const auth = cookieStore.get('dpa_auth')
  const expected = Buffer.from(process.env.PAINEL_SECRET ?? '').toString('base64')
  if (!auth?.value || auth.value !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mode = req.nextUrl.searchParams.get('mode') ?? 'anonimo'
  const completo = mode === 'completo'

  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin.from('dpa_respostas').select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from('dpa_tokens').select('*'),
  ])

  const tokenMap = new Map((tokens ?? []).map((t) => [t.token, t]))

  const headerCompleto = ['Nome', 'E-mail']
  const headerDados = [
    'Data/Hora',
    'Perfil Liderança',
    'Localização',
    'Nota Respeito/Prof.',
    'Justificativa',
    'Freq. Linguagem Inadequada',
    'Nível Envolvimento',
    'Percepção Diversidade',
    'Autonomia Lideranças',
    'Clareza Compliance',
    'Relato',
    'Tema Sugerido',
  ]

  const header = completo ? [...headerCompleto, ...headerDados] : headerDados

  const rows = (respostas ?? []).map((resp) => {
    const dados = toRow(resp as Record<string, unknown>)
    if (completo) {
      const colab = resp.token_convite ? tokenMap.get(resp.token_convite) : null
      return [colab?.nome ?? '', colab?.email ?? '', ...dados]
    }
    return dados
  })

  const bom = '﻿' // BOM para Excel reconhecer UTF-8
  const csv =
    bom +
    [header, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n')

  const filename = `DPA_ASACPHARMA_${completo ? 'completo' : 'anonimo'}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
