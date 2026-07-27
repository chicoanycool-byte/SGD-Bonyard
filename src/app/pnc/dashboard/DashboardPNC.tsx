'use client'

import { useMemo, useState } from 'react'

type Registro = {
  id: string
  folio: string | null
  tipo: string
  fecha: string
  cliente: string | null
  nombre_producto: string | null
  tipo_equipo: string | null
  tipo_falla: string | null
  nombre_proveedor: string | null
  disposicion: string | null
  estatus: string
  creado_en: string
}

const TIPO_LABEL: Record<string, string> = {
  producto: 'Producto',
  equipo: 'Equipo',
}

export default function DashboardPNC({ registros }: { registros: Registro[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [estatus, setEstatus] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (
        busqueda &&
        !`${r.cliente ?? ''} ${r.nombre_producto ?? ''} ${r.nombre_proveedor ?? ''} ${r.folio ?? ''}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      )
        return false
      if (tipo && r.tipo !== tipo) return false
      if (estatus && r.estatus !== estatus) return false
      if (desde && r.fecha < desde) return false
      if (hasta && r.fecha > hasta) return false
      return true
    })
  }, [registros, busqueda, tipo, estatus, desde, hasta])

  const total = filtrados.length
  const abiertos = filtrados.filter((r) => r.estatus === 'abierto').length
  const cerrados = filtrados.filter((r) => r.estatus === 'cerrado').length
  const producto = filtrados.filter((r) => r.tipo === 'producto').length
  const equipo = filtrados.filter((r) => r.tipo === 'equipo').length

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Filtros</p>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Cliente / Producto / Proveedor</label>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="producto">Producto</option>
              <option value="equipo">Equipo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Estatus</label>
            <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
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
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setBusqueda('')
              setTipo('')
              setEstatus('')
              setDesde('')
              setHasta('')
            }}
            className="h-8 rounded-md border border-black/10 px-3 text-[12.5px] text-by-gray-dark hover:bg-black/5"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <button
          onClick={() => {
            setEstatus('')
            setTipo('')
          }}
          className={
            'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
            (estatus === '' && tipo === '' ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Registros (filtro actual)</p>
          <p className="text-[24px] font-medium">{total}</p>
        </button>
        <button
          onClick={() => setEstatus(estatus === 'abierto' ? '' : 'abierto')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (estatus === 'abierto' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Abiertos</p>
          <p className="text-[24px] font-medium">{abiertos}</p>
        </button>
        <button
          onClick={() => setEstatus(estatus === 'cerrado' ? '' : 'cerrado')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3d6b53] transition ' +
            (estatus === 'cerrado' ? 'bg-[#d3ecdf] ring-2 ring-[#3d6b53]/40' : 'bg-[#eaf5f0] hover:bg-[#dff0e7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Cerrados</p>
          <p className="text-[24px] font-medium">{cerrados}</p>
        </button>
        <button
          onClick={() => setTipo(tipo === 'producto' ? '' : 'producto')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#6b4fa0] transition ' +
            (tipo === 'producto' ? 'bg-[#e2d7f4] ring-2 ring-[#6b4fa0]/40' : 'bg-[#f0eafa] hover:bg-[#e6ddf6]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Producto</p>
          <p className="text-[24px] font-medium">{producto}</p>
        </button>
        <button
          onClick={() => setTipo(tipo === 'equipo' ? '' : 'equipo')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3c6ba1] transition ' +
            (tipo === 'equipo' ? 'bg-[#d3e4f4] ring-2 ring-[#3c6ba1]/40' : 'bg-[#eaf1fa] hover:bg-[#deebf7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Equipo</p>
          <p className="text-[24px] font-medium">{equipo}</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Cliente / Equipo</th>
              <th className="px-3 py-2 font-normal">Producto / Falla</th>
              <th className="px-3 py-2 font-normal">Proveedor</th>
              <th className="px-3 py-2 font-normal">Disposición</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{r.folio ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-dark">{TIPO_LABEL[r.tipo] ?? r.tipo}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {r.tipo === 'producto' ? (r.cliente ?? '—') : (r.tipo_equipo ?? '—')}
                </td>
                <td className="px-3 py-2 text-by-gray-light">
                  {r.tipo === 'producto' ? (r.nombre_producto ?? '—') : (r.tipo_falla ?? '—')}
                </td>
                <td className="px-3 py-2 text-by-gray-light">{r.nombre_proveedor ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{r.disposicion ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {new Date(r.fecha).toLocaleDateString('es-MX')}
                </td>
                <td className="px-3 py-2">
                  {r.estatus === 'cerrado' ? (
                    <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">Cerrado</span>
                  ) : (
                    <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">Abierto</span>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay registros que coincidan con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
