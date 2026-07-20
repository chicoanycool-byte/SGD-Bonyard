'use server'

import { createClient } from '@/lib/supabase/server'
import { enviarCorreo } from '@/lib/email'

export async function solicitarRecuperacion(
  _prevState: { enviado: boolean; error?: string },
  formData: FormData
) {
  const usuario = String(formData.get('usuario') ?? '').trim()

  if (!usuario) {
    return { enviado: false, error: 'Ingresa tu usuario.' }
  }

  const supabase = await createClient()

  // security definer: valida el usuario, notifica al Coordinador SGI
  // internamente y regresa sus correos para avisarles también por email.
  // Siempre respondemos igual para no revelar qué cuentas existen.
  const { data: correos } = await supabase.rpc('solicitar_recuperacion_password', {
    usuario_input: usuario,
  })

  if (correos && correos.length > 0) {
    await enviarCorreo(
      correos,
      'Solicitud de recuperación de contraseña — SGD Bonyard',
      `<p>El usuario <strong>${usuario}</strong> solicitó recuperar su contraseña.</p>
       <p>Entra al SGD Bonyard, módulo Usuarios, para restablecerla.</p>`
    )
  }

  return { enviado: true }
}
