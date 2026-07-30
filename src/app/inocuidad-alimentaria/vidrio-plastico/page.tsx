import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import VidrioPlasticoClient from './VidrioPlasticoClient'

export default async function VidrioPlasticoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: items }, { data: valores }, { data: incidentes }] = await Promise.all([
    supabase.from('vidrio_inventario_items').select('*').order('nave').order('orden'),
    supabase.from('vidrio_inventario_valores').select('*'),
    supabase.from('vidrio_incidentes').select('*').order('fecha', { ascending: false }),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/vidrio-plastico">
      <VidrioPlasticoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        items={items ?? []}
        valores={valores ?? []}
        incidentes={incidentes ?? []}
      />
    </AppShell>
  )
}
