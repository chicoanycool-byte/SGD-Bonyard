'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { chatAsesorSGI, type MensajeChat } from '@/lib/anthropic'

export async function enviarMensajeAsesor(contenido: string) {
  const quien = await requerirUsuario()
  if (!contenido.trim()) throw new Error('Escribe una pregunta.')

  const supabase = await createClient()

  await supabase.from('asesor_mensajes').insert({
    usuario_id: quien.id,
    rol: 'user',
    contenido,
  })

  const { data: historialData } = await supabase
    .from('asesor_mensajes')
    .select('rol, contenido')
    .eq('usuario_id', quien.id)
    .order('creado_en', { ascending: true })
    .limit(20)

  const historial: MensajeChat[] = (historialData ?? []).map((m) => ({
    role: m.rol as 'user' | 'assistant',
    content: m.contenido as string,
  }))

  const { data: documentos } = await supabase
    .from('documentos')
    .select('codigo, nombre')
    .order('codigo')
    .limit(200)

  const catalogo = (documentos ?? []).map((d) => `${d.codigo} — ${d.nombre}`).join('\n')

  const respuesta = await chatAsesorSGI(historial, catalogo)

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
