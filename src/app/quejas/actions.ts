'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { clasificarQueja } from '@/lib/anthropic'

const ROLES_GESTION = ['coordinador_sgi']

export type EstadoQueja = {
  error?: string
  ok?: boolean
}

function fechaLimiteHabil(dias: number) {
  const fecha = new Date()
  let agregados = 0
  while (agregados < dias) {
    fecha.setDate(fecha.getDate() + 1)
    const diaSemana = fecha.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) agregados++
  }
  return fecha.toISOString().slice(0, 10)
}

export async function sugerirCriticidadYAc(
  descripcion: string,
  tipoQueja: string,
  servicio: string
) {
  await requerirUsuario()
  if (!descripcion.trim() || !tipoQueja || !servicio) {
    throw new Error('Completa descripción, tipo de queja y servicio primero.')
  }
  return await clasificarQueja(descripcion, tipoQueja, servicio)
}

export async function registrarQueja(
  _prevState: EstadoQueja,
  formData: FormData
): Promise<EstadoQueja> {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) {
    return { error: 'No autorizado.' }
  }

  const nombreCliente = String(formData.get('nombre_cliente') ?? '').trim()
  const correoCliente = String(formData.get('correo_cliente') ?? '').trim()
  const tipoQueja = String(formData.get('tipo_queja') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '')
  const criticidad = String(formData.get('criticidad') ?? '')
  const servicio = String(formData.get('servicio') ?? '')
  const responsableId = String(formData.get('usuario_responsable_id') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()

  if (!nombreCliente || !tipoQueja || !tipo || !criticidad || !servicio || !responsableId || !descripcion) {
    return { error: 'Completa todos los campos.' }
  }

  const supabase = await createClient()

  const clasificacion = await clasificarQueja(descripcion, tipoQueja, servicio)
  const escalaAc = clasificacion?.escala_ac ?? false

  const { data: queja, error } = await supabase
    .from('quejas')
    .insert({
      nombre_cliente: nombreCliente,
      correo_cliente: correoCliente || null,
      tipo_queja: tipoQueja,
      tipo,
      criticidad,
      servicio,
      descripcion,
      usuario_responsable_id: responsableId,
      escalada_ac: escalaAc,
      justificacion_ia: clasificacion?.justificacion ?? null,
      estatus: 'en_atencion',
      fecha_limite: fechaLimiteHabil(5),
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !queja) {
    return { error: 'No se pudo registrar la queja. ' + (error?.message ?? '') }
  }

  if (escalaAc) {
    const { data: accion } = await supabase
      .from('acciones_correctivas')
      .insert({
        origen: 'queja',
        origen_id: queja.id,
        descripcion: `Queja de ${nombreCliente} (${servicio}): ${descripcion}`,
        estatus: 'abierta',
        creado_por: quien.id,
      })
      .select('id')
      .single()

    if (accion) {
      await supabase.from('quejas').update({ accion_correctiva_id: accion.id }).eq('id', queja.id)
    }
  }

  await supabase.from('notificaciones').insert({
    usuario_id: responsableId,
    tipo: 'queja',
    mensaje: `Se te asignó la queja de ${nombreCliente} (${servicio}).${escalaAc ? ' Escaló a Acción Correctiva.' : ''}`,
    referencia_id: queja.id,
  })
  await supabase.from('pendientes').insert({
    usuario_id: responsableId,
    modulo: 'quejas',
    referencia_id: queja.id,
    descripcion: `Atender queja de ${nombreCliente} (${servicio})`,
    fecha_limite: fechaLimiteHabil(5),
  })

  const { data: responsable } = await supabase
    .from('usuarios')
    .select('correo')
    .eq('id', responsableId)
    .single()

  if (responsable?.correo) {
    await enviarCorreo(
      [responsable.correo],
      'Nueva queja asignada — SGD Bonyard',
      `<p>Se te asignó la queja de <strong>${nombreCliente}</strong>${correoCliente ? ' (' + correoCliente + ')' : ''} — ${tipoQueja} (${servicio}).</p><p>${descripcion}</p>${escalaAc ? '<p><strong>Esta queja escaló a Acción Correctiva.</strong></p>' : ''}<p>Fecha límite de atención: ${fechaLimiteHabil(5)}</p>`
    )
  }

  revalidatePath('/quejas')
  return { ok: true }
}

export async function marcarQuejaResuelta(
  quejaId: string,
  evidencia: string,
  correccion: string,
  respuestaCliente: string
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: queja } = await supabase
    .from('quejas')
    .select('usuario_responsable_id, nombre_cliente')
    .eq('id', quejaId)
    .single()

  if (queja?.usuario_responsable_id !== quien.id && quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  if (!evidencia.trim()) {
    throw new Error('Describe cómo se resolvió la queja.')
  }

  await supabase
    .from('quejas')
    .update({
      estatus: 'en_validacion',
      evidencia_cierre: evidencia,
      correccion: correccion || null,
      respuesta_cliente: respuestaCliente || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', quejaId)

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id, correo')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')

  if (coordinadores && coordinadores.length > 0) {
    const mensaje = `La queja de ${queja?.nombre_cliente ?? ''} está lista para validar cierre.`
    await supabase.from('notificaciones').insert(
      coordinadores.map((c) => ({
        usuario_id: c.id,
        tipo: 'queja' as const,
        mensaje,
        referencia_id: quejaId,
      }))
    )
    await enviarCorreo(
      coordinadores.map((c) => c.correo),
      'Queja lista para validar — SGD Bonyard',
      `<p>${mensaje}</p>`
    )
  }

  revalidatePath('/quejas')
}

export async function validarCierreQueja(
  quejaId: string,
  aprobar: boolean,
  comentario: string
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()

  const { data: queja } = await supabase
    .from('quejas')
    .select('usuario_responsable_id, nombre_cliente')
    .eq('id', quejaId)
    .single()

  await supabase
    .from('quejas')
    .update({
      estatus: aprobar ? 'cerrada' : 'en_atencion',
      comentario_validacion: comentario || null,
      fecha_cierre: aprobar ? new Date().toISOString() : null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', quejaId)

  if (queja?.usuario_responsable_id) {
    await supabase.from('notificaciones').insert({
      usuario_id: queja.usuario_responsable_id,
      tipo: 'queja',
      mensaje: aprobar
        ? `La queja de ${queja.nombre_cliente} fue cerrada.`
        : `La queja de ${queja.nombre_cliente} fue rechazada${comentario ? ': ' + comentario : '.'}`,
      referencia_id: quejaId,
    })
  }

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', quejaId)
    .eq('modulo', 'quejas')

  revalidatePath('/quejas')
}
