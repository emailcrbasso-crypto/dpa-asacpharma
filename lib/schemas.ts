import { z } from 'zod'

export const formSchema = z.object({
  perfil_lideranca: z.enum(['sim', 'nao'], {
    required_error: 'Por favor, responda esta pergunta.',
    invalid_type_error: 'Opção inválida.',
  }),
  localizacao_principal: z.enum(
    ['escritorio_paulista', 'laboratorio', 'producao'],
    { required_error: 'Por favor, selecione uma unidade.' }
  ),
  nota_respeito_profissionalismo: z.coerce
    .number({ required_error: 'Por favor, atribua uma nota.' })
    .int()
    .min(1, 'A nota mínima é 1.')
    .max(5, 'A nota máxima é 5.'),
  justificativa_nota: z
    .string({ required_error: 'Por favor, preencha a justificativa.' })
    .min(10, 'Por favor, forneça uma justificativa com ao menos 10 caracteres.'),
  frequencia_linguagem_inadequada: z.enum(
    ['nunca', 'raramente', 'frequentemente', 'sempre'],
    { required_error: 'Por favor, selecione uma opção.' }
  ),
  nivel_envolvimento: z.enum(
    [
      'ocorreu_comigo',
      'presenciei_colegas',
      'ocorreu_comigo_e_presenciei',
      'nao_se_aplica',
    ],
    { required_error: 'Por favor, selecione uma opção.' }
  ),
  percepcao_diversidade: z.enum(
    [
      'sim_totalmente',
      'maioria_das_vezes',
      'condutas_inadequadas_ou_discriminatorias',
    ],
    { required_error: 'Por favor, selecione uma opção.' }
  ),
  autonomia_liderancas: z.enum(
    ['autonomas', 'resolvem_parte_e_recorrem_rh', 'quase_tudo_depende_rh'],
    { required_error: 'Por favor, selecione uma opção.' }
  ),
  clareza_compliance: z.enum(
    ['total_clareza', 'algumas_duvidas', 'nao_esta_clara'],
    { required_error: 'Por favor, selecione uma opção.' }
  ),
  relato_blindado: z
    .string({ required_error: 'Por favor, descreva a situação.' })
    .min(10, 'Por favor, descreva com ao menos 10 caracteres.'),
  tema_sugerido: z
    .string({ required_error: 'Por favor, sugira um tema.' })
    .min(10, 'Por favor, descreva o tema com ao menos 10 caracteres.'),
  token_convite: z.string().optional(),
})

export type FormData = z.infer<typeof formSchema>
