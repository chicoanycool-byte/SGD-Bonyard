'use client'

import { useActionState, useEffect, useRef } from 'react'
import { registrarCapacitacion, type EstadoCapAccion } from './actions'

const campo =
  'w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

export default function RegistrarCapacitacionForm({
  usuarios,
  cursos,
}: {
  usuarios: { id: string; nombre: string }[]
  cursos: { id: string; codigo: string; nombre: string; vigencia_meses: number | null }[]
}) {
  const [estado, accion, pendiente] = useActionState(registrarCapacitacion, {} as EstadoCapAccion)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (estado.ok) ref.current?.reset()
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-1 text-[13px] font-medium text-by-gray-dark">Registrar capacitación</p>
      <p className="mb-3 text-[11.5px] text-by-gray">
        Puedes marcar a varias personas si tomaron el mismo curso el mismo día. La vigencia se calcula con los meses del curso, o la escribes tú.
      </p>
      <form ref={ref} action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Curso</label>
          <select name="curso_id" required defaultValue="" className={campo + ' h-8'}>
            <option value="" disabled>Selecciona</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} {c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha de la capacitación</label>
          <input name="fecha" type="date" required className={campo + ' h-8'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Vigente hasta (opcional)</label>
          <input name="vigente_hasta" type="date" className={campo + ' h-8'} />
        </div>
        <div className="md:col-span-4">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Personas</label>
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-black/10 p-2">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-1.5 text-[12.5px]">
                <input type="checkbox" name="usuario_id" value={u.id} /> {u.nombre}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Instructor o proveedor</label>
          <input name="instructor" className={campo + ' h-8'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Calificación</label>
          <input name="calificacion" type="number" step="0.01" min="0" max="100" className={campo + ' h-8'} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Evidencia (lista de asistencia, constancia, enlace)</label>
          <input name="evidencia" className={campo + ' h-8'} />
        </div>
        <div className="md:col-span-4 flex items-center gap-3">
          <button disabled={pendiente} className="h-8 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white disabled:opacity-60">
            {pendiente ? 'Guardando…' : 'Guardar'}
          </button>
          {estado.error && <span className="text-[12px] text-red-600">{estado.error}</span>}
          {estado.ok && <span className="text-[12px] text-emerald-700">Guardado.</span>}
        </div>
      </form>
    </div>
  )
}
