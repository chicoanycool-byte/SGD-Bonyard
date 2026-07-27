'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi' && quien.rol !== 'jefe') throw new Error('No autorizado.')
  return quien
}

export async function crearEvaluacionInicial(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const proveedorId = String(formData.get('proveedor_id') ?? '') || null
  const nombreProveedor = String(formData.get('nombre_proveedor') ?? '').trim()
  const tipoProveedor = String(formData.get('tipo_proveedor') ?? '')
  const resultado = String(formData.get('resultado') ?? 'pendiente')
  const observaciones = String(formData.get('observaciones') ?? '').trim()

  if (!nombreProveedor) throw new Error('Escribe el nombre del proveedor.')
  if (!tipoProveedor) throw new Error('Selecciona el tipo de proveedor.')

  await supabase.from('proveedor_evaluacion_inicial').insert({
    proveedor_id: proveedorId,
    nombre_proveedor: nombreProveedor,
    tipo_proveedor: tipoProveedor,
    documentacion_legal: formData.get('documentacion_legal') === 'on',
    referencias_comerciales: formData.get('referencias_comerciales') === 'on',
    capacidad_tecnica: formData.get('capacidad_tecnica') === 'on',
    cumplimiento_normativo: formData.get('cumplimiento_normativo') === 'on',
    condiciones_comerciales: formData.get('condiciones_comerciales') === 'on',
    observaciones: observaciones || null,
    resultado,
    aprobado_por: resultado !== 'pendiente' ? quien.id : null,
    creado_por: quien.id,
  })
  revalidatePath('/proveedores/evaluacion-inicial')
}

export async function actualizarResultadoEvaluacion(id: string, resultado: string) {
  const quien = await requerirGestion()
  const supabase = await createClient()
  await supabase
    .from('proveedor_evaluacion_inicial')
    .update({ resultado, aprobado_por: quien.id })
    .eq('id', id)
  revalidatePath('/proveedores/evaluacion-inicial')
}

export async function eliminarEvaluacionInicial(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('proveedor_evaluacion_inicial').delete().eq('id', id)
  revalidatePath('/proveedores/evaluacion-inicial')
}
