import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import EvaluacionForm from './EvaluacionForm'
import HistorialEvaluaciones from './HistorialEvaluaciones'
import PanelNotificacionProveedor from './PanelNotificacionProveedor'
import { criteriosDe, CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

const ROLES_GESTION = ['coordinador_sgi']

export default async function DetalleProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const puedeGestionar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const { data: proveedor } = await supabase
    .from('proveedores')
    .select('id, nombre, correo, categoria, producto_servicio, periodicidad')
    .eq('id', id)
    .single()

  if (!proveedor) notFound()

  const { data: evaluacionesData } = await supabase
    .from('evaluaciones_proveedor')
    .select(
      'id, fecha_evaluacion, es_na, puntaje_ponderado, calificacion_pct, clasificacion, observaciones, accion_correctiva_id'
    )
    .eq('proveedor_id', id)
    .order('fecha_evaluacion', { ascending: false })

  const evaluaciones = (evaluacionesData ?? []).map((e) => ({
    id: e.id as string,
    fecha_evaluacion: e.fecha_evaluacion as string,
    es_na: e.es_na as boolean,
    puntaje_ponderado: e.puntaje_ponderado === null ? null : Number(e.puntaje_ponderado),
    calificacion_pct: e.calificacion_pct === null ? null : Number(e.calificacion_pct),
    clasificacion: e.clasificacion as string | null,
    observaciones: e.observaciones as string | null,
    accion_correctiva_id: e.accion_correctiva_id as string | null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/proveedores"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="text-[14px] font-medium text-by-gray-dark">{proveedor.nombre}</p>
          <p className="text-[12px] text-by-gray-light">
            {CATEGORIA_LABEL[proveedor.categoria] ?? proveedor.categoria} ·{' '}
            {proveedor.producto_servicio ?? 'Sin descripción'} · Periodicidad {proveedor.periodicidad}
          </p>
        </div>

        {quien.rol === 'coordinador_sgi' && (
          <PanelNotificacionProveedor proveedorId={proveedor.id} correoActual={proveedor.correo} />
        )}

        {puedeGestionar && (
          <EvaluacionForm proveedorId={proveedor.id} criterios={criteriosDe(proveedor.categoria)} />
        )}

        <HistorialEvaluaciones evaluaciones={evaluaciones} esCoordinador={quien.rol === 'coordinador_sgi'} />
      </div>
    </AppShell>
  )
}
