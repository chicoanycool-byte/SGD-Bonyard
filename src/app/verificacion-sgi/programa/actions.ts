'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

export async function crearItemPrograma(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const lista = String(formData.get('lista_verificacion') ?? '').trim()
  if (!lista) throw new Error('Escribe el nombre de la lista de verificación.')

  const { count } = await supabase.from('verificacion_programa_catalogo').select('id', { count: 'exact', head: true })

  await supabase.from('verificacion_programa_catalogo').insert({
    enfoque: String(formData.get('enfoque') ?? '').trim() || null,
    periodicidad: String(formData.get('periodicidad') ?? '').trim() || null,
    lista_verificacion: lista,
    responsable_realiza: String(formData.get('responsable_realiza') ?? '').trim() || null,
    puesto_responsable_atiende: String(formData.get('puesto_responsable_atiende') ?? '').trim() || null,
    orden: (count ?? 0) + 1,
  })
  revalidatePath('/verificacion-sgi/programa')
}

export async function editarItemPrograma(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const lista = String(formData.get('lista_verificacion') ?? '').trim()
  if (!id || !lista) throw new Error('Faltan datos.')

  await supabase
    .from('verificacion_programa_catalogo')
    .update({
      enfoque: String(formData.get('enfoque') ?? '').trim() || null,
      periodicidad: String(formData.get('periodicidad') ?? '').trim() || null,
      lista_verificacion: lista,
      responsable_realiza: String(formData.get('responsable_realiza') ?? '').trim() || null,
      puesto_responsable_atiende: String(formData.get('puesto_responsable_atiende') ?? '').trim() || null,
    })
    .eq('id', id)
  revalidatePath('/verificacion-sgi/programa')
}

export async function eliminarItemPrograma(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('verificacion_programa_catalogo').delete().eq('id', id)
  revalidatePath('/verificacion-sgi/programa')
}

export async function alternarProgramado(itemId: string, anio: number, mes: number) {
  await requerirCoordinador()
  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('verificacion_programa_mensual')
    .select('id, programado, realizado')
    .eq('item_id', itemId)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  if (!existente) {
    await supabase.from('verificacion_programa_mensual').insert({ item_id: itemId, anio, mes, programado: true })
  } else if (existente.programado && !existente.realizado) {
    await supabase.from('verificacion_programa_mensual').update({ programado: false }).eq('id', existente.id)
  } else if (!existente.programado) {
    await supabase.from('verificacion_programa_mensual').update({ programado: true }).eq('id', existente.id)
  } else {
    await supabase.from('verificacion_programa_mensual').update({ programado: false, realizado: false }).eq('id', existente.id)
  }
  revalidatePath('/verificacion-sgi/programa')
}

export async function alternarRealizado(itemId: string, anio: number, mes: number) {
  await requerirCoordinador()
  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('verificacion_programa_mensual')
    .select('id, realizado')
    .eq('item_id', itemId)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  if (!existente) {
    await supabase
      .from('verificacion_programa_mensual')
      .insert({ item_id: itemId, anio, mes, programado: true, realizado: true, fecha_realizado: new Date().toISOString().slice(0, 10) })
  } else {
    const nuevoRealizado = !existente.realizado
    await supabase
      .from('verificacion_programa_mensual')
      .update({ realizado: nuevoRealizado, programado: true, fecha_realizado: nuevoRealizado ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', existente.id)
  }
  revalidatePath('/verificacion-sgi/programa')
}
