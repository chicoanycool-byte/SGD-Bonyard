import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PlanHaccpClient from './PlanHaccpClient'

export default async function PlanHaccpPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: plan }, { data: encabezados }] = await Promise.all([
    supabase.from('haccp_plan').select('*').order('nave').order('orden'),
    supabase.from('haccp_plan_encabezado').select('*'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/plan">
      <PlanHaccpClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        plan={plan ?? []}
        encabezados={encabezados ?? []}
      />
    </AppShell>
  )
}
