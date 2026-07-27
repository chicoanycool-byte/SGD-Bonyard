import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardTiClient from './DashboardTiClient'

export default async function DashboardTiPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = quien.rol === 'coordinador_sgi' || quien.rol === 'jefe'

  const [{ data: incidentes }, { data: indicador }] = await Promise.all([
    supabase.from('incidentes_ti').select('id, sistema, fecha_inicio, fecha_fin, titulo').order('fecha_inicio'),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_valor').eq('numero', 26).maybeSingle(),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/ti/dashboard">
      <DashboardTiClient
        puedeGestionar={puedeGestionar}
        incidentes={incidentes ?? []}
        indicador={indicador ?? null}
      />
    </AppShell>
  )
}
