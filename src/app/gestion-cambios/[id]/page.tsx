import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ESTATUS_CAMBIO, RIESGO_CAMBIO, TIPOS_CAMBIO } from '@/lib/cambios'
import { EvaluarForm, ImplementacionForm, CierreForm } from './AccionesCambio'

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-by-gray">{label}</p>
      <p className="whitespace-pre-line text-[13px] text-by-gray-dark">{valor || '—'}</p>
    </div>
  )
}

const fecha = (f?: string | null) => (f ? new Date(f.length === 10 ? f + 'T12:00:00' : f).toLocaleDateString('es-MX') : null)

export default async function DetalleCambioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('cambios')
    .select(
      '*, solicitante:usuarios!cambios_solicitante_id_fkey(nombre), responsable:usuarios!cambios_responsable_id_fkey(nombre), aprobador:usuarios!cambios_aprobado_por_fkey(nombre)'
    )
    .eq('id', id)
    .single()
  if (!c) notFound()

  const esCoordinador = quien.rol === 'coordinador_sgi'
  const esResponsable = c.responsable_id === quien.id
  const nombre = (x: unknown) => (x as { nombre: string } | null)?.nombre ?? null
  const est = ESTATUS_CAMBIO[c.estatus as string]

  const { data: usuarios } = esCoordinador && c.estatus === 'solicitado'
    ? await supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre')
    : { data: [] as { id: string; nombre: string }[] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/gestion-cambios">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/gestion-cambios" className="text-[12px] text-by-primary hover:underline">← Todos los cambios</Link>
          <p className="text-[14px] font-medium text-by-gray-dark">{c.folio} · {c.titulo}</p>
          <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (est?.clase ?? '')}>{est?.label ?? c.estatus}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-black/5 bg-white p-4 md:grid-cols-3">
          <Dato label="Tipo" valor={TIPOS_CAMBIO[c.tipo as string]} />
          <Dato label="Nave / área" valor={[c.nave, c.area_afectada].filter(Boolean).join(' · ')} />
          <Dato label="Solicitó" valor={`${nombre(c.solicitante) ?? '—'} · ${fecha(c.creado_en)}`} />
          <div className="md:col-span-2"><Dato label="Qué cambia" valor={c.descripcion} /></div>
          <Dato label="Motivo" valor={c.motivo} />
          <Dato label="¿Podría afectar la inocuidad?" valor={c.afecta_inocuidad ? 'Sí' : 'No'} />
          <Dato label="Fecha planeada" valor={fecha(c.fecha_planeada)} />
        </div>

        {c.estatus === 'solicitado' && esCoordinador && (
          <div className="rounded-xl border border-amber-200 bg-white p-4">
            <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Evaluar y decidir</p>
            <EvaluarForm id={c.id as string} usuarios={usuarios ?? []} fechaPlaneada={c.fecha_planeada as string | null} />
          </div>
        )}
        {c.estatus === 'solicitado' && !esCoordinador && (
          <p className="rounded-xl border border-black/5 bg-white p-4 text-[13px] text-by-gray">
            La solicitud está esperando la evaluación de riesgo del Coordinador del SGI. No se debe hacer el cambio hasta que esté aprobado.
          </p>
        )}

        {c.aprobado_por && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-black/5 bg-white p-4 md:grid-cols-3">
            <Dato label="Riesgo" valor={c.riesgo_nivel ? RIESGO_CAMBIO[c.riesgo_nivel as string] : null} />
            <Dato label="Decidió" valor={`${nombre(c.aprobador) ?? '—'} · ${fecha(c.fecha_aprobacion)}`} />
            <Dato label="Responsable" valor={nombre(c.responsable)} />
            <div className="md:col-span-3"><Dato label="Evaluación de riesgo" valor={c.evaluacion_riesgo} /></div>
            <Dato label="Controles previos" valor={c.controles_requeridos} />
            <Dato label="Capacitación" valor={c.requiere_capacitacion ? 'Sí, hay que capacitar' : 'No'} />
            <Dato label="Actualizar documentos" valor={c.requiere_actualizar_documentos ? 'Sí, hay que actualizarlos' : 'No'} />
            {c.comentario_decision && <div className="md:col-span-3"><Dato label="Comentario" valor={c.comentario_decision} /></div>}
          </div>
        )}

        {c.estatus === 'aprobado' && (esCoordinador || esResponsable) && (
          <div className="rounded-xl border border-sky-200 bg-white p-4">
            <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Registrar implementación</p>
            <ImplementacionForm id={c.id as string} />
          </div>
        )}

        {c.fecha_implementacion && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-black/5 bg-white p-4 md:grid-cols-3">
            <Dato label="Se implementó el" valor={fecha(c.fecha_implementacion)} />
            <div className="md:col-span-2"><Dato label="Qué se hizo" valor={c.evidencia_implementacion} /></div>
          </div>
        )}

        {c.estatus === 'implementado' && esCoordinador && (
          <div className="rounded-xl border border-violet-200 bg-white p-4">
            <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Verificar eficacia y cerrar</p>
            <CierreForm id={c.id as string} />
          </div>
        )}

        {c.estatus === 'cerrado' && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-white p-4 md:grid-cols-3">
            <Dato label="Cerrado el" valor={fecha(c.fecha_cierre)} />
            <Dato label="¿Fue efectivo?" valor={c.cambio_efectivo ? 'Sí' : 'No'} />
            <div className="md:col-span-3"><Dato label="Verificación" valor={c.verificacion_post} /></div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
