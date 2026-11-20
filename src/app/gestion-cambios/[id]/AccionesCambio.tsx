'use client'

import { useActionState } from 'react'
import {
  evaluarCambio,
  registrarImplementacion,
  cerrarCambio,
  type EstadoCambio,
} from '../actions'

const inicial: EstadoCambio = {}
const campo =
  'w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'
const boton =
  'h-8 rounded-md bg-by-primary px-4 text-[12px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60'

function Mensaje({ e }: { e: EstadoCambio }) {
  if (e.error) return <span className="text-[12px] text-red-600">{e.error}</span>
  if (e.ok) return <span className="text-[12px] text-emerald-700">✓ Guardado</span>
  return null
}

export function EvaluarForm({
  id,
  usuarios,
  fechaPlaneada,
}: {
  id: string
  usuarios: { id: string; nombre: string }[]
  fechaPlaneada: string | null
}) {
  const [estado, accion, pendiente] = useActionState(evaluarCambio.bind(null, id), inicial)
  return (
    <form action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">Nivel de riesgo del cambio</label>
        <select name="riesgo_nivel" defaultValue="" required className={campo + ' h-8 bg-white'}>
          <option value="" disabled>Selecciona…</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">Responsable de implementarlo</label>
        <select name="responsable_id" defaultValue="" className={campo + ' h-8 bg-white'}>
          <option value="">—</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] text-by-gray-dark">
          Evaluación de riesgo: qué podría salir mal (inocuidad, calidad, clientes) y cómo se controla
        </label>
        <textarea name="evaluacion_riesgo" required rows={3} className={campo + ' py-1.5'} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] text-by-gray-dark">Controles o pasos previos necesarios (opcional)</label>
        <textarea name="controles_requeridos" rows={2} className={campo + ' py-1.5'} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-by-gray-dark md:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="requiere_capacitacion" /> Requiere capacitar al personal</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="requiere_actualizar_documentos" /> Requiere actualizar documentos del SGI</label>
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha planeada</label>
        <input name="fecha_planeada" type="date" defaultValue={fechaPlaneada ?? ''} className={campo + ' h-8'} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">Comentario de la decisión (obligatorio si se rechaza)</label>
        <input name="comentario_decision" className={campo + ' h-8'} />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button name="decision" value="aprobar" disabled={pendiente} className={boton}>Aprobar cambio</button>
        <button
          name="decision"
          value="rechazar"
          disabled={pendiente}
          className="h-8 rounded-md border border-red-200 px-4 text-[12px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          Rechazar
        </button>
        <Mensaje e={estado} />
      </div>
    </form>
  )
}

export function ImplementacionForm({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(registrarImplementacion.bind(null, id), inicial)
  return (
    <form action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha en que se hizo</label>
        <input name="fecha_implementacion" type="date" required className={campo + ' h-8'} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] text-by-gray-dark">Qué se hizo (y qué evidencia hay: registros, fotos, capacitación)</label>
        <textarea name="evidencia_implementacion" required rows={3} className={campo + ' py-1.5'} />
      </div>
      <div className="flex items-center gap-3 md:col-span-3">
        <button disabled={pendiente} className={boton}>Registrar implementación</button>
        <Mensaje e={estado} />
      </div>
    </form>
  )
}

export function CierreForm({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(cerrarCambio.bind(null, id), inicial)
  return (
    <form action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="md:col-span-2">
        <label className="mb-1 block text-[11px] text-by-gray-dark">Cómo verificaste que el cambio funcionó (sin afectar inocuidad ni calidad)</label>
        <textarea name="verificacion_post" required rows={3} className={campo + ' py-1.5'} />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-by-gray-dark">¿Fue efectivo?</label>
        <select name="cambio_efectivo" defaultValue="" required className={campo + ' h-8 bg-white'}>
          <option value="" disabled>Selecciona…</option>
          <option value="si">Sí</option>
          <option value="no">No (se anotará para dar seguimiento)</option>
        </select>
      </div>
      <div className="flex items-center gap-3 md:col-span-3">
        <button disabled={pendiente} className={boton}>Verificar y cerrar</button>
        <Mensaje e={estado} />
      </div>
    </form>
  )
}
