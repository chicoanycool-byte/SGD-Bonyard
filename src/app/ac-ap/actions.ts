'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { revisarAccionCorrectiva, sugerirTipoNC, type RevisionAC } from '@/lib/anthropic'

const ROLES_PLAN = ['coordinador_sgi']

export async function subirEvidenciaAC(accionId: string, formData: FormData) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id')
    .eq('id', accionId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && accion?.responsable_id !== quien.id) {
    throw new Error('No autorizado.')
  }

  const archivos = formData.getAll('archivos') as File[]
  const validos = archivos.filter((a) => a && a.size > 0)
  if (validos.length === 0) throw new Error('Selecciona al menos un archivo.')

  const errores: string[] = []

  for (const archivo of validos) {
    const nombreArchivo = `${accionId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${archivo.name}`.replace(/\s+/g, '_')
    const buffer = Buffer.from(await archivo.arrayBuffer())
    const { data: subida, error } = await supabase.storage
      .from('ac-evidencias')
      .upload(nombreArchivo, buffer, { contentType: archivo.type })

    if (error || !subida) {
      errores.push(archivo.name)
      continue
    }

    await supabase.from('ac_evidencias').insert({
      accion_id: accionId,
      nombre_archivo: archivo.name,
      storage_path: subida.path,
      tipo: archivo.type,
      subido_por: quien.id,
    })
  }

  revalidatePath(`/ac-ap/${accionId}`)

  if (errores.length > 0) {
    throw new Error(`No se pudieron subir: ${errores.join(', ')}`)
  }
}

export async function obtenerUrlEvidenciaAC(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data } = await supabase.storage.from('ac-evidencias').createSignedUrl(storagePath, 300)
  return data?.signedUrl ?? null
}

export async function eliminarEvidenciaAC(evidenciaId: string, accionId: string, storagePath: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  await supabase.storage.from('ac-evidencias').remove([storagePath])
  await supabase.from('ac_evidencias').delete().eq('id', evidenciaId)
  void quien
  revalidatePath(`/ac-ap/${accionId}`)
}

export type EstadoAccionManual = { error?: string; accionId?: string }

export async function crearAccionManual(
  _prevState: EstadoAccionManual,
  formData: FormData
): Promise<EstadoAccionManual> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') return { error: 'No autorizado.' }

  const tipoAccion = String(formData.get('tipo_accion') ?? 'correctiva')
  const cliente = String(formData.get('cliente') ?? '').trim()
  const servicio = String(formData.get('servicio') ?? '').trim()
  const tipoNc = String(formData.get('tipo_nc') ?? '') || null
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const responsableId = String(formData.get('responsable_id') ?? '') || null
  const fechaCompromiso = String(formData.get('fecha_compromiso') ?? '') || null

  if (!descripcion) {
    return { error: 'La descripción es obligatoria.' }
  }

  const descripcionCompleta =
    (cliente ? `Cliente: ${cliente}. ` : '') +
    (servicio ? `Servicio: ${servicio}. ` : '') +
    descripcion

  const supabase = await createClient()
  const { data: accion, error } = await supabase
    .from('acciones_correctivas')
    .insert({
      origen: 'manual',
      tipo_accion: tipoAccion,
      descripcion: descripcionCompleta,
      tipo_nc: tipoNc,
      responsable_id: responsableId,
      fecha_compromiso: fechaCompromiso,
      estatus: responsableId ? 'en_proceso' : 'abierta',
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !accion) {
    return { error: 'No se pudo crear la acción. ' + (error?.message ?? '') }
  }

  if (responsableId) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', responsableId)
      .single()

    await supabase.from('notificaciones').insert({
      usuario_id: responsableId,
      tipo: 'ac_ap',
      mensaje: `Se te asignó una acción ${tipoAccion}: ${descripcionCompleta}`,
      referencia_id: accion.id,
    })
    await supabase.from('pendientes').insert({
      usuario_id: responsableId,
      modulo: 'ac_ap',
      referencia_id: accion.id,
      descripcion: `Acción ${tipoAccion}: ${descripcionCompleta}`,
      fecha_limite: fechaCompromiso,
    })
    if (usuario?.correo) {
      await enviarCorreo(
        [usuario.correo],
        'Nueva acción correctiva/preventiva asignada — SGD Bonyard',
        `<p>Se te asignó una acción ${tipoAccion}: ${descripcionCompleta}</p>`
      )
    }
  }

  revalidatePath('/ac-ap')
  return { accionId: accion.id }
}

