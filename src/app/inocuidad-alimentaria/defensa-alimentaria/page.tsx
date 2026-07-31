import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DefensaAlimentariaClient from './DefensaAlimentariaClient'

export default async function DefensaAlimentariaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: catalogo }, { data: respuestas }, { data: encabezados }] = await Promise.all([
    supabase.from('defensa_alimentaria_catalogo').select('*').order('orden'),
    supabase.from('defensa_alimentaria_respuestas').select('*'),
    supabase.from('defensa_alimentaria_encabezado').select('*'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/defensa-alimentaria">
      <DefensaAlimentariaClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        catalogo={catalogo ?? []}
        respuestas={respuestas ?? []}
        encabezados={encabezados ?? []}
      />
    </AppShell>
  )
}
