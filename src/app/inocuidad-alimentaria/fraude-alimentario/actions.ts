'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

// ---------- FSG-33: Vulnerabilidad de procesos ----------

export async function crearFilaVulnerabilidad(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const nave = String(formData.get('nave') ?? '')
  const area = String(formData.get('area') ?? '').trim()
  const proceso = String(formData.get('proceso') ?? '').trim()
  if (!nave || !area || !proceso) throw new Error('Faltan datos.')

  const { count } = await supabase.from('fraude_vulnerabilidad_procesos').select('id', { count: 'exact', head: true }).eq('nave', nave)

  await supabase.from('fraude_vulnerabilidad_procesos').insert({
    nave, area, proceso,
    etapas_flujo: String(formData.get('etapas_flujo') ?? '').trim() || null,
    dilucion: String(formData.get('dilucion') ?? '').trim() || null,
    sustitucion: String(formData.get('sustitucion') ?? '').trim() || null,
    ocultamiento: String(formData.get('ocultamiento') ?? '').trim() || null,
    mejoras_no_aprobadas: String(formData.get('mejoras_no_aprobadas') ?? '').trim() || null,
    mercado_negro: String(formData.get('mercado_negro') ?? '').trim() || null,
    mal_etiquetado: String(formData.get('mal_etiquetado') ?? '').trim() || null,
    falsificacion: String(formData.get('falsificacion') ?? '').trim() || null,
    vulnerabilidad: formData.get('vulnerabilidad') ? Number(formData.get('vulnerabilidad')) : null,
    severidad: formData.get('severidad') ? Number(formData.get('severidad')) : null,
    probabilidad: formData.get('probabilidad') ? Number(formData.get('probabilidad')) : null,
    sumatoria: formData.get('sumatoria') ? Number(formData.get('sumatoria')) : null,
    nivel_riesgo: String(formData.get('nivel_riesgo') ?? '').trim() || null,
    medidas_control: String(formData.get('medidas_control') ?? '').trim() || null,
    orden: (count ?? 0) + 1,
  })
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

export async function eliminarFilaVulnerabilidad(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('fraude_vulnerabilidad_procesos').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

export async function actualizarEncabezadoVulnerabilidad(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const nave = String(formData.get('nave') ?? '')
  if (!nave) throw new Error('Falta la nave.')
  await supabase.from('fraude_vulnerabilidad_encabezado').upsert(
    {
      nave,
      fecha_realizacion: String(formData.get('fecha_realizacion') ?? '') || null,
      fecha_actualizacion: String(formData.get('fecha_actualizacion') ?? '') || null,
      participantes: String(formData.get('participantes') ?? '').trim() || null,
    },
    { onConflict: 'nave' }
  )
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

// ---------- FSG-32: Análisis de productos ----------

export async function crearAnalisisProductoFraude(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const producto = String(formData.get('producto') ?? '').trim()
  if (!producto) throw new Error('Escribe el nombre del producto.')

  const { count } = await supabase.from('fraude_analisis_productos').select('id', { count: 'exact', head: true })

  await supabase.from('fraude_analisis_productos').insert({
    producto,
    proveedor: String(formData.get('proveedor') ?? '').trim() || null,
    cliente: String(formData.get('cliente') ?? '').trim() || null,
    origen_materia_prima: String(formData.get('origen_materia_prima') ?? '').trim() || null,
    dilucion: String(formData.get('dilucion') ?? '').trim() || null,
    sustitucion: String(formData.get('sustitucion') ?? '').trim() || null,
    ocultamiento: String(formData.get('ocultamiento') ?? '').trim() || null,
    mejoras_no_aprobadas: String(formData.get('mejoras_no_aprobadas') ?? '').trim() || null,
    mercado_negro: String(formData.get('mercado_negro') ?? '').trim() || null,
    mal_etiquetado: String(formData.get('mal_etiquetado') ?? '').trim() || null,
    falsificacion: String(formData.get('falsificacion') ?? '').trim() || null,
    costo_disponibilidad: formData.get('costo_disponibilidad') ? Number(formData.get('costo_disponibilidad')) : null,
    pais_origen_distancia: formData.get('pais_origen_distancia') ? Number(formData.get('pais_origen_distancia')) : null,
    proveedor_certificado: formData.get('proveedor_certificado') ? Number(formData.get('proveedor_certificado')) : null,
    identidad_preservada: formData.get('identidad_preservada') ? Number(formData.get('identidad_preservada')) : null,
    severidad_fraude: formData.get('severidad_fraude') ? Number(formData.get('severidad_fraude')) : null,
    nivel_riesgo: formData.get('nivel_riesgo') ? Number(formData.get('nivel_riesgo')) : null,
    medida_control: String(formData.get('medida_control') ?? '').trim() || null,
    orden: (count ?? 0) + 1,
  })
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

export async function eliminarAnalisisProductoFraude(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('fraude_analisis_productos').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

// ---------- FSG-34: Plan de mitigación ----------

export async function crearMedidaMitigacion(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const tipoFraude = String(formData.get('tipo_fraude') ?? '').trim()
  if (!tipoFraude) throw new Error('Escribe el tipo de fraude.')

  const { count } = await supabase.from('fraude_plan_mitigacion').select('id', { count: 'exact', head: true })

  await supabase.from('fraude_plan_mitigacion').insert({
    tipo_fraude: tipoFraude,
    medida: String(formData.get('medida') ?? '').trim() || null,
    responsable: String(formData.get('responsable') ?? '').trim() || null,
    frecuencia: String(formData.get('frecuencia') ?? '').trim() || null,
    accion_correctiva: String(formData.get('accion_correctiva') ?? '').trim() || null,
    orden: (count ?? 0) + 1,
  })
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}

export async function eliminarMedidaMitigacion(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('fraude_plan_mitigacion').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria/fraude-alimentario')
}
