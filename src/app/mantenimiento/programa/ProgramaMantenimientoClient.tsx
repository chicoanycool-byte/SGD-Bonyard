'use client'

import { useState, useTransition } from 'react'
import { crearProgramaMantenimiento, actualizarProximaFecha, eliminarProgramaMantenimiento } from '../actions'

type Item = {
  id: string
  nave: string
  equipo: string
  tipo_equipo: string
  actividad: string
  frecuencia: string | null
  ultima_fecha: string | null
  proxima_fecha: string | null
  responsable_nombre: string | null
}

const TIPO_LABEL: Record<string, string> = {
  montacargas: 'Montacargas',
  transpaleta: 'Transpaleta',
  instalacion: 'Instalación',
  equipo_medicion: 'Equipo de medición (calibración)',
  otro: 'Otro',
}

function calcularEstatus(proximaFecha: string | null) {
  if (!proximaFecha) return 'sin_fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(proximaFecha + 'T00:00:00')
  const diffDias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000)
  if (diffDias < 0) return 'vencido'
  if (diffDias <= 7) return 'proximo'
  return 'vigente'
}

const ESTATUS_STYLE: Record<string, string> = {
  vencido: 'bg-[#fdecea] text-[#a13c33]',
  proximo: 'bg-[#fdf3e3] text-[#9a6b1c]',
  vigente: 'bg-[#eaf5f0] text-[#3d6b53]',
  sin_fecha: 'bg-[#f1efe8] text-[#5f5e5a]',
}
const ESTATUS_LABEL: Record<string, string> = {
  vencido: 'Vencido',
  proximo: 'Próximo (≤7 días)',
  vigente: 'Vigente',
  sin_fecha: 'Sin fecha',
}

export default function ProgramaMantenimientoClient({
  puedeGestionar,
  programa,
}: {
  puedeGestionar: boolean
  programa: Item[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [filtro, setFiltro] = useState('')
  const [renovando, setRenovando] = useState<string | null>(null)

  const conEstatus = programa.map((p) => ({ ...p, estatusCalc: calcularEstatus(p.proxima_fecha) }))
  const vencidos = conEstatus.filter((p) => p.estatusCalc === 'vencido').length
  const proximos = conEstatus.filter((p) => p.estatusCalc === 'proximo').length

  const filtrados = filtro ? conEstatus.filter((p) => p.estatusCalc === filtro) : conEstatus

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Programa de Mantenimiento Preventivo (PMT-01)</p>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFiltro('')}
          className={
            'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
            (!filtro ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Total actividades</p>
          <p className="text-[22px] font-medium">{programa.length}</p>
        </button>
        <button
          onClick={() => setFiltro(filtro === 'vencido' ? '' : 'vencido')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (filtro === 'vencido' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Vencidas</p>
          <p className="text-[22px] font-medium">{vencidos}</p>
        </button>
        <button
          onClick={() => setFiltro(filtro === 'proximo' ? '' : 'proximo')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#9a6b1c] transition ' +
            (filtro === 'proximo' ? 'bg-[#f9e6bf] ring-2 ring-[#9a6b1c]/40' : 'bg-[#fdf3e3] hover:bg-[#fbedd2]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Próximas (≤7 días)</p>
          <p className="text-[22px] font-medium">{proximos}</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Equipo</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Actividad</th>
              <th className="px-3 py-2 font-normal">Frecuencia</th>
              <th className="px-3 py-2 font-normal">Próxima fecha</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="px-3 py-2 text-by-gray-light">{p.nave}</td>
                <td className="px-3 py-2 text-by-gray-dark">{p.equipo}</td>
                <td className="px-3 py-2 text-by-gray-light">{TIPO_LABEL[p.tipo_equipo] ?? p.tipo_equipo}</td>
                <td className="px-3 py-2 text-by-gray-light">{p.actividad}</td>
                <td className="px-3 py-2 text-by-gray-light">{p.frecuencia ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {p.proxima_fecha ? new Date(p.proxima_fecha + 'T00:00:00').toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_STYLE[p.estatusCalc] ?? '')}>
                    {ESTATUS_LABEL[p.estatusCalc] ?? p.estatusCalc}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-3 py-2">
                    {renovando === p.id ? (
                      <form
                        action={(fd) =>
                          startTransition(async () => {
                            await actualizarProximaFecha(
                              p.id,
                              String(fd.get('ultima_fecha') ?? ''),
                              String(fd.get('proxima_fecha') ?? '')
                            )
                            setRenovando(null)
                          })
                        }
                        className="flex flex-col gap-1"
                      >
                        <input type="date" name="ultima_fecha" required placeholder="Fecha realizado" className="h-7 rounded-md border border-black/10 px-1.5 text-[11px]" />
                        <input type="date" name="proxima_fecha" required placeholder="Próxima fecha" className="h-7 rounded-md border border-black/10 px-1.5 text-[11px]" />
                        <button className="text-[11px] text-by-accent hover:underline">Guardar</button>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setRenovando(p.id)} className="text-[11px] text-by-accent hover:underline">
                          Registrar cumplido
                        </button>
                        <button
                          onClick={() => startTransition(() => eliminarProgramaMantenimiento(p.id))}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin actividades que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form action={(fd) => startTransition(() => crearProgramaMantenimiento(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar actividad al programa</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="nave" defaultValue="Nave 1" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <select name="tipo_equipo" defaultValue="instalacion" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="montacargas">Montacargas</option>
              <option value="transpaleta">Transpaleta</option>
              <option value="instalacion">Instalación</option>
              <option value="equipo_medicion">Equipo de medición (calibración)</option>
              <option value="otro">Otro</option>
            </select>
            <input name="equipo" placeholder="Equipo (ej. Montacargas #3)" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="actividad" placeholder="Actividad (ej. Cambio de aceite)" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="frecuencia" placeholder="Frecuencia (ej. Trimestral)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Última fecha</label>
              <input name="ultima_fecha" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Próxima fecha</label>
              <input name="proxima_fecha" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
