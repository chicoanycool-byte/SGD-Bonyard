import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DocumentosTabla from './DocumentosTabla'

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const quien = await requerirUsuario()
  const { q } = await searchParams

  const supabase = await createClient()
  let consulta = supabase
    .from('documentos')
    .select('id, codigo, nombre, version, proceso, storage_path, tamano_kb, actualizado_en')

  if (q?.trim()) {
    consulta = consulta.or(`codigo.ilike.%${q.trim()}%,nombre.ilike.%${q.trim()}%`)
  }

  const { data: documentos } = await consulta.order('proceso').order('codigo')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/documentos">
      <div className="flex flex-col gap-4">
        {q && (
          <p className="text-[12.5px] text-by-gray-light">
            Resultados para <span className="font-medium text-by-gray-dark">&ldquo;{q}&rdquo;</span> ·{' '}
            {(documentos ?? []).length} documento(s)
          </p>
        )}
        <DocumentosTabla
          documentos={documentos ?? []}
          puedeGestionar={false}
          permitirDescarga={false}
        />
      </div>
    </AppShell>
  )
}
