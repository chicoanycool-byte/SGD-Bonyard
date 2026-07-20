'use client'

import { useMemo, useState } from 'react'

type Queja = {
  id: string
  folio: string | null
  nombre_cliente: string
  servicio: string
  criticidad: string | null
  tipo_queja: string
  estatus: string
  escalada_ac: boolean
  fecha_limite: string | null
  fecha_cierre: string | null
  creado_en: string
  responsable_nombre: string | null
}

const SERVICIO_LABEL: Record<string, string> = {
  almacenaje: 'Almacenaje',
  transporte: 'Transporte',
  seguro_mercancia: 'Seguro de mercancía',
}

export default function DashboardQuejas({ quejas }: { quejas: Queja[] }) {
  const [cliente, setCliente] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [servicio, setServicio] = useState('')
  const [criticidad, setCriticidad] = useState('')
  const [tipoQueja, setTipoQueja] = useState('')
  const [responsable, setResponsable] = useState('')

  const tiposQueja = useMemo(
    () => [...new Set(quejas.map((q) => q.tipo_queja))].sort(),
    [quejas]
  )
  const responsables = useMemo(
    () => [...new Set(quejas.map((q) => q.responsable_nombre).filter(Boolean) as string[])].sort(),
    [quejas]
  )

  const filtradas = useMemo(() => {
    return quejas.filter((q) => {
      if (cliente && !q.nombre_cliente.toLowerCase().includes(cliente.toLowerCase())) return false
      if (desde && q.creado_en < desde) return false
      if (hasta && q.creado_en > hasta + 'T23:59:59') return false
      if (servicio && q.servicio !== servicio) return false
      if (criticidad && q.criticidad !== criticidad) return false
      if (tipoQueja && q.tipo_queja !== tipoQueja) return false
      if (responsable && q.responsable_nombre !== responsable) return false
      return true
    })
  }, [quejas, cliente, desde, hasta, servicio, criticidad, tipoQueja, responsable])

  const total = filtradas.length
  const cerradas = filtradas.filter((q) => q.estatus === 'cerrada')
  const cerradasEnTiempo = cerradas.filter(
    (q) => q.fecha_cierre && q.fecha_limite && q.fecha_cierre <= q.fecha_limite + 'T23:59:59'
  ).length
  const porcentajeEnTiempo =
    cerradas.length > 0 ? Math.round((cerradasEnTiempo / cerradas.length) * 100) : null
  const escaladas = filtradas.filter((q) => q.escalada_ac).length

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Filtros</p>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Cliente</label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Buscar cliente…"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Servicio</label>
            <select value={servicio} onChange={(e) => setServicio(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="almacenaje">Almacenaje</option>
              <option value="transporte">Transporte</option>
              <option value="seguro_mercancia">Seguro de mercancía</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Criticidad</label>
            <select value={criticidad} onChange={(e) => setCriticidad(e.target.value)} className={inputCls}>
              <option value="">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de queja</label>
            <select value={tipoQueja} onChange={(e) => setTipoQueja(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {tiposQueja.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setCliente('')
                setDesde('')
                setHasta('')
                setServicio('')
                setCriticidad('')
                setTipoQueja('')
                setResponsable('')
              }}
              className="h-8 rounded-md border border-black/10 px-3 text-[12.5px] text-by-gray-dark hover:bg-black/5"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
          <p className="mb-1 text-[11px] opacity-80">Quejas (filtro actual)</p>
          <p className="text-[24px] font-medium">{total}</p>
        </div>
        <div className="rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53]">
          <p className="mb-1 text-[11px] opacity-80">Cerradas en tiempo (PSG-03)</p>
          <p className="text-[24px] font-medium">
            {porcentajeEnTiempo !== null ? `${porcentajeEnTiempo}%` : '—'}
          </p>
          <p className="text-[10.5px] opacity-70">
            {cerradasEnTiempo}/{cerradas.length} cerradas
          </p>
        </div>
        <div className="rounded-lg bg-[#f0eafa] px-4 py-3 text-[#6b4fa0]">
          <p className="mb-1 text-[11px] opacity-80">Escaladas a AC</p>
          <p className="text-[24px] font-medium">{escaladas}</p>
        </div>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
          <p className="mb-1 text-[11px] opacity-80">Abiertas</p>
          <p className="text-[24px] font-medium">
            {filtradas.filter((q) => q.estatus !== 'cerrada' && q.estatus !== 'no_procede').length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Cliente</th>
              <th className="px-3 py-2 font-normal">Servicio</th>
              <th className="px-3 py-2 font-normal">Criticidad</th>
              <th className="px-3 py-2 font-normal">Responsable</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Cierre</th>
              <th className="px-3 py-2 font-normal">¿En tiempo?</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((q) => {
              const enTiempo =
                q.estatus === 'cerrada' && q.fecha_cierre && q.fecha_limite
                  ? q.fecha_cierre <= q.fecha_limite + 'T23:59:59'
                  : null
              return (
                <tr key={q.id} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-light">{q.folio ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-dark">{q.nombre_cliente}</td>
                  <td className="px-3 py-2 text-by-gray-light">
                    {SERVICIO_LABEL[q.servicio] ?? q.servicio}
                  </td>
                  <td className="px-3 py-2 capitalize text-by-gray-light">{q.criticidad ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">{q.responsable_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">
                    {new Date(q.creado_en).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-3 py-2 text-by-gray-light">
                    {q.fecha_cierre ? new Date(q.fecha_cierre).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {enTiempo === null ? (
                      <span className="text-by-gray-light">—</span>
                    ) : enTiempo ? (
                      <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">Sí</span>
                    ) : (
                      <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">No</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay quejas que coincidan con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
