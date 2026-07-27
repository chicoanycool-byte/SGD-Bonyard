import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AnalisisProcesosClient from './AnalisisProcesosClient'

export default async function AnalisisProcesosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: procesos } = await supabase.from('haccp_analisis_procesos').select('*').order('nave').order('area').order('orden')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/procesos">
      <AnalisisProcesosClient esCoordinador={quien.rol === 'coordinador_sgi'} procesos={procesos ?? []} />
    </AppShell>
  )
}
