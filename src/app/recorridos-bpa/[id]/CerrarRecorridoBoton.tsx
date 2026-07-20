'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarRecorrido } from '../actions'

export default function CerrarRecorridoBoton({ recorridoId }: { recorridoId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('¿Cerrar este recorrido? Ya no se podrán editar las respuestas.')) return
        startTransition(async () => {
          await cerrarRecorrido(recorridoId)
          router.refresh()
        })
      }}
      className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
    >
      {pending ? 'Cerrando…' : 'Cerrar recorrido'}
    </button>
  )
}
