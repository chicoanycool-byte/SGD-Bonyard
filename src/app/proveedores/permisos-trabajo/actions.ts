'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi' && quien.rol !== 'jefe') throw new Error('No autorizado.')
  return quien
}

export async function crearPermisoTrabajo(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const proveedorId = String(formData.get('proveedor_id') ?? '') || null
  const contratistaNombre = String(formData.get('contratista_nombre') ?? '').trim()
  const tipoTrabajo = String(formData.get('tipo_trabajo') ?? '').trim()
  const area = String(formData.get('area') ?? '').trim()
  const fechaInicio = String(formData.get('fecha_inicio') ?? '')
  const fechaFin = String(formData.get('fecha_fin') ?? '') || null
  const medidasSeguridad = String(formData.get('medidas_seguridad') ?? '').trim()
  const eppRequerido = String(formData.get('epp_requerido') ?? '').trim()

  if (!contratistaNombre || !tipoTrabajo || !fechaInicio) {
    throw new Error('Contratista, tipo de trabajo y fecha de inicio son obligatorios.')
  }

  await supabase.from('permisos_trabajo').insert({
    proveedor_id: proveedorId,
    contratista_nombre: contratistaNombre,
    tipo_trabajo: tipoTrabajo,
    area: area || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    responsable_autoriza: quien.id,
    medidas_seguridad: medidasSeguridad || null,
    epp_requerido: eppRequerido || null,
    creado_por: quien.id,
  })
  revalidatePath('/proveedores/permisos-trabajo')
}

export async function actualizarEstatusPermiso(id: string, estatus: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('permisos_trabajo').update({ estatus }).eq('id', id)
  revalidatePath('/proveedores/permisos-trabajo')
}

export async function eliminarPermisoTrabajo(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('permisos_trabajo').delete().eq('id', id)
  revalidatePath('/proveedores/permisos-trabajo')
}
