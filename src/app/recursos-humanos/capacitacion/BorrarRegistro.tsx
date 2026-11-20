'use client'

import { useTransition } from 'react'
import { eliminarRegistroCapacitacion } from './actions'

export default function BorrarRegistro({ id }: { id: string }) {
  const [pendiente, inicio] = useTransition()
  return (
    <button
      disabled={pendiente}
      onClick={() => {
        if (confirm('¿Borrar este registro de capacitación?')) inicio(() => eliminarRegistroCapacitacion(id))
      }}
      className="text-[11.5px] text-red-600 hover:underline disabled:opacity-50"
    >
      Borrar
    </button>
  )
}
