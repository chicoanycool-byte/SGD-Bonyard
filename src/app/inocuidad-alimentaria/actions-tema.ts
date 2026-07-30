'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

export async function actualizarDocumentoInocuidad(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const tipo = String(formData.get('tipo') ?? '')

  await supabase.from('inocuidad_documentos').upsert(
    {
      tipo,
      evaluacion_vulnerabilidad: String(formData.get('evaluacion_vulnerabilidad') ?? '').trim() || null,
      medidas_mitigacion: String(formData.get('medidas_mitigacion') ?? '').trim() || null,
      resumen: String(formData.get('resumen') ?? '').trim() || null,
      fecha_elaboracion: String(formData.get('fecha_elaboracion') ?? '') || null,
      fecha_ultima_revision: String(formData.get('fecha_ultima_revision') ?? '') || null,
      responsable_id: quien.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'tipo' }
  )
  revalidatePath('/inocuidad-alimentaria', 'layout')
}

export async function crearEventoInocuidad(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const tipo = String(formData.get('tipo') ?? '')
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!tipo || !titulo) throw new Error('Faltan datos.')

  await supabase.from('inocuidad_eventos').insert({
    tipo,
    titulo,
    fecha: String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10),
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    resultado: String(formData.get('resultado') ?? '').trim() || null,
    tiempo_respuesta: String(formData.get('tiempo_respuesta') ?? '').trim() || null,
    porcentaje_recuperacion: formData.get('porcentaje_recuperacion')
      ? Number(formData.get('porcentaje_recuperacion'))
      : null,
    satisfactorio: formData.get('satisfactorio') === 'on',
    responsable_id: quien.id,
    creado_por: quien.id,
  })
  revalidatePath('/inocuidad-alimentaria', 'layout')
}

export async function eliminarEventoInocuidad(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('inocuidad_eventos').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria', 'layout')
}
