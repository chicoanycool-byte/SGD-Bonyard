import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/inicio'
    return NextResponse.redirect(url)
  }

  // Heartbeat de actividad: actualiza cuánto tiempo lleva navegando la sesión actual,
  // para las métricas de acceso del Coordinador SGI. Throttleado a 1 vez por minuto.
  if (user) {
    const sesionId = request.cookies.get('sgd_sesion_id')?.value
    const ultimoHb = request.cookies.get('sgd_hb')?.value
    const ahora = Date.now()

    if (sesionId && (!ultimoHb || ahora - Number(ultimoHb) > 60_000)) {
      await supabase
        .from('accesos_usuario')
        .update({ ultima_actividad: new Date().toISOString() })
        .eq('id', sesionId)

      supabaseResponse.cookies.set('sgd_hb', String(ahora), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }
  }

  return supabaseResponse
}
