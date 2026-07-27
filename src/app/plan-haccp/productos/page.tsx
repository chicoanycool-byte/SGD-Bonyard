import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AnalisisProductosClient from './AnalisisProductosClient'

export default async function AnalisisProductosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: productos } = await supabase.from('haccp_analisis_productos').select('*').order('nave').order('categoria').order('orden')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/plan-haccp/productos">
      <AnalisisProductosClient esCoordinador={quien.rol === 'coordinador_sgi'} productos={productos ?? []} />
    </AppShell>
  )
}
