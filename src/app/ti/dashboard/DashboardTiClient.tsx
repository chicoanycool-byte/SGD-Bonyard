'use client'

import { useMemo, useState, useTransition } from 'react'
import { guardarDisponibilidadIndicador } from '../actions'

type Incidente = { id: string; sistema: string; fecha_inicio: string; fecha_fin: string | null; titulo: string }
type Indicador = { id: string; nombre: string; meta_valor: string | null } | null

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function diasEnMes(anio: number, mes: number) {
  return new Date(anio, mes, 0).getDate()
}

export default function DashboardTiClient({
  puedeGestionar,
  incidentes,
  indicador,
}: {
  puedeGestionar: boolean
  incidentes: Incidente[]
  indicador: Indicador
}) {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [pendiente, startTransition] = useTransition()
  const [guardado, setGuardado] = useState(false)

  const { minutosCaidos, incidentesMes } = useMemo(() => {
    const inicioMes = new Date(anio, mes - 1, 1)
    const finMes = new Date(anio, mes, 1)
    let total = 0
    const lista: Incidente[] = []
    for (const i of incidentes) {
      const ini = new Date(i.fecha_inicio)
      const fin = i.fecha_fin ? new Date(i.fecha_fin) : new Date()
      if (fin < inicioMes || ini >= finMes) continue
      lista.push(i)
      const iniRecorte = ini < inicioMes ? inicioMes : ini
      const finRecorte = fin > finMes ? finMes : fin
      total += Math.max(0, (finRecorte.getTime() - iniRecorte.getTime()) / 60000)
    }
    return { minutosCaidos: Math.round(total), incidentesMes: lista }
  }, [incidentes, anio, mes])

  const minutosTotales = diasEnMes(anio, mes) * 24 * 60
  const disponibilidad = Math.max(0, ((minutosTotales - minutosCaidos) / minutosTotales) * 100)
  const metaValor = indicador?.meta_valor ? Number(indicador.meta_valor) : 98
  const cumpleMeta = disponibilidad >= metaValor

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Disponibilidad de sistemas críticos (WMS/ERP)</p>
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

      <div className="grid grid-cols-3 gap-3">
        <div className={'rounded-lg px-4 py-3 ' + (cumpleMeta ? 'bg-[#eaf5f0]' : 'bg-[#fdecea]')}>
          <p className={'mb-1 text-[11px] opacity-80 ' + (cumpleMeta ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>
            Disponibilidad del mes (meta {indicador?.meta_valor ?? 98}%)
          </p>
          <p className={'text-[26px] font-medium ' + (cumpleMeta ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>
            {disponibilidad.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">Minutos caídos</p>
          <p className="text-[22px] font-medium text-by-primary">{minutosCaidos}</p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">Incidentes en el mes</p>
          <p className="text-[22px] font-medium text-by-primary">{incidentesMes.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[12.5px] font-medium text-by-gray-dark">Incidentes considerados en {MESES[mes - 1]} {anio}</p>
        </div>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Sistema</th>
              <th className="px-3 py-2 font-normal">Incidente</th>
              <th className="px-3 py-2 font-normal">Inicio</th>
              <th className="px-3 py-2 font-normal">Fin</th>
            </tr>
          </thead>
          <tbody>
            {incidentesMes.map((i) => (
              <tr key={i.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-dark">{i.sistema}</td>
                <td className="px-3 py-2 text-by-gray-light">{i.titulo}</td>
                <td className="px-3 py-2 text-by-gray-light">{new Date(i.fecha_inicio).toLocaleString('es-MX')}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {i.fecha_fin ? new Date(i.fecha_fin).toLocaleString('es-MX') : 'En curso'}
                </td>
              </tr>
            ))}
            {incidentesMes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin incidentes en este mes — 100% de disponibilidad si no hay caídas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && indicador && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] text-by-gray-dark">
            Guardar este valor en el Indicador #26 ({indicador.nombre}) del tablero general.
          </p>
          <button
            onClick={() =>
              startTransition(async () => {
                await guardarDisponibilidadIndicador(indicador.id, anio, mes, Number(disponibilidad.toFixed(2)))
                setGuardado(true)
              })
            }
            disabled={pendiente}
            className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-50"
          >
            {pendiente ? 'Guardando…' : guardado ? 'Guardado ✓' : `Guardar ${disponibilidad.toFixed(2)}% en Indicadores`}
          </button>
        </div>
      )}
    </div>
  )
}
