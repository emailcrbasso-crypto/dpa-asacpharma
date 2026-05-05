'use client'

import { useState, useMemo } from 'react'
import CopyButton from './CopyButton'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Resposta = {
  id: string
  created_at: string
  perfil_lideranca: boolean | null
  localizacao_principal: string
  nota_respeito_profissionalismo: number | null
  justificativa_nota: string | null
  frequencia_linguagem_inadequada: string
  nivel_envolvimento: string
  percepcao_diversidade: string
  autonomia_liderancas: string
  clareza_compliance: string
  relato_blindado: string | null
  tema_sugerido: string | null
  token_convite: string | null
}

export type Token = {
  id: string
  token: string
  nome: string
  email: string
  usado: boolean
  usado_em: string | null
}

export type EnrichedResposta = Resposta & { colaborador: Token | null }

// ── Labels ────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function dist(rows: Resposta[], field: keyof Resposta) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const val = String(row[field] ?? 'N/A')
    counts[val] = (counts[val] ?? 0) + 1
  }
  return counts
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BarRow({ label, count, total, color = 'bg-blue-600' }: { label: string; count: number; total: number; color?: string }) {
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
        <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-700 text-sm leading-tight">{title}</h3>
      {children}
    </div>
  )
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? `${color} text-white border-transparent shadow-sm`
          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PainelDashboard({
  respostas,
  tokens,
  appUrl,
}: {
  respostas: Resposta[]
  tokens: Token[]
  appUrl: string
}) {
  const [filterUnidade, setFilterUnidade] = useState<string[]>([])
  const [filterLideranca, setFilterLideranca] = useState<string[]>([])

  const tokenMap = useMemo(() => new Map(tokens.map((t) => [t.token, t])), [tokens])

  const enriched: EnrichedResposta[] = useMemo(
    () =>
      respostas.map((r) => ({
        ...r,
        colaborador: r.token_convite ? (tokenMap.get(r.token_convite) ?? null) : null,
      })),
    [respostas, tokenMap]
  )

  // Aplicar filtros
  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      const unidadeOk =
        filterUnidade.length === 0 || filterUnidade.includes(r.localizacao_principal)
      const liderancaOk =
        filterLideranca.length === 0 ||
        (filterLideranca.includes('sim') && r.perfil_lideranca === true) ||
        (filterLideranca.includes('nao') && r.perfil_lideranca === false)
      return unidadeOk && liderancaOk
    })
  }, [enriched, filterUnidade, filterLideranca])

  const pendentes = tokens.filter((t) => !t.usado)
  const totalTokens = tokens.length
  const totalRespostas = filtered.length
  const totalRespostasGeral = respostas.length
  const taxa = totalTokens > 0 ? Math.round((totalRespostasGeral / totalTokens) * 100) : 0
  const filtrando = filterUnidade.length > 0 || filterLideranca.length > 0

  // Stats dos dados filtrados
  const notas = filtered.map((x) => x.nota_respeito_profissionalismo).filter((n): n is number => n !== null)
  const notaMedia = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—'
  const distNotas = dist(filtered, 'nota_respeito_profissionalismo')
  const distLoc = dist(filtered, 'localizacao_principal')
  const distFreq = dist(filtered, 'frequencia_linguagem_inadequada')
  const distEnv = dist(filtered, 'nivel_envolvimento')
  const distPerc = dist(filtered, 'percepcao_diversidade')
  const distAuto = dist(filtered, 'autonomia_liderancas')
  const distClar = dist(filtered, 'clareza_compliance')
  const liderancaSim = filtered.filter((x) => x.perfil_lideranca === true).length
  const liderancaNao = filtered.filter((x) => x.perfil_lideranca === false).length

  function toggleUnidade(key: string) {
    setFilterUnidade((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function toggleLideranca(key: string) {
    setFilterLideranca((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function limparFiltros() {
    setFilterUnidade([])
    setFilterLideranca([])
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* ── Filtros ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Unidade:</span>
            {Object.entries(L_LOCALIZACAO).map(([key, label]) => (
              <FilterChip
                key={key}
                label={label}
                active={filterUnidade.includes(key)}
                color="bg-blue-600"
                onClick={() => toggleUnidade(key)}
              />
            ))}
          </div>
          <div className="w-px h-5 bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Liderança:</span>
            <FilterChip
              label="Com liderança"
              active={filterLideranca.includes('sim')}
              color="bg-indigo-600"
              onClick={() => toggleLideranca('sim')}
            />
            <FilterChip
              label="Sem liderança"
              active={filterLideranca.includes('nao')}
              color="bg-slate-600"
              onClick={() => toggleLideranca('nao')}
            />
          </div>
          {filtrando && (
            <button
              onClick={limparFiltros}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap"
            >
              Limpar filtros
            </button>
          )}
        </div>
        {filtrando && (
          <p className="mt-3 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            Exibindo <strong>{totalRespostas}</strong> de <strong>{totalRespostasGeral}</strong> respostas com os filtros selecionados.
          </p>
        )}
      </div>

      {/* ── Resumo ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Colaboradores', value: totalTokens, color: 'text-slate-800' },
          { label: filtrando ? 'Respostas (filtradas)' : 'Respondidos', value: totalRespostas, color: 'text-green-700' },
          { label: 'Pendentes', value: pendentes.length, color: 'text-amber-700' },
          { label: 'Taxa de resposta', value: `${taxa}%`, color: 'text-blue-700' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {totalRespostasGeral === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 text-blue-800 text-sm text-center">
          Nenhuma resposta recebida ainda. Os dados aparecerão aqui conforme os colaboradores enviarem o formulário.
        </div>
      )}

      {totalRespostasGeral > 0 && (
        <>
          {totalRespostas === 0 && filtrando ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5 text-amber-800 text-sm text-center">
              Nenhuma resposta encontrada com os filtros selecionados.
            </div>
          ) : (
            <>
              {/* ── Gráficos ─────────────────────────────── */}
              <section>
                <h2 className="text-base font-bold text-slate-700 mb-4">
                  Análise das respostas
                  {filtrando && <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">filtrado</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ChartCard title="Perfil de liderança">
                    <BarRow label="Liderança (Sim)" count={liderancaSim} total={totalRespostas} color="bg-blue-600" />
                    <BarRow label="Sem liderança (Não)" count={liderancaNao} total={totalRespostas} color="bg-slate-400" />
                  </ChartCard>

                  <ChartCard title="Unidade de atuação">
                    {Object.entries(L_LOCALIZACAO).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distLoc[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>

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
                          color={n === '5' ? 'bg-green-500' : n === '4' ? 'bg-emerald-400' : n === '3' ? 'bg-amber-400' : n === '2' ? 'bg-orange-400' : 'bg-red-500'}
                        />
                      ))}
                    </div>
                  </ChartCard>

                  <ChartCard title="Frequência de linguagem inadequada">
                    {Object.entries(L_FREQUENCIA).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distFreq[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>

                  <ChartCard title="Nível de envolvimento nas situações">
                    {Object.entries(L_ENVOLVIMENTO).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distEnv[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>

                  <ChartCard title="Percepção de ambiente seguro e respeitoso">
                    {Object.entries(L_PERCEPCAO).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distPerc[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>

                  <ChartCard title="Autonomia das lideranças na gestão de pessoas">
                    {Object.entries(L_AUTONOMIA).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distAuto[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>

                  <ChartCard title="Clareza sobre cobrança técnica vs. assédio moral">
                    {Object.entries(L_CLAREZA).map(([key, lbl]) => (
                      <BarRow key={key} label={lbl} count={distClar[key] ?? 0} total={totalRespostas} />
                    ))}
                  </ChartCard>
                </div>
              </section>

              {/* ── Respostas individuais ─────────────────── */}
              <section>
                <h2 className="text-base font-bold text-slate-700 mb-4">Respostas individuais</h2>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['Colaborador', 'Unidade', 'Liderança', 'Nota', 'Freq. Linguagem', 'Envolvimento', 'Percepção', 'Autonomia', 'Clareza'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((resp, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {resp.colaborador ? (
                                <div>
                                  <p className="font-medium text-slate-800">{resp.colaborador.nome}</p>
                                  <p className="text-xs text-slate-400">{resp.colaborador.email}</p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Anônimo</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                              {L_LOCALIZACAO[resp.localizacao_principal] ?? resp.localizacao_principal}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resp.perfil_lideranca ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                                {resp.perfil_lideranca ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex w-8 h-8 rounded-full text-sm font-bold items-center justify-center ${
                                Number(resp.nota_respeito_profissionalismo) >= 4 ? 'bg-green-100 text-green-800'
                                : Number(resp.nota_respeito_profissionalismo) === 3 ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                                {resp.nota_respeito_profissionalismo ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 text-xs">{L_FREQUENCIA[resp.frequencia_linguagem_inadequada] ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">{L_ENVOLVIMENTO[resp.nivel_envolvimento] ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">{L_PERCEPCAO[resp.percepcao_diversidade] ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-[160px]">{L_AUTONOMIA[resp.autonomia_liderancas] ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-700 text-xs">{L_CLAREZA[resp.clareza_compliance] ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ── Justificativas ───────────────────────── */}
              {filtered.some((r) => r.justificativa_nota) && (
                <section>
                  <h2 className="text-base font-bold text-slate-700 mb-4">Justificativas — nota de respeito e profissionalismo</h2>
                  <div className="space-y-3">
                    {filtered.filter((r) => r.justificativa_nota).map((resp, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            Number(resp.nota_respeito_profissionalismo) >= 4 ? 'bg-green-100 text-green-800'
                            : Number(resp.nota_respeito_profissionalismo) === 3 ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                          }`}>Nota {resp.nota_respeito_profissionalismo}</span>
                          {resp.colaborador && <span className="text-xs text-slate-500">{resp.colaborador.nome}</span>}
                          <span className="text-xs text-slate-400">· {L_LOCALIZACAO[resp.localizacao_principal]}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{resp.justificativa_nota}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Relatos ──────────────────────────────── */}
              {filtered.some((r) => r.relato_blindado) && (
                <section>
                  <h2 className="text-base font-bold text-slate-700 mb-4">Relatos para análise técnica — Pergunta 8</h2>
                  <div className="space-y-3">
                    {filtered.filter((r) => r.relato_blindado).map((resp, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                          {resp.colaborador && <span className="text-xs text-slate-500">{resp.colaborador.nome}</span>}
                          <span className="text-xs text-slate-400">· {L_LOCALIZACAO[resp.localizacao_principal]}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{resp.relato_blindado}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Temas sugeridos ───────────────────────── */}
              {filtered.some((r) => r.tema_sugerido) && (
                <section>
                  <h2 className="text-base font-bold text-slate-700 mb-4">Temas sugeridos — Pergunta 9</h2>
                  <div className="space-y-3">
                    {filtered.filter((r) => r.tema_sugerido).map((resp, i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                          {resp.colaborador && <span className="text-xs text-slate-500">{resp.colaborador.nome}</span>}
                          <span className="text-xs text-slate-400">· {L_LOCALIZACAO[resp.localizacao_principal]}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{resp.tema_sugerido}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* ── Tokens pendentes ─────────────────────────────── */}
      {pendentes.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-4">Aguardando resposta ({pendentes.length})</h2>
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

      {/* ── Todos os colaboradores ───────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-slate-700 mb-4">Todos os colaboradores ({totalTokens})</h2>
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
              {tokens.map((tk) => (
                <tr key={tk.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{tk.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{tk.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tk.usado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tk.usado ? 'Respondido' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {tk.usado_em ? new Date(tk.usado_em).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
