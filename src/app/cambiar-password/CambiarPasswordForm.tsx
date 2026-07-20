'use client'

import { useActionState } from 'react'
import { cambiarPasswordPropia, type EstadoCambioPassword } from './actions'

const inicial: EstadoCambioPassword = {}

export default function CambiarPasswordForm() {
  const [estado, formAction, pending] = useActionState(cambiarPasswordPropia, inicial)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-[12px] text-by-gray-dark">Nueva contraseña</label>
        <input
          name="nueva"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-black/10 px-3 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-[12px] text-by-gray-dark">Confirmar nueva contraseña</label>
        <input
          name="confirmar"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-black/10 px-3 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
        />
      </div>

      {estado.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{estado.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-by-primary text-[14px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Guardar y continuar'}
      </button>
    </form>
  )
}
