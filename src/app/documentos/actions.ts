'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const ROLES_GESTION = ['coordinador_sgi']

export type EstadoSubirDocumento = {
  error?: string
  ok?: boolean
}

export async function subirDocumento(
  _prevState: EstadoSubirDocumento,
  formData: FormData
): Promise<EstadoSubirDocumento> {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) {
    return { error: 'No autorizado.' }
  }

  const codigo = String(formData.get('codigo') ?? '').trim().toUpperCase()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const version = String(formData.get('version') ?? '').trim()
  const proceso = String(formData.get('proceso') ?? '').trim()
  const archivo = formData.get('archivo') as File | null

  if (!codigo || !nombre || !archivo || archivo.size === 0) {
    return { error: 'Completa código, nombre y selecciona un archivo.' }
  }

  if (archivo.size > 20 * 1024 * 1024) {
    return { error: 'El archivo no puede pesar más de 20 MB.' }
  }

  const supabase = await createClient()

  const extension = archivo.name.split('.').pop() ?? 'bin'
  const rutaStorage = `${codigo}/${Date.now()}.${extension}`

  const { error: errorSubida } = await supabase.storage
    .from('documentos')
    .upload(rutaStorage, archivo, {
      contentType: archivo.type || 'application/octet-stream',
    })

  if (errorSubida) {
    return { error: 'No se pudo subir el archivo. ' + errorSubida.message }
  }

  // Si el código ya existe, actualiza (nueva versión); si no, crea.
  const { data: existente } = await supabase
    .from('documentos')
    .select('id, storage_path')
    .eq('codigo', codigo)
    .maybeSingle()

  if (existente) {
    await supabase
      .from('documentos')
      .update({
        nombre,
        version: version || null,
        proceso: proceso || null,
        storage_path: rutaStorage,
        tipo_archivo: archivo.type || extension,
        tamano_kb: Math.round(archivo.size / 1024),
        subido_por: quien.id,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', existente.id)

    // Limpia el archivo anterior para no acumular versiones viejas
    if (existente.storage_path) {
      await supabase.storage.from('documentos').remove([existente.storage_path])
    }
  } else {
    const { error: errorInsert } = await supabase.from('documentos').insert({
      codigo,
      nombre,
      version: version || null,
      proceso: proceso || null,
      storage_path: rutaStorage,
      tipo_archivo: archivo.type || extension,
      tamano_kb: Math.round(archivo.size / 1024),
      subido_por: quien.id,
    })

    if (errorInsert) {
      return { error: 'No se pudo registrar el documento. ' + errorInsert.message }
    }
  }

  revalidatePath('/documentos')
  return { ok: true }
}

export async function obtenerUrlDescarga(storagePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(storagePath, 60 * 5, { download: true })

  if (error || !data) {
    throw new Error('No se pudo generar el enlace de descarga.')
  }

  return data.signedUrl
}

export async function obtenerUrlVisualizacion(storagePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(storagePath, 60 * 5)

  if (error || !data) {
    throw new Error('No se pudo generar el enlace de visualización.')
  }

  return data.signedUrl
}

export async function eliminarDocumento(documentoId: string, storagePath: string | null) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) {
    throw new Error('No autorizado.')
  }

  const supabase = await createClient()

  if (storagePath) {
    await supabase.storage.from('documentos').remove([storagePath])
  }
  await supabase.from('documentos').delete().eq('id', documentoId)

  revalidatePath('/documentos')
}