export async function guardarDefinicionProblema(accionId: string, formData: FormData) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id')
    .eq('id', accionId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && accion?.responsable_id !== quien.id) {
    throw new Error('No autorizado.')
  }

  await supabase
    .from('acciones_correctivas')
    .update({
      definicion_problema: String(formData.get('definicion_problema') ?? '').trim() || null,
      equipo_lider: String(formData.get('equipo_lider') ?? '').trim() || null,
      equipo_miembros: String(formData.get('equipo_miembros') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', accionId)

  revalidatePath(`/ac-ap/${accionId}`)
}

export async function guardarMedidasContencion(accionId: string, medidas: unknown) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id')
    .eq('id', accionId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && accion?.responsable_id !== quien.id) {
    throw new Error('No autorizado.')
  }

  await supabase
    .from('acciones_correctivas')
    .update({ medidas_contencion: medidas, actualizado_en: new Date().toISOString() })
    .eq('id', accionId)

  revalidatePath(`/ac-ap/${accionId}`)
}

export async function guardarAnalisisCausas(
  accionId: string,
  analisis: unknown,
  causaRaiz: string
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id')
    .eq('id', accionId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && accion?.responsable_id !== quien.id) {
    throw new Error('No autorizado.')
  }

  await supabase
    .from('acciones_correctivas')
    .update({
      analisis_causas: analisis,
      causa_raiz: causaRaiz || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', accionId)

  revalidatePath(`/ac-ap/${accionId}`)
}

export async function guardarPlanTrabajo(accionId: string, plan: unknown) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id')
    .eq('id', accionId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && accion?.responsable_id !== quien.id) {
    throw new Error('No autorizado.')
  }

  await supabase
    .from('acciones_correctivas')
    .update({ plan_trabajo: plan, actualizado_en: new Date().toISOString() })
    .eq('id', accionId)

  revalidatePath(`/ac-ap/${accionId}`)
}

export async function editarDatosBasicosAC(
  accionId: string,
  campos: {
    tipo_nc?: string | null
    responsable_id?: string | null
    fecha_compromiso?: string | null
  }
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('acciones_correctivas')
    .update({ ...campos, actualizado_en: new Date().toISOString() })
    .eq('id', accionId)

  revalidatePath(`/ac-ap/${accionId}`)
  revalidatePath('/ac-ap')
}

export async function sugerirTipoNcAccion(accionId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('descripcion')
    .eq('id', accionId)
    .single()

  if (!accion) return null
  return await sugerirTipoNC(accion.descripcion)
}

export async function revisarConIA(accionId: string): Promise<RevisionAC | null> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('descripcion, definicion_problema, causa_raiz, medidas_contencion, plan_trabajo, evidencia_cierre')
    .eq('id', accionId)
    .single()

  if (!accion) return null

  type Medida = { accion: string; responsable: string; fecha: string; seguimiento: string }
  type PlanItem = { actividad: string; resultado_esperado: string; verificacion_eficacia: string }

  const medidas = (accion.medidas_contencion ?? []) as Medida[]
  const plan = (accion.plan_trabajo ?? []) as PlanItem[]

  return await revisarAccionCorrectiva({
    descripcion: accion.descripcion,
    definicionProblema: accion.definicion_problema,
    causaRaiz: accion.causa_raiz,
    medidasContencion: medidas.map((m) => `${m.accion} (${m.responsable}, ${m.fecha})`).join('; '),
    planTrabajo: plan.map((p) => `${p.actividad} → ${p.resultado_esperado}`).join('; '),
    evidenciaCierre: accion.evidencia_cierre,
  })
}

export async function armarPlanReaccion(accionId: string, formData: FormData) {
  const quien = await requerirUsuario()
  if (!ROLES_PLAN.includes(quien.rol)) {
    throw new Error('No autorizado.')
  }

  const responsableId = String(formData.get('responsable_id') ?? '')
  const fechaCompromiso = String(formData.get('fecha_compromiso') ?? '')
  const tipoAccion = String(formData.get('tipo_accion') ?? 'correctiva')

  if (!responsableId || !fechaCompromiso) {
    throw new Error('Responsable y fecha compromiso son obligatorios.')
  }

  const supabase = await createClient()

  await supabase
    .from('acciones_correctivas')
    .update({
      responsable_id: responsableId,
      fecha_compromiso: fechaCompromiso,
      tipo_accion: tipoAccion,
      estatus: 'en_proceso',
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', accionId)

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('descripcion')
    .eq('id', accionId)
    .single()

  await supabase.from('notificaciones').insert({
    usuario_id: responsableId,
    tipo: 'ac_ap',
    mensaje: `Se te asignó una acción correctiva: ${accion?.descripcion ?? ''}`,
    referencia_id: accionId,
  })
  await supabase.from('pendientes').insert({
    usuario_id: responsableId,
    modulo: 'ac_ap',
    referencia_id: accionId,
    descripcion: `Acción correctiva: ${accion?.descripcion ?? ''}`,
    fecha_limite: fechaCompromiso,
  })

  const { data: responsable } = await supabase
    .from('usuarios')
    .select('correo')
    .eq('id', responsableId)
    .single()

  if (responsable?.correo) {
    await enviarCorreo(
      [responsable.correo],
      'Nueva acción correctiva asignada — SGD Bonyard',
      `<p>Se te asignó la acción correctiva: <strong>${accion?.descripcion ?? ''}</strong></p><p>Fecha compromiso: ${fechaCompromiso}</p>`
    )
  }

  revalidatePath(`/ac-ap/${accionId}`)
  revalidatePath('/ac-ap')
}

export async function marcarResuelta(accionId: string, evidenciaCierre: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id, descripcion')
    .eq('id', accionId)
    .single()

  if (accion?.responsable_id !== quien.id && quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  if (!evidenciaCierre.trim()) {
    throw new Error('Describe la evidencia de cierre.')
  }

  await supabase
    .from('acciones_correctivas')
    .update({
      estatus: 'en_validacion',
      evidencia_cierre: evidenciaCierre,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', accionId)

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id, correo')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')

  if (coordinadores && coordinadores.length > 0) {
    const mensaje = `${quien.nombre} marcó como resuelta la acción: ${accion?.descripcion ?? ''}. Requiere tu validación.`
    await supabase.from('notificaciones').insert(
      coordinadores.map((c) => ({
        usuario_id: c.id,
        tipo: 'ac_ap' as const,
        mensaje,
        referencia_id: accionId,
      }))
    )
    await supabase.from('pendientes').insert(
      coordinadores.map((c) => ({
        usuario_id: c.id,
        modulo: 'ac_ap',
        referencia_id: accionId,
        descripcion: mensaje,
      }))
    )
    await enviarCorreo(
      coordinadores.map((c) => c.correo),
      'Acción correctiva lista para validar — SGD Bonyard',
      `<p>${mensaje}</p>`
    )
  }

  revalidatePath(`/ac-ap/${accionId}`)
  revalidatePath('/ac-ap')
}

export async function validarCierre(
  accionId: string,
  aprobar: boolean,
  comentario: string
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }

  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select('responsable_id, descripcion')
    .eq('id', accionId)
    .single()

  await supabase
    .from('acciones_correctivas')
    .update({
      estatus: aprobar ? 'cerrada' : 'en_proceso',
      comentario_validacion: comentario || null,
      fecha_cierre: aprobar ? new Date().toISOString() : null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', accionId)

  if (accion?.responsable_id) {
    const mensaje = aprobar
      ? `Tu acción correctiva "${accion.descripcion}" fue validada y cerrada.`
      : `Tu acción correctiva "${accion.descripcion}" fue rechazada${comentario ? ': ' + comentario : '.'} Requiere más evidencia.`

    await supabase.from('notificaciones').insert({
      usuario_id: accion.responsable_id,
      tipo: 'ac_ap',
      mensaje,
      referencia_id: accionId,
    })

    const { data: responsable } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', accion.responsable_id)
      .single()

    if (responsable?.correo) {
      await enviarCorreo(
        [responsable.correo],
        aprobar ? 'Acción correctiva cerrada — SGD Bonyard' : 'Acción correctiva rechazada — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', accionId)
    .eq('modulo', 'ac_ap')

  revalidatePath(`/ac-ap/${accionId}`)
  revalidatePath('/ac-ap')
}

