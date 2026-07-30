import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TemaDocumentoClient from '../TemaDocumentoClient'

export default async function Pagina() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: documento }, { data: eventos }] = await Promise.all([
    supabase.from('inocuidad_documentos').select('*').eq('tipo', 'alergenos').maybeSingle(),
    supabase
      .from('inocuidad_eventos')
      .select('*, responsable:usuarios!inocuidad_eventos_responsable_id_fkey(nombre)')
      .eq('tipo', 'alergenos')
      .order('fecha', { ascending: false }),
  ])

  const eventosMapeados = (eventos ?? []).map((e) => ({
    ...e,
    responsable_nombre: (e.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/alergenos">
      <TemaDocumentoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        tipo="alergenos"
        titulo="Gestión de Alérgenos"
        codigo="PSG-21"
        descripcion="Identificación, control y prevención de contaminación cruzada de alérgenos declarados (cacahuate)."
        documento={documento ?? null}
        eventos={eventosMapeados}
      />
    </AppShell>
  )
}
