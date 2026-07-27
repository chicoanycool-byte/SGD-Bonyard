import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import OrganigramaVista from './OrganigramaVista'

export default async function OrganigramaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: organigrama } = await supabase
    .from('rrhh_documentos')
    .select('id, nombre_archivo, storage_path, actualizado_en')
    .eq('tipo', 'organigrama')
    .maybeSingle()

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/organigrama">
      <OrganigramaVista organigrama={organigrama ?? null} />
    </AppShell>
  )
}
