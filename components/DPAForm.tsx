'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { formSchema, FormData } from '@/lib/schemas'
import { ZodError } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawFormState = {
  perfil_lideranca: string
  localizacao_principal: string
  nota_respeito_profissionalismo: string
  justificativa_nota: string
  frequencia_linguagem_inadequada: string
  nivel_envolvimento: string
  percepcao_diversidade: string
  autonomia_liderancas: string
  clareza_compliance: string
  relato_blindado: string
  tema_sugerido: string
}

type FieldErrors = Partial<Record<keyof RawFormState, string>>

const EMPTY_FORM: RawFormState = {
  perfil_lideranca: '',
  localizacao_principal: '',
  nota_respeito_profissionalismo: '',
  justificativa_nota: '',
  frequencia_linguagem_inadequada: '',
  nivel_envolvimento: '',
  percepcao_diversidade: '',
  autonomia_liderancas: '',
  clareza_compliance: '',
  relato_blindado: '',
  tema_sugerido: '',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuestionCard({
  number,
  title,
  hint,
  error,
  children,
}: {
  number: number
  title: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 p-6">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white text-sm font-bold flex items-center justify-center mt-0.5">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 font-semibold leading-snug mb-4">{title}</p>
          {hint && (
            <p className="text-sm text-slate-500 italic mb-4 border-l-4 border-blue-200 pl-3">
              {hint}
            </p>
          )}
          <div className="space-y-2">{children}</div>
          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string
  value: string
  label: string
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label
      className={`flex items-start gap-3 w-full px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-150
        ${
          checked
            ? 'border-blue-600 bg-blue-50'
            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
        }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
            ${checked ? 'border-blue-600' : 'border-slate-400'}`}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
        </div>
      </div>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={`text-sm leading-snug ${checked ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
        {label}
      </span>
    </label>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <p className="text-sm font-semibold text-slate-600 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Form
// ---------------------------------------------------------------------------

export default function DPAForm() {
  const router = useRouter()
  const [form, setForm] = useState<RawFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function handleRadio(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleTextarea(e: ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError(null)

    // Client-side validation
    const payload = {
      ...form,
      nota_respeito_profissionalismo: form.nota_respeito_profissionalismo
        ? Number(form.nota_respeito_profissionalismo)
        : undefined,
    }

    let validated: FormData
    try {
      validated = formSchema.parse(payload)
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {}
        for (const issue of err.issues) {
          const field = issue.path[0] as keyof RawFormState
          if (!fieldErrors[field]) fieldErrors[field] = issue.message
        }
        setErrors(fieldErrors)
        // Scroll to first error
        const firstErrorKey = Object.keys(fieldErrors)[0]
        document.getElementById(firstErrorKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      })

      if (res.ok) {
        router.push('/obrigado')
        return
      }

      const data = await res.json().catch(() => ({}))
      setServerError(data.message ?? 'Ocorreu um erro. Por favor, tente novamente.')
    } catch {
      setServerError('Falha na conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const nota = form.nota_respeito_profissionalismo

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* P1 – Liderança */}
      <div id="perfil_lideranca">
        <QuestionCard
          number={1}
          title="Exerce cargo de gestão/liderança (Coordenação, Gerência ou Diretoria) com responsabilidade direta por equipes?"
          error={errors.perfil_lideranca}
        >
          {[
            { value: 'sim', label: 'Sim' },
            { value: 'nao', label: 'Não' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="perfil_lideranca"
              value={opt.value}
              label={opt.label}
              checked={form.perfil_lideranca === opt.value}
              onChange={handleRadio}
            />
          ))}
        </QuestionCard>
      </div>

      {/* P2 – Localização */}
      <div id="localizacao_principal">
        <QuestionCard
          number={2}
          title="Em qual unidade atua na maior parte do tempo?"
          error={errors.localizacao_principal}
        >
          {[
            { value: 'escritorio_paulista', label: 'Escritório (Paulista)' },
            { value: 'laboratorio', label: 'Laboratório' },
            { value: 'producao', label: 'Produção' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="localizacao_principal"
              value={opt.value}
              label={opt.label}
              checked={form.localizacao_principal === opt.value}
              onChange={handleRadio}
            />
          ))}
        </QuestionCard>
      </div>

      {/* P3 – Nota de respeito */}
      <div id="nota_respeito_profissionalismo">
        <QuestionCard
          number={3}
          title="Numa escala de 1 a 5 (onde 1 é 'Muito Insatisfeito' e 5 é 'Muito Satisfeito'), como avalia o nível de respeito e profissionalismo nas interações diárias da sua equipe?"
          error={errors.nota_respeito_profissionalismo}
        >
          {/* Scale row */}
          <div className="flex gap-2">
            {(['1', '2', '3', '4', '5'] as const).map((n) => (
              <label
                key={n}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 cursor-pointer transition-all duration-150
                  ${
                    nota === n
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }`}
              >
                <input
                  type="radio"
                  name="nota_respeito_profissionalismo"
                  value={n}
                  checked={nota === n}
                  onChange={handleRadio}
                  className="sr-only"
                />
                <span className={`text-lg font-bold ${nota === n ? 'text-blue-700' : 'text-slate-600'}`}>
                  {n}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-between px-1 text-xs text-slate-400 mt-1">
            <span>Muito Insatisfeito</span>
            <span>Muito Satisfeito</span>
          </div>
        </QuestionCard>
      </div>

      {/* P3 – Justificativa */}
      <div id="justificativa_nota">
        <QuestionCard
          number={3}
          title="Justificativa da nota acima"
          hint="Utilize este espaço para explicar o que mais influenciou a nota que atribuiu acima. Sinta-se à vontade para detalhar situações ou percepções (não há limite de caracteres)."
          error={errors.justificativa_nota}
        >
          <textarea
            name="justificativa_nota"
            value={form.justificativa_nota}
            onChange={handleTextarea}
            rows={4}
            placeholder="Escreva aqui sua justificativa..."
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y
              ${errors.justificativa_nota ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}
          />
        </QuestionCard>
      </div>

      {/* P4 – Frequência de linguagem inadequada */}
      <div id="frequencia_linguagem_inadequada">
        <QuestionCard
          number={4}
          title="Com que frequência presencia o uso de termos inadequados, gritos, palavrões ou piadas de cunho sexual/racial no dia a dia de trabalho?"
          error={errors.frequencia_linguagem_inadequada}
        >
          {[
            { value: 'nunca', label: 'Nunca' },
            { value: 'raramente', label: 'Raramente' },
            { value: 'frequentemente', label: 'Frequentemente' },
            { value: 'sempre', label: 'Sempre' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="frequencia_linguagem_inadequada"
              value={opt.value}
              label={opt.label}
              checked={form.frequencia_linguagem_inadequada === opt.value}
              onChange={handleRadio}
            />
          ))}

          <div id="nivel_envolvimento">
            <SubSection title="Sobre as situações mencionadas acima, qual é o seu nível de envolvimento?">
              {[
                { value: 'ocorreu_comigo', label: 'Já ocorreram especificamente comigo.' },
                { value: 'presenciei_colegas', label: 'Nunca ocorreram comigo, mas presenciei ocorrendo com colegas.' },
                { value: 'ocorreu_comigo_e_presenciei', label: 'Já ocorreram comigo e também presenciei ocorrendo com colegas.' },
                { value: 'nao_se_aplica', label: 'Não se aplica (nunca presenciei nem vivi tais situações).' },
              ].map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="nivel_envolvimento"
                  value={opt.value}
                  label={opt.label}
                  checked={form.nivel_envolvimento === opt.value}
                  onChange={handleRadio}
                />
              ))}
              {errors.nivel_envolvimento && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.nivel_envolvimento}
                </p>
              )}
            </SubSection>
          </div>
        </QuestionCard>
      </div>

      {/* P5 – Diversidade */}
      <div id="percepcao_diversidade">
        <QuestionCard
          number={5}
          title="Sente que o ambiente da ASAC PHARMA é seguro e respeitoso para todas as pessoas, independentemente de gênero, raça ou orientação sexual?"
          error={errors.percepcao_diversidade}
        >
          {[
            { value: 'sim_totalmente', label: 'Sim, totalmente.' },
            { value: 'maioria_das_vezes', label: 'Na maioria das vezes, mas há pontos de melhoria.' },
            { value: 'condutas_inadequadas_ou_discriminatorias', label: 'Tenho percebido condutas inadequadas ou discriminatórias.' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="percepcao_diversidade"
              value={opt.value}
              label={opt.label}
              checked={form.percepcao_diversidade === opt.value}
              onChange={handleRadio}
            />
          ))}
        </QuestionCard>
      </div>

      {/* P6 – Autonomia de lideranças */}
      <div id="autonomia_liderancas">
        <QuestionCard
          number={6}
          title="Sobre a gestão de pessoas na empresa, você percebe que as lideranças possuem autonomia e preparo para resolver problemas de relacionamento e conduta diretamente com as equipes, ou existe uma dependência excessiva do suporte do RH para essas questões?"
          error={errors.autonomia_liderancas}
        >
          {[
            { value: 'autonomas', label: 'As lideranças são autônomas e resolvem os conflitos internamente.' },
            { value: 'resolvem_parte_e_recorrem_rh', label: 'As lideranças resolvem parte dos problemas, mas recorrem muito ao RH.' },
            { value: 'quase_tudo_depende_rh', label: 'Quase tudo acaba por depender da intervenção direta do RH.' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="autonomia_liderancas"
              value={opt.value}
              label={opt.label}
              checked={form.autonomia_liderancas === opt.value}
              onChange={handleRadio}
            />
          ))}
        </QuestionCard>
      </div>

      {/* P7 – Clareza compliance */}
      <div id="clareza_compliance">
        <QuestionCard
          number={7}
          title="Para você, a diferença entre 'cobrança técnica por resultados e metas' e 'conduta que caracteriza assédio moral' está clara?"
          error={errors.clareza_compliance}
        >
          {[
            { value: 'total_clareza', label: 'Sim, tenho total clareza.' },
            { value: 'algumas_duvidas', label: 'Tenho algumas dúvidas sobre os limites de cada uma.' },
            { value: 'nao_esta_clara', label: 'Não está clara e gostaria de orientações do consultor.' },
          ].map((opt) => (
            <RadioOption
              key={opt.value}
              name="clareza_compliance"
              value={opt.value}
              label={opt.label}
              checked={form.clareza_compliance === opt.value}
              onChange={handleRadio}
            />
          ))}
        </QuestionCard>
      </div>

      {/* P8 – Relato blindado */}
      <div id="relato_blindado">
        <QuestionCard
          number={8}
          title="Descreva brevemente uma conduta, fala ou situação (sem citar nomes ou áreas) que gostaria que o consultor analisasse tecnicamente durante o workshop para esclarecer se a prática é adequada ou não perante a lei e a ética."
          hint="Devido à limitação do tempo do treinamento, não há garantia total de que todos os relatos individuais serão tratados, mas os temas e as situações mais citadas serão abordados de alguma forma durante a capacitação."
          error={errors.relato_blindado}
        >
          <textarea
            name="relato_blindado"
            value={form.relato_blindado}
            onChange={handleTextarea}
            rows={5}
            placeholder="Descreva a situação sem identificar pessoas, cargos ou áreas específicas..."
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y
              ${errors.relato_blindado ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}
          />
        </QuestionCard>
      </div>

      {/* P9 – Tema sugerido */}
      <div id="tema_sugerido">
        <QuestionCard
          number={9}
          title="Existe algum assunto específico que considera vital ser abordado para fortalecer a cultura de respeito e a marca empregadora da ASAC PHARMA?"
          error={errors.tema_sugerido}
        >
          <textarea
            name="tema_sugerido"
            value={form.tema_sugerido}
            onChange={handleTextarea}
            rows={4}
            placeholder="Descreva o tema ou assunto que considera importante..."
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-slate-800 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y
              ${errors.tema_sugerido ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}
          />
        </QuestionCard>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* Privacy reminder + submit */}
      <div className="rounded-2xl bg-slate-100 border border-slate-200 px-6 py-5 space-y-4">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>
            Suas respostas são <strong>100% anônimas</strong>. Nenhum dado de identificação pessoal
            é coletado ou armazenado. Os dados consolidados serão utilizados exclusivamente para
            customizar o treinamento.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white text-base
            bg-blue-700 hover:bg-blue-800 active:bg-blue-900
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-150 flex items-center justify-center gap-3 shadow-sm"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar Diagnóstico
            </>
          )}
        </button>
      </div>
    </form>
  )
}
