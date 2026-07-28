'use client'

import { useMemo, useState, useTransition } from 'react'
import { guardarCumplimientoIndicador } from '../actions'

type Item = { id: string; nave: string; tipo: string }
type Mensual = { item_id: string; anio: number; mes: number; programado: boolean; realizado: boolean }
type Indicador = { id: string; nombre: string; meta_valor: string | null } | null

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function Tarjeta({
  titulo,
  nave,
  anio,
  mes,
  items,
  mensual,
  indicador,
  numeroIndicador,
  puedeGestionar,
}: {
  titulo: string
  nave: string
  anio: number
  mes: number
  items: Item[]
  mensual: Mensual[]
  indicador: Indicador
  numeroIndicador: number
  puedeGestionar: boolean
}) {
  const [pendiente, startTransition] = useTransition()
  const [guardado, setGuardado] = useState(false)

  const idsNave = new Set(items.filter((i) => i.nave === nave).map((i) => i.id))
  const filas = mensual.filter((m) => idsNave.has(m.item_id) && m.anio === anio && m.mes === mes)
  const programados = filas.filter((f) => f.programado).length
  const realizados = filas.filter((f) => f.realizado).length
  const pct = programados > 0 ? (realizados / programados) * 100 : 0
  const meta = indicador?.meta_valor ? Number(indicador.meta_valor) : 90
  const cumple = pct >= meta

  return (
    <div className={'rounded-xl border border-black/5 bg-white p-4'}>
      <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">{titulo} — {nave}</p>
      <div className={'mb-3 rounded-lg px-4 py-3 ' + (cumple ? 'bg-[#eaf5f0]' : 'bg-[#fdecea]')}>
        <p className={'mb-1 text-[11px] opacity-80 ' + (cumple ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>
          Cumplimiento {MESES[mes - 1]} {anio} (meta {meta}%)
        </p>
        <p className={'text-[24px] font-medium ' + (cumple ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>{pct.toFixed(1)}%</p>
        <p className="text-[11px] text-by-gray-light">{realizados} de {programados} actividades programadas</p>
      </div>
      {puedeGestionar && indicador && programados > 0 && (
        <button
          onClick={() =>
            startTransition(async () => {
              await guardarCumplimientoIndicador(indicador.id, anio, mes, Number(pct.toFixed(2)))
              setGuardado(true)
            })
          }
          disabled={pendiente}
          className="h-8 rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {pendiente ? 'Guardando…' : guardado ? 'Guardado ✓' : `Guardar en Indicador #${numeroIndicador}`}
        </button>
      )}
    </div>
  )
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
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)

  const naves = useMemo(() => [...new Set(catalogo.map((c) => c.nave))].sort(), [catalogo])
  const navesFinal = naves.length ? naves : ['Nave 1', 'Nave 2']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Métricas de Mantenimiento y Limpieza</p>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
            {MESES.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
            {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[12px] font-medium text-by-gray-dark">Programa de Mantenimiento (Indicador #18, meta {indicadorMantenimiento?.meta_valor ?? 90}%)</p>
      <div className="grid grid-cols-2 gap-3">
        {navesFinal.map((n) => (
          <Tarjeta
            key={'mant-' + n}
            titulo="Mantenimiento"
            nave={n}
            anio={anio}
            mes={mes}
            items={catalogo.filter((c) => c.tipo === 'mantenimiento')}
            mensual={mensual}
            indicador={indicadorMantenimiento}
            numeroIndicador={18}
            puedeGestionar={puedeGestionar}
          />
        ))}
      </div>

      <p className="mt-2 text-[12px] font-medium text-by-gray-dark">Checklist de Limpieza (Indicador #11, meta {indicadorLimpieza?.meta_valor ?? 85}%)</p>
      <div className="grid grid-cols-2 gap-3">
        {navesFinal.map((n) => (
          <Tarjeta
            key={'limp-' + n}
            titulo="Limpieza"
            nave={n}
            anio={anio}
            mes={mes}
            items={catalogo.filter((c) => c.tipo === 'limpieza')}
            mensual={mensual}
            indicador={indicadorLimpieza}
            numeroIndicador={11}
            puedeGestionar={puedeGestionar}
          />
        ))}
      </div>
    </div>
  )
}
