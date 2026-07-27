import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import IncidentesTiClient from './IncidentesTiClient'

export default async function IncidentesTiPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = quien.rol === 'coordinador_sgi' || quien.rol === 'jefe'

  const { data: incidentes } = await supabase
    .from('incidentes_ti')
    .select('*, responsable:usuarios!incidentes_ti_responsable_id_fkey(nombre)')
    .order('fecha_inicio', { ascending: false })

  const mapeados = (incidentes ?? []).map((i) => ({
    ...i,
    responsable_nombre: (i.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/ti/incidentes">
      <IncidentesTiClient puedeGestionar={puedeGestionar} incidentes={mapeados} />
    </AppShell>
  )
}
