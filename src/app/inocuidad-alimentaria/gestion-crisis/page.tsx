import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TemaDocumentoClient from '../TemaDocumentoClient'

export default async function Pagina() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: documento }, { data: eventos }] = await Promise.all([
    supabase.from('inocuidad_documentos').select('*').eq('tipo', 'gestion_crisis').maybeSingle(),
    supabase
      .from('inocuidad_eventos')
      .select('*, responsable:usuarios!inocuidad_eventos_responsable_id_fkey(nombre)')
      .eq('tipo', 'gestion_crisis')
      .order('fecha', { ascending: false }),
  ])

  const eventosMapeados = (eventos ?? []).map((e) => ({
    ...e,
    responsable_nombre: (e.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/gestion-crisis">
      <TemaDocumentoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        tipo="gestion_crisis"
        titulo="Gestión de Crisis"
        codigo="MSG-12"
        descripcion="Plan de gestión de crisis con equipo, roles, protocolos de actuación y simulacros."
        documento={documento ?? null}
        eventos={eventosMapeados}
      />
    </AppShell>
  )
}
