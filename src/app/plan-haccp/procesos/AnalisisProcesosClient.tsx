'use client'

import { useState, useTransition } from 'react'
import { crearAnalisisProceso, eliminarAnalisisProceso } from '../actions'

type Proceso = {
  id: string
  proceso: string
  descripcion: string | null
  peligro_biologico: string | null
  peligro_quimico: string | null
  peligro_fisico: string | null
  medidas_control: string | null
  es_pcc: boolean
  limite_critico: string | null
  monitoreo: string | null
}

export default function AnalisisProcesosClient({
  esCoordinador,
  procesos,
}: {
  esCoordinador: boolean
  procesos: Proceso[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Análisis de Procesos</p>

      <div className="flex flex-col gap-2">
        {procesos.map((p) => {
          const abierto = expandido === p.id
          return (
            <div key={p.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
              <button
                onClick={() => setExpandido(abierto ? null : p.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-[13px] font-medium text-by-gray-dark">{p.proceso}</span>
                {p.es_pcc && (
                  <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[10.5px] font-medium text-[#a13c33]">
                    PCC
                  </span>
                )}
              </button>
              {abierto && (
                <div className="grid grid-cols-2 gap-3 border-t border-black/5 p-4 text-[12px]">
                  <p className="col-span-2 text-by-gray-dark">{p.descripcion}</p>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Peligro biológico</p>
                    <p className="text-by-gray-dark">{p.peligro_biologico ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Peligro químico</p>
                    <p className="text-by-gray-dark">{p.peligro_quimico ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Peligro físico</p>
                    <p className="text-by-gray-dark">{p.peligro_fisico ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Medidas de control</p>
                    <p className="text-by-gray-dark">{p.medidas_control ?? '—'}</p>
                  </div>
                  {p.es_pcc && (
                    <>
                      <div>
                        <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Límite crítico</p>
                        <p className="text-by-gray-dark">{p.limite_critico ?? '—'}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Monitoreo</p>
                        <p className="text-by-gray-dark">{p.monitoreo ?? '—'}</p>
                      </div>
                    </>
                  )}
                  {esCoordinador && (
                    <button
                      onClick={() => startTransition(() => eliminarAnalisisProceso(p.id))}
                      disabled={pendiente}
                      className="col-span-2 w-fit text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {procesos.length === 0 && (
          <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[12px] text-by-gray-light">
            Sin procesos capturados.
          </div>
        )}
      </div>

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearAnalisisProceso(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar proceso</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="proceso" placeholder="Nombre del proceso (ej. Recepción)" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="descripcion" placeholder="Descripción del proceso" rows={2} className="col-span-2 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="peligro_biologico" placeholder="Peligro biológico" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="peligro_quimico" placeholder="Peligro químico" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="peligro_fisico" placeholder="Peligro físico" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="medidas_control" placeholder="Medidas de control" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <label className="col-span-2 flex items-center gap-2 text-[12px] text-by-gray-dark">
              <input type="checkbox" name="es_pcc" className="h-3.5 w-3.5" />
              Es un Punto Crítico de Control (PCC)
            </label>
            <input name="limite_critico" placeholder="Límite crítico (si es PCC)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="monitoreo" placeholder="Monitoreo (si es PCC)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
