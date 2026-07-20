'use client'

import { useMemo, useState } from 'react'

type Accion = {
  id: string
  folio: string | null
  tipo_accion: string
  descripcion: string
  estatus: string
  fecha_compromiso: string | null
  fecha_cierre: string | null
  creado_en: string
  responsable_nombre: string | null
}

const ESTATUS_LABEL: Record<string, string> = {
  abierta: 'Sin plan',
  en_proceso: 'En proceso',
  en_validacion: 'En validación',
  cerrada: 'Cerrada',
  rechazada: 'Rechazada',
}

function trimestreDe(fecha: Date) {
  return `Q${Math.floor(fecha.getMonth() / 3) + 1} ${fecha.getFullYear()}`
}

export default function DashboardAcAp({ acciones }: { acciones: Accion[] }) {
  const [tipo, setTipo] = useState('')
  const [responsable, setResponsable] = useState('')
  const [estatus, setEstatus] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const responsables = useMemo(
    () => [...new Set(acciones.map((a) => a.responsable_nombre).filter(Boolean) as string[])].sort(),
    [acciones]
  )

  const filtradas = useMemo(() => {
    return acciones.filter((a) => {
      if (tipo && a.tipo_accion !== tipo) return false
      if (responsable && a.responsable_nombre !== responsable) return false
      if (estatus && a.estatus !== estatus) return false
      if (desde && a.creado_en < desde) return false
      if (hasta && a.creado_en > hasta + 'T23:59:59') return false
      return true
    })
  }, [acciones, tipo, responsable, estatus, desde, hasta])

  const abiertas = filtradas.filter((a) => a.estatus !== 'cerrada' && a.estatus !== 'rechazada').length
  const cerradas = filtradas.filter((a) => a.estatus === 'cerrada')
  const cerradasEnTiempo = cerradas.filter(
    (a) => a.fecha_cierre && a.fecha_compromiso && a.fecha_cierre <= a.fecha_compromiso + 'T23:59:59'
  ).length
  const porcentajeEnTiempo =
    cerradas.length > 0 ? Math.round((cerradasEnTiempo / cerradas.length) * 100) : null
  const diasPromedioCierre =
    cerradas.length > 0
      ? Math.round(
          cerradas.reduce(
            (acc, a) =>
              acc + (new Date(a.fecha_cierre!).getTime() - new Date(a.creado_en).getTime()) / 86400000,
            0
          ) / cerradas.length
        )
      : null

  const porPeriodo = useMemo(() => {
    const grupos = new Map<string, Accion[]>()
    for (const a of filtradas) {
      const clave = trimestreDe(new Date(a.creado_en))
      if (!grupos.has(clave)) grupos.set(clave, [])
      grupos.get(clave)!.push(a)
    }
    return [...grupos.entries()]
      .map(([periodo, lista]) => {
        const cerradasP = lista.filter((a) => a.estatus === 'cerrada')
        const enTiempoP = cerradasP.filter(
          (a) => a.fecha_cierre && a.fecha_compromiso && a.fecha_cierre <= a.fecha_compromiso + 'T23:59:59'
        ).length
        return {
          periodo,
          total: lista.length,
          abiertas: lista.filter((a) => a.estatus !== 'cerrada' && a.estatus !== 'rechazada').length,
          cerradas: cerradasP.length,
          porcentajeEnTiempo: cerradasP.length > 0 ? Math.round((enTiempoP / cerradasP.length) * 100) : null,
        }
      })
      .sort((a, b) => (a.periodo < b.periodo ? -1 : 1))
  }, [filtradas])

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Filtros</p>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="correctiva">Correctiva</option>
              <option value="preventiva">Preventiva</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Responsable</label>
            <select value={responsable} onChange={(e) => setResponsable(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {responsables.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Estatus</label>
            <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="abierta">Sin plan</option>
              <option value="en_proceso">En proceso</option>
              <option value="en_validacion">En validación</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
          </div>
        </div>
        <button
          onClick={() => {
            setTipo('')
            setResponsable('')
            setEstatus('')
            setDesde('')
            setHasta('')
          }}
          className="mt-3 h-8 rounded-md border border-black/10 px-3 text-[12.5px] text-by-gray-dark hover:bg-black/5"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
          <p className="mb-1 text-[11px] opacity-80">Total (filtro actual)</p>
          <p className="text-[24px] font-medium">{filtradas.length}</p>
        </div>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
          <p className="mb-1 text-[11px] opacity-80">Abiertas</p>
          <p className="text-[24px] font-medium">{abiertas}</p>
        </div>
        <div className="rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53]">
          <p className="mb-1 text-[11px] opacity-80">Cerradas en tiempo</p>
          <p className="text-[24px] font-medium">
            {porcentajeEnTiempo !== null ? `${porcentajeEnTiempo}%` : '—'}
          </p>
          <p className="text-[10.5px] opacity-70">{cerradasEnTiempo}/{cerradas.length} cerradas</p>
        </div>
        <div className="rounded-lg bg-[#e6f0fa] px-4 py-3 text-[#2d5f8a]">
          <p className="mb-1 text-[11px] opacity-80">Días prom. de cierre</p>
          <p className="text-[24px] font-medium">{diasPromedioCierre ?? '—'}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Por periodo (trimestral)</p>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Periodo</th>
              <th className="px-4 py-2 font-normal">Total</th>
              <th className="px-4 py-2 font-normal">Abiertas</th>
              <th className="px-4 py-2 font-normal">Cerradas</th>
              <th className="px-4 py-2 font-normal">% en tiempo</th>
            </tr>
          </thead>
          <tbody>
            {porPeriodo.map((p) => (
              <tr key={p.periodo} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">{p.periodo}</td>
                <td className="px-4 py-2 text-by-gray-light">{p.total}</td>
                <td className="px-4 py-2 text-by-gray-light">{p.abiertas}</td>
                <td className="px-4 py-2 text-by-gray-light">{p.cerradas}</td>
                <td className="px-4 py-2 text-by-gray-light">
                  {p.porcentajeEnTiempo !== null ? `${p.porcentajeEnTiempo}%` : '—'}
                </td>
              </tr>
            ))}
            {porPeriodo.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Sin datos para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Descripción</th>
              <th className="px-3 py-2 font-normal">Responsable</th>
              <th className="px-3 py-2 font-normal">F. inicio</th>
              <th className="px-3 py-2 font-normal">F. compromiso</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((a) => (
              <tr key={a.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{a.folio ?? '—'}</td>
                <td className="px-3 py-2 capitalize text-by-gray-light">{a.tipo_accion}</td>
                <td className="max-w-[320px] px-3 py-2 text-by-gray-dark">{a.descripcion}</td>
                <td className="px-3 py-2 text-by-gray-light">{a.responsable_nombre ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {new Date(a.creado_en).toLocaleDateString('es-MX')}
                </td>
                <td className="px-3 py-2 text-by-gray-light">
                  {a.fecha_compromiso
                    ? new Date(a.fecha_compromiso + 'T00:00:00').toLocaleDateString('es-MX')
                    : '—'}
                </td>
                <td className="px-3 py-2 text-by-gray-light">
                  {ESTATUS_LABEL[a.estatus] ?? a.estatus}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay acciones que coincidan con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
