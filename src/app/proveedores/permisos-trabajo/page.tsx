import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PermisoTrabajoClient from './PermisoTrabajoClient'

const PUESTOS_PERMITIDOS = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

export default async function PermisosTrabajoPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_PERMITIDOS.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()
  const { data: permisos } = await supabase
    .from('permisos_trabajo')
    .select('*')
    .order('creado_en', { ascending: false })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/proveedores/permisos-trabajo">
      <PermisoTrabajoClient permisos={permisos ?? []} />
    </AppShell>
  )
}
