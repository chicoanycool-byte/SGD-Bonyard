import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import EquipoHaccpClient from './EquipoHaccpClient'

export default async function EquipoHaccpPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: equipo } = await supabase.from('haccp_equipo').select('*').order('rol_equipo').order('orden')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/equipo">
      <EquipoHaccpClient esCoordinador={quien.rol === 'coordinador_sgi'} equipo={equipo ?? []} />
    </AppShell>
  )
}
