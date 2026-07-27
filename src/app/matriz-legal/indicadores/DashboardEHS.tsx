'use client'

import { useMemo, useState } from 'react'

type Fila = {
  numero: number
  tema: string | null
  norma: string | null
  requisito_legal: string | null
  evidencia: string | null
}

type PlanItem = {
  numero: number
  descripcion_hallazgo: string | null
  nivel_riesgo: string | null
  estatus: string | null
  responsable: string | null
  fecha_compromiso: string | null
}

export default function DashboardEHS({ filas, plan }: { filas: Fila[]; plan: PlanItem[] }) {
  const [evidenciaFiltro, setEvidenciaFiltro] = useState<'' | 'SI' | 'NO' | 'NA' | 'sin_capturar'>('')
  const [riesgoFiltro, setRiesgoFiltro] = useState<'' | 'critico' | 'mayor'>('')

  const total = filas.length
  const cumplen = filas.filter((f) => f.evidencia === 'SI').length
  const incumplen = filas.filter((f) => f.evidencia === 'NO').length
  const na = filas.filter((f) => f.evidencia === 'NA').length
  const sinCapturar = filas.filter((f) => !f.evidencia).length
  const base = total - na - sinCapturar
  const porcentaje = base > 0 ? Math.round((cumplen / base) * 100) : null

  const semaforo =
    porcentaje === null
      ? { texto: 'SIN DATO', color: 'bg-[#f1efe8] text-[#5f5e5a]' }
      : porcentaje >= 85
        ? { texto: 'VERDE', color: 'bg-[#eaf5f0] text-[#3d6b53]' }
        : porcentaje >= 68
          ? { texto: 'AMARILLO', color: 'bg-[#fdf3e3] text-[#9a6b1c]' }
          : { texto: 'ROJO', color: 'bg-[#fdecea] text-[#a13c33]' }

  const planAbierto = plan.filter((p) => p.estatus === 'Abierto')
  const criticosAbiertos = planAbierto.filter((p) => p.nivel_riesgo?.includes('CRÍTICO')).length
  const mayoresAbiertos = planAbierto.filter((p) => p.nivel_riesgo?.includes('MAYOR')).length

  const filasFiltradas = useMemo(() => {
    if (!evidenciaFiltro) return filas
    if (evidenciaFiltro === 'sin_capturar') return filas.filter((f) => !f.evidencia)
    return filas.filter((f) => f.evidencia === evidenciaFiltro)
  }, [filas, evidenciaFiltro])

  const planFiltrado = useMemo(() => {
    if (!riesgoFiltro) return planAbierto
    const clave = riesgoFiltro === 'critico' ? 'CRÍTICO' : 'MAYOR'
    return planAbierto.filter((p) => p.nivel_riesgo?.includes(clave))
  }, [planAbierto, riesgoFiltro])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium text-by-gray-dark">% Cumplimiento Legal Global</p>
          <span className={'rounded-full px-3 py-1 text-[12px] font-medium ' + semaforo.color}>
            {semaforo.texto}
          </span>
        </div>
        <p className="text-[32px] font-semibold text-by-primary">
          {porcentaje !== null ? `${porcentaje}%` : '—'}
        </p>
        <p className="text-[11px] text-by-gray-light">Meta: ≥ 85%</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <button
          onClick={() => setEvidenciaFiltro('')}
          className={
            'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
            (evidenciaFiltro === '' ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Total requisitos</p>
          <p className="text-[22px] font-medium">{total}</p>
        </button>
        <button
          onClick={() => setEvidenciaFiltro(evidenciaFiltro === 'SI' ? '' : 'SI')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3d6b53] transition ' +
            (evidenciaFiltro === 'SI' ? 'bg-[#d3ecdf] ring-2 ring-[#3d6b53]/40' : 'bg-[#eaf5f0] hover:bg-[#dff0e7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Cumplen (SI)</p>
          <p className="text-[22px] font-medium">{cumplen}</p>
        </button>
        <button
          onClick={() => setEvidenciaFiltro(evidenciaFiltro === 'NO' ? '' : 'NO')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (evidenciaFiltro === 'NO' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Incumplen (NO)</p>
          <p className="text-[22px] font-medium">{incumplen}</p>
        </button>
        <button
          onClick={() => setEvidenciaFiltro(evidenciaFiltro === 'NA' ? '' : 'NA')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#5f5e5a] transition ' +
            (evidenciaFiltro === 'NA' ? 'bg-[#e2e0d6] ring-2 ring-[#5f5e5a]/40' : 'bg-[#f1efe8] hover:bg-[#e9e6db]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">N/A</p>
          <p className="text-[22px] font-medium">{na}</p>
        </button>
        <button
          onClick={() => setEvidenciaFiltro(evidenciaFiltro === 'sin_capturar' ? '' : 'sin_capturar')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#9a6b1c] transition ' +
            (evidenciaFiltro === 'sin_capturar' ? 'bg-[#f9e6bf] ring-2 ring-[#9a6b1c]/40' : 'bg-[#fdf3e3] hover:bg-[#fbedd2]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Sin capturar</p>
          <p className="text-[22px] font-medium">{sinCapturar}</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">
            Requisitos {evidenciaFiltro ? '(filtrado)' : ''}
          </p>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">#</th>
              <th className="px-3 py-2 font-normal">Tema</th>
              <th className="px-3 py-2 font-normal">Norma</th>
              <th className="px-3 py-2 font-normal">Requisito legal</th>
              <th className="px-3 py-2 font-normal">Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.slice(0, 100).map((f) => (
              <tr key={f.numero} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{f.numero}</td>
                <td className="px-3 py-2 text-by-gray-dark">{f.tema ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.norma ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.requisito_legal ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.evidencia ?? '—'}</td>
              </tr>
            ))}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay requisitos que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filasFiltradas.length > 100 && (
          <p className="border-t border-black/5 px-3 py-2 text-[11px] text-by-gray-light">
            Mostrando 100 de {filasFiltradas.length}. Usa la Matriz completa para ver todos.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setRiesgoFiltro(riesgoFiltro === 'critico' ? '' : 'critico')}
          className={
            'rounded-xl border p-4 text-left transition ' +
            (riesgoFiltro === 'critico'
              ? 'border-[#a13c33] ring-2 ring-[#a13c33]/40'
              : 'border-black/5 bg-white hover:bg-black/[0.02]')
          }
        >
          <p className="mb-1 text-[13px] font-medium text-by-gray-dark">Hallazgos Críticos Abiertos</p>
          <p className="text-[28px] font-semibold text-[#a13c33]">{criticosAbiertos}</p>
          <p className="text-[11px] text-by-gray-light">Meta: 0. Cada uno requiere acción correctiva en ≤ 30 días.</p>
        </button>
        <button
          onClick={() => setRiesgoFiltro(riesgoFiltro === 'mayor' ? '' : 'mayor')}
          className={
            'rounded-xl border p-4 text-left transition ' +
            (riesgoFiltro === 'mayor'
              ? 'border-[#9a6b1c] ring-2 ring-[#9a6b1c]/40'
              : 'border-black/5 bg-white hover:bg-black/[0.02]')
          }
        >
          <p className="mb-1 text-[13px] font-medium text-by-gray-dark">Hallazgos Mayores Abiertos</p>
          <p className="text-[28px] font-semibold text-[#9a6b1c]">{mayoresAbiertos}</p>
          <p className="text-[11px] text-by-gray-light">Meta: 0. Cerrar en ≤ 60 días.</p>
        </button>
      </div>

      {riesgoFiltro && (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <div className="border-b border-black/5 px-4 py-2">
            <p className="text-[13px] font-medium text-by-gray-dark">
              Plan de acción — {riesgoFiltro === 'critico' ? 'Críticos' : 'Mayores'} abiertos
            </p>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                <th className="px-3 py-2 font-normal">#</th>
                <th className="px-3 py-2 font-normal">Hallazgo</th>
                <th className="px-3 py-2 font-normal">Responsable</th>
                <th className="px-3 py-2 font-normal">Compromiso</th>
              </tr>
            </thead>
            <tbody>
              {planFiltrado.map((p) => (
                <tr key={p.numero} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-light">{p.numero}</td>
                  <td className="px-3 py-2 text-by-gray-dark">{p.descripcion_hallazgo ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">{p.responsable ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">
                    {p.fecha_compromiso ? new Date(p.fecha_compromiso).toLocaleDateString('es-MX') : '—'}
                  </td>
                </tr>
              ))}
              {planFiltrado.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                    Ninguno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
