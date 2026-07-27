import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ControlSellosClient from './ControlSellosClient'

export default async function ControlSellosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'gerente', 'supervisor'].includes(quien.rol)

  const { data: sellos } = await supabase
    .from('control_sellos')
    .select(
      '*, coloca:usuarios!control_sellos_responsable_coloca_fkey(nombre), verifica:usuarios!control_sellos_responsable_verifica_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  const mapeados = (sellos ?? []).map((s) => ({
    ...s,
    coloca_nombre: (s.coloca as unknown as { nombre: string } | null)?.nombre ?? null,
    verifica_nombre: (s.verifica as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/seguridad-patrimonial/sellos">
      <ControlSellosClient puedeGestionar={puedeGestionar} sellos={mapeados} />
    </AppShell>
  )
}
