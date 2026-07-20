'use client'

import { useActionState, useRef, useEffect } from 'react'
import { crearProveedor, type EstadoProveedor } from './actions'

const inicial: EstadoProveedor = {}

export default function NuevoProveedorForm() {
  const [estado, formAction, pending] = useActionState(crearProveedor, inicial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) formRef.current?.reset()
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Dar de alta proveedor
      </p>
      <form ref={formRef} action={formAction} className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Nombre</label>
          <input
            name="nombre"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Correo del proveedor</label>
          <input
            name="correo"
            type="email"
            placeholder="contacto@proveedor.com"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Categoría</label>
          <select
            name="categoria"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="transporte">Transporte</option>
            <option value="fumigacion">Fumigación</option>
            <option value="limpieza">Limpieza</option>
            <option value="empaque">Empaque</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="seguros">Seguros</option>
            <option value="seguridad">Seguridad</option>
            <option value="montacargas">Montacargas</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Producto / Servicio</label>
          <input
            name="producto_servicio"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Periodicidad</label>
          <select
            name="periodicidad"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
          </select>
        </div>

        {estado.error && (
          <p className="col-span-4 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="col-span-4 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Proveedor dado de alta.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-4 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Dar de alta'}
        </button>
      </form>
    </div>
  )
}
