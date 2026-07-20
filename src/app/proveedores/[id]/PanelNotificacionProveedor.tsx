'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editarCorreoProveedor, enviarNotificacionDesempeno } from '../actions'

export default function PanelNotificacionProveedor({
  proveedorId,
  correoActual,
}: {
  proveedorId: string
  correoActual: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [correo, setCorreo] = useState(correoActual ?? '')
  const router = useRouter()

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-2 text-[13px] font-medium text-by-gray-dark">
        Notificación de desempeño (PCO-02)
      </p>
      <p className="mb-3 text-[11.5px] text-by-gray-light">
        Envía anualmente al proveedor un resumen cuantitativo de su desempeño y comentarios sobre
        sus fortalezas o debilidades, según el PCO-02. También se recomienda notificar cuando el
        proveedor requiera un plan de mejora (Tipo B).
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Correo del proveedor</label>
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="contacto@proveedor.com"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
          />
        </div>
        <button
          disabled={pending || correo === correoActual}
          onClick={() =>
            startTransition(async () => {
              await editarCorreoProveedor(proveedorId, correo)
              router.refresh()
            })
          }
          className="h-8 rounded-md border border-black/10 px-3 text-[12.5px] font-medium text-by-gray-dark hover:bg-black/5 disabled:opacity-50"
        >
          Guardar correo
        </button>
        <button
          disabled={pending || !correoActual}
          onClick={() =>
            startTransition(async () => {
              try {
                await enviarNotificacionDesempeno(proveedorId)
                alert('Notificación enviada al correo del proveedor.')
              } catch (e) {
                alert(e instanceof Error ? e.message : 'No se pudo enviar la notificación.')
              }
            })
          }
          className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white hover:bg-by-primary-dark disabled:opacity-50"
        >
          Enviar resumen anual por correo
        </button>
      </div>
    </div>
  )
}
