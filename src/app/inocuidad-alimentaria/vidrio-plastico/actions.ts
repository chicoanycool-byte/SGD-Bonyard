'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

// ---------- Inventario: catálogo de artículos ----------

export async function crearItemInventario(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const nave = String(formData.get('nave') ?? 'Nave 1')
  const area = String(formData.get('area') ?? '').trim()
  const nombreItem = String(formData.get('nombre_item') ?? '').trim()
  if (!area || !nombreItem) throw new Error('Escribe el área y el artículo.')

  const { count } = await supabase
    .from('vidrio_inventario_items')
    .select('id', { count: 'exact', head: true })
    .eq('nave', nave)

  await supabase.from('vidrio_inventario_items').insert({
    nave,
    area,
    nombre_item: nombreItem,
    orden: (count ?? 0) + 1,
  })
  revalidatePath('/inocuidad-alimentaria/vidrio-plastico')
}

export async function eliminarItemInventario(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('vidrio_inventario_items').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria/vidrio-plastico')
}

// ---------- Inventario: valores por bimestre ----------

export async function guardarValorInventario(formData: FormData) {
  await requerirCoordinador()
  const supabase = await createClient()

  const itemId = String(formData.get('item_id') ?? '')
  const anio = Number(formData.get('anio') ?? 0)
  const bimestre = Number(formData.get('bimestre') ?? 0)
  if (!itemId || !anio || !bimestre) throw new Error('Faltan datos.')

  await supabase.from('vidrio_inventario_valores').upsert(
    {
      item_id: itemId,
      anio,
      bimestre,
      cantidad: formData.get('cantidad') ? Number(formData.get('cantidad')) : null,
      vidrio: formData.get('vidrio') ? Number(formData.get('vidrio')) : null,
      acrilico: formData.get('acrilico') ? Number(formData.get('acrilico')) : null,
      condicion: String(formData.get('condicion') ?? '') || null,
      observaciones: String(formData.get('observaciones') ?? '').trim() || null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'item_id,anio,bimestre' }
  )
  revalidatePath('/inocuidad-alimentaria/vidrio-plastico')
}

// ---------- Reporte de incidentes ----------

export async function crearIncidenteVidrio(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()

  const descripcion = String(formData.get('descripcion') ?? '').trim()
  if (!descripcion) throw new Error('Escribe la descripción del incidente.')

  await supabase.from('vidrio_incidentes').insert({
    nave: String(formData.get('nave') ?? '').trim() || null,
    fecha: String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10),
    ubicacion: String(formData.get('ubicacion') ?? '').trim() || null,
    descripcion,
    tipo: String(formData.get('tipo') ?? '').trim() || null,
    reportado_por: String(formData.get('reportado_por') ?? '').trim() || null,
    contamino_producto: formData.get('contamino_producto') === 'si',
    producto_afectado: String(formData.get('producto_afectado') ?? '').trim() || null,
    disposicion_producto: String(formData.get('disposicion_producto') ?? '').trim() || null,
    acciones_tomadas: String(formData.get('acciones_tomadas') ?? '').trim() || null,
    disposicion_vidrio: String(formData.get('disposicion_vidrio') ?? '').trim() || null,
    responsable_reinspeccion: String(formData.get('responsable_reinspeccion') ?? '').trim() || null,
    observaciones: String(formData.get('observaciones') ?? '').trim() || null,
    creado_por: quien.id,
  })
  revalidatePath('/inocuidad-alimentaria/vidrio-plastico')
}

export async function eliminarIncidenteVidrio(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('vidrio_incidentes').delete().eq('id', id)
  revalidatePath('/inocuidad-alimentaria/vidrio-plastico')
}
