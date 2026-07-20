'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { crearSolicitud, type EstadoSolicitud } from './actions'

const inicial: EstadoSolicitud = {}

export default function SolicitudForm() {
  const [tipo, setTipo] = useState<'modificacion' | 'alta'>('modificacion')
  const [estado, formAction, pending] = useActionState(crearSolicitud, inicial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) formRef.current?.reset()
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Nueva solicitud
      </p>

      <div className="mb-3 flex gap-1 text-[12px]">
        <button
          type="button"
          onClick={() => setTipo('modificacion')}
          className={
            'rounded-md px-3 py-1 ' +
            (tipo === 'modificacion'
              ? 'bg-by-primary text-white'
              : 'bg-[#f4f6f6] text-by-gray-dark')
          }
        >
          Modificación de documento actual
        </button>
        <button
          type="button"
          onClick={() => setTipo('alta')}
          className={
            'rounded-md px-3 py-1 ' +
            (tipo === 'alta'
              ? 'bg-by-primary text-white'
              : 'bg-[#f4f6f6] text-by-gray-dark')
          }
        >
          Dar de alta nuevo documento
        </button>
      </div>

      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3">
        <input type="hidden" name="tipo" value={tipo} />

        {tipo === 'modificacion' ? (
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Código del documento
            </label>
            <input
              name="codigo"
              placeholder="FSG-58"
              required
              className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Nombre del documento nuevo
            </label>
            <input
              name="nombre"
              placeholder="Nombre del documento"
              required
              className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Archivo
          </label>
          <input
            name="archivo"
            type="file"
            required={tipo === 'alta'}
            className="block w-full text-[12px] text-by-gray-dark file:mr-2 file:h-8 file:rounded-md file:border-0 file:bg-by-primary file:px-3 file:text-[12px] file:text-white"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Justificación
          </label>
          <textarea
            name="justificacion"
            required
            rows={2}
            className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>

        {tipo === 'modificacion' && (
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Descripción del cambio (opcional)
            </label>
            <textarea
              name="descripcion_cambio"
              rows={2}
              className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />
          </div>
        )}

        {estado.error && (
          <p className="col-span-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="col-span-2 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Solicitud enviada. Se notificó al Coordinador SGI.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-2 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}
