'use client'

import { useMemo, useState } from 'react'

type Hallazgo = {
  area: string | null
  subarea: string | null
  nivel_riesgo: string | null
  respuesta: string | null
  estatus: string
  fecha_compromiso: string | null
  fecha_cierre_real: string | null
  recorrido_fecha: string
  nave: string | null
}

function pct(cumple: number, total: number) {
  return total > 0 ? (cumple / total) * 100 : null
}

function colorPct(p: number | null) {
  if (p == null) return 'text-by-gray-light'
  if (p >= 90) return 'text-[#3d6b53]'
  if (p >= 75) return 'text-[#9a6b1c]'
  return 'text-[#a13c33]'
}

function GraficaComparativaMensual({
  datos,
  naves,
}: {
  datos: { mes: string; valores: Record<string, number | null> }[]
  naves: string[]
}) {
  const COLORES = ['#14302B', '#2296ad', '#9a6b1c', '#6b4fa0', '#a13c33']
  const ancho = 720
  const alto = 220
  const margen = { top: 16, right: 16, bottom: 40, left: 36 }
  const w = ancho - margen.left - margen.right
  const h = alto - margen.top - margen.bottom
  const grupoAncho = w / Math.max(datos.length, 1)
  const barraAncho = Math.min(24, (grupoAncho - 10) / Math.max(naves.length, 1))

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full" style={{ maxHeight: 260 }}>
        {[0, 25, 50, 75, 100].map((v) => {
          const y = margen.top + h - (v / 100) * h
          return (
            <g key={v}>
              <line x1={margen.left} x2={ancho - margen.right} y1={y} y2={y} stroke="#eceee9" strokeWidth={1} />
              <text x={2} y={y + 3} fontSize={8} fill="#8a8a85">{v}%</text>
            </g>
          )
        })}
        <line x1={margen.left} x2={margen.left} y1={margen.top} y2={margen.top + h} stroke="#c9c9c2" strokeWidth={1} />

        {datos.map((d, gi) => {
          const gx = margen.left + gi * grupoAncho + (grupoAncho - barraAncho * naves.length) / 2
          return (
            <g key={d.mes}>
              {naves.map((n, ni) => {
                const valor = d.valores[n]
                if (valor == null) return null
                const barH = (valor / 100) * h
                const x = gx + ni * barraAncho
                const y = margen.top + h - barH
                return <rect key={n} x={x} y={y} width={barraAncho - 2} height={barH} fill={COLORES[ni % COLORES.length]} rx={1.5} />
              })}
              <text x={margen.left + gi * grupoAncho + grupoAncho / 2} y={alto - 22} fontSize={8} fill="#8a8a85" textAnchor="middle">
                {d.mes}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        {naves.map((n, i) => (
          <span key={n} className="flex items-center gap-1 text-[11px] text-by-gray-light">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DashboardBpa({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [nave, setNave] = useState('')
  const [area, setArea] = useState('')
  const [nivelRiesgo, setNivelRiesgo] = useState('')
  const [soloCerrados, setSoloCerrados] = useState(false)

  const areas = useMemo(
    () => [...new Set(hallazgos.map((h) => h.area).filter(Boolean) as string[])].sort(),
    [hallazgos]
  )
  const naves = useMemo(
    () => [...new Set(hallazgos.map((h) => h.nave).filter(Boolean) as string[])].sort(),
    [hallazgos]
  )
  const sinNave = hallazgos.filter((h) => !h.nave).length

  const filtrados = useMemo(() => {
    return hallazgos.filter((h) => {
      if (desde && h.recorrido_fecha < desde) return false
      if (hasta && h.recorrido_fecha > hasta) return false
      if (nave && h.nave !== nave) return false
      if (area && h.area !== area) return false
      if (nivelRiesgo && h.nivel_riesgo !== nivelRiesgo) return false
      return true
    })
  }, [hallazgos, desde, hasta, nave, area, nivelRiesgo])

  // Cumplimiento general: cumple / (cumple + no_cumple), excluye N/A
  const evaluables = filtrados.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
  const cumplen = evaluables.filter((h) => h.respuesta === 'cumple').length
  const cumplimientoGeneral = pct(cumplen, evaluables.length)

  const noConformes = filtrados.filter((h) => h.respuesta === 'no_cumple')
  const noConformesFiltradasPorNivel = soloCerrados ? noConformes.filter((h) => h.estatus === 'cerrado') : noConformes
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

  // ---------- Cumplimiento por nave ----------
  const porNave = useMemo(() => {
    const navesConSinNave = [...naves, ...(sinNave > 0 ? ['Sin nave registrada'] : [])]
    return navesConSinNave.map((n) => {
      const grupo = filtrados.filter((h) => (n === 'Sin nave registrada' ? !h.nave : h.nave === n))
      const ev = grupo.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
      const c = ev.filter((h) => h.respuesta === 'cumple').length
      return { nave: n, total: ev.length, cumplen: c, pct: pct(c, ev.length) }
    })
  }, [filtrados, naves, sinNave])

  // ---------- Cumplimiento por proceso / área ----------
  const porProceso = useMemo(() => {
    return areas.map((a) => {
      const grupo = filtrados.filter((h) => h.area === a)
      const ev = grupo.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
      const c = ev.filter((h) => h.respuesta === 'cumple').length
      return { area: a, total: ev.length, cumplen: c, pct: pct(c, ev.length) }
    }).sort((x, y) => (x.pct ?? 100) - (y.pct ?? 100))
  }, [filtrados, areas])

  // ---------- Cumplimiento por mes (tendencia del periodo) ----------
  const porMes = useMemo(() => {
    const map = new Map<string, { total: number; cumplen: number }>()
    for (const h of filtrados) {
      if (h.respuesta !== 'cumple' && h.respuesta !== 'no_cumple') continue
      if (!h.recorrido_fecha) continue
      const mes = h.recorrido_fecha.slice(0, 7) // YYYY-MM
      const actual = map.get(mes) ?? { total: 0, cumplen: 0 }
      actual.total++
      if (h.respuesta === 'cumple') actual.cumplen++
      map.set(mes, actual)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, v]) => ({ mes, ...v, pct: pct(v.cumplen, v.total) }))
  }, [filtrados])

  // ---------- Cumplimiento por mes × nave (para gráfico comparativo) ----------
  const porMesPorNave = useMemo(() => {
    const navesEnDatos = nave ? [nave] : naves
    const meses = [...new Set(porMes.map((m) => m.mes))].sort()
    return meses.map((mes) => {
      const valores: Record<string, number | null> = {}
      for (const n of navesEnDatos) {
        const grupo = filtrados.filter(
          (h) => h.nave === n && h.recorrido_fecha?.slice(0, 7) === mes && (h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
        )
        const c = grupo.filter((h) => h.respuesta === 'cumple').length
        valores[n] = pct(c, grupo.length)
      }
      return { mes, valores }
    })
  }, [filtrados, naves, nave, porMes])

  const topAreasNC = useMemo(() => {
    const map = new Map<string, number>()
    for (const h of noConformesFiltradasPorNivel) {
      const a = h.area ?? 'Sin área'
      map.set(a, (map.get(a) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [noConformesFiltradasPorNivel])

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-by-gray-dark">Filtros</p>
          <a
            href={`/recorridos-bpa/dashboard/exportar/pdf?${new URLSearchParams({ desde, hasta, nave, area }).toString()}`}
            target="_blank"
            className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary"
          >
            Exportar PDF
          </a>
        </div>
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
        {sinNave > 0 && (
          <p className="mt-2 text-[11px] text-[#9a6b1c]">
            ⚠ {sinNave} registro(s) no tienen nave asignada (recorridos antiguos sin ese campo capturado). Van a "Sin nave registrada" en el reporte por nave.
          </p>
        )}
      </div>

      {/* Cumplimiento general */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">% Cumplimiento general</p>
          <p className={'text-[26px] font-medium ' + colorPct(cumplimientoGeneral)}>
            {cumplimientoGeneral != null ? `${cumplimientoGeneral.toFixed(1)}%` : '—'}
          </p>
          <p className="text-[10.5px] text-by-gray-light">{cumplen}/{evaluables.length} puntos evaluados</p>
        </div>
        <button
          onClick={() => setNivelRiesgo(nivelRiesgo === 'Crítico' ? '' : 'Crítico')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (nivelRiesgo === 'Crítico' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">NC Críticas</p>
          <p className="text-[22px] font-medium">{criticos}</p>
        </button>
        <button
          onClick={() => setNivelRiesgo(nivelRiesgo === 'Mayor' ? '' : 'Mayor')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#9a6b1c] transition ' +
            (nivelRiesgo === 'Mayor' ? 'bg-[#f9e6bf] ring-2 ring-[#9a6b1c]/40' : 'bg-[#fdf3e3] hover:bg-[#fbedd2]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">NC Mayores</p>
          <p className="text-[22px] font-medium">{mayores}</p>
        </button>
        <button
          onClick={() => setNivelRiesgo(nivelRiesgo === 'Menor' ? '' : 'Menor')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#5f5e5a] transition ' +
            (nivelRiesgo === 'Menor' ? 'bg-[#e2e0d6] ring-2 ring-[#5f5e5a]/40' : 'bg-[#f1efe8] hover:bg-[#e9e6db]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">NC Menores</p>
          <p className="text-[22px] font-medium">{menores}</p>
        </button>
        <button
          onClick={() => setSoloCerrados(!soloCerrados)}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3d6b53] transition ' +
            (soloCerrados ? 'bg-[#d3ecdf] ring-2 ring-[#3d6b53]/40' : 'bg-[#eaf5f0] hover:bg-[#dff0e7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Cerradas en tiempo</p>
          <p className="text-[22px] font-medium">
            {cerrados > 0 ? `${Math.round((enTiempo / cerrados) * 100)}%` : '—'}
          </p>
          <p className="text-[10.5px] opacity-70">{enTiempo}/{cerrados} cerradas</p>
        </button>
      </div>

      {/* Cumplimiento por nave */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Cumplimiento por nave</p>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Nave</th>
              <th className="px-4 py-2 font-normal">Puntos evaluados</th>
              <th className="px-4 py-2 font-normal">Cumplen</th>
              <th className="px-4 py-2 font-normal">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {porNave.map((n) => (
              <tr key={n.nave} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">{n.nave}</td>
                <td className="px-4 py-2 text-by-gray-light">{n.total}</td>
                <td className="px-4 py-2 text-by-gray-light">{n.cumplen}</td>
                <td className={'px-4 py-2 font-medium ' + colorPct(n.pct)}>{n.pct != null ? `${n.pct.toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
            {porNave.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-by-gray-light">Sin datos en este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cumplimiento por proceso / área */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Cumplimiento por proceso / área (ordenado del más crítico al mejor)</p>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Área / Proceso</th>
              <th className="px-4 py-2 font-normal">Puntos evaluados</th>
              <th className="px-4 py-2 font-normal">Cumplen</th>
              <th className="px-4 py-2 font-normal">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {porProceso.map((p) => (
              <tr key={p.area} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">{p.area}</td>
                <td className="px-4 py-2 text-by-gray-light">{p.total}</td>
                <td className="px-4 py-2 text-by-gray-light">{p.cumplen}</td>
                <td className={'px-4 py-2 font-medium ' + colorPct(p.pct)}>{p.pct != null ? `${p.pct.toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
            {porProceso.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px] text-by-gray-light">Sin datos en este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Gráfico comparativo por mes y nave */}
      {porMes.length > 0 && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[13px] font-medium text-by-gray-dark">Comparativa de cumplimiento por mes{!nave && naves.length > 1 ? ' y nave' : ''}</p>
          <GraficaComparativaMensual datos={porMesPorNave} naves={nave ? [nave] : naves} />
        </div>
      )}

      {/* Tendencia por mes */}
      {porMes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <div className="border-b border-black/5 px-4 py-2">
            <p className="text-[13px] font-medium text-by-gray-dark">Tendencia de cumplimiento por mes (periodo filtrado)</p>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">Mes</th>
                <th className="px-4 py-2 font-normal">Evaluados</th>
                <th className="px-4 py-2 font-normal">Cumplen</th>
                <th className="px-4 py-2 font-normal">% Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {porMes.map((m) => (
                <tr key={m.mes} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2 text-by-gray-dark">{m.mes}</td>
                  <td className="px-4 py-2 text-by-gray-light">{m.total}</td>
                  <td className="px-4 py-2 text-by-gray-light">{m.cumplen}</td>
                  <td className={'px-4 py-2 font-medium ' + colorPct(m.pct)}>{m.pct != null ? `${m.pct.toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top áreas con más no conformidades */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Top 10 áreas con más no conformidades</p>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Área</th>
              <th className="px-4 py-2 font-normal">No conformidades</th>
            </tr>
          </thead>
          <tbody>
            {topAreasNC.map(([a, n]) => (
              <tr key={a} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">{a}</td>
                <td className="px-4 py-2 text-by-gray-light">{n}</td>
              </tr>
            ))}
            {topAreasNC.length === 0 && (
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
