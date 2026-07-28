'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { guardarCumplimientoIndicador } from '../actions'

type Item = { id: string; nave: string; tipo: string; nombre: string; orden: number | null }
type Mensual = { item_id: string; anio: number; mes: number; programado: boolean; realizado: boolean }
type Indicador = { id: string; nombre: string; meta_valor: string | null; periodo: string | null; meses_activos: string[] | null } | null

const MES_ABREV_NUM: Record<string, number> = {
  Ene: 1, Feb: 2, Mar: 3, Abr: 4, May: 5, Jun: 6, Jul: 7, Ago: 8, Sep: 9, Oct: 10, Nov: 11, Dic: 12,
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
      label: `Trimestre — cierra ${MESES_LARGO[mesFin - 1]}`,
    }))
  }
  return activos.map((mes) => ({ mesPush: mes, meses: [mes], label: MESES_LARGO[mes - 1] }))
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function pct(real: number, prog: number) {
  return prog > 0 ? (real / prog) * 100 : null
}

export default function MetricasMantenimientoClient({
  puedeGestionar,
  catalogo,
  mensual,
  indicadorMantenimiento,
  indicadorLimpieza,
}: {
  puedeGestionar: boolean
  catalogo: Item[]
  mensual: Mensual[]
  indicadorMantenimiento: Indicador
  indicadorLimpieza: Indicador
}) {
  const hoy = new Date()
  const [tipo, setTipo] = useState<'mantenimiento' | 'limpieza'>('mantenimiento')
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [pendiente, startTransition] = useTransition()
  const [guardadoNave, setGuardadoNave] = useState<string | null>(null)

  const indicador = tipo === 'mantenimiento' ? indicadorMantenimiento : indicadorLimpieza
  const numeroIndicador = tipo === 'mantenimiento' ? 18 : 11
  const periodos = useMemo(() => periodosDelIndicador(indicador), [indicador])
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const periodoActivo = periodos[Math.min(periodoIdx, Math.max(periodos.length - 1, 0))] ?? null

  useEffect(() => {
    const mesActual = new Date().getMonth() + 1
    let idx = periodos.findIndex((p) => p.mesPush >= mesActual)
    if (idx === -1) idx = periodos.length - 1
    setPeriodoIdx(idx < 0 ? 0 : idx)
    setGuardadoNave(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

  const itemsTipo = useMemo(() => catalogo.filter((c) => c.tipo === tipo), [catalogo, tipo])
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

  // ---------- Sección 1: Cumplimiento general por nave ----------
  const generalPorNave = naves.map((nave) => {
    const ids = naveIds.get(nave) ?? new Set()
    const filas = mensualAnio.filter((m) => ids.has(m.item_id))
    const prog = filas.filter((f) => f.programado).length
    const real = filas.filter((f) => f.realizado).length
    return { nave, prog, real, pct: pct(real, prog) }
  })
  const totalProg = generalPorNave.reduce((a, b) => a + b.prog, 0)
  const totalReal = generalPorNave.reduce((a, b) => a + b.real, 0)

  // Cumplimiento agregado del periodo seleccionado (respeta periodicidad del indicador)
  const generalPorNavePeriodo = naves.map((nave) => {
    const ids = naveIds.get(nave) ?? new Set()
    const mesesSet = new Set(periodoActivo?.meses ?? [])
    const filas = mensualAnio.filter((m) => ids.has(m.item_id) && mesesSet.has(m.mes))
    const prog = filas.filter((f) => f.programado).length
    const real = filas.filter((f) => f.realizado).length
    return { nave, prog, real, pct: pct(real, prog) }
  })

  // ---------- Sección 2: Cumplimiento por mes ----------
  const porMes = naves.map((nave) => {
    const ids = naveIds.get(nave) ?? new Set()
    const meses = MESES.map((_, idx) => {
      const mes = idx + 1
      const filas = mensualAnio.filter((m) => ids.has(m.item_id) && m.mes === mes)
      const prog = filas.filter((f) => f.programado).length
      const real = filas.filter((f) => f.realizado).length
      return pct(real, prog)
    })
    return { nave, meses }
  })

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

  const meta = indicador?.meta_valor ? Number(indicador.meta_valor) : tipo === 'mantenimiento' ? 90 : 85

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Métricas — Resumen de Cumplimiento</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTipo('mantenimiento')}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (tipo === 'mantenimiento' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              Mantenimiento
            </button>
            <button
              onClick={() => setTipo('limpieza')}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (tipo === 'limpieza' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              Limpieza
            </button>
          </div>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
            {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sección 1: General por nave */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Cumplimiento general por nave — {anio}</p>
          {puedeGestionar && indicador && periodos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-by-gray-light">
                Periodicidad del indicador: <strong className="capitalize">{indicador.periodo ?? 'mensual'}</strong>
              </span>
              <select
                value={periodoIdx}
                onChange={(e) => {
                  setPeriodoIdx(Number(e.target.value))
                  setGuardadoNave(null)
                }}
                className="h-7 rounded-md border border-black/10 px-2 text-[11px]"
              >
                {periodos.map((p, idx) => (
                  <option key={idx} value={idx}>{p.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Actividades programadas ({anio})</th>
              <th className="px-3 py-2 font-normal">Actividades realizadas ({anio})</th>
              <th className="px-3 py-2 font-normal">% Cumplimiento anual</th>
              {puedeGestionar && indicador && periodoActivo && <th className="px-3 py-2 font-normal">Guardar en Indicador #{numeroIndicador}</th>}
            </tr>
          </thead>
          <tbody>
            {generalPorNave.map((g) => {
              const cumple = (g.pct ?? 0) >= meta
              const gPeriodo = generalPorNavePeriodo.find((x) => x.nave === g.nave) ?? null
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
                  {puedeGestionar && indicador && periodoActivo && (
                    <td className="px-3 py-2">
                      {gPeriodo && gPeriodo.pct != null ? (
                        <button
                          onClick={() =>
                            startTransition(async () => {
                              await guardarCumplimientoIndicador(indicador.id, anio, periodoActivo.mesPush, Number(gPeriodo.pct!.toFixed(2)))
                              setGuardadoNave(g.nave)
                            })
                          }
                          disabled={pendiente}
                          className="text-[11px] text-by-accent hover:underline"
                        >
                          {guardadoNave === g.nave ? 'Guardado ✓' : `${gPeriodo.pct.toFixed(1)}% → guardar`}
                        </button>
                      ) : (
                        <span className="text-[11px] text-by-gray-light">Sin datos en el periodo</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
            <tr className="bg-[#f9faf9] font-medium">
              <td className="px-3 py-2 text-by-gray-dark">TOTAL</td>
              <td className="px-3 py-2 text-by-gray-dark">{totalProg}</td>
              <td className="px-3 py-2 text-by-gray-dark">{totalReal}</td>
              <td className="px-3 py-2 text-by-gray-dark">{pct(totalReal, totalProg)?.toFixed(1) ?? '—'}%</td>
              {puedeGestionar && indicador && periodoActivo && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sección 2: Por mes */}
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Cumplimiento por mes (solo meses con actividad programada)</p>
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

      {/* Sección 3: Por equipo */}
      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">
            Cumplimiento por {tipo === 'limpieza' ? 'área' : 'equipo'}
          </p>
        </div>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">{tipo === 'limpieza' ? 'Área' : 'Equipo'}</th>
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
