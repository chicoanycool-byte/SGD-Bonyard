import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PanelCarga from '../documentos/PanelCarga'
import DocumentosTabla from '../documentos/DocumentosTabla'

export default async function DocumentosAltaPage() {
  const quien = await requerirUsuario()

  if (quien.rol !== 'coordinador_sgi') {
    redirect('/inicio')
  }

  const supabase = await createClient()
  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, codigo, nombre, version, proceso, storage_path, tamano_kb, actualizado_en')
    .order('proceso').order('codigo')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/documentos-alta">
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Alta o actualización de documentos
        </p>
        <PanelCarga />
        <DocumentosTabla documentos={documentos ?? []} puedeGestionar={true} />
      </div>
    </AppShell>
  )
}
