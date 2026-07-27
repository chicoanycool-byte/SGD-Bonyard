'use client'

import { useState, useTransition } from 'react'
import { crearOrdenMantenimiento, cerrarOrdenMantenimiento, eliminarOrdenMantenimiento } from '../actions'

type Orden = {
  id: string
  folio: string | null
  nave: string
  equipo: string
  tipo: string
  descripcion: string
  prioridad: string
  fecha_reporte: string
  fecha_cierre: string | null
  acciones: string | null
  estatus: string
  responsable_nombre: string | null
}

const PRIORIDAD_STYLE: Record<string, string> = {
  alta: 'bg-[#fdecea] text-[#a13c33]',
  media: 'bg-[#fdf3e3] text-[#9a6b1c]',
  baja: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function OrdenesMantenimientoClient({
  puedeGestionar,
  ordenes,
}: {
  puedeGestionar: boolean
  ordenes: Orden[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [cerrando, setCerrando] = useState<string | null>(null)
  const [soloAbiertas, setSoloAbiertas] = useState(false)

  const abiertas = ordenes.filter((o) => o.estatus === 'abierta').length
  const filtradas = soloAbiertas ? ordenes.filter((o) => o.estatus === 'abierta') : ordenes

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Órdenes de trabajo (mantenimiento)</p>
        <button
          onClick={() => setSoloAbiertas(!soloAbiertas)}
          className={
            'rounded-md px-3 py-1.5 text-[12px] ' +
            (soloAbiertas ? 'bg-[#fdf3e3] text-[#9a6b1c]' : 'bg-white text-by-gray-light border border-black/10')
          }
        >
          {soloAbiertas ? `Mostrando solo abiertas (${abiertas})` : `Ver solo abiertas (${abiertas})`}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Equipo</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Descripción</th>
              <th className="px-3 py-2 font-normal">Prioridad</th>
              <th className="px-3 py-2 font-normal">Reportada</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((o) => (
              <tr key={o.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="px-3 py-2 text-by-gray-light">{o.folio}</td>
                <td className="px-3 py-2 text-by-gray-light">{o.nave}</td>
                <td className="px-3 py-2 text-by-gray-dark">{o.equipo}</td>
                <td className="px-3 py-2 capitalize text-by-gray-light">{o.tipo}</td>
                <td className="max-w-[220px] px-3 py-2 text-by-gray-light">
                  {o.descripcion}
                  {o.acciones && <span className="mt-1 block text-[10.5px] text-by-gray-light">Acción: {o.acciones}</span>}
                </td>
                <td className="px-3 py-2">
                  <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (PRIORIDAD_STYLE[o.prioridad] ?? '')}>{o.prioridad}</span>
                </td>
                <td className="px-3 py-2 text-by-gray-light">{new Date(o.fecha_reporte).toLocaleDateString('es-MX')}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' +
                      (o.estatus === 'abierta' ? 'bg-[#e6f0fa] text-[#2d5f8a]' : 'bg-[#eaf5f0] text-[#3d6b53]')
                    }
                  >
                    {o.estatus === 'abierta' ? 'Abierta' : 'Cerrada'}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-3 py-2">
                    {o.estatus === 'abierta' ? (
                      cerrando === o.id ? (
                        <form
                          action={(fd) =>
                            startTransition(async () => {
                              await cerrarOrdenMantenimiento(fd)
                              setCerrando(null)
                            })
                          }
                          className="flex flex-col gap-1"
                        >
                          <input type="hidden" name="id" value={o.id} />
                          <input type="date" name="fecha_cierre" required className="h-7 rounded-md border border-black/10 px-1.5 text-[11px]" />
                          <input name="acciones" placeholder="Acción realizada" className="h-7 w-36 rounded-md border border-black/10 px-1.5 text-[11px]" />
                          <button className="text-[11px] text-by-accent hover:underline">Guardar cierre</button>
                        </form>
                      ) : (
                        <button onClick={() => setCerrando(o.id)} className="text-[11px] text-by-accent hover:underline">
                          Cerrar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => startTransition(() => eliminarOrdenMantenimiento(o.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin órdenes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form action={(fd) => startTransition(() => crearOrdenMantenimiento(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Registrar orden de trabajo</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="nave" defaultValue="Nave 1" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <select name="tipo" defaultValue="correctivo" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="correctivo">Correctivo</option>
              <option value="preventivo">Preventivo</option>
            </select>
            <select name="prioridad" defaultValue="media" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <input name="equipo" placeholder="Equipo / área afectada" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="fecha_reporte" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="descripcion" placeholder="Descripción de la falla" required rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
