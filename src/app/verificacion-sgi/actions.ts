'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

export type EstadoVerificacion = { error?: string; verificacionId?: string }

export async function crearVerificacion(
  _prevState: EstadoVerificacion,
  formData: FormData
): Promise<EstadoVerificacion> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') return { error: 'No autorizado.' }

  const fecha = String(formData.get('fecha') ?? '')
  const periodoEvaluado = String(formData.get('periodo_evaluado') ?? '').trim()
  const areaProceso = String(formData.get('area_proceso') ?? '').trim()

  if (!fecha) return { error: 'La fecha es obligatoria.' }

  const supabase = await createClient()

  const { data: verificacion, error } = await supabase
    .from('verificaciones')
    .insert({
      fecha,
      periodo_evaluado: periodoEvaluado || null,
      area_proceso: areaProceso || null,
      aplicado_por_id: quien.id,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !verificacion) {
    return { error: 'No se pudo crear la verificación. ' + (error?.message ?? '') }
  }

  const { data: checklist } = await supabase
    .from('verificacion_checklist')
    .select('id')
    .order('numero')

  if (checklist && checklist.length > 0) {
    await supabase.from('verificacion_respuestas').insert(
      checklist.map((c) => ({
        verificacion_id: verificacion.id,
        checklist_id: c.id,
      }))
    )
  }

  revalidatePath('/verificacion-sgi')
  return { verificacionId: verificacion.id }
}

export async function actualizarRespuestaVerificacion(
  respuestaId: string,
  verificacionId: string,
  campos: {
    respuesta?: string
    hallazgo?: string
    accion_mejora?: string
    responsable_id?: string | null
    fecha_compromiso?: string | null
  }
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('verificacion_respuestas')
    .update({ ...campos, actualizado_en: new Date().toISOString() })
    .eq('id', respuestaId)

  if (campos.respuesta === 'no_cumple' && campos.responsable_id) {
    const { data: r } = await supabase
      .from('verificacion_respuestas')
      .select('hallazgo, checklist:verificacion_checklist(bloque, subarea, criterio)')
      .eq('id', respuestaId)
      .single()

    const checklist = r?.checklist as unknown as { bloque: string; subarea: string; criterio: string } | null
    const mensaje = `Hallazgo de Verificación del SGI (${checklist?.bloque ?? ''} / ${checklist?.subarea ?? ''}): ${checklist?.criterio ?? ''}`

    await supabase.from('notificaciones').insert({
      usuario_id: campos.responsable_id,
      tipo: 'sistema',
      mensaje,
      referencia_id: respuestaId,
    })
    await supabase.from('pendientes').insert({
      usuario_id: campos.responsable_id,
      modulo: 'verificacion_sgi',
      referencia_id: respuestaId,
      descripcion: mensaje,
      fecha_limite: campos.fecha_compromiso ?? null,
    })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', campos.responsable_id)
      .single()
    if (usuario?.correo) {
      await enviarCorreo([usuario.correo], 'Hallazgo de Verificación del SGI — SGD Bonyard', `<p>${mensaje}</p>`)
    }
  }

  revalidatePath(`/verificacion-sgi/${verificacionId}`)
}

export async function cerrarHallazgoVerificacion(respuestaId: string, verificacionId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('verificacion_respuestas')
    .update({
      estatus: 'cerrado',
      fecha_cierre_real: new Date().toISOString().slice(0, 10),
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', respuestaId)

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', respuestaId)
    .eq('modulo', 'verificacion_sgi')

  revalidatePath(`/verificacion-sgi/${verificacionId}`)
}

export async function cerrarVerificacion(verificacionId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('verificaciones')
    .update({ estatus: 'cerrada', actualizado_en: new Date().toISOString() })
    .eq('id', verificacionId)

  revalidatePath(`/verificacion-sgi/${verificacionId}`)
  revalidatePath('/verificacion-sgi')
}

export async function generarAccionDesdeVerificacion(respuestaId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: r } = await supabase
    .from('verificacion_respuestas')
    .select(
      'id, hallazgo, accion_mejora, responsable_id, fecha_compromiso, checklist:verificacion_checklist(bloque, subarea, criterio)'
    )
    .eq('id', respuestaId)
    .single()

  if (!r) throw new Error('No encontrado.')
  const checklist = r.checklist as unknown as { bloque: string; subarea: string; criterio: string } | null

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .insert({
      origen: 'manual',
      descripcion: `Verificación del SGI (${checklist?.bloque}/${checklist?.subarea}): ${checklist?.criterio}${r.hallazgo ? ' — ' + r.hallazgo : ''}`,
      responsable_id: r.responsable_id,
      fecha_compromiso: r.fecha_compromiso,
      accion_propuesta: r.accion_mejora,
      estatus: r.responsable_id ? 'en_proceso' : 'abierta',
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (accion) {
    await supabase
      .from('verificacion_respuestas')
      .update({ accion_correctiva_id: accion.id })
      .eq('id', respuestaId)
  }

  revalidatePath('/verificacion-sgi')
  revalidatePath('/ac-ap')
}
