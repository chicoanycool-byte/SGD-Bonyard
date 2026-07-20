'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Registro = {
  id: string
  folio: string | null
  tipo: string
  fecha: string
  cliente: string | null
  proyecto: string | null
  lote: string | null
  codigo_producto: string | null
  cantidad: number | null
  numero_tarimas: number | null
  nombre_producto: string | null
  descripcion_nc: string | null
  ubicacion: string | null
  foto_path: string | null
  tipo_equipo: string | null
  tipo_falla: string | null
  descripcion_falla: string | null
  ubicacion_equipo: string | null
  nombre_proveedor: string | null
  disposicion: string | null
  responsable_disposicion: string | null
  estatus: string
}

export default function RegistroPncTabla({ registros }: { registros: Registro[] }) {
  const [tipo, setTipo] = useState('')
  const [texto, setTexto] = useState('')
  const [estatus, setEstatus] = useState('')

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (tipo && r.tipo !== tipo) return false
      if (estatus && r.estatus !== estatus) return false
      if (texto) {
        const campo = (r.cliente ?? r.nombre_proveedor ?? '').toLowerCase()
        if (!campo.includes(texto.toLowerCase())) return false
      }
      return true
    })
  }, [registros, tipo, texto, estatus])

  const inputCls =
    'h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white p-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
          <option value="">Todos los tipos</option>
          <option value="producto">Producto</option>
          <option value="equipo">Equipo</option>
        </select>
        <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className={inputCls}>
          <option value="">Todos los estatus</option>
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
        </select>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por cliente o proveedor…"
          className={inputCls + ' flex-1'}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="whitespace-nowrap px-3 py-2 font-normal">Folio</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Tipo</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Fecha</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Cliente</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Proyecto</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Lote</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Código producto</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Cantidad</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">No. tarimas</th>
              <th className="min-w-[140px] px-3 py-2 font-normal">Nombre producto</th>
              <th className="min-w-[180px] px-3 py-2 font-normal">Descripción NC</th>
              <th className="min-w-[140px] px-3 py-2 font-normal">Ubicación del PNC</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Foto</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Tipo de equipo</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Tipo de falla</th>
              <th className="min-w-[160px] px-3 py-2 font-normal">Descripción de la falla</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Ubicación equipo</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Proveedor</th>
              <th className="min-w-[160px] px-3 py-2 font-normal">Disposición</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Responsable disposición</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-dark">
                  <Link href={`/pnc/${r.id}`} className="hover:underline">
                    {r.folio ?? '—'}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2 capitalize text-by-gray-light">{r.tipo}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.cliente ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.proyecto ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.lote ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.codigo_producto ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.cantidad ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.numero_tarimas ?? '—'}</td>
                <td className="min-w-[140px] px-3 py-2 text-by-gray-light">{r.nombre_producto ?? '—'}</td>
                <td className="min-w-[180px] px-3 py-2 text-by-gray-light">{r.descripcion_nc ?? '—'}</td>
                <td className="min-w-[140px] px-3 py-2 text-by-gray-light">{r.ubicacion ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {r.foto_path ? (
                    <Link href={`/pnc/${r.id}`} className="text-by-accent hover:underline">
                      Ver foto
                    </Link>
                  ) : (
                    <span className="text-by-gray-light">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.tipo_equipo ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.tipo_falla ?? '—'}</td>
                <td className="min-w-[160px] px-3 py-2 text-by-gray-light">{r.descripcion_falla ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.ubicacion_equipo ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{r.nombre_proveedor ?? '—'}</td>
                <td className="min-w-[160px] px-3 py-2 text-by-gray-light">{r.disposicion ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {r.responsable_disposicion ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' +
                      (r.estatus === 'cerrado'
                        ? 'bg-[#eaf5f0] text-[#3d6b53]'
                        : 'bg-[#fdecea] text-[#a13c33]')
                    }
                  >
                    {r.estatus === 'cerrado' ? 'Cerrado' : 'Abierto'}
                  </span>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={20} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay registros que coincidan con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
