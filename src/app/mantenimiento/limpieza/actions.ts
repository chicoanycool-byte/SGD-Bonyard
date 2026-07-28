'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const PUESTOS_MANTENIMIENTO = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (!PUESTOS_MANTENIMIENTO.includes(quien.puesto ?? '')) throw new Error('No autorizado.')
  return quien
}

export async function crearChecklistLimpieza(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const nave = String(formData.get('nave') ?? 'Nave 1')
  const fecha = String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10)
  const auditorNombre = String(formData.get('auditor_nombre') ?? '').trim() || quien.nombre
  const receptorNombre = String(formData.get('receptor_nombre') ?? '').trim()
  const comentariosExtra = String(formData.get('comentarios_extra') ?? '').trim()

  const { data: registro, error } = await supabase
    .from('limpieza_checklist_registros')
    .insert({
      nave,
      fecha,
      auditor_id: quien.id,
      auditor_nombre: auditorNombre,
      receptor_nombre: receptorNombre || null,
      comentarios_extra: comentariosExtra || null,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (error || !registro) throw new Error('No se pudo crear el checklist.')

  const { data: catalogo } = await supabase.from('limpieza_checklist_catalogo').select('id')
  const respuestas = (catalogo ?? []).map((item) => {
    const cumple = String(formData.get(`cumple_${item.id}`) ?? 'NA')
    const ubicacion = String(formData.get(`ubicacion_${item.id}`) ?? '').trim()
    const comentarios = String(formData.get(`comentarios_${item.id}`) ?? '').trim()
    return {
      registro_id: registro.id,
      item_id: item.id,
      cumple,
      ubicacion_dano: ubicacion || null,
      comentarios: comentarios || null,
    }
  })

  if (respuestas.length > 0) {
    await supabase.from('limpieza_checklist_respuestas').insert(respuestas)
  }

  revalidatePath('/mantenimiento/limpieza')
  revalidatePath('/mantenimiento/metricas')
}

export async function eliminarChecklistLimpieza(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('limpieza_checklist_registros').delete().eq('id', id)
  revalidatePath('/mantenimiento/limpieza')
  revalidatePath('/mantenimiento/metricas')
}
