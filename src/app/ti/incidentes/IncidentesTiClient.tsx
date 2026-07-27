'use client'

import { useState, useTransition } from 'react'
import { crearIncidenteTi, cerrarIncidenteTi, eliminarIncidenteTi } from '../actions'

type Incidente = {
  id: string
  folio: string | null
  sistema: string
  titulo: string
  fecha_inicio: string
  fecha_fin: string | null
  causa: string | null
  impacto: string | null
  acciones: string | null
  estatus: string
  responsable_nombre: string | null
}

function duracion(inicio: string, fin: string | null) {
  const ini = new Date(inicio).getTime()
  const end = fin ? new Date(fin).getTime() : Date.now()
  const minutos = Math.round((end - ini) / 60000)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `${horas} h ${resto} min`
}

export default function IncidentesTiClient({
  puedeGestionar,
  incidentes,
}: {
  puedeGestionar: boolean
  incidentes: Incidente[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [cerrando, setCerrando] = useState<string | null>(null)
  const [soloAbiertos, setSoloAbiertos] = useState(false)

  const abiertos = incidentes.filter((i) => i.estatus === 'abierto').length
  const filtrados = soloAbiertos ? incidentes.filter((i) => i.estatus === 'abierto') : incidentes

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Incidentes de sistemas (WMS / ERP / Red)</p>
        <button
          onClick={() => setSoloAbiertos(!soloAbiertos)}
          className={
            'rounded-md px-3 py-1.5 text-[12px] ' +
            (soloAbiertos ? 'bg-[#fdf3e3] text-[#9a6b1c]' : 'bg-white text-by-gray-light border border-black/10')
          }
        >
          {soloAbiertos ? `Mostrando solo abiertos (${abiertos})` : `Ver solo abiertos (${abiertos})`}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Sistema</th>
              <th className="px-3 py-2 font-normal">Incidente</th>
              <th className="px-3 py-2 font-normal">Inicio</th>
              <th className="px-3 py-2 font-normal">Duración</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((i) => (
              <tr key={i.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="px-3 py-2 text-by-gray-light">{i.folio}</td>
                <td className="px-3 py-2 text-by-gray-dark">{i.sistema}</td>
                <td className="px-3 py-2 text-by-gray-dark">
                  {i.titulo}
                  {i.causa && <span className="block text-[10.5px] text-by-gray-light">{i.causa}</span>}
                </td>
                <td className="px-3 py-2 text-by-gray-light">{new Date(i.fecha_inicio).toLocaleString('es-MX')}</td>
                <td className="px-3 py-2 text-by-gray-light">{duracion(i.fecha_inicio, i.fecha_fin)}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' +
                      (i.estatus === 'abierto' ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#eaf5f0] text-[#3d6b53]')
                    }
                  >
                    {i.estatus === 'abierto' ? 'Abierto' : 'Cerrado'}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-3 py-2">
                    {i.estatus === 'abierto' ? (
                      cerrando === i.id ? (
                        <form
                          action={(fd) =>
                            startTransition(async () => {
                              await cerrarIncidenteTi(fd)
                              setCerrando(null)
                            })
                          }
                          className="flex flex-col gap-1"
                        >
                          <input type="hidden" name="id" value={i.id} />
                          <input type="datetime-local" name="fecha_fin" required className="h-7 rounded-md border border-black/10 px-1.5 text-[11px]" />
                          <input name="acciones" placeholder="Acción de resolución" className="h-7 w-40 rounded-md border border-black/10 px-1.5 text-[11px]" />
                          <button className="text-[11px] text-by-accent hover:underline">Guardar cierre</button>
                        </form>
                      ) : (
                        <button onClick={() => setCerrando(i.id)} className="text-[11px] text-by-accent hover:underline">
                          Cerrar incidente
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => startTransition(() => eliminarIncidenteTi(i.id))}
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
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin incidentes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form action={(fd) => startTransition(() => crearIncidenteTi(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Registrar incidente</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="sistema" required defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="" disabled>Sistema afectado…</option>
              <option value="WMS">WMS</option>
              <option value="ERP">ERP</option>
              <option value="Red">Red</option>
              <option value="Servidor">Servidor</option>
              <option value="Otro">Otro</option>
            </select>
            <input name="titulo" placeholder="Título breve del incidente" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="fecha_inicio" type="datetime-local" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="causa" placeholder="Causa (si se conoce)" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="impacto" placeholder="Impacto en la operación" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
