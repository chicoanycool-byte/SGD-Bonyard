import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DescriptivosLista from './DescriptivosLista'

export default async function DescriptivoPuestoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: descriptivos } = await supabase.rpc('listar_descriptivos_visibles')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/descriptivo">
      <DescriptivosLista descriptivos={descriptivos ?? []} />
    </AppShell>
  )
}
