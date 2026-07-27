'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

type TipoInstitucional = 'politica_calidad' | 'reglamento_higiene'

const RUTA_POR_TIPO: Record<TipoInstitucional, string> = {
  politica_calidad: '/politica-calidad',
  reglamento_higiene: '/reglamento-higiene',
}

export async function subirDocumentoInstitucional(formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const tipo = String(formData.get('tipo') ?? '') as TipoInstitucional
  const archivo = formData.get('archivo') as File | null
  if (tipo !== 'politica_calidad' && tipo !== 'reglamento_higiene') {
    throw new Error('Tipo de documento inválido.')
  }
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo PDF.')

  const supabase = await createClient()
  const rutaStorage = `${tipo}/documento.pdf`

  const { error: errorSubida } = await supabase.storage
    .from('institucional')
    .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })
  if (errorSubida) throw new Error('No se pudo subir el archivo.')

  await supabase
    .from('documentos_institucionales')
    .upsert(
      {
        tipo,
        nombre_archivo: archivo.name,
        storage_path: rutaStorage,
        subido_por: quien.id,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'tipo' }
    )

  revalidatePath(RUTA_POR_TIPO[tipo])
}

export async function obtenerUrlInstitucional(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('institucional')
    .createSignedUrl(storagePath, 60 * 5)
  if (error || !data) throw new Error('No se pudo generar el enlace de descarga.')
  return data.signedUrl
}
