import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type UsuarioActual = {
  id: string
  usuario: string
  nombre: string
  correo: string
  puesto: string | null
  rol: string
  estatus: string
  cambio_password_obligatorio: boolean
}

export async function requerirUsuario(opciones?: {
  omitirRedireccionPassword?: boolean
}): Promise<UsuarioActual> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, usuario, nombre, correo, puesto, rol, estatus, cambio_password_obligatorio')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario || usuario.estatus !== 'activo') {
    redirect('/login')
  }

  if (usuario.cambio_password_obligatorio && !opciones?.omitirRedireccionPassword) {
    redirect('/cambiar-password')
  }

  return usuario
}
