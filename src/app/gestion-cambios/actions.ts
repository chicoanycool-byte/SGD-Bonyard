'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { TIPOS_CAMBIO } from '@/lib/cambios'

export type EstadoCambio = { error?: string; ok?: boolean }

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

async function avisar(usuarioIds: (string | null)[], mensaje: string, referencia: string) {
  const supabase = await createClient()
  const ids = [...new Set(usuarioIds.filter(Boolean))] as string[]
  if (ids.length === 0) return
  await supabase
    .from('notificaciones')
    .insert(ids.map((usuario_id) => ({ usuario_id, tipo: 'sistema', mensaje, referencia_id: referencia })))
}

export async function solicitarCambio(_prev: EstadoCambio, fd: FormData): Promise<EstadoCambio> {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const titulo = texto(fd, 'titulo')
  const tipo = texto(fd, 'tipo')
  const descripcion = texto(fd, 'descripcion')
  if (!titulo || !descripcion) return { error: 'El título y la descripción del cambio son obligatorios.' }
  if (!TIPOS_CAMBIO[tipo]) return { error: 'Selecciona el tipo de cambio.' }

  const { data, error } = await supabase
    .from('cambios')
    .insert({
      titulo,
      tipo,
      descripcion,
      motivo: texto(fd, 'motivo') || null,
      nave: texto(fd, 'nave') || null,
      area_afectada: texto(fd, 'area_afectada') || null,
      afecta_inocuidad: fd.get('afecta_inocuidad') === 'on',
      fecha_planeada: texto(fd, 'fecha_planeada') || null,
      solicitante_id: quien.id,
    })
    .select('id, folio')
    .single()
  if (error || !data) return { error: 'No se pudo guardar la solicitud. ' + (error?.message ?? '') }

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')
  await avisar(
    (coordinadores ?? []).map((c) => c.id as string),
    `Nueva solicitud de cambio ${data.folio}: ${titulo}. Falta evaluar su riesgo.`,
    data.id as string
  )

  revalidatePath('/gestion-cambios')
  return { ok: true }
}

export async function evaluarCambio(id: string, _prev: EstadoCambio, fd: FormData): Promise<EstadoCambio> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') return { error: 'Solo el Coordinador del SGI evalúa y aprueba cambios.' }
  const supabase = await createClient()

  const decision = texto(fd, 'decision')
  const riesgo = texto(fd, 'riesgo_nivel')
  const evaluacion = texto(fd, 'evaluacion_riesgo')
  if (!['aprobar', 'rechazar'].includes(decision)) return { error: 'Elige si se aprueba o se rechaza.' }
  if (!['bajo', 'medio', 'alto'].includes(riesgo)) return { error: 'Indica el nivel de riesgo.' }
  if (!evaluacion) return { error: 'Describe la evaluación de riesgo (qué puede salir mal y qué se hará).' }
  const comentario = texto(fd, 'comentario_decision')
  if (decision === 'rechazar' && !comentario) return { error: 'Anota el motivo del rechazo.' }
  const responsable = texto(fd, 'responsable_id') || null
  if (decision === 'aprobar' && !responsable) return { error: 'Asigna un responsable de implementar el cambio.' }

  const { data: previo } = await supabase.from('cambios').select('folio, titulo, solicitante_id').eq('id', id).single()

  const { error } = await supabase
    .from('cambios')
    .update({
      riesgo_nivel: riesgo,
      evaluacion_riesgo: evaluacion,
      controles_requeridos: texto(fd, 'controles_requeridos') || null,
      requiere_capacitacion: fd.get('requiere_capacitacion') === 'on',
      requiere_actualizar_documentos: fd.get('requiere_actualizar_documentos') === 'on',
      responsable_id: responsable,
      fecha_planeada: texto(fd, 'fecha_planeada') || null,
      estatus: decision === 'aprobar' ? 'aprobado' : 'rechazado',
      aprobado_por: quien.id,
      fecha_aprobacion: new Date().toISOString(),
      comentario_decision: comentario || null,
    })
    .eq('id', id)
  if (error) return { error: 'No se pudo guardar la decisión. ' + error.message }

  await avisar(
    [previo?.solicitante_id as string | null, responsable],
    decision === 'aprobar'
      ? `El cambio ${previo?.folio} (${previo?.titulo}) fue aprobado. Ya se puede implementar.`
      : `El cambio ${previo?.folio} (${previo?.titulo}) no fue aprobado. Revisa el motivo en su detalle.`,
    id
  )
  revalidatePath('/gestion-cambios')
  revalidatePath(`/gestion-cambios/${id}`)
  return { ok: true }
}

export async function registrarImplementacion(id: string, _prev: EstadoCambio, fd: FormData): Promise<EstadoCambio> {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const fecha = texto(fd, 'fecha_implementacion')
  const evidencia = texto(fd, 'evidencia_implementacion')
  if (!fecha || !evidencia) return { error: 'Indica la fecha y qué se hizo (evidencia de la implementación).' }

  const { data: previo } = await supabase.from('cambios').select('folio, titulo, estatus').eq('id', id).single()
  if (previo?.estatus !== 'aprobado') return { error: 'Solo se registra la implementación de cambios aprobados.' }

  const { error } = await supabase
    .from('cambios')
    .update({ fecha_implementacion: fecha, evidencia_implementacion: evidencia, estatus: 'implementado' })
    .eq('id', id)
  if (error) return { error: 'No se pudo guardar (solo el responsable o el coordinador pueden hacerlo).' }

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')
  await avisar(
    (coordinadores ?? []).map((c) => c.id as string).filter((c) => c !== quien.id),
    `El cambio ${previo?.folio} (${previo?.titulo}) ya se implementó. Falta verificar si funcionó.`,
    id
  )
  revalidatePath('/gestion-cambios')
  revalidatePath(`/gestion-cambios/${id}`)
  return { ok: true }
}

export async function cerrarCambio(id: string, _prev: EstadoCambio, fd: FormData): Promise<EstadoCambio> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') return { error: 'Solo el Coordinador del SGI verifica y cierra cambios.' }
  const supabase = await createClient()

  const verificacion = texto(fd, 'verificacion_post')
  const efectivo = texto(fd, 'cambio_efectivo')
  if (!verificacion) return { error: 'Anota cómo verificaste que el cambio funcionó.' }
  if (!['si', 'no'].includes(efectivo)) return { error: 'Indica si el cambio fue efectivo.' }

  const { error } = await supabase
    .from('cambios')
    .update({
      verificacion_post: verificacion,
      cambio_efectivo: efectivo === 'si',
      estatus: 'cerrado',
      fecha_cierre: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: 'No se pudo cerrar. ' + error.message }

  revalidatePath('/gestion-cambios')
  revalidatePath(`/gestion-cambios/${id}`)
  return { ok: true }
}
