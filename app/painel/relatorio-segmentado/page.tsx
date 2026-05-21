import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ── Labels ────────────────────────────────────────────────────────────────────

const L_LOCALIZACAO: Record<string, string> = {
  escritorio_paulista: 'Escritório (Paulista)',
  laboratorio: 'Laboratório',
  producao: 'Produção',
}

const L_LOCALIZACAO_DEMO: Record<string, string> = {
  escritorio_paulista: 'Departamento A',
  laboratorio: 'Departamento B',
  producao: 'Departamento C',
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

function lbl<T extends Record<string, string>>(map: T, val: unknown) {
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

function notaMedia(rows: Record<string, unknown>[]) {
  const notas = rows.map((x) => Number(x.nota_respeito_profissionalismo)).filter((n) => !isNaN(n))
  if (notas.length === 0) return '—'
  return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1)
}

// ── Componentes inline ────────────────────────────────────────────────────────

type Row = Record<string, unknown>
type TokenRow = { id: string; token: string; nome: string; email: string; usado: boolean }

function BarChart({ rows, field, map, total }: { rows: Row[]; field: string; map: Record<string, string>; total: number }) {
  const d = dist(rows, field)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
      <tbody>
        {Object.entries(map).map(([k, label]) => {
          const v = d[k] ?? 0
          const pct = total > 0 ? Math.round((v / total) * 100) : 0
          return (
            <tr key={k}>
              <td style={{ fontSize: '11px', padding: '2px 8px 2px 0', width: '42%' }}>{label}</td>
              <td style={{ width: '43%', padding: '2px 8px' }}>
                <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px' }}>
                  <div style={{ background: '#0F62AC', width: `${pct}%`, height: '8px', borderRadius: '4px' }} />
                </div>
              </td>
              <td style={{ fontSize: '11px', fontWeight: 'bold', width: '15%', textAlign: 'right' }}>
                {v} <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>({pct}%)</span>
              </td>

            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function GrupoSection({
  titulo,
  cor,
  rows,
  tokenMap,
  completo,
  demo,
  isUnidade,
  idx,
}: {
  titulo: string
  cor: string
  rows: Row[]
  tokenMap: Map<string, TokenRow>
  completo: boolean
  demo: boolean
  isUnidade: boolean
  idx: number
}) {
  const total = rows.length
  const media = notaMedia(rows)
  const liderSim = rows.filter((x) => x.perfil_lideranca === true).length
  const liderNao = rows.filter((x) => x.perfil_lideranca === false).length
  const locMap = demo ? L_LOCALIZACAO_DEMO : L_LOCALIZACAO

  const graficos: { title: string; field: string; map: Record<string, string> }[] = [
    { title: 'Frequência de linguagem inadequada', field: 'frequencia_linguagem_inadequada', map: L_FREQUENCIA },
    { title: 'Nível de envolvimento nas situações', field: 'nivel_envolvimento', map: L_ENVOLVIMENTO },
    { title: 'Percepção de ambiente seguro e respeitoso', field: 'percepcao_diversidade', map: L_PERCEPCAO },
    { title: 'Autonomia das lideranças', field: 'autonomia_liderancas', map: L_AUTONOMIA },
    { title: 'Clareza sobre compliance', field: 'clareza_compliance', map: L_CLAREZA },
  ]

  const liderSimLabel = demo ? 'Perfil Liderança' : 'com liderança'
  const liderNaoLabel = demo ? 'Perfil Operacional' : 'sem liderança'

  return (
    <div style={{ pageBreakBefore: idx > 0 ? 'always' : 'auto', marginBottom: '32px' }}>
      {/* Cabeçalho do grupo */}
      <div style={{ background: cor, borderRadius: '8px', padding: '14px 20px', marginBottom: '16px' }}>
        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{titulo}</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', margin: 0 }}>
          {total} respondente{total !== 1 ? 's' : ''}
          {isUnidade ? ` · ${liderSim} ${liderSimLabel} · ${liderNao} ${liderNaoLabel}` : ''}
        </p>
      </div>

      {total === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma resposta neste grupo.</p>
      ) : (
        <>
          {/* Nota média */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0F62AC' }}>{media}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Nota média — Respeito e Profissionalismo</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 'bold' }}>Perfil de liderança</div>
              <div style={{ fontSize: '12px' }}>Com liderança: <strong>{liderSim}</strong> ({total > 0 ? Math.round((liderSim / total) * 100) : 0}%)</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Sem liderança: <strong>{liderNao}</strong> ({total > 0 ? Math.round((liderNao / total) * 100) : 0}%)</div>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {graficos.map((g) => (
              <div key={g.field} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>{g.title}</div>
                <BarChart rows={rows} field={g.field} map={g.map} total={total} />
              </div>
            ))}
          </div>

          {/* Fichas individuais */}
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Respostas Individuais
          </h3>
          {rows.map((resp, i) => {
            const colab = resp.token_convite ? tokenMap.get(resp.token_convite as string) : null
            const campos: { label: string; value: string }[] = [
              { label: 'Data/Hora', value: resp.created_at ? new Date(resp.created_at as string).toLocaleString('pt-BR') : '—' },
              { label: 'Perfil de liderança', value: resp.perfil_lideranca === true ? (demo ? 'Perfil Liderança' : 'Sim') : resp.perfil_lideranca === false ? (demo ? 'Perfil Operacional' : 'Não') : '—' },
              { label: demo ? 'Departamento' : 'Localização', value: lbl(locMap, resp.localizacao_principal) },
              { label: 'Nota', value: String(resp.nota_respeito_profissionalismo ?? '—') },
              { label: 'Justificativa', value: String(resp.justificativa_nota ?? '—') },
              { label: 'Freq. linguagem inadequada', value: lbl(L_FREQUENCIA, resp.frequencia_linguagem_inadequada) },
              { label: 'Envolvimento', value: lbl(L_ENVOLVIMENTO, resp.nivel_envolvimento) },
              { label: 'Percepção', value: lbl(L_PERCEPCAO, resp.percepcao_diversidade) },
              { label: 'Autonomia lideranças', value: lbl(L_AUTONOMIA, resp.autonomia_liderancas) },
              { label: 'Clareza compliance', value: lbl(L_CLAREZA, resp.clareza_compliance) },
              { label: 'Relato', value: String(resp.relato_blindado ?? '—') },
              { label: 'Tema sugerido', value: String(resp.tema_sugerido ?? '—') },
            ]
            return (
              <div key={String(resp.id)} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '12px', pageBreakInside: 'avoid', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '6px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#0F62AC' }}>
                    {completo ? (colab?.nome ?? `Resposta ${i + 1}`) : `Resposta ${i + 1}`}
                  </span>
                  {completo && colab?.email && (
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{colab.email}</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                  {campos.map((c, ci) => (
                    <div key={c.label} style={{ padding: '5px 14px', borderBottom: ci < campos.length - 2 ? '1px solid #f1f5f9' : 'none', borderRight: ci % 2 === 0 ? '1px solid #f1f5f9' : 'none', fontSize: '10px' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '1px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</div>
                      <div style={{ color: '#1e293b', fontWeight: c.label === 'Nota' ? 'bold' : 'normal' }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RelatorioSegmentadoPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  noStore()

  const mode = searchParams.mode ?? 'anonimo'
  const completo = mode === 'completo'
  const demo = mode === 'demo'

  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin.from('dpa_respostas').select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from('dpa_tokens').select('*').order('nome'),
  ])

  const r = (respostas ?? []) as Row[]
  const t = (tokens ?? []) as TokenRow[]
  const tokenMap = new Map(t.map((x) => [x.token, x]))

  const totalRespostas = r.length
  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Segmentos por unidade
  const unidades = demo
    ? [
        { key: 'escritorio_paulista', label: 'Departamento A', cor: '#0F62AC' },
        { key: 'laboratorio', label: 'Departamento B', cor: '#0369a1' },
        { key: 'producao', label: 'Departamento C', cor: '#0e7490' },
      ]
    : [
        { key: 'escritorio_paulista', label: 'Escritório (Paulista)', cor: '#0F62AC' },
        { key: 'laboratorio', label: 'Laboratório', cor: '#0369a1' },
        { key: 'producao', label: 'Produção', cor: '#0e7490' },
      ]
  const porUnidade = unidades.map((u) => ({
    ...u,
    rows: r.filter((x) => x.localizacao_principal === u.key),
  }))

  // Segmentos por liderança
  const porLideranca = [
    { key: 'sim', label: demo ? 'Perfil Liderança' : 'Com Liderança', cor: '#1d4ed8', rows: r.filter((x) => x.perfil_lideranca === true) },
    { key: 'nao', label: demo ? 'Perfil Operacional' : 'Sem Liderança', cor: '#475569', rows: r.filter((x) => x.perfil_lideranca === false) },
  ]

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: Arial, sans-serif; background: white; color: #1e293b; margin: 0; }
      `}</style>

      {/* Barra de ação */}
      <div className="no-print" style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          id="btn-print"
          style={{ background: '#0F62AC', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🖨️ Imprimir / Salvar como PDF
        </button>
        <a href="/painel" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}>← Voltar ao painel</a>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
          Modo: <strong>{completo ? 'Completo (com identificação)' : demo ? 'Demo (dados anônimos)' : 'Anônimo (sem identificação)'}</strong>
        </span>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('btn-print').onclick = () => window.print()` }} />
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 32px' }}>

        {/* Cabeçalho */}
        <div style={{ borderBottom: '3px solid #0F62AC', paddingBottom: '16px', marginBottom: '28px' }}>
          <p style={{ color: '#0F62AC', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>CR BASSO EDUCAÇÃO CORPORATIVA</p>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Relatório Segmentado — Diagnóstico Prévio Anônimo (DPA)</h1>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
            {demo ? 'Empresa Cliente' : 'ASAC PHARMA'} &nbsp;·&nbsp; {dataAtual} &nbsp;·&nbsp; {totalRespostas} respostas &nbsp;·&nbsp; {completo ? 'Exportação Completa' : demo ? 'Modo Demo' : 'Exportação Anônima'}
          </p>
        </div>

        {/* ── PARTE 1: Por Unidade ── */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#374151' }}>
              {demo ? 'PARTE 1 — Dados por Departamento' : 'PARTE 1 — Dados por Unidade de Atuação'}
            </h2>
          </div>
          {porUnidade.map((u, i) => (
            <GrupoSection
              key={u.key}
              titulo={u.label}
              cor={u.cor}
              rows={u.rows}
              tokenMap={tokenMap}
              completo={completo}
              demo={demo}
              isUnidade={true}
              idx={i}
            />
          ))}
        </div>

        {/* ── PARTE 2: Por Liderança ── */}
        <div style={{ pageBreakBefore: 'always' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#374151' }}>
              PARTE 2 — Dados por Perfil de Liderança
            </h2>
          </div>
          {porLideranca.map((l, i) => (
            <GrupoSection
              key={l.key}
              titulo={l.label}
              cor={l.cor}
              rows={l.rows}
              tokenMap={tokenMap}
              completo={completo}
              demo={demo}
              isUnidade={false}
              idx={i}
            />
          ))}
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
          CR BASSO Educação Corporativa &nbsp;·&nbsp; Relatório segmentado gerado automaticamente &nbsp;·&nbsp;
          {completo ? 'Uso restrito — contém dados pessoais' : demo ? 'Versão demonstrativa — dados anônimos' : 'Dados consolidados — sem identificação individual'}
        </div>
      </div>
    </>
  )
}
