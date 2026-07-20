'use client'

import { useMemo, useState } from 'react'

type Hallazgo = {
  area: string | null
  nivel_riesgo: string | null
  respuesta: string | null
  estatus: string
  fecha_compromiso: string | null
  fecha_cierre_real: string | null
  recorrido_fecha: string
  nave: string | null
}

export default function DashboardBpa({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [nave, setNave] = useState('')
  const [area, setArea] = useState('')

  const areas = useMemo(
    () => [...new Set(hallazgos.map((h) => h.area).filter(Boolean) as string[])].sort(),
    [hallazgos]
  )
  const naves = useMemo(
    () => [...new Set(hallazgos.map((h) => h.nave).filter(Boolean) as string[])].sort(),
    [hallazgos]
  )

  const filtrados = useMemo(() => {
    return hallazgos.filter((h) => {
      if (desde && h.recorrido_fecha < desde) return false
      if (hasta && h.recorrido_fecha > hasta) return false
      if (nave && h.nave !== nave) return false
      if (area && h.area !== area) return false
      return true
    })
  }, [hallazgos, desde, hasta, nave, area])

  const noConformes = filtrados.filter((h) => h.respuesta === 'no_cumple')
  const criticos = noConformes.filter((h) => h.nivel_riesgo === 'Crítico').length
  const mayores = noConformes.filter((h) => h.nivel_riesgo === 'Mayor').length
  const menores = noConformes.filter((h) => h.nivel_riesgo === 'Menor').length
  const cerrados = noConformes.filter((h) => h.estatus === 'cerrado').length
  const enTiempo = noConformes.filter(
    (h) =>
      h.estatus === 'cerrado' &&
      h.fecha_cierre_real &&
      h.fecha_compromiso &&
      h.fecha_cierre_real <= h.fecha_compromiso
  ).length

  const porArea = new Map<string, number>()
  for (const h of noConformes) {
    const area = h.area ?? 'Sin área'
    porArea.set(area, (porArea.get(area) ?? 0) + 1)
  }
  const topAreas = [...porArea.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Filtros</p>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Nave</label>
            <select value={nave} onChange={(e) => setNave(e.target.value)} className={inputCls}>
              <option value="">Todas</option>
              {naves.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Área / Proceso</label>
            <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
              <option value="">Todas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
          <p className="mb-1 text-[11px] opacity-80">No conformes</p>
          <p className="text-[22px] font-medium">{noConformes.length}</p>
        </div>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
          <p className="mb-1 text-[11px] opacity-80">Críticos</p>
          <p className="text-[22px] font-medium">{criticos}</p>
        </div>
        <div className="rounded-lg bg-[#fdf3e3] px-4 py-3 text-[#9a6b1c]">
          <p className="mb-1 text-[11px] opacity-80">Mayores</p>
          <p className="text-[22px] font-medium">{mayores}</p>
        </div>
        <div className="rounded-lg bg-[#f1efe8] px-4 py-3 text-[#5f5e5a]">
          <p className="mb-1 text-[11px] opacity-80">Menores</p>
          <p className="text-[22px] font-medium">{menores}</p>
        </div>
        <div className="rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53]">
          <p className="mb-1 text-[11px] opacity-80">Cerrados en tiempo</p>
          <p className="text-[22px] font-medium">
            {cerrados > 0 ? `${Math.round((enTiempo / cerrados) * 100)}%` : '—'}
          </p>
          <p className="text-[10.5px] opacity-70">{enTiempo}/{cerrados} cerrados</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Top 10 áreas con más hallazgos</p>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Área</th>
              <th className="px-4 py-2 font-normal">No conformidades</th>
            </tr>
          </thead>
          <tbody>
            {topAreas.map(([area, n]) => (
              <tr key={area} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">{area}</td>
                <td className="px-4 py-2 text-by-gray-light">{n}</td>
              </tr>
            ))}
            {topAreas.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Sin no conformidades en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
