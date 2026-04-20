import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (!process.env.PAINEL_SECRET || password !== process.env.PAINEL_SECRET) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('dpa_auth', Buffer.from(password).toString('base64'), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })

  return response
}
