import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TemaDocumentoClient from '../TemaDocumentoClient'

export default async function Pagina() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: documento }, { data: eventos }] = await Promise.all([
    supabase.from('inocuidad_documentos').select('*').eq('tipo', 'fraude_alimentario').maybeSingle(),
    supabase
      .from('inocuidad_eventos')
      .select('*, responsable:usuarios!inocuidad_eventos_responsable_id_fkey(nombre)')
      .eq('tipo', 'fraude_alimentario')
      .order('fecha', { ascending: false }),
  ])

  const eventosMapeados = (eventos ?? []).map((e) => ({
    ...e,
    responsable_nombre: (e.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/fraude-alimentario">
      <TemaDocumentoClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        tipo="fraude_alimentario"
        titulo="Fraude Alimentario"
        codigo="MSG-05"
        descripcion="Evaluación de vulnerabilidad a fraude alimentario y plan de mitigación por producto/proveedor."
        documento={documento ?? null}
        eventos={eventosMapeados}
      />
    </AppShell>
  )
}
