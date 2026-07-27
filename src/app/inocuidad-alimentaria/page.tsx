import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import InocuidadClient from './InocuidadClient'

export default async function InocuidadAlimentariaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: documentos }, { data: eventos }] = await Promise.all([
    supabase.from('inocuidad_documentos').select('*'),
    supabase
      .from('inocuidad_eventos')
      .select('*, responsable:usuarios!inocuidad_eventos_responsable_id_fkey(nombre)')
      .order('fecha', { ascending: false }),
  ])

  const eventosMapeados = (eventos ?? []).map((e) => ({
    ...e,
    responsable_nombre: (e.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria">
      <InocuidadClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        documentos={documentos ?? []}
        eventos={eventosMapeados}
      />
    </AppShell>
  )
}
