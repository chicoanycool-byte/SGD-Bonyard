'use client'

import { useMemo, useState } from 'react'
import FilaChecklistBpa from './FilaChecklistBpa'

type Usuario = { id: string; nombre: string }

type Fila = {
  id: string
  numero: number
  area: string | null
  subarea: string | null
  pregunta: string
  criterio: string | null
  nivel_riesgo: string | null
  clasificacion: string | null
  referencia: string | null
  respuesta: string | null
  observaciones: string | null
  accion_correctiva_requerida: string | null
  responsable_id: string | null
  fecha_compromiso: string | null
  estatus: string
  accion_correctiva_id: string | null
}

export default function ChecklistBpaContenedor({
  filas,
  recorridoId,
  usuarios,
  puedeEditar,
  bloqueado,
  esCoordinador,
}: {
  filas: Fila[]
  recorridoId: string
  usuarios: Usuario[]
  puedeEditar: boolean
  bloqueado: boolean
  esCoordinador: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [soloNoConforme, setSoloNoConforme] = useState(false)
  const [areaAbierta, setAreaAbierta] = useState<string | null>(null)

  const filtradas = useMemo(() => {
    return filas.filter((f) => {
      if (soloPendientes && f.respuesta) return false
      if (soloNoConforme && f.respuesta !== 'no_cumple') return false
      if (
        busqueda &&
        !f.pregunta.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(f.area ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
        return false
      return true
    })
  }, [filas, busqueda, soloPendientes, soloNoConforme])

  const porArea = useMemo(() => {
    const grupos = new Map<string, Fila[]>()
    for (const f of filtradas) {
      const clave = f.area ?? 'Sin área'
      if (!grupos.has(clave)) grupos.set(clave, [])
      grupos.get(clave)!.push(f)
    }
    return grupos
  }, [filtradas])

  const total = filas.length
  const respondidas = filas.filter((f) => f.respuesta).length
  const noConformes = filas.filter((f) => f.respuesta === 'no_cumple').length

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-black/5 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px] text-by-gray-light">
          <span>{respondidas}/{total} evaluadas</span>
          <span className="text-[#a13c33]">{noConformes} no conformes</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar pregunta o área…"
            className="h-8 flex-1 rounded-md border border-black/10 px-2.5 text-[12.5px]"
          />
          <label className="flex items-center gap-1.5 text-[12px] text-by-gray-dark">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
            />
            Solo pendientes
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-by-gray-dark">
            <input
              type="checkbox"
              checked={soloNoConforme}
              onChange={(e) => setSoloNoConforme(e.target.checked)}
            />
            Solo no conformes
          </label>
        </div>
      </div>

      {[...porArea.entries()].map(([area, items]) => {
        const abierta = areaAbierta === area
        const pendientesArea = items.filter((f) => !f.respuesta).length
        return (
          <div key={area} className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <button
              onClick={() => setAreaAbierta(abierta ? null : area)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-black/[0.02]"
            >
              <span className="text-[13px] font-medium text-by-gray-dark">
                {area} <span className="text-[11px] font-normal text-by-gray-light">({items.length} puntos)</span>
              </span>
              <span className="text-[11px] text-by-gray-light">
                {pendientesArea > 0 ? `${pendientesArea} pendientes` : '✓ completa'} {abierta ? '▲' : '▼'}
              </span>
            </button>
            {abierta && (
              <div>
                {items.map((f) => (
                  <FilaChecklistBpa
                    key={f.id}
                    fila={f}
                    recorridoId={recorridoId}
                    usuarios={usuarios}
                    puedeEditar={puedeEditar}
                    bloqueado={bloqueado}
                    esCoordinador={esCoordinador}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
