import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ChecklistVerificacionContenedor from './ChecklistVerificacionContenedor'
import CerrarVerificacionBoton from './CerrarVerificacionBoton'

export default async function DetalleVerificacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') notFound()
  const supabase = await createClient()

  const { data: verificacion } = await supabase
    .from('verificaciones')
    .select(
      'id, numero, fecha, periodo_evaluado, area_proceso, estatus, aplicado_por:usuarios!verificaciones_aplicado_por_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!verificacion) notFound()

  const [{ data: respuestasData }, { data: usuarios }] = await Promise.all([
    supabase
      .from('verificacion_respuestas')
      .select(
        'id, respuesta, hallazgo, accion_mejora, responsable_id, fecha_compromiso, estatus, accion_correctiva_id, checklist:verificacion_checklist(numero, bloque, subarea, criterio, doc_ref, area_responsable)'
      )
      .eq('verificacion_id', id),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const filas = (respuestasData ?? [])
    .map((r) => {
      const c = r.checklist as unknown as {
        numero: number
        bloque: string | null
        subarea: string | null
        criterio: string
        doc_ref: string | null
        area_responsable: string | null
      } | null
      return {
        id: r.id as string,
        numero: c?.numero ?? 0,
        bloque: c?.bloque ?? null,
        subarea: c?.subarea ?? null,
        criterio: c?.criterio ?? '',
        doc_ref: c?.doc_ref ?? null,
        area_responsable: c?.area_responsable ?? null,
        respuesta: r.respuesta as string | null,
        hallazgo: r.hallazgo as string | null,
        accion_mejora: r.accion_mejora as string | null,
        responsable_id: r.responsable_id as string | null,
        fecha_compromiso: r.fecha_compromiso as string | null,
        estatus: r.estatus as string,
        accion_correctiva_id: r.accion_correctiva_id as string | null,
      }
    })
    .sort((a, b) => a.numero - b.numero)

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/verificacion-sgi">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[14px] font-medium text-by-gray-dark">
              Verificación {verificacion.numero} — {new Date(verificacion.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
            </p>
            {verificacion.estatus !== 'cerrada' && (
              <CerrarVerificacionBoton verificacionId={verificacion.id} />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <p className="text-by-gray-light">Período evaluado</p>
              <p className="text-by-gray-dark">{verificacion.periodo_evaluado ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Área / Proceso</p>
              <p className="text-by-gray-dark">{verificacion.area_proceso ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Aplicado por</p>
              <p className="text-by-gray-dark">
                {(verificacion.aplicado_por as unknown as { nombre: string } | null)?.nombre ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <ChecklistVerificacionContenedor
          filas={filas}
          verificacionId={verificacion.id}
          usuarios={usuarios ?? []}
          bloqueado={verificacion.estatus === 'cerrada'}
        />
      </div>
    </AppShell>
  )
}
