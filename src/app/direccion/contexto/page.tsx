import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ContextoClient from './ContextoClient'

export default async function ContextoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [
    { data: foda },
    { data: partes },
    { data: procesos },
    { data: alcance },
    { data: exclusiones },
  ] = await Promise.all([
    supabase.from('contexto_foda').select('*').order('orden'),
    supabase
      .from('partes_interesadas')
      .select('id, nombre, orden, requisitos:partes_interesadas_requisitos(*)')
      .order('orden'),
    supabase.from('procesos_sgi').select('*').order('orden'),
    supabase.from('alcance_sgi').select('*').limit(1).maybeSingle(),
    supabase.from('alcance_exclusiones').select('*').order('orden'),
  ])

  const partesOrdenadas = (partes ?? []).map((p) => ({
    ...p,
    requisitos: (p.requisitos ?? []).sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/contexto">
      <ContextoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        foda={foda ?? []}
        partes={partesOrdenadas}
        procesos={procesos ?? []}
        alcance={alcance ?? null}
        exclusiones={exclusiones ?? []}
      />
    </AppShell>
  )
}
