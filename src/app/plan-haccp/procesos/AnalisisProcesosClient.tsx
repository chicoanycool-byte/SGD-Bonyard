'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import { crearAnalisisProceso, eliminarAnalisisProceso } from '../actions'

type Fila = {
  id: string
  nave: string
  area: string
  numero_etapa: number | null
  etapa_proceso: string | null
  actividad: string | null
  tipo_peligro: string | null
  peligro: string | null
  severidad: number | null
  probabilidad: number | null
  riesgo: number | null
  nivel_riesgo: string | null
  justificacion: string | null
  nivel_aceptable: string | null
  medidas_control: string | null
  pcc: string | null
}

export default function AnalisisProcesosClient({
  esCoordinador,
  procesos,
}: {
  esCoordinador: boolean
  procesos: Fila[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(null)
  const [soloPcc, setSoloPcc] = useState(false)

  const naves = useMemo(() => [...new Set(procesos.map((p) => p.nave))].sort(), [procesos])
  const [nave, setNave] = useState(naves[0] ?? 'Nave 1')
  const areas = useMemo(() => [...new Set(procesos.filter((p) => p.nave === nave).map((p) => p.area))], [procesos, nave])
  const [area, setArea] = useState('Almacén')

  const filtrados = procesos.filter(
    (p) => p.nave === nave && p.area === area && (!soloPcc || !!p.pcc)
  )
  const totalPcc = procesos.filter((p) => p.nave === nave && p.area === area && p.pcc).length

  // agrupar visualmente por etapa
  const grupos: { etapa: string; filas: Fila[] }[] = []
  for (const f of filtrados) {
    const etapaKey = f.etapa_proceso ?? '—'
    let grupo = grupos.find((g) => g.etapa === etapaKey)
    if (!grupo) {
      grupo = { etapa: etapaKey, filas: [] }
      grupos.push(grupo)
    }
    grupo.filas.push(f)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Análisis de Peligros de Procesos (FSG-49)</p>
        <div className="flex gap-2">
          {naves.map((n) => (
            <button
              key={n}
              onClick={() => setNave(n)}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (nave === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (area === a ? 'bg-by-primary text-white' : 'bg-white text-by-gray-light border border-black/10')
              }
            >
              {a}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSoloPcc(!soloPcc)}
          className={
            'rounded-md px-3 py-1.5 text-[12px] ' +
            (soloPcc ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-white text-by-gray-light border border-black/10')
          }
        >
          {soloPcc ? `Mostrando solo PCC (${totalPcc})` : `Ver solo PCC (${totalPcc})`}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {grupos.map((g) => (
          <div key={g.etapa} className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <div className="border-b border-black/5 bg-[#f9faf9] px-4 py-2">
              <p className="text-[12.5px] font-medium text-by-gray-dark">{g.etapa}</p>
            </div>
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-3 py-2 font-normal">Actividad</th>
                  <th className="px-3 py-2 font-normal">Tipo</th>
                  <th className="px-3 py-2 font-normal">Peligro</th>
                  <th className="px-3 py-2 font-normal">S·P·R</th>
                  <th className="px-3 py-2 font-normal">Nivel</th>
                  <th className="px-3 py-2 font-normal">PCC</th>
                  {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {g.filas.map((f) => {
                  const abierto = expandido === f.id
                  return (
                    <Fragment key={f.id}>
                      <tr
                        onClick={() => setExpandido(abierto ? null : f.id)}
                        className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
                      >
                        <td className="px-3 py-2 text-by-gray-dark">{f.actividad ?? '—'}</td>
                        <td className="px-3 py-2 text-by-gray-light">{f.tipo_peligro ?? '—'}</td>
                        <td className="max-w-[220px] truncate px-3 py-2 text-by-gray-light">{f.peligro ?? '—'}</td>
                        <td className="px-3 py-2 text-by-gray-light">
                          {f.severidad ?? '—'}·{f.probabilidad ?? '—'}·{f.riesgo ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {f.nivel_riesgo && (
                            <span
                              className={
                                'rounded-full px-2 py-0.5 text-[10.5px] ' +
                                (f.nivel_riesgo === 'SIGNIFICATIVO' ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#eaf5f0] text-[#3d6b53]')
                              }
                            >
                              {f.nivel_riesgo}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {f.pcc && (
                            <span className="rounded-full bg-[#f0eafa] px-2 py-0.5 text-[10.5px] font-medium text-[#6b4fa0]">
                              {f.pcc}
                            </span>
                          )}
                        </td>
                        {esCoordinador && (
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startTransition(() => eliminarAnalisisProceso(f.id))
                              }}
                              disabled={pendiente}
                              className="text-[11px] text-red-500 hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        )}
                      </tr>
                      {abierto && (
                        <tr className="border-b border-black/5 bg-[#fafbfa]">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                              <div>
                                <p className="mb-1 text-[10px] uppercase text-by-gray-light">Justificación</p>
                                <p className="whitespace-pre-line text-by-gray-dark">{f.justificacion ?? '—'}</p>
                              </div>
                              <div>
                                <p className="mb-1 text-[10px] uppercase text-by-gray-light">Nivel aceptable</p>
                                <p className="whitespace-pre-line text-by-gray-dark">{f.nivel_aceptable ?? '—'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="mb-1 text-[10px] uppercase text-by-gray-light">Medidas de control</p>
                                <p className="whitespace-pre-line text-by-gray-dark">{f.medidas_control ?? '—'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
        {grupos.length === 0 && (
          <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[12px] text-by-gray-light">
            Sin registros para {nave} · {area}.
          </div>
        )}
      </div>

      {esCoordinador && (
        <form action={(fd) => startTransition(() => crearAnalisisProceso(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar fila de análisis</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="nave" defaultValue={nave} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <select name="area" defaultValue={area} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Almacén">Almacén</option>
              <option value="Transporte">Transporte</option>
            </select>
            <select name="tipo_peligro" defaultValue="Físico" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Físico">Físico</option>
              <option value="Químico">Químico</option>
              <option value="Biológico">Biológico</option>
            </select>
            <input name="etapa_proceso" placeholder="Etapa del proceso" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="actividad" placeholder="Actividad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="peligro" placeholder="Peligro" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="severidad" type="number" min="1" max="3" placeholder="Severidad (1-3)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="probabilidad" type="number" min="1" max="3" placeholder="Probabilidad (1-3)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="nivel_riesgo" defaultValue="NO SIGNIFICATIVO" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="NO SIGNIFICATIVO">No significativo</option>
              <option value="SIGNIFICATIVO">Significativo</option>
            </select>
            <textarea name="justificacion" placeholder="Justificación del nivel de riesgo" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <textarea name="nivel_aceptable" placeholder="Nivel aceptable" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <textarea name="medidas_control" placeholder="Medidas de control" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="pcc" placeholder="PCC (si aplica, ej. PCC 1)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
          </div>
        </form>
      )}
    </div>
  )
}
