import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ManualClient from './ManualClient'

export default async function ManualSeguridadPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: manuales } = await supabase.from('seguridad_manual').select('*')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/seguridad-patrimonial/manual">
      <ManualClient esCoordinador={quien.rol === 'coordinador_sgi'} manuales={manuales ?? []} />
    </AppShell>
  )
}
