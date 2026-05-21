import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ─── Configuração do cliente (ajustar por projeto) ─────────────────────────
const UNIVERSO_SETOR: Record<string, number> = {
  laboratorio: 15,
  escritorio_paulista: 20,
  producao: 6,
}

// ─── Labels ────────────────────────────────────────────────────────────────
const L_SETOR: Record<string, string> = {
  laboratorio: 'Laboratório',
  escritorio_paulista: 'Escritório (Paulista)',
  producao: 'Produção',
}
const L_SETOR_DEMO: Record<string, string> = {
  laboratorio: 'Departamento B',
  escritorio_paulista: 'Departamento A',
  producao: 'Departamento C',
}
const L_DEPTO: Record<string, string> = {
  laboratorio: 'DEPTO. LAB',
  escritorio_paulista: 'ADM+COM+MKT',
  producao: 'EXP',
}

// ─── Paleta ────────────────────────────────────────────────────────────────
const C = {
  bg: '#070d1a',
  section: '#0e1829',
  card: '#13213a',
  cardAlt: '#172440',
  orange: '#f97316',
  orangeDim: 'rgba(249,115,22,0.12)',
  orangeBorder: 'rgba(249,115,22,0.35)',
  orangeStrong: 'rgba(249,115,22,0.25)',
  text: '#f1f5f9',
  muted: '#64748b',
  muted2: '#94a3b8',
  border: '#1e2f4a',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.12)',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.1)',
  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.1)',
}

// ─── Tipos ─────────────────────────────────────────────────────────────────
type Row = Record<string, unknown>

