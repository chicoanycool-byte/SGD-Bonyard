'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (!['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)) throw new Error('No autorizado.')
  return quien
}

// ---------- Programa de mantenimiento preventivo ----------

export async function crearProgramaMantenimiento(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const equipo = String(formData.get('equipo') ?? '').trim()
  const actividad = String(formData.get('actividad') ?? '').trim()
  if (!equipo || !actividad) throw new Error('Faltan datos obligatorios.')

  await supabase.from('mantenimiento_programa').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    equipo,
    tipo_equipo: String(formData.get('tipo_equipo') ?? 'otro'),
    actividad,
    frecuencia: String(formData.get('frecuencia') ?? '').trim() || null,
    ultima_fecha: String(formData.get('ultima_fecha') ?? '') || null,
    proxima_fecha: String(formData.get('proxima_fecha') ?? '') || null,
    responsable_id: quien.id,
    creado_por: quien.id,
  })
  revalidatePath('/mantenimiento/programa')
}

export async function actualizarProximaFecha(id: string, ultimaFecha: string, proximaFecha: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase
    .from('mantenimiento_programa')
    .update({ ultima_fecha: ultimaFecha, proxima_fecha: proximaFecha, estatus: 'vigente' })
    .eq('id', id)
  revalidatePath('/mantenimiento/programa')
}

export async function eliminarProgramaMantenimiento(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('mantenimiento_programa').delete().eq('id', id)
  revalidatePath('/mantenimiento/programa')
}

// ---------- Órdenes de trabajo ----------

export async function crearOrdenMantenimiento(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const equipo = String(formData.get('equipo') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  if (!equipo || !descripcion) throw new Error('Faltan datos obligatorios.')

  await supabase.from('mantenimiento_ordenes').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    equipo,
    tipo: String(formData.get('tipo') ?? 'correctivo'),
    descripcion,
    prioridad: String(formData.get('prioridad') ?? 'media'),
    fecha_reporte: String(formData.get('fecha_reporte') ?? '') || new Date().toISOString().slice(0, 10),
    responsable_id: quien.id,
    creado_por: quien.id,
  })
  revalidatePath('/mantenimiento/ordenes')
}

export async function cerrarOrdenMantenimiento(formData: FormData) {
  await requerirGestion()
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const fechaCierre = String(formData.get('fecha_cierre') ?? '')
  if (!id || !fechaCierre) throw new Error('Falta la fecha de cierre.')

  await supabase
    .from('mantenimiento_ordenes')
    .update({
      fecha_cierre: fechaCierre,
      acciones: String(formData.get('acciones') ?? '').trim() || null,
      estatus: 'cerrada',
    })
    .eq('id', id)
  revalidatePath('/mantenimiento/ordenes')
}

export async function eliminarOrdenMantenimiento(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('mantenimiento_ordenes').delete().eq('id', id)
  revalidatePath('/mantenimiento/ordenes')
}
