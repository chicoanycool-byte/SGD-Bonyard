'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (!['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)) throw new Error('No autorizado.')
  return quien
}

function rutaPorTipo(tipo: string) {
  return tipo === 'limpieza' ? '/mantenimiento/limpieza' : '/mantenimiento/programa'
}

// ---------- Catálogo (equipos / áreas) ----------

export async function crearItemCatalogo(formData: FormData) {
  await requerirGestion()
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') ?? 'mantenimiento')
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) throw new Error('Escribe el nombre.')

  const { count } = await supabase
    .from('mantenimiento_catalogo')
    .select('id', { count: 'exact', head: true })
    .eq('nave', String(formData.get('nave') ?? 'Nave 1'))
    .eq('tipo', tipo)

  await supabase.from('mantenimiento_catalogo').insert({
    nave: String(formData.get('nave') ?? 'Nave 1'),
    tipo,
    nombre,
    criticidad: String(formData.get('criticidad') ?? 'NA'),
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    frecuencia: String(formData.get('frecuencia') ?? '').trim() || null,
    documento_registro: String(formData.get('documento_registro') ?? '').trim() || null,
    orden: (count ?? 0) + 1,
  })
  revalidatePath(rutaPorTipo(tipo))
  revalidatePath('/mantenimiento/metricas')
}

export async function eliminarItemCatalogo(id: string, tipo: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('mantenimiento_catalogo').delete().eq('id', id)
  revalidatePath(rutaPorTipo(tipo))
  revalidatePath('/mantenimiento/metricas')
}

export async function editarItemCatalogo(formData: FormData) {
  await requerirGestion()
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const tipo = String(formData.get('tipo') ?? 'mantenimiento')
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!id || !nombre) throw new Error('Faltan datos obligatorios.')

  await supabase
    .from('mantenimiento_catalogo')
    .update({
      numero: formData.get('numero') ? Number(formData.get('numero')) : null,
      nombre,
      criticidad: String(formData.get('criticidad') ?? 'NA'),
      descripcion: String(formData.get('descripcion') ?? '').trim() || null,
      frecuencia: String(formData.get('frecuencia') ?? '').trim() || null,
      documento_registro: String(formData.get('documento_registro') ?? '').trim() || null,
    })
    .eq('id', id)

  revalidatePath(rutaPorTipo(tipo))
  revalidatePath('/mantenimiento/metricas')
}

// ---------- Calendario mensual (programado / realizado) ----------

export async function alternarProgramado(itemId: string, anio: number, mes: number, tipo: string) {
  await requerirGestion()
  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('mantenimiento_mensual')
    .select('id, programado, realizado')
    .eq('item_id', itemId)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  if (!existente) {
    await supabase.from('mantenimiento_mensual').insert({ item_id: itemId, anio, mes, programado: true })
  } else if (existente.programado && !existente.realizado) {
    await supabase.from('mantenimiento_mensual').update({ programado: false }).eq('id', existente.id)
  } else if (!existente.programado) {
    await supabase.from('mantenimiento_mensual').update({ programado: true }).eq('id', existente.id)
  } else {
    // estaba realizado; al desmarcar programado también se limpia realizado
    await supabase.from('mantenimiento_mensual').update({ programado: false, realizado: false }).eq('id', existente.id)
  }
  revalidatePath(rutaPorTipo(tipo))
  revalidatePath('/mantenimiento/metricas')
}

export async function alternarRealizado(itemId: string, anio: number, mes: number, tipo: string) {
  await requerirGestion()
  const supabase = await createClient()

  const { data: existente } = await supabase
    .from('mantenimiento_mensual')
    .select('id, programado, realizado')
    .eq('item_id', itemId)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  if (!existente) {
    await supabase
      .from('mantenimiento_mensual')
      .insert({ item_id: itemId, anio, mes, programado: true, realizado: true, fecha_realizado: new Date().toISOString().slice(0, 10) })
  } else {
    const nuevoRealizado = !existente.realizado
    await supabase
      .from('mantenimiento_mensual')
      .update({
        realizado: nuevoRealizado,
        programado: true,
        fecha_realizado: nuevoRealizado ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', existente.id)
  }
  revalidatePath(rutaPorTipo(tipo))
  revalidatePath('/mantenimiento/metricas')
}

// ---------- Métricas: push a indicadores ----------

export async function guardarCumplimientoIndicador(indicadorId: string, anio: number, mes: number, valor: number) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  await supabase.from('indicadores_valores').upsert(
    {
      indicador_id: indicadorId,
      anio,
      mes,
      valor,
      comentario: 'Calculado automáticamente desde el Programa de Mantenimiento / Checklist de Limpieza.',
      capturado_por: quien.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'indicador_id,anio,mes' }
  )
  revalidatePath('/mantenimiento/metricas')
  revalidatePath('/indicadores/dashboard')
}
