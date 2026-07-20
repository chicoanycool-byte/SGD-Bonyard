'use client'

import { useTransition } from 'react'
import { generarAccionDesdeEvaluacion } from '../actions'

type Evaluacion = {
  id: string
  fecha_evaluacion: string
  es_na: boolean
  puntaje_ponderado: number | null
  calificacion_pct: number | null
  clasificacion: string | null
  observaciones: string | null
  accion_correctiva_id: string | null
}

export default function HistorialEvaluaciones({
  evaluaciones,
  esCoordinador,
}: {
  evaluaciones: Evaluacion[]
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <div className="border-b border-black/5 px-4 py-2">
        <p className="text-[13px] font-medium text-by-gray-dark">Historial de evaluaciones</p>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
            <th className="px-4 py-2 font-normal">Fecha</th>
            <th className="px-4 py-2 font-normal">Puntaje</th>
            <th className="px-4 py-2 font-normal">Calificación</th>
            <th className="px-4 py-2 font-normal">Clasificación</th>
            <th className="px-4 py-2 font-normal">Observaciones</th>
            {esCoordinador && <th className="px-4 py-2 font-normal">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {evaluaciones.map((e) => (
            <tr key={e.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-2 text-by-gray-dark">
                {new Date(e.fecha_evaluacion + 'T00:00:00').toLocaleDateString('es-MX')}
              </td>
              <td className="px-4 py-2 text-by-gray-light">
                {e.es_na ? 'N/A' : e.puntaje_ponderado ?? '—'}
              </td>
              <td className="px-4 py-2 text-by-gray-light">
                {e.es_na ? '—' : e.calificacion_pct ? `${Math.round(e.calificacion_pct * 100)}%` : '—'}
              </td>
              <td className="px-4 py-2">
                {e.clasificacion === 'tipo_a' && (
                  <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">Tipo A</span>
                )}
                {e.clasificacion === 'tipo_b' && (
                  <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">Tipo B</span>
                )}
                {e.es_na && (
                  <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[11px] text-[#5f5e5a]">N/A</span>
                )}
              </td>
              <td className="max-w-[220px] px-4 py-2 text-by-gray-light">{e.observaciones ?? '—'}</td>
              {esCoordinador && (
                <td className="px-4 py-2">
                  {e.clasificacion === 'tipo_b' &&
                    (e.accion_correctiva_id ? (
                      <span className="text-[11px] text-by-gray-light">AC generada</span>
                    ) : (
                      <button
                        disabled={pending}
                        onClick={() => startTransition(() => generarAccionDesdeEvaluacion(e.id))}
                        className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                      >
                        Generar AC
                      </button>
                    ))}
                </td>
              )}
            </tr>
          ))}
          {evaluaciones.length === 0 && (
            <tr>
              <td colSpan={esCoordinador ? 6 : 5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                Sin evaluaciones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
