'use client'

import { useMemo, useState, useTransition } from 'react'
import { guardarCumplimientoIndicador } from '../actions'

type Item = { id: string; nave: string; tipo: string; nombre: string; orden: number | null }
type Mensual = { item_id: string; anio: number; mes: number; programado: boolean; realizado: boolean }
type Indicador = { id: string; nombre: string; meta_valor: string | null; periodo: string | null; meses_activos: string[] | null } | null

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MES_ABREV_NUM: Record<string, number> = {
  Ene: 1, Feb: 2, Mar: 3, Abr: 4, May: 5, Jun: 6, Jul: 7, Ago: 8, Sep: 9, Oct: 10, Nov: 11, Dic: 12,
}

function pct(real: number, prog: number) {
  return prog > 0 ? (real / prog) * 100 : null
}

function periodosDelIndicador(indicador: Indicador) {
  const activos = (indicador?.meses_activos ?? [])
    .map((m) => MES_ABREV_NUM[m])
    .filter((n): n is number => !!n)
    .sort((a, b) => a - b)
  if (indicador?.periodo === 'trimestral') {
    return activos.map((mesFin) => ({
      mesPush: mesFin,
      meses: [mesFin - 2, mesFin - 1, mesFin],
      label: `Trimestre ${MESES_LARGO[mesFin - 3]}–${MESES_LARGO[mesFin - 1]}`,
    }))
  }
  return activos.map((mes) => ({ mesPush: mes, meses: [mes], label: MESES_LARGO[mes - 1] }))
}

