import Link from 'next/link'

export default function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-[#1B3A5C]">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mb-1">
            CR BASSO Educação Corporativa
          </p>
          <h1 className="text-white text-xl font-bold">
            Diagnóstico Prévio Anônimo – Projeto ASAC PHARMA
          </h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">

          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              Muito obrigado!
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Suas respostas foram registradas com <strong>total sigilo</strong>. Elas serão
              analisadas de forma consolidada pela CR BASSO Educação Corporativa para a preparação
              do treinamento customizado.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Sua participação é fundamental para que os temas que realmente importam sejam
              abordados durante a capacitação.
            </p>
          </div>

          {/* Anonymity reminder */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 px-5 py-4 flex items-start gap-3 text-left">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-sm text-blue-800">
              Lembre-se: suas respostas são <strong>100% anônimas</strong> e jamais serão
              individualizadas ou compartilhadas com a ASAC PHARMA.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao início
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pb-6">
        © {new Date().getFullYear()} CR BASSO Educação Corporativa
      </footer>
    </div>
  )
}
