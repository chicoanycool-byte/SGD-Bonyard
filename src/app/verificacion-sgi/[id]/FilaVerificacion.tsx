'use client'

import { useState, useTransition } from 'react'
import {
  actualizarRespuestaVerificacion,
  cerrarHallazgoVerificacion,
  generarAccionDesdeVerificacion,
} from '../actions'

type Usuario = { id: string; nombre: string }

type Fila = {
  id: string
  numero: number
  criterio: string
  doc_ref: string | null
  area_responsable: string | null
  respuesta: string | null
  hallazgo: string | null
  accion_mejora: string | null
  responsable_id: string | null
  fecha_compromiso: string | null
  estatus: string
  accion_correctiva_id: string | null
}

export default function FilaVerificacion({
  fila,
  verificacionId,
  usuarios,
  bloqueado,
}: {
  fila: Fila
  verificacionId: string
  usuarios: Usuario[]
  bloqueado: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [respuesta, setRespuesta] = useState(fila.respuesta ?? '')
  const [hallazgo, setHallazgo] = useState(fila.hallazgo ?? '')
  const [accionMejora, setAccionMejora] = useState(fila.accion_mejora ?? '')
  const [responsableId, setResponsableId] = useState(fila.responsable_id ?? '')
  const [fechaCompromiso, setFechaCompromiso] = useState(fila.fecha_compromiso ?? '')

  const esNoCumple = respuesta === 'no_cumple'

  function guardar(cambios: Parameters<typeof actualizarRespuestaVerificacion>[2]) {
    startTransition(() => actualizarRespuestaVerificacion(fila.id, verificacionId, cambios))
  }

  const inputCls = 'w-full rounded-md border border-black/10 px-2 py-1 text-[12px]'

  return (
    <div className="border-b border-black/5 p-3 last:border-0">
      <div className="mb-1 flex items-start justify-between gap-3">
        <p className="text-[12.5px] text-by-gray-dark">
          <span className="text-by-gray-light">{fila.numero}.</span> {fila.criterio}
        </p>
        {fila.estatus === 'cerrado' && (
          <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[10px] text-[#3d6b53]">Cerrado</span>
        )}
      </div>
      {(fila.doc_ref || fila.area_responsable) && (
        <p className="mb-2 text-[10.5px] text-by-gray-light">
          {fila.doc_ref} · {fila.area_responsable}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <select
          disabled={bloqueado}
          value={respuesta}
          onChange={(e) => {
            setRespuesta(e.target.value)
            guardar({ respuesta: e.target.value })
          }}
          className={inputCls}
        >
          <option value="">Sin evaluar</option>
          <option value="cumple">Cumple</option>
          <option value="no_cumple">No cumple</option>
          <option value="na">N/A</option>
        </select>
        <input
          disabled={bloqueado}
          value={hallazgo}
          placeholder="Hallazgo / observación"
          onChange={(e) => setHallazgo(e.target.value)}
          onBlur={() => guardar({ hallazgo })}
          className={inputCls}
        />
        {esNoCumple && (
          <input
            disabled={bloqueado}
            value={accionMejora}
            placeholder="Acción de mejora"
            onChange={(e) => setAccionMejora(e.target.value)}
            onBlur={() => guardar({ accion_mejora: accionMejora })}
            className={inputCls}
          />
        )}
      </div>

      {esNoCumple && (
        <div className="mt-2 grid grid-cols-4 items-end gap-2">
          <div>
            <label className="mb-1 block text-[10.5px] text-by-gray-dark">Responsable</label>
            <select
              disabled={bloqueado}
              value={responsableId}
              onChange={(e) => {
                setResponsableId(e.target.value)
                guardar({ responsable_id: e.target.value || null })
              }}
              className={inputCls}
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
              disabled={bloqueado}
              type="date"
              value={fechaCompromiso}
              onChange={(e) => {
                setFechaCompromiso(e.target.value)
                guardar({ fecha_compromiso: e.target.value })
              }}
              className={inputCls}
            />
          </div>
          {!bloqueado && fila.estatus !== 'cerrado' && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => cerrarHallazgoVerificacion(fila.id, verificacionId))}
              className="h-8 text-[12px] text-by-accent hover:underline disabled:opacity-50"
            >
              Cerrar hallazgo
            </button>
          )}
          {!fila.accion_correctiva_id ? (
            <button
              disabled={pending}
              onClick={() => startTransition(() => generarAccionDesdeVerificacion(fila.id))}
              className="h-8 text-[12px] text-red-600 hover:underline disabled:opacity-50"
            >
              Generar AC
            </button>
          ) : (
            <span className="text-[11px] text-by-gray-light">AC generada</span>
          )}
        </div>
      )}
    </div>
  )
}
