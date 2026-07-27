import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import RiesgosClient from './RiesgosClient'

export default async function RiesgosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: registros }, { data: usuarios }] = await Promise.all([
    supabase
      .from('riesgos_oportunidades')
      .select(
        'id, tipo, descripcion, origen, probabilidad, impacto, nivel, accion_propuesta, fecha_compromiso, fecha_cierre_real, estatus, responsable:usuarios!riesgos_oportunidades_responsable_id_fkey(nombre)'
      )
      .order('creado_en', { ascending: false }),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const mapeados = (registros ?? []).map((r) => ({
    id: r.id as string,
    tipo: r.tipo as string,
    descripcion: r.descripcion as string,
    origen: r.origen as string | null,
    probabilidad: r.probabilidad as string | null,
    impacto: r.impacto as string | null,
    nivel: r.nivel as string | null,
    accion_propuesta: r.accion_propuesta as string | null,
    fecha_compromiso: r.fecha_compromiso as string | null,
    fecha_cierre_real: r.fecha_cierre_real as string | null,
    estatus: r.estatus as string,
    responsable_nombre: (r.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/riesgos">
      <RiesgosClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        registros={mapeados}
        usuarios={usuarios ?? []}
      />
    </AppShell>
  )
}
