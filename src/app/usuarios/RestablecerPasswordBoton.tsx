'use client'

import { useTransition } from 'react'
import { restablecerPassword } from './actions'

export default function RestablecerPasswordBoton({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Restablecer la contraseña de ${nombre}? Se generará una nueva contraseña temporal.`)) return
        startTransition(async () => {
          try {
            const nueva = await restablecerPassword(usuarioId)
            alert(`Nueva contraseña temporal para ${nombre}:\n\n${nueva}\n\nCompártesela de forma segura. Se le pedirá cambiarla al iniciar sesión.`)
          } catch (e) {
            alert(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña.')
          }
        })
      }}
      className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
    >
      {pending ? 'Restableciendo…' : 'Restablecer contraseña'}
    </button>
  )
}
