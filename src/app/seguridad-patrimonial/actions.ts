'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  return quien
}

async function requerirGestionSellos() {
  const quien = await requerirUsuario()
  if (!['coordinador_sgi', 'gerente', 'supervisor'].includes(quien.rol)) throw new Error('No autorizado.')
  return quien
}

// ---------- Manual de Seguridad Patrimonial ----------

export async function subirManual(formData: FormData) {
  const quien = await requerirCoordinador()
  const supabase = await createClient()
  const nave = String(formData.get('nave') ?? 'Nave 1')
  const archivo = formData.get('archivo') as File | null
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo.')

  const rutaStorage = `manual/${nave.replace(/\s+/g, '_')}.pdf`
  const { error } = await supabase.storage
    .from('seguridad-patrimonial')
    .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })
  if (error) throw new Error('No se pudo subir el archivo.')

  await supabase.from('seguridad_manual').upsert(
    {
      nave,
      nombre_archivo: archivo.name,
      storage_path: rutaStorage,
      subido_por: quien.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'nave' }
  )
  revalidatePath('/seguridad-patrimonial/manual')
}

export async function obtenerUrlManual(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('seguridad-patrimonial').createSignedUrl(storagePath, 60 * 5)
  if (error || !data) throw new Error('No se pudo generar el enlace.')
  return data.signedUrl
}

// ---------- Control de sellos ----------

export async function crearControlSello(formData: FormData) {
  const quien = await requerirGestionSellos()
  const supabase = await createClient()

  const unidad = String(formData.get('unidad_transporte') ?? '').trim()
  const numeroSello = String(formData.get('numero_sello_colocado') ?? '').trim()
  if (!unidad || !numeroSello) throw new Error('Unidad y número de sello son obligatorios.')

  await supabase.from('control_sellos').insert({
    fecha: String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10),
    nave: String(formData.get('nave') ?? 'Nave 1'),
    unidad_transporte: unidad,
    operador: String(formData.get('operador') ?? '').trim() || null,
    cliente: String(formData.get('cliente') ?? '').trim() || null,
    numero_sello_colocado: numeroSello,
    responsable_coloca: quien.id,
    fecha_hora_colocacion: new Date().toISOString(),
    observaciones: String(formData.get('observaciones') ?? '').trim() || null,
    creado_por: quien.id,
  })
  revalidatePath('/seguridad-patrimonial/sellos')
}

export async function verificarSello(formData: FormData) {
  const quien = await requerirGestionSellos()
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const numeroVerificado = String(formData.get('numero_sello_verificado') ?? '').trim()
  const estatus = String(formData.get('estatus') ?? 'correcto')
  if (!id || !numeroVerificado) throw new Error('Falta el número de sello verificado.')

  await supabase
    .from('control_sellos')
    .update({
      numero_sello_verificado: numeroVerificado,
      responsable_verifica: quien.id,
      fecha_hora_verificacion: new Date().toISOString(),
      estatus,
      observaciones: String(formData.get('observaciones_verificacion') ?? '').trim() || null,
    })
    .eq('id', id)
  revalidatePath('/seguridad-patrimonial/sellos')
}

export async function eliminarControlSello(id: string) {
  await requerirCoordinador()
  const supabase = await createClient()
  await supabase.from('control_sellos').delete().eq('id', id)
  revalidatePath('/seguridad-patrimonial/sellos')
}
