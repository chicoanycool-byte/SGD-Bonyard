import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ChecklistBpaContenedor from './ChecklistBpaContenedor'
import CerrarRecorridoBoton from './CerrarRecorridoBoton'

const ROLES_GESTION = ['coordinador_sgi']

export default async function DetalleRecorridoBpaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const puedeEditar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const { data: recorrido } = await supabase
    .from('bpa_recorridos')
    .select(
      'id, fecha, naves_inspeccionadas, tipo_inspeccion, turno, supervisor_area, estatus, inspector:usuarios!bpa_recorridos_inspector_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!recorrido) notFound()

  const [{ data: respuestasData }, { data: usuarios }] = await Promise.all([
    supabase
      .from('bpa_respuestas')
      .select(
        'id, respuesta, observaciones, accion_correctiva_requerida, responsable_id, fecha_compromiso, estatus, accion_correctiva_id, checklist:bpa_checklist(numero, area, subarea, pregunta, criterio, nivel_riesgo, clasificacion, referencia)'
      )
      .eq('recorrido_id', id),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const filas = (respuestasData ?? [])
    .map((r) => {
      const c = r.checklist as unknown as {
        numero: number
        area: string | null
        subarea: string | null
        pregunta: string
        criterio: string | null
        nivel_riesgo: string | null
        clasificacion: string | null
        referencia: string | null
      } | null
      return {
        id: r.id as string,
        numero: c?.numero ?? 0,
        area: c?.area ?? null,
        subarea: c?.subarea ?? null,
        pregunta: c?.pregunta ?? '',
        criterio: c?.criterio ?? null,
        nivel_riesgo: c?.nivel_riesgo ?? null,
        clasificacion: c?.clasificacion ?? null,
        referencia: c?.referencia ?? null,
        respuesta: r.respuesta as string | null,
        observaciones: r.observaciones as string | null,
        accion_correctiva_requerida: r.accion_correctiva_requerida as string | null,
        responsable_id: r.responsable_id as string | null,
        fecha_compromiso: r.fecha_compromiso as string | null,
        estatus: r.estatus as string,
        accion_correctiva_id: r.accion_correctiva_id as string | null,
      }
    })
    .sort((a, b) => a.numero - b.numero)

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/recorridos-bpa"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[14px] font-medium text-by-gray-dark">
              Recorrido BPA — {new Date(recorrido.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
            </p>
            {puedeEditar && recorrido.estatus !== 'cerrado' && (
              <CerrarRecorridoBoton recorridoId={recorrido.id} />
            )}
          </div>
          <div className="grid grid-cols-4 gap-3 text-[12.5px]">
            <div>
              <p className="text-by-gray-light">Nave(s)</p>
              <p className="text-by-gray-dark">{recorrido.naves_inspeccionadas ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Turno</p>
              <p className="text-by-gray-dark">{recorrido.turno ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Inspector</p>
              <p className="text-by-gray-dark">
                {(recorrido.inspector as unknown as { nombre: string } | null)?.nombre ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-by-gray-light">Supervisor</p>
              <p className="text-by-gray-dark">{recorrido.supervisor_area ?? '—'}</p>
            </div>
          </div>
        </div>

        <ChecklistBpaContenedor
          filas={filas}
          recorridoId={recorrido.id}
          usuarios={usuarios ?? []}
          puedeEditar={puedeEditar}
          bloqueado={recorrido.estatus === 'cerrado'}
          esCoordinador={quien.rol === 'coordinador_sgi'}
        />
      </div>
    </AppShell>
  )
}
