'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

const ROLES_GESTION = ['coordinador_sgi']

export async function actualizarMiAcuerdo(
  reunionId: string,
  ruta: string,
  indice: number,
  nuevoEstatus: 'abierto' | 'cerrado'
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: reunion } = await supabase
    .from('reuniones_sgi')
    .select('acuerdos')
    .eq('id', reunionId)
    .single()

  const acuerdos = (reunion?.acuerdos ?? []) as Acuerdo[]
  if (!acuerdos[indice] || acuerdos[indice].responsable_id !== quien.id) {
    throw new Error('Solo puedes actualizar los acuerdos que tienes asignados.')
  }

  acuerdos[indice] = { ...acuerdos[indice], estatus: nuevoEstatus }

  await supabase
    .from('reuniones_sgi')
    .update({ acuerdos, actualizado_en: new Date().toISOString() })
    .eq('id', reunionId)

  revalidatePath(`${ruta}/${reunionId}`)
}

export type EstadoReunion = { error?: string; reunionId?: string }

export type Acuerdo = {
  acuerdo: string
  responsable_id: string
  responsable_nombre: string
  fecha_compromiso: string
  estatus: 'abierto' | 'cerrado'
}

async function notificarInvitados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invitados: string[],
  mensaje: string,
  reunionId: string,
  fechaLimite: string | null
) {
  if (invitados.length === 0) return

  await supabase.from('notificaciones').insert(
    invitados.map((id) => ({
      usuario_id: id,
      tipo: 'sistema' as const,
      mensaje,
      referencia_id: reunionId,
    }))
  )
  await supabase.from('pendientes').insert(
    invitados.map((id) => ({
      usuario_id: id,
      modulo: 'reuniones',
      referencia_id: reunionId,
      descripcion: mensaje,
      fecha_limite: fechaLimite,
    }))
  )

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('correo')
    .in('id', invitados)

  const correos = (usuarios ?? []).map((u) => u.correo).filter(Boolean)
  if (correos.length > 0) {
    await enviarCorreo(correos, 'Nueva reunión SGI programada — SGD Bonyard', `<p>${mensaje}</p>`)
  }
}

export async function crearReunion(
  tipo: string,
  ruta: string,
  _prevState: EstadoReunion,
  formData: FormData
): Promise<EstadoReunion> {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) return { error: 'No autorizado.' }

  const fecha = String(formData.get('fecha') ?? '')
  const hora = String(formData.get('hora') ?? '') || null
  const lugar = String(formData.get('lugar') ?? '').trim()
  const linkVirtual = String(formData.get('link_virtual') ?? '').trim()
  const agenda = String(formData.get('agenda') ?? '').trim()
  const invitados = formData.getAll('invitados') as string[]

  if (!fecha) return { error: 'La fecha es obligatoria.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reuniones_sgi')
    .insert({
      tipo,
      fecha,
      hora,
      lugar: lugar || null,
      link_virtual: linkVirtual || null,
      agenda: agenda || null,
      invitados,
      convocante_id: quien.id,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !data) return { error: 'No se pudo crear la reunión. ' + (error?.message ?? '') }

  const mensaje = `Fuiste convocado a una reunión SGI el ${fecha}${hora ? ' a las ' + hora : ''}${lugar ? ' en ' + lugar : ''}.${linkVirtual ? ' Liga: ' + linkVirtual : ''}`
  await notificarInvitados(supabase, invitados, mensaje, data.id, fecha)

  revalidatePath(ruta)
  return { reunionId: data.id }
}

export async function editarReunion(
  reunionId: string,
  ruta: string,
  campos: {
    fecha: string
    hora: string | null
    lugar: string | null
    link_virtual: string | null
    agenda: string | null
    invitados: string[]
  }
) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()

  const { data: anterior } = await supabase
    .from('reuniones_sgi')
    .select('invitados')
    .eq('id', reunionId)
    .single()

  await supabase
    .from('reuniones_sgi')
    .update({ ...campos, actualizado_en: new Date().toISOString() })
    .eq('id', reunionId)

  // Notifica solo a los invitados nuevos que no estaban antes
  const invitadosAnteriores = new Set((anterior?.invitados ?? []) as string[])
  const nuevos = campos.invitados.filter((id) => !invitadosAnteriores.has(id))
  if (nuevos.length > 0) {
    const mensaje = `Fuiste convocado a una reunión SGI el ${campos.fecha}${campos.hora ? ' a las ' + campos.hora : ''}${campos.lugar ? ' en ' + campos.lugar : ''}.${campos.link_virtual ? ' Liga: ' + campos.link_virtual : ''}`
    await notificarInvitados(supabase, nuevos, mensaje, reunionId, campos.fecha)
  }

  revalidatePath(ruta)
  revalidatePath(`${ruta}/${reunionId}`)
}

export async function guardarDesarrolloReunion(
  reunionId: string,
  ruta: string,
  formData: FormData
) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('reuniones_sgi')
    .update({
      asistentes: String(formData.get('asistentes') ?? '').trim() || null,
      desarrollo: String(formData.get('desarrollo') ?? '').trim() || null,
      conclusiones: String(formData.get('conclusiones') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', reunionId)

  revalidatePath(ruta)
}

export async function guardarAcuerdos(reunionId: string, ruta: string, acuerdos: Acuerdo[]) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('reuniones_sgi')
    .update({ acuerdos, actualizado_en: new Date().toISOString() })
    .eq('id', reunionId)

  revalidatePath(ruta)
}

export async function cerrarReunion(reunionId: string, ruta: string) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()

  const { data: reunion } = await supabase
    .from('reuniones_sgi')
    .select('acuerdos, tipo, fecha')
    .eq('id', reunionId)
    .single()

  await supabase
    .from('reuniones_sgi')
    .update({ estatus: 'realizada', actualizado_en: new Date().toISOString() })
    .eq('id', reunionId)

  const acuerdos = (reunion?.acuerdos ?? []) as Acuerdo[]

  for (const a of acuerdos) {
    if (!a.responsable_id || !a.acuerdo) continue

    const mensaje = `Acuerdo de reunión (${reunion?.fecha}): ${a.acuerdo}`
    await supabase.from('notificaciones').insert({
      usuario_id: a.responsable_id,
      tipo: 'sistema',
      mensaje,
      referencia_id: reunionId,
    })
    await supabase.from('pendientes').insert({
      usuario_id: a.responsable_id,
      modulo: 'reuniones',
      referencia_id: reunionId,
      descripcion: mensaje,
      fecha_limite: a.fecha_compromiso || null,
    })

    const { data: correoUsuario } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', a.responsable_id)
      .single()
    if (correoUsuario?.correo) {
      await enviarCorreo(
        [correoUsuario.correo],
        'Nuevo acuerdo de reunión — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  revalidatePath(ruta)
}
