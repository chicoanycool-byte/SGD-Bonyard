'use client'

import { useState, useTransition } from 'react'
import { crearEvaluacionAuditor } from './actions'

type Evaluacion = {
  id: string
  auditor_evaluado_nombre: string
  eval_calificacion_general: number | null
  observaciones: string | null
  acciones_derivadas: string | null
  creado_en: string
}
type Auditor = { id: string; nombre: string }

const ASPECTOS_AUDITORIA = [
  { campo: 'eval_notificacion_plan', label: 'Oportunidad en la notificación del plan de auditoría' },
  { campo: 'eval_claridad_notificacion', label: 'Claridad en la notificación del plan de auditoría' },
  { campo: 'eval_coherencia_metodologia', label: 'Coherencia entre metodología y alcance' },
  { campo: 'eval_enfoque_orientacion', label: 'Enfoque y orientación de la auditoría' },
  { campo: 'eval_horario', label: 'Horario de la auditoría' },
  { campo: 'eval_cumplimiento_objetivo', label: 'Cumplimiento del objetivo de la auditoría' },
  { campo: 'eval_calificacion_general', label: 'Calificación general de la auditoría' },
]
const ASPECTOS_AUDITOR = [
  { campo: 'eval_puntualidad', label: 'Cumplimiento del horario de las reuniones' },
  { campo: 'eval_claridad_preguntas', label: 'Claridad de las preguntas' },
  { campo: 'eval_orden_coherencia', label: 'Orden y coherencia de las preguntas' },
  { campo: 'eval_conocimiento_proceso', label: 'Conocimiento del proceso auditado' },
  { campo: 'eval_capacidad_analisis', label: 'Capacidad de análisis y observación' },
  { campo: 'eval_eficiencia_tiempo', label: 'Eficiencia en el uso del tiempo' },
  { campo: 'eval_claridad_hallazgos', label: 'Claridad al explicar hallazgos y conclusiones' },
  { campo: 'eval_ecuanimidad_respeto', label: 'Ecuanimidad y respeto con los entrevistados' },
]

function Escala({ campo }: { campo: string }) {
  return (
    <select name={campo} defaultValue="" className="h-7 rounded-md border border-black/10 px-1 text-[11px]">
      <option value="">—</option>
      <option value="1">1 · Deficiente</option>
      <option value="2">2 · Regular</option>
      <option value="3">3 · Bueno</option>
      <option value="4">4 · Excelente</option>
    </select>
  )
}

export default function EvaluacionAuditor({
  auditoriaId,
  normaReferencia,
  auditores,
  evaluaciones,
  puedeVerLista,
}: {
  auditoriaId: string
  normaReferencia: string
  auditores: Auditor[]
  evaluaciones: Evaluacion[]
  puedeVerLista: boolean
}) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-medium text-by-gray-dark">Evaluación de auditores (FSG-60)</p>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="h-8 rounded-md border border-by-accent px-3 text-[12px] text-by-accent"
        >
          {mostrarForm ? 'Cancelar' : 'Evaluar auditor'}
        </button>
      </div>

      {mostrarForm && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await crearEvaluacionAuditor(fd)
              setMostrarForm(false)
            })
          }
          className="mb-4 flex flex-col gap-3 border-b border-black/5 pb-4"
        >
          <input type="hidden" name="auditoria_id" value={auditoriaId} />
          <input type="hidden" name="norma_referencia" value={normaReferencia} />
          <p className="text-[11.5px] text-by-gray-light">
            4 = Excelente, 3 = Bueno, 2 = Regular, 1 = Deficiente.
          </p>

          <div className="flex gap-2">
            <select name="auditor_evaluado_id" defaultValue="" className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Auditor evaluado (si está en el sistema)…</option>
              {auditores.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            <input
              name="auditor_evaluado_nombre"
              placeholder="Nombre del auditor a evaluar"
              required
              className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]"
            />
          </div>

          <p className="text-[11.5px] font-medium text-by-gray-dark">Evaluación de la auditoría</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {ASPECTOS_AUDITORIA.map((a) => (
              <div key={a.campo} className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-by-gray-dark">{a.label}</span>
                <Escala campo={a.campo} />
              </div>
            ))}
          </div>

          <p className="mt-1 text-[11.5px] font-medium text-by-gray-dark">Evaluación del auditor</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {ASPECTOS_AUDITOR.map((a) => (
              <div key={a.campo} className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-by-gray-dark">{a.label}</span>
                <Escala campo={a.campo} />
              </div>
            ))}
          </div>

          <textarea name="observaciones" placeholder="Observaciones y/o sugerencias" rows={2} className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
          <textarea name="acciones_derivadas" placeholder="Acciones a realizar derivadas de la evaluación" rows={2} className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />

          <button disabled={pendiente} className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-50">
            {pendiente ? 'Guardando…' : 'Enviar evaluación'}
          </button>
        </form>
      )}

      {puedeVerLista && (
        <>
          <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Evaluaciones recibidas</p>
          <div className="flex flex-col gap-2">
            {evaluaciones.map((e) => (
              <div key={e.id} className="rounded-lg bg-[#f4f6f6] px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-medium text-by-gray-dark">{e.auditor_evaluado_nombre}</p>
                  <span className="text-[11px] text-by-gray-light">
                    Calificación general: {e.eval_calificacion_general ?? '—'}/4
                  </span>
                </div>
                {e.observaciones && <p className="mt-1 text-[11.5px] text-by-gray-light">{e.observaciones}</p>}
              </div>
            ))}
            {evaluaciones.length === 0 && (
              <p className="text-[12px] text-by-gray-light">Sin evaluaciones registradas todavía.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
