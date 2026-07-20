'use client'

import { useState, useTransition } from 'react'
import { actualizarRespuesta, cerrarHallazgo, generarAccionDesdeHallazgo } from '../actions'

type Usuario = { id: string; nombre: string }

type Fila = {
  id: string
  numero: number
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

const RIESGO_ESTILO: Record<string, string> = {
  Crítico: 'bg-[#fdecea] text-[#a13c33]',
  Mayor: 'bg-[#fdf3e3] text-[#9a6b1c]',
  Menor: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function FilaChecklistBpa({
  fila,
  recorridoId,
  usuarios,
  puedeEditar,
  bloqueado,
  esCoordinador,
}: {
  fila: Fila
  recorridoId: string
  usuarios: Usuario[]
  puedeEditar: boolean
  bloqueado: boolean
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [respuesta, setRespuesta] = useState(fila.respuesta ?? '')
  const [observaciones, setObservaciones] = useState(fila.observaciones ?? '')
  const [accion, setAccion] = useState(fila.accion_correctiva_requerida ?? '')
  const [responsableId, setResponsableId] = useState(fila.responsable_id ?? '')
  const [fechaCompromiso, setFechaCompromiso] = useState(fila.fecha_compromiso ?? '')

  const esNoCumple = respuesta === 'no_cumple'
  const disabled = bloqueado || !puedeEditar

  function guardar(cambios: Parameters<typeof actualizarRespuesta>[2]) {
    startTransition(() =>
      actualizarRespuesta(fila.id, recorridoId, { ...cambios, nivel_riesgo: fila.nivel_riesgo })
    )
  }

  return (
    <div className="border-b border-black/5 p-3 last:border-0">
      <div className="mb-1 flex items-start justify-between gap-3">
        <p className="text-[12.5px] text-by-gray-dark">
          <span className="text-by-gray-light">{fila.numero}.</span> {fila.pregunta}
        </p>
        <div className="flex shrink-0 gap-1">
          {fila.nivel_riesgo && (
            <span
              className={
                'rounded-full px-2 py-0.5 text-[10px] ' + (RIESGO_ESTILO[fila.nivel_riesgo] ?? '')
              }
            >
              {fila.nivel_riesgo}
            </span>
          )}
          {fila.estatus === 'cerrado' && (
            <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[10px] text-[#3d6b53]">
              Cerrado
            </span>
          )}
        </div>
      </div>
      {fila.criterio && (
        <p className="mb-2 text-[11px] text-by-gray-light">{fila.criterio}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <select
          disabled={disabled}
          value={respuesta}
          onChange={(e) => {
            setRespuesta(e.target.value)
            guardar({ respuesta: e.target.value })
          }}
          className="h-8 rounded-md border border-black/10 px-2 text-[12px]"
        >
          <option value="">Sin evaluar</option>
          <option value="cumple">Cumple</option>
          <option value="no_cumple">No cumple</option>
          <option value="no_aplica">No aplica</option>
        </select>
        <input
          disabled={disabled}
          value={observaciones}
          placeholder="Observaciones del auditor"
          onChange={(e) => setObservaciones(e.target.value)}
          onBlur={() => guardar({ observaciones })}
          className="h-8 rounded-md border border-black/10 px-2 text-[12px]"
        />
        {esNoCumple && (
          <input
            disabled={disabled}
            value={accion}
            placeholder="Acción correctiva requerida"
            onChange={(e) => setAccion(e.target.value)}
            onBlur={() => guardar({ accion_correctiva_requerida: accion })}
            className="h-8 rounded-md border border-black/10 px-2 text-[12px]"
          />
        )}
      </div>

      {esNoCumple && (
        <div className="mt-2 grid grid-cols-4 items-end gap-2">
          <div>
            <label className="mb-1 block text-[10.5px] text-by-gray-dark">Responsable</label>
            <select
              disabled={disabled}
              value={responsableId}
              onChange={(e) => {
                setResponsableId(e.target.value)
                guardar({ responsable_id: e.target.value || null })
              }}
              className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]"
            >
              <option value="">— Sin asignar —</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] text-by-gray-dark">Fecha compromiso</label>
            <input
              disabled={disabled}
              type="date"
              value={fechaCompromiso}
              onChange={(e) => {
                setFechaCompromiso(e.target.value)
                guardar({ fecha_compromiso: e.target.value })
              }}
              className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]"
            />
          </div>
          {puedeEditar && fila.estatus !== 'cerrado' && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => cerrarHallazgo(fila.id, recorridoId))}
              className="h-8 text-[12px] text-by-accent hover:underline disabled:opacity-50"
            >
              Cerrar hallazgo
            </button>
          )}
          {esCoordinador && !fila.accion_correctiva_id && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => generarAccionDesdeHallazgo(fila.id))}
              className="h-8 text-[12px] text-red-600 hover:underline disabled:opacity-50"
            >
              Generar AC
            </button>
          )}
          {fila.accion_correctiva_id && (
            <span className="text-[11px] text-by-gray-light">AC generada</span>
          )}
        </div>
      )}
    </div>
  )
}
