import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

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

function label<T extends Record<string, string>>(map: T, val: unknown) {
  return map[String(val ?? '')] ?? String(val ?? '—')
}

function dist(rows: Record<string, unknown>[], field: string) {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const val = String(row[field] ?? 'N/A')
    counts[val] = (counts[val] ?? 0) + 1
  }
  return counts
}

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  noStore()

  const cookieStore = cookies()
  const auth = cookieStore.get('dpa_auth')
  const expected = Buffer.from(process.env.PAINEL_SECRET ?? '').toString('base64')
  if (!auth?.value || auth.value !== expected) {
    redirect('/painel/login')
  }

  const mode = searchParams.mode ?? 'anonimo'
  const completo = mode === 'completo'

  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin.from('dpa_respostas').select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from('dpa_tokens').select('*').order('nome'),
  ])

  const r = (respostas ?? []) as Record<string, unknown>[]
  const t = (tokens ?? []) as { id: string; token: string; nome: string; email: string; usado: boolean }[]

  const tokenMap = new Map(t.map((x) => [x.token, x]))
  const totalTokens = t.length
  const totalRespostas = r.length
  const taxa = totalTokens > 0 ? Math.round((totalRespostas / totalTokens) * 100) : 0

  const notas = r.map((x) => Number(x.nota_respeito_profissionalismo)).filter((n) => !isNaN(n))
  const notaMedia = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—'

  const distLoc = dist(r, 'localizacao_principal')
  const distFreq = dist(r, 'frequencia_linguagem_inadequada')
  const distEnv = dist(r, 'nivel_envolvimento')
  const distPerc = dist(r, 'percepcao_diversidade')
  const distAuto = dist(r, 'autonomia_liderancas')
  const distClar = dist(r, 'clareza_compliance')

  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: Arial, sans-serif; background: white; color: #1e293b; margin: 0; }
      `}</style>

      {/* Botões de ação — somem ao imprimir */}
      <div className="no-print bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <button
          onClick={undefined}
          className="bg-[#0F62AC] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
          id="btn-print"
        >
          🖨️ Imprimir / Salvar como PDF
        </button>
        <a href="/painel" className="text-sm text-slate-500 hover:text-slate-700">← Voltar ao painel</a>
        <span className="ml-auto text-xs text-slate-400">
          Modo: <strong>{completo ? 'Completo (com identificação)' : 'Anônimo (sem identificação)'}</strong>
        </span>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('btn-print').onclick = () => window.print()` }} />
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">

        {/* Cabeçalho */}
        <div style={{ borderBottom: '3px solid #0F62AC', paddingBottom: '16px', marginBottom: '24px' }}>
          <p style={{ color: '#0F62AC', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>CR BASSO EDUCAÇÃO CORPORATIVA</p>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Relatório — Diagnóstico Prévio Anônimo (DPA)</h1>
          <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>ASAC PHARMA &nbsp;·&nbsp; Gerado em {dataAtual} &nbsp;·&nbsp; {completo ? 'Exportação Completa' : 'Exportação Anônima'}</p>
        </div>

        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Colaboradores', value: totalTokens },
            { label: 'Respondidos', value: totalRespostas },
            { label: 'Pendentes', value: totalTokens - totalRespostas },
            { label: 'Taxa de resposta', value: `${taxa}%` },
          ].map((c) => (
            <div key={c.label} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F62AC' }}>{c.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Nota média */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Nota média — Respeito e Profissionalismo:</span>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8', marginLeft: '12px' }}>{notaMedia}</span>
          <span style={{ fontSize: '13px', color: '#475569', marginLeft: '6px' }}>/ 10</span>
        </div>

        {/* Distribuições */}
        {[
          { title: 'Localização Principal', d: distLoc, map: L_LOCALIZACAO },
          { title: 'Frequência de Linguagem Inadequada', d: distFreq, map: L_FREQUENCIA },
          { title: 'Nível de Envolvimento', d: distEnv, map: L_ENVOLVIMENTO },
          { title: 'Percepção de Diversidade', d: distPerc, map: L_PERCEPCAO },
          { title: 'Autonomia das Lideranças', d: distAuto, map: L_AUTONOMIA },
          { title: 'Clareza sobre Compliance', d: distClar, map: L_CLAREZA },
        ].map(({ title, d, map }) => (
          <div key={title} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(d).map(([k, v]) => {
                  const pct = totalRespostas > 0 ? Math.round((v / totalRespostas) * 100) : 0
                  return (
                    <tr key={k}>
                      <td style={{ fontSize: '13px', padding: '3px 8px 3px 0', width: '40%' }}>{label(map, k)}</td>
                      <td style={{ width: '45%', padding: '3px 8px' }}>
                        <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '10px' }}>
                          <div style={{ background: '#0F62AC', width: `${pct}%`, height: '10px', borderRadius: '4px' }} />
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 'bold', width: '15%', textAlign: 'right' }}>{v} <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>({pct}%)</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Tabela de respostas individuais */}
        <div style={{ marginTop: '32px', pageBreakBefore: 'always' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            Respostas Individuais {completo ? '(com identificação)' : '(anônimas)'}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {completo && <><th style={th}>Nome</th><th style={th}>E-mail</th></>}
                <th style={th}>Data</th>
                <th style={th}>Liderança</th>
                <th style={th}>Local</th>
                <th style={th}>Nota</th>
                <th style={th}>Freq. Ling.</th>
                <th style={th}>Envolvimento</th>
              </tr>
            </thead>
            <tbody>
              {r.map((resp, i) => {
                const colab = resp.token_convite ? tokenMap.get(resp.token_convite as string) : null
                return (
                  <tr key={String(resp.id)} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    {completo && (
                      <>
                        <td style={td}>{colab?.nome ?? '—'}</td>
                        <td style={td}>{colab?.email ?? '—'}</td>
                      </>
                    )}
                    <td style={td}>{resp.created_at ? new Date(resp.created_at as string).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={td}>{resp.perfil_lideranca === true ? 'Sim' : 'Não'}</td>
                    <td style={td}>{label(L_LOCALIZACAO, resp.localizacao_principal)}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 'bold' }}>{String(resp.nota_respeito_profissionalismo ?? '—')}</td>
                    <td style={td}>{label(L_FREQUENCIA, resp.frequencia_linguagem_inadequada)}</td>
                    <td style={td}>{label(L_ENVOLVIMENTO, resp.nivel_envolvimento)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Relatos e temas sugeridos */}
        {r.some((x) => x.relato_blindado || x.tema_sugerido) && (
          <div style={{ marginTop: '28px', pageBreakBefore: 'always' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              Relatos e Temas Sugeridos
            </h2>
            {r.map((resp, i) => {
              if (!resp.relato_blindado && !resp.tema_sugerido) return null
              return (
                <div key={String(resp.id)} style={{ marginBottom: '12px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
                  {completo && (
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0F62AC' }}>
                      {tokenMap.get(resp.token_convite as string)?.nome ?? `Resposta ${i + 1}`}
                    </p>
                  )}
                  {!!resp.relato_blindado && <p style={{ margin: '0 0 4px 0' }}><strong>Relato:</strong> {String(resp.relato_blindado)}</p>}
                  {!!resp.tema_sugerido && <p style={{ margin: 0 }}><strong>Tema sugerido:</strong> {String(resp.tema_sugerido)}</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
          CR BASSO Educação Corporativa &nbsp;·&nbsp; Documento gerado automaticamente &nbsp;·&nbsp; {completo ? 'Uso restrito — contém dados pessoais' : 'Dados consolidados — sem identificação individual'}
        </div>
      </div>
    </>
  )
}

const th: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '1px solid #cbd5e1',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'top',
}
