import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ObjetivosClient from './ObjetivosClient'

export default async function ObjetivosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: objetivos }, { data: indicadores }, { data: usuarios }] = await Promise.all([
    supabase
      .from('objetivos_calidad')
      .select(
        'id, periodo, descripcion, lider_equipo, fecha_cumplimiento, metrico_indicador, estatus, indicador:indicadores_catalogo(nombre), actividades:objetivo_actividades(*), seguimientos:objetivo_seguimientos(*)'
      )
      .order('creado_en'),
    supabase.from('indicadores_catalogo').select('id, nombre').order('nombre'),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const mapeados = (objetivos ?? []).map((o) => ({
    id: o.id as string,
    periodo: o.periodo as string | null,
    descripcion: o.descripcion as string,
    lider_equipo: o.lider_equipo as string | null,
    fecha_cumplimiento: o.fecha_cumplimiento as string | null,
    metrico_indicador: o.metrico_indicador as string | null,
    estatus: o.estatus as string,
    indicador_nombre: (o.indicador as unknown as { nombre: string } | null)?.nombre ?? null,
    actividades: ((o.actividades ?? []) as unknown as Array<{
      id: string
      orden: number
      actividad: string
      fecha_programada: string | null
      fecha_real: string | null
      responsable: string | null
      recursos: string | null
      inversion: string | null
      seguimiento: string | null
    }>).sort((a, b) => a.orden - b.orden),
    seguimientos: ((o.seguimientos ?? []) as unknown as Array<{
      id: string
      fecha_revision: string | null
      actividad: string
      responsable: string | null
    }>).sort((a, b) => String(a.fecha_revision ?? '').localeCompare(String(b.fecha_revision ?? ''))),
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/objetivos">
      <ObjetivosClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        objetivos={mapeados}
        indicadores={indicadores ?? []}
        usuarios={usuarios ?? []}
      />
    </AppShell>
  )
}
