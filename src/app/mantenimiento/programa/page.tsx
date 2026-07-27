import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ProgramaMantenimientoClient from './ProgramaMantenimientoClient'

export default async function ProgramaMantenimientoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)

  const { data: programa } = await supabase
    .from('mantenimiento_programa')
    .select('*, responsable:usuarios!mantenimiento_programa_responsable_id_fkey(nombre)')
    .order('proxima_fecha')

  const mapeado = (programa ?? []).map((p) => ({
    ...p,
    responsable_nombre: (p.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/programa">
      <ProgramaMantenimientoClient puedeGestionar={puedeGestionar} programa={mapeado} />
    </AppShell>
  )
}
