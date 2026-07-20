'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

export type EstadoProgramarAuditoria = {
  error?: string
  ok?: boolean
}

export async function programarAuditoria(
  _prevState: EstadoProgramarAuditoria,
  formData: FormData
): Promise<EstadoProgramarAuditoria> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    return { error: 'No autorizado.' }
  }

  const fecha = String(formData.get('fecha') ?? '')
  const norma = String(formData.get('norma') ?? '')
  const tipo = String(formData.get('tipo') ?? '')
  const proceso = String(formData.get('proceso') ?? '').trim()
  const clienteNombre = String(formData.get('cliente_nombre') ?? '').trim()
  const nave = String(formData.get('nave') ?? '').trim()
  const auditorLiderId = String(formData.get('auditor_lider_id') ?? '') || null
  const auditorAuxiliarId = String(formData.get('auditor_auxiliar_id') ?? '') || null
  const auditadoId = String(formData.get('auditado_id') ?? '') || null
  const puestoAuditado = String(formData.get('puesto_auditado') ?? '').trim()
  const observaciones = String(formData.get('observaciones') ?? '').trim()

  if (!fecha || !norma || !tipo) {
    return { error: 'Fecha, norma y tipo son obligatorios.' }
  }
  if (tipo === 'cliente' && !clienteNombre) {
    return { error: 'Indica el nombre del cliente para auditorías tipo Cliente.' }
  }

  const supabase = await createClient()

  const { data: auditoria, error } = await supabase
    .from('auditorias')
    .insert({
      fecha,
      norma,
      tipo,
      proceso: proceso || null,
      cliente_nombre: tipo === 'cliente' ? clienteNombre : null,
      nave: nave || null,
      auditor_lider_id: auditorLiderId,
      auditor_auxiliar_id: auditorAuxiliarId,
      auditado_id: auditadoId,
      puesto_auditado: puestoAuditado || null,
      observaciones: observaciones || null,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !auditoria) {
    return { error: 'No se pudo programar la auditoría. ' + (error?.message ?? '') }
  }

  // Notifica a todos los usuarios activos (auditor líder, auxiliar y auditado si aplica)
  const involucrados = [auditorLiderId, auditorAuxiliarId, auditadoId].filter(
    (id): id is string => !!id
  )

  if (involucrados.length > 0) {
    const mensaje = `Se programó una auditoría ${
      norma === 'iso_9001' ? 'ISO 9001' : norma === 'sqf' ? 'SQF' : 'ISO 9001 + SQF'
    } para el ${fecha}.`

    await supabase.from('notificaciones').insert(
      involucrados.map((id) => ({
        usuario_id: id,
        tipo: 'auditoria' as const,
        mensaje,
        referencia_id: auditoria.id,
      }))
    )
    await supabase.from('pendientes').insert(
      involucrados.map((id) => ({
        usuario_id: id,
        modulo: 'auditorias',
        referencia_id: auditoria.id,
        descripcion: mensaje,
        fecha_limite: fecha,
      }))
    )

    const { data: usuariosInvolucrados } = await supabase
      .from('usuarios')
      .select('correo')
      .in('id', involucrados)

    if (usuariosInvolucrados && usuariosInvolucrados.length > 0) {
      await enviarCorreo(
        usuariosInvolucrados.map((u) => u.correo),
        'Auditoría programada — SGD Bonyard',
        `<p>${mensaje}</p><p>Consulta el detalle en el módulo Auditorías del SGD Bonyard.</p>`
      )
    }
  }

  revalidatePath('/auditorias')
  return { ok: true }
}

export async function cancelarAuditoria(id: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()
  await supabase
    .from('auditorias')
    .update({ estatus: 'cancelada', actualizado_en: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/auditorias')
}
