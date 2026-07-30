'use client'

import { useActionState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { crearVerificacion, type EstadoVerificacion } from './actions'

const inicial: EstadoVerificacion = {}

export default function NuevaVerificacionForm() {
  const [estado, formAction, pending] = useActionState(crearVerificacion, inicial)
  const router = useRouter()
  const searchParams = useSearchParams()

  const temaInicial = searchParams.get('tema') ?? ''
  const periodoInicial = searchParams.get('periodo') ?? ''
  const [mostrarTodos, setMostrarTodos] = useState(!temaInicial)

  useEffect(() => {
    if (estado.verificacionId) router.push(`/verificacion-sgi/${estado.verificacionId}`)
  }, [estado.verificacionId, router])

  return (
    <form action={formAction} className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Nueva verificación del SGI
      </p>

      {temaInicial && (
        <div className="mb-3 rounded-md bg-[#e6f0fa] px-3 py-2 text-[12px] text-[#2d5f8a]">
          Verificación programada: <strong>{temaInicial}</strong>. Se precargarán solo los puntos del checklist
          relacionados con este tema (si no se encuentran puntos específicos, se mostrará el checklist completo).
          <input type="hidden" name="tema_filtro" value={mostrarTodos ? '' : temaInicial} />
          <label className="mt-1.5 flex items-center gap-1.5">
            <input type="checkbox" checked={mostrarTodos} onChange={(e) => setMostrarTodos(e.target.checked)} className="h-3.5 w-3.5" />
            Mostrar los 121 puntos completos en vez de filtrar por tema
          </label>
        </div>
      )}

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
            defaultValue={periodoInicial}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Área / Proceso</label>
          <input
            name="area_proceso"
            placeholder="General"
            defaultValue={temaInicial}
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
        {pending ? 'Creando…' : temaInicial && !mostrarTodos ? 'Iniciar verificación (solo puntos del tema)' : 'Iniciar verificación (121 puntos)'}
      </button>
    </form>
  )
}
