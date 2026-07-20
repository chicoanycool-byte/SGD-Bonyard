import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ChecklistHallazgos from './ChecklistHallazgos'
import PanelControlAuditoria from './PanelControlAuditoria'
import EditarAuditoriaForm from './EditarAuditoriaForm'

const NORMA_LABEL: Record<string, string> = {
  iso_9001: 'ISO 9001:2015',
  sqf: 'SQF',
  ambas: 'ISO 9001:2015 + SQF',
}

export default async function DetalleAuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: auditoria } = await supabase
    .from('auditorias')
    .select(
      'id, fecha, norma, tipo, proceso, cliente_nombre, nave, puesto_auditado, observaciones, estatus, informe_resumen, informe_conclusiones, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(id, nombre), auditor_auxiliar:usuarios!auditorias_auditor_auxiliar_id_fkey(id, nombre), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!auditoria) notFound()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('estatus', 'activo')
    .order('nombre')

  const { data: hallazgos } = await supabase
    .from('auditoria_hallazgos')
    .select('id, clausula, requisito, evidencia, evidencia_sugerida, documento_referencia, conformidad, tipo_nc, comentario, clasificacion_ia')
    .eq('auditoria_id', id)
    .order('orden')

  const auditorLider = auditoria.auditor_lider as unknown as
    | { id: string; nombre: string }
    | null
  const auditorAuxiliar = auditoria.auditor_auxiliar as unknown as
    | { id: string; nombre: string }
    | null
  const auditado = auditoria.auditado as unknown as { nombre: string } | null

  const puedeEditar = quien.rol === 'coordinador_sgi'

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/auditorias"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px] font-medium text-by-gray-dark">
              Auditoría {NORMA_LABEL[auditoria.norma]} —{' '}
              {new Date(auditoria.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
            </p>
            <div className="flex items-center gap-2">
              {auditoria.estatus === 'cerrada' && (
                <a
                  href={`/auditorias/${auditoria.id}/informe`}
                  className="h-8 rounded-md border border-by-primary px-4 text-[13px] font-medium leading-8 text-by-primary transition hover:bg-by-primary/5"
                >
                  Descargar informe (Word)
                </a>
              )}
              <PanelControlAuditoria
                auditoriaId={auditoria.id}
                estatus={auditoria.estatus}
                puedeEditar={puedeEditar}
              />
              {quien.rol === 'coordinador_sgi' && auditoria.estatus !== 'cerrada' && (
                <EditarAuditoriaForm
                  auditoria={{
                    id: auditoria.id,
                    fecha: auditoria.fecha,
                    norma: auditoria.norma,
                    tipo: auditoria.tipo,
                    proceso: auditoria.proceso,
                    cliente_nombre: auditoria.cliente_nombre,
                    nave: auditoria.nave,
                    auditor_lider_id: auditorLider?.id ?? null,
                    auditor_auxiliar_id: auditorAuxiliar?.id ?? null,
                    observaciones: auditoria.observaciones,
                  }}
                  usuarios={usuarios ?? []}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-[12.5px]">
            <div>
              <p className="text-by-gray-light">Tipo</p>
              <p className="capitalize text-by-gray-dark">{auditoria.tipo}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Proceso</p>
              <p className="text-by-gray-dark">{auditoria.proceso ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Cliente</p>
              <p className="text-by-gray-dark">{auditoria.cliente_nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Nave</p>
              <p className="text-by-gray-dark">{auditoria.nave ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Auditor líder</p>
              <p className="text-by-gray-dark">{auditorLider?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Auditor auxiliar</p>
              <p className="text-by-gray-dark">{auditorAuxiliar?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Auditado</p>
              <p className="text-by-gray-dark">{auditado?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Puesto</p>
              <p className="text-by-gray-dark">{auditoria.puesto_auditado ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-by-gray-light">Observaciones</p>
              <p className="text-by-gray-dark">{auditoria.observaciones ?? '—'}</p>
            </div>
          </div>
        </div>

        <ChecklistHallazgos
          auditoriaId={auditoria.id}
          hallazgos={hallazgos ?? []}
          puedeEditar={puedeEditar}
          bloqueado={auditoria.estatus === 'cerrada' || auditoria.estatus === 'cancelada'}
        />

        {auditoria.informe_resumen && (
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-2 text-[13px] font-medium text-by-gray-dark">
              Resumen de la auditoría (FSG-58)
            </p>
            <p className="mb-3 whitespace-pre-wrap text-[12.5px] text-by-gray-dark">
              {auditoria.informe_resumen}
            </p>
            <p className="mb-2 text-[13px] font-medium text-by-gray-dark">
              Conclusiones
            </p>
            <p className="whitespace-pre-wrap text-[12.5px] text-by-gray-dark">
              {auditoria.informe_conclusiones}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
