'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

export async function actualizarRespuestaDefensa(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const itemId = String(formData.get('item_id') ?? '')
  const nave = String(formData.get('nave') ?? '')
  if (!itemId || !nave) throw new Error('Faltan datos.')

  await supabase.from('defensa_alimentaria_respuestas').upsert(
    {
      item_id: itemId,
      nave,
      respuesta: String(formData.get('respuesta') ?? '') || null,
      hallazgos: String(formData.get('hallazgos') ?? '').trim() || null,
      acciones_mejora: String(formData.get('acciones_mejora') ?? '').trim() || null,
      responsable: String(formData.get('responsable') ?? '').trim() || null,
      fecha_programada_cierre: String(formData.get('fecha_programada_cierre') ?? '').trim() || null,
      fecha_real_cierre: String(formData.get('fecha_real_cierre') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'item_id,nave' }
  )
  revalidatePath('/inocuidad-alimentaria/defensa-alimentaria')
}

export async function actualizarEncabezadoDefensa(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const nave = String(formData.get('nave') ?? '')
  if (!nave) throw new Error('Falta la nave.')

  await supabase.from('defensa_alimentaria_encabezado').upsert(
    {
      nave,
      fecha: String(formData.get('fecha') ?? '') || null,
      proxima_revision: String(formData.get('proxima_revision') ?? '') || null,
      realizado_por: String(formData.get('realizado_por') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'nave' }
  )
  revalidatePath('/inocuidad-alimentaria/defensa-alimentaria')
}
