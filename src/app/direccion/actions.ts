'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

// ---------- Contexto de la organización ----------

export async function crearFactor(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const tipo = String(formData.get('tipo') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  if (!descripcion) throw new Error('Escribe una descripción.')
  await supabase.from('contexto_factores').insert({ tipo, descripcion, actualizado_por: quien.id })
  revalidatePath('/direccion/contexto')
}

export async function eliminarFactor(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('contexto_factores').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

export async function crearParteInteresada(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const necesidad = String(formData.get('necesidad_expectativa') ?? '').trim()
  const requisito = String(formData.get('requisito') ?? '').trim()
  if (!nombre) throw new Error('Escribe el nombre de la parte interesada.')
  await supabase.from('partes_interesadas').insert({
    nombre,
    necesidad_expectativa: necesidad || null,
    requisito: requisito || null,
    actualizado_por: quien.id,
  })
  revalidatePath('/direccion/contexto')
}

export async function eliminarParteInteresada(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('partes_interesadas').delete().eq('id', id)
  revalidatePath('/direccion/contexto')
}

// ---------- Objetivos de calidad ----------

export async function crearObjetivo(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const metaTexto = String(formData.get('meta_texto') ?? '').trim()
  const indicadorId = String(formData.get('indicador_id') ?? '') || null
  const responsableId = String(formData.get('responsable_id') ?? '') || null
  if (!descripcion) throw new Error('Escribe el objetivo.')
  await supabase.from('objetivos_calidad').insert({
    descripcion,
    meta_texto: metaTexto || null,
    indicador_id: indicadorId,
    responsable_id: responsableId,
    creado_por: quien.id,
  })
  revalidatePath('/direccion/objetivos')
}

export async function eliminarObjetivo(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('objetivos_calidad').delete().eq('id', id)
  revalidatePath('/direccion/objetivos')
}

// ---------- Riesgos y oportunidades ----------

const MATRIZ_NIVEL: Record<string, Record<string, string>> = {
  alta: { alto: 'critico', medio: 'alto', bajo: 'medio' },
  media: { alto: 'alto', medio: 'medio', bajo: 'bajo' },
  baja: { alto: 'medio', medio: 'bajo', bajo: 'bajo' },
}

export async function crearRiesgoOportunidad(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const origen = String(formData.get('origen') ?? '').trim()
  const probabilidad = String(formData.get('probabilidad') ?? '')
  const impacto = String(formData.get('impacto') ?? '')
  const accionPropuesta = String(formData.get('accion_propuesta') ?? '').trim()
  const responsableId = String(formData.get('responsable_id') ?? '') || null
  const fechaCompromiso = String(formData.get('fecha_compromiso') ?? '') || null

  if (!descripcion) throw new Error('Escribe la descripción.')
  if (tipo !== 'riesgo' && tipo !== 'oportunidad') throw new Error('Selecciona el tipo.')

  const nivel = MATRIZ_NIVEL[probabilidad]?.[impacto] ?? null

  await supabase.from('riesgos_oportunidades').insert({
    tipo,
    descripcion,
    origen: origen || null,
    probabilidad: probabilidad || null,
    impacto: impacto || null,
    nivel,
    accion_propuesta: accionPropuesta || null,
    responsable_id: responsableId,
    fecha_compromiso: fechaCompromiso,
    creado_por: quien.id,
  })
  revalidatePath('/direccion/riesgos')
}

export async function actualizarEstatusRiesgo(id: string, estatus: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  const update: Record<string, unknown> = { estatus, actualizado_en: new Date().toISOString() }
  if (estatus === 'cerrado') update.fecha_cierre_real = new Date().toISOString().slice(0, 10)
  await supabase.from('riesgos_oportunidades').update(update).eq('id', id)
  revalidatePath('/direccion/riesgos')
}

export async function eliminarRiesgoOportunidad(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('riesgos_oportunidades').delete().eq('id', id)
  revalidatePath('/direccion/riesgos')
}
