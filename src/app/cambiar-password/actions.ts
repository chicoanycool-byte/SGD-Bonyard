'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export type EstadoCambioPassword = { error?: string }

export async function cambiarPasswordPropia(
  _prevState: EstadoCambioPassword,
  formData: FormData
): Promise<EstadoCambioPassword> {
  const quien = await requerirUsuario({ omitirRedireccionPassword: true })

  const nueva = String(formData.get('nueva') ?? '')
  const confirmar = String(formData.get('confirmar') ?? '')

  if (nueva.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  }
  if (nueva !== confirmar) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const { error: errorAuth } = await supabase.auth.updateUser({ password: nueva })
  if (errorAuth) {
    if (errorAuth.message.includes('should be different')) {
      return { error: 'La nueva contraseña debe ser diferente a la contraseña temporal actual.' }
    }
    return { error: 'No se pudo actualizar la contraseña: ' + errorAuth.message }
  }

  await supabase
    .from('usuarios')
    .update({ cambio_password_obligatorio: false })
    .eq('id', quien.id)

  redirect('/inicio')
}
