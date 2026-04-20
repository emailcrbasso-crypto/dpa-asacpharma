# Diagnóstico Prévio Anônimo (DPA) — Projeto ASAC PHARMA

Aplicação web de formulário anônimo desenvolvida para o Projeto ASAC PHARMA pela **CR BASSO Educação Corporativa**.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL via `@supabase/supabase-js`)
- **Zod** (validação frontend e backend)
- Deploy: **Vercel**

---

## Estrutura de arquivos

```
dpa-asacpharma/
├── app/
│   ├── api/
│   │   └── submit/
│   │       └── route.ts          # Endpoint POST server-side
│   ├── obrigado/
│   │   └── page.tsx              # Página de confirmação
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Página principal com o formulário
├── components/
│   └── DPAForm.tsx               # Componente client-side do formulário
├── lib/
│   ├── schemas.ts                # Schema Zod (compartilhado)
│   └── supabase-server.ts        # Cliente Supabase (somente server)
├── .env.example
├── .env.local                    # NÃO versionar
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Configuração do banco de dados (Supabase)

Execute o SQL abaixo no **SQL Editor** do seu projeto Supabase:

```sql
create extension if not exists pgcrypto;

create table public.dpa_respostas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  perfil_lideranca boolean not null,
  localizacao_principal text not null check (
    localizacao_principal in ('escritorio_paulista', 'laboratorio_producao', 'producao')
  ),

  nota_respeito_profissionalismo integer not null check (
    nota_respeito_profissionalismo between 1 and 5
  ),
  justificativa_nota text,

  frequencia_linguagem_inadequada text not null check (
    frequencia_linguagem_inadequada in ('nunca', 'raramente', 'frequentemente', 'sempre')
  ),

  nivel_envolvimento text not null check (
    nivel_envolvimento in (
      'ocorreu_comigo',
      'presenciei_colegas',
      'ocorreu_comigo_e_presenciei',
      'nao_se_aplica'
    )
  ),

  percepcao_diversidade text not null check (
    percepcao_diversidade in (
      'sim_totalmente',
      'maioria_das_vezes',
      'condutas_inadequadas_ou_discriminatorias'
    )
  ),

  autonomia_liderancas text not null check (
    autonomia_liderancas in (
      'autonomas',
      'resolvem_parte_e_recorrem_rh',
      'quase_tudo_depende_rh'
    )
  ),

  clareza_compliance text not null check (
    clareza_compliance in (
      'total_clareza',
      'algumas_duvidas',
      'nao_esta_clara'
    )
  ),

  relato_blindado text,
  tema_sugerido text,

  token_convite text,
  origem_formulario text default 'dpa_asacpharma_v1',
  status text not null default 'enviado' check (status in ('enviado'))
);

alter table public.dpa_respostas enable row level security;
```

> A tabela tem RLS habilitado. O endpoint usa a **service role key** (server-side apenas) para bypassar a RLS nas inserções.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Onde encontrar |
|---|---|
| `SUPABASE_URL` | Supabase > Settings > API > Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role (secret) |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex: `https://dpa.seudominio.com.br`) |

> A `SUPABASE_SERVICE_ROLE_KEY` **nunca** é exposta ao frontend — ela é usada apenas em `lib/supabase-server.ts` e no API route.

---

## Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy na Vercel

1. Faça push do repositório para o GitHub.
2. Importe o projeto na [Vercel](https://vercel.com).
3. Na aba **Environment Variables**, adicione:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Clique em **Deploy**.

---

## Segurança e anonimato

- Nenhum campo de identificação pessoal (nome, e-mail, matrícula, IP) é coletado.
- A service role key do Supabase é usada exclusivamente no servidor (API route).
- O endpoint valida todos os dados com Zod antes de qualquer operação no banco.
- RLS está habilitado na tabela; apenas a service role (backend) pode inserir.
- `robots` meta tag configurada com `noindex, nofollow`.
