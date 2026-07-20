'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { solicitarRecuperacion } from './actions'

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacion, {
    enviado: false,
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="bg-by-primary px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[10px] bg-by-accent text-[18px] font-medium text-by-primary">
            BY
          </div>
          <p className="text-[16px] font-medium text-white">Recuperar acceso</p>
          <p className="mt-1 text-[12px] text-by-accent">
            BONYARD Servicios · SGD
          </p>
        </div>

        {state.enviado ? (
          <div className="px-6 py-6 text-center">
            <p className="text-[14px] text-by-gray-dark">
              Si el usuario existe, se notificó al Coordinador del SGI para
              restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-[13px] text-by-accent hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form action={formAction} className="px-6 py-6">
            <label
              htmlFor="usuario"
              className="mb-1 block text-[12px] text-by-gray-dark"
            >
              Usuario
            </label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              placeholder="nombre.apellido"
              required
              className="mb-4 h-9 w-full rounded-md border border-black/10 px-3 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />

            {state.error && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="h-9 w-full rounded-md bg-by-primary text-[14px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
            >
              {pending ? 'Enviando…' : 'Notificar al Coordinador SGI'}
            </button>

            <Link
              href="/login"
              className="mt-4 block text-center text-[12px] text-by-accent hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
