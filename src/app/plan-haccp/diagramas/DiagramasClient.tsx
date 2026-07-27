'use client'

import { useTransition } from 'react'
import { subirDiagrama, obtenerUrlDiagrama } from '../actions'

type Diagrama = { nave: string; area: string; nombre_archivo: string; storage_path: string; actualizado_en: string }

const NAVES = ['Nave 1', 'Nave 2']
const AREAS = ['Almacén', 'Transporte']

export default function DiagramasClient({
  esCoordinador,
  diagramas,
}: {
  esCoordinador: boolean
  diagramas: Diagrama[]
}) {
  const [pendiente, startTransition] = useTransition()

  async function abrir(storagePath: string) {
    try {
      const url = await obtenerUrlDiagrama(storagePath)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Diagramas de flujo de procesos</p>

      <div className="grid grid-cols-2 gap-3">
        {NAVES.map((nave) => (
          <div key={nave} className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">{nave}</p>
            {AREAS.map((area) => {
              const d = diagramas.find((x) => x.nave === nave && x.area === area)
              return (
                <div key={area} className="mb-3 flex items-center justify-between rounded-lg bg-[#f4f6f6] px-3 py-2">
                  <div>
                    <p className="text-[12px] font-medium text-by-gray-dark">{area}</p>
                    <p className="text-[11px] text-by-gray-light">{d ? d.nombre_archivo : 'Sin subir'}</p>
                  </div>
                  {d && (
                    <button onClick={() => abrir(d.storage_path)} className="text-[12px] text-by-accent hover:underline">
                      Ver
                    </button>
                  )}
                </div>
              )
            })}
            {esCoordinador && (
              <form action={(fd) => startTransition(() => subirDiagrama(fd))} className="flex flex-col gap-2 border-t border-black/5 pt-3">
                <input type="hidden" name="nave" value={nave} />
                <select name="area" required defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="" disabled>Área…</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <input type="file" name="archivo" required className="text-[12px]" />
                <button disabled={pendiente} className="h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent disabled:opacity-50">
                  {pendiente ? 'Subiendo…' : 'Subir / Reemplazar'}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
