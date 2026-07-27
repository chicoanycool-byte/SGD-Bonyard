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
    nave: String(formData.get('nave') ?? 'Nave 1'),
    puesto: String(formData.get('puesto') ?? '').trim() || null,
    rol_equipo: String(formData.get('rol_equipo') ?? 'miembro'),
    medios_localizacion: String(formData.get('medios_localizacion') ?? '').trim() || null,
    escolaridad: String(formData.get('escolaridad') ?? '').trim() || null,
    conocimientos: String(formData.get('conocimientos') ?? '').trim() || null,
    experiencia: String(formData.get('experiencia') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/equipo')
}

export async function eliminarMiembroEquipo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_equipo').delete().eq('id', id)
  revalidatePath('/plan-haccp/equipo')
}

// ---------- Análisis de Procesos (FSG-49) ----------

export async function crearAnalisisProceso(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const etapa = String(formData.get('etapa_proceso') ?? '').trim()
  if (!etapa) throw new Error('Escribe la etapa del proceso.')
  await supabase.from('haccp_analisis_procesos').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    area: String(formData.get('area') ?? 'Almacén'),
    etapa_proceso: etapa,
    actividad: String(formData.get('actividad') ?? '').trim() || null,
    tipo_peligro: String(formData.get('tipo_peligro') ?? '').trim() || null,
    peligro: String(formData.get('peligro') ?? '').trim() || null,
    severidad: Number(formData.get('severidad')) || null,
    probabilidad: Number(formData.get('probabilidad')) || null,
    riesgo: (Number(formData.get('severidad')) || 0) * (Number(formData.get('probabilidad')) || 0) || null,
    nivel_riesgo: String(formData.get('nivel_riesgo') ?? '').trim() || null,
    justificacion: String(formData.get('justificacion') ?? '').trim() || null,
    nivel_aceptable: String(formData.get('nivel_aceptable') ?? '').trim() || null,
    medidas_control: String(formData.get('medidas_control') ?? '').trim() || null,
    pcc: String(formData.get('pcc') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/procesos')
}

export async function eliminarAnalisisProceso(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_analisis_procesos').delete().eq('id', id)
  revalidatePath('/plan-haccp/procesos')
}

// ---------- Análisis de Productos (FSG-50) ----------

export async function crearAnalisisProducto(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const categoria = String(formData.get('categoria') ?? '').trim()
  if (!categoria) throw new Error('Escribe la categoría.')
  await supabase.from('haccp_analisis_productos').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    categoria,
    producto: String(formData.get('producto') ?? '').trim() || null,
    utilizado_en: String(formData.get('utilizado_en') ?? '').trim() || null,
    tipo_peligro: String(formData.get('tipo_peligro') ?? '').trim() || null,
    peligro: String(formData.get('peligro') ?? '').trim() || null,
    severidad: Number(formData.get('severidad')) || null,
    probabilidad: Number(formData.get('probabilidad')) || null,
    riesgo: (Number(formData.get('severidad')) || 0) * (Number(formData.get('probabilidad')) || 0) || null,
    nivel_riesgo: String(formData.get('nivel_riesgo') ?? '').trim() || null,
    justificacion: String(formData.get('justificacion') ?? '').trim() || null,
    nivel_aceptable: String(formData.get('nivel_aceptable') ?? '').trim() || null,
    medidas_control: String(formData.get('medidas_control') ?? '').trim() || null,
    pcc: String(formData.get('pcc') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/productos')
}

export async function eliminarAnalisisProducto(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_analisis_productos').delete().eq('id', id)
  revalidatePath('/plan-haccp/productos')
}

// ---------- Plan HACCP (FSG-51) ----------

export async function crearPccPlan(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const descripcion = String(formData.get('descripcion_peligro') ?? '').trim()
  if (!descripcion) throw new Error('Escribe la descripción del peligro.')
  await supabase.from('haccp_plan').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    proceso: String(formData.get('proceso') ?? '').trim() || null,
    etapa_material: String(formData.get('etapa_material') ?? '').trim() || null,
    pcc: String(formData.get('pcc') ?? '').trim() || null,
    descripcion_peligro: descripcion,
    limites_criticos: String(formData.get('limites_criticos') ?? '').trim() || null,
    muestra: String(formData.get('muestra') ?? '').trim() || null,
    frecuencia: String(formData.get('frecuencia') ?? '').trim() || null,
    metodo_monitoreo: String(formData.get('metodo_monitoreo') ?? '').trim() || null,
    medidas_correctoras: String(formData.get('medidas_correctoras') ?? '').trim() || null,
    registros: String(formData.get('registros') ?? '').trim() || null,
    documentos_referencia: String(formData.get('documentos_referencia') ?? '').trim() || null,
    responsable_monitoreo: String(formData.get('responsable_monitoreo') ?? '').trim() || null,
    responsable_verificacion: String(formData.get('responsable_verificacion') ?? '').trim() || null,
  })
  revalidatePath('/plan-haccp/plan')
}

export async function eliminarPccPlan(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('haccp_plan').delete().eq('id', id)
  revalidatePath('/plan-haccp/plan')
}

export async function actualizarEncabezadoPlan(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const nave = String(formData.get('nave') ?? 'Nave 1')
  await supabase.from('haccp_plan_encabezado').upsert(
    {
      nave,
      participantes: String(formData.get('participantes') ?? '').trim() || null,
      fecha_actualizacion: String(formData.get('fecha_actualizacion') ?? '') || null,
      responsable_sgi: String(formData.get('responsable_sgi') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'nave' }
  )
  revalidatePath('/plan-haccp/plan')
}

// ---------- Diagramas de flujo (FSG-35 / FSG-36) ----------

export async function subirDiagrama(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const nave = String(formData.get('nave') ?? 'Nave 1')
  const area = String(formData.get('area') ?? 'Almacén')
  const archivo = formData.get('archivo') as File | null
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo.')

  const rutaStorage = `${nave.replace(/\s+/g, '_')}/${area.replace(/\s+/g, '_')}.pdf`
  const { error } = await supabase.storage
    .from('haccp')
    .upload(rutaStorage, archivo, { upsert: true, contentType: archivo.type || 'application/pdf' })
  if (error) throw new Error('No se pudo subir el archivo.')

  await supabase.from('haccp_diagramas').upsert(
    {
      nave,
      area,
      nombre_archivo: archivo.name,
      storage_path: rutaStorage,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'nave,area' }
  )
  void quien
  revalidatePath('/plan-haccp/diagramas')
}

export async function obtenerUrlDiagrama(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('haccp').createSignedUrl(storagePath, 60 * 5)
  if (error || !data) throw new Error('No se pudo generar el enlace.')
  return data.signedUrl
}
