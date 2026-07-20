'use client'

import { useTransition } from 'react'
import { marcarLeida, marcarTodasLeidas } from './actions'

const TIPO_LABEL: Record<string, string> = {
  solicitud_documento: 'Solicitud de documento',
  auditoria: 'Auditoría',
  plan_reaccion: 'Plan de reacción',
  evaluacion_auditor: 'Evaluación de auditor',
  queja: 'Queja',
  ac_ap: 'AC / AP',
  indicador: 'Indicador',
  proveedor: 'Proveedor',
  recorrido_bpa: 'Recorrido BPA',
  verificacion_sgi: 'Verificación SGI',
  sistema: 'Sistema',
}

type Notificacion = {
  id: string
  tipo: string
  mensaje: string
  leido: boolean
  creado_en: string
}

export default function NotificacionesLista({
  notificaciones,
}: {
  notificaciones: Notificacion[]
}) {
  const [pending, startTransition] = useTransition()
  const hayNoLeidas = notificaciones.some((n) => !n.leido)

  return (
    <div className="rounded-xl border border-black/5 bg-white">
      <div className="flex items-center justify-between border-b border-black/5 p-3">
        <p className="text-[13px] font-medium text-by-gray-dark">
          Notificaciones
        </p>
        {hayNoLeidas && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => marcarTodasLeidas())}
            className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className={
              'flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2.5 last:border-0 ' +
              (!n.leido ? 'bg-[#f4f6f6]' : '')
            }
          >
            <div className="flex items-center gap-2">
              {!n.leido && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-by-accent" />
              )}
              <span className="text-[13px] text-by-gray-dark">
                <span className="text-by-gray-light">
                  [{TIPO_LABEL[n.tipo] ?? n.tipo}]
                </span>{' '}
                {n.mensaje}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] text-by-gray-light">
                {new Date(n.creado_en).toLocaleString('es-MX')}
              </span>
              {!n.leido && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => marcarLeida(n.id))}
                  className="text-[11px] text-by-accent hover:underline disabled:opacity-50"
                >
                  Marcar leída
                </button>
              )}
            </div>
          </div>
        ))}
        {notificaciones.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-by-gray-light">
            No tienes notificaciones.
          </p>
        )}
      </div>
    </div>
  )
}
