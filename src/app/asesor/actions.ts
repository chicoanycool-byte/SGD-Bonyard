'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { chatAsesorSGI, type MensajeChat } from '@/lib/anthropic'
import { obtenerTextoDocumento } from '@/lib/documentos-texto'

export async function enviarMensajeAsesor(contenido: string, imagenBase64?: string | null) {
  const quien = await requerirUsuario()
  if (!contenido.trim() && !imagenBase64) throw new Error('Escribe una pregunta o adjunta una foto.')

  const supabase = await createClient()

  await supabase.from('asesor_mensajes').insert({
    usuario_id: quien.id,
    rol: 'user',
    contenido: contenido || '(Foto adjunta)',
    imagen_base64: imagenBase64 || null,
  })

  const { data: historialData } = await supabase
    .from('asesor_mensajes')
    .select('rol, contenido, imagen_base64')
    .eq('usuario_id', quien.id)
    .order('creado_en', { ascending: true })
    .limit(20)

  const historial: MensajeChat[] = (historialData ?? []).map((m) => ({
    role: m.rol as 'user' | 'assistant',
    content: m.contenido as string,
    imagen: m.imagen_base64 as string | null,
  }))

  const { data: documentos } = await supabase
    .from('documentos')
    .select('codigo, nombre')
    .order('codigo')
    .limit(200)

  const catalogo = (documentos ?? []).map((d) => `${d.codigo} — ${d.nombre}`).join('\n')

  const respuesta = await chatAsesorSGI(historial, catalogo, obtenerTextoDocumento)

  await supabase.from('asesor_mensajes').insert({
    usuario_id: quien.id,
    rol: 'assistant',
    contenido: respuesta,
  })

  revalidatePath('/asesor')
  return respuesta
}

export async function limpiarConversacion() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  await supabase.from('asesor_mensajes').delete().eq('usuario_id', quien.id)
  revalidatePath('/asesor')
}
