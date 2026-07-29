import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ControlSellosClient from './ControlSellosClient'

const PUESTOS_PERMITIDOS = ['Coordinador del SGI', 'Gerente de operaciones', 'Jefe de Mantenimiento']

export default async function ControlSellosPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_PERMITIDOS.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()

  const [{ data: recepcion }, { data: entrega }, { data: anomalias }] = await Promise.all([
    supabase.from('sellos_recepcion').select('*').order('numero'),
    supabase.from('sellos_entrega').select('*').order('numero'),
    supabase.from('sellos_anomalias').select('*').order('numero'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/seguridad-patrimonial/sellos">
      <ControlSellosClient
        recepcion={recepcion ?? []}
        entrega={entrega ?? []}
        anomalias={anomalias ?? []}
      />
    </AppShell>
  )
}
