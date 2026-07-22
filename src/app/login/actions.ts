'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function iniciarSesion(formData: FormData) {
  const supabase = await createClient()

  const usuario = String(formData.get('usuario') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!usuario || !password) {
    redirect('/login?error=Ingresa%20usuario%20y%20contrase%C3%B1a')
  }

  // El usuario inicia sesion con su "usuario" interno; lo resolvemos a su correo real
  // via una funcion security-definer que no expone el resto de la tabla usuarios.
  const { data: correo, error: errorCorreo } = await supabase.rpc(
    'resolver_correo_login',
    { usuario_input: usuario }
  )

  if (errorCorreo || !correo) {
    redirect('/login?error=Usuario%20o%20contrase%C3%B1a%20incorrectos')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password,
  })

  if (error) {
    redirect('/login?error=Usuario%20o%20contrase%C3%B1a%20incorrectos')
  }

  // Registrar el acceso para métricas del Coordinador SGI (no debe bloquear el login si falla)
  try {
    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .maybeSingle()

    if (usuarioRow) {
      const { data: acceso } = await supabase
        .from('accesos_usuario')
        .insert({ usuario_id: usuarioRow.id })
        .select('id')
        .single()

      if (acceso) {
        const cookieStore = await cookies()
        cookieStore.set('sgd_sesion_id', acceso.id, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        })
      }
    }
  } catch {
    // no interrumpe el inicio de sesión si el registro de métricas falla
  }

  revalidatePath('/', 'layout')
  redirect('/inicio')
}
