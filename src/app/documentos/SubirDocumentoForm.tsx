'use client'

import { useActionState, useRef, useEffect } from 'react'
import { subirDocumento, type EstadoSubirDocumento } from './actions'

const inicial: EstadoSubirDocumento = {}

export default function SubirDocumentoForm() {
  const [estado, formAction, pending] = useActionState(subirDocumento, inicial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset()
    }
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Dar de alta / actualizar documento
      </p>
      <form
        ref={formRef}
        action={formAction}
        className="grid grid-cols-5 items-end gap-3"
      >
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Código
          </label>
          <input
            name="codigo"
            placeholder="FSG-58"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Nombre
          </label>
          <input
            name="nombre"
            placeholder="Informe de auditoría"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Proceso
          </label>
          <select
            name="proceso"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="">Selecciona</option>
            <option value="Dirección">Dirección</option>
            <option value="Comercial">Comercial</option>
            <option value="Tráfico y logística">Tráfico y logística</option>
            <option value="Almacenes">Almacenes</option>
            <option value="EHS">EHS</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Seguridad patrimonial">Seguridad patrimonial</option>
            <option value="Administración y finanzas">Administración y finanzas</option>
            <option value="Sistema de gestión integral">Sistema de gestión integral</option>
            <option value="Recursos humanos">Recursos humanos</option>
            <option value="TI">TI</option>
            <option value="Compras">Compras</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Versión
          </label>
          <input
            name="version"
            placeholder="v3"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Archivo
          </label>
          <input
            name="archivo"
            type="file"
            required
            className="block w-full text-[12px] text-by-gray-dark file:mr-2 file:h-8 file:rounded-md file:border-0 file:bg-by-primary file:px-3 file:text-[12px] file:text-white"
          />
        </div>

        {estado.error && (
          <p className="col-span-5 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="col-span-5 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Documento guardado correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-5 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Subiendo…' : 'Guardar documento'}
        </button>
      </form>
    </div>
  )
}
