import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import OrdenesMantenimientoClient from './OrdenesMantenimientoClient'

export default async function OrdenesMantenimientoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)

  const { data: ordenes } = await supabase
    .from('mantenimiento_ordenes')
    .select('*, responsable:usuarios!mantenimiento_ordenes_responsable_id_fkey(nombre)')
    .order('fecha_reporte', { ascending: false })

  const mapeadas = (ordenes ?? []).map((o) => ({
    ...o,
    responsable_nombre: (o.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/ordenes">
      <OrdenesMantenimientoClient puedeGestionar={puedeGestionar} ordenes={mapeadas} />
    </AppShell>
  )
}
