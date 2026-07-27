import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PlanHaccpClient from './PlanHaccpClient'

export default async function PlanHaccpPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: plan }, { data: equipo }, { data: procesos }, { data: productos }] = await Promise.all([
    supabase.from('haccp_plan').select('*').limit(1).maybeSingle(),
    supabase.from('haccp_equipo').select('id, nombre, rol_equipo').order('rol_equipo'),
    supabase.from('haccp_analisis_procesos').select('id, proceso, es_pcc').order('orden'),
    supabase.from('haccp_analisis_productos').select('id, categoria_producto').order('orden'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/plan">
      <PlanHaccpClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        plan={plan ?? null}
        equipo={equipo ?? []}
        procesos={procesos ?? []}
        productos={productos ?? []}
      />
    </AppShell>
  )
}
