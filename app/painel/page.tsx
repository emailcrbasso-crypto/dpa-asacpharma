import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import CopyButton from '@/components/CopyButton'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dist(rows: Record<string, unknown>[], field: string) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const val = String(row[field] ?? 'N/A')
    counts[val] = (counts[val] ?? 0) + 1
  }
  return counts
}

function BarRow({
  label,
  count,
  total,
  color = 'bg-blue-600',
}: {
  label: string
  count: number
  total: number
  color?: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-slate-800">
          {count} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="bg-slate-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-700 text-sm leading-tight">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Logout server action
// ---------------------------------------------------------------------------

async function logout() {
  'use server'
  cookies().delete('dpa_auth')
  redirect('/painel/login')
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PainelPage() {
  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin
      .from('dpa_respostas')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('dpa_tokens').select('*').order('nome'),
  ])

  const r = (respostas ?? []) as Record<string, unknown>[]
  const t = (tokens ?? []) as {
    id: string
    token: string
    nome: string
    email: string
    usado: boolean
    usado_em: string | null
    created_at: string
  }[]

  const totalTokens = t.length
  const totalRespostas = r.length
  const pendentes = t.filter((x) => !x.usado)
  const taxa = totalTokens > 0 ? Math.round((totalRespostas / totalTokens) * 100) : 0

  // Join respostas → tokens
  type TokenRow = (typeof t)[number]
  type EnrichedRow = Record<string, unknown> & { colaborador: TokenRow | null }

  const tokenMap = new Map(t.map((x) => [x.token, x]))
  const enriched: EnrichedRow[] = r.map((resp) => ({
    ...resp,
    colaborador: resp.token_convite
      ? (tokenMap.get(resp.token_convite as string) ?? null)
      : null,
  })) as EnrichedRow[]

  // Aggregates
  const distLoc = dist(r, 'localizacao_principal')
  const distFreq = dist(r, 'frequencia_linguagem_inadequada')
  const distEnv = dist(r, 'nivel_envolvimento')
  const distPerc = dist(r, 'percepcao_diversidade')
  const distAuto = dist(r, 'autonomia_liderancas')
  const distClar = dist(r, 'clareza_compliance')

  const notas = r
    .map((x) => Number(x.nota_respeito_profissionalismo))
    .filter((n) => !isNaN(n))
  const notaMedia =
    notas.length > 0
      ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)
      : '—'
  const distNotas = dist(r, 'nota_respeito_profissionalismo')

  const liderancaSim = r.filter((x) => x.perfil_lideranca === true).length
  const liderancaNao = r.filter((x) => x.perfil_lideranca === false).length

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://dpa-asacpharma.vercel.app'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0F62AC] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-crbasso.png.png"
              alt="CR BASSO Educação Corporativa"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-white font-bold text-lg leading-tight">
              Painel DPA — ASAC PHARMA
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-blue-300 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Resumo ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Colaboradores', value: totalTokens, color: 'text-slate-800' },
            { label: 'Respondidos', value: totalRespostas, color: 'text-green-700' },
            { label: 'Pendentes', value: pendentes.length, color: 'text-amber-700' },
            { label: 'Taxa de resposta', value: `${taxa}%`, color: 'text-blue-700' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm"
            >
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {totalRespostas === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 text-blue-800 text-sm text-center">
            Nenhuma resposta recebida ainda. Os dados aparecerão aqui conforme os colaboradores enviarem o formulário.
          </div>
        )}

        {totalRespostas > 0 && (
          <>
            {/* ── Gráficos ───────────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4">Análise das respostas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Liderança */}
                <ChartCard title="Perfil de liderança">
                  <BarRow label="Liderança (Sim)" count={liderancaSim} total={totalRespostas} color="bg-blue-600" />
                  <BarRow label="Sem liderança (Não)" count={liderancaNao} total={totalRespostas} color="bg-slate-400" />
                </ChartCard>

                {/* Unidade */}
                <ChartCard title="Unidade de atuação">
                  {Object.entries(L_LOCALIZACAO).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distLoc[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

                {/* Nota média */}
                <ChartCard title="Nota de respeito e profissionalismo">
                  <div className="text-center py-2">
                    <p className="text-5xl font-bold text-blue-700">{notaMedia}</p>
                    <p className="text-sm text-slate-400 mt-1">média (escala 1–5)</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {['5', '4', '3', '2', '1'].map((n) => (
                      <BarRow
                        key={n}
                        label={`Nota ${n}`}
                        count={distNotas[n] ?? 0}
                        total={totalRespostas}
                        color={
                          n === '5' ? 'bg-green-500'
                          : n === '4' ? 'bg-emerald-400'
                          : n === '3' ? 'bg-amber-400'
                          : n === '2' ? 'bg-orange-400'
                          : 'bg-red-500'
                        }
                      />
                    ))}
                  </div>
                </ChartCard>

                {/* Frequência linguagem */}
                <ChartCard title="Frequência de linguagem inadequada">
                  {Object.entries(L_FREQUENCIA).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distFreq[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

                {/* Nível de envolvimento */}
                <ChartCard title="Nível de envolvimento nas situações">
                  {Object.entries(L_ENVOLVIMENTO).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distEnv[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

                {/* Percepção diversidade */}
                <ChartCard title="Percepção de ambiente seguro e respeitoso">
                  {Object.entries(L_PERCEPCAO).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distPerc[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

                {/* Autonomia lideranças */}
                <ChartCard title="Autonomia das lideranças na gestão de pessoas">
                  {Object.entries(L_AUTONOMIA).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distAuto[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

                {/* Clareza compliance */}
                <ChartCard title="Clareza sobre cobrança técnica vs. assédio moral">
                  {Object.entries(L_CLAREZA).map(([key, label]) => (
                    <BarRow key={key} label={label} count={distClar[key] ?? 0} total={totalRespostas} />
                  ))}
                </ChartCard>

              </div>
            </section>

            {/* ── Respostas individuais ──────────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4">Respostas individuais</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {[
                          'Colaborador', 'Unidade', 'Liderança', 'Nota',
                          'Freq. Linguagem', 'Envolvimento', 'Percepção', 'Autonomia', 'Clareza',
                        ].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enriched.map((resp, i) => {
                        const col = resp.colaborador as { nome: string; email: string } | null
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {col ? (
                                <div>
                                  <p className="font-medium text-slate-800">{col.nome}</p>
                                  <p className="text-xs text-slate-400">{col.email}</p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Anônimo</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                              {L_LOCALIZACAO[resp.localizacao_principal as string] ?? resp.localizacao_principal as string}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                resp.perfil_lideranca ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {resp.perfil_lideranca ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${
                                Number(resp.nota_respeito_profissionalismo) >= 4 ? 'bg-green-100 text-green-800'
                                : Number(resp.nota_respeito_profissionalismo) === 3 ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                                {String(resp.nota_respeito_profissionalismo)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 text-xs">
                              {L_FREQUENCIA[resp.frequencia_linguagem_inadequada as string] ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">
                              {L_ENVOLVIMENTO[resp.nivel_envolvimento as string] ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">
                              {L_PERCEPCAO[resp.percepcao_diversidade as string] ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">
                              {L_AUTONOMIA[resp.autonomia_liderancas as string] ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs">
                              {L_CLAREZA[resp.clareza_compliance as string] ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── Justificativas das notas ──────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4">
                Justificativas — nota de respeito e profissionalismo
              </h2>
              <div className="space-y-3">
                {enriched
                  .filter((r) => r.justificativa_nota)
                  .map((resp, i) => {
                    const col = resp.colaborador as { nome: string } | null
                    return (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            Number(resp.nota_respeito_profissionalismo) >= 4 ? 'bg-green-100 text-green-800'
                            : Number(resp.nota_respeito_profissionalismo) === 3 ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                            Nota {String(resp.nota_respeito_profissionalismo)}
                          </span>
                          {col && <span className="text-xs text-slate-500">{col.nome}</span>}
                          <span className="text-xs text-slate-400">
                            · {L_LOCALIZACAO[resp.localizacao_principal as string]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {String(resp.justificativa_nota)}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </section>

            {/* ── Relatos (P8) ──────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4">
                Relatos para análise técnica — Pergunta 8
              </h2>
              <div className="space-y-3">
                {enriched
                  .filter((r) => r.relato_blindado)
                  .map((resp, i) => {
                    const col = resp.colaborador as { nome: string } | null
                    return (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500">
                            #{i + 1}
                          </span>
                          {col && <span className="text-xs text-slate-500">{col.nome}</span>}
                          <span className="text-xs text-slate-400">
                            · {L_LOCALIZACAO[resp.localizacao_principal as string]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {String(resp.relato_blindado)}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </section>

            {/* ── Temas sugeridos (P9) ─────────────────── */}
            <section>
              <h2 className="text-base font-bold text-slate-700 mb-4">
                Temas sugeridos — Pergunta 9
              </h2>
              <div className="space-y-3">
                {enriched
                  .filter((r) => r.tema_sugerido)
                  .map((resp, i) => {
                    const col = resp.colaborador as { nome: string } | null
                    return (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                          {col && <span className="text-xs text-slate-500">{col.nome}</span>}
                          <span className="text-xs text-slate-400">
                            · {L_LOCALIZACAO[resp.localizacao_principal as string]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {String(resp.tema_sugerido)}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </section>
          </>
        )}

        {/* ── Tokens pendentes ──────────────────────────── */}
        {pendentes.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-700 mb-4">
              Aguardando resposta ({pendentes.length})
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">E-mail</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Link único</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendentes.map((tk) => (
                    <tr key={tk.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{tk.nome}</td>
                      <td className="px-4 py-3 text-slate-600">{tk.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono truncate max-w-[260px]">
                            {appUrl}/?token={tk.token}
                          </span>
                          <CopyButton text={`${appUrl}/?token=${tk.token}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Todos os tokens ──────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-4">
            Todos os colaboradores ({totalTokens})
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">E-mail</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Respondido em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {t.map((tk) => (
                  <tr key={tk.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{tk.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{tk.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tk.usado
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tk.usado ? 'Respondido' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {tk.usado_em
                        ? new Date(tk.usado_em).toLocaleString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      <footer className="text-center text-xs text-slate-400 py-6">
        © {new Date().getFullYear()} CR BASSO Educação Corporativa — Uso interno
      </footer>
    </div>
  )
}
