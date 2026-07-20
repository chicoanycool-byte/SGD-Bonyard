'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

const ROLES_GESTION = ['coordinador_sgi']

export type EstadoRecorrido = { error?: string; recorridoId?: string }

// Plazos según el instructivo del cuestionario BPA
function fechaCompromisoPorRiesgo(nivelRiesgo: string | null): string {
  const hoy = new Date()
  if (nivelRiesgo === 'Crítico') return hoy.toISOString().slice(0, 10)
  if (nivelRiesgo === 'Mayor') {
    hoy.setHours(hoy.getHours() + 72)
    return hoy.toISOString().slice(0, 10)
  }
  hoy.setDate(hoy.getDate() + 15)
  return hoy.toISOString().slice(0, 10)
}

export async function crearRecorrido(
  _prevState: EstadoRecorrido,
  formData: FormData
): Promise<EstadoRecorrido> {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) return { error: 'No autorizado.' }

  const fecha = String(formData.get('fecha') ?? '')
  const naves = String(formData.get('naves_inspeccionadas') ?? '').trim()
  const tipoInspeccion = String(formData.get('tipo_inspeccion') ?? '')
  const supervisorArea = String(formData.get('supervisor_area') ?? '').trim()
  const cargoSupervisor = String(formData.get('cargo_supervisor') ?? '').trim()
  const turno = String(formData.get('turno') ?? '')
  const horaInicio = String(formData.get('hora_inicio') ?? '') || null

  if (!fecha || !tipoInspeccion) {
    return { error: 'Fecha y tipo de inspección son obligatorios.' }
  }

  const supabase = await createClient()

  const { data: recorrido, error } = await supabase
    .from('bpa_recorridos')
    .insert({
      fecha,
      naves_inspeccionadas: naves || null,
      tipo_inspeccion: tipoInspeccion,
      inspector_id: quien.id,
      cargo_inspector: quien.rol,
      supervisor_area: supervisorArea || null,
      cargo_supervisor: cargoSupervisor || null,
      turno: turno || null,
      hora_inicio: horaInicio,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !recorrido) {
    return { error: 'No se pudo crear el recorrido. ' + (error?.message ?? '') }
  }

  const { data: checklist } = await supabase
    .from('bpa_checklist')
    .select('id')
    .order('numero')

  if (checklist && checklist.length > 0) {
    await supabase.from('bpa_respuestas').insert(
      checklist.map((c) => ({
        recorrido_id: recorrido.id,
        checklist_id: c.id,
      }))
    )
  }

  revalidatePath('/recorridos-bpa')
  return { recorridoId: recorrido.id }
}

