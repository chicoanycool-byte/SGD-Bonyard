'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

// ---------- Equipo HACCP ----------

export async function crearMiembroEquipo(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) throw new Error('Escribe el nombre.')
  await supabase.from('haccp_equipo').insert({
    nombre,
    puesto: String(formData.get('puesto') ?? '').trim() || null,
    rol_equipo: String(formData.get('rol_equipo') ?? 'miembro'),
    area_especialidad: String(formData.get('area_especialidad') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/equipo')
}

export async function eliminarMiembroEquipo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_equipo').delete().eq('id', id)
  revalidatePath('/plan-haccp/equipo')
}

// ---------- Análisis de Procesos ----------

export async function crearAnalisisProceso(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const proceso = String(formData.get('proceso') ?? '').trim()
  if (!proceso) throw new Error('Escribe el proceso.')
  await supabase.from('haccp_analisis_procesos').insert({
    proceso,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    peligro_biologico: String(formData.get('peligro_biologico') ?? '').trim() || null,
    peligro_quimico: String(formData.get('peligro_quimico') ?? '').trim() || null,
    peligro_fisico: String(formData.get('peligro_fisico') ?? '').trim() || null,
    medidas_control: String(formData.get('medidas_control') ?? '').trim() || null,
    es_pcc: formData.get('es_pcc') === 'on',
    limite_critico: String(formData.get('limite_critico') ?? '').trim() || null,
    monitoreo: String(formData.get('monitoreo') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/procesos')
}

export async function eliminarAnalisisProceso(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_analisis_procesos').delete().eq('id', id)
  revalidatePath('/plan-haccp/procesos')
}

// ---------- Análisis de Productos ----------

export async function crearAnalisisProducto(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const categoria = String(formData.get('categoria_producto') ?? '').trim()
  if (!categoria) throw new Error('Escribe la categoría de producto.')
  await supabase.from('haccp_analisis_productos').insert({
    categoria_producto: categoria,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    uso_previsto: String(formData.get('uso_previsto') ?? '').trim() || null,
    consumidor: String(formData.get('consumidor') ?? '').trim() || null,
    alergenos: String(formData.get('alergenos') ?? '').trim() || null,
    condiciones_almacenamiento: String(formData.get('condiciones_almacenamiento') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/productos')
}

export async function eliminarAnalisisProducto(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_analisis_productos').delete().eq('id', id)
  revalidatePath('/plan-haccp/productos')
}

// ---------- Plan HACCP (documento consolidado) ----------

export async function actualizarPlanHaccp(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '')
  const datos = {
    alcance: String(formData.get('alcance') ?? '').trim() || null,
    resumen: String(formData.get('resumen') ?? '').trim() || null,
    fecha_elaboracion: String(formData.get('fecha_elaboracion') ?? '') || null,
    fecha_ultima_validacion: String(formData.get('fecha_ultima_validacion') ?? '') || null,
    responsable_id: quien.id,
    actualizado_en: new Date().toISOString(),
  }
  if (id) {
    await supabase.from('haccp_plan').update(datos).eq('id', id)
  } else {
    await supabase.from('haccp_plan').insert(datos)
  }
  revalidatePath('/plan-haccp/plan')
}
