export default function JaRespondidoPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0116 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Diagnóstico já respondido</h2>
            <p className="text-slate-600 leading-relaxed">
              Este link já foi utilizado. Sua participação foi registrada com sucesso.
            </p>
            <p className="text-sm text-slate-500">
              Cada link é de uso único para garantir a integridade dos dados.
              Agradecemos sua contribuição para o desenvolvimento do treinamento.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 pb-6">
        © {new Date().getFullYear()} CR BASSO Educação Corporativa
      </footer>
    </div>
  )
}
