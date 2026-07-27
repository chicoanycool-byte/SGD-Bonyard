import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PermisosTrabajoClient from './PermisosTrabajoClient'

export default async function PermisosTrabajoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: permisos }, { data: proveedores }] = await Promise.all([
    supabase
      .from('permisos_trabajo')
      .select('*, autoriza:usuarios!permisos_trabajo_responsable_autoriza_fkey(nombre)')
      .order('creado_en', { ascending: false }),
    supabase.from('proveedores').select('id, nombre').order('nombre'),
  ])

  const mapeados = (permisos ?? []).map((p) => ({
    ...p,
    autoriza_nombre: (p.autoriza as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/proveedores/permisos-trabajo">
      <PermisosTrabajoClient
        puedeGestionar={quien.rol === 'coordinador_sgi' || quien.rol === 'jefe'}
        permisos={mapeados}
        proveedores={proveedores ?? []}
      />
    </AppShell>
  )
}
