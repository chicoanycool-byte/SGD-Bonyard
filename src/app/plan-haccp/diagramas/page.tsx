import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DiagramasClient from './DiagramasClient'

export default async function DiagramasPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: diagramas } = await supabase.from('haccp_diagramas').select('*')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/diagramas">
      <DiagramasClient esCoordinador={quien.rol === 'coordinador_sgi'} diagramas={diagramas ?? []} />
    </AppShell>
  )
}
