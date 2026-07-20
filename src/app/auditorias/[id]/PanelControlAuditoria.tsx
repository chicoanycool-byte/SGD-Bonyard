'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { iniciarAuditoria, cerrarAuditoria } from './actions'

export default function PanelControlAuditoria({
  auditoriaId,
  estatus,
  puedeEditar,
}: {
  auditoriaId: string
  estatus: string
  puedeEditar: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (!puedeEditar) return null

  if (estatus === 'programada') {
    return (
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await iniciarAuditoria(auditoriaId)
            router.refresh()
          })
        }
        className="h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Iniciando…' : 'Iniciar auditoría'}
      </button>
    )
  }

  if (estatus === 'en_proceso') {
    return (
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm('¿Cerrar la auditoría? Se generará el informe y ya no se podrán editar los hallazgos.')) return
          startTransition(async () => {
            await cerrarAuditoria(auditoriaId)
            router.refresh()
          })
        }}
        className="h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Cerrando y generando informe…' : 'Cerrar auditoría y generar informe'}
      </button>
    )
  }

  return null
}
