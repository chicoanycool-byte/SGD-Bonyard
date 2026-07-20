'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { crearRecorrido, type EstadoRecorrido } from './actions'

const inicial: EstadoRecorrido = {}

export default function NuevoRecorridoForm() {
  const [estado, formAction, pending] = useActionState(crearRecorrido, inicial)
  const router = useRouter()

  useEffect(() => {
    if (estado.recorridoId) router.push(`/recorridos-bpa/${estado.recorridoId}`)
  }, [estado.recorridoId, router])

  return (
    <form action={formAction} className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Nuevo recorrido BPA
      </p>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
          <input
            name="fecha"
            type="date"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Nave</label>
          <select
            name="naves_inspeccionadas"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="Nave 1">Nave 1</option>
            <option value="Nave 2">Nave 2</option>
            <option value="Nave 3">Nave 3</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de inspección</label>
          <select
            name="tipo_inspeccion"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="rutinaria">Rutinaria</option>
            <option value="extraordinaria">Extraordinaria</option>
            <option value="auditoria_interna">Auditoría interna</option>
            <option value="pre_auditoria_sqf">Pre-auditoría SQF</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Turno</label>
          <select
            name="turno"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="">Selecciona</option>
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
            <option value="Nocturno">Nocturno</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Supervisor del área</label>
          <input
            name="supervisor_area"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Cargo del supervisor</label>
          <input
            name="cargo_supervisor"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Hora de inicio</label>
          <input
            name="hora_inicio"
            type="time"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
      </div>

      {estado.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Iniciar recorrido (204 puntos)'}
      </button>
    </form>
  )
}