export default function MetricasMantenimientoClient({
  puedeGestionar,
  catalogo,
  mensual,
  indicadorMantenimiento,
}: {
  puedeGestionar: boolean
  catalogo: Item[]
  mensual: Mensual[]
  indicadorMantenimiento: Indicador
  indicadorLimpieza?: Indicador
}) {
  const hoy = new Date()
  const tipo = 'mantenimiento' as const
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [pendiente, startTransition] = useTransition()
  const [guardados, setGuardados] = useState<Set<string>>(new Set())

  const indicador = indicadorMantenimiento
  const numeroIndicador = 18
  const periodos = useMemo(() => periodosDelIndicador(indicador), [indicador])

  const itemsTipo = useMemo(() => catalogo.filter((c) => c.tipo === tipo), [catalogo])
  const naves = useMemo(() => [...new Set(itemsTipo.map((c) => c.nave))].sort(), [itemsTipo])
  const naveIds = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const it of itemsTipo) {
      if (!map.has(it.nave)) map.set(it.nave, new Set())
      map.get(it.nave)!.add(it.id)
    }
    return map
  }, [itemsTipo])

  const mensualAnio = useMemo(() => mensual.filter((m) => m.anio === anio), [mensual, anio])

  function pctMes(nave: string, mes: number) {
    const ids = naveIds.get(nave) ?? new Set()
    const filas = mensualAnio.filter((m) => ids.has(m.item_id) && m.mes === mes)
    const prog = filas.filter((f) => f.programado).length
    const real = filas.filter((f) => f.realizado).length
    return pct(real, prog)
  }

  // ---------- Sección 1: Cumplimiento general por nave (anual, informativo) ----------
  const generalPorNave = naves.map((nave) => {
    const ids = naveIds.get(nave) ?? new Set()
    const filas = mensualAnio.filter((m) => ids.has(m.item_id))
    const prog = filas.filter((f) => f.programado).length
    const real = filas.filter((f) => f.realizado).length
    return { nave, prog, real, pct: pct(real, prog) }
  })
  const totalProg = generalPorNave.reduce((a, b) => a + b.prog, 0)
  const totalReal = generalPorNave.reduce((a, b) => a + b.real, 0)

  // ---------- Sección 2: Cumplimiento por mes ----------
  const porMes = naves.map((nave) => ({
    nave,
    meses: MESES.map((_, idx) => pctMes(nave, idx + 1)),
  }))

  // ---------- Sección 3: Cumplimiento por equipo ----------
  const porEquipo = naves.flatMap((nave) => {
    const items = itemsTipo.filter((it) => it.nave === nave).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    return items.map((it) => {
      const filas = mensualAnio.filter((m) => m.item_id === it.id)
      const prog = filas.filter((f) => f.programado).length
      const real = filas.filter((f) => f.realizado).length
      return { nave, nombre: it.nombre, prog, real, pct: pct(real, prog) }
    })
  })

  // ---------- Promedio por trimestre (o periodo) por nave, para envío al tablero ----------
  const promediosPorNave = naves.map((nave) => {
    const filasPeriodo = periodos.map((periodo) => {
      const valoresMensuales = periodo.meses.map((mes) => pctMes(nave, mes))
      const completo = valoresMensuales.every((v) => v != null)
      const promedio = completo
        ? valoresMensuales.reduce((a, b) => a + (b as number), 0) / valoresMensuales.length
        : null
      return { periodo, valoresMensuales, completo, promedio }
    })
    return { nave, filasPeriodo }
  })

  const meta = indicador?.meta_valor ? Number(indicador.meta_valor) : 90

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Métricas de Mantenimiento</p>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
          {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Envío automático al tablero, por periodo */}
      {puedeGestionar && indicador && (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <div className="border-b border-black/5 px-4 py-2">
            <p className="text-[12.5px] font-medium text-by-gray-dark">
              Envío al tablero de Indicadores — Indicador #{numeroIndicador} ({indicador.nombre}), periodicidad{' '}
              <span className="capitalize">{indicador.periodo ?? 'mensual'}</span>
            </p>
            <p className="mt-0.5 text-[10.5px] text-by-gray-light">
              El valor de cada periodo es el promedio del % de cumplimiento de sus meses. El botón aparece automáticamente en cuanto los meses del periodo tienen datos.
            </p>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                <th className="px-3 py-2 font-normal">Nave</th>
                <th className="px-3 py-2 font-normal">Periodo</th>
                <th className="px-3 py-2 font-normal">Meses que lo integran</th>
                <th className="px-3 py-2 font-normal">Promedio</th>
                <th className="px-3 py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {promediosPorNave.flatMap(({ nave, filasPeriodo }) =>
                filasPeriodo.map((fp, idx) => {
                  const key = `${nave}-${anio}-${fp.periodo.mesPush}`
                  const yaGuardado = guardados.has(key)
                  return (
                    <tr key={key} className="border-b border-black/5 last:border-0">
                      <td className="px-3 py-2 text-by-gray-dark">{nave}</td>
                      <td className="px-3 py-2 text-by-gray-light">{fp.periodo.label}</td>
                      <td className="px-3 py-2 text-by-gray-light">
                        {fp.periodo.meses.map((m, i) => (
                          <span key={m} className="mr-2">
                            {MESES_LARGO[m - 1].slice(0, 3)}: {fp.valoresMensuales[i] != null ? `${fp.valoresMensuales[i]!.toFixed(0)}%` : '—'}
                          </span>
                        ))}
                      </td>
                      <td className="px-3 py-2">
                        {fp.promedio != null ? (
                          <span className={'font-medium ' + (fp.promedio >= meta ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>
                            {fp.promedio.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-by-gray-light">Incompleto</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {fp.promedio != null && (
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await guardarCumplimientoIndicador(indicador.id, anio, fp.periodo.mesPush, Number(fp.promedio!.toFixed(2)))
                                setGuardados((prev) => new Set(prev).add(key))
                              })
                            }
                            disabled={pendiente}
                            className="text-[11px] text-by-accent hover:underline"
                          >
                            {yaGuardado ? 'Guardado ✓' : 'Guardar en el tablero'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sección: General por nave (informativo, todo el año) */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Cumplimiento acumulado del año — {anio}</p>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Actividades programadas</th>
              <th className="px-3 py-2 font-normal">Actividades realizadas</th>
              <th className="px-3 py-2 font-normal">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {generalPorNave.map((g) => {
              const cumple = (g.pct ?? 0) >= meta
              return (
                <tr key={g.nave} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-dark">{g.nave}</td>
                  <td className="px-3 py-2 text-by-gray-light">{g.prog}</td>
                  <td className="px-3 py-2 text-by-gray-light">{g.real}</td>
                  <td className="px-3 py-2">
                    <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (cumple ? 'bg-[#eaf5f0] text-[#3d6b53]' : 'bg-[#fdecea] text-[#a13c33]')}>
                      {g.pct != null ? `${g.pct.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
            <tr className="bg-[#f9faf9] font-medium">
              <td className="px-3 py-2 text-by-gray-dark">TOTAL</td>
              <td className="px-3 py-2 text-by-gray-dark">{totalProg}</td>
              <td className="px-3 py-2 text-by-gray-dark">{totalReal}</td>
              <td className="px-3 py-2 text-by-gray-dark">{pct(totalReal, totalProg)?.toFixed(1) ?? '—'}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sección: Por mes */}
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Cumplimiento por mes</p>
        </div>
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              {MESES.map((m) => (
                <th key={m} className="px-2 py-2 text-center font-normal">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {porMes.map((row) => (
              <tr key={row.nave} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-dark">{row.nave}</td>
                {row.meses.map((v, idx) => (
                  <td key={idx} className="px-2 py-2 text-center" title={MESES_LARGO[idx]}>
                    {v != null ? (
                      <span className={v >= meta ? 'text-[#3d6b53]' : 'text-[#a13c33]'}>{v.toFixed(0)}%</span>
                    ) : (
                      <span className="text-by-gray-light">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sección: Por equipo */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Cumplimiento por equipo</p>
        </div>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Equipo</th>
              <th className="px-3 py-2 font-normal">Programadas</th>
              <th className="px-3 py-2 font-normal">Realizadas</th>
              <th className="px-3 py-2 font-normal">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {porEquipo.map((e, idx) => (
              <tr key={idx} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{e.nave}</td>
                <td className="px-3 py-2 text-by-gray-dark">{e.nombre}</td>
                <td className="px-3 py-2 text-by-gray-light">{e.prog}</td>
                <td className="px-3 py-2 text-by-gray-light">{e.real}</td>
                <td className="px-3 py-2">
                  {e.pct != null ? (
                    <span className={e.pct >= meta ? 'text-[#3d6b53]' : 'text-[#a13c33]'}>{e.pct.toFixed(0)}%</span>
                  ) : (
                    <span className="text-by-gray-light">—</span>
                  )}
                </td>
              </tr>
            ))}
            {porEquipo.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin elementos capturados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
