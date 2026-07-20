'use client'

import { useState, useTransition } from 'react'
import { resolverSolicitud, obtenerUrlAdjuntoSolicitud } from './actions'

type Solicitud = {
  id: string
  tipo: 'modificacion' | 'alta'
  codigo: string | null
  nombre: string
  justificacion: string
  descripcion_cambio: string | null
  estatus: 'pendiente' | 'aprobada' | 'rechazada'
  comentario_revision: string | null
  storage_path: string | null
  creado_en: string
  solicitante_nombre: string | null
}

const ESTATUS_ESTILO: Record<string, string> = {
  pendiente: 'bg-[#fdf3e3] text-[#9a6b1c]',
  aprobada: 'bg-[#eaf5f0] text-[#3d6b53]',
  rechazada: 'bg-[#fdecea] text-[#a13c33]',
}

export default function SolicitudesTabla({
  solicitudes,
  esCoordinador,
}: {
  solicitudes: Solicitud[]
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [procesando, setProcesando] = useState<string | null>(null)
  const [viendo, setViendo] = useState<string | null>(null)

  async function verArchivo(storagePath: string, id: string) {
    setViendo(id)
    try {
      const url = await obtenerUrlAdjuntoSolicitud(storagePath)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo abrir el archivo.')
    } finally {
      setViendo(null)
    }
  }

  function resolver(id: string, aprobar: boolean) {
    let comentario = ''
    if (!aprobar) {
      comentario = prompt('Motivo del rechazo (opcional):') ?? ''
    } else if (!confirm('¿Aprobar esta solicitud? Se aplicará al documento correspondiente.')) {
      return
    }
    setProcesando(id)
    startTransition(async () => {
      try {
        await resolverSolicitud(id, aprobar, comentario)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'No se pudo procesar la solicitud.')
      } finally {
        setProcesando(null)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
            <th className="px-4 py-2 font-normal">Tipo</th>
            <th className="px-4 py-2 font-normal">Documento</th>
            <th className="px-4 py-2 font-normal">Solicitante</th>
            <th className="px-4 py-2 font-normal">Justificación</th>
            <th className="px-4 py-2 font-normal">Estatus</th>
            {esCoordinador && <th className="px-4 py-2 font-normal">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id} className="border-b border-black/5 last:border-0 align-top">
              <td className="px-4 py-2 text-by-gray-dark">
                {s.tipo === 'modificacion' ? 'Modificación' : 'Alta nueva'}
              </td>
              <td className="px-4 py-2 text-by-gray-dark">
                {s.codigo ? `${s.codigo} — ` : ''}
                {s.nombre}
                {s.storage_path && (
                  <>
                    {' · '}
                    <button
                      onClick={() => verArchivo(s.storage_path!, s.id)}
                      disabled={viendo === s.id}
                      className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                    >
                      {viendo === s.id ? 'Abriendo…' : 'Ver archivo'}
                    </button>
                  </>
                )}
              </td>
              <td className="px-4 py-2 text-by-gray-light">
                {s.solicitante_nombre ?? '—'}
              </td>
              <td className="max-w-[240px] px-4 py-2 text-by-gray-light">
                {s.justificacion}
              </td>
              <td className="px-4 py-2">
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-[11px] ' +
                    (ESTATUS_ESTILO[s.estatus] ?? '')
                  }
                >
                  {s.estatus}
                </span>
                {s.comentario_revision && (
                  <p className="mt-1 text-[11px] text-by-gray-light">
                    {s.comentario_revision}
                  </p>
                )}
              </td>
              {esCoordinador && (
                <td className="px-4 py-2">
                  {s.estatus === 'pendiente' ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => resolver(s.id, true)}
                        disabled={pending && procesando === s.id}
                        className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => resolver(s.id, false)}
                        disabled={pending && procesando === s.id}
                        className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-by-gray-light">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
          {solicitudes.length === 0 && (
            <tr>
              <td
                colSpan={esCoordinador ? 6 : 5}
                className="px-4 py-6 text-center text-[12px] text-by-gray-light"
              >
                No hay solicitudes todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
