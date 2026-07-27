import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ContextoClient from './ContextoClient'

export default async function ContextoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: factores }, { data: partes }] = await Promise.all([
    supabase.from('contexto_factores').select('id, tipo, descripcion, creado_en').order('creado_en'),
    supabase.from('partes_interesadas').select('id, nombre, necesidad_expectativa, requisito, creado_en').order('creado_en'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/contexto">
      <ContextoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        factores={factores ?? []}
        partes={partes ?? []}
      />
    </AppShell>
  )
}
