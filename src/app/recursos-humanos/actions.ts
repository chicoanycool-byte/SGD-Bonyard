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

  revalidatePath('/recursos-humanos/organigrama')
  revalidatePath('/recursos-humanos/cargar')
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

  revalidatePath('/recursos-humanos/descriptivo')
  revalidatePath('/recursos-humanos/cargar')
}

// Palabras clave esperadas en el nombre del archivo para cada puesto,
// según la convención "DRH##_DESCRIPTIVO_DE_PUESTO_<PALABRAS>.pdf"
const PALABRAS_CLAVE_PUESTO: Record<string, string[]> = {
  'Auxiliar de limpieza': ['auxiliar', 'limpieza'],
  'Gerente de cuentas': ['gerente', 'cuentas'],
  'Jefe de compras': ['jefe', 'compras'],
  'Atención a clientes y MKT': ['atencion', 'cliente'],
  'Auxiliar del SGI': ['auxiliar', 'sgi'],
  Contador: ['contador'],
  'Auditor de inventarios': ['auditor', 'inventarios'],
  'Coordinador de almacén externo': ['coordinador', 'almacen', 'externo'],
  'Jefe de tráfico': ['jefe', 'trafico'],
  Monitoreo: ['monitoreo'],
  'Jefe de almacén': ['jefe', 'almacen'],
  'Gerente de operaciones': ['gerente', 'operaciones'],
  Montacarguista: ['montacarguista'],
  'Supervisor de tráfico': ['supervisor', 'trafico'],
  'Gerente de transporte': ['gerente', 'transporte'],
  'Jefe administrativo': ['jefe', 'administrativo'],
  'Supervisor de almacén': ['supervisor', 'almacen'],
  'Auxiliar de almacén': ['auxiliar', 'almacen'],
  'Coordinador del SGI': ['coordinador', 'sgi'],
  Pricing: ['pricing'],
  'Seguridad patrimonial / SHE': ['seguridad', 'patrimonial'],
  'Gerente administrativo': ['gerente', 'administrativo'],
  'Coordinador de RRHH': ['coordinador', 'rrhh'],
  'Ejecutivo de cuenta operativo': ['ejecutivo', 'cuenta'],
  'Jefe de Mantenimiento': ['jefe', 'mantenimiento'],
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
}

export async function subirDescriptivosMasivo(formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const archivos = formData.getAll('archivos') as File[]
  if (archivos.length === 0) throw new Error('Selecciona uno o varios PDF.')

  const supabase = await createClient()
  const { data: puestos } = await supabase.from('puestos').select('id, nombre')

  const subidos: string[] = []
  const noEmparejados: string[] = []

  for (const archivo of archivos) {
    if (!archivo.size) continue
    const nombreNormalizado = normalizar(archivo.name)

    // Caso especial: el organigrama
    if (nombreNormalizado.includes('organigrama')) {
      const rutaStorage = `organigrama/organigrama.pdf`
      const { error: errorSubida } = await supabase.storage
        .from('rrhh')
        .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })
      if (!errorSubida) {
        await supabase.from('rrhh_documentos').delete().eq('tipo', 'organigrama')
        await supabase.from('rrhh_documentos').insert({
          tipo: 'organigrama',
          nombre_archivo: archivo.name,
          storage_path: rutaStorage,
          subido_por: quien.id,
        })
        subidos.push(`${archivo.name} → Organigrama`)
      } else {
        noEmparejados.push(archivo.name)
      }
      continue
    }

    const puestoEncontrado = (puestos ?? []).find((p) => {
      const palabras = PALABRAS_CLAVE_PUESTO[p.nombre]
      if (!palabras) return false
      return palabras.every((palabra) => nombreNormalizado.includes(palabra))
    })

    if (!puestoEncontrado) {
      noEmparejados.push(archivo.name)
      continue
    }

    const rutaStorage = `descriptivo/${puestoEncontrado.id}/descriptivo.pdf`
    const { error: errorSubida } = await supabase.storage
      .from('rrhh')
      .upload(rutaStorage, archivo, { upsert: true, contentType: 'application/pdf' })

    if (errorSubida) {
      noEmparejados.push(archivo.name)
      continue
    }

    await supabase
      .from('rrhh_documentos')
      .delete()
      .eq('tipo', 'descriptivo_puesto')
      .eq('puesto_id', puestoEncontrado.id)
    await supabase.from('rrhh_documentos').insert({
      tipo: 'descriptivo_puesto',
      puesto_id: puestoEncontrado.id,
      nombre_archivo: archivo.name,
      storage_path: rutaStorage,
      subido_por: quien.id,
    })
    subidos.push(`${archivo.name} → ${puestoEncontrado.nombre}`)
  }

  revalidatePath('/recursos-humanos/descriptivo')
  revalidatePath('/recursos-humanos/organigrama')
  revalidatePath('/recursos-humanos/cargar')
  return { subidos, noEmparejados }
}

export async function eliminarOrganigrama() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('rrhh_documentos')
    .select('storage_path')
    .eq('tipo', 'organigrama')
    .maybeSingle()

  if (doc) {
    await supabase.storage.from('rrhh').remove([doc.storage_path])
    await supabase.from('rrhh_documentos').delete().eq('tipo', 'organigrama')
  }

  revalidatePath('/recursos-humanos/organigrama')
  revalidatePath('/recursos-humanos/cargar')
}

export async function eliminarDescriptivo(puestoId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('rrhh_documentos')
    .select('storage_path')
    .eq('tipo', 'descriptivo_puesto')
    .eq('puesto_id', puestoId)
    .maybeSingle()

  if (doc) {
    await supabase.storage.from('rrhh').remove([doc.storage_path])
    await supabase
      .from('rrhh_documentos')
      .delete()
      .eq('tipo', 'descriptivo_puesto')
      .eq('puesto_id', puestoId)
  }

  revalidatePath('/recursos-humanos/descriptivo')
  revalidatePath('/recursos-humanos/cargar')
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