export async function actualizarRespuesta(
  respuestaId: string,
  recorridoId: string,
  campos: {
    respuesta?: string
    observaciones?: string
    accion_correctiva_requerida?: string
    responsable_id?: string | null
    fecha_compromiso?: string | null
    nivel_riesgo?: string | null
  }
) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()

  const update: Record<string, unknown> = { actualizado_en: new Date().toISOString() }
  if (campos.respuesta !== undefined) update.respuesta = campos.respuesta
  if (campos.observaciones !== undefined) update.observaciones = campos.observaciones
  if (campos.accion_correctiva_requerida !== undefined)
    update.accion_correctiva_requerida = campos.accion_correctiva_requerida
  if (campos.responsable_id !== undefined) update.responsable_id = campos.responsable_id
  if (campos.fecha_compromiso !== undefined) update.fecha_compromiso = campos.fecha_compromiso

  // Sugiere automáticamente la fecha compromiso según el nivel de riesgo si se marca "no cumple"
  if (campos.respuesta === 'no_cumple' && !campos.fecha_compromiso) {
    update.fecha_compromiso = fechaCompromisoPorRiesgo(campos.nivel_riesgo ?? null)
  }

  await supabase.from('bpa_respuestas').update(update).eq('id', respuestaId)

  // Si se asigna responsable a un hallazgo, genera su pendiente y notificación
  if (campos.responsable_id) {
    const { data: r } = await supabase
      .from('bpa_respuestas')
      .select('fecha_compromiso, checklist:bpa_checklist(pregunta, area)')
      .eq('id', respuestaId)
      .single()

    const checklist = r?.checklist as unknown as { pregunta: string; area: string | null } | null
    const mensaje = `Hallazgo BPA (${checklist?.area ?? ''}): ${checklist?.pregunta ?? ''}`

    await supabase.from('notificaciones').insert({
      usuario_id: campos.responsable_id,
      tipo: 'recorrido_bpa',
      mensaje,
      referencia_id: respuestaId,
    })
    await supabase.from('pendientes').insert({
      usuario_id: campos.responsable_id,
      modulo: 'recorridos_bpa',
      referencia_id: respuestaId,
      descripcion: mensaje,
      fecha_limite: r?.fecha_compromiso ?? null,
    })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', campos.responsable_id)
      .single()
    if (usuario?.correo) {
      await enviarCorreo(
        [usuario.correo],
        'Hallazgo BPA asignado — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  // Notifica de inmediato si es un hallazgo crítico
  if (campos.respuesta === 'no_cumple' && campos.nivel_riesgo === 'Crítico') {
    const { data: coordinadores } = await supabase
      .from('usuarios')
      .select('id, correo')
      .eq('rol', 'coordinador_sgi')
      .eq('estatus', 'activo')

    if (coordinadores && coordinadores.length > 0) {
      const mensaje = `Hallazgo CRÍTICO en recorrido BPA: ${campos.observaciones ?? 'revisar detalle en el sistema'}.`
      await supabase.from('notificaciones').insert(
        coordinadores.map((c) => ({ usuario_id: c.id, tipo: 'recorrido_bpa' as const, mensaje }))
      )
      await enviarCorreo(
        coordinadores.map((c) => c.correo),
        'Hallazgo CRÍTICO en recorrido BPA — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  revalidatePath(`/recorridos-bpa/${recorridoId}`)
}

export async function cerrarHallazgo(respuestaId: string, recorridoId: string) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('bpa_respuestas')
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
    .eq('modulo', 'recorridos_bpa')

  revalidatePath(`/recorridos-bpa/${recorridoId}`)
}

export async function cerrarRecorrido(recorridoId: string) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('bpa_recorridos')
    .update({
      estatus: 'cerrado',
      hora_termino: new Date().toTimeString().slice(0, 5),
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', recorridoId)

  revalidatePath(`/recorridos-bpa/${recorridoId}`)
  revalidatePath('/recorridos-bpa')
}

export async function generarAccionDesdeHallazgo(respuestaId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: r } = await supabase
    .from('bpa_respuestas')
    .select(
      'id, observaciones, accion_correctiva_requerida, responsable_id, fecha_compromiso, checklist:bpa_checklist(pregunta, nivel_riesgo, area, subarea)'
    )
    .eq('id', respuestaId)
    .single()

  if (!r) throw new Error('No encontrado.')
  const checklist = r.checklist as unknown as {
    pregunta: string
    nivel_riesgo: string | null
    area: string | null
    subarea: string | null
  } | null

  const tipoNc =
    checklist?.nivel_riesgo === 'Crítico'
      ? 'critica'
      : checklist?.nivel_riesgo === 'Mayor'
        ? 'mayor'
        : 'menor'

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .insert({
      origen: 'manual',
      descripcion: `Hallazgo BPA (${checklist?.area}/${checklist?.subarea}): ${checklist?.pregunta}${r.observaciones ? ' — ' + r.observaciones : ''}`,
      tipo_nc: tipoNc,
      responsable_id: r.responsable_id,
      fecha_compromiso: r.fecha_compromiso,
      accion_propuesta: r.accion_correctiva_requerida,
      estatus: r.responsable_id ? 'en_proceso' : 'abierta',
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (accion) {
    await supabase.from('bpa_respuestas').update({ accion_correctiva_id: accion.id }).eq('id', respuestaId)
  }

  revalidatePath('/recorridos-bpa')
  revalidatePath('/ac-ap')
}
