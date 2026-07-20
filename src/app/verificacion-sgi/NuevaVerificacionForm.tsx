'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { crearVerificacion, type EstadoVerificacion } from './actions'

const inicial: EstadoVerificacion = {}

export default function NuevaVerificacionForm() {
  const [estado, formAction, pending] = useActionState(crearVerificacion, inicial)
  const router = useRouter()

  useEffect(() => {
    if (estado.verificacionId) router.push(`/verificacion-sgi/${estado.verificacionId}`)
  }, [estado.verificacionId, router])

  return (
    <form action={formAction} className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Nueva verificación del SGI
      </p>
      <div className="grid grid-cols-3 gap-3">
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
          <label className="mb-1 block text-[11px] text-by-gray-dark">Período evaluado</label>
          <input
            name="periodo_evaluado"
            placeholder="Q3 2026"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Área / Proceso</label>
          <input
            name="area_proceso"
            placeholder="General"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
      </div>
      {estado.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{estado.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Iniciar verificación (121 puntos)'}
      </button>
    </form>
  )
}
