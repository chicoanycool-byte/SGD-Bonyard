'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { crearAccionManual, type EstadoAccionManual } from './actions'

type Usuario = { id: string; nombre: string }

const inicial: EstadoAccionManual = {}

export default function NuevaAccionManualForm({ usuarios }: { usuarios: Usuario[] }) {
  const [estado, formAction, pending] = useActionState(crearAccionManual, inicial)
  const [mostrar, setMostrar] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (estado.accionId) router.push(`/ac-ap/${estado.accionId}`)
  }, [estado.accionId, router])

  const inputCls =
    'h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <button
        onClick={() => setMostrar(!mostrar)}
        className="text-[13px] font-medium text-by-accent hover:underline"
      >
        {mostrar ? 'Ocultar' : '+ Agregar / Generar AC o AP manual'}
      </button>

      {mostrar && (
        <form ref={formRef} action={formAction} className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de acción</label>
            <select name="tipo_accion" defaultValue="correctiva" className={inputCls}>
              <option value="correctiva">Correctiva</option>
              <option value="preventiva">Preventiva</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Cliente (opcional)</label>
            <input name="cliente" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Servicio (opcional)</label>
            <select name="servicio" defaultValue="" className={inputCls}>
              <option value="">— Ninguno —</option>
              <option value="Almacenaje">Almacenaje</option>
              <option value="Transporte">Transporte</option>
              <option value="Seguro de mercancía">Seguro de mercancía</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de NC</label>
            <select name="tipo_nc" defaultValue="" className={inputCls}>
              <option value="">— Ninguno —</option>
              <option value="mayor">Mayor</option>
              <option value="menor">Menor</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Responsable (opcional)</label>
            <select name="responsable_id" defaultValue="" className={inputCls}>
              <option value="">— Sin asignar —</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha compromiso</label>
            <input name="fecha_compromiso" type="date" className={inputCls} />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción</label>
            <textarea name="descripcion" required rows={3} className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]" />
          </div>

          {estado.error && (
            <p className="col-span-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{estado.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="col-span-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pending ? 'Creando…' : 'Crear AC / AP'}
          </button>
        </form>
      )}
    </div>
  )
}
