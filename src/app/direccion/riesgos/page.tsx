import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import RiesgosClient from './RiesgosClient'

export default async function RiesgosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: registros } = await supabase
    .from('riesgos_oportunidades')
    .select('*')
    .order('tipo')
    .order('numero')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/riesgos">
      <RiesgosClient esCoordinador={quien.rol === 'coordinador_sgi'} registros={registros ?? []} />
    </AppShell>
  )
}
