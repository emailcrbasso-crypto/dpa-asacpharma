import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import DPAForm from '@/components/DPAForm'
import Image from 'next/image'

export default async function HomePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    redirect('/acesso-negado')
  }

  const { data, error } = await supabaseAdmin
    .from('dpa_tokens')
    .select('id, usado')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) {
    redirect('/acesso-negado')
  }

  if (data.usado) {
    redirect('/ja-respondido')
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="bg-[#0F62AC]">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-crbasso.png.png"
              alt="CR BASSO Educação Corporativa"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
            Diagnóstico Prévio Anônimo (DPA)
          </h1>
          <p className="text-blue-200 text-base font-medium mt-1">
            ASAC PHARMA
          </p>
        </div>
      </header>

      {/* ─── Content ────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Intro card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-slate-800 font-bold text-base">Sigilo Total Garantido</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Este diagnóstico é conduzido de forma <strong>100% anônima</strong> pela{' '}
            <strong>CR BASSO Educação Corporativa</strong>, uma consultoria externa e independente.
            O objetivo é coletar percepções reais sobre o cotidiano da empresa para que o treinamento
            conduzido seja customizado à realidade de vocês.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Nenhuma resposta individual será compartilhada com a ASAC PHARMA. Utilizaremos apenas os
            dados consolidados para tratar os temas de forma técnica e segura, garantindo que as
            questões reais sejam resolvidas sem que ninguém precise se expor publicamente e que os
            dados recebidos de forma consolidada pela ASAC PHARMA não sejam passíveis de identificação.
          </p>
        </div>

        {/* Instructions badge */}
        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Todas as perguntas são obrigatórias. Tempo estimado: 5 a 10 minutos.</span>
        </div>

        {/* Form */}
        <DPAForm token={token} />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pb-8 space-y-1">
          <p>© {new Date().getFullYear()} CR BASSO Educação Corporativa — Todos os direitos reservados.</p>
          <p>Nenhum dado pessoal identificável é coletado neste formulário.</p>
        </footer>
      </main>
    </div>
  )
}
