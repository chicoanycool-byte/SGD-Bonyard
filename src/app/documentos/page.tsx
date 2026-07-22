import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DocumentosTabla from './DocumentosTabla'

export default async function DocumentosPage() {
  const quien = await requerirUsuario()

  const supabase = await createClient()
  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, codigo, nombre, version, proceso, storage_path, tamano_kb, actualizado_en')
    .order('proceso').order('codigo')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/documentos">
      <div className="flex flex-col gap-4">
        <DocumentosTabla
          documentos={documentos ?? []}
          puedeGestionar={false}
          permitirDescarga={false}
        />
      </div>
    </AppShell>
  )
}
