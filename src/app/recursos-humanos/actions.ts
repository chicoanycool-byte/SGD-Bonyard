'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function subirOrganigrama(formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const archivo = formData.get('archivo') as File | null
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo PDF.')

  const supabase = await createClient()
  const rutaStorage = `organigrama/organigrama.pdf`

  const { error: errorSubida } = await supabase.storage
    .from('rrhh')
    .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })
  if (errorSubida) throw new Error('No se pudo subir el archivo.')

  // Solo debe existir un organigrama vigente: eliminamos el anterior y registramos el nuevo
  await supabase.from('rrhh_documentos').delete().eq('tipo', 'organigrama')
  await supabase.from('rrhh_documentos').insert({
    tipo: 'organigrama',
    nombre_archivo: archivo.name,
    storage_path: rutaStorage,
    subido_por: quien.id,
  })

  revalidatePath('/recursos-humanos')
}

export async function subirDescriptivo(formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const puestoId = String(formData.get('puesto_id') ?? '')
  const archivo = formData.get('archivo') as File | null
  if (!puestoId) throw new Error('Selecciona un puesto.')
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo PDF.')

  const supabase = await createClient()
  const rutaStorage = `descriptivo/${puestoId}/descriptivo.pdf`

  const { error: errorSubida } = await supabase.storage
    .from('rrhh')
    .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })
  if (errorSubida) throw new Error('No se pudo subir el archivo.')

  await supabase.from('rrhh_documentos').delete().eq('tipo', 'descriptivo_puesto').eq('puesto_id', puestoId)
  await supabase.from('rrhh_documentos').insert({
    tipo: 'descriptivo_puesto',
    puesto_id: puestoId,
    nombre_archivo: archivo.name,
    storage_path: rutaStorage,
    subido_por: quien.id,
  })

  revalidatePath('/recursos-humanos')
}

export async function obtenerUrlArchivoRrhh(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('rrhh')
    .createSignedUrl(storagePath, 60 * 5)
  if (error || !data) throw new Error('No se pudo generar el enlace de descarga.')
  return data.signedUrl
}
