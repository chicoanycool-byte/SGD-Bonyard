import { extractText, getDocumentProxy } from 'unpdf'
import { createClient } from '@/lib/supabase/server'

const LIMITE_CARACTERES = 15000

/**
 * Descarga y extrae el texto de un documento interno del SGI (bucket "documentos")
 * a partir de su código (ej. "PSG-03"). Se usa como herramienta del Asesor IA
 * para que sus respuestas se basen en el contenido real de los procedimientos,
 * y no solo en el catálogo de nombres.
 */
export async function obtenerTextoDocumento(codigo: string): Promise<string | null> {
  const codigoLimpio = codigo.trim()
  if (!codigoLimpio) return null

  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documentos')
    .select('codigo, nombre, storage_path, tipo_archivo')
    .ilike('codigo', codigoLimpio)
    .maybeSingle()

  if (!doc?.storage_path) return null

  if (doc.tipo_archivo && doc.tipo_archivo !== 'application/pdf') {
    return `El documento "${doc.codigo} — ${doc.nombre}" no es un PDF, no se puede leer su contenido automáticamente. Consúltalo directamente en el módulo Documentos.`
  }

  const { data: archivo, error } = await supabase.storage
    .from('documentos')
    .download(doc.storage_path)

  if (error || !archivo) return null

  try {
    const buffer = new Uint8Array(await archivo.arrayBuffer())
    const pdf = await getDocumentProxy(buffer)
    const { text: textoExtraido } = await extractText(pdf, { mergePages: true })
    let texto = (textoExtraido || '').trim()
    if (!texto) return null

    if (texto.length > LIMITE_CARACTERES) {
      texto = texto.slice(0, LIMITE_CARACTERES) + '\n\n[...documento truncado por longitud...]'
    }

    return `Documento ${doc.codigo} — ${doc.nombre}\n\n${texto}`
  } catch {
    return null
  }
}
