import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-server'
import Image from 'next/image'
import PainelDashboard from '@/components/PainelDashboard'
import type { Resposta, Token } from '@/components/PainelDashboard'

export const dynamic = 'force-dynamic'

async function logout() {
  'use server'
  cookies().delete('dpa_auth')
  redirect('/painel/login')
}

export default async function PainelPage() {
  noStore()

  const [{ data: respostas }, { data: tokens }] = await Promise.all([
    supabaseAdmin
      .from('dpa_respostas')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('dpa_tokens').select('*').order('nome'),
  ])

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://dpa-asacpharma.vercel.app'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-[#0F62AC] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo_crbasso.png"
              alt="CR BASSO Educação Corporativa"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-white font-bold text-lg leading-tight">
              Painel DPA — ASAC PHARMA
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="/api/export?mode=completo" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↓ CSV Completo
            </a>
            <a href="/api/export?mode=anonimo" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↓ CSV Anônimo
            </a>
            <a href="/painel/relatorio?mode=completo" target="_blank" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Completo
            </a>
            <a href="/painel/relatorio?mode=anonimo" target="_blank" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Anônimo
            </a>
            <a href="/painel/relatorio-segmentado?mode=completo" target="_blank" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Seg. Completo
            </a>
            <a href="/painel/relatorio-segmentado?mode=anonimo" target="_blank" className="text-white text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Seg. Anônimo
            </a>
            <a href="/painel/relatorio?mode=demo" target="_blank" className="text-white text-xs font-medium bg-yellow-500/70 hover:bg-yellow-500/90 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Demo
            </a>
            <a href="/painel/relatorio-segmentado?mode=demo" target="_blank" className="text-white text-xs font-medium bg-yellow-500/70 hover:bg-yellow-500/90 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ PDF Seg. Demo
            </a>
            <a href="/painel/relatorio-executivo" target="_blank" className="text-white text-xs font-medium bg-orange-600/80 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-bold">
              ↗ Relatório Executivo
            </a>
            <a href="/painel/relatorio-executivo?mode=demo" target="_blank" className="text-white text-xs font-medium bg-orange-500/60 hover:bg-orange-500/80 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              ↗ Exec. Demo
            </a>
            <form action={logout}>
              <button type="submit" className="text-blue-300 hover:text-white text-xs flex items-center gap-1 transition-colors ml-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <PainelDashboard
        respostas={(respostas ?? []) as Resposta[]}
        tokens={(tokens ?? []) as Token[]}
        appUrl={appUrl}
      />

      <footer className="text-center text-xs text-slate-400 py-6">
        © {new Date().getFullYear()} CR BASSO Educação Corporativa — Uso interno
      </footer>
    </div>
  )
}
