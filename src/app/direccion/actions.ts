'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

// ---------- 4.1 Contexto (FODA) ----------

export async function crearFoda(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const categoria = String(formData.get('categoria') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const consecuencia = String(formData.get('consecuencia') ?? '').trim()
  const clasificacion = String(formData.get('clasificacion') ?? '') || null
  if (!descripcion) throw new Error('Escribe una descripción.')
  await supabase.from('contexto_foda').insert({
    categoria,
    descripcion,
    consecuencia: consecuencia || null,
    clasificacion,
  })
  revalidatePath('/direccion/contexto')
}

export async function eliminarFoda(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('contexto_foda').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

// ---------- 4.2 Partes interesadas ----------

export async function crearParteInteresada(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) throw new Error('Escribe el nombre de la parte interesada.')
  await supabase.from('partes_interesadas').insert({ nombre })
  revalidatePath('/direccion/contexto')
}

export async function crearRequisitoParte(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const parteId = String(formData.get('parte_id') ?? '')
  const requisito = String(formData.get('requisito') ?? '').trim()
  const documento = String(formData.get('documento_referencia') ?? '').trim()
  const riesgoTxt = String(formData.get('riesgo_oportunidad_texto') ?? '').trim()
  const clasificacion = String(formData.get('clasificacion') ?? '') || null
  if (!parteId) throw new Error('Selecciona una parte interesada.')
  await supabase.from('partes_interesadas_requisitos').insert({
    parte_id: parteId,
    requisito: requisito || null,
    documento_referencia: documento || null,
    riesgo_oportunidad_texto: riesgoTxt || null,
    clasificacion,
  })
  revalidatePath('/direccion/contexto')
}

export async function eliminarRequisitoParte(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('partes_interesadas_requisitos').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

// ---------- 4.4 Procesos del SGI ----------

export async function crearProceso(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const proceso = String(formData.get('proceso') ?? '').trim()
  const tipo = String(formData.get('tipo') ?? '')
  const proposito = String(formData.get('proposito') ?? '').trim()
  const entradas = String(formData.get('entradas') ?? '').trim()
  const salidas = String(formData.get('salidas') ?? '').trim()
  const recursos = String(formData.get('recursos') ?? '').trim()
  const documentos = String(formData.get('documentos') ?? '').trim()
  if (!proceso) throw new Error('Escribe el nombre del proceso.')
  await supabase.from('procesos_sgi').insert({
    proceso,
    tipo: tipo || null,
    proposito: proposito || null,
    entradas: entradas || null,
    salidas: salidas || null,
    recursos: recursos || null,
    documentos: documentos || null,
  })
  revalidatePath('/direccion/contexto')
}

export async function eliminarProceso(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('procesos_sgi').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

// ---------- 4.3 Alcance ----------

export async function actualizarAlcance(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '')
  const servicios = String(formData.get('servicios') ?? '').trim()
  if (id) {
    await supabase
      .from('alcance_sgi')
      .update({ servicios, actualizado_en: new Date().toISOString() })
      .eq('id', id)
  } else {
    await supabase.from('alcance_sgi').insert({ servicios, ubicaciones: [] })
  }
  revalidatePath('/direccion/contexto')
}

export async function crearExclusion(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const requisito = String(formData.get('requisito') ?? '').trim()
  const justificacion = String(formData.get('justificacion') ?? '').trim()
  if (!requisito) throw new Error('Escribe el requisito excluido.')
  await supabase.from('alcance_exclusiones').insert({ requisito, justificacion: justificacion || null })
  revalidatePath('/direccion/contexto')
}

export async function eliminarExclusion(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('alcance_exclusiones').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

// ---------- Objetivos de calidad ----------

export async function crearObjetivo(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const periodo = String(formData.get('periodo') ?? '').trim()
  const liderEquipo = String(formData.get('lider_equipo') ?? '').trim()
  const fechaCumplimiento = String(formData.get('fecha_cumplimiento') ?? '') || null
  const metricoIndicador = String(formData.get('metrico_indicador') ?? '').trim()
  const indicadorId = String(formData.get('indicador_id') ?? '') || null
  const responsableId = String(formData.get('responsable_id') ?? '') || null
  if (!descripcion) throw new Error('Escribe el objetivo.')
  await supabase.from('objetivos_calidad').insert({
    descripcion,
    periodo: periodo || null,
    lider_equipo: liderEquipo || null,
    fecha_cumplimiento: fechaCumplimiento,
    metrico_indicador: metricoIndicador || null,
    indicador_id: indicadorId,
    responsable_id: responsableId,
    creado_por: quien.id,
  })
  revalidatePath('/direccion/objetivos')
}

export async function actualizarEstatusObjetivo(id: string, estatus: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase
    .from('objetivos_calidad')
    .update({ estatus, actualizado_en: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/direccion/objetivos')
}

export async function eliminarObjetivo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('objetivos_calidad').delete().eq('id', id)
  revalidatePath('/direccion/objetivos')
}

export async function crearActividadObjetivo(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()
  const objetivoId = String(formData.get('objetivo_id') ?? '')
  const actividad = String(formData.get('actividad') ?? '').trim()
  if (!objetivoId || !actividad) throw new Error('Faltan datos.')
  await supabase.from('objetivo_actividades').insert({
    objetivo_id: objetivoId,
    actividad,
    fecha_programada: String(formData.get('fecha_programada') ?? '').trim() || null,
    fecha_real: String(formData.get('fecha_real') ?? '').trim() || null,
    responsable: String(formData.get('responsable') ?? '').trim() || null,
    recursos: String(formData.get('recursos') ?? '').trim() || null,
    inversion: String(formData.get('inversion') ?? '').trim() || null,
    seguimiento: String(formData.get('seguimiento') ?? '').trim() || null,
  })
  revalidatePath('/direccion/objetivos')
}

export async function eliminarActividadObjetivo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('objetivo_actividades').delete().eq('id', id)
  revalidatePath('/direccion/objetivos')
}

export async function crearSeguimientoObjetivo(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const objetivoId = String(formData.get('objetivo_id') ?? '')
  const actividad = String(formData.get('actividad') ?? '').trim()
  const fechaRevision = String(formData.get('fecha_revision') ?? '') || null
  if (!objetivoId || !actividad) throw new Error('Faltan datos.')
  await supabase.from('objetivo_seguimientos').insert({
    objetivo_id: objetivoId,
    fecha_revision: fechaRevision,
    actividad,
    responsable: String(formData.get('responsable') ?? '').trim() || quien.nombre,
  })
  revalidatePath('/direccion/objetivos')
}

export async function eliminarSeguimientoObjetivo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('objetivo_seguimientos').delete().eq('id', id)
  revalidatePath('/direccion/objetivos')
}

// ---------- Riesgos y oportunidades ----------

export async function crearRiesgoOportunidad(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') ?? '')
  const contexto = String(formData.get('contexto') ?? '').trim()
  const parteInteresada = String(formData.get('parte_interesada') ?? '').trim()
  const proceso = String(formData.get('proceso') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const valoracion = String(formData.get('valoracion') ?? '') || null
  const acciones = String(formData.get('acciones') ?? '').trim()
  const responsable = String(formData.get('responsable') ?? '').trim()
  const fecha = String(formData.get('fecha') ?? '').trim()

  if (!descripcion) throw new Error('Escribe la descripción.')
  if (tipo !== 'riesgo' && tipo !== 'oportunidad') throw new Error('Selecciona el tipo.')

  const { data: maxRow } = await supabase
    .from('riesgos_oportunidades')
    .select('numero')
    .eq('tipo', tipo)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()
  const numero = (maxRow?.numero ?? 0) + 1

  await supabase.from('riesgos_oportunidades').insert({
    numero,
    tipo,
    contexto: contexto || null,
    parte_interesada: parteInteresada || null,
    proceso: proceso || null,
    descripcion,
    valoracion,
    acciones: acciones || null,
    responsable: responsable || null,
    fecha: fecha || null,
    creado_por: quien.id,
  })
  revalidatePath('/direccion/riesgos')
}

export async function actualizarEfectividadRiesgo(id: string, efectividad: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase
    .from('riesgos_oportunidades')
    .update({ efectividad_acciones: efectividad, actualizado_en: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/direccion/riesgos')
}

export async function eliminarRiesgoOportunidad(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('riesgos_oportunidades').delete().eq('id', id)
  revalidatePath('/direccion/riesgos')
}
