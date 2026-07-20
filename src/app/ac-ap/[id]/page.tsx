import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DetalleAcAp from './DetalleAcAp'

const ROLES_PLAN = ['coordinador_sgi']

export default async function DetalleAcApPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('acciones_correctivas')
    .select(
      'id, folio, descripcion, tipo_nc, estatus, causa_raiz, accion_propuesta, fecha_compromiso, evidencia_cierre, comentario_validacion, responsable_id, definicion_problema, equipo_lider, equipo_miembros, medidas_contencion, analisis_causas, plan_trabajo, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!data) notFound()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('estatus', 'activo')
    .order('nombre')

  const { data: evidenciasData } = await supabase
    .from('ac_evidencias')
    .select('id, nombre_archivo, storage_path, creado_en, subido_por:usuarios!ac_evidencias_subido_por_fkey(nombre)')
    .eq('accion_id', id)
    .order('creado_en', { ascending: false })

  const accion = {
    id: data.id as string,
    folio: data.folio as string | null,
    descripcion: data.descripcion as string,
    tipo_nc: data.tipo_nc as string | null,
    estatus: data.estatus as string,
    causa_raiz: data.causa_raiz as string | null,
    accion_propuesta: data.accion_propuesta as string | null,
    fecha_compromiso: data.fecha_compromiso as string | null,
    evidencia_cierre: data.evidencia_cierre as string | null,
    comentario_validacion: data.comentario_validacion as string | null,
    definicion_problema: data.definicion_problema as string | null,
    equipo_lider: data.equipo_lider as string | null,
    equipo_miembros: data.equipo_miembros as string | null,
    medidas_contencion: (data.medidas_contencion ?? []) as never,
    analisis_causas: (data.analisis_causas ?? {}) as never,
    plan_trabajo: (data.plan_trabajo ?? []) as never,
    responsable_nombre:
      (data.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
    responsable_id: data.responsable_id as string | null,
    evidencias: (evidenciasData ?? []).map((e) => ({
      id: e.id as string,
      nombre_archivo: e.nombre_archivo as string,
      storage_path: e.storage_path as string,
      creado_en: e.creado_en as string,
      subido_por_nombre: (e.subido_por as unknown as { nombre: string } | null)?.nombre ?? null,
    })),
  }

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/ac-ap"
    >
      <DetalleAcAp
        accion={accion}
        usuarios={usuarios ?? []}
        puedeArmarPlan={ROLES_PLAN.includes(quien.rol)}
        esResponsable={data.responsable_id === quien.id}
        esCoordinador={quien.rol === 'coordinador_sgi'}
      />
    </AppShell>
  )
}