// ─── Helpers ───────────────────────────────────────────────────────────────
function mediaNotas(rows: Row[]): number {
  const vals = rows.map(x => Number(x.nota_respeito_profissionalismo)).filter(n => !isNaN(n) && n > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function pctIn(rows: Row[], field: string, values: string[]): number {
  if (!rows.length) return 0
  const c = rows.filter(r => values.includes(String(r[field] ?? ''))).length
  return Math.round((c / rows.length) * 100)
}

function countIn(rows: Row[], field: string, values: string[]): number {
  return rows.filter(r => values.includes(String(r[field] ?? ''))).length
}

function pBar(pct: number, color = C.orange) {
  return (
    <div style={{ background: C.border, borderRadius: 4, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ background: color, width: `${pct}%`, height: 8, borderRadius: 4, transition: 'width 0s' }} />
    </div>
  )
}

// ─── Radar SVG ─────────────────────────────────────────────────────────────
function RadarChart({ scores, labels }: { scores: number[]; labels: string[] }) {
  const cx = 200, cy = 210, maxR = 145
  const n = scores.length

  const xy = (i: number, pct: number): [number, number] => {
    const a = Math.PI / 2 - (2 * Math.PI * i) / n
    const r = maxR * (pct / 100)
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  }

  const poly = (pct: number) => Array.from({ length: n }, (_, i) => xy(i, pct).join(',')).join(' ')
  const dataPoly = scores.map((s, i) => xy(i, s).join(',')).join(' ')

  return (
    <svg viewBox="0 0 400 430" style={{ width: '100%', maxWidth: '380px', display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={poly(lvl)} fill="none" stroke={lvl === 100 ? '#334155' : '#1e2f4a'} strokeWidth={lvl === 100 ? 1.5 : 1} />
      ))}
      {/* % labels */}
      {[25, 50, 75].map(lvl => {
        const [x, y] = xy(3, lvl)
        return <text key={lvl} x={x - 3} y={y} textAnchor="end" fill="#334155" fontSize="9">{lvl}%</text>
      })}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = xy(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e3a5f" strokeWidth="1.5" />
      })}
      {/* Data fill */}
      <polygon points={dataPoly} fill="rgba(249,115,22,0.18)" stroke={C.orange} strokeWidth="2.5" />
      {/* Score dots */}
      {scores.map((s, i) => {
        const [x, y] = xy(i, s)
        return <circle key={i} cx={x} cy={y} r="5" fill={C.orange} stroke="#070d1a" strokeWidth="2" />
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const [x, y] = xy(i, 128)
        const lines = label.split('\n')
        return (
          <text key={i} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
            {lines.map((l, li) => (
              <tspan key={li} x={x} y={y + (li - (lines.length - 1) / 2) * 14}>{l}</tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Componentes reutilizáveis ──────────────────────────────────────────────
function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <div style={{ background: C.orange, color: '#000', fontWeight: 900, fontSize: 11, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
      <h2 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</h2>
    </div>
  )
}

function Quote({ text, source }: { text: string; source: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${C.orange}`, paddingLeft: 16, marginBottom: 16 }}>
      <p style={{ color: C.muted2, fontStyle: 'italic', fontSize: 12, lineHeight: 1.7, margin: '0 0 6px 0' }}>"{text}"</p>
      <p style={{ color: C.muted, fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{source}</p>
    </div>
  )
}

function Badge({ label, color = C.orange, bg = C.orangeDim }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: 4, padding: '3px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function RelatorioExecutivoPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  noStore()

  const mode = searchParams.mode ?? 'anonimo'
  const demo = mode === 'demo'
  const nomeCliente = demo ? 'Empresa Cliente' : 'ASAC PHARMA'
  const lSetor = (k: string) => (demo ? L_SETOR_DEMO[k] : L_SETOR[k]) ?? k

  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin.from('dpa_respostas').select('*').order('created_at', { ascending: true }),
    supabaseAdmin.from('dpa_tokens').select('*'),
  ])

  const r = (respostas ?? []) as Row[]
  const totalTokens = (tokens ?? []).length

  // Segmentos por setor
  const labRows = r.filter(x => x.localizacao_principal === 'laboratorio')
  const escRows = r.filter(x => x.localizacao_principal === 'escritorio_paulista')
  const prodRows = r.filter(x => x.localizacao_principal === 'producao')
  const setoresData = [
    { key: 'laboratorio', rows: labRows },
    { key: 'escritorio_paulista', rows: escRows },
    { key: 'producao', rows: prodRows },
  ]

  const totalRespostas = r.length
  const universoTotal = Object.values(UNIVERSO_SETOR).reduce((a, b) => a + b, 0)
  const taxa = universoTotal > 0 ? Math.round((totalRespostas / universoTotal) * 100) : 0
  const taxaStr = `${taxa}%`
  const notaGeral = mediaNotas(r)
  const notaGeralStr = notaGeral > 0 ? notaGeral.toFixed(1) : '—'
  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Métricas sumário
  const pctLinguagemInadequada = pctIn(r, 'frequencia_linguagem_inadequada', ['frequentemente', 'sempre'])
  const pctExpostos = pctIn(r, 'nivel_envolvimento', ['ocorreu_comigo', 'presenciei_colegas', 'ocorreu_comigo_e_presenciei'])
  const pctClareza = pctIn(r, 'clareza_compliance', ['total_clareza'])
  const pctDiversidade = pctIn(r, 'percepcao_diversidade', ['sim_totalmente', 'maioria_das_vezes'])
  const pctDiscriminatorio = pctIn(r, 'percepcao_diversidade', ['condutas_inadequadas_ou_discriminatorias'])

  // Liderança
  const lideres = r.filter(x => x.perfil_lideranca === true)
  const base = r.filter(x => x.perfil_lideranca === false)
  const pctLiderAutonomo = pctIn(lideres, 'autonomia_liderancas', ['autonomas'])
  const pctLiderResolve = pctIn(lideres, 'autonomia_liderancas', ['autonomas', 'resolvem_parte_e_recorrem_rh'])
  const pctBaseDepRH = pctIn(base, 'autonomia_liderancas', ['quase_tudo_depende_rh'])

  // Setor mais crítico (menor nota)
  const setorNotas = setoresData.map(s => ({ key: s.key, media: mediaNotas(s.rows), count: s.rows.length }))
    .filter(s => s.count > 0)
    .sort((a, b) => a.media - b.media)
  const setorCritico = setorNotas[0]
  const setorMelhor = setorNotas[setorNotas.length - 1]

  // Setor com maior abstencão
  const setorAbstencoes = setoresData.map(s => ({
    key: s.key,
    abs: (UNIVERSO_SETOR[s.key] ?? 0) - s.rows.length,
  })).sort((a, b) => b.abs - a.abs)
  const setorSilencio = setorAbstencoes[0]

  // Relatos reais (não vazios)
  const relatosFiltrados = r
    .filter(x => x.relato_blindado && String(x.relato_blindado).trim().length > 10 && String(x.relato_blindado) !== '—')
    .map(x => ({ texto: String(x.relato_blindado), setor: String(x.localizacao_principal) }))

  // Radar scores
  const radarScores = [
    Math.round((notaGeral / 5) * 100),                                        // Respeito
    pctIn(r, 'frequencia_linguagem_inadequada', ['nunca', 'raramente']),        // Linguagem Adequada
    pctIn(r, 'nivel_envolvimento', ['nao_se_aplica']),                          // Não Exposição
    pctDiversidade,                                                             // Diversidade
    pctClareza,                                                                 // Clareza Compliance
    pctIn(r, 'autonomia_liderancas', ['autonomas', 'resolvem_parte_e_recorrem_rh']), // Autonomia
  ]
  const radarLabels = [
    'Respeito',
    'Linguagem\nAdequada',
    'Não\nExposição',
    'Diversidade',
    'Clareza\nCompliance',
    'Autonomia\nLiderança',
  ]

  const s = {
    page: { background: C.bg, color: C.text, fontFamily: 'Arial, sans-serif', margin: 0 },
    wrap: { maxWidth: 860, margin: '0 auto', padding: '0 40px' },
    section: { background: C.section, padding: '40px 0', pageBreakBefore: 'always' as const },
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' },
    cardOrange: { background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, padding: '20px 24px' },
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        body { background: ${C.bg}; color: ${C.text}; margin: 0; font-family: Arial, sans-serif; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Barra de ação */}
      <div className="no-print" style={{ background: '#0e1829', borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button id="btn-print" style={{ background: C.orange, color: '#000', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          🖨️ Imprimir / Salvar como PDF
        </button>
        <a href="/painel" style={{ fontSize: 13, color: C.muted2, textDecoration: 'none' }}>← Voltar ao painel</a>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>
          Modo: <strong style={{ color: C.muted2 }}>{demo ? 'Demo' : 'Executivo'}</strong>
        </span>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('btn-print').onclick = () => window.print()` }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CAPA
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pageBreakAfter: 'always' }}>
        {/* Topo com gradiente */}
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 50%, #131e35 100%)', padding: '60px 60px 40px' }}>
          <p style={{ color: C.orange, fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 6px' }}>CR BASSO EDUCAÇÃO CORPORATIVA</p>
          <div style={{ width: 60, height: 3, background: C.orange, borderRadius: 2, marginBottom: 40 }} />
          <h1 style={{ color: C.text, fontSize: 38, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.15, letterSpacing: -0.5 }}>
            DIAGNÓSTICO PRÉVIO<br />
            <span style={{ color: C.orange }}>ANÔNIMO</span>
          </h1>
          <p style={{ color: C.muted2, fontSize: 16, margin: '0 0 4px' }}>Análise aprofundada de cultura, conduta e segurança psicológica</p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Relatório executivo revisado com dados verificados — Maio/2026</p>
        </div>

        {/* Métricas principais */}
        <div style={{ padding: '0 60px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: -20 }}>
          {[
            { value: String(totalRespostas), label: 'VOZES ATIVAS', sub: 'Respondentes' },
            { value: taxaStr, label: 'ADESÃO', sub: `${totalRespostas} de ${totalTokens} colaboradores` },
            { value: notaGeralStr, label: 'NOTA MÉDIA', sub: 'Escala 1–5 · Respeito' },
            { value: `${totalTokens - totalRespostas}`, label: 'ABSTENÇÕES', sub: 'Colaboradores silentes' },
          ].map(c => (
            <div key={c.label} style={{ background: C.card, border: `1px solid ${C.orangeBorder}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: C.orange, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 8 }}>{c.label}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Rodapé da capa */}
        <div style={{ padding: '40px 60px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: C.muted, fontSize: 10, margin: 0 }}>
            Período de Coleta: abril de 2026 &nbsp;·&nbsp; Universo Total: {totalTokens} colaboradores &nbsp;·&nbsp; Caráter: Sigiloso &nbsp;·&nbsp; Dados agregados · Sem identificação individual
          </p>
          <p style={{ color: C.muted, fontSize: 10, margin: 0, textAlign: 'right' }}>
            {nomeCliente} · DPA · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NOTA DE CONFIDENCIALIDADE + 01 SUMÁRIO
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          {/* Nota de confidencialidade */}
          <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.orange}`, borderRadius: 10, padding: '16px 22px', marginBottom: 40 }}>
            <p style={{ color: C.orange, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>🔒 Nota de Confidencialidade e Metodologia</p>
            <p style={{ color: C.muted2, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              Este relatório apresenta exclusivamente dados agregados e percepções coletivas. Nenhuma resposta individual é identificável.
              Os dados foram cruzados com a lista oficial de colaboradores por departamento enviada pelo cliente.
              Estatísticas não derivadas do formulário são identificadas como "evidência qualitativa narrativa".
            </p>
          </div>

          <SectionHeader num="01" title="Sumário Executivo" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { value: notaGeralStr, label: 'NOTA MÉDIA DE RESPEITO', sub: 'Escala 1–5', color: C.orange },
              { value: `${pctLinguagemInadequada}%`, label: 'EXPOSIÇÃO A LINGUAGEM INADEQUADA', sub: '"Frequentemente" ou "Sempre"', color: C.red },
              { value: `${pctExpostos}%`, label: 'VIVENCIARAM SITUAÇÃO INADEQUADA', sub: 'Diretamente ou como testemunha', color: C.red },
              { value: `${pctClareza}%`, label: 'CLAREZA SOBRE COMPLIANCE', sub: '"Total clareza"', color: C.green },
            ].map(c => (
              <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: c.color, minWidth: 80, textAlign: 'center' }}>{c.value}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: 0.8, lineHeight: 1.3 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Síntese narrativa */}
          <div style={{ background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, padding: '20px 24px' }}>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              O Diagnóstico Prévio Anônimo (DPA) alcançou <strong style={{ color: C.orange }}>{totalRespostas} dos {totalTokens} colaboradores ({taxaStr})</strong>.
              O resultado central é o diagnóstico de ao menos três realidades distintas.{' '}
              {setorCritico && <>
                <strong style={{ color: C.orange }}>{lSetor(setorCritico.key)}</strong> é o setor com o clima mais crítico,
                maior exposição a situações inadequadas e maior frequência de linguagem hostil.{' '}
              </>}
              {setorMelhor && setorMelhor.key !== setorCritico?.key && <>
                <strong style={{ color: C.muted2 }}>{lSetor(setorMelhor.key)}</strong> apresenta perfil melhor do que a média.{' '}
              </>}
              {setorSilencio && <>
                <strong style={{ color: C.muted2 }}>{lSetor(setorSilencio.key)}</strong> concentra a maioria das abstenções,
                tornando sua leitura positiva estatisticamente frágil.
              </>}
            </p>
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          02 UNIVERSO E ADESÃO
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="02" title="Universo de Pesquisa e Taxa de Adesão" />
          <p style={{ color: C.muted2, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
            Antes de analisar as respostas, é fundamental entender quem respondeu e quem não respondeu.
            O universo total é de <strong style={{ color: C.text }}>{universoTotal} colaboradores</strong>.
            A taxa de adesão por setor revela padrões de engajamento e de silêncio, tão informativos quanto as próprias respostas.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ background: C.card }}>
                {['LOCALIZAÇÃO', 'DEPTO.', 'UNIVERSO', 'RESPONDENTES', 'TAXA ADESÃO', 'ABSTENÇÕES'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', borderBottom: `2px solid ${C.orangeBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setoresData.map(({ key, rows }, i) => {
                const universo = UNIVERSO_SETOR[key] ?? rows.length
                const abs = universo - rows.length
                const taxaSetor = universo > 0 ? Math.round((rows.length / universo) * 100) : 0
                return (
                  <tr key={key} style={{ background: i % 2 === 0 ? C.card : C.cardAlt, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: C.text, fontSize: 13 }}>{lSetor(key)}</td>
                    <td style={{ padding: '14px 16px', color: C.muted2, fontSize: 11 }}>{L_DEPTO[key]}</td>
                    <td style={{ padding: '14px 16px', color: C.text, fontSize: 13, fontWeight: 700 }}>{universo}</td>
                    <td style={{ padding: '14px 16px', color: C.orange, fontSize: 13, fontWeight: 700 }}>{rows.length}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: taxaSetor >= 70 ? C.green : taxaSetor >= 50 ? C.orange : C.red, fontWeight: 700, fontSize: 13 }}>{taxaSetor}%</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: abs > 5 ? C.red : C.muted2, fontWeight: abs > 5 ? 700 : 400, fontSize: 13 }}>{abs}</td>
                  </tr>
                )
              })}
              <tr style={{ background: C.orangeDim, borderTop: `2px solid ${C.orangeBorder}` }}>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: C.text, fontSize: 13 }}>TOTAL</td>
                <td style={{ padding: '14px 16px' }} />
                <td style={{ padding: '14px 16px', fontWeight: 900, color: C.text, fontSize: 13 }}>{universoTotal}</td>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: C.orange, fontSize: 13 }}>{totalRespostas}</td>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: C.orange, fontSize: 13 }}>{taxaStr}</td>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: C.muted2, fontSize: 13 }}>{universoTotal - totalRespostas}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          03 O ECO DO SILÊNCIO
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="03" title="O Eco do Silêncio e o Significado da Abstenção" />
          <p style={{ color: C.muted2, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
            A taxa geral de abstenção ({Math.round(((totalTokens - totalRespostas) / totalTokens) * 100)}%) tem significado distinto por setor.
            {setorSilencio && <> O dado mais revelador é que <strong style={{ color: C.text }}>{lSetor(setorSilencio.key)}</strong> concentra a maioria das abstenções — transformando a narrativa de "setor sem problemas" em "setor que não se manifestou".</>}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {setoresData.map(({ key, rows }) => {
              const universo = UNIVERSO_SETOR[key] ?? rows.length
              const abs = universo - rows.length
              const taxaSetor = universo > 0 ? Math.round((rows.length / universo) * 100) : 0
              const isCritico = mediaNotas(rows) > 0 && mediaNotas(rows) < 4.0
              const isSilencioso = abs > universo * 0.4

              const icon = isSilencioso ? '🔇' : isCritico ? '⚠️' : '✅'
              const tag = isSilencioso ? 'SILÊNCIO' : isCritico ? 'AMBIENTE CRÍTICO' : 'BOA ADESÃO'
              const tagColor = isSilencioso ? C.red : isCritico ? C.orange : C.green

              return (
                <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{lSetor(key)}</div>
                      <Badge label={tag} color={tagColor} bg={`${tagColor}18`} />
                    </div>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: C.muted }}>Adesão</span>
                    <span style={{ color: tagColor, fontWeight: 700 }}>{taxaSetor}% ({rows.length}/{universo})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: C.muted }}>Abstenções</span>
                    <span style={{ color: abs > 5 ? C.red : C.muted2, fontWeight: abs > 5 ? 700 : 400 }}>{abs} pessoas</span>
                  </div>
                  {pBar(taxaSetor, tagColor)}
                  <p style={{ color: C.muted2, fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                    {isSilencioso
                      ? `O silêncio dos ${abs} ausentes pode indicar desengajamento, descrença ou receio. Esses dados não podem ser lidos como satisfação.`
                      : isCritico
                        ? `A alta adesão revelou o diagnóstico mais preocupante. São os colaboradores que mais sofrem e mais se dispuseram a falar.`
                        : `Boa representatividade. Os dados mostram perfil mais equilibrado.`}
                  </p>
                </div>
              )
            })}
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          05 MATRIZ DE REALIDADES
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="05" title="Matriz de Realidades" />
          <p style={{ color: C.muted2, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
            Analisando pelas informações colhidas, a organização não parece ter um clima organizacional único,
            mas pelo menos <strong style={{ color: C.text }}>três realidades distintas</strong>.
            {setorCritico && <> <strong style={{ color: C.orange }}>{lSetor(setorCritico.key)}</strong> emerge como o epicentro dos problemas culturais.</>}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {setoresData.map(({ key, rows }) => {
              const media = mediaNotas(rows)
              const mediaS = media > 0 ? media.toFixed(2) : '—'
              const pctLing = pctIn(rows, 'frequencia_linguagem_inadequada', ['frequentemente', 'sempre'])
              const cntLing = countIn(rows, 'frequencia_linguagem_inadequada', ['frequentemente', 'sempre'])
              const pctExp = pctIn(rows, 'nivel_envolvimento', ['ocorreu_comigo', 'presenciei_colegas', 'ocorreu_comigo_e_presenciei'])
              const cntExp = countIn(rows, 'nivel_envolvimento', ['ocorreu_comigo', 'presenciei_colegas', 'ocorreu_comigo_e_presenciei'])
              const universo = UNIVERSO_SETOR[key] ?? rows.length
              const taxaSetor = universo > 0 ? Math.round((rows.length / universo) * 100) : 0
              const isCritico = key === setorCritico?.key

              return (
                <div key={key} style={{ background: isCritico ? C.orangeDim : C.card, border: `1px solid ${isCritico ? C.orangeBorder : C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: isCritico ? 'rgba(249,115,22,0.3)' : C.cardAlt, padding: '14px 20px' }}>
                    <p style={{ color: isCritico ? C.orange : C.muted2, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {isCritico ? '⚠ EPICENTRO' : ''}
                    </p>
                    <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{lSetor(key)}</h3>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'NOTA MÉDIA', value: mediaS, sub: '/5', color: isCritico ? C.red : C.green },
                      { label: 'LINGUAGEM INADEQUADA', value: `${pctLing}%`, sub: `${cntLing}/${rows.length}`, color: pctLing > 30 ? C.red : C.muted2 },
                      { label: 'EXPOSIÇÃO A SITUAÇÕES', value: `${pctExp}%`, sub: `${cntExp}/${rows.length}`, color: pctExp > 50 ? C.red : C.muted2 },
                      { label: 'TAXA DE ADESÃO', value: `${taxaSetor}%`, sub: `${rows.length}/${universo}`, color: taxaSetor > 70 ? C.green : C.orange },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value} <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>{m.sub}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          06-08 ANÁLISE POR DIMENSÃO
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="06" title="Respeito e Profissionalismo" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {setoresData.map(({ key, rows }) => {
              const m = mediaNotas(rows)
              const mS = m > 0 ? m.toFixed(2) : '—'
              const isCritico = key === setorCritico?.key
              return (
                <div key={key} style={{ background: C.card, border: `1px solid ${isCritico ? C.orangeBorder : C.border}`, borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: m < 4 ? C.red : m < 4.5 ? C.orange : C.green }}>{mS}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>/ 5</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 8 }}>{lSetor(key)}</div>
                  {isCritico && <Badge label="Mais crítico" color={C.red} bg={C.redDim} />}
                </div>
              )
            })}
          </div>

          {/* Relatos sobre respeito */}
          {relatosFiltrados.slice(0, 2).map((rel, i) => (
            <Quote
              key={i}
              text={rel.texto.length > 200 ? rel.texto.substring(0, 200) + '...' : rel.texto}
              source={`Colaborador — ${demo ? L_SETOR_DEMO[rel.setor] ?? rel.setor : L_SETOR[rel.setor] ?? rel.setor}`}
            />
          ))}

          <div style={{ marginTop: 32 }}>
            <SectionHeader num="07" title="Linguagem e Conduta Inadequada" />
            {setoresData.map(({ key, rows }) => {
              if (!rows.length) return null
              const pctFreq = pctIn(rows, 'frequencia_linguagem_inadequada', ['frequentemente', 'sempre'])
              const pctRar = pctIn(rows, 'frequencia_linguagem_inadequada', ['raramente'])
              const pctNunca = pctIn(rows, 'frequencia_linguagem_inadequada', ['nunca'])
              const isCritico = pctFreq > 30
              return (
                <div key={key} style={{ marginBottom: 16, background: C.card, border: `1px solid ${isCritico ? C.orangeBorder : C.border}`, borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{lSetor(key)}</div>
                    {isCritico && <Badge label="INTERVENÇÃO PRIORITÁRIA" color={C.red} bg={C.redDim} />}
                  </div>
                  {[
                    { label: 'Frequentemente / Sempre', pct: pctFreq, color: C.red },
                    { label: 'Raramente', pct: pctRar, color: C.orange },
                    { label: 'Nunca', pct: pctNunca, color: C.green },
                  ].map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.muted2, width: 180, flexShrink: 0 }}>{b.label}</span>
                      <div style={{ flex: 1 }}>{pBar(b.pct, b.color)}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: b.color, width: 38, textAlign: 'right' }}>{b.pct}%</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          08 EXPOSIÇÃO + 09 LIDERANÇA
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="08" title="Exposição a Situações Inadequadas" />

          <div style={{ background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, padding: '16px 22px', marginBottom: 24 }}>
            <p style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: 0 }}>
              "{pctExpostos}% vivenciaram ou testemunharam situações inadequadas"
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {setoresData.map(({ key, rows }) => {
              if (!rows.length) return null
              const pctExp = pctIn(rows, 'nivel_envolvimento', ['ocorreu_comigo', 'presenciei_colegas', 'ocorreu_comigo_e_presenciei'])
              const pctNa = pctIn(rows, 'nivel_envolvimento', ['nao_se_aplica'])
              return (
                <div key={key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12 }}>{lSetor(key)}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: pctExp > 50 ? C.red : C.orange }}>{pctExp}%</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>com exposição direta ou como testemunha</div>
                  {pBar(pctExp, pctExp > 50 ? C.red : C.orange)}
                  <div style={{ fontSize: 11, color: C.muted2, marginTop: 8 }}>{pctNa}% não se aplica</div>
                </div>
              )
            })}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.blue}`, borderRadius: 10, padding: '16px 22px', marginBottom: 40 }}>
            <p style={{ color: C.blue, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>⚙ Interpretação Comportamental</p>
            <p style={{ color: C.muted2, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              A exposição contínua a comportamentos inadequados, mesmo como testemunha, gera <strong>normalização do disfuncional</strong>.
              O desvio passa a ser visto como "jeito de ser". Intervir antes dessa naturalização é criticamente mais eficaz do que corrigir depois.
            </p>
          </div>

          {/* 09 Liderança */}
          <SectionHeader num="09" title="A Liderança no Espelho" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: C.greenDim, border: `1px solid ${C.green}40`, borderRadius: 10, padding: '20px' }}>
              <p style={{ color: C.green, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>✦ A Visão da Liderança</p>
              <p style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>"Nós resolvemos os problemas internamente."</p>
              <p style={{ color: C.muted2, fontSize: 12, margin: 0 }}>
                <strong style={{ color: C.green }}>{pctLiderAutonomo}%</strong> das lideranças afirmam ter autonomia para gerir conflitos sem acionar o RH.
                No total, <strong style={{ color: C.green }}>{pctLiderResolve}%</strong> resolvem ao menos parcialmente.
              </p>
            </div>
            <div style={{ background: C.redDim, border: `1px solid ${C.red}40`, borderRadius: 10, padding: '20px' }}>
              <p style={{ color: C.red, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>✦ A Visão dos Liderados</p>
              <p style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>"Tudo depende do RH."</p>
              <p style={{ color: C.muted2, fontSize: 12, margin: 0 }}>
                <strong style={{ color: C.red }}>{pctBaseDepRH}%</strong> da base relata que quase tudo depende do RH.
                Relatos de omissão da gestão direta e líderes como fonte do problema.
              </p>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.red}30`, borderRadius: 10, padding: '16px 22px' }}>
            <p style={{ color: C.red, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>⚠ Falha</p>
            <p style={{ color: C.muted2, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              A liderança precisa atuar como primeiro escudo protetor da cultura. Quando o líder é omisso ou é a própria fonte do problema,
              a única instância que resta é o RH, operando de forma reativa. Isso sobrecarrega o RH e desprotege os colaboradores.
            </p>
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          10 DIVERSIDADE, INCLUSÃO E COMPLIANCE
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="10" title="Diversidade, Inclusão e Compliance" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{ background: C.greenDim, border: `1px solid ${C.green}40`, borderRadius: 10, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: C.green }}>{pctDiversidade}%</div>
              <div style={{ fontSize: 12, color: C.muted2, marginTop: 8 }}>Percebem respeito à diversidade<br />"Maioria" ou "totalmente"</div>
            </div>
            <div style={{ background: C.redDim, border: `1px solid ${C.red}40`, borderRadius: 10, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: C.red }}>{pctDiscriminatorio}%</div>
              <div style={{ fontSize: 12, color: C.muted2, marginTop: 8 }}>Relataram condutas discriminatórias<br />{countIn(r, 'percepcao_diversidade', ['condutas_inadequadas_ou_discriminatorias'])} respondente(s)</div>
            </div>
          </div>

          {/* Quotes sobre diversidade */}
          {relatosFiltrados.slice(2, 5).map((rel, i) => (
            <Quote
              key={i}
              text={rel.texto.length > 250 ? rel.texto.substring(0, 250) + '...' : rel.texto}
              source={`Colaborador — ${demo ? L_SETOR_DEMO[rel.setor] ?? rel.setor : L_SETOR[rel.setor] ?? rel.setor}`}
            />
          ))}

          {/* Risco jurídico */}
          <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${C.red}40`, borderLeft: `4px solid ${C.red}`, borderRadius: 10, padding: '18px 22px', marginTop: 8 }}>
            <p style={{ color: C.red, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>⚖ Risco Jurídico — Lei 14.457/22 (Programa de Prevenção ao Assédio)</p>
            <p style={{ color: C.muted2, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
              A combinação de <strong>conduta inadequada documentada</strong> + <strong>{100 - pctClareza}% sem clareza total</strong> sobre o canal de denúncias
              configura vulnerabilidade de compliance. Empresas com CIPA têm obrigação legal de implementar mecanismos de prevenção ao assédio.
            </p>
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          11 OS 4 TEMAS ESTRATÉGICOS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="11" title="Os 4 Temas Estratégicos" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                num: '01',
                title: 'Comunicação Hostil e Agressividade',
                body: `Cobranças em tom elevado e gritos concentrados no setor de maior adesão. Normalização do abuso como "cobrança profissional" corrói o clima do setor inteiro.`,
                badge: 'RISCO PRIORITÁRIO',
                color: C.red,
              },
              {
                num: '02',
                title: 'Vieses e Condutas Discriminatórias',
                body: 'Piadas sexuais e comentários de gênero por figuras de autoridade. Maior risco legal para a organização.',
                badge: 'MAIOR RISCO LEGAL',
                color: C.red,
              },
              {
                num: '03',
                title: 'Invasão de Hierarquia',
                body: 'Bypass entre gestores e confusão operacional: demandas atribuídas sem passar pela liderança direta, gerando conflito de autoridade e sobrecarga.',
                badge: 'CONFUSÃO OPERACIONAL',
                color: C.orange,
              },
              {
                num: '04',
                title: 'Desengajamento e Postura',
                body: 'Coexistência de acomodação e sobrecarga. Protecionismo a "amigos" amplifica desconfiança e corrói a coesão das equipes.',
                badge: 'DESGASTE DE PERFORMANCE',
                color: C.muted2,
              },
            ].map(t => (
              <div key={t.num} style={{ background: C.card, border: `1px solid ${t.color}30`, borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: `${t.color}40`, lineHeight: 1 }}>{t.num}</span>
                  <Badge label={t.badge} color={t.color} bg={`${t.color}18`} />
                </div>
                <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{t.title}</h3>
                <p style={{ color: C.muted2, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{t.body}</p>
              </div>
            ))}
          </div>

          <p style={{ color: C.muted, fontSize: 10, textAlign: 'right', marginTop: 40 }}>
            {nomeCliente} · Diagnóstico Prévio Anônimo · Relatório Confidencial · Maio 2026
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          12 RADAR DO CLIMA
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...s.section }}>
        <div style={{ ...s.wrap }}>
          <SectionHeader num="12" title="Visão Integrada — Radar do Clima" />
          <p style={{ color: C.muted2, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
            Síntese das seis dimensões avaliadas em escala 0–100. Os eixos mais frágeis do diagnóstico são identificados onde o polígono se afasta do centro de forma desproporcional.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <RadarChart scores={radarScores} labels={radarLabels} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Respeito e Profissionalismo', value: radarScores[0], sub: `Nota ${notaGeralStr}/5` },
                { label: 'Linguagem Adequada', value: radarScores[1], sub: `${radarScores[1]}% sem exposição frequente` },
                { label: 'Não Exposição a Riscos', value: radarScores[2], sub: `${radarScores[2]}% não vivenciou` },
                { label: 'Percepção de Diversidade', value: radarScores[3], sub: `${radarScores[3]}% percepção positiva` },
                { label: 'Clareza sobre Compliance', value: radarScores[4], sub: `${radarScores[4]}% total clareza` },
                { label: 'Autonomia das Lideranças', value: radarScores[5], sub: `${radarScores[5]}% com alguma autonomia` },
              ].map(item => (
                <div key={item.label} style={{ background: C.card, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.value < 50 ? C.red : item.value < 70 ? C.orange : C.green }}>{item.value}%</span>
                  </div>
                  {pBar(item.value, item.value < 50 ? C.red : item.value < 70 ? C.orange : C.green)}
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé final */}
          <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: C.muted, fontSize: 10, margin: 0 }}>CR BASSO Educação Corporativa · Diagnóstico Prévio Anônimo · Versão Confidencial</p>
            <p style={{ color: C.muted, fontSize: 10, margin: 0 }}>Gerado em {dataAtual} · {demo ? 'Versão demonstrativa' : 'Dados agregados — sem identificação individual'}</p>
          </div>
        </div>
      </div>
    </>
  )
}
