'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export type EstadoProgramarAuditoria = { error?: string; ok?: boolean }

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
  const clienteNombre = String(formData.get('cliente_nombre') ?? '').trim()
  const nave = String(formData.get('nave') ?? '') || null
  const proceso = String(formData.get('proceso') ?? '')
  const auditorLiderId = String(formData.get('auditor_lider_id') ?? '') || null
  const auditorAuxiliarId = String(formData.get('auditor_auxiliar_id') ?? '') || null
  const observaciones = String(formData.get('observaciones') ?? '').trim()

  if (!fecha || !norma || !tipo || !proceso) {
    return { error: 'Completa todos los campos obligatorios.' }
  }
  if (tipo === 'cliente' && !clienteNombre) {
    return { error: 'Escribe el nombre del cliente.' }
  }

  const supabase = await createClient()

  const { data: nueva, error } = await supabase
    .from('auditorias')
    .insert({
      fecha,
      norma,
      tipo,
      cliente_nombre: tipo === 'cliente' ? clienteNombre : null,
      nave,
      proceso,
      auditor_lider_id: auditorLiderId,
      auditor_auxiliar_id: auditorAuxiliarId,
      observaciones: observaciones || null,
      estatus: 'programada',
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !nueva) {
    return { error: 'No se pudo programar la auditoría. ' + (error?.message ?? '') }
  }

  const involucrados = [auditorLiderId, auditorAuxiliarId].filter(
    (id): id is string => !!id
  )
  if (involucrados.length > 0) {
    await supabase.from('notificaciones').insert(
      involucrados.map((usuarioId) => ({
        usuario_id: usuarioId,
        tipo: 'auditoria' as const,
        mensaje: `Fuiste asignado a una auditoría programada para el ${new Date(
          fecha + 'T00:00:00'
        ).toLocaleDateString('es-MX')}.`,
        referencia_id: nueva.id,
      }))
    )
  }

  revalidatePath('/auditorias')
  return { ok: true }
}

export async function cancelarAuditoria(auditoriaId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()
  await supabase
    .from('auditorias')
    .update({ estatus: 'cancelada', actualizado_en: new Date().toISOString() })
    .eq('id', auditoriaId)

  revalidatePath('/auditorias')
}
