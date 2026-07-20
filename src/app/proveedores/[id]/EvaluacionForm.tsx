'use client'

import { useState, useTransition, useRef } from 'react'
import { registrarEvaluacion } from '../actions'
import type { CriterioConfig } from '@/lib/criteriosProveedores'

export default function EvaluacionForm({
  proveedorId,
  criterios,
}: {
  proveedorId: string
  criterios: CriterioConfig[]
}) {
  const [esNa, setEsNa] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await registrarEvaluacion(proveedorId, formData)
      formRef.current?.reset()
      setEsNa(false)
    })
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="rounded-xl border border-black/5 bg-white p-4"
    >
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Registrar evaluación
      </p>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Fecha de evaluación
          </label>
          <input
            name="fecha_evaluacion"
            type="date"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-[12px] text-by-gray-dark">
            <input
              type="checkbox"
              name="es_na"
              checked={esNa}
              onChange={(e) => setEsNa(e.target.checked)}
            />
            N/A — sin servicio en el periodo
          </label>
        </div>
      </div>

      {!esNa && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          {criterios.map((c, i) => (
            <div key={i}>
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                {c.nombre} <span className="text-by-gray-light">({Math.round(c.peso * 100)}%)</span>
              </label>
              <input
                name={`criterio_${i + 1}`}
                type="number"
                min={0}
                max={10}
                step={0.5}
                required={!esNa}
                className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1 block text-[11px] text-by-gray-dark">Observaciones</label>
        <textarea
          name="observaciones"
          rows={2}
          className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Registrar evaluación'}
      </button>
    </form>
  )
}
