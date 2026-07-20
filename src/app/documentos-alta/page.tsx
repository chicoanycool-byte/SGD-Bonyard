import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PanelCarga from '../documentos/PanelCarga'
import DocumentosTabla from '../documentos/DocumentosTabla'

const ROLES_GESTION = ['coordinador_sgi', 'director', 'gerente', 'jefe', 'supervisor']

export default async function DocumentosAltaPage() {
  const quien = await requerirUsuario()
  const puedeGestionar = ROLES_GESTION.includes(quien.rol)

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
        {!puedeGestionar && (
          <div className="rounded-xl border border-black/5 bg-white p-4 text-[12.5px] text-by-gray-light">
            Solo el Coordinador SGI puede dar de alta, actualizar o eliminar documentos.
          </div>
        )}
        {puedeGestionar && <PanelCarga />}
        <DocumentosTabla documentos={documentos ?? []} puedeGestionar={puedeGestionar} />
      </div>
    </AppShell>
  )
}
